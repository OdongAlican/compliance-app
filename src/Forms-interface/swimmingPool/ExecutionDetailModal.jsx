/* ── Swimming Pool Inspection — ExecutionDetailModal ──────────────────── */
import { useState, useEffect, useCallback, useRef } from "react";
import ReactDOM from "react-dom";
import {
  XMarkIcon,
  PaperClipIcon,
  PlusIcon,
  ExclamationTriangleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  CalendarDaysIcon,
  UserIcon,
  WrenchScrewdriverIcon,
  CheckBadgeIcon,
  ClipboardDocumentListIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import {
  SwimmingPoolPerformService,
  SwimmingPoolChecklistItemService,
  SwimmingPoolIssueService,
} from "../../services/swimmingPool.service";
import { CHECKLIST_STATUS_OPTIONS } from "./constants";
import { Spinner } from "./shared";
import moment from "moment";

/* ── Local constants ──────────────────────────────────────────────────── */
const PRIORITY_OPTIONS = ["low", "medium", "high"];

const PRIORITY_COLOR = {
  low: { bg: "color-mix(in srgb,#3fb950 12%,transparent)", text: "#3fb950" },
  medium: { bg: "color-mix(in srgb,#d29922 12%,transparent)", text: "#d29922" },
  high: { bg: "color-mix(in srgb,#e36209 12%,transparent)", text: "#e36209" },
};

const REPAIR_STATUS_COLOR = {
  pending: { bg: "color-mix(in srgb,#d29922 12%,transparent)", text: "#d29922" },
  approved: { bg: "color-mix(in srgb,#3fb950 12%,transparent)", text: "#3fb950" },
  rejected: {
    bg: "color-mix(in srgb,var(--danger) 12%,transparent)",
    text: "var(--danger)",
  },
};

/* ── ReadOnlyAttachmentList ───────────────────────────────────────────── */
function ReadOnlyAttachmentList({ attachments = [] }) {
  if (attachments.length === 0)
    return (
      <p className="text-xs py-2" style={{ color: "var(--text-muted)" }}>
        No attachments.
      </p>
    );
  return (
    <div className="flex flex-col gap-1.5">
      {attachments.map((a) => (
        <div
          key={a.id}
          className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg"
          style={{ background: "var(--bg)", border: "1px solid var(--border)" }}
        >
          <PaperClipIcon
            className="h-3.5 w-3.5 flex-shrink-0"
            style={{ color: "var(--text-muted)" }}
          />
          <a
            href={a.file_url ?? a.url}
            target="_blank"
            rel="noreferrer"
            className="text-xs truncate"
            style={{ color: "var(--accent)" }}
          >
            {a.file_name ?? a.file_path ?? `Attachment #${a.id}`}
          </a>
        </div>
      ))}
    </div>
  );
}

/* ── AddIssueForm ─────────────────────────────────────────────────────── */
function AddIssueForm({ performId, onCreated }) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    correctiveAction: "",
  });
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.title.trim()) {
      setErrors({ title: "Title is required." });
      return;
    }
    setErrors({});
    setLoading(true);
    try {
      const res = await SwimmingPoolIssueService.create(performId, form, files);
      const created = res.data?.data ?? res.data ?? res;
      toast.success("Issue added.");
      setForm({ title: "", description: "", correctiveAction: "" });
      setFiles([]);
      onCreated(created);
    } catch {
      toast.error("Failed to add issue.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="p-4 rounded-xl flex flex-col gap-3"
      style={{ background: "var(--bg-raised)", border: "1px solid var(--border)" }}
    >
      <p
        className="text-xs font-bold uppercase tracking-wider"
        style={{ color: "var(--text-muted)" }}
      >
        Add New Issue
      </p>

      <div>
        <label className="text-xs font-medium block mb-1" style={{ color: "var(--text-muted)" }}>
          Title <span style={{ color: "var(--danger)" }}>*</span>
        </label>
        <input
          value={form.title}
          onChange={(e) => {
            setForm((f) => ({ ...f, title: e.target.value }));
            setErrors({});
          }}
          placeholder="Brief description…"
          className="ui-input text-sm w-full"
        />
        {errors.title && (
          <p className="text-xs mt-0.5" style={{ color: "var(--danger)" }}>
            {errors.title}
          </p>
        )}
      </div>

      <div>
        <label className="text-xs font-medium block mb-1" style={{ color: "var(--text-muted)" }}>
          Description
        </label>
        <textarea
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          rows={2}
          placeholder="Detailed description… (optional)"
          className="ui-input text-sm resize-none w-full"
        />
      </div>

      <div>
        <label className="text-xs font-medium block mb-1" style={{ color: "var(--text-muted)" }}>
          Corrective Action
        </label>
        <input
          value={form.correctiveAction}
          onChange={(e) => setForm((f) => ({ ...f, correctiveAction: e.target.value }))}
          placeholder="Recommended action… (optional)"
          className="ui-input text-sm w-full"
        />
      </div>

      <div>
        <label className="text-xs font-medium block mb-1" style={{ color: "var(--text-muted)" }}>
          Attachments
        </label>
        <div className="flex flex-wrap gap-1.5 mb-1.5">
          {files.map((f, i) => (
            <span
              key={i}
              className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
              style={{
                background: "color-mix(in srgb,var(--accent) 10%,transparent)",
                color: "var(--accent)",
              }}
            >
              {f.name}
              <button
                type="button"
                onClick={() => setFiles((prev) => prev.filter((_, j) => j !== i))}
              >
                <XMarkIcon className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
        <label
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg cursor-pointer hover:opacity-80 text-xs"
          style={{
            background: "var(--bg)",
            border: "1px dashed var(--border)",
            color: "var(--text-muted)",
          }}
        >
          <PaperClipIcon className="h-3.5 w-3.5" />
          Attach file…
          <input
            type="file"
            multiple
            className="hidden"
            onChange={(e) => setFiles((prev) => [...prev, ...Array.from(e.target.files || [])])}
          />
        </label>
      </div>

      <div className="flex justify-end pt-1">
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold"
          style={{ background: "var(--accent)", color: "#fff" }}
        >
          {loading && <Spinner size={3} />}
          <PlusIcon className="h-3.5 w-3.5" />
          Add Issue
        </button>
      </div>
    </form>
  );
}

/* ── IssueCard ────────────────────────────────────────────────────────── */
function IssueCard({ issue: initialIssue, performId, onUpdated }) {
  const [issue, setIssue] = useState(initialIssue);
  const [expanded, setExpanded] = useState(false);
  const [activeSection, setActiveSection] = useState(null);
  const [loading, setLoading] = useState(false);

  const [caForm, setCaForm] = useState({ description: issue.corrective_action?.description ?? "" });
  const [priorityForm, setPriorityForm] = useState({
    priority: issue.priority ?? "",
    due_date: issue.due_date ?? "",
  });
  const [contractorForm, setContractorForm] = useState({
    contractor: issue.contractor ?? "",
  });
  const [repairForm, setRepairForm] = useState({
    repair_completion: issue.repair_completion ?? "",
    repair_notes: issue.repair_notes ?? "",
  });
  const [repairStatusForm, setRepairStatusForm] = useState({ status: "" });

  useEffect(() => {
    setIssue(initialIssue);
    setCaForm({ description: initialIssue.corrective_action?.description ?? "" });
    setPriorityForm({
      priority: initialIssue.priority ?? "",
      due_date: initialIssue.due_date ?? "",
    });
    setContractorForm({ contractor: initialIssue.contractor ?? "" });
    setRepairForm({
      repair_completion: initialIssue.repair_completion ?? "",
      repair_notes: initialIssue.repair_notes ?? "",
    });
    setRepairStatusForm({ status: "" });
  }, [initialIssue]);

  async function save(fn) {
    setLoading(true);
    try {
      const res = await fn();
      const updated = res.data?.data ?? res.data ?? res;
      setIssue(updated);
      onUpdated?.(updated);
      setActiveSection(null);
    } catch {
      toast.error("Failed to save.");
    } finally {
      setLoading(false);
    }
  }

  const actionButtons = [
    { key: "ca", label: "Corrective Action", icon: ClipboardDocumentListIcon },
    { key: "priority", label: "Priority / Due Date", icon: CalendarDaysIcon },
    { key: "contractor", label: "Assign Contractor", icon: UserIcon },
    { key: "repair", label: "Repair Completion", icon: WrenchScrewdriverIcon },
    { key: "status", label: "Set Repair Status", icon: CheckBadgeIcon },
    { key: "attach", label: "Attachments", icon: PaperClipIcon },
  ];

  const pc = PRIORITY_COLOR[issue.priority];
  const rs = REPAIR_STATUS_COLOR[issue.repair_status];

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ border: "1px solid var(--border)" }}
    >
      {/* Header */}
      <button
        type="button"
        onClick={() => setExpanded((p) => !p)}
        className="w-full flex items-start gap-3 p-4 text-left hover:opacity-90"
        style={{ background: "var(--bg-raised)" }}
      >
        <ExclamationTriangleIcon
          className="h-4 w-4 flex-shrink-0 mt-0.5"
          style={{ color: "var(--danger)" }}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>
              {issue.title}
            </p>
            {issue.priority && pc && (
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{ background: pc.bg, color: pc.text }}
              >
                {issue.priority.toUpperCase()}
              </span>
            )}
            {issue.repair_status && rs && (
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{ background: rs.bg, color: rs.text }}
              >
                {issue.repair_status.charAt(0).toUpperCase() + issue.repair_status.slice(1)}
              </span>
            )}
          </div>
          {issue.description && (
            <p
              className="text-xs mt-0.5 line-clamp-2"
              style={{ color: "var(--text-muted)" }}
            >
              {issue.description}
            </p>
          )}
        </div>
        {expanded ? (
          <ChevronUpIcon className="h-4 w-4 flex-shrink-0" style={{ color: "var(--text-muted)" }} />
        ) : (
          <ChevronDownIcon className="h-4 w-4 flex-shrink-0" style={{ color: "var(--text-muted)" }} />
        )}
      </button>

      {expanded && (
        <div className="px-4 pb-4 pt-0" style={{ background: "var(--bg)" }}>
          {/* Action buttons */}
          <div className="flex flex-wrap gap-1.5 pt-3 pb-3">
            {actionButtons.map(({ key, label, icon: Icon }) => {
              const isActive = activeSection === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setActiveSection((p) => (p === key ? null : key))}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium"
                  style={{
                    background: isActive
                      ? "color-mix(in srgb,var(--accent) 12%,transparent)"
                      : "var(--bg-raised)",
                    color: isActive ? "var(--accent)" : "var(--text-muted)",
                    border: isActive
                      ? "1px solid color-mix(in srgb,var(--accent) 30%,transparent)"
                      : "1px solid var(--border)",
                  }}
                >
                  <Icon className="h-3 w-3" />
                  {label}
                </button>
              );
            })}
          </div>

          {/* Section panels */}
          {activeSection === "ca" && (
            <div className="flex flex-col gap-2 mt-2">
              <p className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
                Corrective Action
              </p>
              <textarea
                value={caForm.description}
                onChange={(e) => setCaForm({ description: e.target.value })}
                rows={3}
                className="ui-input text-sm resize-none"
                placeholder="Describe corrective action…"
              />
              <button
                type="button"
                disabled={loading}
                onClick={() =>
                  save(() =>
                    SwimmingPoolIssueService.updateCorrectiveAction(
                      performId,
                      issue.id,
                      caForm
                    )
                  )
                }
                className="self-end px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5"
                style={{ background: "var(--accent)", color: "#fff" }}
              >
                {loading && <Spinner size={3} />} Save
              </button>
            </div>
          )}

          {activeSection === "priority" && (
            <div className="flex flex-col gap-2 mt-2">
              <p className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
                Priority &amp; Due Date
              </p>
              <div className="flex gap-2">
                <select
                  value={priorityForm.priority}
                  onChange={(e) =>
                    setPriorityForm((f) => ({ ...f, priority: e.target.value }))
                  }
                  className="ui-input text-sm flex-1"
                >
                  <option value="">Select priority…</option>
                  {PRIORITY_OPTIONS.map((p) => (
                    <option key={p} value={p}>
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                    </option>
                  ))}
                </select>
                <input
                  type="date"
                  value={priorityForm.due_date}
                  onChange={(e) =>
                    setPriorityForm((f) => ({ ...f, due_date: e.target.value }))
                  }
                  className="ui-input text-sm flex-1"
                />
              </div>
              <button
                type="button"
                disabled={loading}
                onClick={() =>
                  save(() =>
                    SwimmingPoolIssueService.updatePriorityDueDate(
                      performId,
                      issue.id,
                      priorityForm
                    )
                  )
                }
                className="self-end px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5"
                style={{ background: "var(--accent)", color: "#fff" }}
              >
                {loading && <Spinner size={3} />} Save
              </button>
            </div>
          )}

          {activeSection === "contractor" && (
            <div className="flex flex-col gap-2 mt-2">
              <p className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
                Assign Contractor
              </p>
              <input
                value={contractorForm.contractor}
                onChange={(e) =>
                  setContractorForm({ contractor: e.target.value })
                }
                placeholder="Contractor name or company…"
                className="ui-input text-sm"
              />
              <button
                type="button"
                disabled={loading}
                onClick={() =>
                  save(() =>
                    SwimmingPoolIssueService.assignContractor(
                      performId,
                      issue.id,
                      contractorForm
                    )
                  )
                }
                className="self-end px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5"
                style={{ background: "var(--accent)", color: "#fff" }}
              >
                {loading && <Spinner size={3} />} Save
              </button>
            </div>
          )}

          {activeSection === "repair" && (
            <div className="flex flex-col gap-2 mt-2">
              <p className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
                Repair Completion
              </p>
              <input
                type="date"
                value={repairForm.repair_completion}
                onChange={(e) =>
                  setRepairForm((f) => ({ ...f, repair_completion: e.target.value }))
                }
                className="ui-input text-sm"
              />
              <textarea
                value={repairForm.repair_notes}
                onChange={(e) =>
                  setRepairForm((f) => ({ ...f, repair_notes: e.target.value }))
                }
                rows={2}
                placeholder="Repair notes… (optional)"
                className="ui-input text-sm resize-none"
              />
              <button
                type="button"
                disabled={loading}
                onClick={() =>
                  save(() =>
                    SwimmingPoolIssueService.repairCompletion(
                      performId,
                      issue.id,
                      repairForm
                    )
                  )
                }
                className="self-end px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5"
                style={{ background: "var(--accent)", color: "#fff" }}
              >
                {loading && <Spinner size={3} />} Save
              </button>
            </div>
          )}

          {activeSection === "status" && (
            <div className="flex flex-col gap-2 mt-2">
              <p className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
                Set Repair Status
              </p>
              <div className="flex gap-2">
                {["approved", "rejected"].map((s) => {
                  const c = REPAIR_STATUS_COLOR[s];
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setRepairStatusForm({ status: s })}
                      className="flex-1 py-2 rounded-lg text-xs font-semibold"
                      style={{
                        background:
                          repairStatusForm.status === s ? c.bg : "var(--bg-raised)",
                        color:
                          repairStatusForm.status === s ? c.text : "var(--text-muted)",
                        border:
                          repairStatusForm.status === s
                            ? `1.5px solid ${c.text}`
                            : "1px solid var(--border)",
                      }}
                    >
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </button>
                  );
                })}
              </div>
              <button
                type="button"
                disabled={loading || !repairStatusForm.status}
                onClick={() =>
                  save(() =>
                    SwimmingPoolIssueService.setRepairStatus(
                      performId,
                      issue.id,
                      repairStatusForm
                    )
                  )
                }
                className="self-end px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5"
                style={{
                  background:
                    repairStatusForm.status ? "var(--accent)" : "var(--bg-raised)",
                  color: repairStatusForm.status ? "#fff" : "var(--text-muted)",
                }}
              >
                {loading && <Spinner size={3} />} Confirm
              </button>
            </div>
          )}

          {activeSection === "attach" && (
            <div className="mt-2">
              <ReadOnlyAttachmentList
                attachments={issue.swimming_pool_inspection_issue_attachments ?? []}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── ChecklistSection ─────────────────────────────────────────────────── */
function ChecklistSection({ performId, isActive }) {
  const [loading, setLoading] = useState(false);
  const [checklists, setChecklists] = useState([]);
  const [saving, setSaving] = useState({});
  const [local, setLocal] = useState({});
  const loaded = useRef(false);

  const load = useCallback(async () => {
    if (loaded.current) return;
    loaded.current = true;
    setLoading(true);
    try {
      const res = await SwimmingPoolPerformService.get(performId, {
        include: "checklists",
      });
      const data = res.data?.data ?? res.data ?? res;
      const pcs = data.performed_swimming_pool_checklists ?? [];
      setChecklists(pcs);
      const init = {};
      pcs.forEach((pc) => {
        init[pc.id] = {};
        (pc.performed_swimming_pool_checklist_items ?? []).forEach((pci) => {
          init[pc.id][pci.checklist_item_template_id ?? pci.id] = {
            value: pci.value ?? "satisfactory",
            comment: pci.comment ?? "",
            pciId: pci.id,
          };
        });
      });
      setLocal(init);
    } catch {
      toast.error("Failed to load checklists.");
    } finally {
      setLoading(false);
    }
  }, [performId]);

  useEffect(() => {
    if (isActive) load();
  }, [isActive, load]);

  function setItemLocal(pcId, key, field, val) {
    setLocal((prev) => ({
      ...prev,
      [pcId]: {
        ...prev[pcId],
        [key]: { ...prev[pcId]?.[key], [field]: val },
      },
    }));
  }

  async function saveChecklist(pc) {
    const pcLocal = local[pc.id] || {};
    const items = (pc.performed_swimming_pool_checklist_items ?? []).map((pci) => {
      const key = pci.checklist_item_template_id ?? pci.id;
      const l = pcLocal[key] ?? {};
      return {
        id: pci.id,
        value: l.value ?? pci.value ?? "satisfactory",
        comment: l.comment ?? pci.comment ?? undefined,
      };
    });

    setSaving((s) => ({ ...s, [pc.id]: true }));
    try {
      await SwimmingPoolChecklistItemService.upsert(performId, pc.id, items);
      toast.success("Checklist saved.");
    } catch {
      toast.error("Failed to save checklist.");
    } finally {
      setSaving((s) => ({ ...s, [pc.id]: false }));
    }
  }

  if (loading)
    return (
      <div className="flex justify-center py-10">
        <Spinner />
      </div>
    );
  if (checklists.length === 0)
    return (
      <p className="text-xs text-center py-8" style={{ color: "var(--text-muted)" }}>
        No checklist data recorded for this execution.
      </p>
    );

  return (
    <div className="flex flex-col gap-5">
      {checklists.map((pc) => {
        const templateName = pc.checklist_template?.name ?? `Checklist #${pc.id}`;
        const items = pc.performed_swimming_pool_checklist_items ?? [];
        const tmplItems = pc.checklist_template?.checklist_item_templates ?? [];
        const labelMap = Object.fromEntries(tmplItems.map((t) => [t.id, t.label]));
        const pcLocal = local[pc.id] || {};

        const summary = { satisfactory: 0, needs_attention: 0, not_applicable: 0 };
        items.forEach((pci) => {
          const key = pci.checklist_item_template_id ?? pci.id;
          const v = pcLocal[key]?.value ?? pci.value ?? "satisfactory";
          if (summary[v] !== undefined) summary[v]++;
        });

        return (
          <div key={pc.id}>
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-sm font-bold" style={{ color: "var(--text)" }}>
                  {templateName}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[11px]" style={{ color: "#3fb950" }}>
                    ✓ {summary.satisfactory} satisfactory
                  </span>
                  {summary.needs_attention > 0 && (
                    <span className="text-[11px]" style={{ color: "#d29922" }}>
                      ⚠ {summary.needs_attention} needs attention
                    </span>
                  )}
                  {summary.not_applicable > 0 && (
                    <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                      N/A: {summary.not_applicable}
                    </span>
                  )}
                </div>
              </div>
              <button
                type="button"
                disabled={saving[pc.id]}
                onClick={() => saveChecklist(pc)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold flex-shrink-0"
                style={{ background: "var(--accent)", color: "#fff" }}
              >
                {saving[pc.id] ? <Spinner size={3} /> : null}
                Save
              </button>
            </div>

            <div className="flex flex-col gap-2">
              {items.map((pci) => {
                const key = pci.checklist_item_template_id ?? pci.id;
                const l = pcLocal[key] ?? { value: pci.value ?? "satisfactory", comment: pci.comment ?? "" };
                const label = labelMap[pci.checklist_item_template_id] ?? pci.label ?? `Item #${pci.id}`;
                return (
                  <div
                    key={pci.id}
                    className="p-3 rounded-xl"
                    style={{
                      background: "var(--bg-raised)",
                      border:
                        l.value === "satisfactory"
                          ? "1px solid color-mix(in srgb,#3fb950 20%,transparent)"
                          : l.value === "needs_attention"
                            ? "1px solid color-mix(in srgb,#d29922 25%,transparent)"
                            : "1px solid var(--border)",
                    }}
                  >
                    <p className="text-xs font-medium mb-2" style={{ color: "var(--text)" }}>
                      {label}
                    </p>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {CHECKLIST_STATUS_OPTIONS.map((opt) => {
                        const active = l.value === opt.value;
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => setItemLocal(pc.id, key, "value", opt.value)}
                            className="px-2.5 py-1 rounded-full text-[11px] font-semibold"
                            style={
                              active
                                ? {
                                  background: opt.bg,
                                  color: opt.color,
                                  border: `1.5px solid ${opt.border}`,
                                }
                                : {
                                  background: "transparent",
                                  color: "var(--text-muted)",
                                  border: "1px solid var(--border)",
                                  opacity: 0.55,
                                }
                            }
                          >
                            {active && "✓ "}
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>
                    <input
                      type="text"
                      value={l.comment ?? ""}
                      onChange={(e) => setItemLocal(pc.id, key, "comment", e.target.value)}
                      placeholder="Comment…"
                      className="text-xs rounded-lg px-2.5 py-1 w-full"
                      style={{
                        background: "var(--bg)",
                        border: "1px solid var(--border)",
                        color: "var(--text)",
                        outline: "none",
                      }}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── IssueSection ─────────────────────────────────────────────────────── */
function IssueSection({ performId, isActive }) {
  const [loading, setLoading] = useState(false);
  const [issues, setIssues] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const loaded = useRef(false);

  const load = useCallback(async () => {
    if (loaded.current) return;
    loaded.current = true;
    setLoading(true);
    try {
      const res = await SwimmingPoolIssueService.list(performId, {
        per_page: 50,
        include: "attachments",
      });
      const list =
        res.data?.data ?? (Array.isArray(res.data) ? res.data : []);
      setIssues(list);
    } catch {
      toast.error("Failed to load issues.");
    } finally {
      setLoading(false);
    }
  }, [performId]);

  useEffect(() => {
    if (isActive) load();
  }, [isActive, load]);

  function handleIssueCreated(created) {
    setIssues((prev) => [...prev, created]);
    setShowAdd(false);
  }

  function handleIssueUpdated(updated) {
    setIssues((prev) => prev.map((iss) => (iss.id === updated.id ? updated : iss)));
  }

  if (loading)
    return (
      <div className="flex justify-center py-10">
        <Spinner />
      </div>
    );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold" style={{ color: "var(--text)" }}>
          Issues ({issues.length})
        </p>
        <button
          type="button"
          onClick={() => setShowAdd((p) => !p)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
          style={{
            background: "color-mix(in srgb,var(--accent) 10%,transparent)",
            color: "var(--accent)",
            border: "1px solid color-mix(in srgb,var(--accent) 25%,transparent)",
          }}
        >
          <PlusIcon className="h-3.5 w-3.5" />
          Add Issue
        </button>
      </div>

      {showAdd && (
        <AddIssueForm performId={performId} onCreated={handleIssueCreated} />
      )}

      {issues.length === 0 && !showAdd && (
        <p
          className="text-xs text-center py-8"
          style={{ color: "var(--text-muted)" }}
        >
          No issues recorded for this execution.
        </p>
      )}

      {issues.map((iss) => (
        <IssueCard
          key={iss.id}
          issue={iss}
          performId={performId}
          onUpdated={handleIssueUpdated}
        />
      ))}
    </div>
  );
}

/* ── ExecutionDetailModal ─────────────────────────────────────────────── */
export default function ExecutionDetailModal({ isOpen, onClose, perform, setup }) {
  const [activeTab, setActiveTab] = useState(0);
  const tabs = ["Checklists", "Issues"];

  const subtitle =
    perform?.swimming_pool_inspection?.pool_location ?? setup?.pool_location ?? "";
  const dateStr = moment(perform?.date).format("MMMM Do, YYYY") ?? "";
  const timeStr = moment(perform?.time, "HH:mm").format("h:mm A") ?? "";

  useEffect(() => {
    if (isOpen) setActiveTab(0);
  }, [isOpen]);

  if (!isOpen || !perform) return null;

  return ReactDOM.createPortal(
    <div
      className="fixed inset-0 z-[900] flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.55)", zIndex: 10100 }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="relative flex flex-col rounded-2xl shadow-2xl w-full max-w-3xl mx-4"
        style={{
          background: "var(--bg)",
          border: "1px solid var(--border)",
          maxHeight: "88vh",
        }}
      >
        {/* Header */}
        <div
          className="flex items-start justify-between px-6 py-5 flex-shrink-0"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <div className="flex-1 min-w-0 pr-4">
            <p className="text-base font-bold" style={{ color: "var(--text)" }}>
              Inspection Execution #{perform.id}
            </p>
            {subtitle && (
              <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                {subtitle}
                {dateStr && (
                  <span className="mx-1.5" style={{ color: "var(--border)" }}>·</span>
                )}
                {dateStr}
                {timeStr && (
                  <>
                    <span className="mx-1.5" style={{ color: "var(--border)" }}>·</span>
                    {timeStr}
                  </>
                )}
              </p>
            )}
            {/* Performer info */}
            {(perform.performed_by ?? perform.user) && (
              <div className="flex items-center gap-1.5 mt-2">
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
                  style={{ background: "var(--accent)", color: "#fff" }}
                >
                  {perform.performed_by?.firstname?.[0] ??
                    perform.user?.firstname?.[0] ??
                    "?"}
                </div>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  {[
                    perform.performed_by?.firstname ?? perform.user?.firstname,
                    perform.performed_by?.lastname ?? perform.user?.lastname,
                  ]
                    .filter(Boolean)
                    .join(" ") || "Unknown performer"}
                </p>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:opacity-70 flex-shrink-0"
            style={{ color: "var(--text-muted)" }}
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Tabs */}
        <div
          className="flex flex-shrink-0 px-2"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          {tabs.map((tab, idx) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(idx)}
              className="px-4 py-3 text-xs font-semibold"
              style={{
                color: activeTab === idx ? "var(--accent)" : "var(--text-muted)",
                borderBottom:
                  activeTab === idx
                    ? "2px solid var(--accent)"
                    : "2px solid transparent",
                background: "transparent",
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {activeTab === 0 && (
            <ChecklistSection performId={perform.id} isActive={activeTab === 0} />
          )}
          {activeTab === 1 && (
            <IssueSection performId={perform.id} isActive={activeTab === 1} />
          )}
        </div>

        {/* Footer */}
        <div
          className="flex justify-end px-6 py-4 flex-shrink-0"
          style={{ borderTop: "1px solid var(--border)" }}
        >
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium"
            style={{
              background: "var(--bg-raised)",
              color: "var(--text-muted)",
              border: "1px solid var(--border)",
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
