import { useState, useRef, useEffect } from 'react';
import { useStore, Category } from '../store/useStore';
import { Mic, Square, Loader2, X, Bot, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI, Type, ThinkingLevel } from '@google/genai';

export function VoiceAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState<'idle' | 'listening' | 'processing' | 'success' | 'error'>('idle');
  const [transcript, setTranscript] = useState('');
  const [feedback, setFeedback] = useState('');

  const { toggleShoppingItem, addRecipe, updatePantryItemStatus, updatePlannerDay } = useStore();
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Add a timeout for processing state
  useEffect(() => {
    let timer: number;
    if (status === 'processing') {
      timer = window.setTimeout(() => {
        setStatus('error');
        setFeedback('Processing timed out. Please try again.');
      }, 25000); // 25 second timeout
    }
    return () => clearTimeout(timer);
  }, [status]);

  const startListening = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Check for supported mime types
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') 
        ? 'audio/webm' 
        : MediaRecorder.isTypeSupported('audio/mp4') 
          ? 'audio/mp4' 
          : 'audio/ogg';

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        if (audioBlob.size > 0) {
          await handleVoiceCommand(audioBlob, mimeType);
        } else {
          console.error("Audio blob is empty");
          setStatus('error');
          setFeedback('No audio captured. Please try again.');
        }
      };

      // Start recording with a timeslice to ensure data is captured
      mediaRecorder.start(1000);
      setIsRecording(true);
      setStatus('listening');
      setFeedback('Listening...');
    } catch (err) {
      console.error("Mic error:", err);
      setStatus('error');
      setFeedback('Microphone access denied.');
    }
  };

  const stopListening = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
    }
  };

  const handleVoiceCommand = async (blob: Blob, mimeType: string) => {
    setStatus('processing');
    setFeedback('Processing command...');
    console.log(`Starting voice command processing. Blob size: ${blob.size}, MimeType: ${mimeType}`);
    
    try {
      if (!process.env.GEMINI_API_KEY) {
        throw new Error("Gemini API key is missing. Please check your environment variables.");
      }

      const base64Audio = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = (reader.result as string).split(',')[1];
          if (!base64) {
            reject(new Error("Failed to convert audio to base64"));
            return;
          }
          resolve(base64);
        };
        reader.onerror = () => reject(new Error("FileReader error"));
        reader.readAsDataURL(blob);
      });
      
      console.log("Audio converted to base64, calling Gemini...");
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const now = new Date();
      const dateContext = `Today is ${now.toLocaleDateString('en-CA')} (${now.toLocaleDateString('en-US', { weekday: 'long' })}).`;
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Audio
            }
          },
          {
            text: `${dateContext} Listen to this command and execute the appropriate function. 
            If the user wants to add something to the shopping list, update pantry status, add a recipe, or update the planner, call the corresponding tool. 
            For the shopping list, use one of these categories: Cleaning Products, Oils & Fats, Dried Herbs & Spices, Meats & Fish, Condiments & Spreads, Vegetables, Fruits, Tinned Food, Pastas & Grains, Drinks & Beverages, Baking, Cosmetics & Toiletries, Pharmaceuticals, Miscellaneous, Plant-based Dairy, Sweeteners, Dried Fruit, Nuts & Seeds, Fresh Herbs.
            If you perform an action, provide a brief text confirmation of what you did. If you are unsure, ask for clarification.`
          }
        ],
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          tools: [
            {
              functionDeclarations: [
                {
                  name: "addToShoppingList",
                  description: "Add an item to the shopping list",
                  parameters: {
                    type: Type.OBJECT,
                    properties: {
                      name: { type: Type.STRING },
                      category: { type: Type.STRING, description: "One of the predefined categories" }
                    },
                    required: ["name", "category"]
                  }
                },
                {
                  name: "updatePantryStatus",
                  description: "Update the status of a pantry item",
                  parameters: {
                    type: Type.OBJECT,
                    properties: {
                      name: { type: Type.STRING },
                      status: { type: Type.STRING, enum: ["OK", "Low", "Out"] }
                    },
                    required: ["name", "status"]
                  }
                },
                {
                  name: "updatePlanner",
                  description: "Update a meal in the family planner",
                  parameters: {
                    type: Type.OBJECT,
                    properties: {
                      date: { type: Type.STRING, description: "YYYY-MM-DD" },
                      mealType: { type: Type.STRING, enum: ["breakfast", "lunch", "dinner"] },
                      mealName: { type: Type.STRING }
                    },
                    required: ["date", "mealType", "mealName"]
                  }
                },
                {
                  name: "addRecipe",
                  description: "Add a new recipe to the manager",
                  parameters: {
                    type: Type.OBJECT,
                    properties: {
                      title: { type: Type.STRING },
                      prepTime: { type: Type.STRING },
                      cookTime: { type: Type.STRING },
                      ingredients: {
                        type: Type.ARRAY,
                        items: {
                          type: Type.OBJECT,
                          properties: {
                            name: { type: Type.STRING },
                            amount: { type: Type.STRING }
                          }
                        }
                      },
                      instructions: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING }
                      }
                    },
                    required: ["title", "ingredients", "instructions"]
                  }
                }
              ]
            }
          ]
        }
      });

      console.log("Gemini response received:", response);
      const calls = response.functionCalls;
      if (calls && calls.length > 0) {
        console.log(`Executing ${calls.length} function calls...`);
        for (const call of calls) {
          if (call.name === 'addToShoppingList') {
            const { name, category } = call.args as any;
            toggleShoppingItem(name, category as Category);
          } else if (call.name === 'updatePantryStatus') {
            const { name, status } = call.args as any;
            const pantryItem = useStore.getState().pantry.find(i => i.name.toLowerCase() === name.toLowerCase());
            if (pantryItem) {
              updatePantryItemStatus(pantryItem.id, status as any);
            }
          } else if (call.name === 'updatePlanner') {
            const { date, mealType, mealName } = call.args as any;
            updatePlannerDay(date, { [mealType]: mealName });
          } else if (call.name === 'addRecipe') {
            const recipe = call.args as any;
            const id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);
            addRecipe({ ...recipe, id });
          }
        }
        setStatus('success');
        setFeedback(response.text || 'Action completed!');
      } else {
        console.log("No function calls in response.");
        setTranscript(response.text || "I heard you, but I'm not sure what to do.");
        setStatus('idle');
      }
    } catch (err) {
      console.error("Voice command error:", err);
      setStatus('error');
      setFeedback(err instanceof Error ? err.message : 'Sorry, I couldn\'t process that.');
    }
  };

  useEffect(() => {
    if (status === 'success' || status === 'error') {
      const timer = setTimeout(() => {
        if (!isRecording) {
          setStatus('idle');
          setFeedback('');
        }
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [status, isRecording]);

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="absolute bottom-20 right-0 w-80 bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                    <Bot size={18} className="text-emerald-600" />
                  </div>
                  <span className="font-bold text-stone-900">Voice Assistant</span>
                </div>
                <button onClick={() => setIsOpen(false)} className="text-stone-400 hover:text-stone-600">
                  <X size={20} />
                </button>
              </div>

              <div className="bg-stone-50 rounded-2xl p-4 min-h-[100px] flex flex-col items-center justify-center text-center mb-6">
                {status === 'idle' && (
                  <p className="text-stone-500 text-sm">"Add milk to shopping list" or "Plan pizza for dinner tomorrow"</p>
                )}
                {status === 'listening' && (
                  <div className="flex flex-col items-center">
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ repeat: Infinity, duration: 1 }}
                      className="w-3 h-3 bg-red-500 rounded-full mb-2"
                    />
                    <p className="text-red-600 font-medium animate-pulse">Listening...</p>
                  </div>
                )}
                {status === 'processing' && (
                  <div className="flex flex-col items-center">
                    <Loader2 size={24} className="text-emerald-600 animate-spin mb-2" />
                    <p className="text-stone-600">Processing...</p>
                  </div>
                )}
                {status === 'success' && (
                  <div className="flex flex-col items-center">
                    <CheckCircle2 size={24} className="text-emerald-600 mb-2" />
                    <p className="text-stone-800 text-sm">{feedback}</p>
                  </div>
                )}
                {status === 'error' && (
                  <div className="flex flex-col items-center">
                    <AlertCircle size={24} className="text-red-600 mb-2" />
                    <p className="text-red-600 text-sm">{feedback}</p>
                  </div>
                )}
                {transcript && status === 'idle' && (
                  <p className="text-stone-800 text-sm italic">"{transcript}"</p>
                )}
              </div>

              <button
                onClick={isRecording ? stopListening : startListening}
                className={`w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all
                  ${isRecording 
                    ? 'bg-red-600 text-white hover:bg-red-700' 
                    : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-100'
                  }`}
              >
                {isRecording ? (
                  <>
                    <Square size={20} fill="currentColor" />
                    Stop Listening
                  </>
                ) : (
                  <>
                    <Mic size={20} />
                    Start Speaking
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-full flex items-center justify-center shadow-xl transition-colors
          ${isOpen ? 'bg-stone-900 text-white' : 'bg-emerald-600 text-white'}
        `}
      >
        {isOpen ? <X size={24} /> : <Mic size={24} />}
      </motion.button>
    </div>
  );
}
