import { useState, useEffect } from 'react';
import { Calendar, Copy, Plus, RefreshCw, ExternalLink, CheckCircle, XCircle, Clock, Edit2, Check, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Batch {
  id: string;
  name: string;
  description: string;
  is_active: boolean;
}

interface AttendanceSession {
  id: string;
  session_date: string;
  session_code: string;
  session_name: string;
  batch_name: string;
  batch_id: string | null;
  is_active: boolean;
  expires_at: string;
  created_at: string;
}

export function AttendanceSessionManager() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<AttendanceSession[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showBatchForm, setShowBatchForm] = useState(false);
  const [selectedBatchId, setSelectedBatchId] = useState<string>('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    loadSessions();
    loadBatches();
  }, []);

  const loadSessions = async () => {
    try {
      const { data, error } = await supabase
        .from('attendance_sessions')
        .select('*')
        .order('session_date', { ascending: false })
        .limit(10);

      if (error) throw error;
      setSessions(data || []);
    } catch (error) {
      console.error('Error loading sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadBatches = async () => {
    try {
      const { data, error } = await supabase
        .from('batches')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (error) throw error;
      setBatches(data || []);

      if (data && data.length > 0 && !selectedBatchId) {
        setSelectedBatchId(data[0].id);
      }
    } catch (error) {
      console.error('Error loading batches:', error);
    }
  };

  const createTodaySession = async () => {
    if (!selectedBatchId) {
      setMessage({ type: 'error', text: 'Please select a batch' });
      return;
    }

    setCreating(true);
    setMessage(null);

    try {
      const selectedBatch = batches.find(b => b.id === selectedBatchId);
      if (!selectedBatch) {
        setMessage({ type: 'error', text: 'Selected batch not found' });
        return;
      }

      const today = new Date().toISOString().split('T')[0];
      const sessionCode = `attend-${selectedBatchId.substring(0, 8)}-${today}`;
      const expiresAt = new Date();
      expiresAt.setHours(23, 59, 59, 999);

      const sessionName = `${selectedBatch.name} - ${new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })}`;

      const { error } = await supabase
        .from('attendance_sessions')
        .insert({
          session_date: today,
          session_code: sessionCode,
          session_name: sessionName,
          batch_name: selectedBatch.name,
          batch_id: selectedBatchId,
          is_active: true,
          expires_at: expiresAt.toISOString(),
          created_by: user?.id
        });

      if (error) {
        if (error.code === '23505') {
          setMessage({ type: 'error', text: 'Attendance session for this batch today already exists!' });
        } else {
          throw error;
        }
      } else {
        setMessage({ type: 'success', text: 'Attendance session created successfully!' });
        setShowBatchForm(false);
        await loadSessions();
      }
    } catch (error) {
      console.error('Error creating session:', error);
      setMessage({ type: 'error', text: 'Failed to create attendance session' });
    } finally {
      setCreating(false);
    }
  };

  const startEdit = (session: AttendanceSession) => {
    setEditingId(session.id);
    setEditName(session.session_name);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName('');
  };

  const saveEdit = async (sessionId: string) => {
    if (!editName.trim()) {
      setMessage({ type: 'error', text: 'Session name cannot be empty' });
      return;
    }

    try {
      const { error } = await supabase
        .from('attendance_sessions')
        .update({ session_name: editName.trim() })
        .eq('id', sessionId);

      if (error) throw error;

      setMessage({ type: 'success', text: '✅ Session name updated successfully!' });
      setEditingId(null);
      setEditName('');
      await loadSessions();
    } catch (error) {
      console.error('Error updating session name:', error);
      setMessage({ type: 'error', text: 'Failed to update session name' });
    }
  };

  const toggleSessionStatus = async (sessionId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('attendance_sessions')
        .update({ is_active: !currentStatus })
        .eq('id', sessionId);

      if (error) throw error;

      setMessage({
        type: 'success',
        text: `Session ${!currentStatus ? 'activated' : 'deactivated'} successfully!`
      });
      await loadSessions();
    } catch (error) {
      console.error('Error updating session:', error);
      setMessage({ type: 'error', text: 'Failed to update session status' });
    }
  };

  const copyAttendanceUrl = (sessionCode: string) => {
    const url = `${window.location.origin}/attend/${sessionCode}`;
    navigator.clipboard.writeText(url);
    setMessage({ type: 'success', text: 'Attendance URL copied to clipboard!' });
  };

  const openAttendanceUrl = (sessionCode: string) => {
    const url = `${window.location.origin}/attend/${sessionCode}`;
    window.open(url, '_blank');
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const todaySession = sessions.find(s => s.session_date === new Date().toISOString().split('T')[0]);

  return (
    <div className="space-y-6">
      {message && (
        <div className={`p-4 rounded-lg ${
          message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
        }`}>
          {message.text}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Today's Attendance Session</h3>
            <p className="text-sm text-gray-600 mt-1">Create and manage daily attendance tracking</p>
          </div>
          <button
            onClick={() => setShowBatchForm(!showBatchForm)}
            disabled={creating || !!todaySession}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            <Plus className="w-4 h-4" />
            {todaySession ? 'Session Exists' : 'Create Today\'s Session'}
          </button>
        </div>

        {showBatchForm && !todaySession && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Select Batch for Attendance</h4>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Batch
                </label>
                {batches.length === 0 ? (
                  <div className="text-sm text-gray-500 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    No active batches available. Please create a batch first in the Batches tab.
                  </div>
                ) : (
                  <select
                    value={selectedBatchId}
                    onChange={(e) => setSelectedBatchId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {batches.map((batch) => (
                      <option key={batch.id} value={batch.id}>
                        {batch.name} {batch.description && `- ${batch.description}`}
                      </option>
                    ))}
                  </select>
                )}
                <p className="text-xs text-gray-500 mt-1">Select which batch this attendance session is for</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={createTodaySession}
                  disabled={creating || batches.length === 0}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
                >
                  {creating ? 'Creating...' : 'Create Session'}
                </button>
                <button
                  onClick={() => {
                    setShowBatchForm(false);
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {todaySession && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  {editingId === todaySession.id ? (
                    <div className="flex items-center gap-2 flex-1">
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="flex-1 px-3 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                        autoFocus
                      />
                      <button
                        onClick={() => saveEdit(todaySession.id)}
                        className="p-1 text-green-600 hover:bg-green-100 rounded"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="p-1 text-red-600 hover:bg-red-100 rounded"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <Calendar className="w-5 h-5 text-blue-600" />
                      <span className="font-medium text-gray-900">{todaySession.session_name}</span>
                      <button
                        onClick={() => startEdit(todaySession)}
                        className="p-1 text-gray-600 hover:bg-blue-100 rounded"
                        title="Edit session name"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                  {todaySession.is_active && !isExpired(todaySession.expires_at) ? (
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      Active
                    </span>
                  ) : (
                    <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs font-medium rounded-full flex items-center gap-1">
                      <XCircle className="w-3 h-3" />
                      Inactive
                    </span>
                  )}
                </div>
                <div className="text-sm text-gray-600 mb-1">
                  {formatDate(todaySession.session_date)}
                </div>
                <div className="text-sm text-gray-600 mb-1">
                  <span className="font-medium">Batch:</span> {todaySession.batch_name || 'Default Batch'}
                </div>
                <div className="text-sm text-gray-600 mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Expires: {formatTime(todaySession.expires_at)}
                </div>
                <div className="bg-white border border-gray-200 rounded p-3 mb-3">
                  <p className="text-xs text-gray-500 mb-1">Attendance URL:</p>
                  <code className="text-sm text-blue-600 break-all">
                    {window.location.origin}/attend/{todaySession.session_code}
                  </code>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => copyAttendanceUrl(todaySession.session_code)}
                className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors text-sm"
              >
                <Copy className="w-4 h-4" />
                Copy URL
              </button>
              <button
                onClick={() => openAttendanceUrl(todaySession.session_code)}
                className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors text-sm"
              >
                <ExternalLink className="w-4 h-4" />
                Open
              </button>
              <button
                onClick={() => toggleSessionStatus(todaySession.id, todaySession.is_active)}
                className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors text-sm"
              >
                <RefreshCw className="w-4 h-4" />
                {todaySession.is_active ? 'Deactivate' : 'Activate'}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Recent Sessions</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {sessions.length === 0 ? (
            <div className="px-6 py-12 text-center text-gray-500">
              No attendance sessions created yet
            </div>
          ) : (
            sessions.map((session) => (
              <div key={session.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      {editingId === session.id ? (
                        <div className="flex items-center gap-2 flex-1">
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="flex-1 px-3 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                            autoFocus
                          />
                          <button
                            onClick={() => saveEdit(session.id)}
                            className="p-1 text-green-600 hover:bg-green-100 rounded"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="p-1 text-red-600 hover:bg-red-100 rounded"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <span className="font-medium text-gray-900">{session.session_name}</span>
                          <button
                            onClick={() => startEdit(session)}
                            className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                            title="Edit session name"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      {session.is_active && !isExpired(session.expires_at) ? (
                        <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                          Active
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-800 text-xs font-medium rounded-full">
                          {isExpired(session.expires_at) ? 'Expired' : 'Inactive'}
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-600">
                      {formatDate(session.session_date)} • Code: <code className="text-xs bg-gray-100 px-2 py-0.5 rounded">{session.session_code}</code>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => copyAttendanceUrl(session.session_code)}
                      className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
                      title="Copy URL"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => openAttendanceUrl(session.session_code)}
                      className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
                      title="Open URL"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
