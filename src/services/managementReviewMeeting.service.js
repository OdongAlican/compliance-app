/**
 * managementReviewMeeting.service.js
 *
 * API service layer for Management Review Meeting.
 *
 * Routes:
 *   /health_and_safety_audits/:auditId/management_review_meetings
 *   /health_and_safety_audits/:auditId/management_review_meetings/:id/perform
 *   /health_and_safety_audits/:auditId/performed_management_review_meetings/:performedId/issues
 *   /health_and_safety_audits/:auditId/performed_management_review_meetings/:performedId/issues/:id/(action)
 */
import api from './index';

const HSA_BASE = '/health_and_safety_audits';

// ─────────────────────────────────────────────────────────────────────────────
// 1. MANAGEMENT REVIEW MEETING SETUP
// ─────────────────────────────────────────────────────────────────────────────
export const MrmSetupService = {
  /** GET /health_and_safety_audits/:auditId/management_review_meetings */
  list: (auditId, params = {}) =>
    api.get(`${HSA_BASE}/${auditId}/management_review_meetings`, { params }),

  /** GET .../management_review_meetings/:id */
  get: (auditId, id) =>
    api.get(`${HSA_BASE}/${auditId}/management_review_meetings/${id}`),

  /** POST .../management_review_meetings */
  create: (auditId, data) =>
    api.post(`${HSA_BASE}/${auditId}/management_review_meetings`, data),

  /** PATCH .../management_review_meetings/:id */
  update: (auditId, id, data) =>
    api.patch(`${HSA_BASE}/${auditId}/management_review_meetings/${id}`, data),

  /** DELETE .../management_review_meetings/:id */
  remove: (auditId, id) =>
    api.delete(`${HSA_BASE}/${auditId}/management_review_meetings/${id}`),

  /** PATCH .../management_review_meetings/:id/reassign_auditors */
  reassignAuditors: (auditId, id, auditorIds) =>
    api.patch(
      `${HSA_BASE}/${auditId}/management_review_meetings/${id}/reassign_auditors`,
      { auditor_ids: auditorIds }
    ),
};

// ─────────────────────────────────────────────────────────────────────────────
// 2. PERFORM MANAGEMENT REVIEW MEETING
// ─────────────────────────────────────────────────────────────────────────────
export const MrmPerformService = {
  perform: (auditId, mrmId, payload) => {
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
        `${HSA_BASE}/${auditId}/management_review_meetings/${mrmId}/perform`,
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
      `${HSA_BASE}/${auditId}/management_review_meetings/${mrmId}/perform`,
      form
    );
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// 3. PERFORMED MANAGEMENT REVIEW MEETING ISSUES
// ─────────────────────────────────────────────────────────────────────────────
export const MrmIssueService = {
  list: (auditId, performedId, params = {}) =>
    api.get(
      `${HSA_BASE}/${auditId}/performed_management_review_meetings/${performedId}/issues`,
      { params }
    ),

  updateCorrectiveAction: (auditId, performedId, issueId, correctiveAction) =>
    api.patch(
      `${HSA_BASE}/${auditId}/performed_management_review_meetings/${performedId}/issues/${issueId}/update_corrective_action`,
      { corrective_action: correctiveAction }
    ),

  updatePriorityDueDate: (auditId, performedId, issueId, { priority_level, due_date }) =>
    api.patch(
      `${HSA_BASE}/${auditId}/performed_management_review_meetings/${performedId}/issues/${issueId}/update_priority_due_date`,
      { priority_level, due_date }
    ),

  assignContractor: (auditId, performedId, issueId, contractorId) =>
    api.patch(
      `${HSA_BASE}/${auditId}/performed_management_review_meetings/${performedId}/issues/${issueId}/assign_contractor`,
      { contractor_id: contractorId }
    ),

  execute: (auditId, performedId, issueId, { completion_date, completion_notes, file }) => {
    if (file instanceof File) {
      const form = new FormData();
      if (completion_date)  form.append('completion_date',  completion_date);
      if (completion_notes) form.append('completion_notes', completion_notes);
      form.append('documents', file);
      return api.patch(
        `${HSA_BASE}/${auditId}/performed_management_review_meetings/${performedId}/issues/${issueId}/execute`,
        form
      );
    }
    return api.patch(
      `${HSA_BASE}/${auditId}/performed_management_review_meetings/${performedId}/issues/${issueId}/execute`,
      { completion_date, completion_notes }
    );
  },
};
