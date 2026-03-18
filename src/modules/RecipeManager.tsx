import { useState, useRef } from 'react';
import { useStore, Recipe } from '../store/useStore';
import { Plus, Search, Trash2, Clock, ChefHat, ExternalLink, X, Image as ImageIcon, Loader2, Mic, Square, AlertCircle } from 'lucide-react';
import { GoogleGenAI, Type, ThinkingLevel } from '@google/genai';
import { useEffect } from 'react';

export function RecipeManager() {
  const { recipes, deleteRecipe, addRecipe, updateRecipe } = useStore();
  const [search, setSearch] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Add a timeout for processing state
  useEffect(() => {
    let timer: number;
    if (isProcessingVoice) {
      timer = window.setTimeout(() => {
        setIsProcessingVoice(false);
        setVoiceError('Voice processing timed out.');
      }, 30000);
    }
    return () => clearTimeout(timer);
  }, [isProcessingVoice]);

  const startVoiceRecipe = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
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
          await processVoiceRecipe(audioBlob, mimeType);
        } else {
          console.error("Audio blob is empty");
          setIsProcessingVoice(false);
          alert("No audio captured. Please try again.");
        }
      };

      mediaRecorder.start(1000);
      setIsRecording(true);
    } catch (err) {
      console.error("Mic error:", err);
      alert("Could not access microphone.");
    }
  };

  const stopVoiceRecipe = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
    }
  };

  const processVoiceRecipe = async (blob: Blob, mimeType: string) => {
    setIsProcessingVoice(true);
    setVoiceError(null);
    console.log(`Processing voice recipe. Blob size: ${blob.size}, MimeType: ${mimeType}`);
    try {
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
      
      console.log("Audio converted, calling Gemini for recipe extraction...");
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [
          { inlineData: { mimeType: mimeType, data: base64Audio } },
          { text: "Extract a recipe from this audio. Return it as a JSON object matching the Recipe interface." }
        ],
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          responseMimeType: 'application/json',
          responseSchema: {
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
            required: ['title', 'ingredients', 'instructions']
          }
        }
      });

      console.log("Gemini response received.");
      const recipeData = JSON.parse(response.text);
      const id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);
      addRecipe({ ...recipeData, id });
      alert(`Recipe "${recipeData.title}" added successfully!`);
    } catch (err) {
      console.error("Voice processing error:", err);
      setVoiceError(err instanceof Error ? err.message : "Failed to process voice recipe.");
    } finally {
      setIsProcessingVoice(false);
    }
  };
  const [newRecipe, setNewRecipe] = useState<Partial<Recipe>>({
    title: '',
    prepTime: '',
    cookTime: '',
    ingredients: [{ name: '', amount: '' }],
    instructions: ['']
  });

  const filteredRecipes = recipes.filter(r => r.title.toLowerCase().includes(search.toLowerCase()));

  const handleAddIngredient = () => {
    setNewRecipe({
      ...newRecipe,
      ingredients: [...(newRecipe.ingredients || []), { name: '', amount: '' }]
    });
  };

  const handleIngredientChange = (index: number, field: 'name' | 'amount', value: string) => {
    const newIngredients = [...(newRecipe.ingredients || [])];
    newIngredients[index] = { ...newIngredients[index], [field]: value };
    setNewRecipe({ ...newRecipe, ingredients: newIngredients });
  };

  const handleAddInstruction = () => {
    setNewRecipe({
      ...newRecipe,
      instructions: [...(newRecipe.instructions || []), '']
    });
  };

  const handleInstructionChange = (index: number, value: string) => {
    const newInstructions = [...(newRecipe.instructions || [])];
    newInstructions[index] = value;
    setNewRecipe({ ...newRecipe, instructions: newInstructions });
  };

  const handleSave = () => {
    if (newRecipe.title) {
      addRecipe({
        id: crypto.randomUUID(),
        title: newRecipe.title,
        prepTime: newRecipe.prepTime || '0 mins',
        cookTime: newRecipe.cookTime || '0 mins',
        ingredients: newRecipe.ingredients?.filter(i => i.name) || [],
        instructions: newRecipe.instructions?.filter(i => i) || [],
        image: newRecipe.image || ''
      });
      setIsAdding(false);
      setNewRecipe({ title: '', prepTime: '', cookTime: '', ingredients: [{ name: '', amount: '' }], instructions: [''] });
    }
  };

  const handleGenerateImage = async (recipe: Recipe) => {
    if (isGeneratingImage) return;
    setIsGeneratingImage(recipe.id);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const prompt = `A delicious, professional food photography shot of ${recipe.title}, well-plated, high resolution.`;
      const imgResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [{ text: prompt }] },
        config: { imageConfig: { aspectRatio: "1:1" } }
      });
      
      let newImageUrl = '';
      for (const part of imgResponse.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          newImageUrl = `data:image/png;base64,${part.inlineData.data}`;
          break;
        }
      }
      
      if (newImageUrl) {
        updateRecipe(recipe.id, { image: newImageUrl });
        if (selectedRecipe?.id === recipe.id) {
          setSelectedRecipe({ ...recipe, image: newImageUrl });
        }
      }
    } catch (error) {
      console.error("Failed to generate image:", error);
    } finally {
      setIsGeneratingImage(null);
    }
  };

  return (
    <div className="p-4 md:p-8 h-full flex flex-col">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-bold text-stone-800">Recipe Manager</h2>
          <p className="text-stone-500 mt-1">{recipes.length} recipes saved</p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={20} />
            <input 
              type="text" 
              placeholder="Search recipes..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>
          <button 
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors whitespace-nowrap"
          >
            <Plus size={20} />
            Add Recipe
          </button>
          <button 
            onClick={isRecording ? stopVoiceRecipe : startVoiceRecipe}
            disabled={isProcessingVoice}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap
              ${isRecording 
                ? 'bg-red-600 text-white animate-pulse' 
                : 'bg-stone-900 text-white hover:bg-stone-800'
              } disabled:opacity-50`}
          >
            {isProcessingVoice ? (
              <Loader2 size={20} className="animate-spin" />
            ) : isRecording ? (
              <Square size={20} fill="currentColor" />
            ) : (
              <Mic size={20} />
            )}
            {isProcessingVoice ? 'Processing...' : isRecording ? 'Stop Recording' : 'Voice Record'}
          </button>
        </div>
      </div>

      {voiceError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-600 animate-in fade-in slide-in-from-top-2">
          <AlertCircle size={20} />
          <p className="text-sm font-medium">{voiceError}</p>
          <button onClick={() => setVoiceError(null)} className="ml-auto p-1 hover:bg-red-100 rounded-full transition-colors">
            <X size={16} />
          </button>
        </div>
      )}

      {isAdding ? (
        <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-6 max-w-3xl mx-auto w-full mb-8">
          <h3 className="text-2xl font-bold text-stone-800 mb-6">New Recipe</h3>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Recipe Title</label>
              <input 
                type="text" 
                value={newRecipe.title}
                onChange={(e) => setNewRecipe({ ...newRecipe, title: e.target.value })}
                className="w-full px-4 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="e.g., Spaghetti Bolognese"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Prep Time</label>
                <input 
                  type="text" 
                  value={newRecipe.prepTime}
                  onChange={(e) => setNewRecipe({ ...newRecipe, prepTime: e.target.value })}
                  className="w-full px-4 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="e.g., 15 mins"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Cook Time</label>
                <input 
                  type="text" 
                  value={newRecipe.cookTime}
                  onChange={(e) => setNewRecipe({ ...newRecipe, cookTime: e.target.value })}
                  className="w-full px-4 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="e.g., 45 mins"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">Ingredients</label>
              <div className="space-y-2">
                {newRecipe.ingredients?.map((ing, idx) => (
                  <div key={idx} className="flex gap-2">
                    <input 
                      type="text" 
                      value={ing.amount}
                      onChange={(e) => handleIngredientChange(idx, 'amount', e.target.value)}
                      className="w-1/3 px-4 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder="Amount (e.g., 2 cups)"
                    />
                    <input 
                      type="text" 
                      value={ing.name}
                      onChange={(e) => handleIngredientChange(idx, 'name', e.target.value)}
                      className="flex-1 px-4 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder="Ingredient name"
                    />
                  </div>
                ))}
                <button 
                  onClick={handleAddIngredient}
                  className="text-sm text-emerald-600 font-medium hover:text-emerald-700 mt-2"
                >
                  + Add Ingredient
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">Instructions</label>
              <div className="space-y-2">
                {newRecipe.instructions?.map((inst, idx) => (
                  <div key={idx} className="flex gap-2 items-start">
                    <span className="w-6 h-6 rounded-full bg-stone-100 flex items-center justify-center text-sm font-bold text-stone-500 flex-shrink-0 mt-1">
                      {idx + 1}
                    </span>
                    <textarea 
                      value={inst}
                      onChange={(e) => handleInstructionChange(idx, e.target.value)}
                      className="flex-1 px-4 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none h-20"
                      placeholder={`Step ${idx + 1}`}
                    />
                  </div>
                ))}
                <button 
                  onClick={handleAddInstruction}
                  className="text-sm text-emerald-600 font-medium hover:text-emerald-700 mt-2"
                >
                  + Add Step
                </button>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-stone-100">
              <button 
                onClick={() => setIsAdding(false)}
                className="px-6 py-2 bg-stone-100 text-stone-700 rounded-lg font-medium hover:bg-stone-200 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleSave}
                className="px-6 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors"
              >
                Save Recipe
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto pb-20">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredRecipes.map(recipe => (
              <div key={recipe.id} className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden flex flex-col">
                <div className="h-48 relative">
                  <img 
                    src={recipe.image || 'https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=800&q=80'} 
                    alt={recipe.title} 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4">
                    <h3 className="text-white font-bold text-xl leading-tight">{recipe.title}</h3>
                  </div>
                  <div className="absolute top-4 right-4 flex gap-2">
                    {(!recipe.image || recipe.image.includes('unsplash')) && (
                      <button 
                        onClick={() => handleGenerateImage(recipe)}
                        disabled={isGeneratingImage === recipe.id}
                        className="p-2 bg-white/20 backdrop-blur-md text-white rounded-full hover:bg-emerald-500 transition-colors disabled:opacity-50"
                        title="Generate Image"
                      >
                        {isGeneratingImage === recipe.id ? <Loader2 size={18} className="animate-spin" /> : <ImageIcon size={18} />}
                      </button>
                    )}
                    <button 
                      onClick={() => deleteRecipe(recipe.id)}
                      className="p-2 bg-white/20 backdrop-blur-md text-white rounded-full hover:bg-red-500 transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
                
                <div className="p-4 flex-1 flex flex-col">
                  <div className="flex items-center gap-4 text-sm text-stone-500 mb-4">
                    <div className="flex items-center gap-1">
                      <Clock size={16} />
                      <span>Prep: {recipe.prepTime}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <ChefHat size={16} />
                      <span>Cook: {recipe.cookTime}</span>
                    </div>
                  </div>

                  <div className="space-y-4 flex-1">
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-2">Ingredients</h4>
                      <ul className="text-sm text-stone-700 space-y-1">
                        {recipe.ingredients.slice(0, 3).map((ing, i) => (
                          <li key={i} className="flex justify-between">
                            <span>{ing.name}</span>
                            <span className="text-stone-400">{ing.amount}</span>
                          </li>
                        ))}
                        {recipe.ingredients.length > 3 && (
                          <li className="text-stone-400 italic">+{recipe.ingredients.length - 3} more...</li>
                        )}
                      </ul>
                    </div>
                  </div>

                  <button 
                    onClick={() => setSelectedRecipe(recipe)}
                    className="mt-6 w-full py-2 bg-stone-50 text-emerald-700 font-medium rounded-lg border border-emerald-100 hover:bg-emerald-50 transition-colors flex items-center justify-center gap-2"
                  >
                    View Full Recipe
                    <ExternalLink size={16} />
                  </button>
                </div>
              </div>
            ))}
            
            {filteredRecipes.length === 0 && (
              <div className="col-span-full py-20 flex flex-col items-center justify-center text-stone-400">
                <ChefHat size={48} className="mb-4 opacity-20" />
                <p className="text-lg font-medium">No recipes found</p>
                <p className="text-sm">Click "Add Recipe" to get started.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {selectedRecipe && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="relative h-64 flex-shrink-0">
              <img 
                src={selectedRecipe.image || 'https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=800&q=80'} 
                alt={selectedRecipe.title} 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute top-4 right-4 flex gap-2">
                {(!selectedRecipe.image || selectedRecipe.image.includes('unsplash')) && (
                  <button 
                    onClick={() => handleGenerateImage(selectedRecipe)}
                    disabled={isGeneratingImage === selectedRecipe.id}
                    className="p-2 bg-black/50 text-white rounded-full hover:bg-emerald-600 transition-colors disabled:opacity-50"
                    title="Generate Image"
                  >
                    {isGeneratingImage === selectedRecipe.id ? <Loader2 size={20} className="animate-spin" /> : <ImageIcon size={20} />}
                  </button>
                )}
                <button 
                  onClick={() => setSelectedRecipe(null)}
                  className="p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            <div className="p-6 overflow-y-auto">
              <h2 className="text-3xl font-bold text-stone-800 mb-4">{selectedRecipe.title}</h2>
              <div className="flex items-center gap-6 text-stone-600 mb-8 border-b border-stone-100 pb-6">
                <div className="flex items-center gap-2">
                  <Clock size={20} />
                  <span>Prep: {selectedRecipe.prepTime}</span>
                </div>
                <div className="flex items-center gap-2">
                  <ChefHat size={20} />
                  <span>Cook: {selectedRecipe.cookTime}</span>
                </div>
              </div>
              
              <div className="grid md:grid-cols-3 gap-8">
                <div className="md:col-span-1">
                  <h3 className="text-xl font-bold text-stone-800 mb-4">Ingredients</h3>
                  <ul className="space-y-3">
                    {selectedRecipe.ingredients.map((ing, idx) => (
                      <li key={idx} className="flex justify-between border-b border-stone-100 pb-2">
                        <span className="text-stone-700">{ing.name}</span>
                        <span className="text-stone-500 font-medium">{ing.amount}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="md:col-span-2">
                  <h3 className="text-xl font-bold text-stone-800 mb-4">Instructions</h3>
                  <div className="space-y-6">
                    {selectedRecipe.instructions.map((inst, idx) => (
                      <div key={idx} className="flex gap-4">
                        <span className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold flex-shrink-0">
                          {idx + 1}
                        </span>
                        <p className="text-stone-700 leading-relaxed pt-1">{inst}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
