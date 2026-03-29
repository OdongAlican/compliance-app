/* ── Fuel — SetupFormModal ─────────────────────────────────────────── */
import { useState, useEffect } from "react";
import { CheckBadgeIcon } from "@heroicons/react/24/outline";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import {
  createFuelSetup,
  updateFuelSetup,
  fetchFuelSetups,
  selectFuelActionLoading,
  selectFuelActionError,
  clearFuelActionError,
} from "../../store/slices/fuelSlice";
import toast from "react-hot-toast";
import { ModalShell, Field, Spinner, StepIndicator, ReviewRow } from "./shared";
import UserAutocomplete from "./UserAutocomplete";
import { FUEL_TYPE_OPTIONS } from "./constants";
import moment from "moment";

const EMPTY = {
  tank_id_number: "",
  tank_location: "",
  fuel_type: "",
  date: "",
  time: "",
  note: "",
};

export default function SetupFormModal({ isOpen, setup, onClose }) {
  const dispatch = useAppDispatch();
  const saving = useAppSelector(selectFuelActionLoading);
  const apiError = useAppSelector(selectFuelActionError);

  const [step, setStep] = useState(1);
  const [completed, setCompleted] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [safetyOfficer, setSafetyOfficer] = useState(null);
  const [supervisor, setSupervisor] = useState(null);
  const [errors, setErrors] = useState({});
  const isEdit = Boolean(setup);

  /* Populate form for edit */
  useEffect(() => {
    if (!isOpen) return;
    if (setup) {
      setForm({
        tank_id_number: setup.tank_id_number ?? "",
        tank_location: setup.tank_location ?? "",
        fuel_type: setup.fuel_type ?? "",
        date: setup.date ?? "",
        time: setup.time ?? "",
        note: setup.note ?? "",
      });
      setSafetyOfficer(setup.safety_officer ?? null);
      setSupervisor(setup.supervisor ?? null);
    } else {
      const now = new Date();
      setForm({
        ...EMPTY,
        date: now.toISOString().slice(0, 10),
        time: now.toTimeString().slice(0, 5),
      });
      setSafetyOfficer(null);
      setSupervisor(null);
    }
    setStep(1);
    setCompleted([]);
    setErrors({});
    dispatch(clearFuelActionError());
  }, [isOpen, setup, dispatch]);

  function set(key, val) {
    setForm((f) => ({ ...f, [key]: val }));
    setErrors((e) => ({ ...e, [key]: "" }));
  }

  function validateStep(s) {
    const e = {};
    if (s === 1) {
      if (!form.tank_id_number.trim()) e.tank_id_number = "Tank ID number is required.";
      if (!form.tank_location.trim()) e.tank_location = "Location is required.";
      if (!form.fuel_type) e.fuel_type = "Fuel type is required.";
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
    setCompleted((c) => (c.includes(step) ? c : [...c, step]));
    setStep((s) => s + 1);
  }

  function goBack() {
    setErrors({});
    setStep((s) => s - 1);
  }

  async function handleSubmit() {
    const payload = {
      tank_id_number: form.tank_id_number.trim(),
      tank_location: form.tank_location.trim(),
      fuel_type: form.fuel_type,
      date: form.date,
      time: form.time,
      ...(form.note.trim() ? { note: form.note.trim() } : {}),
      safety_officer_id: safetyOfficer?.id,
      supervisor_id: supervisor?.id,
    };

    const action = isEdit
      ? dispatch(updateFuelSetup({ id: setup.id, data: payload }))
      : dispatch(createFuelSetup(payload));

    const result = await action;
    const thunkCreator = isEdit ? updateFuelSetup : createFuelSetup;

    if (thunkCreator.fulfilled.match(result)) {
      toast.success(isEdit ? "Inspection updated." : "Inspection created.");
      dispatch(fetchFuelSetups());
      onClose();
    } else {
      toast.error(result.payload || (isEdit ? "Update failed." : "Create failed."));
    }
  }

  const roleName = (u) =>
    u?.role?.name
      ? u.role.name.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
      : "—";

  /* ── Step renderers ─────────────────────────────────────────────── */
  function renderStep() {
    if (step === 1) {
      return (
        <div className="p-6 grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <Field label="Tank ID Number" required error={errors.tank_id_number}>
              <input
                type="text"
                value={form.tank_id_number}
                onChange={(e) => set("tank_id_number", e.target.value)}
                placeholder="e.g. TK-001"
                className="ui-input text-sm"
                autoFocus
              />
            </Field>
          </div>
          <div className="col-span-2">
            <Field label="Tank Location" required error={errors.tank_location}>
              <input
                type="text"
                value={form.tank_location}
                onChange={(e) => set("tank_location", e.target.value)}
                placeholder="e.g. Fuel Depot — Bay 3"
                className="ui-input text-sm"
              />
            </Field>
          </div>
          <div className="col-span-2">
            <Field label="Fuel Type" required error={errors.fuel_type}>
              <select
                value={form.fuel_type}
                onChange={(e) => set("fuel_type", e.target.value)}
                className="ui-input text-sm"
                style={{ background: "var(--bg)", color: form.fuel_type ? "var(--text)" : "var(--text-muted)" }}
              >
                <option value="">Select fuel type…</option>
                {FUEL_TYPE_OPTIONS.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
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
              className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold"
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
              className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold"
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
            Inspection Details
          </p>
          <div className="grid grid-cols-2 gap-3">
            <ReviewRow label="Tank ID Number" value={form.tank_id_number} />
            <ReviewRow label="Fuel Type" value={form.fuel_type} />
            <div className="col-span-2">
              <ReviewRow label="Tank Location" value={form.tank_location} />
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

          {apiError && (
            <div
              className="text-xs px-3 py-2 rounded-lg"
              style={{
                background: "color-mix(in srgb,var(--danger) 12%,transparent)",
                color: "var(--danger)",
              }}
            >
              {apiError}
            </div>
          )}
        </div>
      );
    }
  }

  const title = isEdit
    ? `Edit — Tank #${setup?.tank_id_number ?? ""}`
    : "New Fuel Tank Inspection";

  return (
    <ModalShell isOpen={isOpen} onClose={onClose} title={title} width="max-w-lg">
      <StepIndicator currentStep={step} completedSteps={completed} />
      <div style={{ minHeight: "320px" }}>{renderStep()}</div>

      {/* Footer nav */}
      <div
        className="flex items-center justify-between px-6 py-4 flex-shrink-0"
        style={{ borderTop: "1px solid var(--border)" }}
      >
        <button
          onClick={step === 1 ? onClose : goBack}
          className="px-4 py-2 rounded-lg text-sm font-medium"
          style={{ background: "var(--bg-raised)", color: "var(--text)", border: "1px solid var(--border)" }}
        >
          {step === 1 ? "Cancel" : "Back"}
        </button>
        {step < 4 ? (
          <button
            onClick={goNext}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-white"
            style={{ background: "var(--accent)" }}
          >
            Next
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50 flex items-center gap-2"
            style={{ background: "var(--accent)" }}
          >
            {saving ? <Spinner size={3} /> : null}
            {saving ? "Saving…" : isEdit ? "Update" : "Create"}
          </button>
        )}
      </div>
    </ModalShell>
  );
}
