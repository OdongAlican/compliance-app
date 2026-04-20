/**
 * capaTrackingSlice.js
 *
 * Redux Toolkit slice for the Health & Safety Audit — CAPA Tracking module.
 *
 * State shape:
 *  catalog            : all HSA parent audit records
 *  catalogLoading     : catalog fetch in flight
 *  records            : paginated CAPA Tracking setup records
 *  recordsMeta        : pagination meta
 *  recordsLoading     : list fetch in flight
 *  recordsError       : list fetch error
 *  actionLoading      : create / update / delete / reassign / perform in flight
 *  actionError        : action error message
 *  issuesByPerformed  : issues keyed by performed CAPA Tracking id
 *  filters            : current filter values
 */
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import {
  CapaTrackingSetupService,
  CapaTrackingPerformService,
  CapaTrackingIssueService,
} from '../../services/capaTracking.service';
import { HsaParentService } from '../../services/healthAndSafetyAudit.service';

const INITIAL_FILTERS = {
  page:               1,
  per_page:           10,
  audit_number:       '',
  area_audited:       '',
  date:               '',
  status:             '',
  objective_of_audit: '',
  scope_of_audit:     '',
};

// ── Async thunks ──────────────────────────────────────────────────────────────

/** Fetch all parent HSA audit records (catalog) */
export const fetchCapaCatalog = createAsyncThunk(
  'capa/fetchCatalog',
  async (params = {}, { rejectWithValue }) => {
    try {
      const res = await HsaParentService.list(params);
      return Array.isArray(res) ? res : (res.data ?? []);
    } catch (err) {
      return rejectWithValue(err?.response?.data?.error || 'Failed to load HSA catalog.');
    }
  }
);

/** Fetch paginated CAPA Tracking setup records */
export const fetchCapaRecords = createAsyncThunk(
  'capa/fetchRecords',
  async (auditId, { getState, rejectWithValue }) => {
    try {
      const { filters } = getState().capa;
      const query = {
        page:     filters.page,
        per_page: filters.per_page,
        ...(filters.audit_number       ? { 'filter[audit_number]':       filters.audit_number }       : {}),
        ...(filters.area_audited       ? { 'filter[area_audited]':       filters.area_audited }       : {}),
        ...(filters.date               ? { 'filter[date]':               filters.date }               : {}),
        ...(filters.status             ? { 'filter[status]':             filters.status }             : {}),
        ...(filters.objective_of_audit ? { 'filter[objective_of_audit]': filters.objective_of_audit } : {}),
        ...(filters.scope_of_audit     ? { 'filter[scope_of_audit]':     filters.scope_of_audit }     : {}),
      };
      const res = await CapaTrackingSetupService.list(auditId, query);
      return { data: res.data ?? [], meta: res.meta ?? null };
    } catch (err) {
      return rejectWithValue(err?.response?.data?.error || 'Failed to load records.');
    }
  }
);

/** Create a new CAPA Tracking setup record */
export const createCapaRecord = createAsyncThunk(
  'capa/createRecord',
  async ({ auditId, data }, { rejectWithValue }) => {
    try {
      const res = await CapaTrackingSetupService.create(auditId, data);
      return res.data ?? res;
    } catch (err) {
      return rejectWithValue(
        err?.response?.data?.errors?.join(', ') || err?.response?.data?.error || 'Failed to create record.'
      );
    }
  }
);

/** Update a CAPA Tracking setup record */
export const updateCapaRecord = createAsyncThunk(
  'capa/updateRecord',
  async ({ auditId, id, data }, { rejectWithValue }) => {
    try {
      const res = await CapaTrackingSetupService.update(auditId, id, data);
      return res.data ?? res;
    } catch (err) {
      return rejectWithValue(
        err?.response?.data?.errors?.join(', ') || err?.response?.data?.error || 'Failed to update record.'
      );
    }
  }
);

/** Delete a CAPA Tracking setup record */
export const deleteCapaRecord = createAsyncThunk(
  'capa/deleteRecord',
  async ({ auditId, id }, { rejectWithValue }) => {
    try {
      await CapaTrackingSetupService.remove(auditId, id);
      return id;
    } catch (err) {
      return rejectWithValue(err?.response?.data?.error || 'Failed to delete record.');
    }
  }
);

/** Reassign auditors on a CAPA Tracking record */
export const reassignCapaAuditors = createAsyncThunk(
  'capa/reassignAuditors',
  async ({ auditId, id, auditorIds }, { rejectWithValue }) => {
    try {
      const res = await CapaTrackingSetupService.reassignAuditors(auditId, id, auditorIds);
      return res.data ?? res;
    } catch (err) {
      return rejectWithValue(
        err?.response?.data?.errors?.join(', ') || err?.response?.data?.error || 'Failed to reassign auditors.'
      );
    }
  }
);

/** Perform a CAPA Tracking audit (dynamic checklist items) */
export const performCapaRecord = createAsyncThunk(
  'capa/perform',
  async ({ auditId, capaId, payload }, { rejectWithValue }) => {
    try {
      const res = await CapaTrackingPerformService.perform(auditId, capaId, payload);
      return res.data ?? res;
    } catch (err) {
      return rejectWithValue(
        err?.response?.data?.errors?.join(', ') || err?.response?.data?.error || 'Failed to perform audit.'
      );
    }
  }
);

/** Fetch issues for a performed CAPA Tracking */
export const fetchCapaIssues = createAsyncThunk(
  'capa/fetchIssues',
  async ({ auditId, performedId, params = {} }, { rejectWithValue }) => {
    try {
      const res = await CapaTrackingIssueService.list(auditId, performedId, params);
      return { performedId, data: Array.isArray(res) ? res : (res.data ?? []) };
    } catch (err) {
      return rejectWithValue(err?.response?.data?.error || 'Failed to load issues.');
    }
  }
);

/** Update corrective action on a CAPA Tracking issue */
export const updateCapaCorrectiveAction = createAsyncThunk(
  'capa/updateCorrectiveAction',
  async ({ auditId, performedId, issueId, correctiveAction }, { rejectWithValue }) => {
    try {
      const res = await CapaTrackingIssueService.updateCorrectiveAction(auditId, performedId, issueId, correctiveAction);
      return res.data ?? res;
    } catch (err) {
      return rejectWithValue(
        err?.response?.data?.errors?.join(', ') || err?.response?.data?.error || 'Failed to update corrective action.'
      );
    }
  }
);

/** Update priority and due date on a CAPA Tracking issue */
export const updateCapaPriorityDueDate = createAsyncThunk(
  'capa/updatePriorityDueDate',
  async ({ auditId, performedId, issueId, priority_level, due_date }, { rejectWithValue }) => {
    try {
      const res = await CapaTrackingIssueService.updatePriorityDueDate(auditId, performedId, issueId, { priority_level, due_date });
      return res.data ?? res;
    } catch (err) {
      return rejectWithValue(
        err?.response?.data?.errors?.join(', ') || err?.response?.data?.error || 'Failed to update priority / due date.'
      );
    }
  }
);

/** Assign a contractor to a CAPA Tracking issue */
export const assignCapaContractor = createAsyncThunk(
  'capa/assignContractor',
  async ({ auditId, performedId, issueId, contractorId }, { rejectWithValue }) => {
    try {
      const res = await CapaTrackingIssueService.assignContractor(auditId, performedId, issueId, contractorId);
      return res.data ?? res;
    } catch (err) {
      return rejectWithValue(
        err?.response?.data?.errors?.join(', ') || err?.response?.data?.error || 'Failed to assign contractor.'
      );
    }
  }
);

/** Execute (close out) a CAPA Tracking issue */
export const executeCapaIssue = createAsyncThunk(
  'capa/executeIssue',
  async ({ auditId, performedId, issueId, completion_date, completion_notes, file }, { rejectWithValue }) => {
    try {
      const res = await CapaTrackingIssueService.execute(auditId, performedId, issueId, { completion_date, completion_notes, file });
      return res.data ?? res;
    } catch (err) {
      return rejectWithValue(
        err?.response?.data?.errors?.join(', ') || err?.response?.data?.error || 'Failed to execute issue.'
      );
    }
  }
);

// ── Slice ────────────────────────────────────────────────────────────────────

const capaTrackingSlice = createSlice({
  name: 'capa',
  initialState: {
    catalog:        [],
    catalogLoading: false,
    catalogError:   null,

    records:        [],
    recordsMeta:    null,
    recordsLoading: false,
    recordsError:   null,

    issuesByPerformed: {},

    actionLoading: false,
    actionError:   null,

    filters: INITIAL_FILTERS,
  },

  reducers: {
    setCapaPage:            (s, a) => { s.filters.page = a.payload; },
    setCapaAuditNumber:     (s, a) => { s.filters.audit_number = a.payload;       s.filters.page = 1; },
    setCapaAreaAudited:     (s, a) => { s.filters.area_audited = a.payload;       s.filters.page = 1; },
    setCapaDateFilter:      (s, a) => { s.filters.date = a.payload;               s.filters.page = 1; },
    setCapaStatusFilter:    (s, a) => { s.filters.status = a.payload;             s.filters.page = 1; },
    setCapaObjectiveFilter: (s, a) => { s.filters.objective_of_audit = a.payload; s.filters.page = 1; },
    setCapaScopeFilter:     (s, a) => { s.filters.scope_of_audit = a.payload;     s.filters.page = 1; },
    clearCapaFilters:       (s)    => { s.filters = INITIAL_FILTERS; },
    clearCapaRecordsError:  (s)    => { s.recordsError = null; },
    clearCapaActionError:   (s)    => { s.actionError = null; },
  },

  extraReducers: (builder) => {

    // fetchCapaCatalog
    builder
      .addCase(fetchCapaCatalog.pending,   (s) => { s.catalogLoading = true; s.catalogError = null; })
      .addCase(fetchCapaCatalog.fulfilled, (s, a) => { s.catalogLoading = false; s.catalog = a.payload; })
      .addCase(fetchCapaCatalog.rejected,  (s, a) => { s.catalogLoading = false; s.catalogError = a.payload; });

    // fetchCapaRecords
    builder
      .addCase(fetchCapaRecords.pending,   (s) => { s.recordsLoading = true; s.recordsError = null; })
      .addCase(fetchCapaRecords.fulfilled, (s, a) => {
        s.recordsLoading = false;
        s.records     = a.payload.data;
        s.recordsMeta = a.payload.meta;
      })
      .addCase(fetchCapaRecords.rejected,  (s, a) => { s.recordsLoading = false; s.recordsError = a.payload; });

    // createCapaRecord
    builder
      .addCase(createCapaRecord.pending,   (s) => { s.actionLoading = true; s.actionError = null; })
      .addCase(createCapaRecord.fulfilled, (s, a) => {
        s.actionLoading = false;
        s.records.unshift(a.payload);
        if (s.recordsMeta) s.recordsMeta.total += 1;
      })
      .addCase(createCapaRecord.rejected,  (s, a) => { s.actionLoading = false; s.actionError = a.payload; });

    // updateCapaRecord
    builder
      .addCase(updateCapaRecord.pending,   (s) => { s.actionLoading = true; s.actionError = null; })
      .addCase(updateCapaRecord.fulfilled, (s, a) => {
        s.actionLoading = false;
        const idx = s.records.findIndex((r) => r.id === a.payload.id);
        if (idx !== -1) s.records[idx] = a.payload;
      })
      .addCase(updateCapaRecord.rejected,  (s, a) => { s.actionLoading = false; s.actionError = a.payload; });

    // deleteCapaRecord
    builder
      .addCase(deleteCapaRecord.pending,   (s) => { s.actionLoading = true; s.actionError = null; })
      .addCase(deleteCapaRecord.fulfilled, (s, a) => {
        s.actionLoading = false;
        s.records = s.records.filter((r) => r.id !== a.payload);
        if (s.recordsMeta) s.recordsMeta.total = Math.max(0, s.recordsMeta.total - 1);
      })
      .addCase(deleteCapaRecord.rejected,  (s, a) => { s.actionLoading = false; s.actionError = a.payload; });

    // reassignCapaAuditors
    builder
      .addCase(reassignCapaAuditors.pending,   (s) => { s.actionLoading = true; s.actionError = null; })
      .addCase(reassignCapaAuditors.fulfilled, (s, a) => {
        s.actionLoading = false;
        const idx = s.records.findIndex((r) => r.id === a.payload.id);
        if (idx !== -1) s.records[idx] = a.payload;
      })
      .addCase(reassignCapaAuditors.rejected,  (s, a) => { s.actionLoading = false; s.actionError = a.payload; });

    // performCapaRecord
    builder
      .addCase(performCapaRecord.pending,   (s) => { s.actionLoading = true; s.actionError = null; })
      .addCase(performCapaRecord.fulfilled, (s) => { s.actionLoading = false; })
      .addCase(performCapaRecord.rejected,  (s, a) => { s.actionLoading = false; s.actionError = a.payload; });

    // fetchCapaIssues
    builder.addCase(fetchCapaIssues.fulfilled, (s, a) => {
      s.issuesByPerformed[a.payload.performedId] = a.payload.data;
    });

    // issue mutations
    [updateCapaCorrectiveAction, updateCapaPriorityDueDate, assignCapaContractor, executeCapaIssue].forEach((thunk) => {
      builder
        .addCase(thunk.pending,   (s) => { s.actionLoading = true; s.actionError = null; })
        .addCase(thunk.fulfilled, (s) => { s.actionLoading = false; })
        .addCase(thunk.rejected,  (s, a) => { s.actionLoading = false; s.actionError = a.payload; });
    });
  },
});

export const {
  setCapaPage,
  setCapaAuditNumber,
  setCapaAreaAudited,
  setCapaDateFilter,
  setCapaStatusFilter,
  setCapaObjectiveFilter,
  setCapaScopeFilter,
  clearCapaFilters,
  clearCapaRecordsError,
  clearCapaActionError,
} = capaTrackingSlice.actions;

// ── Selectors ────────────────────────────────────────────────────────────────
export const selectCapaCatalog           = (s) => s.capa.catalog;
export const selectCapaCatalogLoading    = (s) => s.capa.catalogLoading;
export const selectCapaRecords           = (s) => s.capa.records;
export const selectCapaRecordsMeta       = (s) => s.capa.recordsMeta;
export const selectCapaRecordsLoading    = (s) => s.capa.recordsLoading;
export const selectCapaRecordsError      = (s) => s.capa.recordsError;
export const selectCapaActionLoading     = (s) => s.capa.actionLoading;
export const selectCapaActionError       = (s) => s.capa.actionError;
export const selectCapaFilters           = (s) => s.capa.filters;
export const selectCapaIssuesByPerformed = (s) => s.capa.issuesByPerformed;

export default capaTrackingSlice.reducer;
