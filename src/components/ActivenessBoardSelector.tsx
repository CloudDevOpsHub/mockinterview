import { useState, useEffect } from 'react';
import { Plus, Copy, ExternalLink, Activity, TrendingUp, Users, BarChart3, Award } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface ActivenessBoard {
  id: string;
  name: string;
  description: string;
  public_id: string;
  created_at: string;
}

interface ModuleScore {
  id: string;
  student_name: string;
  module_number: number;
  activeness_score: number;
  notes: string;
  recorded_date: string;
}

export function ActivenessBoardSelector() {
  const { admin } = useAuth();
  const [boards, setBoards] = useState<ActivenessBoard[]>([]);
  const [selectedBoard, setSelectedBoard] = useState<string | null>(null);
  const [scores, setScores] = useState<ModuleScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewForm, setShowNewForm] = useState(false);
  const [newBoardName, setNewBoardName] = useState('');
  const [newBoardDesc, setNewBoardDesc] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    loadBoards();
  }, []);

  useEffect(() => {
    if (selectedBoard) {
      loadScores();
    }
  }, [selectedBoard]);

  const loadBoards = async () => {
    try {
      const { data, error } = await supabase
        .from('activeness_boards')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBoards(data || []);

      if (data && data.length > 0 && !selectedBoard) {
        setSelectedBoard(data[0].id);
      }
    } catch (error) {
      console.error('Error loading boards:', error);
      setMessage({ type: 'error', text: 'Failed to load activeness boards' });
    } finally {
      setLoading(false);
    }
  };

  const loadScores = async () => {
    if (!selectedBoard) return;

    try {
      const { data, error } = await supabase
        .from('module_scores')
        .select('*')
        .eq('board_id', selectedBoard)
        .order('activeness_score', { ascending: false });

      if (error) throw error;
      setScores(data || []);
    } catch (error) {
      console.error('Error loading scores:', error);
    }
  };

  const createBoard = async () => {
    if (!newBoardName.trim()) {
      setMessage({ type: 'error', text: 'Please enter a board name' });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('activeness_boards')
        .insert({
          name: newBoardName.trim(),
          description: newBoardDesc.trim(),
          created_by: admin?.id
        })
        .select()
        .single();

      if (error) throw error;

      setMessage({ type: 'success', text: 'Activeness board created successfully!' });
      setShowNewForm(false);
      setNewBoardName('');
      setNewBoardDesc('');
      await loadBoards();
      setSelectedBoard(data.id);
    } catch (error) {
      console.error('Error creating board:', error);
      setMessage({ type: 'error', text: 'Failed to create activeness board' });
    }
  };

  const copyPublicUrl = (publicId: string) => {
    const url = `${window.location.origin}/activeness/${publicId}`;
    navigator.clipboard.writeText(url);
    setMessage({ type: 'success', text: 'Public URL copied to clipboard!' });
  };

  const openPublicUrl = (publicId: string) => {
    const url = `${window.location.origin}/activeness/${publicId}`;
    window.open(url, '_blank');
  };

  const calculateStats = () => {
    if (scores.length === 0) return { avg: 0, highest: 0, total: 0, totalModules: 0 };

    const avgScore = scores.reduce((sum, s) => sum + s.activeness_score, 0) / scores.length;
    const highest = Math.max(...scores.map(s => s.activeness_score));
    const uniqueStudents = new Set(scores.map(s => s.student_name)).size;
    const uniqueModules = new Set(scores.map(s => s.module_number)).size;

    return { avg: avgScore, highest, total: uniqueStudents, totalModules: uniqueModules };
  };

  const stats = calculateStats();
  const currentBoard = boards.find(b => b.id === selectedBoard);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Zoom Activeness Board</h2>
          <p className="text-sm text-gray-600 mt-1">Track student participation and engagement</p>
        </div>
        <button
          onClick={() => setShowNewForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Board
        </button>
      </div>

      {message && (
        <div className={`p-4 rounded-lg ${
          message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
        }`}>
          {message.text}
        </div>
      )}

      {showNewForm && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Activeness Board</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Board Name
              </label>
              <input
                type="text"
                value={newBoardName}
                onChange={(e) => setNewBoardName(e.target.value)}
                placeholder="e.g., Module 5 - AWS Basics"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description (Optional)
              </label>
              <textarea
                value={newBoardDesc}
                onChange={(e) => setNewBoardDesc(e.target.value)}
                placeholder="Add description..."
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={createBoard}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <Plus className="w-4 h-4" />
                Create
              </button>
              <button
                onClick={() => {
                  setShowNewForm(false);
                  setNewBoardName('');
                  setNewBoardDesc('');
                }}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 space-y-2">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Boards</h3>
          {boards.length === 0 ? (
            <p className="text-sm text-gray-500">No boards yet</p>
          ) : (
            boards.map((board) => (
              <button
                key={board.id}
                onClick={() => setSelectedBoard(board.id)}
                className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-colors ${
                  selectedBoard === board.id
                    ? 'border-green-500 bg-green-50 text-green-900'
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
          {currentBoard ? (
            <>
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{currentBoard.name}</h3>
                    {currentBoard.description && (
                      <p className="text-sm text-gray-600 mt-1">{currentBoard.description}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => copyPublicUrl(currentBoard.public_id)}
                      className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
                      title="Copy public URL"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => openPublicUrl(currentBoard.public_id)}
                      className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
                      title="Open public view"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-4">
                  <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-green-600 font-medium">Total Students</p>
                        <p className="text-2xl font-bold text-green-900 mt-1">{stats.total}</p>
                      </div>
                      <Users className="w-8 h-8 text-green-600 opacity-50" />
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-blue-600 font-medium">Modules</p>
                        <p className="text-2xl font-bold text-blue-900 mt-1">{stats.totalModules}</p>
                      </div>
                      <BarChart3 className="w-8 h-8 text-blue-600 opacity-50" />
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-purple-600 font-medium">Avg Score</p>
                        <p className="text-2xl font-bold text-purple-900 mt-1">{stats.avg.toFixed(1)}/10</p>
                      </div>
                      <TrendingUp className="w-8 h-8 text-purple-600 opacity-50" />
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-yellow-600 font-medium">Highest</p>
                        <p className="text-2xl font-bold text-yellow-900 mt-1">{stats.highest}/10</p>
                      </div>
                      <Award className="w-8 h-8 text-yellow-600 opacity-50" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h4 className="font-semibold text-gray-900">Activeness Scores</h4>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rank</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Module</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Score</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {scores.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                            <Activity className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                            <p>No activeness records yet</p>
                          </td>
                        </tr>
                      ) : (
                        scores.map((score, index) => (
                          <tr key={score.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="text-sm font-medium text-gray-900">#{index + 1}</span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                                  <span className="text-sm font-medium text-green-700">
                                    {score.student_name.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                                <span className="text-sm font-medium text-gray-900">{score.student_name}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                                Module {score.module_number}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <div className="w-24 bg-gray-200 rounded-full h-2">
                                  <div
                                    className={`h-2 rounded-full ${
                                      score.activeness_score >= 8 ? 'bg-green-500' :
                                      score.activeness_score >= 5 ? 'bg-yellow-500' :
                                      'bg-red-500'
                                    }`}
                                    style={{ width: `${(score.activeness_score / 10) * 100}%` }}
                                  />
                                </div>
                                <span className="text-sm font-semibold text-gray-900">
                                  {score.activeness_score}/10
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                              {new Date(score.recorded_date).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                              {score.notes || '-'}
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
              <Activity className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-500">Select a board to view activeness scores</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
