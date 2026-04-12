/**
 * mrmSlice.js
 *
 * Redux Toolkit slice for the Health & Safety Audit — Management Review Meeting module.
 *
 * State shape:
 *  catalog            : all HSA parent audit records
 *  catalogLoading     : catalog fetch in flight
 *  records            : paginated Management Review Meeting setup records
 *  recordsMeta        : pagination meta
 *  recordsLoading     : list fetch in flight
 *  recordsError       : list fetch error
 *  actionLoading      : create / update / delete / reassign / perform in flight
 *  actionError        : action error message
 *  issuesByPerformed  : issues keyed by performed Management Review Meeting id
 *  filters            : current filter values
 */
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import {
  MrmSetupService,
  MrmPerformService,
  MrmIssueService,
} from '../../services/managementReviewMeeting.service';
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
export const fetchMrmCatalog = createAsyncThunk(
  'mrm/fetchCatalog',
  async (params = {}, { rejectWithValue }) => {
    try {
      const res = await HsaParentService.list(params);
      return Array.isArray(res) ? res : (res.data ?? []);
    } catch (err) {
      return rejectWithValue(err?.response?.data?.error || 'Failed to load HSA catalog.');
    }
  }
);

/** Fetch paginated Management Review Meeting setup records */
export const fetchMrmRecords = createAsyncThunk(
  'mrm/fetchRecords',
  async (auditId, { getState, rejectWithValue }) => {
    try {
      const { filters } = getState().mrm;
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
      const res = await MrmSetupService.list(auditId, query);
      return { data: res.data ?? [], meta: res.meta ?? null };
    } catch (err) {
      return rejectWithValue(err?.response?.data?.error || 'Failed to load records.');
    }
  }
);

/** Create a new Management Review Meeting setup record */
export const createMrmRecord = createAsyncThunk(
  'mrm/createRecord',
  async ({ auditId, data }, { rejectWithValue }) => {
    try {
      const res = await MrmSetupService.create(auditId, data);
      return res.data ?? res;
    } catch (err) {
      return rejectWithValue(
        err?.response?.data?.errors?.join(', ') || err?.response?.data?.error || 'Failed to create record.'
      );
    }
  }
);

/** Update a Management Review Meeting setup record */
export const updateMrmRecord = createAsyncThunk(
  'mrm/updateRecord',
  async ({ auditId, id, data }, { rejectWithValue }) => {
    try {
      const res = await MrmSetupService.update(auditId, id, data);
      return res.data ?? res;
    } catch (err) {
      return rejectWithValue(
        err?.response?.data?.errors?.join(', ') || err?.response?.data?.error || 'Failed to update record.'
      );
    }
  }
);

/** Delete a Management Review Meeting setup record */
export const deleteMrmRecord = createAsyncThunk(
  'mrm/deleteRecord',
  async ({ auditId, id }, { rejectWithValue }) => {
    try {
      await MrmSetupService.remove(auditId, id);
      return id;
    } catch (err) {
      return rejectWithValue(err?.response?.data?.error || 'Failed to delete record.');
    }
  }
);

/** Reassign auditors on a Management Review Meeting record */
export const reassignMrmAuditors = createAsyncThunk(
  'mrm/reassignAuditors',
  async ({ auditId, id, auditorIds }, { rejectWithValue }) => {
    try {
      const res = await MrmSetupService.reassignAuditors(auditId, id, auditorIds);
      return res.data ?? res;
    } catch (err) {
      return rejectWithValue(
        err?.response?.data?.errors?.join(', ') || err?.response?.data?.error || 'Failed to reassign auditors.'
      );
    }
  }
);

/** Perform a Management Review Meeting audit (dynamic checklist items) */
export const performMrmRecord = createAsyncThunk(
  'mrm/perform',
  async ({ auditId, mrmId, payload }, { rejectWithValue }) => {
    try {
      const res = await MrmPerformService.perform(auditId, mrmId, payload);
      return res.data ?? res;
    } catch (err) {
      return rejectWithValue(
        err?.response?.data?.errors?.join(', ') || err?.response?.data?.error || 'Failed to perform audit.'
      );
    }
  }
);

/** Fetch issues for a performed Management Review Meeting */
export const fetchMrmIssues = createAsyncThunk(
  'mrm/fetchIssues',
  async ({ auditId, performedId, params = {} }, { rejectWithValue }) => {
    try {
      const res = await MrmIssueService.list(auditId, performedId, params);
      return { performedId, data: Array.isArray(res) ? res : (res.data ?? []) };
    } catch (err) {
      return rejectWithValue(err?.response?.data?.error || 'Failed to load issues.');
    }
  }
);

/** Update corrective action on a Management Review Meeting issue */
export const updateMrmCorrectiveAction = createAsyncThunk(
  'mrm/updateCorrectiveAction',
  async ({ auditId, performedId, issueId, correctiveAction }, { rejectWithValue }) => {
    try {
      const res = await MrmIssueService.updateCorrectiveAction(auditId, performedId, issueId, correctiveAction);
      return res.data ?? res;
    } catch (err) {
      return rejectWithValue(
        err?.response?.data?.errors?.join(', ') || err?.response?.data?.error || 'Failed to update corrective action.'
      );
    }
  }
);

/** Update priority and due date on a Management Review Meeting issue */
export const updateMrmPriorityDueDate = createAsyncThunk(
  'mrm/updatePriorityDueDate',
  async ({ auditId, performedId, issueId, priority_level, due_date }, { rejectWithValue }) => {
    try {
      const res = await MrmIssueService.updatePriorityDueDate(auditId, performedId, issueId, { priority_level, due_date });
      return res.data ?? res;
    } catch (err) {
      return rejectWithValue(
        err?.response?.data?.errors?.join(', ') || err?.response?.data?.error || 'Failed to update priority / due date.'
      );
    }
  }
);

/** Assign a contractor to a Management Review Meeting issue */
export const assignMrmContractor = createAsyncThunk(
  'mrm/assignContractor',
  async ({ auditId, performedId, issueId, contractorId }, { rejectWithValue }) => {
    try {
      const res = await MrmIssueService.assignContractor(auditId, performedId, issueId, contractorId);
      return res.data ?? res;
    } catch (err) {
      return rejectWithValue(
        err?.response?.data?.errors?.join(', ') || err?.response?.data?.error || 'Failed to assign contractor.'
      );
    }
  }
);

/** Execute (close out) a Management Review Meeting issue */
export const executeMrmIssue = createAsyncThunk(
  'mrm/executeIssue',
  async ({ auditId, performedId, issueId, completion_date, completion_notes, file }, { rejectWithValue }) => {
    try {
      const res = await MrmIssueService.execute(auditId, performedId, issueId, { completion_date, completion_notes, file });
      return res.data ?? res;
    } catch (err) {
      return rejectWithValue(
        err?.response?.data?.errors?.join(', ') || err?.response?.data?.error || 'Failed to execute issue.'
      );
    }
  }
);

// ── Slice ────────────────────────────────────────────────────────────────────

const mrmSlice = createSlice({
  name: 'mrm',
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
    setMrmPage:            (s, a) => { s.filters.page = a.payload; },
    setMrmAuditNumber:     (s, a) => { s.filters.audit_number = a.payload;       s.filters.page = 1; },
    setMrmAreaAudited:     (s, a) => { s.filters.area_audited = a.payload;       s.filters.page = 1; },
    setMrmDateFilter:      (s, a) => { s.filters.date = a.payload;               s.filters.page = 1; },
    setMrmStatusFilter:    (s, a) => { s.filters.status = a.payload;             s.filters.page = 1; },
    setMrmObjectiveFilter: (s, a) => { s.filters.objective_of_audit = a.payload; s.filters.page = 1; },
    setMrmScopeFilter:     (s, a) => { s.filters.scope_of_audit = a.payload;     s.filters.page = 1; },
    clearMrmFilters:       (s)    => { s.filters = INITIAL_FILTERS; },
    clearMrmRecordsError:  (s)    => { s.recordsError = null; },
    clearMrmActionError:   (s)    => { s.actionError = null; },
  },

  extraReducers: (builder) => {

    // fetchMrmCatalog
    builder
      .addCase(fetchMrmCatalog.pending,   (s) => { s.catalogLoading = true; s.catalogError = null; })
      .addCase(fetchMrmCatalog.fulfilled, (s, a) => { s.catalogLoading = false; s.catalog = a.payload; })
      .addCase(fetchMrmCatalog.rejected,  (s, a) => { s.catalogLoading = false; s.catalogError = a.payload; });

    // fetchMrmRecords
    builder
      .addCase(fetchMrmRecords.pending,   (s) => { s.recordsLoading = true; s.recordsError = null; })
      .addCase(fetchMrmRecords.fulfilled, (s, a) => {
        s.recordsLoading = false;
        s.records     = a.payload.data;
        s.recordsMeta = a.payload.meta;
      })
      .addCase(fetchMrmRecords.rejected,  (s, a) => { s.recordsLoading = false; s.recordsError = a.payload; });

    // createMrmRecord
    builder
      .addCase(createMrmRecord.pending,   (s) => { s.actionLoading = true; s.actionError = null; })
      .addCase(createMrmRecord.fulfilled, (s, a) => {
        s.actionLoading = false;
        s.records.unshift(a.payload);
        if (s.recordsMeta) s.recordsMeta.total += 1;
      })
      .addCase(createMrmRecord.rejected,  (s, a) => { s.actionLoading = false; s.actionError = a.payload; });

    // updateMrmRecord
    builder
      .addCase(updateMrmRecord.pending,   (s) => { s.actionLoading = true; s.actionError = null; })
      .addCase(updateMrmRecord.fulfilled, (s, a) => {
        s.actionLoading = false;
        const idx = s.records.findIndex((r) => r.id === a.payload.id);
        if (idx !== -1) s.records[idx] = a.payload;
      })
      .addCase(updateMrmRecord.rejected,  (s, a) => { s.actionLoading = false; s.actionError = a.payload; });

    // deleteMrmRecord
    builder
      .addCase(deleteMrmRecord.pending,   (s) => { s.actionLoading = true; s.actionError = null; })
      .addCase(deleteMrmRecord.fulfilled, (s, a) => {
        s.actionLoading = false;
        s.records = s.records.filter((r) => r.id !== a.payload);
        if (s.recordsMeta) s.recordsMeta.total = Math.max(0, s.recordsMeta.total - 1);
      })
      .addCase(deleteMrmRecord.rejected,  (s, a) => { s.actionLoading = false; s.actionError = a.payload; });

    // reassignMrmAuditors
    builder
      .addCase(reassignMrmAuditors.pending,   (s) => { s.actionLoading = true; s.actionError = null; })
      .addCase(reassignMrmAuditors.fulfilled, (s, a) => {
        s.actionLoading = false;
        const idx = s.records.findIndex((r) => r.id === a.payload.id);
        if (idx !== -1) s.records[idx] = a.payload;
      })
      .addCase(reassignMrmAuditors.rejected,  (s, a) => { s.actionLoading = false; s.actionError = a.payload; });

    // performMrmRecord
    builder
      .addCase(performMrmRecord.pending,   (s) => { s.actionLoading = true; s.actionError = null; })
      .addCase(performMrmRecord.fulfilled, (s) => { s.actionLoading = false; })
      .addCase(performMrmRecord.rejected,  (s, a) => { s.actionLoading = false; s.actionError = a.payload; });

    // fetchMrmIssues
    builder.addCase(fetchMrmIssues.fulfilled, (s, a) => {
      s.issuesByPerformed[a.payload.performedId] = a.payload.data;
    });

    // issue mutations
    [updateMrmCorrectiveAction, updateMrmPriorityDueDate, assignMrmContractor, executeMrmIssue].forEach((thunk) => {
      builder
        .addCase(thunk.pending,   (s) => { s.actionLoading = true; s.actionError = null; })
        .addCase(thunk.fulfilled, (s) => { s.actionLoading = false; })
        .addCase(thunk.rejected,  (s, a) => { s.actionLoading = false; s.actionError = a.payload; });
    });
  },
});

export const {
  setMrmPage,
  setMrmAuditNumber,
  setMrmAreaAudited,
  setMrmDateFilter,
  setMrmStatusFilter,
  setMrmObjectiveFilter,
  setMrmScopeFilter,
  clearMrmFilters,
  clearMrmRecordsError,
  clearMrmActionError,
} = mrmSlice.actions;

// ── Selectors ────────────────────────────────────────────────────────────────
export const selectMrmCatalog           = (s) => s.mrm.catalog;
export const selectMrmCatalogLoading    = (s) => s.mrm.catalogLoading;
export const selectMrmRecords           = (s) => s.mrm.records;
export const selectMrmRecordsMeta       = (s) => s.mrm.recordsMeta;
export const selectMrmRecordsLoading    = (s) => s.mrm.recordsLoading;
export const selectMrmRecordsError      = (s) => s.mrm.recordsError;
export const selectMrmActionLoading     = (s) => s.mrm.actionLoading;
export const selectMrmActionError       = (s) => s.mrm.actionError;
export const selectMrmFilters           = (s) => s.mrm.filters;
export const selectMrmIssuesByPerformed = (s) => s.mrm.issuesByPerformed;

export default mrmSlice.reducer;
