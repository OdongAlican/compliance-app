/* ── Vehicle Inspection — StartInspectionModal ───────────────────────── */
import { useState, useEffect } from "react";
import {
  TruckIcon,
  PlusIcon,
  XMarkIcon,
  PaperClipIcon,
} from "@heroicons/react/24/outline";
import useAuth from "../../hooks/useAuth";
import toast from "react-hot-toast";
import { VehiclePerformService } from "../../services/vehicle.service";
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
  const [issues, setIssues] = useState([
    { title: "", description: "", corrective_action: "", file: null },
  ]);
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
    setIssues([{ title: "", description: "", corrective_action: "", file: null }]);
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
            init[tmpl.id][item.id] = { status: "satisfactory", comment: "" };
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
    setIssues((p) => [...p, { title: "", description: "", corrective_action: "", file: null }]);
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
      const hasData = iss.description || iss.corrective_action || iss.file;
      if (hasData && !iss.title.trim()) return { title: "Title is required." };
      return {};
    });
    setIssueErrors(ie);
    const valid =
      Object.keys(e).length === 0 &&
      ie.every((x) => Object.keys(x).length === 0);
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
          status: results[t.id]?.[item.id]?.status || "satisfactory",
          ...(results[t.id]?.[item.id]?.comment
            ? { comment: results[t.id][item.id].comment }
            : {}),
        })),
      }));

      const issuesPayload = issues
        .filter((iss) => iss.title.trim() || iss.description || iss.corrective_action || iss.file)
        .map((iss) => ({
          title: iss.title,
          description: iss.description || undefined,
          corrective_action: iss.corrective_action || undefined,
          file: iss.file || undefined,
        }));

      await VehiclePerformService.create(setup.id, {
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

  /* ── Tab renderers ─────────────────────────────────────────────────── */
  function renderSummaryTab() {
    const roleLabel = currentRole
      ? currentRole.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
      : "";
    const userFullName =
      [currentUser?.firstname, currentUser?.lastname].filter(Boolean).join(" ") || "—";

    let totalSat = 0, totalNA = 0, totalNApp = 0;
    templates.forEach((t) => {
      (t.checklist_item_templates || []).forEach((item) => {
        const v = results[t.id]?.[item.id]?.status ?? "satisfactory";
        if (v === "satisfactory") totalSat++;
        else if (v === "needs_attention") totalNA++;
        else totalNApp++;
      });
    });

    const filledIssues = issues.filter(
      (iss) => iss.title.trim() || iss.description || iss.corrective_action || iss.file
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
          <p
            className="text-[11px] font-bold uppercase tracking-wider mb-3"
            style={{ color: "var(--accent)" }}
          >
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
                  style={{
                    background: "color-mix(in srgb,var(--accent) 12%,transparent)",
                    color: "var(--accent)",
                  }}
                >
                  {roleLabel}
                </span>
              )}
            </div>
          </div>
          <div
            className="grid grid-cols-2 gap-3 mt-3 pt-3"
            style={{
              borderTop: "1px solid color-mix(in srgb,var(--accent) 15%,transparent)",
            }}
          >
            <div>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>Date</p>
              <p className="text-sm font-medium" style={{ color: "var(--text)" }}>
                {form.date || "—"}
              </p>
            </div>
            <div>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>Time</p>
              <p className="text-sm font-medium" style={{ color: "var(--text)" }}>
                {form.time || "—"}
              </p>
            </div>
          </div>
        </div>

        {/* Scorecard */}
        <div className="grid grid-cols-3 gap-3">
          <div
            className="p-3 rounded-xl text-center"
            style={{
              background: "color-mix(in srgb,#3fb950 10%,transparent)",
              border: "1px solid color-mix(in srgb,#3fb950 25%,transparent)",
            }}
          >
            <p className="text-2xl font-bold" style={{ color: "#3fb950" }}>{totalSat}</p>
            <p className="text-[11px] font-semibold mt-0.5" style={{ color: "#3fb950" }}>
              Satisfactory
            </p>
          </div>
          <div
            className="p-3 rounded-xl text-center"
            style={{
              background: "color-mix(in srgb,#d29922 10%,transparent)",
              border: "1px solid color-mix(in srgb,#d29922 25%,transparent)",
            }}
          >
            <p className="text-2xl font-bold" style={{ color: "#d29922" }}>{totalNA}</p>
            <p className="text-[11px] font-semibold mt-0.5" style={{ color: "#d29922" }}>
              Needs Attention
            </p>
          </div>
          <div
            className="p-3 rounded-xl text-center"
            style={{ background: "var(--bg-raised)", border: "1px solid var(--border)" }}
          >
            <p className="text-2xl font-bold" style={{ color: "var(--text-muted)" }}>
              {totalNApp}
            </p>
            <p className="text-[11px] font-semibold mt-0.5" style={{ color: "var(--text-muted)" }}>
              N/A
            </p>
          </div>
        </div>

        {/* Issues summary */}
        {filledIssues.length > 0 && (
          <div>
            <p
              className="text-[11px] font-bold uppercase tracking-wider mb-2"
              style={{ color: "var(--text-muted)" }}
            >
              Issues to Log ({filledIssues.length})
            </p>
            <div className="flex flex-col gap-2">
              {filledIssues.map((iss, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl text-sm"
                  style={{
                    background: "color-mix(in srgb,#f85149 6%,transparent)",
                    border: "1px solid color-mix(in srgb,#f85149 20%,transparent)",
                  }}
                >
                  <p className="font-semibold" style={{ color: "var(--text)" }}>
                    {iss.title}
                  </p>
                  {iss.description && (
                    <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                      {iss.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  function renderTab(tab, idx) {
    if (tab.key === "details") {
      return (
        <div className="flex flex-col gap-4">
          {/* Info banner */}
          <div
            className="flex items-center gap-3 p-4 rounded-xl"
            style={{
              background: "color-mix(in srgb,var(--accent) 8%,transparent)",
              border: "1px solid color-mix(in srgb,var(--accent) 20%,transparent)",
            }}
          >
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "var(--accent)", color: "#fff" }}
            >
              <TruckIcon className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>
                {setup?.vehicle_id ?? "Vehicle Inspection"}
              </p>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                {setup?.model ?? ""}
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
              placeholder="Optional note…"
              className="ui-input text-sm resize-none"
            />
          </Field>
          <Field label="Sign Note">
            <input
              value={form.sign_of_note}
              onChange={(e) => setForm((f) => ({ ...f, sign_of_note: e.target.value }))}
              placeholder="Optional sign note…"
              className="ui-input text-sm"
            />
          </Field>
        </div>
      );
    }

    if (tab.template) {
      const t = tab.template;
      const items = t.checklist_item_templates || [];
      return (
        <div className="flex flex-col gap-3">
          <p className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
            {items.length} item{items.length !== 1 ? "s" : ""}
          </p>
          {items.map((item) => {
            const cur = results[t.id]?.[item.id] ?? { status: "satisfactory", comment: "" };
            return (
              <div
                key={item.id}
                className="p-4 rounded-xl"
                style={{ background: "var(--bg-raised)", border: "1px solid var(--border)" }}
              >
                <p className="text-sm font-medium mb-3" style={{ color: "var(--text)" }}>
                  {item.name}
                </p>
                <div className="flex gap-2 flex-wrap mb-3">
                  {CHECKLIST_STATUS_OPTIONS.map((opt) => {
                    const active = cur.status === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setItemResult(t.id, item.id, "status", opt.value)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                        style={{
                          background: active ? opt.bg : "var(--bg)",
                          color: active ? opt.color : "var(--text-muted)",
                          border: active
                            ? `1px solid ${opt.border}`
                            : "1px solid var(--border)",
                        }}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
                <input
                  type="text"
                  value={cur.comment}
                  onChange={(e) => setItemResult(t.id, item.id, "comment", e.target.value)}
                  placeholder="Comment (optional)…"
                  className="ui-input text-xs w-full"
                />
              </div>
            );
          })}
        </div>
      );
    }

    if (tab.key === "issues") {
      return (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>
              Issues ({issues.filter((i) => i.title.trim()).length})
            </p>
            <button
              type="button"
              onClick={addIssue}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg"
              style={{
                background: "color-mix(in srgb,var(--accent) 12%,transparent)",
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
              className="rounded-xl p-4 flex flex-col gap-3"
              style={{
                background: "var(--bg-raised)",
                border: `1px solid ${issueErrors[idx]?.title ? "var(--danger)" : "var(--border)"}`,
              }}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
                  Issue #{idx + 1}
                </span>
                {issues.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeIssue(idx)}
                    className="hover:opacity-70"
                    style={{ color: "var(--danger)" }}
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                )}
              </div>
              <Field label="Title" required error={issueErrors[idx]?.title}>
                <input
                  value={iss.title}
                  onChange={(e) => updateIssue(idx, "title", e.target.value)}
                  placeholder="Issue title…"
                  className="ui-input text-sm"
                />
              </Field>
              <Field label="Description">
                <textarea
                  value={iss.description}
                  onChange={(e) => updateIssue(idx, "description", e.target.value)}
                  rows={2}
                  placeholder="Optional description…"
                  className="ui-input text-sm resize-none"
                />
              </Field>
              <Field label="Corrective Action">
                <input
                  value={iss.corrective_action}
                  onChange={(e) => updateIssue(idx, "corrective_action", e.target.value)}
                  placeholder="Optional corrective action…"
                  className="ui-input text-sm"
                />
              </Field>
              <Field label="Attachment">
                <label
                  className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer text-xs"
                  style={{
                    background: "var(--bg)",
                    border: "1px dashed var(--border)",
                    color: "var(--text-muted)",
                  }}
                >
                  <PaperClipIcon className="h-4 w-4" />
                  {iss.file ? iss.file.name : "Attach file…"}
                  <input
                    type="file"
                    className="sr-only"
                    onChange={(e) => updateIssue(idx, "file", e.target.files?.[0] ?? null)}
                  />
                </label>
              </Field>
            </div>
          ))}
        </div>
      );
    }

    if (tab.key === "summary") {
      return renderSummaryTab();
    }

    return null;
  }

  const isLastTab = activeTab === tabs.length - 1;

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      title={`Start Inspection — ${setup?.vehicle_id ?? ""}`}
      width="max-w-2xl"
    >
      {/* Tabs */}
      <div
        className="flex overflow-x-auto px-4 pt-3 gap-1"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        {tabs.map((tab, idx) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(idx)}
            className="px-3 py-2 text-xs font-semibold rounded-t-lg flex-shrink-0"
            style={{
              color: activeTab === idx ? "var(--accent)" : "var(--text-muted)",
              borderBottom:
                activeTab === idx ? "2px solid var(--accent)" : "2px solid transparent",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="p-6 overflow-y-auto" style={{ maxHeight: "55vh" }}>
        {templatesLoading ? (
          <div className="flex justify-center py-10">
            <Spinner />
          </div>
        ) : (
          renderTab(tabs[activeTab], activeTab)
        )}
      </div>

      {/* Footer */}
      <div
        className="flex items-center justify-between px-6 py-4"
        style={{ borderTop: "1px solid var(--border)" }}
      >
        <button
          type="button"
          onClick={activeTab === 0 ? onClose : () => setActiveTab((n) => n - 1)}
          className="px-4 py-2 text-sm rounded-lg hover:opacity-80"
          style={{
            background: "var(--bg-raised)",
            color: "var(--text-muted)",
            border: "1px solid var(--border)",
          }}
        >
          {activeTab === 0 ? "Cancel" : "← Back"}
        </button>
        {isLastTab ? (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg disabled:opacity-60"
            style={{ background: "#3fb950", color: "#fff" }}
          >
            {loading && <Spinner size={4} />}
            Submit Inspection
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setActiveTab((n) => n + 1)}
            className="px-4 py-2 text-sm rounded-lg font-medium"
            style={{ background: "var(--accent)", color: "#fff" }}
          >
            Next →
          </button>
        )}
      </div>
    </ModalShell>
  );
}
