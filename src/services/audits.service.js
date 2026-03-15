import api from './index';

// ── CAPA ─────────────────────────────────────────────────────────────────────

export const getCapas    = (params = {}) => api.get('/audits/capa/', { params });
export const getCapa     = (id)           => api.get(`/audits/capa/${id}/`);
export const createCapa  = (payload)      => api.post('/audits/capa/', payload);
export const updateCapa  = (id, payload)  => api.patch(`/audits/capa/${id}/`, payload);
export const deleteCapa  = (id)           => api.delete(`/audits/capa/${id}/`);

// ── Checklists ───────────────────────────────────────────────────────────────

export const getChecklists   = (params = {}) => api.get('/audits/checklists/', { params });
export const getChecklist    = (id)           => api.get(`/audits/checklists/${id}/`);
export const createChecklist = (payload)      => api.post('/audits/checklists/', payload);
export const updateChecklist = (id, payload)  => api.patch(`/audits/checklists/${id}/`, payload);
export const deleteChecklist = (id)           => api.delete(`/audits/checklists/${id}/`);

// ── Management Reviews ───────────────────────────────────────────────────────

export const getReviews   = (params = {}) => api.get('/audits/management-reviews/', { params });
export const getReview    = (id)           => api.get(`/audits/management-reviews/${id}/`);
export const createReview = (payload)      => api.post('/audits/management-reviews/', payload);
export const updateReview = (id, payload)  => api.patch(`/audits/management-reviews/${id}/`, payload);
export const deleteReview = (id)           => api.delete(`/audits/management-reviews/${id}/`);

// ── Recent Audits ─────────────────────────────────────────────────────────────

export const getRecentAudits   = (params = {}) => api.get('/audits/recent/', { params });
export const getRecentAudit    = (id)           => api.get(`/audits/recent/${id}/`);
export const createRecentAudit = (payload)      => api.post('/audits/recent/', payload);
export const updateRecentAudit = (id, payload)  => api.patch(`/audits/recent/${id}/`, payload);
export const deleteRecentAudit = (id)           => api.delete(`/audits/recent/${id}/`);

// ── Corrective Actions ───────────────────────────────────────────────────────

export const getCorrectiveActions   = (params = {}) => api.get('/audits/corrective-actions/', { params });
export const createCorrectiveAction = (payload)      => api.post('/audits/corrective-actions/', payload);
export const updateCorrectiveAction = (id, payload)  => api.patch(`/audits/corrective-actions/${id}/`, payload);
export const deleteCorrectiveAction = (id)           => api.delete(`/audits/corrective-actions/${id}/`);
