import { useState } from 'react';
import { X, Save } from 'lucide-react';
import { getModulesList } from '../lib/activeness';
import type { Database } from '../lib/database.types';

type ModuleScore = Database['public']['Tables']['module_scores']['Row'];

interface ModuleScoreFormProps {
  boardId: string;
  existingScore?: ModuleScore;
  onSave: (score: Omit<ModuleScore, 'id' | 'board_id' | 'created_at' | 'updated_at'>) => void;
  onClose: () => void;
}

export function ModuleScoreForm({ boardId, existingScore, onSave, onClose }: ModuleScoreFormProps) {
  const [formData, setFormData] = useState({
    student_name: existingScore?.student_name || '',
    module_number: existingScore?.module_number || 1,
    activeness_score: existingScore?.activeness_score || 5,
    notes: existingScore?.notes || '',
    recorded_date: existingScore?.recorded_date || new Date().toISOString().split('T')[0],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.student_name.trim()) {
      alert('Please enter student name');
      return;
    }

    onSave(formData);
  };

  const updateField = (field: string, value: string | number) => {
    setFormData({ ...formData, [field]: value });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            {existingScore ? 'Update Module Score' : 'Record Module Score'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Student Name *
            </label>
            <input
              type="text"
              required
              value={formData.student_name}
              onChange={(e) => updateField('student_name', e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="John Doe"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Module Number *
              </label>
              <select
                value={formData.module_number}
                onChange={(e) => updateField('module_number', parseInt(e.target.value))}
                className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {getModulesList().map(n => (
                  <option key={n} value={n}>Module {n}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Recorded Date *
              </label>
              <input
                type="date"
                required
                value={formData.recorded_date}
                onChange={(e) => updateField('recorded_date', e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Activeness Score (0-10) *
            </label>
            <div className="space-y-2">
              <input
                type="range"
                min="0"
                max="10"
                step="1"
                value={formData.activeness_score}
                onChange={(e) => updateField('activeness_score', parseInt(e.target.value))}
                className="w-full h-2 bg-slate-300 dark:bg-slate-600 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 dark:text-slate-400">Not Active</span>
                <span className="text-2xl font-bold text-slate-900 dark:text-white px-4 py-1 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                  {formData.activeness_score}/10
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">Very Active</span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Notes (Optional)
            </label>
            <textarea
              rows={3}
              value={formData.notes}
              onChange={(e) => updateField('notes', e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="Additional notes about participation..."
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              <Save className="w-5 h-5" />
              {existingScore ? 'Update Score' : 'Save Score'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-3 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-medium rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
