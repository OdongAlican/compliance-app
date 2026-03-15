/**
 * ppeSlice.js
 *
 * Redux Toolkit slice for the PPE Inspection module.
 *
 * State shape:
 *  setups:        PPE inspection setup list
 *  setupsMeta:    pagination { page, per_page, total, total_pages }
 *  setupsLoading: list fetch in flight
 *  setupsError:   list fetch error message
 *  actionLoading: create / update / delete / reassign in flight
 *  actionError:   action error message
 *  filters:       current filter values (drives list re-fetch)
 */
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { PpeSetupService } from '../../services/ppe.service';

// ── Async thunks ──────────────────────────────────────────────────────────────

/** Fetch paginated PPE inspection setups with current filters */
export const fetchPpeSetups = createAsyncThunk(
  'ppe/fetchSetups',
  async (params = {}, { getState, rejectWithValue }) => {
    try {
      const { filters } = getState().ppe;
      const query = {
        page:     filters.page,
        per_page: filters.per_page,
        ...(filters.name              ? { 'filter[name]':              filters.name              } : {}),
        ...(filters.department        ? { 'filter[department]':        filters.department        } : {}),
        ...(filters.ppe_user_id       ? { 'filter[ppe_user_id]':       filters.ppe_user_id       } : {}),
        ...(filters.date_from         ? { 'filter[date_from]':         filters.date_from         } : {}),
        ...(filters.date_to           ? { 'filter[date_to]':           filters.date_to           } : {}),
        ...(filters.safety_officer_id ? { 'filter[safety_officer_id]': filters.safety_officer_id } : {}),
        ...(filters.supervisor_id     ? { 'filter[supervisor_id]':     filters.supervisor_id     } : {}),
        ...params,
      };
      const res  = await PpeSetupService.list(query);
      const data = Array.isArray(res) ? res : (res.data ?? []);
      const meta = res.meta ?? null;
      return { data, meta };
    } catch (err) {
      return rejectWithValue(
        err?.response?.data?.errors?.[0] ||
        err?.response?.data?.error ||
        'Failed to load PPE inspections.'
      );
    }
  }
);

/** Create a new PPE inspection setup */
export const createPpeSetup = createAsyncThunk(
  'ppe/createSetup',
  async (data, { rejectWithValue }) => {
    try {
      const res = await PpeSetupService.create(data);
      return res.data ?? res;
    } catch (err) {
      return rejectWithValue(
        err?.response?.data?.errors?.join(', ') ||
        err?.response?.data?.error ||
        'Failed to create PPE inspection.'
      );
    }
  }
);

/** Update an existing PPE inspection setup */
export const updatePpeSetup = createAsyncThunk(
  'ppe/updateSetup',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const res = await PpeSetupService.update(id, data);
      return res.data ?? res;
    } catch (err) {
      return rejectWithValue(
        err?.response?.data?.errors?.join(', ') ||
        err?.response?.data?.error ||
        'Failed to update PPE inspection.'
      );
    }
  }
);

/** Delete a PPE inspection setup */
export const deletePpeSetup = createAsyncThunk(
  'ppe/deleteSetup',
  async (id, { rejectWithValue }) => {
    try {
      await PpeSetupService.remove(id);
      return id;
    } catch (err) {
      return rejectWithValue(
        err?.response?.data?.error || 'Failed to delete PPE inspection.'
      );
    }
  }
);

/** Reassign supervisor on a PPE inspection setup */
export const reassignPpeSupervisor = createAsyncThunk(
  'ppe/reassignSupervisor',
  async ({ id, supervisorId }, { rejectWithValue }) => {
    try {
      const res = await PpeSetupService.reassignSupervisor(id, supervisorId);
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

/** Reassign safety officer on a PPE inspection setup */
export const reassignPpeSafetyOfficer = createAsyncThunk(
  'ppe/reassignSafetyOfficer',
  async ({ id, safetyOfficerId }, { rejectWithValue }) => {
    try {
      const res = await PpeSetupService.reassignSafetyOfficer(id, safetyOfficerId);
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
  name:              '',
  department:        '',
  ppe_user_id:       '',
  date_from:         '',
  date_to:           '',
  safety_officer_id: '',
  supervisor_id:     '',
};

const ppeSlice = createSlice({
  name: 'ppe',
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
    /**
     * Generic filter setter — resets page to 1 for every filter key except 'page'.
     * Usage: dispatch(setPpeFilter({ key: 'department', value: 'HR' }))
     */
    setPpeFilter: (s, { payload: { key, value } }) => {
      s.filters[key] = value;
      if (key !== 'page') s.filters.page = 1;
    },

    /** Convenience: set page without resetting other filters */
    setPpePage: (s, { payload }) => {
      s.filters.page = payload;
    },

    /** Clear all filters back to defaults */
    clearPpeFilters: (s) => { s.filters = INITIAL_FILTERS; },

    /** Clear list-fetch error */
    clearPpeError: (s) => { s.setupsError = null; },

    /** Clear action (create/update/delete/reassign) error */
    clearPpeActionError: (s) => { s.actionError = null; },
  },
  extraReducers: (builder) => {
    // ── fetchPpeSetups ─────────────────────────────────────────────────────
    builder
      .addCase(fetchPpeSetups.pending, (s) => {
        s.setupsLoading = true;
        s.setupsError   = null;
      })
      .addCase(fetchPpeSetups.fulfilled, (s, a) => {
        s.setupsLoading = false;
        s.setups        = a.payload.data;
        s.setupsMeta    = a.payload.meta;
      })
      .addCase(fetchPpeSetups.rejected, (s, a) => {
        s.setupsLoading = false;
        s.setupsError   = a.payload;
      });

    // ── createPpeSetup ─────────────────────────────────────────────────────
    builder
      .addCase(createPpeSetup.pending, (s) => {
        s.actionLoading = true;
        s.actionError   = null;
      })
      .addCase(createPpeSetup.fulfilled, (s, a) => {
        s.actionLoading = false;
        s.setups.unshift(a.payload);
        if (s.setupsMeta) s.setupsMeta.total += 1;
      })
      .addCase(createPpeSetup.rejected, (s, a) => {
        s.actionLoading = false;
        s.actionError   = a.payload;
      });

    // ── updatePpeSetup ─────────────────────────────────────────────────────
    builder
      .addCase(updatePpeSetup.pending, (s) => {
        s.actionLoading = true;
        s.actionError   = null;
      })
      .addCase(updatePpeSetup.fulfilled, (s, a) => {
        s.actionLoading = false;
        const idx = s.setups.findIndex((x) => x.id === a.payload.id);
        if (idx !== -1) s.setups[idx] = a.payload;
      })
      .addCase(updatePpeSetup.rejected, (s, a) => {
        s.actionLoading = false;
        s.actionError   = a.payload;
      });

    // ── deletePpeSetup ─────────────────────────────────────────────────────
    builder
      .addCase(deletePpeSetup.pending, (s) => {
        s.actionLoading = true;
        s.actionError   = null;
      })
      .addCase(deletePpeSetup.fulfilled, (s, a) => {
        s.actionLoading = false;
        s.setups        = s.setups.filter((x) => x.id !== a.payload);
        if (s.setupsMeta) s.setupsMeta.total = Math.max(0, s.setupsMeta.total - 1);
      })
      .addCase(deletePpeSetup.rejected, (s, a) => {
        s.actionLoading = false;
        s.actionError   = a.payload;
      });

    // ── reassign helpers ───────────────────────────────────────────────────
    const handleReassignPending  = (s) => { s.actionLoading = true;  s.actionError = null; };
    const handleReassignFulfilled = (s, a) => {
      s.actionLoading = false;
      const updated = a.payload;
      if (!updated?.id) return;
      const idx = s.setups.findIndex((x) => x.id === updated.id);
      if (idx !== -1) s.setups[idx] = updated;
    };
    const handleReassignRejected = (s, a) => { s.actionLoading = false; s.actionError = a.payload; };

    builder
      .addCase(reassignPpeSupervisor.pending,      handleReassignPending)
      .addCase(reassignPpeSupervisor.fulfilled,    handleReassignFulfilled)
      .addCase(reassignPpeSupervisor.rejected,     handleReassignRejected)
      .addCase(reassignPpeSafetyOfficer.pending,   handleReassignPending)
      .addCase(reassignPpeSafetyOfficer.fulfilled, handleReassignFulfilled)
      .addCase(reassignPpeSafetyOfficer.rejected,  handleReassignRejected);
  },
});

export const {
  setPpeFilter,
  setPpePage,
  clearPpeFilters,
  clearPpeError,
  clearPpeActionError,
} = ppeSlice.actions;

// ── Selectors ─────────────────────────────────────────────────────────────────
export const selectPpeSetups       = (s) => s.ppe.setups;
export const selectPpeSetupsMeta   = (s) => s.ppe.setupsMeta;
export const selectPpeLoading      = (s) => s.ppe.setupsLoading;
export const selectPpeError        = (s) => s.ppe.setupsError;
export const selectPpeActionLoading = (s) => s.ppe.actionLoading;
export const selectPpeActionError   = (s) => s.ppe.actionError;
export const selectPpeFilters       = (s) => s.ppe.filters;

export default ppeSlice.reducer;
