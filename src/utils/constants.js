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
  PPE_COMP:    '/form/ppe-com',
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
};
