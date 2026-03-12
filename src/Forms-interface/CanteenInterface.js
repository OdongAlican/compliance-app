import { useEffect, useState, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import toast from "react-hot-toast";
import {
  EllipsisVerticalIcon,
  MagnifyingGlassIcon,
  ArrowDownTrayIcon,
  ClipboardDocumentCheckIcon,
  CalendarDaysIcon,
  FunnelIcon,
  XMarkIcon,
  ArrowPathIcon,
  PlusIcon,
  CheckBadgeIcon,
} from "@heroicons/react/24/outline";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import {
  fetchCanteenSetups,
  createCanteenSetup,
  updateCanteenSetup,
  deleteCanteenSetup,
  reassignCanteenSupervisor,
  reassignCanteenSafetyOfficer,
  setCanteenPage,
  setCanteenName,
  setCanteenDateFrom,
  setCanteenDateTo,
  clearCanteenFilters,
  clearCanteenError,
  clearActionError,
  selectCanteenSetups,
  selectCanteenMeta,
  selectCanteenLoading,
  selectCanteenError,
  selectCanteenActionLoading,
  selectCanteenActionError,
  selectCanteenFilters,
} from "../store/slices/canteenSlice";
import useAuth from "../hooks/useAuth";
import UsersService from "../services/users.service";
import { CanteenPerformService } from "../services/canteen.service";

/* ── Status badge styles ────────────────────────────────────────────────── */
const STATUS_STYLE = {
  Pending: { background: "color-mix(in srgb,#f85149 15%,transparent)", color: "#f85149" },
  "In Progress": { background: "color-mix(in srgb,#d29922 15%,transparent)", color: "#d29922" },
  Completed: { background: "color-mix(in srgb,#3fb950 15%,transparent)", color: "#3fb950" },
  Approved: { background: "color-mix(in srgb,#58a6ff 15%,transparent)", color: "#58a6ff" },
};

/* ── Spinner ───────────────────────────────────────────────────────────── */
function Spinner({ size = 5 }) {
  return (
    <div
      className="animate-spin rounded-full"
      style={{
        width: size * 4 + "px",
        height: size * 4 + "px",
        borderWidth: "3px",
        borderStyle: "solid",
        borderColor: "var(--border)",
        borderTopColor: "var(--accent)",
      }}
    />
  );
}

/* ── Field ─────────────────────────────────────────────────────────────── */
function Field({ label, required, error, hint, children }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
        {label}
        {required && <span style={{ color: "var(--danger)" }}> *</span>}
      </label>
      {children}
      {hint && !error && (
        <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
          {hint}
        </p>
      )}
      {error && (
        <p className="text-[11px]" style={{ color: "var(--danger)" }}>
          {error}
        </p>
      )}
    </div>
  );
}

/* ── Pagination ────────────────────────────────────────────────────────── */
function Pagination({ meta, onPage }) {
  if (!meta || meta.total_pages <= 1) return null;
  const { page, total_pages, total, per_page } = meta;
  const from = (page - 1) * per_page + 1;
  const to = Math.min(page * per_page, total);
  return (
    <div
      className="flex items-center justify-between px-4 py-3 text-sm"
      style={{ borderTop: "1px solid var(--border)", color: "var(--text-muted)" }}
    >
      <span>
        {from}–{to} of {total}
      </span>
      <div className="flex items-center gap-1">
        <button
          disabled={page === 1}
          onClick={() => onPage(page - 1)}
          className="px-2 py-1 rounded text-xs hover:opacity-80 disabled:opacity-30"
          style={{ background: "var(--bg-raised)", border: "1px solid var(--border)" }}
        >
          ‹ Prev
        </button>
        <span
          className="px-3 py-1 text-xs rounded"
          style={{
            background: "var(--bg-raised)",
            border: "1px solid var(--border)",
            color: "var(--text)",
          }}
        >
          {page} / {total_pages}
        </span>
        <button
          disabled={page === total_pages}
          onClick={() => onPage(page + 1)}
          className="px-2 py-1 rounded text-xs hover:opacity-80 disabled:opacity-30"
          style={{ background: "var(--bg-raised)", border: "1px solid var(--border)" }}
        >
          Next ›
        </button>
      </div>
    </div>
  );
}

/* ── ActionMenu ────────────────────────────────────────────────────────── */
function ActionMenu({ actions }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, right: 0 });
  const btnRef = useRef(null);
  const menuRef = useRef(null);

  /* Close on outside click — but NOT when clicking inside the portal menu */
  useEffect(() => {
    if (!open) return;
    const h = (e) => {
      const inBtn = btnRef.current && btnRef.current.contains(e.target);
      const inMenu = menuRef.current && menuRef.current.contains(e.target);
      if (!inBtn && !inMenu) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  /* Close on scroll so position doesn't go stale */
  useEffect(() => {
    if (!open) return;
    const h = () => setOpen(false);
    window.addEventListener("scroll", h, true);
    return () => window.removeEventListener("scroll", h, true);
  }, [open]);

  function handleToggle() {
    if (!open && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      setPos({ top: r.bottom + 4, right: window.innerWidth - r.right });
    }
    setOpen((o) => !o);
  }

  return (
    <div className="inline-block">
      <button
        ref={btnRef}
        onClick={handleToggle}
        className="p-1.5 rounded-lg transition-colors"
        style={{
          color: "var(--text-muted)",
          background: open ? "var(--bg-raised)" : "transparent",
        }}
      >
        <EllipsisVerticalIcon className="h-5 w-5" />
      </button>
      {open && createPortal(
        <div
          ref={menuRef}
          className="ui-menu w-56"
          style={{
            position: "fixed",
            top: pos.top,
            right: pos.right,
            zIndex: 10001,
          }}
        >
          {actions.map((a, i) =>
            a.divider ? (
              <div
                key={i}
                style={{ height: 1, background: "var(--border)", margin: "4px 0" }}
              />
            ) : (
              <button
                key={i}
                className="ui-menu-item text-left w-full"
                style={{ color: a.danger ? "var(--danger)" : a.color ?? "var(--text)" }}
                onClick={() => {
                  setOpen(false);
                  a.onClick();
                }}
              >
                {a.label}
              </button>
            )
          )}
        </div>,
        document.body
      )}
    </div>
  );
}

/* ── ModalShell ────────────────────────────────────────────────────────── */
function ModalShell({ isOpen, onClose, title, width = "max-w-lg", children }) {
  if (!isOpen) return null;
  return createPortal(
    <div
      className="fixed inset-0 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.55)", zIndex: 9999 }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className={"ui-card w-full " + width + " flex flex-col"}
        style={{ padding: 0, maxHeight: "90vh", overflow: "hidden", zIndex: 10000, position: "relative" }}
      >
        <div
          className="flex items-center justify-between px-6 py-4 flex-shrink-0"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <h2 className="font-bold text-sm" style={{ color: "var(--text)" }}>
            {title}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded hover:opacity-70"
            style={{ color: "var(--text-muted)" }}
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
        <div className="overflow-y-auto flex-1">{children}</div>
      </div>
    </div>,
    document.body
  );
}

/* ── UserAutocomplete ──────────────────────────────────────────────────── */
function UserAutocomplete({ roleFilter, value, onChange, placeholder, error }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef(null);
  const containerRef = useRef(null);

  /* Close dropdown on outside click */
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  /* Initial load + debounced search */
  const fetchUsers = useCallback((q = "") => {
    setLoading(true);
    const params = { per_page: 10, "filter[role]": roleFilter };
    if (q.trim()) params["filter[firstname]"] = q.trim();
    UsersService.list(params)
      .then((res) => {
        const list = Array.isArray(res) ? res : res.data ?? [];
        setResults(list);
      })
      .catch(() => setResults([]))
      .finally(() => setLoading(false));
  }, [roleFilter]);

  /* Load defaults on mount */
  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  function handleInput(e) {
    const q = e.target.value;
    setQuery(q);
    setOpen(true);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchUsers(q), 400);
  }

  function handleSelect(user) {
    onChange(user);
    setQuery(user.firstname + " " + user.lastname);
    setOpen(false);
  }

  function handleFocus() {
    setOpen(true);
    if (results.length === 0) fetchUsers(query);
  }

  /* Sync display if value cleared externally */
  useEffect(() => {
    if (!value) setQuery("");
  }, [value]);

  const roleName = (u) =>
    u.role?.name
      ? u.role.name.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
      : "—";

  return (
    <div className="relative" ref={containerRef}>
      <div
        className="flex items-center gap-2 rounded-lg px-3 py-2.5"
        style={{
          background: "var(--bg)",
          border: `1px solid ${error ? "var(--danger)" : open ? "var(--accent)" : "var(--border)"}`,
          transition: "border-color 0.15s",
        }}
      >
        <MagnifyingGlassIcon
          className="w-4 h-4 flex-shrink-0"
          style={{ color: "var(--text-muted)" }}
        />
        <input
          value={query}
          onChange={handleInput}
          onFocus={handleFocus}
          placeholder={placeholder}
          style={{
            background: "transparent",
            outline: "none",
            color: "var(--text)",
            fontSize: "13px",
            width: "100%",
          }}
        />
        {loading && (
          <div
            className="animate-spin rounded-full flex-shrink-0"
            style={{
              width: "14px",
              height: "14px",
              border: "2px solid var(--border)",
              borderTopColor: "var(--accent)",
            }}
          />
        )}
        {value && !loading && (
          <button
            type="button"
            onClick={() => { onChange(null); setQuery(""); fetchUsers(""); setOpen(true); }}
            style={{ color: "var(--text-muted)" }}
          >
            <XMarkIcon className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {open && (
        <div
          className="absolute left-0 right-0 mt-1 rounded-xl shadow-xl z-50 overflow-hidden"
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border)",
            maxHeight: "260px",
            overflowY: "auto",
          }}
        >
          {results.length === 0 && !loading && (
            <div
              className="px-4 py-3 text-sm text-center"
              style={{ color: "var(--text-muted)" }}
            >
              No users found.
            </div>
          )}
          {results.map((u) => {
            const isSelected = value?.id === u.id;
            return (
              <button
                key={u.id}
                type="button"
                onClick={() => handleSelect(u)}
                className="w-full text-left px-4 py-3 flex items-center gap-3 transition-colors"
                style={{
                  background: isSelected
                    ? "color-mix(in srgb,var(--accent) 12%,transparent)"
                    : "transparent",
                  borderBottom: "1px solid var(--border)",
                }}
                onMouseEnter={(e) => {
                  if (!isSelected)
                    e.currentTarget.style.background =
                      "color-mix(in srgb,var(--accent) 6%,transparent)";
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) e.currentTarget.style.background = "transparent";
                }}
              >
                {/* Avatar */}
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold"
                  style={{
                    background: isSelected
                      ? "var(--accent)"
                      : "color-mix(in srgb,var(--accent) 20%,transparent)",
                    color: isSelected ? "#fff" : "var(--accent)",
                  }}
                >
                  {u.firstname?.[0]}{u.lastname?.[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className="text-sm font-semibold truncate"
                    style={{ color: "var(--text)" }}
                  >
                    {u.firstname} {u.lastname}
                  </p>
                  <p
                    className="text-[11px] truncate"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {roleName(u)}{u.email ? " · " + u.email : ""}
                  </p>
                </div>
                {isSelected && (
                  <CheckBadgeIcon
                    className="h-4 w-4 flex-shrink-0"
                    style={{ color: "var(--accent)" }}
                  />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ── StepIndicator ─────────────────────────────────────────────────────── */
const STEP_LABELS = ["Basic Info", "Safety Officer", "Supervisor", "Review"];

function StepIndicator({ currentStep, completedSteps }) {
  return (
    <div className="px-6 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
      <div className="flex items-center gap-0">
        {STEP_LABELS.map((label, i) => {
          const stepNum = i + 1;
          const isCompleted = completedSteps.includes(stepNum);
          const isActive = currentStep === stepNum;
          const isLast = i === STEP_LABELS.length - 1;
          return (
            <div key={stepNum} className="flex items-center" style={{ flex: isLast ? "0 0 auto" : 1 }}>
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-200 flex-shrink-0"
                  style={
                    isCompleted
                      ? { background: "#3fb950", color: "#fff" }
                      : isActive
                        ? { background: "var(--accent)", color: "#fff" }
                        : {
                          background: "var(--bg-raised)",
                          color: "var(--text-muted)",
                          border: "2px solid var(--border)",
                        }
                  }
                >
                  {isCompleted ? (
                    <CheckBadgeIcon className="h-4 w-4" />
                  ) : (
                    stepNum
                  )}
                </div>
                <span
                  className="text-[10px] font-semibold whitespace-nowrap"
                  style={{
                    color: isCompleted
                      ? "#3fb950"
                      : isActive
                        ? "var(--accent)"
                        : "var(--text-muted)",
                  }}
                >
                  {label}
                </span>
              </div>
              {!isLast && (
                <div
                  className="h-0.5 flex-1 mx-1 mb-5 rounded-full transition-all duration-200"
                  style={{
                    background: isCompleted
                      ? "#3fb950"
                      : "var(--border)",
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── ReviewRow ─────────────────────────────────────────────────────────── */
function ReviewRow({ label, value }) {
  return (
    <div
      className="flex flex-col gap-0.5 p-3 rounded-lg"
      style={{ background: "var(--bg-raised)", border: "1px solid var(--border)" }}
    >
      <span className="text-[11px] font-semibold" style={{ color: "var(--text-muted)" }}>
        {label}
      </span>
      <span className="text-sm font-medium" style={{ color: "var(--text)" }}>
        {value || "—"}
      </span>
    </div>
  );
}

/* ── SetupFormModal ────────────────────────────────────────────────────── */
function SetupFormModal({ isOpen, onClose, setup, catalogItems }) {
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
            <ReviewRow label="Date" value={form.date} />
            <ReviewRow label="Time" value={form.time} />
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

/* ── ReassignModal ─────────────────────────────────────────────────────── */
function ReassignModal({ isOpen, onClose, mode, setupId, users }) {
  const dispatch = useAppDispatch();
  const actionLoading = useAppSelector(selectCanteenActionLoading);
  const [userId, setUserId] = useState("");
  const [err, setErr] = useState("");
  useEffect(() => {
    if (isOpen) {
      setUserId("");
      setErr("");
    }
  }, [isOpen]);

  const filtered = users.filter((u) => {
    const role = (u.role?.name || u.role || "").toLowerCase();
    return mode === "supervisor"
      ? role.includes("supervisor")
      : role.includes("safety");
  });
  const list = filtered.length ? filtered : users;

  async function handleSave() {
    if (!userId) { setErr("Please select a user."); return; }
    const action =
      mode === "supervisor"
        ? dispatch(
          reassignCanteenSupervisor({ id: setupId, supervisorId: Number(userId) })
        )
        : dispatch(
          reassignCanteenSafetyOfficer({
            id: setupId,
            safetyOfficerId: Number(userId),
          })
        );
    const result = await action;
    if (
      reassignCanteenSupervisor.fulfilled.match(result) ||
      reassignCanteenSafetyOfficer.fulfilled.match(result)
    ) {
      toast.success(
        (mode === "supervisor" ? "Supervisor" : "Safety officer") + " reassigned."
      );
      onClose();
    } else {
      toast.error(result.payload || "Reassignment failed.");
    }
  }

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      title={mode === "supervisor" ? "Reassign Supervisor" : "Reassign Safety Officer"}
      width="max-w-sm"
    >
      <div className="p-6 flex flex-col gap-4">
        <Field
          label={mode === "supervisor" ? "New Supervisor" : "New Safety Officer"}
          required
          error={err}
        >
          <select
            value={userId}
            onChange={(e) => { setUserId(e.target.value); setErr(""); }}
            className="ui-input text-sm"
          >
            <option value="">— Select user —</option>
            {list.map((u) => (
              <option key={u.id} value={u.id}>
                {u.firstname} {u.lastname}
              </option>
            ))}
          </select>
        </Field>
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={actionLoading}
            className="px-3 py-1.5 rounded-lg text-sm font-medium"
            style={{
              background: "var(--bg-raised)",
              color: "var(--text-muted)",
              border: "1px solid var(--border)",
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={actionLoading || !userId}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold"
            style={{ background: "var(--accent)", color: "#fff" }}
          >
            {actionLoading && <Spinner size={4} />} Reassign
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

/* ── DeleteConfirmModal ────────────────────────────────────────────────── */
function DeleteConfirmModal({ isOpen, onClose, setup, loading, onConfirm }) {
  return (
    <ModalShell isOpen={isOpen} onClose={onClose} title="Delete Inspection" width="max-w-sm">
      <div className="p-6 flex flex-col gap-4">
        <p className="text-sm" style={{ color: "var(--text)" }}>
          Are you sure you want to delete{" "}
          <strong style={{ color: "var(--danger)" }}>{setup?.name}</strong>? This action
          cannot be undone.
        </p>
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-3 py-1.5 rounded-lg text-sm font-medium"
            style={{
              background: "var(--bg-raised)",
              color: "var(--text-muted)",
              border: "1px solid var(--border)",
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold"
            style={{ background: "var(--danger)", color: "#fff" }}
          >
            {loading && <Spinner size={4} />} Delete
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

/* ── StartInspectionModal ──────────────────────────────────────────────── */
function StartInspectionModal({ isOpen, onClose, setup }) {
  const [form, setForm] = useState({ date: "", time: "", note: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const now = new Date();
      setForm({
        date: now.toISOString().slice(0, 10),
        time: now.toTimeString().slice(0, 5),
        note: "",
      });
      setErrors({});
    }
  }, [isOpen]);

  function validate() {
    const e = {};
    if (!form.date) e.date = "Date is required.";
    if (!form.time) e.time = "Time is required.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(ev) {
    ev.preventDefault();
    if (!validate() || !setup) return;
    setLoading(true);
    try {
      await CanteenPerformService.create(setup.id, {
        date: form.date,
        time: form.time,
        note: form.note || undefined,
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

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      title={"Start Inspection — " + (setup?.name ?? "")}
      width="max-w-md"
    >
      <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          This creates a performed inspection execution log. Checklists and issues can be
          managed after creation.
        </p>
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
        <Field label="Note">
          <textarea
            value={form.note}
            onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
            rows={3}
            placeholder="Optional notes…"
            className="ui-input text-sm resize-none"
          />
        </Field>
        <div
          className="flex justify-end gap-3 pt-2"
          style={{ borderTop: "1px solid var(--border)" }}
        >
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 rounded-lg text-sm font-medium"
            style={{
              background: "var(--bg-raised)",
              color: "var(--text-muted)",
              border: "1px solid var(--border)",
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold"
            style={{ background: "var(--accent)", color: "#fff" }}
          >
            {loading && <Spinner size={4} />} Start Inspection
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

/* ── DetailDrawer ──────────────────────────────────────────────────────── */
function DetailDrawer({ isOpen, onClose, setup }) {
  const [performs, setPerforms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [signing, setSigning] = useState(null);

  const load = useCallback(async () => {
    if (!setup) return;
    setLoading(true);
    setError("");
    try {
      const res = await CanteenPerformService.list(setup.id, { per_page: 20 });
      setPerforms(Array.isArray(res) ? res : res.data ?? []);
    } catch {
      setError("Failed to load executions.");
    } finally {
      setLoading(false);
    }
  }, [setup]);

  useEffect(() => {
    if (isOpen && setup) load();
    else setPerforms([]);
  }, [isOpen, setup, load]);

  async function handleSignOff(pid) {
    setSigning(pid);
    try {
      await CanteenPerformService.signOff(pid);
      toast.success("Signed off.");
      load();
    } catch (e) {
      toast.error(e?.response?.data?.error || "Sign-off failed.");
    } finally {
      setSigning(null);
    }
  }

  if (!isOpen || !setup) return null;

  const infoRows = [
    { label: "Location", value: setup.location },
    { label: "Date", value: setup.date },
    { label: "Time", value: setup.time },
    {
      label: "Safety Officer",
      value: setup.safety_officer
        ? setup.safety_officer.firstname + " " + setup.safety_officer.lastname
        : setup.safetyofficer ?? "—",
    },
    {
      label: "Supervisor",
      value: setup.supervisor
        ? setup.supervisor.firstname + " " + setup.supervisor.lastname
        : "—",
    },
    { label: "Note", value: setup.note || "—" },
  ];

  return createPortal(
    <div
      className="fixed inset-0 flex justify-end"
      style={{ background: "rgba(0,0,0,0.45)", zIndex: 9999 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="h-full w-full max-w-lg overflow-y-auto shadow-2xl flex flex-col"
        style={{ background: "var(--bg-surface)", borderLeft: "1px solid var(--border)", position: "relative", zIndex: 10000 }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 flex-shrink-0"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <div>
            <h2 className="font-bold text-sm" style={{ color: "var(--text)" }}>
              {setup.name}
            </h2>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
              Canteen Inspection Detail
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:opacity-70"
            style={{ color: "var(--text-muted)" }}
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
        {/* Info grid */}
        <div
          className="px-6 py-5 grid grid-cols-2 gap-4"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          {infoRows.map(({ label, value }) => (
            <div key={label} className={label === "Note" ? "col-span-2" : ""}>
              <p
                className="text-[11px] font-semibold mb-0.5"
                style={{ color: "var(--text-muted)" }}
              >
                {label}
              </p>
              <p className="text-sm" style={{ color: "var(--text)" }}>
                {value ?? "—"}
              </p>
            </div>
          ))}
        </div>
        {/* Executions */}
        <div className="flex-1 px-6 py-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-sm" style={{ color: "var(--text)" }}>
              Executions
            </h3>
            <button
              onClick={load}
              title="Refresh"
              className="p-1 rounded hover:opacity-70"
              style={{ color: "var(--text-muted)" }}
            >
              <ArrowPathIcon className="h-4 w-4" />
            </button>
          </div>
          {loading ? (
            <div className="flex justify-center py-10">
              <Spinner />
            </div>
          ) : error ? (
            <p
              className="text-sm text-center py-6"
              style={{ color: "var(--danger)" }}
            >
              {error}
            </p>
          ) : performs.length === 0 ? (
            <p
              className="text-sm text-center py-6"
              style={{ color: "var(--text-muted)" }}
            >
              No executions yet.
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {performs.map((p) => {
                const signed = Boolean(p.signed_off_at);
                return (
                  <div
                    key={p.id}
                    className="rounded-xl p-4"
                    style={{
                      background: "var(--bg-raised)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p
                          className="text-sm font-semibold"
                          style={{ color: "var(--text)" }}
                        >
                          Execution #{p.id}
                        </p>
                        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                          {p.date} at {p.time}
                        </p>
                        {p.note && (
                          <p
                            className="text-xs mt-1"
                            style={{ color: "var(--text-muted)" }}
                          >
                            {p.note}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span
                          className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                          style={
                            signed
                              ? {
                                background:
                                  "color-mix(in srgb,#3fb950 15%,transparent)",
                                color: "#3fb950",
                              }
                              : {
                                background:
                                  "color-mix(in srgb,#d29922 15%,transparent)",
                                color: "#d29922",
                              }
                          }
                        >
                          {signed ? "✓ Signed Off" : "Pending"}
                        </span>
                        {!signed && (
                          <button
                            onClick={() => handleSignOff(p.id)}
                            disabled={signing === p.id}
                            className="flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-lg"
                            style={{
                              background:
                                "color-mix(in srgb,#3fb950 15%,transparent)",
                              color: "#3fb950",
                            }}
                          >
                            {signing === p.id ? (
                              <Spinner size={3} />
                            ) : (
                              <CheckBadgeIcon className="h-3 w-3" />
                            )}
                            Sign Off
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

/* ── Table Skeleton ────────────────────────────────────────────────────── */
function TableSkeleton({ cols = 9, rows = 5 }) {
  return (
    <tbody>
      {Array.from({ length: rows }, (_, i) => (
        <tr key={i} style={{ borderBottom: "1px solid var(--border)" }}>
          {Array.from({ length: cols }, (_, j) => (
            <td key={j} className="px-4 py-4">
              <div
                className="h-3 rounded animate-pulse"
                style={{
                  background: "var(--bg-raised)",
                  width: j === 0 ? "40px" : j === 1 ? "120px" : "80px",
                }}
              />
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  );
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*  MAIN PAGE                                                              */
/* ═══════════════════════════════════════════════════════════════════════ */
const COLS = [
  "#",
  "Name",
  "Location",
  "Date",
  "Time",
  "Safety Officer",
  "Supervisor",
  "Status",
  "",
];

export default function CanteenInterface() {
  const dispatch = useAppDispatch();
  const { hasPermission } = useAuth();

  const setups = useAppSelector(selectCanteenSetups);
  const meta = useAppSelector(selectCanteenMeta);
  const loading = useAppSelector(selectCanteenLoading);
  const error = useAppSelector(selectCanteenError);
  const filters = useAppSelector(selectCanteenFilters);

  const canCreate = hasPermission("canteen_inspections.create");
  const canUpdate = hasPermission("canteen_inspections.update");
  const canDelete = hasPermission("canteen_inspections.delete");

  const [users, setUsers] = useState([]);
  const [catalogItems, setCatalogItems] = useState([]);
  const [setupModal, setSetupModal] = useState({ open: false, setup: null });
  const [reassignModal, setReassignModal] = useState({ open: false, mode: null, setupId: null });
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [startModal, setStartModal] = useState({ open: false, setup: null });
  const [detailDrawer, setDetailDrawer] = useState({ open: false, setup: null });
  const [searchInput, setSearchInput] = useState("");
  const searchTimer = useRef(null);

  /* Load setups when filters change */
  useEffect(() => {
    dispatch(fetchCanteenSetups());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, filters.page, filters.name, filters.date_from, filters.date_to]);

  /* Load users once */
  useEffect(() => {
    UsersService.list({ per_page: 200 })
      .then((res) => setUsers(Array.isArray(res) ? res : res.data ?? []))
      .catch(() => { });

    /* Try to load inspection catalog */
    import("../services/inspections.service")
      .then((m) => {
        const svc = m.default;
        const fn = typeof svc?.list === "function" ? svc.list.bind(svc) : null;
        if (fn)
          fn()
            .then((r) => setCatalogItems(Array.isArray(r) ? r : r.data ?? []))
            .catch(() => { });
      })
      .catch(() => { });
  }, []);

  /* Surface API errors via toast */
  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearCanteenError());
    }
  }, [error, dispatch]);

  /* Search debounce */
  function handleSearch(val) {
    setSearchInput(val);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => dispatch(setCanteenName(val)), 400);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    const result = await dispatch(deleteCanteenSetup(deleteTarget.id));
    setDeleting(false);
    setDeleteTarget(null);
    if (deleteCanteenSetup.fulfilled.match(result)) toast.success("Inspection deleted.");
    else toast.error(result.payload || "Delete failed.");
  }

  function handleExport() {
    const rows = [
      ["ID", "Name", "Location", "Date", "Time", "Safety Officer", "Supervisor"],
      ...setups.map((s) => [
        s.id,
        s.name,
        s.location,
        s.date,
        s.time,
        s.safety_officer
          ? s.safety_officer.firstname + " " + s.safety_officer.lastname
          : s.safetyofficer ?? "",
        s.supervisor
          ? s.supervisor.firstname + " " + s.supervisor.lastname
          : "",
      ]),
    ];
    const csv = rows
      .map((r) => r.map((c) => `"${c ?? ""}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement("a"), {
      href: url,
      download: "canteen-inspections.csv",
    });
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("CSV exported.");
  }

  const hasFilters = !!(filters.name || filters.date_from || filters.date_to);

  return (
    <div className="ui-page" style={{ color: "var(--text)" }}>
      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "color-mix(in srgb,var(--accent) 15%,transparent)" }}
          >
            <ClipboardDocumentCheckIcon
              className="w-5 h-5"
              style={{ color: "var(--accent)" }}
            />
          </div>
          <div>
            <h1
              className="text-xl font-bold leading-tight"
              style={{ color: "var(--text)" }}
            >
              Canteen Inspection
            </h1>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
              {meta
                ? meta.total + " inspection" + (meta.total !== 1 ? "s" : "")
                : "Manage canteen inspection setups."}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => dispatch(fetchCanteenSetups())}
            disabled={loading}
            className="p-2 rounded-lg hover:opacity-80"
            style={{ color: "var(--text-muted)" }}
            title="Refresh"
          >
            <ArrowPathIcon className={"h-4 w-4" + (loading ? " animate-spin" : "")} />
          </button>
          {canCreate && (
            <button
              onClick={() => setSetupModal({ open: true, setup: null })}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white hover:opacity-90"
              style={{ background: "var(--accent)" }}
            >
              <PlusIcon className="h-4 w-4" /> New Inspection
            </button>
          )}
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="ui-card mb-4 p-3">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center flex-wrap">
          {/* Search */}
          <div
            className="flex items-center gap-2 flex-1 min-w-[180px] rounded-lg px-3 py-2.5"
            style={{ background: "var(--bg)", border: "1px solid var(--border)" }}
          >
            <MagnifyingGlassIcon
              className="w-4 h-4 flex-shrink-0"
              style={{ color: "var(--text-muted)" }}
            />
            <input
              value={searchInput}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search by name or location…"
              style={{
                background: "transparent",
                outline: "none",
                color: "var(--text)",
                fontSize: "13px",
                width: "100%",
              }}
            />
            {searchInput && (
              <button
                onClick={() => { setSearchInput(""); dispatch(setCanteenName("")); }}
                style={{ color: "var(--text-muted)" }}
              >
                <XMarkIcon className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          {/* Date range */}
          <div
            className="flex items-center gap-2 rounded-lg px-3 py-2.5"
            style={{ background: "var(--bg)", border: "1px solid var(--border)" }}
          >
            <CalendarDaysIcon
              className="w-4 h-4 flex-shrink-0"
              style={{ color: "var(--text-muted)" }}
            />
            <input
              type="date"
              value={filters.date_from}
              onChange={(e) => dispatch(setCanteenDateFrom(e.target.value))}
              title="From date"
              style={{
                background: "transparent",
                outline: "none",
                color: filters.date_from ? "var(--text)" : "var(--text-muted)",
                fontSize: "13px",
                border: "none",
                cursor: "pointer",
              }}
            />
            <span style={{ color: "var(--border)", fontWeight: 600 }}>–</span>
            <input
              type="date"
              value={filters.date_to}
              onChange={(e) => dispatch(setCanteenDateTo(e.target.value))}
              title="To date"
              style={{
                background: "transparent",
                outline: "none",
                color: filters.date_to ? "var(--text)" : "var(--text-muted)",
                fontSize: "13px",
                border: "none",
                cursor: "pointer",
              }}
            />
          </div>
          {/* Export */}
          <button
            onClick={handleExport}
            disabled={setups.length === 0}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap disabled:opacity-50"
            style={{
              border: "1px solid var(--border)",
              color: "var(--text-muted)",
              background: "var(--bg)",
            }}
          >
            <ArrowDownTrayIcon className="w-4 h-4" /> Export CSV
          </button>
          {/* Clear filters */}
          {hasFilters && (
            <button
              onClick={() => { setSearchInput(""); dispatch(clearCanteenFilters()); }}
              className="text-xs font-medium px-3 py-2 rounded-lg hover:opacity-80"
              style={{
                color: "var(--accent)",
                background: "color-mix(in srgb,var(--accent) 10%,transparent)",
              }}
            >
              <FunnelIcon className="h-3.5 w-3.5 inline mr-1" />
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* TABLE */}
      <div className="ui-card">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                {COLS.map((h, i) => (
                  <th key={i} className="ui-th text-left whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            {loading ? (
              <TableSkeleton cols={COLS.length} rows={filters.per_page ?? 10} />
            ) : setups.length === 0 ? (
              <tbody>
                <tr>
                  <td
                    colSpan={COLS.length}
                    className="py-16 text-center text-sm"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {hasFilters
                      ? "No records match the current filters."
                      : "No canteen inspections yet."}
                  </td>
                </tr>
              </tbody>
            ) : (
              <tbody>
                {setups.map((setup) => {
                  const soName = setup.safety_officer
                    ? setup.safety_officer.firstname +
                    " " +
                    setup.safety_officer.lastname
                    : setup.safetyofficer ?? "—";
                  const supName = setup.supervisor
                    ? setup.supervisor.firstname + " " + setup.supervisor.lastname
                    : "—";
                  const status = setup.status ?? "Pending";
                  const sStyle =
                    STATUS_STYLE[status] ?? {
                      background: "var(--bg-raised)",
                      color: "var(--text-muted)",
                    };
                  const actions = [
                    {
                      label: "View Details",
                      color: "var(--accent)",
                      onClick: () => setDetailDrawer({ open: true, setup }),
                    },
                    {
                      label: "Start Inspection",
                      color: "#3fb950",
                      onClick: () => setStartModal({ open: true, setup }),
                    },
                    ...(canUpdate
                      ? [
                        {
                          label: "Edit",
                          onClick: () => setSetupModal({ open: true, setup }),
                        },
                        {
                          label: "Reassign Safety Officer",
                          onClick: () =>
                            setReassignModal({
                              open: true,
                              mode: "safety_officer",
                              setupId: setup.id,
                            }),
                        },
                        {
                          label: "Reassign Supervisor",
                          onClick: () =>
                            setReassignModal({
                              open: true,
                              mode: "supervisor",
                              setupId: setup.id,
                            }),
                        },
                      ]
                      : []),
                    ...(canDelete
                      ? [
                        { divider: true },
                        {
                          label: "Delete",
                          danger: true,
                          onClick: () => setDeleteTarget(setup),
                        },
                      ]
                      : []),
                  ];
                  return (
                    <tr key={setup.id} className="ui-row">
                      <td
                        className="ui-td font-mono text-xs"
                        style={{ color: "var(--text-muted)" }}
                      >
                        #{setup.id}
                      </td>
                      <td className="ui-td">
                        <button
                          onClick={() => setDetailDrawer({ open: true, setup })}
                          className="font-semibold text-sm hover:underline text-left"
                          style={{ color: "var(--accent)" }}
                        >
                          {setup.name}
                        </button>
                      </td>
                      <td
                        className="ui-td text-sm whitespace-nowrap"
                        style={{ color: "var(--text-muted)" }}
                      >
                        {setup.location}
                      </td>
                      <td
                        className="ui-td text-sm whitespace-nowrap"
                        style={{ color: "var(--text-muted)" }}
                      >
                        {setup.date}
                      </td>
                      <td
                        className="ui-td text-sm whitespace-nowrap"
                        style={{ color: "var(--text-muted)" }}
                      >
                        {setup.time}
                      </td>
                      <td className="ui-td text-sm" style={{ color: "var(--text)" }}>
                        {soName}
                      </td>
                      <td className="ui-td text-sm" style={{ color: "var(--text)" }}>
                        {supName}
                      </td>
                      <td className="ui-td">
                        <span
                          className="px-2.5 py-1 rounded-full text-xs font-semibold"
                          style={sStyle}
                        >
                          {status}
                        </span>
                      </td>
                      <td className="ui-td">
                        <ActionMenu actions={actions} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            )}
          </table>
        </div>
        <Pagination meta={meta} onPage={(p) => dispatch(setCanteenPage(p))} />
        {!meta && setups.length > 0 && (
          <div
            className="px-4 py-3 text-xs"
            style={{ color: "var(--text-muted)", borderTop: "1px solid var(--border)" }}
          >
            {setups.length} record{setups.length !== 1 ? "s" : ""} loaded
          </div>
        )}
      </div>

      {/* MODALS & DRAWERS */}
      <SetupFormModal
        isOpen={setupModal.open}
        onClose={() => {
          setSetupModal({ open: false, setup: null });
          dispatch(clearActionError());
        }}
        setup={setupModal.setup}
        catalogItems={catalogItems}
      />
      <ReassignModal
        isOpen={reassignModal.open}
        onClose={() => setReassignModal({ open: false, mode: null, setupId: null })}
        mode={reassignModal.mode}
        setupId={reassignModal.setupId}
        users={users}
      />
      <DeleteConfirmModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        setup={deleteTarget}
        loading={deleting}
        onConfirm={handleDelete}
      />
      <StartInspectionModal
        isOpen={startModal.open}
        onClose={() => setStartModal({ open: false, setup: null })}
        setup={startModal.setup}
      />
      <DetailDrawer
        isOpen={detailDrawer.open}
        onClose={() => setDetailDrawer({ open: false, setup: null })}
        setup={detailDrawer.setup}
      />
    </div>
  );
}
