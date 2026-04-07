/**
 * hsaChecklistSlice.js
 *
 * Redux Toolkit slice for the Health & Safety Audit — Checklist module.
 *
 * State shape:
 *  parentAudit       : the seeded Checklist parent record (id = 1)
 *  templates         : checklist templates with nested items
 *  templatesLoading  : templates fetch in flight
 *  checklists        : paginated checklist setup records
 *  checklistsMeta    : pagination meta
 *  checklistsLoading : list fetch in flight
 *  checklistsError   : list fetch error
 *  actionLoading     : create / update / delete / reassign / perform in flight
 *  actionError       : action error message
 *  filters           : current filter values (drives list refetch)
 */
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import {
  HsaParentService,
  HsaTemplateService,
  HsaChecklistSetupService,
  HsaPerformService,
  HsaIssueService,
} from '../../services/healthAndSafetyAudit.service';

// ── Async thunks ──────────────────────────────────────────────────────────────

/** Fetch the seeded parent audit record (id = 1 for Checklist) */
export const fetchHsaParentAudit = createAsyncThunk(
  'hsaChecklist/fetchParentAudit',
  async (id, { rejectWithValue }) => {
    try {
      const res = await HsaParentService.get(id);
      return res.data ?? res;
    } catch (err) {
      return rejectWithValue(
        err?.response?.data?.error || 'Failed to load audit record.'
      );
    }
  }
);

/** Fetch all parent HSA audit records (catalog) */
export const fetchHsaCatalog = createAsyncThunk(
  'hsaChecklist/fetchCatalog',
  async (params = {}, { rejectWithValue }) => {
    try {
      const res = await HsaParentService.list(params);
      return Array.isArray(res) ? res : (res.data ?? []);
    } catch (err) {
      return rejectWithValue(
        err?.response?.data?.error || 'Failed to load HSA catalog.'
      );
    }
  }
);

/** Fetch checklist templates (with nested items) for a given audit id */
export const fetchHsaTemplates = createAsyncThunk(
  'hsaChecklist/fetchTemplates',
  async (auditId, { rejectWithValue }) => {
    try {
      const res = await HsaTemplateService.list(auditId);
      return Array.isArray(res) ? res : (res.data ?? []);
    } catch (err) {
      return rejectWithValue(
        err?.response?.data?.error || 'Failed to load checklist templates.'
      );
    }
  }
);

/** Create a new template */
export const createHsaTemplate = createAsyncThunk(
  'hsaChecklist/createTemplate',
  async ({ auditId, data }, { rejectWithValue }) => {
    try {
      const res = await HsaTemplateService.create(auditId, data);
      return res.data ?? res;
    } catch (err) {
      return rejectWithValue(
        err?.response?.data?.errors?.join(', ') ||
        err?.response?.data?.error ||
        'Failed to create template.'
      );
    }
  }
);

/** Update a template */
export const updateHsaTemplate = createAsyncThunk(
  'hsaChecklist/updateTemplate',
  async ({ auditId, id, data }, { rejectWithValue }) => {
    try {
      const res = await HsaTemplateService.update(auditId, id, data);
      return res.data ?? res;
    } catch (err) {
      return rejectWithValue(
        err?.response?.data?.errors?.join(', ') ||
        err?.response?.data?.error ||
        'Failed to update template.'
      );
    }
  }
);

/** Delete a template */
export const deleteHsaTemplate = createAsyncThunk(
  'hsaChecklist/deleteTemplate',
  async ({ auditId, id }, { rejectWithValue }) => {
    try {
      await HsaTemplateService.remove(auditId, id);
      return id;
    } catch (err) {
      return rejectWithValue(
        err?.response?.data?.error || 'Failed to delete template.'
      );
    }
  }
);

/** Fetch paginated checklist setup records */
export const fetchHsaChecklists = createAsyncThunk(
  'hsaChecklist/fetchChecklists',
  async (auditId, { getState, rejectWithValue }) => {
    try {
      const { filters } = getState().hsaChecklist;
      const query = {
        page:     filters.page,
        per_page: filters.per_page,
        ...(filters.auditor_number ? { 'filter[auditor_number]': filters.auditor_number } : {}),
        ...(filters.area_audited   ? { 'filter[area_audited]': filters.area_audited }     : {}),
        ...(filters.date           ? { 'filter[date]': filters.date }                     : {}),
        ...(filters.status         ? { 'filter[status]': filters.status }                 : {}),
      };
      const res = await HsaChecklistSetupService.list(auditId, query);
      return { data: res.data ?? [], meta: res.meta ?? null };
    } catch (err) {
      return rejectWithValue(
        err?.response?.data?.error || 'Failed to load checklists.'
      );
    }
  }
);

/** Create a new checklist setup record */
export const createHsaChecklist = createAsyncThunk(
  'hsaChecklist/createChecklist',
  async ({ auditId, data }, { rejectWithValue }) => {
    try {
      const res = await HsaChecklistSetupService.create(auditId, data);
      return res.data ?? res;
    } catch (err) {
      return rejectWithValue(
        err?.response?.data?.errors?.join(', ') ||
        err?.response?.data?.error ||
        'Failed to create checklist.'
      );
    }
  }
);

/** Update a checklist setup record */
export const updateHsaChecklist = createAsyncThunk(
  'hsaChecklist/updateChecklist',
  async ({ auditId, id, data }, { rejectWithValue }) => {
    try {
      const res = await HsaChecklistSetupService.update(auditId, id, data);
      return res.data ?? res;
    } catch (err) {
      return rejectWithValue(
        err?.response?.data?.errors?.join(', ') ||
        err?.response?.data?.error ||
        'Failed to update checklist.'
      );
    }
  }
);

/** Delete a checklist setup record */
export const deleteHsaChecklist = createAsyncThunk(
  'hsaChecklist/deleteChecklist',
  async ({ auditId, id }, { rejectWithValue }) => {
    try {
      await HsaChecklistSetupService.remove(auditId, id);
      return id;
    } catch (err) {
      return rejectWithValue(
        err?.response?.data?.error || 'Failed to delete checklist.'
      );
    }
  }
);

/** Reassign auditors for a checklist setup */
export const reassignHsaAuditors = createAsyncThunk(
  'hsaChecklist/reassignAuditors',
  async ({ auditId, id, auditorIds }, { rejectWithValue }) => {
    try {
      const res = await HsaChecklistSetupService.reassignAuditors(auditId, id, auditorIds);
      return res.data ?? res;
    } catch (err) {
      return rejectWithValue(
        err?.response?.data?.errors?.join(', ') ||
        err?.response?.data?.error ||
        'Failed to reassign auditors.'
      );
    }
  }
);

/** Perform a checklist (submit audit results + issues) */
export const performHsaChecklist = createAsyncThunk(
  'hsaChecklist/perform',
  async ({ auditId, checklistId, payload }, { rejectWithValue }) => {
    try {
      const res = await HsaPerformService.perform(auditId, checklistId, payload);
      return res.data ?? res;
    } catch (err) {
      return rejectWithValue(
        err?.response?.data?.errors?.join(', ') ||
        err?.response?.data?.error ||
        'Failed to perform checklist.'
      );
    }
  }
);

/** Fetch issues for a performed checklist */
export const fetchHsaIssues = createAsyncThunk(
  'hsaChecklist/fetchIssues',
  async ({ auditId, performedId, params = {} }, { rejectWithValue }) => {
    try {
      const res = await HsaIssueService.list(auditId, performedId, params);
      return { performedId, data: Array.isArray(res) ? res : (res.data ?? []) };
    } catch (err) {
      return rejectWithValue(
        err?.response?.data?.error || 'Failed to load issues.'
      );
    }
  }
);

/** Update corrective action on an issue */
export const updateHsaCorrectiveAction = createAsyncThunk(
  'hsaChecklist/updateCorrectiveAction',
  async ({ auditId, performedId, issueId, correctiveAction }, { rejectWithValue }) => {
    try {
      const res = await HsaIssueService.updateCorrectiveAction(
        auditId, performedId, issueId, correctiveAction
      );
      return res.data ?? res;
    } catch (err) {
      return rejectWithValue(
        err?.response?.data?.errors?.join(', ') ||
        err?.response?.data?.error ||
        'Failed to update corrective action.'
      );
    }
  }
);

/** Update priority and due date on an issue */
export const updateHsaPriorityDueDate = createAsyncThunk(
  'hsaChecklist/updatePriorityDueDate',
  async ({ auditId, performedId, issueId, priority_level, due_date }, { rejectWithValue }) => {
    try {
      const res = await HsaIssueService.updatePriorityDueDate(
        auditId, performedId, issueId, { priority_level, due_date }
      );
      return res.data ?? res;
    } catch (err) {
      return rejectWithValue(
        err?.response?.data?.errors?.join(', ') ||
        err?.response?.data?.error ||
        'Failed to update priority / due date.'
      );
    }
  }
);

/** Assign contractor to an issue */
export const assignHsaContractor = createAsyncThunk(
  'hsaChecklist/assignContractor',
  async ({ auditId, performedId, issueId, contractorId }, { rejectWithValue }) => {
    try {
      const res = await HsaIssueService.assignContractor(
        auditId, performedId, issueId, contractorId
      );
      return res.data ?? res;
    } catch (err) {
      return rejectWithValue(
        err?.response?.data?.errors?.join(', ') ||
        err?.response?.data?.error ||
        'Failed to assign contractor.'
      );
    }
  }
);

/** Execute (close out) an issue */
export const executeHsaIssue = createAsyncThunk(
  'hsaChecklist/executeIssue',
  async ({ auditId, performedId, issueId, data }, { rejectWithValue }) => {
    try {
      const res = await HsaIssueService.execute(auditId, performedId, issueId, data);
      return res.data ?? res;
    } catch (err) {
      return rejectWithValue(
        err?.response?.data?.errors?.join(', ') ||
        err?.response?.data?.error ||
        'Failed to execute issue.'
      );
    }
  }
);

// ── Initial filter state ───────────────────────────────────────────────────

const INITIAL_FILTERS = {
  page:           1,
  per_page:       10,
  auditor_number: '',
  area_audited:   '',
  date:           '',
  status:         '',
};

// ── Slice ──────────────────────────────────────────────────────────────────

const hsaChecklistSlice = createSlice({
  name: 'hsaChecklist',
  initialState: {
    // Parent audit catalog
    catalog:         [],
    catalogLoading:  false,
    catalogError:    null,
    parentAudit:     null,        // the Checklist parent record
    parentLoading:   false,

    // Templates
    templates:        [],
    templatesLoading: false,
    templatesError:   null,

    // Checklist setups
    checklists:        [],
    checklistsMeta:    null,
    checklistsLoading: false,
    checklistsError:   null,

    // Issues (keyed by performedId)
    issuesByPerformed: {},

    // Generic action state
    actionLoading: false,
    actionError:   null,

    filters: INITIAL_FILTERS,
  },

  reducers: {
    setHsaPage:           (s, a) => { s.filters.page = a.payload; },
    setHsaAuditorNumber:  (s, a) => { s.filters.auditor_number = a.payload; s.filters.page = 1; },
    setHsaAreaAudited:    (s, a) => { s.filters.area_audited = a.payload;   s.filters.page = 1; },
    setHsaDateFilter:     (s, a) => { s.filters.date = a.payload;           s.filters.page = 1; },
    setHsaStatusFilter:   (s, a) => { s.filters.status = a.payload;         s.filters.page = 1; },
    clearHsaFilters:      (s)    => { s.filters = INITIAL_FILTERS; },
    clearHsaChecklistError:(s)   => { s.checklistsError = null; },
    clearHsaActionError:  (s)    => { s.actionError = null; },
  },

  extraReducers: (builder) => {

    // ── fetchHsaCatalog ──────────────────────────────────────────────────
    builder
      .addCase(fetchHsaCatalog.pending,    (s) => { s.catalogLoading = true; s.catalogError = null; })
      .addCase(fetchHsaCatalog.fulfilled,  (s, a) => { s.catalogLoading = false; s.catalog = a.payload; })
      .addCase(fetchHsaCatalog.rejected,   (s, a) => { s.catalogLoading = false; s.catalogError = a.payload; });

    // ── fetchHsaParentAudit ──────────────────────────────────────────────
    builder
      .addCase(fetchHsaParentAudit.pending,   (s) => { s.parentLoading = true; })
      .addCase(fetchHsaParentAudit.fulfilled, (s, a) => { s.parentLoading = false; s.parentAudit = a.payload; })
      .addCase(fetchHsaParentAudit.rejected,  (s) => { s.parentLoading = false; });

    // ── fetchHsaTemplates ────────────────────────────────────────────────
    builder
      .addCase(fetchHsaTemplates.pending,   (s) => { s.templatesLoading = true; s.templatesError = null; })
      .addCase(fetchHsaTemplates.fulfilled, (s, a) => { s.templatesLoading = false; s.templates = a.payload; })
      .addCase(fetchHsaTemplates.rejected,  (s, a) => { s.templatesLoading = false; s.templatesError = a.payload; });

    // ── createHsaTemplate ───────────────────────────────────────────────
    builder
      .addCase(createHsaTemplate.pending,   (s) => { s.actionLoading = true; s.actionError = null; })
      .addCase(createHsaTemplate.fulfilled, (s, a) => { s.actionLoading = false; s.templates.push(a.payload); })
      .addCase(createHsaTemplate.rejected,  (s, a) => { s.actionLoading = false; s.actionError = a.payload; });

    // ── updateHsaTemplate ───────────────────────────────────────────────
    builder
      .addCase(updateHsaTemplate.pending,   (s) => { s.actionLoading = true; s.actionError = null; })
      .addCase(updateHsaTemplate.fulfilled, (s, a) => {
        s.actionLoading = false;
        const idx = s.templates.findIndex((t) => t.id === a.payload.id);
        if (idx !== -1) s.templates[idx] = a.payload;
      })
      .addCase(updateHsaTemplate.rejected,  (s, a) => { s.actionLoading = false; s.actionError = a.payload; });

    // ── deleteHsaTemplate ───────────────────────────────────────────────
    builder
      .addCase(deleteHsaTemplate.pending,   (s) => { s.actionLoading = true; s.actionError = null; })
      .addCase(deleteHsaTemplate.fulfilled, (s, a) => {
        s.actionLoading = false;
        s.templates = s.templates.filter((t) => t.id !== a.payload);
      })
      .addCase(deleteHsaTemplate.rejected,  (s, a) => { s.actionLoading = false; s.actionError = a.payload; });

    // ── fetchHsaChecklists ───────────────────────────────────────────────
    builder
      .addCase(fetchHsaChecklists.pending,   (s) => { s.checklistsLoading = true; s.checklistsError = null; })
      .addCase(fetchHsaChecklists.fulfilled, (s, a) => {
        s.checklistsLoading = false;
        s.checklists     = a.payload.data;
        s.checklistsMeta = a.payload.meta;
      })
      .addCase(fetchHsaChecklists.rejected,  (s, a) => { s.checklistsLoading = false; s.checklistsError = a.payload; });

    // ── createHsaChecklist ───────────────────────────────────────────────
    builder
      .addCase(createHsaChecklist.pending,   (s) => { s.actionLoading = true; s.actionError = null; })
      .addCase(createHsaChecklist.fulfilled, (s, a) => {
        s.actionLoading = false;
        s.checklists.unshift(a.payload);
        if (s.checklistsMeta) s.checklistsMeta.total += 1;
      })
      .addCase(createHsaChecklist.rejected,  (s, a) => { s.actionLoading = false; s.actionError = a.payload; });

    // ── updateHsaChecklist ───────────────────────────────────────────────
    builder
      .addCase(updateHsaChecklist.pending,   (s) => { s.actionLoading = true; s.actionError = null; })
      .addCase(updateHsaChecklist.fulfilled, (s, a) => {
        s.actionLoading = false;
        const idx = s.checklists.findIndex((c) => c.id === a.payload.id);
        if (idx !== -1) s.checklists[idx] = a.payload;
      })
      .addCase(updateHsaChecklist.rejected,  (s, a) => { s.actionLoading = false; s.actionError = a.payload; });

    // ── deleteHsaChecklist ───────────────────────────────────────────────
    builder
      .addCase(deleteHsaChecklist.pending,   (s) => { s.actionLoading = true; s.actionError = null; })
      .addCase(deleteHsaChecklist.fulfilled, (s, a) => {
        s.actionLoading = false;
        s.checklists = s.checklists.filter((c) => c.id !== a.payload);
        if (s.checklistsMeta) s.checklistsMeta.total = Math.max(0, s.checklistsMeta.total - 1);
      })
      .addCase(deleteHsaChecklist.rejected,  (s, a) => { s.actionLoading = false; s.actionError = a.payload; });

    // ── reassignHsaAuditors ─────────────────────────────────────────────
    builder
      .addCase(reassignHsaAuditors.pending,   (s) => { s.actionLoading = true; s.actionError = null; })
      .addCase(reassignHsaAuditors.fulfilled, (s, a) => {
        s.actionLoading = false;
        const idx = s.checklists.findIndex((c) => c.id === a.payload.id);
        if (idx !== -1) s.checklists[idx] = a.payload;
      })
      .addCase(reassignHsaAuditors.rejected,  (s, a) => { s.actionLoading = false; s.actionError = a.payload; });

    // ── performHsaChecklist ──────────────────────────────────────────────
    builder
      .addCase(performHsaChecklist.pending,   (s) => { s.actionLoading = true; s.actionError = null; })
      .addCase(performHsaChecklist.fulfilled, (s) => { s.actionLoading = false; })
      .addCase(performHsaChecklist.rejected,  (s, a) => { s.actionLoading = false; s.actionError = a.payload; });

    // ── fetchHsaIssues ───────────────────────────────────────────────────
    builder
      .addCase(fetchHsaIssues.fulfilled, (s, a) => {
        s.issuesByPerformed[a.payload.performedId] = a.payload.data;
      });

    // ── issue mutation thunks (all share actionLoading) ─────────────────
    const issueMutations = [
      updateHsaCorrectiveAction,
      updateHsaPriorityDueDate,
      assignHsaContractor,
      executeHsaIssue,
    ];
    issueMutations.forEach((thunk) => {
      builder
        .addCase(thunk.pending,   (s) => { s.actionLoading = true; s.actionError = null; })
        .addCase(thunk.fulfilled, (s) => { s.actionLoading = false; })
        .addCase(thunk.rejected,  (s, a) => { s.actionLoading = false; s.actionError = a.payload; });
    });
  },
});

export const {
  setHsaPage,
  setHsaAuditorNumber,
  setHsaAreaAudited,
  setHsaDateFilter,
  setHsaStatusFilter,
  clearHsaFilters,
  clearHsaChecklistError,
  clearHsaActionError,
} = hsaChecklistSlice.actions;

// ── Selectors ──────────────────────────────────────────────────────────────
export const selectHsaCatalog          = (s) => s.hsaChecklist.catalog;
export const selectHsaCatalogLoading   = (s) => s.hsaChecklist.catalogLoading;
export const selectHsaParentAudit      = (s) => s.hsaChecklist.parentAudit;
export const selectHsaTemplates        = (s) => s.hsaChecklist.templates;
export const selectHsaTemplatesLoading = (s) => s.hsaChecklist.templatesLoading;
export const selectHsaChecklists       = (s) => s.hsaChecklist.checklists;
export const selectHsaChecklistsMeta   = (s) => s.hsaChecklist.checklistsMeta;
export const selectHsaChecklistsLoading= (s) => s.hsaChecklist.checklistsLoading;
export const selectHsaChecklistsError  = (s) => s.hsaChecklist.checklistsError;
export const selectHsaActionLoading    = (s) => s.hsaChecklist.actionLoading;
export const selectHsaActionError      = (s) => s.hsaChecklist.actionError;
export const selectHsaFilters          = (s) => s.hsaChecklist.filters;
export const selectHsaIssuesByPerformed= (s) => s.hsaChecklist.issuesByPerformed;

export default hsaChecklistSlice.reducer;
