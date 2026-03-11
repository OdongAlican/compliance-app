/**
 * canteenSlice.js
 *
 * Redux Toolkit slice for the Canteen Inspection module.
 *
 * State shape:
 *  setups:        canteen inspection setup list
 *  setupsMeta:    pagination
 *  setupsLoading: list fetch in flight
 *  setupsError:   list fetch error
 *  actionLoading: create / update / delete / reassign in flight
 *  actionError:   action error message
 *  filters:       current filter values (drives list refetch)
 */
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { CanteenSetupService } from '../../services/canteen.service';

// ── Async thunks ──────────────────────────────────────────────────────────────

/** Fetch paginated canteen inspection setups with current filters */
export const fetchCanteenSetups = createAsyncThunk(
  'canteen/fetchSetups',
  async (params = {}, { getState, rejectWithValue }) => {
    try {
      const { filters } = getState().canteen;
      const query = {
        page:     filters.page,
        per_page: filters.per_page,
        ...(filters.name        ? { 'filter[name]': filters.name }               : {}),
        ...(filters.location    ? { 'filter[location]': filters.location }       : {}),
        ...(filters.date_from   ? { 'filter[date_from]': filters.date_from }     : {}),
        ...(filters.date_to     ? { 'filter[date_to]': filters.date_to }         : {}),
        ...(filters.safety_officer_id ? { 'filter[safety_officer_id]': filters.safety_officer_id } : {}),
        ...(filters.supervisor_id     ? { 'filter[supervisor_id]': filters.supervisor_id }           : {}),
        ...params,
      };
      const res = await CanteenSetupService.list(query);
      // API returns { data: [...], meta: {...} } or just [...] 
      const data  = Array.isArray(res) ? res : (res.data ?? []);
      const meta  = res.meta ?? null;
      return { data, meta };
    } catch (err) {
      return rejectWithValue(
        err?.response?.data?.errors?.[0] ||
        err?.response?.data?.error ||
        'Failed to load canteen inspections.'
      );
    }
  }
);

/** Create a new canteen inspection setup */
export const createCanteenSetup = createAsyncThunk(
  'canteen/createSetup',
  async (data, { rejectWithValue }) => {
    try {
      const res = await CanteenSetupService.create(data);
      return res.data ?? res;
    } catch (err) {
      return rejectWithValue(
        err?.response?.data?.errors?.join(', ') ||
        err?.response?.data?.error ||
        'Failed to create canteen inspection.'
      );
    }
  }
);

/** Update an existing canteen inspection setup */
export const updateCanteenSetup = createAsyncThunk(
  'canteen/updateSetup',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const res = await CanteenSetupService.update(id, data);
      return res.data ?? res;
    } catch (err) {
      return rejectWithValue(
        err?.response?.data?.errors?.join(', ') ||
        err?.response?.data?.error ||
        'Failed to update canteen inspection.'
      );
    }
  }
);

/** Delete a canteen inspection setup */
export const deleteCanteenSetup = createAsyncThunk(
  'canteen/deleteSetup',
  async (id, { rejectWithValue }) => {
    try {
      await CanteenSetupService.remove(id);
      return id;
    } catch (err) {
      return rejectWithValue(
        err?.response?.data?.error || 'Failed to delete canteen inspection.'
      );
    }
  }
);

/** Reassign supervisor */
export const reassignCanteenSupervisor = createAsyncThunk(
  'canteen/reassignSupervisor',
  async ({ id, supervisorId }, { rejectWithValue }) => {
    try {
      const res = await CanteenSetupService.reassignSupervisor(id, supervisorId);
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
export const reassignCanteenSafetyOfficer = createAsyncThunk(
  'canteen/reassignSafetyOfficer',
  async ({ id, safetyOfficerId }, { rejectWithValue }) => {
    try {
      const res = await CanteenSetupService.reassignSafetyOfficer(id, safetyOfficerId);
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
  per_page:          10,
  name:              '',
  location:          '',
  date_from:         '',
  date_to:           '',
  safety_officer_id: '',
  supervisor_id:     '',
};

const canteenSlice = createSlice({
  name: 'canteen',
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
    // Filter updaters — each resets page to 1
    setCanteenPage:      (s, a) => { s.filters.page = a.payload; },
    setCanteenName:      (s, a) => { s.filters.name = a.payload;     s.filters.page = 1; },
    setCanteenLocation:  (s, a) => { s.filters.location = a.payload; s.filters.page = 1; },
    setCanteenDateFrom:  (s, a) => { s.filters.date_from = a.payload; s.filters.page = 1; },
    setCanteenDateTo:    (s, a) => { s.filters.date_to = a.payload;   s.filters.page = 1; },
    setCanteenSOFilter:  (s, a) => { s.filters.safety_officer_id = a.payload; s.filters.page = 1; },
    setCanteenSupFilter: (s, a) => { s.filters.supervisor_id = a.payload;     s.filters.page = 1; },
    clearCanteenFilters: (s)    => { s.filters = INITIAL_FILTERS; },
    clearCanteenError:   (s)    => { s.setupsError = null; },
    clearActionError:    (s)    => { s.actionError = null; },
  },
  extraReducers: (builder) => {
    // ── fetchCanteenSetups ─────────────────────────────────────────────────
    builder
      .addCase(fetchCanteenSetups.pending, (s) => {
        s.setupsLoading = true;
        s.setupsError   = null;
      })
      .addCase(fetchCanteenSetups.fulfilled, (s, a) => {
        s.setupsLoading = false;
        s.setups        = a.payload.data;
        s.setupsMeta    = a.payload.meta;
      })
      .addCase(fetchCanteenSetups.rejected, (s, a) => {
        s.setupsLoading = false;
        s.setupsError   = a.payload;
      });

    // ── createCanteenSetup ──────────────────────────────────────────────────
    builder
      .addCase(createCanteenSetup.pending, (s) => {
        s.actionLoading = true;
        s.actionError   = null;
      })
      .addCase(createCanteenSetup.fulfilled, (s, a) => {
        s.actionLoading = false;
        s.setups.unshift(a.payload);
        if (s.setupsMeta) s.setupsMeta.total += 1;
      })
      .addCase(createCanteenSetup.rejected, (s, a) => {
        s.actionLoading = false;
        s.actionError   = a.payload;
      });

    // ── updateCanteenSetup ──────────────────────────────────────────────────
    builder
      .addCase(updateCanteenSetup.pending, (s) => {
        s.actionLoading = true;
        s.actionError   = null;
      })
      .addCase(updateCanteenSetup.fulfilled, (s, a) => {
        s.actionLoading = false;
        const idx = s.setups.findIndex((x) => x.id === a.payload.id);
        if (idx !== -1) s.setups[idx] = a.payload;
      })
      .addCase(updateCanteenSetup.rejected, (s, a) => {
        s.actionLoading = false;
        s.actionError   = a.payload;
      });

    // ── deleteCanteenSetup ──────────────────────────────────────────────────
    builder
      .addCase(deleteCanteenSetup.pending, (s) => {
        s.actionLoading = true;
        s.actionError   = null;
      })
      .addCase(deleteCanteenSetup.fulfilled, (s, a) => {
        s.actionLoading = false;
        s.setups        = s.setups.filter((x) => x.id !== a.payload);
        if (s.setupsMeta) s.setupsMeta.total = Math.max(0, s.setupsMeta.total - 1);
      })
      .addCase(deleteCanteenSetup.rejected, (s, a) => {
        s.actionLoading = false;
        s.actionError   = a.payload;
      });

    // ── reassign ────────────────────────────────────────────────────────────
    const handleReassign = (s, a) => {
      s.actionLoading = false;
      const updated = a.payload;
      if (!updated?.id) return;
      const idx = s.setups.findIndex((x) => x.id === updated.id);
      if (idx !== -1) s.setups[idx] = updated;
    };
    const handleReassignPending   = (s) => { s.actionLoading = true;  s.actionError = null; };
    const handleReassignRejected  = (s, a) => { s.actionLoading = false; s.actionError = a.payload; };

    builder
      .addCase(reassignCanteenSupervisor.pending,   handleReassignPending)
      .addCase(reassignCanteenSupervisor.fulfilled,  handleReassign)
      .addCase(reassignCanteenSupervisor.rejected,   handleReassignRejected)
      .addCase(reassignCanteenSafetyOfficer.pending, handleReassignPending)
      .addCase(reassignCanteenSafetyOfficer.fulfilled, handleReassign)
      .addCase(reassignCanteenSafetyOfficer.rejected,  handleReassignRejected);
  },
});

export const {
  setCanteenPage,
  setCanteenName,
  setCanteenLocation,
  setCanteenDateFrom,
  setCanteenDateTo,
  setCanteenSOFilter,
  setCanteenSupFilter,
  clearCanteenFilters,
  clearCanteenError,
  clearActionError,
} = canteenSlice.actions;

// ── Selectors ─────────────────────────────────────────────────────────────────
export const selectCanteenSetups       = (s) => s.canteen.setups;
export const selectCanteenMeta         = (s) => s.canteen.setupsMeta;
export const selectCanteenLoading      = (s) => s.canteen.setupsLoading;
export const selectCanteenError        = (s) => s.canteen.setupsError;
export const selectCanteenActionLoading = (s) => s.canteen.actionLoading;
export const selectCanteenActionError   = (s) => s.canteen.actionError;
export const selectCanteenFilters       = (s) => s.canteen.filters;

export default canteenSlice.reducer;
