import { X, TrendingUp, Trash2 } from 'lucide-react';
import { useRole } from '../hooks/useRole';
import type { Database } from '../lib/database.types';
import type { StudentMetrics } from '../lib/scoring';

type InterviewRound = Database['public']['Tables']['interview_rounds']['Row'];

interface StudentRoundsModalProps {
  student: StudentMetrics;
  rounds: InterviewRound[];
  onClose: () => void;
  onDeleteRound?: (roundId: string) => void;
  isPublic?: boolean;
}

export function StudentRoundsModal({
  student,
  rounds,
  onClose,
  onDeleteRound,
  isPublic = false,
}: StudentRoundsModalProps) {
  const { canDelete } = useRole();

  const getScoreColor = (score: number) => {
    if (score >= 9) return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20';
    if (score >= 7) return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20';
    if (score >= 5) return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20';
    return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20';
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              {student.name}
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Interview Performance
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
              <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">Highest Score</p>
              <p className="text-2xl font-bold text-blue-900 dark:text-blue-100 mt-1">
                {student.highestScore}/10
              </p>
            </div>

            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <p className="text-xs text-green-600 dark:text-green-400 font-medium">Avg. Score</p>
              <p className="text-2xl font-bold text-green-900 dark:text-green-100 mt-1">
                {student.averageScore}/10
              </p>
            </div>

            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
              <p className="text-xs text-purple-600 dark:text-purple-400 font-medium">Total Score</p>
              <p className="text-2xl font-bold text-purple-900 dark:text-purple-100 mt-1">
                {student.totalScore}
              </p>
            </div>

            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <p className="text-xs text-yellow-600 dark:text-yellow-400 font-medium">Interviews</p>
              <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-100 mt-1">
                {student.interviewsGiven}
              </p>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Round Details
            </h3>

            <div className="space-y-3">
              {rounds.length === 0 ? (
                <p className="text-slate-600 dark:text-slate-400">No interview rounds recorded.</p>
              ) : (
                rounds
                  .sort((a, b) => a.round_number - b.round_number)
                  .map((round, idx) => (
                    <div
                      key={round.id}
                      className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-sm font-bold text-slate-600 dark:text-slate-400">
                              Round {round.round_number}
                            </span>
                            <span className={`px-3 py-1 rounded-full text-sm font-bold ${getScoreColor(round.score)}`}>
                              {round.score}/10
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {new Date(round.interview_date).toLocaleDateString()} • {round.interviewer_name}
                          </p>
                        </div>

                        {!isPublic && onDeleteRound && canDelete && (
                          <button
                            onClick={() => {
                              if (confirm('Delete this interview round?')) {
                                onDeleteRound(round.id);
                              }
                            }}
                            className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
                          >
                            <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                          </button>
                        )}
                      </div>

                      {round.feedback && (
                        <div className="mb-2">
                          <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Feedback</p>
                          <p className="text-sm text-slate-600 dark:text-slate-400">{round.feedback}</p>
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                        {round.strengths && (
                          <div>
                            <p className="text-xs font-semibold text-green-700 dark:text-green-300">Strengths</p>
                            <p className="text-xs text-slate-600 dark:text-slate-400">{round.strengths}</p>
                          </div>
                        )}
                        {round.weaknesses && (
                          <div>
                            <p className="text-xs font-semibold text-amber-700 dark:text-amber-300">Improvements</p>
                            <p className="text-xs text-slate-600 dark:text-slate-400">{round.weaknesses}</p>
                          </div>
                        )}
                      </div>

                      {round.notes && (
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 p-2 bg-slate-100 dark:bg-slate-800 rounded">
                          {round.notes}
                        </p>
                      )}
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
