/**
 * rolesSlice.js
 *
 * Manages the /roles page state:
 *   - roles list (name, description, permissions[])
 *   - allPermissions (from PermissionsService)
 *
 * Thunks:
 *   fetchRolesAndPermissions()
 *   createRoleThunk(payload)
 *   updateRoleThunk({ id, payload })
 *   deleteRoleThunk(id)
 *   setPermissionsThunk({ id, keys[] })      — idempotent add
 *   revokePermissionsThunk({ id, keys[] })   — idempotent remove
 */
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import RolesService       from '../../services/roles.service';
import PermissionsService from '../../services/permissions.service';

// ── Async thunks ─────────────────────────────────────────────────────────────

export const fetchRolesAndPermissions = createAsyncThunk(
  'roles/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const [rolesRes, permsRes] = await Promise.all([
        RolesService.list(),
        PermissionsService.list(),
      ]);
      return {
        roles:          Array.isArray(rolesRes) ? rolesRes : (rolesRes.data ?? []),
        allPermissions: Array.isArray(permsRes) ? permsRes : (permsRes.data ?? []),
      };
    } catch (err) {
      return rejectWithValue(err?.response?.data?.error || 'Failed to load roles.');
    }
  }
);

export const createRoleThunk = createAsyncThunk(
  'roles/create',
  async (payload, { rejectWithValue }) => {
    try {
      const res = await RolesService.create(payload);
      return res.role ?? res;
    } catch (err) {
      return rejectWithValue(err?.response?.data?.error || 'Failed to create role.');
    }
  }
);

export const updateRoleThunk = createAsyncThunk(
  'roles/update',
  async ({ id, payload }, { rejectWithValue }) => {
    try {
      const res = await RolesService.update(id, payload);
      return res.role ?? res;
    } catch (err) {
      return rejectWithValue(err?.response?.data?.error || 'Failed to update role.');
    }
  }
);

export const deleteRoleThunk = createAsyncThunk(
  'roles/delete',
  async (id, { rejectWithValue }) => {
    try {
      await RolesService.remove(id);
      return id;
    } catch (err) {
      return rejectWithValue(err?.response?.data?.error || 'Failed to delete role.');
    }
  }
);

export const setPermissionsThunk = createAsyncThunk(
  'roles/setPermissions',
  async ({ id, keysToSet, keysToRevoke, allPermissions }, { rejectWithValue }) => {
    try {
      if (keysToRevoke.length > 0) await RolesService.revokePermissions(id, keysToRevoke);
      if (keysToSet.length   > 0) await RolesService.setPermissions(id, keysToSet);
      // Return the updated permissions array
      const updatedPerms = allPermissions.filter((p) => keysToSet.includes(p.key));
      return { id, permissions: updatedPerms };
    } catch (err) {
      return rejectWithValue(err?.response?.data?.error || 'Failed to save permissions.');
    }
  }
);

// ── Slice ─────────────────────────────────────────────────────────────────────

const rolesSlice = createSlice({
  name: 'roles',
  initialState: {
    items: [],
    allPermissions: [],
    loading: false,
    error: null,
    permissionsLoading: false,
    permissionsError: null,
  },
  reducers: {
    clearRolesError(state)       { state.error = null; },
    clearPermissionsError(state) { state.permissionsError = null; },
  },
  extraReducers: (builder) => {
    // ── fetchRolesAndPermissions ──
    builder
      .addCase(fetchRolesAndPermissions.pending, (state) => {
        state.loading = true;
        state.error   = null;
      })
      .addCase(fetchRolesAndPermissions.fulfilled, (state, action) => {
        state.loading        = false;
        state.items          = action.payload.roles;
        state.allPermissions = action.payload.allPermissions;
      })
      .addCase(fetchRolesAndPermissions.rejected, (state, action) => {
        state.loading = false;
        state.error   = action.payload;
      });

    // ── createRoleThunk ──
    builder
      .addCase(createRoleThunk.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
      })
      .addCase(createRoleThunk.rejected, (state, action) => {
        state.error = action.payload;
      });

    // ── updateRoleThunk ──
    builder
      .addCase(updateRoleThunk.fulfilled, (state, action) => {
        const idx = state.items.findIndex((r) => r.id === action.payload.id);
        if (idx !== -1) state.items[idx] = action.payload;
      })
      .addCase(updateRoleThunk.rejected, (state, action) => {
        state.error = action.payload;
      });

    // ── deleteRoleThunk ──
    builder
      .addCase(deleteRoleThunk.fulfilled, (state, action) => {
        state.items = state.items.filter((r) => r.id !== action.payload);
      })
      .addCase(deleteRoleThunk.rejected, (state, action) => {
        state.error = action.payload;
      });

    // ── setPermissionsThunk ──
    builder
      .addCase(setPermissionsThunk.pending, (state) => {
        state.permissionsLoading = true;
        state.permissionsError   = null;
      })
      .addCase(setPermissionsThunk.fulfilled, (state, action) => {
        state.permissionsLoading = false;
        const idx = state.items.findIndex((r) => r.id === action.payload.id);
        if (idx !== -1) state.items[idx].permissions = action.payload.permissions;
      })
      .addCase(setPermissionsThunk.rejected, (state, action) => {
        state.permissionsLoading = false;
        state.permissionsError   = action.payload;
      });
  },
});

export const { clearRolesError, clearPermissionsError } = rolesSlice.actions;

// ── Selectors ─────────────────────────────────────────────────────────────────
export const selectRoles              = (state) => state.roles.items;
export const selectAllPermissions     = (state) => state.roles.allPermissions;
export const selectRolesLoading       = (state) => state.roles.loading;
export const selectRolesError         = (state) => state.roles.error;
export const selectPermissionsLoading = (state) => state.roles.permissionsLoading;
export const selectPermissionsError   = (state) => state.roles.permissionsError;

export default rolesSlice.reducer;
