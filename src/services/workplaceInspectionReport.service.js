/**
 * workplaceInspectionReport.service.js
 *
 * API service layer for Workplace Inspection Reports.
 *
 * Routes:
 *   /health_and_safety_audits/:auditId/workplace_inspection_reports
 *   /health_and_safety_audits/:auditId/workplace_inspection_reports/:id/perform
 *   /health_and_safety_audits/:auditId/performed_workplace_inspection_reports/:performedId/issues
 *   /performed_workplace_inspection_report_issues/:id/(corrective_action|priority_and_due_date|assign_contractor|execute)
 */
import api from './index';

const HSA_BASE = '/health_and_safety_audits';

// ─────────────────────────────────────────────────────────────────────────────
// 1. WIR SETUP
// ─────────────────────────────────────────────────────────────────────────────
export const WirSetupService = {
  /** GET /health_and_safety_audits/:auditId/workplace_inspection_reports */
  list: (auditId, params = {}) =>
    api.get(`${HSA_BASE}/${auditId}/workplace_inspection_reports`, { params }),

  /** GET .../workplace_inspection_reports/:id */
  get: (auditId, id) =>
    api.get(`${HSA_BASE}/${auditId}/workplace_inspection_reports/${id}`),

  /** POST .../workplace_inspection_reports */
  create: (auditId, data) =>
    api.post(`${HSA_BASE}/${auditId}/workplace_inspection_reports`, data),

  /** PATCH .../workplace_inspection_reports/:id */
  update: (auditId, id, data) =>
    api.patch(`${HSA_BASE}/${auditId}/workplace_inspection_reports/${id}`, data),

  /** DELETE .../workplace_inspection_reports/:id */
  remove: (auditId, id) =>
    api.delete(`${HSA_BASE}/${auditId}/workplace_inspection_reports/${id}`),

  /**
   * PATCH .../workplace_inspection_reports/:id/reassign_auditors
   * Payload: { auditor_ids: [...] }
   */
  reassignAuditors: (auditId, id, auditorIds) =>
    api.patch(
      `${HSA_BASE}/${auditId}/workplace_inspection_reports/${id}/reassign_auditors`,
      { auditor_ids: auditorIds }
    ),
};

// ─────────────────────────────────────────────────────────────────────────────
// 2. PERFORM WIR
// ─────────────────────────────────────────────────────────────────────────────
export const WirPerformService = {
  /**
   * POST /health_and_safety_audits/:auditId/workplace_inspection_reports/:reportId/perform
   *
   * Payload: { audit_date, audit_note, auditor_id, performedChecklist, issues }
   * performedChecklist items: { id: <template_item_id>, status, comment }
   * Allowed status values: Satisfactory | Unsatisfactory | Not Applicable
   */
  perform: (auditId, reportId, payload) => {
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
        `${HSA_BASE}/${auditId}/workplace_inspection_reports/${reportId}/perform`,
        { audit_date, audit_note, auditor_id, performedChecklist, issues }
      );
    }

    const form = new FormData();
    if (audit_date)  form.append('audit_date', audit_date);
    if (audit_note)  form.append('audit_note', audit_note);
    if (auditor_id)  form.append('auditor_id', String(auditor_id));

    performedChecklist.forEach((item, i) => {
      form.append(`performedChecklist[${i}][id]`, item.id);
      form.append(`performedChecklist[${i}][status]`, item.status);
      if (item.comment) form.append(`performedChecklist[${i}][comment]`, item.comment);
    });

    issues.forEach((iss, i) => {
      if (iss.name)           form.append(`issues[${i}][name]`, iss.name);
      if (iss.priority_level) form.append(`issues[${i}][priority_level]`, iss.priority_level);
      if (iss.due_date)       form.append(`issues[${i}][due_date]`, iss.due_date);
      if (iss.contractor_id)  form.append(`issues[${i}][contractor_id]`, String(iss.contractor_id));
      if (iss.file instanceof File) form.append(`issues[${i}][documents]`, iss.file);
    });

    return api.post(
      `${HSA_BASE}/${auditId}/workplace_inspection_reports/${reportId}/perform`,
      form
    );
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// 3. PERFORMED WIR ISSUES
// ─────────────────────────────────────────────────────────────────────────────
export const WirIssueService = {
  /**
   * GET /health_and_safety_audits/:auditId/performed_workplace_inspection_reports/:performedId/issues
   */
  list: (auditId, performedId, params = {}) =>
    api.get(
      `${HSA_BASE}/${auditId}/performed_workplace_inspection_reports/${performedId}/issues`,
      { params }
    ),

  /** PATCH .../issues/:id/update_corrective_action */
  updateCorrectiveAction: (auditId, performedId, issueId, correctiveAction) =>
    api.patch(
      `${HSA_BASE}/${auditId}/performed_workplace_inspection_reports/${performedId}/issues/${issueId}/update_corrective_action`,
      { corrective_action: correctiveAction }
    ),

  /** PATCH .../issues/:id/update_priority_due_date */
  updatePriorityDueDate: (auditId, performedId, issueId, { priority_level, due_date }) =>
    api.patch(
      `${HSA_BASE}/${auditId}/performed_workplace_inspection_reports/${performedId}/issues/${issueId}/update_priority_due_date`,
      { priority_level, due_date }
    ),

  /** PATCH .../issues/:id/assign_contractor */
  assignContractor: (auditId, performedId, issueId, contractorId) =>
    api.patch(
      `${HSA_BASE}/${auditId}/performed_workplace_inspection_reports/${performedId}/issues/${issueId}/assign_contractor`,
      { contractor_id: contractorId }
    ),

  /** PATCH .../issues/:id/execute — sends multipart when a file is present */
  execute: (auditId, performedId, issueId, { completion_date, completion_notes, file }) => {
    if (file instanceof File) {
      const form = new FormData();
      if (completion_date)  form.append('completion_date', completion_date);
      if (completion_notes) form.append('completion_notes', completion_notes);
      form.append('documents', file);
      return api.patch(
        `${HSA_BASE}/${auditId}/performed_workplace_inspection_reports/${performedId}/issues/${issueId}/execute`,
        form
      );
    }
    return api.patch(
      `${HSA_BASE}/${auditId}/performed_workplace_inspection_reports/${performedId}/issues/${issueId}/execute`,
      { completion_date, completion_notes }
    );
  },
};
