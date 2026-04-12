/**
 * contractorSafetySlice.js
 *
 * Redux Toolkit slice for the Health & Safety Audit — Contractor Safety module.
 *
 * State shape:
 *  catalog            : all HSA parent audit records
 *  catalogLoading     : catalog fetch in flight
 *  records            : paginated Contractor Safety setup records
 *  recordsMeta        : pagination meta
 *  recordsLoading     : list fetch in flight
 *  recordsError       : list fetch error
 *  actionLoading      : create / update / delete / reassign / perform in flight
 *  actionError        : action error message
 *  issuesByPerformed  : issues keyed by performed Contractor Safety id
 *  filters            : current filter values
 *
 * NOTE: Contractor Safety is a fully dynamic module — no template management.
 *       Checklist items are free-text entries created at perform time.
 */
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import {
  ContractorSafetySetupService,
  ContractorSafetyPerformService,
  ContractorSafetyIssueService,
} from '../../services/contractorSafety.service';
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
export const fetchCsCatalog = createAsyncThunk(
  'cs/fetchCatalog',
  async (params = {}, { rejectWithValue }) => {
    try {
      const res = await HsaParentService.list(params);
      return Array.isArray(res) ? res : (res.data ?? []);
    } catch (err) {
      return rejectWithValue(err?.response?.data?.error || 'Failed to load HSA catalog.');
    }
  }
);

/** Fetch paginated Contractor Safety setup records */
export const fetchCsRecords = createAsyncThunk(
  'cs/fetchRecords',
  async (auditId, { getState, rejectWithValue }) => {
    try {
      const { filters } = getState().cs;
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
      const res = await ContractorSafetySetupService.list(auditId, query);
      return { data: res.data ?? [], meta: res.meta ?? null };
    } catch (err) {
      return rejectWithValue(err?.response?.data?.error || 'Failed to load records.');
    }
  }
);

/** Create a new Contractor Safety setup record */
export const createCsRecord = createAsyncThunk(
  'cs/createRecord',
  async ({ auditId, data }, { rejectWithValue }) => {
    try {
      const res = await ContractorSafetySetupService.create(auditId, data);
      return res.data ?? res;
    } catch (err) {
      return rejectWithValue(
        err?.response?.data?.errors?.join(', ') || err?.response?.data?.error || 'Failed to create record.'
      );
    }
  }
);

/** Update a Contractor Safety setup record */
export const updateCsRecord = createAsyncThunk(
  'cs/updateRecord',
  async ({ auditId, id, data }, { rejectWithValue }) => {
    try {
      const res = await ContractorSafetySetupService.update(auditId, id, data);
      return res.data ?? res;
    } catch (err) {
      return rejectWithValue(
        err?.response?.data?.errors?.join(', ') || err?.response?.data?.error || 'Failed to update record.'
      );
    }
  }
);

/** Delete a Contractor Safety setup record */
export const deleteCsRecord = createAsyncThunk(
  'cs/deleteRecord',
  async ({ auditId, id }, { rejectWithValue }) => {
    try {
      await ContractorSafetySetupService.remove(auditId, id);
      return id;
    } catch (err) {
      return rejectWithValue(err?.response?.data?.error || 'Failed to delete record.');
    }
  }
);

/** Reassign auditors on a Contractor Safety record */
export const reassignCsAuditors = createAsyncThunk(
  'cs/reassignAuditors',
  async ({ auditId, id, auditorIds }, { rejectWithValue }) => {
    try {
      const res = await ContractorSafetySetupService.reassignAuditors(auditId, id, auditorIds);
      return res.data ?? res;
    } catch (err) {
      return rejectWithValue(
        err?.response?.data?.errors?.join(', ') || err?.response?.data?.error || 'Failed to reassign auditors.'
      );
    }
  }
);

/** Perform a Contractor Safety audit (dynamic checklist items) */
export const performCsRecord = createAsyncThunk(
  'cs/perform',
  async ({ auditId, csId, payload }, { rejectWithValue }) => {
    try {
      const res = await ContractorSafetyPerformService.perform(auditId, csId, payload);
      return res.data ?? res;
    } catch (err) {
      return rejectWithValue(
        err?.response?.data?.errors?.join(', ') || err?.response?.data?.error || 'Failed to perform audit.'
      );
    }
  }
);

/** Fetch issues for a performed Contractor Safety */
export const fetchCsIssues = createAsyncThunk(
  'cs/fetchIssues',
  async ({ auditId, performedId, params = {} }, { rejectWithValue }) => {
    try {
      const res = await ContractorSafetyIssueService.list(auditId, performedId, params);
      return { performedId, data: Array.isArray(res) ? res : (res.data ?? []) };
    } catch (err) {
      return rejectWithValue(err?.response?.data?.error || 'Failed to load issues.');
    }
  }
);

/** Update corrective action on a Contractor Safety issue */
export const updateCsCorrectiveAction = createAsyncThunk(
  'cs/updateCorrectiveAction',
  async ({ auditId, performedId, issueId, correctiveAction }, { rejectWithValue }) => {
    try {
      const res = await ContractorSafetyIssueService.updateCorrectiveAction(auditId, performedId, issueId, correctiveAction);
      return res.data ?? res;
    } catch (err) {
      return rejectWithValue(
        err?.response?.data?.errors?.join(', ') || err?.response?.data?.error || 'Failed to update corrective action.'
      );
    }
  }
);

/** Update priority and due date on a Contractor Safety issue */
export const updateCsPriorityDueDate = createAsyncThunk(
  'cs/updatePriorityDueDate',
  async ({ auditId, performedId, issueId, priority_level, due_date }, { rejectWithValue }) => {
    try {
      const res = await ContractorSafetyIssueService.updatePriorityDueDate(auditId, performedId, issueId, { priority_level, due_date });
      return res.data ?? res;
    } catch (err) {
      return rejectWithValue(
        err?.response?.data?.errors?.join(', ') || err?.response?.data?.error || 'Failed to update priority / due date.'
      );
    }
  }
);

/** Assign a contractor to a Contractor Safety issue */
export const assignCsContractor = createAsyncThunk(
  'cs/assignContractor',
  async ({ auditId, performedId, issueId, contractorId }, { rejectWithValue }) => {
    try {
      const res = await ContractorSafetyIssueService.assignContractor(auditId, performedId, issueId, contractorId);
      return res.data ?? res;
    } catch (err) {
      return rejectWithValue(
        err?.response?.data?.errors?.join(', ') || err?.response?.data?.error || 'Failed to assign contractor.'
      );
    }
  }
);

/** Execute (close out) a Contractor Safety issue */
export const executeCsIssue = createAsyncThunk(
  'cs/executeIssue',
  async ({ auditId, performedId, issueId, completion_date, completion_notes, file }, { rejectWithValue }) => {
    try {
      const res = await ContractorSafetyIssueService.execute(auditId, performedId, issueId, { completion_date, completion_notes, file });
      return res.data ?? res;
    } catch (err) {
      return rejectWithValue(
        err?.response?.data?.errors?.join(', ') || err?.response?.data?.error || 'Failed to execute issue.'
      );
    }
  }
);

// ── Slice ────────────────────────────────────────────────────────────────────

const csSlice = createSlice({
  name: 'cs',
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
    setCsPage:            (s, a) => { s.filters.page = a.payload; },
    setCsAuditNumber:     (s, a) => { s.filters.audit_number = a.payload;       s.filters.page = 1; },
    setCsAreaAudited:     (s, a) => { s.filters.area_audited = a.payload;       s.filters.page = 1; },
    setCsDateFilter:      (s, a) => { s.filters.date = a.payload;               s.filters.page = 1; },
    setCsStatusFilter:    (s, a) => { s.filters.status = a.payload;             s.filters.page = 1; },
    setCsObjectiveFilter: (s, a) => { s.filters.objective_of_audit = a.payload; s.filters.page = 1; },
    setCsScopeFilter:     (s, a) => { s.filters.scope_of_audit = a.payload;     s.filters.page = 1; },
    clearCsFilters:       (s)    => { s.filters = INITIAL_FILTERS; },
    clearCsRecordsError:  (s)    => { s.recordsError = null; },
    clearCsActionError:   (s)    => { s.actionError = null; },
  },

  extraReducers: (builder) => {

    // fetchCsCatalog
    builder
      .addCase(fetchCsCatalog.pending,   (s) => { s.catalogLoading = true; s.catalogError = null; })
      .addCase(fetchCsCatalog.fulfilled, (s, a) => { s.catalogLoading = false; s.catalog = a.payload; })
      .addCase(fetchCsCatalog.rejected,  (s, a) => { s.catalogLoading = false; s.catalogError = a.payload; });

    // fetchCsRecords
    builder
      .addCase(fetchCsRecords.pending,   (s) => { s.recordsLoading = true; s.recordsError = null; })
      .addCase(fetchCsRecords.fulfilled, (s, a) => {
        s.recordsLoading = false;
        s.records     = a.payload.data;
        s.recordsMeta = a.payload.meta;
      })
      .addCase(fetchCsRecords.rejected,  (s, a) => { s.recordsLoading = false; s.recordsError = a.payload; });

    // createCsRecord
    builder
      .addCase(createCsRecord.pending,   (s) => { s.actionLoading = true; s.actionError = null; })
      .addCase(createCsRecord.fulfilled, (s, a) => {
        s.actionLoading = false;
        s.records.unshift(a.payload);
        if (s.recordsMeta) s.recordsMeta.total += 1;
      })
      .addCase(createCsRecord.rejected,  (s, a) => { s.actionLoading = false; s.actionError = a.payload; });

    // updateCsRecord
    builder
      .addCase(updateCsRecord.pending,   (s) => { s.actionLoading = true; s.actionError = null; })
      .addCase(updateCsRecord.fulfilled, (s, a) => {
        s.actionLoading = false;
        const idx = s.records.findIndex((r) => r.id === a.payload.id);
        if (idx !== -1) s.records[idx] = a.payload;
      })
      .addCase(updateCsRecord.rejected,  (s, a) => { s.actionLoading = false; s.actionError = a.payload; });

    // deleteCsRecord
    builder
      .addCase(deleteCsRecord.pending,   (s) => { s.actionLoading = true; s.actionError = null; })
      .addCase(deleteCsRecord.fulfilled, (s, a) => {
        s.actionLoading = false;
        s.records = s.records.filter((r) => r.id !== a.payload);
        if (s.recordsMeta) s.recordsMeta.total = Math.max(0, s.recordsMeta.total - 1);
      })
      .addCase(deleteCsRecord.rejected,  (s, a) => { s.actionLoading = false; s.actionError = a.payload; });

    // reassignCsAuditors
    builder
      .addCase(reassignCsAuditors.pending,   (s) => { s.actionLoading = true; s.actionError = null; })
      .addCase(reassignCsAuditors.fulfilled, (s, a) => {
        s.actionLoading = false;
        const idx = s.records.findIndex((r) => r.id === a.payload.id);
        if (idx !== -1) s.records[idx] = a.payload;
      })
      .addCase(reassignCsAuditors.rejected,  (s, a) => { s.actionLoading = false; s.actionError = a.payload; });

    // performCsRecord
    builder
      .addCase(performCsRecord.pending,   (s) => { s.actionLoading = true; s.actionError = null; })
      .addCase(performCsRecord.fulfilled, (s) => { s.actionLoading = false; })
      .addCase(performCsRecord.rejected,  (s, a) => { s.actionLoading = false; s.actionError = a.payload; });

    // fetchCsIssues
    builder.addCase(fetchCsIssues.fulfilled, (s, a) => {
      s.issuesByPerformed[a.payload.performedId] = a.payload.data;
    });

    // issue mutations
    [updateCsCorrectiveAction, updateCsPriorityDueDate, assignCsContractor, executeCsIssue].forEach((thunk) => {
      builder
        .addCase(thunk.pending,   (s) => { s.actionLoading = true; s.actionError = null; })
        .addCase(thunk.fulfilled, (s) => { s.actionLoading = false; })
        .addCase(thunk.rejected,  (s, a) => { s.actionLoading = false; s.actionError = a.payload; });
    });
  },
});

export const {
  setCsPage,
  setCsAuditNumber,
  setCsAreaAudited,
  setCsDateFilter,
  setCsStatusFilter,
  setCsObjectiveFilter,
  setCsScopeFilter,
  clearCsFilters,
  clearCsRecordsError,
  clearCsActionError,
} = csSlice.actions;

// ── Selectors ────────────────────────────────────────────────────────────────
export const selectCsCatalog           = (s) => s.cs.catalog;
export const selectCsCatalogLoading    = (s) => s.cs.catalogLoading;
export const selectCsRecords           = (s) => s.cs.records;
export const selectCsRecordsMeta       = (s) => s.cs.recordsMeta;
export const selectCsRecordsLoading    = (s) => s.cs.recordsLoading;
export const selectCsRecordsError      = (s) => s.cs.recordsError;
export const selectCsActionLoading     = (s) => s.cs.actionLoading;
export const selectCsActionError       = (s) => s.cs.actionError;
export const selectCsFilters           = (s) => s.cs.filters;
export const selectCsIssuesByPerformed = (s) => s.cs.issuesByPerformed;

export default csSlice.reducer;
