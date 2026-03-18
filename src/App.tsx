import { useState } from 'react';
import { ShoppingCart, Package, Calendar, ChefHat, Bot, Baby, Menu, X, Mic } from 'lucide-react';
import { ShoppingList } from './modules/ShoppingList';
import { PantryTracker } from './modules/PantryTracker';
import { WeeklyPlanner } from './modules/WeeklyPlanner';
import { RecipeManager } from './modules/RecipeManager';
import { AIChef } from './modules/AIChef';
import { KidsRoutine } from './modules/KidsRoutine';
import { VoiceNotes } from './modules/VoiceNotes';
import { VoiceAssistant } from './modules/VoiceAssistant';

type Module = 'shopping' | 'pantry' | 'planner' | 'recipes' | 'ai' | 'kids' | 'voice';

export default function App() {
  const [activeModule, setActiveModule] = useState<Module>('shopping');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const modules = [
    { id: 'shopping', label: 'Shopping List', icon: ShoppingCart, component: ShoppingList },
    { id: 'pantry', label: 'Pantry Tracker', icon: Package, component: PantryTracker },
    { id: 'planner', label: 'Family Planner', icon: Calendar, component: WeeklyPlanner },
    { id: 'recipes', label: 'Recipe Manager', icon: ChefHat, component: RecipeManager },
    { id: 'ai', label: 'AI Chef', icon: Bot, component: AIChef },
    { id: 'kids', label: 'Kids Routine', icon: Baby, component: KidsRoutine },
    { id: 'voice', label: 'Voice Hub', icon: Mic, component: VoiceNotes },
  ] as const;

  const ActiveComponent = modules.find(m => m.id === activeModule)?.component || ShoppingList;

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 flex flex-col md:flex-row font-sans">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-white border-b border-stone-200 sticky top-0 z-50">
        <h1 className="text-xl font-bold tracking-tight text-emerald-700">Family OS</h1>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2">
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <nav className={`
        ${isMobileMenuOpen ? 'block' : 'hidden'} 
        md:block w-full md:w-64 bg-white border-r border-stone-200 flex-shrink-0
        fixed md:sticky top-[61px] md:top-0 h-[calc(100vh-61px)] md:h-screen overflow-y-auto z-40
      `}>
        <div className="p-6 hidden md:block">
          <h1 className="text-2xl font-bold tracking-tight text-emerald-700">Family OS</h1>
          <p className="text-sm text-stone-500 mt-1">Household Management</p>
        </div>
        <div className="px-4 pb-6 space-y-1">
          {modules.map((m) => {
            const Icon = m.icon;
            const isActive = activeModule === m.id;
            return (
              <button
                key={m.id}
                onClick={() => {
                  setActiveModule(m.id as Module);
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-left
                  ${isActive 
                    ? 'bg-emerald-50 text-emerald-700 font-medium' 
                    : 'text-stone-600 hover:bg-stone-100'
                  }`}
              >
                <Icon size={20} className={isActive ? 'text-emerald-600' : 'text-stone-400'} />
                {m.label}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto w-full h-[calc(100vh-61px)] md:h-screen">
        <ActiveComponent />
      </main>

      {/* Global Voice Assistant */}
      <VoiceAssistant />
    </div>
  );
}
