import api from './index';

// ── Hazard Reports ───────────────────────────────────────────────────────────

export const getHazardReports  = (params = {}) => api.get('/hazards/', { params });
export const getHazardReport   = (id)           => api.get(`/hazards/${id}/`);
export const createHazardReport = (payload)     => api.post('/hazards/', payload);
export const updateHazardReport = (id, payload) => api.patch(`/hazards/${id}/`, payload);
export const deleteHazardReport = (id)          => api.delete(`/hazards/${id}/`);
export const updateHazardStatus = (id, status)  => api.patch(`/hazards/${id}/status/`, { status });

// ── Risk Assessments ─────────────────────────────────────────────────────────

export const getRiskAssessments  = (params = {}) => api.get('/risk-assessments/', { params });
export const getRiskAssessment   = (id)           => api.get(`/risk-assessments/${id}/`);
export const createRiskAssessment = (payload)     => api.post('/risk-assessments/', payload);
export const updateRiskAssessment = (id, payload) => api.patch(`/risk-assessments/${id}/`, payload);
export const deleteRiskAssessment = (id)          => api.delete(`/risk-assessments/${id}/`);
