/* ── PPE Inspection — ExecutionDetailModal ────────────────────────────── */
/*
 * Opens when a user clicks a perform record in DetailDrawer.
 * Two tabs:
 *  1. Checklists — view & update item results
 *  2. Issues     — full issue lifecycle (corrective action, priority,
 *                  contractor, repair, read-only attachments)
 *
 * NOTE: PPE has no separate attachment API routes.
 *  - Issue attachments are embedded in the issue object as
 *    `ppe_inspection_issue_attachments` (read-only here).
 *  - New files can only be uploaded via issue create or repairCompletion.
 */
import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import {
    XMarkIcon,
    ExclamationTriangleIcon,
    ChevronDownIcon,
    ChevronUpIcon,
    PaperClipIcon,
    PlusIcon,
    TrashIcon,
    UserIcon,
    ClipboardDocumentListIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import {
    PpePerformService,
    PpeChecklistItemService,
    PpeIssueService,
} from "../../services/ppe.service";
import { Spinner, Field } from "./shared";
import UserAutocomplete from "./UserAutocomplete";

/* ── tiny helpers ────────────────────────────────────────────────────── */

function fmtTime(iso) {
    if (!iso) return "";
    try { return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }); }
    catch { return iso; }
}

const PRIORITY_OPTIONS = ["low", "medium", "high", "critical"];
const PRIORITY_COLOR = {
    low: { bg: "color-mix(in srgb,#3fb950 12%,transparent)", text: "#3fb950" },
    medium: { bg: "color-mix(in srgb,#d29922 12%,transparent)", text: "#d29922" },
    high: { bg: "color-mix(in srgb,#e36209 12%,transparent)", text: "#e36209" },
    critical: { bg: "color-mix(in srgb,var(--danger) 12%,transparent)", text: "var(--danger)" },
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

/* ── IssueCard ────────────────────────────────────────────────────────── */
function IssueCard({ issue, performId, onDeleted, onUpdated }) {
    const [expanded, setExpanded] = useState(false);
    const [activeSection, setActiveSection] = useState(null);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const [caText, setCaText] = useState(issue.corrective_action ?? "");
    const [priority, setPriority] = useState(issue.priority_level ?? "low");
    const [dueDate, setDueDate] = useState(issue.due_date ?? "");
    const [contractor, setContractor] = useState(
        issue.contractor
            ? { id: issue.contractor.id, firstname: issue.contractor.firstname, lastname: issue.contractor.lastname }
            : null
    );
    const [repairDate, setRepairDate] = useState(issue.repair_completion_date ?? "");
    const [repairNote, setRepairNote] = useState(issue.repair_completion_note ?? "");
    const [repairFiles, setRepairFiles] = useState([]);
    const [repairStatus, setRepairStatus] = useState(issue.repair_status ?? "");
    const [rejectReason, setRejectReason] = useState(issue.reject_reason ?? "");

    async function saveCA() {
        setSaving(true);
        try {
            await PpeIssueService.updateCorrectiveAction(performId, issue.id, caText);
            toast.success("Corrective action updated.");
            onUpdated({ ...issue, corrective_action: caText });
            setActiveSection(null);
        } catch { toast.error("Save failed."); }
        finally { setSaving(false); }
    }

    async function savePriority() {
        setSaving(true);
        try {
            await PpeIssueService.updatePriorityDueDate(performId, issue.id, {
                priority_level: priority,
                due_date: dueDate || undefined,
            });
            toast.success("Priority updated.");
            onUpdated({ ...issue, priority_level: priority, due_date: dueDate });
            setActiveSection(null);
        } catch { toast.error("Save failed."); }
        finally { setSaving(false); }
    }

    async function saveContractor() {
        if (!contractor) return;
        setSaving(true);
        try {
            await PpeIssueService.assignContractor(performId, issue.id, contractor.id);
            toast.success("Contractor assigned.");
            onUpdated({ ...issue, contractor });
            setActiveSection(null);
        } catch { toast.error("Assign failed."); }
        finally { setSaving(false); }
    }

    async function saveRepairCompletion() {
        setSaving(true);
        try {
            await PpeIssueService.repairCompletion(
                performId,
                issue.id,
                { repair_completion_date: repairDate || undefined, repair_completion_note: repairNote || undefined },
                repairFiles
            );
            toast.success("Repair completion saved.");
            onUpdated({ ...issue, repair_completion_date: repairDate, repair_completion_note: repairNote });
            setRepairFiles([]);
            setActiveSection(null);
        } catch { toast.error("Save failed."); }
        finally { setSaving(false); }
    }

    async function saveRepairStatus() {
        if (!repairStatus) return;
        if (repairStatus === "rejected" && !rejectReason.trim()) {
            toast.error("Reject reason is required.");
            return;
        }
        setSaving(true);
        try {
            await PpeIssueService.setRepairStatus(performId, issue.id, repairStatus, rejectReason);
            toast.success(`Marked as ${repairStatus}.`);
            onUpdated({ ...issue, repair_status: repairStatus, reject_reason: rejectReason });
            setActiveSection(null);
        } catch { toast.error("Save failed."); }
        finally { setSaving(false); }
    }

    async function handleDelete() {
        setDeleting(true);
        try {
            await PpeIssueService.remove(performId, issue.id);
            toast.success("Issue removed.");
            onDeleted(issue.id);
        } catch { toast.error("Delete failed."); }
        finally { setDeleting(false); }
    }

    const toggleSection = (s) => setActiveSection((p) => (p === s ? null : s));
    const contractorName = issue.contractor
        ? `${issue.contractor.firstname} ${issue.contractor.lastname}`
        : null;

    /* Embedded read-only attachments from API response — PPE-specific field */
    const attachments = issue.ppe_inspection_issue_attachments ?? [];

    return (
        <div
            className="rounded-xl overflow-hidden"
            style={{ border: "1px solid var(--border)" }}
        >
            {/* Issue header */}
            <div
                className="flex items-start justify-between gap-3 px-4 py-3 cursor-pointer"
                style={{ background: "var(--bg-raised)" }}
                onClick={() => setExpanded((p) => !p)}
            >
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold" style={{ color: "var(--text)" }}>
                            {issue.title}
                        </span>
                        {issue.priority_level && (
                            <Badge value={issue.priority_level} map={PRIORITY_COLOR} />
                        )}
                        {issue.repair_status && (
                            <Badge value={issue.repair_status} map={REPAIR_STATUS_COLOR} />
                        )}
                    </div>
                    {issue.description && (
                        <p className="text-xs" style={{ color: "var(--text-muted)" }}>{issue.description}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                        {issue.corrective_action && (
                            <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                                ✔ CA set
                            </span>
                        )}
                        {issue.due_date && (
                            <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                                📅 {issue.due_date}
                            </span>
                        )}
                        {contractorName && (
                            <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                                <UserIcon className="h-3 w-3 inline mr-0.5" />{contractorName}
                            </span>
                        )}
                        {attachments.length > 0 && (
                            <span className="text-[11px]" style={{ color: "var(--accent)" }}>
                                <PaperClipIcon className="h-3 w-3 inline mr-0.5" />{attachments.length}
                            </span>
                        )}
                    </div>
                </div>
                {expanded
                    ? <ChevronUpIcon className="h-4 w-4 flex-shrink-0" style={{ color: "var(--text-muted)" }} />
                    : <ChevronDownIcon className="h-4 w-4 flex-shrink-0" style={{ color: "var(--text-muted)" }} />
                }
            </div>

            {expanded && (
                <div
                    className="flex flex-col gap-3 px-4 py-4"
                    style={{ borderTop: "1px solid var(--border)" }}
                >
                    {/* Action buttons */}
                    <div className="flex flex-wrap gap-2">
                        {[
                            { key: "ca", label: "Corrective Action" },
                            { key: "priority", label: "Priority / Due Date" },
                            { key: "contractor", label: "Contractor" },
                            { key: "repair", label: "Repair Completion" },
                            { key: "status", label: "Repair Status" },
                            ...(attachments.length > 0 ? [{ key: "attach", label: `Attachments (${attachments.length})` }] : []),
                        ].map(({ key, label }) => (
                            <button
                                key={key}
                                onClick={() => toggleSection(key)}
                                className="text-[11px] font-semibold px-3 py-1.5 rounded-lg"
                                style={{
                                    background: activeSection === key
                                        ? "color-mix(in srgb,var(--accent) 15%,transparent)"
                                        : "var(--bg)",
                                    color: activeSection === key ? "var(--accent)" : "var(--text-muted)",
                                    border: activeSection === key
                                        ? "1px solid color-mix(in srgb,var(--accent) 30%,transparent)"
                                        : "1px solid var(--border)",
                                }}
                            >
                                {label}
                            </button>
                        ))}
                    </div>

                    {/* Corrective Action */}
                    {activeSection === "ca" && (
                        <SectionCard>
                            <p className="text-xs font-bold mb-3" style={{ color: "var(--text)" }}>
                                Corrective Action
                            </p>
                            <Field label="">
                                <textarea
                                    rows={3}
                                    value={caText}
                                    onChange={(e) => setCaText(e.target.value)}
                                    placeholder="Describe the corrective action…"
                                    className="ui-input text-sm resize-none w-full"
                                />
                            </Field>
                            <div className="flex justify-end mt-3">
                                <button
                                    onClick={saveCA}
                                    disabled={saving}
                                    className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg text-white"
                                    style={{ background: "var(--accent)", opacity: saving ? 0.6 : 1 }}
                                >
                                    {saving ? <Spinner size={3} /> : null} Save
                                </button>
                            </div>
                        </SectionCard>
                    )}

                    {/* Priority / Due Date */}
                    {activeSection === "priority" && (
                        <SectionCard>
                            <p className="text-xs font-bold mb-3" style={{ color: "var(--text)" }}>
                                Priority & Due Date
                            </p>
                            <div className="flex flex-wrap gap-2 mb-3">
                                {PRIORITY_OPTIONS.map((p) => {
                                    const c = PRIORITY_COLOR[p];
                                    const active = priority === p;
                                    return (
                                        <button
                                            key={p}
                                            onClick={() => setPriority(p)}
                                            className="text-[11px] font-bold px-3 py-1.5 rounded-full capitalize"
                                            style={{
                                                background: active ? c.bg : "transparent",
                                                color: active ? c.text : "var(--text-muted)",
                                                border: `1px solid ${active ? c.text : "var(--border)"}`,
                                            }}
                                        >
                                            {p}
                                        </button>
                                    );
                                })}
                            </div>
                            <div className="grid grid-cols-2 gap-3 mb-3">
                                <Field label="Due Date">
                                    <input
                                        type="date"
                                        value={dueDate}
                                        onChange={(e) => setDueDate(e.target.value)}
                                        className="ui-input text-sm"
                                    />
                                </Field>
                            </div>
                            <div className="flex justify-end mt-3">
                                <button
                                    onClick={savePriority}
                                    disabled={saving}
                                    className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg text-white"
                                    style={{ background: "var(--accent)", opacity: saving ? 0.6 : 1 }}
                                >
                                    {saving ? <Spinner size={3} /> : null} Save
                                </button>
                            </div>
                        </SectionCard>
                    )}

                    {/* Assign Contractor */}
                    {activeSection === "contractor" && (
                        <SectionCard>
                            <p className="text-xs font-bold mb-3" style={{ color: "var(--text)" }}>
                                Assign Contractor
                            </p>
                            <Field label="Contractor (role: contractor)">
                                <UserAutocomplete
                                    roleFilter="contractor"
                                    value={contractor}
                                    onChange={setContractor}
                                    placeholder="Search contractor…"
                                />
                            </Field>
                            <div className="flex justify-end mt-3">
                                <button
                                    onClick={saveContractor}
                                    disabled={saving || !contractor}
                                    className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg text-white"
                                    style={{ background: "var(--accent)", opacity: saving || !contractor ? 0.6 : 1 }}
                                >
                                    {saving ? <Spinner size={3} /> : null} Assign
                                </button>
                            </div>
                        </SectionCard>
                    )}

                    {/* Repair Completion */}
                    {activeSection === "repair" && (
                        <SectionCard>
                            <p className="text-xs font-bold mb-3" style={{ color: "var(--text)" }}>
                                Repair Completion
                            </p>
                            <div className="grid grid-cols-2 gap-3 mb-3">
                                <Field label="Completion Date">
                                    <input
                                        type="date"
                                        value={repairDate}
                                        onChange={(e) => setRepairDate(e.target.value)}
                                        className="ui-input text-sm"
                                    />
                                </Field>
                            </div>
                            <Field label="Note">
                                <textarea
                                    rows={2}
                                    value={repairNote}
                                    onChange={(e) => setRepairNote(e.target.value)}
                                    placeholder="Repair completion notes…"
                                    className="ui-input text-sm resize-none w-full"
                                />
                            </Field>
                            {/* Repair file attachments */}
                            <div className="mt-3">
                                <p className="text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>
                                    Repair Attachments (optional)
                                </p>
                                {repairFiles.length > 0 && (
                                    <div className="flex flex-col gap-1 mb-2">
                                        {repairFiles.map((f, i) => (
                                            <div key={i} className="flex items-center gap-2 text-xs" style={{ color: "var(--text-muted)" }}>
                                                <PaperClipIcon className="h-3.5 w-3.5" />
                                                <span className="truncate flex-1">{f.name}</span>
                                                <button
                                                    onClick={() => setRepairFiles((p) => p.filter((_, j) => j !== i))}
                                                    style={{ color: "var(--danger)" }}
                                                >
                                                    <XMarkIcon className="h-3.5 w-3.5" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <label
                                    className="flex items-center gap-1.5 text-[11px] font-medium cursor-pointer px-3 py-1.5 rounded-lg"
                                    style={{ border: "1px dashed var(--border)", color: "var(--text-muted)" }}
                                >
                                    <PaperClipIcon className="h-3.5 w-3.5" />
                                    Add file
                                    <input
                                        type="file"
                                        className="hidden"
                                        onChange={(e) => {
                                            const f = e.target.files?.[0];
                                            if (f) setRepairFiles((p) => [...p, f]);
                                            e.target.value = "";
                                        }}
                                    />
                                </label>
                            </div>
                            <div className="flex justify-end mt-3">
                                <button
                                    onClick={saveRepairCompletion}
                                    disabled={saving}
                                    className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg text-white"
                                    style={{ background: "var(--accent)", opacity: saving ? 0.6 : 1 }}
                                >
                                    {saving ? <Spinner size={3} /> : null} Save
                                </button>
                            </div>
                        </SectionCard>
                    )}

                    {/* Set Repair Status */}
                    {activeSection === "status" && (
                        <SectionCard>
                            <p className="text-xs font-bold mb-3" style={{ color: "var(--text)" }}>
                                Set Repair Status
                            </p>
                            <div className="flex gap-2 mb-3">
                                {["approved", "rejected"].map((s) => (
                                    <button
                                        key={s}
                                        onClick={() => setRepairStatus(s)}
                                        className="flex-1 py-2 rounded-lg text-xs font-bold capitalize"
                                        style={{
                                            border: `2px solid ${repairStatus === s
                                                ? s === "approved" ? "#3fb950" : "var(--danger)"
                                                : "var(--border)"}`,
                                            color: repairStatus === s
                                                ? s === "approved" ? "#3fb950" : "var(--danger)"
                                                : "var(--text-muted)",
                                            background: repairStatus === s
                                                ? s === "approved"
                                                    ? "color-mix(in srgb,#3fb950 10%,transparent)"
                                                    : "color-mix(in srgb,var(--danger) 10%,transparent)"
                                                : "transparent",
                                        }}
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>
                            {repairStatus === "rejected" && (
                                <Field label="Reject Reason" required>
                                    <textarea
                                        rows={2}
                                        value={rejectReason}
                                        onChange={(e) => setRejectReason(e.target.value)}
                                        placeholder="Reason for rejection…"
                                        className="ui-input text-sm resize-none w-full"
                                    />
                                </Field>
                            )}
                            <div className="flex justify-end mt-3">
                                <button
                                    onClick={saveRepairStatus}
                                    disabled={saving || !repairStatus}
                                    className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg text-white"
                                    style={{ background: "var(--accent)", opacity: saving || !repairStatus ? 0.6 : 1 }}
                                >
                                    {saving ? <Spinner size={3} /> : null} Submit
                                </button>
                            </div>
                        </SectionCard>
                    )}

                    {/* Read-only attachments (embedded in issue object) */}
                    {activeSection === "attach" && attachments.length > 0 && (
                        <SectionCard>
                            <p className="text-xs font-bold mb-3" style={{ color: "var(--text)" }}>
                                Issue Attachments
                            </p>
                            <div className="flex flex-col gap-1.5">
                                {attachments.map((a, idx) => (
                                    <a
                                        key={a.id ?? idx}
                                        href={a.file_url ?? a.url ?? "#"}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:opacity-80"
                                        style={{ background: "var(--bg)", border: "1px solid var(--border)" }}
                                    >
                                        <PaperClipIcon className="h-3.5 w-3.5 flex-shrink-0" style={{ color: "var(--text-muted)" }} />
                                        <span className="text-xs truncate flex-1" style={{ color: "var(--accent)" }}>
                                            {a.file_name ?? a.filename ?? `Attachment #${a.id ?? idx + 1}`}
                                        </span>
                                    </a>
                                ))}
                            </div>
                        </SectionCard>
                    )}

                    {/* Delete issue */}
                    <div className="flex justify-end pt-1">
                        <button
                            onClick={handleDelete}
                            disabled={deleting}
                            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg"
                            style={{
                                border: "1px solid color-mix(in srgb,var(--danger) 30%,transparent)",
                                color: "var(--danger)",
                                background: "color-mix(in srgb,var(--danger) 6%,transparent)",
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

/* ── AddIssueForm ─────────────────────────────────────────────────────── */
function AddIssueForm({ performId, onAdded, onCancel }) {
    const [form, setForm] = useState({ title: "", description: "", corrective_action: "" });
    const [files, setFiles] = useState([]);
    const [saving, setSaving] = useState(false);
    const [titleError, setTitleError] = useState("");

    async function handleSubmit() {
        if (!form.title.trim()) { setTitleError("Title is required."); return; }
        setSaving(true);
        try {
            const res = await PpeIssueService.create(performId, form, files);
            toast.success("Issue added.");
            onAdded(res.data ?? res);
        } catch (e) {
            toast.error(
                e?.response?.data?.errors?.join(", ") ||
                e?.response?.data?.error ||
                "Failed to add issue."
            );
        } finally {
            setSaving(false);
        }
    }

    return (
        <SectionCard className="border-dashed">
            <p className="text-xs font-bold mb-3" style={{ color: "var(--text)" }}>
                New Issue
            </p>
            <div className="flex flex-col gap-3">
                <Field label="Title" required error={titleError}>
                    <input
                        type="text"
                        value={form.title}
                        onChange={(e) => { setForm((f) => ({ ...f, title: e.target.value })); setTitleError(""); }}
                        placeholder="Issue title…"
                        className="ui-input text-sm"
                    />
                </Field>
                <Field label="Description">
                    <textarea
                        rows={2}
                        value={form.description}
                        onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                        placeholder="Describe the issue…"
                        className="ui-input text-sm resize-none"
                    />
                </Field>
                <Field label="Corrective Action">
                    <textarea
                        rows={2}
                        value={form.corrective_action}
                        onChange={(e) => setForm((f) => ({ ...f, corrective_action: e.target.value }))}
                        placeholder="Corrective action…"
                        className="ui-input text-sm resize-none"
                    />
                </Field>
                <div>
                    {files.length > 0 && (
                        <div className="flex flex-col gap-1 mb-2">
                            {files.map((f, i) => (
                                <div key={i} className="flex items-center gap-2 text-xs" style={{ color: "var(--text-muted)" }}>
                                    <PaperClipIcon className="h-3.5 w-3.5" />
                                    <span className="truncate flex-1">{f.name}</span>
                                    <button
                                        onClick={() => setFiles((p) => p.filter((_, j) => j !== i))}
                                        style={{ color: "var(--danger)" }}
                                    >
                                        <XMarkIcon className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                    <label
                        className="flex items-center gap-1.5 text-[11px] cursor-pointer px-3 py-1.5 rounded-lg"
                        style={{ border: "1px dashed var(--border)", color: "var(--text-muted)" }}
                    >
                        <PaperClipIcon className="h-3.5 w-3.5" /> Add attachment
                        <input
                            type="file"
                            className="hidden"
                            onChange={(e) => {
                                const f = e.target.files?.[0];
                                if (f) setFiles((p) => [...p, f]);
                                e.target.value = "";
                            }}
                        />
                    </label>
                </div>
                <div className="flex justify-end gap-2">
                    <button
                        onClick={onCancel}
                        className="text-xs px-3 py-1.5 rounded-lg"
                        style={{ border: "1px solid var(--border)", color: "var(--text-muted)" }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={saving}
                        className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg text-white"
                        style={{ background: "var(--accent)", opacity: saving ? 0.6 : 1 }}
                    >
                        {saving ? <Spinner size={3} /> : null} Add Issue
                    </button>
                </div>
            </div>
        </SectionCard>
    );
}

/* ── ChecklistSection ─────────────────────────────────────────────────── */
function ChecklistSection({ performId }) {
    const [checklists, setChecklists] = useState([]);
    const [loading, setLoading] = useState(false);
    const [localResults, setLocalResults] = useState({});
    const [saving, setSaving] = useState(null);
    const [expanded, setExpanded] = useState({});

    const load = useCallback(async () => {
        if (!performId) return;
        setLoading(true);
        try {
            const res = await PpePerformService.get(performId, { include: "checklists" });
            const data = res.data ?? res;
            /* PPE-specific field names */
            const pcs = data.performed_ppe_checklists ?? [];
            setChecklists(pcs);
            const init = {};
            pcs.forEach((pc) => {
                init[pc.id] = {};
                (pc.performed_ppe_checklist_items ?? []).forEach((pci) => {
                    init[pc.id][pci.checklist_item_template_id] = {
                        status: pci.status ?? "satisfactory",
                        comment: pci.comment ?? "",
                    };
                });
                (pc.checklist_template?.checklist_item_templates ?? []).forEach((tmplItem) => {
                    if (!init[pc.id][tmplItem.id]) {
                        init[pc.id][tmplItem.id] = { status: "satisfactory", comment: "" };
                    }
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

    function setItemField(pcId, itemId, field, val) {
        setLocalResults((prev) => ({
            ...prev,
            [pcId]: {
                ...prev[pcId],
                [itemId]: { ...prev[pcId]?.[itemId], [field]: val },
            },
        }));
    }

    async function saveChecklist(pc) {
        setSaving(pc.id);
        try {
            const items = Object.entries(localResults[pc.id] ?? {}).map(([templateItemId, vals]) => ({
                checklist_item_template_id: Number(templateItemId),
                status: vals.status,
                comment: vals.comment || undefined,
            }));
            await PpeChecklistItemService.upsert(performId, pc.id, items);
            toast.success(`"${pc.checklist_template?.name}" saved.`);
        } catch {
            toast.error("Save failed.");
        } finally {
            setSaving(null);
        }
    }

    if (loading) {
        return <div className="flex justify-center py-12"><Spinner /></div>;
    }

    if (checklists.length === 0) {
        return (
            <div
                className="p-8 rounded-xl text-center"
                style={{ background: "var(--bg-raised)", border: "1px solid var(--border)" }}
            >
                <ClipboardDocumentListIcon className="h-8 w-8 mx-auto mb-2" style={{ color: "var(--text-muted)", opacity: 0.5 }} />
                <p className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>
                    No checklists recorded for this execution.
                </p>
            </div>
        );
    }

    const _allItems = checklists.flatMap((pc) =>
        (pc.performed_ppe_checklist_items ?? []).map((i) => ({
            pcId: pc.id,
            templateId: i.checklist_item_template_id,
            savedStatus: i.status,
        }))
    );
    const totalItems = _allItems.length;
    const totalSat = _allItems.filter(i => (localResults[i.pcId]?.[i.templateId]?.status ?? i.savedStatus) === "satisfactory").length;
    const totalAttn = _allItems.filter(i => (localResults[i.pcId]?.[i.templateId]?.status ?? i.savedStatus) === "needs_attention").length;
    const totalNA = _allItems.filter(i => (localResults[i.pcId]?.[i.templateId]?.status ?? i.savedStatus) === "not_applicable").length;

    return (
        <div className="flex flex-col gap-3">
            {totalItems > 0 && (
                <div className="grid grid-cols-3 gap-2">
                    <div
                        className="rounded-xl p-3 text-center"
                        style={{ background: "color-mix(in srgb,#3fb950 10%,transparent)", border: "1px solid color-mix(in srgb,#3fb950 30%,transparent)" }}
                    >
                        <p className="text-2xl font-bold" style={{ color: "#3fb950" }}>{totalSat}</p>
                        <p className="text-[10px] font-semibold uppercase tracking-wider mt-0.5" style={{ color: "#3fb950", opacity: 0.85 }}>Satisfactory</p>
                    </div>
                    <div
                        className="rounded-xl p-3 text-center"
                        style={{ background: "color-mix(in srgb,#d29922 10%,transparent)", border: "1px solid color-mix(in srgb,#d29922 30%,transparent)" }}
                    >
                        <p className="text-2xl font-bold" style={{ color: "#d29922" }}>{totalAttn}</p>
                        <p className="text-[10px] font-semibold uppercase tracking-wider mt-0.5" style={{ color: "#d29922", opacity: 0.85 }}>Needs Attention</p>
                    </div>
                    <div
                        className="rounded-xl p-3 text-center"
                        style={{ background: "var(--bg-raised)", border: "1px solid var(--border)" }}
                    >
                        <p className="text-2xl font-bold" style={{ color: "var(--text-muted)" }}>{totalNA}</p>
                        <p className="text-[10px] font-semibold uppercase tracking-wider mt-0.5" style={{ color: "var(--text-muted)", opacity: 0.85 }}>N/A</p>
                    </div>
                </div>
            )}

            {checklists.map((pc) => {
                const tmpl = pc.checklist_template ?? {};
                const performedItems = pc.performed_ppe_checklist_items ?? [];
                const isExpanded = expanded[pc.id] ?? false;
                const pcResults = localResults[pc.id] ?? {};

                const sat = performedItems.filter((i) => (pcResults[i.checklist_item_template_id]?.status ?? i.status) === "satisfactory").length;
                const attn = performedItems.filter((i) => (pcResults[i.checklist_item_template_id]?.status ?? i.status) === "needs_attention").length;
                const na = performedItems.filter((i) => (pcResults[i.checklist_item_template_id]?.status ?? i.status) === "not_applicable").length;

                return (
                    <div
                        key={pc.id}
                        className="rounded-xl overflow-hidden"
                        style={{ border: "1px solid var(--border)" }}
                    >
                        <div
                            className="flex items-center justify-between gap-3 px-4 py-3 cursor-pointer"
                            style={{ background: "var(--bg-raised)" }}
                            onClick={() => setExpanded((p) => ({ ...p, [pc.id]: !p[pc.id] }))}
                        >
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    {tmpl.position != null && (
                                        <span
                                            className="flex-shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded"
                                            style={{ background: "var(--bg)", color: "var(--text-muted)", border: "1px solid var(--border)" }}
                                        >
                                            §{tmpl.position}
                                        </span>
                                    )}
                                    <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>
                                        {tmpl.name ?? `Checklist #${pc.id}`}
                                    </p>
                                </div>
                                {tmpl.description && (
                                    <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                                        {tmpl.description}
                                    </p>
                                )}
                            </div>
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                                <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                                    {performedItems.length} items
                                </span>
                                {sat > 0 && (
                                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={STATUS_ITEM_COLOR.satisfactory}>
                                        ✓ {sat}
                                    </span>
                                )}
                                {attn > 0 && (
                                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={STATUS_ITEM_COLOR.needs_attention}>
                                        ⚠ {attn}
                                    </span>
                                )}
                                {na > 0 && (
                                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ ...STATUS_ITEM_COLOR.not_applicable, border: "1px solid var(--border)" }}>
                                        — {na}
                                    </span>
                                )}
                                {isExpanded
                                    ? <ChevronUpIcon className="h-4 w-4 ml-1" style={{ color: "var(--text-muted)" }} />
                                    : <ChevronDownIcon className="h-4 w-4 ml-1" style={{ color: "var(--text-muted)" }} />
                                }
                            </div>
                        </div>

                        {isExpanded && (
                            <div style={{ borderTop: "1px solid var(--border)" }}>
                                {performedItems.length === 0 ? (
                                    <p className="px-4 py-3 text-xs" style={{ color: "var(--text-muted)" }}>
                                        No items recorded.
                                    </p>
                                ) : (
                                    <>
                                        <div className="flex flex-col">
                                            {performedItems.map((item, idx) => {
                                                const tmplItem = item.checklist_item_template ?? {};
                                                const templateId = item.checklist_item_template_id;
                                                const val = pcResults[templateId] ?? { status: item.status ?? "satisfactory", comment: item.comment ?? "" };
                                                const col = STATUS_ITEM_COLOR[val.status] ?? STATUS_ITEM_COLOR.satisfactory;
                                                const borderColor =
                                                    val.status === "satisfactory" ? "#3fb950" :
                                                    val.status === "needs_attention" ? "#d29922" :
                                                    "var(--border-muted, var(--border))";
                                                return (
                                                    <div
                                                        key={item.id}
                                                        className="flex gap-3 px-4 py-3"
                                                        style={{
                                                            borderTop: idx > 0 ? "1px solid var(--border)" : "none",
                                                            borderLeft: `3px solid ${borderColor}`,
                                                            background: val.status === "needs_attention"
                                                                ? "color-mix(in srgb,#d29922 4%,transparent)"
                                                                : "transparent",
                                                            transition: "background 0.15s",
                                                        }}
                                                    >
                                                        <div
                                                            className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold mt-0.5"
                                                            style={{ background: col.bg, color: col.text, border: `1px solid ${col.text}` }}
                                                        >
                                                            {tmplItem.position ?? idx + 1}
                                                        </div>

                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-start justify-between gap-2 mb-2">
                                                                <p className="text-xs font-medium leading-snug" style={{ color: "var(--text)" }}>
                                                                    {tmplItem.label ?? `Item #${item.id}`}
                                                                </p>
                                                                <Badge value={val.status} map={STATUS_ITEM_COLOR} />
                                                            </div>

                                                            {val.comment && (
                                                                <div
                                                                    className="flex items-start gap-1.5 px-2.5 py-1.5 rounded-lg mb-2 text-xs"
                                                                    style={{
                                                                        background: "color-mix(in srgb,#d29922 8%,transparent)",
                                                                        border: "1px solid color-mix(in srgb,#d29922 25%,transparent)",
                                                                        color: "var(--text)",
                                                                    }}
                                                                >
                                                                    <span className="flex-shrink-0" style={{ color: "#d29922" }}>💬</span>
                                                                    <span>{val.comment}</span>
                                                                </div>
                                                            )}

                                                            <div className="flex flex-wrap gap-1 mb-2">
                                                                {STATUS_ITEM_OPTIONS.map((opt) => {
                                                                    const active = val.status === opt.value;
                                                                    const c = STATUS_ITEM_COLOR[opt.value];
                                                                    return (
                                                                        <button
                                                                            key={opt.value}
                                                                            onClick={() => setItemField(pc.id, templateId, "status", opt.value)}
                                                                            className="text-[10px] font-bold px-2.5 py-1 rounded-full"
                                                                            style={{
                                                                                background: active ? c.bg : "transparent",
                                                                                color: active ? c.text : "var(--text-muted)",
                                                                                border: `1px solid ${active ? c.text : "var(--border)"}`,
                                                                                transition: "all 0.12s",
                                                                            }}
                                                                        >
                                                                            {opt.label}
                                                                        </button>
                                                                    );
                                                                })}
                                                            </div>

                                                            <input
                                                                type="text"
                                                                value={val.comment}
                                                                onChange={(e) => setItemField(pc.id, templateId, "comment", e.target.value)}
                                                                placeholder="Add a comment…"
                                                                className="ui-input text-xs w-full"
                                                            />
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        <div
                                            className="flex justify-end px-4 py-3"
                                            style={{ background: "var(--bg-raised)", borderTop: "1px solid var(--border)" }}
                                        >
                                            <button
                                                onClick={() => saveChecklist(pc)}
                                                disabled={saving === pc.id}
                                                className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-lg text-white"
                                                style={{ background: "var(--accent)", opacity: saving === pc.id ? 0.6 : 1 }}
                                            >
                                                {saving === pc.id ? <Spinner size={3} /> : null}
                                                Save Checklist
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
    const [issues, setIssues] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showAddForm, setShowAddForm] = useState(false);

    const load = useCallback(async () => {
        if (!performId) return;
        setLoading(true);
        try {
            const res = await PpeIssueService.list(performId, { per_page: 50 });
            setIssues(Array.isArray(res) ? res : res.data ?? []);
        } catch {
            toast.error("Failed to load issues.");
        } finally {
            setLoading(false);
        }
    }, [performId]);

    useEffect(() => { load(); }, [load]);

    function handleDeleted(id) { setIssues((p) => p.filter((x) => x.id !== id)); }
    function handleUpdated(updated) { setIssues((p) => p.map((x) => (x.id === updated.id ? updated : x))); }
    function handleAdded(newIssue) { setIssues((p) => [newIssue, ...p]); setShowAddForm(false); }

    if (loading) {
        return <div className="flex justify-center py-12"><Spinner /></div>;
    }

    return (
        <div className="flex flex-col gap-3">
            {!showAddForm && (
                <div className="flex justify-end">
                    <button
                        onClick={() => setShowAddForm(true)}
                        className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg"
                        style={{
                            border: "1px solid var(--border)",
                            color: "var(--text-muted)",
                            background: "var(--bg-raised)",
                        }}
                    >
                        <PlusIcon className="h-3.5 w-3.5" /> Add Issue
                    </button>
                </div>
            )}

            {showAddForm && (
                <AddIssueForm
                    performId={performId}
                    onAdded={handleAdded}
                    onCancel={() => setShowAddForm(false)}
                />
            )}

            {issues.length === 0 && !showAddForm ? (
                <div
                    className="p-8 rounded-xl text-center"
                    style={{ background: "var(--bg-raised)", border: "1px solid var(--border)" }}
                >
                    <ExclamationTriangleIcon
                        className="h-8 w-8 mx-auto mb-2"
                        style={{ color: "var(--text-muted)", opacity: 0.4 }}
                    />
                    <p className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>
                        No issues recorded for this execution.
                    </p>
                    <button
                        onClick={() => setShowAddForm(true)}
                        className="mt-3 text-xs font-semibold"
                        style={{ color: "var(--accent)" }}
                    >
                        + Add the first issue
                    </button>
                </div>
            ) : (
                issues.map((issue) => (
                    <IssueCard
                        key={issue.id}
                        issue={issue}
                        performId={performId}
                        onDeleted={handleDeleted}
                        onUpdated={handleUpdated}
                    />
                ))
            )}
        </div>
    );
}

/* ══════════════════════════════════════════════════════════════════════ */
/*  Main export: ExecutionDetailModal                                     */
/* ══════════════════════════════════════════════════════════════════════ */
export default function ExecutionDetailModal({ isOpen, onClose, perform, setup }) {
    const [activeTab, setActiveTab] = useState(0);

    useEffect(() => {
        if (isOpen) setActiveTab(0);
    }, [isOpen, perform?.id]);

    if (!isOpen || !perform) return null;

    const signed = Boolean(perform.signed_off_at);
    const tabs = [
        { label: "Checklists", icon: ClipboardDocumentListIcon },
        { label: "Issues", icon: ExclamationTriangleIcon },
    ];

    const department = perform.ppe_inspection?.department ?? setup?.department ?? "";
    const ppeUserObj = perform.ppe_inspection?.ppe_user;
    const ppeUserName = ppeUserObj
        ? ppeUserObj.firstname + " " + ppeUserObj.lastname
        : "";

    return createPortal(
        <div
            className="fixed inset-0 flex items-center justify-center"
            style={{ background: "rgba(0,0,0,0.55)", zIndex: 10100 }}
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div
                className="flex flex-col rounded-2xl shadow-2xl w-full max-w-2xl mx-4"
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
                    <div>
                        <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-sm font-bold" style={{ color: "var(--text)" }}>
                                Execution #{perform.id}
                            </span>
                            <span
                                className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                                style={
                                    signed
                                        ? { background: "color-mix(in srgb,#3fb950 15%,transparent)", color: "#3fb950" }
                                        : { background: "color-mix(in srgb,#d29922 15%,transparent)", color: "#d29922" }
                                }
                            >
                                {signed ? "✓ Signed Off" : "Pending Sign-Off"}
                            </span>
                        </div>
                        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                            {department || "PPE Inspection"}
                            {ppeUserName ? ` · ${ppeUserName}` : ""}
                            {perform.date ? ` · ${perform.date}` : ""}
                            {perform.time ? ` at ${fmtTime(perform.time)}` : ""}
                        </p>
                        {perform.note && (
                            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                                {perform.note}
                            </p>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg hover:opacity-70"
                        style={{ color: "var(--text-muted)" }}
                    >
                        <XMarkIcon className="h-5 w-5" />
                    </button>
                </div>

                {/* Tabs */}
                <div
                    className="flex flex-shrink-0"
                    style={{ borderBottom: "1px solid var(--border)" }}
                >
                    {tabs.map((t, i) => {
                        const Icon = t.icon;
                        const active = activeTab === i;
                        return (
                            <button
                                key={i}
                                onClick={() => setActiveTab(i)}
                                className="flex items-center gap-1.5 px-5 py-3 text-sm font-semibold relative"
                                style={{ color: active ? "var(--accent)" : "var(--text-muted)" }}
                            >
                                <Icon className="h-4 w-4" />
                                {t.label}
                                {active && (
                                    <span
                                        className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                                        style={{ background: "var(--accent)" }}
                                    />
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Tab content */}
                <div className="flex-1 overflow-y-auto px-6 py-5">
                    {activeTab === 0 && <ChecklistSection performId={perform.id} />}
                    {activeTab === 1 && <IssueSection performId={perform.id} />}
                </div>
            </div>
        </div>,
        document.body
    );
}
