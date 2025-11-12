import { useState, useEffect } from 'react';
import { Users, TrendingUp, Calendar, Share2, Copy, ExternalLink, Clock, AlertCircle, Download } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Batch {
  id: string;
  name: string;
  description: string;
  is_active: boolean;
}

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

interface BatchPublicUrl {
  id: string;
  public_id: string;
  is_active: boolean;
  expires_at: string;
  created_at: string;
}

export function BatchAttendanceStats() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<string>('');
  const [studentStats, setStudentStats] = useState<StudentStats[]>([]);
  const [batchOverview, setBatchOverview] = useState<BatchOverview | null>(null);
  const [publicUrls, setPublicUrls] = useState<BatchPublicUrl[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'percentage' | 'present'>('percentage');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    loadBatches();
  }, []);

  useEffect(() => {
    if (selectedBatchId) {
      loadBatchStats();
      loadPublicUrls();
    }
  }, [selectedBatchId]);

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
    } finally {
      setLoading(false);
    }
  };

  const loadBatchStats = async () => {
    if (!selectedBatchId) return;

    setLoading(true);
    try {
      const { data: statsData, error: statsError } = await supabase
        .rpc('get_batch_attendance_stats', { p_batch_id: selectedBatchId });

      if (statsError) throw statsError;
      setStudentStats(statsData || []);

      const { data: overviewData, error: overviewError } = await supabase
        .rpc('get_batch_overview', { p_batch_id: selectedBatchId });

      if (overviewError) throw overviewError;
      setBatchOverview(overviewData && overviewData.length > 0 ? overviewData[0] : null);
    } catch (error) {
      console.error('Error loading batch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPublicUrls = async () => {
    if (!selectedBatchId) return;

    try {
      const { data, error } = await supabase
        .from('batch_public_urls')
        .select('*')
        .eq('batch_id', selectedBatchId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPublicUrls(data || []);
    } catch (error) {
      console.error('Error loading public URLs:', error);
    }
  };

  const generatePublicUrl = async () => {
    if (!selectedBatchId) return;

    setGenerating(true);
    setMessage(null);

    try {
      const publicId = `batch-${selectedBatchId.substring(0, 8)}-${Date.now()}`;
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      const { error } = await supabase
        .from('batch_public_urls')
        .insert({
          batch_id: selectedBatchId,
          public_id: publicId,
          is_active: true,
          expires_at: expiresAt.toISOString()
        });

      if (error) throw error;

      setMessage({ type: 'success', text: 'Public URL generated successfully!' });
      await loadPublicUrls();
    } catch (error) {
      console.error('Error generating public URL:', error);
      setMessage({ type: 'error', text: 'Failed to generate public URL' });
    } finally {
      setGenerating(false);
    }
  };

  const copyPublicUrl = (publicId: string) => {
    const url = `${window.location.origin}/batch-stats/${publicId}`;
    navigator.clipboard.writeText(url);
    setMessage({ type: 'success', text: 'Public URL copied to clipboard!' });
  };

  const openPublicUrl = (publicId: string) => {
    const url = `${window.location.origin}/batch-stats/${publicId}`;
    window.open(url, '_blank');
  };

  const revokePublicUrl = async (urlId: string) => {
    if (!confirm('Are you sure you want to revoke this public URL?')) return;

    try {
      const { error } = await supabase
        .from('batch_public_urls')
        .update({ is_active: false })
        .eq('id', urlId);

      if (error) throw error;

      setMessage({ type: 'success', text: 'Public URL revoked successfully!' });
      await loadPublicUrls();
    } catch (error) {
      console.error('Error revoking public URL:', error);
      setMessage({ type: 'error', text: 'Failed to revoke public URL' });
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
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date();
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

  if (loading && batches.length === 0) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (batches.length === 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
        <AlertCircle className="w-12 h-12 mx-auto mb-3 text-yellow-600" />
        <p className="text-gray-700">No active batches available. Please create a batch first in the Batches tab.</p>
      </div>
    );
  }

  const activeUrl = publicUrls.find(url => url.is_active && !isExpired(url.expires_at));

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
            <h3 className="text-lg font-semibold text-gray-900">Batch Attendance Statistics</h3>
            <p className="text-sm text-gray-600 mt-1">View detailed attendance statistics for each batch</p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={selectedBatchId}
              onChange={(e) => setSelectedBatchId(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {batches.map((batch) => (
                <option key={batch.id} value={batch.id}>
                  {batch.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {batchOverview && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600 font-medium">Total Students</p>
                  <p className="text-3xl font-bold text-blue-900 mt-1">{batchOverview.total_students}</p>
                </div>
                <Users className="w-10 h-10 text-blue-600 opacity-50" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-600 font-medium">Total Sessions</p>
                  <p className="text-3xl font-bold text-green-900 mt-1">{batchOverview.total_sessions}</p>
                </div>
                <Calendar className="w-10 h-10 text-green-600 opacity-50" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-600 font-medium">Avg Attendance</p>
                  <p className="text-3xl font-bold text-purple-900 mt-1">
                    {batchOverview.average_attendance_percentage.toFixed(1)}%
                  </p>
                </div>
                <TrendingUp className="w-10 h-10 text-purple-600 opacity-50" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-orange-600 font-medium">Last Session</p>
                  <p className="text-sm font-bold text-orange-900 mt-1">
                    {formatDate(batchOverview.last_session_date)}
                  </p>
                </div>
                <Clock className="w-10 h-10 text-orange-600 opacity-50" />
              </div>
            </div>
          </div>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3 flex-1">
              <Share2 className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-medium text-blue-900 mb-1">Public Shareable URL</h4>
                <p className="text-sm text-blue-700 mb-3">
                  Generate a public URL to share batch attendance statistics. URL expires in 24 hours.
                </p>
                {activeUrl ? (
                  <div className="bg-white border border-blue-200 rounded p-3 mb-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-gray-500">Active URL:</span>
                      <span className="text-xs text-gray-600">
                        Expires: {formatDateTime(activeUrl.expires_at)}
                      </span>
                    </div>
                    <code className="text-sm text-blue-600 break-all block mb-2">
                      {window.location.origin}/batch-stats/{activeUrl.public_id}
                    </code>
                    <div className="flex gap-2">
                      <button
                        onClick={() => copyPublicUrl(activeUrl.public_id)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                      >
                        <Copy className="w-3 h-3" />
                        Copy
                      </button>
                      <button
                        onClick={() => openPublicUrl(activeUrl.public_id)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                      >
                        <ExternalLink className="w-3 h-3" />
                        Open
                      </button>
                      <button
                        onClick={() => revokePublicUrl(activeUrl.id)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                      >
                        Revoke
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={generatePublicUrl}
                    disabled={generating}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
                  >
                    <Share2 className="w-4 h-4" />
                    {generating ? 'Generating...' : 'Generate Public URL'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Search students..."
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-600">
              {sortedStats.length} student{sortedStats.length !== 1 ? 's' : ''}
            </span>
          </div>
          {studentStats.length > 0 && (
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
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    </td>
                  </tr>
                ) : sortedStats.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      <Users className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                      <p>{searchFilter ? 'No students match your search' : 'No attendance data available yet'}</p>
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
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                            <span className="text-sm font-medium text-blue-700">
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
                        <span className="text-sm font-semibold text-green-700">
                          {stat.sessions_present}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-semibold text-red-700">
                          {stat.sessions_absent}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {stat.total_sessions}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 bg-gray-200 rounded-full h-2 min-w-[80px]">
                            <div
                              className={`h-2 rounded-full ${getAttendanceBarColor(stat.attendance_percentage)}`}
                              style={{ width: `${stat.attendance_percentage}%` }}
                            />
                          </div>
                          <span className={`text-sm font-semibold px-2 py-1 rounded ${getAttendanceColor(stat.attendance_percentage)}`}>
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
      </div>
    </div>
  );
}
