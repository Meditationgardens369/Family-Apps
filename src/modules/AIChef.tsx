import { useState, useRef, useEffect } from 'react';
import { useStore, Recipe } from '../store/useStore';
import { GoogleGenAI, FunctionDeclaration, Type } from '@google/genai';
import { Send, Bot, User, Loader2, Image as ImageIcon, Mic, MicOff, Plus, Check } from 'lucide-react';
import Markdown from 'react-markdown';

interface Message {
  role: 'user' | 'model';
  content: string;
  imageUrl?: string;
  suggestedRecipe?: Omit<Recipe, 'id'>;
}

const suggestRecipeFunctionDeclaration: FunctionDeclaration = {
  name: "suggestRecipe",
  description: "Suggest a detailed recipe to the user so they can add it to their recipe manager.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING, description: "The title of the recipe." },
      ingredients: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            amount: { type: Type.STRING }
          },
          required: ["name", "amount"]
        }
      },
      instructions: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: "Step-by-step instructions."
      },
      prepTime: { type: Type.STRING, description: "Preparation time, e.g., '15 mins'" },
      cookTime: { type: Type.STRING, description: "Cooking time, e.g., '30 mins'" },
      imagePrompt: { type: Type.STRING, description: "A highly detailed visual description of the dish for image generation. Include colors, plating, and setting." }
    },
    required: ["title", "ingredients", "instructions", "prepTime", "cookTime", "imagePrompt"]
  }
};

const generateImageFunctionDeclaration: FunctionDeclaration = {
  name: "generateImage",
  description: "Generate an image of a food dish or recipe. Call this when the user asks to see a picture or generate an image.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      prompt: { type: Type.STRING, description: "A highly detailed visual description of the dish to generate. Include colors, plating, and setting." }
    },
    required: ["prompt"]
  }
};

function SuggestedRecipeCard({ recipe, imageUrl, onAdd }: { recipe: Omit<Recipe, 'id'>, imageUrl?: string, onAdd: (recipe: Recipe) => void }) {
  const [added, setAdded] = useState(false);

  return (
    <div className="mt-4 p-4 bg-white rounded-xl border border-stone-200 shadow-sm">
      <h4 className="font-bold text-lg text-stone-800 mb-2">{recipe.title}</h4>
      <div className="flex gap-4 text-sm text-stone-500 mb-4">
        <span>Prep: {recipe.prepTime}</span>
        <span>Cook: {recipe.cookTime}</span>
        <span>Ingredients: {recipe.ingredients?.length || 0}</span>
      </div>
      <button
        onClick={() => {
          if (!added) {
            onAdd({ ...recipe, id: crypto.randomUUID(), image: imageUrl });
            setAdded(true);
          }
        }}
        disabled={added}
        className={`w-full py-2 px-4 rounded-lg flex items-center justify-center gap-2 font-medium transition-colors ${
          added 
            ? 'bg-emerald-100 text-emerald-700 cursor-default' 
            : 'bg-stone-800 text-white hover:bg-stone-700'
        }`}
      >
        {added ? (
          <>
            <Check size={16} />
            Added to Recipe Manager
          </>
        ) : (
          <>
            <Plus size={16} />
            Add to Recipe Manager
          </>
        )}
      </button>
    </div>
  );
}

export function AIChef() {
  const { pantry, addRecipe } = useStore();
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', content: "Hi! I'm your AI Chef. I can help you plan meals, suggest recipes based on your pantry, or generate images of dishes. What would you like to do?" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(prev => prev ? `${prev} ${transcript}` : transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = () => {
        setIsListening(false);
      };
      
      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  const toggleListen = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current?.start();
        setIsListening(true);
      } catch (e) {
        console.error(e);
        setIsListening(false);
      }
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const pantryContext = `Current pantry items: ${pantry.map(p => `${p.name} (${p.status})`).join(', ')}.`;
      
      const contents = messages.slice(1).map(msg => ({
        role: msg.role,
        parts: [{ text: msg.content }]
      }));
      contents.push({ role: 'user', parts: [{ text: userMessage }] });

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: contents,
        config: {
          systemInstruction: `You are a helpful AI Chef for a family household. You help with meal planning, recipe suggestions, and cooking tips. Be concise and friendly. ${pantryContext}. If you suggest a specific recipe, ALWAYS use the suggestRecipe tool so the user can save it. If the user asks for an image or picture, ALWAYS use the generateImage tool.`,
          tools: [{ functionDeclarations: [suggestRecipeFunctionDeclaration, generateImageFunctionDeclaration] }],
        },
      });

      const functionCalls = response.functionCalls;
      let suggestedRecipe: Omit<Recipe, 'id'> | undefined = undefined;
      let responseText = response.text || '';
      let imageUrl = '';

      if (functionCalls && functionCalls.length > 0) {
        const recipeCall = functionCalls.find(c => c.name === 'suggestRecipe');
        if (recipeCall && recipeCall.args) {
          suggestedRecipe = recipeCall.args as any;
          if (!responseText) {
            responseText = `I've prepared a recipe for **${suggestedRecipe?.title}**! You can add it directly to your Recipe Manager.`;
          }
          
          // Automatically generate image for the recipe
          const recipeImagePrompt = (recipeCall.args.imagePrompt as string) || `A delicious, professional food photography shot of ${suggestedRecipe?.title}, well-plated, high resolution.`;
          try {
            const imgResponse = await ai.models.generateContent({
              model: 'gemini-2.5-flash-image',
              contents: { parts: [{ text: recipeImagePrompt }] },
              config: { imageConfig: { aspectRatio: "1:1" } }
            });
            
            for (const part of imgResponse.candidates?.[0]?.content?.parts || []) {
              if (part.inlineData) {
                imageUrl = `data:image/png;base64,${part.inlineData.data}`;
                break;
              }
            }
          } catch (e) {
            console.error("Recipe image generation failed", e);
          }
        }
        
        const imageCall = functionCalls.find(c => c.name === 'generateImage');
        if (imageCall && imageCall.args && imageCall.args.prompt && !imageUrl) {
          const imagePrompt = imageCall.args.prompt as string;
          try {
            const imgResponse = await ai.models.generateContent({
              model: 'gemini-2.5-flash-image',
              contents: { parts: [{ text: imagePrompt }] },
              config: { imageConfig: { aspectRatio: "1:1" } }
            });
            
            for (const part of imgResponse.candidates?.[0]?.content?.parts || []) {
              if (part.inlineData) {
                imageUrl = `data:image/png;base64,${part.inlineData.data}`;
                break;
              }
            }
            if (!responseText) {
              responseText = "Here is the image you requested:";
            }
          } catch (e) {
            console.error("Image generation failed", e);
            if (!responseText) {
              responseText = "I'm sorry, I encountered an error while generating the image.";
            }
          }
        }
      }

      setMessages(prev => [...prev, { 
        role: 'model', 
        content: responseText || "I'm not sure how to respond to that.",
        suggestedRecipe,
        imageUrl
      }]);
    } catch (error) {
      console.error("AI Error:", error);
      setMessages(prev => [...prev, { role: 'model', content: "Sorry, I encountered an error processing your request." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-8 h-full flex flex-col max-w-4xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-stone-800">AI Chef</h2>
        <p className="text-stone-500 mt-1">Your personal culinary assistant</p>
      </div>

      <div className="flex-1 bg-white rounded-2xl shadow-sm border border-stone-100 flex flex-col overflow-hidden mb-20 md:mb-0">
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                msg.role === 'user' ? 'bg-emerald-100 text-emerald-700' : 'bg-stone-100 text-stone-600'
              }`}>
                {msg.role === 'user' ? <User size={20} /> : <Bot size={20} />}
              </div>
              <div className={`max-w-[80%] rounded-2xl p-4 ${
                msg.role === 'user' 
                  ? 'bg-emerald-600 text-white rounded-tr-none' 
                  : 'bg-stone-50 border border-stone-100 text-stone-800 rounded-tl-none'
              }`}>
                <div className="prose prose-sm max-w-none prose-p:leading-relaxed prose-pre:bg-stone-800 prose-pre:text-stone-100">
                  <Markdown>{msg.content}</Markdown>
                </div>
                {msg.imageUrl && (
                  <div className="mt-4 rounded-xl overflow-hidden border border-stone-200">
                    <img src={msg.imageUrl} alt="Generated recipe" className="w-full h-auto" />
                  </div>
                )}
                {msg.suggestedRecipe && (
                  <SuggestedRecipeCard recipe={msg.suggestedRecipe} imageUrl={msg.imageUrl} onAdd={addRecipe} />
                )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-stone-100 text-stone-600 flex items-center justify-center flex-shrink-0">
                <Bot size={20} />
              </div>
              <div className="bg-stone-50 border border-stone-100 rounded-2xl rounded-tl-none p-4 flex items-center gap-2 text-stone-500">
                <Loader2 size={16} className="animate-spin" />
                <span>Chef is thinking...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 bg-white border-t border-stone-100">
          <div className="flex gap-2">
            <button
              onClick={toggleListen}
              className={`px-4 py-3 rounded-xl transition-colors flex items-center justify-center ${
                isListening ? 'bg-red-100 text-red-600' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
              title="Voice Dictation"
            >
              {isListening ? <MicOff size={20} /> : <Mic size={20} />}
            </button>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask for a recipe, meal plan, or image..."
              className="flex-1 px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
              disabled={isLoading}
            />
            <button
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className="px-4 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              <Send size={20} />
            </button>
          </div>
          <div className="mt-2 text-xs text-stone-400 flex items-center gap-1">
            <ImageIcon size={12} />
            <span>Tip: Ask "Generate an image of..." to see a dish.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
