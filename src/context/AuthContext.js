/**
 * AuthContext.js
 *
 * Thin React context wrapper over the Redux auth slice.
 * Components consume auth via useAuth() → all reads come from Redux store.
 *
 * Exposed API (unchanged — all consumers continue to work):
 *   isAuthenticated  boolean
 *   user             object | null
 *   role             string | null
 *   permissions      Set<string>
 *   hasPermission(key) boolean
 *   login(email, password) → Promise  (dispatches loginThunk)
 *   logout()                           (dispatches logoutThunk)
 */
import React, { createContext, useCallback, useContext, useEffect, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  loginThunk,
  logoutThunk,
  hydrateAuth,
  selectUser,
  selectIsAuthenticated,
  selectRole,
  selectPermissionKeys,
  selectIsHydrating,
} from '../store/slices/authSlice';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const dispatch = useAppDispatch();

  // Restore session from storage on first mount
  useEffect(() => { dispatch(hydrateAuth()); }, [dispatch]);

  // Read auth state from Redux store
  const user            = useAppSelector(selectUser);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const role            = useAppSelector(selectRole);
  const permissionKeys  = useAppSelector(selectPermissionKeys);
  const isHydrating     = useAppSelector(selectIsHydrating);

  // Derive memoised Set<string> — cheap since keys array is stable
  const permissions = useMemo(() => new Set(permissionKeys), [permissionKeys]);

  const hasPermission = useCallback((key) => permissions.has(key), [permissions]);

  /** Dispatches loginThunk; throws if credentials are invalid. */
  const login = useCallback(
    async (email, password) => {
      const result = await dispatch(loginThunk({ email, password }));
      if (loginThunk.rejected.match(result)) throw new Error(result.payload);
      return result.payload;
    },
    [dispatch]
  );

  /** Dispatches logoutThunk (client-side only, no API call). */
  const logout = useCallback(() => { dispatch(logoutThunk()); }, [dispatch]);

  const value = useMemo(
    () => ({ isAuthenticated, user, role, permissions, hasPermission, login, logout, isHydrating }),
    [isAuthenticated, user, role, permissions, hasPermission, login, logout, isHydrating]
  );

  return (
    <AuthContext.Provider value={value}>
      {isHydrating ? null : children}
    </AuthContext.Provider>
  );
}

/** Internal hook — used only by hooks/useAuth.js */
export function useAuthContext() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuthContext must be used inside <AuthProvider>');
  return ctx;
}
