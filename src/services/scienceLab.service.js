import api from './index';

const BASE    = '/science_lab_inspections';
const PERFORM = '/perform_science_lab_inspections';

export const ScienceLabSetupService = {
  list:   (params = {}) => api.get(BASE, { params }),
  get:    (id)          => api.get(`${BASE}/${id}`),
  create: (data)        => api.post(BASE, { science_lab_inspection: data }),
  update: (id, data)    => api.put(`${BASE}/${id}`, { science_lab_inspection: data }),
  remove: (id)          => api.delete(`${BASE}/${id}`),
  reassignSupervisor:    (id, supervisorId)    => api.post(`${BASE}/${id}/reassign_supervisor`,    { supervisor_id: supervisorId }),
  reassignSafetyOfficer: (id, safetyOfficerId) => api.post(`${BASE}/${id}/reassign_safety_officer`, { safety_officer_id: safetyOfficerId }),
};

export const ScienceLabPerformService = {
  list:    (setupId, params = {}) => api.get(`${BASE}/${setupId}/performs`, { params }),

  /**
   * POST /science_lab_inspections/:setupId/performs
   * Supports combined payload: perform + checklist_template + inspectionIssues.
   * Automatically uses multipart/form-data when any issue carries a File attachment,
   * otherwise sends a plain JSON body.
   */
  create: (setupId, { perform = {}, checklist_template = [], inspectionIssues = [] } = {}) => {
    const hasFiles = inspectionIssues.some((i) => i.file instanceof File);

    if (!hasFiles) {
      const body = { perform };
      if (checklist_template.length) body.checklist_template = checklist_template;
      if (inspectionIssues.length) {
        body.inspectionIssues = inspectionIssues.map(({ file: _f, ...rest }) => rest);
      }
      return api.post(`${BASE}/${setupId}/performs`, body);
    }

    // Multipart — required when at least one issue has a file
    const form = new FormData();
    Object.entries(perform).forEach(([k, v]) => {
      if (v != null && v !== '') form.append(`perform[${k}]`, v);
    });
    checklist_template.forEach((tmpl, ti) => {
      form.append(`checklist_template[${ti}][id]`, tmpl.id);
      (tmpl.checklistItems || []).forEach((item, ii) => {
        form.append(`checklist_template[${ti}][checklistItems][${ii}][id]`, item.id);
        form.append(`checklist_template[${ti}][checklistItems][${ii}][value]`, item.value);
        if (item.comment) form.append(`checklist_template[${ti}][checklistItems][${ii}][comment]`, item.comment);
      });
    });
    inspectionIssues.forEach((issue, i) => {
      if (issue.title) form.append(`inspectionIssues[${i}][title]`, issue.title);
      if (issue.description) form.append(`inspectionIssues[${i}][description]`, issue.description);
      if (issue.correctiveAction) form.append(`inspectionIssues[${i}][correctiveAction]`, issue.correctiveAction);
      if (issue.file instanceof File) form.append(`inspectionIssues[${i}][file]`, issue.file);
    });
    return api.post(`${BASE}/${setupId}/performs`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  get:     (id, params = {})      => api.get(`${PERFORM}/${id}`, { params }),
  update:  (id, data)             => api.put(`${PERFORM}/${id}`, { perform: data }),
  remove:  (id)                   => api.delete(`${PERFORM}/${id}`),
  signOff: (id, note = '')        => api.post(`${PERFORM}/${id}/sign_off`, { sign_off: { note } }),
};

export const ScienceLabChecklistService = {
  list:   (performId)              => api.get(`${PERFORM}/${performId}/checklists`),
  attach: (performId, ids)         => api.post(`${PERFORM}/${performId}/checklists`, { checklist_template_ids: ids }),
  remove: (performId, checklistId) => api.delete(`${PERFORM}/${performId}/checklists/${checklistId}`),
};

export const ScienceLabChecklistItemService = {
  list:   (performId, checklistId)        => api.get(`${PERFORM}/${performId}/checklists/${checklistId}/items`),
  upsert: (performId, checklistId, items) => api.post(`${PERFORM}/${performId}/checklists/${checklistId}/items`, { items }),
};

export const ScienceLabIssueService = {
  list:   (performId, params = {}) => api.get(`${PERFORM}/${performId}/issues`, { params }),
  create: (performId, data, files = []) => {
    if (files.length === 0) return api.post(`${PERFORM}/${performId}/issues`, { issue: data });
    const form = new FormData();
    Object.entries(data).forEach(([k, v]) => { if (v != null) form.append(`issue[${k}]`, v); });
    files.forEach((f) => form.append('attachments[]', f));
    return api.post(`${PERFORM}/${performId}/issues`, form, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  update: (performId, issueId, data)      => api.put(`${PERFORM}/${performId}/issues/${issueId}`, { issue: data }),
  remove: (performId, issueId)            => api.delete(`${PERFORM}/${performId}/issues/${issueId}`),
  updateCorrectiveAction: (performId, issueId, corrective_action) =>
    api.patch(`${PERFORM}/${performId}/issues/${issueId}/update_corrective_action`, { issue: { corrective_action } }),
  updatePriorityDueDate: (performId, issueId, data) =>
    api.patch(`${PERFORM}/${performId}/issues/${issueId}/update_priority_due_date`, { issue: data }),
  repairCompletion: (performId, issueId, data, files = []) => {
    if (files.length === 0) return api.post(`${PERFORM}/${performId}/issues/${issueId}/repair_completion`, { repair: data });
    const form = new FormData();
    Object.entries(data).forEach(([k, v]) => { if (v != null) form.append(`repair[${k}]`, v); });
    files.forEach((f) => form.append('attachments[]', f));
    return api.post(`${PERFORM}/${performId}/issues/${issueId}/repair_completion`, form, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  assignContractor: (performId, issueId, contractorId) =>
    api.patch(`${PERFORM}/${performId}/issues/${issueId}/assign_contractor`, { issue: { contractor_id: contractorId } }),
  setRepairStatus: (performId, issueId, repair_status, reject_reason = '') =>
    api.patch(`${PERFORM}/${performId}/issues/${issueId}/set_repair_status`, {
      issue: { repair_status, ...(repair_status === 'rejected' ? { reject_reason } : {}) },
    }),
};

export const ScienceLabAttachmentService = {
  list:   (performId, issueId)              => api.get(`${PERFORM}/${performId}/issues/${issueId}/attachments`),
  upload: (performId, issueId, file)        => {
    const form = new FormData(); form.append('file', file);
    return api.post(`${PERFORM}/${performId}/issues/${issueId}/attachments`, form, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  remove: (performId, issueId, attachmentId) => api.delete(`${PERFORM}/${performId}/issues/${issueId}/attachments/${attachmentId}`),
};

export const ScienceLabRepairAttachmentService = {
  list:   (performId, issueId)              => api.get(`${PERFORM}/${performId}/issues/${issueId}/repair_attachments`),
  upload: (performId, issueId, file)        => {
    const form = new FormData(); form.append('file', file);
    return api.post(`${PERFORM}/${performId}/issues/${issueId}/repair_attachments`, form, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  remove: (performId, issueId, attachmentId) => api.delete(`${PERFORM}/${performId}/issues/${issueId}/repair_attachments/${attachmentId}`),
};
