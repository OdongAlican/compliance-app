import { useState } from "react";
import {
  XMarkIcon,
  ClipboardDocumentCheckIcon,
  CheckCircleIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";

const TABS = ["General House Keeping", "Issues Identified"];

const labelStyle = {
  fontSize: "11px", fontWeight: 600, textTransform: "uppercase",
  letterSpacing: "0.05em", color: "var(--text-muted)", marginBottom: "2px",
};
const valStyle = { fontSize: "14px", color: "var(--text)", fontWeight: 500 };

function InfoGrid({ items }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {items.map(({ label, value }) => (
        <div key={label} className="rounded-lg p-3"
          style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
          <div style={labelStyle}>{label}</div>
          <div style={valStyle}>{value || "—"}</div>
        </div>
      ))}
    </div>
  );
  
}

function ChecklistTable({ checklist }) {
  return (
    <div className="overflow-x-auto rounded-lg" style={{ border: "1px solid var(--border)" }}>
      <table className="min-w-full">
        <thead>
          <tr style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-raised)" }}>
            {["Item", "Result", "N/A", "Comments", "Inspected By"].map(h => (
              <th key={h} className="ui-th text-left">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {checklist?.length ? checklist.map((item, i) => (
            <tr key={i} className="ui-row" style={{ borderBottom: "1px solid var(--border)" }}>
              <td className="ui-td text-sm">{item.label || "N/A"}</td>
              <td className="ui-td">{item.checked ? <CheckCircleIcon className="w-4 h-4" style={{ color: "var(--success)" }} /> : ""}</td>
              <td className="ui-td text-xs" style={{ color: "var(--text-muted)" }}>{item.na ? "N/A" : ""}</td>
              <td className="ui-td text-sm" style={{ color: "var(--text-muted)" }}>{item.comments || "—"}</td>
              <td className="ui-td text-sm" style={{ color: "var(--text-muted)" }}>{item.inspector || "—"}</td>
            </tr>
          )) : (
            <tr>
              <td colSpan={5} className="py-10 text-center text-sm" style={{ color: "var(--text-muted)" }}>No checklist items available.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function IssuesTable({ issues }) {
  const PC = { High: "#f85149", Medium: "#d29922", Low: "#3fb950", Urgent: "#ff7b72" };
  return (
    <div className="overflow-x-auto rounded-lg" style={{ border: "1px solid var(--border)" }}>
      <table className="min-w-full">
        <thead>
          <tr style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-raised)" }}>
            {["Issue", "Corrective Action", "Responsible", "Status", "Priority", "Due Date"].map(h => (
              <th key={h} className="ui-th text-left">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {issues?.length ? issues.map((issue, i) => (
            <tr key={i} className="ui-row" style={{ borderBottom: "1px solid var(--border)" }}>
              <td className="ui-td text-sm">{issue.issue || "N/A"}</td>
              <td className="ui-td text-sm" style={{ color: "var(--text-muted)" }}>{issue.action || "N/A"}</td>
              <td className="ui-td text-sm" style={{ color: "var(--text-muted)" }}>{issue.responsible || "N/A"}</td>
              <td className="ui-td text-sm" style={{ color: "var(--text-muted)" }}>{issue.status || "N/A"}</td>
              <td className="ui-td">
                {issue.priority && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold"
                    style={{ background: `color-mix(in srgb, ${PC[issue.priority] || "#8b949e"} 15%, transparent)`, color: PC[issue.priority] || "var(--text-muted)" }}>
                    {issue.priority}
                  </span>
                )}
              </td>
              <td className="ui-td text-sm" style={{ color: "var(--text-muted)" }}>{issue.dueDate || "—"}</td>
            </tr>
          )) : (
            <tr>
              <td colSpan={6} className="py-10 text-center text-sm" style={{ color: "var(--text-muted)" }}>No issues identified.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

const STATUS_MAP = {
  Pending: { bg: "color-mix(in srgb,#f85149 15%,transparent)", fg: "#f85149" },
  "In Progress": { bg: "color-mix(in srgb,#d29922 15%,transparent)", fg: "#d29922" },
  Completed: { bg: "color-mix(in srgb,#3fb950 15%,transparent)", fg: "#3fb950" },
  Approved: { bg: "color-mix(in srgb,#58a6ff 15%,transparent)", fg: "#58a6ff" },
};

export default function CanteenExecute({ inspection, onClose }) {
  const [activeTab, setActiveTab] = useState(TABS[0]);

  if (!inspection) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}>
        <div className="rounded-2xl p-6 max-w-sm w-full text-center"
          style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}>
          <XCircleIcon className="w-10 h-10 mx-auto mb-3" style={{ color: "var(--danger)" }} />
          <p className="font-semibold" style={{ color: "var(--text)" }}>Inspection not found.</p>
          <button onClick={onClose}
            className="mt-4 px-5 py-2 rounded-full text-sm font-medium text-white"
            style={{ background: "var(--accent)" }}>
            Close
          </button>
        </div>
      </div>
    );
  }

  const st = STATUS_MAP[inspection.status] || { bg: "var(--bg-raised)", fg: "var(--text-muted)" };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}>
      <div className="w-full max-w-5xl max-h-[92vh] overflow-hidden rounded-2xl flex flex-col"
        style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", boxShadow: "var(--shadow-lg)" }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 flex-shrink-0"
          style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-raised)" }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: "color-mix(in srgb,var(--accent) 15%,transparent)" }}>
              <ClipboardDocumentCheckIcon className="w-5 h-5" style={{ color: "var(--accent)" }} />
            </div>
            <div>
              <h2 className="text-base font-bold" style={{ color: "var(--text)" }}>
                {inspection.schoolname || "Canteen Inspection"}
              </h2>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>ID #{inspection.id}</span>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold"
                  style={{ background: st.bg, color: st.fg }}>
                  {inspection.status}
                </span>
              </div>
            </div>
          </div>
          <button onClick={onClose}
            className="p-2 rounded-lg transition-colors hover:opacity-70"
            style={{ color: "var(--text-muted)" }}>
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <InfoGrid items={[
            { label: "School / Canteen", value: inspection.schoolname },
            { label: "Location", value: inspection.location },
            { label: "Date of Inspection", value: inspection.dateofinspection },
            { label: "Time", value: inspection.time },
            { label: "Safety Officer", value: inspection.safetyofficer || (Array.isArray(inspection.officers) ? inspection.officers.join(", ") : null) },
            { label: "Supervisor", value: inspection.supervisor },
          ]} />

          {/* Tab switcher */}
          <div>
            <div className="flex gap-1 mb-4 p-1 rounded-lg w-fit"
              style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
              {TABS.map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className="px-4 py-2 rounded-md text-sm font-medium transition-all"
                  style={activeTab === tab
                    ? { background: "var(--bg-raised)", color: "var(--text)", boxShadow: "var(--shadow)" }
                    : { color: "var(--text-muted)" }}>
                  {tab}
                </button>
              ))}
            </div>
            {activeTab === TABS[0]
              ? <ChecklistTable checklist={inspection.checklist} />
              : <IssuesTable issues={inspection.issues} />
            }
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 flex-shrink-0"
          style={{ borderTop: "1px solid var(--border)", background: "var(--bg-raised)" }}>
          <button onClick={onClose}
            className="px-4 py-2 rounded-full text-sm font-medium"
            style={{ border: "1px solid var(--border)", color: "var(--text-muted)", background: "var(--bg)" }}>
            Close
          </button>
          <button className="px-4 py-2 rounded-full text-sm font-medium text-white"
            style={{ background: "var(--danger)" }}>Reject</button>
          <button className="px-4 py-2 rounded-full text-sm font-medium text-white"
            style={{ background: "var(--success)" }}>Approve</button>
          <button className="px-4 py-2 rounded-full text-sm font-medium text-white"
            style={{ background: "var(--accent)" }}>Print Report</button>
        </div>
      </div>
    </div>
  );
}
