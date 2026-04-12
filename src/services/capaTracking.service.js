/**
 * capaTracking.service.js
 *
 * API service layer for CAPA Tracking.
 *
 * Routes:
 *   /health_and_safety_audits/:auditId/capa_trackings
 *   /health_and_safety_audits/:auditId/capa_trackings/:id/perform
 *   /health_and_safety_audits/:auditId/performed_capa_trackings/:performedId/issues
 *   /health_and_safety_audits/:auditId/performed_capa_trackings/:performedId/issues/:id/(action)
 */
import api from './index';

const HSA_BASE = '/health_and_safety_audits';

// ─────────────────────────────────────────────────────────────────────────────
// 1. CAPA TRACKING SETUP
// ─────────────────────────────────────────────────────────────────────────────
export const CapaTrackingSetupService = {
  /** GET /health_and_safety_audits/:auditId/capa_trackings */
  list: (auditId, params = {}) =>
    api.get(`${HSA_BASE}/${auditId}/capa_trackings`, { params }),

  /** GET .../capa_trackings/:id */
  get: (auditId, id) =>
    api.get(`${HSA_BASE}/${auditId}/capa_trackings/${id}`),

  /** POST .../capa_trackings */
  create: (auditId, data) =>
    api.post(`${HSA_BASE}/${auditId}/capa_trackings`, data),

  /** PATCH .../capa_trackings/:id */
  update: (auditId, id, data) =>
    api.patch(`${HSA_BASE}/${auditId}/capa_trackings/${id}`, data),

  /** DELETE .../capa_trackings/:id */
  remove: (auditId, id) =>
    api.delete(`${HSA_BASE}/${auditId}/capa_trackings/${id}`),

  /** PATCH .../capa_trackings/:id/reassign_auditors */
  reassignAuditors: (auditId, id, auditorIds) =>
    api.patch(
      `${HSA_BASE}/${auditId}/capa_trackings/${id}/reassign_auditors`,
      { auditor_ids: auditorIds }
    ),
};

// ─────────────────────────────────────────────────────────────────────────────
// 2. PERFORM CAPA TRACKING
// ─────────────────────────────────────────────────────────────────────────────
export const CapaTrackingPerformService = {
  perform: (auditId, capaId, payload) => {
    const {
      audit_date,
      audit_note,
      auditor_id,
      performedChecklist = [],
      issues = [],
    } = payload;

    const hasFiles = issues.some((iss) => iss.file instanceof File);

    if (!hasFiles) {
      return api.post(
        `${HSA_BASE}/${auditId}/capa_trackings/${capaId}/perform`,
        { audit_date, audit_note, auditor_id, performedChecklist, issues }
      );
    }

    const form = new FormData();
    if (audit_date)  form.append('audit_date', audit_date);
    if (audit_note)  form.append('audit_note', audit_note);
    if (auditor_id)  form.append('auditor_id', String(auditor_id));

    performedChecklist.forEach((item, i) => {
      form.append(`performedChecklist[${i}][label]`,   item.label);
      form.append(`performedChecklist[${i}][status]`,  item.status);
      if (item.comment)          form.append(`performedChecklist[${i}][comment]`,  item.comment);
      if (item.position != null) form.append(`performedChecklist[${i}][position]`, String(item.position));
    });

    issues.forEach((iss, i) => {
      if (iss.name)           form.append(`issues[${i}][name]`,           iss.name);
      if (iss.priority_level) form.append(`issues[${i}][priority_level]`, iss.priority_level);
      if (iss.due_date)       form.append(`issues[${i}][due_date]`,       iss.due_date);
      if (iss.contractor_id)  form.append(`issues[${i}][contractor_id]`,  String(iss.contractor_id));
      if (iss.file instanceof File) form.append(`issues[${i}][documents]`, iss.file);
    });

    return api.post(
      `${HSA_BASE}/${auditId}/capa_trackings/${capaId}/perform`,
      form
    );
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// 3. PERFORMED CAPA TRACKING ISSUES
// ─────────────────────────────────────────────────────────────────────────────
export const CapaTrackingIssueService = {
  list: (auditId, performedId, params = {}) =>
    api.get(
      `${HSA_BASE}/${auditId}/performed_capa_trackings/${performedId}/issues`,
      { params }
    ),

  updateCorrectiveAction: (auditId, performedId, issueId, correctiveAction) =>
    api.patch(
      `${HSA_BASE}/${auditId}/performed_capa_trackings/${performedId}/issues/${issueId}/update_corrective_action`,
      { corrective_action: correctiveAction }
    ),

  updatePriorityDueDate: (auditId, performedId, issueId, { priority_level, due_date }) =>
    api.patch(
      `${HSA_BASE}/${auditId}/performed_capa_trackings/${performedId}/issues/${issueId}/update_priority_due_date`,
      { priority_level, due_date }
    ),

  assignContractor: (auditId, performedId, issueId, contractorId) =>
    api.patch(
      `${HSA_BASE}/${auditId}/performed_capa_trackings/${performedId}/issues/${issueId}/assign_contractor`,
      { contractor_id: contractorId }
    ),

  execute: (auditId, performedId, issueId, { completion_date, completion_notes, file }) => {
    if (file instanceof File) {
      const form = new FormData();
      if (completion_date)  form.append('completion_date',  completion_date);
      if (completion_notes) form.append('completion_notes', completion_notes);
      form.append('documents', file);
      return api.patch(
        `${HSA_BASE}/${auditId}/performed_capa_trackings/${performedId}/issues/${issueId}/execute`,
        form
      );
    }
    return api.patch(
      `${HSA_BASE}/${auditId}/performed_capa_trackings/${performedId}/issues/${issueId}/execute`,
      { completion_date, completion_notes }
    );
  },
};
