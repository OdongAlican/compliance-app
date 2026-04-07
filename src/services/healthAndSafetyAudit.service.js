/**
 * healthAndSafetyAudit.service.js
 *
 * Full API service layer for the Health & Safety Audit module.
 *
 * Covers:
 *  1. Parent HSA catalog   (/health_and_safety_audits)
 *  2. Checklist templates  (/health_and_safety_audits/:id/checklist_templates)
 *  3. Template items       (.../checklist_templates/:tid/items)
 *  4. Checklist setup      (/health_and_safety_audits/:id/checklists)
 *  5. Perform checklist    (.../checklists/:cid/perform)
 *  6. Issues lifecycle     (nested + flat alias routes)
 */
import api from './index';

// ─────────────────────────────────────────────────────────────────────────────
// 1. PARENT HEALTH & SAFETY AUDIT CATALOG
// ─────────────────────────────────────────────────────────────────────────────
const HSA_BASE = '/health_and_safety_audits';

export const HsaParentService = {
  /** GET /health_and_safety_audits — list all seeded audit types */
  list: (params = {}) => api.get(HSA_BASE, { params }),

  /** GET /health_and_safety_audits/:id */
  get: (id) => api.get(`${HSA_BASE}/${id}`),

  /** PATCH /health_and_safety_audits/:id — update title */
  update: (id, data) => api.patch(`${HSA_BASE}/${id}`, { health_and_safety_audit: data }),

  /**
   * POST /health_and_safety_audits/:id/upload_image
   * @param {number} id
   * @param {File} file
   */
  uploadImage: (id, file) => {
    const form = new FormData();
    form.append('file', file);
    return api.post(`${HSA_BASE}/${id}/upload_image`, form);
  },

  /** DELETE /health_and_safety_audits/:id/delete_image */
  deleteImage: (id) => api.delete(`${HSA_BASE}/${id}/delete_image`),

  /** DELETE /health_and_safety_audits/:id */
  remove: (id) => api.delete(`${HSA_BASE}/${id}`),
};

// ─────────────────────────────────────────────────────────────────────────────
// 2. CHECKLIST TEMPLATES
// ─────────────────────────────────────────────────────────────────────────────
export const HsaTemplateService = {
  /**
   * GET /health_and_safety_audits/:auditId/checklist_templates
   * Returns templates with nested item templates.
   */
  list: (auditId, params = {}) =>
    api.get(`${HSA_BASE}/${auditId}/checklist_templates`, { params }),

  /** GET .../checklist_templates/:id */
  get: (auditId, id) =>
    api.get(`${HSA_BASE}/${auditId}/checklist_templates/${id}`),

  /** POST /health_and_safety_audits/:auditId/checklist_templates */
  create: (auditId, data) =>
    api.post(`${HSA_BASE}/${auditId}/checklist_templates`, {
      health_and_safety_audit_checklist_template: data,
    }),

  /** PATCH .../checklist_templates/:id */
  update: (auditId, id, data) =>
    api.patch(`${HSA_BASE}/${auditId}/checklist_templates/${id}`, {
      health_and_safety_audit_checklist_template: data,
    }),

  /** DELETE .../checklist_templates/:id */
  remove: (auditId, id) =>
    api.delete(`${HSA_BASE}/${auditId}/checklist_templates/${id}`),
};

// ─────────────────────────────────────────────────────────────────────────────
// 3. TEMPLATE ITEMS
// ─────────────────────────────────────────────────────────────────────────────
export const HsaTemplateItemService = {
  /**
   * GET .../checklist_templates/:tid/items
   * Ordered by position ASC, then id ASC.
   */
  list: (auditId, templateId, params = {}) =>
    api.get(
      `${HSA_BASE}/${auditId}/checklist_templates/${templateId}/items`,
      { params }
    ),

  get: (auditId, templateId, itemId) =>
    api.get(
      `${HSA_BASE}/${auditId}/checklist_templates/${templateId}/items/${itemId}`
    ),

  /** POST .../items — label required */
  create: (auditId, templateId, data) =>
    api.post(
      `${HSA_BASE}/${auditId}/checklist_templates/${templateId}/items`,
      { health_and_safety_audit_checklist_item_template: data }
    ),

  update: (auditId, templateId, itemId, data) =>
    api.patch(
      `${HSA_BASE}/${auditId}/checklist_templates/${templateId}/items/${itemId}`,
      { health_and_safety_audit_checklist_item_template: data }
    ),

  remove: (auditId, templateId, itemId) =>
    api.delete(
      `${HSA_BASE}/${auditId}/checklist_templates/${templateId}/items/${itemId}`
    ),

  /**
   * GET /health_and_safety_audits/:auditId/checklist_items
   * Active items only, across all templates, ordered by template/position/id.
   */
  listActive: (auditId, params = {}) =>
    api.get(`${HSA_BASE}/${auditId}/checklist_items`, { params }),
};

// ─────────────────────────────────────────────────────────────────────────────
// 4. CHECKLIST SETUP
// ─────────────────────────────────────────────────────────────────────────────
export const HsaChecklistSetupService = {
  /**
   * GET /health_and_safety_audits/:auditId/checklists
   * Filters: auditor_number, area_audited, date, page, per_page
   */
  list: (auditId, params = {}) =>
    api.get(`${HSA_BASE}/${auditId}/checklists`, { params }),

  get: (auditId, id) =>
    api.get(`${HSA_BASE}/${auditId}/checklists/${id}`),

  /**
   * POST /health_and_safety_audits/:auditId/checklists
   * Payload: auditor_number, area_audited, date, status, auditor_ids[]
   */
  create: (auditId, data) =>
    api.post(`${HSA_BASE}/${auditId}/checklists`, data),

  /**
   * PATCH /health_and_safety_audits/:auditId/checklists/:id
   * Payload: auditor_number, area_audited, date, status
   */
  update: (auditId, id, data) =>
    api.patch(`${HSA_BASE}/${auditId}/checklists/${id}`, data),

  remove: (auditId, id) =>
    api.delete(`${HSA_BASE}/${auditId}/checklists/${id}`),

  /**
   * PATCH /health_and_safety_audits/:auditId/checklists/:id/reassign_auditors
   * Payload: { auditor_ids: [...] }
   */
  reassignAuditors: (auditId, id, auditorIds) =>
    api.patch(`${HSA_BASE}/${auditId}/checklists/${id}/reassign_auditors`, {
      auditor_ids: auditorIds,
    }),
};

// ─────────────────────────────────────────────────────────────────────────────
// 5. PERFORM CHECKLIST
// ─────────────────────────────────────────────────────────────────────────────
export const HsaPerformService = {
  /**
   * POST /health_and_safety_audits/:auditId/checklists/:checklistId/perform
   *
   * Payload shape:
   * {
   *   audit_date, audit_note, auditor_id,
   *   performedChecklist: [ { id: <item_template_id>, status, comment } ],
   *   issues: [ { name, priority_level?, due_date?, contractor_id? } ]
   * }
   *
   * When issues include File attachments: sends as multipart/form-data.
   */
  perform: (auditId, checklistId, payload) => {
    const { audit_date, audit_note, auditor_id, performedChecklist = [], issues = [] } = payload;
    const hasFiles = issues.some((iss) => iss.file instanceof File);

    if (!hasFiles) {
      return api.post(
        `${HSA_BASE}/${auditId}/checklists/${checklistId}/perform`,
        { audit_date, audit_note, auditor_id, performedChecklist, issues }
      );
    }

    // Multipart for file uploads
    const form = new FormData();
    if (audit_date)   form.append('audit_date', audit_date);
    if (audit_note)   form.append('audit_note', audit_note);
    if (auditor_id)   form.append('auditor_id', String(auditor_id));

    performedChecklist.forEach((item, i) => {
      form.append(`performedChecklist[${i}][id]`, item.id);
      form.append(`performedChecklist[${i}][status]`, item.status);
      if (item.comment) form.append(`performedChecklist[${i}][comment]`, item.comment);
    });

    issues.forEach((iss, i) => {
      if (iss.name)          form.append(`issues[${i}][name]`, iss.name);
      if (iss.priority_level) form.append(`issues[${i}][priority_level]`, iss.priority_level);
      if (iss.due_date)       form.append(`issues[${i}][due_date]`, iss.due_date);
      if (iss.contractor_id)  form.append(`issues[${i}][contractor_id]`, String(iss.contractor_id));
      if (iss.file instanceof File) form.append(`issues[${i}][documents]`, iss.file);
    });

    return api.post(
      `${HSA_BASE}/${auditId}/checklists/${checklistId}/perform`,
      form
    );
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// 6. PERFORMED CHECKLIST ISSUES
// ─────────────────────────────────────────────────────────────────────────────
export const HsaIssueService = {
  /**
   * GET /health_and_safety_audits/:auditId/performed_health_and_safety_audit_checklists/:performedId/issues
   */
  list: (auditId, performedId, params = {}) =>
    api.get(
      `${HSA_BASE}/${auditId}/performed_health_and_safety_audit_checklists/${performedId}/issues`,
      { params }
    ),

  /**
   * PATCH .../issues/:id/update_corrective_action
   * Payload: { corrective_action }
   */
  updateCorrectiveAction: (auditId, performedId, issueId, correctiveAction) =>
    api.patch(
      `${HSA_BASE}/${auditId}/performed_health_and_safety_audit_checklists/${performedId}/issues/${issueId}/update_corrective_action`,
      { corrective_action: correctiveAction }
    ),

  /**
   * PATCH .../issues/:id/update_priority_due_date
   * Payload: { priority_level, due_date }  — both required
   */
  updatePriorityDueDate: (auditId, performedId, issueId, { priority_level, due_date }) =>
    api.patch(
      `${HSA_BASE}/${auditId}/performed_health_and_safety_audit_checklists/${performedId}/issues/${issueId}/update_priority_due_date`,
      { priority_level, due_date }
    ),

  /**
   * PATCH .../issues/:id/assign_contractor
   * Payload: { contractor_id }
   */
  assignContractor: (auditId, performedId, issueId, contractorId) =>
    api.patch(
      `${HSA_BASE}/${auditId}/performed_health_and_safety_audit_checklists/${performedId}/issues/${issueId}/assign_contractor`,
      { contractor_id: contractorId }
    ),

  /**
   * PATCH .../issues/:id/execute
   * Payload: { completion_date, completion_notes, documents? }
   * Sends multipart when a file is attached.
   */
  execute: (auditId, performedId, issueId, { completion_date, completion_notes, file }) => {
    if (file instanceof File) {
      const form = new FormData();
      if (completion_date)  form.append('completion_date', completion_date);
      if (completion_notes) form.append('completion_notes', completion_notes);
      form.append('documents', file);
      return api.patch(
        `${HSA_BASE}/${auditId}/performed_health_and_safety_audit_checklists/${performedId}/issues/${issueId}/execute`,
        form
      );
    }
    return api.patch(
      `${HSA_BASE}/${auditId}/performed_health_and_safety_audit_checklists/${performedId}/issues/${issueId}/execute`,
      { completion_date, completion_notes }
    );
  },
};
