import { useState } from 'react';
import { useStore, PlannerDay } from '../store/useStore';
import { format, addDays, startOfWeek, isSameDay } from 'date-fns';
import { ChevronLeft, ChevronRight, Edit2, Check } from 'lucide-react';

export function WeeklyPlanner() {
  const { planner, updatePlannerDay } = useStore();
  const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [editingDate, setEditingDate] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<PlannerDay>>({});

  const days = Array.from({ length: 7 }).map((_, i) => {
    const date = addDays(currentWeekStart, i);
    const dateStr = format(date, 'yyyy-MM-dd');
    return {
      date,
      dateStr,
      data: planner[dateStr] || { date: dateStr, breakfast: '', lunch: '', dinner: '', kidsTasks: [], parentsTasks: [] }
    };
  });

  const handleEdit = (dateStr: string, data: PlannerDay) => {
    setEditingDate(dateStr);
    setEditData(data);
  };

  const handleSave = () => {
    if (editingDate) {
      updatePlannerDay(editingDate, editData);
      setEditingDate(null);
    }
  };

  const nextWeek = () => setCurrentWeekStart(addDays(currentWeekStart, 7));
  const prevWeek = () => setCurrentWeekStart(addDays(currentWeekStart, -7));

  return (
    <div className="p-4 md:p-8 h-full flex flex-col">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-stone-800">Family Planner</h2>
          <p className="text-stone-500 mt-1">
            {format(currentWeekStart, 'MMMM d')} - {format(addDays(currentWeekStart, 6), 'MMMM d, yyyy')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={prevWeek} className="p-2 bg-white border border-stone-200 rounded-lg hover:bg-stone-50 transition-colors">
            <ChevronLeft size={20} className="text-stone-600" />
          </button>
          <button onClick={nextWeek} className="p-2 bg-white border border-stone-200 rounded-lg hover:bg-stone-50 transition-colors">
            <ChevronRight size={20} className="text-stone-600" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {days.map(({ date, dateStr, data }) => {
            const isEditing = editingDate === dateStr;
            const isToday = isSameDay(date, new Date());

            return (
              <div key={dateStr} className={`bg-white rounded-2xl shadow-sm border ${isToday ? 'border-emerald-400 ring-1 ring-emerald-400' : 'border-stone-100'} overflow-hidden flex flex-col`}>
                <div className={`p-4 border-b ${isToday ? 'bg-emerald-50 border-emerald-100' : 'bg-stone-50 border-stone-100'} flex items-center justify-between`}>
                  <div>
                    <h3 className={`font-bold text-lg ${isToday ? 'text-emerald-800' : 'text-stone-800'}`}>
                      {format(date, 'EEEE')}
                    </h3>
                    <p className={`text-sm ${isToday ? 'text-emerald-600' : 'text-stone-500'}`}>
                      {format(date, 'MMM d')}
                    </p>
                  </div>
                  {isEditing ? (
                    <button onClick={handleSave} className="p-2 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition-colors">
                      <Check size={18} />
                    </button>
                  ) : (
                    <button onClick={() => handleEdit(dateStr, data)} className="p-2 bg-white text-stone-400 rounded-lg hover:bg-stone-100 border border-stone-200 transition-colors">
                      <Edit2 size={18} />
                    </button>
                  )}
                </div>

                <div className="p-4 space-y-4 flex-1">
                  {/* Meals */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400">Meals</h4>
                    {['breakfast', 'lunch', 'dinner'].map((meal) => (
                      <div key={meal} className="flex flex-col">
                        <span className="text-xs font-medium text-stone-500 capitalize mb-1">{meal}</span>
                        {isEditing ? (
                          <input
                            type="text"
                            value={(editData as any)[meal] || ''}
                            onChange={(e) => setEditData({ ...editData, [meal]: e.target.value })}
                            className="w-full px-3 py-1.5 bg-stone-50 border border-stone-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            placeholder={`Add ${meal}...`}
                          />
                        ) : (
                          <p className="text-sm text-stone-800 min-h-[20px]">{(data as any)[meal] || <span className="text-stone-300 italic">Not planned</span>}</p>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Tasks */}
                  <div className="space-y-3 pt-4 border-t border-stone-100">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400">Tasks</h4>
                    
                    <div className="flex flex-col">
                      <span className="text-xs font-medium text-stone-500 mb-1">Kids</span>
                      {isEditing ? (
                        <textarea
                          value={(editData.kidsTasks || []).join('\n')}
                          onChange={(e) => setEditData({ ...editData, kidsTasks: e.target.value.split('\n').filter(Boolean) })}
                          className="w-full px-3 py-1.5 bg-stone-50 border border-stone-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none h-20"
                          placeholder="One task per line..."
                        />
                      ) : (
                        <ul className="list-disc list-inside text-sm text-stone-800 min-h-[20px]">
                          {data.kidsTasks && data.kidsTasks.length > 0 ? (
                            data.kidsTasks.map((t, i) => <li key={i}>{t}</li>)
                          ) : (
                            <span className="text-stone-300 italic list-none">No tasks</span>
                          )}
                        </ul>
                      )}
                    </div>

                    <div className="flex flex-col">
                      <span className="text-xs font-medium text-stone-500 mb-1">Parents</span>
                      {isEditing ? (
                        <textarea
                          value={(editData.parentsTasks || []).join('\n')}
                          onChange={(e) => setEditData({ ...editData, parentsTasks: e.target.value.split('\n').filter(Boolean) })}
                          className="w-full px-3 py-1.5 bg-stone-50 border border-stone-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none h-20"
                          placeholder="One task per line..."
                        />
                      ) : (
                        <ul className="list-disc list-inside text-sm text-stone-800 min-h-[20px]">
                          {data.parentsTasks && data.parentsTasks.length > 0 ? (
                            data.parentsTasks.map((t, i) => <li key={i}>{t}</li>)
                          ) : (
                            <span className="text-stone-300 italic list-none">No tasks</span>
                          )}
                        </ul>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
