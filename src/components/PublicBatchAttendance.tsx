import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Calendar, Users, CheckCircle, XCircle, TrendingUp, Search } from 'lucide-react';

interface BatchInfo {
  name: string;
  description: string;
}

interface Session {
  id: string;
  session_name: string;
  session_date: string;
  created_at: string;
}

interface StudentAttendance {
  student_name: string;
  total_sessions: number;
  sessions_present: number;
  sessions_absent: number;
  attendance_percentage: number;
  attended_sessions: string[];
}

export function PublicBatchAttendance() {
  const { publicId } = useParams<{ publicId: string }>();
  const [batchInfo, setBatchInfo] = useState<BatchInfo | null>(null);
  const [batchId, setBatchId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [studentData, setStudentData] = useState<StudentAttendance | null>(null);
  const [searchName, setSearchName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    loadBatchInfo();
  }, [publicId]);

  const loadBatchInfo = async () => {
    if (!publicId) return;

    setLoading(true);

    const { data: urlData, error: urlError } = await supabase
      .from('batch_public_urls')
      .select('batch_id')
      .eq('public_id', publicId)
      .eq('is_active', true)
      .eq('url_type', 'permanent')
      .maybeSingle();

    if (urlError || !urlData) {
      setError('Invalid or expired batch URL');
      setLoading(false);
      return;
    }

    setBatchId(urlData.batch_id);

    const { data: batchData } = await supabase
      .from('batches')
      .select('name, description')
      .eq('id', urlData.batch_id)
      .single();

    if (batchData) {
      setBatchInfo(batchData);
    }

    const { data: sessionsData } = await supabase
      .from('attendance_sessions')
      .select('id, session_name, session_date, created_at')
      .eq('batch_name', batchData.name)
      .order('session_date', { ascending: false });

    if (sessionsData) {
      setSessions(sessionsData);
    }

    setLoading(false);
  };

  const searchStudentAttendance = async () => {
    if (!searchName.trim() || !batchId) {
      alert('Please enter your name');
      return;
    }

    setSearching(true);
    setStudentData(null);

    const attendedSessionIds: string[] = [];

    for (const session of sessions) {
      const { data } = await supabase
        .from('attendance_records')
        .select('id')
        .eq('session_id', session.id)
        .eq('student_name', searchName.trim())
        .maybeSingle();

      if (data) {
        attendedSessionIds.push(session.id);
      }
    }

    const totalSessions = sessions.length;
    const sessionsPresent = attendedSessionIds.length;
    const sessionsAbsent = totalSessions - sessionsPresent;
    const attendancePercentage = totalSessions > 0
      ? Math.round((sessionsPresent / totalSessions) * 100)
      : 0;

    setStudentData({
      student_name: searchName.trim(),
      total_sessions: totalSessions,
      sessions_present: sessionsPresent,
      sessions_absent: sessionsAbsent,
      attendance_percentage: attendancePercentage,
      attended_sessions: attendedSessionIds,
    });

    setSearching(false);
  };

  const isAttended = (sessionId: string) => {
    return studentData?.attended_sessions.includes(sessionId) || false;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
        <div className="text-center">
          <Calendar className="w-12 h-12 text-orange-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-400">Loading batch information...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 text-center">
          <XCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
            Access Denied
          </h2>
          <p className="text-slate-600 dark:text-slate-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 dark:from-slate-900 dark:to-slate-800 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-600 rounded-2xl mb-4">
            <Calendar className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-2">
            {batchInfo?.name} - Attendance Dashboard
          </h1>
          {batchInfo?.description && (
            <p className="text-slate-600 dark:text-slate-400">
              {batchInfo.description}
            </p>
          )}
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6 md:p-8 mb-6">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
            Check Your Attendance
          </h2>
          <div className="flex gap-3">
            <input
              type="text"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && searchStudentAttendance()}
              placeholder="Enter your full name"
              className="flex-1 px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
            <button
              onClick={searchStudentAttendance}
              disabled={searching}
              className="px-6 py-3 bg-orange-600 hover:bg-orange-700 disabled:bg-orange-400 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <Search className="w-5 h-5" />
              {searching ? 'Searching...' : 'Search'}
            </button>
          </div>
        </div>

        {studentData && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
                <div className="flex items-center gap-3 mb-2">
                  <Calendar className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Sessions</p>
                </div>
                <p className="text-3xl font-bold text-slate-900 dark:text-white">
                  {studentData.total_sessions}
                </p>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
                <div className="flex items-center gap-3 mb-2">
                  <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Attended</p>
                </div>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                  {studentData.sessions_present}
                </p>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
                <div className="flex items-center gap-3 mb-2">
                  <XCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Missed</p>
                </div>
                <p className="text-3xl font-bold text-red-600 dark:text-red-400">
                  {studentData.sessions_absent}
                </p>
              </div>

              <div className={`rounded-xl border p-6 ${
                studentData.attendance_percentage >= 70
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                  : studentData.attendance_percentage >= 50
                  ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
                  : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
              }`}>
                <div className="flex items-center gap-3 mb-2">
                  <TrendingUp className={`w-6 h-6 ${
                    studentData.attendance_percentage >= 70
                      ? 'text-green-600 dark:text-green-400'
                      : studentData.attendance_percentage >= 50
                      ? 'text-yellow-600 dark:text-yellow-400'
                      : 'text-red-600 dark:text-red-400'
                  }`} />
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Attendance %</p>
                </div>
                <p className={`text-3xl font-bold ${
                  studentData.attendance_percentage >= 70
                    ? 'text-green-600 dark:text-green-400'
                    : studentData.attendance_percentage >= 50
                    ? 'text-yellow-600 dark:text-yellow-400'
                    : 'text-red-600 dark:text-red-400'
                }`}>
                  {studentData.attendance_percentage}%
                </p>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6 md:p-8">
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <Users className="w-6 h-6" />
                Session Details
              </h3>

              {sessions.length === 0 ? (
                <p className="text-center text-slate-500 dark:text-slate-400 py-8">
                  No sessions have been conducted yet
                </p>
              ) : (
                <div className="space-y-3">
                  {sessions.map((session) => {
                    const attended = isAttended(session.id);
                    return (
                      <div
                        key={session.id}
                        className={`p-4 rounded-lg border-2 transition-all ${
                          attended
                            ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700'
                            : 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="font-semibold text-slate-900 dark:text-white">
                              {session.session_name}
                            </p>
                            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                              {new Date(session.session_date).toLocaleDateString('en-US', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                              })}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {attended ? (
                              <>
                                <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                                <span className="text-sm font-medium text-green-600 dark:text-green-400">
                                  Present
                                </span>
                              </>
                            ) : (
                              <>
                                <XCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                                <span className="text-sm font-medium text-red-600 dark:text-red-400">
                                  Absent
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}

        {!studentData && !searching && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 text-center">
            <Calendar className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
              View Your Attendance Record
            </h3>
            <p className="text-slate-600 dark:text-slate-400">
              Enter your name above to see all sessions you've attended and missed
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
