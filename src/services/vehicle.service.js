/**
 * vehicle.service.js
 * Full API service layer for the Vehicle Inspection module.
 *
 * Covers:
 *  - Vehicle Inspection Setup  (/vehicle_inspections)
 *  - Performed Vehicle Inspections (/perform_vehicle_inspections)
 *  - Performed Checklists + Items
 *  - Issues (full lifecycle)
 */
import api from './index';

const BASE    = '/vehicle_inspections';
const PERFORM = '/perform_vehicle_inspections';

// ─────────────────────────────────────────────────────────────────────────────
// 1. VEHICLE INSPECTION SETUP
// ─────────────────────────────────────────────────────────────────────────────
export const VehicleSetupService = {
  /**
   * GET /vehicle_inspections
   * Supports: page, per_page,
   *   filter[vehicle_id|model|date_from|date_to|safety_officer_id|supervisor_id]
   */
  list: (params = {}) => api.get(BASE, { params }),

  /** GET /vehicle_inspections/:id */
  get: (id) => api.get(`${BASE}/${id}`),

  /**
   * POST /vehicle_inspections
   * Body: { vehicle_inspection: { name, vehicle_id, model, location, date, time, note,
   *                               safety_officer_id, supervisor_id, inspection_id } }
   */
  create: (data) => api.post(BASE, { vehicle_inspection: data }),

  /**
   * PUT /vehicle_inspections/:id
   * Body: { vehicle_inspection: { ...fields } }
   */
  update: (id, data) => api.put(`${BASE}/${id}`, { vehicle_inspection: data }),

  /** DELETE /vehicle_inspections/:id */
  remove: (id) => api.delete(`${BASE}/${id}`),

  /** POST /vehicle_inspections/:id/reassign_supervisor  { supervisor_id } */
  reassignSupervisor: (id, supervisorId) =>
    api.post(`${BASE}/${id}/reassign_supervisor`, { supervisor_id: supervisorId }),

  /** POST /vehicle_inspections/:id/reassign_safety_officer  { safety_officer_id } */
  reassignSafetyOfficer: (id, safetyOfficerId) =>
    api.post(`${BASE}/${id}/reassign_safety_officer`, { safety_officer_id: safetyOfficerId }),
};

// ─────────────────────────────────────────────────────────────────────────────
// 2. PERFORMED VEHICLE INSPECTIONS
// ─────────────────────────────────────────────────────────────────────────────
export const VehiclePerformService = {
  /**
   * GET /vehicle_inspections/:setupId/performs
   * Supports: filter[date_from|date_to], include=checklists|issues|all, page, per_page
   */
  list: (setupId, params = {}) =>
    api.get(`${BASE}/${setupId}/performs`, { params }),

  /**
   * POST /vehicle_inspections/:setupId/performs
   * Supports combined payload: perform + checklist_template + inspectionIssues.
   * Automatically uses multipart/form-data when any issue carries a File attachment,
   * otherwise sends a plain JSON body.
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

    // multipart path — at least one issue has a file
    const fd = new FormData();
    Object.entries(perform).forEach(([k, v]) => { if (v != null) fd.append(`perform[${k}]`, v); });
    checklist_template.forEach((tmpl, ti) => {
      fd.append(`checklist_template[${ti}][id]`, tmpl.id);
      (tmpl.checklistItems || []).forEach((item, ii) => {
        fd.append(`checklist_template[${ti}][checklistItems][${ii}][id]`, item.id);
        fd.append(`checklist_template[${ti}][checklistItems][${ii}][value]`, item.value ?? 'satisfactory');
        if (item.comment) fd.append(`checklist_template[${ti}][checklistItems][${ii}][comment]`, item.comment);
      });
    });
    inspectionIssues.forEach((iss, idx) => {
      if (iss.title) fd.append(`inspectionIssues[${idx}][title]`, iss.title);
      if (iss.description) fd.append(`inspectionIssues[${idx}][description]`, iss.description);
      if (iss.correctiveAction) fd.append(`inspectionIssues[${idx}][correctiveAction]`, iss.correctiveAction);
      if (iss.file instanceof File) fd.append(`inspectionIssues[${idx}][file]`, iss.file);
    });
    return api.post(`${BASE}/${setupId}/performs`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
  },

  /** GET /perform_vehicle_inspections/:id */
  get: (id, params = {}) => api.get(`${PERFORM}/${id}`, { params }),

  /** PUT /perform_vehicle_inspections/:id */
  update: (id, data) => api.put(`${PERFORM}/${id}`, { perform: data }),

  /** DELETE /perform_vehicle_inspections/:id */
  remove: (id) => api.delete(`${PERFORM}/${id}`),

  /**
   * POST /perform_vehicle_inspections/:id/sign_off
   * Body: { sign_off: { note } }
   */
  signOff: (id, note = '') =>
    api.post(`${PERFORM}/${id}/sign_off`, { sign_off: { note } }),
};

// ─────────────────────────────────────────────────────────────────────────────
// 3. PERFORMED CHECKLISTS
// ─────────────────────────────────────────────────────────────────────────────
export const VehicleChecklistService = {
  /** GET /perform_vehicle_inspections/:performId/checklists */
  list: (performId) => api.get(`${PERFORM}/${performId}/checklists`),

  /**
   * POST /perform_vehicle_inspections/:performId/checklists
   * Body: { checklist_template_ids: [1,2,3] }
   */
  attach: (performId, templateIds) =>
    api.post(`${PERFORM}/${performId}/checklists`, { checklist_template_ids: templateIds }),

  /** DELETE /perform_vehicle_inspections/:performId/checklists/:checklistId */
  remove: (performId, checklistId) =>
    api.delete(`${PERFORM}/${performId}/checklists/${checklistId}`),
};

// ─────────────────────────────────────────────────────────────────────────────
// 4. CHECKLIST ITEMS
// ─────────────────────────────────────────────────────────────────────────────
export const VehicleChecklistItemService = {
  /** GET /perform_vehicle_inspections/:performId/checklists/:checklistId/items */
  list: (performId, checklistId) =>
    api.get(`${PERFORM}/${performId}/checklists/${checklistId}/items`),

  /**
   * POST /perform_vehicle_inspections/:performId/checklists/:checklistId/items
   * Body: { items: [{ checklist_item_template_id, status, comment }] }
   * Upserts by (performed_checklist_id, checklist_item_template_id)
   */
  upsert: (performId, checklistId, items) =>
    api.post(`${PERFORM}/${performId}/checklists/${checklistId}/items`, { items }),
};

// ─────────────────────────────────────────────────────────────────────────────
// 5. INSPECTION ISSUES
// ─────────────────────────────────────────────────────────────────────────────
export const VehicleIssueService = {
  /**
   * GET /perform_vehicle_inspections/:performId/issues
   * Supports: filter[title], page, per_page
   */
  list: (performId, params = {}) =>
    api.get(`${PERFORM}/${performId}/issues`, { params }),

  /**
   * POST /perform_vehicle_inspections/:performId/issues
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

  /** PUT /perform_vehicle_inspections/:performId/issues/:issueId */
  update: (performId, issueId, data) =>
    api.put(`${PERFORM}/${performId}/issues/${issueId}`, { issue: data }),

  /** DELETE /perform_vehicle_inspections/:performId/issues/:issueId */
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

export const VehicleAttachmentService = {
  list:   (performId, issueId)               => api.get(`${PERFORM}/${performId}/issues/${issueId}/attachments`),
  upload: (performId, issueId, file)         => { const f = new FormData(); f.append('file', file); return api.post(`${PERFORM}/${performId}/issues/${issueId}/attachments`, f, { headers: { 'Content-Type': 'multipart/form-data' } }); },
  remove: (performId, issueId, attachmentId) => api.delete(`${PERFORM}/${performId}/issues/${issueId}/attachments/${attachmentId}`),
};

export const VehicleRepairAttachmentService = {
  list:   (performId, issueId)               => api.get(`${PERFORM}/${performId}/issues/${issueId}/repair_attachments`),
  upload: (performId, issueId, file)         => { const f = new FormData(); f.append('file', file); return api.post(`${PERFORM}/${performId}/issues/${issueId}/repair_attachments`, f, { headers: { 'Content-Type': 'multipart/form-data' } }); },
  remove: (performId, issueId, attachmentId) => api.delete(`${PERFORM}/${performId}/issues/${issueId}/repair_attachments/${attachmentId}`),
};
