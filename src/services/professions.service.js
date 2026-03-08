/**
 * professions.service.js — Reference data for user profession_id
 *
 * Endpoints:
 *   GET    /professions      (professions.view)
 *   GET    /professions/:id  (professions.view)
 *   POST   /professions      (professions.create)
 *   PUT    /professions/:id  (professions.update)
 *   DELETE /professions/:id  (professions.delete)
 *
 * Body wrapper: { profession: { name, category?, description?, active? } }
 * name is required and unique; category max 100 chars.
 */

import api from './index';

const ProfessionsService = {
  list: () => api.get('/professions'),

  getById: (id) => api.get(`/professions/${id}`),

  create: (data) => api.post('/professions', { profession: data }),

  update: (id, data) => api.put(`/professions/${id}`, { profession: data }),

  remove: (id) => api.delete(`/professions/${id}`),
};

export default ProfessionsService;
