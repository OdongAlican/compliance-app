/**
 * usersSlice.js
 *
 * Manages the /user-management page state:
 *   - paginated users list
 *   - filter state (search, roleTab, page)
 *   - CRUD loading / error per-operation
 *
 * Thunks:
 *   fetchUsers()          — load page from API
 *   createUserThunk()     — POST, prepends to list
 *   updateUserThunk()     — PUT, replaces in list
 *   deleteUserThunk()     — DELETE, removes from list
 *   setUserRoleThunk()    — POST set_role
 */
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import UsersService from '../../services/users.service';

const PER_PAGE = 20;

// ── Async thunks ─────────────────────────────────────────────────────────────

export const fetchUsers = createAsyncThunk(
  'users/fetchUsers',
  async (_, { getState, rejectWithValue }) => {
    const { page, search, roleTab } = getState().users.filters;
    try {
      const params = {
        page,
        per_page: PER_PAGE,
        ...(search.trim() && {
          'filter[firstname]': search.trim(),
          'filter[email]': search.trim(),
          'filter[staff_id]': search.trim(),
        }),
        ...(roleTab !== 'All' && { 'filter[role]': roleTab }),
      };
      const res = await UsersService.list(params);
      return { data: res.data ?? [], meta: res.meta ?? null };
    } catch (err) {
      return rejectWithValue(err?.response?.data?.error || 'Failed to load users.');
    }
  }
);

export const createUserThunk = createAsyncThunk(
  'users/create',
  async (userData, { rejectWithValue }) => {
    try {
      const res = await UsersService.create({ user: userData });
      return res.user ?? res;
    } catch (err) {
      return rejectWithValue(err?.response?.data?.error || 'Failed to create user.');
    }
  }
);

export const updateUserThunk = createAsyncThunk(
  'users/update',
  async ({ id, userData }, { rejectWithValue }) => {
    try {
      const res = await UsersService.update(id, { user: userData });
      return res.user ?? res;
    } catch (err) {
      return rejectWithValue(err?.response?.data?.error || 'Failed to update user.');
    }
  }
);

export const deleteUserThunk = createAsyncThunk(
  'users/delete',
  async (id, { rejectWithValue }) => {
    try {
      await UsersService.remove(id);
      return id;
    } catch (err) {
      return rejectWithValue(err?.response?.data?.error || 'Failed to delete user.');
    }
  }
);

export const setUserRoleThunk = createAsyncThunk(
  'users/setRole',
  async ({ id, roleId }, { rejectWithValue }) => {
    try {
      const res = await UsersService.setRole(id, roleId);
      return res.user ?? res;
    } catch (err) {
      return rejectWithValue(err?.response?.data?.error || 'Failed to set role.');
    }
  }
);

// ── Slice ─────────────────────────────────────────────────────────────────────

const usersSlice = createSlice({
  name: 'users',
  initialState: {
    items: [],
    meta: null,
    loading: false,
    error: null,

    // Filters — mutating these triggers a re-fetch from the component
    filters: {
      page: 1,
      search: '',
      roleTab: 'All',
    },
  },
  reducers: {
    setPage(state, action)    { state.filters.page = action.payload; },
    setSearch(state, action)  { state.filters.search = action.payload; state.filters.page = 1; },
    setRoleTab(state, action) { state.filters.roleTab = action.payload; state.filters.page = 1; },
    clearUsersError(state)    { state.error = null; },
  },
  extraReducers: (builder) => {
    // ── fetchUsers ──
    builder
      .addCase(fetchUsers.pending, (state) => {
        state.loading = true;
        state.error   = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.items   = action.payload.data;
        state.meta    = action.payload.meta;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = false;
        state.error   = action.payload;
      });

    // ── createUserThunk ──
    builder
      .addCase(createUserThunk.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
      })
      .addCase(createUserThunk.rejected, (state, action) => {
        state.error = action.payload;
      });

    // ── updateUserThunk ──
    builder
      .addCase(updateUserThunk.fulfilled, (state, action) => {
        const idx = state.items.findIndex((u) => u.id === action.payload.id);
        if (idx !== -1) state.items[idx] = action.payload;
      })
      .addCase(updateUserThunk.rejected, (state, action) => {
        state.error = action.payload;
      });

    // ── deleteUserThunk ──
    builder
      .addCase(deleteUserThunk.fulfilled, (state, action) => {
        state.items = state.items.filter((u) => u.id !== action.payload);
      })
      .addCase(deleteUserThunk.rejected, (state, action) => {
        state.error = action.payload;
      });

    // ── setUserRoleThunk ──
    builder
      .addCase(setUserRoleThunk.fulfilled, (state, action) => {
        const idx = state.items.findIndex((u) => u.id === action.payload.id);
        if (idx !== -1) state.items[idx] = action.payload;
      })
      .addCase(setUserRoleThunk.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

export const { setPage, setSearch, setRoleTab, clearUsersError } = usersSlice.actions;

// ── Selectors ─────────────────────────────────────────────────────────────────
export const selectUsers        = (state) => state.users.items;
export const selectUsersMeta    = (state) => state.users.meta;
export const selectUsersLoading = (state) => state.users.loading;
export const selectUsersError   = (state) => state.users.error;
export const selectUsersFilters = (state) => state.users.filters;
export const selectExistingStaffIds = (state) =>
  new Set(state.users.items.map((u) => u.staff_id).filter(Boolean));

export default usersSlice.reducer;
