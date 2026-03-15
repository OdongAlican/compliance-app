import api from './index';

/**
 * Inspections service — covers all inspection types (canteen, fuel, vehicle, etc.)
 * Each inspection type uses the same CRUD pattern, differentiated by type slug.
 */

// ── Generic ─────────────────────────────────────────────────────────────────

/** GET /inspections/?type=canteen */
export const getInspections = (type, params = {}) =>
  api.get('/inspections/', { params: { type, ...params } });

/** GET /inspections/:id/ */
export const getInspection = (id) =>
  api.get(`/inspections/${id}/`);

/** POST /inspections/ */
export const createInspection = (payload) =>
  api.post('/inspections/', payload);

/** PATCH /inspections/:id/ */
export const updateInspection = (id, payload) =>
  api.patch(`/inspections/${id}/`, payload);

/** DELETE /inspections/:id/ */
export const deleteInspection = (id) =>
  api.delete(`/inspections/${id}/`);

/** PATCH /inspections/:id/status/ */
export const updateInspectionStatus = (id, status) =>
  api.patch(`/inspections/${id}/status/`, { status });

// ── Checklist templates ──────────────────────────────────────────────────────

/**
 * GET /inspections/:id/checklist_templates
 * Returns checklist template sections with nested checklist_item_templates
 * for the given inspection type. Used to render the perform checklist UI.
 */
export const getInspectionChecklistTemplates = (id) =>
  api.get(`/inspections/${id}/checklist_templates`);

// ── Checklist items ──────────────────────────────────────────────────────────

/** GET /inspections/:id/checklist/ */
export const getChecklist = (inspectionId) =>
  api.get(`/inspections/${inspectionId}/checklist/`);

/** PATCH /inspections/:id/checklist/ */
export const updateChecklist = (inspectionId, items) =>
  api.patch(`/inspections/${inspectionId}/checklist/`, { items });

// ── Issues ───────────────────────────────────────────────────────────────────

/** GET /inspections/:id/issues/ */
export const getIssues = (inspectionId) =>
  api.get(`/inspections/${inspectionId}/issues/`);

/** POST /inspections/:id/issues/ */
export const createIssue = (inspectionId, payload) =>
  api.post(`/inspections/${inspectionId}/issues/`, payload);

/** PATCH /inspections/:inspectionId/issues/:issueId/ */
export const updateIssue = (inspectionId, issueId, payload) =>
  api.patch(`/inspections/${inspectionId}/issues/${issueId}/`, payload);

/** DELETE /inspections/:inspectionId/issues/:issueId/ */
export const deleteIssue = (inspectionId, issueId) =>
  api.delete(`/inspections/${inspectionId}/issues/${issueId}/`);

// ── Report ───────────────────────────────────────────────────────────────────

/** GET /inspections/:id/report/ — returns a signed URL or blob */
export const downloadReport = (id) =>
  api.raw.get(`/inspections/${id}/report/`, { responseType: 'blob' });
