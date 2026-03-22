/**
 * incidents.service.js
 * API service layer for the Incidents domain.
 *
 * Endpoints:
 *  - /incident_notifications                  Incident Notifications CRUD
 *  - /incident_notifications/:id/assign_*     Assignee management
 *  - /incident_notifications/:id/witness_statements   Witness Statements
 *  - /start_incident_investigations           Incident Investigations CRUD
 */
import api from './index';

// ── Incident Notifications ─────────────────────────────────────────────────
export const IncidentNotificationService = {
  /**
   * GET /incident_notifications
   * Filters: filter[incident_type], filter[email], filter[location],
   *          filter[date_of_incident], filter[date_of_reporting], filter[reporter_id]
   * Pagination: page, per_page (max 100)
   */
  list: (params = {}) => api.get('/incident_notifications', { params }),

  /** GET /incident_notifications/:id */
  get: (id) => api.get(`/incident_notifications/${id}`),

  /**
   * POST /incident_notifications
   * Fields: incident_type, email, location, description, reporter_id,
   *         time_of_incident, date_of_incident, date_of_reporting,
   *         safety_officer_ids[], supervisor_ids[]
   */
  create: (data) => api.post('/incident_notifications', data),

  /** PUT /incident_notifications/:id */
  update: (id, data) => api.put(`/incident_notifications/${id}`, data),

  /** DELETE /incident_notifications/:id → 204 */
  remove: (id) => api.delete(`/incident_notifications/${id}`),

  /**
   * PATCH /incident_notifications/:id/assign_safety_officers
   * body: { safety_officer_ids: [...] }
   */
  assignSafetyOfficers: (id, safety_officer_ids) =>
    api.patch(`/incident_notifications/${id}/assign_safety_officers`, { safety_officer_ids }),

  /**
   * PATCH /incident_notifications/:id/assign_supervisors
   * body: { supervisor_ids: [...] }
   */
  assignSupervisors: (id, supervisor_ids) =>
    api.patch(`/incident_notifications/${id}/assign_supervisors`, { supervisor_ids }),
};

// ── Witness Statements (nested under Incident Notifications) ───────────────
export const WitnessStatementService = {
  /**
   * GET /incident_notifications/:notifId/witness_statements
   * Filters: filter[witness_id], filter[date_of_statement],
   *          filter[date_of_incident], filter[location_of_incident]
   */
  list: (notifId, params = {}) =>
    api.get(`/incident_notifications/${notifId}/witness_statements`, { params }),

  /** GET /incident_notifications/:notifId/witness_statements/:id */
  get: (notifId, id) =>
    api.get(`/incident_notifications/${notifId}/witness_statements/${id}`),

  /**
   * POST /incident_notifications/:notifId/witness_statements
   * Fields: witness_id, date_of_statement, date_of_incident, time_of_incident,
   *         location_of_incident, your_involvement, statement
   */
  create: (notifId, data) =>
    api.post(`/incident_notifications/${notifId}/witness_statements`, data),

  /** PUT /incident_notifications/:notifId/witness_statements/:id */
  update: (notifId, id, data) =>
    api.put(`/incident_notifications/${notifId}/witness_statements/${id}`, data),

  /** DELETE /incident_notifications/:notifId/witness_statements/:id → 204 */
  remove: (notifId, id) =>
    api.delete(`/incident_notifications/${notifId}/witness_statements/${id}`),
};

// ── Start Incident Investigations ──────────────────────────────────────────
export const StartInvestigationService = {
  /**
   * GET /start_incident_investigations
   * Filters: filter[incident_investigation_id]
   * Pagination: page, per_page (max 100)
   */
  list: (params = {}) => api.get('/start_incident_investigations', { params }),

  /**
   * GET /start_incident_investigations/:id
   * Includes: incident_investigation (reporter, officers, supervisors, witnesses),
   *           people_injured, properties_involved, incident_descriptions, actions_taken
   */
  get: (id) => api.get(`/start_incident_investigations/${id}`),

  /**
   * POST /start_incident_investigations
   * Fields: incident_investigation_id, notes,
   *   people_injured[]:        { user_id, injury_sustained, nature_of_injury }
   *   properties_involved[]:   { type_of_property, description, nature_of_damage }
   *   incident_descriptions[]: { narrative, file? }
   *   actions_taken[]:         { description, user_id, action_date, action_time }
   */
  create: (data) => api.post('/start_incident_investigations', data),

  /**
   * PUT /start_incident_investigations/:id
   * Parent: notes. Child arrays replace if key present.
   */
  update: (id, data) => api.put(`/start_incident_investigations/${id}`, data),

  /** DELETE /start_incident_investigations/:id → 204 */
  remove: (id) => api.delete(`/start_incident_investigations/${id}`),
};


// ── Witness Statements ───────────────────────────────────────────────────────

export const getWitnessStatements  = (incidentId)          => api.get(`/incidents/${incidentId}/witnesses/`);
export const createWitnessStatement = (incidentId, payload) => api.post(`/incidents/${incidentId}/witnesses/`, payload);
export const updateWitnessStatement = (incidentId, wId, payload) => api.patch(`/incidents/${incidentId}/witnesses/${wId}/`, payload);
export const deleteWitnessStatement = (incidentId, wId)    => api.delete(`/incidents/${incidentId}/witnesses/${wId}/`);

// ── Investigations ───────────────────────────────────────────────────────────

export const getInvestigation    = (incidentId)         => api.get(`/incidents/${incidentId}/investigation/`);
export const createInvestigation = (incidentId, payload) => api.post(`/incidents/${incidentId}/investigation/`, payload);
export const updateInvestigation = (incidentId, payload) => api.patch(`/incidents/${incidentId}/investigation/`, payload);
