import { useAuthContext } from '../context/AuthContext';

/**
 * useAuth — primary hook for accessing auth state anywhere in the app.
 *
 * Usage:
 *   const { isAuthenticated, user, role, permissions, hasPermission, login, logout } = useAuth();
 *
 * hasPermission('users.view')  → boolean
 */
export default function useAuth() {
  return useAuthContext();
}
