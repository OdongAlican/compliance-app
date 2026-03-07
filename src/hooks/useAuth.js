import { useAuthContext } from '../context/AuthContext';

/**
 * useAuth — primary hook for accessing auth state anywhere in the app.
 *
 * Usage:
 *   const { isAuthenticated, user, role, login, logout } = useAuth();
 */
export default function useAuth() {
    return useAuthContext();
}
