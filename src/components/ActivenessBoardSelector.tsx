import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { ActivenessBoardManager } from './ActivenessBoardManager';
import { Plus, Trash2, ChevronDown } from 'lucide-react';
import type { Database } from '../lib/database.types';

type ActivenessBoard = Database['public']['Tables']['activeness_boards']['Row'];

export function ActivenessBoardSelector() {
  const { admin } = useAuth();
  const [boards, setBoards] = useState<ActivenessBoard[]>([]);
  const [selectedBoard, setSelectedBoard] = useState<ActivenessBoard | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newBoardName, setNewBoardName] = useState('');
  const [newBoardDescription, setNewBoardDescription] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBoards();
  }, []);

  const loadBoards = async () => {
    setLoading(false);

    const { data } = await supabase
      .from('activeness_boards')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) {
      setBoards(data);
      if (data.length > 0 && !selectedBoard) {
        setSelectedBoard(data[0]);
      }
    }
  };

  const handleCreateBoard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!admin || !newBoardName.trim()) return;

    const { data } = await supabase
      .from('activeness_boards')
      .insert({
        name: newBoardName,
        description: newBoardDescription,
        created_by: admin.id,
      })
      .select()
      .single();

    if (data) {
      setBoards([data, ...boards]);
      setSelectedBoard(data);
      setShowCreateForm(false);
      setNewBoardName('');
      setNewBoardDescription('');
    }
  };

  const handleDeleteBoard = async (id: string) => {
    if (!confirm('Delete this activeness board? All module scores will be removed.')) return;

    await supabase.from('activeness_boards').delete().eq('id', id);
    const newBoards = boards.filter(b => b.id !== id);
    setBoards(newBoards);
    setSelectedBoard(newBoards[0] || null);
  };

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Select Activeness Board
          </h2>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5" />
            New Board
          </button>
        </div>

        {showCreateForm && (
          <form onSubmit={handleCreateBoard} className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4 mb-4">
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Board Name *
                </label>
                <input
                  type="text"
                  required
                  value={newBoardName}
                  onChange={(e) => setNewBoardName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="e.g., Batch 2025 - Zoom Activeness"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={newBoardDescription}
                  onChange={(e) => setNewBoardDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Optional description"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                >
                  Create Board
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </form>
        )}

        {boards.length > 0 && (
          <div className="relative">
            <select
              value={selectedBoard?.id || ''}
              onChange={(e) => setSelectedBoard(boards.find(b => b.id === e.target.value) || null)}
              className="w-full px-4 py-3 pr-10 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent appearance-none"
            >
              {boards.map(board => (
                <option key={board.id} value={board.id}>
                  {board.name}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
          </div>
        )}

        {selectedBoard && (
          <div className="mt-3 flex items-center justify-between p-3 bg-slate-100 dark:bg-slate-700 rounded-lg">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {selectedBoard.description || 'No description'}
            </p>
            <button
              onClick={() => handleDeleteBoard(selectedBoard.id)}
              className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
              title="Delete board"
            >
              <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
            </button>
          </div>
        )}
      </div>

      <ActivenessBoardManager selectedBoard={selectedBoard} />
    </div>
  );
}
