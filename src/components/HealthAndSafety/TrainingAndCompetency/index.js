/**
 * Health & Safety Audit — Training and Competency Module
 *
 * Key differences from WIR:
 *  - Fully dynamic perform: no template management; checklist items are
 *    free-text entries created at perform time (label + status + comment).
 *  - Setup record has extra fields: objective_of_audit, scope_of_audit.
 *  - Perform item statuses: compliant | partial | non_compliant.
 *  - Accent colour: green (#16a34a).
 */

import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import toast from "react-hot-toast";
import {
  AcademicCapIcon,
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
  BellAlertIcon,
  EllipsisVerticalIcon,
  ClipboardDocumentListIcon,
} from "@heroicons/react/24/outline";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import {
  fetchTcCatalog,
  fetchTcRecords,
  createTcRecord,
  updateTcRecord,
  deleteTcRecord,
  reassignTcAuditors,
  performTcRecord,
  fetchTcIssues,
  updateTcCorrectiveAction,
  updateTcPriorityDueDate,
  assignTcContractor,
  executeTcIssue,
  setTcPage,
  setTcAuditNumber,
  setTcAreaAudited,
  setTcDateFilter,
  setTcStatusFilter,
  clearTcFilters,
  clearTcActionError,
  selectTcCatalog,
  selectTcCatalogLoading,
  selectTcRecords,
  selectTcRecordsMeta,
  selectTcRecordsLoading,
  selectTcActionLoading,
  selectTcFilters,
  selectTcIssuesByPerformed,
} from "../../../store/slices/tcSlice";
import useAuth from "../../../hooks/useAuth";
import UsersService from "../../../services/users.service";
import { HsaParentService } from "../../../services/healthAndSafetyAudit.service";

// ─── Constants ────────────────────────────────────────────────────────────────

const TC_AUDIT_TITLE = "Training and competency";
const ACCENT        = "#16a34a";
const ACCENT_LIGHT  = "rgba(22,163,74,0.12)";

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

const TC_STATUSES     = ["active", "in_progress", "completed", "closed", "pending"];
const PRIORITY_LEVELS = ["low", "medium", "high", "critical"];

// Dynamic checklist item statuses (TC-specific)
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

        {/* Top accent bar */}
        <div className="h-1 w-full" style={{ background: "linear-gradient(90deg, #ef4444, #dc2626)" }} />

        <div className="p-6 flex flex-col items-center gap-5 text-center">

          {/* Icon */}
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

          {/* Text */}
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

          {/* Divider */}
          <div className="w-full h-px" style={{ background: "var(--border)" }} />

          {/* Actions */}
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
  const [query,    setQuery]    = useState("");
  const [results,  setResults]  = useState([]);
  const [searching, setSearching] = useState(false);
  const timer = useRef(null);
  const selectedIds = selected.map((u) => u.id);

  useEffect(() => {
    clearTimeout(timer.current);
    if (!query.trim()) { setResults([]); return; }
    timer.current = setTimeout(() => {
      setSearching(true);
      UsersService.list({
        'q[firstname_or_lastname_or_email_cont]': query,
        'filter[role]': 'auditor',
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
        <div className="rounded-lg overflow-hidden max-h-40 overflow-y-auto"
          style={{ border: "1px solid var(--border)", background: "var(--bg-raised)" }}>
          {results.map((u) => {
            const picked = selectedIds.includes(u.id);
            return (
              <button key={u.id} type="button" onClick={() => onToggle(u)}
                className="w-full flex items-center justify-between px-3 py-2 text-xs hover:opacity-80 text-left">
                <span style={{ color: "var(--text)" }}>{displayName(u)}</span>
                {picked
                  ? <CheckCircleIcon className="h-4 w-4 flex-shrink-0" style={{ color: ACCENT }} />
                  : <PlusIcon className="h-4 w-4 flex-shrink-0" style={{ color: "var(--text-muted)" }} />}
              </button>
            );
          })}
        </div>
      )}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-0.5">
          {selected.map((u) => (
            <span key={u.id} className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold"
              style={{ background: ACCENT_LIGHT, color: ACCENT }}>
              {displayName(u)}
              <button type="button" onClick={() => onToggle(u)} className="hover:opacity-70">
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
  const [query,    setQuery]    = useState("");
  const [results,  setResults]  = useState([]);
  const [searching, setSearching] = useState(false);
  const timer = useRef(null);

  useEffect(() => {
    clearTimeout(timer.current);
    if (!query.trim()) { setResults([]); return; }
    timer.current = setTimeout(() => {
      setSearching(true);
      UsersService.list({
        'q[firstname_or_lastname_or_email_cont]': query,
        'filter[role]': 'contractor',
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
    <div className="flex flex-col gap-1">
      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "var(--text-muted)" }} />
        <input value={query} onChange={(e) => setQuery(e.target.value)}
          placeholder="Search contractor by name…"
          className="ui-input text-sm pl-9 w-full" />
        {searching && <div className="absolute right-3 top-1/2 -translate-y-1/2"><Spinner size={3} /></div>}
      </div>
      {results.length > 0 && (
        <div className="rounded-lg overflow-hidden max-h-36 overflow-y-auto mt-1"
          style={{ border: "1px solid var(--border)", background: "var(--bg-raised)" }}>
          {results.map((u) => (
            <button key={u.id} type="button"
              onClick={() => { onSelect(u); setQuery(""); setResults([]); }}
              className="w-full flex items-center justify-between px-3 py-2 text-xs hover:opacity-80 text-left">
              <span style={{ color: "var(--text)" }}>{displayName(u)}</span>
              <PlusIcon className="h-4 w-4" style={{ color: "var(--text-muted)" }} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Issue Card ───────────────────────────────────────────────────────────────

function TcIssueCard({ issue: initialIssue, auditId, performedId }) {
  const dispatch = useAppDispatch();
  const actionLoading = useAppSelector(selectTcActionLoading);

  const [issue,    setIssue]    = useState(initialIssue);
  const [expanded, setExpanded] = useState(false);

  // Corrective Action
  const [caOpen,  setCaOpen]  = useState(false);
  const [caText,  setCaText]  = useState(issue.corrective_action || "");

  // Priority / Due Date
  const [pdOpen,    setPdOpen]    = useState(false);
  const [priority,  setPriority]  = useState(issue.priority_level || "medium");
  const [dueDate,   setDueDate]   = useState(issue.due_date ? issue.due_date.slice(0, 10) : "");

  // Assign Contractor
  const [acOpen,      setAcOpen]      = useState(false);
  const [contractor,  setContractor]  = useState(issue.contractor || null);

  // Execute
  const [exOpen,        setExOpen]        = useState(false);
  const [compDate,      setCompDate]      = useState("");
  const [compNotes,     setCompNotes]     = useState("");
  const [compFile,      setCompFile]      = useState(null);

  const isExecuted = !!issue.completion_date;

  async function handleSaveCA() {
    if (!caText.trim()) return;
    const r = await dispatch(updateTcCorrectiveAction({ auditId, performedId, issueId: issue.id, correctiveAction: caText.trim() }));
    if (updateTcCorrectiveAction.fulfilled.match(r)) { setIssue(r.payload); setCaOpen(false); toast.success("Corrective action saved."); }
    else toast.error(r.payload || "Failed.");
  }

  async function handleSavePD() {
    if (!priority || !dueDate) return toast.error("Priority and due date are required.");
    const r = await dispatch(updateTcPriorityDueDate({ auditId, performedId, issueId: issue.id, priority_level: priority, due_date: dueDate }));
    if (updateTcPriorityDueDate.fulfilled.match(r)) { setIssue(r.payload); setPdOpen(false); toast.success("Priority updated."); }
    else toast.error(r.payload || "Failed.");
  }

  async function handleAssignContractor(u) {
    setContractor(u);
    const r = await dispatch(assignTcContractor({ auditId, performedId, issueId: issue.id, contractorId: u.id }));
    if (assignTcContractor.fulfilled.match(r)) { setIssue(r.payload); setAcOpen(false); toast.success("Contractor assigned."); }
    else { setContractor(issue.contractor || null); toast.error(r.payload || "Failed."); }
  }

  async function handleExecute() {
    const r = await dispatch(executeTcIssue({ auditId, performedId, issueId: issue.id, completion_date: compDate || undefined, completion_notes: compNotes || undefined, file: compFile || undefined }));
    if (executeTcIssue.fulfilled.match(r)) { setIssue(r.payload); setExOpen(false); toast.success("Issue closed out."); }
    else toast.error(r.payload || "Failed.");
  }

  return (
    <div className="rounded-2xl overflow-hidden"
      style={{ background: "var(--bg-raised)", border: "1px solid var(--border)" }}>

      {/* Header row */}
      <div className="flex items-start gap-3 px-4 py-3 cursor-pointer"
        onClick={() => setExpanded((p) => !p)}>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
          style={{ background: isExecuted ? "rgba(22,163,74,.12)" : "rgba(239,68,68,.08)", color: isExecuted ? ACCENT : "#ef4444" }}>
          {isExecuted
            ? <CheckCircleIcon className="h-4 w-4" />
            : <ExclamationTriangleIcon className="h-4 w-4" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold leading-snug" style={{ color: "var(--text)" }}>{issue.name}</p>
            {isExecuted && (
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold"
                style={{ background: "rgba(22,163,74,.12)", color: ACCENT }}>Closed</span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            {issue.priority_level && <PriorityBadge priority={issue.priority_level} />}
            {issue.due_date && (
              <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                Due {formatDate(issue.due_date)}
              </span>
            )}
            {issue.contractor && (
              <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                · {displayName(issue.contractor)}
              </span>
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

          {/* Action buttons */}
          {!isExecuted && (
            <div className="flex flex-wrap gap-2">
              {[
                { label: "Corrective Action", onClick: () => setCaOpen((p) => !p), active: caOpen, icon: <WrenchScrewdriverIcon className="h-3.5 w-3.5" /> },
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

          {/* Corrective Action inline form */}
          {caOpen && (
            <div className="rounded-xl p-3 flex flex-col gap-2" style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}>
              <textarea value={caText} onChange={(e) => setCaText(e.target.value)}
                rows={3} placeholder="Describe the corrective action…"
                className="ui-input text-sm resize-none" />
              <div className="flex gap-2">
                <button onClick={handleSaveCA} disabled={actionLoading || !caText.trim()}
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold hover:opacity-80 disabled:opacity-40"
                  style={{ background: ACCENT, color: "#fff" }}>
                  Save
                </button>
                <button onClick={() => setCaOpen(false)}
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold hover:opacity-80"
                  style={{ background: "var(--bg-raised)", color: "var(--text-muted)", border: "1px solid var(--border)" }}>
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Priority / Due Date inline form */}
          {pdOpen && (
            <div className="rounded-xl p-3 flex flex-col gap-2" style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}>
              <div className="flex gap-2">
                <select value={priority} onChange={(e) => setPriority(e.target.value)}
                  className="ui-input text-sm flex-1">
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
                  style={{ background: ACCENT, color: "#fff" }}>
                  Save
                </button>
                <button onClick={() => setPdOpen(false)}
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold hover:opacity-80"
                  style={{ background: "var(--bg-raised)", color: "var(--text-muted)", border: "1px solid var(--border)" }}>
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Assign Contractor inline form */}
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

          {/* Execute inline form */}
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
                  style={{ background: "var(--bg-raised)", color: "var(--text-muted)", border: "1px solid var(--border)" }}>
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Existing data display */}
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
              <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: ACCENT }}>
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
  const [activeTab, setActiveTab] = useState("issues");

  useEffect(() => { if (isOpen) setActiveTab("issues"); }, [isOpen]);

  if (!isOpen || !performed) return null;

  const issues = performed.performed_training_and_competency_issues || [];
  const items  = performed.performed_training_and_competency_items   || [];

  const auditorName    = displayName(performed.auditor);
  const auditorInitial = initials(auditorName);

  const ITEM_STATUS_MAP = {
    compliant:     { bg: "rgba(22,163,74,.08)",   border: "#16a34a", color: "#16a34a", label: "Compliant",     icon: <CheckCircleIcon className="h-3.5 w-3.5" /> },
    partial:       { bg: "rgba(245,158,11,.08)",  border: "#f59e0b", color: "#f59e0b", label: "Partial",       icon: <ExclamationTriangleIcon className="h-3.5 w-3.5" /> },
    non_compliant: { bg: "rgba(239,68,68,.06)",   border: "#ef4444", color: "#ef4444", label: "Non-Compliant", icon: <XMarkIcon className="h-3.5 w-3.5" /> },
  };

  const tabs = [
    { key: "issues", label: "Issues",          count: issues.length },
    { key: "items",  label: "Checklist Items", count: items.length },
  ];

  return createPortal(
    <div className="fixed inset-0 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.6)", zIndex: 10002, backdropFilter: "blur(4px)" }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-2xl flex flex-col rounded-2xl overflow-hidden"
        style={{ background: "var(--bg-surface)", boxShadow: "0 25px 60px rgba(0,0,0,0.3), 0 0 0 1px var(--border)", maxHeight: "90vh" }}>

        {/* Header */}
        <div className="relative overflow-hidden flex-shrink-0 px-6 py-5"
          style={{ background: `linear-gradient(135deg, rgba(22,163,74,0.08) 0%, rgba(22,163,74,0.03) 50%, transparent 100%)`, borderBottom: "1px solid var(--border)" }}>
          <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full pointer-events-none"
            style={{ background: "radial-gradient(circle, rgba(22,163,74,0.1) 0%, transparent 70%)" }} />

          <div className="flex items-center gap-4 relative">
            <div className="flex-shrink-0 flex items-center justify-center rounded-2xl text-white text-base font-bold"
              style={{ width: 52, height: 52, background: `linear-gradient(135deg, ${ACCENT} 0%, #15803d 100%)`, boxShadow: "0 4px 14px rgba(22,163,74,0.4)" }}>
              {auditorInitial}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-widest mb-0.5" style={{ color: ACCENT }}>
                Performed Audit
              </p>
              <h2 className="text-lg font-bold leading-tight" style={{ color: "var(--text)" }}>
                {formatDate(performed.audit_date || performed.created_at)}
              </h2>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                Conducted by {auditorName}
              </p>
            </div>
            <div className="flex flex-col items-end gap-2 flex-shrink-0">
              <button onClick={onClose}
                className="p-2 rounded-xl hover:opacity-70"
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
              {issues.length === 0 ? (
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
                  {issues.map((iss) => (
                    <TcIssueCard key={iss.id} issue={iss} auditId={auditId} performedId={performed.id} />
                  ))}
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
              ) : (() => {
                const compliantCount     = items.filter((i) => (i.status ?? "").toLowerCase() === "compliant").length;
                const partialCount       = items.filter((i) => (i.status ?? "").toLowerCase() === "partial").length;
                const nonCompliantCount  = items.filter((i) => (i.status ?? "").toLowerCase() === "non_compliant").length;

                return (
                  <div className="flex flex-col gap-4">
                    {/* Summary bar */}
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
                                {item.checklist_item || item.label || `Item #${idx + 1}`}
                              </p>
                              {item.comment && (
                                <p className="text-xs mt-1 leading-relaxed" style={{ color: "var(--text-muted)" }}>{item.comment}</p>
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
                );
              })()}
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

function StepIndicator({ steps, current, completed }) {
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

// ─── Setup Modal (Create / Edit) ──────────────────────────────────────────────

function SetupModal({ isOpen, onClose, record, auditId }) {
  const dispatch      = useAppDispatch();
  const actionLoading = useAppSelector(selectTcActionLoading);

  const isEdit = !!record;

  const STEPS = ["Basic Info", "Assign Auditors", "Review"];
  const EMPTY = { audit_number: "", area_audited: "", date: "", status: "pending", objective_of_audit: "", scope_of_audit: "" };

  const [step,           setStep]           = useState(1);
  const [completedSteps, setCompletedSteps] = useState([]);
  const [form,           setForm]           = useState(EMPTY);
  const [errors,         setErrors]         = useState({});
  const [auditors,       setAuditors]       = useState([]);

  useEffect(() => {
    if (!isOpen) return;
    dispatch(clearTcActionError());
    setStep(1);
    setCompletedSteps([]);
    setErrors({});
    if (isEdit) {
      setForm({
        audit_number:       record.audit_number       || "",
        area_audited:       record.area_audited        || "",
        date:               record.date ? record.date.slice(0, 10) : "",
        status:             record.status              || "pending",
        objective_of_audit: record.objective_of_audit  || "",
        scope_of_audit:     record.scope_of_audit      || "",
      });
      setAuditors(record.auditors || []);
    } else {
      setForm({ ...EMPTY, date: new Date().toISOString().slice(0, 10) });
      setAuditors([]);
    }
  }, [isOpen, record, isEdit]);

  function set(k, v) { setForm((p) => ({ ...p, [k]: v })); setErrors((e) => ({ ...e, [k]: "" })); }

  function toggleAuditor(u) {
    setAuditors((prev) => prev.some((a) => a.id === u.id) ? prev.filter((a) => a.id !== u.id) : [...prev, u]);
    setErrors((e) => ({ ...e, auditors: "" }));
  }

  function validateStep(s) {
    const e = {};
    if (s === 1) {
      if (!form.audit_number.trim())       e.audit_number       = "Audit number is required.";
      if (!form.area_audited.trim())        e.area_audited       = "Area audited is required.";
      if (!form.date)                       e.date               = "Date is required.";
      if (!form.status)                     e.status             = "Status is required.";
      if (!form.objective_of_audit.trim())  e.objective_of_audit = "Objective of audit is required.";
      if (!form.scope_of_audit.trim())      e.scope_of_audit     = "Scope of audit is required.";
    }
    if (s === 2 && !isEdit && auditors.length === 0) {
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
      auditor_ids:        auditors.map((u) => u.id),
    };
    const result = isEdit
      ? await dispatch(updateTcRecord({ auditId, id: record.id, data }))
      : await dispatch(createTcRecord({ auditId, data }));
    const ok = isEdit ? updateTcRecord.fulfilled.match(result) : createTcRecord.fulfilled.match(result);
    if (ok) {
      toast.success(isEdit ? "Record updated." : "Record created.");
      dispatch(fetchTcRecords(auditId));
      onClose();
    } else {
      toast.error(result.payload || "Failed.");
    }
  }

  return (
    <ModalShell isOpen={isOpen} onClose={onClose}
      title={isEdit ? "Edit Record" : "New Training & Competency Record"}
      width="max-w-xl">

      <StepIndicator steps={STEPS} current={step} completed={completedSteps} />

      <div className="flex-1 overflow-y-auto">

        {/* ── Step 1 · Basic Info ── */}
        {step === 1 && (
          <div className="p-6 flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Audit Number" required error={errors.audit_number}>
                <input value={form.audit_number} onChange={(e) => set("audit_number", e.target.value)}
                  placeholder="e.g. TC-2025-001" className="ui-input text-sm" autoFocus />
              </Field>
              <Field label="Date" required error={errors.date}>
                <input type="date" value={form.date} onChange={(e) => set("date", e.target.value)}
                  className="ui-input text-sm" />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Area Audited" required error={errors.area_audited}>
                <input value={form.area_audited} onChange={(e) => set("area_audited", e.target.value)}
                  placeholder="e.g. Operations Floor" className="ui-input text-sm" />
              </Field>
              <Field label="Status" required error={errors.status}>
                <select value={form.status} onChange={(e) => set("status", e.target.value)} className="ui-input text-sm">
                  {TC_STATUSES.map((s) => (
                    <option key={s} value={s}>{STATUS_STYLES[s]?.label || s}</option>
                  ))}
                </select>
              </Field>
            </div>
            <Field label="Objective of Audit" required error={errors.objective_of_audit}>
              <textarea value={form.objective_of_audit} onChange={(e) => set("objective_of_audit", e.target.value)}
                rows={3} placeholder="Describe the objective of this audit…"
                className="ui-input text-sm resize-none" />
            </Field>
            <Field label="Scope of Audit" required error={errors.scope_of_audit}>
              <textarea value={form.scope_of_audit} onChange={(e) => set("scope_of_audit", e.target.value)}
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
              selected={auditors}
              onToggle={toggleAuditor}
              label="Search & assign auditors"
            />
            {errors.auditors && (
              <p className="text-[11px]" style={{ color: "#ef4444" }}>{errors.auditors}</p>
            )}
          </div>
        )}

        {/* ── Step 3 · Review ── */}
        {step === 3 && (
          <div className="flex flex-col gap-0">

            {/* Hero banner */}
            <div className="relative overflow-hidden px-6 py-5 flex-shrink-0"
              style={{ background: `linear-gradient(135deg, ${ACCENT} 0%, #15803d 60%, #166534 100%)` }}>
              {/* Decorative circles */}
              <div className="absolute -top-6 -right-6 w-28 h-28 rounded-full pointer-events-none"
                style={{ background: "rgba(255,255,255,0.08)" }} />
              <div className="absolute bottom-0 left-10 w-16 h-16 rounded-full pointer-events-none"
                style={{ background: "rgba(255,255,255,0.05)" }} />
              <div className="relative flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)" }}>
                  <AcademicCapIcon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/70 mb-0.5">
                    Training &amp; Competency
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
                  {
                    icon: <ClipboardDocumentListIcon className="h-4 w-4" />,
                    label: "Audit Number",
                    value: form.audit_number || "—",
                  },
                  {
                    icon: <CalendarDaysIcon className="h-4 w-4" />,
                    label: "Date",
                    value: formatDate(form.date),
                  },
                  {
                    icon: <MagnifyingGlassIcon className="h-4 w-4" />,
                    label: "Area Audited",
                    value: form.area_audited || "—",
                  },
                  {
                    icon: <CheckBadgeIcon className="h-4 w-4" />,
                    label: "Status",
                    value: <StatusBadge status={form.status} />,
                  },
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
              <div className="rounded-xl overflow-hidden"
                style={{ border: "1px solid var(--border)" }}>
                <div className="flex items-center gap-2 px-4 py-2.5"
                  style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-raised)" }}>
                  <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: ACCENT }} />
                  <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: ACCENT }}>
                    Objective of Audit
                  </p>
                </div>
                <p className="px-4 py-3 text-sm leading-relaxed"
                  style={{ color: form.objective_of_audit ? "var(--text)" : "var(--text-muted)" }}>
                  {form.objective_of_audit || "Not specified"}
                </p>
              </div>

              {/* Scope */}
              <div className="rounded-xl overflow-hidden"
                style={{ border: "1px solid var(--border)" }}>
                <div className="flex items-center gap-2 px-4 py-2.5"
                  style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-raised)" }}>
                  <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: ACCENT }} />
                  <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: ACCENT }}>
                    Scope of Audit
                  </p>
                </div>
                <p className="px-4 py-3 text-sm leading-relaxed"
                  style={{ color: form.scope_of_audit ? "var(--text)" : "var(--text-muted)" }}>
                  {form.scope_of_audit || "Not specified"}
                </p>
              </div>

              {/* Auditors */}
              <div className="rounded-xl overflow-hidden"
                style={{ border: "1px solid var(--border)" }}>
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
                    {auditors.length}
                  </span>
                </div>
                <div className="px-4 py-3">
                  {auditors.length === 0 ? (
                    <div className="flex items-center gap-2 py-1">
                      <ExclamationTriangleIcon className="h-3.5 w-3.5 flex-shrink-0" style={{ color: "#f59e0b" }} />
                      <span className="text-xs" style={{ color: "var(--text-muted)" }}>No auditors assigned</span>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {auditors.map((a) => {
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
        {step > 1
          ? (
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
          )
        }
        {step < STEPS.length
          ? (
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
          )
        }
      </div>
    </ModalShell>
  );
}

// ─── Reassign Auditors Modal ──────────────────────────────────────────────────

function ReassignModal({ isOpen, onClose, record, auditId }) {
  const dispatch      = useAppDispatch();
  const actionLoading = useAppSelector(selectTcActionLoading);
  const [auditors, setAuditors] = useState([]);

  useEffect(() => {
    if (!isOpen || !record) return;
    setAuditors(record.auditors || []);
  }, [isOpen, record]);

  async function handleSave() {
    if (auditors.length === 0) return toast.error("At least one auditor is required.");
    const result = await dispatch(reassignTcAuditors({ auditId, id: record.id, auditorIds: auditors.map((a) => a.id) }));
    if (reassignTcAuditors.fulfilled.match(result)) { toast.success("Auditors updated."); onClose(); }
    else toast.error(result.payload || "Failed.");
  }

  return (
    <ModalShell isOpen={isOpen} onClose={onClose} title="Reassign Auditors" width="max-w-md">
      <div className="p-6 flex-1 overflow-y-auto">
        <AuditorPicker selected={auditors} onToggle={(u) => setAuditors((p) => p.find((x) => x.id === u.id) ? p.filter((x) => x.id !== u.id) : [...p, u])} />
      </div>
      <div className="flex gap-3 px-6 py-4 flex-shrink-0" style={{ borderTop: "1px solid var(--border)" }}>
        <button onClick={onClose}
          className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold hover:opacity-80"
          style={{ background: "var(--bg-raised)", color: "var(--text-muted)", border: "1px solid var(--border)" }}>
          Cancel
        </button>
        <button onClick={handleSave} disabled={actionLoading}
          className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2"
          style={{ background: ACCENT, color: "#fff" }}>
          {actionLoading ? <Spinner size={4} /> : null} Save
        </button>
      </div>
    </ModalShell>
  );
}

// ─── Perform Modal ────────────────────────────────────────────────────────────
// TC is fully dynamic: users add checklist items as free-text at perform time.

function PerformModal({ isOpen, onClose, record, auditId }) {
  const dispatch      = useAppDispatch();
  const actionLoading = useAppSelector(selectTcActionLoading);
  const { user: currentUser } = useAuth();

  const TABS = ["Audit Info", "Checklist Items", "Issues", "Summary"];

  const [activeTab, setActiveTab] = useState(0);
  const [form, setForm] = useState({ audit_date: "", audit_note: "" });
  const [errors, setErrors] = useState({});

  // Dynamic checklist items: each row = { label, status, comment }
  const [items, setItems] = useState([{ label: "", status: "compliant", comment: "" }]);
  const [itemErrors, setItemErrors] = useState([{}]);

  // Issues
  const [issues, setIssues] = useState([{ name: "", priority_level: "medium", due_date: "", file: null }]);
  const [issueErrors, setIssueErrors] = useState([{}]);

  useEffect(() => {
    if (!isOpen) return;
    setActiveTab(0);
    setForm({ audit_date: new Date().toISOString().slice(0, 10), audit_note: "" });
    setErrors({});
    setItems([{ label: "", status: "compliant", comment: "" }]);
    setItemErrors([{}]);
    setIssues([{ name: "", priority_level: "medium", due_date: "", file: null }]);
    setIssueErrors([{}]);
  }, [isOpen]);

  // Checklist item helpers
  function addItem()          { setItems((p) => [...p, { label: "", status: "compliant", comment: "" }]); setItemErrors((p) => [...p, {}]); }
  function removeItem(idx)    { if (items.length === 1) return; setItems((p) => p.filter((_, i) => i !== idx)); setItemErrors((p) => p.filter((_, i) => i !== idx)); }
  function updateItem(idx, k, v) {
    setItems((p) => p.map((it, i) => i === idx ? { ...it, [k]: v } : it));
    if (k === "label") setItemErrors((p) => p.map((e, i) => i === idx ? { ...e, label: "" } : e));
  }

  // Issue helpers
  function addIssue()            { setIssues((p) => [...p, { name: "", priority_level: "medium", due_date: "", file: null }]); setIssueErrors((p) => [...p, {}]); }
  function removeIssue(idx)      { setIssues((p) => p.filter((_, i) => i !== idx)); setIssueErrors((p) => p.filter((_, i) => i !== idx)); }
  function updateIssue(idx, k, v) {
    setIssues((p) => p.map((iss, i) => i === idx ? { ...iss, [k]: v } : iss));
    if (k === "name") setIssueErrors((p) => p.map((e, i) => i === idx ? { ...e, name: "" } : e));
  }

  function validate() {
    const e = {};
    if (!form.audit_date) e.audit_date = "Audit date is required.";
    setErrors(e);

    const hasRealItems = items.some((it) => it.label.trim());
    const ie = items.map((it) => {
      if (!it.label.trim() && (it.comment || items.length > 1)) return { label: "Item label is required." };
      return {};
    });
    setItemErrors(ie);

    const issE = issues.map((iss) => {
      const hasData = iss.due_date || iss.file;
      if (hasData && !iss.name.trim()) return { name: "Issue name is required." };
      return {};
    });
    setIssueErrors(issE);

    const itemsValid = hasRealItems && ie.every((x) => Object.keys(x).length === 0);
    const issuesValid = issE.every((x) => Object.keys(x).length === 0);

    if (!itemsValid && !e.audit_date) {
      // jump to items tab if items are invalid
      if (!hasRealItems || ie.some((x) => Object.keys(x).length > 0)) {
        setActiveTab(1);
      }
    }
    if (Object.keys(e).length > 0) setActiveTab(0);

    return Object.keys(e).length === 0 && itemsValid && issuesValid;
  }

  async function handleSubmit() {
    if (!validate() || !record) return;

    const performedChecklist = items
      .filter((it) => it.label.trim())
      .map((it, idx) => ({
        label:    it.label.trim(),
        status:   it.status,
        comment:  it.comment.trim() || undefined,
        position: idx + 1,
      }));

    const issuesPayload = issues.filter((iss) => iss.name.trim()).map((iss) => ({
      name:           iss.name,
      priority_level: iss.priority_level || undefined,
      due_date:       iss.due_date       || undefined,
      file:           iss.file           || undefined,
    }));

    const payload = {
      audit_date:         form.audit_date,
      audit_note:         form.audit_note.trim() || undefined,
      auditor_id:         record?.auditors?.[0]?.id || currentUser?.id,
      performedChecklist,
      issues:             issuesPayload,
    };

    const result = await dispatch(performTcRecord({ auditId, tcId: record.id, payload }));
    if (performTcRecord.fulfilled.match(result)) {
      toast.success("Audit performed successfully.");
      dispatch(fetchTcRecords(auditId));
      onClose();
    } else {
      toast.error(result.payload || "Failed to perform audit.");
    }
  }

  const allItemsFilled = items.filter((it) => it.label.trim());

  return (
    <ModalShell isOpen={isOpen} onClose={onClose} title="Perform Audit" width="max-w-2xl">
      {/* Tab bar */}
      <div className="flex overflow-x-auto flex-shrink-0" style={{ borderBottom: "1px solid var(--border)" }}>
        {TABS.map((tab, idx) => (
          <button key={tab} onClick={() => setActiveTab(idx)}
            className="px-5 py-3 text-xs font-semibold whitespace-nowrap transition-all border-b-2"
            style={{ borderBottomColor: activeTab === idx ? ACCENT : "transparent", color: activeTab === idx ? ACCENT : "var(--text-muted)", background: "transparent" }}>
            {tab}
          </button>
        ))}
      </div>

      <div className="p-6 overflow-y-auto flex-1">

        {/* ── Tab 0: Audit Info ── */}
        {activeTab === 0 && (
          <div className="flex flex-col gap-6">
            {/* Banner */}
            <div className="relative rounded-2xl overflow-hidden p-5"
              style={{ background: `linear-gradient(135deg, ${ACCENT}22 0%, ${ACCENT}06 100%)`, border: `1px solid ${ACCENT}33` }}>
              <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full pointer-events-none"
                style={{ background: `radial-gradient(circle, ${ACCENT}22, transparent 70%)` }} />
              <div className="flex items-start gap-4 relative">
                <div className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: `linear-gradient(135deg, ${ACCENT}, #15803d)`, boxShadow: `0 6px 18px ${ACCENT}55` }}>
                  <AcademicCapIcon className="h-7 w-7 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: ACCENT }}>Performing Audit</p>
                  <p className="text-base font-bold" style={{ color: "var(--text)" }}>{record?.area_audited || "—"}</p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>Audit #{record?.audit_number}</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <Field label="Audit Date" required error={errors.audit_date}>
                <input type="date" value={form.audit_date}
                  onChange={(e) => { setForm((f) => ({ ...f, audit_date: e.target.value })); setErrors({}); }}
                  className="ui-input text-sm" />
              </Field>
              <Field label="Audit Note">
                <textarea value={form.audit_note} onChange={(e) => setForm((f) => ({ ...f, audit_note: e.target.value }))}
                  placeholder="General observations, findings, or notes about this audit…"
                  rows={4} className="ui-input text-sm resize-none" />
              </Field>
            </div>
          </div>
        )}

        {/* ── Tab 1: Checklist Items (dynamic) ── */}
        {activeTab === 1 && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>
                Checklist Items
                <span className="ml-2 text-[11px] font-normal" style={{ color: "var(--text-muted)" }}>
                  Add items that were assessed during this audit.
                </span>
              </p>
              <button onClick={addItem}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold hover:opacity-80"
                style={{ background: ACCENT_LIGHT, color: ACCENT }}>
                <PlusIcon className="h-3.5 w-3.5" /> Add Item
              </button>
            </div>

            {items.map((item, idx) => (
              <div key={idx} className="rounded-xl p-4 flex flex-col gap-3"
                style={{ background: "var(--bg-raised)", border: "1px solid var(--border)" }}>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center"
                    style={{ background: ACCENT_LIGHT, color: ACCENT }}>{idx + 1}</span>
                  <input value={item.label} onChange={(e) => updateItem(idx, "label", e.target.value)}
                    placeholder="Checklist item label…"
                    className="ui-input text-sm flex-1" />
                  {items.length > 1 && (
                    <button onClick={() => removeItem(idx)} className="p-1.5 rounded-lg hover:opacity-70 flex-shrink-0"
                      style={{ color: "#ef4444" }}>
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  )}
                </div>
                {itemErrors[idx]?.label && (
                  <p className="text-[11px]" style={{ color: "#ef4444" }}>{itemErrors[idx].label}</p>
                )}

                {/* Status buttons */}
                <div className="flex gap-1.5 flex-wrap">
                  {PERFORM_STATUSES.map((s) => (
                    <button key={s} type="button" onClick={() => updateItem(idx, "status", s)}
                      className="px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all"
                      style={{
                        background: item.status === s
                          ? (s === "compliant" ? ACCENT : s === "partial" ? "#f59e0b" : "#ef4444")
                          : "var(--bg-surface)",
                        color: item.status === s ? "#fff" : "var(--text-muted)",
                        border: `1px solid ${item.status === s
                          ? (s === "compliant" ? ACCENT : s === "partial" ? "#f59e0b" : "#ef4444")
                          : "var(--border)"}`,
                      }}>
                      {PERFORM_STATUS_LABELS[s]}
                    </button>
                  ))}
                </div>

                {/* Comment */}
                <textarea value={item.comment} onChange={(e) => updateItem(idx, "comment", e.target.value)}
                  placeholder="Comment (optional)…"
                  rows={2} className="ui-input text-xs resize-none" />
              </div>
            ))}
          </div>
        )}

        {/* ── Tab 2: Issues ── */}
        {activeTab === 2 && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>Issues Found
                <span className="ml-2 text-[11px] font-normal" style={{ color: "var(--text-muted)" }}>Optional</span>
              </p>
              <button onClick={addIssue}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold hover:opacity-80"
                style={{ background: ACCENT_LIGHT, color: ACCENT }}>
                <PlusIcon className="h-3.5 w-3.5" /> Add Issue
              </button>
            </div>

            {issues.map((iss, idx) => (
              <div key={idx} className="rounded-xl p-4 flex flex-col gap-3"
                style={{ background: "var(--bg-raised)", border: "1px solid var(--border)" }}>
                <div className="flex items-center gap-2">
                  <input value={iss.name} onChange={(e) => updateIssue(idx, "name", e.target.value)}
                    placeholder="Issue name…" className="ui-input text-sm flex-1" />
                  <button onClick={() => removeIssue(idx)} className="p-1.5 rounded-lg hover:opacity-70 flex-shrink-0"
                    style={{ color: "#ef4444" }}>
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
                {issueErrors[idx]?.name && (
                  <p className="text-[11px]" style={{ color: "#ef4444" }}>{issueErrors[idx].name}</p>
                )}
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-semibold" style={{ color: "var(--text-muted)" }}>Priority</label>
                    <select value={iss.priority_level} onChange={(e) => updateIssue(idx, "priority_level", e.target.value)}
                      className="ui-input text-sm">
                      {PRIORITY_LEVELS.map((p) => (
                        <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-semibold" style={{ color: "var(--text-muted)" }}>Due Date</label>
                    <input type="date" value={iss.due_date} onChange={(e) => updateIssue(idx, "due_date", e.target.value)}
                      className="ui-input text-sm" />
                  </div>
                </div>
                <Field label="Supporting Document">
                  <label className="flex items-center gap-2 px-3 py-2 rounded-xl cursor-pointer hover:opacity-80 transition-opacity"
                    style={{ border: "2px dashed var(--border)", background: "var(--bg-surface)" }}>
                    <PaperClipIcon className="h-4 w-4 flex-shrink-0" style={{ color: iss.file ? ACCENT : "var(--text-muted)" }} />
                    <span className="text-xs truncate" style={{ color: iss.file ? ACCENT : "var(--text-muted)" }}>
                      {iss.file ? iss.file.name : "Attach file (optional)"}
                    </span>
                    {iss.file && (
                      <span onClick={(e) => { e.preventDefault(); updateIssue(idx, "file", null); }}
                        className="ml-auto flex-shrink-0 hover:opacity-70">
                        <XMarkIcon className="h-3.5 w-3.5" style={{ color: ACCENT }} />
                      </span>
                    )}
                    <input type="file" className="hidden" onChange={(e) => updateIssue(idx, "file", e.target.files?.[0] || null)} />
                  </label>
                </Field>
              </div>
            ))}
          </div>
        )}

        {/* ── Tab 3: Summary ── */}
        {activeTab === 3 && (() => {
          const compliantCount    = allItemsFilled.filter((i) => i.status === "compliant").length;
          const partialCount      = allItemsFilled.filter((i) => i.status === "partial").length;
          const nonCompliantCount = allItemsFilled.filter((i) => i.status === "non_compliant").length;
          const totalItems        = allItemsFilled.length;
          const filledIssues      = issues.filter((i) => i.name.trim());
          const complianceRate    = totalItems > 0 ? Math.round((compliantCount / totalItems) * 100) : 0;

          return (
            <div className="flex flex-col gap-0 -mx-6 -mt-6">

              {/* ── Hero banner ── */}
              <div className="relative overflow-hidden px-6 py-6 flex-shrink-0"
                style={{ background: `linear-gradient(140deg, ${ACCENT} 0%, #15803d 55%, #166534 100%)` }}>
                {/* decorative blobs */}
                <div className="absolute -top-8 -right-8 w-36 h-36 rounded-full pointer-events-none"
                  style={{ background: "rgba(255,255,255,0.07)" }} />
                <div className="absolute bottom-0 left-8 w-20 h-20 rounded-full pointer-events-none"
                  style={{ background: "rgba(255,255,255,0.04)" }} />

                <div className="relative flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)" }}>
                    <AcademicCapIcon className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/60 mb-0.5">
                      Audit Summary — Training &amp; Competency
                    </p>
                    <p className="text-lg font-black text-white leading-tight truncate">
                      {record?.area_audited || "—"}
                    </p>
                    <p className="text-[11px] text-white/70 mt-0.5">
                      #{record?.audit_number} &nbsp;·&nbsp; {formatDate(form.audit_date)}
                    </p>
                  </div>
                  {/* Compliance ring */}
                  <div className="flex-shrink-0 flex flex-col items-center gap-0.5">
                    <div className="w-14 h-14 rounded-full flex items-center justify-center"
                      style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)" }}>
                      <span className="text-lg font-black text-white leading-none">{complianceRate}%</span>
                    </div>
                    <span className="text-[9px] font-bold uppercase tracking-widest text-white/60">
                      Compliant
                    </span>
                  </div>
                </div>
              </div>

              {/* ── Stat tiles ── */}
              <div className="grid grid-cols-3 gap-0 border-b" style={{ borderColor: "var(--border)" }}>
                {[
                  { label: "Compliant",     value: compliantCount,    color: "#16a34a", bg: "rgba(22,163,74,0.07)",   icon: <CheckCircleIcon className="h-5 w-5" /> },
                  { label: "Partial",       value: partialCount,      color: "#f59e0b", bg: "rgba(245,158,11,0.07)",  icon: <ExclamationTriangleIcon className="h-5 w-5" /> },
                  { label: "Non-Compliant", value: nonCompliantCount, color: "#ef4444", bg: "rgba(239,68,68,0.07)",   icon: <XMarkIcon className="h-5 w-5" /> },
                ].map(({ label, value, color, bg, icon }, i) => (
                  <div key={label}
                    className="flex flex-col items-center justify-center gap-2 py-5"
                    style={{
                      background: bg,
                      borderRight: i < 2 ? "1px solid var(--border)" : "none",
                    }}>
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                      style={{ background: `${color}18`, color }}>
                      {icon}
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-black leading-none" style={{ color }}>{value}</p>
                      <p className="text-[10px] font-semibold uppercase tracking-wide mt-0.5" style={{ color: "var(--text-muted)" }}>{label}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* ── Content ── */}
              <div className="p-6 flex flex-col gap-4">

                {/* Audit info row */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: "Total Items",    value: totalItems,              icon: <ClipboardDocumentListIcon className="h-4 w-4" /> },
                    { label: "Issues Raised",  value: filledIssues.length,     icon: <ExclamationTriangleIcon className="h-4 w-4" /> },
                    { label: "Audit Date",     value: formatDate(form.audit_date), icon: <CalendarDaysIcon className="h-4 w-4" /> },
                  ].map(({ label, value, icon }) => (
                    <div key={label} className="flex flex-col gap-2 rounded-xl px-3.5 py-3"
                      style={{ background: "var(--bg-raised)", border: "1px solid var(--border)" }}>
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                        style={{ background: ACCENT_LIGHT, color: ACCENT }}>
                        {icon}
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>{label}</p>
                        <p className="text-sm font-bold mt-0.5" style={{ color: "var(--text)" }}>{value}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Compliance progress bar */}
                {totalItems > 0 && (
                  <div className="rounded-xl px-4 py-3.5"
                    style={{ background: "var(--bg-raised)", border: "1px solid var(--border)" }}>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
                        Compliance Breakdown
                      </p>
                      <span className="text-xs font-bold" style={{ color: ACCENT }}>{totalItems} items</span>
                    </div>
                    <div className="flex rounded-full overflow-hidden h-2.5 gap-px" style={{ background: "var(--bg-surface)" }}>
                      {compliantCount > 0 && (
                        <div className="transition-all" style={{ width: `${(compliantCount / totalItems) * 100}%`, background: "#16a34a" }} />
                      )}
                      {partialCount > 0 && (
                        <div className="transition-all" style={{ width: `${(partialCount / totalItems) * 100}%`, background: "#f59e0b" }} />
                      )}
                      {nonCompliantCount > 0 && (
                        <div className="transition-all" style={{ width: `${(nonCompliantCount / totalItems) * 100}%`, background: "#ef4444" }} />
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-2">
                      {[
                        { label: "Compliant",     count: compliantCount,    color: "#16a34a" },
                        { label: "Partial",       count: partialCount,      color: "#f59e0b" },
                        { label: "Non-Compliant", count: nonCompliantCount, color: "#ef4444" },
                      ].map(({ label, count, color }) => (
                        <div key={label} className="flex items-center gap-1">
                          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
                          <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                            {label} <span className="font-bold" style={{ color }}>{count}</span>
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Issues preview */}
                {filledIssues.length > 0 && (
                  <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
                    <div className="flex items-center justify-between px-4 py-2.5"
                      style={{ background: "rgba(239,68,68,0.06)", borderBottom: "1px solid var(--border)" }}>
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#ef4444" }} />
                        <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#ef4444" }}>
                          Issues to Log
                        </p>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={{ background: "rgba(239,68,68,0.12)", color: "#ef4444" }}>
                        {filledIssues.length}
                      </span>
                    </div>
                    <div className="flex flex-col divide-y" style={{ "--divide-color": "var(--border)" }}>
                      {filledIssues.map((iss, idx) => (
                        <div key={idx} className="flex items-center gap-3 px-4 py-2.5"
                          style={{ borderBottom: idx < filledIssues.length - 1 ? "1px solid var(--border)" : "none" }}>
                          <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-[9px] font-black"
                            style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444" }}>
                            {idx + 1}
                          </div>
                          <p className="flex-1 text-xs font-medium truncate" style={{ color: "var(--text)" }}>
                            {iss.name}
                          </p>
                          {iss.priority_level && <PriorityBadge priority={iss.priority_level} />}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Audit note */}
                {form.audit_note && (
                  <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
                    <div className="flex items-center gap-2 px-4 py-2.5"
                      style={{ background: ACCENT_LIGHT, borderBottom: "1px solid var(--border)" }}>
                      <div className="w-1.5 h-1.5 rounded-full" style={{ background: ACCENT }} />
                      <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: ACCENT }}>
                        Audit Note
                      </p>
                    </div>
                    <p className="px-4 py-3 text-sm leading-relaxed" style={{ color: "var(--text)" }}>
                      {form.audit_note}
                    </p>
                  </div>
                )}

                {/* Confirm callout */}
                <div className="flex items-start gap-3 rounded-xl px-4 py-3"
                  style={{ background: ACCENT_LIGHT, border: `1px solid ${ACCENT}25` }}>
                  <CheckCircleIcon className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: ACCENT }} />
                  <p className="text-xs leading-relaxed" style={{ color: ACCENT }}>
                    Review the summary above, then submit to record this audit. All checklist items and issues will be saved permanently.
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3 pt-1">
                  <button onClick={() => setActiveTab(2)}
                    className="flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-semibold hover:opacity-80 transition-opacity"
                    style={{ background: "var(--bg-raised)", border: "1px solid var(--border)", color: "var(--text-muted)" }}>
                    <ChevronLeftIcon className="h-4 w-4" /> Back
                  </button>
                  <button onClick={handleSubmit} disabled={actionLoading}
                    className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-bold hover:opacity-90 disabled:opacity-60 transition-opacity"
                    style={{ background: `linear-gradient(135deg, ${ACCENT} 0%, #15803d 100%)`, color: "#fff", boxShadow: `0 6px 20px ${ACCENT}50` }}>
                    {actionLoading
                      ? <><Spinner size={4} /> Submitting…</>
                      : <><CheckBadgeIcon className="h-5 w-5" /> Submit Audit</>}
                  </button>
                </div>

              </div>
            </div>
          );
        })()}
      </div>

      {/* Bottom nav (not on summary tab) */}
      {activeTab !== TABS.length - 1 && (
        <div className="flex items-center justify-between px-6 py-4 flex-shrink-0" style={{ borderTop: "1px solid var(--border)" }}>
          <button onClick={() => setActiveTab((t) => Math.max(0, t - 1))} disabled={activeTab === 0}
            className="flex items-center gap-1 text-sm font-semibold disabled:opacity-30 hover:opacity-80"
            style={{ color: "var(--text-muted)" }}>
            <ChevronLeftIcon className="h-4 w-4" /> Prev
          </button>
          <button onClick={() => setActiveTab((t) => Math.min(TABS.length - 1, t + 1))}
            className="flex items-center gap-1 text-sm font-semibold hover:opacity-80"
            style={{ color: ACCENT }}>
            Next <ChevronRightIcon className="h-4 w-4" />
          </button>
        </div>
      )}
    </ModalShell>
  );
}

// ─── Detail Drawer ────────────────────────────────────────────────────────────

function DetailDrawer({ isOpen, onClose, record, auditId, onStartAudit, canPerform }) {
  const [detailPerform, setDetailPerform] = useState(null);

  useEffect(() => { if (!isOpen) setDetailPerform(null); }, [isOpen]);

  if (!isOpen || !record) return null;

  const auditors    = record.auditors || [];
  const performed   = record.performed_training_and_competencies || [];
  const totalIssues = performed.reduce((n, p) => n + (p.performed_training_and_competency_issues?.length || 0), 0);

  return createPortal(
    <>
      <div className="fixed inset-0" style={{ zIndex: 9990 }}
        onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
        <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(3px)" }} onClick={onClose} />

        {/* Drawer panel */}
        <div className="absolute top-0 right-0 bottom-0 w-full max-w-xl flex flex-col overflow-hidden"
          style={{ background: "var(--bg-surface)", boxShadow: "-16px 0 48px rgba(0,0,0,0.2), 0 0 0 1px var(--border)" }}>

          {/* Gradient header */}
          <div className="flex-shrink-0 px-6 py-7 relative overflow-hidden"
            style={{ background: `linear-gradient(140deg, ${ACCENT} 0%, #15803d 50%, #14532d 100%)` }}>
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
                <AcademicCapIcon className="h-8 w-8 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white/65 text-[11px] font-bold uppercase tracking-widest mb-0.5">
                  TC · Training & Competency
                </p>
                <h2 className="text-white text-xl font-bold leading-tight tracking-tight">
                  {record.audit_number}
                </h2>
                {record.area_audited && (
                  <p className="text-white/70 text-sm mt-1 truncate">{record.area_audited}</p>
                )}
                <div className="mt-2.5 flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-bold"
                    style={{ background: "rgba(255,255,255,0.18)", color: "#fff" }}>
                    {STATUS_STYLES[record.status]?.label || record.status}
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
                { label: "Audits",   value: performed.length, Icon: AcademicCapIcon },
                { label: "Issues",   value: totalIssues,       Icon: ExclamationTriangleIcon },
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
                  { label: "Date",   value: formatDate(record.date) },
                  { label: "Status", value: <StatusBadge status={record.status} /> },
                ].map(({ label, value }) => (
                  <div key={label} className="rounded-2xl px-4 py-3"
                    style={{ background: "var(--bg-raised)", border: "1px solid var(--border)" }}>
                    <p className="text-[10px] font-semibold uppercase tracking-wide mb-1.5" style={{ color: "var(--text-muted)" }}>{label}</p>
                    <div className="text-sm font-semibold" style={{ color: "var(--text)" }}>{value}</div>
                  </div>
                ))}
              </div>

              {/* Objective & Scope */}
              {(record.objective_of_audit || record.scope_of_audit) && (
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
              )}
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
                {canPerform && (
                  <button onClick={onStartAudit}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold hover:opacity-90"
                    style={{ background: ACCENT, color: "#fff", boxShadow: `0 2px 10px rgba(22,163,74,0.4)` }}>
                    <PlayIcon className="h-3.5 w-3.5" /> Start Audit
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
                  {canPerform && (
                    <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                      Click "Start Audit" to record the first audit.
                    </p>
                  )}
                </div>
              ) : (
                <div className="relative">
                  <div className="absolute top-5 bottom-5 pointer-events-none"
                    style={{ left: 19, width: 2, background: `linear-gradient(to bottom, ${ACCENT}50, transparent)`, borderRadius: 2 }} />
                  <div className="flex flex-col gap-3">
                    {performed.map((p) => {
                      const issCount = p.performed_training_and_competency_issues?.length || 0;
                      const itemCount = p.performed_training_and_competency_items?.length || 0;
                      return (
                        <div key={p.id} className="flex items-start gap-4 cursor-pointer group"
                          onClick={() => setDetailPerform(p)}>
                          <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 z-10 transition-all group-hover:scale-105"
                            style={{ background: `linear-gradient(135deg, ${ACCENT}, #15803d)`, boxShadow: `0 3px 12px ${ACCENT}44` }}>
                            <CheckBadgeIcon className="h-5 w-5 text-white" />
                          </div>
                          <div className="flex-1 py-1.5 rounded-2xl px-4 transition-all group-hover:shadow-md"
                            style={{ background: "var(--bg-raised)", border: "1px solid var(--border)" }}>
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>
                                  {formatDate(p.audit_date || p.created_at)}
                                </p>
                                <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                                  {displayName(p.auditor)} · {itemCount} item{itemCount !== 1 ? "s" : ""}
                                </p>
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                {issCount > 0 && (
                                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold"
                                    style={{ background: "rgba(239,68,68,.1)", color: "#ef4444" }}>
                                    {issCount} issue{issCount !== 1 ? "s" : ""}
                                  </span>
                                )}
                                <ChevronRightIcon className="h-4 w-4 opacity-40 group-hover:opacity-80"
                                  style={{ color: "var(--text-muted)" }} />
                              </div>
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
        </div>
      </div>

      <PerformedDetailModal
        isOpen={Boolean(detailPerform)}
        onClose={() => setDetailPerform(null)}
        performed={detailPerform}
        auditId={auditId}
      />
    </>,
    document.body
  );
}

// ─── Action Menu ──────────────────────────────────────────────────────────────

function ActionMenu({ record, onView, onEdit, onDelete, onPerform, onReassign }) {
  const [open, setOpen] = useState(false);
  const [pos,  setPos]  = useState({ top: 0, right: 0 });
  const triggerRef      = useRef(null);
  const menuRef         = useRef(null);
  const { hasPermission } = useAuth();
  const canUpdate = hasPermission("training_and_competencies.update");

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
    { label: "View Details",      icon: <EyeIcon className="h-4 w-4" />,              action: onView,     show: true },
    ...(canUpdate ? [
      { label: "Start Audit",     icon: <AcademicCapIcon className="h-4 w-4" />,      action: onPerform,  show: true },
      { label: "Edit",            icon: <PencilSquareIcon className="h-4 w-4" />,     action: onEdit,     show: true },
      { label: "Reassign Auditors",icon: <UsersIcon className="h-4 w-4" />,           action: onReassign, show: true },
    ] : []),
    { label: "Delete",            icon: <TrashIcon className="h-4 w-4" />,            action: onDelete,   danger: true, show: true },
  ].filter((i) => i.show);

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <button ref={triggerRef} onClick={handleToggle}
        className="p-1.5 rounded-lg hover:opacity-80 transition-opacity" style={{ color: "var(--text-muted)" }}>
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

// ─── TC Page ──────────────────────────────────────────────────────────────────

export default function TcPage() {
  const dispatch        = useAppDispatch();
  const { hasPermission } = useAuth();
  const canUpdate       = hasPermission("training_and_competencies.update");

  const catalog        = useAppSelector(selectTcCatalog);
  const catalogLoading = useAppSelector(selectTcCatalogLoading);
  const records        = useAppSelector(selectTcRecords);
  const meta           = useAppSelector(selectTcRecordsMeta);
  const recordsLoading = useAppSelector(selectTcRecordsLoading);
  const filters        = useAppSelector(selectTcFilters);
  const actionLoading  = useAppSelector(selectTcActionLoading);

  const catalogAudit = catalog.find((a) => a.title === TC_AUDIT_TITLE) ?? null;

  const [auditId,        setAuditId]        = useState(null);
  const [drawerRecord,   setDrawerRecord]   = useState(null);
  const [setupOpen,      setSetupOpen]      = useState(false);
  const [editTarget,     setEditTarget]     = useState(null);
  const [performTarget,  setPerformTarget]  = useState(null);
  const [reassignTarget, setReassignTarget] = useState(null);
  const [deleteTarget,   setDeleteTarget]   = useState(null);

  // Debounced audit_number search
  const [auditNumberInput, setAuditNumberInput] = useState(filters.audit_number || "");
  useEffect(() => {
    const t = setTimeout(() => dispatch(setTcAuditNumber(auditNumberInput)), 400);
    return () => clearTimeout(t);
  }, [auditNumberInput, dispatch]);

  useEffect(() => { dispatch(fetchTcCatalog()); }, [dispatch]);

  useEffect(() => {
    if (catalog.length > 0) {
      const found = catalog.find((a) => a.title === TC_AUDIT_TITLE);
      setAuditId(found?.id ?? null);
    }
  }, [catalog]);

  useEffect(() => {
    if (auditId) dispatch(fetchTcRecords(auditId));
  }, [auditId, dispatch, filters]);

  async function handleDelete() {
    if (!deleteTarget) return;
    const res = await dispatch(deleteTcRecord({ auditId, id: deleteTarget.id }));
    if (deleteTcRecord.fulfilled.match(res)) {
      toast.success("Record deleted.");
      setDeleteTarget(null);
      if (drawerRecord?.id === deleteTarget.id) setDrawerRecord(null);
      dispatch(fetchTcRecords(auditId));
    } else {
      toast.error(res.payload || "Failed to delete record.");
    }
  }

  const filtersActive = !!(filters.audit_number || filters.area_audited || filters.date || filters.status);

  const COLS = ["#", "Audit No.", "Area Audited", "Date", "Auditors", "Status", "Performed", ""];

  if (catalogLoading) return (
    <div className="flex items-center justify-center h-64"><Spinner size={8} /></div>
  );
  if (!auditId) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <AcademicCapIcon className="h-12 w-12" style={{ color: "var(--text-muted)" }} />
      <p className="text-sm" style={{ color: "var(--text-muted)" }}>
        Training and Competency module not configured.
      </p>
    </div>
  );

  return (
    <div className="space-y-6 pb-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: ACCENT_LIGHT }}>
            <AcademicCapIcon className="h-6 w-6" style={{ color: ACCENT }} />
          </div>
          <div>
            <h1 className="text-xl font-bold" style={{ color: "var(--text)" }}>Training & Competency</h1>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              Manage training and competency audits and track compliance.
            </p>
          </div>
        </div>
        {canUpdate && (
          <button onClick={() => { setEditTarget(null); setSetupOpen(true); }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold hover:opacity-90 flex-shrink-0"
            style={{ background: ACCENT, color: "#fff", boxShadow: `0 4px 14px ${ACCENT}44` }}>
            <PlusIcon className="h-4 w-4" /> New Record
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="rounded-2xl p-4 flex flex-wrap items-end gap-3"
        style={{ background: "var(--bg-raised)", border: "1px solid var(--border)" }}>
        <div className="relative w-48">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none" style={{ color: "var(--text-muted)" }} />
          <input value={auditNumberInput} onChange={(e) => setAuditNumberInput(e.target.value)}
            placeholder="Audit number…" className="ui-input text-sm pl-9 w-full" />
        </div>
        <input value={filters.area_audited}
          onChange={(e) => dispatch(setTcAreaAudited(e.target.value))}
          placeholder="Area audited…" className="ui-input text-sm w-44" />
        <input type="date" value={filters.date}
          onChange={(e) => dispatch(setTcDateFilter(e.target.value))}
          className="ui-input text-sm w-44" />
        <select value={filters.status}
          onChange={(e) => dispatch(setTcStatusFilter(e.target.value))}
          className="ui-input text-sm w-36">
          <option value="">All statuses</option>
          {TC_STATUSES.map((s) => (
            <option key={s} value={s}>{STATUS_STYLES[s]?.label || s}</option>
          ))}
        </select>
        {filtersActive && (
          <button onClick={() => { dispatch(clearTcFilters()); setAuditNumberInput(""); }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold hover:opacity-80"
            style={{ color: "var(--text-muted)", border: "1px solid var(--border)" }}>
            <ArrowPathIcon className="h-3.5 w-3.5" /> Clear
          </button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-2xl overflow-hidden" style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: `linear-gradient(90deg, ${ACCENT}18 0%, ${ACCENT}08 100%)`, borderBottom: "1px solid var(--border)" }}>
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
                        <div className="h-4 rounded animate-pulse" style={{ background: "var(--bg-raised)", width: c === 0 ? "2rem" : "70%" }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={COLS.length} className="py-16 text-center">
                    <AcademicCapIcon className="h-10 w-10 mx-auto mb-3" style={{ color: "var(--text-muted)" }} />
                    <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                      {filtersActive ? "No records match the current filters." : "No training and competency records yet."}
                    </p>
                  </td>
                </tr>
              ) : (
                records.map((r, idx) => {
                  const performedCount = r.performed_training_and_competencies?.length || 0;
                  const auditors       = r.auditors || [];
                  return (
                    <tr key={r.id}
                      className="hover:opacity-90 cursor-pointer transition-opacity"
                      style={{ borderBottom: "1px solid var(--border)" }}
                      onClick={() => setDrawerRecord(r)}>
                      <td className="px-4 py-3 text-xs font-bold" style={{ color: "var(--text-muted)" }}>
                        {((meta?.page ?? 1) - 1) * (meta?.per_page ?? 10) + idx + 1}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-semibold text-sm" style={{ color: "var(--text)" }}>
                          #{r.audit_number}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm" style={{ color: "var(--text)" }}>
                        {r.area_audited || "—"}
                      </td>
                      <td className="px-4 py-3 text-xs" style={{ color: "var(--text-muted)" }}>
                        {formatDate(r.date)}
                      </td>
                      <td className="px-4 py-3">
                        {auditors.length === 0 ? (
                          <span className="text-xs" style={{ color: "var(--text-muted)" }}>—</span>
                        ) : (
                          <div className="flex items-center -space-x-1">
                            {auditors.slice(0, 3).map((a) => (
                              <div key={a.id} title={displayName(a)}
                                className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ring-2"
                                style={{ background: ACCENT_LIGHT, color: ACCENT, ringColor: "var(--bg-surface)" }}>
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
                      <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                      <td className="px-4 py-3">
                        {performedCount > 0 ? (
                          <span className="text-xs px-2.5 py-1 rounded-full font-bold"
                            style={{ background: ACCENT_LIGHT, color: ACCENT }}>
                            {performedCount} audit{performedCount !== 1 ? "s" : ""}
                          </span>
                        ) : (
                          <span className="text-xs" style={{ color: "var(--text-muted)" }}>None</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <ActionMenu
                          record={r}
                          onView={() => setDrawerRecord(r)}
                          onEdit={() => { setEditTarget(r); setSetupOpen(true); }}
                          onDelete={() => setDeleteTarget(r)}
                          onPerform={() => setPerformTarget(r)}
                          onReassign={() => setReassignTarget(r)}
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
              {meta.total} record{meta.total !== 1 ? "s" : ""}
            </p>
            <div className="flex items-center gap-1">
              <button onClick={() => dispatch(setTcPage(meta.page - 1))} disabled={meta.page <= 1}
                className="p-1.5 rounded-lg disabled:opacity-30 hover:opacity-80"
                style={{ background: "var(--bg-raised)" }}>
                <ChevronLeftIcon className="h-4 w-4" style={{ color: "var(--text-muted)" }} />
              </button>
              <span className="text-xs px-2" style={{ color: "var(--text-muted)" }}>
                {meta.page} / {meta.total_pages}
              </span>
              <button onClick={() => dispatch(setTcPage(meta.page + 1))} disabled={meta.page >= meta.total_pages}
                className="p-1.5 rounded-lg disabled:opacity-30 hover:opacity-80"
                style={{ background: "var(--bg-raised)" }}>
                <ChevronRightIcon className="h-4 w-4" style={{ color: "var(--text-muted)" }} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <SetupModal
        isOpen={setupOpen} onClose={() => { setSetupOpen(false); setEditTarget(null); }}
        auditId={auditId} record={editTarget}
      />
      <PerformModal
        isOpen={!!performTarget} onClose={() => setPerformTarget(null)}
        record={performTarget} auditId={auditId}
      />
      <ReassignModal
        isOpen={!!reassignTarget} onClose={() => setReassignTarget(null)}
        record={reassignTarget} auditId={auditId}
      />
      <DeleteConfirmModal
        isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete} loading={actionLoading}
        name={deleteTarget?.audit_number}
      />

      {/* Detail Drawer */}
      <DetailDrawer
        isOpen={!!drawerRecord}
        onClose={() => setDrawerRecord(null)}
        record={drawerRecord}
        auditId={auditId}
        canPerform={!!canUpdate}
        onStartAudit={() => { setPerformTarget(drawerRecord); setDrawerRecord(null); }}
      />
    </div>
  );
}
