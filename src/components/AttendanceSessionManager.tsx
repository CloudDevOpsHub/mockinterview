import React, { useState, useEffect } from 'react';
import { Calendar, Copy, Plus, RefreshCw, ExternalLink, CheckCircle, XCircle, Clock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface AttendanceSession {
  id: string;
  session_date: string;
  session_code: string;
  is_active: boolean;
  expires_at: string;
  created_at: string;
}

export function AttendanceSessionManager() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<AttendanceSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    loadSessions();
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

  const createTodaySession = async () => {
    setCreating(true);
    setMessage(null);

    try {
      const today = new Date().toISOString().split('T')[0];
      const sessionCode = `attend-${today}`;
      const expiresAt = new Date();
      expiresAt.setHours(23, 59, 59, 999);

      const { error } = await supabase
        .from('attendance_sessions')
        .insert({
          session_date: today,
          session_code: sessionCode,
          is_active: true,
          expires_at: expiresAt.toISOString(),
          created_by: user?.id
        });

      if (error) {
        if (error.code === '23505') {
          setMessage({ type: 'error', text: 'Attendance session for today already exists!' });
        } else {
          throw error;
        }
      } else {
        setMessage({ type: 'success', text: 'Attendance session created successfully!' });
        await loadSessions();
      }
    } catch (error) {
      console.error('Error creating session:', error);
      setMessage({ type: 'error', text: 'Failed to create attendance session' });
    } finally {
      setCreating(false);
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
            onClick={createTodaySession}
            disabled={creating || !!todaySession}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            <Plus className="w-4 h-4" />
            {todaySession ? 'Session Exists' : 'Create Today\'s Session'}
          </button>
        </div>

        {todaySession && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  <span className="font-medium text-gray-900">{formatDate(todaySession.session_date)}</span>
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
                <div className="text-sm text-gray-600 mb-3">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Expires: {formatTime(todaySession.expires_at)}
                  </div>
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
                      <span className="font-medium text-gray-900">{formatDate(session.session_date)}</span>
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
                      Code: <code className="text-xs bg-gray-100 px-2 py-0.5 rounded">{session.session_code}</code>
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
