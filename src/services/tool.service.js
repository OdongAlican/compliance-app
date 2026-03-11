import api from './index';

const BASE    = '/hand_power_tools_inspections';
const PERFORM = '/perform_hand_power_tools_inspections';

export const ToolSetupService = {
  list:   (params = {}) => api.get(BASE, { params }),
  get:    (id)          => api.get(`${BASE}/${id}`),
  create: (data)        => api.post(BASE, { hand_power_tools_inspection: data }),
  update: (id, data)    => api.put(`${BASE}/${id}`, { hand_power_tools_inspection: data }),
  remove: (id)          => api.delete(`${BASE}/${id}`),
  reassignSupervisor:    (id, supervisorId)    => api.post(`${BASE}/${id}/reassign_supervisor`,    { supervisor_id: supervisorId }),
  reassignSafetyOfficer: (id, safetyOfficerId) => api.post(`${BASE}/${id}/reassign_safety_officer`, { safety_officer_id: safetyOfficerId }),
};

export const ToolPerformService = {
  list:    (setupId, params = {}) => api.get(`${BASE}/${setupId}/performs`, { params }),
  create:  (setupId, data)        => api.post(`${BASE}/${setupId}/performs`, { perform: data }),
  get:     (id, params = {})      => api.get(`${PERFORM}/${id}`, { params }),
  update:  (id, data)             => api.put(`${PERFORM}/${id}`, { perform: data }),
  remove:  (id)                   => api.delete(`${PERFORM}/${id}`),
  signOff: (id, note = '')        => api.post(`${PERFORM}/${id}/sign_off`, { sign_off: { note } }),
};

export const ToolChecklistService = {
  list:   (performId)        => api.get(`${PERFORM}/${performId}/checklists`),
  attach: (performId, ids)   => api.post(`${PERFORM}/${performId}/checklists`, { checklist_template_ids: ids }),
  remove: (performId, checklistId) => api.delete(`${PERFORM}/${performId}/checklists/${checklistId}`),
};

export const ToolChecklistItemService = {
  list:   (performId, checklistId)        => api.get(`${PERFORM}/${performId}/checklists/${checklistId}/items`),
  upsert: (performId, checklistId, items) => api.post(`${PERFORM}/${performId}/checklists/${checklistId}/items`, { items }),
};

export const ToolIssueService = {
  list: (performId, params = {}) =>
    api.get(`${PERFORM}/${performId}/issues`, { params }),

  create: (performId, data, files = []) => {
    if (files.length === 0) {
      return api.post(`${PERFORM}/${performId}/issues`, { issue: data });
    }
    const form = new FormData();
    Object.entries(data).forEach(([k, v]) => { if (v != null) form.append(`issue[${k}]`, v); });
    files.forEach((f) => form.append('attachments[]', f));
    return api.post(`${PERFORM}/${performId}/issues`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  update: (performId, issueId, data) =>
    api.put(`${PERFORM}/${performId}/issues/${issueId}`, { issue: data }),

  remove: (performId, issueId) =>
    api.delete(`${PERFORM}/${performId}/issues/${issueId}`),

  updateCorrectiveAction: (performId, issueId, corrective_action) =>
    api.patch(`${PERFORM}/${performId}/issues/${issueId}/update_corrective_action`, {
      issue: { corrective_action },
    }),

  updatePriorityDueDate: (performId, issueId, data) =>
    api.patch(`${PERFORM}/${performId}/issues/${issueId}/update_priority_due_date`, {
      issue: data,
    }),

  repairCompletion: (performId, issueId, data, files = []) => {
    if (files.length === 0) {
      return api.post(`${PERFORM}/${performId}/issues/${issueId}/repair_completion`, {
        repair: data,
      });
    }
    const form = new FormData();
    Object.entries(data).forEach(([k, v]) => { if (v != null) form.append(`repair[${k}]`, v); });
    files.forEach((f) => form.append('attachments[]', f));
    return api.post(`${PERFORM}/${performId}/issues/${issueId}/repair_completion`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  assignContractor: (performId, issueId, contractorId) =>
    api.patch(`${PERFORM}/${performId}/issues/${issueId}/assign_contractor`, {
      issue: { contractor_id: contractorId },
    }),

  setRepairStatus: (performId, issueId, repair_status, reject_reason = '') =>
    api.patch(`${PERFORM}/${performId}/issues/${issueId}/set_repair_status`, {
      issue: { repair_status, ...(repair_status === 'rejected' ? { reject_reason } : {}) },
    }),
};

export const ToolAttachmentService = {
  list:   (performId, issueId)               => api.get(`${PERFORM}/${performId}/issues/${issueId}/attachments`),
  upload: (performId, issueId, file)         => { const f = new FormData(); f.append('file', file); return api.post(`${PERFORM}/${performId}/issues/${issueId}/attachments`, f, { headers: { 'Content-Type': 'multipart/form-data' } }); },
  remove: (performId, issueId, attachmentId) => api.delete(`${PERFORM}/${performId}/issues/${issueId}/attachments/${attachmentId}`),
};

export const ToolRepairAttachmentService = {
  list:   (performId, issueId)               => api.get(`${PERFORM}/${performId}/issues/${issueId}/repair_attachments`),
  upload: (performId, issueId, file)         => { const f = new FormData(); f.append('file', file); return api.post(`${PERFORM}/${performId}/issues/${issueId}/repair_attachments`, f, { headers: { 'Content-Type': 'multipart/form-data' } }); },
  remove: (performId, issueId, attachmentId) => api.delete(`${PERFORM}/${performId}/issues/${issueId}/repair_attachments/${attachmentId}`),
};
