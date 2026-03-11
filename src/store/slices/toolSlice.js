/**
 * toolSlice.js
 *
 * Redux Toolkit slice for the Hand & Power Tools Inspection module.
 *
 * State shape:
 *  setups:        inspection setup list
 *  setupsMeta:    pagination metadata
 *  setupsLoading: list fetch in flight
 *  setupsError:   list fetch error message
 *  actionLoading: create / update / delete / reassign in flight
 *  actionError:   action error message
 *  filters:       current filter values (drives list refetch)
 */
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { ToolSetupService } from '../../services/tool.service';

// ── Async thunks ──────────────────────────────────────────────────────────────

/** Fetch paginated hand & power tools inspection setups with current filters */
export const fetchToolSetups = createAsyncThunk(
  'tool/fetchSetups',
  async (params = {}, { getState, rejectWithValue }) => {
    try {
      const { filters } = getState().tool;
      const query = {
        page:     filters.page,
        per_page: filters.per_page,
        ...(filters.tool_name        ? { 'filter[tool_name]':        filters.tool_name }        : {}),
        ...(filters.tool_id          ? { 'filter[tool_id]':          filters.tool_id }          : {}),
        ...(filters.location         ? { 'filter[location]':         filters.location }         : {}),
        ...(filters.date_from        ? { 'filter[date_from]':        filters.date_from }        : {}),
        ...(filters.date_to          ? { 'filter[date_to]':          filters.date_to }          : {}),
        ...(filters.safety_officer_id ? { 'filter[safety_officer_id]': filters.safety_officer_id } : {}),
        ...(filters.supervisor_id     ? { 'filter[supervisor_id]':     filters.supervisor_id }     : {}),
        ...params,
      };
      const res  = await ToolSetupService.list(query);
      const data = Array.isArray(res) ? res : (res.data ?? []);
      const meta = res.meta ?? null;
      return { data, meta };
    } catch (err) {
      return rejectWithValue(
        err?.response?.data?.errors?.[0] ||
        err?.response?.data?.error ||
        'Failed to load hand & power tools inspections.'
      );
    }
  }
);

/** Create a new hand & power tools inspection setup */
export const createToolSetup = createAsyncThunk(
  'tool/createSetup',
  async (data, { rejectWithValue }) => {
    try {
      const res = await ToolSetupService.create(data);
      return res.data ?? res;
    } catch (err) {
      return rejectWithValue(
        err?.response?.data?.errors?.join(', ') ||
        err?.response?.data?.error ||
        'Failed to create inspection.'
      );
    }
  }
);

/** Update an existing hand & power tools inspection setup */
export const updateToolSetup = createAsyncThunk(
  'tool/updateSetup',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const res = await ToolSetupService.update(id, data);
      return res.data ?? res;
    } catch (err) {
      return rejectWithValue(
        err?.response?.data?.errors?.join(', ') ||
        err?.response?.data?.error ||
        'Failed to update inspection.'
      );
    }
  }
);

/** Delete a hand & power tools inspection setup */
export const deleteToolSetup = createAsyncThunk(
  'tool/deleteSetup',
  async (id, { rejectWithValue }) => {
    try {
      await ToolSetupService.remove(id);
      return id;
    } catch (err) {
      return rejectWithValue(
        err?.response?.data?.error || 'Failed to delete inspection.'
      );
    }
  }
);

/** Reassign supervisor */
export const reassignToolSupervisor = createAsyncThunk(
  'tool/reassignSupervisor',
  async ({ id, supervisorId }, { rejectWithValue }) => {
    try {
      const res = await ToolSetupService.reassignSupervisor(id, supervisorId);
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
export const reassignToolSafetyOfficer = createAsyncThunk(
  'tool/reassignSafetyOfficer',
  async ({ id, safetyOfficerId }, { rejectWithValue }) => {
    try {
      const res = await ToolSetupService.reassignSafetyOfficer(id, safetyOfficerId);
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
  tool_name:         '',
  tool_id:           '',
  location:          '',
  date_from:         '',
  date_to:           '',
  safety_officer_id: '',
  supervisor_id:     '',
};

const toolSlice = createSlice({
  name: 'tool',
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
    /** Merge partial filter updates; always resets page to 1 */
    setToolFilter: (s, a) => {
      s.filters = { ...s.filters, ...a.payload, page: 1 };
    },
    setToolPage: (s, a) => {
      s.filters.page = a.payload;
    },
    clearToolFilters: (s) => {
      s.filters = INITIAL_FILTERS;
    },
    clearToolError: (s) => {
      s.setupsError = null;
    },
    clearToolActionError: (s) => {
      s.actionError = null;
    },
  },
  extraReducers: (builder) => {
    // ── fetchToolSetups ────────────────────────────────────────────────────
    builder
      .addCase(fetchToolSetups.pending, (s) => {
        s.setupsLoading = true;
        s.setupsError   = null;
      })
      .addCase(fetchToolSetups.fulfilled, (s, a) => {
        s.setupsLoading = false;
        s.setups        = a.payload.data;
        s.setupsMeta    = a.payload.meta;
      })
      .addCase(fetchToolSetups.rejected, (s, a) => {
        s.setupsLoading = false;
        s.setupsError   = a.payload;
      });

    // ── createToolSetup ────────────────────────────────────────────────────
    builder
      .addCase(createToolSetup.pending, (s) => {
        s.actionLoading = true;
        s.actionError   = null;
      })
      .addCase(createToolSetup.fulfilled, (s, a) => {
        s.actionLoading = false;
        s.setups.unshift(a.payload);
        if (s.setupsMeta) s.setupsMeta.total += 1;
      })
      .addCase(createToolSetup.rejected, (s, a) => {
        s.actionLoading = false;
        s.actionError   = a.payload;
      });

    // ── updateToolSetup ────────────────────────────────────────────────────
    builder
      .addCase(updateToolSetup.pending, (s) => {
        s.actionLoading = true;
        s.actionError   = null;
      })
      .addCase(updateToolSetup.fulfilled, (s, a) => {
        s.actionLoading = false;
        const idx = s.setups.findIndex((x) => x.id === a.payload.id);
        if (idx !== -1) s.setups[idx] = a.payload;
      })
      .addCase(updateToolSetup.rejected, (s, a) => {
        s.actionLoading = false;
        s.actionError   = a.payload;
      });

    // ── deleteToolSetup ────────────────────────────────────────────────────
    builder
      .addCase(deleteToolSetup.pending, (s) => {
        s.actionLoading = true;
        s.actionError   = null;
      })
      .addCase(deleteToolSetup.fulfilled, (s, a) => {
        s.actionLoading = false;
        s.setups        = s.setups.filter((x) => x.id !== a.payload);
        if (s.setupsMeta) s.setupsMeta.total = Math.max(0, s.setupsMeta.total - 1);
      })
      .addCase(deleteToolSetup.rejected, (s, a) => {
        s.actionLoading = false;
        s.actionError   = a.payload;
      });

    // ── reassign ───────────────────────────────────────────────────────────
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
      .addCase(reassignToolSupervisor.pending,     handleReassignPending)
      .addCase(reassignToolSupervisor.fulfilled,    handleReassign)
      .addCase(reassignToolSupervisor.rejected,     handleReassignRejected)
      .addCase(reassignToolSafetyOfficer.pending,   handleReassignPending)
      .addCase(reassignToolSafetyOfficer.fulfilled,  handleReassign)
      .addCase(reassignToolSafetyOfficer.rejected,   handleReassignRejected);
  },
});

export const {
  setToolFilter,
  setToolPage,
  clearToolFilters,
  clearToolError,
  clearToolActionError,
} = toolSlice.actions;

// ── Selectors ─────────────────────────────────────────────────────────────────
export const selectToolSetups        = (s) => s.tool.setups;
export const selectToolSetupsMeta    = (s) => s.tool.setupsMeta;
export const selectToolLoading       = (s) => s.tool.setupsLoading;
export const selectToolError         = (s) => s.tool.setupsError;
export const selectToolActionLoading = (s) => s.tool.actionLoading;
export const selectToolActionError   = (s) => s.tool.actionError;
export const selectToolFilters       = (s) => s.tool.filters;

export default toolSlice.reducer;
