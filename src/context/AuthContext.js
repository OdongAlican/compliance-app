import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { TokenService, forceLogout } from '../services';
import api from '../services';

const AuthContext = createContext(null);

/**
 * AuthProvider — wraps the entire app.
 *
 * Provides:
 *   isAuthenticated  boolean
 *   user             object | null
 *   role             string | null  ('Admin' | 'Auditor' | 'Supervisor' | 'Staff' | …)
 *   login(email, password) → Promise
 *   logout()
 */
export function AuthProvider({ children }) {
    const [user, setUser] = useState(() => TokenService.getUser());

    const isAuthenticated = Boolean(TokenService.getAccessToken() && user);
    const role = user?.role ?? null;

    /** Call the login endpoint, persist tokens, update state. */
    const login = useCallback(async (email, password) => {
        const data = await api.post('/auth/login/', { email, password });
        // data expected: { access, refresh, user, expires_at? }
        TokenService.saveAuthResponse(data);
        setUser(data.user);
        return data;
    }, []);

    /** Calls server logout endpoint (best-effort), then clears session. */
    const logout = useCallback(async () => {
        try {
            await api.post('/auth/logout/', {
                refresh: TokenService.getRefreshToken(),
            });
        } catch {
            // swallow — still clear locally
        } finally {
            TokenService.clearAll();
            setUser(null);
            forceLogout('You have been signed out.');
        }
    }, []);

    const value = useMemo(
        () => ({ isAuthenticated, user, role, login, logout }),
        [isAuthenticated, user, role, login, logout]
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/** Internal hook — used only by useAuth.js */
export function useAuthContext() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuthContext must be used inside <AuthProvider>');
    return ctx;
}
