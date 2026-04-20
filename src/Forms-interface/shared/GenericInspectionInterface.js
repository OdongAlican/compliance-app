/**
 * GenericInspectionInterface.js
 *
 * A fully-featured, configurable inspection interface component.
 * All 6 inspection-family UI files delegate to this component.
 *
 * Props:
 *  config = {
 *    title           {string}    – Page heading, e.g. "Canteen Inspections"
 *    permPrefix      {string}    – e.g. "canteen_inspections"
 *    performPermPrefix {string}  – e.g. "perform_canteen_inspections"
 *    extraSetupFields [{key, label, required, type, placeholder, colSpan}]
 *    extraFilterFields [{key, label, type}]
 *    setupSlice      {object}    – thunks + selectors + filter actions
 *    performService  {object}
 *    checklistService {object}
 *    checklistItemService {object}
 *    issueService    {object}
 *    attachmentService {object}
 *    repairAttachmentService {object}
 *  }
 */
import React, { useEffect, useState, useCallback, useRef } from "react";
import toast from "react-hot-toast";
import {
  EllipsisVerticalIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  XMarkIcon,
  ArrowPathIcon,
  PlusIcon,
  CheckBadgeIcon,
  ExclamationTriangleIcon,
  ClipboardDocumentCheckIcon,
} from "@heroicons/react/24/outline";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import useAuth from "../../hooks/useAuth";
import UsersService from "../../services/users.service";

/* ─── Shared UI helpers ─────────────────────────────────────────────────── */
export function Spinner({ size = 5 }) {
  return (
    <div className="animate-spin rounded-full" style={{
      width: size * 4 + "px", height: size * 4 + "px",
      borderWidth: "3px", borderStyle: "solid",
      borderColor: "var(--border)", borderTopColor: "var(--accent)",
    }} />
  );
}

export function Field({ label, required, error, hint, children }) {
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

export function Pagination({ meta, onPage }) {
  if (!meta || meta.total_pages <= 1) return null;
  const { page, total_pages, total, per_page } = meta;
  const from = (page - 1) * per_page + 1;
  const to = Math.min(page * per_page, total);
  return (
    <div className="flex items-center justify-between px-4 py-3 text-sm" style={{ borderTop: "1px solid var(--border)", color: "var(--text-muted)" }}>
      <span>{from}–{to} of {total}</span>
      <div className="flex items-center gap-1">
        <button disabled={page === 1} onClick={() => onPage(page - 1)}
          className="px-2 py-1 rounded text-xs hover:opacity-80 disabled:opacity-30"
          style={{ background: "var(--bg-raised)", border: "1px solid var(--border)" }}>‹ Prev</button>
        <span className="px-3 py-1 text-xs rounded" style={{ background: "var(--bg-raised)", border: "1px solid var(--border)", color: "var(--text)" }}>{page} / {total_pages}</span>
        <button disabled={page === total_pages} onClick={() => onPage(page + 1)}
          className="px-2 py-1 rounded text-xs hover:opacity-80 disabled:opacity-30"
          style={{ background: "var(--bg-raised)", border: "1px solid var(--border)" }}>Next ›</button>
      </div>
    </div>
  );
}

export function ActionMenu({ actions }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    if (open) document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);
  return (
    <div className="relative inline-block" ref={ref}>
      <button onClick={() => setOpen(o => !o)} className="p-1.5 rounded-lg transition-colors"
        style={{ color: "var(--text-muted)", background: open ? "var(--bg-raised)" : "transparent" }}>
        <EllipsisVerticalIcon className="h-5 w-5" />
      </button>
      {open && (
        <div className="ui-menu absolute right-0 mt-1 w-52 z-30">
          {actions.map((a, i) => a.divider
            ? <div key={i} style={{ height: 1, background: "var(--border)", margin: "4px 0" }} />
            : <button key={i} className="ui-menu-item text-left w-full"
                style={{ color: a.danger ? "var(--danger)" : a.color ?? "var(--text)" }}
                onClick={() => { a.onClick(); setOpen(false); }}>{a.label}</button>
          )}
        </div>
      )}
    </div>
  );
}

export function ModalShell({ isOpen, onClose, title, width = "max-w-lg", children }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.55)" }}>
      <div className={"ui-card w-full " + width + " flex flex-col"} style={{ padding: 0, maxHeight: "90vh", overflow: "hidden" }}>
        <div className="flex items-center justify-between px-6 py-4 flex-shrink-0" style={{ borderBottom: "1px solid var(--border)" }}>
          <h2 className="font-bold text-sm" style={{ color: "var(--text)" }}>{title}</h2>
          <button onClick={onClose} className="p-1 rounded hover:opacity-70" style={{ color: "var(--text-muted)" }}>
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
        <div className="overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  );
}

const PRIORITY_COLORS = {
  low:      { bg: "color-mix(in srgb,#3fb950 15%,transparent)", text: "#3fb950" },
  medium:   { bg: "color-mix(in srgb,#d29922 15%,transparent)", text: "#d29922" },
  high:     { bg: "color-mix(in srgb,#f85149 15%,transparent)", text: "#f85149" },
  critical: { bg: "color-mix(in srgb,#ff0000 20%,transparent)", text: "#ff4444" },
};

/* ─── SetupFormModal ─────────────────────────────────────────────────────── */
function SetupFormModal({ isOpen, onClose, setup, users, catalogItems, config }) {
  const dispatch = useAppDispatch();
  const { setupSlice } = config;
  const actionLoading = useAppSelector(setupSlice.selectActionLoading);
  const isEdit = Boolean(setup);

  const baseFields = { name: "", location: "", date: "", time: "", note: "", safety_officer_id: "", supervisor_id: "", inspection_id: "" };
  const extraDefaults = Object.fromEntries((config.extraSetupFields ?? []).map(f => [f.key, ""]));
  const [form, setForm] = useState({ ...baseFields, ...extraDefaults });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      if (setup) {
        const extra = Object.fromEntries((config.extraSetupFields ?? []).map(f => [f.key, setup[f.key] ?? ""]));
        setForm({
          name: setup.name ?? "", location: setup.location ?? "", date: setup.date ?? "",
          time: setup.time ?? "", note: setup.note ?? "",
          safety_officer_id: setup.safety_officer_id ?? setup.safety_officer?.id ?? "",
          supervisor_id: setup.supervisor_id ?? setup.supervisor?.id ?? "",
          inspection_id: setup.inspection_id ?? "", ...extra,
        });
      } else {
        setForm({ ...baseFields, ...extraDefaults });
      }
      setErrors({});
      dispatch(setupSlice.clearActionError());
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, setup]);

  const soList  = users.filter(u => (u.role?.name||u.role||"").toLowerCase().includes("safety")).length
    ? users.filter(u => (u.role?.name||u.role||"").toLowerCase().includes("safety")) : users;
  const supList = users.filter(u => (u.role?.name||u.role||"").toLowerCase().includes("supervisor")).length
    ? users.filter(u => (u.role?.name||u.role||"").toLowerCase().includes("supervisor")) : users;

  function validate() {
    const e = {};
    if (!form.name.trim())       e.name              = "Name is required.";
    if (!form.date)              e.date              = "Date is required.";
    if (!form.time)              e.time              = "Time is required.";
    if (!form.safety_officer_id) e.safety_officer_id = "Safety officer is required.";
    if (!form.supervisor_id)     e.supervisor_id     = "Supervisor is required.";
    (config.extraSetupFields ?? []).forEach(f => {
      if (f.required && !form[f.key]?.toString().trim()) e[f.key] = `${f.label} is required.`;
    });
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(ev) {
    ev.preventDefault();
    if (!validate()) return;
    const extra = Object.fromEntries((config.extraSetupFields ?? []).map(f => [f.key, form[f.key] || undefined]));
    const payload = {
      name: form.name.trim(), location: form.location.trim() || undefined,
      date: form.date, time: form.time, note: form.note.trim() || undefined,
      safety_officer_id: Number(form.safety_officer_id),
      supervisor_id:     Number(form.supervisor_id),
      ...(form.inspection_id ? { inspection_id: Number(form.inspection_id) } : {}),
      ...extra,
    };
    const action = isEdit
      ? dispatch(setupSlice.updateAction({ id: setup.id, data: payload }))
      : dispatch(setupSlice.createAction(payload));
    const result = await action;
    if (setupSlice.createAction.fulfilled.match(result) || setupSlice.updateAction.fulfilled.match(result)) {
      toast.success(isEdit ? "Inspection updated." : "Inspection created.");
      onClose();
    } else {
      toast.error(result.payload || "Something went wrong.");
    }
  }

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <ModalShell isOpen={isOpen} onClose={onClose} title={isEdit ? `Edit ${config.title}` : `New ${config.title}`}>
      <form onSubmit={handleSubmit} className="p-6 grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <Field label="Name" required error={errors.name}>
            <input value={form.name} onChange={e => set("name", e.target.value)} placeholder="Inspection name" className="ui-input text-sm" />
          </Field>
        </div>
        <div className="col-span-2">
          <Field label="Location" error={errors.location}>
            <input value={form.location} onChange={e => set("location", e.target.value)} placeholder="Location" className="ui-input text-sm" />
          </Field>
        </div>
        <Field label="Date" required error={errors.date}>
          <input type="date" value={form.date} onChange={e => set("date", e.target.value)} className="ui-input text-sm" />
        </Field>
        <Field label="Time" required error={errors.time}>
          <input type="time" value={form.time} onChange={e => set("time", e.target.value)} className="ui-input text-sm" />
        </Field>
        <div className="col-span-2 sm:col-span-1">
          <Field label="Safety Officer" required error={errors.safety_officer_id}>
            <select value={form.safety_officer_id} onChange={e => set("safety_officer_id", e.target.value)} className="ui-input text-sm">
              <option value="">— Select —</option>
              {soList.map(u => <option key={u.id} value={u.id}>{u.firstname} {u.lastname}</option>)}
            </select>
          </Field>
        </div>
        <div className="col-span-2 sm:col-span-1">
          <Field label="Supervisor" required error={errors.supervisor_id}>
            <select value={form.supervisor_id} onChange={e => set("supervisor_id", e.target.value)} className="ui-input text-sm">
              <option value="">— Select —</option>
              {supList.map(u => <option key={u.id} value={u.id}>{u.firstname} {u.lastname}</option>)}
            </select>
          </Field>
        </div>

        {/* Extra type-specific fields */}
        {(config.extraSetupFields ?? []).map(f => (
          <div key={f.key} className={`col-span-${f.colSpan ?? 1}`}>
            <Field label={f.label} required={f.required} error={errors[f.key]}>
              {f.type === "select" ? (
                <select value={form[f.key]} onChange={e => set(f.key, e.target.value)} className="ui-input text-sm">
                  <option value="">— Select —</option>
                  {(f.options ?? []).map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              ) : (
                <input type={f.type ?? "text"} value={form[f.key]} onChange={e => set(f.key, e.target.value)}
                  placeholder={f.placeholder ?? f.label} className="ui-input text-sm" />
              )}
            </Field>
          </div>
        ))}

        {catalogItems.length > 0 && (
          <div className="col-span-2">
            <Field label="Inspection Type" hint="Auto-assigned if left blank.">
              <select value={form.inspection_id} onChange={e => set("inspection_id", e.target.value)} className="ui-input text-sm">
                <option value="">— Auto —</option>
                {catalogItems.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field>
          </div>
        )}

        <div className="col-span-2">
          <Field label="Note">
            <textarea rows={3} value={form.note} onChange={e => set("note", e.target.value)} placeholder="Optional notes…" className="ui-input text-sm" />
          </Field>
        </div>

        <div className="col-span-2 flex gap-3 justify-end pt-2">
          <button type="button" onClick={onClose} disabled={actionLoading}
            className="px-4 py-2 rounded-xl text-sm font-medium"
            style={{ background: "var(--bg-raised)", color: "var(--text-muted)", border: "1px solid var(--border)" }}>Cancel</button>
          <button type="submit" disabled={actionLoading}
            className="px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2"
            style={{ background: "var(--accent)", color: "#fff" }}>
            {actionLoading && <Spinner size={4} />}
            {isEdit ? "Save Changes" : "Create Inspection"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

/* ─── ReassignModal ──────────────────────────────────────────────────────── */
function ReassignModal({ isOpen, onClose, mode, setupId, users, config }) {
  const dispatch = useAppDispatch();
  const { setupSlice } = config;
  const actionLoading = useAppSelector(setupSlice.selectActionLoading);
  const [userId, setUserId] = useState("");

  useEffect(() => { if (isOpen) setUserId(""); }, [isOpen]);

  const isSO = mode === "safety_officer";
  const filtered = users.filter(u => (u.role?.name||u.role||"").toLowerCase().includes(isSO ? "safety" : "supervisor")).length
    ? users.filter(u => (u.role?.name||u.role||"").toLowerCase().includes(isSO ? "safety" : "supervisor")) : users;

  async function handleSave() {
    if (!userId) return;
    const action = isSO
      ? dispatch(setupSlice.reassignSafetyOfficerAction({ id: setupId, safetyOfficerId: Number(userId) }))
      : dispatch(setupSlice.reassignSupervisorAction({ id: setupId, supervisorId: Number(userId) }));
    const result = await action;
    if (result.meta.requestStatus === "fulfilled") {
      toast.success(`${isSO ? "Safety officer" : "Supervisor"} reassigned.`);
      onClose();
    } else {
      toast.error(result.payload || "Failed to reassign.");
    }
  }

  return (
    <ModalShell isOpen={isOpen} onClose={onClose} title={`Reassign ${isSO ? "Safety Officer" : "Supervisor"}`} width="max-w-sm">
      <div className="p-6 flex flex-col gap-4">
        <Field label={isSO ? "New Safety Officer" : "New Supervisor"} required>
          <select value={userId} onChange={e => setUserId(e.target.value)} className="ui-input text-sm">
            <option value="">— Select —</option>
            {filtered.map(u => <option key={u.id} value={u.id}>{u.firstname} {u.lastname}</option>)}
          </select>
        </Field>
        <div className="flex gap-3 justify-end">
          <button type="button" onClick={onClose} disabled={actionLoading}
            className="px-4 py-2 rounded-xl text-sm" style={{ background: "var(--bg-raised)", color: "var(--text-muted)", border: "1px solid var(--border)" }}>Cancel</button>
          <button type="button" onClick={handleSave} disabled={actionLoading || !userId}
            className="px-4 py-2 rounded-xl text-sm font-semibold" style={{ background: "var(--accent)", color: "#fff" }}>
            {actionLoading ? <Spinner size={4} /> : "Confirm"}
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

/* ─── DeleteConfirmModal ─────────────────────────────────────────────────── */
function DeleteConfirmModal({ isOpen, onClose, onConfirm, label, loading }) {
  return (
    <ModalShell isOpen={isOpen} onClose={onClose} title="Confirm Delete" width="max-w-sm">
      <div className="p-6 flex flex-col gap-4">
        <p className="text-sm" style={{ color: "var(--text)" }}>
          Delete <strong>{label}</strong>? This cannot be undone.
        </p>
        <div className="flex gap-3 justify-end">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl text-sm"
            style={{ background: "var(--bg-raised)", color: "var(--text-muted)", border: "1px solid var(--border)" }}>Cancel</button>
          <button type="button" onClick={onConfirm} disabled={loading}
            className="px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2"
            style={{ background: "var(--danger)", color: "#fff" }}>
            {loading && <Spinner size={4} />} Delete
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

/* ─── PerformFormModal ───────────────────────────────────────────────────── */
function PerformFormModal({ isOpen, onClose, onSaved, setupId, config }) {
  const [form, setForm] = useState({ date: "", time: "", note: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) setForm({ date: new Date().toISOString().split("T")[0], time: new Date().toTimeString().slice(0, 5), note: "" });
  }, [isOpen]);

  async function handleSubmit(ev) {
    ev.preventDefault();
    if (!form.date || !form.time) { toast.error("Date and Time are required."); return; }
    setSaving(true);
    try {
      await config.performService.create(setupId, { date: form.date, time: form.time, note: form.note || undefined });
      toast.success("Execution logged.");
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err?.response?.data?.errors?.join(", ") || err?.response?.data?.error || "Failed to create execution.");
    } finally { setSaving(false); }
  }

  return (
    <ModalShell isOpen={isOpen} onClose={onClose} title="Log Execution" width="max-w-md">
      <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Date" required>
            <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="ui-input text-sm" />
          </Field>
          <Field label="Time" required>
            <input type="time" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} className="ui-input text-sm" />
          </Field>
        </div>
        <Field label="Note">
          <textarea rows={3} value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} className="ui-input text-sm" />
        </Field>
        <div className="flex gap-3 justify-end">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl text-sm"
            style={{ background: "var(--bg-raised)", color: "var(--text-muted)", border: "1px solid var(--border)" }}>Cancel</button>
          <button type="submit" disabled={saving}
            className="px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2"
            style={{ background: "var(--accent)", color: "#fff" }}>
            {saving && <Spinner size={4} />} Log Execution
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

/* ─── SignOffModal ───────────────────────────────────────────────────────── */
function SignOffModal({ isOpen, onClose, onSaved, performId, config }) {
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSignOff() {
    setSaving(true);
    try {
      await config.performService.signOff(performId, note);
      toast.success("Inspection signed off.");
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err?.response?.data?.error || "Failed to sign off.");
    } finally { setSaving(false); }
  }

  return (
    <ModalShell isOpen={isOpen} onClose={onClose} title="Sign Off Inspection" width="max-w-sm">
      <div className="p-6 flex flex-col gap-4">
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          This will mark the inspection as completed and signed off.
        </p>
        <Field label="Sign-off Note (optional)">
          <textarea rows={3} value={note} onChange={e => setNote(e.target.value)} className="ui-input text-sm" placeholder="Any final notes…" />
        </Field>
        <div className="flex gap-3 justify-end">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl text-sm"
            style={{ background: "var(--bg-raised)", color: "var(--text-muted)", border: "1px solid var(--border)" }}>Cancel</button>
          <button type="button" onClick={handleSignOff} disabled={saving}
            className="px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2"
            style={{ background: "var(--success, #22c55e)", color: "#fff" }}>
            {saving && <Spinner size={4} />}
            <CheckBadgeIcon className="h-4 w-4" /> Sign Off
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

/* ─── ChecklistSection ───────────────────────────────────────────────────── */
function ChecklistSection({ performId, config, canUpdate }) {
  const [checklists, setChecklists]     = useState([]);
  const [loading, setLoading]           = useState(false);
  const [expanded, setExpanded]         = useState(null);
  const [items, setItems]               = useState({});
  const [itemsLoading, setItemsLoading] = useState({});
  const [edits, setEdits]               = useState({});
  const [saving, setSaving]             = useState({});
  const [attachModal, setAttachModal]   = useState(false);
  const [attachIds, setAttachIds]       = useState("");
  const [attaching, setAttaching]       = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await config.checklistService.list(performId);
      setChecklists(res.data ?? res ?? []);
    } catch { toast.error("Failed to load checklists."); }
    finally { setLoading(false); }
  }, [performId, config]);

  useEffect(() => { load(); }, [load]);

  async function loadItems(checklistId) {
    setItemsLoading(p => ({ ...p, [checklistId]: true }));
    try {
      const res = await config.checklistItemService.list(performId, checklistId);
      const list = res.data ?? res ?? [];
      setItems(p => ({ ...p, [checklistId]: list }));
      setEdits(p => ({ ...p, [checklistId]: list.map(it => ({ checklist_item_template_id: it.checklist_item_template_id ?? it.id, status: it.status ?? "satisfactory", comment: it.comment ?? "" })) }));
    } catch { toast.error("Failed to load checklist items."); }
    finally { setItemsLoading(p => ({ ...p, [checklistId]: false })); }
  }

  function toggleExpand(id) {
    if (expanded === id) { setExpanded(null); return; }
    setExpanded(id);
    if (!items[id]) loadItems(id);
  }

  function updateEdit(checklistId, idx, key, val) {
    setEdits(p => ({ ...p, [checklistId]: p[checklistId].map((e, i) => i === idx ? { ...e, [key]: val } : e) }));
  }

  async function saveItems(checklistId) {
    setSaving(p => ({ ...p, [checklistId]: true }));
    try {
      await config.checklistItemService.upsert(performId, checklistId, edits[checklistId]);
      toast.success("Items saved.");
      loadItems(checklistId);
    } catch (err) { toast.error(err?.response?.data?.error || "Failed to save items."); }
    finally { setSaving(p => ({ ...p, [checklistId]: false })); }
  }

  async function handleAttach() {
    const ids = attachIds.split(",").map(s => parseInt(s.trim(), 10)).filter(Boolean);
    if (!ids.length) { toast.error("Enter at least one valid template ID."); return; }
    setAttaching(true);
    try {
      await config.checklistService.attach(performId, ids);
      toast.success("Checklist(s) attached.");
      setAttachModal(false);
      setAttachIds("");
      load();
    } catch (err) { toast.error(err?.response?.data?.errors?.join(", ") || err?.response?.data?.error || "Failed to attach."); }
    finally { setAttaching(false); }
  }

  async function handleRemove(checklistId) {
    if (!window.confirm("Remove this checklist?")) return;
    try {
      await config.checklistService.remove(performId, checklistId);
      toast.success("Checklist removed.");
      load();
    } catch (err) { toast.error(err?.response?.data?.error || "Failed to remove."); }
  }

  const STATUS_OPTS = ["satisfactory", "needs_attention", "not_applicable"];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold" style={{ color: "var(--text)" }}>
          <ClipboardDocumentCheckIcon className="h-4 w-4 inline mr-1 opacity-60" />
          Checklists ({checklists.length})
        </span>
        {canUpdate && (
          <button onClick={() => setAttachModal(true)}
            className="text-xs px-3 py-1.5 rounded-lg font-medium flex items-center gap-1"
            style={{ background: "var(--bg-raised)", color: "var(--accent)", border: "1px solid var(--accent)" }}>
            <PlusIcon className="h-3.5 w-3.5" /> Attach Checklist
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-8"><Spinner /></div>
      ) : checklists.length === 0 ? (
        <div className="text-center py-8 rounded-xl" style={{ border: "1px dashed var(--border)", color: "var(--text-muted)" }}>
          No checklists attached yet.
        </div>
      ) : (
        checklists.map(cl => (
          <div key={cl.id} className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between px-4 py-3 cursor-pointer"
              style={{ background: "var(--bg-raised)" }}
              onClick={() => toggleExpand(cl.id)}>
              <span className="text-sm font-medium" style={{ color: "var(--text)" }}>
                {cl.name ?? cl.checklist_template?.name ?? `Checklist #${cl.id}`}
              </span>
              <div className="flex items-center gap-2">
                {canUpdate && (
                  <button type="button" onClick={e => { e.stopPropagation(); handleRemove(cl.id); }}
                    className="text-xs px-2 py-0.5 rounded" style={{ color: "var(--danger)" }}>Remove</button>
                )}
                <span style={{ color: "var(--text-muted)", fontSize: 12 }}>{expanded === cl.id ? "▲" : "▼"}</span>
              </div>
            </div>

            {expanded === cl.id && (
              <div className="p-4">
                {itemsLoading[cl.id] ? <div className="flex justify-center py-4"><Spinner /></div> :
                  !edits[cl.id]?.length ? <p className="text-sm text-center py-4" style={{ color: "var(--text-muted)" }}>No items.</p> :
                  <div className="flex flex-col gap-3">
                    {(edits[cl.id] ?? []).map((edit, idx) => {
                      const orig = (items[cl.id] ?? [])[idx];
                      return (
                        <div key={idx} className="grid grid-cols-12 items-center gap-2 py-2"
                          style={{ borderBottom: "1px solid var(--border)" }}>
                          <div className="col-span-5 text-sm" style={{ color: "var(--text)" }}>
                            {orig?.name ?? orig?.checklist_item_template?.label ?? `Item ${idx + 1}`}
                          </div>
                          <div className="col-span-3">
                            <select value={edit.status} onChange={e => updateEdit(cl.id, idx, "status", e.target.value)}
                              disabled={!canUpdate} className="ui-input text-xs py-1">
                              {STATUS_OPTS.map(o => <option key={o} value={o}>{o.replace("_", " ")}</option>)}
                            </select>
                          </div>
                          <div className="col-span-4">
                            <input value={edit.comment} onChange={e => updateEdit(cl.id, idx, "comment", e.target.value)}
                              disabled={!canUpdate} placeholder="Comment…" className="ui-input text-xs py-1" />
                          </div>
                        </div>
                      );
                    })}
                    {canUpdate && (
                      <div className="flex justify-end pt-2">
                        <button onClick={() => saveItems(cl.id)} disabled={saving[cl.id]}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1"
                          style={{ background: "var(--accent)", color: "#fff" }}>
                          {saving[cl.id] && <Spinner size={3} />} Save Items
                        </button>
                      </div>
                    )}
                  </div>
                }
              </div>
            )}
          </div>
        ))
      )}

      <ModalShell isOpen={attachModal} onClose={() => setAttachModal(false)} title="Attach Checklist Templates" width="max-w-sm">
        <div className="p-6 flex flex-col gap-4">
          <Field label="Template IDs (comma-separated)" required hint="e.g. 1, 2, 3">
            <input value={attachIds} onChange={e => setAttachIds(e.target.value)} placeholder="1, 2, 3" className="ui-input text-sm" />
          </Field>
          <div className="flex gap-3 justify-end">
            <button type="button" onClick={() => setAttachModal(false)} className="px-4 py-2 rounded-xl text-sm"
              style={{ background: "var(--bg-raised)", color: "var(--text-muted)", border: "1px solid var(--border)" }}>Cancel</button>
            <button type="button" onClick={handleAttach} disabled={attaching}
              className="px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2"
              style={{ background: "var(--accent)", color: "#fff" }}>
              {attaching && <Spinner size={4} />} Attach
            </button>
          </div>
        </div>
      </ModalShell>
    </div>
  );
}

/* ─── IssueSection ───────────────────────────────────────────────────────── */
function IssueSection({ performId, config, canUpdate }) {
  const [issues, setIssues]         = useState([]);
  const [loading, setLoading]       = useState(false);
  const [modal, setModal]           = useState(null); // { type, issue? }
  const [saving, setSaving]         = useState(false);
  const [titleFilter, setTitleFilter] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = titleFilter ? { "filter[title]": titleFilter } : {};
      const res = await config.issueService.list(performId, params);
      setIssues(res.data ?? res ?? []);
    } catch { toast.error("Failed to load issues."); }
    finally { setLoading(false); }
  }, [performId, config, titleFilter]);

  useEffect(() => { load(); }, [load]);

  const PRIORITY_OPTS = ["low", "medium", "high", "critical"];
  const REPAIR_STATUS_OPTS = ["approved", "rejected"];

  // ── Issue form state ──
  const [issueForm, setIssueForm]   = useState({ title: "", description: "", corrective_action: "", priority_level: "medium", due_date: "", contractor_id: "" });
  const [issueFiles, setIssueFiles] = useState([]);
  const [issueErrors, setIssueErrors] = useState({});

  // ── Priority / due date modal ──
  const [priorityForm, setPriorityForm] = useState({ priority_level: "medium", due_date: "" });

  // ── Repair modal ──
  const [repairForm, setRepairForm]   = useState({ repair_completion_date: "", repair_completion_note: "" });
  const [repairFiles, setRepairFiles] = useState([]);

  // ── Contractor modal ──
  const [users, setUsers]           = useState([]);
  const [contractorId, setContractorId] = useState("");

  // ── Repair status modal ──
  const [repairStatus, setRepairStatus]     = useState("approved");
  const [rejectReason, setRejectReason]     = useState("");

  // ── Corrective action inline ──
  const [caEdits, setCaEdits]       = useState({});
  const [caSaving, setCaSaving]     = useState({});

  useEffect(() => {
    UsersService.list({ per_page: 200 }).then(res => {
      const all = res.data ?? res ?? [];
      setUsers(all.filter(u => (u.role?.name||u.role||"").toLowerCase().includes("contractor")).length
        ? all.filter(u => (u.role?.name||u.role||"").toLowerCase().includes("contractor")) : all);
    }).catch(() => {});
  }, []);

  function openCreate() {
    setIssueForm({ title: "", description: "", corrective_action: "", priority_level: "medium", due_date: "", contractor_id: "" });
    setIssueFiles([]); setIssueErrors({});
    setModal({ type: "create" });
  }
  function openEdit(issue) {
    setIssueForm({ title: issue.title ?? "", description: issue.description ?? "", corrective_action: issue.corrective_action ?? "", priority_level: issue.priority_level ?? "medium", due_date: issue.due_date ?? "", contractor_id: issue.contractor_id ?? "" });
    setIssueFiles([]); setIssueErrors({});
    setModal({ type: "edit", issue });
  }
  function openPriority(issue) {
    setPriorityForm({ priority_level: issue.priority_level ?? "medium", due_date: issue.due_date ?? "" });
    setModal({ type: "priority", issue });
  }
  function openRepair(issue) {
    setRepairForm({ repair_completion_date: "", repair_completion_note: "" });
    setRepairFiles([]);
    setModal({ type: "repair", issue });
  }
  function openContractor(issue) { setContractorId(issue.contractor_id?.toString() ?? ""); setModal({ type: "contractor", issue }); }
  function openRepairStatus(issue) { setRepairStatus("approved"); setRejectReason(""); setModal({ type: "repair_status", issue }); }

  function validateIssueForm() {
    const e = {};
    if (!issueForm.title.trim()) e.title = "Title is required.";
    setIssueErrors(e);
    return !Object.keys(e).length;
  }

  async function handleIssueSubmit() {
    if (!validateIssueForm()) return;
    setSaving(true);
    try {
      const data = { title: issueForm.title.trim(), description: issueForm.description||undefined, corrective_action: issueForm.corrective_action||undefined, priority_level: issueForm.priority_level, due_date: issueForm.due_date||undefined, contractor_id: issueForm.contractor_id ? Number(issueForm.contractor_id) : undefined };
      if (modal.type === "create") {
        await config.issueService.create(performId, data, issueFiles);
        toast.success("Issue created.");
      } else {
        await config.issueService.update(performId, modal.issue.id, data);
        toast.success("Issue updated.");
      }
      setModal(null); load();
    } catch (err) { toast.error(err?.response?.data?.errors?.join(", ") || err?.response?.data?.error || "Failed to save issue."); }
    finally { setSaving(false); }
  }

  async function handleDeleteIssue(issue) {
    if (!window.confirm(`Delete issue "${issue.title}"?`)) return;
    try { await config.issueService.remove(performId, issue.id); toast.success("Issue deleted."); load(); }
    catch (err) { toast.error(err?.response?.data?.error || "Failed to delete issue."); }
  }

  async function handlePriority() {
    setSaving(true);
    try {
      await config.issueService.updatePriorityDueDate(performId, modal.issue.id, priorityForm);
      toast.success("Priority updated."); setModal(null); load();
    } catch (err) { toast.error(err?.response?.data?.error || "Failed to update priority."); }
    finally { setSaving(false); }
  }

  async function handleRepair() {
    if (!repairForm.repair_completion_date) { toast.error("Completion date is required."); return; }
    setSaving(true);
    try {
      await config.issueService.repairCompletion(performId, modal.issue.id, repairForm, repairFiles);
      toast.success("Repair recorded."); setModal(null); load();
    } catch (err) { toast.error(err?.response?.data?.error || "Failed to record repair."); }
    finally { setSaving(false); }
  }

  async function handleContractor() {
    if (!contractorId) { toast.error("Select a contractor."); return; }
    setSaving(true);
    try {
      await config.issueService.assignContractor(performId, modal.issue.id, Number(contractorId));
      toast.success("Contractor assigned."); setModal(null); load();
    } catch (err) { toast.error(err?.response?.data?.error || "Failed to assign contractor."); }
    finally { setSaving(false); }
  }

  async function handleRepairStatus() {
    if (repairStatus === "rejected" && !rejectReason.trim()) { toast.error("Reject reason is required."); return; }
    setSaving(true);
    try {
      await config.issueService.setRepairStatus(performId, modal.issue.id, repairStatus, rejectReason);
      toast.success(`Repair ${repairStatus}.`); setModal(null); load();
    } catch (err) { toast.error(err?.response?.data?.error || "Failed to update repair status."); }
    finally { setSaving(false); }
  }

  async function handleSaveCA(issueId) {
    setCaSaving(p => ({ ...p, [issueId]: true }));
    try {
      await config.issueService.updateCorrectiveAction(performId, issueId, caEdits[issueId] ?? "");
      toast.success("Corrective action updated."); load();
    } catch (err) { toast.error(err?.response?.data?.error || "Failed."); }
    finally { setCaSaving(p => ({ ...p, [issueId]: false })); }
  }

  const prioColor = (p) => PRIORITY_COLORS[p] ?? { bg: "var(--bg-raised)", text: "var(--text-muted)" };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <span className="text-sm font-semibold" style={{ color: "var(--text)" }}>
          <ExclamationTriangleIcon className="h-4 w-4 inline mr-1 opacity-60" />
          Issues ({issues.length})
        </span>
        <div className="flex items-center gap-2">
          <div className="relative">
            <MagnifyingGlassIcon className="h-4 w-4 absolute left-2 top-1/2 -translate-y-1/2 opacity-50" style={{ color: "var(--text-muted)" }} />
            <input value={titleFilter} onChange={e => setTitleFilter(e.target.value)} placeholder="Filter by title…"
              className="ui-input text-xs pl-7 py-1.5" style={{ width: 180 }} />
          </div>
          {canUpdate && (
            <button onClick={openCreate}
              className="text-xs px-3 py-1.5 rounded-lg font-medium flex items-center gap-1"
              style={{ background: "var(--bg-raised)", color: "var(--accent)", border: "1px solid var(--accent)" }}>
              <PlusIcon className="h-3.5 w-3.5" /> New Issue
            </button>
          )}
        </div>
      </div>

      {loading ? <div className="flex justify-center py-8"><Spinner /></div> :
        issues.length === 0 ? (
          <div className="text-center py-8 rounded-xl" style={{ border: "1px dashed var(--border)", color: "var(--text-muted)" }}>
            No issues recorded.
          </div>
        ) : (
          issues.map(issue => (
            <div key={issue.id} className="rounded-xl p-4 flex flex-col gap-3"
              style={{ border: "1px solid var(--border)", background: "var(--bg-raised)" }}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex flex-col gap-1 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm truncate" style={{ color: "var(--text)" }}>{issue.title}</span>
                    {issue.priority_level && (
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{ background: prioColor(issue.priority_level).bg, color: prioColor(issue.priority_level).text }}>
                        {issue.priority_level}
                      </span>
                    )}
                  </div>
                  {issue.description && <p className="text-xs" style={{ color: "var(--text-muted)" }}>{issue.description}</p>}
                  {issue.due_date && <p className="text-xs" style={{ color: "var(--text-muted)" }}>Due: {issue.due_date}</p>}
                </div>
                {canUpdate && (
                  <ActionMenu actions={[
                    { label: "Edit", onClick: () => openEdit(issue) },
                    { label: "Set Priority / Due Date", onClick: () => openPriority(issue) },
                    { label: "Assign Contractor", onClick: () => openContractor(issue) },
                    { label: "Record Repair", onClick: () => openRepair(issue) },
                    { label: "Set Repair Status", onClick: () => openRepairStatus(issue) },
                    { divider: true },
                    { label: "Delete", onClick: () => handleDeleteIssue(issue), danger: true },
                  ]} />
                )}
              </div>

              {/* Corrective action inline editor */}
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>Corrective Action</label>
                <div className="flex gap-2">
                  <input
                    value={caEdits[issue.id] !== undefined ? caEdits[issue.id] : (issue.corrective_action ?? "")}
                    onChange={e => setCaEdits(p => ({ ...p, [issue.id]: e.target.value }))}
                    disabled={!canUpdate} className="ui-input text-xs flex-1 py-1"
                    placeholder="Describe corrective action…" />
                  {canUpdate && caEdits[issue.id] !== undefined && (
                    <button onClick={() => handleSaveCA(issue.id)} disabled={caSaving[issue.id]}
                      className="px-2 rounded text-xs font-medium" style={{ background: "var(--accent)", color: "#fff" }}>
                      {caSaving[issue.id] ? "…" : "Save"}
                    </button>
                  )}
                </div>
              </div>

              {/* Repair info if present */}
              {issue.repair_completion_date && (
                <div className="flex items-center gap-3 text-xs p-2 rounded-lg" style={{ background: "var(--bg-surface)", color: "var(--text-muted)" }}>
                  <span>Repair: {issue.repair_completion_date}</span>
                  {issue.repair_status && (
                    <span className="px-2 py-0.5 rounded-full font-medium"
                      style={{ background: issue.repair_status === "approved" ? "color-mix(in srgb,#3fb950 15%,transparent)" : "color-mix(in srgb,#f85149 15%,transparent)", color: issue.repair_status === "approved" ? "#3fb950" : "#f85149" }}>
                      {issue.repair_status}
                    </span>
                  )}
                </div>
              )}
            </div>
          ))
        )
      }

      {/* Issue create/edit modal */}
      <ModalShell isOpen={modal?.type === "create" || modal?.type === "edit"} onClose={() => setModal(null)}
        title={modal?.type === "create" ? "New Issue" : "Edit Issue"} width="max-w-lg">
        <div className="p-6 flex flex-col gap-4">
          <Field label="Title" required error={issueErrors.title}>
            <input value={issueForm.title} onChange={e => setIssueForm(f => ({ ...f, title: e.target.value }))} className="ui-input text-sm" placeholder="Issue title" />
          </Field>
          <Field label="Description">
            <textarea rows={3} value={issueForm.description} onChange={e => setIssueForm(f => ({ ...f, description: e.target.value }))} className="ui-input text-sm" />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Priority">
              <select value={issueForm.priority_level} onChange={e => setIssueForm(f => ({ ...f, priority_level: e.target.value }))} className="ui-input text-sm">
                {PRIORITY_OPTS.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </Field>
            <Field label="Due Date">
              <input type="date" value={issueForm.due_date} onChange={e => setIssueForm(f => ({ ...f, due_date: e.target.value }))} className="ui-input text-sm" />
            </Field>
          </div>
          <Field label="Corrective Action">
            <textarea rows={2} value={issueForm.corrective_action} onChange={e => setIssueForm(f => ({ ...f, corrective_action: e.target.value }))} className="ui-input text-sm" />
          </Field>
          {modal?.type === "create" && (
            <Field label="Attachments (optional)">
              <input type="file" multiple onChange={e => setIssueFiles(Array.from(e.target.files))}
                className="text-xs" style={{ color: "var(--text-muted)" }} />
            </Field>
          )}
          <div className="flex gap-3 justify-end">
            <button type="button" onClick={() => setModal(null)} className="px-4 py-2 rounded-xl text-sm"
              style={{ background: "var(--bg-raised)", color: "var(--text-muted)", border: "1px solid var(--border)" }}>Cancel</button>
            <button type="button" onClick={handleIssueSubmit} disabled={saving}
              className="px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2"
              style={{ background: "var(--accent)", color: "#fff" }}>
              {saving && <Spinner size={4} />} {modal?.type === "create" ? "Create" : "Save"}
            </button>
          </div>
        </div>
      </ModalShell>

      {/* Priority modal */}
      <ModalShell isOpen={modal?.type === "priority"} onClose={() => setModal(null)} title="Set Priority / Due Date" width="max-w-sm">
        <div className="p-6 flex flex-col gap-4">
          <Field label="Priority">
            <select value={priorityForm.priority_level} onChange={e => setPriorityForm(f => ({ ...f, priority_level: e.target.value }))} className="ui-input text-sm">
              {PRIORITY_OPTS.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </Field>
          <Field label="Due Date">
            <input type="date" value={priorityForm.due_date} onChange={e => setPriorityForm(f => ({ ...f, due_date: e.target.value }))} className="ui-input text-sm" />
          </Field>
          <div className="flex gap-3 justify-end">
            <button type="button" onClick={() => setModal(null)} className="px-4 py-2 rounded-xl text-sm"
              style={{ background: "var(--bg-raised)", color: "var(--text-muted)", border: "1px solid var(--border)" }}>Cancel</button>
            <button type="button" onClick={handlePriority} disabled={saving}
              className="px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2"
              style={{ background: "var(--accent)", color: "#fff" }}>
              {saving && <Spinner size={4} />} Save
            </button>
          </div>
        </div>
      </ModalShell>

      {/* Repair modal */}
      <ModalShell isOpen={modal?.type === "repair"} onClose={() => setModal(null)} title="Record Repair Completion" width="max-w-sm">
        <div className="p-6 flex flex-col gap-4">
          <Field label="Completion Date" required>
            <input type="date" value={repairForm.repair_completion_date} onChange={e => setRepairForm(f => ({ ...f, repair_completion_date: e.target.value }))} className="ui-input text-sm" />
          </Field>
          <Field label="Completion Note">
            <textarea rows={3} value={repairForm.repair_completion_note} onChange={e => setRepairForm(f => ({ ...f, repair_completion_note: e.target.value }))} className="ui-input text-sm" />
          </Field>
          <Field label="Repair Attachments (optional)">
            <input type="file" multiple onChange={e => setRepairFiles(Array.from(e.target.files))} className="text-xs" style={{ color: "var(--text-muted)" }} />
          </Field>
          <div className="flex gap-3 justify-end">
            <button type="button" onClick={() => setModal(null)} className="px-4 py-2 rounded-xl text-sm"
              style={{ background: "var(--bg-raised)", color: "var(--text-muted)", border: "1px solid var(--border)" }}>Cancel</button>
            <button type="button" onClick={handleRepair} disabled={saving}
              className="px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2"
              style={{ background: "var(--accent)", color: "#fff" }}>
              {saving && <Spinner size={4} />} Record Repair
            </button>
          </div>
        </div>
      </ModalShell>

      {/* Contractor modal */}
      <ModalShell isOpen={modal?.type === "contractor"} onClose={() => setModal(null)} title="Assign Contractor" width="max-w-sm">
        <div className="p-6 flex flex-col gap-4">
          <Field label="Contractor" required>
            <select value={contractorId} onChange={e => setContractorId(e.target.value)} className="ui-input text-sm">
              <option value="">— Select —</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.firstname} {u.lastname}</option>)}
            </select>
          </Field>
          <div className="flex gap-3 justify-end">
            <button type="button" onClick={() => setModal(null)} className="px-4 py-2 rounded-xl text-sm"
              style={{ background: "var(--bg-raised)", color: "var(--text-muted)", border: "1px solid var(--border)" }}>Cancel</button>
            <button type="button" onClick={handleContractor} disabled={saving}
              className="px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2"
              style={{ background: "var(--accent)", color: "#fff" }}>
              {saving && <Spinner size={4} />} Assign
            </button>
          </div>
        </div>
      </ModalShell>

      {/* Repair status modal */}
      <ModalShell isOpen={modal?.type === "repair_status"} onClose={() => setModal(null)} title="Set Repair Status" width="max-w-sm">
        <div className="p-6 flex flex-col gap-4">
          <Field label="Status" required>
            <select value={repairStatus} onChange={e => setRepairStatus(e.target.value)} className="ui-input text-sm">
              {REPAIR_STATUS_OPTS.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </Field>
          {repairStatus === "rejected" && (
            <Field label="Reject Reason" required>
              <textarea rows={3} value={rejectReason} onChange={e => setRejectReason(e.target.value)} className="ui-input text-sm" placeholder="Why is the repair rejected?" />
            </Field>
          )}
          <div className="flex gap-3 justify-end">
            <button type="button" onClick={() => setModal(null)} className="px-4 py-2 rounded-xl text-sm"
              style={{ background: "var(--bg-raised)", color: "var(--text-muted)", border: "1px solid var(--border)" }}>Cancel</button>
            <button type="button" onClick={handleRepairStatus} disabled={saving}
              className="px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2"
              style={{ background: repairStatus === "approved" ? "var(--success,#22c55e)" : "var(--danger)", color: "#fff" }}>
              {saving && <Spinner size={4} />} Confirm
            </button>
          </div>
        </div>
      </ModalShell>
    </div>
  );
}

/* ─── PerformDetail ──────────────────────────────────────────────────────── */
function PerformDetail({ perform, onBack, config, canUpdate }) {
  const [tab, setTab]             = useState("checklists");
  const [signOffModal, setSignOff] = useState(false);
  const [currentPerform, setCurrent] = useState(perform);

  async function refreshPerform() {
    try {
      const res = await config.performService.get(perform.id);
      setCurrent(res.data ?? res);
    } catch {}
  }

  const isSignedOff = Boolean(currentPerform?.signed_off_at);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <button onClick={onBack} className="flex items-center gap-2 text-sm font-medium hover:opacity-80"
          style={{ color: "var(--accent)" }}>← Back</button>
        <div className="flex items-center gap-3">
          {isSignedOff ? (
            <span className="flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg"
              style={{ background: "color-mix(in srgb,#3fb950 15%,transparent)", color: "#3fb950" }}>
              <CheckBadgeIcon className="h-4 w-4" /> Signed Off
            </span>
          ) : canUpdate && (
            <button onClick={() => setSignOff(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-semibold"
              style={{ background: "var(--success,#22c55e)", color: "#fff" }}>
              <CheckBadgeIcon className="h-4 w-4" /> Sign Off
            </button>
          )}
        </div>
      </div>

      <div className="ui-card" style={{ padding: "20px" }}>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
          <div><span className="text-xs opacity-60">Date</span><br /><strong>{currentPerform?.date ?? "—"}</strong></div>
          <div><span className="text-xs opacity-60">Time</span><br /><strong>{currentPerform?.time ?? "—"}</strong></div>
          <div><span className="text-xs opacity-60">Note</span><br /><span style={{ color: "var(--text-muted)" }}>{currentPerform?.note ?? "—"}</span></div>
          {isSignedOff && <>
            <div><span className="text-xs opacity-60">Signed Off At</span><br /><strong>{currentPerform?.signed_off_at?.slice(0, 16).replace("T", " ")}</strong></div>
            <div><span className="text-xs opacity-60">Signed Off Note</span><br /><span style={{ color: "var(--text-muted)" }}>{currentPerform?.signed_off_note ?? "—"}</span></div>
          </>}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl" style={{ background: "var(--bg-raised)" }}>
        {[["checklists", "Checklists"], ["issues", "Issues"]].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)} className="flex-1 text-sm font-medium py-2 rounded-lg transition-all"
            style={{ background: tab === key ? "var(--bg-surface)" : "transparent", color: tab === key ? "var(--text)" : "var(--text-muted)", boxShadow: tab === key ? "0 1px 4px rgba(0,0,0,.1)" : "none" }}>
            {label}
          </button>
        ))}
      </div>

      <div className="ui-card" style={{ padding: "20px" }}>
        {tab === "checklists" && <ChecklistSection performId={currentPerform?.id} config={config} canUpdate={canUpdate && !isSignedOff} />}
        {tab === "issues"     && <IssueSection     performId={currentPerform?.id} config={config} canUpdate={canUpdate} />}
      </div>

      <SignOffModal isOpen={signOffModal} onClose={() => setSignOff(false)} performId={currentPerform?.id} config={config}
        onSaved={refreshPerform} />
    </div>
  );
}

/* ─── Main GenericInspectionInterface ────────────────────────────────────── */
export default function GenericInspectionInterface({ config }) {
  const dispatch      = useAppDispatch();
  const { hasPermission } = useAuth();
  const { setupSlice } = config;

  const setups       = useAppSelector(setupSlice.selectSetups);
  const meta         = useAppSelector(setupSlice.selectMeta);
  const loading      = useAppSelector(setupSlice.selectLoading);
  const error        = useAppSelector(setupSlice.selectError);
  const actionError  = useAppSelector(setupSlice.selectActionError);
  const filters      = useAppSelector(setupSlice.selectFilters);

  const canCreate    = hasPermission(`${config.permPrefix}.create`);
  const canUpdate    = hasPermission(`${config.permPrefix}.update`);
  const canDelete    = hasPermission(`${config.permPrefix}.destroy`);
  const canViewPerform = hasPermission(`${config.performPermPrefix}.index`);
  const canUpdatePerform = hasPermission(`${config.performPermPrefix}.update`);

  const [users, setUsers]             = useState([]);
  const [catalogItems] = useState([]);
  const [setupModal, setSetupModal]   = useState(false);
  const [editSetup, setEditSetup]     = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting]       = useState(false);
  const [reassign, setReassign]       = useState(null); // { setupId, mode }
  const [performs, setPerforms]       = useState([]);
  const [performsLoading, setPerformsLoading] = useState(false);
  const [selectedSetup, setSelectedSetup] = useState(null);
  const [selectedPerform, setSelectedPerform] = useState(null);
  const [performModal, setPerformModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    dispatch(setupSlice.fetchAction());
    UsersService.list({ per_page: 200 }).then(r => setUsers(r.data ?? r ?? [])).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { dispatch(setupSlice.fetchAction()); }, [filters, dispatch]);  // eslint-disable-line react-hooks/exhaustive-deps

  async function loadPerforms(setup) {
    setSelectedSetup(setup);
    setPerformsLoading(true);
    try {
      const res = await config.performService.list(setup.id);
      setPerforms(res.data ?? res ?? []);
    } catch { toast.error("Failed to load executions."); }
    finally { setPerformsLoading(false); }
  }

  async function handleDeleteSetup() {
    if (!deleteTarget) return;
    setDeleting(true);
    const result = await dispatch(setupSlice.deleteAction(deleteTarget.id));
    if (setupSlice.deleteAction.fulfilled.match(result)) {
      toast.success("Inspection deleted.");
      if (selectedSetup?.id === deleteTarget.id) { setSelectedSetup(null); setSelectedPerform(null); }
    } else { toast.error(result.payload || "Failed to delete."); }
    setDeleting(false);
    setDeleteTarget(null);
  }

  function handleFilterChange(key, val) {
    if (setupSlice.filterActions?.[key]) dispatch(setupSlice.filterActions[key](val));
  }

  // ── View: perform detail ──
  if (selectedPerform) {
    return (
      <PerformDetail perform={selectedPerform} config={config} canUpdate={canUpdatePerform}
        onBack={() => setSelectedPerform(null)} />
    );
  }

  // ── View: setup detail (performs list) ──
  if (selectedSetup) {
    return (
      <div className="flex flex-col gap-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <button onClick={() => setSelectedSetup(null)} className="text-sm hover:opacity-80" style={{ color: "var(--accent)" }}>← Back</button>
            <h2 className="text-xl font-bold mt-1" style={{ color: "var(--text)" }}>{selectedSetup.name}</h2>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>{selectedSetup.location} • {selectedSetup.date}</p>
          </div>
          {canUpdatePerform && (
            <button onClick={() => setPerformModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
              style={{ background: "var(--accent)", color: "#fff" }}>
              <PlusIcon className="h-4 w-4" /> Log Execution
            </button>
          )}
        </div>

        <div className="ui-card" style={{ padding: 0, overflow: "hidden" }}>
          {performsLoading ? (
            <div className="flex justify-center py-12"><Spinner /></div>
          ) : performs.length === 0 ? (
            <div className="text-center py-12" style={{ color: "var(--text-muted)" }}>No executions yet.</div>
          ) : (
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr style={{ background: "var(--bg-raised)", color: "var(--text-muted)" }}>
                  <th className="text-left px-4 py-3 text-xs font-semibold">Date</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold">Time</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold">Status</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {performs.map((p, i) => (
                  <tr key={p.id} style={{ borderBottom: "1px solid var(--border)", background: i % 2 === 0 ? "transparent" : "color-mix(in srgb,var(--bg-raised) 50%,transparent)" }}>
                    <td className="px-4 py-3 font-medium" style={{ color: "var(--text)" }}>{p.date}</td>
                    <td className="px-4 py-3" style={{ color: "var(--text-muted)" }}>{p.time}</td>
                    <td className="px-4 py-3">
                      {p.signed_off_at ? (
                        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium"
                          style={{ background: "color-mix(in srgb,#3fb950 15%,transparent)", color: "#3fb950" }}>
                          <CheckBadgeIcon className="h-3.5 w-3.5" /> Signed Off
                        </span>
                      ) : (
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "color-mix(in srgb,#d29922 15%,transparent)", color: "#d29922" }}>Pending</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {canViewPerform && (
                        <button onClick={() => setSelectedPerform(p)}
                          className="text-xs font-medium hover:opacity-80" style={{ color: "var(--accent)" }}>Open →</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <PerformFormModal isOpen={performModal} onClose={() => setPerformModal(false)} setupId={selectedSetup.id} config={config}
          onSaved={() => loadPerforms(selectedSetup)} />
      </div>
    );
  }

  // ── View: main setup list ──
  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>{config.title}</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>
            {meta?.total ?? "—"} inspection setup{meta?.total !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => dispatch(setupSlice.fetchAction())}
            className="p-2 rounded-lg hover:opacity-80" style={{ color: "var(--text-muted)" }} title="Refresh">
            <ArrowPathIcon className="h-5 w-5" />
          </button>
          <button onClick={() => setShowFilters(f => !f)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium"
            style={{ background: "var(--bg-raised)", color: "var(--text-muted)", border: "1px solid var(--border)" }}>
            <FunnelIcon className="h-4 w-4" /> Filters
          </button>
          {canCreate && (
            <button onClick={() => { setEditSetup(null); setSetupModal(true); }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
              style={{ background: "var(--accent)", color: "#fff" }}>
              <PlusIcon className="h-4 w-4" /> New Inspection
            </button>
          )}
        </div>
      </div>

      {/* Filters panel */}
      {showFilters && (
        <div className="ui-card flex flex-wrap gap-4 items-end" style={{ padding: "16px 20px" }}>
          <Field label="From Date">
            <input type="date" value={filters.date_from ?? ""} onChange={e => handleFilterChange("date_from", e.target.value)} className="ui-input text-sm py-1.5" />
          </Field>
          <Field label="To Date">
            <input type="date" value={filters.date_to ?? ""} onChange={e => handleFilterChange("date_to", e.target.value)} className="ui-input text-sm py-1.5" />
          </Field>
          {(config.extraFilterFields ?? []).map(f => (
            <Field key={f.key} label={f.label}>
              <input type={f.type ?? "text"} value={filters[f.key] ?? ""} onChange={e => handleFilterChange(f.key, e.target.value)}
                placeholder={f.label} className="ui-input text-sm py-1.5" />
            </Field>
          ))}
          <button onClick={() => dispatch(setupSlice.clearFiltersAction())}
            className="px-3 py-1.5 rounded-lg text-xs font-medium"
            style={{ background: "var(--bg-raised)", color: "var(--text-muted)", border: "1px solid var(--border)" }}>Clear</button>
        </div>
      )}

      {/* Errors */}
      {(error || actionError) && (
        <div className="text-sm px-3 py-2 rounded-lg" style={{ background: "color-mix(in srgb,var(--danger) 12%,transparent)", color: "var(--danger)" }}>
          {error || actionError}
        </div>
      )}

      {/* Table */}
      <div className="ui-card flex flex-col gap-0" style={{ padding: 0, overflow: "hidden" }}>
        {loading ? (
          <div className="flex justify-center py-16"><Spinner /></div>
        ) : setups.length === 0 ? (
          <div className="text-center py-16" style={{ color: "var(--text-muted)" }}>
            No inspection setups found.
            {canCreate && <div className="mt-2"><button onClick={() => setSetupModal(true)} className="text-sm underline" style={{ color: "var(--accent)" }}>Create one</button></div>}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr style={{ background: "var(--bg-raised)", color: "var(--text-muted)" }}>
                    <th className="text-left px-4 py-3 text-xs font-semibold">Name</th>
                    {(config.extraSetupFields ?? []).map(f => (
                      <th key={f.key} className="text-left px-4 py-3 text-xs font-semibold">{f.label}</th>
                    ))}
                    <th className="text-left px-4 py-3 text-xs font-semibold">Location</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold">Date</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold">Safety Officer</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold">Supervisor</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {setups.map((s, i) => (
                    <tr key={s.id} style={{ borderBottom: "1px solid var(--border)", background: i % 2 === 0 ? "transparent" : "color-mix(in srgb,var(--bg-raised) 50%,transparent)" }}>
                      <td className="px-4 py-3">
                        <button onClick={() => loadPerforms(s)} className="font-semibold text-sm hover:underline text-left" style={{ color: "var(--accent)" }}>{s.name}</button>
                      </td>
                      {(config.extraSetupFields ?? []).map(f => (
                        <td key={f.key} className="px-4 py-3 text-sm" style={{ color: "var(--text-muted)" }}>{s[f.key] ?? "—"}</td>
                      ))}
                      <td className="px-4 py-3 text-sm" style={{ color: "var(--text-muted)" }}>{s.location ?? "—"}</td>
                      <td className="px-4 py-3 text-sm" style={{ color: "var(--text-muted)" }}>{s.date ?? "—"}</td>
                      <td className="px-4 py-3 text-sm" style={{ color: "var(--text-muted)" }}>
                        {s.safety_officer ? `${s.safety_officer.firstname} ${s.safety_officer.lastname}` : "—"}
                      </td>
                      <td className="px-4 py-3 text-sm" style={{ color: "var(--text-muted)" }}>
                        {s.supervisor ? `${s.supervisor.firstname} ${s.supervisor.lastname}` : "—"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <ActionMenu actions={[
                          { label: "View Executions", onClick: () => loadPerforms(s) },
                          ...(canUpdate ? [
                            { label: "Edit", onClick: () => { setEditSetup(s); setSetupModal(true); } },
                            { label: "Reassign Supervisor", onClick: () => setReassign({ setupId: s.id, mode: "supervisor" }) },
                            { label: "Reassign Safety Officer", onClick: () => setReassign({ setupId: s.id, mode: "safety_officer" }) },
                          ] : []),
                          ...(canDelete ? [
                            { divider: true },
                            { label: "Delete", onClick: () => setDeleteTarget(s), danger: true },
                          ] : []),
                        ]} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination meta={meta} onPage={p => dispatch(setupSlice.setPageAction(p))} />
          </>
        )}
      </div>

      {/* Modals */}
      <SetupFormModal isOpen={setupModal} onClose={() => setSetupModal(false)} setup={editSetup}
        users={users} catalogItems={catalogItems} config={config} />
      <ReassignModal isOpen={Boolean(reassign)} onClose={() => setReassign(null)}
        mode={reassign?.mode} setupId={reassign?.setupId} users={users} config={config} />
      <DeleteConfirmModal isOpen={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteSetup} label={deleteTarget?.name} loading={deleting} />
    </div>
  );
}
