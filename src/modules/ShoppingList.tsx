import { useState, useEffect, useRef } from 'react';
import { useStore, Category } from '../store/useStore';
import { CATEGORIES, CATEGORY_IMAGES } from '../constants/data';
import { Check, Plus, ShoppingBag, Mic, MicOff, Download } from 'lucide-react';

export function ShoppingList() {
  const { shoppingList, toggleShoppingItem, checkShoppingItem, clearCheckedShoppingItems } = useStore();
  const [mode, setMode] = useState<'edit' | 'shop'>('edit');
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript.toLowerCase();
        // Try to match the transcript to an item in our categories
        let found = false;
        for (const [category, items] of Object.entries(CATEGORIES)) {
          for (const item of items) {
            if (item.toLowerCase().includes(transcript) || transcript.includes(item.toLowerCase())) {
              toggleShoppingItem(item, category as Category);
              found = true;
              break;
            }
          }
          if (found) break;
        }
        setIsListening(false);
      };

      recognitionRef.current.onerror = () => {
        setIsListening(false);
      };
      
      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, [toggleShoppingItem]);

  const toggleListen = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

  const exportList = () => {
    const text = shoppingList.map(i => `[${i.checked ? 'x' : ' '}] ${i.name}`).join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'shopping-list.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (mode === 'shop') {
    const unchecked = shoppingList.filter(i => !i.checked);
    const checked = shoppingList.filter(i => i.checked);

    return (
      <div className="p-4 md:p-8 max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold text-stone-800">Shopping Mode</h2>
          <button 
            onClick={() => setMode('edit')}
            className="px-4 py-2 bg-stone-200 text-stone-700 rounded-lg font-medium hover:bg-stone-300 transition-colors"
          >
            Back to Edit
          </button>
        </div>

        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-stone-600 mb-3">To Buy ({unchecked.length})</h3>
            <div className="space-y-2">
              {unchecked.map(item => (
                <label key={item.id} className="flex items-center gap-3 p-4 bg-white rounded-xl shadow-sm border border-stone-100 cursor-pointer hover:border-emerald-200 transition-colors">
                  <input 
                    type="checkbox" 
                    checked={item.checked}
                    onChange={(e) => checkShoppingItem(item.id, e.target.checked)}
                    className="w-6 h-6 rounded border-stone-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-lg text-stone-800">{item.name}</span>
                  <span className="ml-auto text-sm text-stone-400">{item.category}</span>
                </label>
              ))}
              {unchecked.length === 0 && (
                <p className="text-stone-500 italic p-4 text-center">All items checked!</p>
              )}
            </div>
          </div>

          {checked.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-stone-600">Done ({checked.length})</h3>
                <button 
                  onClick={clearCheckedShoppingItems}
                  className="text-sm text-red-500 hover:text-red-600 font-medium"
                >
                  Clear Done
                </button>
              </div>
              <div className="space-y-2 opacity-60">
                {checked.map(item => (
                  <label key={item.id} className="flex items-center gap-3 p-4 bg-stone-50 rounded-xl border border-stone-200 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={item.checked}
                      onChange={(e) => checkShoppingItem(item.id, e.target.checked)}
                      className="w-6 h-6 rounded border-stone-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="text-lg text-stone-500 line-through">{item.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 h-full flex flex-col">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-bold text-stone-800">Shopping List</h2>
          <p className="text-stone-500 mt-1">{shoppingList.length} items on the list</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={toggleListen}
            className={`p-2 rounded-lg transition-colors ${isListening ? 'bg-red-100 text-red-600' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}`}
            title="Voice Add"
          >
            {isListening ? <MicOff size={20} /> : <Mic size={20} />}
          </button>
          <button 
            onClick={exportList}
            className="p-2 bg-stone-100 text-stone-600 rounded-lg hover:bg-stone-200 transition-colors"
            title="Export List"
          >
            <Download size={20} />
          </button>
          <button 
            onClick={() => setMode('shop')}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors"
          >
            <ShoppingBag size={20} />
            Shop Mode
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-20">
        {/* Current List Section */}
        {shoppingList.length > 0 && (
          <div className="mb-12">
            <h3 className="text-xl font-bold text-stone-800 mb-4 flex items-center gap-2">
              Current List
              <span className="text-sm font-normal text-stone-400 bg-stone-100 px-2 py-0.5 rounded-full">{shoppingList.length}</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {shoppingList.map(item => (
                <div key={item.id} className="flex items-center justify-between p-4 bg-white rounded-xl shadow-sm border border-stone-100 group hover:border-emerald-200 transition-colors">
                  <div className="flex flex-col">
                    <span className="font-medium text-stone-800">{item.name}</span>
                    <span className="text-xs text-stone-400">{item.category}</span>
                  </div>
                  <button 
                    onClick={() => toggleShoppingItem(item.name, item.category)}
                    className="p-2 text-stone-300 hover:text-red-500 transition-colors"
                  >
                    <Check size={20} className="text-emerald-500" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Browse Categories Section */}
        <h3 className="text-xl font-bold text-stone-800 mb-6">Browse Categories</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {(Object.entries(CATEGORIES) as [Category, string[]][]).map(([category, items]) => (
            <div key={category} className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden flex flex-col">
              <div className="h-32 relative">
                <img 
                  src={CATEGORY_IMAGES[category]} 
                  alt={category} 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4">
                  <h3 className="text-white font-bold text-lg">{category}</h3>
                </div>
              </div>
              <div className="p-2 flex-1 overflow-y-auto max-h-64">
                {items.map(item => {
                  const isSelected = shoppingList.some(i => i.name === item);
                  return (
                    <button
                      key={item}
                      onClick={() => toggleShoppingItem(item, category)}
                      className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition-colors ${
                        isSelected ? 'bg-emerald-50 text-emerald-700' : 'hover:bg-stone-50 text-stone-700'
                      }`}
                    >
                      <span className="text-sm">{item}</span>
                      {isSelected ? (
                        <Check size={16} className="text-emerald-600 flex-shrink-0" />
                      ) : (
                        <Plus size={16} className="text-stone-300 flex-shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
