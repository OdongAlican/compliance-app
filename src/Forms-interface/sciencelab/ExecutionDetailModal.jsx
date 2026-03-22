/* ── Science Lab — ExecutionDetailModal ───────────────────────────────── */
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
    ScienceLabPerformService,
    ScienceLabChecklistItemService,
    ScienceLabIssueService,
    ScienceLabAttachmentService,
    ScienceLabRepairAttachmentService,
} from "../../services/scienceLab.service";
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

/* ── AttachmentList ───────────────────────────────────────────────────── */
function AttachmentList({ performId, issueId, kind = "issue" }) {
    /* kind: "issue" | "repair" */
    const svc = kind === "repair" ? ScienceLabRepairAttachmentService : ScienceLabAttachmentService;
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
                                <span className="text-xs truncate" style={{ color: "var(--text)" }}>
                                    {a.file_name ?? a.file_path ?? `Attachment #${a.id}`}
                                </span>
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

/* ── IssueCard ────────────────────────────────────────────────────────── */
function IssueCard({ issue, performId, onDeleted, onUpdated }) {
    const [expanded, setExpanded] = useState(false);
    const [activeSection, setActiveSection] = useState(null);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [attachTab, setAttachTab] = useState("issue"); // "issue" | "repair"

    /* Local form states per action */
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

    /* Save helpers */
    async function saveCA() {
        setSaving(true);
        try {
            const res = await ScienceLabIssueService.updateCorrectiveAction(performId, issue.id, caText);
            toast.success("Corrective action updated.");
            onUpdated({ ...issue, corrective_action: caText, ...(res.data ?? {}) });
            setActiveSection(null);
        } catch { toast.error("Save failed."); }
        finally { setSaving(false); }
    }

    async function savePriority() {
        setSaving(true);
        try {
            const res = await ScienceLabIssueService.updatePriorityDueDate(performId, issue.id, {
                priority_level: priority,
                due_date: dueDate || undefined,
            });
            toast.success("Priority updated.");
            onUpdated({ ...issue, priority_level: priority, due_date: dueDate, ...(res.data ?? {}) });
            setActiveSection(null);
        } catch { toast.error("Save failed."); }
        finally { setSaving(false); }
    }

    async function saveContractor() {
        if (!contractor) return;
        setSaving(true);
        try {
            const res = await ScienceLabIssueService.assignContractor(performId, issue.id, contractor.id);
            toast.success("Contractor assigned.");
            onUpdated({ ...issue, contractor, ...(res.data ?? {}) });
            setActiveSection(null);
        } catch { toast.error("Assign failed."); }
        finally { setSaving(false); }
    }

    async function saveRepairCompletion() {
        setSaving(true);
        try {
            await ScienceLabIssueService.repairCompletion(
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
            const res = await ScienceLabIssueService.setRepairStatus(
                performId, issue.id, repairStatus, rejectReason
            );
            toast.success(`Marked as ${repairStatus}.`);
            onUpdated({ ...issue, repair_status: repairStatus, reject_reason: rejectReason, ...(res.data ?? {}) });
            setActiveSection(null);
        } catch { toast.error("Save failed."); }
        finally { setSaving(false); }
    }

    async function handleDelete() {
        setDeleting(true);
        try {
            await ScienceLabIssueService.remove(performId, issue.id);
            toast.success("Issue removed.");
            onDeleted(issue.id);
        } catch { toast.error("Delete failed."); }
        finally { setDeleting(false); }
    }

    const toggleSection = (s) => setActiveSection((p) => (p === s ? null : s));
    const contractorName = issue.contractor
        ? `${issue.contractor.firstname} ${issue.contractor.lastname}`
        : null;

    return (
        <div
            className="rounded-xl overflow-hidden"
            style={{ border: "1px solid var(--border)", background: "var(--bg-raised)" }}
        >
            {/* Header row */}
            <div
                className="flex items-start justify-between gap-3 p-4 cursor-pointer"
                onClick={() => setExpanded((p) => !p)}
            >
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                        <ExclamationTriangleIcon className="h-4 w-4 flex-shrink-0" style={{ color: "var(--danger)" }} />
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
                        <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                            {issue.description}
                        </p>
                    )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                    {expanded
                        ? <ChevronUpIcon className="h-4 w-4" style={{ color: "var(--text-muted)" }} />
                        : <ChevronDownIcon className="h-4 w-4" style={{ color: "var(--text-muted)" }} />
                    }
                </div>
            </div>

            {/* Expanded body */}
            {expanded && (
                <div
                    className="px-4 pb-4 flex flex-col gap-3"
                    style={{ borderTop: "1px solid var(--border)" }}
                >
                    {/* Meta info */}
                    <div className="grid grid-cols-2 gap-2 pt-3">
                        {issue.corrective_action && (
                            <div className="col-span-2">
                                <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5" style={{ color: "var(--text-muted)" }}>
                                    Corrective Action
                                </p>
                                <p className="text-xs" style={{ color: "var(--text)" }}>{issue.corrective_action}</p>
                            </div>
                        )}
                        {issue.due_date && (
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5" style={{ color: "var(--text-muted)" }}>
                                    Due Date
                                </p>
                                <p className="text-xs" style={{ color: "var(--text)" }}>{issue.due_date}</p>
                            </div>
                        )}
                        {contractorName && (
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5" style={{ color: "var(--text-muted)" }}>
                                    Contractor
                                </p>
                                <p className="text-xs" style={{ color: "var(--text)" }}>{contractorName}</p>
                            </div>
                        )}
                        {issue.repair_completion_date && (
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5" style={{ color: "var(--text-muted)" }}>
                                    Repair Completed
                                </p>
                                <p className="text-xs" style={{ color: "var(--text)" }}>{issue.repair_completion_date}</p>
                            </div>
                        )}
                        {issue.reject_reason && (
                            <div className="col-span-2">
                                <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5" style={{ color: "var(--danger)" }}>
                                    Reject Reason
                                </p>
                                <p className="text-xs" style={{ color: "var(--text)" }}>{issue.reject_reason}</p>
                            </div>
                        )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-wrap gap-1.5">
                        {[
                            { key: "ca", label: "Corrective Action", icon: ClipboardDocumentListIcon },
                            { key: "priority", label: "Priority / Due Date", icon: CalendarDaysIcon },
                            { key: "contractor", label: "Assign Contractor", icon: UserIcon },
                            { key: "repair", label: "Repair Completion", icon: WrenchScrewdriverIcon },
                            { key: "status", label: "Set Repair Status", icon: CheckBadgeIcon },
                            { key: "attach", label: "Attachments", icon: PaperClipIcon },
                        ].map(({ key, label, icon: Icon }) => (
                            <button
                                key={key}
                                onClick={() => toggleSection(key)}
                                className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1.5 rounded-lg"
                                style={{
                                    border: `1px solid ${activeSection === key ? "var(--accent)" : "var(--border)"}`,
                                    color: activeSection === key ? "var(--accent)" : "var(--text-muted)",
                                    background: activeSection === key
                                        ? "color-mix(in srgb,var(--accent) 8%,transparent)"
                                        : "transparent",
                                    transition: "all 0.15s",
                                }}
                            >
                                <Icon className="h-3.5 w-3.5" />
                                {label}
                            </button>
                        ))}
                    </div>

                    {/* Action panels */}

                    {/* Corrective Action */}
                    {activeSection === "ca" && (
                        <SectionCard>
                            <p className="text-xs font-bold mb-2" style={{ color: "var(--text)" }}>
                                Corrective Action
                            </p>
                            <textarea
                                rows={3}
                                value={caText}
                                onChange={(e) => setCaText(e.target.value)}
                                placeholder="Describe the corrective action taken…"
                                className="ui-input text-sm resize-none w-full"
                            />
                            <div className="flex justify-end mt-2">
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

                    {/* Priority + Due Date */}
                    {activeSection === "priority" && (
                        <SectionCard>
                            <p className="text-xs font-bold mb-3" style={{ color: "var(--text)" }}>
                                Priority & Due Date
                            </p>
                            <div className="grid grid-cols-2 gap-3">
                                <Field label="Priority">
                                    <select
                                        value={priority}
                                        onChange={(e) => setPriority(e.target.value)}
                                        className="ui-input text-sm"
                                    >
                                        {PRIORITY_OPTIONS.map((p) => (
                                            <option key={p} value={p}>
                                                {p.charAt(0).toUpperCase() + p.slice(1)}
                                            </option>
                                        ))}
                                    </select>
                                </Field>
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
                                                    : "var(--border)"
                                                }`,
                                            color:
                                                repairStatus === s
                                                    ? s === "approved" ? "#3fb950" : "var(--danger)"
                                                    : "var(--text-muted)",
                                            background:
                                                repairStatus === s
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

                    {/* Attachments */}
                    {activeSection === "attach" && (
                        <SectionCard>
                            {/* Sub-tab: issue attachments vs repair attachments */}
                            <div className="flex gap-2 mb-3">
                                {[
                                    { key: "issue", label: "Issue Attachments" },
                                    { key: "repair", label: "Repair Attachments" },
                                ].map(({ key, label }) => (
                                    <button
                                        key={key}
                                        onClick={() => setAttachTab(key)}
                                        className="text-xs font-semibold px-3 py-1.5 rounded-lg"
                                        style={{
                                            border: `1px solid ${attachTab === key ? "var(--accent)" : "var(--border)"}`,
                                            color: attachTab === key ? "var(--accent)" : "var(--text-muted)",
                                            background: attachTab === key
                                                ? "color-mix(in srgb,var(--accent) 8%,transparent)"
                                                : "transparent",
                                        }}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>
                            <AttachmentList
                                key={attachTab}
                                performId={performId}
                                issueId={issue.id}
                                kind={attachTab}
                            />
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
            const res = await ScienceLabIssueService.create(performId, form, files);
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
                {/* Attachments */}
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
    /* localResults[performedChecklistId][itemTemplateId] = { status, comment } */
    const [localResults, setLocalResults] = useState({});
    const [saving, setSaving] = useState(null); /* performedChecklistId being saved */
    const [expanded, setExpanded] = useState({});

    const load = useCallback(async () => {
        if (!performId) return;
        setLoading(true);
        try {
            const res = await ScienceLabPerformService.get(performId, { include: "checklists" });
            const data = res.data ?? res;
            const pcs = data.performed_science_lab_checklists ?? [];
            setChecklists(pcs);
            /* seed local state from saved values */
            const init = {};
            pcs.forEach((pc) => {
                init[pc.id] = {};
                (pc.performed_science_lab_checklist_items ?? []).forEach((pci) => {
                    init[pc.id][pci.checklist_item_template_id] = {
                        status: pci.status ?? "satisfactory",
                        comment: pci.comment ?? "",
                    };
                });
                /* fill blanks from template items */
                (pc.checklist_template?.checklist_item_templates ?? []).forEach((tmplItem) => {
                    if (!init[pc.id][tmplItem.id]) {
                        init[pc.id][tmplItem.id] = { status: "satisfactory", comment: "" };
                    }
                });
            });
            setLocalResults(init);
            /* expand first section by default */
            if (pcs.length > 0) {
                setExpanded({ [pcs[0].id]: true });
            }
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
            await ScienceLabChecklistItemService.upsert(performId, pc.id, items);
            toast.success(`"${pc.checklist_template?.name}" saved.`);
        } catch {
            toast.error("Save failed.");
        } finally {
            setSaving(null);
        }
    }

    if (loading) {
        return (
            <div className="flex justify-center py-12"><Spinner /></div>
        );
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

    /* Overall stats across all checklists */
    const _allItems = checklists.flatMap((pc) =>
        (pc.performed_science_lab_checklist_items ?? []).map((i) => ({
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
            {/* ── Overall summary stats ── */}
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
                const performedItems = pc.performed_science_lab_checklist_items ?? [];
                const isExpanded = expanded[pc.id] ?? false;
                const pcResults = localResults[pc.id] ?? {};

                /* Summary counts — use localResults (reflects edits) with saved-status fallback */
                const sat = performedItems.filter((i) => (pcResults[i.checklist_item_template_id]?.status ?? i.status) === "satisfactory").length;
                const attn = performedItems.filter((i) => (pcResults[i.checklist_item_template_id]?.status ?? i.status) === "needs_attention").length;
                const na = performedItems.filter((i) => (pcResults[i.checklist_item_template_id]?.status ?? i.status) === "not_applicable").length;

                return (
                    <div
                        key={pc.id}
                        className="rounded-xl overflow-hidden"
                        style={{ border: "1px solid var(--border)" }}
                    >
                        {/* Checklist header */}
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

                        {/* Checklist items */}
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
                                                        {/* Position badge */}
                                                        <div
                                                            className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold mt-0.5"
                                                            style={{ background: col.bg, color: col.text, border: `1px solid ${col.text}` }}
                                                        >
                                                            {tmplItem.position ?? idx + 1}
                                                        </div>

                                                        {/* Item content */}
                                                        <div className="flex-1 min-w-0">
                                                            {/* Label + status badge */}
                                                            <div className="flex items-start justify-between gap-2 mb-2">
                                                                <p className="text-xs font-medium leading-snug" style={{ color: "var(--text)" }}>
                                                                    {tmplItem.label ?? `Item #${item.id}`}
                                                                </p>
                                                                <Badge value={val.status} map={STATUS_ITEM_COLOR} />
                                                            </div>

                                                            {/* Existing comment callout */}
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

                                                            {/* Status toggle buttons */}
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

                                                            {/* Comment input */}
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
                                        {/* Save button */}
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
            const res = await ScienceLabIssueService.list(performId, { per_page: 50 });
            setIssues(Array.isArray(res) ? res : res.data ?? []);
        } catch {
            toast.error("Failed to load issues.");
        } finally {
            setLoading(false);
        }
    }, [performId]);

    useEffect(() => { load(); }, [load]);

    function handleDeleted(id) {
        setIssues((p) => p.filter((x) => x.id !== id));
    }

    function handleUpdated(updated) {
        setIssues((p) => p.map((x) => (x.id === updated.id ? updated : x)));
    }

    function handleAdded(newIssue) {
        setIssues((p) => [newIssue, ...p]);
        setShowAddForm(false);
    }

    if (loading) {
        return <div className="flex justify-center py-12"><Spinner /></div>;
    }

    return (
        <div className="flex flex-col gap-3">
            {/* Add Issue button */}
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

    /* Reset to first tab when a new perform is opened */
    useEffect(() => {
        if (isOpen) setActiveTab(0);
    }, [isOpen, perform?.id]);

    if (!isOpen || !perform) return null;

    const signed = Boolean(perform.signed_off_at);
    const tabs = [
        { label: "Checklists", icon: ClipboardDocumentListIcon },
        { label: "Issues", icon: ExclamationTriangleIcon },
    ];

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
                            {perform.science_lab_inspection?.laboratory_name ?? setup?.laboratory_name}
                            {" · "}{perform.date}
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
                    {activeTab === 0 && (
                        <ChecklistSection performId={perform.id} />
                    )}
                    {activeTab === 1 && (
                        <IssueSection performId={perform.id} />
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
}
