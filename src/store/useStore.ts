import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Category = 
  | 'Cleaning Products'
  | 'Oils & Fats'
  | 'Dried Herbs & Spices'
  | 'Meats & Fish'
  | 'Condiments & Spreads'
  | 'Vegetables'
  | 'Fruits'
  | 'Tinned Food'
  | 'Pastas & Grains'
  | 'Drinks & Beverages'
  | 'Baking'
  | 'Cosmetics & Toiletries'
  | 'Pharmaceuticals'
  | 'Miscellaneous'
  | 'Plant-based Dairy'
  | 'Sweeteners'
  | 'Dried Fruit, Nuts & Seeds'
  | 'Fresh Herbs';

export interface ShoppingItem {
  id: string;
  name: string;
  category: Category;
  checked: boolean;
}

export interface PantryItem {
  id: string;
  name: string;
  category: Category;
  status: 'OK' | 'Low' | 'Out';
}

export interface Recipe {
  id: string;
  title: string;
  image?: string;
  ingredients: { name: string; amount: string }[];
  instructions: string[];
  prepTime: string;
  cookTime: string;
}

export interface PlannerDay {
  date: string; // YYYY-MM-DD
  breakfast: string;
  lunch: string;
  dinner: string;
  kidsTasks: string[];
  parentsTasks: string[];
}

export interface KidsRoutineTask {
  id: string;
  title: string;
  time: string;
  completed: boolean;
}

export interface VoiceNote {
  id: string;
  date: string;
  audioData: string; // Base64
  transcript?: string;
  title?: string;
}

interface AppState {
  shoppingList: ShoppingItem[];
  pantry: PantryItem[];
  recipes: Recipe[];
  planner: Record<string, PlannerDay>;
  kidsRoutine: KidsRoutineTask[];
  voiceNotes: VoiceNote[];
  
  // Actions
  toggleShoppingItem: (name: string, category: Category) => void;
  checkShoppingItem: (id: string, checked: boolean) => void;
  clearCheckedShoppingItems: () => void;
  
  updatePantryItemStatus: (id: string, status: 'OK' | 'Low' | 'Out') => void;
  addPantryItemToShoppingList: (id: string) => void;
  
  updatePlannerDay: (date: string, data: Partial<PlannerDay>) => void;
  
  addRecipe: (recipe: Recipe) => void;
  updateRecipe: (id: string, recipe: Partial<Recipe>) => void;
  deleteRecipe: (id: string) => void;
  
  toggleKidsRoutineTask: (id: string) => void;
  addKidsRoutineTask: (task: Omit<KidsRoutineTask, 'id' | 'completed'>) => void;
  deleteKidsRoutineTask: (id: string) => void;

  addVoiceNote: (note: VoiceNote) => void;
  deleteVoiceNote: (id: string) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      shoppingList: [],
      pantry: [
        { id: '1', name: 'Rice', category: 'Pastas & Grains', status: 'OK' },
        { id: '2', name: 'Olive Oil', category: 'Oils & Fats', status: 'Low' },
        { id: '3', name: 'Garlic Powder', category: 'Dried Herbs & Spices', status: 'Low' },
      ],
      recipes: [],
      planner: {},
      kidsRoutine: [
        { id: '1', title: 'Brush teeth', time: '07:00', completed: false },
        { id: '2', title: 'Make bed', time: '07:15', completed: false },
        { id: '3', title: 'Pack backpack', time: '07:30', completed: false },
      ],
      voiceNotes: [],

      toggleShoppingItem: (name, category) => set((state) => {
        const existing = state.shoppingList.find(i => i.name === name);
        if (existing) {
          return { shoppingList: state.shoppingList.filter(i => i.name !== name) };
        }
        return {
          shoppingList: [...state.shoppingList, { id: crypto.randomUUID(), name, category, checked: false }]
        };
      }),
      
      checkShoppingItem: (id, checked) => set((state) => ({
        shoppingList: state.shoppingList.map(i => i.id === id ? { ...i, checked } : i)
      })),
      
      clearCheckedShoppingItems: () => set((state) => ({
        shoppingList: state.shoppingList.filter(i => !i.checked)
      })),

      updatePantryItemStatus: (id, status) => set((state) => ({
        pantry: state.pantry.map(i => i.id === id ? { ...i, status } : i)
      })),

      addPantryItemToShoppingList: (id) => set((state) => {
        const item = state.pantry.find(i => i.id === id);
        if (!item) return state;
        const existingShopping = state.shoppingList.find(i => i.name === item.name);
        if (existingShopping) return state;
        return {
          shoppingList: [...state.shoppingList, { id: crypto.randomUUID(), name: item.name, category: item.category, checked: false }]
        };
      }),

      updatePlannerDay: (date, data) => set((state) => {
        const existing = state.planner[date] || { date, breakfast: '', lunch: '', dinner: '', kidsTasks: [], parentsTasks: [] };
        return {
          planner: {
            ...state.planner,
            [date]: { ...existing, ...data }
          }
        };
      }),

      addRecipe: (recipe) => set((state) => ({
        recipes: [...state.recipes, recipe]
      })),
      
      updateRecipe: (id, recipe) => set((state) => ({
        recipes: state.recipes.map(r => r.id === id ? { ...r, ...recipe } : r)
      })),
      
      deleteRecipe: (id) => set((state) => ({
        recipes: state.recipes.filter(r => r.id !== id)
      })),

      toggleKidsRoutineTask: (id) => set((state) => ({
        kidsRoutine: state.kidsRoutine.map(t => t.id === id ? { ...t, completed: !t.completed } : t)
      })),
      
      addKidsRoutineTask: (task) => set((state) => ({
        kidsRoutine: [...state.kidsRoutine, { ...task, id: crypto.randomUUID(), completed: false }]
      })),
      
      deleteKidsRoutineTask: (id) => set((state) => ({
        kidsRoutine: state.kidsRoutine.filter(t => t.id !== id)
      })),

      addVoiceNote: (note) => set((state) => ({
        voiceNotes: [note, ...state.voiceNotes]
      })),

      deleteVoiceNote: (id) => set((state) => ({
        voiceNotes: state.voiceNotes.filter(n => n.id !== id)
      })),
    }),
    {
      name: 'family-os-storage',
    }
  )
);
