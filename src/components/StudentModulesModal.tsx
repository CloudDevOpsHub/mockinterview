import { X, BarChart3, Trash2 } from 'lucide-react';
import { getModulesList, TOTAL_MODULES } from '../lib/activeness';
import type { Database } from '../lib/database.types';
import type { StudentActivenessMetrics } from '../lib/activeness';

type ModuleScore = Database['public']['Tables']['module_scores']['Row'];

interface StudentModulesModalProps {
  student: StudentActivenessMetrics;
  scores: ModuleScore[];
  onClose: () => void;
  onDeleteScore?: (scoreId: string) => void;
  onEditScore?: (score: ModuleScore) => void;
  isPublic?: boolean;
}

export function StudentModulesModal({
  student,
  scores,
  onClose,
  onDeleteScore,
  onEditScore,
  isPublic = false,
}: StudentModulesModalProps) {
  const getScoreColor = (score: number) => {
    if (score >= 9) return 'bg-green-500';
    if (score >= 7) return 'bg-blue-500';
    if (score >= 5) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getScoreTextColor = (score: number) => {
    if (score >= 9) return 'text-green-600 dark:text-green-400';
    if (score >= 7) return 'text-blue-600 dark:text-blue-400';
    if (score >= 5) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const allModules = getModulesList();
  const scoreMap = new Map(scores.map(s => [s.module_number, s]));

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              {student.name}
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Zoom Class Activeness by Module
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-slate-500" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">Total Score</p>
              <p className="text-2xl font-bold text-blue-900 dark:text-blue-100 mt-1">
                {student.totalScore}/{TOTAL_MODULES * 10}
              </p>
            </div>

            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <p className="text-xs text-green-600 dark:text-green-400 font-medium">Avg. Score</p>
              <p className="text-2xl font-bold text-green-900 dark:text-green-100 mt-1">
                {student.averageScore}/10
              </p>
            </div>

            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
              <p className="text-xs text-purple-600 dark:text-purple-400 font-medium">Completed</p>
              <p className="text-2xl font-bold text-purple-900 dark:text-purple-100 mt-1">
                {student.modulesCompleted}/{TOTAL_MODULES}
              </p>
            </div>

            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <p className="text-xs text-yellow-600 dark:text-yellow-400 font-medium">Progress</p>
              <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-100 mt-1">
                {student.completionPercentage}%
              </p>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Module-wise Activeness
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {allModules.map(moduleNum => {
                const score = scoreMap.get(moduleNum);

                return (
                  <div
                    key={moduleNum}
                    className={`p-4 rounded-lg border transition-all ${
                      score
                        ? 'bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600'
                        : 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 opacity-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                        Module {moduleNum}
                      </span>

                      {score ? (
                        <div className="flex items-center gap-2">
                          <span className={`text-lg font-bold ${getScoreTextColor(score.activeness_score)}`}>
                            {score.activeness_score}/10
                          </span>

                          {!isPublic && (
                            <div className="flex gap-1">
                              {onEditScore && (
                                <button
                                  onClick={() => onEditScore(score)}
                                  className="p-1 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded transition-colors"
                                  title="Edit score"
                                >
                                  <span className="text-xs text-blue-600 dark:text-blue-400">✎</span>
                                </button>
                              )}
                              {onDeleteScore && (
                                <button
                                  onClick={() => {
                                    if (confirm('Delete this module score?')) {
                                      onDeleteScore(score.id);
                                    }
                                  }}
                                  className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
                                  title="Delete score"
                                >
                                  <Trash2 className="w-3 h-3 text-red-600 dark:text-red-400" />
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-slate-500 dark:text-slate-400">Not recorded</span>
                      )}
                    </div>

                    {score && (
                      <>
                        <div className="bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden mb-2">
                          <div
                            className={`h-full ${getScoreColor(score.activeness_score)} transition-all`}
                            style={{ width: `${(score.activeness_score / 10) * 100}%` }}
                          />
                        </div>

                        {score.notes && (
                          <p className="text-xs text-slate-600 dark:text-slate-400 mt-2">
                            {score.notes}
                          </p>
                        )}

                        <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                          {new Date(score.recorded_date).toLocaleDateString()}
                        </p>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
