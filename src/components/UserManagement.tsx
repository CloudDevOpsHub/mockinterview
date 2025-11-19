import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Users, UserPlus, Trash2, Edit2, Shield, Eye, Pencil } from 'lucide-react';
import { ConfirmDialog } from './ConfirmDialog';
import { Notification } from './Notification';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'editor' | 'viewer';
  created_at: string;
  created_by?: string;
}

interface RoleInfo {
  role: 'admin' | 'editor' | 'viewer';
  icon: typeof Shield;
  color: string;
  description: string;
}

const ROLE_INFO: Record<string, RoleInfo> = {
  admin: {
    role: 'admin',
    icon: Shield,
    color: 'text-red-600 dark:text-red-400',
    description: 'Full access: Create, Edit, Delete + User Management'
  },
  editor: {
    role: 'editor',
    icon: Pencil,
    color: 'text-blue-600 dark:text-blue-400',
    description: 'Write access: Create & Edit (no Delete or User Management)'
  },
  viewer: {
    role: 'viewer',
    icon: Eye,
    color: 'text-green-600 dark:text-green-400',
    description: 'Read-only: View data only'
  }
};

export function UserManagement() {
  const { admin } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deleteUser, setDeleteUser] = useState<User | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    role: 'viewer' as 'admin' | 'editor' | 'viewer'
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('admins')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      showNotification('Failed to load users', 'error');
    } else {
      setUsers(data || []);
    }
    setLoading(false);
  };

  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      });

      if (authError) throw authError;

      if (authData.user) {
        const { error: profileError } = await supabase
          .from('admins')
          .insert({
            id: authData.user.id,
            email: formData.email,
            name: formData.name,
            role: formData.role,
            created_by: admin?.id
          });

        if (profileError) throw profileError;

        showNotification('User created successfully', 'success');
        setShowAddModal(false);
        setFormData({ email: '', password: '', name: '', role: 'viewer' });
        loadUsers();
      }
    } catch (error: any) {
      showNotification(error.message || 'Failed to create user', 'error');
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    try {
      const { error } = await supabase
        .from('admins')
        .update({
          name: formData.name,
          role: formData.role
        })
        .eq('id', editingUser.id);

      if (error) throw error;

      showNotification('User updated successfully', 'success');
      setEditingUser(null);
      setFormData({ email: '', password: '', name: '', role: 'viewer' });
      loadUsers();
    } catch (error: any) {
      showNotification(error.message || 'Failed to update user', 'error');
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteUser) return;

    try {
      const { error: adminError } = await supabase
        .from('admins')
        .delete()
        .eq('id', deleteUser.id);

      if (adminError) throw adminError;

      const { error: authError } = await supabase.auth.admin.deleteUser(deleteUser.id);

      if (authError) {
        console.error('Auth deletion error:', authError);
      }

      showNotification('User deleted successfully', 'success');
      setDeleteUser(null);
      loadUsers();
    } catch (error: any) {
      showNotification(error.message || 'Failed to delete user', 'error');
    }
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setFormData({
      email: user.email,
      password: '',
      name: user.name,
      role: user.role
    });
    setShowAddModal(true);
  };

  const closeModal = () => {
    setShowAddModal(false);
    setEditingUser(null);
    setFormData({ email: '', password: '', name: '', role: 'viewer' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            User Management
          </h2>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <UserPlus className="w-5 h-5" />
          Add User
        </button>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
          <thead className="bg-slate-50 dark:bg-slate-900">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Created
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
            {users.map((user) => {
              const roleInfo = ROLE_INFO[user.role];
              const RoleIcon = roleInfo.icon;

              return (
                <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="font-medium text-slate-900 dark:text-white">
                        {user.name}
                      </div>
                      <div className="text-sm text-slate-500 dark:text-slate-400">
                        {user.email}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <RoleIcon className={`w-4 h-4 ${roleInfo.color}`} />
                      <span className={`font-medium ${roleInfo.color}`}>
                        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {roleInfo.description}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEditModal(user)}
                        className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                        title="Edit user"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      {user.id !== admin?.id && (
                        <button
                          onClick={() => setDeleteUser(user)}
                          className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          title="Delete user"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
              {editingUser ? 'Edit User' : 'Add New User'}
            </h3>
            <form onSubmit={editingUser ? handleUpdateUser : handleCreateUser}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    disabled={!!editingUser}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white disabled:bg-slate-100 dark:disabled:bg-slate-900 disabled:cursor-not-allowed"
                    required
                  />
                </div>

                {!editingUser && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Password
                    </label>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                      required
                      minLength={6}
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Role
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                  >
                    <option value="admin">Admin - Full Access</option>
                    <option value="editor">Editor - Create & Edit</option>
                    <option value="viewer">Viewer - Read Only</option>
                  </select>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {ROLE_INFO[formData.role].description}
                  </p>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingUser ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteUser && (
        <ConfirmDialog
          title="Delete User"
          message={`Are you sure you want to delete ${deleteUser.name}? This action cannot be undone.`}
          confirmLabel="Delete"
          onConfirm={handleDeleteUser}
          onCancel={() => setDeleteUser(null)}
        />
      )}
    </div>
  );
}
