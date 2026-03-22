import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { RiskAssessmentService } from '../../services/hazardAndRisk.service';

// ── Thunks ─────────────────────────────────────────────────────────────────

export const fetchRiskAssessments = createAsyncThunk(
  'riskAssessments/list',
  async (query = {}, { rejectWithValue }) => {
    try {
      const res = await RiskAssessmentService.list(query);
      const data = Array.isArray(res) ? res : (res.data ?? []);
      const meta = res.meta ?? null;
      return { data, meta };
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message ?? 'Failed to fetch risk assessments'
      );
    }
  }
);

export const createRiskAssessment = createAsyncThunk(
  'riskAssessments/create',
  async (payload, { rejectWithValue }) => {
    try {
      const res = await RiskAssessmentService.create(payload);
      return res.data ?? res;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message ?? 'Failed to create risk assessment'
      );
    }
  }
);

export const updateRiskAssessment = createAsyncThunk(
  'riskAssessments/update',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const res = await RiskAssessmentService.update(id, data);
      return res.data ?? res;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message ?? 'Failed to update risk assessment'
      );
    }
  }
);

export const deleteRiskAssessment = createAsyncThunk(
  'riskAssessments/delete',
  async (id, { rejectWithValue }) => {
    try {
      await RiskAssessmentService.remove(id);
      return id;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message ?? 'Failed to delete risk assessment'
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
    'filter[activity]': '',
    'filter[location]': '',
    'filter[date]': '',
  },
};

// ── Slice ──────────────────────────────────────────────────────────────────

const riskAssessmentSlice = createSlice({
  name: 'riskAssessments',
  initialState,
  reducers: {
    setRiskAssessmentFilters(state, action) {
      state.filters = { ...state.filters, ...action.payload };
    },
    resetRiskAssessmentFilters(state) {
      state.filters = initialState.filters;
    },
    clearRiskAssessmentErrors(state) {
      state.error = null;
      state.actionError = null;
    },
  },
  extraReducers: (builder) => {
    // list
    builder
      .addCase(fetchRiskAssessments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRiskAssessments.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.data;
        state.meta = action.payload.meta;
      })
      .addCase(fetchRiskAssessments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // create
    builder
      .addCase(createRiskAssessment.pending, (state) => {
        state.actionLoading = true;
        state.actionError = null;
      })
      .addCase(createRiskAssessment.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.items.unshift(action.payload);
        if (state.meta) state.meta.total_count = (state.meta.total_count ?? 0) + 1;
      })
      .addCase(createRiskAssessment.rejected, (state, action) => {
        state.actionLoading = false;
        state.actionError = action.payload;
      });

    // update
    builder
      .addCase(updateRiskAssessment.pending, (state) => {
        state.actionLoading = true;
        state.actionError = null;
      })
      .addCase(updateRiskAssessment.fulfilled, (state, action) => {
        state.actionLoading = false;
        const idx = state.items.findIndex((r) => r.id === action.payload.id);
        if (idx !== -1) state.items[idx] = action.payload;
      })
      .addCase(updateRiskAssessment.rejected, (state, action) => {
        state.actionLoading = false;
        state.actionError = action.payload;
      });

    // delete
    builder
      .addCase(deleteRiskAssessment.pending, (state) => {
        state.actionLoading = true;
        state.actionError = null;
      })
      .addCase(deleteRiskAssessment.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.items = state.items.filter((r) => r.id !== action.payload);
        if (state.meta) state.meta.total_count = Math.max(0, (state.meta.total_count ?? 1) - 1);
      })
      .addCase(deleteRiskAssessment.rejected, (state, action) => {
        state.actionLoading = false;
        state.actionError = action.payload;
      });
  },
});

export const {
  setRiskAssessmentFilters,
  resetRiskAssessmentFilters,
  clearRiskAssessmentErrors,
} = riskAssessmentSlice.actions;

// ── Selectors ──────────────────────────────────────────────────────────────

export const selectRiskAssessments = (state) => state.riskAssessments.items;
export const selectRiskAssessmentsMeta = (state) => state.riskAssessments.meta;
export const selectRiskAssessmentsLoading = (state) => state.riskAssessments.loading;
export const selectRiskAssessmentsError = (state) => state.riskAssessments.error;
export const selectRiskAssessmentsActionLoading = (state) => state.riskAssessments.actionLoading;
export const selectRiskAssessmentsActionError = (state) => state.riskAssessments.actionError;
export const selectRiskAssessmentsFilters = (state) => state.riskAssessments.filters;

export default riskAssessmentSlice.reducer;
