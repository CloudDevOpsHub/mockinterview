import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Users, TrendingUp, Calendar, Clock, RefreshCw, AlertCircle, Download } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface StudentStats {
  student_name: string;
  student_email: string;
  total_sessions: number;
  sessions_present: number;
  sessions_absent: number;
  attendance_percentage: number;
}

interface BatchOverview {
  batch_name: string;
  batch_description: string;
  total_students: number;
  total_sessions: number;
  average_attendance_percentage: number;
  last_session_date: string | null;
}

export function PublicBatchStats() {
  const { publicId } = useParams<{ publicId: string }>();
  const [studentStats, setStudentStats] = useState<StudentStats[]>([]);
  const [batchOverview, setBatchOverview] = useState<BatchOverview | null>(null);
  const [batchId, setBatchId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchFilter, setSearchFilter] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'percentage' | 'present'>('percentage');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    loadBatchStats();
  }, [publicId]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (autoRefresh && batchId) {
      interval = setInterval(() => {
        loadBatchStats(true);
      }, 60000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh, batchId]);

  const loadBatchStats = async (isRefresh = false) => {
    if (!publicId) {
      setError('Invalid batch statistics link');
      setLoading(false);
      return;
    }

    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const { data: urlData, error: urlError } = await supabase
        .from('batch_public_urls')
        .select('batch_id, is_active, expires_at')
        .eq('public_id', publicId)
        .maybeSingle();

      if (urlError) throw urlError;

      if (!urlData) {
        setError('Batch statistics link not found');
        setLoading(false);
        return;
      }

      if (!urlData.is_active) {
        setError('This batch statistics link has been revoked');
        setLoading(false);
        return;
      }

      if (new Date(urlData.expires_at) < new Date()) {
        setError('This batch statistics link has expired');
        setLoading(false);
        return;
      }

      setBatchId(urlData.batch_id);

      const { data: statsData, error: statsError } = await supabase
        .rpc('get_batch_attendance_stats', { p_batch_id: urlData.batch_id });

      if (statsError) throw statsError;
      setStudentStats(statsData || []);

      const { data: overviewData, error: overviewError } = await supabase
        .rpc('get_batch_overview', { p_batch_id: urlData.batch_id });

      if (overviewError) throw overviewError;
      setBatchOverview(overviewData && overviewData.length > 0 ? overviewData[0] : null);

      await supabase
        .from('batch_public_urls')
        .update({ last_accessed_at: new Date().toISOString() })
        .eq('public_id', publicId);

      setError(null);
    } catch (err) {
      console.error('Error loading batch stats:', err);
      setError('Failed to load batch statistics');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const exportToCSV = () => {
    if (!batchOverview || studentStats.length === 0) return;

    const headers = ['Student Name', 'Email', 'Total Sessions', 'Sessions Present', 'Sessions Absent', 'Attendance %'];
    const rows = studentStats.map(stat => [
      stat.student_name,
      stat.student_email || '-',
      stat.total_sessions,
      stat.sessions_present,
      stat.sessions_absent,
      `${stat.attendance_percentage}%`
    ]);

    const csvContent = [
      `Batch: ${batchOverview.batch_name}`,
      `Total Students: ${batchOverview.total_students}`,
      `Total Sessions: ${batchOverview.total_sessions}`,
      `Average Attendance: ${batchOverview.average_attendance_percentage.toFixed(2)}%`,
      '',
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${batchOverview.batch_name}-attendance-stats.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const getAttendanceColor = (percentage: number) => {
    if (percentage >= 75) return 'text-green-700 bg-green-100';
    if (percentage >= 50) return 'text-yellow-700 bg-yellow-100';
    return 'text-red-700 bg-red-100';
  };

  const getAttendanceBarColor = (percentage: number) => {
    if (percentage >= 75) return 'bg-green-500';
    if (percentage >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const filteredStats = studentStats.filter(stat =>
    stat.student_name.toLowerCase().includes(searchFilter.toLowerCase())
  );

  const sortedStats = [...filteredStats].sort((a, b) => {
    let comparison = 0;
    if (sortBy === 'name') {
      comparison = a.student_name.localeCompare(b.student_name);
    } else if (sortBy === 'percentage') {
      comparison = a.attendance_percentage - b.attendance_percentage;
    } else if (sortBy === 'present') {
      comparison = a.sessions_present - b.sessions_present;
    }
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const handleSort = (column: 'name' | 'percentage' | 'present') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading batch statistics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Error</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-8 text-white">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold mb-2">{batchOverview?.batch_name}</h1>
                {batchOverview?.batch_description && (
                  <p className="text-blue-100">{batchOverview.batch_description}</p>
                )}
              </div>
              <div className="text-right">
                <span className="px-3 py-1 bg-white bg-opacity-20 text-white text-sm font-medium rounded-full flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  Live Statistics
                </span>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Batch Attendance Overview</h2>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-sm text-gray-600">
                  <input
                    type="checkbox"
                    checked={autoRefresh}
                    onChange={(e) => setAutoRefresh(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  Auto-refresh
                </label>
                <button
                  onClick={() => loadBatchStats(true)}
                  disabled={refreshing}
                  className="flex items-center gap-2 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm"
                >
                  <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>
            </div>

            {batchOverview && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-blue-600 font-medium mb-1">Total Students</p>
                      <p className="text-4xl font-bold text-blue-900">{batchOverview.total_students}</p>
                    </div>
                    <Users className="w-12 h-12 text-blue-600 opacity-50" />
                  </div>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-green-600 font-medium mb-1">Total Sessions</p>
                      <p className="text-4xl font-bold text-green-900">{batchOverview.total_sessions}</p>
                    </div>
                    <Calendar className="w-12 h-12 text-green-600 opacity-50" />
                  </div>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-purple-600 font-medium mb-1">Avg Attendance</p>
                      <p className="text-4xl font-bold text-purple-900">
                        {batchOverview.average_attendance_percentage.toFixed(1)}%
                      </p>
                    </div>
                    <TrendingUp className="w-12 h-12 text-purple-600 opacity-50" />
                  </div>
                </div>

                <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-orange-600 font-medium mb-1">Last Session</p>
                      <p className="text-sm font-bold text-orange-900">
                        {formatDate(batchOverview.last_session_date)}
                      </p>
                    </div>
                    <Clock className="w-12 h-12 text-orange-600 opacity-50" />
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  placeholder="Search students..."
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-600">
                  {sortedStats.length} student{sortedStats.length !== 1 ? 's' : ''}
                </span>
              </div>
              {studentStats.length > 0 && (
                <button
                  onClick={exportToCSV}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Export CSV
                </button>
              )}
            </div>

            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
                <h3 className="font-semibold text-gray-900">Student Attendance Statistics</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        #
                      </th>
                      <th
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('name')}
                      >
                        Student Name {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                      </th>
                      <th
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('present')}
                      >
                        Sessions Present {sortBy === 'present' && (sortOrder === 'asc' ? '↑' : '↓')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Sessions Absent
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total Sessions
                      </th>
                      <th
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('percentage')}
                      >
                        Attendance % {sortBy === 'percentage' && (sortOrder === 'asc' ? '↑' : '↓')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {sortedStats.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center">
                          <Users className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                          <p className="text-gray-500">
                            {searchFilter ? 'No students match your search' : 'No attendance data available yet'}
                          </p>
                        </td>
                      </tr>
                    ) : (
                      sortedStats.map((stat, index) => (
                        <tr key={stat.student_name} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {index + 1}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center mr-3 shadow-sm">
                                <span className="text-sm font-bold text-white">
                                  {stat.student_name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div>
                                <div className="text-sm font-medium text-gray-900">{stat.student_name}</div>
                                {stat.student_email && (
                                  <div className="text-xs text-gray-500">{stat.student_email}</div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-base font-bold text-green-700">
                              {stat.sessions_present}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-base font-bold text-red-700">
                              {stat.sessions_absent}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {stat.total_sessions}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <div className="flex-1 bg-gray-200 rounded-full h-3 min-w-[100px]">
                                <div
                                  className={`h-3 rounded-full transition-all ${getAttendanceBarColor(stat.attendance_percentage)}`}
                                  style={{ width: `${stat.attendance_percentage}%` }}
                                />
                              </div>
                              <span className={`text-base font-bold px-3 py-1 rounded ${getAttendanceColor(stat.attendance_percentage)}`}>
                                {stat.attendance_percentage.toFixed(1)}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Users className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-medium text-blue-900 mb-1">Public Batch Statistics</h4>
                  <p className="text-sm text-blue-700">
                    This page shows real-time attendance statistics for all students in {batchOverview?.batch_name}.
                    Data auto-refreshes every minute when enabled. This view is read-only and accessible via a secure,
                    time-limited link.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
