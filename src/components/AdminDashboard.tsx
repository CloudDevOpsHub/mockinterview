import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { AnalyticsDashboard } from './AnalyticsDashboard';
import { LeaderboardTable } from './LeaderboardTable';
import { StudentRoundsModal } from './StudentRoundsModal';
import { InterviewRoundForm } from './InterviewRoundForm';
import { LeaderboardSelector } from './LeaderboardSelector';
import { LogOut, Plus, Download, Upload, Share2, Moon, Sun } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { calculateBatchMetrics, getStudentMetricsArray } from '../lib/scoring';
import type { Database } from '../lib/database.types';
import type { StudentMetrics, BatchMetrics } from '../lib/scoring';

type Leaderboard = Database['public']['Tables']['leaderboards']['Row'];
type InterviewRound = Database['public']['Tables']['interview_rounds']['Row'];

interface AdminDashboardProps {
  hideHeader?: boolean;
}

export function AdminDashboard({ hideHeader = false }: AdminDashboardProps) {
  const { admin, signOut } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [leaderboards, setLeaderboards] = useState<Leaderboard[]>([]);
  const [selectedLeaderboard, setSelectedLeaderboard] = useState<Leaderboard | null>(null);
  const [rounds, setRounds] = useState<InterviewRound[]>([]);
  const [studentMetrics, setStudentMetrics] = useState<StudentMetrics[]>([]);
  const [batchMetrics, setBatchMetrics] = useState<BatchMetrics>({
    totalStudents: 0,
    totalInterviews: 0,
    averageScore: 0,
    highestIndividualScore: 0,
  });
  const [selectedStudent, setSelectedStudent] = useState<StudentMetrics | null>(null);
  const [showRoundForm, setShowRoundForm] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeaderboards();
  }, []);

  useEffect(() => {
    if (selectedLeaderboard) {
      loadRounds(selectedLeaderboard.id);
    }
  }, [selectedLeaderboard]);

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

  const loadLeaderboards = async () => {
    setLoading(false);

    const { data } = await supabase
      .from('leaderboards')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) {
      setLeaderboards(data);
      if (data.length > 0 && !selectedLeaderboard) {
        setSelectedLeaderboard(data[0]);
      }
    }
  };

  const loadRounds = async (leaderboardId: string) => {
    const { data } = await supabase
      .from('interview_rounds')
      .select('*')
      .eq('leaderboard_id', leaderboardId)
      .order('interview_date', { ascending: false });

    if (data) {
      setRounds(data);
    }
  };

  const handleCreateLeaderboard = async (name: string, description: string) => {
    if (!admin) return;

    const { data } = await supabase
      .from('leaderboards')
      .insert({
        name,
        description,
        created_by: admin.id,
      })
      .select()
      .single();

    if (data) {
      setLeaderboards([data, ...leaderboards]);
      setSelectedLeaderboard(data);
    }
  };

  const handleDeleteLeaderboard = async (id: string) => {
    if (!confirm('Delete this leaderboard? All interview data will be removed.')) return;

    await supabase.from('leaderboards').delete().eq('id', id);
    const newLeaderboards = leaderboards.filter(l => l.id !== id);
    setLeaderboards(newLeaderboards);
    setSelectedLeaderboard(newLeaderboards[0] || null);
  };

  const handleSaveRound = async (roundData: Omit<InterviewRound, 'id' | 'leaderboard_id' | 'created_at' | 'updated_at'>) => {
    if (!selectedLeaderboard) return;

    const { data } = await supabase
      .from('interview_rounds')
      .insert({
        ...roundData,
        leaderboard_id: selectedLeaderboard.id,
      })
      .select()
      .single();

    if (data) {
      setRounds([...rounds, data]);
      setShowRoundForm(false);
    }
  };

  const handleDeleteRound = async (roundId: string) => {
    await supabase.from('interview_rounds').delete().eq('id', roundId);
    setRounds(rounds.filter(r => r.id !== roundId));
  };

  const handleExport = () => {
    if (!selectedLeaderboard) return;

    const dataStr = JSON.stringify({
      leaderboard: selectedLeaderboard,
      rounds: rounds,
    }, null, 2);

    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const fileName = `${selectedLeaderboard.name.replace(/\s+/g, '_')}_rounds.json`;

    const link = document.createElement('a');
    link.setAttribute('href', dataUri);
    link.setAttribute('download', fileName);
    link.click();
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedLeaderboard) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);

        if (json.rounds && Array.isArray(json.rounds)) {
          for (const round of json.rounds) {
            await supabase.from('interview_rounds').insert({
              leaderboard_id: selectedLeaderboard.id,
              student_name: round.student_name,
              round_number: round.round_number || 1,
              score: round.score || 5,
              interview_date: round.interview_date,
              interviewer_name: round.interviewer_name || '',
              strengths: round.strengths || '',
              weaknesses: round.weaknesses || '',
              feedback: round.feedback || '',
              notes: round.notes || '',
            });
          }

          loadRounds(selectedLeaderboard.id);
          alert('Import successful!');
        }
      } catch (error) {
        alert('Failed to import file. Please check the format.');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const copyPublicLink = () => {
    if (!selectedLeaderboard) return;
    const url = `${window.location.origin}/public/${selectedLeaderboard.public_id}`;
    navigator.clipboard.writeText(url);
    alert('Public link copied!');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-slate-600 dark:text-slate-400">Loading...</div>
      </div>
    );
  }

  const selectedStudentRounds = selectedStudent
    ? rounds.filter(r => r.student_name === selectedStudent.name)
    : [];

  const content = (
    <div>
      {!hideHeader && (
        <div className="mb-6">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">
            Interview Leaderboard
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Manage student interview rounds and scores
          </p>
        </div>
      )}
        <div className="mb-6">
          <LeaderboardSelector
            leaderboards={leaderboards}
            selectedLeaderboard={selectedLeaderboard}
            onSelect={setSelectedLeaderboard}
            onCreate={handleCreateLeaderboard}
            onDelete={handleDeleteLeaderboard}
          />
        </div>

        {selectedLeaderboard && (
          <>
            <div className="mb-6 flex flex-wrap gap-3">
              <button
                onClick={() => setShowRoundForm(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                <Plus className="w-5 h-5" />
                Record Interview
              </button>
              <button
                onClick={copyPublicLink}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
              >
                <Share2 className="w-5 h-5" />
                Copy Public Link
              </button>
              <button
                onClick={handleExport}
                className="flex items-center gap-2 px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg transition-colors"
              >
                <Download className="w-5 h-5" />
                Export
              </button>
              <label className="flex items-center gap-2 px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg transition-colors cursor-pointer">
                <Upload className="w-5 h-5" />
                Import
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  className="hidden"
                />
              </label>
            </div>

            <AnalyticsDashboard metrics={batchMetrics} />

            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">
                Student Leaderboard
              </h2>
              <LeaderboardTable
                students={studentMetrics}
                onStudentClick={setSelectedStudent}
              />
            </div>
          </>
        )}

        {showRoundForm && selectedLeaderboard && (
          <InterviewRoundForm
            leaderboardId={selectedLeaderboard.id}
            onSave={handleSaveRound}
            onClose={() => setShowRoundForm(false)}
          />
        )}

        {selectedStudent && (
          <StudentRoundsModal
            student={selectedStudent}
            rounds={selectedStudentRounds}
            onClose={() => setSelectedStudent(null)}
            onDeleteRound={handleDeleteRound}
          />
        )}
      </div>
  );

  if (hideHeader) {
    return content;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                Interview Leaderboard
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Welcome, {admin?.name}
              </p>
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
                onClick={() => signOut()}
                className="flex items-center gap-2 px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                <LogOut className="w-5 h-5" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {content}
      </main>
    </div>
  );
}
