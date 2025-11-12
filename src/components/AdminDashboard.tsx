import { useState, useEffect } from 'react';
import { Plus, Copy, ExternalLink, Trophy, Save, X, TrendingUp, Users, Star } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Leaderboard {
  id: string;
  name: string;
  description: string;
  public_id: string;
  created_at: string;
}

interface InterviewRound {
  id: string;
  student_name: string;
  score: number;
  interview_date: string;
  interviewer_name: string;
  feedback: string;
  round_number: number;
}

export function AdminDashboard({ hideHeader }: { hideHeader?: boolean }) {
  const { admin } = useAuth();
  const [leaderboards, setLeaderboards] = useState<Leaderboard[]>([]);
  const [selectedLeaderboard, setSelectedLeaderboard] = useState<string | null>(null);
  const [rounds, setRounds] = useState<InterviewRound[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewForm, setShowNewForm] = useState(false);
  const [newLeaderboardName, setNewLeaderboardName] = useState('');
  const [newLeaderboardDesc, setNewLeaderboardDesc] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    loadLeaderboards();
  }, []);

  useEffect(() => {
    if (selectedLeaderboard) {
      loadRounds();
    }
  }, [selectedLeaderboard]);

  const loadLeaderboards = async () => {
    try {
      const { data, error } = await supabase
        .from('leaderboards')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLeaderboards(data || []);

      if (data && data.length > 0 && !selectedLeaderboard) {
        setSelectedLeaderboard(data[0].id);
      }
    } catch (error) {
      console.error('Error loading leaderboards:', error);
      setMessage({ type: 'error', text: 'Failed to load leaderboards' });
    } finally {
      setLoading(false);
    }
  };

  const loadRounds = async () => {
    if (!selectedLeaderboard) return;

    try {
      const { data, error } = await supabase
        .from('interview_rounds')
        .select('*')
        .eq('leaderboard_id', selectedLeaderboard)
        .order('score', { ascending: false });

      if (error) throw error;
      setRounds(data || []);
    } catch (error) {
      console.error('Error loading rounds:', error);
    }
  };

  const createLeaderboard = async () => {
    if (!newLeaderboardName.trim()) {
      setMessage({ type: 'error', text: 'Please enter a leaderboard name' });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('leaderboards')
        .insert({
          name: newLeaderboardName.trim(),
          description: newLeaderboardDesc.trim(),
          created_by: admin?.id
        })
        .select()
        .single();

      if (error) throw error;

      setMessage({ type: 'success', text: 'Leaderboard created successfully!' });
      setShowNewForm(false);
      setNewLeaderboardName('');
      setNewLeaderboardDesc('');
      await loadLeaderboards();
      setSelectedLeaderboard(data.id);
    } catch (error) {
      console.error('Error creating leaderboard:', error);
      setMessage({ type: 'error', text: 'Failed to create leaderboard' });
    }
  };

  const copyPublicUrl = (publicId: string) => {
    const url = `${window.location.origin}/leaderboard/${publicId}`;
    navigator.clipboard.writeText(url);
    setMessage({ type: 'success', text: 'Public URL copied to clipboard!' });
  };

  const openPublicUrl = (publicId: string) => {
    const url = `${window.location.origin}/leaderboard/${publicId}`;
    window.open(url, '_blank');
  };

  const calculateStats = () => {
    if (rounds.length === 0) return { avg: 0, highest: 0, total: 0 };

    const scores = rounds.map(r => r.score);
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    const highest = Math.max(...scores);

    return { avg, highest, total: rounds.length };
  };

  const stats = calculateStats();
  const currentLeaderboard = leaderboards.find(l => l.id === selectedLeaderboard);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {!hideHeader && (
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Interview Leaderboard</h2>
            <p className="text-sm text-gray-600 mt-1">Track and manage interview performance</p>
          </div>
          <button
            onClick={() => setShowNewForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Leaderboard
          </button>
        </div>
      )}

      {message && (
        <div className={`p-4 rounded-lg ${
          message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
        }`}>
          {message.text}
        </div>
      )}

      {showNewForm && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Leaderboard</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Leaderboard Name
              </label>
              <input
                type="text"
                value={newLeaderboardName}
                onChange={(e) => setNewLeaderboardName(e.target.value)}
                placeholder="e.g., Q1 2025 Interviews"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description (Optional)
              </label>
              <textarea
                value={newLeaderboardDesc}
                onChange={(e) => setNewLeaderboardDesc(e.target.value)}
                placeholder="Add description..."
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={createLeaderboard}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Save className="w-4 h-4" />
                Create
              </button>
              <button
                onClick={() => {
                  setShowNewForm(false);
                  setNewLeaderboardName('');
                  setNewLeaderboardDesc('');
                }}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 space-y-2">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Leaderboards</h3>
          {leaderboards.length === 0 ? (
            <p className="text-sm text-gray-500">No leaderboards yet</p>
          ) : (
            leaderboards.map((board) => (
              <button
                key={board.id}
                onClick={() => setSelectedLeaderboard(board.id)}
                className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-colors ${
                  selectedLeaderboard === board.id
                    ? 'border-blue-500 bg-blue-50 text-blue-900'
                    : 'border-gray-200 hover:border-gray-300 text-gray-700'
                }`}
              >
                <div className="font-medium text-sm">{board.name}</div>
                {board.description && (
                  <div className="text-xs text-gray-500 mt-1 line-clamp-2">{board.description}</div>
                )}
              </button>
            ))
          )}
        </div>

        <div className="lg:col-span-3 space-y-6">
          {currentLeaderboard ? (
            <>
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{currentLeaderboard.name}</h3>
                    {currentLeaderboard.description && (
                      <p className="text-sm text-gray-600 mt-1">{currentLeaderboard.description}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => copyPublicUrl(currentLeaderboard.public_id)}
                      className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
                      title="Copy public URL"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => openPublicUrl(currentLeaderboard.public_id)}
                      className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
                      title="Open public view"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-blue-600 font-medium">Total Candidates</p>
                        <p className="text-2xl font-bold text-blue-900 mt-1">{stats.total}</p>
                      </div>
                      <Users className="w-8 h-8 text-blue-600 opacity-50" />
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-green-600 font-medium">Average Score</p>
                        <p className="text-2xl font-bold text-green-900 mt-1">{stats.avg.toFixed(1)}</p>
                      </div>
                      <TrendingUp className="w-8 h-8 text-green-600 opacity-50" />
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-yellow-600 font-medium">Highest Score</p>
                        <p className="text-2xl font-bold text-yellow-900 mt-1">{stats.highest}</p>
                      </div>
                      <Trophy className="w-8 h-8 text-yellow-600 opacity-50" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h4 className="font-semibold text-gray-900">Rankings</h4>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rank</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Candidate</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Score</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Round</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Interviewer</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {rounds.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                            <Trophy className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                            <p>No interview records yet</p>
                          </td>
                        </tr>
                      ) : (
                        rounds.map((round, index) => (
                          <tr key={round.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                {index < 3 && (
                                  <Star className={`w-4 h-4 ${
                                    index === 0 ? 'text-yellow-500' :
                                    index === 1 ? 'text-gray-400' :
                                    'text-orange-600'
                                  } fill-current`} />
                                )}
                                <span className="text-sm font-medium text-gray-900">#{index + 1}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                                  <span className="text-sm font-medium text-blue-700">
                                    {round.student_name.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                                <span className="text-sm font-medium text-gray-900">{round.student_name}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                                round.score >= 80 ? 'bg-green-100 text-green-800' :
                                round.score >= 60 ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {round.score}/100
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                              Round {round.round_number}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                              {round.interviewer_name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                              {new Date(round.interview_date).toLocaleDateString()}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
              <Trophy className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-500">Select a leaderboard to view rankings</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
