export const STATUS_STYLE = {
  Pending: {
    background: "color-mix(in srgb,#f85149 15%,transparent)",
    color: "#f85149",
  },
  "In Progress": {
    background: "color-mix(in srgb,#d29922 15%,transparent)",
    color: "#d29922",
  },
  Completed: {
    background: "color-mix(in srgb,#3fb950 15%,transparent)",
    color: "#3fb950",
  },
  Approved: {
    background: "color-mix(in srgb,#58a6ff 15%,transparent)",
    color: "#58a6ff",
  },
};

export const STEP_LABELS = ["Basic Info", "Safety Officer", "Supervisor", "Review"];

export const CHECKLIST_STATUS_OPTIONS = [
  {
    value: "satisfactory",
    label: "Satisfactory",
    color: "#3fb950",
    bg: "color-mix(in srgb,#3fb950 15%,transparent)",
    border: "color-mix(in srgb,#3fb950 40%,transparent)",
  },
  {
    value: "needs_attention",
    label: "Needs Attention",
    color: "#d29922",
    bg: "color-mix(in srgb,#d29922 15%,transparent)",
    border: "color-mix(in srgb,#d29922 40%,transparent)",
  },
  {
    value: "not_applicable",
    label: "N/A",
    color: "var(--text-muted)",
    bg: "var(--bg-raised)",
    border: "var(--border)",
  },
];

export const PRIORITY_OPTIONS = ["low", "medium", "high"];

export const PRIORITY_COLOR = {
  low: {
    bg: "color-mix(in srgb,#3fb950 12%,transparent)",
    text: "#3fb950",
  },
  medium: {
    bg: "color-mix(in srgb,#d29922 12%,transparent)",
    text: "#d29922",
  },
  high: {
    bg: "color-mix(in srgb,#e36209 12%,transparent)",
    text: "#e36209",
  },
};

export const REPAIR_STATUS_COLOR = {
  pending: {
    bg: "color-mix(in srgb,#d29922 12%,transparent)",
    text: "#d29922",
  },
  approved: {
    bg: "color-mix(in srgb,#3fb950 12%,transparent)",
    text: "#3fb950",
  },
  rejected: {
    bg: "color-mix(in srgb,var(--danger) 12%,transparent)",
    text: "var(--danger)",
  },
};

export const TABLE_COLS = [
  "#",
  "Vehicle ID",
  "Model",
  "Odometer",
  "Date",
  "Time",
  "Safety Officer",
  "Supervisor",
  "Status",
  "",
];
