import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { FuelSetupService } from "../../services/fuel.service";

/* ── Thunks ─────────────────────────────────────────────────────────── */

export const fetchFuelSetups = createAsyncThunk(
  "fuel/fetchSetups",
  async (_, { getState, rejectWithValue }) => {
    try {
      const { filters } = getState().fuel;
      const params = {};
      if (filters.page)          params.page            = filters.page;
      if (filters.per_page)      params.per_page         = filters.per_page;
      if (filters.name)          params.name             = filters.name;
      if (filters.location)      params.location         = filters.location;
      if (filters.date_from)     params.date_from        = filters.date_from;
      if (filters.date_to)       params.date_to          = filters.date_to;
      if (filters.safety_officer_id) params.safety_officer_id = filters.safety_officer_id;
      if (filters.supervisor_id) params.supervisor_id    = filters.supervisor_id;
      return await FuelSetupService.list(params);
    } catch (err) {
      return rejectWithValue(
        err?.response?.data?.errors?.join(", ") ||
          err?.response?.data?.error ||
          "Failed to load fuel inspections."
      );
    }
  }
);

export const createFuelSetup = createAsyncThunk(
  "fuel/createSetup",
  async (data, { rejectWithValue }) => {
    try {
      return await FuelSetupService.create(data);
    } catch (err) {
      return rejectWithValue(
        err?.response?.data?.errors?.join(", ") ||
          err?.response?.data?.error ||
          "Failed to create fuel inspection."
      );
    }
  }
);

export const updateFuelSetup = createAsyncThunk(
  "fuel/updateSetup",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      return await FuelSetupService.update(id, data);
    } catch (err) {
      return rejectWithValue(
        err?.response?.data?.errors?.join(", ") ||
          err?.response?.data?.error ||
          "Failed to update fuel inspection."
      );
    }
  }
);

export const deleteFuelSetup = createAsyncThunk(
  "fuel/deleteSetup",
  async (id, { rejectWithValue }) => {
    try {
      await FuelSetupService.remove(id);
      return id;
    } catch (err) {
      return rejectWithValue(
        err?.response?.data?.errors?.join(", ") ||
          err?.response?.data?.error ||
          "Failed to delete fuel inspection."
      );
    }
  }
);

export const reassignFuelSupervisor = createAsyncThunk(
  "fuel/reassignSupervisor",
  async ({ id, supervisorId }, { rejectWithValue }) => {
    try {
      return await FuelSetupService.reassignSupervisor(id, supervisorId);
    } catch (err) {
      return rejectWithValue(
        err?.response?.data?.errors?.join(", ") ||
          err?.response?.data?.error ||
          "Reassignment failed."
      );
    }
  }
);

export const reassignFuelSafetyOfficer = createAsyncThunk(
  "fuel/reassignSafetyOfficer",
  async ({ id, safetyOfficerId }, { rejectWithValue }) => {
    try {
      return await FuelSetupService.reassignSafetyOfficer(id, safetyOfficerId);
    } catch (err) {
      return rejectWithValue(
        err?.response?.data?.errors?.join(", ") ||
          err?.response?.data?.error ||
          "Reassignment failed."
      );
    }
  }
);

/* ── Slice ──────────────────────────────────────────────────────────── */
const initialState = {
  setups:        [],
  setupsMeta:    null,
  setupsLoading: false,
  setupsError:   null,
  actionLoading: false,
  actionError:   null,
  filters: {
    page:              1,
    per_page:          10,
    name:              "",
    location:          "",
    date_from:         "",
    date_to:           "",
    safety_officer_id: "",
    supervisor_id:     "",
  },
};

const fuelSlice = createSlice({
  name: "fuel",
  initialState,
  reducers: {
    setFuelPage:       (s, a) => { s.filters.page = a.payload; },
    setFuelName:       (s, a) => { s.filters.name = a.payload; s.filters.page = 1; },
    setFuelLocation:   (s, a) => { s.filters.location = a.payload; s.filters.page = 1; },
    setFuelDateFrom:   (s, a) => { s.filters.date_from = a.payload; s.filters.page = 1; },
    setFuelDateTo:     (s, a) => { s.filters.date_to = a.payload; s.filters.page = 1; },
    setFuelSOFilter:   (s, a) => { s.filters.safety_officer_id = a.payload; s.filters.page = 1; },
    setFuelSupFilter:  (s, a) => { s.filters.supervisor_id = a.payload; s.filters.page = 1; },
    clearFuelFilters:  (s) => {
      s.filters = { ...initialState.filters };
    },
    clearFuelError:    (s) => { s.setupsError = null; },
    clearFuelActionError: (s) => { s.actionError = null; },
  },
  extraReducers: (builder) => {
    /* fetchFuelSetups */
    builder
      .addCase(fetchFuelSetups.pending, (s) => {
        s.setupsLoading = true;
        s.setupsError = null;
      })
      .addCase(fetchFuelSetups.fulfilled, (s, a) => {
        s.setupsLoading = false;
        const payload = a.payload;
        if (Array.isArray(payload)) {
          s.setups = payload;
          s.setupsMeta = null;
        } else {
          s.setups    = payload.data ?? payload.fuel_tank_inspections ?? [];
          s.setupsMeta = payload.meta ?? payload.pagination ?? null;
        }
      })
      .addCase(fetchFuelSetups.rejected, (s, a) => {
        s.setupsLoading = false;
        s.setupsError = a.payload;
      });

    /* createFuelSetup */
    builder
      .addCase(createFuelSetup.pending, (s) => {
        s.actionLoading = true;
        s.actionError = null;
      })
      .addCase(createFuelSetup.fulfilled, (s, a) => {
        s.actionLoading = false;
        const item = a.payload?.fuel_tank_inspection ?? a.payload;
        if (item) s.setups.unshift(item);
      })
      .addCase(createFuelSetup.rejected, (s, a) => {
        s.actionLoading = false;
        s.actionError = a.payload;
      });

    /* updateFuelSetup */
    builder
      .addCase(updateFuelSetup.pending, (s) => {
        s.actionLoading = true;
        s.actionError = null;
      })
      .addCase(updateFuelSetup.fulfilled, (s, a) => {
        s.actionLoading = false;
        const item = a.payload?.fuel_tank_inspection ?? a.payload;
        if (item) {
          const idx = s.setups.findIndex((x) => x.id === item.id);
          if (idx !== -1) s.setups[idx] = item;
        }
      })
      .addCase(updateFuelSetup.rejected, (s, a) => {
        s.actionLoading = false;
        s.actionError = a.payload;
      });

    /* deleteFuelSetup */
    builder
      .addCase(deleteFuelSetup.pending, (s) => { s.actionLoading = true; })
      .addCase(deleteFuelSetup.fulfilled, (s, a) => {
        s.actionLoading = false;
        s.setups = s.setups.filter((x) => x.id !== a.payload);
      })
      .addCase(deleteFuelSetup.rejected, (s, a) => {
        s.actionLoading = false;
        s.actionError = a.payload;
      });

    /* reassign */
    builder
      .addCase(reassignFuelSupervisor.pending,  (s) => { s.actionLoading = true; })
      .addCase(reassignFuelSupervisor.fulfilled, (s, a) => {
        s.actionLoading = false;
        const item = a.payload?.fuel_tank_inspection ?? a.payload;
        if (item) { const i = s.setups.findIndex((x) => x.id === item.id); if (i !== -1) s.setups[i] = item; }
      })
      .addCase(reassignFuelSupervisor.rejected, (s, a) => { s.actionLoading = false; s.actionError = a.payload; });

    builder
      .addCase(reassignFuelSafetyOfficer.pending,  (s) => { s.actionLoading = true; })
      .addCase(reassignFuelSafetyOfficer.fulfilled, (s, a) => {
        s.actionLoading = false;
        const item = a.payload?.fuel_tank_inspection ?? a.payload;
        if (item) { const i = s.setups.findIndex((x) => x.id === item.id); if (i !== -1) s.setups[i] = item; }
      })
      .addCase(reassignFuelSafetyOfficer.rejected, (s, a) => { s.actionLoading = false; s.actionError = a.payload; });
  },
});

export const {
  setFuelPage, setFuelName, setFuelLocation, setFuelDateFrom, setFuelDateTo,
  setFuelSOFilter, setFuelSupFilter, clearFuelFilters, clearFuelError, clearFuelActionError,
} = fuelSlice.actions;

/* ── Selectors ──────────────────────────────────────────────────────── */
export const selectFuelSetups        = (s) => s.fuel.setups;
export const selectFuelMeta          = (s) => s.fuel.setupsMeta;
export const selectFuelLoading       = (s) => s.fuel.setupsLoading;
export const selectFuelError         = (s) => s.fuel.setupsError;
export const selectFuelActionLoading = (s) => s.fuel.actionLoading;
export const selectFuelActionError   = (s) => s.fuel.actionError;
export const selectFuelFilters       = (s) => s.fuel.filters;

export default fuelSlice.reducer;
