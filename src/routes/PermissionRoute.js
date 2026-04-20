import React from 'react';
import { Outlet } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import AccessDenied from '../pages/AccessDenied';

/**
 * PermissionRoute
 *
 * A route-level guard that replaces the route content with an AccessDenied
 * page if the authenticated user is missing ANY of the required permissions.
 *
 * Unlike RoleRoute (which redirects), this renders the access-denied state
 * inline — the URL stays the same and the user sees a clear explanation.
 *
 * ------------------------------------------------------------------
 * USAGE in routes/index.js:
 *
 *   // Single permission
 *   <Route element={<PermissionRoute permission="canteen_inspections.index" />}>
 *     <Route path="/form/canteen" element={<Layout><CanteenInterface /></Layout>} />
 *   </Route>
 *
 *   // Multiple (all required)
 *   <Route element={<PermissionRoute permission={['users.index']} />}>
 *     <Route path="/user-management" element={<Layout><UserManagementPage /></Layout>} />
 *   </Route>
 * ------------------------------------------------------------------
 *
 * Props:
 *  permission   {string | string[]}  – permission key(s) required to access child routes
 */
export default function PermissionRoute({ permission }) {
  const { isAuthenticated, isHydrating, hasPermission } = useAuth();

  if (isHydrating) return null;

  // Not logged in at all — PrivateRoute handles this upstream, but guard anyway
  if (!isAuthenticated) return null;

  const keys = Array.isArray(permission) ? permission : [permission];
  const allowed = keys.every((k) => hasPermission(k));

  if (!allowed) {
    return <AccessDenied permissionKey={keys[0]} />;
  }

  return <Outlet />;
}
