/**
 * ppe.service.js
 * Full API service layer for the PPE Inspection module.
 *
 * Covers:
 *  1. PPE Inspection Setup      (/ppe_inspections)
 *  2. Performed PPE Inspections (/perform_ppe_inspections)
 *  3. Performed Checklists + Items
 *  4. Issues (full lifecycle)
 *  5. Issue Attachments + Repair Attachments
 */
import api from './index';

const BASE    = '/ppe_inspections';
const PERFORM = '/perform_ppe_inspections';

// ─────────────────────────────────────────────────────────────────────────────
// 1. PPE INSPECTION SETUP
// ─────────────────────────────────────────────────────────────────────────────
export const PpeSetupService = {
  /**
   * GET /ppe_inspections
   * Supports: page, per_page,
   *   filter[name|department|ppe_user_id|date_from|date_to|safety_officer_id|supervisor_id]
   */
  list: (params = {}) => api.get(BASE, { params }),

  /** GET /ppe_inspections/:id */
  get: (id) => api.get(`${BASE}/${id}`),

  /**
   * POST /ppe_inspections
   * Body: { ppe_inspection: { name, department, ppe_user_id, location, date, time,
   *                           note, safety_officer_id, supervisor_id, inspection_id } }
   */
  create: (data) => api.post(BASE, { ppe_inspection: data }),

  /** PUT /ppe_inspections/:id */
  update: (id, data) => api.put(`${BASE}/${id}`, { ppe_inspection: data }),

  /** DELETE /ppe_inspections/:id */
  remove: (id) => api.delete(`${BASE}/${id}`),

  /** POST /ppe_inspections/:id/reassign_supervisor  { supervisor_id } */
  reassignSupervisor: (id, supervisorId) =>
    api.post(`${BASE}/${id}/reassign_supervisor`, { supervisor_id: supervisorId }),

  /** POST /ppe_inspections/:id/reassign_safety_officer  { safety_officer_id } */
  reassignSafetyOfficer: (id, safetyOfficerId) =>
    api.post(`${BASE}/${id}/reassign_safety_officer`, { safety_officer_id: safetyOfficerId }),
};

// ─────────────────────────────────────────────────────────────────────────────
// 2. PERFORMED PPE INSPECTIONS
// ─────────────────────────────────────────────────────────────────────────────
export const PpePerformService = {
  /**
   * GET /ppe_inspections/:setupId/performs
   * Supports: filter[date_from|date_to], include=checklists|issues|all, page, per_page
   */
  list: (setupId, params = {}) =>
    api.get(`${BASE}/${setupId}/performs`, { params }),

  /**
   * POST /ppe_inspections/:setupId/performs
   * data is the complete combined payload:
   *   { perform: {...}, checklist_template: [...], inspectionIssues: [...] }
   */
  create: (setupId, data) =>
    api.post(`${BASE}/${setupId}/performs`, data),

  /** GET /perform_ppe_inspections/:id */
  get: (id, params = {}) => api.get(`${PERFORM}/${id}`, { params }),

  /** PUT /perform_ppe_inspections/:id */
  update: (id, data) => api.put(`${PERFORM}/${id}`, { perform: data }),

  /** DELETE /perform_ppe_inspections/:id */
  remove: (id) => api.delete(`${PERFORM}/${id}`),

  /**
   * POST /perform_ppe_inspections/:id/sign_off
   * Body: { sign_off: { note } }
   */
  signOff: (id, note = '') =>
    api.post(`${PERFORM}/${id}/sign_off`, { sign_off: { note } }),
};

// ─────────────────────────────────────────────────────────────────────────────
// 3. PERFORMED CHECKLISTS
// ─────────────────────────────────────────────────────────────────────────────
export const PpeChecklistService = {
  /** GET /perform_ppe_inspections/:performId/checklists */
  list: (performId) => api.get(`${PERFORM}/${performId}/checklists`),

  /**
   * POST /perform_ppe_inspections/:performId/checklists
   * Body: { checklist_template_ids: [1,2,3] }
   */
  attach: (performId, templateIds) =>
    api.post(`${PERFORM}/${performId}/checklists`, { checklist_template_ids: templateIds }),

  /** DELETE /perform_ppe_inspections/:performId/checklists/:checklistId */
  remove: (performId, checklistId) =>
    api.delete(`${PERFORM}/${performId}/checklists/${checklistId}`),
};

// ─────────────────────────────────────────────────────────────────────────────
// 4. CHECKLIST ITEMS
// ─────────────────────────────────────────────────────────────────────────────
export const PpeChecklistItemService = {
  /** GET /perform_ppe_inspections/:performId/checklists/:checklistId/items */
  list: (performId, checklistId) =>
    api.get(`${PERFORM}/${performId}/checklists/${checklistId}/items`),

  /**
   * POST /perform_ppe_inspections/:performId/checklists/:checklistId/items
   * Body: { items: [{ checklist_item_template_id, status, comment }] }
   * Upserts by (performed_checklist_id, checklist_item_template_id)
   */
  upsert: (performId, checklistId, items) =>
    api.post(`${PERFORM}/${performId}/checklists/${checklistId}/items`, { items }),
};

// ─────────────────────────────────────────────────────────────────────────────
// 5. INSPECTION ISSUES
// ─────────────────────────────────────────────────────────────────────────────
export const PpeIssueService = {
  /**
   * GET /perform_ppe_inspections/:performId/issues
   * Supports: filter[title], page, per_page
   */
  list: (performId, params = {}) =>
    api.get(`${PERFORM}/${performId}/issues`, { params }),

  /**
   * POST /perform_ppe_inspections/:performId/issues
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

  /** PUT /perform_ppe_inspections/:performId/issues/:issueId */
  update: (performId, issueId, data) =>
    api.put(`${PERFORM}/${performId}/issues/${issueId}`, { issue: data }),

  /** DELETE /perform_ppe_inspections/:performId/issues/:issueId */
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
export const PpeAttachmentService = {
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
export const PpeRepairAttachmentService = {
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
