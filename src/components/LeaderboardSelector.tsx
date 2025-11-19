import { useState } from 'react';
import { Plus, Trash2, LayoutList } from 'lucide-react';
import { useRole } from '../hooks/useRole';
import type { Database } from '../lib/database.types';

type Leaderboard = Database['public']['Tables']['leaderboards']['Row'];

interface LeaderboardSelectorProps {
  leaderboards: Leaderboard[];
  selectedLeaderboard: Leaderboard | null;
  onSelect: (leaderboard: Leaderboard) => void;
  onCreate: (name: string, description: string) => void;
  onDelete: (id: string) => void;
}

export function LeaderboardSelector({
  leaderboards,
  selectedLeaderboard,
  onSelect,
  onCreate,
  onDelete,
}: LeaderboardSelectorProps) {
  const { canCreate, canDelete } = useRole();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const handleCreate = () => {
    if (!name.trim()) return;

    onCreate(name, description);
    setName('');
    setDescription('');
    setShowCreateForm(false);
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <LayoutList className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            Leaderboards
          </h2>
        </div>
        {canCreate && (
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Board
          </button>
        )}
      </div>

      {showCreateForm && (
        <div className="mb-4 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg space-y-3">
          <input
            type="text"
            placeholder="Leaderboard name (e.g., Batch 2024 Spring)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <input
            type="text"
            placeholder="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <div className="flex gap-2">
            <button
              onClick={handleCreate}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
            >
              Create
            </button>
            <button
              onClick={() => {
                setShowCreateForm(false);
                setName('');
                setDescription('');
              }}
              className="px-4 py-2 bg-slate-200 dark:bg-slate-600 hover:bg-slate-300 dark:hover:bg-slate-500 text-slate-700 dark:text-slate-200 text-sm rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {leaderboards.length === 0 ? (
        <p className="text-sm text-slate-600 dark:text-slate-400">
          No leaderboards yet. Create one to get started.
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {leaderboards.map((board) => (
            <div
              key={board.id}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                selectedLeaderboard?.id === board.id
                  ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700'
                  : 'bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500'
              }`}
            >
              <button
                onClick={() => onSelect(board)}
                className="text-sm font-medium text-slate-900 dark:text-white"
              >
                {board.name}
              </button>
              {canDelete && (
                <button
                  onClick={() => onDelete(board.id)}
                  className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
                >
                  <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
