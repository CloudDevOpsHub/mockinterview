import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Calendar, Users, CheckCircle, XCircle, Clock, Edit2, Save, X, Copy, ExternalLink, Share2, Trash2 } from 'lucide-react';
import { AttendanceCalendar } from './AttendanceCalendar';
import { AttendanceAnalytics } from './AttendanceAnalytics';
import { useAuth } from '../contexts/AuthContext';
import { useRole } from '../hooks/useRole';
import { ConfirmDialog } from './ConfirmDialog';
import { Notification } from './Notification';

interface AttendanceSession {
  id: string;
  session_name: string;
  session_date: string;
  session_code: string;
  is_active: boolean;
  expires_at: string;
  batch_name: string;
  created_at: string;
}

interface AttendanceRecord {
  id: string;
  student_name: string;
  student_email: string | null;
  marked_at: string;
  status: string;
}

interface AttendanceDashboardProps {
  batchId: string;
  batchName: string;
  onBatchUpdate?: () => void;
}

export function AttendanceDashboard({ batchId, batchName, onBatchUpdate }: AttendanceDashboardProps) {
  const { user } = useAuth();
  const { canCreate, canEdit, canDelete } = useRole();
  const [sessions, setSessions] = useState<AttendanceSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<AttendanceSession | null>(null);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editedName, setEditedName] = useState('');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [publicUrl, setPublicUrl] = useState<string>('');
  const [loadingPublicUrl, setLoadingPublicUrl] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<AttendanceSession | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'warning'; message: string } | null>(null);

  useEffect(() => {
    loadSessions();
    loadPublicUrl();
  }, [batchId]);

  useEffect(() => {
    if (selectedSession) {
      loadRecords(selectedSession.id);
    }
  }, [selectedSession]);

  const loadSessions = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('attendance_sessions')
      .select('*')
      .eq('batch_name', batchName)
      .order('session_date', { ascending: false });

    if (data) {
      setSessions(data);
      if (data.length > 0 && !selectedSession) {
        setSelectedSession(data[0]);
      }
    }
    setLoading(false);
  };

  const loadRecords = async (sessionId: string) => {
    const { data } = await supabase
      .from('attendance_records')
      .select('*')
      .eq('session_id', sessionId)
      .order('marked_at', { ascending: false });

    if (data) {
      setRecords(data);
    }
  };

  const createNewSession = async () => {
    const today = new Date().toISOString().split('T')[0];
    const sessionCode = `attend-${batchName.toLowerCase()}-${Date.now()}`;
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    const { data, error } = await supabase
      .from('attendance_sessions')
      .insert({
        session_name: `${batchName} - ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`,
        session_date: today,
        session_code: sessionCode,
        batch_name: batchName,
        expires_at: expiresAt.toISOString(),
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      alert(`Failed to create session: ${error.message}`);
      return;
    }

    if (data) {
      setSessions([data, ...sessions]);
      setSelectedSession(data);
      setNotification({ type: 'success', message: 'Session created successfully!' });
    }
  };

  const updateSessionName = async (sessionId: string, newName: string) => {
    const { error } = await supabase
      .from('attendance_sessions')
      .update({ session_name: newName })
      .eq('id', sessionId);

    if (error) {
      alert(`Failed to update session name: ${error.message}`);
      return;
    }

    setSessions(sessions.map(s => s.id === sessionId ? { ...s, session_name: newName } : s));
    if (selectedSession?.id === sessionId) {
      setSelectedSession({ ...selectedSession, session_name: newName });
    }
    setEditingSessionId(null);
  };

  const startEditingSession = (session: AttendanceSession) => {
    setEditingSessionId(session.id);
    setEditedName(session.session_name);
  };

  const copyPublicUrl = (sessionCode: string) => {
    const url = `${window.location.origin}/attend/${sessionCode}`;
    navigator.clipboard.writeText(url);
    alert('Attendance URL copied to clipboard!');
  };

  const openPublicUrl = (sessionCode: string) => {
    const url = `${window.location.origin}/attend/${sessionCode}`;
    window.open(url, '_blank');
  };

  const loadPublicUrl = async () => {
    setLoadingPublicUrl(true);
    const { data } = await supabase
      .from('batch_public_urls')
      .select('public_id')
      .eq('batch_id', batchId)
      .eq('url_type', 'permanent')
      .eq('is_active', true)
      .maybeSingle();

    if (data) {
      setPublicUrl(`${window.location.origin}/attendance/${data.public_id}`);
    }
    setLoadingPublicUrl(false);
  };

  const generatePublicUrl = async () => {
    const publicId = `batch-${batchName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;

    const { data, error } = await supabase
      .from('batch_public_urls')
      .insert({
        batch_id: batchId,
        public_id: publicId,
        url_type: 'permanent',
        is_active: true,
        expires_at: null,
        created_by: user?.id,
      })
      .select()
      .single();

    if (error) {
      alert(`Failed to generate public URL: ${error.message}`);
      return;
    }

    if (data) {
      const url = `${window.location.origin}/attendance/${publicId}`;
      setPublicUrl(url);
      alert('Permanent public URL generated successfully!');
    }
  };

  const copyBatchPublicUrl = () => {
    if (publicUrl) {
      navigator.clipboard.writeText(publicUrl);
      alert('Batch dashboard URL copied to clipboard!');
    }
  };

  const openBatchPublicUrl = () => {
    if (publicUrl) {
      window.open(publicUrl, '_blank');
    }
  };

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    const session = sessions.find(s => s.session_date === date);
    if (session) {
      setSelectedSession(session);
    }
  };

  const confirmDeleteSession = (session: AttendanceSession) => {
    setSessionToDelete(session);
    setShowDeleteConfirm(true);
  };

  const deleteSession = async () => {
    if (!sessionToDelete) return;

    const { error } = await supabase
      .from('attendance_sessions')
      .delete()
      .eq('id', sessionToDelete.id);

    if (error) {
      setNotification({ type: 'error', message: `Failed to delete session: ${error.message}` });
      setShowDeleteConfirm(false);
      setSessionToDelete(null);
      return;
    }

    const updatedSessions = sessions.filter(s => s.id !== sessionToDelete.id);
    setSessions(updatedSessions);

    if (selectedSession?.id === sessionToDelete.id) {
      setSelectedSession(updatedSessions.length > 0 ? updatedSessions[0] : null);
    }

    setNotification({ type: 'success', message: 'Session deleted successfully!' });
    setShowDeleteConfirm(false);
    setSessionToDelete(null);
  };

  const isExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date();
  };

  const presentCount = records.filter(r => r.status === 'present').length;
  const totalCount = records.length;
  const attendancePercentage = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Attendance Dashboard - {batchName}
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Manage daily attendance sessions and track student participation
          </p>
        </div>
        <button
          onClick={createNewSession}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
        >
          <Calendar className="w-5 h-5" />
          Create New Session
        </button>
      </div>

      <div className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 rounded-xl border border-orange-200 dark:border-orange-800 p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Share2 className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                Student Dashboard
              </h3>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
              Share this permanent URL with students to view their attendance status, sessions attended, and missed sessions in real-time.
            </p>
            {loadingPublicUrl ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">Loading...</p>
            ) : publicUrl ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={publicUrl}
                  readOnly
                  className="flex-1 px-3 py-2 text-sm rounded-lg border border-orange-200 dark:border-orange-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
                <button
                  onClick={copyBatchPublicUrl}
                  className="p-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors"
                  title="Copy URL"
                >
                  <Copy className="w-4 h-4" />
                </button>
                <button
                  onClick={openBatchPublicUrl}
                  className="p-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors"
                  title="Open URL"
                >
                  <ExternalLink className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={generatePublicUrl}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <Share2 className="w-4 h-4" />
                Generate Student Dashboard URL
              </button>
            )}
          </div>
        </div>
      </div>

      <AttendanceAnalytics
        presentCount={presentCount}
        totalCount={totalCount}
        attendancePercentage={attendancePercentage}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Attendance Sessions
          </h3>
          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {loading ? (
              <p className="text-slate-500 dark:text-slate-400 text-center py-8">Loading sessions...</p>
            ) : sessions.length === 0 ? (
              <p className="text-slate-500 dark:text-slate-400 text-center py-8">No sessions yet. Create one to get started!</p>
            ) : (
              sessions.map((session) => (
                <div
                  key={session.id}
                  className={`p-4 rounded-lg border transition-all cursor-pointer ${
                    selectedSession?.id === session.id
                      ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700'
                      : 'bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600 hover:border-blue-300 dark:hover:border-blue-700'
                  }`}
                  onClick={() => setSelectedSession(session)}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    {editingSessionId === session.id ? (
                      <div className="flex-1 flex items-center gap-2">
                        <input
                          type="text"
                          value={editedName}
                          onChange={(e) => setEditedName(e.target.value)}
                          className="flex-1 px-2 py-1 text-sm rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                          onClick={(e) => e.stopPropagation()}
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            updateSessionName(session.id, editedName);
                          }}
                          className="p-1 text-green-600 hover:text-green-700"
                        >
                          <Save className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingSessionId(null);
                          }}
                          className="p-1 text-red-600 hover:text-red-700"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="flex-1">
                          <p className="font-medium text-slate-900 dark:text-white text-sm">
                            {session.session_name}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            {new Date(session.session_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </p>
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              startEditingSession(session);
                            }}
                            className="p-1 text-slate-400 hover:text-blue-600"
                            title="Edit session name"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              confirmDeleteSession(session);
                            }}
                            className="p-1 text-slate-400 hover:text-red-600"
                            title="Delete session"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        session.is_active && !isExpired(session.expires_at)
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                          : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                      }`}
                    >
                      {session.is_active && !isExpired(session.expires_at) ? 'Active' : 'Expired'}
                    </span>
                    {session.is_active && !isExpired(session.expires_at) && (
                      <div className="flex gap-1 ml-auto">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            copyPublicUrl(session.session_code);
                          }}
                          className="p-1 text-blue-600 hover:text-blue-700"
                          title="Copy URL"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openPublicUrl(session.session_code);
                          }}
                          className="p-1 text-blue-600 hover:text-blue-700"
                          title="Open URL"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <Users className="w-5 h-5" />
            Attendance Records
            {selectedSession && (
              <span className="text-sm font-normal text-slate-500 dark:text-slate-400">
                - {selectedSession.session_name}
              </span>
            )}
          </h3>

          {!selectedSession ? (
            <p className="text-slate-500 dark:text-slate-400 text-center py-12">
              Select a session to view attendance records
            </p>
          ) : records.length === 0 ? (
            <p className="text-slate-500 dark:text-slate-400 text-center py-12">
              No attendance records yet for this session
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">
                      Student Name
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">
                      Email
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">
                      Marked At
                    </th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {records.map((record) => (
                    <tr key={record.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                      <td className="py-3 px-4 text-sm text-slate-900 dark:text-white font-medium">
                        {record.student_name}
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-600 dark:text-slate-400">
                        {record.student_email || '-'}
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-600 dark:text-slate-400">
                        {new Date(record.marked_at).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {record.status === 'present' ? (
                          <CheckCircle className="w-5 h-5 text-green-600 mx-auto" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-600 mx-auto" />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <AttendanceCalendar
        sessions={sessions}
        onDateSelect={handleDateSelect}
        selectedDate={selectedDate}
      />

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Delete Session"
        message={`Are you sure you want to delete "${sessionToDelete?.session_name}"? This will permanently remove all attendance records for this session.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={deleteSession}
        onCancel={() => {
          setShowDeleteConfirm(false);
          setSessionToDelete(null);
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
    </div>
  );
}
