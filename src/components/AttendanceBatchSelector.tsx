import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { AttendanceDashboard } from './AttendanceDashboard';
import { Calendar, Plus, X, Trash2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { ConfirmDialog } from './ConfirmDialog';
import { Notification } from './Notification';

interface Batch {
  id: string;
  name: string;
  description: string;
  created_at: string;
}

export function AttendanceBatchSelector() {
  const { user } = useAuth();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newBatchName, setNewBatchName] = useState('');
  const [newBatchDescription, setNewBatchDescription] = useState('');
  const [creating, setCreating] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [batchToDelete, setBatchToDelete] = useState<Batch | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'warning'; message: string } | null>(null);

  useEffect(() => {
    loadBatches();
  }, []);

  const loadBatches = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('batches')
      .select('*')
      .order('created_at', { ascending: false });

    if (data && data.length > 0) {
      setBatches(data);
      if (!selectedBatch) {
        setSelectedBatch(data[0]);
      }
    }
    setLoading(false);
  };

  const createBatch = async () => {
    if (!newBatchName.trim()) {
      alert('Please enter a batch name');
      return;
    }

    setCreating(true);

    const { data, error } = await supabase
      .from('batches')
      .insert({
        name: newBatchName.trim(),
        description: newBatchDescription.trim(),
        created_by: user?.id,
        is_active: true,
      })
      .select()
      .single();

    setCreating(false);

    if (error) {
      alert(`Failed to create batch: ${error.message}`);
      return;
    }

    if (data) {
      setBatches([data, ...batches]);
      setSelectedBatch(data);
      setShowAddModal(false);
      setNewBatchName('');
      setNewBatchDescription('');
      setNotification({ type: 'success', message: 'Batch created successfully!' });
    }
  };

  const confirmDeleteBatch = (batch: Batch) => {
    setBatchToDelete(batch);
    setShowDeleteConfirm(true);
  };

  const deleteBatch = async () => {
    if (!batchToDelete) return;

    const { error } = await supabase
      .from('batches')
      .delete()
      .eq('id', batchToDelete.id);

    if (error) {
      setNotification({ type: 'error', message: `Failed to delete batch: ${error.message}` });
      setShowDeleteConfirm(false);
      setBatchToDelete(null);
      return;
    }

    const updatedBatches = batches.filter(b => b.id !== batchToDelete.id);
    setBatches(updatedBatches);

    if (selectedBatch?.id === batchToDelete.id) {
      setSelectedBatch(updatedBatches.length > 0 ? updatedBatches[0] : null);
    }

    setNotification({ type: 'success', message: 'Batch deleted successfully!' });
    setShowDeleteConfirm(false);
    setBatchToDelete(null);
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-600 dark:text-slate-400">Loading batches...</p>
      </div>
    );
  }

  if (batches.length === 0 && !loading) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-8 text-center">
        <Calendar className="w-12 h-12 text-slate-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
          No Batches Found
        </h3>
        <p className="text-slate-600 dark:text-slate-400 mb-4">
          Create your first batch to start tracking attendance.
        </p>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition-colors inline-flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Create Batch
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-4">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Select Batch
            </label>
            <select
              value={selectedBatch?.id || ''}
              onChange={(e) => {
                const batch = batches.find(b => b.id === e.target.value);
                setSelectedBatch(batch || null);
              }}
              className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              {batches.map((batch) => (
                <option key={batch.id} value={batch.id}>
                  {batch.name}
                </option>
              ))}
            </select>
          </div>
          <div className="pt-6 flex gap-2">
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add Batch
            </button>
            {selectedBatch && (
              <button
                onClick={() => confirmDeleteBatch(selectedBatch)}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                title="Delete Batch"
              >
                <Trash2 className="w-5 h-5" />
                Delete
              </button>
            )}
          </div>
        </div>
      </div>

      {selectedBatch && (
        <AttendanceDashboard
          batchId={selectedBatch.id}
          batchName={selectedBatch.name}
          onBatchUpdate={loadBatches}
        />
      )}

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Delete Batch"
        message={`Are you sure you want to delete "${batchToDelete?.name}"? This action cannot be undone and will delete all associated data.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={deleteBatch}
        onCancel={() => {
          setShowDeleteConfirm(false);
          setBatchToDelete(null);
        }}
        isDanger
      />

      {notification && (
        <Notification
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
                Create New Batch
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-500 dark:text-slate-400" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Batch Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newBatchName}
                  onChange={(e) => setNewBatchName(e.target.value)}
                  placeholder="e.g., Morning Batch, Batch A"
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Description (Optional)
                </label>
                <textarea
                  value={newBatchDescription}
                  onChange={(e) => setNewBatchDescription(e.target.value)}
                  placeholder="Add batch details..."
                  rows={3}
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={createBatch}
                  disabled={creating}
                  className="flex-1 px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-orange-400 text-white rounded-lg font-medium transition-colors"
                >
                  {creating ? 'Creating...' : 'Create Batch'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
