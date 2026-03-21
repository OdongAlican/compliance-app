/* ── Vehicle Inspection — SetupFormModal ─────────────────────────────── */
import { useState, useEffect } from "react";
import { CheckBadgeIcon } from "@heroicons/react/24/outline";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import {
  createVehicleSetup,
  updateVehicleSetup,
  clearVehicleActionError,
  selectVehicleActionLoading,
  selectVehicleActionError,
} from "../../store/slices/vehicleSlice";
import toast from "react-hot-toast";
import { Field, Spinner, ModalShell, StepIndicator, ReviewRow } from "./shared";
import UserAutocomplete from "./UserAutocomplete";

export default function SetupFormModal({ isOpen, onClose, setup }) {
  const dispatch = useAppDispatch();
  const actionLoading = useAppSelector(selectVehicleActionLoading);
  const actionError = useAppSelector(selectVehicleActionError);
  const isEdit = Boolean(setup);

  const [step, setStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState([]);

  const [form, setForm] = useState({
    vehicle_id: "",
    odometer_reading: "",
    model: "",
    date: "",
    time: "",
    note: "",
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
      dispatch(clearVehicleActionError());
      if (setup) {
        setForm({
          vehicle_id: setup.vehicle_id ?? "",
          odometer_reading: setup.odometer_reading ?? "",
          model: setup.model ?? "",
          date: setup.date ?? "",
          time: setup.time ?? "",
          note: setup.note ?? "",
        });
        setSafetyOfficer(setup.safety_officer ?? null);
        setSupervisor(setup.supervisor ?? null);
      } else {
        setForm({ vehicle_id: "", odometer_reading: "", model: "", date: "", time: "", note: "" });
        setSafetyOfficer(null);
        setSupervisor(null);
      }
    }
  }, [isOpen, setup, dispatch]);

  function set(k, v) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function validateStep(s) {
    const e = {};
    if (s === 1) {
      if (!form.vehicle_id.trim()) e.vehicle_id = "Vehicle ID is required.";
      if (!form.odometer_reading && form.odometer_reading !== 0)
        e.odometer_reading = "Odometer reading is required.";
      if (!form.model.trim()) e.model = "Model is required.";
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
      vehicle_id: form.vehicle_id.trim(),
      odometer_reading: Number(form.odometer_reading),
      model: form.model.trim(),
      date: form.date,
      time: form.time,
      note: form.note.trim() || undefined,
      safety_officer_id: Number(safetyOfficer.id),
      supervisor_id: Number(supervisor.id),
    };
    const action = isEdit
      ? dispatch(updateVehicleSetup({ id: setup.id, data: payload }))
      : dispatch(createVehicleSetup(payload));
    const result = await action;
    if (
      createVehicleSetup.fulfilled.match(result) ||
      updateVehicleSetup.fulfilled.match(result)
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

  function renderStep() {
    if (step === 1) {
      return (
        <div className="p-6 grid grid-cols-2 gap-4">
          <Field label="Vehicle ID" required error={errors.vehicle_id}>
            <input
              value={form.vehicle_id}
              onChange={(e) => set("vehicle_id", e.target.value)}
              placeholder="e.g. ABC-123"
              className="ui-input text-sm"
              autoFocus
            />
          </Field>
          <Field label="Odometer Reading" required error={errors.odometer_reading}>
            <input
              type="number"
              min={0}
              value={form.odometer_reading}
              onChange={(e) => set("odometer_reading", e.target.value)}
              placeholder="e.g. 45000"
              className="ui-input text-sm"
            />
          </Field>
          <div className="col-span-2">
            <Field label="Model" required error={errors.model}>
              <input
                value={form.model}
                onChange={(e) => set("model", e.target.value)}
                placeholder="e.g. Toyota Hilux"
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
      /* Review */
      return (
        <div className="p-6 flex flex-col gap-4">
          <div
            className="p-4 rounded-xl"
            style={{
              background: "color-mix(in srgb,#3fb950 8%,transparent)",
              border: "1px solid color-mix(in srgb,#3fb950 30%,transparent)",
            }}
          >
            <p className="text-sm font-semibold flex items-center gap-2" style={{ color: "#3fb950" }}>
              <CheckBadgeIcon className="h-5 w-5" /> Review & Confirm
            </p>
            <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
              Please confirm all details below before saving.
            </p>
          </div>
          <div
            className="rounded-xl overflow-hidden divide-y"
            style={{ border: "1px solid var(--border)", "--tw-divide-opacity": 1 }}
          >
            <ReviewRow label="Vehicle ID" value={form.vehicle_id} />
            <ReviewRow label="Odometer Reading" value={form.odometer_reading} />
            <ReviewRow label="Model" value={form.model} />
            <ReviewRow label="Date" value={form.date} />
            <ReviewRow label="Time" value={form.time} />
            <ReviewRow label="Note" value={form.note || "—"} />
            <ReviewRow
              label="Safety Officer"
              value={
                safetyOfficer
                  ? `${safetyOfficer.firstname} ${safetyOfficer.lastname}`
                  : "—"
              }
            />
            <ReviewRow
              label="Supervisor"
              value={
                supervisor ? `${supervisor.firstname} ${supervisor.lastname}` : "—"
              }
            />
          </div>
          {actionError && (
            <p className="text-sm text-center" style={{ color: "var(--danger)" }}>
              {actionError}
            </p>
          )}
        </div>
      );
    }
  }

  const totalSteps = 4;

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? "Edit Vehicle Inspection" : "New Vehicle Inspection"}
      width="max-w-xl"
    >
      <StepIndicator currentStep={step} completedSteps={completedSteps} />
      <div className="overflow-y-auto" style={{ maxHeight: "60vh" }}>
        {renderStep()}
      </div>
      {/* Footer */}
      <div
        className="flex items-center justify-between px-6 py-4"
        style={{ borderTop: "1px solid var(--border)" }}
      >
        <button
          type="button"
          onClick={step === 1 ? onClose : goBack}
          className="px-4 py-2 text-sm rounded-lg hover:opacity-80"
          style={{
            background: "var(--bg-raised)",
            color: "var(--text-muted)",
            border: "1px solid var(--border)",
          }}
        >
          {step === 1 ? "Cancel" : "← Back"}
        </button>
        {step < totalSteps ? (
          <button
            type="button"
            onClick={goNext}
            className="px-4 py-2 text-sm rounded-lg font-medium hover:opacity-90"
            style={{ background: "var(--accent)", color: "#fff" }}
          >
            Next →
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={actionLoading}
            className="px-4 py-2 text-sm rounded-lg font-medium hover:opacity-90 disabled:opacity-60 flex items-center gap-2"
            style={{ background: "#3fb950", color: "#fff" }}
          >
            {actionLoading && <Spinner size={4} />}
            {isEdit ? "Save Changes" : "Create Inspection"}
          </button>
        )}
      </div>
    </ModalShell>
  );
}
