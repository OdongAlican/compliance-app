import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { IncidentNotificationService } from '../../services/incidents.service';

// ── Thunks ─────────────────────────────────────────────────────────────────

export const fetchIncidentNotifications = createAsyncThunk(
  'incidentNotifications/list',
  async (query = {}, { rejectWithValue }) => {
    try {
      const res = await IncidentNotificationService.list(query);
      const data = Array.isArray(res) ? res : (res.data ?? []);
      const meta = res.meta ?? null;
      return { data, meta };
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message ?? 'Failed to fetch incident notifications'
      );
    }
  }
);

export const createIncidentNotification = createAsyncThunk(
  'incidentNotifications/create',
  async (payload, { rejectWithValue }) => {
    try {
      const res = await IncidentNotificationService.create(payload);
      return res.data ?? res;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message ?? 'Failed to create incident notification'
      );
    }
  }
);

export const updateIncidentNotification = createAsyncThunk(
  'incidentNotifications/update',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const res = await IncidentNotificationService.update(id, data);
      return res.data ?? res;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message ?? 'Failed to update incident notification'
      );
    }
  }
);

export const deleteIncidentNotification = createAsyncThunk(
  'incidentNotifications/delete',
  async (id, { rejectWithValue }) => {
    try {
      await IncidentNotificationService.remove(id);
      return id;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message ?? 'Failed to delete incident notification'
      );
    }
  }
);

export const assignIncidentSafetyOfficers = createAsyncThunk(
  'incidentNotifications/assignSafetyOfficers',
  async ({ id, safety_officer_ids }, { rejectWithValue }) => {
    try {
      const res = await IncidentNotificationService.assignSafetyOfficers(id, safety_officer_ids);
      return res.data ?? res;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message ?? 'Failed to assign safety officers'
      );
    }
  }
);

export const assignIncidentSupervisors = createAsyncThunk(
  'incidentNotifications/assignSupervisors',
  async ({ id, supervisor_ids }, { rejectWithValue }) => {
    try {
      const res = await IncidentNotificationService.assignSupervisors(id, supervisor_ids);
      return res.data ?? res;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message ?? 'Failed to assign supervisors'
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
    'filter[incident_type]': '',
    'filter[location]': '',
    'filter[date_of_incident]': '',
  },
};

// ── Slice ──────────────────────────────────────────────────────────────────

/** Replaces or appends an updated item returned by assign endpoints. */
function applyUpdate(state, payload) {
  const item = payload?.data ?? payload;
  if (!item?.id) return;
  const idx = state.items.findIndex((r) => r.id === item.id);
  if (idx !== -1) state.items[idx] = item;
}

const incidentNotificationSlice = createSlice({
  name: 'incidentNotifications',
  initialState,
  reducers: {
    setIncidentNotificationFilters(state, action) {
      state.filters = { ...state.filters, ...action.payload };
    },
    resetIncidentNotificationFilters(state) {
      state.filters = initialState.filters;
    },
    clearIncidentNotificationErrors(state) {
      state.error = null;
      state.actionError = null;
    },
    /** Sync witness_statements array on a single item after drawer add/delete. */
    patchIncidentNotificationWitnessCount(state, action) {
      const { id, witness_statements } = action.payload;
      const idx = state.items.findIndex((r) => r.id === id);
      if (idx !== -1) {
        state.items[idx] = { ...state.items[idx], witness_statements };
      }
    },
  },
  extraReducers: (builder) => {
    // list
    builder
      .addCase(fetchIncidentNotifications.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchIncidentNotifications.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.data;
        state.meta = action.payload.meta;
      })
      .addCase(fetchIncidentNotifications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // create
    builder
      .addCase(createIncidentNotification.pending, (state) => {
        state.actionLoading = true;
        state.actionError = null;
      })
      .addCase(createIncidentNotification.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.items.unshift(action.payload);
        if (state.meta) state.meta.total = (state.meta.total ?? 0) + 1;
      })
      .addCase(createIncidentNotification.rejected, (state, action) => {
        state.actionLoading = false;
        state.actionError = action.payload;
      });

    // update
    builder
      .addCase(updateIncidentNotification.pending, (state) => {
        state.actionLoading = true;
        state.actionError = null;
      })
      .addCase(updateIncidentNotification.fulfilled, (state, action) => {
        state.actionLoading = false;
        const idx = state.items.findIndex((r) => r.id === action.payload.id);
        if (idx !== -1) state.items[idx] = action.payload;
      })
      .addCase(updateIncidentNotification.rejected, (state, action) => {
        state.actionLoading = false;
        state.actionError = action.payload;
      });

    // delete
    builder
      .addCase(deleteIncidentNotification.pending, (state) => {
        state.actionLoading = true;
        state.actionError = null;
      })
      .addCase(deleteIncidentNotification.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.items = state.items.filter((r) => r.id !== action.payload);
        if (state.meta)
          state.meta.total = Math.max(0, (state.meta.total ?? 1) - 1);
      })
      .addCase(deleteIncidentNotification.rejected, (state, action) => {
        state.actionLoading = false;
        state.actionError = action.payload;
      });

    // assign safety officers
    builder
      .addCase(assignIncidentSafetyOfficers.pending, (state) => {
        state.actionLoading = true;
        state.actionError = null;
      })
      .addCase(assignIncidentSafetyOfficers.fulfilled, (state, action) => {
        state.actionLoading = false;
        applyUpdate(state, action.payload);
      })
      .addCase(assignIncidentSafetyOfficers.rejected, (state, action) => {
        state.actionLoading = false;
        state.actionError = action.payload;
      });

    // assign supervisors
    builder
      .addCase(assignIncidentSupervisors.pending, (state) => {
        state.actionLoading = true;
        state.actionError = null;
      })
      .addCase(assignIncidentSupervisors.fulfilled, (state, action) => {
        state.actionLoading = false;
        applyUpdate(state, action.payload);
      })
      .addCase(assignIncidentSupervisors.rejected, (state, action) => {
        state.actionLoading = false;
        state.actionError = action.payload;
      });
  },
});

export const {
  setIncidentNotificationFilters,
  resetIncidentNotificationFilters,
  clearIncidentNotificationErrors,
  patchIncidentNotificationWitnessCount,
} = incidentNotificationSlice.actions;

// ── Selectors ──────────────────────────────────────────────────────────────

export const selectIncidentNotifications         = (state) => state.incidentNotifications.items;
export const selectIncidentNotificationsMeta     = (state) => state.incidentNotifications.meta;
export const selectIncidentNotificationsLoading  = (state) => state.incidentNotifications.loading;
export const selectIncidentNotificationsError    = (state) => state.incidentNotifications.error;
export const selectIncidentNotificationsFilters  = (state) => state.incidentNotifications.filters;
export const selectIncidentNotificationsActionLoading = (state) => state.incidentNotifications.actionLoading;
export const selectIncidentNotificationsActionError   = (state) => state.incidentNotifications.actionError;

export default incidentNotificationSlice.reducer;
