/**
 * authSlice.js
 *
 * Manages authentication state:
 *   - user object (from login response)
 *   - isAuthenticated flag
 *   - loading / error for login
 *
 * Thunks:
 *   loginThunk(email, password)   — calls AuthService, stores token+user
 *   logoutThunk()                 — clears token, resets state
 *   hydrateAuth()                 — restores state from TokenService on app load
 */
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import AuthService from '../../services/auth.service';

// ── Async thunks ─────────────────────────────────────────────────────────────

export const loginThunk = createAsyncThunk(
  'auth/login',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const user = await AuthService.login(email, password);
      return user;   // AuthService.login resolves with the user object after saving the token
    } catch (err) {
      const msg =
        err?.response?.data?.error ||
        err?.message ||
        'Login failed.';
      return rejectWithValue(msg);
    }
  }
);

export const logoutThunk = createAsyncThunk('auth/logout', async () => {
  AuthService.logout();   // synchronous — just clears token from storage
});

export const hydrateAuth = createAsyncThunk('auth/hydrate', async () => {
  const user = AuthService.getCurrentUser();
  const authenticated = AuthService.isAuthenticated();
  if (authenticated && user) return user;
  return null;
});

// ── Slice ─────────────────────────────────────────────────────────────────────

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    isAuthenticated: false,
    loading: false,
    error: null,
  },
  reducers: {
    // Allows setting error manually (e.g. from a component)
    clearAuthError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // ── loginThunk ──
    builder
      .addCase(loginThunk.pending, (state) => {
        state.loading = true;
        state.error   = null;
      })
      .addCase(loginThunk.fulfilled, (state, action) => {
        state.loading         = false;
        state.user            = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(loginThunk.rejected, (state, action) => {
        state.loading         = false;
        state.error           = action.payload;
        state.isAuthenticated = false;
        state.user            = null;
      });

    // ── logoutThunk ──
    builder
      .addCase(logoutThunk.fulfilled, (state) => {
        state.user            = null;
        state.isAuthenticated = false;
        state.loading         = false;
        state.error           = null;
      });

    // ── hydrateAuth ──
    builder
      .addCase(hydrateAuth.fulfilled, (state, action) => {
        if (action.payload) {
          state.user            = action.payload;
          state.isAuthenticated = true;
        }
      });
  },
});

export const { clearAuthError } = authSlice.actions;

// ── Selectors ─────────────────────────────────────────────────────────────────
export const selectUser            = (state) => state.auth.user;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectAuthLoading     = (state) => state.auth.loading;
export const selectAuthError       = (state) => state.auth.error;
export const selectRole            = (state) => state.auth.user?.role?.name ?? null;

/**
 * Returns a plain Set<string> of permission keys.
 * Memoisation is handled in useAuth via useMemo; here we return the raw array.
 */
export const selectPermissionKeys  = (state) =>
  state.auth.user?.role?.permissions?.map((p) => p.key) ?? [];

export default authSlice.reducer;
