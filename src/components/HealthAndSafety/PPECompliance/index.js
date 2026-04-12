/**
 * Health & Safety Audit — PPE Compliance Module
 *
 * Fully dynamic perform: no template management; checklist items are
 * free-text entries created at perform time (label + status + comment).
 * Setup record has extra fields: objective_of_audit, scope_of_audit.
 * Perform item statuses: compliant | partial | non_compliant.
 * Accent colour: purple (#8b5cf6).
 */

import React, { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import toast from "react-hot-toast";
import {
  ShieldCheckIcon,
  PlusIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
  PencilSquareIcon,
  TrashIcon,
  EyeIcon,
  PlayIcon,
  UsersIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  PaperClipIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  CalendarDaysIcon,
  CheckBadgeIcon,
  WrenchScrewdriverIcon,
  EllipsisVerticalIcon,
  ClipboardDocumentListIcon,
  XCircleIcon,
  UserGroupIcon,
  InformationCircleIcon,
  ChartBarIcon,
  ClipboardDocumentCheckIcon,
} from "@heroicons/react/24/outline";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import {
  fetchPpeComplianceCatalog,
  fetchPpeComplianceRecords,
  createPpeComplianceRecord,
  updatePpeComplianceRecord,
  deletePpeComplianceRecord,
  reassignPpeComplianceAuditors,
  performPpeComplianceRecord,
  fetchPpeComplianceIssues,
  updatePpeComplianceCorrectiveAction,
  updatePpeCompliancePriorityDueDate,
  assignPpeComplianceContractor,
  executePpeComplianceIssue,
  setPpeCompliancePage,
  setPpeComplianceAuditNumber,
  setPpeComplianceAreaAudited,
  setPpeComplianceDateFilter,
  setPpeComplianceStatusFilter,
  clearPpeComplianceFilters,
  clearPpeComplianceRecordsError,
  clearPpeComplianceActionError,
  selectPpeComplianceCatalog,
  selectPpeComplianceCatalogLoading,
  selectPpeComplianceRecords,
  selectPpeComplianceRecordsMeta,
  selectPpeComplianceRecordsLoading,
  selectPpeComplianceRecordsError,
  selectPpeComplianceActionLoading,
  selectPpeComplianceFilters,
  selectPpeComplianceIssuesByPerformed,
  selectPpeComplianceActionError,
} from "../../../store/slices/ppeComplianceSlice";
import useAuth from "../../../hooks/useAuth";
import UsersService from "../../../services/users.service";

// ─── Constants ────────────────────────────────────────────────────────────────

const PPE_COMPLIANCE_AUDIT_TITLE = "PPE Compliance";
const ACCENT       = "#8b5cf6";              // violet-500
const ACCENT_DARK  = "#6d28d9";              // violet-700
const ACCENT_DEEP  = "#4c1d95";              // violet-900
const ACCENT_MID   = "rgba(139,92,246,0.18)"; // medium bg
const ACCENT_LIGHT = "rgba(139,92,246,0.10)"; // subtle bg

const STATUS_STYLES = {
  active:      { bg: "rgba(22,163,74,.12)",   color: "#16a34a", label: "Active" },
  in_progress: { bg: "rgba(245,158,11,.12)",  color: "#f59e0b", label: "In Progress" },
  completed:   { bg: "rgba(59,130,246,.12)",  color: "#3b82f6", label: "Completed" },
  closed:      { bg: "rgba(107,114,128,.12)", color: "#6b7280", label: "Closed" },
  pending:     { bg: "rgba(245,158,11,.12)",  color: "#f59e0b", label: "Pending" },
};

const PRIORITY_STYLES = {
  low:      { bg: "rgba(22,163,74,.12)",   color: "#16a34a", label: "Low" },
  medium:   { bg: "rgba(245,158,11,.12)",  color: "#f59e0b", label: "Medium" },
  high:     { bg: "rgba(249,115,22,.12)",  color: "#f97316", label: "High" },
  critical: { bg: "rgba(239,68,68,.12)",   color: "#ef4444", label: "Critical" },
};

const PPE_STATUSES     = ["active", "in_progress", "completed", "closed", "pending"];
const PRIORITY_LEVELS  = ["low", "medium", "high", "critical"];

const PERFORM_STATUSES = ["compliant", "partial", "non_compliant"];
const PERFORM_STATUS_LABELS = {
  compliant:     "Compliant",
  partial:       "Partial",
  non_compliant: "Non-Compliant",
};

// ─── Utilities ────────────────────────────────────────────────────────────────

function displayName(u) {
  if (!u) return "—";
  const first = u.firstname || u.first_name || "";
  const last  = u.lastname  || u.last_name  || "";
  return [first, last].filter(Boolean).join(" ") || u.email || u.username || "—";
}

function formatDate(d) {
  if (!d) return "—";
  try { return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }); }
  catch { return d; }
}

function initials(name) {
  if (!name || name === "—") return "?";
  return name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
}

// ─── Shared UI Primitives ─────────────────────────────────────────────────────

function Spinner({ size = 5 }) {
  return (
    <svg className={`animate-spin h-${size} w-${size}`} style={{ color: ACCENT }}
      xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

function Field({ label, required, error, children }) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
          {label}{required && <span style={{ color: "#ef4444" }}> *</span>}
        </label>
      )}
      {children}
      {error && <p className="text-[11px]" style={{ color: "#ef4444" }}>{error}</p>}
    </div>
  );
}

function ModalShell({ isOpen, onClose, title, width = "max-w-xl", children }) {
  if (!isOpen) return null;
  return createPortal(
    <div className="fixed inset-0 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.6)", zIndex: 10000, backdropFilter: "blur(4px)" }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={`w-full ${width} flex flex-col rounded-2xl overflow-hidden`}
        style={{ background: "var(--bg-surface)", boxShadow: "0 25px 60px rgba(0,0,0,0.3)", maxHeight: "90vh", zIndex: 10001 }}>
        <div className="flex items-center justify-between px-6 py-4 flex-shrink-0"
          style={{ borderBottom: "1px solid var(--border)" }}>
          <h2 className="text-base font-bold" style={{ color: "var(--text)" }}>{title}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:opacity-70"
            style={{ color: "var(--text-muted)" }}>
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body
  );
}

function StatusBadge({ status }) {
  const s = STATUS_STYLES[status] || { bg: "rgba(107,114,128,.12)", color: "#6b7280", label: status || "—" };
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold"
      style={{ background: s.bg, color: s.color }}>
      {s.label}
    </span>
  );
}

function PriorityBadge({ priority }) {
  const p = PRIORITY_STYLES[priority] || { bg: "rgba(107,114,128,.12)", color: "#6b7280", label: priority || "—" };
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold"
      style={{ background: p.bg, color: p.color }}>
      {p.label}
    </span>
  );
}

function DeleteConfirmModal({ isOpen, onClose, onConfirm, loading, name }) {
  if (!isOpen) return null;
  return createPortal(
    <div className="fixed inset-0 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.6)", zIndex: 10001, backdropFilter: "blur(4px)" }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-sm rounded-2xl overflow-hidden flex flex-col"
        style={{ background: "var(--bg-surface)", boxShadow: "0 25px 60px rgba(0,0,0,0.35), 0 0 0 1px var(--border)" }}>
        <div className="h-1 w-full" style={{ background: "linear-gradient(90deg, #ef4444, #dc2626)" }} />
        <div className="p-6 flex flex-col items-center gap-5 text-center">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}>
              <TrashIcon className="h-8 w-8" style={{ color: "#ef4444" }} />
            </div>
            <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center"
              style={{ background: "#ef4444", border: "2px solid var(--bg-surface)" }}>
              <ExclamationTriangleIcon className="h-3 w-3 text-white" />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <h3 className="text-base font-bold" style={{ color: "var(--text)" }}>Delete Record?</h3>
            <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
              This will permanently remove{" "}
              <span className="font-semibold px-1.5 py-0.5 rounded-md"
                style={{ background: "rgba(239,68,68,0.08)", color: "#ef4444" }}>
                {name ? `#${name}` : "this record"}
              </span>
              {" "}and all associated audits and issues.
            </p>
            <p className="text-xs font-semibold" style={{ color: "rgba(239,68,68,0.8)" }}>
              This action cannot be undone.
            </p>
          </div>
          <div className="w-full h-px" style={{ background: "var(--border)" }} />
          <div className="flex gap-3 w-full">
            <button onClick={onClose} disabled={loading}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold hover:opacity-80 transition-opacity"
              style={{ background: "var(--bg-raised)", border: "1px solid var(--border)", color: "var(--text)" }}>
              Keep it
            </button>
            <button onClick={onConfirm} disabled={loading}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-60"
              style={{ background: "#ef4444", color: "#fff" }}>
              {loading ? <><Spinner size={3} /> Deleting…</> : <><TrashIcon className="h-4 w-4" /> Yes, delete</>}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ─── Auditor Picker ───────────────────────────────────────────────────────────

function AuditorPicker({ selected, onToggle, label = "Assign Auditors" }) {
  const [query,     setQuery]     = useState("");
  const [results,   setResults]   = useState([]);
  const [searching, setSearching] = useState(false);
  const timer = useRef(null);
  const selectedIds = selected.map((u) => u.id);

  useEffect(() => {
    clearTimeout(timer.current);
    if (!query.trim()) { setResults([]); return; }
    timer.current = setTimeout(() => {
      setSearching(true);
      UsersService.list({
        "q[firstname_or_lastname_or_email_cont]": query,
        "filter[role]": "auditor",
        per_page: 20,
      })
        .then((res) => {
          const body = res.data ?? {};
          const data = Array.isArray(body.data) ? body.data : Array.isArray(body) ? body : [];
          setResults(data);
        })
        .catch(() => {})
        .finally(() => setSearching(false));
    }, 350);
  }, [query]);

  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>{label}</label>
      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "var(--text-muted)" }} />
        <input value={query} onChange={(e) => setQuery(e.target.value)}
          placeholder="Search auditors by name or email…"
          className="ui-input text-sm pl-9 w-full" />
        {searching && <div className="absolute right-3 top-1/2 -translate-y-1/2"><Spinner size={3} /></div>}
      </div>
      {results.length > 0 && (
        <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
          {results.map((u) => {
            const checked = selectedIds.includes(u.id);
            return (
              <button key={u.id} onClick={() => onToggle(u)}
                className="w-full flex items-center gap-3 px-3 py-2.5 hover:opacity-80 transition-opacity text-left"
                style={{ borderBottom: "1px solid var(--border)", background: checked ? ACCENT_LIGHT : "var(--bg-raised)" }}>
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                  style={{ background: checked ? ACCENT : "var(--bg-surface)", color: checked ? "#fff" : "var(--text-muted)", border: "1px solid var(--border)" }}>
                  {initials(displayName(u))}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold truncate" style={{ color: "var(--text)" }}>{displayName(u)}</p>
                  {u.email && <p className="text-[11px] truncate" style={{ color: "var(--text-muted)" }}>{u.email}</p>}
                </div>
                {checked && <CheckCircleIcon className="h-4 w-4 flex-shrink-0" style={{ color: ACCENT }} />}
              </button>
            );
          })}
        </div>
      )}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-1">
          {selected.map((u) => (
            <span key={u.id}
              className="flex items-center gap-1.5 pl-1 pr-2 py-0.5 rounded-full text-[11px] font-semibold"
              style={{ background: ACCENT_LIGHT, color: ACCENT, border: `1px solid ${ACCENT}30` }}>
              <span className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black text-white flex-shrink-0"
                style={{ background: ACCENT }}>
                {initials(displayName(u))}
              </span>
              {displayName(u)}
              <button onClick={() => onToggle(u)} className="hover:opacity-70 flex-shrink-0">
                <XMarkIcon className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Contractor Picker ────────────────────────────────────────────────────────

function ContractorPicker({ onSelect }) {
  const [query,     setQuery]     = useState("");
  const [results,   setResults]   = useState([]);
  const [searching, setSearching] = useState(false);
  const timer = useRef(null);

  useEffect(() => {
    clearTimeout(timer.current);
    if (!query.trim()) { setResults([]); return; }
    timer.current = setTimeout(() => {
      setSearching(true);
      UsersService.list({
        "q[firstname_or_lastname_or_email_cont]": query,
        per_page: 20,
      })
        .then((res) => {
          const body = res.data ?? {};
          const data = Array.isArray(body.data) ? body.data : Array.isArray(body) ? body : [];
          setResults(data);
        })
        .catch(() => {})
        .finally(() => setSearching(false));
    }, 350);
  }, [query]);

  return (
    <div className="flex flex-col gap-2">
      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "var(--text-muted)" }} />
        <input value={query} onChange={(e) => setQuery(e.target.value)}
          placeholder="Search contractors…"
          className="ui-input text-sm pl-9 w-full" />
        {searching && <div className="absolute right-3 top-1/2 -translate-y-1/2"><Spinner size={3} /></div>}
      </div>
      {results.length > 0 && (
        <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
          {results.map((u) => (
            <button key={u.id} onClick={() => { onSelect(u); setQuery(""); setResults([]); }}
              className="w-full flex items-center gap-3 px-3 py-2.5 hover:opacity-80 transition-opacity text-left"
              style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-raised)" }}>
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                style={{ background: "var(--bg-surface)", color: "var(--text-muted)", border: "1px solid var(--border)" }}>
                {initials(displayName(u))}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold truncate" style={{ color: "var(--text)" }}>{displayName(u)}</p>
                {u.email && <p className="text-[11px] truncate" style={{ color: "var(--text-muted)" }}>{u.email}</p>}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── PPE Compliance Issue Card ────────────────────────────────────────────────

function PpeComplianceIssueCard({ issue: initialIssue, auditId, performedId }) {
  const dispatch      = useAppDispatch();
  const actionLoading = useAppSelector(selectPpeComplianceActionLoading);

  const [issue,    setIssue]    = useState(initialIssue);
  const [expanded, setExpanded] = useState(false);

  const [caOpen,  setCaOpen]  = useState(false);
  const [caText,  setCaText]  = useState(issue.corrective_action || "");

  const [pdOpen,   setPdOpen]   = useState(false);
  const [priority, setPriority] = useState(issue.priority_level || "medium");
  const [dueDate,  setDueDate]  = useState(issue.due_date ? issue.due_date.slice(0, 10) : "");

  const [acOpen,      setAcOpen]      = useState(false);
  const [contractor,  setContractor]  = useState(issue.contractor || null);

  const [exOpen,    setExOpen]    = useState(false);
  const [compDate,  setCompDate]  = useState("");
  const [compNotes, setCompNotes] = useState("");
  const [compFile,  setCompFile]  = useState(null);

  const isExecuted = !!issue.completion_date;

  async function handleSaveCA() {
    if (!caText.trim()) return;
    const r = await dispatch(updatePpeComplianceCorrectiveAction({ auditId, performedId, issueId: issue.id, correctiveAction: caText.trim() }));
    if (updatePpeComplianceCorrectiveAction.fulfilled.match(r)) { setIssue(r.payload); setCaOpen(false); toast.success("Corrective action saved."); }
    else toast.error(r.payload || "Failed.");
  }

  async function handleSavePD() {
    if (!priority || !dueDate) return toast.error("Priority and due date are required.");
    const r = await dispatch(updatePpeCompliancePriorityDueDate({ auditId, performedId, issueId: issue.id, priority_level: priority, due_date: dueDate }));
    if (updatePpeCompliancePriorityDueDate.fulfilled.match(r)) { setIssue(r.payload); setPdOpen(false); toast.success("Priority updated."); }
    else toast.error(r.payload || "Failed.");
  }

  async function handleAssignContractor(u) {
    setContractor(u);
    const r = await dispatch(assignPpeComplianceContractor({ auditId, performedId, issueId: issue.id, contractorId: u.id }));
    if (assignPpeComplianceContractor.fulfilled.match(r)) { setIssue(r.payload); setAcOpen(false); toast.success("Contractor assigned."); }
    else { setContractor(issue.contractor || null); toast.error(r.payload || "Failed."); }
  }

  async function handleExecute() {
    const r = await dispatch(executePpeComplianceIssue({ auditId, performedId, issueId: issue.id, completion_date: compDate || undefined, completion_notes: compNotes || undefined, file: compFile || undefined }));
    if (executePpeComplianceIssue.fulfilled.match(r)) { setIssue(r.payload); setExOpen(false); toast.success("Issue closed out."); }
    else toast.error(r.payload || "Failed.");
  }

  return (
    <div className="rounded-2xl overflow-hidden"
      style={{ background: "var(--bg-raised)", border: "1px solid var(--border)" }}>

      {/* Header row */}
      <div className="flex items-start gap-3 px-4 py-3 cursor-pointer"
        onClick={() => setExpanded((p) => !p)}>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
          style={{ background: isExecuted ? "rgba(22,163,74,.12)" : "rgba(139,92,246,.08)", color: isExecuted ? "#16a34a" : ACCENT }}>
          {isExecuted
            ? <CheckCircleIcon className="h-4 w-4" />
            : <ExclamationTriangleIcon className="h-4 w-4" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold leading-snug" style={{ color: "var(--text)" }}>{issue.name}</p>
            {isExecuted && (
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold"
                style={{ background: "rgba(22,163,74,.12)", color: "#16a34a" }}>Closed</span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            {issue.priority_level && <PriorityBadge priority={issue.priority_level} />}
            {issue.due_date && (
              <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>Due {formatDate(issue.due_date)}</span>
            )}
            {issue.contractor && (
              <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>· {displayName(issue.contractor)}</span>
            )}
          </div>
        </div>
        <div className="flex-shrink-0 mt-0.5">
          {expanded
            ? <ChevronUpIcon className="h-4 w-4" style={{ color: "var(--text-muted)" }} />
            : <ChevronDownIcon className="h-4 w-4" style={{ color: "var(--text-muted)" }} />}
        </div>
      </div>

      {expanded && (
        <div className="border-t px-4 pb-4 pt-3 flex flex-col gap-4" style={{ borderColor: "var(--border)" }}>

          {!isExecuted && (
            <div className="flex flex-wrap gap-2">
              {[
                { label: "Corrective Action",  onClick: () => setCaOpen((p) => !p), active: caOpen,  icon: <WrenchScrewdriverIcon className="h-3.5 w-3.5" /> },
                { label: "Priority / Due Date", onClick: () => setPdOpen((p) => !p), active: pdOpen, icon: <CalendarDaysIcon className="h-3.5 w-3.5" /> },
                { label: "Assign Contractor",   onClick: () => setAcOpen((p) => !p), active: acOpen, icon: <UsersIcon className="h-3.5 w-3.5" /> },
                { label: "Execute & Close",      onClick: () => setExOpen((p) => !p), active: exOpen, icon: <CheckBadgeIcon className="h-3.5 w-3.5" /> },
              ].map(({ label, onClick, active, icon }) => (
                <button key={label} onClick={onClick}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold hover:opacity-80"
                  style={{ background: active ? ACCENT_LIGHT : "var(--bg-surface)", color: active ? ACCENT : "var(--text-muted)", border: `1px solid ${active ? ACCENT + "44" : "var(--border)"}` }}>
                  {icon} {label}
                </button>
              ))}
            </div>
          )}

          {caOpen && (
            <div className="rounded-xl p-3 flex flex-col gap-2" style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}>
              <textarea value={caText} onChange={(e) => setCaText(e.target.value)}
                rows={3} placeholder="Describe the corrective action…"
                className="ui-input text-sm resize-none" />
              <div className="flex gap-2">
                <button onClick={handleSaveCA} disabled={actionLoading || !caText.trim()}
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold hover:opacity-80 disabled:opacity-40"
                  style={{ background: ACCENT, color: "#fff" }}>Save</button>
                <button onClick={() => setCaOpen(false)}
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold hover:opacity-80"
                  style={{ background: "var(--bg-raised)", color: "var(--text-muted)", border: "1px solid var(--border)" }}>Cancel</button>
              </div>
            </div>
          )}

          {pdOpen && (
            <div className="rounded-xl p-3 flex flex-col gap-2" style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}>
              <div className="flex gap-2">
                <select value={priority} onChange={(e) => setPriority(e.target.value)} className="ui-input text-sm flex-1">
                  {PRIORITY_LEVELS.map((p) => (
                    <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                  ))}
                </select>
                <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)}
                  className="ui-input text-sm flex-1" />
              </div>
              <div className="flex gap-2">
                <button onClick={handleSavePD} disabled={actionLoading}
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold hover:opacity-80 disabled:opacity-40"
                  style={{ background: ACCENT, color: "#fff" }}>Save</button>
                <button onClick={() => setPdOpen(false)}
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold hover:opacity-80"
                  style={{ background: "var(--bg-raised)", color: "var(--text-muted)", border: "1px solid var(--border)" }}>Cancel</button>
              </div>
            </div>
          )}

          {acOpen && (
            <div className="rounded-xl p-3 flex flex-col gap-2" style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}>
              {contractor && (
                <p className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>
                  Current: <span style={{ color: "var(--text)" }}>{displayName(contractor)}</span>
                </p>
              )}
              <ContractorPicker onSelect={handleAssignContractor} />
            </div>
          )}

          {exOpen && (
            <div className="rounded-xl p-3 flex flex-col gap-2" style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}>
              <div className="flex gap-2">
                <div className="flex-1 flex flex-col gap-1">
                  <label className="text-[11px] font-semibold" style={{ color: "var(--text-muted)" }}>Completion Date</label>
                  <input type="date" value={compDate} onChange={(e) => setCompDate(e.target.value)} className="ui-input text-sm" />
                </div>
                <div className="flex-1 flex flex-col gap-1">
                  <label className="text-[11px] font-semibold" style={{ color: "var(--text-muted)" }}>Evidence File</label>
                  <label className="flex items-center gap-2 px-3 py-2 rounded-xl cursor-pointer hover:opacity-80 transition-opacity"
                    style={{ border: "2px dashed var(--border)", background: "var(--bg-raised)" }}>
                    <PaperClipIcon className="h-4 w-4 flex-shrink-0" style={{ color: compFile ? ACCENT : "var(--text-muted)" }} />
                    <span className="text-xs truncate" style={{ color: compFile ? ACCENT : "var(--text-muted)" }}>
                      {compFile ? compFile.name : "Attach evidence (optional)"}
                    </span>
                    {compFile && (
                      <span onClick={(e) => { e.preventDefault(); setCompFile(null); }}
                        className="ml-auto flex-shrink-0 hover:opacity-70">
                        <XMarkIcon className="h-3.5 w-3.5" style={{ color: ACCENT }} />
                      </span>
                    )}
                    <input type="file" className="hidden" onChange={(e) => setCompFile(e.target.files?.[0] || null)} />
                  </label>
                </div>
              </div>
              <textarea value={compNotes} onChange={(e) => setCompNotes(e.target.value)}
                rows={2} placeholder="Completion notes (optional)…"
                className="ui-input text-sm resize-none" />
              <div className="flex gap-2">
                <button onClick={handleExecute} disabled={actionLoading}
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold hover:opacity-80 disabled:opacity-40"
                  style={{ background: ACCENT, color: "#fff" }}>
                  {actionLoading ? "Saving…" : "Mark Closed"}
                </button>
                <button onClick={() => setExOpen(false)}
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold hover:opacity-80"
                  style={{ background: "var(--bg-raised)", color: "var(--text-muted)", border: "1px solid var(--border)" }}>Cancel</button>
              </div>
            </div>
          )}

          {issue.corrective_action && (
            <div className="rounded-xl px-3 py-2.5"
              style={{ background: ACCENT_LIGHT, border: `1px solid ${ACCENT}33` }}>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: ACCENT }}>
                <WrenchScrewdriverIcon className="h-3 w-3 inline mr-1" />Corrective Action
              </p>
              <p className="text-xs leading-relaxed" style={{ color: "var(--text)" }}>{issue.corrective_action}</p>
            </div>
          )}

          {isExecuted && (
            <div className="rounded-xl px-3 py-2.5"
              style={{ background: "rgba(22,163,74,.06)", border: "1px solid rgba(22,163,74,.2)" }}>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: "#16a34a" }}>
                <CheckBadgeIcon className="h-3 w-3 inline mr-1" />Closed Out
              </p>
              {issue.completion_date && (
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  Completed: <span style={{ color: "var(--text)" }}>{formatDate(issue.completion_date)}</span>
                </p>
              )}
              {issue.completion_notes && (
                <p className="text-xs mt-0.5 leading-relaxed" style={{ color: "var(--text)" }}>{issue.completion_notes}</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Performed Detail Modal ───────────────────────────────────────────────────

function PerformedDetailModal({ isOpen, onClose, performed, auditId }) {
  const dispatch = useAppDispatch();
  const { hasPermission: can } = useAuth();
  const issuesMap = useAppSelector(selectPpeComplianceIssuesByPerformed);

  const storedIssues = issuesMap[performed?.id] ?? [];
  const [activeTab, setActiveTab] = useState("issues");
  const [loading, setLoading] = useState(false);

  const items  = performed?.performed_ppe_compliance_items  ?? [];
  const issues = storedIssues.length ? storedIssues : (performed?.performed_ppe_compliance_issues ?? []);

  useEffect(() => { if (isOpen) setActiveTab("issues"); }, [isOpen]);

  useEffect(() => {
    if (!performed) return;
    if (activeTab === "issues" && !storedIssues.length) {
      setLoading(true);
      dispatch(fetchPpeComplianceIssues({ auditId, performedId: performed.id }))
        .finally(() => setLoading(false));
    }
  }, [activeTab, performed, dispatch, auditId, storedIssues.length]);

  if (!isOpen || !performed) return null;

  const auditorName    = displayName(performed.auditor);
  const auditorInitial = initials(auditorName);

  const ITEM_STATUS_MAP = {
    compliant:     { bg: "rgba(22,163,74,.08)",  border: "#16a34a", color: "#16a34a", label: "Compliant",     icon: <CheckCircleIcon className="h-3.5 w-3.5" /> },
    partial:       { bg: "rgba(245,158,11,.08)", border: "#f59e0b", color: "#f59e0b", label: "Partial",       icon: <ExclamationTriangleIcon className="h-3.5 w-3.5" /> },
    non_compliant: { bg: "rgba(239,68,68,.06)",  border: "#ef4444", color: "#ef4444", label: "Non-Compliant", icon: <XMarkIcon className="h-3.5 w-3.5" /> },
    passed:        { bg: "rgba(22,163,74,.08)",  border: "#16a34a", color: "#16a34a", label: "Passed",        icon: <CheckCircleIcon className="h-3.5 w-3.5" /> },
    failed:        { bg: "rgba(239,68,68,.06)",  border: "#ef4444", color: "#ef4444", label: "Failed",        icon: <XMarkIcon className="h-3.5 w-3.5" /> },
  };

  const tabs = [
    { key: "issues", label: "Issues",          count: issues.length },
    { key: "items",  label: "Checklist Items", count: items.length },
  ];

  const compliantCount    = items.filter((i) => ["compliant", "passed"].includes((i.status ?? "").toLowerCase())).length;
  const partialCount      = items.filter((i) => (i.status ?? "").toLowerCase() === "partial").length;
  const nonCompliantCount = items.filter((i) => ["non_compliant", "failed"].includes((i.status ?? "").toLowerCase())).length;

  return createPortal(
    <div className="fixed inset-0 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.6)", zIndex: 10002, backdropFilter: "blur(4px)" }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-2xl flex flex-col rounded-2xl overflow-hidden"
        style={{ background: "var(--bg-surface)", boxShadow: "0 25px 60px rgba(0,0,0,0.3), 0 0 0 1px var(--border)", maxHeight: "90vh" }}>

        {/* Header */}
        <div className="relative overflow-hidden flex-shrink-0 px-6 py-5"
          style={{ background: `linear-gradient(135deg, ${ACCENT_LIGHT} 0%, rgba(139,92,246,0.03) 50%, transparent 100%)`, borderBottom: "1px solid var(--border)" }}>
          <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full pointer-events-none"
            style={{ background: `radial-gradient(circle, ${ACCENT_LIGHT} 0%, transparent 70%)` }} />

          <div className="flex items-center gap-4 relative">
            <div className="flex-shrink-0 flex items-center justify-center rounded-2xl text-white text-base font-bold"
              style={{ width: 52, height: 52, background: `linear-gradient(135deg, ${ACCENT} 0%, ${ACCENT_DARK} 65%, ${ACCENT_DEEP} 100%)`, boxShadow: `0 4px 14px ${ACCENT}60` }}>
              {performed.auditor ? auditorInitial : <ShieldCheckIcon className="h-6 w-6" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-widest mb-0.5" style={{ color: ACCENT }}>
                Performed Audit · {PPE_COMPLIANCE_AUDIT_TITLE}
              </p>
              <h2 className="text-lg font-bold leading-tight" style={{ color: "var(--text)" }}>
                {formatDate(performed.audit_date || performed.created_at)}
              </h2>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                {performed.auditor ? `Conducted by ${auditorName}` : "No auditor assigned"}
              </p>
            </div>
            <div className="flex flex-col items-end gap-2 flex-shrink-0">
              <button onClick={onClose} className="p-2 rounded-xl hover:opacity-70"
                style={{ background: "var(--bg-raised)", color: "var(--text-muted)", border: "1px solid var(--border)" }}>
                <XMarkIcon className="h-4 w-4" />
              </button>
              {issues.length > 0 && (
                <span className="text-[11px] px-2.5 py-1 rounded-full font-bold"
                  style={{ background: "rgba(239,68,68,.1)", color: "#ef4444" }}>
                  {issues.length} issue{issues.length !== 1 ? "s" : ""}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Pill tabs */}
        <div className="flex gap-2 px-5 pt-4 flex-shrink-0">
          {tabs.map((t) => (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold transition-all"
              style={{
                background: activeTab === t.key ? ACCENT : "var(--bg-raised)",
                color:      activeTab === t.key ? "#fff"  : "var(--text-muted)",
                border:     activeTab === t.key ? "none"  : "1px solid var(--border)",
              }}>
              {t.label}
              <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold"
                style={{ background: activeTab === t.key ? "rgba(255,255,255,0.25)" : ACCENT_LIGHT, color: activeTab === t.key ? "#fff" : ACCENT }}>
                {t.count}
              </span>
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">

          {/* Issues tab */}
          {activeTab === "issues" && (
            <div className="p-5">
              {loading ? (
                <div className="flex justify-center py-12"><Spinner size={6} /></div>
              ) : issues.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: ACCENT_LIGHT }}>
                    <CheckCircleIcon className="h-8 w-8" style={{ color: ACCENT }} />
                  </div>
                  <p className="text-sm font-bold mb-1" style={{ color: "var(--text)" }}>No Issues Found</p>
                  <p className="text-xs text-center max-w-xs" style={{ color: "var(--text-muted)" }}>
                    This audit has no recorded issues.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {issues.map((issue) =>
                    can("performed_ppe_compliance_issues.update") ? (
                      <PpeComplianceIssueCard key={issue.id} issue={issue} auditId={auditId} performedId={performed.id} />
                    ) : (
                      <div key={issue.id}
                        className="flex items-start gap-3 rounded-xl px-4 py-3.5"
                        style={{ background: "var(--bg-raised)", border: "1px solid var(--border)", borderLeft: "3px solid #ef4444" }}>
                        <ExclamationTriangleIcon className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: "#ef4444" }} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>{issue.name}</p>
                          {issue.corrective_action && (
                            <p className="text-xs mt-0.5 leading-relaxed" style={{ color: "var(--text-muted)" }}>{issue.corrective_action}</p>
                          )}
                        </div>
                        {issue.priority_level && <PriorityBadge priority={issue.priority_level} />}
                      </div>
                    )
                  )}
                </div>
              )}
            </div>
          )}

          {/* Checklist Items tab */}
          {activeTab === "items" && (
            <div className="p-5">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: ACCENT_LIGHT }}>
                    <ClipboardDocumentListIcon className="h-8 w-8" style={{ color: ACCENT }} />
                  </div>
                  <p className="text-sm font-bold mb-1" style={{ color: "var(--text)" }}>No Items Recorded</p>
                  <p className="text-xs text-center max-w-xs" style={{ color: "var(--text-muted)" }}>
                    No checklist items were recorded for this audit.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {/* Compliance summary */}
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: "Compliant",     value: compliantCount,    color: "#16a34a", bg: "rgba(22,163,74,0.08)",  icon: <CheckCircleIcon className="h-4 w-4" /> },
                      { label: "Partial",       value: partialCount,      color: "#f59e0b", bg: "rgba(245,158,11,0.08)", icon: <ExclamationTriangleIcon className="h-4 w-4" /> },
                      { label: "Non-Compliant", value: nonCompliantCount, color: "#ef4444", bg: "rgba(239,68,68,0.08)",  icon: <XMarkIcon className="h-4 w-4" /> },
                    ].map(({ label, value, color, bg, icon }) => (
                      <div key={label} className="rounded-xl p-3 flex items-center gap-2.5"
                        style={{ background: "var(--bg-raised)", border: `1px solid ${color}25` }}>
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ background: bg, color }}>{icon}</div>
                        <div>
                          <p className="text-lg font-black leading-none" style={{ color }}>{value}</p>
                          <p className="text-[10px] font-semibold uppercase tracking-wide mt-0.5" style={{ color: "var(--text-muted)" }}>{label}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Item cards */}
                  <div className="flex flex-col gap-1.5">
                    {items.map((item, idx) => {
                      const statusKey = (item.status ?? "").toLowerCase();
                      const s = ITEM_STATUS_MAP[statusKey] || ITEM_STATUS_MAP.partial;
                      return (
                        <div key={item.id ?? idx}
                          className="flex items-start gap-3 rounded-xl px-4 py-3.5"
                          style={{ background: "var(--bg-raised)", border: "1px solid var(--border)", borderLeft: `3px solid ${s.border}` }}>
                          <span className="text-[10px] font-bold flex-shrink-0 w-5 h-5 rounded flex items-center justify-center mt-0.5"
                            style={{ background: `${s.border}18`, color: s.color }}>
                            {item.position ?? idx + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold leading-snug" style={{ color: "var(--text)" }}>
                              {item.checklist_item || item.label || item.description || item.name || `Item #${idx + 1}`}
                            </p>
                            {(item.comment || item.remarks) && (
                              <p className="text-xs mt-1 leading-relaxed" style={{ color: "var(--text-muted)" }}>{item.comment || item.remarks}</p>
                            )}
                          </div>
                          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold flex-shrink-0 mt-0.5"
                            style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}30` }}>
                            {s.icon}{s.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Audit note footer */}
        {performed.audit_note && (
          <div className="px-5 py-4 flex-shrink-0" style={{ borderTop: "1px solid var(--border)" }}>
            <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl"
              style={{ background: "var(--bg-raised)", border: "1px solid var(--border)" }}>
              <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: ACCENT }} />
              <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
                <span className="font-semibold" style={{ color: "var(--text)" }}>Audit Note: </span>
                {performed.audit_note}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

// ─── Step Indicator ───────────────────────────────────────────────────────────

function StepIndicator({ steps, current, completed = [] }) {
  return (
    <div className="flex items-center px-6 py-3 flex-shrink-0" style={{ borderBottom: "1px solid var(--border)" }}>
      {steps.map((label, idx) => {
        const num      = idx + 1;
        const isActive = num === current;
        const isDone   = completed.includes(num);
        return (
          <div key={label} className="flex items-center flex-1 last:flex-none">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0"
                style={{
                  background: isActive || isDone ? ACCENT : "var(--bg-raised)",
                  color:      isActive || isDone ? "#fff"  : "var(--text-muted)",
                  border:     isActive || isDone ? "none"  : "1px solid var(--border)",
                }}>
                {isDone ? <CheckBadgeIcon className="h-3.5 w-3.5" /> : num}
              </div>
              <span className="text-xs font-semibold hidden sm:block"
                style={{ color: isActive ? "var(--text)" : "var(--text-muted)" }}>
                {label}
              </span>
            </div>
            {idx < steps.length - 1 && (
              <div className="flex-1 h-px mx-2" style={{ background: "var(--border)" }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Setup Modal ─────────────────────────────────────────────────────────────

const STATUS_OPTIONS = ["pending","scheduled","in_progress","completed","cancelled"];
const SETUP_STEPS    = ["Basic Info", "Assign Auditors", "Review"];

function SetupModal({ isOpen, onClose, record, auditId }) {
  const dispatch      = useAppDispatch();
  const actionLoading = useAppSelector(selectPpeComplianceActionLoading);

  const isEdit = !!record;

  const EMPTY = { audit_number: "", area_audited: "", date: "", status: "pending", objective_of_audit: "", scope_of_audit: "", comments: "" };

  const [step,           setStep]           = useState(1);
  const [completedSteps, setCompletedSteps] = useState([]);
  const [form,           setForm]           = useState(EMPTY);
  const [errors,         setErrors]         = useState({});
  const [selectedAuditors, setSelectedAuditors] = useState([]);

  useEffect(() => {
    if (!isOpen) return;
    dispatch(clearPpeComplianceActionError());
    setStep(1);
    setCompletedSteps([]);
    setErrors({});
    if (isEdit) {
      setForm({
        audit_number:       record.audit_number       || "",
        area_audited:       record.area_audited        || "",
        date:               (record.date || "").slice(0, 10),
        status:             record.status              || "pending",
        objective_of_audit: record.objective_of_audit || "",
        scope_of_audit:     record.scope_of_audit      || "",
        comments:           record.comments            || "",
      });
      setSelectedAuditors((record.auditors ?? []).filter((a) => typeof a === "object"));
    } else {
      setForm({ ...EMPTY, date: new Date().toISOString().slice(0, 10) });
      setSelectedAuditors([]);
    }
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  function set(k, v) { setForm((p) => ({ ...p, [k]: v })); setErrors((e) => ({ ...e, [k]: "" })); }

  function toggleAuditor(u) {
    setSelectedAuditors((prev) =>
      prev.some((a) => a.id === u.id) ? prev.filter((a) => a.id !== u.id) : [...prev, u]
    );
  }

  function validateStep(s) {
    const e = {};
    if (s === 1) {
      if (!form.audit_number.trim())       e.audit_number       = "Audit number is required.";
      if (!form.area_audited.trim())       e.area_audited       = "Area audited is required.";
      if (!form.date)                      e.date               = "Date is required.";
      if (!form.status)                    e.status             = "Status is required.";
      if (!form.objective_of_audit.trim()) e.objective_of_audit = "Objective is required.";
      if (!form.scope_of_audit.trim())     e.scope_of_audit     = "Scope is required.";
    }
    if (s === 2 && !isEdit && selectedAuditors.length === 0) {
      e.auditors = "At least one auditor is required.";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function goNext() {
    if (!validateStep(step)) return;
    setCompletedSteps((p) => Array.from(new Set([...p, step])));
    setStep((s) => s + 1);
  }

  function goBack() { setErrors({}); setStep((s) => s - 1); }

  async function handleSubmit() {
    const data = {
      audit_number:       form.audit_number.trim(),
      area_audited:       form.area_audited.trim(),
      date:               form.date,
      status:             form.status,
      objective_of_audit: form.objective_of_audit.trim(),
      scope_of_audit:     form.scope_of_audit.trim(),
      auditor_ids:        selectedAuditors.map((u) => u.id),
    };
    const action = isEdit
      ? updatePpeComplianceRecord({ auditId, id: record.id, data })
      : createPpeComplianceRecord({ auditId, data });
    const res = await dispatch(action);
    if (!res.error) {
      toast.success(isEdit ? "Record updated." : "Record created.");
      dispatch(fetchPpeComplianceRecords(auditId));
      onClose();
    } else {
      toast.error(res.payload || "Failed to save record.");
    }
  }

  return (
    <ModalShell
      isOpen={isOpen}
      title={isEdit ? "Edit PPE Compliance Record" : "New PPE Compliance Record"}
      onClose={onClose}
      width="max-w-xl"
    >
      <StepIndicator steps={SETUP_STEPS} current={step} completed={completedSteps} />

      <div className="flex-1 overflow-y-auto">

        {/* ── Step 1 · Basic Info ── */}
        {step === 1 && (
          <div className="p-6 flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Audit Number" required error={errors.audit_number}>
                <input value={form.audit_number}
                  onChange={(e) => set("audit_number", e.target.value)}
                  placeholder="e.g. PPE-2025-001" className="ui-input text-sm" autoFocus />
              </Field>
              <Field label="Date" required error={errors.date}>
                <input type="date" value={form.date}
                  onChange={(e) => set("date", e.target.value)}
                  className="ui-input text-sm" />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Area Audited" required error={errors.area_audited}>
                <input value={form.area_audited}
                  onChange={(e) => set("area_audited", e.target.value)}
                  placeholder="e.g. Warehouse, Site A…" className="ui-input text-sm" />
              </Field>
              <Field label="Status" required error={errors.status}>
                <select value={form.status} onChange={(e) => set("status", e.target.value)}
                  className="ui-input text-sm">
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
                  ))}
                </select>
              </Field>
            </div>
            <Field label="Objective of Audit" required error={errors.objective_of_audit}>
              <textarea value={form.objective_of_audit}
                onChange={(e) => set("objective_of_audit", e.target.value)}
                rows={3} placeholder="Describe the objective of this audit…"
                className="ui-input text-sm resize-none" />
            </Field>
            <Field label="Scope of Audit" required error={errors.scope_of_audit}>
              <textarea value={form.scope_of_audit}
                onChange={(e) => set("scope_of_audit", e.target.value)}
                rows={3} placeholder="Define the scope of this audit…"
                className="ui-input text-sm resize-none" />
            </Field>
          </div>
        )}

        {/* ── Step 2 · Assign Auditors ── */}
        {step === 2 && (
          <div className="p-6 flex flex-col gap-4">
            <div className="rounded-xl px-4 py-3 flex items-start gap-3"
              style={{ background: ACCENT_LIGHT, border: `1px solid ${ACCENT}30` }}>
              <UsersIcon className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: ACCENT }} />
              <p className="text-xs leading-relaxed" style={{ color: ACCENT }}>
                Search for auditors by name or email and select one or more to assign to this record.
              </p>
            </div>
            <AuditorPicker
              selected={selectedAuditors}
              onToggle={toggleAuditor}
              label="Search & assign auditors"
            />
            {errors.auditors && (
              <p className="text-[11px] flex items-center gap-1.5" style={{ color: "#ef4444" }}>
                <ExclamationTriangleIcon className="h-3.5 w-3.5 flex-shrink-0" />
                {errors.auditors}
              </p>
            )}
          </div>
        )}

        {/* ── Step 3 · Review ── */}
        {step === 3 && (
          <div className="flex flex-col gap-0">

            {/* Hero banner */}
            <div className="relative overflow-hidden px-6 py-5 flex-shrink-0"
              style={{ background: `linear-gradient(135deg, ${ACCENT} 0%, ${ACCENT_DARK} 60%, ${ACCENT_DEEP} 100%)` }}>
              <div className="absolute -top-6 -right-6 w-28 h-28 rounded-full pointer-events-none"
                style={{ background: "rgba(255,255,255,0.08)" }} />
              <div className="absolute bottom-0 left-10 w-16 h-16 rounded-full pointer-events-none"
                style={{ background: "rgba(255,255,255,0.05)" }} />
              <div className="relative flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)" }}>
                  <ShieldCheckIcon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/70 mb-0.5">
                    {PPE_COMPLIANCE_AUDIT_TITLE}
                  </p>
                  <p className="text-base font-bold text-white leading-tight">
                    {form.audit_number || "New Record"}
                  </p>
                  <p className="text-[11px] text-white/70 mt-0.5">{formatDate(form.date)}</p>
                </div>
                <div className="ml-auto flex-shrink-0">
                  <StatusBadge status={form.status} />
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-5 flex flex-col gap-4">

              {/* Key fields grid */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: <ClipboardDocumentListIcon className="h-4 w-4" />, label: "Audit Number", value: form.audit_number || "—" },
                  { icon: <CalendarDaysIcon          className="h-4 w-4" />, label: "Date",         value: formatDate(form.date) },
                  { icon: <MagnifyingGlassIcon       className="h-4 w-4" />, label: "Area Audited", value: form.area_audited   || "—" },
                  { icon: <CheckBadgeIcon            className="h-4 w-4" />, label: "Status",       value: <StatusBadge status={form.status} /> },
                ].map(({ icon, label, value }) => (
                  <div key={label} className="flex items-start gap-3 rounded-xl px-3.5 py-3"
                    style={{ background: "var(--bg-raised)", border: "1px solid var(--border)" }}>
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ background: ACCENT_LIGHT, color: ACCENT }}>
                      {icon}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold uppercase tracking-wide mb-0.5"
                        style={{ color: "var(--text-muted)" }}>{label}</p>
                      <div className="text-sm font-semibold truncate" style={{ color: "var(--text)" }}>{value}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Objective */}
              <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
                <div className="flex items-center gap-2 px-4 py-2.5"
                  style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-raised)" }}>
                  <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: ACCENT }} />
                  <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: ACCENT }}>Objective</p>
                </div>
                <p className="px-4 py-3 text-sm leading-relaxed"
                  style={{ color: form.objective_of_audit ? "var(--text)" : "var(--text-muted)" }}>
                  {form.objective_of_audit || "Not specified"}
                </p>
              </div>

              {/* Scope */}
              <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
                <div className="flex items-center gap-2 px-4 py-2.5"
                  style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-raised)" }}>
                  <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: ACCENT }} />
                  <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: ACCENT }}>Scope</p>
                </div>
                <p className="px-4 py-3 text-sm leading-relaxed"
                  style={{ color: form.scope_of_audit ? "var(--text)" : "var(--text-muted)" }}>
                  {form.scope_of_audit || "Not specified"}
                </p>
              </div>

              {/* Comments (if any) */}
              {form.comments && (
                <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
                  <div className="flex items-center gap-2 px-4 py-2.5"
                    style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-raised)" }}>
                    <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: ACCENT }} />
                    <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: ACCENT }}>Comments</p>
                  </div>
                  <p className="px-4 py-3 text-sm leading-relaxed" style={{ color: "var(--text)" }}>{form.comments}</p>
                </div>
              )}

              {/* Auditors */}
              <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
                <div className="flex items-center justify-between px-4 py-2.5"
                  style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-raised)" }}>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: ACCENT }} />
                    <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: ACCENT }}>
                      Assigned Auditors
                    </p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={{ background: ACCENT_LIGHT, color: ACCENT }}>
                    {selectedAuditors.length}
                  </span>
                </div>
                <div className="px-4 py-3">
                  {selectedAuditors.length === 0 ? (
                    <div className="flex items-center gap-2 py-1">
                      <ExclamationTriangleIcon className="h-3.5 w-3.5 flex-shrink-0" style={{ color: "#f59e0b" }} />
                      <span className="text-xs" style={{ color: "var(--text-muted)" }}>No auditors assigned</span>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {selectedAuditors.map((a) => {
                        const name = displayName(a);
                        return (
                          <span key={a.id}
                            className="flex items-center gap-1.5 pl-1 pr-2.5 py-1 rounded-full text-[11px] font-semibold"
                            style={{ background: ACCENT_LIGHT, color: ACCENT, border: `1px solid ${ACCENT}30` }}>
                            <span className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black text-white flex-shrink-0"
                              style={{ background: ACCENT }}>
                              {initials(name)}
                            </span>
                            {name}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Confirm note */}
              <div className="flex items-start gap-2.5 rounded-xl px-4 py-3"
                style={{ background: ACCENT_LIGHT, border: `1px solid ${ACCENT}25` }}>
                <CheckCircleIcon className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: ACCENT }} />
                <p className="text-xs leading-relaxed" style={{ color: ACCENT }}>
                  Please review the information above carefully before {isEdit ? "saving your changes" : "creating this record"}.
                  You can go back to make edits at any time.
                </p>
              </div>

            </div>
          </div>
        )}

      </div>

      {/* Footer navigation */}
      <div className="flex items-center justify-between px-6 py-4 flex-shrink-0"
        style={{ borderTop: "1px solid var(--border)" }}>
        {step > 1 ? (
          <button onClick={goBack}
            className="flex items-center gap-1 text-sm font-semibold hover:opacity-80"
            style={{ color: "var(--text-muted)" }}>
            <ChevronLeftIcon className="h-4 w-4" /> Back
          </button>
        ) : (
          <button onClick={onClose}
            className="flex items-center gap-1 text-sm font-semibold hover:opacity-80"
            style={{ color: "var(--text-muted)" }}>
            Cancel
          </button>
        )}
        {step < SETUP_STEPS.length ? (
          <button onClick={goNext}
            className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold hover:opacity-90"
            style={{ background: ACCENT, color: "#fff" }}>
            Next <ChevronRightIcon className="h-4 w-4" />
          </button>
        ) : (
          <button onClick={handleSubmit} disabled={actionLoading}
            className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold hover:opacity-90 disabled:opacity-60"
            style={{ background: ACCENT, color: "#fff" }}>
            {actionLoading ? <Spinner size={3} /> : <CheckBadgeIcon className="h-4 w-4" />}
            {isEdit ? "Save Changes" : "Create Record"}
          </button>
        )}
      </div>
    </ModalShell>
  );
}

// ─── Reassign Modal ───────────────────────────────────────────────────────────

function ReassignModal({ isOpen, onClose, record, auditId }) {
  const dispatch      = useAppDispatch();
  const actionLoading = useAppSelector(selectPpeComplianceActionLoading);
  const actionError   = useAppSelector(selectPpeComplianceActionError);

  const [auditorIds, setAuditorIds] = useState([]);
  const [allUsers, setAllUsers]     = useState([]);

  useEffect(() => {
    if (isOpen) {
      setAuditorIds((record?.auditors ?? record?.auditor_ids ?? []).map((a) => (typeof a === "object" ? a.id : a)));
    }
  }, [isOpen, record]);

  useEffect(() => {
    UsersService.list().then((u) => setAllUsers(Array.isArray(u) ? u : u?.data ?? [])).catch(() => {});
  }, []);

  const handleSave = async () => {
    const res = await dispatch(reassignPpeComplianceAuditors({ auditId, ppeCompId: record.id, auditorIds }));
    if (!res.error) {
      toast.success("Auditors reassigned.");
      onClose();
    }
  };

  if (!isOpen || !record) return null;

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      title="Reassign Auditors"
      subtitle={`Record: ${record.audit_number || "—"}`}
      icon={<UsersIcon className="h-5 w-5 text-white" />}
      accent={ACCENT}>
      <div className="flex flex-col gap-4">

        {/* Record banner */}
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl"
          style={{ background: ACCENT_LIGHT, border: `1px solid ${ACCENT}30` }}>
          <ShieldCheckIcon className="h-5 w-5 flex-shrink-0" style={{ color: ACCENT }} />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold" style={{ color: ACCENT }}>PPE Compliance Record</p>
            <p className="text-sm font-semibold truncate" style={{ color: "var(--text)" }}>
              {record.audit_number} {record.area_audited ? `· ${record.area_audited}` : ""}
            </p>
          </div>
        </div>

        {actionError && (
          <div className="px-3 py-2.5 rounded-xl text-xs flex items-start gap-2"
            style={{ background: "rgba(239,68,68,.08)", border: "1px solid rgba(239,68,68,.25)", color: "#ef4444" }}>
            <ExclamationTriangleIcon className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
            <span>{typeof actionError === "string" ? actionError : "An error occurred."}</span>
          </div>
        )}

        <AuditorPicker value={auditorIds} onChange={setAuditorIds} allUsers={allUsers} />

        {/* Warning if none selected */}
        {auditorIds.length === 0 && (
          <div className="px-3 py-2.5 rounded-xl text-xs flex items-start gap-2"
            style={{ background: "rgba(245,158,11,.08)", border: "1px solid rgba(245,158,11,.3)", color: "#8b5cf6" }}>
            <ExclamationTriangleIcon className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
            <span>At least one auditor is recommended for this record.</span>
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm font-semibold hover:opacity-80"
          style={{ background: "var(--bg-raised)", color: "var(--text-muted)", border: "1px solid var(--border)" }}>
          Cancel
        </button>
        <button onClick={handleSave} disabled={actionLoading || auditorIds.length === 0}
          className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-40"
          style={{ background: `linear-gradient(135deg, ${ACCENT} 0%, ${ACCENT_DARK} 65%, ${ACCENT_DEEP} 100%)` }}>
          {actionLoading
            ? <><Spinner size={4} />Saving…</>
            : `Save${auditorIds.length > 0 ? ` (${auditorIds.length})` : ""}`}
        </button>
      </div>
    </ModalShell>
  );
}

// ─── Perform Modal ────────────────────────────────────────────────────────────

const PERFORM_TABS = ["Audit Info", "Checklist Items", "Issues", "Summary"];

function PerformModal({ isOpen, onClose, record, auditId }) {
  const dispatch      = useAppDispatch();
  const actionLoading = useAppSelector(selectPpeComplianceActionLoading);
  const actionError   = useAppSelector(selectPpeComplianceActionError);

  const [tab, setTab]             = useState(0);
  const [auditDate, setAuditDate] = useState("");
  const [auditNote, setAuditNote] = useState("");
  const [auditorId, setAuditorId] = useState("");
  const [allUsers, setAllUsers]   = useState([]);

  // Checklist items: { id, label, status, comment }
  const [items, setItems] = useState([]);
  const [newLabel, setNewLabel] = useState("");

  // Issues: { id, name, description }
  const [issues, setIssues]     = useState([]);
  const [newIssueName, setNewIssueName]   = useState("");
  const [newIssueDesc, setNewIssueDesc]   = useState("");

  useEffect(() => {
    if (isOpen) {
      setTab(0);
      setAuditDate("");
      setAuditNote("");
      setAuditorId("");
      setItems([]);
      setIssues([]);
      setNewLabel("");
      setNewIssueName("");
      setNewIssueDesc("");
    }
  }, [isOpen]);

  useEffect(() => {
    UsersService.list().then((u) => setAllUsers(Array.isArray(u) ? u : u?.data ?? [])).catch(() => {});
  }, []);

  // Checklist helpers
  const addItem = () => {
    if (!newLabel.trim()) return;
    setItems((p) => [...p, { id: Date.now(), label: newLabel.trim(), status: "compliant", comment: "" }]);
    setNewLabel("");
  };
  const removeItem = (id) => setItems((p) => p.filter((x) => x.id !== id));
  const setItemField = (id, k, v) => setItems((p) => p.map((x) => x.id === id ? { ...x, [k]: v } : x));

  // Issue helpers
  const addIssue = () => {
    if (!newIssueName.trim()) return;
    setIssues((p) => [...p, { id: Date.now(), name: newIssueName.trim(), description: newIssueDesc.trim() }]);
    setNewIssueName("");
    setNewIssueDesc("");
  };
  const removeIssue = (id) => setIssues((p) => p.filter((x) => x.id !== id));

  const canSubmit = auditDate && auditorId;

  const handleSubmit = async () => {
    const payload = {
      audit_date: auditDate,
      audit_note: auditNote,
      auditor_id: auditorId,
      performedChecklist: items.map(({ label, status, comment }, idx) => ({ label, status, comment, position: idx + 1 })),
      issues: issues.map(({ name, description }) => ({ name, description })),
    };
    const res = await dispatch(performPpeComplianceRecord({ auditId, ppeCompId: record.id, payload }));
    if (!res.error) {
      toast.success("Audit performed successfully.");
      onClose();
    }
  };

  if (!isOpen || !record) return null;

  return createPortal(
    <div className="fixed inset-0 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.6)", zIndex: 10001, backdropFilter: "blur(4px)" }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-2xl flex flex-col rounded-2xl overflow-hidden"
        style={{ background: "var(--bg-surface)", boxShadow: "0 25px 60px rgba(0,0,0,0.3), 0 0 0 1px var(--border)", maxHeight: "92vh" }}>

        {/* Header */}
        <div className="relative overflow-hidden flex-shrink-0 px-6 py-5"
          style={{ background: `linear-gradient(135deg, ${ACCENT_LIGHT} 0%, rgba(139,92,246,0.03) 50%, transparent 100%)`, borderBottom: "1px solid var(--border)" }}>
          <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full pointer-events-none"
            style={{ background: `radial-gradient(circle, ${ACCENT_LIGHT} 0%, transparent 70%)` }} />
          <div className="flex items-center gap-3 relative">
            <div className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: `linear-gradient(135deg, ${ACCENT} 0%, ${ACCENT_DARK} 65%, ${ACCENT_DEEP} 100%)`, boxShadow: `0 4px 14px ${ACCENT}60` }}>
              <PlayIcon className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-widest mb-0.5" style={{ color: ACCENT }}>
                Perform Audit · {PPE_COMPLIANCE_AUDIT_TITLE}
              </p>
              <h2 className="text-base font-bold truncate" style={{ color: "var(--text)" }}>
                {record.audit_number} {record.area_audited ? `· ${record.area_audited}` : ""}
              </h2>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl hover:opacity-70"
              style={{ background: "var(--bg-raised)", color: "var(--text-muted)", border: "1px solid var(--border)" }}>
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Tab pills */}
        <div className="flex gap-1.5 px-5 pt-4 flex-shrink-0 overflow-x-auto">
          {PERFORM_TABS.map((t, i) => (
            <button key={t} onClick={() => setTab(i)}
              className="flex-shrink-0 px-4 py-2 rounded-full text-xs font-semibold transition-all"
              style={{
                background: tab === i ? ACCENT : "var(--bg-raised)",
                color:      tab === i ? "#fff" : "var(--text-muted)",
                border:     tab === i ? "none" : "1px solid var(--border)",
              }}>
              {t}
              {i === 1 && items.length > 0  && <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full"
                style={{ background: tab === 1 ? "rgba(255,255,255,.25)" : ACCENT_LIGHT, color: tab === 1 ? "#fff" : ACCENT }}>{items.length}</span>}
              {i === 2 && issues.length > 0 && <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full"
                style={{ background: tab === 2 ? "rgba(255,255,255,.25)" : "rgba(239,68,68,.1)", color: tab === 2 ? "#fff" : "#ef4444" }}>{issues.length}</span>}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">

          {actionError && (
            <div className="mx-5 mt-4 px-3 py-2.5 rounded-xl text-xs flex items-start gap-2"
              style={{ background: "rgba(239,68,68,.08)", border: "1px solid rgba(239,68,68,.25)", color: "#ef4444" }}>
              <ExclamationTriangleIcon className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
              <span>{typeof actionError === "string" ? actionError : "An error occurred."}</span>
            </div>
          )}

          {/* Tab 0 — Audit Info */}
          {tab === 0 && (
            <div className="p-5 flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>Audit Date *</label>
                  <input type="date" value={auditDate} onChange={(e) => setAuditDate(e.target.value)} className="ui-input text-sm" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>Auditor *</label>
                  <select value={auditorId} onChange={(e) => setAuditorId(e.target.value)} className="ui-input text-sm">
                    <option value="">— Select auditor —</option>
                    {allUsers.map((u) => (
                      <option key={u.id} value={u.id}>{displayName(u)}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>Audit Note</label>
                <textarea value={auditNote} onChange={(e) => setAuditNote(e.target.value)} rows={4}
                  placeholder="Overall observations, context, summary…" className="ui-input text-sm resize-none" />
              </div>
            </div>
          )}

          {/* Tab 1 — Checklist Items */}
          {tab === 1 && (
            <div className="p-5 flex flex-col gap-4">
              {/* Add item */}
              <div className="flex gap-2">
                <input value={newLabel} onChange={(e) => setNewLabel(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addItem(); } }}
                  placeholder="Add checklist item…" className="ui-input text-sm flex-1" />
                <button onClick={addItem} disabled={!newLabel.trim()}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-40 flex-shrink-0"
                  style={{ background: `linear-gradient(135deg, ${ACCENT} 0%, ${ACCENT_DARK} 65%, ${ACCENT_DEEP} 100%)` }}>
                  <PlusIcon className="h-4 w-4" /> Add
                </button>
              </div>

              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10">
                  <ClipboardDocumentListIcon className="h-10 w-10 mb-3" style={{ color: "var(--text-muted)", opacity: 0.4 }} />
                  <p className="text-sm font-semibold" style={{ color: "var(--text-muted)" }}>No items yet</p>
                  <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>Add checklist items above.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {items.map((item) => (
                    <div key={item.id} className="rounded-xl p-3 flex flex-col gap-2"
                      style={{ background: "var(--bg-raised)", border: "1px solid var(--border)" }}>
                      <div className="flex items-center gap-2">
                        <p className="flex-1 text-sm font-semibold" style={{ color: "var(--text)" }}>{item.label}</p>
                        <select value={item.status} onChange={(e) => setItemField(item.id, "status", e.target.value)}
                          className="ui-input text-xs py-1 px-2">
                          {PERFORM_STATUSES.map((s) => <option key={s} value={s}>{PERFORM_STATUS_LABELS[s]}</option>)}
                        </select>
                        <button onClick={() => removeItem(item.id)} className="p-1 hover:opacity-70" style={{ color: "#ef4444" }}>
                          <XMarkIcon className="h-4 w-4" />
                        </button>
                      </div>
                      <input value={item.comment} onChange={(e) => setItemField(item.id, "comment", e.target.value)}
                        placeholder="Comment (optional)…" className="ui-input text-xs" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab 2 — Issues */}
          {tab === 2 && (
            <div className="p-5 flex flex-col gap-4">
              {/* Add issue */}
              <div className="flex flex-col gap-2 p-3 rounded-xl"
                style={{ background: "var(--bg-raised)", border: "1px solid var(--border)" }}>
                <input value={newIssueName} onChange={(e) => setNewIssueName(e.target.value)}
                  placeholder="Issue name…" className="ui-input text-sm" />
                <textarea value={newIssueDesc} onChange={(e) => setNewIssueDesc(e.target.value)}
                  rows={2} placeholder="Description (optional)…" className="ui-input text-sm resize-none" />
                <button onClick={addIssue} disabled={!newIssueName.trim()}
                  className="self-end flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-40"
                  style={{ background: `linear-gradient(135deg, ${ACCENT} 0%, ${ACCENT_DARK} 65%, ${ACCENT_DEEP} 100%)` }}>
                  <PlusIcon className="h-4 w-4" /> Add Issue
                </button>
              </div>

              {issues.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <ShieldCheckIcon className="h-10 w-10 mb-3" style={{ color: "var(--text-muted)", opacity: 0.4 }} />
                  <p className="text-sm font-semibold" style={{ color: "var(--text-muted)" }}>No issues recorded</p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {issues.map((issue) => (
                    <div key={issue.id} className="flex items-start gap-3 rounded-xl px-4 py-3"
                      style={{ background: "var(--bg-raised)", border: "1px solid var(--border)", borderLeft: "3px solid #ef4444" }}>
                      <ExclamationTriangleIcon className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: "#ef4444" }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>{issue.name}</p>
                        {issue.description && (
                          <p className="text-xs mt-0.5 leading-relaxed" style={{ color: "var(--text-muted)" }}>{issue.description}</p>
                        )}
                      </div>
                      <button onClick={() => removeIssue(issue.id)} className="p-1 hover:opacity-70 flex-shrink-0" style={{ color: "#ef4444" }}>
                        <XMarkIcon className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab 3 — Summary */}
          {tab === 3 && (
            <div className="p-5 flex flex-col gap-4">
              <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
                <div className="px-4 py-2.5" style={{ background: `linear-gradient(135deg, ${ACCENT} 0%, ${ACCENT_DARK} 65%, ${ACCENT_DEEP} 100%)` }}>
                  <p className="text-xs font-bold text-white uppercase tracking-widest">Summary</p>
                </div>
                <div className="p-4 grid grid-cols-2 gap-3">
                  <Field label="Audit Date" value={auditDate || "—"} />
                  <Field label="Auditor" value={displayName(allUsers.find((u) => String(u.id) === String(auditorId))) || "—"} />
                  <Field label="Checklist Items" value={`${items.length} item${items.length !== 1 ? "s" : ""}`} />
                  <Field label="Issues"          value={`${issues.length} issue${issues.length !== 1 ? "s" : ""}`} />
                  {auditNote && <Field label="Audit Note" value={auditNote} className="col-span-2" />}
                </div>
              </div>
              {!canSubmit && (
                <div className="px-3 py-2.5 rounded-xl text-xs flex items-start gap-2"
                  style={{ background: "rgba(245,158,11,.08)", border: "1px solid rgba(245,158,11,.3)", color: "#8b5cf6" }}>
                  <ExclamationTriangleIcon className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                  <span>Please fill in Audit Date and Auditor before submitting.</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between px-5 py-4 flex-shrink-0" style={{ borderTop: "1px solid var(--border)" }}>
          <button onClick={() => setTab((t) => Math.max(0, t - 1))} disabled={tab === 0}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold disabled:opacity-30 hover:opacity-80"
            style={{ background: "var(--bg-raised)", color: "var(--text-muted)", border: "1px solid var(--border)" }}>
            <ChevronLeftIcon className="h-4 w-4" /> Back
          </button>
          {tab < PERFORM_TABS.length - 1 ? (
            <button onClick={() => setTab((t) => t + 1)}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-sm font-semibold text-white"
              style={{ background: `linear-gradient(135deg, ${ACCENT} 0%, ${ACCENT_DARK} 65%, ${ACCENT_DEEP} 100%)` }}>
              Next <ChevronRightIcon className="h-4 w-4" />
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={!canSubmit || actionLoading}
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-40"
              style={{ background: `linear-gradient(135deg, ${ACCENT} 0%, ${ACCENT_DARK} 65%, ${ACCENT_DEEP} 100%)` }}>
              {actionLoading ? <><Spinner size={4} />Submitting…</> : "Submit Audit"}
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

// ─── Detail Drawer ────────────────────────────────────────────────────────────

function DetailDrawer({ isOpen, record, onClose, onEdit, onReassign, onPerform }) {
  const { hasPermission: can } = useAuth();

  if (!isOpen || !record) return null;

  const performed   = record.performed_ppe_compliances ?? [];
  const auditors    = record.auditors ?? [];
  const issuesCount = performed.reduce((sum, p) => sum + ((p.performed_ppe_compliance_issues ?? p.issues ?? []).length), 0);

  return createPortal(
    <>
      <div className="fixed inset-0" style={{ zIndex: 9990 }}
        onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
        <div className="absolute inset-0"
          style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(3px)" }}
          onClick={onClose} />

        {/* Drawer panel */}
        <div className="absolute top-0 right-0 bottom-0 w-full max-w-xl flex flex-col overflow-hidden"
          style={{ background: "var(--bg-surface)", boxShadow: "-16px 0 48px rgba(0,0,0,0.2), 0 0 0 1px var(--border)" }}>

          {/* Gradient header */}
          <div className="flex-shrink-0 px-6 py-7 relative overflow-hidden"
            style={{ background: `linear-gradient(140deg, ${ACCENT} 0%, ${ACCENT_DARK} 50%, ${ACCENT_DEEP} 100%)` }}>
            <div className="absolute inset-0 pointer-events-none"
              style={{ backgroundImage: "radial-gradient(ellipse at 80% 20%, rgba(255,255,255,0.13) 0%, transparent 55%)" }} />
            <div className="absolute -bottom-12 -right-12 w-48 h-48 rounded-full pointer-events-none"
              style={{ background: "rgba(0,0,0,0.07)" }} />
            <div className="absolute top-6 right-20 w-12 h-12 rounded-full pointer-events-none"
              style={{ background: "rgba(255,255,255,0.06)" }} />

            <button onClick={onClose}
              className="absolute top-4 right-4 p-1.5 rounded-xl hover:opacity-80 transition-opacity"
              style={{ background: "rgba(255,255,255,0.15)", color: "#fff", border: "1px solid rgba(255,255,255,0.2)" }}>
              <XMarkIcon className="h-5 w-5" />
            </button>

            <div className="flex items-start gap-4 pr-8">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(255,255,255,0.18)", boxShadow: "0 0 0 4px rgba(255,255,255,0.08), inset 0 1px 2px rgba(255,255,255,0.15)" }}>
                <ShieldCheckIcon className="h-8 w-8 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white/65 text-[11px] font-bold uppercase tracking-widest mb-0.5">
                  PPE · {PPE_COMPLIANCE_AUDIT_TITLE}
                </p>
                <h2 className="text-white text-xl font-bold leading-tight tracking-tight">
                  {record.audit_number || `#${record.id}`}
                </h2>
                {record.area_audited && (
                  <p className="text-white/70 text-sm mt-1 truncate">{record.area_audited}</p>
                )}
                <div className="mt-2.5 flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-bold"
                    style={{ background: "rgba(255,255,255,0.18)", color: "#fff" }}>
                    {(record.status ?? "—").replace(/_/g, " ")}
                  </span>
                  {record.date && (
                    <span className="text-white/55 text-[11px]">{formatDate(record.date)}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Stats strip */}
            <div className="mt-5 grid grid-cols-3 gap-2">
              {[
                { label: "Auditors", value: auditors.length,  Icon: UsersIcon },
                { label: "Audits",   value: performed.length, Icon: ClipboardDocumentListIcon },
                { label: "Issues",   value: issuesCount,       Icon: ExclamationTriangleIcon },
              ].map(({ label, value, Icon }) => (
                <div key={label} className="rounded-xl px-3 pt-2.5 pb-3 text-center"
                  style={{ background: "rgba(255,255,255,0.12)" }}>
                  <Icon className="h-3.5 w-3.5 text-white/50 mx-auto mb-1.5" />
                  <p className="text-white text-xl font-bold leading-none">{value}</p>
                  <p className="text-white/55 text-[10px] mt-1">{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-7">

            {/* Record Details */}
            <section>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-0.5 h-4 rounded-full" style={{ background: ACCENT }} />
                <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Record Details</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "Date",         value: formatDate(record.date) },
                  { label: "Status",       value: <StatusBadge status={record.status} /> },
                ].map(({ label, value }) => (
                  <div key={label} className="rounded-2xl px-4 py-3"
                    style={{ background: "var(--bg-raised)", border: "1px solid var(--border)" }}>
                    <p className="text-[10px] font-semibold uppercase tracking-wide mb-1.5" style={{ color: "var(--text-muted)" }}>{label}</p>
                    <div className="text-sm font-semibold" style={{ color: "var(--text)" }}>{value}</div>
                  </div>
                ))}
              </div>
              {record.area_audited && (
                <div className="mt-2 rounded-2xl px-4 py-3"
                  style={{ background: "var(--bg-raised)", border: "1px solid var(--border)" }}>
                  <p className="text-[10px] font-semibold uppercase tracking-wide mb-1.5" style={{ color: "var(--text-muted)" }}>Area Audited</p>
                  <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>{record.area_audited}</p>
                </div>
              )}
              <div className="mt-2 flex flex-col gap-2">
                {record.objective_of_audit && (
                  <div className="rounded-2xl px-4 py-3" style={{ background: "var(--bg-raised)", border: "1px solid var(--border)" }}>
                    <p className="text-[10px] font-semibold uppercase tracking-wide mb-1.5" style={{ color: "var(--text-muted)" }}>Objective</p>
                    <p className="text-sm" style={{ color: "var(--text)", lineHeight: 1.5 }}>{record.objective_of_audit}</p>
                  </div>
                )}
                {record.scope_of_audit && (
                  <div className="rounded-2xl px-4 py-3" style={{ background: "var(--bg-raised)", border: "1px solid var(--border)" }}>
                    <p className="text-[10px] font-semibold uppercase tracking-wide mb-1.5" style={{ color: "var(--text-muted)" }}>Scope</p>
                    <p className="text-sm" style={{ color: "var(--text)", lineHeight: 1.5 }}>{record.scope_of_audit}</p>
                  </div>
                )}
              </div>
            </section>

            {/* Assigned Auditors */}
            <section>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-0.5 h-4 rounded-full" style={{ background: ACCENT }} />
                <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Assigned Auditors</p>
              </div>
              {auditors.length === 0 ? (
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>No auditors assigned.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {auditors.map((a) => (
                    <div key={a.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
                      style={{ background: "var(--bg-raised)", border: "1px solid var(--border)" }}>
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                        style={{ background: ACCENT_LIGHT, color: ACCENT }}>
                        {initials(displayName(a))}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate" style={{ color: "var(--text)" }}>{displayName(a)}</p>
                        {a.email && <p className="text-xs truncate" style={{ color: "var(--text-muted)" }}>{a.email}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Audit Log */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-0.5 h-4 rounded-full" style={{ background: ACCENT }} />
                  <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                    Audit Log
                  </p>
                  {performed.length > 0 && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold"
                      style={{ background: ACCENT_LIGHT, color: ACCENT }}>{performed.length}</span>
                  )}
                </div>
                {can("ppe_compliances.update") && (
                  <button onClick={onPerform}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold hover:opacity-90"
                    style={{ background: ACCENT, color: "#fff", boxShadow: `0 2px 10px ${ACCENT}66` }}>
                    <PlayIcon className="h-3.5 w-3.5" /> Perform Audit
                  </button>
                )}
              </div>

              {performed.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 rounded-2xl"
                  style={{ background: "var(--bg-raised)", border: "1px dashed var(--border)" }}>
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3" style={{ background: ACCENT_LIGHT }}>
                    <CalendarDaysIcon className="h-6 w-6" style={{ color: ACCENT }} />
                  </div>
                  <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>No Audits Yet</p>
                  {can("ppe_compliances.update") && (
                    <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                      Click "Perform Audit" to record the first audit.
                    </p>
                  )}
                </div>
              ) : (
                <div className="relative">
                  <div className="absolute top-5 bottom-5 pointer-events-none"
                    style={{ left: 19, width: 2, background: `linear-gradient(to bottom, ${ACCENT}50, transparent)`, borderRadius: 2 }} />
                  <div className="flex flex-col gap-3">
                    {performed.map((p) => {
                      const issueCount = (p.performed_ppe_compliance_issues ?? p.issues ?? []).length;
                      const itemCount  = (p.performed_ppe_compliance_items  ?? p.items  ?? []).length;
                      return (
                        <div key={p.id} className="flex items-start gap-4">
                          <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 z-10"
                            style={{ background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT_DARK})`, boxShadow: `0 3px 12px ${ACCENT}44` }}>
                            <CheckBadgeIcon className="h-5 w-5 text-white" />
                          </div>
                          <div className="flex-1 py-1.5 rounded-2xl px-4"
                            style={{ background: "var(--bg-raised)", border: "1px solid var(--border)" }}>
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>
                                  {formatDate(p.audit_date || p.created_at)}
                                </p>
                                <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                                  {p.auditor ? displayName(p.auditor) : "—"} · {itemCount} item{itemCount !== 1 ? "s" : ""}
                                </p>
                              </div>
                              {issueCount > 0 && (
                                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold flex-shrink-0"
                                  style={{ background: "rgba(239,68,68,.1)", color: "#ef4444" }}>
                                  {issueCount} issue{issueCount !== 1 ? "s" : ""}
                                </span>
                              )}
                            </div>
                            {p.audit_note && (
                              <p className="text-xs mt-1.5 leading-relaxed line-clamp-2"
                                style={{ color: "var(--text-muted)", borderTop: "1px solid var(--border)", paddingTop: 6 }}>
                                {p.audit_note}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </section>
          </div>

          {/* Action buttons */}
          {can("ppe_compliances.update") && (
            <div className="flex gap-2 px-5 py-4 flex-shrink-0" style={{ borderTop: "1px solid var(--border)" }}>
              <button onClick={onEdit}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90"
                style={{ background: "var(--bg-raised)", color: "var(--text)", border: "1px solid var(--border)" }}>
                <PencilSquareIcon className="h-4 w-4" /> Edit
              </button>
              <button onClick={onReassign}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90"
                style={{ background: "var(--bg-raised)", color: "var(--text)", border: "1px solid var(--border)" }}>
                <UsersIcon className="h-4 w-4" /> Reassign
              </button>
            </div>
          )}
        </div>
      </div>
    </>,
    document.body
  );
}

// ─── Action Menu ──────────────────────────────────────────────────────────────

function ActionMenu({ record, onView, onEdit, onDelete, onReassign, onPerform }) {
  const [open, setOpen] = useState(false);
  const [pos,  setPos]  = useState({ top: 0, right: 0 });
  const triggerRef      = useRef(null);
  const menuRef         = useRef(null);
  const { hasPermission } = useAuth();
  const canUpdate = hasPermission("ppe_compliances.update");

  useEffect(() => {
    function handler(e) {
      if (menuRef.current && !menuRef.current.contains(e.target) &&
          triggerRef.current && !triggerRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function handleToggle(e) {
    e.stopPropagation();
    if (!open) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
    }
    setOpen((o) => !o);
  }

  const items = [
    { label: "View Details",      icon: <EyeIcon          className="h-4 w-4" />, action: onView,     show: true },
    ...(canUpdate ? [
      { label: "Start Audit",     icon: <PlayIcon         className="h-4 w-4" />, action: onPerform,  show: true },
      { label: "Edit",            icon: <PencilSquareIcon className="h-4 w-4" />, action: onEdit,     show: true },
      { label: "Reassign Auditors",icon: <UsersIcon       className="h-4 w-4" />, action: onReassign, show: true },
    ] : []),
    { label: "Delete",            icon: <TrashIcon        className="h-4 w-4" />, action: onDelete,   danger: true, show: true },
  ].filter((i) => i.show);

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <button ref={triggerRef} onClick={handleToggle}
        className="p-1.5 rounded-lg hover:opacity-80 transition-opacity"
        style={{ color: "var(--text-muted)" }}>
        <EllipsisVerticalIcon className="h-5 w-5" />
      </button>
      {open && createPortal(
        <div ref={menuRef} style={{
          position: "fixed", top: pos.top, right: pos.right, zIndex: 10001,
          width: 192, borderRadius: 12, overflow: "hidden",
          background: "var(--bg-raised)", border: "1px solid var(--border)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.22)",
        }}>
          {items.map(({ label, icon, action, danger }) => (
            <button key={label} onClick={() => { setOpen(false); action?.(); }}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-left hover:opacity-80"
              style={{ color: danger ? "#ef4444" : "var(--text)" }}>
              {icon} {label}
            </button>
          ))}
        </div>,
        document.body
      )}
    </div>
  );
}

// ─── PPE Compliance Page ──────────────────────────────────────────────────────

const COLS = ["#", "Audit No.", "Area Audited", "Date", "Auditors", "Status", "Performed", ""];

export default function PpeCompliancePage() {
  const dispatch = useAppDispatch();
  const { hasPermission: can } = useAuth();
  const canUpdate = can("ppe_compliances.update");

  const catalog         = useAppSelector(selectPpeComplianceCatalog);
  const catalogLoading  = useAppSelector(selectPpeComplianceCatalogLoading);
  const records         = useAppSelector(selectPpeComplianceRecords);
  const meta            = useAppSelector(selectPpeComplianceRecordsMeta);
  const recordsLoading  = useAppSelector(selectPpeComplianceRecordsLoading);
  const recordsError    = useAppSelector(selectPpeComplianceRecordsError);
  const filters         = useAppSelector(selectPpeComplianceFilters);

  const activeHsaId = catalog?.find((h) => h.title === PPE_COMPLIANCE_AUDIT_TITLE)?.id ?? null;

  // Modal state
  const [setupOpen,      setSetupOpen]      = useState(false);
  const [editRecord,     setEditRecord]     = useState(null);
  const [deleteRecord,   setDeleteRecord]   = useState(null);
  const [reassignRec,    setReassignRec]    = useState(null);
  const [performRec,     setPerformRec]     = useState(null);
  const [drawerRecord,   setDrawerRecord]   = useState(null);
  const [performedModal, setPerformedModal] = useState(null);

  // Debounced audit number search (matches EP pattern)
  const [auditNumberInput, setAuditNumberInput] = useState(filters.audit_number || "");
  useEffect(() => {
    const t = setTimeout(() => dispatch(setPpeComplianceAuditNumber(auditNumberInput)), 400);
    return () => clearTimeout(t);
  }, [auditNumberInput, dispatch]);

  // Fetch catalog
  useEffect(() => {
    dispatch(fetchPpeComplianceCatalog());
  }, [dispatch]);

  // Fetch records when HSA or filters change
  useEffect(() => {
    if (!activeHsaId) return;
    dispatch(fetchPpeComplianceRecords(activeHsaId));
  }, [dispatch, activeHsaId, filters]);

  const handleDelete = async () => {
    const res = await dispatch(deletePpeComplianceRecord({ auditId: activeHsaId, id: deleteRecord.id }));
    if (deletePpeComplianceRecord.fulfilled.match(res)) {
      toast.success("Record deleted.");
      setDeleteRecord(null);
      if (drawerRecord?.id === deleteRecord.id) setDrawerRecord(null);
      dispatch(fetchPpeComplianceRecords(activeHsaId));
    } else {
      toast.error(res.payload || "Failed to delete record.");
    }
  };

  const filtersActive = !!(filters.audit_number || filters.area_audited || filters.date || filters.status);

  if (catalogLoading) return (
    <div className="flex items-center justify-center h-64"><Spinner size={8} /></div>
  );

  if (!activeHsaId) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <ShieldCheckIcon className="h-12 w-12" style={{ color: "var(--text-muted)" }} />
      <p className="text-sm" style={{ color: "var(--text-muted)" }}>PPE Compliance module not configured.</p>
    </div>
  );

  return (
    <div className="space-y-6 pb-8">

      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: `linear-gradient(135deg, ${ACCENT} 0%, ${ACCENT_DARK} 65%, ${ACCENT_DEEP} 100%)`, boxShadow: `0 4px 16px ${ACCENT}50` }}>
            <ShieldCheckIcon className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold" style={{ color: "var(--text)" }}>{PPE_COMPLIANCE_AUDIT_TITLE}</h1>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              Manage PPE compliance audits and track results.
            </p>
          </div>
        </div>
        {canUpdate && (
          <button onClick={() => { setEditRecord(null); setSetupOpen(true); }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold hover:opacity-90 flex-shrink-0"
            style={{ background: `linear-gradient(135deg, ${ACCENT} 0%, ${ACCENT_DARK} 65%, ${ACCENT_DEEP} 100%)`, color: "#fff", boxShadow: `0 4px 16px ${ACCENT}55` }}>
            <PlusIcon className="h-4 w-4" /> New Record
          </button>
        )}
      </div>

      {/* ── Filters ── */}
      <div className="rounded-2xl p-4 flex flex-wrap items-end gap-3"
        style={{ background: "var(--bg-raised)", border: `1px solid ${ACCENT}28`, borderLeft: `3px solid ${ACCENT}` }}>
        <div className="relative w-48">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none"
            style={{ color: "var(--text-muted)" }} />
          <input value={auditNumberInput} onChange={(e) => setAuditNumberInput(e.target.value)}
            placeholder="Audit number…" className="ui-input text-sm pl-9 w-full" />
        </div>
        <input value={filters.area_audited || ""}
          onChange={(e) => dispatch(setPpeComplianceAreaAudited(e.target.value))}
          placeholder="Area audited…" className="ui-input text-sm w-44" />
        <input type="date" value={filters.date || ""}
          onChange={(e) => dispatch(setPpeComplianceDateFilter(e.target.value))}
          className="ui-input text-sm w-44" />
        <select value={filters.status || ""}
          onChange={(e) => dispatch(setPpeComplianceStatusFilter(e.target.value))}
          className="ui-input text-sm w-36">
          <option value="">All statuses</option>
          {PPE_STATUSES.map((s) => (
            <option key={s} value={s}>{STATUS_STYLES[s]?.label || s}</option>
          ))}
        </select>
        {filtersActive && (
          <button onClick={() => { dispatch(clearPpeComplianceFilters()); setAuditNumberInput(""); }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold hover:opacity-80"
            style={{ color: ACCENT, border: `1px solid ${ACCENT}50`, background: ACCENT_LIGHT }}>
            <ArrowPathIcon className="h-3.5 w-3.5" /> Clear
          </button>
        )}
      </div>

      {/* ── Error banner ── */}
      {recordsError && (
        <div className="px-4 py-3 rounded-xl text-sm flex items-center gap-2"
          style={{ background: "rgba(239,68,68,.08)", border: "1px solid rgba(239,68,68,.25)", color: "#ef4444" }}>
          <ExclamationTriangleIcon className="h-4 w-4 flex-shrink-0" />
          <span>{typeof recordsError === "string" ? recordsError : "Failed to load records."}</span>
          <button onClick={() => dispatch(clearPpeComplianceRecordsError())} className="ml-auto hover:opacity-70">
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* ── Table ── */}
      <div className="rounded-2xl overflow-hidden"
        style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: `linear-gradient(90deg, ${ACCENT}22 0%, ${ACCENT}0a 100%)`, borderBottom: `1px solid ${ACCENT}30` }}>
                {COLS.map((col) => (
                  <th key={col} className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider"
                    style={{ color: ACCENT }}>
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recordsLoading ? (
                Array.from({ length: 5 }).map((_, r) => (
                  <tr key={r} style={{ borderBottom: "1px solid var(--border)" }}>
                    {COLS.map((_, c) => (
                      <td key={c} className="px-4 py-3">
                        <div className="h-4 rounded animate-pulse"
                          style={{ background: "var(--bg-raised)", width: c === 0 ? "2rem" : "70%" }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={COLS.length} className="py-16 text-center">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-3"
                      style={{ background: `linear-gradient(135deg, ${ACCENT_LIGHT} 0%, ${ACCENT_MID} 100%)`, border: `1px solid ${ACCENT}30` }}>
                      <ShieldCheckIcon className="h-8 w-8" style={{ color: ACCENT }} />
                    </div>
                    <p className="text-sm font-semibold mb-1" style={{ color: "var(--text)" }}>
                      {filtersActive ? "No records match filters" : "No PPE compliance records yet"}
                    </p>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                      {filtersActive ? "Try clearing your filters." : "Click \"New Record\" to get started."}
                    </p>
                  </td>
                </tr>
              ) : (
                records.map((rec, idx) => {
                  const performed = rec.performed_ppe_compliances ?? [];
                  const auditors  = rec.auditors ?? (rec.auditor ? [rec.auditor] : []);
                  return (
                    <tr key={rec.id}
                      className="hover:opacity-90 cursor-pointer transition-opacity"
                      style={{ borderBottom: "1px solid var(--border)" }}
                      onClick={() => setDrawerRecord(rec)}>
                      <td className="px-4 py-3 text-xs font-bold" style={{ color: "var(--text-muted)" }}>
                        {((filters.page ?? 1) - 1) * 10 + idx + 1}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-semibold text-sm" style={{ color: "var(--text)" }}>
                          #{rec.audit_number}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm" style={{ color: "var(--text)" }}>
                        {rec.area_audited || "—"}
                      </td>
                      <td className="px-4 py-3 text-xs" style={{ color: "var(--text-muted)" }}>
                        {formatDate(rec.date || rec.start_date)}
                      </td>
                      <td className="px-4 py-3">
                        {auditors.length === 0 ? (
                          <span className="text-xs" style={{ color: "var(--text-muted)" }}>—</span>
                        ) : (
                          <div className="flex items-center -space-x-1">
                            {auditors.slice(0, 3).map((a) => (
                              <div key={a.id} title={displayName(a)}
                                className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold"
                                style={{ background: ACCENT_MID, color: ACCENT_DARK, border: `2px solid var(--bg-surface)`, boxShadow: `0 0 0 1px ${ACCENT}50` }}>
                                {initials(displayName(a))}
                              </div>
                            ))}
                            {auditors.length > 3 && (
                              <span className="text-[10px] font-semibold ml-2" style={{ color: "var(--text-muted)" }}>
                                +{auditors.length - 3}
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3"><StatusBadge status={rec.status} /></td>
                      <td className="px-4 py-3">
                        {performed.length > 0 ? (
                          <button
                            className="text-xs px-2.5 py-1 rounded-full font-bold hover:opacity-80"
                            style={{ background: `linear-gradient(135deg, ${ACCENT} 0%, ${ACCENT_DARK} 65%, ${ACCENT_DEEP} 100%)`, color: "#fff", boxShadow: `0 2px 8px ${ACCENT}40` }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setPerformedModal({ performed: performed[performed.length - 1], auditId: activeHsaId });
                            }}>
                            {performed.length} audit{performed.length !== 1 ? "s" : ""}
                          </button>
                        ) : (
                          <span className="text-xs" style={{ color: "var(--text-muted)" }}>None</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <ActionMenu
                          record={rec}
                          onView={() => setDrawerRecord(rec)}
                          onEdit={() => { setEditRecord(rec); setSetupOpen(true); }}
                          onDelete={() => setDeleteRecord(rec)}
                          onPerform={() => setPerformRec(rec)}
                          onReassign={() => setReassignRec(rec)}
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {meta && meta.total_pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 flex-shrink-0"
            style={{ borderTop: "1px solid var(--border)" }}>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              {meta.total_count ?? meta.total} record{(meta.total_count ?? meta.total) !== 1 ? "s" : ""}
            </p>
            <div className="flex items-center gap-1">
              <button onClick={() => dispatch(setPpeCompliancePage((meta.current_page ?? filters.page ?? 1) - 1))}
                disabled={(meta.current_page ?? filters.page ?? 1) <= 1}
                className="p-1.5 rounded-lg disabled:opacity-30 hover:opacity-80"
                style={{ background: "var(--bg-raised)" }}>
                <ChevronLeftIcon className="h-4 w-4" style={{ color: "var(--text-muted)" }} />
              </button>
              <span className="text-xs px-2" style={{ color: "var(--text-muted)" }}>
                {meta.current_page ?? filters.page ?? 1} / {meta.total_pages}
              </span>
              <button onClick={() => dispatch(setPpeCompliancePage((meta.current_page ?? filters.page ?? 1) + 1))}
                disabled={(meta.current_page ?? filters.page ?? 1) >= meta.total_pages}
                className="p-1.5 rounded-lg disabled:opacity-30 hover:opacity-80"
                style={{ background: "var(--bg-raised)" }}>
                <ChevronRightIcon className="h-4 w-4" style={{ color: "var(--text-muted)" }} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Detail Drawer ── */}
      <DetailDrawer
        isOpen={!!drawerRecord}
        record={drawerRecord}
        onClose={() => setDrawerRecord(null)}
        onEdit={() => { setEditRecord(drawerRecord); setSetupOpen(true); }}
        onReassign={() => setReassignRec(drawerRecord)}
        onPerform={() => setPerformRec(drawerRecord)}
      />

      {/* ── Modals ── */}
      {setupOpen && !editRecord && (
        <SetupModal isOpen auditId={activeHsaId} onClose={() => { setSetupOpen(false); setEditRecord(null); }} />
      )}
      {(setupOpen && editRecord) && (
        <SetupModal isOpen record={editRecord} auditId={activeHsaId} onClose={() => { setEditRecord(null); setSetupOpen(false); }} />
      )}
      <PerformModal
        isOpen={!!performRec}
        onClose={() => setPerformRec(null)}
        record={performRec}
        auditId={activeHsaId}
      />
      <ReassignModal
        isOpen={!!reassignRec}
        onClose={() => setReassignRec(null)}
        record={reassignRec}
        auditId={activeHsaId}
      />
      <DeleteConfirmModal
        isOpen={!!deleteRecord}
        onClose={() => setDeleteRecord(null)}
        onConfirm={handleDelete}
        label={deleteRecord?.audit_number ?? "this record"}
      />
      {performedModal && (
        <PerformedDetailModal
          isOpen
          onClose={() => setPerformedModal(null)}
          performed={performedModal.performed}
          auditId={performedModal.auditId}
        />
      )}
    </div>
  );
}
