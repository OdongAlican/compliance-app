import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { StartInvestigationService } from '../../services/incidents.service';

// ── Thunks ─────────────────────────────────────────────────────────────────

export const fetchStartInvestigations = createAsyncThunk(
  'startInvestigations/list',
  async (query = {}, { rejectWithValue }) => {
    try {
      const res = await StartInvestigationService.list(query);
      const data = Array.isArray(res) ? res : (res.data ?? []);
      const meta = res.meta ?? null;
      return { data, meta };
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message ?? 'Failed to fetch investigations'
      );
    }
  }
);

export const createStartInvestigation = createAsyncThunk(
  'startInvestigations/create',
  async (payload, { rejectWithValue }) => {
    try {
      const res = await StartInvestigationService.create(payload);
      return res.data ?? res;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message ?? 'Failed to create investigation'
      );
    }
  }
);

export const updateStartInvestigation = createAsyncThunk(
  'startInvestigations/update',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const res = await StartInvestigationService.update(id, data);
      return res.data ?? res;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message ?? 'Failed to update investigation'
      );
    }
  }
);

export const deleteStartInvestigation = createAsyncThunk(
  'startInvestigations/delete',
  async (id, { rejectWithValue }) => {
    try {
      await StartInvestigationService.remove(id);
      return id;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message ?? 'Failed to delete investigation'
      );
    }
  }
);

// ── Initial state ──────────────────────────────────────────────────────────

const initialState = {
  items: [],
  meta: null,
  loading: false,
  error: null,
  actionLoading: false,
  actionError: null,
  filters: {
    page: 1,
    per_page: 10,
    'filter[incident_investigation_id]': '',
  },
};

// ── Slice ──────────────────────────────────────────────────────────────────

const startInvestigationSlice = createSlice({
  name: 'startInvestigations',
  initialState,
  reducers: {
    setStartInvestigationFilters(state, action) {
      state.filters = { ...state.filters, ...action.payload };
    },
    resetStartInvestigationFilters(state) {
      state.filters = initialState.filters;
    },
    clearStartInvestigationErrors(state) {
      state.error = null;
      state.actionError = null;
    },
  },
  extraReducers: (builder) => {
    // list
    builder
      .addCase(fetchStartInvestigations.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStartInvestigations.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.data;
        state.meta = action.payload.meta;
      })
      .addCase(fetchStartInvestigations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // create
    builder
      .addCase(createStartInvestigation.pending, (state) => {
        state.actionLoading = true;
        state.actionError = null;
      })
      .addCase(createStartInvestigation.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.items.unshift(action.payload);
        if (state.meta) state.meta.total_count = (state.meta.total_count ?? 0) + 1;
      })
      .addCase(createStartInvestigation.rejected, (state, action) => {
        state.actionLoading = false;
        state.actionError = action.payload;
      });

    // update
    builder
      .addCase(updateStartInvestigation.pending, (state) => {
        state.actionLoading = true;
        state.actionError = null;
      })
      .addCase(updateStartInvestigation.fulfilled, (state, action) => {
        state.actionLoading = false;
        const idx = state.items.findIndex((r) => r.id === action.payload.id);
        if (idx !== -1) state.items[idx] = action.payload;
      })
      .addCase(updateStartInvestigation.rejected, (state, action) => {
        state.actionLoading = false;
        state.actionError = action.payload;
      });

    // delete
    builder
      .addCase(deleteStartInvestigation.pending, (state) => {
        state.actionLoading = true;
        state.actionError = null;
      })
      .addCase(deleteStartInvestigation.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.items = state.items.filter((r) => r.id !== action.payload);
        if (state.meta)
          state.meta.total_count = Math.max(0, (state.meta.total_count ?? 1) - 1);
      })
      .addCase(deleteStartInvestigation.rejected, (state, action) => {
        state.actionLoading = false;
        state.actionError = action.payload;
      });
  },
});

export const {
  setStartInvestigationFilters,
  resetStartInvestigationFilters,
  clearStartInvestigationErrors,
} = startInvestigationSlice.actions;

// ── Selectors ──────────────────────────────────────────────────────────────

export const selectStartInvestigations        = (state) => state.startInvestigations.items;
export const selectStartInvestigationsMeta    = (state) => state.startInvestigations.meta;
export const selectStartInvestigationsLoading = (state) => state.startInvestigations.loading;
export const selectStartInvestigationsError   = (state) => state.startInvestigations.error;
export const selectStartInvestigationsFilters = (state) => state.startInvestigations.filters;
export const selectStartInvestigationsActionLoading = (state) => state.startInvestigations.actionLoading;
export const selectStartInvestigationsActionError   = (state) => state.startInvestigations.actionError;

export default startInvestigationSlice.reducer;
