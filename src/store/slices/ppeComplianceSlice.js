/**
 * ppeComplianceSlice.js
 *
 * Redux Toolkit slice for the Health & Safety Audit — PPE Compliance module.
 *
 * State shape:
 *  catalog            : all HSA parent audit records
 *  catalogLoading     : catalog fetch in flight
 *  records            : paginated PPE Compliance setup records
 *  recordsMeta        : pagination meta
 *  recordsLoading     : list fetch in flight
 *  recordsError       : list fetch error
 *  actionLoading      : create / update / delete / reassign / perform in flight
 *  actionError        : action error message
 *  issuesByPerformed  : issues keyed by performed PPE Compliance id
 *  filters            : current filter values
 *
 * NOTE: PPE Compliance is a fully dynamic module — no template management.
 *       Checklist items are free-text entries created at perform time.
 */
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import {
  PpeComplianceSetupService,
  PpeCompliancePerformService,
  PpeComplianceIssueService,
} from '../../services/ppeCompliance.service';
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
export const fetchPpeComplianceCatalog = createAsyncThunk(
  'ppeCompliance/fetchCatalog',
  async (params = {}, { rejectWithValue }) => {
    try {
      const res = await HsaParentService.list(params);
      return Array.isArray(res) ? res : (res.data ?? []);
    } catch (err) {
      return rejectWithValue(err?.response?.data?.error || 'Failed to load HSA catalog.');
    }
  }
);

/** Fetch paginated PPE Compliance setup records */
export const fetchPpeComplianceRecords = createAsyncThunk(
  'ppeCompliance/fetchRecords',
  async (auditId, { getState, rejectWithValue }) => {
    try {
      const { filters } = getState().ppeCompliance;
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
      const res = await PpeComplianceSetupService.list(auditId, query);
      return { data: res.data ?? [], meta: res.meta ?? null };
    } catch (err) {
      return rejectWithValue(err?.response?.data?.error || 'Failed to load records.');
    }
  }
);

/** Create a new PPE Compliance setup record */
export const createPpeComplianceRecord = createAsyncThunk(
  'ppeCompliance/createRecord',
  async ({ auditId, data }, { rejectWithValue }) => {
    try {
      const res = await PpeComplianceSetupService.create(auditId, data);
      return res.data ?? res;
    } catch (err) {
      return rejectWithValue(
        err?.response?.data?.errors?.join(', ') || err?.response?.data?.error || 'Failed to create record.'
      );
    }
  }
);

/** Update a PPE Compliance setup record */
export const updatePpeComplianceRecord = createAsyncThunk(
  'ppeCompliance/updateRecord',
  async ({ auditId, id, data }, { rejectWithValue }) => {
    try {
      const res = await PpeComplianceSetupService.update(auditId, id, data);
      return res.data ?? res;
    } catch (err) {
      return rejectWithValue(
        err?.response?.data?.errors?.join(', ') || err?.response?.data?.error || 'Failed to update record.'
      );
    }
  }
);

/** Delete a PPE Compliance setup record */
export const deletePpeComplianceRecord = createAsyncThunk(
  'ppeCompliance/deleteRecord',
  async ({ auditId, id }, { rejectWithValue }) => {
    try {
      await PpeComplianceSetupService.remove(auditId, id);
      return id;
    } catch (err) {
      return rejectWithValue(err?.response?.data?.error || 'Failed to delete record.');
    }
  }
);

/** Reassign auditors on a PPE Compliance record */
export const reassignPpeComplianceAuditors = createAsyncThunk(
  'ppeCompliance/reassignAuditors',
  async ({ auditId, id, auditorIds }, { rejectWithValue }) => {
    try {
      const res = await PpeComplianceSetupService.reassignAuditors(auditId, id, auditorIds);
      return res.data ?? res;
    } catch (err) {
      return rejectWithValue(
        err?.response?.data?.errors?.join(', ') || err?.response?.data?.error || 'Failed to reassign auditors.'
      );
    }
  }
);

/** Perform a PPE Compliance audit (dynamic checklist items) */
export const performPpeComplianceRecord = createAsyncThunk(
  'ppeCompliance/perform',
  async ({ auditId, ppeCompId, payload }, { rejectWithValue }) => {
    try {
      const res = await PpeCompliancePerformService.perform(auditId, ppeCompId, payload);
      return res.data ?? res;
    } catch (err) {
      return rejectWithValue(
        err?.response?.data?.errors?.join(', ') || err?.response?.data?.error || 'Failed to perform audit.'
      );
    }
  }
);

/** Fetch issues for a performed PPE Compliance */
export const fetchPpeComplianceIssues = createAsyncThunk(
  'ppeCompliance/fetchIssues',
  async ({ auditId, performedId, params = {} }, { rejectWithValue }) => {
    try {
      const res = await PpeComplianceIssueService.list(auditId, performedId, params);
      return { performedId, data: Array.isArray(res) ? res : (res.data ?? []) };
    } catch (err) {
      return rejectWithValue(err?.response?.data?.error || 'Failed to load issues.');
    }
  }
);

/** Update corrective action on a PPE Compliance issue */
export const updatePpeComplianceCorrectiveAction = createAsyncThunk(
  'ppeCompliance/updateCorrectiveAction',
  async ({ auditId, performedId, issueId, correctiveAction }, { rejectWithValue }) => {
    try {
      const res = await PpeComplianceIssueService.updateCorrectiveAction(auditId, performedId, issueId, correctiveAction);
      return res.data ?? res;
    } catch (err) {
      return rejectWithValue(
        err?.response?.data?.errors?.join(', ') || err?.response?.data?.error || 'Failed to update corrective action.'
      );
    }
  }
);

/** Update priority and due date on a PPE Compliance issue */
export const updatePpeCompliancePriorityDueDate = createAsyncThunk(
  'ppeCompliance/updatePriorityDueDate',
  async ({ auditId, performedId, issueId, priority_level, due_date }, { rejectWithValue }) => {
    try {
      const res = await PpeComplianceIssueService.updatePriorityDueDate(auditId, performedId, issueId, { priority_level, due_date });
      return res.data ?? res;
    } catch (err) {
      return rejectWithValue(
        err?.response?.data?.errors?.join(', ') || err?.response?.data?.error || 'Failed to update priority / due date.'
      );
    }
  }
);

/** Assign a contractor to a PPE Compliance issue */
export const assignPpeComplianceContractor = createAsyncThunk(
  'ppeCompliance/assignContractor',
  async ({ auditId, performedId, issueId, contractorId }, { rejectWithValue }) => {
    try {
      const res = await PpeComplianceIssueService.assignContractor(auditId, performedId, issueId, contractorId);
      return res.data ?? res;
    } catch (err) {
      return rejectWithValue(
        err?.response?.data?.errors?.join(', ') || err?.response?.data?.error || 'Failed to assign contractor.'
      );
    }
  }
);

/** Execute (close out) a PPE Compliance issue */
export const executePpeComplianceIssue = createAsyncThunk(
  'ppeCompliance/executeIssue',
  async ({ auditId, performedId, issueId, completion_date, completion_notes, file }, { rejectWithValue }) => {
    try {
      const res = await PpeComplianceIssueService.execute(auditId, performedId, issueId, { completion_date, completion_notes, file });
      return res.data ?? res;
    } catch (err) {
      return rejectWithValue(
        err?.response?.data?.errors?.join(', ') || err?.response?.data?.error || 'Failed to execute issue.'
      );
    }
  }
);

// ── Slice ────────────────────────────────────────────────────────────────────

const ppeComplianceSlice = createSlice({
  name: 'ppeCompliance',
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
    setPpeCompliancePage:            (s, a) => { s.filters.page = a.payload; },
    setPpeComplianceAuditNumber:     (s, a) => { s.filters.audit_number = a.payload;       s.filters.page = 1; },
    setPpeComplianceAreaAudited:     (s, a) => { s.filters.area_audited = a.payload;       s.filters.page = 1; },
    setPpeComplianceDateFilter:      (s, a) => { s.filters.date = a.payload;               s.filters.page = 1; },
    setPpeComplianceStatusFilter:    (s, a) => { s.filters.status = a.payload;             s.filters.page = 1; },
    setPpeComplianceObjectiveFilter: (s, a) => { s.filters.objective_of_audit = a.payload; s.filters.page = 1; },
    setPpeComplianceScopeFilter:     (s, a) => { s.filters.scope_of_audit = a.payload;     s.filters.page = 1; },
    clearPpeComplianceFilters:       (s)    => { s.filters = INITIAL_FILTERS; },
    clearPpeComplianceRecordsError:  (s)    => { s.recordsError = null; },
    clearPpeComplianceActionError:   (s)    => { s.actionError = null; },
  },

  extraReducers: (builder) => {

    // fetchPpeComplianceCatalog
    builder
      .addCase(fetchPpeComplianceCatalog.pending,   (s) => { s.catalogLoading = true; s.catalogError = null; })
      .addCase(fetchPpeComplianceCatalog.fulfilled, (s, a) => { s.catalogLoading = false; s.catalog = a.payload; })
      .addCase(fetchPpeComplianceCatalog.rejected,  (s, a) => { s.catalogLoading = false; s.catalogError = a.payload; });

    // fetchPpeComplianceRecords
    builder
      .addCase(fetchPpeComplianceRecords.pending,   (s) => { s.recordsLoading = true; s.recordsError = null; })
      .addCase(fetchPpeComplianceRecords.fulfilled, (s, a) => {
        s.recordsLoading = false;
        s.records     = a.payload.data;
        s.recordsMeta = a.payload.meta;
      })
      .addCase(fetchPpeComplianceRecords.rejected,  (s, a) => { s.recordsLoading = false; s.recordsError = a.payload; });

    // createPpeComplianceRecord
    builder
      .addCase(createPpeComplianceRecord.pending,   (s) => { s.actionLoading = true; s.actionError = null; })
      .addCase(createPpeComplianceRecord.fulfilled, (s, a) => {
        s.actionLoading = false;
        s.records.unshift(a.payload);
        if (s.recordsMeta) s.recordsMeta.total += 1;
      })
      .addCase(createPpeComplianceRecord.rejected,  (s, a) => { s.actionLoading = false; s.actionError = a.payload; });

    // updatePpeComplianceRecord
    builder
      .addCase(updatePpeComplianceRecord.pending,   (s) => { s.actionLoading = true; s.actionError = null; })
      .addCase(updatePpeComplianceRecord.fulfilled, (s, a) => {
        s.actionLoading = false;
        const idx = s.records.findIndex((r) => r.id === a.payload.id);
        if (idx !== -1) s.records[idx] = a.payload;
      })
      .addCase(updatePpeComplianceRecord.rejected,  (s, a) => { s.actionLoading = false; s.actionError = a.payload; });

    // deletePpeComplianceRecord
    builder
      .addCase(deletePpeComplianceRecord.pending,   (s) => { s.actionLoading = true; s.actionError = null; })
      .addCase(deletePpeComplianceRecord.fulfilled, (s, a) => {
        s.actionLoading = false;
        s.records = s.records.filter((r) => r.id !== a.payload);
        if (s.recordsMeta) s.recordsMeta.total = Math.max(0, s.recordsMeta.total - 1);
      })
      .addCase(deletePpeComplianceRecord.rejected,  (s, a) => { s.actionLoading = false; s.actionError = a.payload; });

    // reassignPpeComplianceAuditors
    builder
      .addCase(reassignPpeComplianceAuditors.pending,   (s) => { s.actionLoading = true; s.actionError = null; })
      .addCase(reassignPpeComplianceAuditors.fulfilled, (s, a) => {
        s.actionLoading = false;
        const idx = s.records.findIndex((r) => r.id === a.payload.id);
        if (idx !== -1) s.records[idx] = a.payload;
      })
      .addCase(reassignPpeComplianceAuditors.rejected,  (s, a) => { s.actionLoading = false; s.actionError = a.payload; });

    // performPpeComplianceRecord
    builder
      .addCase(performPpeComplianceRecord.pending,   (s) => { s.actionLoading = true; s.actionError = null; })
      .addCase(performPpeComplianceRecord.fulfilled, (s) => { s.actionLoading = false; })
      .addCase(performPpeComplianceRecord.rejected,  (s, a) => { s.actionLoading = false; s.actionError = a.payload; });

    // fetchPpeComplianceIssues
    builder.addCase(fetchPpeComplianceIssues.fulfilled, (s, a) => {
      s.issuesByPerformed[a.payload.performedId] = a.payload.data;
    });

    // issue mutations
    [
      updatePpeComplianceCorrectiveAction,
      updatePpeCompliancePriorityDueDate,
      assignPpeComplianceContractor,
      executePpeComplianceIssue,
    ].forEach((thunk) => {
      builder
        .addCase(thunk.pending,   (s) => { s.actionLoading = true; s.actionError = null; })
        .addCase(thunk.fulfilled, (s) => { s.actionLoading = false; })
        .addCase(thunk.rejected,  (s, a) => { s.actionLoading = false; s.actionError = a.payload; });
    });
  },
});

export const {
  setPpeCompliancePage,
  setPpeComplianceAuditNumber,
  setPpeComplianceAreaAudited,
  setPpeComplianceDateFilter,
  setPpeComplianceStatusFilter,
  setPpeComplianceObjectiveFilter,
  setPpeComplianceScopeFilter,
  clearPpeComplianceFilters,
  clearPpeComplianceRecordsError,
  clearPpeComplianceActionError,
} = ppeComplianceSlice.actions;

// ── Selectors ────────────────────────────────────────────────────────────────
export const selectPpeComplianceCatalog           = (s) => s.ppeCompliance.catalog;
export const selectPpeComplianceCatalogLoading    = (s) => s.ppeCompliance.catalogLoading;
export const selectPpeComplianceRecords           = (s) => s.ppeCompliance.records;
export const selectPpeComplianceRecordsMeta       = (s) => s.ppeCompliance.recordsMeta;
export const selectPpeComplianceRecordsLoading    = (s) => s.ppeCompliance.recordsLoading;
export const selectPpeComplianceRecordsError      = (s) => s.ppeCompliance.recordsError;
export const selectPpeComplianceActionLoading     = (s) => s.ppeCompliance.actionLoading;
export const selectPpeComplianceActionError       = (s) => s.ppeCompliance.actionError;
export const selectPpeComplianceFilters           = (s) => s.ppeCompliance.filters;
export const selectPpeComplianceIssuesByPerformed = (s) => s.ppeCompliance.issuesByPerformed;

export default ppeComplianceSlice.reducer;
