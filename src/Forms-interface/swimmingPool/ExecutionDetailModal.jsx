/* ── Swimming Pool Inspection — ExecutionDetailModal ──────────────────── */
/*
 * Opens when a user clicks a perform record in DetailDrawer.
 * Two tabs:
 *  1. Checklists — view & update item results
 *  2. Issues     — full issue lifecycle (corrective action, priority,
 *                  contractor, repair, attachments, add/delete)
 */
import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import {
    XMarkIcon,
    CheckBadgeIcon,
    ExclamationTriangleIcon,
    ChevronDownIcon,
    ChevronUpIcon,
    PaperClipIcon,
    PlusIcon,
    TrashIcon,
    UserIcon,
    WrenchScrewdriverIcon,
    CalendarDaysIcon,
    ClipboardDocumentListIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import {
    SwimmingPoolPerformService,
    SwimmingPoolChecklistItemService,
    SwimmingPoolIssueService,
    SwimmingPoolAttachmentService,
    SwimmingPoolRepairAttachmentService,
} from "../../services/swimmingPool.service";
import { Spinner, Field } from "./shared";
import UserAutocomplete from "./UserAutocomplete";
import moment from "moment";

/* ── Local constants ──────────────────────────────────────────────────── */
const PRIORITY_OPTIONS = ["low", "medium", "high"];

const PRIORITY_COLOR = {
    low: { bg: "color-mix(in srgb,#3fb950 12%,transparent)", text: "#3fb950" },
    medium: { bg: "color-mix(in srgb,#d29922 12%,transparent)", text: "#d29922" },
    high: { bg: "color-mix(in srgb,#e36209 12%,transparent)", text: "#e36209" },
};

const STATUS_ITEM_OPTIONS = [
    { value: "satisfactory", label: "Satisfactory" },
    { value: "needs_attention", label: "Needs Attention" },
    { value: "not_applicable", label: "N/A" },
];

const STATUS_ITEM_COLOR = {
    satisfactory: { bg: "color-mix(in srgb,#3fb950 12%,transparent)", text: "#3fb950" },
    needs_attention: { bg: "color-mix(in srgb,#d29922 12%,transparent)", text: "#d29922" },
    not_applicable: { bg: "var(--bg-raised)", text: "var(--text-muted)" },
};

const REPAIR_STATUS_COLOR = {
    approved: { bg: "color-mix(in srgb,#3fb950 12%,transparent)", text: "#3fb950" },
    rejected: { bg: "color-mix(in srgb,var(--danger) 12%,transparent)", text: "var(--danger)" },
};

/* ── Badge ────────────────────────────────────────────────────────────── */
function Badge({ value, map }) {
    const style = map[value] ?? { bg: "var(--bg-raised)", text: "var(--text-muted)" };
    return (
        <span
            className="inline-block px-2 py-0.5 rounded-full text-[11px] font-bold capitalize"
            style={{ background: style.bg, color: style.text }}
        >
            {value?.replace(/_/g, " ")}
        </span>
    );
}

/* ── SectionCard ──────────────────────────────────────────────────────── */
function SectionCard({ children, className = "" }) {
    return (
        <div
            className={`rounded-xl p-4 ${className}`}
            style={{ background: "var(--bg-raised)", border: "1px solid var(--border)" }}
        >
            {children}
        </div>
    );
}

/* ── AttachmentList ──────────────────────────────────────────────────── */
function AttachmentList({ performId, issueId, kind = "issue" }) {
    /* kind: "issue" | "repair" */
    const svc = kind === "repair" ? SwimmingPoolRepairAttachmentService : SwimmingPoolAttachmentService;
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [deleting, setDeleting] = useState(null);
    const fileRef = useRef(null);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await svc.list(performId, issueId);
            setItems(Array.isArray(res) ? res : res.data ?? []);
        } catch {
            /* silent */
        } finally {
            setLoading(false);
        }
    }, [performId, issueId, svc]);

    useEffect(() => { load(); }, [load]);

    async function handleUpload(e) {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        try {
            await svc.upload(performId, issueId, file);
            toast.success("File uploaded.");
            load();
        } catch {
            toast.error("Upload failed.");
        } finally {
            setUploading(false);
            e.target.value = "";
        }
    }

    async function handleDelete(id) {
        setDeleting(id);
        try {
            await svc.remove(performId, issueId, id);
            setItems((p) => p.filter((a) => a.id !== id));
            toast.success("Attachment removed.");
        } catch {
            toast.error("Delete failed.");
        } finally {
            setDeleting(null);
        }
    }

    return (
        <div>
            {loading ? (
                <div className="flex justify-center py-3"><Spinner size={4} /></div>
            ) : items.length === 0 ? (
                <p className="text-xs py-2" style={{ color: "var(--text-muted)" }}>
                    No attachments yet.
                </p>
            ) : (
                <div className="flex flex-col gap-1.5 mb-2">
                    {items.map((a) => (
                        <div
                            key={a.id}
                            className="flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg"
                            style={{ background: "var(--bg)", border: "1px solid var(--border)" }}
                        >
                            <div className="flex items-center gap-1.5 min-w-0">
                                <PaperClipIcon className="h-3.5 w-3.5 flex-shrink-0" style={{ color: "var(--text-muted)" }} />
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
                            <button
                                onClick={() => handleDelete(a.id)}
                                disabled={deleting === a.id}
                                className="flex-shrink-0"
                                style={{ color: "var(--danger)", opacity: deleting === a.id ? 0.5 : 1 }}
                            >
                                {deleting === a.id ? <Spinner size={3} /> : <TrashIcon className="h-3.5 w-3.5" />}
                            </button>
                        </div>
                    ))}
                </div>
            )}
            <input type="file" ref={fileRef} className="hidden" onChange={handleUpload} />
            <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg"
                style={{
                    border: "1px dashed var(--border)",
                    color: "var(--text-muted)",
                    background: "transparent",
                }}
            >
                {uploading ? <Spinner size={3} /> : <PaperClipIcon className="h-3.5 w-3.5" />}
                Attach file
            </button>
        </div>
    );
}

/* ── AddIssueForm ─────────────────────────────────────────────────────── */
function AddIssueForm({ performId, onAdded, onCancel }) {
    const [form, setForm] = useState({
        title: "",
        description: "",
        corrective_action: "",
    });
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
            const res = await SwimmingPoolIssueService.create(performId, form);
            const created = res.data?.data ?? res.data ?? res;
            toast.success("Issue added.");
            setForm({ title: "", description: "", corrective_action: "" });
            onAdded(created);
        } catch {
            toast.error("Failed to add issue.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <SectionCard className="border-dashed">
            <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)" }}>
                New Issue
            </p>
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                <Field label="Title" required error={errors.title}>
                    <input
                        value={form.title}
                        onChange={(e) => { setForm((f) => ({ ...f, title: e.target.value })); setErrors({}); }}
                        placeholder="Brief description…"
                        className="ui-input text-sm w-full"
                    />
                </Field>
                <Field label="Description">
                    <textarea
                        value={form.description}
                        onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                        rows={2}
                        placeholder="Detailed description… (optional)"
                        className="ui-input text-sm resize-none w-full"
                    />
                </Field>
                <Field label="Corrective Action">
                    <input
                        value={form.corrective_action}
                        onChange={(e) => setForm((f) => ({ ...f, corrective_action: e.target.value }))}
                        placeholder="Recommended action… (optional)"
                        className="ui-input text-sm w-full"
                    />
                </Field>
                <div className="flex gap-2 justify-end pt-1">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold"
                        style={{ background: "var(--bg-raised)", color: "var(--text-muted)", border: "1px solid var(--border)" }}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-60"
                        style={{ background: "var(--accent)", color: "#fff" }}
                    >
                        {loading && <Spinner size={3} />}
                        <PlusIcon className="h-3.5 w-3.5" />
                        Add Issue
                    </button>
                </div>
            </form>
        </SectionCard>
    );
}

/* ── IssueCard ────────────────────────────────────────────────────────── */
function IssueCard({ issue, performId, onUpdated, onDeleted }) {
    const [expanded, setExpanded] = useState(false);
    const [activeSection, setActiveSection] = useState(null);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [attachTab, setAttachTab] = useState("issue");

    const [caText, setCaText] = useState(issue.corrective_action ?? "");
    const [priorityForm, setPriorityForm] = useState({
        priority_level: issue.priority_level ?? "",
        due_date: issue.due_date ?? "",
    });
    const [contractor, setContractor] = useState(
        issue.contractor
            ? { id: issue.contractor.id, firstname: issue.contractor.firstname, lastname: issue.contractor.lastname }
            : null
    );
    const [repairForm, setRepairForm] = useState({
        repair_completion_date: issue.repair_completion_date ?? "",
        repair_completion_note: issue.repair_completion_note ?? "",
    });
    const [repairStatusForm, setRepairStatusForm] = useState({ status: "", reject_reason: "" });

    useEffect(() => {
        setCaText(issue.corrective_action ?? "");
        setPriorityForm({ priority_level: issue.priority_level ?? "", due_date: issue.due_date ?? "" });
        setContractor(
            issue.contractor
                ? { id: issue.contractor.id, firstname: issue.contractor.firstname, lastname: issue.contractor.lastname }
                : null
        );
        setRepairForm({
            repair_completion_date: issue.repair_completion_date ?? "",
            repair_completion_note: issue.repair_completion_note ?? "",
        });
    }, [issue]);

    async function saveCA() {
        setSaving(true);
        try {
            const res = await SwimmingPoolIssueService.updateCorrectiveAction(performId, issue.id, caText);
            const upd = res.data?.data ?? res.data ?? res;
            onUpdated?.(upd);
            setActiveSection(null);
            toast.success("Corrective action saved.");
        } catch { toast.error("Failed to save."); }
        finally { setSaving(false); }
    }

    async function savePriority() {
        setSaving(true);
        try {
            const res = await SwimmingPoolIssueService.updatePriorityDueDate(performId, issue.id, priorityForm);
            const upd = res.data?.data ?? res.data ?? res;
            onUpdated?.(upd);
            setActiveSection(null);
            toast.success("Priority updated.");
        } catch { toast.error("Failed to save."); }
        finally { setSaving(false); }
    }

    async function saveContractor() {
        if (!contractor) return;
        setSaving(true);
        try {
            const res = await SwimmingPoolIssueService.assignContractor(performId, issue.id, contractor.id);
            const upd = res.data?.data ?? res.data ?? res;
            onUpdated?.(upd);
            setActiveSection(null);
            toast.success("Contractor assigned.");
        } catch { toast.error("Failed to save."); }
        finally { setSaving(false); }
    }

    async function saveRepairCompletion() {
        setSaving(true);
        try {
            const res = await SwimmingPoolIssueService.repairCompletion(performId, issue.id, repairForm);
            const upd = res.data?.data ?? res.data ?? res;
            onUpdated?.(upd);
            setActiveSection(null);
            toast.success("Repair completion saved.");
        } catch { toast.error("Failed to save."); }
        finally { setSaving(false); }
    }

    async function saveRepairStatus() {
        if (!repairStatusForm.status) return;
        setSaving(true);
        try {
            const res = await SwimmingPoolIssueService.setRepairStatus(
                performId, issue.id, repairStatusForm.status, repairStatusForm.reject_reason
            );
            const upd = res.data?.data ?? res.data ?? res;
            onUpdated?.(upd);
            setActiveSection(null);
            toast.success("Repair status updated.");
        } catch { toast.error("Failed to save."); }
        finally { setSaving(false); }
    }

    async function handleDelete() {
        setDeleting(true);
        try {
            await SwimmingPoolIssueService.remove(performId, issue.id);
            toast.success("Issue deleted.");
            onDeleted?.(issue.id);
        } catch { toast.error("Failed to delete issue."); }
        finally { setDeleting(false); }
    }

    const contractorName = contractor
        ? [contractor.firstname, contractor.lastname].filter(Boolean).join(" ")
        : issue.contractor
            ? [issue.contractor.firstname, issue.contractor.lastname].filter(Boolean).join(" ")
            : null;

    const actionButtons = [
        { key: "ca", label: "Corrective Action", icon: ClipboardDocumentListIcon },
        { key: "priority", label: "Priority / Due Date", icon: CalendarDaysIcon },
        { key: "contractor", label: "Assign Contractor", icon: UserIcon },
        { key: "repair", label: "Repair Completion", icon: WrenchScrewdriverIcon },
        { key: "status", label: "Set Repair Status", icon: CheckBadgeIcon },
        { key: "attach", label: "Attachments", icon: PaperClipIcon },
    ];

    const pc = PRIORITY_COLOR[issue.priority_level];
    const rs = REPAIR_STATUS_COLOR[issue.repair_status];

    return (
        <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
            {/* Header */}
            <div
                className="flex items-start gap-3 p-4 cursor-pointer hover:opacity-90"
                style={{ background: "var(--bg-raised)" }}
                onClick={() => setExpanded((p) => !p)}
            >
                <ExclamationTriangleIcon className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: "var(--danger)" }} />
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>{issue.title}</p>
                        {issue.priority_level && pc && <Badge value={issue.priority_level} map={PRIORITY_COLOR} />}
                        {issue.repair_status && rs && <Badge value={issue.repair_status} map={REPAIR_STATUS_COLOR} />}
                    </div>
                    {issue.description && (
                        <p className="text-xs mt-0.5 line-clamp-2" style={{ color: "var(--text-muted)" }}>{issue.description}</p>
                    )}
                </div>
                {expanded
                    ? <ChevronUpIcon className="h-4 w-4 flex-shrink-0" style={{ color: "var(--text-muted)" }} />
                    : <ChevronDownIcon className="h-4 w-4 flex-shrink-0" style={{ color: "var(--text-muted)" }} />
                }
            </div>

            {expanded && (
                <div className="px-4 pb-4 pt-3" style={{ background: "var(--bg)" }}>
                    {/* Meta summary */}
                    {(issue.corrective_action || issue.due_date || contractorName || issue.repair_completion_date || issue.reject_reason) && (
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mb-3 pb-3" style={{ borderBottom: "1px solid var(--border)" }}>
                            {issue.corrective_action && (
                                <div className="col-span-2">
                                    <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Corrective Action</p>
                                    <p className="text-xs mt-0.5" style={{ color: "var(--text)" }}>{issue.corrective_action}</p>
                                </div>
                            )}
                            {issue.due_date && (
                                <div>
                                    <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Due Date</p>
                                    <p className="text-xs mt-0.5" style={{ color: "var(--text)" }}>{moment(issue.due_date).format("MMMM Do, YYYY")}</p>
                                </div>
                            )}
                            {contractorName && (
                                <div>
                                    <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Contractor</p>
                                    <p className="text-xs mt-0.5" style={{ color: "var(--text)" }}>{contractorName}</p>
                                </div>
                            )}
                            {issue.repair_completion_date && (
                                <div>
                                    <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Repair Completed</p>
                                    <p className="text-xs mt-0.5" style={{ color: "var(--text)" }}>{moment(issue.repair_completion_date).format("MMMM Do, YYYY")}</p>
                                </div>
                            )}
                            {issue.reject_reason && (
                                <div className="col-span-2">
                                    <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--danger)" }}>Reject Reason</p>
                                    <p className="text-xs mt-0.5" style={{ color: "var(--text)" }}>{issue.reject_reason}</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex flex-wrap gap-1.5 mb-3">
                        {actionButtons.map(({ key, label, icon: Icon }) => {
                            const isActive = activeSection === key;
                            return (
                                <button
                                    key={key}
                                    type="button"
                                    onClick={() => setActiveSection((p) => (p === key ? null : key))}
                                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold"
                                    style={{
                                        background: "transparent",
                                        color: isActive ? "var(--accent)" : "var(--text-muted)",
                                        border: isActive
                                            ? "1px solid color-mix(in srgb,var(--accent) 50%,transparent)"
                                            : "1px solid var(--border)",
                                    }}
                                >
                                    <Icon className="h-3 w-3" />
                                    {label}
                                </button>
                            );
                        })}
                    </div>

                    {/* Corrective Action panel */}
                    {activeSection === "ca" && (
                        <SectionCard className="mb-3">
                            <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)" }}>Corrective Action</p>
                            <Field label="Description">
                                <textarea
                                    value={caText}
                                    onChange={(e) => setCaText(e.target.value)}
                                    rows={3}
                                    className="ui-input text-sm resize-none w-full"
                                    placeholder="Describe corrective action…"
                                />
                            </Field>
                            <div className="flex justify-end pt-2">
                                <button
                                    type="button"
                                    disabled={saving}
                                    onClick={saveCA}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-60"
                                    style={{ background: "var(--accent)", color: "#fff" }}
                                >
                                    {saving && <Spinner size={3} />} Save
                                </button>
                            </div>
                        </SectionCard>
                    )}

                    {/* Priority & Due Date panel */}
                    {activeSection === "priority" && (
                        <SectionCard className="mb-3">
                            <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)" }}>Priority &amp; Due Date</p>
                            <div className="grid grid-cols-2 gap-3">
                                <Field label="Priority">
                                    <select
                                        value={priorityForm.priority_level}
                                        onChange={(e) => setPriorityForm((f) => ({ ...f, priority_level: e.target.value }))}
                                        className="ui-input text-sm w-full"
                                    >
                                        <option value="">Select priority…</option>
                                        {PRIORITY_OPTIONS.map((p) => (
                                            <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                                        ))}
                                    </select>
                                </Field>
                                <Field label="Due Date">
                                    <input
                                        type="date"
                                        value={priorityForm.due_date}
                                        onChange={(e) => setPriorityForm((f) => ({ ...f, due_date: e.target.value }))}
                                        className="ui-input text-sm w-full"
                                    />
                                </Field>
                            </div>
                            <div className="flex justify-end pt-2">
                                <button
                                    type="button"
                                    disabled={saving}
                                    onClick={savePriority}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-60"
                                    style={{ background: "var(--accent)", color: "#fff" }}
                                >
                                    {saving && <Spinner size={3} />} Save
                                </button>
                            </div>
                        </SectionCard>
                    )}

                    {/* Contractor panel */}
                    {activeSection === "contractor" && (
                        <SectionCard className="mb-3">
                            <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)" }}>Assign Contractor</p>
                            <Field label="Contractor">
                                <UserAutocomplete
                                    roleFilter="contractor"
                                    value={contractor}
                                    onChange={setContractor}
                                    placeholder="Search contractor…"
                                />
                            </Field>
                            <div className="flex justify-end pt-2">
                                <button
                                    type="button"
                                    disabled={saving || !contractor}
                                    onClick={saveContractor}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-60"
                                    style={{ background: "var(--accent)", color: "#fff" }}
                                >
                                    {saving && <Spinner size={3} />} Assign
                                </button>
                            </div>
                        </SectionCard>
                    )}

                    {/* Repair Completion panel */}
                    {activeSection === "repair" && (
                        <SectionCard className="mb-3">
                            <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)" }}>Repair Completion</p>
                            <div className="grid grid-cols-2 gap-3">
                                <Field label="Completion Date">
                                    <input
                                        type="date"
                                        value={repairForm.repair_completion_date}
                                        onChange={(e) => setRepairForm((f) => ({ ...f, repair_completion_date: e.target.value }))}
                                        className="ui-input text-sm w-full"
                                    />
                                </Field>
                                <Field label="Notes" className="col-span-2">
                                    <textarea
                                        value={repairForm.repair_completion_note}
                                        onChange={(e) => setRepairForm((f) => ({ ...f, repair_completion_note: e.target.value }))}
                                        rows={2}
                                        placeholder="Repair notes… (optional)"
                                        className="ui-input text-sm resize-none w-full"
                                    />
                                </Field>
                            </div>
                            <div className="flex justify-end pt-2">
                                <button
                                    type="button"
                                    disabled={saving}
                                    onClick={saveRepairCompletion}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-60"
                                    style={{ background: "var(--accent)", color: "#fff" }}
                                >
                                    {saving && <Spinner size={3} />} Save
                                </button>
                            </div>
                        </SectionCard>
                    )}

                    {/* Repair Status panel */}
                    {activeSection === "status" && (
                        <SectionCard className="mb-3">
                            <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)" }}>Set Repair Status</p>
                            <div className="flex gap-2 mb-3">
                                {["approved", "rejected"].map((s) => {
                                    const c = REPAIR_STATUS_COLOR[s];
                                    return (
                                        <button
                                            key={s}
                                            type="button"
                                            onClick={() => setRepairStatusForm((f) => ({ ...f, status: s }))}
                                            className="flex-1 py-2 rounded-lg text-xs font-semibold capitalize"
                                            style={{
                                                background: repairStatusForm.status === s ? c.bg : "transparent",
                                                color: repairStatusForm.status === s ? c.text : "var(--text-muted)",
                                                border: repairStatusForm.status === s ? `2px solid ${c.text}` : "1px solid var(--border)",
                                            }}
                                        >
                                            {s}
                                        </button>
                                    );
                                })}
                            </div>
                            {repairStatusForm.status === "rejected" && (
                                <Field label="Reason for rejection">
                                    <textarea
                                        value={repairStatusForm.reject_reason}
                                        onChange={(e) => setRepairStatusForm((f) => ({ ...f, reject_reason: e.target.value }))}
                                        rows={2}
                                        placeholder="Reason for rejection…"
                                        className="ui-input text-sm resize-none w-full"
                                    />
                                </Field>
                            )}
                            <div className="flex justify-end pt-2">
                                <button
                                    type="button"
                                    disabled={saving || !repairStatusForm.status}
                                    onClick={saveRepairStatus}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-60"
                                    style={{ background: "var(--accent)", color: "#fff" }}
                                >
                                    {saving && <Spinner size={3} />} Confirm
                                </button>
                            </div>
                        </SectionCard>
                    )}

                    {/* Attachments panel */}
                    {activeSection === "attach" && (
                        <SectionCard className="mb-3">
                            <div className="flex gap-4 mb-3">
                                {["issue", "repair"].map((t) => (
                                    <button
                                        key={t}
                                        type="button"
                                        onClick={() => setAttachTab(t)}
                                        className="text-xs font-semibold pb-1"
                                        style={{
                                            color: attachTab === t ? "var(--accent)" : "var(--text-muted)",
                                            borderBottom: attachTab === t ? "2px solid var(--accent)" : "2px solid transparent",
                                            background: "transparent",
                                        }}
                                    >
                                        {t === "issue" ? "Issue Attachments" : "Repair Attachments"}
                                    </button>
                                ))}
                            </div>
                            <AttachmentList performId={performId} issueId={issue.id} kind={attachTab} />
                        </SectionCard>
                    )}

                    {/* Delete */}
                    <div className="flex justify-end pt-2 mt-1" style={{ borderTop: "1px solid var(--border)" }}>
                        <button
                            type="button"
                            onClick={handleDelete}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
                            style={{
                                background: "color-mix(in srgb,var(--danger) 10%,transparent)",
                                color: "var(--danger)",
                                border: "1px solid color-mix(in srgb,var(--danger) 25%,transparent)",
                                opacity: deleting ? 0.6 : 1,
                            }}
                        >
                            {deleting ? <Spinner size={3} /> : <TrashIcon className="h-3.5 w-3.5" />}
                            Delete Issue
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

/* ── ChecklistSection ─────────────────────────────────────────────────── */
function ChecklistSection({ performId }) {
    const [loading, setLoading] = useState(false);
    const [checklists, setChecklists] = useState([]);
    const [saving, setSaving] = useState({});
    const [localResults, setLocalResults] = useState({});
    const [expanded, setExpanded] = useState({});

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await SwimmingPoolPerformService.get(performId, { include: "checklists" });
            const data = res.data?.data ?? res.data ?? res;
            const pcs = data.performed_swimming_pool_checklists ?? [];
            setChecklists(pcs);
            const init = {};
            pcs.forEach((pc) => {
                init[pc.id] = {};
                (pc.performed_swimming_pool_checklist_items ?? []).forEach((pci) => {
                    init[pc.id][pci.id] = {
                        value: pci.status ?? "satisfactory",
                        comment: pci.comment ?? "",
                    };
                });
            });
            setLocalResults(init);
            if (pcs.length > 0) setExpanded({ [pcs[0].id]: true });
        } catch {
            toast.error("Failed to load checklists.");
        } finally {
            setLoading(false);
        }
    }, [performId]);

    useEffect(() => { load(); }, [load]);

    function setItemLocal(pcId, pciId, field, val) {
        setLocalResults((prev) => ({
            ...prev,
            [pcId]: {
                ...prev[pcId],
                [pciId]: { ...prev[pcId]?.[pciId], [field]: val },
            },
        }));
    }

    async function saveChecklist(pc) {
        const pcLocal = localResults[pc.id] ?? {};
        const items = (pc.performed_swimming_pool_checklist_items ?? []).map((pci) => ({
            checklist_item_template_id: pci.checklist_item_template_id,
            status: pcLocal[pci.id]?.value ?? pci.status ?? "satisfactory",
            comment: pcLocal[pci.id]?.comment ?? pci.comment ?? undefined,
        }));
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
        return <div className="flex justify-center py-10"><Spinner /></div>;

    if (checklists.length === 0)
        return (
            <div className="p-8 rounded-xl text-center" style={{ background: "var(--bg-raised)", border: "1px solid var(--border)" }}>
                <ClipboardDocumentListIcon className="h-8 w-8 mx-auto mb-2" style={{ color: "var(--text-muted)", opacity: 0.5 }} />
                <p className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>No checklist data recorded for this execution.</p>
            </div>
        );

    /* overall summary */
    const allItems = checklists.flatMap((pc) =>
        (pc.performed_swimming_pool_checklist_items ?? []).map((pci) => ({
            pcId: pc.id,
            pciId: pci.id,
            saved: pci.status ?? "satisfactory",
        }))
    );
    const totalSat  = allItems.filter((i) => (localResults[i.pcId]?.[i.pciId]?.value ?? i.saved) === "satisfactory").length;
    const totalAttn = allItems.filter((i) => (localResults[i.pcId]?.[i.pciId]?.value ?? i.saved) === "needs_attention").length;
    const totalNA   = allItems.filter((i) => (localResults[i.pcId]?.[i.pciId]?.value ?? i.saved) === "not_applicable").length;

    return (
        <div className="flex flex-col gap-3">
            {/* Overall stats */}
            {allItems.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                    <div className="rounded-xl p-3 text-center" style={{ background: "color-mix(in srgb,#3fb950 10%,transparent)", border: "1px solid color-mix(in srgb,#3fb950 30%,transparent)" }}>
                        <p className="text-2xl font-bold" style={{ color: "#3fb950" }}>{totalSat}</p>
                        <p className="text-[10px] font-semibold uppercase tracking-wider mt-0.5" style={{ color: "#3fb950" }}>Satisfactory</p>
                    </div>
                    <div className="rounded-xl p-3 text-center" style={{ background: "color-mix(in srgb,#d29922 10%,transparent)", border: "1px solid color-mix(in srgb,#d29922 30%,transparent)" }}>
                        <p className="text-2xl font-bold" style={{ color: "#d29922" }}>{totalAttn}</p>
                        <p className="text-[10px] font-semibold uppercase tracking-wider mt-0.5" style={{ color: "#d29922" }}>Needs Attention</p>
                    </div>
                    <div className="rounded-xl p-3 text-center" style={{ background: "var(--bg-raised)", border: "1px solid var(--border)" }}>
                        <p className="text-2xl font-bold" style={{ color: "var(--text-muted)" }}>{totalNA}</p>
                        <p className="text-[10px] font-semibold uppercase tracking-wider mt-0.5" style={{ color: "var(--text-muted)" }}>N/A</p>
                    </div>
                </div>
            )}

            {checklists.map((pc) => {
                const templateName = pc.checklist_template?.name ?? `Checklist #${pc.id}`;
                const tmpl = pc.checklist_template ?? {};
                const items = pc.performed_swimming_pool_checklist_items ?? [];
                const tmplItems = tmpl.checklist_item_templates ?? [];
                const labelMap = Object.fromEntries(tmplItems.map((t) => [t.id, t.label]));
                const pcLocal = localResults[pc.id] ?? {};
                const isExpanded = expanded[pc.id] ?? false;

                const sat  = items.filter((pci) => (pcLocal[pci.id]?.value ?? pci.status) === "satisfactory").length;
                const attn = items.filter((pci) => (pcLocal[pci.id]?.value ?? pci.status) === "needs_attention").length;
                const na   = items.filter((pci) => (pcLocal[pci.id]?.value ?? pci.status) === "not_applicable").length;

                return (
                    <div key={pc.id} className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
                        {/* Collapsible header */}
                        <div
                            className="flex items-center justify-between gap-3 px-4 py-3 cursor-pointer"
                            style={{ background: "var(--bg-raised)" }}
                            onClick={() => setExpanded((p) => ({ ...p, [pc.id]: !p[pc.id] }))}
                        >
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    {tmpl.position != null && (
                                        <div
                                            className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
                                            style={{ background: "var(--accent)", color: "#fff" }}
                                        >
                                            {tmpl.position}
                                        </div>
                                    )}
                                    <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>{templateName}</p>
                                </div>
                                {tmpl.description && (
                                    <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{tmpl.description}</p>
                                )}
                            </div>
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                                <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>{items.length} items</span>
                                {sat  > 0 && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: "color-mix(in srgb,#3fb950 12%,transparent)", color: "#3fb950" }}>✓ {sat}</span>}
                                {attn > 0 && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: "color-mix(in srgb,#d29922 12%,transparent)", color: "#d29922" }}>⚠ {attn}</span>}
                                {na   > 0 && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: "var(--bg-raised)", color: "var(--text-muted)", border: "1px solid var(--border)" }}>— {na}</span>}
                                {isExpanded
                                    ? <ChevronUpIcon className="h-4 w-4 ml-1" style={{ color: "var(--text-muted)" }} />
                                    : <ChevronDownIcon className="h-4 w-4 ml-1" style={{ color: "var(--text-muted)" }} />
                                }
                            </div>
                        </div>

                        {/* Items */}
                        {isExpanded && (
                            <div style={{ borderTop: "1px solid var(--border)" }}>
                                {items.length === 0 ? (
                                    <p className="px-4 py-3 text-xs" style={{ color: "var(--text-muted)" }}>No items recorded.</p>
                                ) : (
                                    <>
                                        <div className="flex flex-col divide-y" style={{ "--tw-divide-opacity": 1 }}>
                                            {items.map((pci, idx) => {
                                                const l = pcLocal[pci.id] ?? { value: pci.status ?? "satisfactory", comment: pci.comment ?? "" };
                                                const label = pci.checklist_item_template?.label ?? labelMap[pci.checklist_item_template_id] ?? pci.label ?? `Item #${pci.id}`;
                                                const itemColor = STATUS_ITEM_COLOR[l.value] ?? STATUS_ITEM_COLOR.not_applicable;
                                                return (
                                                    <div
                                                        key={pci.id}
                                                        className="flex gap-3 px-4 py-3"
                                                        style={{ borderLeft: `3px solid ${itemColor.text}` }}
                                                    >
                                                        {/* Position circle */}
                                                        <div
                                                            className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold mt-0.5"
                                                            style={{ background: "var(--bg-raised)", color: "var(--text-muted)", border: "1px solid var(--border)" }}
                                                        >
                                                            {idx + 1}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-xs font-medium mb-2" style={{ color: "var(--text)" }}>{label}</p>
                                                            {/* Status buttons */}
                                                            <div className="flex flex-wrap gap-1.5 mb-2">
                                                                {STATUS_ITEM_OPTIONS.map((opt) => {
                                                                    const active = l.value === opt.value;
                                                                    const sc = STATUS_ITEM_COLOR[opt.value];
                                                                    return (
                                                                        <button
                                                                            key={opt.value}
                                                                            type="button"
                                                                            onClick={() => setItemLocal(pc.id, pci.id, "value", opt.value)}
                                                                            className="px-2.5 py-1 rounded-full text-[11px] font-semibold"
                                                                            style={active
                                                                                ? { background: sc.bg, color: sc.text, border: `1.5px solid ${sc.text}` }
                                                                                : { background: "transparent", color: "var(--text-muted)", border: "1px solid var(--border)" }
                                                                            }
                                                                        >
                                                                            {opt.label}
                                                                        </button>
                                                                    );
                                                                })}
                                                            </div>
                                                            {/* Comment input */}
                                                            <input
                                                                type="text"
                                                                value={l.comment ?? ""}
                                                                onChange={(e) => setItemLocal(pc.id, pci.id, "comment", e.target.value)}
                                                                placeholder="Comment…"
                                                                className="text-xs rounded-lg px-2.5 py-1 w-full"
                                                                style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text)", outline: "none" }}
                                                            />
                                                            {/* Comment callout */}
                                                            {l.comment && (
                                                                <div
                                                                    className="flex items-start gap-1.5 mt-2 px-2.5 py-1.5 rounded-lg text-xs"
                                                                    style={{ background: "color-mix(in srgb,var(--accent) 8%,transparent)", color: "var(--text-muted)" }}
                                                                >
                                                                    💬 <span style={{ color: "var(--text)" }}>{l.comment}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        {/* Save footer */}
                                        <div
                                            className="flex justify-end px-4 py-3"
                                            style={{ background: "var(--bg-raised)", borderTop: "1px solid var(--border)" }}
                                        >
                                            <button
                                                type="button"
                                                disabled={saving[pc.id]}
                                                onClick={() => saveChecklist(pc)}
                                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-60"
                                                style={{ background: "var(--accent)", color: "#fff" }}
                                            >
                                                {saving[pc.id] ? <Spinner size={3} /> : null} Save Checklist
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

/* ── IssueSection ─────────────────────────────────────────────────────── */
function IssueSection({ performId }) {
    const [loading, setLoading] = useState(false);
    const [issues, setIssues] = useState([]);
    const [showAddForm, setShowAddForm] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await SwimmingPoolIssueService.list(performId, { per_page: 50 });
            const list = res.data?.data ?? (Array.isArray(res.data) ? res.data : []);
            setIssues(list);
        } catch {
            toast.error("Failed to load issues.");
        } finally {
            setLoading(false);
        }
    }, [performId]);

    useEffect(() => { load(); }, [load]);

    function handleAdded(created) {
        setIssues((prev) => [...prev, created]);
        setShowAddForm(false);
    }

    function handleUpdated(updated) {
        setIssues((prev) => prev.map((iss) => (iss.id === updated.id ? updated : iss)));
    }

    function handleDeleted(id) {
        setIssues((prev) => prev.filter((iss) => iss.id !== id));
    }

    if (loading) return <div className="flex justify-center py-10"><Spinner /></div>;

    return (
        <div className="flex flex-col gap-4">
            {/* Header row */}
            <div className="flex items-center justify-between">
                <p className="text-sm font-bold" style={{ color: "var(--text)" }}>
                    Issues ({issues.length})
                </p>
                {!showAddForm && (
                    <button
                        type="button"
                        onClick={() => setShowAddForm(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
                        style={{
                            border: "1px solid var(--border)",
                            color: "var(--text-muted)",
                            background: "var(--bg-raised)",
                        }}
                    >
                        <PlusIcon className="h-3.5 w-3.5" />
                        Add Issue
                    </button>
                )}
            </div>

            {showAddForm && (
                <AddIssueForm
                    performId={performId}
                    onAdded={handleAdded}
                    onCancel={() => setShowAddForm(false)}
                />
            )}

            {issues.length === 0 && !showAddForm ? (
                <div
                    className="flex flex-col items-center gap-3 py-10 rounded-xl"
                    style={{ background: "var(--bg-raised)", border: "1px solid var(--border)" }}
                >
                    <ExclamationTriangleIcon className="h-8 w-8" style={{ color: "var(--text-muted)", opacity: 0.4 }} />
                    <p className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>
                        No issues recorded yet.
                    </p>
                    <button
                        type="button"
                        onClick={() => setShowAddForm(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
                        style={{ background: "var(--accent)", color: "#fff" }}
                    >
                        <PlusIcon className="h-3.5 w-3.5" />
                        Add the first issue
                    </button>
                </div>
            ) : (
                issues.map((iss) => (
                    <IssueCard
                        key={iss.id}
                        issue={iss}
                        performId={performId}
                        onUpdated={handleUpdated}
                        onDeleted={handleDeleted}
                    />
                ))
            )}
        </div>
    );
}

/* ── ExecutionDetailModal ─────────────────────────────────────────────── */
export default function ExecutionDetailModal({ isOpen, onClose, perform, setup }) {
    const [activeTab, setActiveTab] = useState(0);

    const subtitle = perform?.swimming_pool_inspection?.pool_location ?? setup?.pool_location ?? "";
    const dateStr = perform?.date ? moment(perform.date).format("MMMM Do, YYYY") : "";
    const timeStr = perform?.time ? moment(perform.time, "HH:mm").format("h:mm A") : "";

    useEffect(() => {
        if (isOpen) setActiveTab(0);
    }, [isOpen, perform?.id]);

    if (!isOpen || !perform) return null;

    const tabs = [
        { label: "Checklists", icon: ClipboardDocumentListIcon },
        { label: "Issues", icon: ExclamationTriangleIcon },
    ];

    return createPortal(
        <div
            className="fixed inset-0 z-[900] flex items-center justify-center"
            style={{ background: "rgba(0,0,0,0.55)", zIndex: 10100 }}
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div
                className="relative flex flex-col rounded-2xl shadow-2xl w-full max-w-2xl mx-4"
                style={{
                    background: "var(--bg-surface)",
                    border: "1px solid var(--border)",
                    maxHeight: "90vh",
                }}
            >
                {/* Header */}
                <div
                    className="flex items-start justify-between px-6 py-5 flex-shrink-0"
                    style={{ borderBottom: "1px solid var(--border)" }}
                >
                    <div className="flex-1 min-w-0 pr-4">
                        <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-base font-bold" style={{ color: "var(--text)" }}>
                                Inspection Execution #{perform.id}
                            </p>
                            {perform.signed_off && (
                                <span
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold"
                                    style={{ background: "color-mix(in srgb,#3fb950 12%,transparent)", color: "#3fb950" }}
                                >
                                    <CheckBadgeIcon className="h-3.5 w-3.5" /> Signed Off
                                </span>
                            )}
                        </div>
                        <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                            {[subtitle, dateStr, timeStr].filter(Boolean).join(" · ")}
                        </p>
                        {(perform.performed_by ?? perform.user) && (
                            <div className="flex items-center gap-1.5 mt-2">
                                <div
                                    className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
                                    style={{ background: "var(--accent)", color: "#fff" }}
                                >
                                    {perform.performed_by?.firstname?.[0] ?? perform.user?.firstname?.[0] ?? "?"}
                                </div>
                                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                                    {[
                                        perform.performed_by?.firstname ?? perform.user?.firstname,
                                        perform.performed_by?.lastname ?? perform.user?.lastname,
                                    ].filter(Boolean).join(" ") || "Unknown performer"}
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
                    {tabs.map(({ label, icon: Icon }, idx) => (
                        <button
                            key={label}
                            type="button"
                            onClick={() => setActiveTab(idx)}
                            className="flex items-center gap-1.5 px-4 py-3 text-xs font-semibold relative"
                            style={{
                                color: activeTab === idx ? "var(--accent)" : "var(--text-muted)",
                                background: "transparent",
                            }}
                        >
                            <Icon className="h-3.5 w-3.5" />
                            {label}
                            {activeTab === idx && (
                                <span
                                    className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t"
                                    style={{ background: "var(--accent)" }}
                                />
                            )}
                        </button>
                    ))}
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto px-6 py-5">
                    {activeTab === 0 && <ChecklistSection performId={perform.id} />}
                    {activeTab === 1 && <IssueSection performId={perform.id} />}
                </div>
            </div>
        </div>,
        document.body
    );
}

