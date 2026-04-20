import React from 'react';
import useAuth from '../hooks/useAuth';
import AccessDenied from '../pages/AccessDenied';

/**
 * PermissionGate
 *
 * Conditionally renders children based on the user's permissions.
 *
 * ------------------------------------------------------------------
 * USAGE — inline (hide a button / section):
 *
 *   <PermissionGate permission="canteen_inspections.destroy">
 *     <button onClick={handleDelete}>Delete</button>
 *   </PermissionGate>
 *
 * USAGE — page-level (show AccessDenied instead of the page content):
 *
 *   <PermissionGate permission="canteen_inspections.index" page>
 *     <CanteenTable />
 *   </PermissionGate>
 *
 * USAGE — multiple permissions (ALL must be present):
 *
 *   <PermissionGate permission={['users.index', 'users.create']}>
 *     ...
 *   </PermissionGate>
 *
 * USAGE — multiple permissions (ANY is sufficient):
 *
 *   <PermissionGate permission={['users.create', 'users.update']} any>
 *     ...
 *   </PermissionGate>
 *
 * Props:
 *  permission   {string | string[]}  – required permission key(s)
 *  any          {boolean}            – if true, ANY one permission is enough (default: all required)
 *  page         {boolean}            – if true, renders full AccessDenied page on failure
 *  fallback     {ReactNode}          – custom fallback (overrides default behaviour)
 *  children     {ReactNode}
 * ------------------------------------------------------------------
 */
export default function PermissionGate({
  permission,
  any = false,
  page = false,
  fallback = null,
  children,
}) {
  const { hasPermission } = useAuth();

  const keys = Array.isArray(permission) ? permission : [permission];

  const allowed = any
    ? keys.some((k) => hasPermission(k))
    : keys.every((k) => hasPermission(k));

  if (allowed) return <>{children}</>;

  // Custom fallback provided
  if (fallback !== null) return <>{fallback}</>;

  // Page-level: render full AccessDenied screen
  if (page) {
    return <AccessDenied permissionKey={keys[0]} />;
  }

  // Inline: render nothing (button/section simply disappears)
  return null;
}
