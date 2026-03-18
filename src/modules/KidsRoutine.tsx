import { useState } from 'react';
import { useStore } from '../store/useStore';
import { Plus, CheckCircle2, Circle, Trash2, Star } from 'lucide-react';

export function KidsRoutine() {
  const { kidsRoutine, toggleKidsRoutineTask, addKidsRoutineTask, deleteKidsRoutineTask } = useStore();
  const [isAdding, setIsAdding] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', time: '' });

  const completedCount = kidsRoutine.filter(t => t.completed).length;
  const progress = kidsRoutine.length === 0 ? 0 : Math.round((completedCount / kidsRoutine.length) * 100);

  const handleAdd = () => {
    if (newTask.title && newTask.time) {
      addKidsRoutineTask(newTask);
      setNewTask({ title: '', time: '' });
      setIsAdding(false);
    }
  };

  return (
    <div className="p-4 md:p-8 h-full flex flex-col max-w-3xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-bold text-stone-800">Kids Routine</h2>
          <p className="text-stone-500 mt-1">Daily tasks and habits</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors"
        >
          <Plus size={20} />
          Add Task
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-6 mb-8">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-bold text-stone-700">Daily Progress</h3>
          <span className="text-emerald-600 font-bold">{progress}%</span>
        </div>
        <div className="h-4 bg-stone-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-emerald-500 transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        {progress === 100 && (
          <div className="mt-4 flex items-center justify-center gap-2 text-amber-500 font-bold animate-pulse">
            <Star size={24} fill="currentColor" />
            <span>All tasks completed! Great job!</span>
            <Star size={24} fill="currentColor" />
          </div>
        )}
      </div>

      {isAdding && (
        <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200 mb-6 flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex-1 w-full">
            <label className="block text-xs font-medium text-stone-500 mb-1 uppercase tracking-wider">Task</label>
            <input 
              type="text" 
              value={newTask.title}
              onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
              className="w-full px-4 py-2 bg-white border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="e.g., Brush teeth"
            />
          </div>
          <div className="w-full sm:w-32">
            <label className="block text-xs font-medium text-stone-500 mb-1 uppercase tracking-wider">Time</label>
            <input 
              type="time" 
              value={newTask.time}
              onChange={(e) => setNewTask({ ...newTask, time: e.target.value })}
              className="w-full px-4 py-2 bg-white border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <button 
              onClick={() => setIsAdding(false)}
              className="flex-1 px-4 py-2 bg-white text-stone-600 border border-stone-200 rounded-lg font-medium hover:bg-stone-50 transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={handleAdd}
              disabled={!newTask.title || !newTask.time}
              className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Save
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto pb-20">
        <div className="space-y-3">
          {kidsRoutine.sort((a, b) => a.time.localeCompare(b.time)).map(task => (
            <div 
              key={task.id} 
              className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${
                task.completed 
                  ? 'bg-emerald-50 border-emerald-100 opacity-75' 
                  : 'bg-white border-stone-100 shadow-sm hover:border-emerald-200'
              }`}
            >
              <button 
                onClick={() => toggleKidsRoutineTask(task.id)}
                className="flex-shrink-0 focus:outline-none"
              >
                {task.completed ? (
                  <CheckCircle2 size={32} className="text-emerald-500" />
                ) : (
                  <Circle size={32} className="text-stone-300 hover:text-emerald-400 transition-colors" />
                )}
              </button>
              
              <div className="flex-1 min-w-0">
                <h4 className={`font-bold text-lg truncate transition-colors ${task.completed ? 'text-emerald-800 line-through' : 'text-stone-800'}`}>
                  {task.title}
                </h4>
                <p className={`text-sm ${task.completed ? 'text-emerald-600/70' : 'text-stone-500'}`}>
                  {task.time}
                </p>
              </div>

              <button 
                onClick={() => deleteKidsRoutineTask(task.id)}
                className="p-2 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 size={20} />
              </button>
            </div>
          ))}
          
          {kidsRoutine.length === 0 && !isAdding && (
            <div className="text-center py-12 text-stone-400">
              <Star size={48} className="mx-auto mb-4 opacity-20" />
              <p className="text-lg font-medium">No tasks yet</p>
              <p className="text-sm">Add some daily routines to get started.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
