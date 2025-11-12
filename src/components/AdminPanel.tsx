import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { LogOut, Trophy, Activity, Moon, Sun, UserCheck, Users, BarChart3 } from 'lucide-react';
import { AdminDashboard } from './AdminDashboard';
import { ActivenessBoardSelector } from './ActivenessBoardSelector';
import { AttendanceSessionManager } from './AttendanceSessionManager';
import { AttendanceDashboard } from './AttendanceDashboard';
import { BatchManagement } from './BatchManagement';
import { BatchAttendanceStats } from './BatchAttendanceStats';

type DashboardType = 'interviews' | 'activeness' | 'attendance' | 'batches' | 'batchstats';

export function AdminPanel() {
  const { admin, signOut } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<DashboardType>('interviews');

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                Admin Dashboard
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Welcome, {admin?.name}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={toggleTheme}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                title={isDark ? 'Light mode' : 'Dark mode'}
              >
                {isDark ? (
                  <Sun className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                ) : (
                  <Moon className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                )}
              </button>
              <button
                onClick={() => signOut()}
                className="flex items-center gap-2 px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                <LogOut className="w-5 h-5" />
                Sign Out
              </button>
            </div>
          </div>

          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setActiveTab('interviews')}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                activeTab === 'interviews'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'
              }`}
            >
              <Trophy className="w-5 h-5" />
              Interviews
            </button>
            <button
              onClick={() => setActiveTab('activeness')}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                activeTab === 'activeness'
                  ? 'bg-green-600 text-white shadow-lg'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'
              }`}
            >
              <Activity className="w-5 h-5" />
              Activeness
            </button>
            <button
              onClick={() => setActiveTab('batches')}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                activeTab === 'batches'
                  ? 'bg-orange-600 text-white shadow-lg'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'
              }`}
            >
              <Users className="w-5 h-5" />
              Batches
            </button>
            <button
              onClick={() => setActiveTab('attendance')}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                activeTab === 'attendance'
                  ? 'bg-purple-600 text-white shadow-lg'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'
              }`}
            >
              <UserCheck className="w-5 h-5" />
              Attendance
            </button>
            <button
              onClick={() => setActiveTab('batchstats')}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                activeTab === 'batchstats'
                  ? 'bg-teal-600 text-white shadow-lg'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'
              }`}
            >
              <BarChart3 className="w-5 h-5" />
              Batch Stats
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'interviews' ? (
          <AdminDashboard hideHeader={true} />
        ) : activeTab === 'activeness' ? (
          <ActivenessBoardSelector />
        ) : activeTab === 'batches' ? (
          <BatchManagement />
        ) : activeTab === 'batchstats' ? (
          <BatchAttendanceStats />
        ) : (
          <div className="space-y-8">
            <AttendanceSessionManager />
            <AttendanceDashboard />
          </div>
        )}
      </main>
    </div>
  );
}
