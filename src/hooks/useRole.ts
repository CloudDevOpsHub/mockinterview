import { useAuth } from '../contexts/AuthContext';

export function useRole() {
  const { admin } = useAuth();

  const isAdmin = admin?.role === 'admin';
  const isEditor = admin?.role === 'editor';
  const isViewer = admin?.role === 'viewer';

  const canCreate = isAdmin || isEditor;
  const canEdit = isAdmin || isEditor;
  const canDelete = isAdmin;
  const canManageUsers = isAdmin;

  return {
    role: admin?.role,
    isAdmin,
    isEditor,
    isViewer,
    canCreate,
    canEdit,
    canDelete,
    canManageUsers,
  };
}
