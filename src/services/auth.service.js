/**
 * auth.service.js — Rails API auth contract (stateless JWT).
 *
 * Not implemented by backend (do NOT call):
 *   refresh token, logout endpoint, /me, forgot/reset password, self-signup.
 *
 * Token expiry: 24 h — JWT exp claim checked client-side.
 */
import api, { TokenService } from './index';

const AuthService = {
  /**
   * POST /auth/login
   * Body: { email, password }
   * Returns: { token, user { id, email, firstname, lastname, role { permissions[] } } }
   */
  login: async (email, password) => {
    const data = await api.post('/auth/login', { email, password });
    TokenService.saveAuthResponse(data);
    // Return just the user object so the Redux slice shape always matches
    // what hydrateAuth restores (TokenService.getUser stores only the user).
    return data.user ?? data;
  },

  /** Client-side only — clears sessionStorage, no API call. */
  logout: () => {
    TokenService.clearAll();
  },

  getCurrentUser: () => TokenService.getUser(),

  isAuthenticated: () => {
    const token = TokenService.getAccessToken();
    if (!token) return false;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp > Math.floor(Date.now() / 1000);
    } catch {
      return Boolean(token);
    }
  },
};

export default AuthService;

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
