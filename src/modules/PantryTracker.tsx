import { useState } from 'react';
import { useStore, Category, PantryItem } from '../store/useStore';
import { CATEGORIES } from '../constants/data';
import { Plus, Search, ShoppingCart, Trash2 } from 'lucide-react';

export function PantryTracker() {
  const { pantry, updatePantryItemStatus, addPantryItemToShoppingList } = useStore();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | 'All'>('All');

  const filteredPantry = pantry.filter(item => 
    (selectedCategory === 'All' || item.category === selectedCategory) &&
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusColor = (status: PantryItem['status']) => {
    switch (status) {
      case 'OK': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'Low': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'Out': return 'bg-red-100 text-red-700 border-red-200';
    }
  };

  return (
    <div className="p-4 md:p-8 h-full flex flex-col">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-bold text-stone-800">Pantry Tracker</h2>
          <p className="text-stone-500 mt-1">{pantry.length} items tracked</p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={20} />
            <input 
              type="text" 
              placeholder="Search pantry..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-4 mb-6 scrollbar-hide">
        <button
          onClick={() => setSelectedCategory('All')}
          className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-colors ${
            selectedCategory === 'All' ? 'bg-stone-800 text-white' : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50'
          }`}
        >
          All Items
        </button>
        {(Object.keys(CATEGORIES) as Category[]).map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-colors ${
              selectedCategory === cat ? 'bg-stone-800 text-white' : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-20">
          {filteredPantry.map(item => (
            <div key={item.id} className="bg-white p-4 rounded-xl shadow-sm border border-stone-100 flex flex-col justify-between h-32">
              <div>
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-semibold text-stone-800 truncate pr-2">{item.name}</h3>
                  <span className={`text-xs px-2 py-1 rounded-md border font-medium ${getStatusColor(item.status)}`}>
                    {item.status}
                  </span>
                </div>
                <p className="text-xs text-stone-400">{item.category}</p>
              </div>
              
              <div className="flex items-center justify-between mt-4">
                <div className="flex gap-1">
                  <button 
                    onClick={() => updatePantryItemStatus(item.id, 'OK')}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-colors ${item.status === 'OK' ? 'bg-emerald-100 text-emerald-700' : 'bg-stone-100 text-stone-400 hover:bg-stone-200'}`}
                  >
                    OK
                  </button>
                  <button 
                    onClick={() => updatePantryItemStatus(item.id, 'Low')}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-colors ${item.status === 'Low' ? 'bg-amber-100 text-amber-700' : 'bg-stone-100 text-stone-400 hover:bg-stone-200'}`}
                  >
                    LOW
                  </button>
                  <button 
                    onClick={() => updatePantryItemStatus(item.id, 'Out')}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-colors ${item.status === 'Out' ? 'bg-red-100 text-red-700' : 'bg-stone-100 text-stone-400 hover:bg-stone-200'}`}
                  >
                    OUT
                  </button>
                </div>
                
                {(item.status === 'Low' || item.status === 'Out') && (
                  <button 
                    onClick={() => addPantryItemToShoppingList(item.id)}
                    className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                    title="Add to Shopping List"
                  >
                    <ShoppingCart size={18} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
