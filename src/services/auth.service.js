import api from './index';

/**
 * Auth service — wraps all /auth/* endpoints.
 * Use TokenService from services/index.js to persist returned tokens.
 */

/** POST /auth/login/ */
export const login = (email, password) =>
  api.post('/auth/login/', { email, password });

/** POST /auth/logout/ */
export const logout = (refreshToken) =>
  api.post('/auth/logout/', { refresh: refreshToken });

/** POST /auth/token/refresh/ */
export const refreshToken = (refresh) =>
  api.post('/auth/token/refresh/', { refresh });

/** POST /auth/register/ */
export const register = (payload) =>
  api.post('/auth/register/', payload);

/** POST /auth/forgot-password/ */
export const forgotPassword = (email) =>
  api.post('/auth/forgot-password/', { email });

/** POST /auth/reset-password/ */
export const resetPassword = (token, password) =>
  api.post('/auth/reset-password/', { token, password });

/** GET /auth/me/ — fetch current user profile */
export const getMe = () =>
  api.get('/auth/me/');
