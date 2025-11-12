import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { LoginPage } from './components/LoginPage';
import { SignupPage } from './components/SignupPage';
import { AdminPanel } from './components/AdminPanel';
import { AdminSetup } from './components/AdminSetup';
import { PublicLeaderboard } from './components/PublicLeaderboard';
import { PublicActivenessBoard } from './components/PublicActivenessBoard';
import { PublicAttendancePage } from './components/PublicAttendancePage';
import { PublicAttendanceView } from './components/PublicAttendanceView';
import { PublicBatchStats } from './components/PublicBatchStats';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-slate-600 dark:text-slate-400">Loading...</div>
      </div>
    );
  }

  return user ? <>{children}</> : <Navigate to="/login" />;
}

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/setup" element={<AdminSetup />} />
            <Route path="/public/:publicId" element={<PublicLeaderboard />} />
            <Route path="/activeness/:publicId" element={<PublicActivenessBoard />} />
            <Route path="/attend/:sessionCode" element={<PublicAttendancePage />} />
            <Route path="/attendance/view/:publicId" element={<PublicAttendanceView />} />
            <Route path="/batch-stats/:publicId" element={<PublicBatchStats />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <AdminPanel />
                </ProtectedRoute>
              }
            />
          </Routes>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
