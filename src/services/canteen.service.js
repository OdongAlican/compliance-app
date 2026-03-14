/**
 * canteen.service.js
 * Full API service layer for the Canteen Inspection module.
 *
 * Covers:
 *  - Canteen Inspection Setup  (/canteen_inspections)
 *  - Performed Canteen Inspections (/perform_canteen_inspections)
 *  - Performed Checklists + Items
 *  - Issues (full lifecycle)
 *  - Issue Attachments + Repair Attachments
 */
import api from './index';

const BASE      = '/canteen_inspections';
const PERFORM   = '/perform_canteen_inspections';

// ─────────────────────────────────────────────────────────────────────────────
// 1. CANTEEN INSPECTION SETUP
// ─────────────────────────────────────────────────────────────────────────────
export const CanteenSetupService = {
  /**
   * GET /canteen_inspections
   * Supports: page, per_page, filter[name|location|date_from|date_to|safety_officer_id|supervisor_id|inspection_id]
   */
  list: (params = {}) => api.get(BASE, { params }),

  /** GET /canteen_inspections/:id */
  get: (id) => api.get(`${BASE}/${id}`),

  /**
   * POST /canteen_inspections
   * Body: { canteen_inspection: { name, location, date, time, note, safety_officer_id, supervisor_id, inspection_id } }
   */
  create: (data) => api.post(BASE, { canteen_inspection: data }),

  /**
   * PUT /canteen_inspections/:id
   */
  update: (id, data) => api.put(`${BASE}/${id}`, { canteen_inspection: data }),

  /** DELETE /canteen_inspections/:id */
  remove: (id) => api.delete(`${BASE}/${id}`),

  /** POST /canteen_inspections/:id/reassign_supervisor  { supervisor_id } */
  reassignSupervisor: (id, supervisorId) =>
    api.post(`${BASE}/${id}/reassign_supervisor`, { supervisor_id: supervisorId }),

  /** POST /canteen_inspections/:id/reassign_safety_officer  { safety_officer_id } */
  reassignSafetyOfficer: (id, safetyOfficerId) =>
    api.post(`${BASE}/${id}/reassign_safety_officer`, { safety_officer_id: safetyOfficerId }),
};

// ─────────────────────────────────────────────────────────────────────────────
// 2. PERFORMED CANTEEN INSPECTIONS
// ─────────────────────────────────────────────────────────────────────────────
export const CanteenPerformService = {
  /**
   * GET /canteen_inspections/:setupId/performs
   * Supports: filter[date_from|date_to], include=checklists|issues|all, page, per_page
   */
  list: (setupId, params = {}) =>
    api.get(`${BASE}/${setupId}/performs`, { params }),

  /**
   * POST /canteen_inspections/:setupId/performs
   * Supports combined payload: perform + checklist_template + inspectionIssues.
   * Automatically uses multipart/form-data when any issue carries a File attachment,
   * otherwise sends a plain JSON body.
   *
   * @param {number} setupId
   * @param {{ perform: object, checklist_template?: array, inspectionIssues?: array }} payload
   */
  create: (setupId, { perform = {}, checklist_template = [], inspectionIssues = [] } = {}) => {
    const hasFiles = inspectionIssues.some((i) => i.file instanceof File);

    if (!hasFiles) {
      const body = { perform };
      if (checklist_template.length) body.checklist_template = checklist_template;
      if (inspectionIssues.length) {
        body.inspectionIssues = inspectionIssues.map(({ file: _f, ...rest }) => rest);
      }
      return api.post(`${BASE}/${setupId}/performs`, body);
    }

    // Multipart — required when at least one issue has a file
    const form = new FormData();
    Object.entries(perform).forEach(([k, v]) => {
      if (v != null && v !== '') form.append(`perform[${k}]`, v);
    });
    checklist_template.forEach((tmpl, ti) => {
      form.append(`checklist_template[${ti}][id]`, tmpl.id);
      (tmpl.checklistItems || []).forEach((item, ii) => {
        form.append(`checklist_template[${ti}][checklistItems][${ii}][id]`, item.id);
        form.append(`checklist_template[${ti}][checklistItems][${ii}][value]`, item.value);
        if (item.comment) form.append(`checklist_template[${ti}][checklistItems][${ii}][comment]`, item.comment);
      });
    });
    inspectionIssues.forEach((issue, i) => {
      if (issue.title) form.append(`inspectionIssues[${i}][title]`, issue.title);
      if (issue.description) form.append(`inspectionIssues[${i}][description]`, issue.description);
      if (issue.correctiveAction) form.append(`inspectionIssues[${i}][correctiveAction]`, issue.correctiveAction);
      if (issue.file instanceof File) form.append(`inspectionIssues[${i}][file]`, issue.file);
    });
    return api.post(`${BASE}/${setupId}/performs`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  /** GET /perform_canteen_inspections/:id */
  get: (id, params = {}) => api.get(`${PERFORM}/${id}`, { params }),

  /** PUT /perform_canteen_inspections/:id */
  update: (id, data) => api.put(`${PERFORM}/${id}`, { perform: data }),

  /** DELETE /perform_canteen_inspections/:id */
  remove: (id) => api.delete(`${PERFORM}/${id}`),

  /**
   * POST /perform_canteen_inspections/:id/sign_off
   * Body: { sign_off: { note } }
   */
  signOff: (id, note = '') =>
    api.post(`${PERFORM}/${id}/sign_off`, { sign_off: { note } }),
};

// ─────────────────────────────────────────────────────────────────────────────
// 3. PERFORMED CHECKLISTS
// ─────────────────────────────────────────────────────────────────────────────
export const CanteenChecklistService = {
  /** GET /perform_canteen_inspections/:performId/checklists */
  list: (performId) => api.get(`${PERFORM}/${performId}/checklists`),

  /**
   * POST /perform_canteen_inspections/:performId/checklists
   * Body: { checklist_template_ids: [1,2,3] }
   */
  attach: (performId, templateIds) =>
    api.post(`${PERFORM}/${performId}/checklists`, { checklist_template_ids: templateIds }),

  /** DELETE /perform_canteen_inspections/:performId/checklists/:checklistId */
  remove: (performId, checklistId) =>
    api.delete(`${PERFORM}/${performId}/checklists/${checklistId}`),
};

// ─────────────────────────────────────────────────────────────────────────────
// 4. CHECKLIST ITEMS
// ─────────────────────────────────────────────────────────────────────────────
export const CanteenChecklistItemService = {
  /** GET /perform_canteen_inspections/:performId/checklists/:checklistId/items */
  list: (performId, checklistId) =>
    api.get(`${PERFORM}/${performId}/checklists/${checklistId}/items`),

  /**
   * POST /perform_canteen_inspections/:performId/checklists/:checklistId/items
   * Body: { items: [{ checklist_item_template_id, status, comment }] }
   * Upserts by (performed_checklist_id, checklist_item_template_id)
   */
  upsert: (performId, checklistId, items) =>
    api.post(`${PERFORM}/${performId}/checklists/${checklistId}/items`, { items }),
};

// ─────────────────────────────────────────────────────────────────────────────
// 5. INSPECTION ISSUES
// ─────────────────────────────────────────────────────────────────────────────
export const CanteenIssueService = {
  /**
   * GET /perform_canteen_inspections/:performId/issues
   * Supports: filter[title], page, per_page
   */
  list: (performId, params = {}) =>
    api.get(`${PERFORM}/${performId}/issues`, { params }),

  /**
   * POST /perform_canteen_inspections/:performId/issues
   * Supports multipart for attachments[] files
   */
  create: (performId, data, files = []) => {
    if (files.length === 0) {
      return api.post(`${PERFORM}/${performId}/issues`, { issue: data });
    }
    const form = new FormData();
    Object.entries(data).forEach(([k, v]) => { if (v != null) form.append(`issue[${k}]`, v); });
    files.forEach((f) => form.append('attachments[]', f));
    return api.post(`${PERFORM}/${performId}/issues`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  /** PUT /perform_canteen_inspections/:performId/issues/:issueId */
  update: (performId, issueId, data) =>
    api.put(`${PERFORM}/${performId}/issues/${issueId}`, { issue: data }),

  /** DELETE /perform_canteen_inspections/:performId/issues/:issueId */
  remove: (performId, issueId) =>
    api.delete(`${PERFORM}/${performId}/issues/${issueId}`),

  /** PATCH .../update_corrective_action */
  updateCorrectiveAction: (performId, issueId, corrective_action) =>
    api.patch(`${PERFORM}/${performId}/issues/${issueId}/update_corrective_action`, {
      issue: { corrective_action },
    }),

  /** PATCH .../update_priority_due_date */
  updatePriorityDueDate: (performId, issueId, data) =>
    api.patch(`${PERFORM}/${performId}/issues/${issueId}/update_priority_due_date`, {
      issue: data,
    }),

  /** POST .../repair_completion — supports multipart for repair attachments */
  repairCompletion: (performId, issueId, data, files = []) => {
    if (files.length === 0) {
      return api.post(`${PERFORM}/${performId}/issues/${issueId}/repair_completion`, {
        repair: data,
      });
    }
    const form = new FormData();
    Object.entries(data).forEach(([k, v]) => { if (v != null) form.append(`repair[${k}]`, v); });
    files.forEach((f) => form.append('attachments[]', f));
    return api.post(`${PERFORM}/${performId}/issues/${issueId}/repair_completion`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  /** PATCH .../assign_contractor */
  assignContractor: (performId, issueId, contractorId) =>
    api.patch(`${PERFORM}/${performId}/issues/${issueId}/assign_contractor`, {
      issue: { contractor_id: contractorId },
    }),

  /** PATCH .../set_repair_status */
  setRepairStatus: (performId, issueId, repair_status, reject_reason = '') =>
    api.patch(`${PERFORM}/${performId}/issues/${issueId}/set_repair_status`, {
      issue: { repair_status, ...(repair_status === 'rejected' ? { reject_reason } : {}) },
    }),
};

// ─────────────────────────────────────────────────────────────────────────────
// 6. ISSUE ATTACHMENTS
// ─────────────────────────────────────────────────────────────────────────────
export const CanteenAttachmentService = {
  list: (performId, issueId) =>
    api.get(`${PERFORM}/${performId}/issues/${issueId}/attachments`),

  upload: (performId, issueId, file) => {
    const form = new FormData();
    form.append('file', file);
    return api.post(`${PERFORM}/${performId}/issues/${issueId}/attachments`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  remove: (performId, issueId, attachmentId) =>
    api.delete(`${PERFORM}/${performId}/issues/${issueId}/attachments/${attachmentId}`),
};

// ─────────────────────────────────────────────────────────────────────────────
// 7. ISSUE REPAIR ATTACHMENTS
// ─────────────────────────────────────────────────────────────────────────────
export const CanteenRepairAttachmentService = {
  list: (performId, issueId) =>
    api.get(`${PERFORM}/${performId}/issues/${issueId}/repair_attachments`),

  upload: (performId, issueId, file) => {
    const form = new FormData();
    form.append('file', file);
    return api.post(`${PERFORM}/${performId}/issues/${issueId}/repair_attachments`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  remove: (performId, issueId, attachmentId) =>
    api.delete(`${PERFORM}/${performId}/issues/${issueId}/repair_attachments/${attachmentId}`),
};
