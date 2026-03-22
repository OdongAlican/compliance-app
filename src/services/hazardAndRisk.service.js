/**
 * hazardAndRisk.service.js
 * Complete API service layer for the Hazard Report and Risk Assessment modules.
 *
 * Endpoints:    (all require Bearer token)
 *  - /hazard_reports                              Hazard Reports
 *  - /hazard_reports/:id/injured_people           Injured People sub-resource
 *  - /risk_assessments                            Risk Assessment definitions
 *  - /perform_risk_assessments                    Performed Risk Assessments
 *  - /risk_assessment_entry_corrective_actions    Corrective Actions
 *  - /performed_risk_assessment_entry_priorities  Entry Priorities
 *  - /performed_risk_assessment_entries/:id/...   Entry execution
 */
import api from './index';

// ── Hazard Reports ─────────────────────────────────────────────────────────
export const HazardReportService = {
  /**
   * GET /hazard_reports
   * Pagination: page, per_page (max 100)
   * Filters: filter[location], filter[hazard_type], filter[report_date]
   */
  list: (params = {}) => api.get('/hazard_reports', { params }),

  /** GET /hazard_reports/:id */
  get: (id) => api.get(`/hazard_reports/${id}`),

  /**
   * POST /hazard_reports
   * Required: location, hazard_type
   * Optional: report_date, other, safety_officer_ids[], supervisor_ids[], injured_people[]
   */
  create: (data) => api.post('/hazard_reports', data),

  /**
   * PUT /hazard_reports/:id
   * Permitted: location, hazard_type, report_date, other, safety_officer_ids[], supervisor_ids[]
   */
  update: (id, data) => api.put(`/hazard_reports/${id}`, data),

  /** DELETE /hazard_reports/:id → 204 */
  remove: (id) => api.delete(`/hazard_reports/${id}`),
};

// ── Injured People sub-resource ────────────────────────────────────────────
export const InjuredPersonService = {
  /** GET /hazard_reports/:hazardReportId/injured_people */
  list: (hazardReportId) =>
    api.get(`/hazard_reports/${hazardReportId}/injured_people`),

  /**
   * POST /hazard_reports/:hazardReportId/injured_people
   * Required: name, injury_type
   * Optional: injury_description, action_taken
   */
  create: (hazardReportId, data) =>
    api.post(`/hazard_reports/${hazardReportId}/injured_people`, data),

  /** PUT /hazard_reports/:hazardReportId/injured_people/:id */
  update: (hazardReportId, id, data) =>
    api.put(`/hazard_reports/${hazardReportId}/injured_people/${id}`, data),

  /** DELETE /hazard_reports/:hazardReportId/injured_people/:id → 204 */
  remove: (hazardReportId, id) =>
    api.delete(`/hazard_reports/${hazardReportId}/injured_people/${id}`),
};

// ── Risk Assessment Definitions ────────────────────────────────────────────
export const RiskAssessmentService = {
  /**
   * GET /risk_assessments
   * Filters: filter[activity], filter[location], filter[date]
   */
  list: (params = {}) => api.get('/risk_assessments', { params }),

  /** GET /risk_assessments/:id */
  get: (id) => api.get(`/risk_assessments/${id}`),

  /**
   * POST /risk_assessments
   * Required: activity, location
   * Optional: date, note, safety_officer_ids[], supervisor_ids[]
   */
  create: (data) => api.post('/risk_assessments', data),

  /** PUT /risk_assessments/:id */
  update: (id, data) => api.put(`/risk_assessments/${id}`, data),

  /** DELETE /risk_assessments/:id → 204 */
  remove: (id) => api.delete(`/risk_assessments/${id}`),
};

// ── Performed Risk Assessments ─────────────────────────────────────────────
export const PerformedRiskAssessmentService = {
  /**
   * GET /perform_risk_assessments
   * Filters: filter[risk_assessment_id], filter[performed_date]
   * Includes deep eager loading of entries, hazard, people_at_risks,
   *   contractors, priority, corrective_actions and risk_assessment
   */
  list: (params = {}) => api.get('/perform_risk_assessments', { params }),

  /** GET /perform_risk_assessments/:id — full deep include */
  get: (id) => api.get(`/perform_risk_assessments/${id}`),

  /**
   * POST /perform_risk_assessments
   * Required: risk_assessment_id, performed_date
   * entries[] required: hazard_description, current_control_measures
   * Optional per entry: file (upload), contractor_ids[]
   */
  create: (data) => api.post('/perform_risk_assessments', data),

  /**
   * PUT /perform_risk_assessments/:id
   * If entries key present → deletes existing entries and recreates
   */
  update: (id, data) => api.put(`/perform_risk_assessments/${id}`, data),

  /** DELETE /perform_risk_assessments/:id → 204 */
  remove: (id) => api.delete(`/perform_risk_assessments/${id}`),
};

// ── Corrective Actions ─────────────────────────────────────────────────────
export const CorrectiveActionService = {
  /**
   * GET /risk_assessment_entry_corrective_actions
   * Filters: filter[performed_risk_assessment_entry_id], filter[description]
   * Includes: inherent_risk_score, residual_risk_score
   */
  list: (params = {}) =>
    api.get('/risk_assessment_entry_corrective_actions', { params }),

  /** GET /risk_assessment_entry_corrective_actions/:id */
  get: (id) =>
    api.get(`/risk_assessment_entry_corrective_actions/${id}`),

  /**
   * POST /risk_assessment_entry_corrective_actions
   * Required: performed_risk_assessment_entry_id, description
   * Required objects: inherent_risk_score { probability, consequence, result }
   *                   residual_risk_score  { probability, consequence, result }
   */
  create: (data) =>
    api.post('/risk_assessment_entry_corrective_actions', data),

  /** PATCH /risk_assessment_entry_corrective_actions/:id */
  update: (id, data) =>
    api.patch(`/risk_assessment_entry_corrective_actions/${id}`, data),

  /** DELETE /risk_assessment_entry_corrective_actions/:id → 204 */
  remove: (id) =>
    api.delete(`/risk_assessment_entry_corrective_actions/${id}`),
};

// ── Entry Priorities ───────────────────────────────────────────────────────
export const EntryPriorityService = {
  /**
   * GET /performed_risk_assessment_entry_priorities
   * Filters: filter[performed_risk_assessment_entry_id], filter[priority_level], filter[due_date]
   */
  list: (params = {}) =>
    api.get('/performed_risk_assessment_entry_priorities', { params }),

  /** GET /performed_risk_assessment_entry_priorities/:id */
  get: (id) =>
    api.get(`/performed_risk_assessment_entry_priorities/${id}`),

  /**
   * POST /performed_risk_assessment_entry_priorities
   * Required: performed_risk_assessment_entry_id, priority_level, due_date
   */
  create: (data) =>
    api.post('/performed_risk_assessment_entry_priorities', data),

  /** PATCH /performed_risk_assessment_entry_priorities/:id */
  update: (id, data) =>
    api.patch(`/performed_risk_assessment_entry_priorities/${id}`, data),

  /** DELETE /performed_risk_assessment_entry_priorities/:id → 204 */
  remove: (id) =>
    api.delete(`/performed_risk_assessment_entry_priorities/${id}`),
};

// ── Performed Risk Assessment Entries ──────────────────────────────────────
export const PerformedEntryService = {
  /**
   * PATCH /performed_risk_assessment_entries/:id/assign_contractor
   * Payload: { contractor_id } or { contractor_ids: [] }
   */
  assignContractor: (id, data) =>
    api.patch(
      `/performed_risk_assessment_entries/${id}/assign_contractor`,
      data
    ),

  /**
   * PATCH /performed_risk_assessment_entries/:id/execute
   * Required: hazard_id (>0), due_date, image_before (file), proof_of_completion (file)
   * Optional: note, people_at_risk_ids[], people_at_risk_titles[]
   * Sends as multipart/form-data
   */
  execute: (id, formData) =>
    api.patch(
      `/performed_risk_assessment_entries/${id}/execute`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    ),
};
