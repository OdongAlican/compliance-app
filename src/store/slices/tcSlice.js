/**
 * tcSlice.js
 *
 * Redux Toolkit slice for the Health & Safety Audit — Training and Competency module.
 *
 * State shape:
 *  catalog         : all HSA parent audit records
 *  catalogLoading  : catalog fetch in flight
 *  records         : paginated TC setup records
 *  recordsMeta     : pagination meta
 *  recordsLoading  : list fetch in flight
 *  recordsError    : list fetch error
 *  actionLoading   : create / update / delete / reassign / perform in flight
 *  actionError     : action error message
 *  issuesByPerformed : issues keyed by performed TC id
 *  filters         : current filter values
 *
 * NOTE: TC is a fully dynamic module — no template management.
 *       Checklist items are free-text entries created at perform time.
 */
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import {
  TcSetupService,
  TcPerformService,
  TcIssueService,
} from '../../services/trainingAndCompetency.service';
import { HsaParentService } from '../../services/healthAndSafetyAudit.service';

const INITIAL_FILTERS = {
  page:              1,
  per_page:          10,
  audit_number:      '',
  area_audited:      '',
  date:              '',
  status:            '',
  objective_of_audit:'',
  scope_of_audit:    '',
};

// ── Async thunks ──────────────────────────────────────────────────────────────

/** Fetch all parent HSA audit records (catalog) */
export const fetchTcCatalog = createAsyncThunk(
  'tc/fetchCatalog',
  async (params = {}, { rejectWithValue }) => {
    try {
      const res = await HsaParentService.list(params);
      return Array.isArray(res) ? res : (res.data ?? []);
    } catch (err) {
      return rejectWithValue(err?.response?.data?.error || 'Failed to load HSA catalog.');
    }
  }
);

/** Fetch paginated TC setup records */
export const fetchTcRecords = createAsyncThunk(
  'tc/fetchRecords',
  async (auditId, { getState, rejectWithValue }) => {
    try {
      const { filters } = getState().tc;
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
      const res = await TcSetupService.list(auditId, query);
      return { data: res.data ?? [], meta: res.meta ?? null };
    } catch (err) {
      return rejectWithValue(err?.response?.data?.error || 'Failed to load records.');
    }
  }
);

/** Create a new TC setup record */
export const createTcRecord = createAsyncThunk(
  'tc/createRecord',
  async ({ auditId, data }, { rejectWithValue }) => {
    try {
      const res = await TcSetupService.create(auditId, data);
      return res.data ?? res;
    } catch (err) {
      return rejectWithValue(
        err?.response?.data?.errors?.join(', ') || err?.response?.data?.error || 'Failed to create record.'
      );
    }
  }
);

/** Update a TC setup record */
export const updateTcRecord = createAsyncThunk(
  'tc/updateRecord',
  async ({ auditId, id, data }, { rejectWithValue }) => {
    try {
      const res = await TcSetupService.update(auditId, id, data);
      return res.data ?? res;
    } catch (err) {
      return rejectWithValue(
        err?.response?.data?.errors?.join(', ') || err?.response?.data?.error || 'Failed to update record.'
      );
    }
  }
);

/** Delete a TC setup record */
export const deleteTcRecord = createAsyncThunk(
  'tc/deleteRecord',
  async ({ auditId, id }, { rejectWithValue }) => {
    try {
      await TcSetupService.remove(auditId, id);
      return id;
    } catch (err) {
      return rejectWithValue(err?.response?.data?.error || 'Failed to delete record.');
    }
  }
);

/** Reassign auditors on a TC record */
export const reassignTcAuditors = createAsyncThunk(
  'tc/reassignAuditors',
  async ({ auditId, id, auditorIds }, { rejectWithValue }) => {
    try {
      const res = await TcSetupService.reassignAuditors(auditId, id, auditorIds);
      return res.data ?? res;
    } catch (err) {
      return rejectWithValue(
        err?.response?.data?.errors?.join(', ') || err?.response?.data?.error || 'Failed to reassign auditors.'
      );
    }
  }
);

/** Perform a TC audit (dynamic checklist items) */
export const performTcRecord = createAsyncThunk(
  'tc/perform',
  async ({ auditId, tcId, payload }, { rejectWithValue }) => {
    try {
      const res = await TcPerformService.perform(auditId, tcId, payload);
      return res.data ?? res;
    } catch (err) {
      return rejectWithValue(
        err?.response?.data?.errors?.join(', ') || err?.response?.data?.error || 'Failed to perform audit.'
      );
    }
  }
);

/** Fetch issues for a performed TC */
export const fetchTcIssues = createAsyncThunk(
  'tc/fetchIssues',
  async ({ auditId, performedId, params = {} }, { rejectWithValue }) => {
    try {
      const res = await TcIssueService.list(auditId, performedId, params);
      return { performedId, data: Array.isArray(res) ? res : (res.data ?? []) };
    } catch (err) {
      return rejectWithValue(err?.response?.data?.error || 'Failed to load issues.');
    }
  }
);

/** Update corrective action on a TC issue */
export const updateTcCorrectiveAction = createAsyncThunk(
  'tc/updateCorrectiveAction',
  async ({ auditId, performedId, issueId, correctiveAction }, { rejectWithValue }) => {
    try {
      const res = await TcIssueService.updateCorrectiveAction(auditId, performedId, issueId, correctiveAction);
      return res.data ?? res;
    } catch (err) {
      return rejectWithValue(
        err?.response?.data?.errors?.join(', ') || err?.response?.data?.error || 'Failed to update corrective action.'
      );
    }
  }
);

/** Update priority and due date on a TC issue */
export const updateTcPriorityDueDate = createAsyncThunk(
  'tc/updatePriorityDueDate',
  async ({ auditId, performedId, issueId, priority_level, due_date }, { rejectWithValue }) => {
    try {
      const res = await TcIssueService.updatePriorityDueDate(auditId, performedId, issueId, { priority_level, due_date });
      return res.data ?? res;
    } catch (err) {
      return rejectWithValue(
        err?.response?.data?.errors?.join(', ') || err?.response?.data?.error || 'Failed to update priority / due date.'
      );
    }
  }
);

/** Assign a contractor to a TC issue */
export const assignTcContractor = createAsyncThunk(
  'tc/assignContractor',
  async ({ auditId, performedId, issueId, contractorId }, { rejectWithValue }) => {
    try {
      const res = await TcIssueService.assignContractor(auditId, performedId, issueId, contractorId);
      return res.data ?? res;
    } catch (err) {
      return rejectWithValue(
        err?.response?.data?.errors?.join(', ') || err?.response?.data?.error || 'Failed to assign contractor.'
      );
    }
  }
);

/** Execute (close out) a TC issue */
export const executeTcIssue = createAsyncThunk(
  'tc/executeIssue',
  async ({ auditId, performedId, issueId, completion_date, completion_notes, file }, { rejectWithValue }) => {
    try {
      const res = await TcIssueService.execute(auditId, performedId, issueId, { completion_date, completion_notes, file });
      return res.data ?? res;
    } catch (err) {
      return rejectWithValue(
        err?.response?.data?.errors?.join(', ') || err?.response?.data?.error || 'Failed to execute issue.'
      );
    }
  }
);

// ── Slice ────────────────────────────────────────────────────────────────────

const tcSlice = createSlice({
  name: 'tc',
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
    setTcPage:             (s, a) => { s.filters.page = a.payload; },
    setTcAuditNumber:      (s, a) => { s.filters.audit_number = a.payload;       s.filters.page = 1; },
    setTcAreaAudited:      (s, a) => { s.filters.area_audited = a.payload;       s.filters.page = 1; },
    setTcDateFilter:       (s, a) => { s.filters.date = a.payload;               s.filters.page = 1; },
    setTcStatusFilter:     (s, a) => { s.filters.status = a.payload;             s.filters.page = 1; },
    setTcObjectiveFilter:  (s, a) => { s.filters.objective_of_audit = a.payload; s.filters.page = 1; },
    setTcScopeFilter:      (s, a) => { s.filters.scope_of_audit = a.payload;     s.filters.page = 1; },
    clearTcFilters:        (s)    => { s.filters = INITIAL_FILTERS; },
    clearTcRecordsError:   (s)    => { s.recordsError = null; },
    clearTcActionError:    (s)    => { s.actionError = null; },
  },

  extraReducers: (builder) => {

    // fetchTcCatalog
    builder
      .addCase(fetchTcCatalog.pending,   (s) => { s.catalogLoading = true; s.catalogError = null; })
      .addCase(fetchTcCatalog.fulfilled, (s, a) => { s.catalogLoading = false; s.catalog = a.payload; })
      .addCase(fetchTcCatalog.rejected,  (s, a) => { s.catalogLoading = false; s.catalogError = a.payload; });

    // fetchTcRecords
    builder
      .addCase(fetchTcRecords.pending,   (s) => { s.recordsLoading = true; s.recordsError = null; })
      .addCase(fetchTcRecords.fulfilled, (s, a) => {
        s.recordsLoading = false;
        s.records     = a.payload.data;
        s.recordsMeta = a.payload.meta;
      })
      .addCase(fetchTcRecords.rejected,  (s, a) => { s.recordsLoading = false; s.recordsError = a.payload; });

    // createTcRecord
    builder
      .addCase(createTcRecord.pending,   (s) => { s.actionLoading = true; s.actionError = null; })
      .addCase(createTcRecord.fulfilled, (s, a) => {
        s.actionLoading = false;
        s.records.unshift(a.payload);
        if (s.recordsMeta) s.recordsMeta.total += 1;
      })
      .addCase(createTcRecord.rejected,  (s, a) => { s.actionLoading = false; s.actionError = a.payload; });

    // updateTcRecord
    builder
      .addCase(updateTcRecord.pending,   (s) => { s.actionLoading = true; s.actionError = null; })
      .addCase(updateTcRecord.fulfilled, (s, a) => {
        s.actionLoading = false;
        const idx = s.records.findIndex((r) => r.id === a.payload.id);
        if (idx !== -1) s.records[idx] = a.payload;
      })
      .addCase(updateTcRecord.rejected,  (s, a) => { s.actionLoading = false; s.actionError = a.payload; });

    // deleteTcRecord
    builder
      .addCase(deleteTcRecord.pending,   (s) => { s.actionLoading = true; s.actionError = null; })
      .addCase(deleteTcRecord.fulfilled, (s, a) => {
        s.actionLoading = false;
        s.records = s.records.filter((r) => r.id !== a.payload);
        if (s.recordsMeta) s.recordsMeta.total = Math.max(0, s.recordsMeta.total - 1);
      })
      .addCase(deleteTcRecord.rejected,  (s, a) => { s.actionLoading = false; s.actionError = a.payload; });

    // reassignTcAuditors
    builder
      .addCase(reassignTcAuditors.pending,   (s) => { s.actionLoading = true; s.actionError = null; })
      .addCase(reassignTcAuditors.fulfilled, (s, a) => {
        s.actionLoading = false;
        const idx = s.records.findIndex((r) => r.id === a.payload.id);
        if (idx !== -1) s.records[idx] = a.payload;
      })
      .addCase(reassignTcAuditors.rejected,  (s, a) => { s.actionLoading = false; s.actionError = a.payload; });

    // performTcRecord
    builder
      .addCase(performTcRecord.pending,   (s) => { s.actionLoading = true; s.actionError = null; })
      .addCase(performTcRecord.fulfilled, (s) => { s.actionLoading = false; })
      .addCase(performTcRecord.rejected,  (s, a) => { s.actionLoading = false; s.actionError = a.payload; });

    // fetchTcIssues
    builder.addCase(fetchTcIssues.fulfilled, (s, a) => {
      s.issuesByPerformed[a.payload.performedId] = a.payload.data;
    });

    // issue mutations
    [updateTcCorrectiveAction, updateTcPriorityDueDate, assignTcContractor, executeTcIssue].forEach((thunk) => {
      builder
        .addCase(thunk.pending,   (s) => { s.actionLoading = true; s.actionError = null; })
        .addCase(thunk.fulfilled, (s) => { s.actionLoading = false; })
        .addCase(thunk.rejected,  (s, a) => { s.actionLoading = false; s.actionError = a.payload; });
    });
  },
});

export const {
  setTcPage,
  setTcAuditNumber,
  setTcAreaAudited,
  setTcDateFilter,
  setTcStatusFilter,
  setTcObjectiveFilter,
  setTcScopeFilter,
  clearTcFilters,
  clearTcRecordsError,
  clearTcActionError,
} = tcSlice.actions;

// ── Selectors ────────────────────────────────────────────────────────────────
export const selectTcCatalog         = (s) => s.tc.catalog;
export const selectTcCatalogLoading  = (s) => s.tc.catalogLoading;
export const selectTcRecords         = (s) => s.tc.records;
export const selectTcRecordsMeta     = (s) => s.tc.recordsMeta;
export const selectTcRecordsLoading  = (s) => s.tc.recordsLoading;
export const selectTcRecordsError    = (s) => s.tc.recordsError;
export const selectTcActionLoading   = (s) => s.tc.actionLoading;
export const selectTcActionError     = (s) => s.tc.actionError;
export const selectTcFilters         = (s) => s.tc.filters;
export const selectTcIssuesByPerformed = (s) => s.tc.issuesByPerformed;

export default tcSlice.reducer;
