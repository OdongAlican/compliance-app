/* ── PPE Inspection — StartInspectionModal ────────────────────────────── */
import { useState, useEffect } from "react";
import {
  ClipboardDocumentCheckIcon,
  ExclamationTriangleIcon,
  PlusIcon,
  XMarkIcon,
  PaperClipIcon,
} from "@heroicons/react/24/outline";
import useAuth from "../../hooks/useAuth";
import toast from "react-hot-toast";
import { PpePerformService } from "../../services/ppe.service";
import { getInspectionChecklistTemplates } from "../../services/inspections.service";
import { Spinner, Field, ModalShell } from "./shared";
import { CHECKLIST_STATUS_OPTIONS } from "./constants";

export default function StartInspectionModal({ isOpen, onClose, setup }) {
  const { user: currentUser, role: currentRole } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [form, setForm] = useState({ date: "", time: "", note: "", sign_of_note: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [results, setResults] = useState({});
  const [issues, setIssues] = useState([{ title: "", description: "", correctiveAction: "", file: null }]);
  const [issueErrors, setIssueErrors] = useState([{}]);

  /* Reset on open */
  useEffect(() => {
    if (!isOpen) return;
    const now = new Date();
    setForm({
      date: now.toISOString().slice(0, 10),
      time: now.toTimeString().slice(0, 5),
      note: "",
      sign_of_note: "",
    });
    setErrors({});
    setActiveTab(0);
    setIssues([{ title: "", description: "", correctiveAction: "", file: null }]);
    setIssueErrors([{}]);
  }, [isOpen]);

  /* Load checklist templates */
  useEffect(() => {
    if (!isOpen || !setup?.inspection?.id) {
      setTemplates([]);
      setResults({});
      setActiveTab(0);
      return;
    }
    setTemplatesLoading(true);
    getInspectionChecklistTemplates(setup.inspection.id)
      .then((res) => {
        const data = Array.isArray(res.data?.data)
          ? res.data.data
          : Array.isArray(res.data)
          ? res.data
          : [];
        setTemplates(data);
        const init = {};
        data.forEach((tmpl) => {
          init[tmpl.id] = {};
          (tmpl.checklist_item_templates || []).forEach((item) => {
            init[tmpl.id][item.id] = { value: "satisfactory", comment: "" };
          });
        });
        setResults(init);
      })
      .catch(() => toast.error("Failed to load checklist templates."))
      .finally(() => setTemplatesLoading(false));
  }, [isOpen, setup]);

  const tabs = [
    { key: "details", label: "Details" },
    ...templates.map((t) => ({ key: `tmpl_${t.id}`, label: t.name, template: t })),
    { key: "issues", label: "Issues" },
    { key: "summary", label: "Summary" },
  ];

  function setItemResult(templateId, itemId, field, val) {
    setResults((prev) => ({
      ...prev,
      [templateId]: {
        ...prev[templateId],
        [itemId]: { ...prev[templateId]?.[itemId], [field]: val },
      },
    }));
  }

  function addIssue() {
    setIssues((p) => [...p, { title: "", description: "", correctiveAction: "", file: null }]);
    setIssueErrors((p) => [...p, {}]);
  }

  function removeIssue(idx) {
    setIssues((p) => p.filter((_, i) => i !== idx));
    setIssueErrors((p) => p.filter((_, i) => i !== idx));
  }

  function updateIssue(idx, key, val) {
    setIssues((p) => p.map((iss, i) => (i === idx ? { ...iss, [key]: val } : iss)));
    if (key === "title") {
      setIssueErrors((p) => p.map((e, i) => (i === idx ? { ...e, title: "" } : e)));
    }
  }

  function validate() {
    const e = {};
    if (!form.date) e.date = "Date is required.";
    if (!form.time) e.time = "Time is required.";
    setErrors(e);
    const ie = issues.map((iss) => {
      const hasData = iss.description || iss.correctiveAction || iss.file;
      if (hasData && !iss.title.trim()) return { title: "Title is required." };
      return {};
    });
    setIssueErrors(ie);
    const valid = Object.keys(e).length === 0 && ie.every((x) => Object.keys(x).length === 0);
    if (!valid && Object.keys(e).length > 0) setActiveTab(0);
    return valid;
  }

  async function handleSubmit() {
    if (!validate() || !setup) return;
    setLoading(true);
    try {
      const checklistPayload = templates.map((t) => ({
        id: t.id,
        checklistItems: (t.checklist_item_templates || []).map((item) => ({
          id: item.id,
          value: results[t.id]?.[item.id]?.value || "satisfactory",
          ...(results[t.id]?.[item.id]?.comment
            ? { comment: results[t.id][item.id].comment }
            : {}),
        })),
      }));

      const issuesPayload = issues
        .filter((iss) => iss.title.trim() || iss.description || iss.correctiveAction || iss.file)
        .map((iss) => ({
          title: iss.title,
          description: iss.description || undefined,
          correctiveAction: iss.correctiveAction || undefined,
          file: iss.file || undefined,
        }));

      await PpePerformService.create(setup.id, {
        perform: {
          date: form.date,
          time: form.time,
          ...(form.note ? { note: form.note } : {}),
          ...(form.sign_of_note ? { sign_of_note: form.sign_of_note } : {}),
        },
        checklist_template: checklistPayload,
        inspectionIssues: issuesPayload,
      });

      toast.success("Inspection execution recorded.");
      onClose();
    } catch (err) {
      toast.error(
        err?.response?.data?.errors?.join(", ") ||
          err?.response?.data?.error ||
          "Failed to record execution."
      );
    } finally {
      setLoading(false);
    }
  }

  /* ── Tab renderers ──────────────────────────────────────────────── */
  function renderDetailsTab() {
    return (
      <div className="flex flex-col gap-4">
        <div
          className="flex items-start gap-3 p-4 rounded-xl"
          style={{
            background: "color-mix(in srgb,var(--accent) 8%,transparent)",
            border: "1px solid color-mix(in srgb,var(--accent) 25%,transparent)",
          }}
        >
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: "var(--accent)", color: "#fff" }}
          >
            <ClipboardDocumentCheckIcon className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>
              Recording a new execution
            </p>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
              Set the date and time, complete each checklist section using the tabs, then
              log any issues before submitting.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Date" required error={errors.date}>
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
              className="ui-input text-sm"
            />
          </Field>
          <Field label="Time" required error={errors.time}>
            <input
              type="time"
              value={form.time}
              onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))}
              className="ui-input text-sm"
            />
          </Field>
        </div>
        <Field label="Note">
          <textarea
            value={form.note}
            onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
            rows={3}
            placeholder="Optional notes about this execution…"
            className="ui-input text-sm resize-none"
          />
        </Field>
        <Field label="Sign-off Note">
          <input
            type="text"
            value={form.sign_of_note}
            onChange={(e) => setForm((f) => ({ ...f, sign_of_note: e.target.value }))}
            placeholder="Optional sign-off note…"
            className="ui-input text-sm"
          />
        </Field>

        {templatesLoading && (
          <div className="flex items-center gap-2 text-xs" style={{ color: "var(--text-muted)" }}>
            <Spinner size={3} /> Loading checklist templates…
          </div>
        )}
        {!templatesLoading && templates.length === 0 && (
          <div
            className="p-3 rounded-xl flex items-center gap-2 text-xs"
            style={{
              background: "color-mix(in srgb,#d29922 8%,transparent)",
              border: "1px solid color-mix(in srgb,#d29922 20%,transparent)",
              color: "#d29922",
            }}
          >
            <ExclamationTriangleIcon className="h-4 w-4 flex-shrink-0" />
            No checklist templates found for this inspection.
          </div>
        )}
      </div>
    );
  }

  function renderChecklistTab(template) {
    const items = template.checklist_item_templates || [];
    const templateResults = results[template.id] || {};
    const needsCount = Object.values(templateResults).filter(
      (r) => r.value === "needs_attention"
    ).length;

    return (
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between mb-1">
          <div>
            <p className="text-sm font-bold" style={{ color: "var(--text)" }}>
              {template.name}
            </p>
            {template.description && (
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                {template.description}
              </p>
            )}
          </div>
          {needsCount > 0 && (
            <span
              className="text-[11px] font-bold px-2.5 py-0.5 rounded-full flex-shrink-0"
              style={{
                background: "color-mix(in srgb,#d29922 15%,transparent)",
                color: "#d29922",
              }}
            >
              {needsCount} need{needsCount !== 1 ? "s" : ""} attention
            </span>
          )}
        </div>

        {items.map((item) => {
          const r = templateResults[item.id] || { value: "satisfactory", comment: "" };
          return (
            <div
              key={item.id}
              className="p-4 rounded-xl flex flex-col gap-2.5"
              style={{
                background: "var(--bg-raised)",
                border:
                  r.value === "satisfactory"
                    ? "1px solid color-mix(in srgb,#3fb950 20%,transparent)"
                    : r.value === "needs_attention"
                    ? "1px solid color-mix(in srgb,#d29922 25%,transparent)"
                    : "1px solid var(--border)",
              }}
            >
              <p className="text-sm font-medium" style={{ color: "var(--text)" }}>
                {item.name ?? item.label ?? item.description}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                {CHECKLIST_STATUS_OPTIONS.map((opt) => {
                  const active = r.value === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setItemResult(template.id, item.id, "value", opt.value)}
                      className="px-3 py-1 rounded-full text-xs font-semibold"
                      style={
                        active
                          ? { background: opt.bg, color: opt.color, border: `1.5px solid ${opt.border}` }
                          : { background: "transparent", color: "var(--text-muted)", border: "1px solid var(--border)", opacity: 0.6 }
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
                value={r.comment}
                onChange={(e) => setItemResult(template.id, item.id, "comment", e.target.value)}
                placeholder="Comment… (optional)"
                className="text-xs rounded-lg px-3 py-1.5"
                style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text)", outline: "none" }}
              />
            </div>
          );
        })}
      </div>
    );
  }

  function renderIssuesTab() {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-bold" style={{ color: "var(--text)" }}>Inspection Issues</p>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              Log any issues found. Title is required for each logged issue.
            </p>
          </div>
          <button
            type="button"
            onClick={addIssue}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold flex-shrink-0"
            style={{
              background: "color-mix(in srgb,var(--accent) 10%,transparent)",
              color: "var(--accent)",
              border: "1px solid color-mix(in srgb,var(--accent) 25%,transparent)",
            }}
          >
            <PlusIcon className="h-3.5 w-3.5" /> Add Issue
          </button>
        </div>

        {issues.map((iss, idx) => (
          <div
            key={idx}
            className="p-4 rounded-xl flex flex-col gap-3"
            style={{ background: "var(--bg-raised)", border: "1px solid var(--border)" }}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                Issue {idx + 1}
              </span>
              {issues.length > 1 && (
                <button type="button" onClick={() => removeIssue(idx)} style={{ color: "var(--danger)" }}>
                  <XMarkIcon className="h-4 w-4" />
                </button>
              )}
            </div>

            <Field label="Title" required error={issueErrors[idx]?.title}>
              <input
                type="text"
                value={iss.title}
                onChange={(e) => updateIssue(idx, "title", e.target.value)}
                placeholder="Brief description of the issue…"
                className="ui-input text-sm"
              />
            </Field>

            <Field label="Description">
              <textarea
                value={iss.description}
                onChange={(e) => updateIssue(idx, "description", e.target.value)}
                rows={2}
                placeholder="Detailed description… (optional)"
                className="ui-input text-sm resize-none"
              />
            </Field>

            <Field label="Corrective Action">
              <input
                type="text"
                value={iss.correctiveAction}
                onChange={(e) => updateIssue(idx, "correctiveAction", e.target.value)}
                placeholder="Recommended corrective action… (optional)"
                className="ui-input text-sm"
              />
            </Field>

            <div>
              <p className="text-xs font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>
                Attachment <span style={{ fontWeight: 400 }}>(optional)</span>
              </p>
              {iss.file ? (
                <div
                  className="flex items-center gap-2 px-3 py-2 rounded-lg"
                  style={{ background: "var(--bg)", border: "1px solid var(--border)" }}
                >
                  <PaperClipIcon className="h-3.5 w-3.5 flex-shrink-0" style={{ color: "var(--accent)" }} />
                  <span className="text-xs flex-1 truncate" style={{ color: "var(--text)" }}>{iss.file.name}</span>
                  <button type="button" onClick={() => updateIssue(idx, "file", null)} style={{ color: "var(--text-muted)" }}>
                    <XMarkIcon className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <label
                  className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer hover:opacity-80"
                  style={{ background: "var(--bg)", border: "1px dashed var(--border)", color: "var(--text-muted)" }}
                >
                  <PaperClipIcon className="h-3.5 w-3.5" />
                  <span className="text-xs">Click to attach a file…</span>
                  <input type="file" className="hidden" onChange={(e) => updateIssue(idx, "file", e.target.files?.[0] || null)} />
                </label>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  }

  function renderSummaryTab() {
    const roleLabel = currentRole
      ? currentRole.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
      : "";
    const userFullName =
      [currentUser?.firstname, currentUser?.lastname].filter(Boolean).join(" ") || "—";

    let totalSat = 0, totalNA = 0, totalNApp = 0;
    templates.forEach((t) => {
      (t.checklist_item_templates || []).forEach((item) => {
        const v = results[t.id]?.[item.id]?.value ?? "satisfactory";
        if (v === "satisfactory") totalSat++;
        else if (v === "needs_attention") totalNA++;
        else totalNApp++;
      });
    });

    const filledIssues = issues.filter(
      (iss) => iss.title.trim() || iss.description || iss.correctiveAction || iss.file
    );

    return (
      <div className="flex flex-col gap-5">
        {/* Performer card */}
        <div
          className="p-4 rounded-xl"
          style={{
            background: "color-mix(in srgb,var(--accent) 6%,transparent)",
            border: "1px solid color-mix(in srgb,var(--accent) 20%,transparent)",
          }}
        >
          <p className="text-[11px] font-bold uppercase tracking-wider mb-3" style={{ color: "var(--accent)" }}>
            Performed By
          </p>
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
              style={{ background: "var(--accent)", color: "#fff" }}
            >
              {currentUser?.firstname?.[0]}{currentUser?.lastname?.[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>
                {userFullName}
              </p>
              {currentUser?.email && (
                <p className="text-xs truncate" style={{ color: "var(--text-muted)" }}>
                  {currentUser.email}
                </p>
              )}
              {roleLabel && (
                <span
                  className="text-[11px] font-bold px-2 py-0.5 rounded-full inline-block mt-1"
                  style={{ background: "color-mix(in srgb,var(--accent) 12%,transparent)", color: "var(--accent)" }}
                >
                  {roleLabel}
                </span>
              )}
            </div>
          </div>
          <div
            className="grid grid-cols-2 gap-3 mt-3 pt-3"
            style={{ borderTop: "1px solid color-mix(in srgb,var(--accent) 15%,transparent)" }}
          >
            <div>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>Date</p>
              <p className="text-sm font-medium" style={{ color: "var(--text)" }}>{form.date || "—"}</p>
            </div>
            <div>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>Time</p>
              <p className="text-sm font-medium" style={{ color: "var(--text)" }}>{form.time || "—"}</p>
            </div>
          </div>
        </div>

        {/* Overall scorecard */}
        <div className="grid grid-cols-3 gap-3">
          <div
            className="p-3 rounded-xl text-center"
            style={{ background: "color-mix(in srgb,#3fb950 10%,transparent)", border: "1px solid color-mix(in srgb,#3fb950 25%,transparent)" }}
          >
            <p className="text-2xl font-bold" style={{ color: "#3fb950" }}>{totalSat}</p>
            <p className="text-[11px] font-semibold mt-0.5" style={{ color: "#3fb950" }}>Satisfactory</p>
          </div>
          <div
            className="p-3 rounded-xl text-center"
            style={{ background: "color-mix(in srgb,#d29922 10%,transparent)", border: "1px solid color-mix(in srgb,#d29922 25%,transparent)" }}
          >
            <p className="text-2xl font-bold" style={{ color: "#d29922" }}>{totalNA}</p>
            <p className="text-[11px] font-semibold mt-0.5" style={{ color: "#d29922" }}>Needs Attention</p>
          </div>
          <div
            className="p-3 rounded-xl text-center"
            style={{ background: "var(--bg-raised)", border: "1px solid var(--border)" }}
          >
            <p className="text-2xl font-bold" style={{ color: "var(--text-muted)" }}>{totalNApp}</p>
            <p className="text-[11px] font-semibold mt-0.5" style={{ color: "var(--text-muted)" }}>N/A</p>
          </div>
        </div>

        {/* Per-template breakdown */}
        {templates.length > 0 && (
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>
              Checklist Breakdown
            </p>
            <div className="flex flex-col gap-2">
              {templates.map((t) => {
                const items = t.checklist_item_templates || [];
                const tmplRes = results[t.id] || {};
                const sat = items.filter((i) => (tmplRes[i.id]?.value ?? "satisfactory") === "satisfactory").length;
                const attention = items.filter((i) => tmplRes[i.id]?.value === "needs_attention");
                const napp = items.filter((i) => tmplRes[i.id]?.value === "not_applicable").length;
                return (
                  <div
                    key={t.id}
                    className="p-3 rounded-xl"
                    style={{ background: "var(--bg-raised)", border: "1px solid var(--border)" }}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-xs font-semibold" style={{ color: "var(--text)" }}>{t.name}</p>
                      <div className="flex items-center gap-1.5">
                        <span
                          className="text-[10px] px-1.5 py-0.5 rounded-full font-bold"
                          style={{ background: "color-mix(in srgb,#3fb950 12%,transparent)", color: "#3fb950" }}
                        >
                          ✓ {sat}
                        </span>
                        {attention.length > 0 && (
                          <span
                            className="text-[10px] px-1.5 py-0.5 rounded-full font-bold"
                            style={{ background: "color-mix(in srgb,#d29922 12%,transparent)", color: "#d29922" }}
                          >
                            ⚠ {attention.length}
                          </span>
                        )}
                        {napp > 0 && (
                          <span
                            className="text-[10px] px-1.5 py-0.5 rounded-full font-bold"
                            style={{ background: "var(--bg)", color: "var(--text-muted)", border: "1px solid var(--border)" }}
                          >
                            N/A {napp}
                          </span>
                        )}
                      </div>
                    </div>
                    {attention.length > 0 && (
                      <div className="flex flex-col gap-1 mt-1.5">
                        {attention.map((item) => (
                          <div key={item.id} className="flex items-start gap-1.5">
                            <ExclamationTriangleIcon className="h-3 w-3 flex-shrink-0 mt-0.5" style={{ color: "#d29922" }} />
                            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                              {item.name ?? item.label ?? item.description}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Issues summary */}
        {filledIssues.length > 0 && (
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>
              Issues Logged ({filledIssues.length})
            </p>
            <div className="flex flex-col gap-2">
              {filledIssues.map((iss, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl flex items-start gap-2"
                  style={{
                    background: "color-mix(in srgb,var(--danger) 6%,transparent)",
                    border: "1px solid color-mix(in srgb,var(--danger) 15%,transparent)",
                  }}
                >
                  <ExclamationTriangleIcon className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" style={{ color: "var(--danger)" }} />
                  <div>
                    <p className="text-xs font-semibold" style={{ color: "var(--text)" }}>{iss.title}</p>
                    {iss.description && (
                      <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{iss.description}</p>
                    )}
                    {iss.file && (
                      <p className="text-[11px] mt-0.5" style={{ color: "var(--accent)" }}>📎 {iss.file.name}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {filledIssues.length === 0 && (
          <p className="text-xs text-center py-2" style={{ color: "var(--text-muted)" }}>
            No issues logged for this inspection.
          </p>
        )}
      </div>
    );
  }

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      title={"Start Inspection — " + (setup?.department ?? "")}
      width="max-w-3xl"
    >
      <div className="flex flex-col" style={{ maxHeight: "75vh" }}>
        {/* Tab bar */}
        <div
          className="flex overflow-x-auto flex-shrink-0 px-2"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          {tabs.map((tab, idx) => {
            const isActive = activeTab === idx;
            let badge = null;
            if (tab.template) {
              const tmplRes = results[tab.template.id] || {};
              const naCount = Object.values(tmplRes).filter((r) => r.value === "needs_attention").length;
              if (naCount > 0) {
                badge = (
                  <span
                    className="ml-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                    style={{ background: "color-mix(in srgb,#d29922 20%,transparent)", color: "#d29922" }}
                  >
                    {naCount}
                  </span>
                );
              }
            }
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(idx)}
                className="flex-shrink-0 flex items-center px-4 py-3 text-xs font-semibold transition-colors whitespace-nowrap border-b-2"
                style={{
                  borderBottomColor: isActive ? "var(--accent)" : "transparent",
                  color: isActive ? "var(--accent)" : "var(--text-muted)",
                }}
              >
                {tab.label}
                {badge}
              </button>
            );
          })}
        </div>

        {/* Tab content */}
        <div className="overflow-y-auto flex-1 px-6 py-5">
          {activeTab === 0 && renderDetailsTab()}
          {tabs[activeTab]?.template && renderChecklistTab(tabs[activeTab].template)}
          {tabs[activeTab]?.key === "issues" && renderIssuesTab()}
          {tabs[activeTab]?.key === "summary" && renderSummaryTab()}
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-between px-6 py-4 flex-shrink-0"
          style={{ borderTop: "1px solid var(--border)" }}
        >
          <button
            onClick={() => setActiveTab((i) => Math.max(0, i - 1))}
            disabled={activeTab === 0}
            className="px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-40"
            style={{ background: "var(--bg-raised)", color: "var(--text)", border: "1px solid var(--border)" }}
          >
            ← Back
          </button>
          {activeTab < tabs.length - 1 ? (
            <button
              onClick={() => setActiveTab((i) => Math.min(tabs.length - 1, i + 1))}
              className="px-4 py-2 rounded-lg text-sm font-semibold text-white"
              style={{ background: "var(--accent)" }}
            >
              Next →
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50 flex items-center gap-2"
              style={{ background: "var(--accent)" }}
            >
              {loading ? <Spinner size={3} /> : null}
              {loading ? "Recording…" : "Record Execution"}
            </button>
          )}
        </div>
      </div>
    </ModalShell>
  );
}
