/* ── Fuel Tank Inspection — constants ───────────────────────────────── */

export const STATUS_STYLE = {
  Pending: {
    background: "color-mix(in srgb,#d29922 12%,transparent)",
    color: "#d29922",
  },
  "In Progress": {
    background: "color-mix(in srgb,var(--accent) 12%,transparent)",
    color: "var(--accent)",
  },
  Completed: {
    background: "color-mix(in srgb,#3fb950 12%,transparent)",
    color: "#3fb950",
  },
  Cancelled: {
    background: "color-mix(in srgb,var(--danger) 12%,transparent)",
    color: "var(--danger)",
  },
};

export const CHECKLIST_STATUS_OPTIONS = [
  {
    value: "satisfactory",
    label: "Satisfactory",
    bg: "color-mix(in srgb,#3fb950 15%,transparent)",
    color: "#3fb950",
    border: "color-mix(in srgb,#3fb950 40%,transparent)",
  },
  {
    value: "needs_attention",
    label: "Needs Attention",
    bg: "color-mix(in srgb,#d29922 15%,transparent)",
    color: "#d29922",
    border: "color-mix(in srgb,#d29922 40%,transparent)",
  },
  {
    value: "not_applicable",
    label: "N/A",
    bg: "var(--bg-raised)",
    color: "var(--text-muted)",
    border: "var(--border)",
  },
];

export const FUEL_TYPE_OPTIONS = [
  "Diesel",
  "Petrol",
  "Kerosene",
  "Aviation Fuel",
  "LPG",
  "Other",
];

export const STEP_LABELS = ["Basic Info", "Safety Officer", "Supervisor", "Review"];

export const TABLE_COLS = [
  "#",
  "Tank ID",
  "Location",
  "Fuel Type",
  "Date",
  "Safety Officer",
  "Supervisor",
  "Status",
  "",
];
