/**
 * vehicleSlice.js
 *
 * Redux Toolkit slice for the Vehicle Inspection module.
 *
 * State shape:
 *  setups:        vehicle inspection setup list
 *  setupsMeta:    pagination
 *  setupsLoading: list fetch in flight
 *  setupsError:   list fetch error
 *  actionLoading: create / update / delete / reassign in flight
 *  actionError:   action error message
 *  filters:       current filter values (drives list refetch)
 */
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { VehicleSetupService } from '../../services/vehicle.service';

// ── Async thunks ──────────────────────────────────────────────────────────────

/** Fetch paginated vehicle inspection setups with current filters */
export const fetchVehicleSetups = createAsyncThunk(
  'vehicle/fetchSetups',
  async (params = {}, { getState, rejectWithValue }) => {
    try {
      const { filters } = getState().vehicle;
      const query = {
        page:     filters.page,
        per_page: filters.per_page,
        ...(filters.vehicle_id        ? { 'filter[vehicle_id]': filters.vehicle_id }               : {}),
        ...(filters.model             ? { 'filter[model]': filters.model }                         : {}),
        ...(filters.date_from         ? { 'filter[date_from]': filters.date_from }                 : {}),
        ...(filters.date_to           ? { 'filter[date_to]': filters.date_to }                     : {}),
        ...(filters.safety_officer_id ? { 'filter[safety_officer_id]': filters.safety_officer_id } : {}),
        ...(filters.supervisor_id     ? { 'filter[supervisor_id]': filters.supervisor_id }         : {}),
        ...params,
      };
      const res = await VehicleSetupService.list(query);
      const data = Array.isArray(res) ? res : (res.data ?? []);
      const meta = res.meta ?? null;
      return { data, meta };
    } catch (err) {
      return rejectWithValue(
        err?.response?.data?.errors?.[0] ||
        err?.response?.data?.error ||
        'Failed to load vehicle inspections.'
      );
    }
  }
);

/** Create a new vehicle inspection setup */
export const createVehicleSetup = createAsyncThunk(
  'vehicle/createSetup',
  async (data, { rejectWithValue }) => {
    try {
      const res = await VehicleSetupService.create(data);
      return res.data ?? res;
    } catch (err) {
      return rejectWithValue(
        err?.response?.data?.errors?.join(', ') ||
        err?.response?.data?.error ||
        'Failed to create vehicle inspection.'
      );
    }
  }
);

/** Update an existing vehicle inspection setup */
export const updateVehicleSetup = createAsyncThunk(
  'vehicle/updateSetup',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const res = await VehicleSetupService.update(id, data);
      return res.data ?? res;
    } catch (err) {
      return rejectWithValue(
        err?.response?.data?.errors?.join(', ') ||
        err?.response?.data?.error ||
        'Failed to update vehicle inspection.'
      );
    }
  }
);

/** Delete a vehicle inspection setup */
export const deleteVehicleSetup = createAsyncThunk(
  'vehicle/deleteSetup',
  async (id, { rejectWithValue }) => {
    try {
      await VehicleSetupService.remove(id);
      return id;
    } catch (err) {
      return rejectWithValue(
        err?.response?.data?.error || 'Failed to delete vehicle inspection.'
      );
    }
  }
);

/** Reassign supervisor */
export const reassignVehicleSupervisor = createAsyncThunk(
  'vehicle/reassignSupervisor',
  async ({ id, supervisorId }, { rejectWithValue }) => {
    try {
      const res = await VehicleSetupService.reassignSupervisor(id, supervisorId);
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
export const reassignVehicleSafetyOfficer = createAsyncThunk(
  'vehicle/reassignSafetyOfficer',
  async ({ id, safetyOfficerId }, { rejectWithValue }) => {
    try {
      const res = await VehicleSetupService.reassignSafetyOfficer(id, safetyOfficerId);
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
  vehicle_id:        '',
  model:             '',
  date_from:         '',
  date_to:           '',
  safety_officer_id: '',
  supervisor_id:     '',
};

const vehicleSlice = createSlice({
  name: 'vehicle',
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
     * setVehicleFilter({ key, value })
     * Updates any filter field by key and resets page to 1.
     */
    setVehicleFilter: (s, a) => {
      const { key, value } = a.payload;
      s.filters[key] = value;
      s.filters.page = 1;
    },
    setVehiclePage: (s, a) => {
      s.filters.page = a.payload;
    },
    clearVehicleFilters: (s) => {
      s.filters = INITIAL_FILTERS;
    },
    clearVehicleError: (s) => {
      s.setupsError = null;
    },
    clearVehicleActionError: (s) => {
      s.actionError = null;
    },
  },
  extraReducers: (builder) => {
    // ── fetchVehicleSetups ────────────────────────────────────────────────────
    builder
      .addCase(fetchVehicleSetups.pending, (s) => {
        s.setupsLoading = true;
        s.setupsError   = null;
      })
      .addCase(fetchVehicleSetups.fulfilled, (s, a) => {
        s.setupsLoading = false;
        s.setups        = a.payload.data;
        s.setupsMeta    = a.payload.meta;
      })
      .addCase(fetchVehicleSetups.rejected, (s, a) => {
        s.setupsLoading = false;
        s.setupsError   = a.payload;
      });

    // ── createVehicleSetup ────────────────────────────────────────────────────
    builder
      .addCase(createVehicleSetup.pending, (s) => {
        s.actionLoading = true;
        s.actionError   = null;
      })
      .addCase(createVehicleSetup.fulfilled, (s, a) => {
        s.actionLoading = false;
        s.setups.unshift(a.payload);
        if (s.setupsMeta) s.setupsMeta.total += 1;
      })
      .addCase(createVehicleSetup.rejected, (s, a) => {
        s.actionLoading = false;
        s.actionError   = a.payload;
      });

    // ── updateVehicleSetup ────────────────────────────────────────────────────
    builder
      .addCase(updateVehicleSetup.pending, (s) => {
        s.actionLoading = true;
        s.actionError   = null;
      })
      .addCase(updateVehicleSetup.fulfilled, (s, a) => {
        s.actionLoading = false;
        const idx = s.setups.findIndex((x) => x.id === a.payload.id);
        if (idx !== -1) s.setups[idx] = a.payload;
      })
      .addCase(updateVehicleSetup.rejected, (s, a) => {
        s.actionLoading = false;
        s.actionError   = a.payload;
      });

    // ── deleteVehicleSetup ────────────────────────────────────────────────────
    builder
      .addCase(deleteVehicleSetup.pending, (s) => {
        s.actionLoading = true;
        s.actionError   = null;
      })
      .addCase(deleteVehicleSetup.fulfilled, (s, a) => {
        s.actionLoading = false;
        s.setups        = s.setups.filter((x) => x.id !== a.payload);
        if (s.setupsMeta) s.setupsMeta.total = Math.max(0, s.setupsMeta.total - 1);
      })
      .addCase(deleteVehicleSetup.rejected, (s, a) => {
        s.actionLoading = false;
        s.actionError   = a.payload;
      });

    // ── reassign ──────────────────────────────────────────────────────────────
    const handleReassign = (s, a) => {
      s.actionLoading = false;
      const updated = a.payload;
      if (!updated?.id) return;
      const idx = s.setups.findIndex((x) => x.id === updated.id);
      if (idx !== -1) s.setups[idx] = updated;
    };
    const handleReassignPending  = (s)    => { s.actionLoading = true;  s.actionError = null; };
    const handleReassignRejected = (s, a) => { s.actionLoading = false; s.actionError = a.payload; };

    builder
      .addCase(reassignVehicleSupervisor.pending,     handleReassignPending)
      .addCase(reassignVehicleSupervisor.fulfilled,   handleReassign)
      .addCase(reassignVehicleSupervisor.rejected,    handleReassignRejected)
      .addCase(reassignVehicleSafetyOfficer.pending,  handleReassignPending)
      .addCase(reassignVehicleSafetyOfficer.fulfilled, handleReassign)
      .addCase(reassignVehicleSafetyOfficer.rejected, handleReassignRejected);
  },
});

export const {
  setVehicleFilter,
  setVehiclePage,
  clearVehicleFilters,
  clearVehicleError,
  clearVehicleActionError,
} = vehicleSlice.actions;

// ── Selectors ──────────────────────────────────────────────────────────────────
export const selectVehicleSetups       = (s) => s.vehicle.setups;
export const selectVehicleSetupsMeta   = (s) => s.vehicle.setupsMeta;
export const selectVehicleLoading      = (s) => s.vehicle.setupsLoading;
export const selectVehicleError        = (s) => s.vehicle.setupsError;
export const selectVehicleActionLoading = (s) => s.vehicle.actionLoading;
export const selectVehicleActionError   = (s) => s.vehicle.actionError;
export const selectVehicleFilters       = (s) => s.vehicle.filters;

export default vehicleSlice.reducer;
