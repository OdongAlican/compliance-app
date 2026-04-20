import api from './index';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Fetch a URL safely — returns [] on any error (403, network, etc.) */
const get = async (url, params = {}) => {
  try {
    const r = await api.get(url, {
      params: { per_page: 1000, ...params },
      _skipForbidden: true,
    });
    return Array.isArray(r) ? r : (r?.data ?? []);
  } catch {
    return [];
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Main fetch — loads every module in parallel
// ─────────────────────────────────────────────────────────────────────────────
export const fetchAnalyticsData = async () => {
  // Standalone endpoints
  const [
    incidents,
    hazards,
    riskAssessments,
    performedRA,
    canteen,
    fuel,
    tool,
    ppe,
    scienceLab,
    swimmingPool,
    vehicle,
    hsaParents,
  ] = await Promise.all([
    get('/incident_notifications'),
    get('/hazard_reports'),
    get('/risk_assessments'),
    get('/perform_risk_assessments'),
    get('/canteen_inspections'),
    get('/fuel_tank_inspections'),
    get('/hand_power_tools_inspections'),
    get('/ppe_inspections'),
    get('/science_lab_inspections'),
    get('/swimming_pool_inspections'),
    get('/vehicle_inspections'),
    get('/health_and_safety_audits'),
  ]);

  // Nested H&S sub-module endpoints (require audit ID)
  const SUB_MODULES = [
    ['wir',         'workplace_inspection_reports'],
    ['tc',          'training_and_competencies'],
    ['ep',          'emergency_preparednesses'],
    ['ppeComp',     'ppe_compliances'],
    ['cs',          'contractor_safeties'],
    ['mrm',         'management_review_meetings'],
    ['capa',        'capa_trackings'],
    ['checklists',  'checklists'],
  ];

  const hsaModules = Object.fromEntries(SUB_MODULES.map(([k]) => [k, []]));

  const hsaIds = hsaParents.map((a) => a.id);
  if (hsaIds.length > 0) {
    const results = await Promise.all(
      hsaIds.flatMap((id) =>
        SUB_MODULES.map(([key, path]) =>
          get(`/health_and_safety_audits/${id}/${path}`).then((data) => ({ key, data }))
        )
      )
    );
    results.forEach(({ key, data }) => {
      if (data.length) hsaModules[key].push(...data);
    });
  }

  return {
    incidents,
    hazards,
    riskAssessments,
    performedRA,
    inspections: { canteen, fuel, tool, ppe, scienceLab, swimmingPool, vehicle },
    hsaParents,
    hsaModules,
  };
};
