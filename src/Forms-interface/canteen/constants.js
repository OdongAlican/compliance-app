/* ── Canteen Inspection — shared constants ─────────────────────────────── */

export const STATUS_STYLE = {
  Pending: { background: "color-mix(in srgb,#f85149 15%,transparent)", color: "#f85149" },
  "In Progress": { background: "color-mix(in srgb,#d29922 15%,transparent)", color: "#d29922" },
  Completed: { background: "color-mix(in srgb,#3fb950 15%,transparent)", color: "#3fb950" },
  Approved: { background: "color-mix(in srgb,#58a6ff 15%,transparent)", color: "#58a6ff" },
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

export const TABLE_COLS = [
  "#",
  "Name",
  "Location",
  "Date",
  "Time",
  "Safety Officer",
  "Supervisor",
  "Status",
  "",
];
