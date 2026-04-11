/**
 * emergencyPreparedness.service.js
 *
 * API service layer for Emergency Preparedness.
 *
 * Routes:
 *   /health_and_safety_audits/:auditId/emergency_preparednesses
 *   /health_and_safety_audits/:auditId/emergency_preparednesses/:id/perform
 *   /health_and_safety_audits/:auditId/performed_emergency_preparednesses/:performedId/issues
 *   /performed_emergency_preparedness_issues/:id/(corrective_action|priority_and_due_date|assign_contractor|execute)
 */
import api from './index';

const HSA_BASE = '/health_and_safety_audits';

// ─────────────────────────────────────────────────────────────────────────────
// 1. EP SETUP
// ─────────────────────────────────────────────────────────────────────────────
export const EpSetupService = {
  /** GET /health_and_safety_audits/:auditId/emergency_preparednesses */
  list: (auditId, params = {}) =>
    api.get(`${HSA_BASE}/${auditId}/emergency_preparednesses`, { params }),

  /** GET .../emergency_preparednesses/:id */
  get: (auditId, id) =>
    api.get(`${HSA_BASE}/${auditId}/emergency_preparednesses/${id}`),

  /**
   * POST .../emergency_preparednesses
   * Payload: { audit_number, area_audited, date, status, objective_of_audit, scope_of_audit, auditor_ids }
   */
  create: (auditId, data) =>
    api.post(`${HSA_BASE}/${auditId}/emergency_preparednesses`, data),

  /** PATCH .../emergency_preparednesses/:id */
  update: (auditId, id, data) =>
    api.patch(`${HSA_BASE}/${auditId}/emergency_preparednesses/${id}`, data),

  /** DELETE .../emergency_preparednesses/:id */
  remove: (auditId, id) =>
    api.delete(`${HSA_BASE}/${auditId}/emergency_preparednesses/${id}`),

  /**
   * PATCH .../emergency_preparednesses/:id/reassign_auditors
   * Payload: { auditor_ids: [...] }
   */
  reassignAuditors: (auditId, id, auditorIds) =>
    api.patch(
      `${HSA_BASE}/${auditId}/emergency_preparednesses/${id}/reassign_auditors`,
      { auditor_ids: auditorIds }
    ),
};

// ─────────────────────────────────────────────────────────────────────────────
// 2. PERFORM EP
// ─────────────────────────────────────────────────────────────────────────────
export const EpPerformService = {
  /**
   * POST /health_and_safety_audits/:auditId/emergency_preparednesses/:id/perform
   *
   * Payload (dynamic — no template item ids):
   *   { audit_date, audit_note, auditor_id, performedChecklist, issues }
   *
   * performedChecklist items: { label, status, comment, position }
   * Allowed status values: compliant | partial | non_compliant
   * issues: [{ name, priority_level, due_date, file }]
   */
  perform: (auditId, epId, payload) => {
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
        `${HSA_BASE}/${auditId}/emergency_preparednesses/${epId}/perform`,
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
      if (item.comment)      form.append(`performedChecklist[${i}][comment]`,  item.comment);
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
      `${HSA_BASE}/${auditId}/emergency_preparednesses/${epId}/perform`,
      form
    );
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// 3. PERFORMED EP ISSUES
// ─────────────────────────────────────────────────────────────────────────────
export const EpIssueService = {
  /**
   * GET /health_and_safety_audits/:auditId/performed_emergency_preparednesses/:performedId/issues
   */
  list: (auditId, performedId, params = {}) =>
    api.get(
      `${HSA_BASE}/${auditId}/performed_emergency_preparednesses/${performedId}/issues`,
      { params }
    ),

  /** PATCH .../issues/:id/update_corrective_action */
  updateCorrectiveAction: (auditId, performedId, issueId, correctiveAction) =>
    api.patch(
      `${HSA_BASE}/${auditId}/performed_emergency_preparednesses/${performedId}/issues/${issueId}/update_corrective_action`,
      { corrective_action: correctiveAction }
    ),

  /** PATCH .../issues/:id/update_priority_due_date */
  updatePriorityDueDate: (auditId, performedId, issueId, { priority_level, due_date }) =>
    api.patch(
      `${HSA_BASE}/${auditId}/performed_emergency_preparednesses/${performedId}/issues/${issueId}/update_priority_due_date`,
      { priority_level, due_date }
    ),

  /** PATCH .../issues/:id/assign_contractor */
  assignContractor: (auditId, performedId, issueId, contractorId) =>
    api.patch(
      `${HSA_BASE}/${auditId}/performed_emergency_preparednesses/${performedId}/issues/${issueId}/assign_contractor`,
      { contractor_id: contractorId }
    ),

  /** PATCH .../issues/:id/execute — sends multipart when a file is present */
  execute: (auditId, performedId, issueId, { completion_date, completion_notes, file }) => {
    if (file instanceof File) {
      const form = new FormData();
      if (completion_date)  form.append('completion_date',  completion_date);
      if (completion_notes) form.append('completion_notes', completion_notes);
      form.append('documents', file);
      return api.patch(
        `${HSA_BASE}/${auditId}/performed_emergency_preparednesses/${performedId}/issues/${issueId}/execute`,
        form
      );
    }
    return api.patch(
      `${HSA_BASE}/${auditId}/performed_emergency_preparednesses/${performedId}/issues/${issueId}/execute`,
      { completion_date, completion_notes }
    );
  },
};
