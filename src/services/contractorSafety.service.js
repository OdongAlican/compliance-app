/**
 * contractorSafety.service.js
 *
 * API service layer for Contractor Safety.
 *
 * Routes:
 *   /health_and_safety_audits/:auditId/contractor_safeties
 *   /health_and_safety_audits/:auditId/contractor_safeties/:id/perform
 *   /health_and_safety_audits/:auditId/performed_contractor_safeties/:performedId/issues
 *   /health_and_safety_audits/:auditId/performed_contractor_safeties/:performedId/issues/:id/(action)
 */
import api from './index';

const HSA_BASE = '/health_and_safety_audits';

// ─────────────────────────────────────────────────────────────────────────────
// 1. CONTRACTOR SAFETY SETUP
// ─────────────────────────────────────────────────────────────────────────────
export const ContractorSafetySetupService = {
  /** GET /health_and_safety_audits/:auditId/contractor_safeties */
  list: (auditId, params = {}) =>
    api.get(`${HSA_BASE}/${auditId}/contractor_safeties`, { params }),

  /** GET .../contractor_safeties/:id */
  get: (auditId, id) =>
    api.get(`${HSA_BASE}/${auditId}/contractor_safeties/${id}`),

  /**
   * POST .../contractor_safeties
   * Payload: { audit_number, area_audited, date, status, objective_of_audit, scope_of_audit, auditor_ids }
   */
  create: (auditId, data) =>
    api.post(`${HSA_BASE}/${auditId}/contractor_safeties`, data),

  /** PATCH .../contractor_safeties/:id */
  update: (auditId, id, data) =>
    api.patch(`${HSA_BASE}/${auditId}/contractor_safeties/${id}`, data),

  /** DELETE .../contractor_safeties/:id */
  remove: (auditId, id) =>
    api.delete(`${HSA_BASE}/${auditId}/contractor_safeties/${id}`),

  /**
   * PATCH .../contractor_safeties/:id/reassign_auditors
   * Payload: { auditor_ids: [...] }
   */
  reassignAuditors: (auditId, id, auditorIds) =>
    api.patch(
      `${HSA_BASE}/${auditId}/contractor_safeties/${id}/reassign_auditors`,
      { auditor_ids: auditorIds }
    ),
};

// ─────────────────────────────────────────────────────────────────────────────
// 2. PERFORM CONTRACTOR SAFETY
// ─────────────────────────────────────────────────────────────────────────────
export const ContractorSafetyPerformService = {
  /**
   * POST /health_and_safety_audits/:auditId/contractor_safeties/:id/perform
   *
   * Payload (dynamic — no template item ids):
   *   { audit_date, audit_note, auditor_id, performedChecklist, issues }
   *
   * performedChecklist items: { label, status, comment, position }
   * Allowed status values: compliant | partial | non_compliant
   * issues: [{ name, priority_level, due_date, file }]
   */
  perform: (auditId, csId, payload) => {
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
        `${HSA_BASE}/${auditId}/contractor_safeties/${csId}/perform`,
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
      `${HSA_BASE}/${auditId}/contractor_safeties/${csId}/perform`,
      form
    );
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// 3. PERFORMED CONTRACTOR SAFETY ISSUES
// ─────────────────────────────────────────────────────────────────────────────
export const ContractorSafetyIssueService = {
  /**
   * GET /health_and_safety_audits/:auditId/performed_contractor_safeties/:performedId/issues
   */
  list: (auditId, performedId, params = {}) =>
    api.get(
      `${HSA_BASE}/${auditId}/performed_contractor_safeties/${performedId}/issues`,
      { params }
    ),

  /** PATCH .../issues/:id/update_corrective_action */
  updateCorrectiveAction: (auditId, performedId, issueId, correctiveAction) =>
    api.patch(
      `${HSA_BASE}/${auditId}/performed_contractor_safeties/${performedId}/issues/${issueId}/update_corrective_action`,
      { corrective_action: correctiveAction }
    ),

  /** PATCH .../issues/:id/update_priority_due_date */
  updatePriorityDueDate: (auditId, performedId, issueId, { priority_level, due_date }) =>
    api.patch(
      `${HSA_BASE}/${auditId}/performed_contractor_safeties/${performedId}/issues/${issueId}/update_priority_due_date`,
      { priority_level, due_date }
    ),

  /** PATCH .../issues/:id/assign_contractor */
  assignContractor: (auditId, performedId, issueId, contractorId) =>
    api.patch(
      `${HSA_BASE}/${auditId}/performed_contractor_safeties/${performedId}/issues/${issueId}/assign_contractor`,
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
        `${HSA_BASE}/${auditId}/performed_contractor_safeties/${performedId}/issues/${issueId}/execute`,
        form
      );
    }
    return api.patch(
      `${HSA_BASE}/${auditId}/performed_contractor_safeties/${performedId}/issues/${issueId}/execute`,
      { completion_date, completion_notes }
    );
  },
};
