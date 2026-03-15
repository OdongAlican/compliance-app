import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { ROUTES } from '../utils/constants';

/**
 * RoleRoute — renders child routes only if the authenticated user has
 * one of the allowed roles. Otherwise redirects to /dashboard.
 *
 * @param {string[]} allowedRoles - e.g. ['Admin', 'Supervisor']
 *
 * Usage in routes/index.js:
 *   <Route element={<RoleRoute allowedRoles={['Admin']} />}>
 *     <Route path="/user-management" element={<UserManagementPage />} />
 *   </Route>
 */
export default function RoleRoute({ allowedRoles = [] }) {
    const { isAuthenticated, role, isHydrating } = useAuth();

    // Don't redirect while session is being restored from storage
    if (isHydrating) return null;

    if (!isAuthenticated) {
        return <Navigate to={ROUTES.LOGIN} replace />;
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
        return <Navigate to={ROUTES.DASHBOARD} replace />;
    }

    return <Outlet />;
}
