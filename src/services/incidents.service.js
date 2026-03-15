import api from './index';

// ── Incident Reports ─────────────────────────────────────────────────────────

export const getIncidents    = (params = {}) => api.get('/incidents/', { params });
export const getIncident     = (id)           => api.get(`/incidents/${id}/`);
export const createIncident  = (payload)      => api.post('/incidents/', payload);
export const updateIncident  = (id, payload)  => api.patch(`/incidents/${id}/`, payload);
export const deleteIncident  = (id)           => api.delete(`/incidents/${id}/`);
export const updateIncidentStatus = (id, status) => api.patch(`/incidents/${id}/status/`, { status });

// ── Witness Statements ───────────────────────────────────────────────────────

export const getWitnessStatements  = (incidentId)          => api.get(`/incidents/${incidentId}/witnesses/`);
export const createWitnessStatement = (incidentId, payload) => api.post(`/incidents/${incidentId}/witnesses/`, payload);
export const updateWitnessStatement = (incidentId, wId, payload) => api.patch(`/incidents/${incidentId}/witnesses/${wId}/`, payload);
export const deleteWitnessStatement = (incidentId, wId)    => api.delete(`/incidents/${incidentId}/witnesses/${wId}/`);

// ── Investigations ───────────────────────────────────────────────────────────

export const getInvestigation    = (incidentId)         => api.get(`/incidents/${incidentId}/investigation/`);
export const createInvestigation = (incidentId, payload) => api.post(`/incidents/${incidentId}/investigation/`, payload);
export const updateInvestigation = (incidentId, payload) => api.patch(`/incidents/${incidentId}/investigation/`, payload);
