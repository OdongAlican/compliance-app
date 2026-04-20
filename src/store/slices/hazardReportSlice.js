import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { HazardReportService } from '../../services/hazardAndRisk.service';

// ── Thunks ─────────────────────────────────────────────────────────────────

export const fetchHazardReports = createAsyncThunk(
  'hazardReports/list',
  async (query = {}, { rejectWithValue }) => {
    try {
      const res = await HazardReportService.list(query);
      const data = Array.isArray(res) ? res : (res.data ?? []);
      const meta = res.meta ?? null;
      return { data, meta };
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message ?? 'Failed to fetch hazard reports'
      );
    }
  }
);

export const createHazardReport = createAsyncThunk(
  'hazardReports/create',
  async (payload, { rejectWithValue }) => {
    try {
      const res = await HazardReportService.create(payload);
      return res.data ?? res;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message ?? 'Failed to create hazard report'
      );
    }
  }
);

export const updateHazardReport = createAsyncThunk(
  'hazardReports/update',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const res = await HazardReportService.update(id, data);
      return res.data ?? res;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message ?? 'Failed to update hazard report'
      );
    }
  }
);

export const deleteHazardReport = createAsyncThunk(
  'hazardReports/delete',
  async (id, { rejectWithValue }) => {
    try {
      await HazardReportService.remove(id);
      return id;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message ?? 'Failed to delete hazard report'
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
    'filter[location]': '',
    'filter[hazard_type]': '',
    'filter[report_date]': '',
  },
};

// ── Slice ──────────────────────────────────────────────────────────────────

const hazardReportSlice = createSlice({
  name: 'hazardReports',
  initialState,
  reducers: {
    setHazardReportFilters(state, action) {
      state.filters = { ...state.filters, ...action.payload };
    },
    resetHazardReportFilters(state) {
      state.filters = initialState.filters;
    },
    clearHazardReportErrors(state) {
      state.error = null;
      state.actionError = null;
    },
    // Patch a single item in-place without a full re-fetch
    // (used when injured_people are changed from the detail drawer)
    patchHazardReportItem(state, action) {
      const idx = state.items.findIndex((r) => r.id === action.payload.id);
      if (idx !== -1) {
        state.items[idx] = { ...state.items[idx], ...action.payload.changes };
      }
    },
  },
  extraReducers: (builder) => {
    // list
    builder
      .addCase(fetchHazardReports.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchHazardReports.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.data;
        state.meta = action.payload.meta;
      })
      .addCase(fetchHazardReports.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // create
    builder
      .addCase(createHazardReport.pending, (state) => {
        state.actionLoading = true;
        state.actionError = null;
      })
      .addCase(createHazardReport.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.items.unshift(action.payload);
        if (state.meta) state.meta.total = (state.meta.total ?? 0) + 1;
      })
      .addCase(createHazardReport.rejected, (state, action) => {
        state.actionLoading = false;
        state.actionError = action.payload;
      });

    // update
    builder
      .addCase(updateHazardReport.pending, (state) => {
        state.actionLoading = true;
        state.actionError = null;
      })
      .addCase(updateHazardReport.fulfilled, (state, action) => {
        state.actionLoading = false;
        const idx = state.items.findIndex((r) => r.id === action.payload.id);
        if (idx !== -1) state.items[idx] = action.payload;
      })
      .addCase(updateHazardReport.rejected, (state, action) => {
        state.actionLoading = false;
        state.actionError = action.payload;
      });

    // delete
    builder
      .addCase(deleteHazardReport.pending, (state) => {
        state.actionLoading = true;
        state.actionError = null;
      })
      .addCase(deleteHazardReport.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.items = state.items.filter((r) => r.id !== action.payload);
        if (state.meta) state.meta.total = Math.max(0, (state.meta.total ?? 1) - 1);
      })
      .addCase(deleteHazardReport.rejected, (state, action) => {
        state.actionLoading = false;
        state.actionError = action.payload;
      });
  },
});

export const {
  setHazardReportFilters,
  resetHazardReportFilters,
  clearHazardReportErrors,
  patchHazardReportItem,
} = hazardReportSlice.actions;

// ── Selectors ──────────────────────────────────────────────────────────────

export const selectHazardReports = (state) => state.hazardReports.items;
export const selectHazardReportsMeta = (state) => state.hazardReports.meta;
export const selectHazardReportsLoading = (state) => state.hazardReports.loading;
export const selectHazardReportsError = (state) => state.hazardReports.error;
export const selectHazardReportsActionLoading = (state) => state.hazardReports.actionLoading;
export const selectHazardReportsActionError = (state) => state.hazardReports.actionError;
export const selectHazardReportsFilters = (state) => state.hazardReports.filters;

export default hazardReportSlice.reducer;
