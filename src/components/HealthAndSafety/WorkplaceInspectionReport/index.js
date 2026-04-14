/**
 * Health & Safety Audit — Workplace Inspection Report Module
 */

import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import toast from "react-hot-toast";
import {
  ClipboardDocumentCheckIcon,
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
  Squares2X2Icon,
  EllipsisVerticalIcon,
} from "@heroicons/react/24/outline";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import {
  fetchWirCatalog,
  fetchWirTemplates,
  fetchWirReports,
  createWirReport,
  updateWirReport,
  deleteWirReport,
  reassignWirAuditors,
  performWirReport,
  fetchWirIssues,
  updateWirCorrectiveAction,
  updateWirPriorityDueDate,
  assignWirContractor,
  executeWirIssue,
  createWirTemplate,
  updateWirTemplate,
  deleteWirTemplate,
  setWirPage,
  setWirAuditNumber,
  setWirAreaAudited,
  setWirDateFilter,
  setWirStatusFilter,
  clearWirFilters,
  clearWirActionError,
  selectWirCatalog,
  selectWirCatalogLoading,
  selectWirTemplates,
  selectWirReports,
  selectWirReportsMeta,
  selectWirReportsLoading,
  selectWirActionLoading,
  selectWirFilters,
  selectWirIssuesByPerformed,
} from "../../../store/slices/wirSlice";
import useAuth from "../../../hooks/useAuth";
import UsersService from "../../../services/users.service";
import { HsaTemplateItemService } from "../../../services/healthAndSafetyAudit.service";

// ─── Constants ────────────────────────────────────────────────────────────────

const WIR_AUDIT_TITLE = "Workplace Inspection Report";
const ACCENT       = "#d97706";
const ACCENT_LIGHT = "rgba(217,119,6,0.12)";

const STATUS_STYLES = {
  active:      { bg: "rgba(217,119,6,.12)",  color: "#d97706",  label: "Active" },
  in_progress: { bg: "rgba(245,158,11,.12)",  color: "#f59e0b",  label: "In Progress" },
  completed:   { bg: "rgba(59,130,246,.12)",  color: "#3b82f6",  label: "Completed" },
  closed:      { bg: "rgba(107,114,128,.12)", color: "#6b7280",  label: "Closed" },
  pending:     { bg: "rgba(245,158,11,.12)",  color: "#f59e0b",  label: "Pending" },
};

const PRIORITY_STYLES = {
  low:      { bg: "rgba(217,119,6,.12)",  color: "#d97706",  label: "Low" },
  medium:   { bg: "rgba(245,158,11,.12)",  color: "#f59e0b",  label: "Medium" },
  high:     { bg: "rgba(249,115,22,.12)",  color: "#f97316",  label: "High" },
  critical: { bg: "rgba(239,68,68,.12)",   color: "#ef4444",  label: "Critical" },
};

const WIR_STATUSES    = ["active", "in_progress", "completed", "closed", "pending"];
const PRIORITY_LEVELS = ["low", "medium", "high", "critical"];

const PERFORM_STATUSES = ["satisfactory", "unsatisfactory", "not_applicable"];
const PERFORM_STATUS_LABELS = {
  satisfactory:   "Satisfactory",
  unsatisfactory: "Unsatisfactory",
  not_applicable: "N/A",
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

// ─── Shared UI Primitives ─────────────────────────────────────────────────────

function Spinner({ size = 5 }) {
  return (
    <svg className={`animate-spin h-${size} w-${size}`} style={{ color: ACCENT }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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

function StepIndicator({ steps, current, completed }) {
  return (
    <div className="flex items-center px-6 py-3 flex-shrink-0" style={{ borderBottom: "1px solid var(--border)" }}>
      {steps.map((label, idx) => {
        const num     = idx + 1;
        const isActive  = num === current;
        const isDone    = completed.includes(num);
        return (
          <div key={label} className="flex items-center flex-1 last:flex-none">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0"
                style={{
                  background: isActive ? ACCENT : isDone ? ACCENT : "var(--bg-raised)",
                  color:      isActive ? "#fff"  : isDone ? "#fff" : "var(--text-muted)",
                  border:     isActive ? "none"  : isDone ? "none"  : "1px solid var(--border)",
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

function Pagination({ meta, onPage }) {
  if (!meta || meta.total_pages <= 1) return null;
  const { current_page, total_pages, total_count } = meta;
  return (
    <div className="flex items-center justify-between px-4 py-3 flex-shrink-0"
      style={{ borderTop: "1px solid var(--border)" }}>
      <p className="text-xs" style={{ color: "var(--text-muted)" }}>
        {total_count} record{total_count !== 1 ? "s" : ""}
      </p>
      <div className="flex items-center gap-1">
        <button onClick={() => onPage(current_page - 1)} disabled={current_page <= 1}
          className="p-1.5 rounded-lg disabled:opacity-30 hover:opacity-80"
          style={{ background: "var(--bg-raised)" }}>
          <ChevronLeftIcon className="h-4 w-4" style={{ color: "var(--text-muted)" }} />
        </button>
        <span className="text-xs px-2" style={{ color: "var(--text-muted)" }}>
          {current_page} / {total_pages}
        </span>
        <button onClick={() => onPage(current_page + 1)} disabled={current_page >= total_pages}
          className="p-1.5 rounded-lg disabled:opacity-30 hover:opacity-80"
          style={{ background: "var(--bg-raised)" }}>
          <ChevronRightIcon className="h-4 w-4" style={{ color: "var(--text-muted)" }} />
        </button>
      </div>
    </div>
  );
}

function TableSkeleton({ cols, rows = 5 }) {
  return Array.from({ length: rows }).map((_, r) => (
    <tr key={r} style={{ borderBottom: "1px solid var(--border)" }}>
      {Array.from({ length: cols }).map((__, c) => (
        <td key={c} className="px-4 py-3">
          <div className="h-4 rounded animate-pulse" style={{ background: "var(--bg-raised)", width: c === 0 ? "2rem" : "70%" }} />
        </td>
      ))}
    </tr>
  ));
}

// ─── Auditor Picker ───────────────────────────────────────────────────────────

function AuditorPicker({ selected, onToggle, label = "Assign Auditors" }) {
  const [query, setQuery]       = useState("");
  const [results, setResults]   = useState([]);
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
          placeholder="Search auditors by name or ID…"
          className="ui-input text-sm pl-9 w-full" />
        {searching && <div className="absolute right-3 top-1/2 -translate-y-1/2"><Spinner size={3} /></div>}
      </div>
      {results.length > 0 && (
        <div className="rounded-lg overflow-hidden max-h-40 overflow-y-auto"
          style={{ border: "1px solid var(--border)", background: "var(--bg-raised)" }}>
          {results.map((u) => {
            const checked = selectedIds.includes(u.id);
            return (
              <button key={u.id} type="button" onClick={() => onToggle(u)}
                className="w-full flex items-center gap-3 px-3 py-2 text-left hover:opacity-80"
                style={{ borderBottom: "1px solid var(--border)" }}>
                <div className="w-4 h-4 rounded border flex items-center justify-center flex-shrink-0"
                  style={{ background: checked ? ACCENT : "transparent", borderColor: checked ? ACCENT : "var(--border)" }}>
                  {checked && <CheckBadgeIcon className="h-3 w-3 text-white" />}
                </div>
                <div>
                  <p className="text-xs font-semibold" style={{ color: "var(--text)" }}>{displayName(u)}</p>
                  <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>{u.employee_id || u.email}</p>
                </div>
              </button>
            );
          })}
        </div>
      )}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-1">
          {selected.map((u) => (
            <span key={u.id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold"
              style={{ background: ACCENT_LIGHT, color: ACCENT }}>
              {displayName(u)}
              <button type="button" onClick={() => onToggle(u)} className="hover:opacity-70 ml-0.5">
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

function ContractorPicker({ selected, onSelect, label = "Assign Contractor" }) {
  const [query, setQuery]       = useState("");
  const [results, setResults]   = useState([]);
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
    <div className="flex flex-col gap-2">
      <label className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>{label}</label>
      {selected && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold"
          style={{ background: ACCENT_LIGHT, color: ACCENT, border: `1px solid ${ACCENT}` }}>
          <UsersIcon className="h-3.5 w-3.5" />
          {displayName(selected)}
          <button type="button" onClick={() => onSelect(null)} className="ml-auto hover:opacity-70">
            <XMarkIcon className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "var(--text-muted)" }} />
        <input value={query} onChange={(e) => setQuery(e.target.value)}
          placeholder="Search contractors by name or email…"
          className="ui-input text-sm pl-9 w-full" />
        {searching && <div className="absolute right-3 top-1/2 -translate-y-1/2"><Spinner size={3} /></div>}
      </div>
      {results.length > 0 && (
        <div className="rounded-lg overflow-hidden max-h-40 overflow-y-auto"
          style={{ border: "1px solid var(--border)", background: "var(--bg-raised)" }}>
          {results.map((u) => (
            <button key={u.id} type="button" onClick={() => { onSelect(u); setQuery(""); setResults([]); }}
              className="w-full flex items-center gap-3 px-3 py-2 text-left hover:opacity-80"
              style={{ borderBottom: "1px solid var(--border)" }}>
              <div>
                <p className="text-xs font-semibold" style={{ color: "var(--text)" }}>{displayName(u)}</p>
                <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>{u.employee_id || u.email}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Delete Confirm Modal ─────────────────────────────────────────────────────

function DeleteConfirmModal({ isOpen, onClose, onConfirm, loading, name }) {
  if (!isOpen) return null;
  return createPortal(
    <div className="fixed inset-0 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.6)", zIndex: 10001 }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="ui-card w-full max-w-sm p-6 flex flex-col items-center gap-4 text-center">
        <div className="w-14 h-14 rounded-full flex items-center justify-center"
          style={{ background: "rgba(239,68,68,.12)" }}>
          <TrashIcon className="h-7 w-7" style={{ color: "#ef4444" }} />
        </div>
        <div>
          <h3 className="font-bold text-base mb-1" style={{ color: "var(--text)" }}>Delete Report?</h3>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            This will permanently remove{" "}
            <span className="font-semibold px-1.5 py-0.5 rounded"
              style={{ background: "rgba(239,68,68,.08)", color: "#ef4444" }}>
              {name || "this record"}
            </span>
            {" "}and all its performed audits. This cannot be undone.
          </p>
        </div>
        <div className="flex gap-3 w-full">
          <button onClick={onClose} disabled={loading}
            className="flex-1 py-2 rounded-lg text-sm font-semibold hover:opacity-80"
            style={{ background: "var(--bg-raised)", border: "1px solid var(--border)", color: "var(--text)" }}>
            Keep it
          </button>
          <button onClick={onConfirm} disabled={loading}
            className="flex-1 py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 hover:opacity-90"
            style={{ background: "#ef4444", color: "#fff" }}>
            {loading ? <Spinner size={3} /> : <TrashIcon className="h-4 w-4" />}
            Yes, delete
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ─── Setup Modal (Create / Edit) ─────────────────────────────────────────────

function SetupModal({ isOpen, onClose, report, auditId }) {
  const dispatch      = useAppDispatch();
  const actionLoading = useAppSelector(selectWirActionLoading);
  const isEdit        = Boolean(report);

  const STEPS = ["Basic Info", "Assign Auditors", "Review"];
  const [step, setStep]               = useState(1);
  const [completedSteps, setCompletedSteps] = useState([]);
  const [form, setForm]               = useState({ audit_number: "", area_audited: "", date: "", status: "active" });
  const [auditors, setAuditors]       = useState([]);
  const [errors, setErrors]           = useState({});

  useEffect(() => {
    if (!isOpen) return;
    dispatch(clearWirActionError());
    setStep(1); setCompletedSteps([]); setErrors({});
    if (report) {
      setForm({
        audit_number: report.audit_number ?? "",
        area_audited: report.area_audited ?? "",
        date:         report.date         ?? "",
        status:       report.status       || "active",
      });
      setAuditors(report.auditors || []);
    } else {
      setForm({ audit_number: "", area_audited: "", date: new Date().toISOString().slice(0, 10), status: "active" });
      setAuditors([]);
    }
  }, [isOpen, report, dispatch]);

  function set(k, v) { setForm((f) => ({ ...f, [k]: v })); }

  function validateStep(s) {
    const e = {};
    if (s === 1) {
      if (!form.audit_number.trim()) e.audit_number = "Audit number is required.";
      if (!form.area_audited.trim()) e.area_audited = "Area audited is required.";
      if (!form.date)                e.date         = "Date is required.";
    }
    if (s === 2 && auditors.length === 0) e.auditors = "At least one auditor must be assigned.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function goNext() {
    if (!validateStep(step)) return;
    setCompletedSteps((p) => Array.from(new Set([...p, step])));
    setStep((s) => s + 1);
  }

  function goBack() { setErrors({}); setStep((s) => s - 1); }

  function toggleAuditor(u) {
    setAuditors((prev) => prev.some((a) => a.id === u.id) ? prev.filter((a) => a.id !== u.id) : [...prev, u]);
    setErrors((e) => ({ ...e, auditors: "" }));
  }

  async function handleSubmit() {
    const payload = {
      audit_number: form.audit_number.trim(),
      area_audited: form.area_audited.trim(),
      date:         form.date,
      status:       form.status,
      auditor_ids:  auditors.map((a) => a.id),
    };
    const action = isEdit
      ? dispatch(updateWirReport({ auditId, id: report.id, data: payload }))
      : dispatch(createWirReport({ auditId, data: payload }));
    const result = await action;
    if (createWirReport.fulfilled.match(result) || updateWirReport.fulfilled.match(result)) {
      toast.success(isEdit ? "Report updated." : "Report created.");
      onClose();
      dispatch(fetchWirReports(auditId));
    } else {
      toast.error(result.payload || "Something went wrong.");
    }
  }

  return (
    <ModalShell isOpen={isOpen} onClose={onClose}
      title={isEdit ? "Edit Report" : "New Workplace Inspection Report"}
      width="max-w-xl">
      <StepIndicator steps={STEPS} current={step} completed={completedSteps} />
      <div className="flex-1 overflow-y-auto">
        {step === 1 && (
          <div className="p-6 grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Field label="Audit Number" required error={errors.audit_number}>
                <input value={form.audit_number} onChange={(e) => set("audit_number", e.target.value)}
                  placeholder="e.g. WIR-2024-001" className="ui-input text-sm" autoFocus />
              </Field>
            </div>
            <div className="col-span-2">
              <Field label="Area Audited" required error={errors.area_audited}>
                <input value={form.area_audited} onChange={(e) => set("area_audited", e.target.value)}
                  placeholder="e.g. Main Workshop" className="ui-input text-sm" />
              </Field>
            </div>
            <div>
              <Field label="Date" required error={errors.date}>
                <input type="date" value={form.date} onChange={(e) => set("date", e.target.value)}
                  className="ui-input text-sm" />
              </Field>
            </div>
            <div>
              <Field label="Status">
                <select value={form.status} onChange={(e) => set("status", e.target.value)}
                  className="ui-input text-sm">
                  {WIR_STATUSES.map((s) => (
                    <option key={s} value={s}>{STATUS_STYLES[s]?.label || s}</option>
                  ))}
                </select>
              </Field>
            </div>
          </div>
        )}
        {step === 2 && (
          <div className="p-6 flex flex-col gap-4">
            <AuditorPicker selected={auditors} onToggle={toggleAuditor} label="Search & assign auditors" />
            {errors.auditors && <p className="text-[11px]" style={{ color: "var(--danger)" }}>{errors.auditors}</p>}
          </div>
        )}
        {step === 3 && (
          <div className="p-6 flex flex-col gap-4">
            <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
              {[
                { label: "Audit Number", value: form.audit_number },
                { label: "Area Audited", value: form.area_audited },
                { label: "Date",         value: formatDate(form.date) },
                { label: "Status",       value: <StatusBadge status={form.status} /> },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between px-4 py-3"
                  style={{ borderBottom: "1px solid var(--border)" }}>
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>{label}</span>
                  <span className="text-sm font-semibold" style={{ color: "var(--text)" }}>{value}</span>
                </div>
              ))}
              <div className="px-4 py-3">
                <p className="text-xs mb-2" style={{ color: "var(--text-muted)" }}>Auditors</p>
                <div className="flex flex-wrap gap-1.5">
                  {auditors.length === 0
                    ? <span className="text-xs" style={{ color: "var(--text-muted)" }}>None assigned</span>
                    : auditors.map((a) => (
                      <span key={a.id} className="px-2 py-0.5 rounded-full text-[11px] font-semibold"
                        style={{ background: ACCENT_LIGHT, color: ACCENT }}>
                        {displayName(a)}
                      </span>
                    ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      <div className="flex items-center justify-between px-6 py-4 flex-shrink-0"
        style={{ borderTop: "1px solid var(--border)" }}>
        {step > 1
          ? <button onClick={goBack} className="flex items-center gap-1 text-sm font-semibold hover:opacity-80"
              style={{ color: "var(--text-muted)" }}>
              <ChevronLeftIcon className="h-4 w-4" /> Back
            </button>
          : <div />
        }
        {step < STEPS.length
          ? <button onClick={goNext}
              className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold hover:opacity-90"
              style={{ background: ACCENT, color: "#fff" }}>
              Next <ChevronRightIcon className="h-4 w-4" />
            </button>
          : <button onClick={handleSubmit} disabled={actionLoading}
              className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold hover:opacity-90 disabled:opacity-60"
              style={{ background: ACCENT, color: "#fff" }}>
              {actionLoading ? <Spinner size={3} /> : <CheckBadgeIcon className="h-4 w-4" />}
              {isEdit ? "Save Changes" : "Create Report"}
            </button>
        }
      </div>
    </ModalShell>
  );
}

// ─── Template Manager Modal ───────────────────────────────────────────────────

function TemplateManagerModal({ isOpen, onClose, auditId }) {
  const dispatch      = useAppDispatch();
  const templates     = useAppSelector(selectWirTemplates);
  const actionLoading = useAppSelector(selectWirActionLoading);

  const [activeTemplate, setActiveTemplate]         = useState(null);
  const [view, setView]                             = useState("list");
  const [tForm, setTForm]                           = useState({ name: "", description: "" });
  const [tErrors, setTErrors]                       = useState({});
  const [items, setItems]                           = useState([]);
  const [itemsLoading, setItemsLoading]             = useState(false);
  const [newItem, setNewItem]                       = useState({ label: "", code: "", description: "", position: "", active: true });
  const [itemErrors, setItemErrors]                 = useState({});
  const [editingItem, setEditingItem]               = useState(null);
  const [deleteTemplateTarget, setDeleteTemplateTarget] = useState(null);
  const [deletingTemplate, setDeletingTemplate]     = useState(false);

  useEffect(() => {
    if (!isOpen) { setView("list"); setActiveTemplate(null); }
  }, [isOpen]);

  function openNewTemplate() { setTForm({ name: "", description: "" }); setTErrors({}); setView("newTemplate"); }
  function openEditTemplate(t) { setTForm({ name: t.name, description: t.description || "" }); setTErrors({}); setActiveTemplate(t); setView("editTemplate"); }

  async function openItems(t) {
    setActiveTemplate(t); setView("items"); setItemsLoading(true);
    try {
      const res  = await HsaTemplateItemService.list(auditId, t.id);
      const data = Array.isArray(res.data?.data) ? res.data.data : Array.isArray(res.data) ? res.data : [];
      setItems(data);
    } catch { toast.error("Failed to load items."); }
    finally { setItemsLoading(false); }
  }

  async function handleSaveTemplate() {
    const e = {};
    if (!tForm.name.trim()) e.name = "Name is required.";
    setTErrors(e);
    if (Object.keys(e).length > 0) return;
    const action = view === "editTemplate"
      ? dispatch(updateWirTemplate({ auditId, id: activeTemplate.id, data: { name: tForm.name.trim(), description: tForm.description.trim() || undefined } }))
      : dispatch(createWirTemplate({ auditId, data: { name: tForm.name.trim(), description: tForm.description.trim() || undefined } }));
    const result = await action;
    if (createWirTemplate.fulfilled.match(result) || updateWirTemplate.fulfilled.match(result)) {
      toast.success(view === "editTemplate" ? "Template updated." : "Template created.");
      setView("list");
    } else {
      toast.error(result.payload || "Failed.");
    }
  }

  async function handleDeleteTemplate() {
    setDeletingTemplate(true);
    const result = await dispatch(deleteWirTemplate({ auditId, id: deleteTemplateTarget.id }));
    setDeletingTemplate(false);
    if (deleteWirTemplate.fulfilled.match(result)) {
      toast.success("Template deleted."); setDeleteTemplateTarget(null);
    } else {
      toast.error(result.payload || "Failed to delete template.");
    }
  }

  async function handleAddItem() {
    const e = {};
    if (!newItem.label.trim()) e.label = "Label is required.";
    setItemErrors(e);
    if (Object.keys(e).length > 0) return;
    try {
      const res     = await HsaTemplateItemService.create(auditId, activeTemplate.id, {
        label: newItem.label.trim(), code: newItem.code.trim() || undefined,
        description: newItem.description.trim() || undefined,
        position: newItem.position ? Number(newItem.position) : undefined, active: newItem.active,
      });
      const created = res.data?.data || res.data || res;
      setItems((p) => [...p, created]);
      setNewItem({ label: "", code: "", description: "", position: "", active: true });
      toast.success("Item added.");
    } catch { toast.error("Failed to add item."); }
  }

  async function handleUpdateItem(item) {
    try {
      const res     = await HsaTemplateItemService.update(auditId, activeTemplate.id, item.id, {
        label: editingItem.label.trim(), code: editingItem.code?.trim() || undefined,
        description: editingItem.description?.trim() || undefined,
        position: editingItem.position ? Number(editingItem.position) : undefined, active: editingItem.active,
      });
      const updated = res.data?.data || res.data || res;
      setItems((p) => p.map((i) => i.id === item.id ? updated : i));
      setEditingItem(null); toast.success("Item updated.");
    } catch { toast.error("Failed to update item."); }
  }

  async function handleDeleteItem(item) {
    try {
      await HsaTemplateItemService.remove(auditId, activeTemplate.id, item.id);
      setItems((p) => p.filter((i) => i.id !== item.id)); toast.success("Item removed.");
    } catch { toast.error("Failed to delete item."); }
  }

  return (
    <>
      <ModalShell isOpen={isOpen} onClose={onClose} title="Manage Audit Templates" width="max-w-2xl">
        <div className="px-6 py-2 flex items-center gap-2 text-xs flex-shrink-0"
          style={{ borderBottom: "1px solid var(--border)", color: "var(--text-muted)" }}>
          <button onClick={() => setView("list")} className="hover:opacity-70 font-semibold">Templates</button>
          {(view === "editTemplate" || view === "newTemplate") && (
            <><span>/</span><span style={{ color: "var(--text)" }}>{view === "newTemplate" ? "New Template" : activeTemplate?.name}</span></>
          )}
          {view === "items" && (
            <><span>/</span><span style={{ color: "var(--text)" }}>{activeTemplate?.name}</span><span>/</span><span>Items</span></>
          )}
        </div>
        <div className="p-6 flex-1 overflow-y-auto">
          {view === "list" && (
            <div className="flex flex-col gap-3">
              <div className="flex justify-end">
                <button onClick={openNewTemplate}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90"
                  style={{ background: ACCENT, color: "#fff" }}>
                  <PlusIcon className="h-4 w-4" /> New Template
                </button>
              </div>
              {templates.length === 0
                ? <p className="text-sm text-center py-8" style={{ color: "var(--text-muted)" }}>No templates yet. Create one to get started.</p>
                : templates.map((t) => (
                  <div key={t.id} className="flex items-center justify-between rounded-xl px-4 py-3"
                    style={{ background: "var(--bg-raised)", border: "1px solid var(--border)" }}>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>{t.name}</p>
                      {t.description && <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{t.description}</p>}
                      <p className="text-[11px] mt-1" style={{ color: "var(--text-muted)" }}>
                        {(t.health_and_safety_audit_checklist_item_templates || []).length} items
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => openItems(t)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold hover:opacity-80"
                        style={{ background: ACCENT_LIGHT, color: ACCENT }}>
                        Items
                      </button>
                      <button onClick={() => openEditTemplate(t)} className="p-1.5 rounded-lg hover:opacity-80" style={{ color: "var(--text-muted)" }}>
                        <PencilSquareIcon className="h-4 w-4" />
                      </button>
                      <button onClick={() => setDeleteTemplateTarget(t)} className="p-1.5 rounded-lg hover:opacity-80" style={{ color: "#ef4444" }}>
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))
              }
            </div>
          )}
          {(view === "newTemplate" || view === "editTemplate") && (
            <div className="flex flex-col gap-4">
              <Field label="Template Name" required error={tErrors.name}>
                <input value={tForm.name} onChange={(e) => setTForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Fire Safety Section" className="ui-input text-sm" autoFocus />
              </Field>
              <Field label="Description">
                <textarea value={tForm.description} onChange={(e) => setTForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Optional description…" rows={3} className="ui-input text-sm resize-none" />
              </Field>
              <div className="flex gap-3">
                <button onClick={() => setView("list")} disabled={actionLoading}
                  className="flex-1 py-2 rounded-lg text-sm font-semibold hover:opacity-80"
                  style={{ background: "var(--bg-raised)", border: "1px solid var(--border)", color: "var(--text)" }}>
                  Cancel
                </button>
                <button onClick={handleSaveTemplate} disabled={actionLoading}
                  className="flex-1 py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 hover:opacity-90"
                  style={{ background: ACCENT, color: "#fff" }}>
                  {actionLoading ? <Spinner size={3} /> : <CheckBadgeIcon className="h-4 w-4" />}
                  {view === "newTemplate" ? "Create" : "Save"}
                </button>
              </div>
            </div>
          )}
          {view === "items" && (
            <div className="flex flex-col gap-4">
              {itemsLoading ? <div className="flex justify-center py-8"><Spinner size={6} /></div> : (
                <>
                  {items.length === 0
                    ? <p className="text-sm text-center py-4" style={{ color: "var(--text-muted)" }}>No items yet.</p>
                    : items.map((item, idx) => (
                      editingItem?.id === item.id ? (
                        <div key={item.id} className="rounded-xl p-4 flex flex-col gap-3"
                          style={{ border: `1px solid ${ACCENT}`, background: ACCENT_LIGHT }}>
                          <Field label="Label" required>
                            <input value={editingItem.label} onChange={(e) => setEditingItem((ei) => ({ ...ei, label: e.target.value }))} className="ui-input text-sm" />
                          </Field>
                          <div className="grid grid-cols-2 gap-3">
                            <Field label="Code">
                              <input value={editingItem.code || ""} onChange={(e) => setEditingItem((ei) => ({ ...ei, code: e.target.value }))} placeholder="e.g. FS-01" className="ui-input text-sm" />
                            </Field>
                            <Field label="Position">
                              <input type="number" min="1" value={editingItem.position || ""} onChange={(e) => setEditingItem((ei) => ({ ...ei, position: e.target.value }))} className="ui-input text-sm" />
                            </Field>
                          </div>
                          <Field label="Description">
                            <input value={editingItem.description || ""} onChange={(e) => setEditingItem((ei) => ({ ...ei, description: e.target.value }))} className="ui-input text-sm" />
                          </Field>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={editingItem.active !== false} onChange={(e) => setEditingItem((ei) => ({ ...ei, active: e.target.checked }))} className="w-4 h-4 rounded" style={{ accentColor: ACCENT }} />
                            <span className="text-xs font-semibold" style={{ color: "var(--text)" }}>Active (appears in inspections)</span>
                          </label>
                          <div className="flex gap-2">
                            <button onClick={() => setEditingItem(null)} className="flex-1 py-1.5 rounded-lg text-xs font-semibold hover:opacity-80"
                              style={{ background: "var(--bg-raised)", border: "1px solid var(--border)", color: "var(--text)" }}>Cancel</button>
                            <button onClick={() => handleUpdateItem(item)} className="flex-1 py-1.5 rounded-lg text-xs font-semibold hover:opacity-90"
                              style={{ background: ACCENT, color: "#fff" }}>Save</button>
                          </div>
                        </div>
                      ) : (
                        <div key={item.id} className="flex items-center justify-between rounded-xl px-4 py-3"
                          style={{ background: "var(--bg-raised)", border: "1px solid var(--border)" }}>
                          <div>
                            <p className="text-xs font-semibold" style={{ color: "var(--text)" }}>
                              <span className="mr-2 text-[10px] font-bold rounded px-1.5 py-0.5" style={{ background: ACCENT_LIGHT, color: ACCENT }}>
                                #{item.position ?? idx + 1}
                              </span>
                              {item.label}
                            </p>
                            {item.description && <p className="text-[11px] mt-0.5 ml-7" style={{ color: "var(--text-muted)" }}>{item.description}</p>}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <button onClick={() => setEditingItem({ ...item })} className="p-1.5 rounded-lg hover:opacity-80" style={{ color: "var(--text-muted)" }}>
                              <PencilSquareIcon className="h-3.5 w-3.5" />
                            </button>
                            <button onClick={() => handleDeleteItem(item)} className="p-1.5 rounded-lg hover:opacity-80" style={{ color: "#ef4444" }}>
                              <TrashIcon className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      )
                    ))
                  }
                  <div className="rounded-xl p-4 flex flex-col gap-3" style={{ border: "1px dashed var(--border)", background: "var(--bg-raised)" }}>
                    <p className="text-xs font-bold" style={{ color: ACCENT }}>Add New Inspection Point</p>
                    <Field label="Label" required error={itemErrors.label}>
                      <input value={newItem.label} onChange={(e) => { setNewItem((ni) => ({ ...ni, label: e.target.value })); setItemErrors({}); }}
                        placeholder="e.g. Fire extinguisher accessible" className="ui-input text-sm" />
                    </Field>
                    <div className="grid grid-cols-3 gap-3">
                      <Field label="Code">
                        <input value={newItem.code} onChange={(e) => setNewItem((ni) => ({ ...ni, code: e.target.value }))} placeholder="e.g. FS-01" className="ui-input text-sm" />
                      </Field>
                      <Field label="Description">
                        <input value={newItem.description} onChange={(e) => setNewItem((ni) => ({ ...ni, description: e.target.value }))} placeholder="Optional" className="ui-input text-sm" />
                      </Field>
                      <Field label="Position">
                        <input type="number" min="1" value={newItem.position} onChange={(e) => setNewItem((ni) => ({ ...ni, position: e.target.value }))} placeholder="Auto" className="ui-input text-sm" />
                      </Field>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={newItem.active} onChange={(e) => setNewItem((ni) => ({ ...ni, active: e.target.checked }))} className="w-4 h-4 rounded" style={{ accentColor: ACCENT }} />
                      <span className="text-xs font-semibold" style={{ color: "var(--text)" }}>Active (appears in inspections)</span>
                    </label>
                    <button onClick={handleAddItem}
                      className="flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold hover:opacity-90"
                      style={{ background: ACCENT, color: "#fff" }}>
                      <PlusIcon className="h-4 w-4" /> Add Inspection Point
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </ModalShell>
      <DeleteConfirmModal
        isOpen={Boolean(deleteTemplateTarget)} onClose={() => setDeleteTemplateTarget(null)}
        onConfirm={handleDeleteTemplate} loading={deletingTemplate} name={deleteTemplateTarget?.name}
      />
    </>
  );
}

// ─── Perform Inspection Modal ─────────────────────────────────────────────────

function PerformModal({ isOpen, onClose, report, auditId }) {
  const dispatch      = useAppDispatch();
  const templates     = useAppSelector(selectWirTemplates);
  const actionLoading = useAppSelector(selectWirActionLoading);
  const { user: currentUser } = useAuth();

  const [activeTab, setActiveTab] = useState(0);
  const [form, setForm]           = useState({ audit_date: "", audit_note: "" });
  const [errors, setErrors]       = useState({});
  const [results, setResults]     = useState({});
  const [issues, setIssues]       = useState([{ name: "", priority_level: "medium", due_date: "", file: null }]);
  const [issueErrors, setIssueErrors] = useState([{}]);

  useEffect(() => {
    if (!isOpen) return;
    setActiveTab(0);
    setForm({ audit_date: new Date().toISOString().slice(0, 10), audit_note: "" });
    setErrors({});
    setIssues([{ name: "", priority_level: "medium", due_date: "", file: null }]);
    setIssueErrors([{}]);
    const init = {};
    templates.forEach((tmpl) => {
      init[tmpl.id] = {};
      (tmpl.health_and_safety_audit_checklist_item_templates || []).filter((i) => i.active !== false).forEach((item) => {
        init[tmpl.id][item.id] = { status: "satisfactory", comment: "" };
      });
    });
    setResults(init);
  }, [isOpen, templates]);

  const tabs = [
    { key: "info",    label: "Audit Info" },
    ...templates.map((t) => ({ key: `tmpl_${t.id}`, label: t.name, template: t })),
    { key: "issues",  label: "Issues" },
    { key: "summary", label: "Summary" },
  ];

  function setItemResult(templateId, itemId, field, val) {
    setResults((prev) => ({
      ...prev,
      [templateId]: { ...prev[templateId], [itemId]: { ...prev[templateId]?.[itemId], [field]: val } },
    }));
  }

  function addIssue()           { setIssues((p) => [...p, { name: "", priority_level: "medium", due_date: "", file: null }]); setIssueErrors((p) => [...p, {}]); }
  function removeIssue(idx)     { setIssues((p) => p.filter((_, i) => i !== idx)); setIssueErrors((p) => p.filter((_, i) => i !== idx)); }
  function updateIssue(idx, k, v) {
    setIssues((p) => p.map((iss, i) => i === idx ? { ...iss, [k]: v } : iss));
    if (k === "name") setIssueErrors((p) => p.map((e, i) => i === idx ? { ...e, name: "" } : e));
  }

  function validate() {
    const e = {};
    if (!form.audit_date) e.audit_date = "Audit date is required.";
    setErrors(e);
    const ie = issues.map((iss) => {
      const hasData = iss.due_date || iss.file;
      if (hasData && !iss.name.trim()) return { name: "Issue name is required." };
      return {};
    });
    setIssueErrors(ie);
    const valid = Object.keys(e).length === 0 && ie.every((x) => Object.keys(x).length === 0);
    if (!valid && Object.keys(e).length > 0) setActiveTab(0);
    return valid;
  }

  async function handleSubmit() {
    if (!validate() || !report) return;
    const performedChecklist = templates.flatMap((t) =>
      (t.health_and_safety_audit_checklist_item_templates || []).filter((item) => item.active !== false).map((item) => ({
        id: item.id,
        status: results[t.id]?.[item.id]?.status || "satisfactory",
        ...(results[t.id]?.[item.id]?.comment ? { comment: results[t.id][item.id].comment } : {}),
      }))
    );
    const issuesPayload = issues.filter((iss) => iss.name.trim()).map((iss) => ({
      name: iss.name, priority_level: iss.priority_level || undefined,
      due_date: iss.due_date || undefined, file: iss.file || undefined,
    }));
    const payload = {
      audit_date: form.audit_date,
      audit_note: form.audit_note.trim() || undefined,
      auditor_id: report?.auditors?.[0]?.id || currentUser?.id,
      performedChecklist,
      issues: issuesPayload,
    };
    const result = await dispatch(performWirReport({ auditId, reportId: report.id, payload }));
    if (performWirReport.fulfilled.match(result)) {
      toast.success("Audit performed successfully.");
      dispatch(fetchWirReports(auditId));
      onClose();
    } else {
      toast.error(result.payload || "Failed to perform audit.");
    }
  }

  return (
    <ModalShell isOpen={isOpen} onClose={onClose} title="Perform Audit" width="max-w-3xl">
      <div className="flex overflow-x-auto flex-shrink-0" style={{ borderBottom: "1px solid var(--border)" }}>
        {tabs.map((tab, idx) => (
          <button key={tab.key} onClick={() => setActiveTab(idx)}
            className="px-5 py-3 text-xs font-semibold whitespace-nowrap transition-all border-b-2"
            style={{ borderBottomColor: activeTab === idx ? ACCENT : "transparent", color: activeTab === idx ? ACCENT : "var(--text-muted)", background: "transparent" }}>
            {tab.label}
          </button>
        ))}
      </div>
      <div className="p-6 overflow-y-auto flex-1">
        {/* Audit Info Tab */}
        {activeTab === 0 && (
          <div className="flex flex-col gap-6">
            <div className="relative rounded-2xl overflow-hidden p-5"
              style={{ background: `linear-gradient(135deg, ${ACCENT}22 0%, ${ACCENT}06 100%)`, border: `1px solid ${ACCENT}33` }}>
              <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full pointer-events-none"
                style={{ background: `radial-gradient(circle, ${ACCENT}22, transparent 70%)` }} />
              <div className="flex items-start gap-4 relative">
                <div className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: `linear-gradient(135deg, ${ACCENT}, #b45309)`, boxShadow: `0 6px 18px ${ACCENT}55` }}>
                  <ClipboardDocumentCheckIcon className="h-7 w-7 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: ACCENT }}>Performing Audit</p>
                  <p className="text-base font-bold" style={{ color: "var(--text)" }}>{report?.area_audited || "—"}</p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-xs" style={{ color: "var(--text-muted)" }}>Audit #{report?.audit_number}</span>
                    <span style={{ color: "var(--text-muted)" }}>·</span>
                    <span className="text-xs" style={{ color: "var(--text-muted)" }}>{templates.length} template{templates.length !== 1 ? "s" : ""}</span>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1 h-4 rounded-full" style={{ background: ACCENT }} />
                <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Report Details</p>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                {[
                  { icon: <CalendarDaysIcon className="h-3.5 w-3.5" />, label: "Scheduled", value: formatDate(report?.date) },
                  { icon: <ClipboardDocumentCheckIcon className="h-3.5 w-3.5" />, label: "Audit No.", value: `#${report?.audit_number}` },
                ].map(({ icon, label, value }) => (
                  <div key={label} className="rounded-xl p-3 flex items-start gap-2.5"
                    style={{ background: "var(--bg-raised)", border: "1px solid var(--border)" }}>
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: ACCENT_LIGHT, color: ACCENT }}>{icon}</div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold uppercase tracking-wide mb-0.5" style={{ color: "var(--text-muted)" }}>{label}</p>
                      <p className="text-xs font-semibold" style={{ color: "var(--text)" }}>{value}</p>
                    </div>
                  </div>
                ))}
                <div className="col-span-2 rounded-xl p-3 flex items-start gap-2.5"
                  style={{ background: "var(--bg-raised)", border: "1px solid var(--border)" }}>
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: ACCENT_LIGHT, color: ACCENT }}>
                    <UsersIcon className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-wide mb-0.5" style={{ color: "var(--text-muted)" }}>Assigned Auditors</p>
                    <p className="text-xs font-semibold" style={{ color: "var(--text)" }}>{(report?.auditors || []).map(displayName).join(", ") || "—"}</p>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1 h-4 rounded-full" style={{ background: ACCENT }} />
                <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Audit Information</p>
              </div>
              <div className="flex flex-col gap-3">
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
          </div>
        )}

        {/* Template Tabs */}
        {tabs.slice(1, -2).map((tab, tIdx) => {
          const tmpl = tab.template;
          if (!tmpl || activeTab !== tIdx + 1) return null;
          const items = (tmpl.health_and_safety_audit_checklist_item_templates || []).filter((i) => i.active !== false);
          return (
            <div key={tmpl.id} className="flex flex-col gap-3">
              {tmpl.description && (
                <p className="text-xs px-1 pb-2" style={{ color: "var(--text-muted)", borderBottom: "1px solid var(--border)" }}>{tmpl.description}</p>
              )}
              {items.length === 0
                ? <p className="text-sm text-center py-8" style={{ color: "var(--text-muted)" }}>No audit points in this template.</p>
                : items.map((item) => {
                  const res = results[tmpl.id]?.[item.id] || { status: "satisfactory", comment: "" };
                  return (
                    <div key={item.id} className="rounded-xl p-4 flex flex-col gap-3"
                      style={{ background: "var(--bg-raised)", border: "1px solid var(--border)" }}>
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>{item.label}</p>
                          {item.description && <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{item.description}</p>}
                        </div>
                        <div className="flex gap-1.5 flex-shrink-0">
                          {PERFORM_STATUSES.map((s) => (
                            <button key={s} type="button" onClick={() => setItemResult(tmpl.id, item.id, "status", s)}
                              className="px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all"
                              style={{
                                background: res.status === s ? (s === "satisfactory" ? ACCENT : s === "unsatisfactory" ? "#ef4444" : "#6b7280") : "var(--bg-surface)",
                                color: res.status === s ? "#fff" : "var(--text-muted)",
                                border: `1px solid ${res.status === s ? "transparent" : "var(--border)"}`,
                              }}>
                              {PERFORM_STATUS_LABELS[s]}
                            </button>
                          ))}
                        </div>
                      </div>
                      <input value={res.comment} onChange={(e) => setItemResult(tmpl.id, item.id, "comment", e.target.value)}
                        placeholder="Optional comment…" className="ui-input text-xs" />
                    </div>
                  );
                })
              }
            </div>
          );
        })}

        {/* Issues Tab */}
        {activeTab === tabs.length - 2 && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold" style={{ color: "var(--text)" }}>Issues Identified</p>
              <button onClick={addIssue}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold hover:opacity-90"
                style={{ background: ACCENT_LIGHT, color: ACCENT }}>
                <PlusIcon className="h-3.5 w-3.5" /> Add Issue
              </button>
            </div>
            {issues.map((iss, idx) => (
              <div key={idx} className="rounded-xl p-4 flex flex-col gap-3"
                style={{ border: "1px solid var(--border)", background: "var(--bg-raised)" }}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold" style={{ color: ACCENT }}>Issue #{idx + 1}</span>
                  {issues.length > 1 && (
                    <button onClick={() => removeIssue(idx)} className="p-1 rounded hover:opacity-70" style={{ color: "#ef4444" }}>
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <Field label="Issue Name" required error={issueErrors[idx]?.name}>
                  <input value={iss.name} onChange={(e) => updateIssue(idx, "name", e.target.value)}
                    placeholder="e.g. Fire exit blocked" className="ui-input text-sm" />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Priority Level">
                    <select value={iss.priority_level} onChange={(e) => updateIssue(idx, "priority_level", e.target.value)} className="ui-input text-sm">
                      {PRIORITY_LEVELS.map((p) => <option key={p} value={p}>{PRIORITY_STYLES[p].label}</option>)}
                    </select>
                  </Field>
                  <Field label="Due Date">
                    <input type="date" value={iss.due_date} onChange={(e) => updateIssue(idx, "due_date", e.target.value)} className="ui-input text-sm" />
                  </Field>
                </div>
                <Field label="Supporting Document">
                  <label className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer hover:opacity-80"
                    style={{ border: "1px dashed var(--border)", background: "var(--bg-surface)" }}>
                    <PaperClipIcon className="h-4 w-4" style={{ color: "var(--text-muted)" }} />
                    <span className="text-xs" style={{ color: "var(--text-muted)" }}>{iss.file ? iss.file.name : "Attach file (optional)"}</span>
                    <input type="file" className="hidden" onChange={(e) => updateIssue(idx, "file", e.target.files[0] || null)} />
                  </label>
                </Field>
              </div>
            ))}
          </div>
        )}

        {/* Summary Tab */}
        {activeTab === tabs.length - 1 && (() => {
          const allStatuses      = templates.flatMap((t) => (t.health_and_safety_audit_checklist_item_templates || []).filter((i) => i.active !== false).map((item) => results[t.id]?.[item.id]?.status || "satisfactory"));
          const satisfactoryCount   = allStatuses.filter((s) => s === "satisfactory").length;
          const unsatisfactoryCount = allStatuses.filter((s) => s === "unsatisfactory").length;
          const naCount             = allStatuses.filter((s) => s === "not_applicable").length;
          const issueCount          = issues.filter((i) => i.name.trim()).length;
          return (
            <div className="flex flex-col gap-5">
              <div className="relative rounded-2xl overflow-hidden p-4"
                style={{ background: `linear-gradient(135deg, ${ACCENT}22 0%, ${ACCENT}06 100%)`, border: `1px solid ${ACCENT}33` }}>
                <div className="flex items-center gap-3 relative">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: `linear-gradient(135deg, ${ACCENT}, #b45309)`, boxShadow: `0 4px 14px ${ACCENT}55` }}>
                    <CheckBadgeIcon className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: ACCENT }}>Ready to Submit</p>
                    <p className="text-sm font-bold truncate" style={{ color: "var(--text)" }}>{report?.area_audited || "—"} · #{report?.audit_number}</p>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>Audit Date: {formatDate(form.audit_date)}</p>
                  </div>
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-1 h-4 rounded-full" style={{ background: ACCENT }} />
                  <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Completion Overview</p>
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  {[
                    { label: "Satisfactory",   value: satisfactoryCount,   color: "#10b981", bg: "rgba(16,185,129,0.1)",  icon: <CheckCircleIcon className="h-4 w-4" /> },
                    { label: "Unsatisfactory", value: unsatisfactoryCount, color: "#ef4444", bg: "rgba(239,68,68,0.1)",   icon: <ExclamationTriangleIcon className="h-4 w-4" /> },
                    { label: "Not Applicable", value: naCount,             color: "#6b7280", bg: "rgba(107,114,128,0.1)", icon: <XMarkIcon className="h-4 w-4" /> },
                    { label: "Issues Raised",  value: issueCount,          color: "#f59e0b", bg: "rgba(245,158,11,0.1)",  icon: <BellAlertIcon className="h-4 w-4" /> },
                  ].map(({ label, value, color, bg, icon }) => (
                    <div key={label} className="rounded-xl p-3.5 flex items-center gap-3"
                      style={{ background: "var(--bg-raised)", border: `1px solid ${color}30` }}>
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: bg, color }}>{icon}</div>
                      <div>
                        <p className="text-2xl font-black leading-none" style={{ color }}>{value}</p>
                        <p className="text-[10px] font-semibold mt-0.5 uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>{label}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
                <div className="px-4 py-2.5" style={{ background: ACCENT_LIGHT, borderBottom: "1px solid var(--border)" }}>
                  <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: ACCENT }}>Audit Details</p>
                </div>
                {[
                  { label: "Report",        value: `#${report?.audit_number} — ${report?.area_audited}` },
                  { label: "Audit Date",    value: formatDate(form.audit_date) },
                  { label: "Templates",     value: `${templates.length} section(s)` },
                  { label: "Total Points",  value: allStatuses.length },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between px-4 py-2.5" style={{ borderBottom: "1px solid var(--border)" }}>
                    <span className="text-xs" style={{ color: "var(--text-muted)" }}>{label}</span>
                    <span className="text-xs font-semibold" style={{ color: "var(--text)" }}>{value}</span>
                  </div>
                ))}
              </div>
              {form.audit_note && (
                <div className="rounded-xl p-4" style={{ background: "var(--bg-raised)", borderLeft: `3px solid ${ACCENT}`, border: `1px solid ${ACCENT}33` }}>
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: ACCENT }}>Audit Note</p>
                  <p className="text-sm leading-relaxed" style={{ color: "var(--text)" }}>{form.audit_note}</p>
                </div>
              )}
              <div className="flex items-center gap-3">
                <button onClick={() => setActiveTab((t) => t - 1)}
                  className="flex-1 flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-semibold hover:opacity-80"
                  style={{ background: "var(--bg-raised)", border: "1px solid var(--border)", color: "var(--text-muted)", minWidth: "110px" }}>
                  <ChevronLeftIcon className="h-4 w-4" /> Previous
                </button>
                <button onClick={handleSubmit} disabled={actionLoading}
                  className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold hover:opacity-90 disabled:opacity-60"
                  style={{ background: ACCENT, color: "#fff", boxShadow: `0 4px 18px ${ACCENT}55` }}>
                  {actionLoading ? <Spinner size={4} /> : <CheckBadgeIcon className="h-5 w-5" />}
                  Submit Audit
                </button>
              </div>
            </div>
          );
        })()}
      </div>
      {activeTab !== tabs.length - 1 && (
        <div className="flex items-center justify-between px-6 py-4 flex-shrink-0" style={{ borderTop: "1px solid var(--border)" }}>
          <button onClick={() => setActiveTab((t) => Math.max(0, t - 1))} disabled={activeTab === 0}
            className="flex items-center gap-1 text-sm font-semibold disabled:opacity-30 hover:opacity-80"
            style={{ color: "var(--text-muted)" }}>
            <ChevronLeftIcon className="h-4 w-4" /> Prev
          </button>
          <button onClick={() => setActiveTab((t) => Math.min(tabs.length - 1, t + 1))}
            className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold hover:opacity-90"
            style={{ background: ACCENT, color: "#fff" }}>
            Next <ChevronRightIcon className="h-4 w-4" />
          </button>
        </div>
      )}
    </ModalShell>
  );
}

function ReassignModal({ isOpen, onClose, report, auditId }) {
  const dispatch     = useAppDispatch();
  const actionLoading = useAppSelector(selectWirActionLoading);
  const [auditors, setAuditors] = useState([]);

  useEffect(() => {
    if (isOpen && report) setAuditors(report.auditors || []);
  }, [isOpen, report]);

  function toggleAuditor(u) {
    setAuditors((prev) => prev.some((a) => a.id === u.id) ? prev.filter((a) => a.id !== u.id) : [...prev, u]);
  }

  async function handleSave() {
    if (auditors.length === 0) { toast.error("At least one auditor is required."); return; }
    const result = await dispatch(reassignWirAuditors({ auditId, id: report.id, auditorIds: auditors.map((a) => a.id) }));
    if (reassignWirAuditors.fulfilled.match(result)) {
      toast.success("Auditors reassigned."); onClose();
    } else {
      toast.error(result.payload || "Failed to reassign auditors.");
    }
  }

  return (
    <ModalShell isOpen={isOpen} onClose={onClose} title="Reassign Auditors" width="max-w-md">
      <div className="p-6 flex flex-col gap-4">
        <AuditorPicker selected={auditors} onToggle={toggleAuditor} label="Select Auditors" />
        <div className="flex gap-3 pt-2">
          <button onClick={onClose} disabled={actionLoading}
            className="flex-1 py-2 rounded-lg text-sm font-semibold hover:opacity-80"
            style={{ background: "var(--bg-raised)", border: "1px solid var(--border)", color: "var(--text)" }}>
            Cancel
          </button>
          <button onClick={handleSave} disabled={actionLoading}
            className="flex-1 py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 hover:opacity-90"
            style={{ background: ACCENT, color: "#fff" }}>
            {actionLoading ? <Spinner size={3} /> : <CheckBadgeIcon className="h-4 w-4" />}
            Save
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

// ─── WIR Issue Card ────────────────────────────────────────────────────────────

const ISSUE_ACTIONS = [
  { key: "ca",         label: "Corrective Action",  Icon: WrenchScrewdriverIcon },
  { key: "priority",   label: "Priority / Due Date", Icon: CalendarDaysIcon },
  { key: "contractor", label: "Assign Contractor",   Icon: UsersIcon },
  { key: "execute",    label: "Execute / Close",     Icon: CheckCircleIcon },
];

function WirIssueCard({ issue: initialIssue, auditId, performedId }) {
  const dispatch = useAppDispatch();
  const [expanded, setExpanded]         = useState(false);
  const [activeSection, setActiveSection] = useState(null);
  const [issue, setIssue]               = useState(initialIssue);
  const [saving, setSaving]             = useState(false);
  const [caText, setCaText]             = useState(initialIssue.corrective_action ?? "");
  const [priority, setPriority]         = useState(initialIssue.priority_level ?? "medium");
  const [dueDate, setDueDate]           = useState(initialIssue.due_date ?? "");
  const [contractor, setContractor]     = useState(initialIssue.contractor ?? null);
  const [executeForm, setExecuteForm]   = useState({ completion_date: "", completion_notes: "", file: null });

  useEffect(() => {
    setIssue(initialIssue);
    setCaText(initialIssue.corrective_action ?? "");
    setPriority(initialIssue.priority_level ?? "medium");
    setDueDate(initialIssue.due_date ?? "");
    setContractor(initialIssue.contractor ?? null);
  }, [initialIssue]);

  function toggle(s) { setActiveSection((p) => (p === s ? null : s)); }

  async function saveCa() {
    if (!caText.trim()) return;
    setSaving(true);
    const r = await dispatch(updateWirCorrectiveAction({ auditId, performedId, issueId: issue.id, corrective_action: caText.trim() }));
    setSaving(false);
    if (updateWirCorrectiveAction.fulfilled.match(r)) {
      setIssue((prev) => ({ ...prev, corrective_action: caText.trim() }));
      toast.success("Corrective action updated."); setActiveSection(null);
    } else { toast.error(r.payload || "Save failed."); }
  }

  async function savePriority() {
    setSaving(true);
    const r = await dispatch(updateWirPriorityDueDate({ auditId, performedId, issueId: issue.id, priority_level: priority, due_date: dueDate }));
    setSaving(false);
    if (updateWirPriorityDueDate.fulfilled.match(r)) {
      setIssue((prev) => ({ ...prev, priority_level: priority, due_date: dueDate }));
      toast.success("Priority updated."); setActiveSection(null);
    } else { toast.error(r.payload || "Save failed."); }
  }

  async function saveContractor() {
    if (!contractor) return;
    setSaving(true);
    const r = await dispatch(assignWirContractor({ auditId, performedId, issueId: issue.id, contractor_id: contractor.id }));
    setSaving(false);
    if (assignWirContractor.fulfilled.match(r)) {
      setIssue((prev) => ({ ...prev, contractor }));
      toast.success("Contractor assigned."); setActiveSection(null);
    } else { toast.error(r.payload || "Assign failed."); }
  }

  async function saveExecute() {
    if (!executeForm.completion_date) { toast.error("Completion date is required."); return; }
    setSaving(true);
    const r = await dispatch(executeWirIssue({ auditId, performedId, issueId: issue.id, data: executeForm }));
    setSaving(false);
    if (executeWirIssue.fulfilled.match(r)) {
      setIssue((prev) => ({ ...prev, executed_at: new Date().toISOString() }));
      toast.success("Issue executed & closed."); setActiveSection(null);
    } else { toast.error(r.payload || "Execute failed."); }
  }

  const contractorName = issue.contractor
    ? [issue.contractor.firstname || issue.contractor.first_name, issue.contractor.lastname || issue.contractor.last_name].filter(Boolean).join(" ")
    : null;

  const isClosed = !!issue.executed_at;
  const priorityAccentMap = { critical: "#ef4444", high: "#f97316", medium: "#f59e0b", low: "#3b82f6" };
  const priorityAccent = isClosed ? "#10b981" : (priorityAccentMap[issue.priority_level] || "#6b7280");

  return (
    <div className="rounded-2xl overflow-hidden"
      style={{
        border: "1px solid var(--border)",
        borderLeft: `3px solid ${priorityAccent}`,
        background: "var(--bg-raised)",
        opacity: isClosed ? 0.75 : 1,
      }}>
      {/* ── Header row ── */}
      <div className="flex items-start justify-between gap-3 px-4 py-3.5 cursor-pointer select-none"
        onClick={() => setExpanded((p) => !p)}>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1.5">
            {isClosed
              ? <CheckCircleIcon className="h-4 w-4 flex-shrink-0" style={{ color: "#10b981" }} />
              : <ExclamationTriangleIcon className="h-4 w-4 flex-shrink-0" style={{ color: priorityAccent }} />
            }
            <span className="text-sm font-semibold leading-tight" style={{ color: "var(--text)" }}>{issue.name}</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {issue.priority_level && <PriorityBadge priority={issue.priority_level} />}
            {issue.due_date && (
              <span className="flex items-center gap-1 text-[11px] font-medium" style={{ color: "var(--text-muted)" }}>
                <CalendarDaysIcon className="h-3 w-3" />
                {formatDate(issue.due_date)}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {isClosed && (
            <span className="text-[11px] px-2.5 py-1 rounded-full font-semibold"
              style={{ background: "rgba(16,185,129,.12)", color: "#10b981" }}>
              executed
            </span>
          )}
          <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
            style={{
              background: expanded ? ACCENT_LIGHT : "var(--bg)",
              border: `1px solid ${expanded ? ACCENT : "var(--border)"}`,
              transition: "all 0.15s",
            }}>
            {expanded
              ? <ChevronUpIcon className="h-3.5 w-3.5" style={{ color: ACCENT }} />
              : <ChevronDownIcon className="h-3.5 w-3.5" style={{ color: "var(--text-muted)" }} />
            }
          </div>
        </div>
      </div>

      {/* ── Expanded body ── */}
      {expanded && (
        <div className="px-4 pb-4 flex flex-col gap-3" style={{ borderTop: "1px solid var(--border)" }}>

          {/* Saved values summary */}
          {(issue.corrective_action || contractorName) && (
            <div className="mt-3 rounded-xl p-3.5" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
              {issue.corrective_action && (
                <div className="mb-2 last:mb-0">
                  <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider mb-1"
                    style={{ color: ACCENT }}>
                    <WrenchScrewdriverIcon className="h-3 w-3" /> Corrective Action
                  </p>
                  <p className="text-xs leading-relaxed" style={{ color: "var(--text)" }}>{issue.corrective_action}</p>
                </div>
              )}
              {contractorName && (
                <div className="mt-2 pt-2" style={{ borderTop: issue.corrective_action ? "1px solid var(--border)" : "none" }}>
                  <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider mb-1"
                    style={{ color: ACCENT }}>
                    <UsersIcon className="h-3 w-3" /> Assigned Contractor
                  </p>
                  <p className="text-xs" style={{ color: "var(--text)" }}>{contractorName}</p>
                </div>
              )}
            </div>
          )}

          {/* Action chips */}
          {!isClosed && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {ISSUE_ACTIONS.map(({ key, label, Icon }) => {
                const isActive = activeSection === key;
                const chipColor = key === "execute" ? "#ef4444" : ACCENT;
                return (
                  <button key={key} onClick={() => toggle(key)}
                    className="flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-full"
                    style={{
                      border: `1px solid ${isActive ? chipColor : "var(--border)"}`,
                      color: isActive ? "#fff" : "var(--text-muted)",
                      background: isActive ? chipColor : "var(--bg)",
                      boxShadow: isActive ? `0 2px 8px ${chipColor}40` : "none",
                      transition: "all 0.15s",
                    }}>
                    <Icon className="h-3.5 w-3.5" />{label}
                  </button>
                );
              })}
            </div>
          )}

          {/* ── Corrective Action panel ── */}
          {activeSection === "ca" && (
            <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${ACCENT}35`, background: "var(--bg)" }}>
              <div className="flex items-center gap-2 px-4 py-2.5"
                style={{ background: ACCENT_LIGHT, borderBottom: `1px solid ${ACCENT}25` }}>
                <WrenchScrewdriverIcon className="h-3.5 w-3.5" style={{ color: ACCENT }} />
                <p className="text-xs font-bold" style={{ color: ACCENT }}>Corrective Action</p>
              </div>
              <div className="p-4">
                <textarea rows={3} value={caText} onChange={(e) => setCaText(e.target.value)}
                  placeholder="Describe the corrective action…" className="ui-input text-sm resize-none w-full" />
                <div className="flex justify-end mt-3">
                  <button onClick={saveCa} disabled={saving || !caText.trim()}
                    className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-full text-white"
                    style={{ background: ACCENT, opacity: saving || !caText.trim() ? 0.5 : 1, boxShadow: `0 2px 10px rgba(217,119,6,0.35)` }}>
                    {saving ? <Spinner size={3} /> : <CheckCircleIcon className="h-3.5 w-3.5" />} Save
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── Priority + Due Date panel ── */}
          {activeSection === "priority" && (
            <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${ACCENT}35`, background: "var(--bg)" }}>
              <div className="flex items-center gap-2 px-4 py-2.5"
                style={{ background: ACCENT_LIGHT, borderBottom: `1px solid ${ACCENT}25` }}>
                <CalendarDaysIcon className="h-3.5 w-3.5" style={{ color: ACCENT }} />
                <p className="text-xs font-bold" style={{ color: ACCENT }}>Priority & Due Date</p>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Priority">
                    <select value={priority} onChange={(e) => setPriority(e.target.value)} className="ui-input text-sm">
                      {PRIORITY_LEVELS.map((p) => <option key={p} value={p}>{PRIORITY_STYLES[p].label}</option>)}
                    </select>
                  </Field>
                  <Field label="Due Date">
                    <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="ui-input text-sm" />
                  </Field>
                </div>
                <div className="flex justify-end mt-3">
                  <button onClick={savePriority} disabled={saving}
                    className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-full text-white"
                    style={{ background: ACCENT, opacity: saving ? 0.5 : 1, boxShadow: `0 2px 10px rgba(217,119,6,0.35)` }}>
                    {saving ? <Spinner size={3} /> : <CheckCircleIcon className="h-3.5 w-3.5" />} Save
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── Contractor panel ── */}
          {activeSection === "contractor" && (
            <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${ACCENT}35`, background: "var(--bg)" }}>
              <div className="flex items-center gap-2 px-4 py-2.5"
                style={{ background: ACCENT_LIGHT, borderBottom: `1px solid ${ACCENT}25` }}>
                <UsersIcon className="h-3.5 w-3.5" style={{ color: ACCENT }} />
                <p className="text-xs font-bold" style={{ color: ACCENT }}>Assign Contractor</p>
              </div>
              <div className="p-4">
                <ContractorPicker selected={contractor} onSelect={setContractor} />
                <div className="flex justify-end mt-3">
                  <button onClick={saveContractor} disabled={saving || !contractor}
                    className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-full text-white"
                    style={{ background: ACCENT, opacity: saving || !contractor ? 0.5 : 1, boxShadow: `0 2px 10px rgba(217,119,6,0.35)` }}>
                    {saving ? <Spinner size={3} /> : <CheckCircleIcon className="h-3.5 w-3.5" />} Assign
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── Execute panel ── */}
          {activeSection === "execute" && (
            <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(239,68,68,.25)", background: "var(--bg)" }}>
              <div className="flex items-center gap-2 px-4 py-2.5"
                style={{ background: "rgba(239,68,68,.06)", borderBottom: "1px solid rgba(239,68,68,.15)" }}>
                <ExclamationTriangleIcon className="h-3.5 w-3.5" style={{ color: "#ef4444" }} />
                <p className="text-xs font-bold" style={{ color: "#ef4444" }}>Execute & Close Issue</p>
              </div>
              <div className="p-4">
                <p className="text-xs mb-4" style={{ color: "var(--text-muted)" }}>
                  Completing this form will permanently close this issue. Ensure all details are accurate before proceeding.
                </p>
                <div className="flex flex-col gap-3">
                  <Field label="Completion Date" required>
                    <input type="date" value={executeForm.completion_date}
                      onChange={(e) => setExecuteForm((f) => ({ ...f, completion_date: e.target.value }))}
                      className="ui-input text-sm" />
                  </Field>
                  <Field label="Completion Notes">
                    <textarea rows={2} value={executeForm.completion_notes}
                      onChange={(e) => setExecuteForm((f) => ({ ...f, completion_notes: e.target.value }))}
                      placeholder="Closing notes…" className="ui-input text-sm resize-none" />
                  </Field>
                  <Field label="Supporting Document">
                    <label className="flex items-center gap-2 px-3 py-2.5 rounded-xl cursor-pointer hover:opacity-80"
                      style={{ border: "2px dashed var(--border)", background: "var(--bg-surface)" }}>
                      <PaperClipIcon className="h-4 w-4" style={{ color: "var(--text-muted)" }} />
                      <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                        {executeForm.file ? executeForm.file.name : "Click to attach a document (optional)"}
                      </span>
                      <input type="file" className="hidden"
                        onChange={(e) => setExecuteForm((f) => ({ ...f, file: e.target.files[0] || null }))} />
                    </label>
                  </Field>
                </div>
                <div className="flex justify-end mt-4">
                  <button onClick={saveExecute} disabled={saving || !executeForm.completion_date}
                    className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-full text-white"
                    style={{ background: "#ef4444", opacity: saving || !executeForm.completion_date ? 0.5 : 1, boxShadow: "0 2px 10px rgba(239,68,68,0.35)" }}>
                    {saving ? <Spinner size={3} /> : <CheckCircleIcon className="h-3.5 w-3.5" />} Execute & Close
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Executed state */}
          {isClosed && (
            <div className="flex items-center gap-2 mt-1">
              <CheckCircleIcon className="h-4 w-4" style={{ color: "#10b981" }} />
              <span className="text-xs font-semibold" style={{ color: "#10b981" }}>Executed on {formatDate(issue.executed_at)}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Performed Detail Modal ────────────────────────────────────────────────────

function PerformedDetailModal({ isOpen, onClose, performed, auditId }) {
  const dispatch       = useAppDispatch();
  const issuesByPerf   = useAppSelector(selectWirIssuesByPerformed);
  const [activeTab, setActiveTab] = useState("issues");

  useEffect(() => {
    if (isOpen && performed) {
      dispatch(fetchWirIssues({ auditId, performedId: performed.id, params: {} }));
      setActiveTab("issues");
    }
  }, [isOpen, performed, auditId, dispatch]);

  if (!isOpen || !performed) return null;

  const issues       = issuesByPerf[performed.id] ?? [];
  const rawItems     = performed.performed_workplace_inspection_report_items
    ?? performed.performedChecklist
    ?? performed.performed_items
    ?? [];
  const performedItems = rawItems;

  const auditorInitial = (
    performed.auditor?.firstname?.[0] || performed.auditor?.first_name?.[0] || "A"
  ).toUpperCase();

  const tabs = [
    { key: "issues", label: "Issues",           count: issues.length },
    { key: "items",  label: "Inspection Points", count: performedItems.length },
  ];

  const ITEM_STATUS_MAP = {
    satisfactory:   { bg: "rgba(16,185,129,.08)",  border: "#10b981", color: "#10b981", label: "Satisfactory",   icon: <CheckCircleIcon className="h-3.5 w-3.5" /> },
    unsatisfactory: { bg: "rgba(239,68,68,.06)",   border: "#ef4444", color: "#ef4444", label: "Unsatisfactory", icon: <ExclamationTriangleIcon className="h-3.5 w-3.5" /> },
    not_applicable: { bg: "rgba(107,114,128,.06)", border: "#9ca3af", color: "#9ca3af", label: "N/A",            icon: <XMarkIcon className="h-3.5 w-3.5" /> },
  };

  return createPortal(
    <div className="fixed inset-0 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.6)", zIndex: 10002, backdropFilter: "blur(4px)" }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-2xl flex flex-col rounded-2xl overflow-hidden"
        style={{
          background: "var(--bg-surface)",
          boxShadow: "0 25px 60px rgba(0,0,0,0.3), 0 0 0 1px var(--border)",
          maxHeight: "90vh",
          zIndex: 10003,
        }}>

        {/* ── Header banner ── */}
        <div className="relative overflow-hidden flex-shrink-0 px-6 py-5"
          style={{ background: `linear-gradient(135deg, rgba(217,119,6,0.08) 0%, rgba(217,119,6,0.03) 50%, transparent 100%)`, borderBottom: "1px solid var(--border)" }}>
          {/* Soft decorative glow */}
          <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full pointer-events-none"
            style={{ background: `radial-gradient(circle, rgba(217,119,6,0.1) 0%, transparent 70%)` }} />

          <div className="flex items-center gap-4 relative">
            {/* Auditor avatar */}
            <div className="flex-shrink-0 flex items-center justify-center rounded-2xl text-white text-base font-bold"
              style={{
                width: 52, height: 52,
                background: `linear-gradient(135deg, ${ACCENT} 0%, #b45309 100%)`,
                boxShadow: `0 4px 14px rgba(217,119,6,0.4)`,
              }}>
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
                Conducted by {displayName(performed.auditor)}
              </p>
            </div>
            <div className="flex flex-col items-end gap-2 flex-shrink-0">
              <button onClick={onClose}
                className="p-2 rounded-xl hover:opacity-70 transition-opacity"
                style={{ background: "var(--bg-raised)", color: "var(--text-muted)", border: "1px solid var(--border)" }}>
                <XMarkIcon className="h-4 w-4" />
              </button>
              {issues.length > 0 && (
                <span className="text-[11px] px-2.5 py-1 rounded-full font-bold whitespace-nowrap"
                  style={{ background: "rgba(239,68,68,.1)", color: "#ef4444" }}>
                  {issues.length} open issue{issues.length !== 1 ? "s" : ""}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ── Pill tab bar ── */}
        <div className="flex-shrink-0 px-5 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
          <div className="inline-flex rounded-xl p-1 gap-0.5" style={{ background: "var(--bg-raised)" }}>
            {tabs.map(({ key, label, count }) => (
              <button key={key} onClick={() => setActiveTab(key)}
                className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold"
                style={{
                  background: activeTab === key ? "var(--bg-surface)" : "transparent",
                  color: activeTab === key ? "var(--text)" : "var(--text-muted)",
                  boxShadow: activeTab === key ? "0 1px 4px rgba(0,0,0,0.12)" : "none",
                  transition: "all 0.15s",
                }}>
                {label}
                {count > 0 && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold min-w-[18px] text-center"
                    style={{
                      background: activeTab === key && key === "issues" ? "rgba(239,68,68,.12)" : activeTab === key ? ACCENT_LIGHT : "rgba(107,114,128,.1)",
                      color: activeTab === key && key === "issues" ? "#ef4444" : activeTab === key ? ACCENT : "var(--text-muted)",
                    }}>
                    {count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* ── Tab body ── */}
        <div className="flex-1 overflow-y-auto">

          {/* Issues tab */}
          {activeTab === "issues" && (
            <div className="p-5">
              {issues.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                    style={{ background: ACCENT_LIGHT }}>
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
                    <WirIssueCard key={iss.id} issue={iss} auditId={auditId} performedId={performed.id} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Inspection Points tab */}
          {activeTab === "items" && (
            <div className="p-5">
              {performedItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                    style={{ background: ACCENT_LIGHT }}>
                    <ClipboardDocumentCheckIcon className="h-8 w-8" style={{ color: ACCENT }} />
                  </div>
                  <p className="text-sm font-bold mb-1" style={{ color: "var(--text)" }}>No Points Recorded</p>
                  <p className="text-xs text-center max-w-xs" style={{ color: "var(--text-muted)" }}>
                    No inspection points were recorded for this session.
                  </p>
                </div>
              ) : (() => {
                const satisfactoryCount   = performedItems.filter((i) => (i.status ?? "").toLowerCase() === "satisfactory").length;
                const unsatisfactoryCount = performedItems.filter((i) => (i.status ?? "").toLowerCase() === "unsatisfactory").length;
                const naCount             = performedItems.filter((i) => (i.status ?? "").toLowerCase() === "not_applicable").length;

                // Group by template
                const groups = [];
                const seen = new Map();
                performedItems.forEach((item) => {
                  const tmpl = item.health_and_safety_audit_checklist_item_template;
                  const tmplId   = tmpl?.health_and_safety_audit_checklist_template_id ?? "uncategorised";
                  const tmplName = tmpl?.health_and_safety_audit_checklist_template?.name ?? "General";
                  if (!seen.has(tmplId)) {
                    seen.set(tmplId, groups.length);
                    groups.push({ tmplId, tmplName, items: [] });
                  }
                  groups[seen.get(tmplId)].items.push(item);
                });

                return (
                  <div className="flex flex-col gap-4">
                    {/* Summary bar */}
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { label: "Satisfactory",   value: satisfactoryCount,   color: "#10b981", bg: "rgba(16,185,129,0.08)",  icon: <CheckCircleIcon className="h-4 w-4" /> },
                        { label: "Unsatisfactory", value: unsatisfactoryCount, color: "#ef4444", bg: "rgba(239,68,68,0.08)",   icon: <ExclamationTriangleIcon className="h-4 w-4" /> },
                        { label: "N/A",            value: naCount,             color: "#9ca3af", bg: "rgba(107,114,128,0.08)", icon: <XMarkIcon className="h-4 w-4" /> },
                      ].map(({ label, value, color, bg, icon }) => (
                        <div key={label} className="rounded-xl p-3 flex items-center gap-2.5"
                          style={{ background: "var(--bg-raised)", border: `1px solid ${color}25` }}>
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                            style={{ background: bg, color }}>
                            {icon}
                          </div>
                          <div>
                            <p className="text-lg font-black leading-none" style={{ color }}>{value}</p>
                            <p className="text-[10px] font-semibold uppercase tracking-wide mt-0.5" style={{ color: "var(--text-muted)" }}>{label}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Grouped items */}
                    {groups.map(({ tmplId, tmplName, items: groupItems }) => (
                      <div key={tmplId} className="flex flex-col gap-1.5">
                        {/* Section header */}
                        <div className="flex items-center gap-2 px-1 py-1.5">
                          <div className="w-1 h-4 rounded-full flex-shrink-0" style={{ background: ACCENT }} />
                          <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>{tmplName}</p>
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold"
                            style={{ background: ACCENT_LIGHT, color: ACCENT }}>
                            {groupItems.length}
                          </span>
                        </div>

                        {/* Item cards */}
                        {groupItems.map((item, idx) => {
                          const statusKey = (item.status ?? "").toLowerCase();
                          const s = ITEM_STATUS_MAP[statusKey] || ITEM_STATUS_MAP.not_applicable;
                          const label = item.health_and_safety_audit_checklist_item_template?.label ?? item.label ?? item.name ?? `Item #${idx + 1}`;
                          const positionNum = item.health_and_safety_audit_checklist_item_template?.position ?? idx + 1;
                          return (
                            <div key={item.id ?? idx}
                              className="flex items-start gap-3 rounded-xl px-4 py-3.5"
                              style={{
                                background: "var(--bg-raised)",
                                border: `1px solid var(--border)`,
                                borderLeft: `3px solid ${s.border}`,
                              }}>
                              {/* Position badge */}
                              <span className="text-[10px] font-bold flex-shrink-0 w-5 h-5 rounded flex items-center justify-center mt-0.5"
                                style={{ background: `${s.border}18`, color: s.color }}>
                                {positionNum}
                              </span>
                              {/* Content */}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold leading-snug" style={{ color: "var(--text)" }}>{label}</p>
                                {item.comment && (
                                  <p className="text-xs mt-1 leading-relaxed" style={{ color: "var(--text-muted)" }}>{item.comment}</p>
                                )}
                              </div>
                              {/* Status pill */}
                              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold flex-shrink-0 mt-0.5"
                                style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}30` }}>
                                {s.icon}
                                {s.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          )}
        </div>

        {/* ── Audit note footer ── */}
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

// ─── Detail Drawer ─────────────────────────────────────────────────────────────

function DetailDrawer({ isOpen, onClose, report, auditId, onStartInspection, canPerform }) {
  const [detailPerform, setDetailPerform] = useState(null);

  useEffect(() => {
    if (!isOpen) setDetailPerform(null);
  }, [isOpen]);

  if (!isOpen || !report) return null;

  const auditors    = report.auditors || [];
  const performed   = report.performed_workplace_inspection_reports || [];
  const totalIssues = performed.reduce((n, p) => n + (p.performed_workplace_inspection_report_issues?.length || 0), 0);

  return createPortal(
    <>
      <div className="fixed inset-0" style={{ zIndex: 9990 }}
        onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>

        {/* Backdrop */}
        <div className="absolute inset-0"
          style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(3px)" }}
          onClick={onClose} />

        {/* Drawer panel */}
        <div className="absolute top-0 right-0 bottom-0 w-full max-w-xl flex flex-col overflow-hidden"
          style={{ background: "var(--bg-surface)", boxShadow: "-16px 0 48px rgba(0,0,0,0.2), 0 0 0 1px var(--border)" }}>

          {/* ── Gradient header ── */}
          <div className="flex-shrink-0 px-6 py-7 relative overflow-hidden"
            style={{ background: `linear-gradient(140deg, ${ACCENT} 0%, #b45309 50%, #92400e 100%)` }}>
            {/* Decorative bg elements */}
            <div className="absolute inset-0 pointer-events-none"
              style={{ backgroundImage: "radial-gradient(ellipse at 80% 20%, rgba(255,255,255,0.13) 0%, transparent 55%)" }} />
            <div className="absolute -bottom-12 -right-12 w-48 h-48 rounded-full pointer-events-none"
              style={{ background: "rgba(0,0,0,0.07)" }} />
            <div className="absolute top-6 right-20 w-12 h-12 rounded-full pointer-events-none"
              style={{ background: "rgba(255,255,255,0.06)" }} />

            {/* Close button */}
            <button onClick={onClose}
              className="absolute top-4 right-4 p-1.5 rounded-xl hover:opacity-80 transition-opacity"
              style={{ background: "rgba(255,255,255,0.15)", color: "#fff", border: "1px solid rgba(255,255,255,0.2)" }}>
              <XMarkIcon className="h-5 w-5" />
            </button>

            {/* Identity */}
            <div className="flex items-start gap-4 pr-8">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{
                  background: "rgba(255,255,255,0.18)",
                  boxShadow: "0 0 0 4px rgba(255,255,255,0.08), inset 0 1px 2px rgba(255,255,255,0.15)",
                }}>
                <ClipboardDocumentCheckIcon className="h-8 w-8 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white/65 text-[11px] font-bold uppercase tracking-widest mb-0.5">
                  WIR · Workplace Inspection
                </p>
                <h2 className="text-white text-xl font-bold leading-tight tracking-tight">
                  {report.audit_number}
                </h2>
                {report.area_audited && (
                  <p className="text-white/70 text-sm mt-1 truncate">{report.area_audited}</p>
                )}
                <div className="mt-2.5 flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-bold"
                    style={{ background: "rgba(255,255,255,0.18)", color: "#fff" }}>
                    {STATUS_STYLES[report.status]?.label || report.status}
                  </span>
                  {report.date && (
                    <span className="text-white/55 text-[11px]">{formatDate(report.date)}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Stats strip */}
            <div className="mt-5 grid grid-cols-3 gap-2">
              {[
                { label: "Auditors",    value: auditors.length,  Icon: UsersIcon },
                { label: "Audits",      value: performed.length, Icon: ClipboardDocumentCheckIcon },
                { label: "Issues",      value: totalIssues,      Icon: ExclamationTriangleIcon },
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

          {/* ── Scrollable body ── */}
          <div className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-7">

            {/* Section: Report Details */}
            <section>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-0.5 h-4 rounded-full" style={{ background: ACCENT }} />
                <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                  Report Details
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "Date",   value: formatDate(report.date) },
                  { label: "Status", value: <StatusBadge status={report.status} /> },
                ].map(({ label, value }) => (
                  <div key={label} className="rounded-2xl px-4 py-3"
                    style={{ background: "var(--bg-raised)", border: "1px solid var(--border)" }}>
                    <p className="text-[10px] font-semibold uppercase tracking-wide mb-1.5"
                      style={{ color: "var(--text-muted)" }}>{label}</p>
                    <div className="text-sm font-semibold" style={{ color: "var(--text)" }}>{value}</div>
                  </div>
                ))}
              </div>
            </section>

            {/* Section: Assigned Auditors */}
            <section>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-0.5 h-4 rounded-full" style={{ background: ACCENT }} />
                <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                  Assigned Auditors
                </p>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold"
                  style={{ background: ACCENT_LIGHT, color: ACCENT }}>{auditors.length}</span>
              </div>
              {auditors.length === 0 ? (
                <div className="flex items-center gap-3 rounded-2xl px-4 py-4"
                  style={{ background: "var(--bg-raised)", border: "1px dashed var(--border)" }}>
                  <UsersIcon className="h-5 w-5 flex-shrink-0" style={{ color: "var(--text-muted)", opacity: 0.4 }} />
                  <p className="text-sm" style={{ color: "var(--text-muted)" }}>No auditors assigned yet.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {auditors.map((a) => (
                    <div key={a.id} className="flex items-center gap-3 rounded-2xl px-4 py-3"
                      style={{ background: "var(--bg-raised)", border: "1px solid var(--border)" }}>
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                        style={{
                          background: `linear-gradient(135deg, ${ACCENT} 0%, #b45309 100%)`,
                          boxShadow: `0 2px 8px rgba(217,119,6,0.3)`,
                        }}>
                        {(a.firstname?.[0] || a.first_name?.[0] || a.email?.[0] || "A").toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold leading-tight" style={{ color: "var(--text)" }}>{displayName(a)}</p>
                        <p className="text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>{a.employee_id || a.email || "Auditor"}</p>
                      </div>
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: ACCENT }} />
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Section: Audit Log */}
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
                  <button onClick={onStartInspection}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold hover:opacity-90 transition-opacity"
                    style={{ background: ACCENT, color: "#fff", boxShadow: `0 2px 10px rgba(217,119,6,0.4)` }}>
                    <PlayIcon className="h-3.5 w-3.5" /> Start Audit
                  </button>
                )}
              </div>

              {performed.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 rounded-2xl"
                  style={{ background: "var(--bg-raised)", border: "1px dashed var(--border)" }}>
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3"
                    style={{ background: ACCENT_LIGHT }}>
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
                /* Timeline layout */
                <div className="relative">
                  <div className="absolute top-5 bottom-5 pointer-events-none"
                    style={{ left: 19, width: 2, background: `linear-gradient(to bottom, ${ACCENT}50, transparent)`, borderRadius: 2 }} />

                  <div className="flex flex-col gap-3">
                    {performed.map((p, idx) => {
                      const issueCount = p.performed_workplace_inspection_report_issues?.length || 0;
                      return (
                        <div key={p.id} className="flex items-start gap-3">
                          {/* Timeline dot */}
                          <div className="flex-shrink-0 mt-[18px] z-10">
                            <div className="w-2.5 h-2.5 rounded-full"
                              style={{
                                marginLeft: 15,
                                background: issueCount > 0 ? "#ef4444" : ACCENT,
                                boxShadow: `0 0 0 3px ${issueCount > 0 ? "rgba(239,68,68,.18)" : ACCENT_LIGHT}`,
                              }} />
                          </div>

                          {/* Card */}
                          <div className="flex-1 rounded-2xl p-4 cursor-pointer"
                            style={{ background: "var(--bg-raised)", border: "1px solid var(--border)", transition: "border-color 0.15s, box-shadow 0.15s" }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.borderColor = ACCENT;
                              e.currentTarget.style.boxShadow = `0 4px 16px rgba(217,119,6,0.1)`;
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.borderColor = "var(--border)";
                              e.currentTarget.style.boxShadow = "none";
                            }}
                            onClick={() => setDetailPerform(p)}>
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>
                                    {formatDate(p.audit_date || p.created_at)}
                                  </p>
                                  <span className="text-[10px] px-1.5 py-0.5 rounded font-mono"
                                    style={{ background: "var(--bg)", color: "var(--text-muted)", border: "1px solid var(--border)" }}>
                                    #{performed.length - idx}
                                  </span>
                                </div>
                                <p className="text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>
                                  by {displayName(p.auditor)}
                                </p>
                                {p.audit_note && (
                                  <p className="text-[11px] mt-1.5 truncate" style={{ color: "var(--text-muted)" }}>
                                    {p.audit_note}
                                  </p>
                                )}
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <span className="text-[11px] px-2.5 py-1 rounded-full font-semibold whitespace-nowrap"
                                  style={{
                                    background: issueCount > 0 ? "rgba(239,68,68,.1)" : ACCENT_LIGHT,
                                    color: issueCount > 0 ? "#ef4444" : ACCENT,
                                  }}>
                                  {issueCount} issue{issueCount !== 1 ? "s" : ""}
                                </span>
                                <ChevronRightIcon className="h-4 w-4" style={{ color: "var(--text-muted)" }} />
                              </div>
                            </div>
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

// ─── Action Menu ───────────────────────────────────────────────────────────────

function ActionMenu({ report, onView, onEdit, onDelete, onPerform, onReassign }) {
  const [open, setOpen]   = useState(false);
  const [pos,  setPos]    = useState({ top: 0, right: 0 });
  const triggerRef        = useRef(null);
  const menuRef           = useRef(null);
  const { hasPermission } = useAuth();
  const canEdit    = hasPermission("workplace_inspection_reports.update");
  const canDelete  = hasPermission("workplace_inspection_reports.destroy");
  const canPerform = hasPermission("workplace_inspection_reports.perform");
  const canReassign = hasPermission("workplace_inspection_reports.reassign_auditors");

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
    { label: "View Details", icon: <EyeIcon className="h-4 w-4" />, action: onView, show: true },
    { label: "Start Audit",        icon: <ClipboardDocumentCheckIcon className="h-4 w-4" />, action: onPerform, show: canPerform  },
    { label: "Edit",               icon: <PencilSquareIcon className="h-4 w-4" />,            action: onEdit,    show: canEdit     },
    { label: "Reassign Auditors",  icon: <UsersIcon className="h-4 w-4" />,                   action: onReassign,show: canReassign },
    { label: "Delete", icon: <TrashIcon className="h-4 w-4" />, action: onDelete, danger: true, show: canDelete  },
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

// ─── WIR Page ─────────────────────────────────────────────────────────────────

export default function WirPage() {
  const dispatch       = useAppDispatch();
  const { hasPermission } = useAuth();
  const canUpdate     = hasPermission("workplace_inspection_reports.update");
  const canCreate     = hasPermission("workplace_inspection_reports.create");
  const canPerform    = hasPermission("workplace_inspection_reports.perform");

  const catalog        = useAppSelector(selectWirCatalog);
  const catalogLoading = useAppSelector(selectWirCatalogLoading);
  const reports        = useAppSelector(selectWirReports);
  const meta           = useAppSelector(selectWirReportsMeta);
  const reportsLoading = useAppSelector(selectWirReportsLoading);
  const filters        = useAppSelector(selectWirFilters);
  const actionLoading  = useAppSelector(selectWirActionLoading);
  const catalogAudit   = catalog.find((a) => a.title === WIR_AUDIT_TITLE) ?? null;

  const [auditId, setAuditId]               = useState(null);
  const [drawerReport, setDrawerReport]     = useState(null);
  const [setupOpen, setSetupOpen]           = useState(false);
  const [editTarget, setEditTarget]         = useState(null);
  const [performTarget, setPerformTarget]   = useState(null);
  const [reassignTarget, setReassignTarget] = useState(null);
  const [deleteTarget, setDeleteTarget]     = useState(null);
  const [templateOpen, setTemplateOpen]     = useState(false);

  // Debounced audit_number search
  const [auditNumberInput, setAuditNumberInput] = useState(filters.audit_number || "");
  useEffect(() => {
    const t = setTimeout(() => dispatch(setWirAuditNumber(auditNumberInput)), 400);
    return () => clearTimeout(t);
  }, [auditNumberInput, dispatch]);

  useEffect(() => { dispatch(fetchWirCatalog()); }, [dispatch]);

  useEffect(() => {
    if (catalog.length > 0) {
      const found = catalog.find((a) => a.title === WIR_AUDIT_TITLE);
      setAuditId(found?.id ?? null);
    }
  }, [catalog]);

  useEffect(() => {
    if (auditId) {
      dispatch(fetchWirTemplates(auditId));
      dispatch(fetchWirReports(auditId));
    }
  }, [auditId, dispatch]);

  function handleDeleteConfirm(report) { setDeleteTarget(report); }

  async function handleDelete() {
    if (!deleteTarget) return;
    const res = await dispatch(deleteWirReport({ auditId, id: deleteTarget.id }));
    if (deleteWirReport.fulfilled.match(res)) {
      toast.success("Report deleted.");
      setDeleteTarget(null);
      if (drawerReport?.id === deleteTarget.id) setDrawerReport(null);
      dispatch(fetchWirReports(auditId));
    } else {
      toast.error(res.payload || "Failed to delete report.");
    }
  }

  const filtersActive = !!(filters.audit_number || filters.area_audited || filters.date || filters.status);

  const COLS = ["#", "Audit No.", "Area Audited", "Date", "Auditors", "Status", "Performed", ""];

  if (catalogLoading) return (
    <div className="flex items-center justify-center h-64"><Spinner size={8} /></div>
  );
  if (!auditId) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <ClipboardDocumentCheckIcon className="h-12 w-12" style={{ color: "var(--text-muted)" }} />
      <p className="text-sm" style={{ color: "var(--text-muted)" }}>
        Workplace Inspection Report module not configured.
      </p>
    </div>
  );

  return (
    <div className="space-y-6 pb-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: ACCENT_LIGHT }}>
              <ClipboardDocumentCheckIcon className="h-5 w-5" style={{ color: ACCENT }} />
            </div>
            <div>
              <h1 className="text-xl font-bold" style={{ color: "var(--text)" }}>
                {catalogAudit?.title || "Workplace Inspection Report"}
              </h1>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                {catalogAudit?.description || "Manage and track workplace inspection activities."}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {(canUpdate || canCreate) && (
            <>
              {canUpdate && (
                <button onClick={() => setTemplateOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-80"
                  style={{ background: "var(--bg-raised)", border: "1px solid var(--border)", color: "var(--text)" }}>
                  <Squares2X2Icon className="h-4 w-4" /> Templates
                </button>
              )}
              {canCreate && (
                <button onClick={() => { setEditTarget(null); setSetupOpen(true); }}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90"
                  style={{ background: ACCENT, color: "#fff" }}>
                  <PlusIcon className="h-4 w-4" /> New Report
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="ui-card p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none"
              style={{ color: "var(--text-muted)" }} />
            <input value={auditNumberInput}
              onChange={(e) => setAuditNumberInput(e.target.value)}
              placeholder="Search audit no…"
              className="ui-input text-sm pl-9 w-48" />
          </div>
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none"
              style={{ color: "var(--text-muted)" }} />
            <input value={filters.area_audited || ""}
              onChange={(e) => dispatch(setWirAreaAudited(e.target.value))}
              placeholder="Filter by area…"
              className="ui-input text-sm pl-9 w-44" />
          </div>
          <div className="relative">
            <CalendarDaysIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none"
              style={{ color: "var(--text-muted)" }} />
            <input type="date" value={filters.date || ""}
              onChange={(e) => dispatch(setWirDateFilter(e.target.value))}
              className="ui-input text-sm pl-9 w-44" />
          </div>
          <select value={filters.status || ""} onChange={(e) => dispatch(setWirStatusFilter(e.target.value))}
            className="ui-input text-sm w-36">
            <option value="">All Statuses</option>
            {WIR_STATUSES.map((s) => (
              <option key={s} value={s}>{STATUS_STYLES[s]?.label || s}</option>
            ))}
          </select>
          {filtersActive && (
            <button onClick={() => { dispatch(clearWirFilters()); setAuditNumberInput(""); }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold hover:opacity-80"
              style={{ background: "rgba(239,68,68,.1)", color: "#ef4444" }}>
              <XMarkIcon className="h-3.5 w-3.5" /> Clear
            </button>
          )}
          <button onClick={() => { if (auditId) dispatch(fetchWirReports(auditId)); }}
            className="p-2 rounded-lg hover:opacity-80 ml-auto"
            style={{ background: "var(--bg-raised)", border: "1px solid var(--border)" }}>
            <ArrowPathIcon className="h-4 w-4" style={{ color: "var(--text-muted)" }} />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="ui-card overflow-hidden" style={{ padding: 0 }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                {COLS.map((col) => (
                  <th key={col} className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider whitespace-nowrap"
                    style={{ background: "var(--bg-raised)", color: "var(--text-muted)" }}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {reportsLoading
                ? <TableSkeleton cols={COLS.length} rows={6} />
                : reports.length === 0
                  ? (
                    <tr>
                      <td colSpan={COLS.length} className="text-center py-12 text-sm" style={{ color: "var(--text-muted)" }}>
                        No reports found.
                      </td>
                    </tr>
                  )
                  : reports.map((r, idx) => {
                    const offset = ((meta?.current_page || 1) - 1) * (meta?.per_page || 20);
                    const auditors = r.auditors || [];
                    return (
                      <tr key={r.id} onClick={() => setDrawerReport(r)}
                        className="cursor-pointer hover:opacity-90 transition-all"
                        style={{ background: idx % 2 === 0 ? "var(--bg-surface)" : "var(--bg-raised)", borderBottom: "1px solid var(--border)" }}>
                        <td className="px-4 py-3 text-xs" style={{ color: "var(--text-muted)" }}>{offset + idx + 1}</td>
                        <td className="px-4 py-3 font-semibold" style={{ color: "var(--text)" }}>#{r.audit_number}</td>
                        <td className="px-4 py-3 max-w-[150px] truncate" style={{ color: "var(--text)" }}>{r.area_audited || "—"}</td>
                        <td className="px-4 py-3 text-xs whitespace-nowrap" style={{ color: "var(--text-muted)" }}>{formatDate(r.date)}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1 flex-wrap">
                            {auditors.slice(0, 3).map((a) => (
                              <span key={a.id} className="text-[11px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap"
                                style={{ background: ACCENT_LIGHT, color: ACCENT }}>
                                {a.firstname || a.first_name || "—"}
                              </span>
                            ))}
                            {auditors.length > 3 && (
                              <span className="text-[11px] font-semibold px-1.5 py-0.5 rounded-full"
                                style={{ background: "var(--bg-raised)", color: "var(--text-muted)", border: "1px solid var(--border)" }}>
                                +{auditors.length - 3}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                        <td className="px-4 py-3">
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                            style={{ background: ACCENT_LIGHT, color: ACCENT }}>
                            {(r.performed_workplace_inspection_reports || []).length}
                          </span>
                        </td>
                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                          <ActionMenu
                            report={r}
                            onView={() => setDrawerReport(r)}
                            onEdit={() => { setEditTarget(r); setSetupOpen(true); }}
                            onDelete={() => handleDeleteConfirm(r)}
                            onPerform={() => setPerformTarget(r)}
                            onReassign={() => setReassignTarget(r)}
                          />
                        </td>
                      </tr>
                    );
                  })
              }
            </tbody>
          </table>
        </div>

        {/* Pagination inside the card */}
        {meta && meta.total_pages > 1 && (
          <div className="px-4 py-3" style={{ borderTop: "1px solid var(--border)" }}>
            <Pagination meta={meta} onPage={(p) => { dispatch(setWirPage(p)); dispatch(fetchWirReports(auditId)); }} />
          </div>
        )}
      </div>

      {/* Modals */}
      <SetupModal
        isOpen={setupOpen} onClose={() => { setSetupOpen(false); setEditTarget(null); }}
        auditId={auditId} report={editTarget}
      />
      <TemplateManagerModal
        isOpen={templateOpen} onClose={() => setTemplateOpen(false)} auditId={auditId}
      />
      <PerformModal
        isOpen={!!performTarget} onClose={() => setPerformTarget(null)}
        report={performTarget} auditId={auditId}
      />
      <ReassignModal
        isOpen={!!reassignTarget} onClose={() => setReassignTarget(null)}
        report={reassignTarget} auditId={auditId}
      />
      <DeleteConfirmModal
        isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete} loading={actionLoading}
        title="Delete Report"
        message={`Delete report #${deleteTarget?.audit_number}? This cannot be undone.`}
      />

      {/* Detail Drawer */}
      <DetailDrawer
        isOpen={!!drawerReport}
        onClose={() => setDrawerReport(null)}
        report={drawerReport}
        auditId={auditId}
        canPerform={!!canPerform}
        onStartInspection={() => { setPerformTarget(drawerReport); setDrawerReport(null); }}
      />
    </div>
  );
}
