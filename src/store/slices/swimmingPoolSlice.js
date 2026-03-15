/**
 * swimmingPoolSlice.js
 *
 * Redux Toolkit slice for the Swimming Pool Inspection module.
 *
 * State shape:
 *  setups:        swimming pool inspection setup list
 *  setupsMeta:    pagination
 *  setupsLoading: list fetch in flight
 *  setupsError:   list fetch error
 *  actionLoading: create / update / delete / reassign in flight
 *  actionError:   action error message
 *  filters:       current filter values (drives list refetch)
 */
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { SwimmingPoolSetupService } from '../../services/swimmingPool.service';

// ── Async thunks ──────────────────────────────────────────────────────────────

/** Fetch paginated swimming pool inspection setups with current filters */
export const fetchSwimmingPoolSetups = createAsyncThunk(
  'swimmingPool/fetchSetups',
  async (params = {}, { getState, rejectWithValue }) => {
    try {
      const { filters } = getState().swimmingPool;
      const query = {
        page:     filters.page,
        per_page: filters.per_page,
        ...(filters.pool_type         ? { 'filter[pool_type]': filters.pool_type }                   : {}),
        ...(filters.pool_location     ? { 'filter[pool_location]': filters.pool_location }           : {}),
        ...(filters.date_from         ? { 'filter[date_from]': filters.date_from }                   : {}),
        ...(filters.date_to           ? { 'filter[date_to]': filters.date_to }                       : {}),
        ...(filters.safety_officer_id ? { 'filter[safety_officer_id]': filters.safety_officer_id }   : {}),
        ...(filters.supervisor_id     ? { 'filter[supervisor_id]': filters.supervisor_id }           : {}),
        ...params,
      };
      const res = await SwimmingPoolSetupService.list(query);
      const data = Array.isArray(res) ? res : (res.data ?? []);
      const meta = res.meta ?? null;
      return { data, meta };
    } catch (err) {
      return rejectWithValue(
        err?.response?.data?.errors?.[0] ||
        err?.response?.data?.error ||
        'Failed to load swimming pool inspections.'
      );
    }
  }
);

/** Create a new swimming pool inspection setup */
export const createSwimmingPoolSetup = createAsyncThunk(
  'swimmingPool/createSetup',
  async (data, { rejectWithValue }) => {
    try {
      const res = await SwimmingPoolSetupService.create(data);
      return res.data ?? res;
    } catch (err) {
      return rejectWithValue(
        err?.response?.data?.errors?.join(', ') ||
        err?.response?.data?.error ||
        'Failed to create swimming pool inspection.'
      );
    }
  }
);

/** Update an existing swimming pool inspection setup */
export const updateSwimmingPoolSetup = createAsyncThunk(
  'swimmingPool/updateSetup',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const res = await SwimmingPoolSetupService.update(id, data);
      return res.data ?? res;
    } catch (err) {
      return rejectWithValue(
        err?.response?.data?.errors?.join(', ') ||
        err?.response?.data?.error ||
        'Failed to update swimming pool inspection.'
      );
    }
  }
);

/** Delete a swimming pool inspection setup */
export const deleteSwimmingPoolSetup = createAsyncThunk(
  'swimmingPool/deleteSetup',
  async (id, { rejectWithValue }) => {
    try {
      await SwimmingPoolSetupService.remove(id);
      return id;
    } catch (err) {
      return rejectWithValue(
        err?.response?.data?.error || 'Failed to delete swimming pool inspection.'
      );
    }
  }
);

/** Reassign supervisor */
export const reassignSwimmingPoolSupervisor = createAsyncThunk(
  'swimmingPool/reassignSupervisor',
  async ({ id, supervisorId }, { rejectWithValue }) => {
    try {
      const res = await SwimmingPoolSetupService.reassignSupervisor(id, supervisorId);
      return res.data ?? res;
    } catch (err) {
      return rejectWithValue(
        err?.response?.data?.errors?.join(', ') ||
        err?.response?.data?.error ||
        'Failed to reassign supervisor.'
      );
    }
  }
);

/** Reassign safety officer */
export const reassignSwimmingPoolSafetyOfficer = createAsyncThunk(
  'swimmingPool/reassignSafetyOfficer',
  async ({ id, safetyOfficerId }, { rejectWithValue }) => {
    try {
      const res = await SwimmingPoolSetupService.reassignSafetyOfficer(id, safetyOfficerId);
      return res.data ?? res;
    } catch (err) {
      return rejectWithValue(
        err?.response?.data?.errors?.join(', ') ||
        err?.response?.data?.error ||
        'Failed to reassign safety officer.'
      );
    }
  }
);

// ── Slice ─────────────────────────────────────────────────────────────────────

const INITIAL_FILTERS = {
  page:              1,
  per_page:          15,
  pool_type:         '',
  pool_location:     '',
  date_from:         '',
  date_to:           '',
  safety_officer_id: '',
  supervisor_id:     '',
};

const swimmingPoolSlice = createSlice({
  name: 'swimmingPool',
  initialState: {
    setups:        [],
    setupsMeta:    null,
    setupsLoading: false,
    setupsError:   null,
    actionLoading: false,
    actionError:   null,
    filters:       INITIAL_FILTERS,
  },
  reducers: {
    setSwimmingPoolFilter: (s, a) => {
      const { key, value } = a.payload;
      s.filters[key] = value;
      if (key !== 'page') s.filters.page = 1;
    },
    setSwimmingPoolPage: (s, a) => {
      s.filters.page = a.payload;
    },
    clearSwimmingPoolFilters: (s) => { s.filters = INITIAL_FILTERS; },
    clearSwimmingPoolError:   (s) => { s.setupsError = null; },
    clearSwimmingPoolActionError: (s) => { s.actionError = null; },
  },
  extraReducers: (builder) => {
    // ── fetchSwimmingPoolSetups ────────────────────────────────────────────
    builder
      .addCase(fetchSwimmingPoolSetups.pending, (s) => {
        s.setupsLoading = true;
        s.setupsError   = null;
      })
      .addCase(fetchSwimmingPoolSetups.fulfilled, (s, a) => {
        s.setupsLoading = false;
        s.setups        = a.payload.data;
        s.setupsMeta    = a.payload.meta;
      })
      .addCase(fetchSwimmingPoolSetups.rejected, (s, a) => {
        s.setupsLoading = false;
        s.setupsError   = a.payload;
      });

    // ── createSwimmingPoolSetup ────────────────────────────────────────────
    builder
      .addCase(createSwimmingPoolSetup.pending, (s) => {
        s.actionLoading = true;
        s.actionError   = null;
      })
      .addCase(createSwimmingPoolSetup.fulfilled, (s, a) => {
        s.actionLoading = false;
        s.setups.unshift(a.payload);
        if (s.setupsMeta) s.setupsMeta.total += 1;
      })
      .addCase(createSwimmingPoolSetup.rejected, (s, a) => {
        s.actionLoading = false;
        s.actionError   = a.payload;
      });

    // ── updateSwimmingPoolSetup ────────────────────────────────────────────
    builder
      .addCase(updateSwimmingPoolSetup.pending, (s) => {
        s.actionLoading = true;
        s.actionError   = null;
      })
      .addCase(updateSwimmingPoolSetup.fulfilled, (s, a) => {
        s.actionLoading = false;
        const idx = s.setups.findIndex((x) => x.id === a.payload.id);
        if (idx !== -1) s.setups[idx] = a.payload;
      })
      .addCase(updateSwimmingPoolSetup.rejected, (s, a) => {
        s.actionLoading = false;
        s.actionError   = a.payload;
      });

    // ── deleteSwimmingPoolSetup ────────────────────────────────────────────
    builder
      .addCase(deleteSwimmingPoolSetup.pending, (s) => {
        s.actionLoading = true;
        s.actionError   = null;
      })
      .addCase(deleteSwimmingPoolSetup.fulfilled, (s, a) => {
        s.actionLoading = false;
        s.setups        = s.setups.filter((x) => x.id !== a.payload);
        if (s.setupsMeta) s.setupsMeta.total = Math.max(0, s.setupsMeta.total - 1);
      })
      .addCase(deleteSwimmingPoolSetup.rejected, (s, a) => {
        s.actionLoading = false;
        s.actionError   = a.payload;
      });

    // ── reassign ──────────────────────────────────────────────────────────
    const handleReassignPending  = (s)    => { s.actionLoading = true;  s.actionError = null; };
    const handleReassignRejected = (s, a) => { s.actionLoading = false; s.actionError = a.payload; };
    const handleReassign         = (s, a) => {
      s.actionLoading = false;
      const updated = a.payload;
      if (!updated?.id) return;
      const idx = s.setups.findIndex((x) => x.id === updated.id);
      if (idx !== -1) s.setups[idx] = updated;
    };

    builder
      .addCase(reassignSwimmingPoolSupervisor.pending,     handleReassignPending)
      .addCase(reassignSwimmingPoolSupervisor.fulfilled,   handleReassign)
      .addCase(reassignSwimmingPoolSupervisor.rejected,    handleReassignRejected)
      .addCase(reassignSwimmingPoolSafetyOfficer.pending,  handleReassignPending)
      .addCase(reassignSwimmingPoolSafetyOfficer.fulfilled, handleReassign)
      .addCase(reassignSwimmingPoolSafetyOfficer.rejected, handleReassignRejected);
  },
});

export const {
  setSwimmingPoolFilter,
  setSwimmingPoolPage,
  clearSwimmingPoolFilters,
  clearSwimmingPoolError,
  clearSwimmingPoolActionError,
} = swimmingPoolSlice.actions;

// ── Selectors ─────────────────────────────────────────────────────────────────
export const selectSwimmingPoolSetups       = (s) => s.swimmingPool.setups;
export const selectSwimmingPoolSetupsMeta   = (s) => s.swimmingPool.setupsMeta;
export const selectSwimmingPoolLoading      = (s) => s.swimmingPool.setupsLoading;
export const selectSwimmingPoolError        = (s) => s.swimmingPool.setupsError;
export const selectSwimmingPoolActionLoading = (s) => s.swimmingPool.actionLoading;
export const selectSwimmingPoolActionError   = (s) => s.swimmingPool.actionError;
export const selectSwimmingPoolFilters       = (s) => s.swimmingPool.filters;

export default swimmingPoolSlice.reducer;
