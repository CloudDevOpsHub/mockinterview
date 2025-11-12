import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Copy, ExternalLink } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface DayAttendance {
  date: string;
  count: number;
  percentage: number;
  sessionId: string;
  sessionName: string;
  batchName: string;
  publicId: string;
}

interface AttendanceCalendarProps {
  onDateSelect: (date: string) => void;
  selectedDate: string;
}

export function AttendanceCalendar({ onDateSelect, selectedDate }: AttendanceCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [attendanceData, setAttendanceData] = useState<Record<string, DayAttendance>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMonthAttendance();
  }, [currentMonth]);

  const loadMonthAttendance = async () => {
    setLoading(true);
    try {
      const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

      const startDate = startOfMonth.toISOString().split('T')[0];
      const endDate = endOfMonth.toISOString().split('T')[0];

      const { data: sessions, error: sessionsError } = await supabase
        .from('attendance_sessions')
        .select('id, session_date, session_name, batch_name, public_id')
        .gte('session_date', startDate)
        .lte('session_date', endDate);

      if (sessionsError) throw sessionsError;

      const attendanceMap: Record<string, DayAttendance> = {};

      for (const session of sessions || []) {
        const { data: records, error: recordsError } = await supabase
          .from('attendance_records')
          .select('id')
          .eq('session_id', session.id);

        if (recordsError) throw recordsError;

        const count = records?.length || 0;
        attendanceMap[session.session_date] = {
          date: session.session_date,
          count,
          percentage: count > 0 ? 100 : 0,
          sessionId: session.id,
          sessionName: session.session_name,
          batchName: session.batch_name || 'Default Batch',
          publicId: session.public_id
        };
      }

      setAttendanceData(attendanceMap);
    } catch (error) {
      console.error('Error loading month attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    return days;
  };

  const formatDateKey = (day: number) => {
    const year = currentMonth.getFullYear();
    const month = String(currentMonth.getMonth() + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    return `${year}-${month}-${dayStr}`;
  };

  const getAttendanceColor = (percentage: number) => {
    if (percentage >= 70) return 'bg-green-500';
    if (percentage >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const monthName = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const days = getDaysInMonth();
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Attendance Calendar</h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={previousMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <span className="text-sm font-medium text-gray-900 min-w-[140px] text-center">
            {monthName}
          </span>
          <button
            onClick={nextMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-7 gap-2">
          {weekDays.map((day) => (
            <div key={day} className="text-center text-xs font-semibold text-gray-500 py-2">
              {day}
            </div>
          ))}
          {days.map((day, index) => {
            if (day === null) {
              return <div key={`empty-${index}`} className="aspect-square" />;
            }

            const dateKey = formatDateKey(day);
            const attendance = attendanceData[dateKey];
            const isSelected = dateKey === selectedDate;
            const isToday = dateKey === new Date().toISOString().split('T')[0];

            return (
              <button
                key={dateKey}
                onClick={() => attendance && onDateSelect(dateKey)}
                disabled={!attendance}
                className={`aspect-square rounded-lg border-2 transition-all relative ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50'
                    : isToday
                    ? 'border-blue-300 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                } ${attendance ? 'cursor-pointer' : 'cursor-default opacity-40'}`}
              >
                <div className="flex flex-col items-center justify-center h-full p-1 relative group">
                  <span className={`text-xs font-medium ${isSelected ? 'text-blue-700' : 'text-gray-700'}`}>
                    {day}
                  </span>
                  {attendance && (
                    <>
                      <span className="text-2xl font-bold text-gray-900 mt-0.5">{attendance.count}</span>
                      <span className="text-xs text-gray-500 truncate w-full text-center px-0.5" title={attendance.batchName}>
                        {attendance.batchName}
                      </span>
                      <div
                        className={`absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 rounded-full ${getAttendanceColor(
                          attendance.percentage
                        )}`}
                      />
                      {attendance.publicId && (
                        <div className="absolute inset-0 bg-blue-600 bg-opacity-0 group-hover:bg-opacity-10 transition-all rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
                          <div className="flex gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                const url = `${window.location.origin}/attendance/view/${attendance.publicId}`;
                                navigator.clipboard.writeText(url);
                                alert('Public URL copied!');
                              }}
                              className="p-1 bg-white rounded shadow-sm hover:bg-gray-100"
                              title="Copy public URL"
                            >
                              <Copy className="w-3 h-3 text-blue-600" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                const url = `${window.location.origin}/attendance/view/${attendance.publicId}`;
                                window.open(url, '_blank');
                              }}
                              className="p-1 bg-white rounded shadow-sm hover:bg-gray-100"
                              title="Open public view"
                            >
                              <ExternalLink className="w-3 h-3 text-blue-600" />
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-gray-600">High (≥70%)</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span className="text-gray-600">Medium (50-69%)</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="text-gray-600">Low (&lt;50%)</span>
            </div>
          </div>
          <div className="text-xs text-gray-500">
            Numbers show present count • Hover to share URL
          </div>
        </div>
      </div>
    </div>
  );
}
