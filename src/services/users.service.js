/**
 * users.service.js — User Management API
 *
 * All endpoints require Authorization: Bearer <token>
 * Write endpoints use nested wrapper: { user: { ... } }
 * Pagination: { data: User[], meta: { page, per_page, total, total_pages } }
 */
import api from './index';

const UsersService = {
  /**
   * GET /users
   * Permission: users.view
   * @param {{ page?, per_page?, filter?: { firstname?, lastname?, email?, staff_id?, role?, role_id?, gender?, phone? } }} params
   */
  list: (params = {}) => api.get('/users', { params }),

  /** GET /users/:id — Permission: users.view */
  getById: (id) => api.get(`/users/${id}`),

  /**
   * POST /users — Permission: users.create
   * Backend auto-generates + emails a temporary password. Do NOT send password.
   * Required: email, role_id, firstname, lastname, staff_id
   */
  create: (userData) => api.post('/users', { user: userData }),

  /**
   * PUT /users/:id — Permission: users.update
   * Permitted keys: email, role_id, profession_id, firstname, lastname,
   *                 othername, gender, age, phone, staff_id
   */
  update: (id, userData) => api.put(`/users/${id}`, { user: userData }),

  /** DELETE /users/:id → 204 No Content — Permission: users.delete */
  remove: (id) => api.delete(`/users/${id}`),

  /**
   * POST /users/:id/set_role — Permission: users.update
   * Body: { role_id: number }
   */
  setRole: (id, roleId) => api.post(`/users/${id}/set_role`, { role_id: roleId }),

  /**
   * POST /users/:id/upload_profile — Permission: users.update
   * multipart/form-data, field: "file"
   * Returns: { url, path }
   */
  uploadProfileImage: (id, file) => {
    const form = new FormData();
    form.append('file', file);
    return api.post(`/users/${id}/upload_profile`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  /** GET /users/:id/profile — Returns { url, path } (may be null if no image) */
  getProfileImage: (id) => api.get(`/users/${id}/profile`),
};

export default UsersService;

/** PATCH /users/:id/activate/ */
export const activateUser = (id) => api.patch(`/users/${id}/activate/`);

/** PATCH /users/:id/deactivate/ */
export const deactivateUser = (id) => api.patch(`/users/${id}/deactivate/`);

/** PATCH /users/:id/reset-password/ — admin-initiated reset */
export const adminResetPassword = (id) => api.patch(`/users/${id}/reset-password/`);

// ── Roles ─────────────────────────────────────────────────────────────────────

export const getRoles = () => api.get('/users/roles/');
