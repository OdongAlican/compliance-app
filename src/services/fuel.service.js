import api from "./index";

/* ── Fuel Tank Inspection Setup ─────────────────────────────────────── */
export const FuelSetupService = {
  list: (params = {}) =>
    api.get("/fuel_tank_inspections", { params }).then((r) => r.data),

  get: (id) =>
    api.get(`/fuel_tank_inspections/${id}`).then((r) => r.data),

  create: (data) =>
    api
      .post("/fuel_tank_inspections", { fuel_tank_inspection: data })
      .then((r) => r.data),

  update: (id, data) =>
    api
      .put(`/fuel_tank_inspections/${id}`, { fuel_tank_inspection: data })
      .then((r) => r.data),

  remove: (id) =>
    api.delete(`/fuel_tank_inspections/${id}`).then((r) => r.data),

  reassignSupervisor: (id, supervisorId) =>
    api
      .post(`/fuel_tank_inspections/${id}/reassign_supervisor`, {
        supervisor_id: supervisorId,
      })
      .then((r) => r.data),

  reassignSafetyOfficer: (id, safetyOfficerId) =>
    api
      .post(`/fuel_tank_inspections/${id}/reassign_safety_officer`, {
        safety_officer_id: safetyOfficerId,
      })
      .then((r) => r.data),
};

/* ── Performed Fuel Tank Inspection ─────────────────────────────────── */
export const FuelPerformService = {
  list: (setupId, params = {}) =>
    api
      .get(`/fuel_tank_inspections/${setupId}/performs`, { params })
      .then((r) => r.data),

  create: (setupId, data) =>
    api
      .post(`/fuel_tank_inspections/${setupId}/performs`, data)
      .then((r) => r.data),

  get: (id, params = {}) =>
    api
      .get(`/perform_fuel_tank_inspections/${id}`, { params })
      .then((r) => r.data),

  update: (id, data) =>
    api
      .put(`/perform_fuel_tank_inspections/${id}`, { perform: data })
      .then((r) => r.data),

  remove: (id) =>
    api.delete(`/perform_fuel_tank_inspections/${id}`).then((r) => r.data),

  signOff: (id, note) =>
    api
      .post(`/perform_fuel_tank_inspections/${id}/sign_off`, {
        sign_off: { note },
      })
      .then((r) => r.data),
};

/* ── Fuel Checklist Items ────────────────────────────────────────────── */
export const FuelChecklistItemService = {
  upsert: (performId, checklistId, items) =>
    api
      .post(
        `/perform_fuel_tank_inspections/${performId}/checklists/${checklistId}/items`,
        { items }
      )
      .then((r) => r.data),
};

/* ── Fuel Issues ─────────────────────────────────────────────────────── */
export const FuelIssueService = {
  list: (performId, params = {}) =>
    api
      .get(`/perform_fuel_tank_inspections/${performId}/issues`, { params })
      .then((r) => r.data),

  create: (performId, data, files = []) => {
    if (files.length === 0) {
      return api
        .post(`/perform_fuel_tank_inspections/${performId}/issues`, {
          issue: data,
        })
        .then((r) => r.data);
    }
    const fd = new FormData();
    Object.entries(data).forEach(([k, v]) => fd.append(`issue[${k}]`, v));
    files.forEach((f) => fd.append("issue[attachments][]", f));
    return api
      .post(`/perform_fuel_tank_inspections/${performId}/issues`, fd)
      .then((r) => r.data);
  },

  update: (performId, issueId, data) =>
    api
      .put(`/perform_fuel_tank_inspections/${performId}/issues/${issueId}`, {
        issue: data,
      })
      .then((r) => r.data),

  remove: (performId, issueId) =>
    api
      .delete(`/perform_fuel_tank_inspections/${performId}/issues/${issueId}`)
      .then((r) => r.data),

  updateCorrectiveAction: (performId, issueId, correctiveAction) =>
    api
      .patch(
        `/perform_fuel_tank_inspections/${performId}/issues/${issueId}/update_corrective_action`,
        { corrective_action: correctiveAction }
      )
      .then((r) => r.data),

  updatePriorityDueDate: (performId, issueId, data) =>
    api
      .patch(
        `/perform_fuel_tank_inspections/${performId}/issues/${issueId}/update_priority_due_date`,
        data
      )
      .then((r) => r.data),

  repairCompletion: (performId, issueId, data, files = []) => {
    if (files.length === 0) {
      return api
        .post(
          `/perform_fuel_tank_inspections/${performId}/issues/${issueId}/repair_completion`,
          data
        )
        .then((r) => r.data);
    }
    const fd = new FormData();
    Object.entries(data).forEach(([k, v]) => fd.append(k, v));
    files.forEach((f) => fd.append("attachments[]", f));
    return api
      .post(
        `/perform_fuel_tank_inspections/${performId}/issues/${issueId}/repair_completion`,
        fd
      )
      .then((r) => r.data);
  },

  assignContractor: (performId, issueId, contractorId) =>
    api
      .patch(
        `/perform_fuel_tank_inspections/${performId}/issues/${issueId}/assign_contractor`,
        { contractor_id: contractorId }
      )
      .then((r) => r.data),

  setRepairStatus: (performId, issueId, status, rejectReason) =>
    api
      .patch(
        `/perform_fuel_tank_inspections/${performId}/issues/${issueId}/set_repair_status`,
        { status, ...(rejectReason ? { reject_reason: rejectReason } : {}) }
      )
      .then((r) => r.data),
};

export default FuelSetupService;
