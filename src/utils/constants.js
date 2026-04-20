/**
 * Application-wide constants.
 * Import specific values rather than the whole object to aid tree-shaking.
 */

// ---------------------------------------------------------------------------
// USER ROLES
// ---------------------------------------------------------------------------
export const ROLES = {
  ADMIN:      'Admin',
  AUDITOR:    'Auditor',
  SUPERVISOR: 'Supervisor',
  STAFF:      'Staff',
  CONTRACTOR: 'Contractor',
};

// ---------------------------------------------------------------------------
// INSPECTION / RECORD STATUSES
// ---------------------------------------------------------------------------
export const STATUS = {
  ALL:         'All',
  PENDING:     'Pending',
  IN_PROGRESS: 'In Progress',
  COMPLETED:   'Completed',
  APPROVED:    'Approved',
  REJECTED:    'Rejected',
};

/** Ordered list for dropdowns */
export const STATUS_OPTIONS = [
  STATUS.ALL,
  STATUS.PENDING,
  STATUS.IN_PROGRESS,
  STATUS.COMPLETED,
  STATUS.APPROVED,
  STATUS.REJECTED,
];

// ---------------------------------------------------------------------------
// STATUS → COLOUR MAP (uses CSS vars via color-mix)
// ---------------------------------------------------------------------------
export const STATUS_COLORS = {
  [STATUS.PENDING]:     { hex: '#d29922', label: 'Pending' },
  [STATUS.IN_PROGRESS]: { hex: '#58a6ff', label: 'In Progress' },
  [STATUS.COMPLETED]:   { hex: '#3fb950', label: 'Completed' },
  [STATUS.APPROVED]:    { hex: '#3fb950', label: 'Approved' },
  [STATUS.REJECTED]:    { hex: '#f85149', label: 'Rejected' },
};

// ---------------------------------------------------------------------------
// PRIORITY LEVELS
// ---------------------------------------------------------------------------
export const PRIORITY = {
  LOW:    'Low',
  MEDIUM: 'Medium',
  HIGH:   'High',
  URGENT: 'Urgent',
};

export const PRIORITY_COLORS = {
  [PRIORITY.LOW]:    '#3fb950',
  [PRIORITY.MEDIUM]: '#d29922',
  [PRIORITY.HIGH]:   '#f85149',
  [PRIORITY.URGENT]: '#ff7b72',
};

// ---------------------------------------------------------------------------
// ROUTE PATHS — single source of truth, import instead of hardcoding strings
// ---------------------------------------------------------------------------
export const ROUTES = {
  // Public
  HOME:        '/',
  PRODUCTS:    '/products',
  SOLUTIONS:   '/solutions',
  CONTACTS:    '/contacts',
  // Auth
  LOGIN:       '/login',
  SIGNUP:      '/signin',
  // App – Dashboard
  DASHBOARD:   '/dashboard',
  CAPA:        '/capa',
  SIDEBAR:     '/sidebar',
  // App – Inspections
  INSPECTION:  '/inspection',
  CANTEEN:     '/form/canteen',
  FUEL:        '/form/fuel',
  TOOL:        '/form/tool',
  PPE:         '/form/ppe',
  PPE_COMP:    '/health-and-safety/ppe-compliance',
  VEHICLE:     '/form/vehicle',
  SCIENCE_LAB: '/form/science-laboratory',
  SWIMMING:    '/form/swimming-pool',
  WORKPLACE:   '/form/workplace',
  CHECKLIST:   '/form/checklist',
  EMERGENCY:   '/form/emergency',
  MANAGEMENT:  '/form/management',
  AUDIT:       '/form/audit',
  // App – Hazard & Risk
  HAZARD_REPORT:   '/hazard/report',
  HAZARD_FORM:     '/dashboard/hazardform',
  RISK_FORM:       '/form/risk',
  // App – Incidents
  INCIDENT_MGMT:   '/incident-management',
  INCIDENT_FORM:   '/dashboard/incidentform',
  WITNESS:         '/form/witness',
  DESCRIPTION:     '/form/description',
  // App – Health & Safety
  HEALTH_SAFETY:   '/health-and-safety',
  // App – Users
  USER_MGMT:       '/user-management',
  ROLES:           '/roles',
};

// ---------------------------------------------------------------------------
// PERMISSIONS — all known permission keys returned by the API
// Use hasPermission(PERMISSIONS.USERS_VIEW) for consistent checks.
// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// PERMISSIONS — exact endpoint-level keys as defined in the backend seed.
// One key per controller action. Use hasPermission(PERMISSIONS.X) in the UI.
// Never group actions under a single key — each button/route needs its own.
// ---------------------------------------------------------------------------
export const PERMISSIONS = {
  // ── Users ──────────────────────────────────────────────────────────────
  USERS_INDEX:          'users.index',
  USERS_SHOW:           'users.show',
  USERS_CREATE:         'users.create',
  USERS_UPDATE:         'users.update',
  USERS_DESTROY:        'users.destroy',
  USERS_SET_ROLE:       'users.set_role',
  USERS_UPLOAD_PROFILE: 'users.upload_profile',
  USERS_PROFILE:        'users.profile',

  // ── Roles ───────────────────────────────────────────────────────────────
  ROLES_INDEX:            'roles.index',
  ROLES_SHOW:             'roles.show',
  ROLES_CREATE:           'roles.create',
  ROLES_UPDATE:           'roles.update',
  ROLES_DESTROY:          'roles.destroy',
  ROLES_SET_PERMISSIONS:  'roles.set_permissions',
  ROLES_REVOKE_PERMISSIONS:'roles.revoke_permissions',

  // ── Permissions ─────────────────────────────────────────────────────────
  PERMS_INDEX:   'permissions.index',
  PERMS_CREATE:  'permissions.create',
  PERMS_UPDATE:  'permissions.update',
  PERMS_DESTROY: 'permissions.destroy',

  // ── Professions ──────────────────────────────────────────────────────────
  PROFS_INDEX:   'professions.index',
  PROFS_SHOW:    'professions.show',
  PROFS_CREATE:  'professions.create',
  PROFS_UPDATE:  'professions.update',
  PROFS_DESTROY: 'professions.destroy',

  // ── Inspections (catalog) ────────────────────────────────────────────────
  INSPECTIONS_INDEX:              'inspections.index',
  INSPECTIONS_SHOW:               'inspections.show',
  INSPECTIONS_CREATE:             'inspections.create',
  INSPECTIONS_UPDATE:             'inspections.update',
  INSPECTIONS_DESTROY:            'inspections.destroy',
  INSPECTIONS_CHECKLIST_TEMPLATES:'inspections.checklist_templates',

  // ── Canteen Inspections ──────────────────────────────────────────────────
  CANTEEN_INDEX:               'canteen_inspections.index',
  CANTEEN_SHOW:                'canteen_inspections.show',
  CANTEEN_CREATE:              'canteen_inspections.create',
  CANTEEN_UPDATE:              'canteen_inspections.update',
  CANTEEN_DESTROY:             'canteen_inspections.destroy',
  CANTEEN_REASSIGN_SUPERVISOR: 'canteen_inspections.reassign_supervisor',
  CANTEEN_REASSIGN_OFFICER:    'canteen_inspections.reassign_safety_officer',

  // ── Perform Canteen Inspections ──────────────────────────────────────────
  PERFORM_CANTEEN_INDEX:   'perform_canteen_inspections.index',
  PERFORM_CANTEEN_SHOW:    'perform_canteen_inspections.show',
  PERFORM_CANTEEN_CREATE:  'perform_canteen_inspections.create',
  PERFORM_CANTEEN_UPDATE:  'perform_canteen_inspections.update',
  PERFORM_CANTEEN_DESTROY: 'perform_canteen_inspections.destroy',
  PERFORM_CANTEEN_SIGN_OFF:'perform_canteen_inspections.sign_off',

  // ── Fuel Tank Inspections ────────────────────────────────────────────────
  FUEL_INDEX:               'fuel_tank_inspections.index',
  FUEL_SHOW:                'fuel_tank_inspections.show',
  FUEL_CREATE:              'fuel_tank_inspections.create',
  FUEL_UPDATE:              'fuel_tank_inspections.update',
  FUEL_DESTROY:             'fuel_tank_inspections.destroy',
  FUEL_REASSIGN_SUPERVISOR: 'fuel_tank_inspections.reassign_supervisor',
  FUEL_REASSIGN_OFFICER:    'fuel_tank_inspections.reassign_safety_officer',

  // ── Perform Fuel Tank Inspections ────────────────────────────────────────
  PERFORM_FUEL_INDEX:   'perform_fuel_tank_inspections.index',
  PERFORM_FUEL_SHOW:    'perform_fuel_tank_inspections.show',
  PERFORM_FUEL_CREATE:  'perform_fuel_tank_inspections.create',
  PERFORM_FUEL_UPDATE:  'perform_fuel_tank_inspections.update',
  PERFORM_FUEL_DESTROY: 'perform_fuel_tank_inspections.destroy',
  PERFORM_FUEL_SIGN_OFF:'perform_fuel_tank_inspections.sign_off',

  // ── Hand & Power Tools Inspections ───────────────────────────────────────
  TOOLS_INDEX:               'hand_power_tools_inspections.index',
  TOOLS_SHOW:                'hand_power_tools_inspections.show',
  TOOLS_CREATE:              'hand_power_tools_inspections.create',
  TOOLS_UPDATE:              'hand_power_tools_inspections.update',
  TOOLS_DESTROY:             'hand_power_tools_inspections.destroy',
  TOOLS_REASSIGN_SUPERVISOR: 'hand_power_tools_inspections.reassign_supervisor',
  TOOLS_REASSIGN_OFFICER:    'hand_power_tools_inspections.reassign_safety_officer',

  // ── Perform Hand & Power Tools Inspections ───────────────────────────────
  PERFORM_TOOLS_INDEX:   'perform_hand_power_tools_inspections.index',
  PERFORM_TOOLS_SHOW:    'perform_hand_power_tools_inspections.show',
  PERFORM_TOOLS_CREATE:  'perform_hand_power_tools_inspections.create',
  PERFORM_TOOLS_UPDATE:  'perform_hand_power_tools_inspections.update',
  PERFORM_TOOLS_DESTROY: 'perform_hand_power_tools_inspections.destroy',
  PERFORM_TOOLS_SIGN_OFF:'perform_hand_power_tools_inspections.sign_off',

  // ── PPE Inspections ──────────────────────────────────────────────────────
  PPE_INSP_INDEX:               'ppe_inspections.index',
  PPE_INSP_SHOW:                'ppe_inspections.show',
  PPE_INSP_CREATE:              'ppe_inspections.create',
  PPE_INSP_UPDATE:              'ppe_inspections.update',
  PPE_INSP_DESTROY:             'ppe_inspections.destroy',
  PPE_INSP_REASSIGN_SUPERVISOR: 'ppe_inspections.reassign_supervisor',
  PPE_INSP_REASSIGN_OFFICER:    'ppe_inspections.reassign_safety_officer',

  // ── Perform PPE Inspections ──────────────────────────────────────────────
  PERFORM_PPE_INDEX:   'perform_ppe_inspections.index',
  PERFORM_PPE_SHOW:    'perform_ppe_inspections.show',
  PERFORM_PPE_CREATE:  'perform_ppe_inspections.create',
  PERFORM_PPE_UPDATE:  'perform_ppe_inspections.update',
  PERFORM_PPE_DESTROY: 'perform_ppe_inspections.destroy',
  PERFORM_PPE_SIGN_OFF:'perform_ppe_inspections.sign_off',

  // ── Science Lab Inspections ──────────────────────────────────────────────
  SCILAB_INDEX:               'science_lab_inspections.index',
  SCILAB_SHOW:                'science_lab_inspections.show',
  SCILAB_CREATE:              'science_lab_inspections.create',
  SCILAB_UPDATE:              'science_lab_inspections.update',
  SCILAB_DESTROY:             'science_lab_inspections.destroy',
  SCILAB_REASSIGN_SUPERVISOR: 'science_lab_inspections.reassign_supervisor',
  SCILAB_REASSIGN_OFFICER:    'science_lab_inspections.reassign_safety_officer',

  // ── Perform Science Lab Inspections ─────────────────────────────────────
  PERFORM_SCILAB_INDEX:   'perform_science_lab_inspections.index',
  PERFORM_SCILAB_SHOW:    'perform_science_lab_inspections.show',
  PERFORM_SCILAB_CREATE:  'perform_science_lab_inspections.create',
  PERFORM_SCILAB_UPDATE:  'perform_science_lab_inspections.update',
  PERFORM_SCILAB_DESTROY: 'perform_science_lab_inspections.destroy',
  PERFORM_SCILAB_SIGN_OFF:'perform_science_lab_inspections.sign_off',

  // ── Swimming Pool Inspections ────────────────────────────────────────────
  SWIM_INDEX:               'swimming_pool_inspections.index',
  SWIM_SHOW:                'swimming_pool_inspections.show',
  SWIM_CREATE:              'swimming_pool_inspections.create',
  SWIM_UPDATE:              'swimming_pool_inspections.update',
  SWIM_DESTROY:             'swimming_pool_inspections.destroy',
  SWIM_REASSIGN_SUPERVISOR: 'swimming_pool_inspections.reassign_supervisor',
  SWIM_REASSIGN_OFFICER:    'swimming_pool_inspections.reassign_safety_officer',

  // ── Perform Swimming Pool Inspections ────────────────────────────────────
  PERFORM_SWIM_INDEX:   'perform_swimming_pool_inspections.index',
  PERFORM_SWIM_SHOW:    'perform_swimming_pool_inspections.show',
  PERFORM_SWIM_CREATE:  'perform_swimming_pool_inspections.create',
  PERFORM_SWIM_UPDATE:  'perform_swimming_pool_inspections.update',
  PERFORM_SWIM_DESTROY: 'perform_swimming_pool_inspections.destroy',
  PERFORM_SWIM_SIGN_OFF:'perform_swimming_pool_inspections.sign_off',

  // ── Vehicle Inspections ──────────────────────────────────────────────────
  VEHICLE_INDEX:               'vehicle_inspections.index',
  VEHICLE_SHOW:                'vehicle_inspections.show',
  VEHICLE_CREATE:              'vehicle_inspections.create',
  VEHICLE_UPDATE:              'vehicle_inspections.update',
  VEHICLE_DESTROY:             'vehicle_inspections.destroy',
  VEHICLE_REASSIGN_SUPERVISOR: 'vehicle_inspections.reassign_supervisor',
  VEHICLE_REASSIGN_OFFICER:    'vehicle_inspections.reassign_safety_officer',

  // ── Perform Vehicle Inspections ──────────────────────────────────────────
  PERFORM_VEHICLE_INDEX:   'perform_vehicle_inspections.index',
  PERFORM_VEHICLE_SHOW:    'perform_vehicle_inspections.show',
  PERFORM_VEHICLE_CREATE:  'perform_vehicle_inspections.create',
  PERFORM_VEHICLE_UPDATE:  'perform_vehicle_inspections.update',
  PERFORM_VEHICLE_DESTROY: 'perform_vehicle_inspections.destroy',
  PERFORM_VEHICLE_SIGN_OFF:'perform_vehicle_inspections.sign_off',

  // ── Hazard Reports ───────────────────────────────────────────────────────
  HAZARD_INDEX:   'hazard_reports.index',
  HAZARD_SHOW:    'hazard_reports.show',
  HAZARD_CREATE:  'hazard_reports.create',
  HAZARD_UPDATE:  'hazard_reports.update',
  HAZARD_DESTROY: 'hazard_reports.destroy',

  // ── Incident Notifications ───────────────────────────────────────────────
  INCIDENT_INDEX:             'incident_notifications.index',
  INCIDENT_SHOW:              'incident_notifications.show',
  INCIDENT_CREATE:            'incident_notifications.create',
  INCIDENT_UPDATE:            'incident_notifications.update',
  INCIDENT_DESTROY:           'incident_notifications.destroy',
  INCIDENT_ASSIGN_OFFICERS:   'incident_notifications.assign_safety_officers',
  INCIDENT_ASSIGN_SUPERVISORS:'incident_notifications.assign_supervisors',

  // ── Witness Statements ───────────────────────────────────────────────────
  WITNESS_INDEX:   'witness_statements.index',
  WITNESS_SHOW:    'witness_statements.show',
  WITNESS_CREATE:  'witness_statements.create',
  WITNESS_UPDATE:  'witness_statements.update',
  WITNESS_DESTROY: 'witness_statements.destroy',

  // ── Risk Assessments ─────────────────────────────────────────────────────
  RISK_INDEX:   'risk_assessments.index',
  RISK_SHOW:    'risk_assessments.show',
  RISK_CREATE:  'risk_assessments.create',
  RISK_UPDATE:  'risk_assessments.update',
  RISK_DESTROY: 'risk_assessments.destroy',

  // ── HSA Checklists ───────────────────────────────────────────────────────
  HSA_CHECKLISTS_INDEX:            'health_and_safety_audit_checklists.index',
  HSA_CHECKLISTS_SHOW:             'health_and_safety_audit_checklists.show',
  HSA_CHECKLISTS_CREATE:           'health_and_safety_audit_checklists.create',
  HSA_CHECKLISTS_UPDATE:           'health_and_safety_audit_checklists.update',
  HSA_CHECKLISTS_DESTROY:          'health_and_safety_audit_checklists.destroy',
  HSA_CHECKLISTS_PERFORM:          'health_and_safety_audit_checklists.perform',
  HSA_CHECKLISTS_ASSIGN_AUDITORS:  'health_and_safety_audit_checklists.assign_auditors',
  HSA_CHECKLISTS_REASSIGN_AUDITORS:'health_and_safety_audit_checklists.reassign_auditors',

  // ── CAPA Trackings ───────────────────────────────────────────────────────
  CAPA_INDEX:            'capa_trackings.index',
  CAPA_SHOW:             'capa_trackings.show',
  CAPA_CREATE:           'capa_trackings.create',
  CAPA_UPDATE:           'capa_trackings.update',
  CAPA_DESTROY:          'capa_trackings.destroy',
  CAPA_PERFORM:          'capa_trackings.perform',
  CAPA_ASSIGN_AUDITORS:  'capa_trackings.assign_auditors',
  CAPA_REASSIGN_AUDITORS:'capa_trackings.reassign_auditors',
};
