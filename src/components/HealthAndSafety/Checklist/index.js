/**
 * Health & Safety Audit — Checklist Module
 *
 * Production-ready implementation with:
 *  - Redux Toolkit state management
 *  - Full API coverage (setup, perform, issues lifecycle)
 *  - Multi-step create/edit modal with auditor assignment
 *  - Template manager (create/edit/delete templates & items)
 *  - Perform audit modal (dynamic template tabs + issues)
 *  - Issue lifecycle modal (corrective action / priority / contractor / execute)
 *  - Detail drawer with gradient header
 *  - Professional notifications (react-hot-toast)
 *  - Permission-gated actions
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
  Cog6ToothIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  PaperClipIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CalendarDaysIcon,
  CheckBadgeIcon,
  WrenchScrewdriverIcon,
  BellAlertIcon,
} from "@heroicons/react/24/outline";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import {
  fetchHsaCatalog,
  fetchHsaTemplates,
  fetchHsaChecklists,
  createHsaChecklist,
  updateHsaChecklist,
  deleteHsaChecklist,
  reassignHsaAuditors,
  performHsaChecklist,
  fetchHsaIssues,
  updateHsaCorrectiveAction,
  updateHsaPriorityDueDate,
  assignHsaContractor,
  executeHsaIssue,
  createHsaTemplate,
  updateHsaTemplate,
  deleteHsaTemplate,
  setHsaPage,
  setHsaAuditorNumber,
  setHsaAreaAudited,
  setHsaDateFilter,
  setHsaStatusFilter,
  clearHsaFilters,
  clearHsaActionError,
  selectHsaCatalog,
  selectHsaCatalogLoading,
  selectHsaTemplates,
  selectHsaChecklists,
  selectHsaChecklistsMeta,
  selectHsaChecklistsLoading,
  selectHsaActionLoading,
  selectHsaActionError,
  selectHsaFilters,
  selectHsaIssuesByPerformed,
} from "../../../store/slices/hsaChecklistSlice";
import useAuth from "../../../hooks/useAuth";
import UsersService from "../../../services/users.service";
import { HsaTemplateItemService, HsaParentService } from "../../../services/healthAndSafetyAudit.service";

// ─── Constants ──────────────────────────────────────────────────────────────

const CHECKLIST_AUDIT_TITLE = "Checklist"; // seeded parent HSA record title
const ACCENT = "#10b981";
const ACCENT_LIGHT = "rgba(16,185,129,0.12)";

const STATUS_STYLES = {
  active:      { bg: "rgba(16,185,129,.12)",  color: "#10b981",  label: "Active" },
  in_progress: { bg: "rgba(245,158,11,.12)",  color: "#f59e0b",  label: "In Progress" },
  completed:   { bg: "rgba(59,130,246,.12)",  color: "#3b82f6",  label: "Completed" },
  closed:      { bg: "rgba(107,114,128,.12)", color: "#6b7280",  label: "Closed" },
};

const PRIORITY_STYLES = {
  low:      { bg: "rgba(16,185,129,.12)",  color: "#10b981",  label: "Low" },
  medium:   { bg: "rgba(245,158,11,.12)",  color: "#f59e0b",  label: "Medium" },
  high:     { bg: "rgba(249,115,22,.12)",  color: "#f97316",  label: "High" },
  critical: { bg: "rgba(239,68,68,.12)",   color: "#ef4444",  label: "Critical" },
};

const CHECKLIST_STATUSES = ["active", "in_progress", "completed", "closed"];
const PERFORM_STATUSES   = ["compliant", "non_compliant", "not_applicable"];
const PRIORITY_LEVELS    = ["low", "medium", "high", "critical"];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function displayName(u) {
  if (!u) return "—";
  const first = u.firstname || u.first_name || "";
  const last  = u.lastname  || u.last_name  || "";
  const full  = [first, last].filter(Boolean).join(" ");
  return full || u.email || u.employee_id || "—";
}

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function StatusBadge({ status }) {
  const s = STATUS_STYLES[status] || { bg: "rgba(107,114,128,.12)", color: "#6b7280", label: status };
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold"
      style={{ background: s.bg, color: s.color }}>
      {s.label}
    </span>
  );
}

function PriorityBadge({ priority }) {
  const p = PRIORITY_STYLES[priority] || { bg: "rgba(107,114,128,.12)", color: "#6b7280", label: priority };
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold"
      style={{ background: p.bg, color: p.color }}>
      {p.label}
    </span>
  );
}



function Spinner({ size = 5 }) {
  return (
    <div className="animate-spin rounded-full"
      style={{ width: size * 4, height: size * 4, border: "3px solid var(--border)", borderTopColor: ACCENT }} />
  );
}

function Field({ label, required, error, hint, children }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
        {label}{required && <span style={{ color: "var(--danger)" }}> *</span>}
      </label>
      {children}
      {hint && !error && <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>{hint}</p>}
      {error && <p className="text-[11px]" style={{ color: "var(--danger)" }}>{error}</p>}
    </div>
  );
}

function ModalShell({ isOpen, onClose, title, width = "max-w-lg", children, accent = ACCENT }) {
  if (!isOpen) return null;
  return createPortal(
    <div className="fixed inset-0 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.55)", zIndex: 9999 }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={"ui-card w-full " + width + " flex flex-col"}
        style={{ padding: 0, maxHeight: "90vh", overflow: "hidden", zIndex: 10000 }}>
        <div className="flex items-center justify-between px-6 py-4 flex-shrink-0"
          style={{ borderBottom: "1px solid var(--border)" }}>
          <h2 className="font-bold text-sm" style={{ color: "var(--text)" }}>{title}</h2>
          <button onClick={onClose} className="p-1 rounded hover:opacity-70" style={{ color: "var(--text-muted)" }}>
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
        <div className="overflow-y-auto flex-1">{children}</div>
      </div>
    </div>,
    document.body
  );
}

function StepIndicator({ steps, current, completed }) {
  return (
    <div className="flex items-center gap-0 px-6 py-4 flex-shrink-0"
      style={{ borderBottom: "1px solid var(--border)" }}>
      {steps.map((label, idx) => {
        const num = idx + 1;
        const isDone = completed.includes(num);
        const isActive = current === num;
        return (
          <div key={num} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors"
                style={{
                  background: isDone ? ACCENT : isActive ? ACCENT_LIGHT : "var(--bg-raised)",
                  color: isDone ? "#fff" : isActive ? ACCENT : "var(--text-muted)",
                  border: isActive ? `2px solid ${ACCENT}` : isDone ? "none" : "2px solid var(--border)",
                }}>
                {isDone ? <CheckBadgeIcon className="h-4 w-4" /> : num}
              </div>
              <span className="text-[10px] font-semibold whitespace-nowrap"
                style={{ color: isActive ? ACCENT : isDone ? ACCENT : "var(--text-muted)" }}>
                {label}
              </span>
            </div>
            {idx < steps.length - 1 && (
              <div className="flex-1 h-px mx-2 mt-[-10px]"
                style={{ background: completed.includes(num) ? ACCENT : "var(--border)" }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function Pagination({ meta, onPage }) {
  if (!meta || meta.total_pages <= 1) return null;
  const { page, total_pages, total, per_page } = meta;
  const from = (page - 1) * per_page + 1;
  const to = Math.min(page * per_page, total);
  return (
    <div className="flex items-center justify-between px-4 py-3 text-sm"
      style={{ borderTop: "1px solid var(--border)", color: "var(--text-muted)" }}>
      <span>{from}–{to} of {total}</span>
      <div className="flex items-center gap-1">
        <button disabled={page === 1} onClick={() => onPage(page - 1)}
          className="px-2 py-1 rounded text-xs hover:opacity-80 disabled:opacity-30"
          style={{ background: "var(--bg-raised)", border: "1px solid var(--border)" }}>
          ‹ Prev
        </button>
        <span className="px-3 py-1 text-xs rounded"
          style={{ background: "var(--bg-raised)", border: "1px solid var(--border)", color: "var(--text)" }}>
          {page} / {total_pages}
        </span>
        <button disabled={page === total_pages} onClick={() => onPage(page + 1)}
          className="px-2 py-1 rounded text-xs hover:opacity-80 disabled:opacity-30"
          style={{ background: "var(--bg-raised)", border: "1px solid var(--border)" }}>
          Next ›
        </button>
      </div>
    </div>
  );
}

function TableSkeleton({ cols = 8, rows = 5 }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, ri) => (
        <tr key={ri}>
          {Array.from({ length: cols }).map((__, ci) => (
            <td key={ci} className="px-4 py-3">
              <div className="h-4 rounded animate-pulse" style={{ background: "var(--bg-raised)" }} />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

// ─── User / Auditor Picker ────────────────────────────────────────────────────

function AuditorPicker({ selected, onToggle, label = "Assign Auditors" }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const timer = useRef(null);

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
          const data = Array.isArray(body.data) ? body.data
            : Array.isArray(body) ? body : [];
          setResults(data);
        })
        .catch(() => {})
        .finally(() => setSearching(false));
    }, 350);
  }, [query]);

  const selectedIds = selected.map((u) => u.id);

  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>{label}</label>
      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4"
          style={{ color: "var(--text-muted)" }} />
        <input value={query} onChange={(e) => setQuery(e.target.value)}
          placeholder="Search auditors by name or ID…"
          className="ui-input text-sm pl-9 w-full" />
        {searching && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Spinner size={3} />
          </div>
        )}
      </div>
      {results.length > 0 && (
        <div className="rounded-lg overflow-hidden max-h-40 overflow-y-auto"
          style={{ border: "1px solid var(--border)", background: "var(--bg-raised)" }}>
          {results.map((u) => {
            const checked = selectedIds.includes(u.id);
            return (
              <button key={u.id} type="button" onClick={() => onToggle(u)}
                className="w-full flex items-center gap-3 px-3 py-2 text-left hover:opacity-80 transition-opacity"
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
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
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
          const data = Array.isArray(body.data) ? body.data
            : Array.isArray(body) ? body : [];
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
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4"
          style={{ color: "var(--text-muted)" }} />
        <input value={query} onChange={(e) => setQuery(e.target.value)}
          placeholder="Search contractors by name or email…"
          className="ui-input text-sm pl-9 w-full" />
        {searching && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Spinner size={3} />
          </div>
        )}
      </div>
      {results.length > 0 && (
        <div className="rounded-lg overflow-hidden max-h-40 overflow-y-auto"
          style={{ border: "1px solid var(--border)", background: "var(--bg-raised)" }}>
          {results.map((u) => (
            <button key={u.id} type="button" onClick={() => { onSelect(u); setQuery(""); setResults([]); }}
              className="w-full flex items-center gap-3 px-3 py-2 text-left hover:opacity-80 transition-opacity"
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
          <h3 className="font-bold text-base mb-1" style={{ color: "var(--text)" }}>Delete Checklist?</h3>
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
            className="flex-1 py-2 rounded-lg text-sm font-semibold hover:opacity-80 transition-opacity"
            style={{ background: "var(--bg-raised)", border: "1px solid var(--border)", color: "var(--text)" }}>
            Keep it
          </button>
          <button onClick={onConfirm} disabled={loading}
            className="flex-1 py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
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

// ─── Reassign Auditors Modal ──────────────────────────────────────────────────

function ReassignModal({ isOpen, onClose, checklist, auditId }) {
  const dispatch = useAppDispatch();
  const actionLoading = useAppSelector(selectHsaActionLoading);
  const [auditors, setAuditors] = useState([]);

  useEffect(() => {
    if (isOpen && checklist) {
      setAuditors(checklist.auditors || []);
    }
  }, [isOpen, checklist]);

  function toggleAuditor(u) {
    setAuditors((prev) =>
      prev.some((a) => a.id === u.id) ? prev.filter((a) => a.id !== u.id) : [...prev, u]
    );
  }

  async function handleSave() {
    if (auditors.length === 0) {
      toast.error("At least one auditor is required.");
      return;
    }
    const result = await dispatch(reassignHsaAuditors({
      auditId,
      id: checklist.id,
      auditorIds: auditors.map((a) => a.id),
    }));
    if (reassignHsaAuditors.fulfilled.match(result)) {
      toast.success("Auditors reassigned.");
      onClose();
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

// ─── Setup Form Modal (Create / Edit) ────────────────────────────────────────

function SetupModal({ isOpen, onClose, checklist, auditId }) {
  const dispatch = useAppDispatch();
  const actionLoading = useAppSelector(selectHsaActionLoading);
  const isEdit = Boolean(checklist);

  const STEPS = ["Basic Info", "Assign Auditors", "Review"];
  const [step, setStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState([]);

  const [form, setForm] = useState({
    auditor_number: "",
    area_audited: "",
    date: "",
    status: "active",
  });
  const [auditors, setAuditors] = useState([]);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!isOpen) return;
    dispatch(clearHsaActionError());
    setStep(1);
    setCompletedSteps([]);
    setErrors({});
    if (checklist) {
      setForm({
        auditor_number: checklist.auditor_number ?? "",
        area_audited:   checklist.area_audited   ?? "",
        date:           checklist.date           ?? "",
        status:         checklist.status         || "active",
      });
      setAuditors(checklist.auditors || []);
    } else {
      setForm({ auditor_number: "", area_audited: "", date: new Date().toISOString().slice(0, 10), status: "active" });
      setAuditors([]);
    }
  }, [isOpen, checklist, dispatch]);

  function set(k, v) { setForm((f) => ({ ...f, [k]: v })); }

  function validateStep(s) {
    const e = {};
    if (s === 1) {
      if (!form.auditor_number.trim()) e.auditor_number = "Auditor number is required.";
      if (!form.area_audited.trim())   e.area_audited   = "Area audited is required.";
      if (!form.date)                  e.date           = "Date is required.";
    }
    if (s === 2) {
      if (auditors.length === 0) e.auditors = "At least one auditor must be assigned.";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function goNext() {
    if (!validateStep(step)) return;
    setCompletedSteps((p) => Array.from(new Set([...p, step])));
    setStep((s) => s + 1);
  }

  function goBack() {
    setErrors({});
    setStep((s) => s - 1);
  }

  function toggleAuditor(u) {
    setAuditors((prev) =>
      prev.some((a) => a.id === u.id) ? prev.filter((a) => a.id !== u.id) : [...prev, u]
    );
    setErrors((e) => ({ ...e, auditors: "" }));
  }

  async function handleSubmit() {
    const payload = {
      auditor_number: form.auditor_number.trim(),
      area_audited:   form.area_audited.trim(),
      date:           form.date,
      status:         form.status,
      auditor_ids:    auditors.map((a) => a.id),
    };
    const action = isEdit
      ? dispatch(updateHsaChecklist({ auditId, id: checklist.id, data: payload }))
      : dispatch(createHsaChecklist({ auditId, data: payload }));
    const result = await action;
    if (createHsaChecklist.fulfilled.match(result) || updateHsaChecklist.fulfilled.match(result)) {
      toast.success(isEdit ? "Checklist updated." : "Checklist created.");
      onClose();
      dispatch(fetchHsaChecklists(auditId));
    } else {
      toast.error(result.payload || "Something went wrong.");
    }
  }

  return (
    <ModalShell isOpen={isOpen} onClose={onClose}
      title={isEdit ? "Edit Checklist" : "New Checklist"}
      width="max-w-xl">
      <StepIndicator steps={STEPS} current={step} completed={completedSteps} />
      <div className="flex-1 overflow-y-auto">
        {/* Step 1 — Basic Info */}
        {step === 1 && (
          <div className="p-6 grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Field label="Auditor Number" required error={errors.auditor_number}>
                <input value={form.auditor_number} onChange={(e) => set("auditor_number", e.target.value)}
                  placeholder="e.g. AUD-2024-001" className="ui-input text-sm" autoFocus />
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
                  {CHECKLIST_STATUSES.map((s) => (
                    <option key={s} value={s}>{STATUS_STYLES[s]?.label || s}</option>
                  ))}
                </select>
              </Field>
            </div>
          </div>
        )}

        {/* Step 2 — Assign Auditors */}
        {step === 2 && (
          <div className="p-6 flex flex-col gap-4">
            <AuditorPicker selected={auditors} onToggle={toggleAuditor} label="Search & assign auditors" />
            {errors.auditors && (
              <p className="text-[11px]" style={{ color: "var(--danger)" }}>{errors.auditors}</p>
            )}
          </div>
        )}

        {/* Step 3 — Review */}
        {step === 3 && (
          <div className="p-6 flex flex-col gap-4">
            <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
              {[
                { label: "Auditor Number", value: form.auditor_number },
                { label: "Area Audited",   value: form.area_audited },
                { label: "Date",           value: formatDate(form.date) },
                { label: "Status",         value: <StatusBadge status={form.status} /> },
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
                    ))
                  }
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
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
              {isEdit ? "Save Changes" : "Create Checklist"}
            </button>
        }
      </div>
    </ModalShell>
  );
}

// ─── Template Manager Modal ───────────────────────────────────────────────────

function TemplateManagerModal({ isOpen, onClose, auditId }) {
  const dispatch = useAppDispatch();
  const templates = useAppSelector(selectHsaTemplates);
  const actionLoading = useAppSelector(selectHsaActionLoading);

  const [activeTemplate, setActiveTemplate] = useState(null);
  const [view, setView] = useState("list"); // list | newTemplate | editTemplate | items

  // Template form
  const [tForm, setTForm] = useState({ name: "", description: "" });
  const [tErrors, setTErrors] = useState({});

  // Item form
  const [items, setItems] = useState([]);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [newItem, setNewItem] = useState({ label: "", code: "", description: "", position: "", active: true });
  const [itemErrors, setItemErrors] = useState({});
  const [editingItem, setEditingItem] = useState(null);
  const [deleteTemplateTarget, setDeleteTemplateTarget] = useState(null);
  const [deletingTemplate, setDeletingTemplate] = useState(false);

  useEffect(() => {
    if (!isOpen) { setView("list"); setActiveTemplate(null); }
  }, [isOpen]);

  function openNewTemplate() { setTForm({ name: "", description: "" }); setTErrors({}); setView("newTemplate"); }
  function openEditTemplate(t) { setTForm({ name: t.name, description: t.description || "" }); setTErrors({}); setActiveTemplate(t); setView("editTemplate"); }

  async function openItems(t) {
    setActiveTemplate(t);
    setView("items");
    setItemsLoading(true);
    try {
      const res = await HsaTemplateItemService.list(auditId, t.id);
      const data = Array.isArray(res.data?.data) ? res.data.data
        : Array.isArray(res.data) ? res.data : [];
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
      ? dispatch(updateHsaTemplate({ auditId, id: activeTemplate.id, data: { name: tForm.name.trim(), description: tForm.description.trim() || undefined } }))
      : dispatch(createHsaTemplate({ auditId, data: { name: tForm.name.trim(), description: tForm.description.trim() || undefined } }));

    const result = await action;
    if (createHsaTemplate.fulfilled.match(result) || updateHsaTemplate.fulfilled.match(result)) {
      toast.success(view === "editTemplate" ? "Template updated." : "Template created.");
      setView("list");
    } else {
      toast.error(result.payload || "Failed.");
    }
  }

  async function handleDeleteTemplate() {
    setDeletingTemplate(true);
    const result = await dispatch(deleteHsaTemplate({ auditId, id: deleteTemplateTarget.id }));
    setDeletingTemplate(false);
    if (deleteHsaTemplate.fulfilled.match(result)) {
      toast.success("Template deleted.");
      setDeleteTemplateTarget(null);
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
      const res = await HsaTemplateItemService.create(auditId, activeTemplate.id, {
        label: newItem.label.trim(),
        code: newItem.code.trim() || undefined,
        description: newItem.description.trim() || undefined,
        position: newItem.position ? Number(newItem.position) : undefined,
        active: newItem.active,
      });
      const created = res.data?.data || res.data || res;
      setItems((p) => [...p, created]);
      setNewItem({ label: "", code: "", description: "", position: "", active: true });
      toast.success("Item added.");
    } catch { toast.error("Failed to add item."); }
  }

  async function handleUpdateItem(item) {
    try {
      const res = await HsaTemplateItemService.update(auditId, activeTemplate.id, item.id, {
        label: editingItem.label.trim(),
        code: editingItem.code?.trim() || undefined,
        description: editingItem.description?.trim() || undefined,
        position: editingItem.position ? Number(editingItem.position) : undefined,
        active: editingItem.active,
      });
      const updated = res.data?.data || res.data || res;
      setItems((p) => p.map((i) => i.id === item.id ? updated : i));
      setEditingItem(null);
      toast.success("Item updated.");
    } catch { toast.error("Failed to update item."); }
  }

  async function handleDeleteItem(item) {
    try {
      await HsaTemplateItemService.remove(auditId, activeTemplate.id, item.id);
      setItems((p) => p.filter((i) => i.id !== item.id));
      toast.success("Item removed.");
    } catch { toast.error("Failed to delete item."); }
  }

  return (
    <>
      <ModalShell isOpen={isOpen} onClose={onClose} title="Manage Checklist Templates" width="max-w-2xl">
        {/* Breadcrumb */}
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
          {/* ── Template List ── */}
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
                      <button onClick={() => openEditTemplate(t)}
                        className="p-1.5 rounded-lg hover:opacity-80"
                        style={{ color: "var(--text-muted)" }}>
                        <PencilSquareIcon className="h-4 w-4" />
                      </button>
                      <button onClick={() => setDeleteTemplateTarget(t)}
                        className="p-1.5 rounded-lg hover:opacity-80"
                        style={{ color: "#ef4444" }}>
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))
              }
            </div>
          )}

          {/* ── New / Edit Template ── */}
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

          {/* ── Template Items ── */}
          {view === "items" && (
            <div className="flex flex-col gap-4">
              {itemsLoading ? (
                <div className="flex justify-center py-8"><Spinner size={6} /></div>
              ) : (
                <>
                  {items.length === 0
                    ? <p className="text-sm text-center py-4" style={{ color: "var(--text-muted)" }}>No items yet.</p>
                    : items.map((item, idx) => (
                      editingItem?.id === item.id ? (
                        <div key={item.id} className="rounded-xl p-4 flex flex-col gap-3"
                          style={{ border: `1px solid ${ACCENT}`, background: ACCENT_LIGHT }}>
                          <Field label="Label" required>
                            <input value={editingItem.label}
                              onChange={(e) => setEditingItem((ei) => ({ ...ei, label: e.target.value }))}
                              className="ui-input text-sm" />
                          </Field>
                          <div className="grid grid-cols-2 gap-3">
                            <Field label="Code">
                              <input value={editingItem.code || ""}
                                onChange={(e) => setEditingItem((ei) => ({ ...ei, code: e.target.value }))}
                                placeholder="e.g. FS-01" className="ui-input text-sm" />
                            </Field>
                            <Field label="Position">
                              <input type="number" min="1" value={editingItem.position || ""}
                                onChange={(e) => setEditingItem((ei) => ({ ...ei, position: e.target.value }))}
                                className="ui-input text-sm" />
                            </Field>
                          </div>
                          <Field label="Description">
                            <input value={editingItem.description || ""}
                              onChange={(e) => setEditingItem((ei) => ({ ...ei, description: e.target.value }))}
                              className="ui-input text-sm" />
                          </Field>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={editingItem.active !== false}
                              onChange={(e) => setEditingItem((ei) => ({ ...ei, active: e.target.checked }))}
                              className="w-4 h-4 rounded" style={{ accentColor: ACCENT }} />
                            <span className="text-xs font-semibold" style={{ color: "var(--text)" }}>Active (appears in audits)</span>
                          </label>
                          <div className="flex gap-2">
                            <button onClick={() => setEditingItem(null)}
                              className="flex-1 py-1.5 rounded-lg text-xs font-semibold hover:opacity-80"
                              style={{ background: "var(--bg-raised)", border: "1px solid var(--border)", color: "var(--text)" }}>
                              Cancel
                            </button>
                            <button onClick={() => handleUpdateItem(item)}
                              className="flex-1 py-1.5 rounded-lg text-xs font-semibold hover:opacity-90"
                              style={{ background: ACCENT, color: "#fff" }}>
                              Save
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div key={item.id} className="flex items-center justify-between rounded-xl px-4 py-3"
                          style={{ background: "var(--bg-raised)", border: "1px solid var(--border)" }}>
                          <div>
                            <p className="text-xs font-semibold" style={{ color: "var(--text)" }}>
                              <span className="mr-2 text-[10px] font-bold rounded px-1.5 py-0.5"
                                style={{ background: ACCENT_LIGHT, color: ACCENT }}>
                                #{item.position ?? idx + 1}
                              </span>
                              {item.label}
                            </p>
                            {item.description && <p className="text-[11px] mt-0.5 ml-7" style={{ color: "var(--text-muted)" }}>{item.description}</p>}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <button onClick={() => setEditingItem({ ...item })}
                              className="p-1.5 rounded-lg hover:opacity-80" style={{ color: "var(--text-muted)" }}>
                              <PencilSquareIcon className="h-3.5 w-3.5" />
                            </button>
                            <button onClick={() => handleDeleteItem(item)}
                              className="p-1.5 rounded-lg hover:opacity-80" style={{ color: "#ef4444" }}>
                              <TrashIcon className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      )
                    ))
                  }

                  {/* Add new item */}
                  <div className="rounded-xl p-4 flex flex-col gap-3"
                    style={{ border: "1px dashed var(--border)", background: "var(--bg-raised)" }}>
                    <p className="text-xs font-bold" style={{ color: ACCENT }}>Add New Item</p>
                    <Field label="Label" required error={itemErrors.label}>
                      <input value={newItem.label} onChange={(e) => { setNewItem((ni) => ({ ...ni, label: e.target.value })); setItemErrors({}); }}
                        placeholder="e.g. Fire extinguisher accessible" className="ui-input text-sm" />
                    </Field>
                    <div className="grid grid-cols-3 gap-3">
                      <Field label="Code">
                        <input value={newItem.code} onChange={(e) => setNewItem((ni) => ({ ...ni, code: e.target.value }))}
                          placeholder="e.g. FS-01" className="ui-input text-sm" />
                      </Field>
                      <Field label="Description">
                        <input value={newItem.description} onChange={(e) => setNewItem((ni) => ({ ...ni, description: e.target.value }))}
                          placeholder="Optional" className="ui-input text-sm" />
                      </Field>
                      <Field label="Position">
                        <input type="number" min="1" value={newItem.position}
                          onChange={(e) => setNewItem((ni) => ({ ...ni, position: e.target.value }))}
                          placeholder="Auto" className="ui-input text-sm" />
                      </Field>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={newItem.active}
                        onChange={(e) => setNewItem((ni) => ({ ...ni, active: e.target.checked }))}
                        className="w-4 h-4 rounded" style={{ accentColor: ACCENT }} />
                      <span className="text-xs font-semibold" style={{ color: "var(--text)" }}>Active (appears in audits)</span>
                    </label>
                    <button onClick={handleAddItem}
                      className="flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold hover:opacity-90"
                      style={{ background: ACCENT, color: "#fff" }}>
                      <PlusIcon className="h-4 w-4" /> Add Item
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </ModalShell>

      {/* Delete Template Confirm */}
      <DeleteConfirmModal
        isOpen={Boolean(deleteTemplateTarget)}
        onClose={() => setDeleteTemplateTarget(null)}
        onConfirm={handleDeleteTemplate}
        loading={deletingTemplate}
        name={deleteTemplateTarget?.name}
      />
    </>
  );
}

// ─── Perform Audit Modal ──────────────────────────────────────────────────────

function PerformModal({ isOpen, onClose, checklist, auditId }) {
  const dispatch = useAppDispatch();
  const templates = useAppSelector(selectHsaTemplates);
  const actionLoading = useAppSelector(selectHsaActionLoading);
  const { user: currentUser } = useAuth();

  const [activeTab, setActiveTab] = useState(0);
  const [form, setForm] = useState({ audit_date: "", audit_note: "" });
  const [errors, setErrors] = useState({});
  // { [templateId]: { [itemId]: { status, comment } } }
  const [results, setResults] = useState({});
  const [issues, setIssues] = useState([{ name: "", priority_level: "medium", due_date: "", file: null }]);
  const [issueErrors, setIssueErrors] = useState([{}]);

  useEffect(() => {
    if (!isOpen) return;
    setActiveTab(0);
    setForm({ audit_date: new Date().toISOString().slice(0, 10), audit_note: "" });
    setErrors({});
    setIssues([{ name: "", priority_level: "medium", due_date: "", file: null }]);
    setIssueErrors([{}]);
    // Init results for templates
    const init = {};
    templates.forEach((tmpl) => {
      init[tmpl.id] = {};
      (tmpl.health_and_safety_audit_checklist_item_templates || []).filter((item) => item.active !== false).forEach((item) => {
        init[tmpl.id][item.id] = { status: "compliant", comment: "" };
      });
    });
    setResults(init);
  }, [isOpen, templates]);

  const tabs = [
    { key: "info", label: "Audit Info" },
    ...templates.map((t) => ({ key: `tmpl_${t.id}`, label: t.name, template: t })),
    { key: "issues", label: "Issues" },
    { key: "summary", label: "Summary" },
  ];

  function setItemResult(templateId, itemId, field, val) {
    setResults((prev) => ({
      ...prev,
      [templateId]: { ...prev[templateId], [itemId]: { ...prev[templateId]?.[itemId], [field]: val } },
    }));
  }

  function addIssue() {
    setIssues((p) => [...p, { name: "", priority_level: "medium", due_date: "", file: null }]);
    setIssueErrors((p) => [...p, {}]);
  }
  function removeIssue(idx) {
    setIssues((p) => p.filter((_, i) => i !== idx));
    setIssueErrors((p) => p.filter((_, i) => i !== idx));
  }
  function updateIssue(idx, key, val) {
    setIssues((p) => p.map((iss, i) => i === idx ? { ...iss, [key]: val } : iss));
    if (key === "name") setIssueErrors((p) => p.map((e, i) => i === idx ? { ...e, name: "" } : e));
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
    if (!validate() || !checklist) return;

    const performedChecklist = templates.flatMap((t) =>
      (t.health_and_safety_audit_checklist_item_templates || []).filter((item) => item.active !== false).map((item) => ({
        id: item.id,
        status: results[t.id]?.[item.id]?.status || "compliant",
        ...(results[t.id]?.[item.id]?.comment ? { comment: results[t.id][item.id].comment } : {}),
      }))
    );

    const issuesPayload = issues
      .filter((iss) => iss.name.trim())
      .map((iss) => ({
        name: iss.name,
        priority_level: iss.priority_level || undefined,
        due_date: iss.due_date || undefined,
        file: iss.file || undefined,
      }));

    const payload = {
      audit_date: form.audit_date,
      audit_note: form.audit_note.trim() || undefined,
      auditor_id: currentUser?.id,
      performedChecklist,
      issues: issuesPayload,
    };

    const result = await dispatch(performHsaChecklist({ auditId, checklistId: checklist.id, payload }));
    if (performHsaChecklist.fulfilled.match(result)) {
      toast.success("Audit performed successfully.");
      dispatch(fetchHsaChecklists(auditId));
      onClose();
    } else {
      toast.error(result.payload || "Failed to perform audit.");
    }
  }

  const PERFORM_STATUS_LABELS = {
    compliant:      "Compliant",
    non_compliant:  "Non-Compliant",
    not_applicable: "N/A",
  };

  return (
    <ModalShell isOpen={isOpen} onClose={onClose} title="Perform Audit" width="max-w-3xl">
      {/* Tab bar */}
      <div className="flex overflow-x-auto flex-shrink-0"
        style={{ borderBottom: "1px solid var(--border)" }}>
        {tabs.map((tab, idx) => (
          <button key={tab.key} onClick={() => setActiveTab(idx)}
            className="px-5 py-3 text-xs font-semibold whitespace-nowrap transition-all border-b-2"
            style={{
              borderBottomColor: activeTab === idx ? ACCENT : "transparent",
              color: activeTab === idx ? ACCENT : "var(--text-muted)",
              background: "transparent",
            }}>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="p-6 overflow-y-auto flex-1">
        {/* ── Audit Info Tab ── */}
        {activeTab === 0 && (
          <div className="grid grid-cols-2 gap-4 max-w-lg">
            <div className="col-span-2">
              <div className="rounded-xl p-4 mb-4" style={{ background: ACCENT_LIGHT, border: `1px solid ${ACCENT}` }}>
                <p className="text-xs font-bold mb-1" style={{ color: ACCENT }}>Audit Details</p>
                <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs">
                  <div><span style={{ color: "var(--text-muted)" }}>Auditor No.: </span><span style={{ color: "var(--text)" }}>{checklist?.auditor_number}</span></div>
                  <div><span style={{ color: "var(--text-muted)" }}>Area: </span><span style={{ color: "var(--text)" }}>{checklist?.area_audited}</span></div>
                  <div><span style={{ color: "var(--text-muted)" }}>Scheduled: </span><span style={{ color: "var(--text)" }}>{formatDate(checklist?.date)}</span></div>
                  <div><span style={{ color: "var(--text-muted)" }}>Auditors: </span><span style={{ color: "var(--text)" }}>{(checklist?.auditors || []).map(displayName).join(", ") || "—"}</span></div>
                </div>
              </div>
            </div>
            <div>
              <Field label="Audit Date" required error={errors.audit_date}>
                <input type="date" value={form.audit_date}
                  onChange={(e) => { setForm((f) => ({ ...f, audit_date: e.target.value })); setErrors({}); }}
                  className="ui-input text-sm" />
              </Field>
            </div>
            <div className="col-span-2">
              <Field label="Audit Note">
                <textarea value={form.audit_note} onChange={(e) => setForm((f) => ({ ...f, audit_note: e.target.value }))}
                  placeholder="General observations or notes…" rows={3} className="ui-input text-sm resize-none" />
              </Field>
            </div>
          </div>
        )}

        {/* ── Template Tabs ── */}
        {tabs.slice(1, -2).map((tab, tIdx) => {
          const tmpl = tab.template;
          if (!tmpl || activeTab !== tIdx + 1) return null;
          const items = (tmpl.health_and_safety_audit_checklist_item_templates || []).filter((item) => item.active !== false);
          return (
            <div key={tmpl.id} className="flex flex-col gap-3">
              {tmpl.description && (
                <p className="text-xs px-1 pb-2" style={{ color: "var(--text-muted)", borderBottom: "1px solid var(--border)" }}>
                  {tmpl.description}
                </p>
              )}
              {items.length === 0
                ? <p className="text-sm text-center py-8" style={{ color: "var(--text-muted)" }}>No items in this template.</p>
                : items.map((item) => {
                  const res = results[tmpl.id]?.[item.id] || { status: "compliant", comment: "" };
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
                                background: res.status === s
                                  ? (s === "compliant" ? ACCENT : s === "non_compliant" ? "#ef4444" : "#6b7280")
                                  : "var(--bg-surface)",
                                color: res.status === s ? "#fff" : "var(--text-muted)",
                                border: `1px solid ${res.status === s ? "transparent" : "var(--border)"}`,
                              }}>
                              {PERFORM_STATUS_LABELS[s]}
                            </button>
                          ))}
                        </div>
                      </div>
                      <input value={res.comment} onChange={(e) => setItemResult(tmpl.id, item.id, "comment", e.target.value)}
                        placeholder="Optional comment…"
                        className="ui-input text-xs" />
                    </div>
                  );
                })
              }
            </div>
          );
        })}

        {/* ── Issues Tab ── */}
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
                    <select value={iss.priority_level} onChange={(e) => updateIssue(idx, "priority_level", e.target.value)}
                      className="ui-input text-sm">
                      {PRIORITY_LEVELS.map((p) => <option key={p} value={p}>{PRIORITY_STYLES[p].label}</option>)}
                    </select>
                  </Field>
                  <Field label="Due Date">
                    <input type="date" value={iss.due_date} onChange={(e) => updateIssue(idx, "due_date", e.target.value)}
                      className="ui-input text-sm" />
                  </Field>
                </div>
                <Field label="Supporting Document">
                  <label className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer hover:opacity-80"
                    style={{ border: "1px dashed var(--border)", background: "var(--bg-surface)" }}>
                    <PaperClipIcon className="h-4 w-4" style={{ color: "var(--text-muted)" }} />
                    <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                      {iss.file ? iss.file.name : "Attach file (optional)"}
                    </span>
                    <input type="file" className="hidden"
                      onChange={(e) => updateIssue(idx, "file", e.target.files[0] || null)} />
                  </label>
                </Field>
              </div>
            ))}
          </div>
        )}

        {/* ── Summary Tab ── */}
        {activeTab === tabs.length - 1 && (
          <div className="flex flex-col gap-4">
            <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
              <div className="px-4 py-3" style={{ background: ACCENT_LIGHT, borderBottom: "1px solid var(--border)" }}>
                <p className="text-xs font-bold" style={{ color: ACCENT }}>Audit Summary</p>
              </div>
              {[
                { label: "Checklist", value: `#${checklist?.auditor_number} — ${checklist?.area_audited}` },
                { label: "Audit Date", value: formatDate(form.audit_date) },
                { label: "Templates", value: `${templates.length} section(s)` },
                { label: "Total Items", value: templates.reduce((n, t) => n + (t.health_and_safety_audit_checklist_item_templates || []).filter((i) => i.active !== false).length, 0) },
                { label: "Issues", value: issues.filter((i) => i.name.trim()).length },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between px-4 py-2.5"
                  style={{ borderBottom: "1px solid var(--border)" }}>
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>{label}</span>
                  <span className="text-sm font-semibold" style={{ color: "var(--text)" }}>{value}</span>
                </div>
              ))}
            </div>
            {form.audit_note && (
              <div className="rounded-xl p-4" style={{ background: "var(--bg-raised)", border: "1px solid var(--border)" }}>
                <p className="text-xs font-semibold mb-1" style={{ color: "var(--text-muted)" }}>Audit Note</p>
                <p className="text-sm" style={{ color: "var(--text)" }}>{form.audit_note}</p>
              </div>
            )}
            <button onClick={handleSubmit} disabled={actionLoading}
              className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold hover:opacity-90 disabled:opacity-60"
              style={{ background: ACCENT, color: "#fff" }}>
              {actionLoading ? <Spinner size={4} /> : <CheckBadgeIcon className="h-5 w-5" />}
              Submit Audit
            </button>
          </div>
        )}
      </div>

      {/* Navigation footer */}
      {activeTab !== tabs.length - 1 && (
        <div className="flex items-center justify-between px-6 py-4 flex-shrink-0"
          style={{ borderTop: "1px solid var(--border)" }}>
          <button onClick={() => setActiveTab((t) => Math.max(0, t - 1))}
            disabled={activeTab === 0}
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

// ─── Issue Manager Modal ──────────────────────────────────────────────────────

function IssueManagerModal({ isOpen, onClose, checklist, auditId }) {
  const dispatch = useAppDispatch();
  const issuesByPerformed = useAppSelector(selectHsaIssuesByPerformed);
  const actionLoading = useAppSelector(selectHsaActionLoading);

  const performed = checklist?.performed_health_and_safety_audit_checklists || [];
  const [selectedPerformed, setSelectedPerformed] = useState(null);
  const [activeIssue, setActiveIssue] = useState(null);
  const [issueTab, setIssueTab] = useState("corrective");

  // Issue filters
  const [issueFilters, setIssueFilters] = useState({ name: "", priority_level: "", due_date: "" });
  const filterTimer = useRef(null);

  // Forms
  const [correctiveAction, setCorrectiveAction] = useState("");
  const [priorityForm, setPriorityForm] = useState({ priority_level: "medium", due_date: "" });
  const [selectedContractor, setSelectedContractor] = useState(null);
  const [executeForm, setExecuteForm] = useState({ completion_date: "", completion_notes: "", file: null });
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    if (!isOpen) { setSelectedPerformed(null); setActiveIssue(null); setIssueFilters({ name: "", priority_level: "", due_date: "" }); }
  }, [isOpen]);

  function loadIssues(performedId, filters = {}) {
    const params = {};
    if (filters.name)           params['filter[name]']           = filters.name;
    if (filters.priority_level) params['filter[priority_level]'] = filters.priority_level;
    if (filters.due_date)       params['filter[due_date]']       = filters.due_date;
    dispatch(fetchHsaIssues({ auditId, performedId, params }));
  }

  useEffect(() => {
    if (selectedPerformed) {
      loadIssues(selectedPerformed.id, issueFilters);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPerformed, auditId]);

  function handleFilterChange(key, val) {
    const next = { ...issueFilters, [key]: val };
    setIssueFilters(next);
    clearTimeout(filterTimer.current);
    filterTimer.current = setTimeout(() => {
      if (selectedPerformed) loadIssues(selectedPerformed.id, next);
    }, 400);
  }

  const issues = selectedPerformed ? (issuesByPerformed[selectedPerformed.id] || []) : [];

  function selectIssue(iss) {
    setActiveIssue(iss);
    setIssueTab("corrective");
    setCorrectiveAction(iss.corrective_action || "");
    setPriorityForm({
      priority_level: iss.priority_level || "medium",
      due_date: iss.due_date || "",
    });
    setSelectedContractor(iss.contractor || null);
    setExecuteForm({ completion_date: "", completion_notes: "", file: null });
    setFormErrors({});
  }

  async function handleUpdateCorrective() {
    if (!correctiveAction.trim()) { setFormErrors({ corrective_action: "Required." }); return; }
    const result = await dispatch(updateHsaCorrectiveAction({
      auditId, performedId: selectedPerformed.id, issueId: activeIssue.id, correctiveAction: correctiveAction.trim(),
    }));
    if (updateHsaCorrectiveAction.fulfilled.match(result)) {
      toast.success("Corrective action updated.");
      setFormErrors({});
    } else {
      toast.error(result.payload || "Failed.");
    }
  }

  async function handleUpdatePriority() {
    if (!priorityForm.priority_level || !priorityForm.due_date) {
      setFormErrors({ priority: "Both priority and due date are required." });
      return;
    }
    const result = await dispatch(updateHsaPriorityDueDate({
      auditId, performedId: selectedPerformed.id, issueId: activeIssue.id, ...priorityForm,
    }));
    if (updateHsaPriorityDueDate.fulfilled.match(result)) {
      toast.success("Priority & due date updated.");
      setFormErrors({});
    } else {
      toast.error(result.payload || "Failed.");
    }
  }

  async function handleAssignContractor() {
    if (!selectedContractor) { setFormErrors({ contractor: "Please select a contractor." }); return; }
    const result = await dispatch(assignHsaContractor({
      auditId, performedId: selectedPerformed.id, issueId: activeIssue.id, contractorId: selectedContractor.id,
    }));
    if (assignHsaContractor.fulfilled.match(result)) {
      toast.success("Contractor assigned.");
      setFormErrors({});
    } else {
      toast.error(result.payload || "Failed.");
    }
  }

  async function handleExecute() {
    if (!executeForm.completion_date) { setFormErrors({ execute: "Completion date is required." }); return; }
    const result = await dispatch(executeHsaIssue({
      auditId, performedId: selectedPerformed.id, issueId: activeIssue.id, data: executeForm,
    }));
    if (executeHsaIssue.fulfilled.match(result)) {
      toast.success("Issue executed and closed.");
      setFormErrors({});
      loadIssues(selectedPerformed.id, issueFilters);
    } else {
      toast.error(result.payload || "Failed.");
    }
  }

  const ISSUE_TABS = [
    { key: "corrective", label: "Corrective Action", icon: WrenchScrewdriverIcon },
    { key: "priority",   label: "Priority & Due Date", icon: BellAlertIcon },
    { key: "contractor", label: "Assign Contractor", icon: UsersIcon },
    { key: "execute",    label: "Execute / Close", icon: CheckCircleIcon },
  ];

  return (
    <ModalShell isOpen={isOpen} onClose={onClose} title="Issue Manager" width="max-w-3xl">
      <div className="flex h-[calc(80vh-64px)] overflow-hidden">
        {/* Left: Performed audits + issues list */}
        <div className="w-72 flex-shrink-0 flex flex-col overflow-hidden"
          style={{ borderRight: "1px solid var(--border)" }}>
          {performed.length === 0 ? (
            <div className="flex flex-col items-center justify-center flex-1 p-4">
              <ClipboardDocumentCheckIcon className="h-10 w-10 mb-2" style={{ color: "var(--text-muted)" }} />
              <p className="text-xs text-center" style={{ color: "var(--text-muted)" }}>No performed audits yet.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-0 overflow-y-auto flex-1">
              <p className="text-[10px] font-bold px-4 py-2 uppercase tracking-wide flex-shrink-0"
                style={{ color: "var(--text-muted)", borderBottom: "1px solid var(--border)" }}>
                Performed Audits
              </p>
              {performed.map((p) => (
                <button key={p.id} onClick={() => setSelectedPerformed(p)}
                  className="text-left px-4 py-3 text-xs hover:opacity-80 transition-all"
                  style={{
                    borderBottom: "1px solid var(--border)",
                    background: selectedPerformed?.id === p.id ? ACCENT_LIGHT : "transparent",
                    color: selectedPerformed?.id === p.id ? ACCENT : "var(--text)",
                  }}>
                  <p className="font-semibold">{formatDate(p.audit_date || p.created_at)}</p>
                  <p className="text-[10px] mt-0.5" style={{ color: "var(--text-muted)" }}>
                    by {displayName(p.auditor)}
                  </p>
                </button>
              ))}
              {selectedPerformed && (
                <>
                  <p className="text-[10px] font-bold px-4 py-2 uppercase tracking-wide mt-1"
                    style={{ color: "var(--text-muted)", borderBottom: "1px solid var(--border)" }}>
                    Issues
                  </p>
                  {/* Issue filters */}
                  <div className="flex flex-col gap-1.5 px-3 py-2 flex-shrink-0"
                    style={{ borderBottom: "1px solid var(--border)" }}>
                    <input
                      value={issueFilters.name}
                      onChange={(e) => handleFilterChange("name", e.target.value)}
                      placeholder="Filter by name…"
                      className="ui-input text-xs py-1 px-2"
                    />
                    <select
                      value={issueFilters.priority_level}
                      onChange={(e) => handleFilterChange("priority_level", e.target.value)}
                      className="ui-input text-xs py-1 px-2">
                      <option value="">All priorities</option>
                      {PRIORITY_LEVELS.map((p) => (
                        <option key={p} value={p}>{PRIORITY_STYLES[p].label}</option>
                      ))}
                    </select>
                    <input
                      type="date"
                      value={issueFilters.due_date}
                      onChange={(e) => handleFilterChange("due_date", e.target.value)}
                      className="ui-input text-xs py-1 px-2"
                    />
                  </div>
                  {issues.length === 0
                    ? <p className="px-4 py-3 text-xs" style={{ color: "var(--text-muted)" }}>No issues recorded.</p>
                    : issues.map((iss) => (
                      <button key={iss.id} onClick={() => selectIssue(iss)}
                        className="text-left px-4 py-3 text-xs hover:opacity-80 transition-all"
                        style={{
                          borderBottom: "1px solid var(--border)",
                          background: activeIssue?.id === iss.id ? ACCENT_LIGHT : "transparent",
                          color: activeIssue?.id === iss.id ? ACCENT : "var(--text)",
                        }}>
                        <p className="font-semibold truncate">{iss.name}</p>
                        <div className="mt-0.5"><PriorityBadge priority={iss.priority_level} /></div>
                      </button>
                    ))
                  }
                </>
              )}
            </div>
          )}
        </div>

        {/* Right: Issue detail / actions */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {!activeIssue ? (
            <div className="flex flex-col items-center justify-center flex-1 p-6">
              <ExclamationTriangleIcon className="h-12 w-12 mb-3" style={{ color: "var(--text-muted)" }} />
              <p className="text-sm font-semibold mb-1" style={{ color: "var(--text)" }}>No issue selected</p>
              <p className="text-xs text-center" style={{ color: "var(--text-muted)" }}>
                Select a performed audit and then an issue from the left panel.
              </p>
            </div>
          ) : (
            <>
              {/* Issue header */}
              <div className="px-5 py-4 flex-shrink-0" style={{ borderBottom: "1px solid var(--border)" }}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold" style={{ color: "var(--text)" }}>{activeIssue.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <PriorityBadge priority={activeIssue.priority_level} />
                      {activeIssue.due_date && (
                        <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                          Due: {formatDate(activeIssue.due_date)}
                        </span>
                      )}
                    </div>
                  </div>
                  {activeIssue.status && (
                    <span className="text-[11px] px-2.5 py-0.5 rounded-full font-semibold"
                      style={{ background: ACCENT_LIGHT, color: ACCENT }}>
                      {activeIssue.status}
                    </span>
                  )}
                </div>
              </div>
              {/* Sub-tabs */}
              <div className="flex overflow-x-auto flex-shrink-0"
                style={{ borderBottom: "1px solid var(--border)" }}>
                {ISSUE_TABS.map((t) => {
                  const Icon = t.icon;
                  return (
                    <button key={t.key} onClick={() => { setIssueTab(t.key); setFormErrors({}); }}
                      className="flex items-center gap-1.5 px-4 py-2.5 text-[11px] font-semibold whitespace-nowrap border-b-2"
                      style={{
                        borderBottomColor: issueTab === t.key ? ACCENT : "transparent",
                        color: issueTab === t.key ? ACCENT : "var(--text-muted)",
                      }}>
                      <Icon className="h-3.5 w-3.5" />{t.label}
                    </button>
                  );
                })}
              </div>
              {/* Tab content */}
              <div className="flex-1 overflow-y-auto p-5">
                {/* Corrective Action */}
                {issueTab === "corrective" && (
                  <div className="flex flex-col gap-4">
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                      Document the corrective action taken or recommended for this issue.
                    </p>
                    <Field label="Corrective Action" required error={formErrors.corrective_action}>
                      <textarea value={correctiveAction} onChange={(e) => { setCorrectiveAction(e.target.value); setFormErrors({}); }}
                        placeholder="Describe the corrective action…" rows={5} className="ui-input text-sm resize-none" />
                    </Field>
                    <button onClick={handleUpdateCorrective} disabled={actionLoading}
                      className="flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold hover:opacity-90 disabled:opacity-60"
                      style={{ background: ACCENT, color: "#fff" }}>
                      {actionLoading ? <Spinner size={3} /> : <CheckBadgeIcon className="h-4 w-4" />}
                      Save Corrective Action
                    </button>
                  </div>
                )}
                {/* Priority & Due Date */}
                {issueTab === "priority" && (
                  <div className="flex flex-col gap-4">
                    <Field label="Priority Level" error={formErrors.priority}>
                      <select value={priorityForm.priority_level}
                        onChange={(e) => { setPriorityForm((f) => ({ ...f, priority_level: e.target.value })); setFormErrors({}); }}
                        className="ui-input text-sm">
                        {PRIORITY_LEVELS.map((p) => <option key={p} value={p}>{PRIORITY_STYLES[p].label}</option>)}
                      </select>
                    </Field>
                    <Field label="Due Date" required error={formErrors.priority}>
                      <input type="date" value={priorityForm.due_date}
                        onChange={(e) => { setPriorityForm((f) => ({ ...f, due_date: e.target.value })); setFormErrors({}); }}
                        className="ui-input text-sm" />
                    </Field>
                    <button onClick={handleUpdatePriority} disabled={actionLoading}
                      className="flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold hover:opacity-90 disabled:opacity-60"
                      style={{ background: ACCENT, color: "#fff" }}>
                      {actionLoading ? <Spinner size={3} /> : <CheckBadgeIcon className="h-4 w-4" />}
                      Update Priority
                    </button>
                  </div>
                )}
                {/* Assign Contractor */}
                {issueTab === "contractor" && (
                  <div className="flex flex-col gap-4">
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                      Search and select the contractor responsible for resolving this issue.
                    </p>
                    {formErrors.contractor && (
                      <p className="text-[11px]" style={{ color: "var(--danger)" }}>{formErrors.contractor}</p>
                    )}
                    <ContractorPicker
                      selected={selectedContractor}
                      onSelect={(u) => { setSelectedContractor(u); setFormErrors({}); }}
                    />
                    <button onClick={handleAssignContractor} disabled={actionLoading}
                      className="flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold hover:opacity-90 disabled:opacity-60"
                      style={{ background: ACCENT, color: "#fff" }}>
                      {actionLoading ? <Spinner size={3} /> : <UsersIcon className="h-4 w-4" />}
                      Assign Contractor
                    </button>
                  </div>
                )}
                {/* Execute */}
                {issueTab === "execute" && (
                  <div className="flex flex-col gap-4">
                    <div className="rounded-xl p-3" style={{ background: "rgba(239,68,68,.06)", border: "1px solid rgba(239,68,68,.2)" }}>
                      <p className="text-xs" style={{ color: "#ef4444" }}>
                        ⚠️ Executing this issue will mark it as closed. This action may be irreversible.
                      </p>
                    </div>
                    <Field label="Completion Date" required error={formErrors.execute}>
                      <input type="date" value={executeForm.completion_date}
                        onChange={(e) => { setExecuteForm((f) => ({ ...f, completion_date: e.target.value })); setFormErrors({}); }}
                        className="ui-input text-sm" />
                    </Field>
                    <Field label="Completion Notes">
                      <textarea value={executeForm.completion_notes}
                        onChange={(e) => setExecuteForm((f) => ({ ...f, completion_notes: e.target.value }))}
                        placeholder="Closing notes…" rows={3} className="ui-input text-sm resize-none" />
                    </Field>
                    <Field label="Completion Document">
                      <label className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer hover:opacity-80"
                        style={{ border: "1px dashed var(--border)", background: "var(--bg-surface)" }}>
                        <PaperClipIcon className="h-4 w-4" style={{ color: "var(--text-muted)" }} />
                        <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                          {executeForm.file ? executeForm.file.name : "Attach document (optional)"}
                        </span>
                        <input type="file" className="hidden"
                          onChange={(e) => setExecuteForm((f) => ({ ...f, file: e.target.files[0] || null }))} />
                      </label>
                    </Field>
                    <button onClick={handleExecute} disabled={actionLoading}
                      className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold hover:opacity-90 disabled:opacity-60"
                      style={{ background: "#ef4444", color: "#fff" }}>
                      {actionLoading ? <Spinner size={3} /> : <CheckCircleIcon className="h-4 w-4" />}
                      Execute & Close Issue
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </ModalShell>
  );
}

// ─── Detail Drawer ────────────────────────────────────────────────────────────

function DetailDrawer({ isOpen, onClose, checklist, onStartAudit, onManageIssues, canPerform }) {
  if (!checklist) return null;
  const auditors = checklist.auditors || [];
  const performed = checklist.performed_health_and_safety_audit_checklists || [];
  const totalIssues = performed.reduce((n, p) => n + (p.issues?.length || 0), 0);

  return createPortal(
    <div className="fixed inset-0" style={{ zIndex: 9990 }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      {/* Backdrop */}
      <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.45)" }} onClick={onClose} />
      {/* Drawer */}
      <div className="absolute top-0 right-0 bottom-0 w-full max-w-xl flex flex-col overflow-hidden"
        style={{ background: "var(--bg-surface)", boxShadow: "-8px 0 32px rgba(0,0,0,0.2)" }}>
        {/* Gradient header */}
        <div className="flex-shrink-0 px-6 py-6 relative overflow-hidden"
          style={{ background: `linear-gradient(135deg, ${ACCENT} 0%, #059669 60%, #047857 100%)` }}>
          <div className="absolute inset-0 opacity-10"
            style={{ backgroundImage: "radial-gradient(circle at 70% 50%, #fff 0%, transparent 70%)" }} />
          <button onClick={onClose} className="absolute top-4 right-4 p-1.5 rounded-lg hover:opacity-70"
            style={{ background: "rgba(255,255,255,0.15)", color: "#fff" }}>
            <XMarkIcon className="h-5 w-5" />
          </button>
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(255,255,255,0.2)" }}>
              <ClipboardDocumentCheckIcon className="h-7 w-7 text-white" />
            </div>
            <div>
              <p className="text-white text-xs font-semibold opacity-80 mb-0.5">Health & Safety — Checklist</p>
              <h2 className="text-white text-lg font-bold leading-tight">{checklist.auditor_number}</h2>
              <p className="text-white text-sm opacity-80 mt-0.5">{checklist.area_audited}</p>
              <div className="mt-2">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold"
                  style={{ background: "rgba(255,255,255,0.2)", color: "#fff" }}>
                  {STATUS_STYLES[checklist.status]?.label || checklist.status}
                </span>
              </div>
            </div>
          </div>
          {/* Stats strip */}
          <div className="mt-4 grid grid-cols-3 gap-2">
            {[
              { label: "Auditors",    value: auditors.length },
              { label: "Audits Run",  value: performed.length },
              { label: "Issues",      value: totalIssues },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-xl px-3 py-2 text-center"
                style={{ background: "rgba(255,255,255,0.15)" }}>
                <p className="text-white text-lg font-bold">{value}</p>
                <p className="text-white text-[10px] opacity-75">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 px-6 py-4 flex-shrink-0" style={{ borderBottom: "1px solid var(--border)" }}>
          {canPerform && (
            <button onClick={onStartAudit}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90"
              style={{ background: ACCENT, color: "#fff" }}>
              <PlayIcon className="h-4 w-4" /> Start Audit
            </button>
          )}
          {performed.length > 0 && (
            <button onClick={onManageIssues}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-80"
              style={{ background: ACCENT_LIGHT, color: ACCENT }}>
              <BellAlertIcon className="h-4 w-4" /> Issues
            </button>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-6">
          {/* Checklist Info */}
          <section>
            <h3 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)" }}>
              Checklist Details
            </h3>
            <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
              {[
                { label: "Date",     value: formatDate(checklist.date) },
                { label: "Status",   value: <StatusBadge status={checklist.status} /> },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between px-4 py-3"
                  style={{ borderBottom: "1px solid var(--border)" }}>
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>{label}</span>
                  <span className="text-sm font-semibold" style={{ color: "var(--text)" }}>{value}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Auditors */}
          <section>
            <h3 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)" }}>
              Assigned Auditors
            </h3>
            {auditors.length === 0 ? (
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>No auditors assigned.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {auditors.map((a) => (
                  <div key={a.id} className="flex items-center gap-3 rounded-xl px-4 py-3"
                    style={{ background: "var(--bg-raised)", border: "1px solid var(--border)" }}>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                      style={{ background: ACCENT }}>
                      {(a.first_name?.[0] || a.email?.[0] || "A").toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>{displayName(a)}</p>
                      <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>{a.employee_id || a.email || ""}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Performed Audits */}
          {performed.length > 0 && (
            <section>
              <h3 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)" }}>
                Performed Audits
              </h3>
              <div className="flex flex-col gap-2">
                {performed.map((p) => (
                  <div key={p.id} className="rounded-xl px-4 py-3"
                    style={{ background: "var(--bg-raised)", border: "1px solid var(--border)" }}>
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs font-semibold" style={{ color: "var(--text)" }}>
                        Audit on {formatDate(p.audit_date || p.created_at)}
                      </p>
                      <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                        by {displayName(p.auditor)}
                      </span>
                    </div>
                    {p.audit_note && (
                      <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>{p.audit_note}</p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[11px] px-2 py-0.5 rounded-full"
                        style={{ background: ACCENT_LIGHT, color: ACCENT }}>
                        {p.issues?.length || 0} issues
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

// ─── Action Menu ──────────────────────────────────────────────────────────────

function ActionMenu({ onEdit, onReassign, onView, onStartAudit, onManageIssues, onTemplates, onDelete, canUpdate, canDelete: canDel, canPerform }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handler(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const items = [
    { label: "View Details",       icon: EyeIcon,            action: onView,           show: true },
    { label: "Start Audit",        icon: PlayIcon,           action: onStartAudit,     show: canPerform },
    { label: "Manage Issues",      icon: BellAlertIcon,      action: onManageIssues,   show: canPerform },
    { label: "Edit",               icon: PencilSquareIcon,   action: onEdit,           show: canUpdate },
    { label: "Reassign Auditors",  icon: UsersIcon,          action: onReassign,       show: canUpdate },
    { label: "Manage Templates",   icon: Cog6ToothIcon,      action: onTemplates,      show: canUpdate },
    { label: "Delete",             icon: TrashIcon,          action: onDelete,         show: canDel, danger: true },
  ].filter((i) => i.show);

  return (
    <div className="relative" ref={ref}>
      <button onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }}
        className="p-1.5 rounded-lg hover:opacity-80"
        style={{ background: open ? "var(--bg-raised)" : "transparent", color: "var(--text-muted)" }}>
        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zm0 6a2 2 0 110-4 2 2 0 010 4zm0 6a2 2 0 110-4 2 2 0 010 4z" />
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 mt-1 w-48 rounded-xl overflow-hidden z-50"
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border)",
            boxShadow: "var(--shadow-lg)",
          }}>
          {items.map(({ label, icon: Icon, action, danger }) => (
            <button key={label} onClick={() => { setOpen(false); action(); }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-semibold hover:opacity-80 transition-opacity"
              style={{ color: danger ? "#ef4444" : "var(--text)", borderBottom: "1px solid var(--border)" }}>
              <Icon className="h-4 w-4 flex-shrink-0" />{label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Checklist Page ──────────────────────────────────────────────────────

export default function ChecklistPage() {
  const dispatch = useAppDispatch();
  const { hasPermission } = useAuth();

  const catalog        = useAppSelector(selectHsaCatalog);
  const catalogLoading = useAppSelector(selectHsaCatalogLoading);
  const checklists     = useAppSelector(selectHsaChecklists);
  const meta           = useAppSelector(selectHsaChecklistsMeta);
  const loading        = useAppSelector(selectHsaChecklistsLoading);
  const actionError    = useAppSelector(selectHsaActionError);
  const filters        = useAppSelector(selectHsaFilters);

  // When catalog loads successfully, find the matching record.
  // If the catalog call fails or the title is missing, fall back to the
  // seeded default ID (1) so checklists can still be fetched.
  const catalogAudit = catalog.find((a) => a.title === CHECKLIST_AUDIT_TITLE) ?? null;
  const auditId      = catalogLoading
    ? null
    : (catalogAudit?.id ?? 1);

  const canUpdate    = hasPermission("health_and_safety_audit_checklists.update");
  const canDelete    = hasPermission("health_and_safety_audit_checklists.update");
  const canPerform   = hasPermission("health_and_safety_audit_checklists.update");
  const canIssues    = hasPermission("performed_health_and_safety_audit_checklist_issues.update"); // eslint-disable-line no-unused-vars
  const canTemplates = hasPermission("health_and_safety_audits.update");

  // Modal state
  const [setupModal,     setSetupModal]     = useState({ open: false, checklist: null });
  const [deleteTarget,   setDeleteTarget]   = useState(null);
  const [deleting,       setDeleting]       = useState(false);
  const [reassignModal,  setReassignModal]  = useState({ open: false, checklist: null });
  const [performModal,   setPerformModal]   = useState({ open: false, checklist: null });
  const [issueModal,     setIssueModal]     = useState({ open: false, checklist: null });
  const [templateModal,  setTemplateModal]  = useState(false);
  const [detailDrawer,   setDetailDrawer]   = useState({ open: false, checklist: null });

  // Search debounce
  const [auditorSearch,  setAuditorSearch]  = useState("");
  const searchTimer = useRef(null);

  // Load audit catalog on mount
  useEffect(() => {
    dispatch(fetchHsaCatalog());
  }, [dispatch]);

  // Load templates when auditId is known
  useEffect(() => {
    if (!auditId) return;
    dispatch(fetchHsaTemplates(auditId));
  }, [dispatch, auditId]);

  // Fetch checklists when filters or auditId change
  useEffect(() => {
    if (!auditId) return;
    dispatch(fetchHsaChecklists(auditId));
  }, [dispatch, auditId, filters.page, filters.per_page, filters.auditor_number, filters.area_audited, filters.date, filters.status]);

  // Show actionError as toast
  useEffect(() => {
    if (actionError) {
      toast.error(actionError);
      dispatch(clearHsaActionError());
    }
  }, [actionError, dispatch]);

  // Debounced auditor number search
  function handleAuditorSearch(val) {
    setAuditorSearch(val);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      dispatch(setHsaAuditorNumber(val));
    }, 400);
  }

  async function handleDelete() {
    if (!deleteTarget || !auditId) return;
    setDeleting(true);
    const result = await dispatch(deleteHsaChecklist({ auditId, id: deleteTarget.id }));
    setDeleting(false);
    if (deleteHsaChecklist.fulfilled.match(result)) {
      toast.success("Checklist deleted.");
      setDeleteTarget(null);
      dispatch(fetchHsaChecklists(auditId));
    } else {
      toast.error(result.payload || "Failed to delete.");
    }
  }

  const COLS = ["#", "Auditor No.", "Area Audited", "Date", "Auditors", "Status", "Performed", ""];

  return (
    <div className="space-y-6 pb-8">
      {/* ── Loading guard ── */}
      {catalogLoading && (
        <div className="flex items-center justify-center py-24">
          <Spinner size={6} />
        </div>
      )}
      {!catalogLoading && (
      <>
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            {catalogAudit?.image_url ? (
              <img src={catalogAudit.image_url} alt="Audit" className="w-10 h-10 object-cover rounded-xl"
                style={{ border: "2px solid var(--border)" }} />
            ) : (
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: ACCENT_LIGHT }}>
                <ClipboardDocumentCheckIcon className="h-5 w-5" style={{ color: ACCENT }} />
              </div>
            )}
            <div>
              <h1 className="text-xl font-bold" style={{ color: "var(--text)" }}>
                {catalogAudit?.title || "H&S Checklist"}
              </h1>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                {catalogAudit?.description || "Manage and perform health & safety audit checklists."}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {canTemplates && (
            <label className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer hover:opacity-80"
              style={{ background: "var(--bg-raised)", border: "1px solid var(--border)", color: "var(--text)" }}>
              <ArrowPathIcon className="h-3.5 w-3.5" />
              {catalogAudit?.image_url ? "Change Image" : "Upload Image"}
              <input type="file" accept="image/*" className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file || !auditId) return;
                  try {
                    await HsaParentService.uploadImage(auditId, file);
                    dispatch(fetchHsaCatalog());
                    toast.success("Image uploaded.");
                  } catch { toast.error("Failed to upload image."); }
                  e.target.value = "";
                }} />
            </label>
          )}
          {catalogAudit?.image_url && canTemplates && (
            <button
              onClick={async () => {
                try {
                  await HsaParentService.deleteImage(auditId);
                  dispatch(fetchHsaCatalog());
                  toast.success("Image removed.");
                } catch { toast.error("Failed to delete image."); }
              }}
              className="p-2 rounded-lg hover:opacity-80"
              style={{ color: "#ef4444" }}
              title="Remove image">
              <TrashIcon className="h-4 w-4" />
            </button>
          )}
          {canTemplates && (
            <button onClick={() => setTemplateModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-80"
              style={{ background: "var(--bg-raised)", border: "1px solid var(--border)", color: "var(--text)" }}>
              <Cog6ToothIcon className="h-4 w-4" /> Templates
            </button>
          )}
          {canUpdate && (
            <button onClick={() => setSetupModal({ open: true, checklist: null })}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90"
              style={{ background: ACCENT, color: "#fff" }}>
              <PlusIcon className="h-4 w-4" /> New Checklist
            </button>
          )}
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="ui-card p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4"
              style={{ color: "var(--text-muted)" }} />
            <input value={auditorSearch} onChange={(e) => handleAuditorSearch(e.target.value)}
              placeholder="Search auditor no…"
              className="ui-input text-sm pl-9 w-48" />
          </div>
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4"
              style={{ color: "var(--text-muted)" }} />
            <input value={filters.area_audited}
              onChange={(e) => dispatch(setHsaAreaAudited(e.target.value))}
              placeholder="Filter by area…"
              className="ui-input text-sm pl-9 w-44" />
          </div>
          <div className="relative">
            <CalendarDaysIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4"
              style={{ color: "var(--text-muted)" }} />
            <input type="date" value={filters.date}
              onChange={(e) => dispatch(setHsaDateFilter(e.target.value))}
              className="ui-input text-sm pl-9 w-44" />
          </div>
          <select value={filters.status}
            onChange={(e) => dispatch(setHsaStatusFilter(e.target.value))}
            className="ui-input text-sm w-36">
            <option value="">All Statuses</option>
            {CHECKLIST_STATUSES.map((s) => (
              <option key={s} value={s}>{STATUS_STYLES[s]?.label || s}</option>
            ))}
          </select>
          {(filters.auditor_number || filters.area_audited || filters.date || filters.status) && (
            <button onClick={() => { setAuditorSearch(""); dispatch(clearHsaFilters()); }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold hover:opacity-80"
              style={{ background: "rgba(239,68,68,.1)", color: "#ef4444" }}>
              <XMarkIcon className="h-3.5 w-3.5" /> Clear
            </button>
          )}
          <button onClick={() => { if (auditId) dispatch(fetchHsaChecklists(auditId)); }}
            className="p-2 rounded-lg hover:opacity-80 ml-auto"
            style={{ background: "var(--bg-raised)", border: "1px solid var(--border)" }}>
            <ArrowPathIcon className="h-4 w-4" style={{ color: "var(--text-muted)" }} />
          </button>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="ui-card overflow-hidden" style={{ padding: 0 }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                {COLS.map((col) => (
                  <th key={col} className="px-4 py-3 text-left text-xs font-semibold"
                    style={{ color: "var(--text-muted)", background: "var(--bg-raised)" }}>
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableSkeleton cols={COLS.length} rows={5} />
              ) : checklists.length === 0 ? (
                <tr>
                  <td colSpan={COLS.length} className="text-center py-16">
                    <ClipboardDocumentCheckIcon className="h-12 w-12 mx-auto mb-3" style={{ color: "var(--text-muted)" }} />
                    <p className="text-sm font-semibold mb-1" style={{ color: "var(--text)" }}>No checklists found</p>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                      {canUpdate ? "Click \"New Checklist\" to create one." : "No records match your filters."}
                    </p>
                  </td>
                </tr>
              ) : (
                checklists.map((cl, idx) => {
                  const auditors = cl.auditors || [];
                  const performed = cl.performed_health_and_safety_audit_checklists || [];
                  const rowNum = ((filters.page - 1) * filters.per_page) + idx + 1;
                  return (
                    <tr key={cl.id}
                      className="hover:opacity-90 cursor-pointer transition-opacity"
                      style={{ borderBottom: "1px solid var(--border)" }}
                      onClick={() => setDetailDrawer({ open: true, checklist: cl })}>
                      <td className="px-4 py-3 text-xs" style={{ color: "var(--text-muted)" }}>{rowNum}</td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-semibold" style={{ color: "var(--text)" }}>
                          {cl.auditor_number}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm" style={{ color: "var(--text)" }}>{cl.area_audited}</td>
                      <td className="px-4 py-3 text-sm" style={{ color: "var(--text-muted)" }}>
                        {formatDate(cl.date)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {auditors.slice(0, 3).map((a) => (
                            <span key={a.id} className="px-1.5 py-0.5 rounded text-[10px] font-semibold"
                              style={{ background: ACCENT_LIGHT, color: ACCENT }}>
                              {displayName(a).split(" ")[0]}
                            </span>
                          ))}
                          {auditors.length > 3 && (
                            <span className="px-1.5 py-0.5 rounded text-[10px]"
                              style={{ background: "var(--bg-raised)", color: "var(--text-muted)" }}>
                              +{auditors.length - 3}
                            </span>
                          )}
                          {auditors.length === 0 && <span className="text-xs" style={{ color: "var(--text-muted)" }}>—</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3"><StatusBadge status={cl.status} /></td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full"
                          style={{ background: performed.length > 0 ? ACCENT_LIGHT : "var(--bg-raised)", color: performed.length > 0 ? ACCENT : "var(--text-muted)" }}>
                          {performed.length} audit{performed.length !== 1 ? "s" : ""}
                        </span>
                      </td>
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <ActionMenu
                          canUpdate={canUpdate}
                          canDelete={canDelete}
                          canPerform={canPerform}
                          onView={() => setDetailDrawer({ open: true, checklist: cl })}
                          onEdit={() => setSetupModal({ open: true, checklist: cl })}
                          onReassign={() => setReassignModal({ open: true, checklist: cl })}
                          onStartAudit={() => setPerformModal({ open: true, checklist: cl })}
                          onManageIssues={() => setIssueModal({ open: true, checklist: cl })}
                          onTemplates={() => setTemplateModal(true)}
                          onDelete={() => setDeleteTarget(cl)}
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <Pagination meta={meta} onPage={(p) => dispatch(setHsaPage(p))} />
      </div>

      {/* ── Modals ── */}
      <SetupModal
        isOpen={setupModal.open}
        onClose={() => setSetupModal({ open: false, checklist: null })}
        checklist={setupModal.checklist}
        auditId={auditId}
      />
      <ReassignModal
        isOpen={reassignModal.open}
        onClose={() => setReassignModal({ open: false, checklist: null })}
        checklist={reassignModal.checklist}
        auditId={auditId}
      />
      <PerformModal
        isOpen={performModal.open}
        onClose={() => setPerformModal({ open: false, checklist: null })}
        checklist={performModal.checklist}
        auditId={auditId}
      />
      <IssueManagerModal
        isOpen={issueModal.open}
        onClose={() => setIssueModal({ open: false, checklist: null })}
        checklist={issueModal.checklist}
        auditId={auditId}
      />
      <TemplateManagerModal
        isOpen={templateModal}
        onClose={() => setTemplateModal(false)}
        auditId={auditId}
      />
      <DeleteConfirmModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        name={deleteTarget?.auditor_number}
      />
      <DetailDrawer
        isOpen={detailDrawer.open}
        onClose={() => setDetailDrawer({ open: false, checklist: null })}
        checklist={detailDrawer.checklist}
        canPerform={canPerform}
        onStartAudit={() => {
          setDetailDrawer((d) => ({ ...d, open: false }));
          setPerformModal({ open: true, checklist: detailDrawer.checklist });
        }}
        onManageIssues={() => {
          setDetailDrawer((d) => ({ ...d, open: false }));
          setIssueModal({ open: true, checklist: detailDrawer.checklist });
        }}
      />
      </>
      )}
    </div>
  );
}
