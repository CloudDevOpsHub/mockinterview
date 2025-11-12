import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { AnalyticsDashboard } from './AnalyticsDashboard';
import { LeaderboardTable } from './LeaderboardTable';
import { StudentRoundsModal } from './StudentRoundsModal';
import { Trophy, Share2, Moon, Sun } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { calculateBatchMetrics, getStudentMetricsArray } from '../lib/scoring';
import type { Database } from '../lib/database.types';
import type { StudentMetrics, BatchMetrics } from '../lib/scoring';

type Leaderboard = Database['public']['Tables']['leaderboards']['Row'];
type InterviewRound = Database['public']['Tables']['interview_rounds']['Row'];

export function PublicLeaderboard() {
  const { publicId } = useParams<{ publicId: string }>();
  const { isDark, toggleTheme } = useTheme();
  const [leaderboard, setLeaderboard] = useState<Leaderboard | null>(null);
  const [rounds, setRounds] = useState<InterviewRound[]>([]);
  const [studentMetrics, setStudentMetrics] = useState<StudentMetrics[]>([]);
  const [batchMetrics, setBatchMetrics] = useState<BatchMetrics>({
    totalStudents: 0,
    totalInterviews: 0,
    averageScore: 0,
    highestIndividualScore: 0,
  });
  const [selectedStudent, setSelectedStudent] = useState<StudentMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadLeaderboard();
  }, [publicId]);

  useEffect(() => {
    if (rounds.length > 0) {
      const metrics = getStudentMetricsArray(rounds);
      setStudentMetrics(metrics);
      setBatchMetrics(calculateBatchMetrics(rounds));
    } else {
      setStudentMetrics([]);
      setBatchMetrics({
        totalStudents: 0,
        totalInterviews: 0,
        averageScore: 0,
        highestIndividualScore: 0,
      });
    }
  }, [rounds]);

  const loadLeaderboard = async () => {
    if (!publicId) {
      setError('Invalid leaderboard link');
      setLoading(false);
      return;
    }

    const { data: boardData, error: boardError } = await supabase
      .from('leaderboards')
      .select('*')
      .eq('public_id', publicId)
      .maybeSingle();

    if (boardError || !boardData) {
      setError('Leaderboard not found');
      setLoading(false);
      return;
    }

    setLeaderboard(boardData);

    const { data: roundsData } = await supabase
      .from('interview_rounds')
      .select('*')
      .eq('leaderboard_id', boardData.id)
      .order('interview_date', { ascending: false });

    if (roundsData) {
      setRounds(roundsData);
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
        <div className="text-slate-600 dark:text-slate-400">Loading leaderboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Trophy className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
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

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Trophy className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                  {leaderboard?.name}
                </h1>
              </div>
              {leaderboard?.description && (
                <p className="text-slate-600 dark:text-slate-400 ml-14">
                  {leaderboard.description}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={toggleTheme}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {isDark ? (
                  <Sun className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                ) : (
                  <Moon className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                )}
              </button>
              <button
                onClick={copyLink}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                <Share2 className="w-5 h-5" />
                <span className="hidden sm:inline">Share</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-sm text-blue-900 dark:text-blue-100">
            This is a public read-only view. Click on any student to see their interview details.
          </p>
        </div>

        <AnalyticsDashboard metrics={batchMetrics} />

        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">
            Student Leaderboard
          </h2>
          <LeaderboardTable
            students={studentMetrics}
            onStudentClick={setSelectedStudent}
            isPublic={true}
          />
        </div>

        {selectedStudent && (
          <StudentRoundsModal
            student={selectedStudent}
            rounds={rounds.filter(r => r.student_name === selectedStudent.name)}
            onClose={() => setSelectedStudent(null)}
            isPublic={true}
          />
        )}
      </main>
    </div>
  );
}
