/**
 * roles.service.js — Roles & Permissions API
 *
 * Endpoints:
 *   GET    /roles                        (roles.view)
 *   GET    /roles/:id                    (roles.view)
 *   POST   /roles                        (roles.create)
 *   PUT    /roles/:id                    (roles.update)
 *   DELETE /roles/:id                    (roles.delete)
 *   POST   /roles/:id/set_permissions    (roles.update)
 *   POST   /roles/:id/revoke_permissions (roles.update)
 *
 * Delete constraint: blocked if role has assigned users
 *   → { error: { message, code: "role_in_use", user_count } }
 */

import api from './index';

const RolesService = {
  list: () => api.get('/roles'),

  getById: (id) => api.get(`/roles/${id}`),

  /**
   * POST /roles
   * Body: { role: { name, description? } }
   */
  create: (roleData) => api.post('/roles', { role: roleData }),

  /**
   * PUT /roles/:id
   * Body: { role: { name?, description? } }
   */
  update: (id, roleData) => api.put(`/roles/${id}`, { role: roleData }),

  /**
   * DELETE /roles/:id
   * Blocked if role has users → 422 with code "role_in_use"
   */
  remove: (id) => api.delete(`/roles/${id}`),

  /**
   * POST /roles/:id/set_permissions
   * Idempotent — already-attached permissions are skipped.
   * Body: { permission_keys: string[] }
   * Returns: { added: string[], skipped: string[] }
   */
  setPermissions: (id, permissionKeys) =>
    api.post(`/roles/${id}/set_permissions`, { permission_keys: permissionKeys }),

  /**
   * POST /roles/:id/revoke_permissions
   * Idempotent — already-absent permissions are skipped.
   * Body: { permission_keys: string[] }
   * Returns: { revoked: string[], skipped: string[] }
   */
  revokePermissions: (id, permissionKeys) =>
    api.post(`/roles/${id}/revoke_permissions`, { permission_keys: permissionKeys }),
};

export default RolesService;
