/**
 * wirSlice.js
 *
 * Redux Toolkit slice for the Health & Safety Audit — Workplace Inspection Report module.
 *
 * State shape:
 *  parentAudit     : the seeded WIR parent record
 *  templates       : checklist templates with nested items (shared with Checklist)
 *  reports         : paginated WIR setup records
 *  reportsMeta     : pagination meta
 *  reportsLoading  : list fetch in flight
 *  reportsError    : list fetch error
 *  actionLoading   : create / update / delete / reassign / perform in flight
 *  actionError     : action error message
 *  issuesByPerformed : issues keyed by performed report id
 *  filters         : current filter values
 */
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import {
  WirSetupService,
  WirPerformService,
  WirIssueService,
} from '../../services/workplaceInspectionReport.service';
import {
  HsaParentService,
  HsaTemplateService,
} from '../../services/healthAndSafetyAudit.service';

// ── Async thunks ──────────────────────────────────────────────────────────────

/** Fetch all parent HSA audit records (catalog) */
export const fetchWirCatalog = createAsyncThunk(
  'wir/fetchCatalog',
  async (params = {}, { rejectWithValue }) => {
    try {
      const res = await HsaParentService.list(params);
      return Array.isArray(res) ? res : (res.data ?? []);
    } catch (err) {
      return rejectWithValue(err?.response?.data?.error || 'Failed to load HSA catalog.');
    }
  }
);

/** Fetch the WIR parent audit record by id */
export const fetchWirParentAudit = createAsyncThunk(
  'wir/fetchParentAudit',
  async (id, { rejectWithValue }) => {
    try {
      const res = await HsaParentService.get(id);
      return res.data ?? res;
    } catch (err) {
      return rejectWithValue(err?.response?.data?.error || 'Failed to load audit record.');
    }
  }
);

/** Fetch checklist templates for a given audit id */
export const fetchWirTemplates = createAsyncThunk(
  'wir/fetchTemplates',
  async (auditId, { rejectWithValue }) => {
    try {
      const res = await HsaTemplateService.list(auditId);
      return Array.isArray(res) ? res : (res.data ?? []);
    } catch (err) {
      return rejectWithValue(err?.response?.data?.error || 'Failed to load templates.');
    }
  }
);

/** Create a new template */
export const createWirTemplate = createAsyncThunk(
  'wir/createTemplate',
  async ({ auditId, data }, { rejectWithValue }) => {
    try {
      const res = await HsaTemplateService.create(auditId, data);
      return res.data ?? res;
    } catch (err) {
      return rejectWithValue(
        err?.response?.data?.errors?.join(', ') || err?.response?.data?.error || 'Failed to create template.'
      );
    }
  }
);

/** Update a template */
export const updateWirTemplate = createAsyncThunk(
  'wir/updateTemplate',
  async ({ auditId, id, data }, { rejectWithValue }) => {
    try {
      const res = await HsaTemplateService.update(auditId, id, data);
      return res.data ?? res;
    } catch (err) {
      return rejectWithValue(
        err?.response?.data?.errors?.join(', ') || err?.response?.data?.error || 'Failed to update template.'
      );
    }
  }
);

/** Delete a template */
export const deleteWirTemplate = createAsyncThunk(
  'wir/deleteTemplate',
  async ({ auditId, id }, { rejectWithValue }) => {
    try {
      await HsaTemplateService.remove(auditId, id);
      return id;
    } catch (err) {
      return rejectWithValue(err?.response?.data?.error || 'Failed to delete template.');
    }
  }
);

/** Fetch paginated WIR setup records */
export const fetchWirReports = createAsyncThunk(
  'wir/fetchReports',
  async (auditId, { getState, rejectWithValue }) => {
    try {
      const { filters } = getState().wir;
      const query = {
        page:     filters.page,
        per_page: filters.per_page,
        ...(filters.audit_number ? { 'filter[audit_number]': filters.audit_number } : {}),
        ...(filters.area_audited ? { 'filter[area_audited]': filters.area_audited } : {}),
        ...(filters.date         ? { 'filter[date]': filters.date }                 : {}),
        ...(filters.status       ? { 'filter[status]': filters.status }             : {}),
      };
      const res = await WirSetupService.list(auditId, query);
      return { data: res.data ?? [], meta: res.meta ?? null };
    } catch (err) {
      return rejectWithValue(err?.response?.data?.error || 'Failed to load reports.');
    }
  }
);

/** Create a new WIR setup record */
export const createWirReport = createAsyncThunk(
  'wir/createReport',
  async ({ auditId, data }, { rejectWithValue }) => {
    try {
      const res = await WirSetupService.create(auditId, data);
      return res.data ?? res;
    } catch (err) {
      return rejectWithValue(
        err?.response?.data?.errors?.join(', ') || err?.response?.data?.error || 'Failed to create report.'
      );
    }
  }
);

/** Update a WIR setup record */
export const updateWirReport = createAsyncThunk(
  'wir/updateReport',
  async ({ auditId, id, data }, { rejectWithValue }) => {
    try {
      const res = await WirSetupService.update(auditId, id, data);
      return res.data ?? res;
    } catch (err) {
      return rejectWithValue(
        err?.response?.data?.errors?.join(', ') || err?.response?.data?.error || 'Failed to update report.'
      );
    }
  }
);

/** Delete a WIR setup record */
export const deleteWirReport = createAsyncThunk(
  'wir/deleteReport',
  async ({ auditId, id }, { rejectWithValue }) => {
    try {
      await WirSetupService.remove(auditId, id);
      return id;
    } catch (err) {
      return rejectWithValue(err?.response?.data?.error || 'Failed to delete report.');
    }
  }
);

/** Reassign auditors for a WIR setup */
export const reassignWirAuditors = createAsyncThunk(
  'wir/reassignAuditors',
  async ({ auditId, id, auditorIds }, { rejectWithValue }) => {
    try {
      const res = await WirSetupService.reassignAuditors(auditId, id, auditorIds);
      return res.data ?? res;
    } catch (err) {
      return rejectWithValue(
        err?.response?.data?.errors?.join(', ') || err?.response?.data?.error || 'Failed to reassign auditors.'
      );
    }
  }
);

/** Perform a WIR (submit audit results + issues) */
export const performWirReport = createAsyncThunk(
  'wir/perform',
  async ({ auditId, reportId, payload }, { rejectWithValue }) => {
    try {
      const res = await WirPerformService.perform(auditId, reportId, payload);
      return res.data ?? res;
    } catch (err) {
      return rejectWithValue(
        err?.response?.data?.errors?.join(', ') || err?.response?.data?.error || 'Failed to perform report.'
      );
    }
  }
);

/** Fetch issues for a performed WIR */
export const fetchWirIssues = createAsyncThunk(
  'wir/fetchIssues',
  async ({ auditId, performedId, params = {} }, { rejectWithValue }) => {
    try {
      const res = await WirIssueService.list(auditId, performedId, params);
      return { performedId, data: Array.isArray(res) ? res : (res.data ?? []) };
    } catch (err) {
      return rejectWithValue(err?.response?.data?.error || 'Failed to load issues.');
    }
  }
);

/** Update corrective action on an issue */
export const updateWirCorrectiveAction = createAsyncThunk(
  'wir/updateCorrectiveAction',
  async ({ auditId, performedId, issueId, correctiveAction }, { rejectWithValue }) => {
    try {
      const res = await WirIssueService.updateCorrectiveAction(auditId, performedId, issueId, correctiveAction);
      return res.data ?? res;
    } catch (err) {
      return rejectWithValue(
        err?.response?.data?.errors?.join(', ') || err?.response?.data?.error || 'Failed to update corrective action.'
      );
    }
  }
);

/** Update priority and due date on an issue */
export const updateWirPriorityDueDate = createAsyncThunk(
  'wir/updatePriorityDueDate',
  async ({ auditId, performedId, issueId, priority_level, due_date }, { rejectWithValue }) => {
    try {
      const res = await WirIssueService.updatePriorityDueDate(auditId, performedId, issueId, { priority_level, due_date });
      return res.data ?? res;
    } catch (err) {
      return rejectWithValue(
        err?.response?.data?.errors?.join(', ') || err?.response?.data?.error || 'Failed to update priority / due date.'
      );
    }
  }
);

/** Assign contractor to an issue */
export const assignWirContractor = createAsyncThunk(
  'wir/assignContractor',
  async ({ auditId, performedId, issueId, contractorId }, { rejectWithValue }) => {
    try {
      const res = await WirIssueService.assignContractor(auditId, performedId, issueId, contractorId);
      return res.data ?? res;
    } catch (err) {
      return rejectWithValue(
        err?.response?.data?.errors?.join(', ') || err?.response?.data?.error || 'Failed to assign contractor.'
      );
    }
  }
);

/** Execute (close out) an issue */
export const executeWirIssue = createAsyncThunk(
  'wir/executeIssue',
  async ({ auditId, performedId, issueId, data }, { rejectWithValue }) => {
    try {
      const res = await WirIssueService.execute(auditId, performedId, issueId, data);
      return res.data ?? res;
    } catch (err) {
      return rejectWithValue(
        err?.response?.data?.errors?.join(', ') || err?.response?.data?.error || 'Failed to execute issue.'
      );
    }
  }
);

// ── Initial filter state ────────────────────────────────────────────────────

const INITIAL_FILTERS = {
  page:         1,
  per_page:     10,
  audit_number: '',
  area_audited: '',
  date:         '',
  status:       '',
};

// ── Slice ───────────────────────────────────────────────────────────────────

const wirSlice = createSlice({
  name: 'wir',
  initialState: {
    catalog:        [],
    catalogLoading: false,
    catalogError:   null,
    parentAudit:    null,
    parentLoading:  false,

    templates:        [],
    templatesLoading: false,
    templatesError:   null,

    reports:        [],
    reportsMeta:    null,
    reportsLoading: false,
    reportsError:   null,

    issuesByPerformed: {},

    actionLoading: false,
    actionError:   null,

    filters: INITIAL_FILTERS,
  },

  reducers: {
    setWirPage:          (s, a) => { s.filters.page = a.payload; },
    setWirAuditNumber:   (s, a) => { s.filters.audit_number = a.payload; s.filters.page = 1; },
    setWirAreaAudited:   (s, a) => { s.filters.area_audited = a.payload; s.filters.page = 1; },
    setWirDateFilter:    (s, a) => { s.filters.date = a.payload;          s.filters.page = 1; },
    setWirStatusFilter:  (s, a) => { s.filters.status = a.payload;        s.filters.page = 1; },
    clearWirFilters:     (s)    => { s.filters = INITIAL_FILTERS; },
    clearWirReportsError:(s)    => { s.reportsError = null; },
    clearWirActionError: (s)    => { s.actionError = null; },
  },

  extraReducers: (builder) => {

    // fetchWirCatalog
    builder
      .addCase(fetchWirCatalog.pending,   (s) => { s.catalogLoading = true; s.catalogError = null; })
      .addCase(fetchWirCatalog.fulfilled, (s, a) => { s.catalogLoading = false; s.catalog = a.payload; })
      .addCase(fetchWirCatalog.rejected,  (s, a) => { s.catalogLoading = false; s.catalogError = a.payload; });

    // fetchWirParentAudit
    builder
      .addCase(fetchWirParentAudit.pending,   (s) => { s.parentLoading = true; })
      .addCase(fetchWirParentAudit.fulfilled, (s, a) => { s.parentLoading = false; s.parentAudit = a.payload; })
      .addCase(fetchWirParentAudit.rejected,  (s) => { s.parentLoading = false; });

    // fetchWirTemplates
    builder
      .addCase(fetchWirTemplates.pending,   (s) => { s.templatesLoading = true; s.templatesError = null; })
      .addCase(fetchWirTemplates.fulfilled, (s, a) => { s.templatesLoading = false; s.templates = a.payload; })
      .addCase(fetchWirTemplates.rejected,  (s, a) => { s.templatesLoading = false; s.templatesError = a.payload; });

    // createWirTemplate
    builder
      .addCase(createWirTemplate.pending,   (s) => { s.actionLoading = true; s.actionError = null; })
      .addCase(createWirTemplate.fulfilled, (s, a) => { s.actionLoading = false; s.templates.push(a.payload); })
      .addCase(createWirTemplate.rejected,  (s, a) => { s.actionLoading = false; s.actionError = a.payload; });

    // updateWirTemplate
    builder
      .addCase(updateWirTemplate.pending,   (s) => { s.actionLoading = true; s.actionError = null; })
      .addCase(updateWirTemplate.fulfilled, (s, a) => {
        s.actionLoading = false;
        const idx = s.templates.findIndex((t) => t.id === a.payload.id);
        if (idx !== -1) s.templates[idx] = a.payload;
      })
      .addCase(updateWirTemplate.rejected,  (s, a) => { s.actionLoading = false; s.actionError = a.payload; });

    // deleteWirTemplate
    builder
      .addCase(deleteWirTemplate.pending,   (s) => { s.actionLoading = true; s.actionError = null; })
      .addCase(deleteWirTemplate.fulfilled, (s, a) => {
        s.actionLoading = false;
        s.templates = s.templates.filter((t) => t.id !== a.payload);
      })
      .addCase(deleteWirTemplate.rejected,  (s, a) => { s.actionLoading = false; s.actionError = a.payload; });

    // fetchWirReports
    builder
      .addCase(fetchWirReports.pending,   (s) => { s.reportsLoading = true; s.reportsError = null; })
      .addCase(fetchWirReports.fulfilled, (s, a) => {
        s.reportsLoading = false;
        s.reports     = a.payload.data;
        s.reportsMeta = a.payload.meta;
      })
      .addCase(fetchWirReports.rejected,  (s, a) => { s.reportsLoading = false; s.reportsError = a.payload; });

    // createWirReport
    builder
      .addCase(createWirReport.pending,   (s) => { s.actionLoading = true; s.actionError = null; })
      .addCase(createWirReport.fulfilled, (s, a) => {
        s.actionLoading = false;
        s.reports.unshift(a.payload);
        if (s.reportsMeta) s.reportsMeta.total += 1;
      })
      .addCase(createWirReport.rejected,  (s, a) => { s.actionLoading = false; s.actionError = a.payload; });

    // updateWirReport
    builder
      .addCase(updateWirReport.pending,   (s) => { s.actionLoading = true; s.actionError = null; })
      .addCase(updateWirReport.fulfilled, (s, a) => {
        s.actionLoading = false;
        const idx = s.reports.findIndex((r) => r.id === a.payload.id);
        if (idx !== -1) s.reports[idx] = a.payload;
      })
      .addCase(updateWirReport.rejected,  (s, a) => { s.actionLoading = false; s.actionError = a.payload; });

    // deleteWirReport
    builder
      .addCase(deleteWirReport.pending,   (s) => { s.actionLoading = true; s.actionError = null; })
      .addCase(deleteWirReport.fulfilled, (s, a) => {
        s.actionLoading = false;
        s.reports = s.reports.filter((r) => r.id !== a.payload);
        if (s.reportsMeta) s.reportsMeta.total = Math.max(0, s.reportsMeta.total - 1);
      })
      .addCase(deleteWirReport.rejected,  (s, a) => { s.actionLoading = false; s.actionError = a.payload; });

    // reassignWirAuditors
    builder
      .addCase(reassignWirAuditors.pending,   (s) => { s.actionLoading = true; s.actionError = null; })
      .addCase(reassignWirAuditors.fulfilled, (s, a) => {
        s.actionLoading = false;
        const idx = s.reports.findIndex((r) => r.id === a.payload.id);
        if (idx !== -1) s.reports[idx] = a.payload;
      })
      .addCase(reassignWirAuditors.rejected,  (s, a) => { s.actionLoading = false; s.actionError = a.payload; });

    // performWirReport
    builder
      .addCase(performWirReport.pending,   (s) => { s.actionLoading = true; s.actionError = null; })
      .addCase(performWirReport.fulfilled, (s) => { s.actionLoading = false; })
      .addCase(performWirReport.rejected,  (s, a) => { s.actionLoading = false; s.actionError = a.payload; });

    // fetchWirIssues
    builder.addCase(fetchWirIssues.fulfilled, (s, a) => {
      s.issuesByPerformed[a.payload.performedId] = a.payload.data;
    });

    // issue mutations
    [updateWirCorrectiveAction, updateWirPriorityDueDate, assignWirContractor, executeWirIssue].forEach((thunk) => {
      builder
        .addCase(thunk.pending,   (s) => { s.actionLoading = true; s.actionError = null; })
        .addCase(thunk.fulfilled, (s) => { s.actionLoading = false; })
        .addCase(thunk.rejected,  (s, a) => { s.actionLoading = false; s.actionError = a.payload; });
    });
  },
});

export const {
  setWirPage,
  setWirAuditNumber,
  setWirAreaAudited,
  setWirDateFilter,
  setWirStatusFilter,
  clearWirFilters,
  clearWirReportsError,
  clearWirActionError,
} = wirSlice.actions;

// ── Selectors ───────────────────────────────────────────────────────────────
export const selectWirCatalog          = (s) => s.wir.catalog;
export const selectWirCatalogLoading   = (s) => s.wir.catalogLoading;
export const selectWirParentAudit      = (s) => s.wir.parentAudit;
export const selectWirTemplates        = (s) => s.wir.templates;
export const selectWirTemplatesLoading = (s) => s.wir.templatesLoading;
export const selectWirReports          = (s) => s.wir.reports;
export const selectWirReportsMeta      = (s) => s.wir.reportsMeta;
export const selectWirReportsLoading   = (s) => s.wir.reportsLoading;
export const selectWirReportsError     = (s) => s.wir.reportsError;
export const selectWirActionLoading    = (s) => s.wir.actionLoading;
export const selectWirActionError      = (s) => s.wir.actionError;
export const selectWirFilters          = (s) => s.wir.filters;
export const selectWirIssuesByPerformed= (s) => s.wir.issuesByPerformed;

export default wirSlice.reducer;
