import React, { useState, useEffect } from 'react';
import { Calendar, Users, UserCheck, UserX, TrendingUp, Download, RefreshCw } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface AttendanceSession {
  id: string;
  session_date: string;
  session_code: string;
  is_active: boolean;
}

interface AttendanceRecord {
  id: string;
  student_name: string;
  marked_at: string;
  status: string;
}

interface DailyStats {
  date: string;
  total_present: number;
  attendance_percentage: number;
  records: AttendanceRecord[];
}

export function AttendanceDashboard() {
  const [sessions, setSessions] = useState<AttendanceSession[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [stats, setStats] = useState<DailyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadSessions();
  }, []);

  useEffect(() => {
    if (selectedDate) {
      loadDailyStats();
    }
  }, [selectedDate]);

  const loadSessions = async () => {
    try {
      const { data, error } = await supabase
        .from('attendance_sessions')
        .select('*')
        .order('session_date', { ascending: false });

      if (error) throw error;
      setSessions(data || []);

      if (data && data.length > 0 && !selectedDate) {
        setSelectedDate(data[0].session_date);
      }
    } catch (error) {
      console.error('Error loading sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDailyStats = async () => {
    setRefreshing(true);
    try {
      const session = sessions.find(s => s.session_date === selectedDate);

      if (!session) {
        setStats(null);
        setRefreshing(false);
        return;
      }

      const { data: records, error } = await supabase
        .from('attendance_records')
        .select('*')
        .eq('session_id', session.id)
        .order('marked_at', { ascending: true });

      if (error) throw error;

      const totalPresent = records?.length || 0;
      const attendancePercentage = totalPresent > 0 ? 100 : 0;

      setStats({
        date: selectedDate,
        total_present: totalPresent,
        attendance_percentage: attendancePercentage,
        records: records || []
      });
    } catch (error) {
      console.error('Error loading daily stats:', error);
      setStats(null);
    } finally {
      setRefreshing(false);
    }
  };

  const exportToCSV = () => {
    if (!stats || stats.records.length === 0) return;

    const headers = ['Date', 'Name', 'Status', 'Time'];
    const rows = stats.records.map(record => [
      selectedDate,
      record.student_name,
      record.status,
      new Date(record.marked_at).toLocaleTimeString()
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance-${selectedDate}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
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

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Daily Attendance Dashboard</h3>
            <p className="text-sm text-gray-600 mt-1">View and manage attendance records</p>
          </div>
          <div className="flex gap-3">
            <select
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select Date</option>
              {sessions.map((session) => (
                <option key={session.id} value={session.session_date}>
                  {formatDate(session.session_date)}
                </option>
              ))}
            </select>
            <button
              onClick={loadDailyStats}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:bg-gray-50 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {stats ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-600 font-medium">Total Present</p>
                    <p className="text-3xl font-bold text-blue-900 mt-1">{stats.total_present}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-200 rounded-full flex items-center justify-center">
                    <UserCheck className="w-6 h-6 text-blue-700" />
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-600 font-medium">Attendance %</p>
                    <p className="text-3xl font-bold text-green-900 mt-1">
                      {stats.attendance_percentage.toFixed(0)}%
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-green-200 rounded-full flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-green-700" />
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-purple-600 font-medium">Date</p>
                    <p className="text-lg font-bold text-purple-900 mt-1">{formatDate(stats.date)}</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-200 rounded-full flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-purple-700" />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between mb-4">
              <h4 className="text-md font-semibold text-gray-900">Attendance Records</h4>
              {stats.records.length > 0 && (
                <button
                  onClick={exportToCSV}
                  className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                >
                  <Download className="w-4 h-4" />
                  Export CSV
                </button>
              )}
            </div>

            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        #
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Student Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Time
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {stats.records.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                          <Users className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                          <p>No attendance records for this date</p>
                        </td>
                      </tr>
                    ) : (
                      stats.records.map((record, index) => (
                        <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {index + 1}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                                <span className="text-sm font-medium text-blue-700">
                                  {record.student_name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <span className="text-sm font-medium text-gray-900">
                                {record.student_name}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                              <UserCheck className="w-3 h-3 mr-1" />
                              Present
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatTime(record.marked_at)}
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
          <div className="text-center py-12 text-gray-500">
            <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p>Select a date to view attendance records</p>
          </div>
        )}
      </div>
    </div>
  );
}
