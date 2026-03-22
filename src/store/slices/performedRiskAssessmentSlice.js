import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { PerformedRiskAssessmentService } from '../../services/hazardAndRisk.service';

// ── Thunks ─────────────────────────────────────────────────────────────────

export const fetchPerformedRiskAssessments = createAsyncThunk(
  'performedRiskAssessments/list',
  async (query = {}, { rejectWithValue }) => {
    try {
      const res = await PerformedRiskAssessmentService.list(query);
      const data = Array.isArray(res) ? res : (res.data ?? []);
      const meta = res.meta ?? null;
      return { data, meta };
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message ?? 'Failed to fetch performed risk assessments'
      );
    }
  }
);

export const createPerformedRiskAssessment = createAsyncThunk(
  'performedRiskAssessments/create',
  async (payload, { rejectWithValue }) => {
    try {
      const res = await PerformedRiskAssessmentService.create(payload);
      return res.data ?? res;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message ?? 'Failed to create performed risk assessment'
      );
    }
  }
);

export const updatePerformedRiskAssessment = createAsyncThunk(
  'performedRiskAssessments/update',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const res = await PerformedRiskAssessmentService.update(id, data);
      return res.data ?? res;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message ?? 'Failed to update performed risk assessment'
      );
    }
  }
);

export const deletePerformedRiskAssessment = createAsyncThunk(
  'performedRiskAssessments/delete',
  async (id, { rejectWithValue }) => {
    try {
      await PerformedRiskAssessmentService.remove(id);
      return id;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message ?? 'Failed to delete performed risk assessment'
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
    'filter[risk_assessment_id]': '',
    'filter[performed_date]': '',
  },
};

// ── Slice ──────────────────────────────────────────────────────────────────

const performedRiskAssessmentSlice = createSlice({
  name: 'performedRiskAssessments',
  initialState,
  reducers: {
    setPerformedRiskAssessmentFilters(state, action) {
      state.filters = { ...state.filters, ...action.payload };
    },
    resetPerformedRiskAssessmentFilters(state) {
      state.filters = initialState.filters;
    },
    clearPerformedRiskAssessmentErrors(state) {
      state.error = null;
      state.actionError = null;
    },
  },
  extraReducers: (builder) => {
    // list
    builder
      .addCase(fetchPerformedRiskAssessments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPerformedRiskAssessments.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.data;
        state.meta = action.payload.meta;
      })
      .addCase(fetchPerformedRiskAssessments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // create
    builder
      .addCase(createPerformedRiskAssessment.pending, (state) => {
        state.actionLoading = true;
        state.actionError = null;
      })
      .addCase(createPerformedRiskAssessment.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.items.unshift(action.payload);
        if (state.meta) state.meta.total_count = (state.meta.total_count ?? 0) + 1;
      })
      .addCase(createPerformedRiskAssessment.rejected, (state, action) => {
        state.actionLoading = false;
        state.actionError = action.payload;
      });

    // update
    builder
      .addCase(updatePerformedRiskAssessment.pending, (state) => {
        state.actionLoading = true;
        state.actionError = null;
      })
      .addCase(updatePerformedRiskAssessment.fulfilled, (state, action) => {
        state.actionLoading = false;
        const idx = state.items.findIndex((r) => r.id === action.payload.id);
        if (idx !== -1) state.items[idx] = action.payload;
      })
      .addCase(updatePerformedRiskAssessment.rejected, (state, action) => {
        state.actionLoading = false;
        state.actionError = action.payload;
      });

    // delete
    builder
      .addCase(deletePerformedRiskAssessment.pending, (state) => {
        state.actionLoading = true;
        state.actionError = null;
      })
      .addCase(deletePerformedRiskAssessment.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.items = state.items.filter((r) => r.id !== action.payload);
        if (state.meta) state.meta.total_count = Math.max(0, (state.meta.total_count ?? 1) - 1);
      })
      .addCase(deletePerformedRiskAssessment.rejected, (state, action) => {
        state.actionLoading = false;
        state.actionError = action.payload;
      });
  },
});

export const {
  setPerformedRiskAssessmentFilters,
  resetPerformedRiskAssessmentFilters,
  clearPerformedRiskAssessmentErrors,
} = performedRiskAssessmentSlice.actions;

// ── Selectors ──────────────────────────────────────────────────────────────

export const selectPerformedRiskAssessments = (state) => state.performedRiskAssessments.items;
export const selectPerformedRiskAssessmentsMeta = (state) => state.performedRiskAssessments.meta;
export const selectPerformedRiskAssessmentsLoading = (state) => state.performedRiskAssessments.loading;
export const selectPerformedRiskAssessmentsError = (state) => state.performedRiskAssessments.error;
export const selectPerformedRiskAssessmentsActionLoading = (state) => state.performedRiskAssessments.actionLoading;
export const selectPerformedRiskAssessmentsActionError = (state) => state.performedRiskAssessments.actionError;
export const selectPerformedRiskAssessmentsFilters = (state) => state.performedRiskAssessments.filters;

export default performedRiskAssessmentSlice.reducer;
