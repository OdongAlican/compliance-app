/* ── Canteen — SetupFormModal ─────────────────────────────────────────── */
import { useState, useEffect } from "react";
import { CheckBadgeIcon } from "@heroicons/react/24/outline";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import {
  createCanteenSetup,
  updateCanteenSetup,
  clearActionError,
  selectCanteenActionLoading,
  selectCanteenActionError,
} from "../../store/slices/canteenSlice";
import toast from "react-hot-toast";
import { Field, Spinner, ModalShell, StepIndicator, ReviewRow } from "./shared";
import UserAutocomplete from "./UserAutocomplete";
import moment from "moment";

export default function SetupFormModal({ isOpen, onClose, setup, catalogItems }) {
  const dispatch = useAppDispatch();
  const actionLoading = useAppSelector(selectCanteenActionLoading);
  const actionError = useAppSelector(selectCanteenActionError);
  const isEdit = Boolean(setup);

  const [step, setStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState([]);

  const [form, setForm] = useState({
    name: "",
    location: "",
    date: "",
    time: "",
    note: "",
    inspection_id: "",
  });
  const [safetyOfficer, setSafetyOfficer] = useState(null);
  const [supervisor, setSupervisor] = useState(null);
  const [errors, setErrors] = useState({});

  /* Reset on open */
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setCompletedSteps([]);
      setErrors({});
      dispatch(clearActionError());
      if (setup) {
        setForm({
          name: setup.name ?? "",
          location: setup.location ?? "",
          date: setup.date ?? "",
          time: setup.time ?? "",
          note: setup.note ?? "",
          inspection_id: setup.inspection_id ?? "",
        });
        setSafetyOfficer(setup.safety_officer ?? null);
        setSupervisor(setup.supervisor ?? null);
      } else {
        setForm({ name: "", location: "", date: "", time: "", note: "", inspection_id: "" });
        setSafetyOfficer(null);
        setSupervisor(null);
      }
    }
  }, [isOpen, setup, dispatch]);

  function set(k, v) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  /* Per-step validation */
  function validateStep(s) {
    const e = {};
    if (s === 1) {
      if (!form.name.trim()) e.name = "Name is required.";
      if (!form.location.trim()) e.location = "Location is required.";
      if (!form.date) e.date = "Date is required.";
      if (!form.time) e.time = "Time is required.";
    }
    if (s === 2) {
      if (!safetyOfficer) e.safety_officer_id = "Please select a safety officer.";
    }
    if (s === 3) {
      if (!supervisor) e.supervisor_id = "Please select a supervisor.";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function goNext() {
    if (!validateStep(step)) return;
    setCompletedSteps((prev) => Array.from(new Set([...prev, step])));
    setStep((s) => s + 1);
  }

  function goBack() {
    setErrors({});
    setStep((s) => s - 1);
  }

  async function handleSubmit() {
    const payload = {
      name: form.name.trim(),
      location: form.location.trim(),
      date: form.date,
      time: form.time,
      note: form.note.trim() || undefined,
      safety_officer_id: Number(safetyOfficer.id),
      supervisor_id: Number(supervisor.id),
      ...(form.inspection_id ? { inspection_id: Number(form.inspection_id) } : {}),
    };
    const action = isEdit
      ? dispatch(updateCanteenSetup({ id: setup.id, data: payload }))
      : dispatch(createCanteenSetup(payload));
    const result = await action;
    if (
      createCanteenSetup.fulfilled.match(result) ||
      updateCanteenSetup.fulfilled.match(result)
    ) {
      toast.success(isEdit ? "Inspection updated." : "Inspection created.");
      onClose();
    } else {
      toast.error(result.payload || "Something went wrong.");
    }
  }

  const roleName = (u) =>
    u?.role?.name
      ? u.role.name.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
      : "—";

  /* Step content */
  function renderStep() {
    if (step === 1) {
      return (
        <div className="p-6 grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <Field label="Inspection Name" required error={errors.name}>
              <input
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="e.g. Q1 Canteen Audit"
                className="ui-input text-sm"
                autoFocus
              />
            </Field>
          </div>
          <div className="col-span-2">
            <Field label="Location" required error={errors.location}>
              <input
                value={form.location}
                onChange={(e) => set("location", e.target.value)}
                placeholder="e.g. Main Kitchen"
                className="ui-input text-sm"
              />
            </Field>
          </div>
          <Field label="Date" required error={errors.date}>
            <input
              type="date"
              value={form.date}
              onChange={(e) => set("date", e.target.value)}
              className="ui-input text-sm"
            />
          </Field>
          <Field label="Time" required error={errors.time}>
            <input
              type="time"
              value={form.time}
              onChange={(e) => set("time", e.target.value)}
              className="ui-input text-sm"
            />
          </Field>
          {catalogItems.length > 0 && (
            <div className="col-span-2">
              <Field
                label="Inspection Type"
                hint="Defaults to Canteen Inspection if left blank."
              >
                <select
                  value={form.inspection_id}
                  onChange={(e) => set("inspection_id", e.target.value)}
                  className="ui-input text-sm"
                >
                  <option value="">— Auto-detect —</option>
                  {catalogItems.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          )}
          <div className="col-span-2">
            <Field label="Note">
              <textarea
                value={form.note}
                onChange={(e) => set("note", e.target.value)}
                rows={3}
                placeholder="Optional notes…"
                className="ui-input text-sm resize-none"
              />
            </Field>
          </div>
        </div>
      );
    }

    if (step === 2) {
      return (
        <div className="p-6 flex flex-col gap-5">
          <div
            className="flex items-start gap-3 p-4 rounded-xl"
            style={{
              background: "color-mix(in srgb,var(--accent) 8%,transparent)",
              border: "1px solid color-mix(in srgb,var(--accent) 25%,transparent)",
            }}
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm"
              style={{ background: "var(--accent)", color: "#fff" }}
            >
              2
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>
                Select Safety Officer
              </p>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                Search by name — showing up to 10 users. Type to filter further.
              </p>
            </div>
          </div>
          <Field label="Safety Officer" required error={errors.safety_officer_id}>
            <UserAutocomplete
              roleFilter="safety_officer"
              value={safetyOfficer}
              onChange={setSafetyOfficer}
              placeholder="Search safety officers…"
              error={errors.safety_officer_id}
            />
          </Field>
          {safetyOfficer && (
            <div
              className="flex items-center gap-3 p-4 rounded-xl"
              style={{
                background: "color-mix(in srgb,#3fb950 8%,transparent)",
                border: "1px solid color-mix(in srgb,#3fb950 30%,transparent)",
              }}
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                style={{ background: "#3fb950", color: "#fff" }}
              >
                {safetyOfficer.firstname?.[0]}{safetyOfficer.lastname?.[0]}
              </div>
              <div>
                <p className="text-sm font-bold" style={{ color: "var(--text)" }}>
                  {safetyOfficer.firstname} {safetyOfficer.lastname}
                </p>
                <p className="text-xs" style={{ color: "#3fb950" }}>
                  ✓ Selected · {roleName(safetyOfficer)}
                </p>
              </div>
            </div>
          )}
        </div>
      );
    }

    if (step === 3) {
      return (
        <div className="p-6 flex flex-col gap-5">
          <div
            className="flex items-start gap-3 p-4 rounded-xl"
            style={{
              background: "color-mix(in srgb,var(--accent) 8%,transparent)",
              border: "1px solid color-mix(in srgb,var(--accent) 25%,transparent)",
            }}
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm"
              style={{ background: "var(--accent)", color: "#fff" }}
            >
              3
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>
                Select Supervisor
              </p>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                Search by name — showing up to 10 users. Type to filter further.
              </p>
            </div>
          </div>
          <Field label="Supervisor" required error={errors.supervisor_id}>
            <UserAutocomplete
              roleFilter="supervisor"
              value={supervisor}
              onChange={setSupervisor}
              placeholder="Search supervisors…"
              error={errors.supervisor_id}
            />
          </Field>
          {supervisor && (
            <div
              className="flex items-center gap-3 p-4 rounded-xl"
              style={{
                background: "color-mix(in srgb,#3fb950 8%,transparent)",
                border: "1px solid color-mix(in srgb,#3fb950 30%,transparent)",
              }}
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                style={{ background: "#3fb950", color: "#fff" }}
              >
                {supervisor.firstname?.[0]}{supervisor.lastname?.[0]}
              </div>
              <div>
                <p className="text-sm font-bold" style={{ color: "var(--text)" }}>
                  {supervisor.firstname} {supervisor.lastname}
                </p>
                <p className="text-xs" style={{ color: "#3fb950" }}>
                  ✓ Selected · {roleName(supervisor)}
                </p>
              </div>
            </div>
          )}
        </div>
      );
    }

    if (step === 4) {
      return (
        <div className="p-6 flex flex-col gap-4">
          <div
            className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-semibold mb-1"
            style={{
              background: "color-mix(in srgb,#3fb950 10%,transparent)",
              color: "#3fb950",
              border: "1px solid color-mix(in srgb,#3fb950 25%,transparent)",
            }}
          >
            <CheckBadgeIcon className="h-4 w-4" />
            All steps complete — please review before submitting.
          </div>

          <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
            Basic Information
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <ReviewRow label="Inspection Name" value={form.name} />
            </div>
            <div className="col-span-2">
              <ReviewRow label="Location" value={form.location} />
            </div>
            <ReviewRow label="Date" value={moment(form.date).format("MMMM Do, YYYY")} />
            <ReviewRow label="Time" value={moment(form.time, "HH:mm").format("h:mm A")} />
            {form.note && (
              <div className="col-span-2">
                <ReviewRow label="Note" value={form.note} />
              </div>
            )}
          </div>

          <p className="text-xs font-bold uppercase tracking-wider mt-2" style={{ color: "var(--text-muted)" }}>
            Assignees
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div
              className="flex items-center gap-3 p-3 rounded-lg col-span-1"
              style={{ background: "var(--bg-raised)", border: "1px solid var(--border)" }}
            >
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                style={{
                  background: "color-mix(in srgb,var(--accent) 20%,transparent)",
                  color: "var(--accent)",
                }}
              >
                {safetyOfficer?.firstname?.[0]}{safetyOfficer?.lastname?.[0]}
              </div>
              <div>
                <p className="text-[11px] font-semibold" style={{ color: "var(--text-muted)" }}>
                  Safety Officer
                </p>
                <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>
                  {safetyOfficer?.firstname} {safetyOfficer?.lastname}
                </p>
                <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                  {roleName(safetyOfficer)}
                </p>
              </div>
            </div>
            <div
              className="flex items-center gap-3 p-3 rounded-lg col-span-1"
              style={{ background: "var(--bg-raised)", border: "1px solid var(--border)" }}
            >
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                style={{
                  background: "color-mix(in srgb,var(--accent) 20%,transparent)",
                  color: "var(--accent)",
                }}
              >
                {supervisor?.firstname?.[0]}{supervisor?.lastname?.[0]}
              </div>
              <div>
                <p className="text-[11px] font-semibold" style={{ color: "var(--text-muted)" }}>
                  Supervisor
                </p>
                <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>
                  {supervisor?.firstname} {supervisor?.lastname}
                </p>
                <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                  {roleName(supervisor)}
                </p>
              </div>
            </div>
          </div>

          {actionError && (
            <div
              className="text-xs px-3 py-2 rounded-lg"
              style={{
                background: "color-mix(in srgb,var(--danger) 12%,transparent)",
                color: "var(--danger)",
              }}
            >
              {actionError}
            </div>
          )}
        </div>
      );
    }
  }

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? "Edit Canteen Inspection" : "New Canteen Inspection"}
      width="max-w-lg"
    >
      <StepIndicator currentStep={step} completedSteps={completedSteps} />
      <div style={{ minHeight: "320px" }}>{renderStep()}</div>

      {/* Footer nav */}
      <div
        className="flex items-center justify-between px-6 py-4 flex-shrink-0"
        style={{ borderTop: "1px solid var(--border)" }}
      >
        <button
          type="button"
          onClick={step === 1 ? onClose : goBack}
          disabled={actionLoading}
          className="px-4 py-2 rounded-lg text-sm font-medium"
          style={{
            background: "var(--bg-raised)",
            color: "var(--text-muted)",
            border: "1px solid var(--border)",
          }}
        >
          {step === 1 ? "Cancel" : "← Back"}
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>
            Step {step} of 4
          </span>
          {step < 4 ? (
            <button
              type="button"
              onClick={goNext}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold"
              style={{ background: "var(--accent)", color: "#fff" }}
            >
              Continue →
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={actionLoading}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold"
              style={{ background: "var(--accent)", color: "#fff" }}
            >
              {actionLoading && <Spinner size={4} />}
              {isEdit ? "Save Changes" : "Create Inspection"}
            </button>
          )}
        </div>
      </div>
    </ModalShell>
  );
}
