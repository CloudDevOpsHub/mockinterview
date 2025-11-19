import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Users, Plus, X, Trash2, Shield, Edit, Eye } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { ConfirmDialog } from './ConfirmDialog';
import { Notification } from './Notification';

interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'editor' | 'viewer';
  created_by: string | null;
  created_at: string;
}

export function UserManagement() {
  const { admin } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [userToDelete, setUserToDelete] = useState<AdminUser | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'warning'; message: string } | null>(null);

  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    name: '',
    role: 'viewer' as 'admin' | 'editor' | 'viewer',
  });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('admins')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) {
      setUsers(data);
    }
    setLoading(false);
  };

  const createUser = async () => {
    if (!newUser.email.trim() || !newUser.password.trim() || !newUser.name.trim()) {
      setNotification({ type: 'error', message: 'Please fill in all required fields' });
      return;
    }

    setCreating(true);

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: newUser.email.trim(),
      password: newUser.password.trim(),
      options: {
        data: {
          name: newUser.name.trim(),
        },
      },
    });

    if (authError) {
      setNotification({ type: 'error', message: `Failed to create user: ${authError.message}` });
      setCreating(false);
      return;
    }

    if (authData.user) {
      const { error: adminError } = await supabase
        .from('admins')
        .insert({
          id: authData.user.id,
          email: newUser.email.trim(),
          name: newUser.name.trim(),
          role: newUser.role,
          created_by: admin?.id || null,
        });

      if (adminError) {
        setNotification({ type: 'error', message: `Failed to create admin record: ${adminError.message}` });
        setCreating(false);
        return;
      }

      await loadUsers();
      setShowAddModal(false);
      setNewUser({ email: '', password: '', name: '', role: 'viewer' });
      setNotification({ type: 'success', message: 'User created successfully!' });
    }

    setCreating(false);
  };

  const confirmDeleteUser = (user: AdminUser) => {
    if (user.id === admin?.id) {
      setNotification({ type: 'error', message: 'You cannot delete your own account' });
      return;
    }
    setUserToDelete(user);
    setShowDeleteConfirm(true);
  };

  const deleteUser = async () => {
    if (!userToDelete) return;

    const { error } = await supabase
      .from('admins')
      .delete()
      .eq('id', userToDelete.id);

    if (error) {
      setNotification({ type: 'error', message: `Failed to delete user: ${error.message}` });
      setShowDeleteConfirm(false);
      setUserToDelete(null);
      return;
    }

    setUsers(users.filter(u => u.id !== userToDelete.id));
    setNotification({ type: 'success', message: 'User deleted successfully!' });
    setShowDeleteConfirm(false);
    setUserToDelete(null);
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Shield className="w-4 h-4 text-red-600 dark:text-red-400" />;
      case 'editor':
        return <Edit className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
      case 'viewer':
        return <Eye className="w-4 h-4 text-slate-600 dark:text-slate-400" />;
      default:
        return null;
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800';
      case 'editor':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800';
      case 'viewer':
        return 'bg-slate-100 dark:bg-slate-700/30 text-slate-700 dark:text-slate-400 border-slate-200 dark:border-slate-600';
      default:
        return '';
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-600 dark:text-slate-400">Loading users...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-7 h-7" />
            User Management
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Manage user accounts and access permissions
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add User
        </button>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Name
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Email
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Role
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Created
                </th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-slate-900 dark:text-white">
                        {user.name}
                      </span>
                      {user.id === admin?.id && (
                        <span className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full">
                          You
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm text-slate-600 dark:text-slate-400">
                    {user.email}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium ${getRoleBadgeColor(user.role)}`}>
                      {getRoleIcon(user.role)}
                      {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-slate-600 dark:text-slate-400">
                    {new Date(user.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {user.id !== admin?.id && (
                      <button
                        onClick={() => confirmDeleteUser(user)}
                        className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                        title="Delete user"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800 p-6">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">
          Role Permissions
        </h3>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
            <div>
              <p className="font-medium text-slate-900 dark:text-white">Admin</p>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Full access: create, read, update, delete, and manage users
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Edit className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div>
              <p className="font-medium text-slate-900 dark:text-white">Editor</p>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Write access: create, read, and update (no delete or user management)
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Eye className="w-5 h-5 text-slate-600 dark:text-slate-400 mt-0.5" />
            <div>
              <p className="font-medium text-slate-900 dark:text-white">Viewer</p>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Read-only access: view data only (no create, update, delete, or user management)
              </p>
            </div>
          </div>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
                Add New User
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-500 dark:text-slate-400" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  placeholder="John Doe"
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  placeholder="john@example.com"
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  placeholder="Minimum 6 characters"
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Role <span className="text-red-500">*</span>
                </label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value as 'admin' | 'editor' | 'viewer' })}
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="viewer">Viewer - Read only</option>
                  <option value="editor">Editor - Create and edit</option>
                  <option value="admin">Admin - Full access</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={createUser}
                  disabled={creating}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-medium transition-colors"
                >
                  {creating ? 'Creating...' : 'Create User'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Delete User"
        message={`Are you sure you want to delete ${userToDelete?.name}? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={deleteUser}
        onCancel={() => {
          setShowDeleteConfirm(false);
          setUserToDelete(null);
        }}
        isDanger
      />

      {notification && (
        <Notification
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}
    </div>
  );
}
