import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ActivenessDashboard } from './ActivenessDashboard';
import { ActivenessTable } from './ActivenessTable';
import { StudentModulesModal } from './StudentModulesModal';
import { Activity, Share2, Moon, Sun } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { calculateBatchActivenessMetrics, getStudentActivenessArray } from '../lib/activeness';
import type { Database } from '../lib/database.types';
import type { StudentActivenessMetrics, BatchActivenessMetrics } from '../lib/activeness';

type ActivenessBoard = Database['public']['Tables']['activeness_boards']['Row'];
type ModuleScore = Database['public']['Tables']['module_scores']['Row'];

export function PublicActivenessBoard() {
  const { publicId } = useParams<{ publicId: string }>();
  const { isDark, toggleTheme } = useTheme();
  const [board, setBoard] = useState<ActivenessBoard | null>(null);
  const [scores, setScores] = useState<ModuleScore[]>([]);
  const [studentMetrics, setStudentMetrics] = useState<StudentActivenessMetrics[]>([]);
  const [batchMetrics, setBatchMetrics] = useState<BatchActivenessMetrics>({
    totalStudents: 0,
    averageBatchActiveness: 0,
    totalModulesCompleted: 0,
    mostActiveStudent: '',
    highestScore: 0,
  });
  const [selectedStudent, setSelectedStudent] = useState<StudentActivenessMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadBoard();
  }, [publicId]);

  useEffect(() => {
    if (scores.length > 0) {
      const metrics = getStudentActivenessArray(scores);
      setStudentMetrics(metrics);
      setBatchMetrics(calculateBatchActivenessMetrics(scores));
    } else {
      setStudentMetrics([]);
      setBatchMetrics({
        totalStudents: 0,
        averageBatchActiveness: 0,
        totalModulesCompleted: 0,
        mostActiveStudent: '',
        highestScore: 0,
      });
    }
  }, [scores]);

  const loadBoard = async () => {
    if (!publicId) {
      setError('Invalid board link');
      setLoading(false);
      return;
    }

    const { data: boardData, error: boardError } = await supabase
      .from('activeness_boards')
      .select('*')
      .eq('public_id', publicId)
      .maybeSingle();

    if (boardError || !boardData) {
      setError('Board not found');
      setLoading(false);
      return;
    }

    setBoard(boardData);

    const { data: scoresData } = await supabase
      .from('module_scores')
      .select('*')
      .eq('board_id', boardData.id)
      .order('student_name', { ascending: true });

    if (scoresData) {
      setScores(scoresData);
    }

    setLoading(false);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    alert('Link copied to clipboard!');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-slate-600 dark:text-slate-400">Loading activeness board...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Activity className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
            {error}
          </h2>
          <p className="text-slate-600 dark:text-slate-400">
            Please check the URL and try again.
          </p>
        </div>
      </div>
    );
  }

  const selectedStudentScores = selectedStudent
    ? scores.filter(s => s.student_name === selectedStudent.name)
    : [];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <Activity className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                  {board?.name}
                </h1>
              </div>
              {board?.description && (
                <p className="text-slate-600 dark:text-slate-400 ml-14">
                  {board.description}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={toggleTheme}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                title={isDark ? 'Light mode' : 'Dark mode'}
              >
                {isDark ? (
                  <Sun className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                ) : (
                  <Moon className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                )}
              </button>
              <button
                onClick={copyLink}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
              >
                <Share2 className="w-5 h-5" />
                <span className="hidden sm:inline">Share</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <p className="text-sm text-green-900 dark:text-green-100">
            Public read-only view of Zoom Class Activeness. Click any student to see module-wise details.
          </p>
        </div>

        <ActivenessDashboard metrics={batchMetrics} />

        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">
            Student Activeness Board
          </h2>
          <ActivenessTable
            students={studentMetrics}
            onStudentClick={setSelectedStudent}
            isPublic={true}
          />
        </div>

        {selectedStudent && (
          <StudentModulesModal
            student={selectedStudent}
            scores={selectedStudentScores}
            onClose={() => setSelectedStudent(null)}
            isPublic={true}
          />
        )}
      </main>
    </div>
  );
}
