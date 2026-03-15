/**
 * approvedStaffIds.js
 *
 * Pre-approved Staff ID register — simulates an export from the HR master list.
 * In production this would be fetched from an HR integration endpoint.
 * A Staff ID must appear in this list AND be unique in the system before a user
 * account can be created for it.
 *
 * Fields:
 *   id         string  — exact Staff ID (must match user.staff_id submitted to API)
 *   name       string  — full name on HR record (hint only; user can differ if a
 *                        preferred name is used)
 *   department string  — organisational unit from HR
 *   position   string  — job title / position
 *   active     boolean — false = ID retired / terminated (blocks creation)
 */

const APPROVED_STAFF_IDS = [
  { id: 'STAFF001', name: 'Alice Johnson',    department: 'Management',       position: 'Managing Director',          active: true  },
  { id: 'STAFF002', name: 'Robert Mensah',    department: 'Operations',       position: 'Operations Manager',         active: true  },
  { id: 'STAFF003', name: 'Carol White',      department: 'Safety',           position: 'HSE Manager',                active: true  },
  { id: 'STAFF004', name: 'David Brown',      department: 'Operations',       position: 'Line Supervisor',            active: true  },
  { id: 'STAFF005', name: 'Emma Davis',       department: 'Maintenance',      position: 'Maintenance Technician',     active: true  },
  { id: 'STAFF006', name: 'Frank Miller',     department: 'Compliance',       position: 'Compliance Auditor',         active: true  },
  { id: 'STAFF007', name: 'Grace Lee',        department: 'Management',       position: 'HR Director',                active: true  },
  { id: 'STAFF008', name: 'Henry Asante',     department: 'Engineering',      position: 'Senior Engineer',            active: true  },
  { id: 'STAFF009', name: 'Irene Boateng',   department: 'Finance',          position: 'Finance Officer',            active: true  },
  { id: 'STAFF010', name: 'James Osei',       department: 'IT',               position: 'Systems Administrator',      active: true  },
  { id: 'STAFF011', name: 'Karen Acheampong', department: 'Safety',           position: 'Safety Officer',             active: true  },
  { id: 'STAFF012', name: 'Lionel Owusu',     department: 'Operations',       position: 'Field Technician',           active: true  },
  { id: 'STAFF013', name: 'Mary Adjei',       department: 'Administration',   position: 'Administrative Assistant',   active: true  },
  { id: 'STAFF014', name: 'Nathan Quaye',     department: 'Engineering',      position: 'Mechanical Engineer',        active: true  },
  { id: 'STAFF015', name: 'Olivia Darko',     department: 'Procurement',      position: 'Procurement Officer',        active: true  },
  { id: 'STAFF016', name: 'Paul Amegah',      department: 'Management',       position: 'Chief Compliance Officer',   active: true  },
  { id: 'STAFF017', name: 'Quinn Ebo',        department: 'Safety',           position: 'Fire Safety Warden',         active: true  },
  { id: 'STAFF018', name: 'Ruth Sarpong',     department: 'Legal',            position: 'Legal Counsel',              active: true  },
  { id: 'STAFF019', name: 'Samuel Tetteh',    department: 'Logistics',        position: 'Logistics Coordinator',      active: true  },
  { id: 'STAFF020', name: 'Theresa Kumi',     department: 'Training',         position: 'Training & Development Lead',active: true  },
  { id: 'STAFF021', name: 'Usman Armah',      department: 'Security',         position: 'Security Supervisor',        active: true  },
  { id: 'STAFF022', name: 'Vera Opoku',       department: 'IT',               position: 'IT Support Specialist',      active: true  },
  { id: 'STAFF023', name: 'William Fiagbe',   department: 'Engineering',      position: 'Electrical Engineer',        active: true  },
  { id: 'STAFF024', name: 'Xena Adu',         department: 'Quality',          position: 'Quality Assurance Analyst',  active: true  },
  { id: 'STAFF025', name: 'Yaw Antwi',        department: 'Operations',       position: 'Production Supervisor',      active: true  },
  { id: 'STAFF026', name: 'Zoe Mensah',       department: 'Finance',          position: 'Management Accountant',      active: true  },
  { id: 'STAFF027', name: 'Aba Frimpong',     department: 'Safety',           position: 'Industrial Hygienist',       active: true  },
  { id: 'STAFF028', name: 'Baffour Oti',      department: 'Compliance',       position: 'Risk Analyst',               active: true  },
  { id: 'STAFF029', name: 'Cecilia Nyarko',   department: 'Administration',   position: 'Records Officer',            active: true  },
  // Retired / terminated — blocks creation
  { id: 'STAFF030', name: 'Derek Hutchinson', department: 'Operations',       position: 'Former Technician',          active: false },
];

export default APPROVED_STAFF_IDS;

/**
 * Lookup a single entry by staff ID (case-insensitive).
 * Returns the record or null.
 */
export const findApprovedStaffId = (staffId) => {
  if (!staffId) return null;
  return APPROVED_STAFF_IDS.find(
    (entry) => entry.id.toLowerCase() === staffId.trim().toLowerCase()
  ) ?? null;
};
