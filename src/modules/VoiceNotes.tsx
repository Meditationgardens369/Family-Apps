import { useState, useRef, useEffect } from 'react';
import { useStore, VoiceNote, Recipe, Category } from '../store/useStore';
import { Mic, Square, Trash2, Play, Pause, ChefHat, Loader2, Save, FileText, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI, Type, ThinkingLevel } from '@google/genai';

export function VoiceNotes() {
  const { voiceNotes, addVoiceNote, deleteVoiceNote, addRecipe, toggleShoppingItem } = useStore();
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Add a timeout for processing state
  useEffect(() => {
    let timer: number;
    if (isProcessing) {
      timer = window.setTimeout(() => {
        setIsProcessing(false);
        setError('Processing timed out. Please try again.');
      }, 30000); // 30 second timeout
    }
    return () => clearTimeout(timer);
  }, [isProcessing]);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const startRecording = async () => {
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
          await processRecording(audioBlob, mimeType);
        } else {
          console.error("Audio blob is empty");
          setIsProcessing(false);
          alert("No audio captured. Please try again.");
        }
      };

      mediaRecorder.start(1000);
      setIsRecording(true);
      setRecordingTime(0);
      timerRef.current = window.setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Microphone access denied or not available.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const processRecording = async (blob: Blob, mimeType: string) => {
    setIsProcessing(true);
    setError(null);
    console.log(`Processing voice note. Blob size: ${blob.size}, MimeType: ${mimeType}`);
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
      
      console.log("Audio converted, calling Gemini for transcription...");
      // Use Gemini to transcribe and potentially extract a recipe
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
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
            text: "Transcribe this audio. If it sounds like a recipe, also format it as a JSON object matching the Recipe interface. If it's a shopping list item, identify it. Return the transcript and any extracted data."
          }
        ],
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              transcript: { type: Type.STRING },
              recipe: {
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
                }
              },
              shoppingItems: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    category: { type: Type.STRING }
                  }
                }
              }
            }
          }
        }
      });

      console.log("Gemini response received.");
      const result = JSON.parse(response.text);
      
      const newNote: VoiceNote = {
        id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15),
        date: new Date().toISOString(),
        audioData: `data:${mimeType};base64,${base64Audio}`,
        transcript: result.transcript,
        title: result.recipe?.title || `Voice Note ${new Date().toLocaleTimeString()}`
      };

      addVoiceNote(newNote);
    } catch (err) {
      console.error("Error processing audio:", err);
      setError(err instanceof Error ? err.message : "Failed to process audio.");
    } finally {
      setIsProcessing(false);
    }
  };

  const playAudio = (audioData: string, id: string) => {
    if (playingId === id) {
      audioRef.current?.pause();
      setPlayingId(null);
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
    }

    const audio = new Audio(audioData);
    audioRef.current = audio;
    audio.onended = () => setPlayingId(null);
    audio.play();
    setPlayingId(id);
  };

  const handleConvertToRecipe = async (note: VoiceNote) => {
    setIsProcessing(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [
          { text: `Convert this transcript into a detailed recipe object: "${note.transcript}"` }
        ],
        config: {
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

      const recipeData = JSON.parse(response.text);
      const newRecipe: Recipe = {
        ...recipeData,
        id: crypto.randomUUID(),
      };
      addRecipe(newRecipe);
      alert(`Recipe "${newRecipe.title}" added to Manager!`);
    } catch (err) {
      console.error("Failed to convert to recipe:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <header className="mb-8">
        <h2 className="text-3xl font-bold text-stone-900 tracking-tight">Voice Hub</h2>
        <p className="text-stone-500">Record recipes, notes, and shopping items with your voice.</p>
      </header>

      {/* Recording Section */}
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-stone-200 mb-8 flex flex-col items-center justify-center text-center">
        <div className="mb-6">
          <AnimatePresence mode="wait">
            {isRecording ? (
              <motion.div
                key="recording"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="flex flex-col items-center"
              >
                <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mb-4 relative">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    className="absolute inset-0 bg-red-100 rounded-full"
                  />
                  <Square size={32} className="text-red-600 relative z-10" />
                </div>
                <span className="text-2xl font-mono font-bold text-red-600">{formatTime(recordingTime)}</span>
                <button
                  onClick={stopRecording}
                  className="mt-6 px-8 py-3 bg-red-600 text-white rounded-full font-bold hover:bg-red-700 transition-colors"
                >
                  Stop Recording
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="idle"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="flex flex-col items-center"
              >
                <button
                  onClick={startRecording}
                  disabled={isProcessing}
                  className="w-24 h-24 bg-emerald-600 text-white rounded-full flex items-center justify-center mb-4 hover:bg-emerald-700 transition-all hover:scale-105 disabled:opacity-50 shadow-lg shadow-emerald-200"
                >
                  {isProcessing ? <Loader2 size={32} className="animate-spin" /> : <Mic size={32} />}
                </button>
                <span className="text-stone-600 font-medium">
                  {isProcessing ? 'Processing audio...' : 'Tap to start recording'}
                </span>
                {error && (
                  <span className="text-red-500 text-sm mt-2 font-medium">
                    {error}
                  </span>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Saved Notes Section */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-stone-900 flex items-center gap-2">
          <Save size={20} className="text-emerald-600" />
          Saved Voice Notes
        </h3>
        
        <div className="grid gap-4">
          {voiceNotes.length === 0 ? (
            <div className="text-center py-12 bg-stone-50 rounded-3xl border-2 border-dashed border-stone-200">
              <Mic size={48} className="mx-auto text-stone-300 mb-4" />
              <p className="text-stone-500">No voice notes saved yet.</p>
            </div>
          ) : (
            voiceNotes.map((note) => (
              <motion.div
                key={note.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100 group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="font-bold text-stone-900">{note.title || 'Untitled Note'}</h4>
                    <p className="text-xs text-stone-400">{new Date(note.date).toLocaleString()}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => playAudio(note.audioData, note.id)}
                      className="p-2 hover:bg-stone-100 rounded-full transition-colors text-emerald-600"
                    >
                      {playingId === note.id ? <Pause size={20} /> : <Play size={20} />}
                    </button>
                    <button
                      onClick={() => deleteVoiceNote(note.id)}
                      className="p-2 hover:bg-red-50 rounded-full transition-colors text-stone-400 hover:text-red-600"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>

                {note.transcript && (
                  <div className="bg-stone-50 rounded-xl p-4 mb-4">
                    <p className="text-sm text-stone-600 italic line-clamp-3">"{note.transcript}"</p>
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleConvertToRecipe(note)}
                    disabled={isProcessing}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-lg text-sm font-medium hover:bg-emerald-100 transition-colors"
                  >
                    <ChefHat size={16} />
                    Convert to Recipe
                  </button>
                  <button
                    className="flex items-center gap-2 px-4 py-2 bg-stone-100 text-stone-700 rounded-lg text-sm font-medium hover:bg-stone-200 transition-colors"
                  >
                    <FileText size={16} />
                    View Transcript
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
