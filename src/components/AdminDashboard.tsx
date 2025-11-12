export function AdminDashboard({ hideHeader }: { hideHeader?: boolean }) {
  return (
    <div className="space-y-6">
      {!hideHeader && (
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
          Interview Leaderboard
        </h2>
      )}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
        <p className="text-slate-600 dark:text-slate-400">
          Interview leaderboard feature - implementation pending
        </p>
      </div>
    </div>
  );
}
