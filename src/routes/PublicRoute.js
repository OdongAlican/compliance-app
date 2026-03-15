import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { ROUTES } from '../utils/constants';

/**
 * PublicRoute — redirects already-authenticated users away from auth pages
 * (login, sign-up) straight to the dashboard.
 *
 * Usage in routes/index.js:
 *   <Route element={<PublicRoute />}>
 *     <Route path="/login" element={<LoginPage />} />
 *   </Route>
 */
export default function PublicRoute() {
    const { isAuthenticated } = useAuth();

    if (isAuthenticated) {
        return <Navigate to={ROUTES.DASHBOARD} replace />;
    }

    return <Outlet />;
}
