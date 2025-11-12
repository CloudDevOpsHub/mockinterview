import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { UserPlus, CheckCircle, AlertCircle } from 'lucide-react';

export function AdminSetup() {
  const [creating, setCreating] = useState(false);
  const [results, setResults] = useState<Array<{ email: string; success: boolean; error?: string }>>([]);
  const [completed, setCompleted] = useState(false);

  const createAdminAccounts = async () => {
    setCreating(true);
    const newResults: Array<{ email: string; success: boolean; error?: string }> = [];

    for (let i = 1; i <= 10; i++) {
      const email = `admin${i}@example.com`;
      const password = 'Admin@123';
      const name = `Admin ${i}`;

      try {
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name: name,
            },
          },
        });

        if (authError) {
          newResults.push({ email, success: false, error: authError.message });
          continue;
        }

        if (authData.user) {
          const { error: profileError } = await supabase
            .from('admins')
            .insert({
              id: authData.user.id,
              email,
              name,
            });

          if (profileError) {
            newResults.push({ email, success: false, error: profileError.message });
          } else {
            newResults.push({ email, success: true });
          }
        }
      } catch (err) {
        newResults.push({
          email,
          success: false,
          error: err instanceof Error ? err.message : 'Unknown error'
        });
      }

      await new Promise(resolve => setTimeout(resolve, 500));
    }

    setResults(newResults);
    setCreating(false);
    setCompleted(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4">
              <UserPlus className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
              Admin Account Setup
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              Create 10 pre-configured admin accounts
            </p>
          </div>

          {!completed ? (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-900 dark:text-blue-100 mb-2">
                  This will create the following accounts:
                </p>
                <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                  <li>• Email: admin1@example.com - admin10@example.com</li>
                  <li>• Password: Admin@123</li>
                  <li>• Names: Admin 1 - Admin 10</li>
                </ul>
              </div>

              <button
                onClick={createAdminAccounts}
                disabled={creating}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {creating ? (
                  <>Creating accounts...</>
                ) : (
                  <>
                    <UserPlus className="w-5 h-5" />
                    Create Admin Accounts
                  </>
                )}
              </button>

              {creating && (
                <div className="text-center text-sm text-slate-600 dark:text-slate-400">
                  Please wait, this may take a minute...
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="max-h-96 overflow-y-auto space-y-2">
                {results.map((result, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg border flex items-start gap-3 ${
                      result.success
                        ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                        : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                    }`}
                  >
                    {result.success ? (
                      <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${
                        result.success
                          ? 'text-green-900 dark:text-green-100'
                          : 'text-red-900 dark:text-red-100'
                      }`}>
                        {result.email}
                      </p>
                      {result.error && (
                        <p className="text-xs text-red-700 dark:text-red-300 mt-1">
                          {result.error}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <p className="text-sm text-green-900 dark:text-green-100 font-medium">
                  Setup Complete!
                </p>
                <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                  {results.filter(r => r.success).length} of {results.length} accounts created successfully.
                  You can now close this page and use the login page.
                </p>
              </div>

              <a
                href="/login"
                className="block w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors text-center"
              >
                Go to Login Page
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
