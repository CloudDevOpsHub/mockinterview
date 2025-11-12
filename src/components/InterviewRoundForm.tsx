import { useState } from 'react';
import { X, Save } from 'lucide-react';
import type { Database } from '../lib/database.types';

type InterviewRound = Database['public']['Tables']['interview_rounds']['Row'];

interface InterviewRoundFormProps {
  leaderboardId: string;
  onSave: (round: Omit<InterviewRound, 'id' | 'leaderboard_id' | 'created_at' | 'updated_at'>) => void;
  onClose: () => void;
}

export function InterviewRoundForm({ leaderboardId, onSave, onClose }: InterviewRoundFormProps) {
  const [formData, setFormData] = useState({
    student_name: '',
    round_number: 1,
    score: 5,
    interview_date: new Date().toISOString().split('T')[0],
    interviewer_name: '',
    strengths: '',
    weaknesses: '',
    feedback: '',
    notes: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.student_name.trim() || !formData.interviewer_name.trim()) {
      alert('Please fill in all required fields');
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
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Record Interview Round
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Round Number *
              </label>
              <select
                value={formData.round_number}
                onChange={(e) => updateField('round_number', parseInt(e.target.value))}
                className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {[1, 2, 3, 4, 5].map(n => (
                  <option key={n} value={n}>Round {n}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Score (0-10) *
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="1"
                  value={formData.score}
                  onChange={(e) => updateField('score', parseInt(e.target.value))}
                  className="flex-1 h-2 bg-slate-300 dark:bg-slate-600 rounded-lg appearance-none cursor-pointer"
                />
                <span className="text-lg font-bold text-slate-900 dark:text-white w-12 text-center">
                  {formData.score}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Interview Date *
              </label>
              <input
                type="date"
                required
                value={formData.interview_date}
                onChange={(e) => updateField('interview_date', e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Interviewer Name *
              </label>
              <input
                type="text"
                required
                value={formData.interviewer_name}
                onChange={(e) => updateField('interviewer_name', e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Jane Smith"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Feedback
            </label>
            <textarea
              rows={3}
              value={formData.feedback}
              onChange={(e) => updateField('feedback', e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="Overall feedback for this round..."
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Strengths
              </label>
              <textarea
                rows={2}
                value={formData.strengths}
                onChange={(e) => updateField('strengths', e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="What did the student do well?"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Areas for Improvement
              </label>
              <textarea
                rows={2}
                value={formData.weaknesses}
                onChange={(e) => updateField('weaknesses', e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="What could be improved?"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Additional Notes
            </label>
            <textarea
              rows={2}
              value={formData.notes}
              onChange={(e) => updateField('notes', e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="Any other comments..."
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              <Save className="w-5 h-5" />
              Record Interview
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
