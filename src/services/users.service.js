import api from './index';

// ── Users ─────────────────────────────────────────────────────────────────────

export const getUsers    = (params = {}) => api.get('/users/', { params });
export const getUser     = (id)           => api.get(`/users/${id}/`);
export const createUser  = (payload)      => api.post('/users/', payload);
export const updateUser  = (id, payload)  => api.patch(`/users/${id}/`, payload);
export const deleteUser  = (id)           => api.delete(`/users/${id}/`);

/** PATCH /users/:id/activate/ */
export const activateUser = (id) => api.patch(`/users/${id}/activate/`);

/** PATCH /users/:id/deactivate/ */
export const deactivateUser = (id) => api.patch(`/users/${id}/deactivate/`);

/** PATCH /users/:id/reset-password/ — admin-initiated reset */
export const adminResetPassword = (id) => api.patch(`/users/${id}/reset-password/`);

// ── Roles ─────────────────────────────────────────────────────────────────────

export const getRoles = () => api.get('/users/roles/');
