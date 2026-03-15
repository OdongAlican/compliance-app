import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { ROUTES } from '../utils/constants';

/**
 * PrivateRoute — redirects unauthenticated users to /login.
 * Preserves the attempted URL so the user is sent back after login.
 * Waits for auth hydration to complete before making a redirect decision.
 *
 * Usage in routes/index.js:
 *   <Route element={<PrivateRoute />}>
 *     <Route path="/dashboard" element={<DashboardPage />} />
 *   </Route>
 */
export default function PrivateRoute() {
    const { isAuthenticated, isHydrating } = useAuth();
    const location = useLocation();

    // Don't redirect while session is being restored from storage
    if (isHydrating) return null;

    if (!isAuthenticated) {
        return (
            <Navigate
                to={ROUTES.LOGIN}
                state={{ from: location }}
                replace
            />
        );
    }

    return <Outlet />;
}
