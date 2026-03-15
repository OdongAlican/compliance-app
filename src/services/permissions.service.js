/**
 * permissions.service.js — Permissions API
 *
 * Endpoints:
 *   GET  /permissions     (permissions.view)
 *   POST /permissions     (permissions.create)
 *   PUT  /permissions/:id (permissions.update)
 *
 * GET /roles/:role_id/permissions also exists but current backend
 * implementation returns ALL permissions regardless of role_id.
 *
 * Body wrapper: { permission: { key, description? } }
 * key must be unique (e.g. "users.view", "users.create")
 */

import api from './index';

const PermissionsService = {
  list: () => api.get('/permissions'),

  create: (permissionData) => api.post('/permissions', { permission: permissionData }),

  update: (id, permissionData) => api.put(`/permissions/${id}`, { permission: permissionData }),
};

export default PermissionsService;
