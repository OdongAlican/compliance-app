/**
 * epSlice.js
 *
 * Redux Toolkit slice for the Health & Safety Audit — Emergency Preparedness module.
 *
 * State shape:
 *  catalog            : all HSA parent audit records
 *  catalogLoading     : catalog fetch in flight
 *  records            : paginated EP setup records
 *  recordsMeta        : pagination meta
 *  recordsLoading     : list fetch in flight
 *  recordsError       : list fetch error
 *  actionLoading      : create / update / delete / reassign / perform in flight
 *  actionError        : action error message
 *  issuesByPerformed  : issues keyed by performed EP id
 *  filters            : current filter values
 *
 * NOTE: EP is a fully dynamic module — no template management.
 *       Checklist items are free-text entries created at perform time.
 */
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import {
  EpSetupService,
  EpPerformService,
  EpIssueService,
} from '../../services/emergencyPreparedness.service';
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
export const fetchEpCatalog = createAsyncThunk(
  'ep/fetchCatalog',
  async (params = {}, { rejectWithValue }) => {
    try {
      const res = await HsaParentService.list(params);
      return Array.isArray(res) ? res : (res.data ?? []);
    } catch (err) {
      return rejectWithValue(err?.response?.data?.error || 'Failed to load HSA catalog.');
    }
  }
);

/** Fetch paginated EP setup records */
export const fetchEpRecords = createAsyncThunk(
  'ep/fetchRecords',
  async (auditId, { getState, rejectWithValue }) => {
    try {
      const { filters } = getState().ep;
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
      const res = await EpSetupService.list(auditId, query);
      return { data: res.data ?? [], meta: res.meta ?? null };
    } catch (err) {
      return rejectWithValue(err?.response?.data?.error || 'Failed to load records.');
    }
  }
);

/** Create a new EP setup record */
export const createEpRecord = createAsyncThunk(
  'ep/createRecord',
  async ({ auditId, data }, { rejectWithValue }) => {
    try {
      const res = await EpSetupService.create(auditId, data);
      return res.data ?? res;
    } catch (err) {
      return rejectWithValue(
        err?.response?.data?.errors?.join(', ') || err?.response?.data?.error || 'Failed to create record.'
      );
    }
  }
);

/** Update an EP setup record */
export const updateEpRecord = createAsyncThunk(
  'ep/updateRecord',
  async ({ auditId, id, data }, { rejectWithValue }) => {
    try {
      const res = await EpSetupService.update(auditId, id, data);
      return res.data ?? res;
    } catch (err) {
      return rejectWithValue(
        err?.response?.data?.errors?.join(', ') || err?.response?.data?.error || 'Failed to update record.'
      );
    }
  }
);

/** Delete an EP setup record */
export const deleteEpRecord = createAsyncThunk(
  'ep/deleteRecord',
  async ({ auditId, id }, { rejectWithValue }) => {
    try {
      await EpSetupService.remove(auditId, id);
      return id;
    } catch (err) {
      return rejectWithValue(err?.response?.data?.error || 'Failed to delete record.');
    }
  }
);

/** Reassign auditors on an EP record */
export const reassignEpAuditors = createAsyncThunk(
  'ep/reassignAuditors',
  async ({ auditId, id, auditorIds }, { rejectWithValue }) => {
    try {
      const res = await EpSetupService.reassignAuditors(auditId, id, auditorIds);
      return res.data ?? res;
    } catch (err) {
      return rejectWithValue(
        err?.response?.data?.errors?.join(', ') || err?.response?.data?.error || 'Failed to reassign auditors.'
      );
    }
  }
);

/** Perform an EP audit (dynamic checklist items) */
export const performEpRecord = createAsyncThunk(
  'ep/perform',
  async ({ auditId, epId, payload }, { rejectWithValue }) => {
    try {
      const res = await EpPerformService.perform(auditId, epId, payload);
      return res.data ?? res;
    } catch (err) {
      return rejectWithValue(
        err?.response?.data?.errors?.join(', ') || err?.response?.data?.error || 'Failed to perform audit.'
      );
    }
  }
);

/** Fetch issues for a performed EP */
export const fetchEpIssues = createAsyncThunk(
  'ep/fetchIssues',
  async ({ auditId, performedId, params = {} }, { rejectWithValue }) => {
    try {
      const res = await EpIssueService.list(auditId, performedId, params);
      return { performedId, data: Array.isArray(res) ? res : (res.data ?? []) };
    } catch (err) {
      return rejectWithValue(err?.response?.data?.error || 'Failed to load issues.');
    }
  }
);

/** Update corrective action on an EP issue */
export const updateEpCorrectiveAction = createAsyncThunk(
  'ep/updateCorrectiveAction',
  async ({ auditId, performedId, issueId, correctiveAction }, { rejectWithValue }) => {
    try {
      const res = await EpIssueService.updateCorrectiveAction(auditId, performedId, issueId, correctiveAction);
      return res.data ?? res;
    } catch (err) {
      return rejectWithValue(
        err?.response?.data?.errors?.join(', ') || err?.response?.data?.error || 'Failed to update corrective action.'
      );
    }
  }
);

/** Update priority and due date on an EP issue */
export const updateEpPriorityDueDate = createAsyncThunk(
  'ep/updatePriorityDueDate',
  async ({ auditId, performedId, issueId, priority_level, due_date }, { rejectWithValue }) => {
    try {
      const res = await EpIssueService.updatePriorityDueDate(auditId, performedId, issueId, { priority_level, due_date });
      return res.data ?? res;
    } catch (err) {
      return rejectWithValue(
        err?.response?.data?.errors?.join(', ') || err?.response?.data?.error || 'Failed to update priority / due date.'
      );
    }
  }
);

/** Assign a contractor to an EP issue */
export const assignEpContractor = createAsyncThunk(
  'ep/assignContractor',
  async ({ auditId, performedId, issueId, contractorId }, { rejectWithValue }) => {
    try {
      const res = await EpIssueService.assignContractor(auditId, performedId, issueId, contractorId);
      return res.data ?? res;
    } catch (err) {
      return rejectWithValue(
        err?.response?.data?.errors?.join(', ') || err?.response?.data?.error || 'Failed to assign contractor.'
      );
    }
  }
);

/** Execute (close out) an EP issue */
export const executeEpIssue = createAsyncThunk(
  'ep/executeIssue',
  async ({ auditId, performedId, issueId, completion_date, completion_notes, file }, { rejectWithValue }) => {
    try {
      const res = await EpIssueService.execute(auditId, performedId, issueId, { completion_date, completion_notes, file });
      return res.data ?? res;
    } catch (err) {
      return rejectWithValue(
        err?.response?.data?.errors?.join(', ') || err?.response?.data?.error || 'Failed to execute issue.'
      );
    }
  }
);

// ── Slice ────────────────────────────────────────────────────────────────────

const epSlice = createSlice({
  name: 'ep',
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
    setEpPage:             (s, a) => { s.filters.page = a.payload; },
    setEpAuditNumber:      (s, a) => { s.filters.audit_number = a.payload;       s.filters.page = 1; },
    setEpAreaAudited:      (s, a) => { s.filters.area_audited = a.payload;       s.filters.page = 1; },
    setEpDateFilter:       (s, a) => { s.filters.date = a.payload;               s.filters.page = 1; },
    setEpStatusFilter:     (s, a) => { s.filters.status = a.payload;             s.filters.page = 1; },
    setEpObjectiveFilter:  (s, a) => { s.filters.objective_of_audit = a.payload; s.filters.page = 1; },
    setEpScopeFilter:      (s, a) => { s.filters.scope_of_audit = a.payload;     s.filters.page = 1; },
    clearEpFilters:        (s)    => { s.filters = INITIAL_FILTERS; },
    clearEpRecordsError:   (s)    => { s.recordsError = null; },
    clearEpActionError:    (s)    => { s.actionError = null; },
  },

  extraReducers: (builder) => {

    // fetchEpCatalog
    builder
      .addCase(fetchEpCatalog.pending,   (s) => { s.catalogLoading = true; s.catalogError = null; })
      .addCase(fetchEpCatalog.fulfilled, (s, a) => { s.catalogLoading = false; s.catalog = a.payload; })
      .addCase(fetchEpCatalog.rejected,  (s, a) => { s.catalogLoading = false; s.catalogError = a.payload; });

    // fetchEpRecords
    builder
      .addCase(fetchEpRecords.pending,   (s) => { s.recordsLoading = true; s.recordsError = null; })
      .addCase(fetchEpRecords.fulfilled, (s, a) => {
        s.recordsLoading = false;
        s.records     = a.payload.data;
        s.recordsMeta = a.payload.meta;
      })
      .addCase(fetchEpRecords.rejected,  (s, a) => { s.recordsLoading = false; s.recordsError = a.payload; });

    // createEpRecord
    builder
      .addCase(createEpRecord.pending,   (s) => { s.actionLoading = true; s.actionError = null; })
      .addCase(createEpRecord.fulfilled, (s, a) => {
        s.actionLoading = false;
        s.records.unshift(a.payload);
        if (s.recordsMeta) s.recordsMeta.total += 1;
      })
      .addCase(createEpRecord.rejected,  (s, a) => { s.actionLoading = false; s.actionError = a.payload; });

    // updateEpRecord
    builder
      .addCase(updateEpRecord.pending,   (s) => { s.actionLoading = true; s.actionError = null; })
      .addCase(updateEpRecord.fulfilled, (s, a) => {
        s.actionLoading = false;
        const idx = s.records.findIndex((r) => r.id === a.payload.id);
        if (idx !== -1) s.records[idx] = a.payload;
      })
      .addCase(updateEpRecord.rejected,  (s, a) => { s.actionLoading = false; s.actionError = a.payload; });

    // deleteEpRecord
    builder
      .addCase(deleteEpRecord.pending,   (s) => { s.actionLoading = true; s.actionError = null; })
      .addCase(deleteEpRecord.fulfilled, (s, a) => {
        s.actionLoading = false;
        s.records = s.records.filter((r) => r.id !== a.payload);
        if (s.recordsMeta) s.recordsMeta.total = Math.max(0, s.recordsMeta.total - 1);
      })
      .addCase(deleteEpRecord.rejected,  (s, a) => { s.actionLoading = false; s.actionError = a.payload; });

    // reassignEpAuditors
    builder
      .addCase(reassignEpAuditors.pending,   (s) => { s.actionLoading = true; s.actionError = null; })
      .addCase(reassignEpAuditors.fulfilled, (s, a) => {
        s.actionLoading = false;
        const idx = s.records.findIndex((r) => r.id === a.payload.id);
        if (idx !== -1) s.records[idx] = a.payload;
      })
      .addCase(reassignEpAuditors.rejected,  (s, a) => { s.actionLoading = false; s.actionError = a.payload; });

    // performEpRecord
    builder
      .addCase(performEpRecord.pending,   (s) => { s.actionLoading = true; s.actionError = null; })
      .addCase(performEpRecord.fulfilled, (s) => { s.actionLoading = false; })
      .addCase(performEpRecord.rejected,  (s, a) => { s.actionLoading = false; s.actionError = a.payload; });

    // fetchEpIssues
    builder.addCase(fetchEpIssues.fulfilled, (s, a) => {
      s.issuesByPerformed[a.payload.performedId] = a.payload.data;
    });

    // issue mutations
    [updateEpCorrectiveAction, updateEpPriorityDueDate, assignEpContractor, executeEpIssue].forEach((thunk) => {
      builder
        .addCase(thunk.pending,   (s) => { s.actionLoading = true; s.actionError = null; })
        .addCase(thunk.fulfilled, (s) => { s.actionLoading = false; })
        .addCase(thunk.rejected,  (s, a) => { s.actionLoading = false; s.actionError = a.payload; });
    });
  },
});

export const {
  setEpPage,
  setEpAuditNumber,
  setEpAreaAudited,
  setEpDateFilter,
  setEpStatusFilter,
  setEpObjectiveFilter,
  setEpScopeFilter,
  clearEpFilters,
  clearEpRecordsError,
  clearEpActionError,
} = epSlice.actions;

// ── Selectors ────────────────────────────────────────────────────────────────
export const selectEpCatalog            = (s) => s.ep.catalog;
export const selectEpCatalogLoading     = (s) => s.ep.catalogLoading;
export const selectEpRecords            = (s) => s.ep.records;
export const selectEpRecordsMeta        = (s) => s.ep.recordsMeta;
export const selectEpRecordsLoading     = (s) => s.ep.recordsLoading;
export const selectEpRecordsError       = (s) => s.ep.recordsError;
export const selectEpActionLoading      = (s) => s.ep.actionLoading;
export const selectEpActionError        = (s) => s.ep.actionError;
export const selectEpFilters            = (s) => s.ep.filters;
export const selectEpIssuesByPerformed  = (s) => s.ep.issuesByPerformed;

export default epSlice.reducer;
