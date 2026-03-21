/* ── Vehicle Inspection — shared primitive components ────────────────── */
import { createPortal } from "react-dom";
import { XMarkIcon, CheckBadgeIcon } from "@heroicons/react/24/outline";
import { STEP_LABELS } from "./constants";

/* ── Spinner ─────────────────────────────────────────────────────────── */
export function Spinner({ size = 5 }) {
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

/* ── Field wrapper ───────────────────────────────────────────────────── */
export function Field({ label, required, error, children, colSpan }) {
  return (
    <div className={colSpan === 2 ? "col-span-2" : ""}>
      {label && (
        <label
          className="block text-xs font-medium mb-1.5"
          style={{ color: "var(--text-muted)" }}
        >
          {label}
          {required && (
            <span className="ml-0.5" style={{ color: "var(--danger)" }}>*</span>
          )}
        </label>
      )}
      {children}
      {error && (
        <p className="text-xs mt-1" style={{ color: "var(--danger)" }}>
          {error}
        </p>
      )}
    </div>
  );
}

/* ── ModalShell ──────────────────────────────────────────────────────── */
export function ModalShell({ isOpen, onClose, title, width = "max-w-xl", children }) {
  if (!isOpen) return null;
  return createPortal(
    <div
      className="fixed inset-0 z-[800] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.55)" }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className={`relative w-full ${width} rounded-2xl shadow-2xl overflow-hidden`}
        style={{ background: "var(--bg)", border: "1px solid var(--border)" }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <h2 className="text-base font-bold" style={{ color: "var(--text)" }}>
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:opacity-70"
            style={{ color: "var(--text-muted)" }}
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body
  );
}

/* ── StepIndicator ───────────────────────────────────────────────────── */
export function StepIndicator({ currentStep, completedSteps = [] }) {
  return (
    <div
      className="flex items-center px-6 py-3 gap-2"
      style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-raised)" }}
    >
      {STEP_LABELS.map((label, idx) => {
        const stepNum = idx + 1;
        const isActive = currentStep === stepNum;
        const isDone = completedSteps.includes(stepNum);
        return (
          <div key={stepNum} className="flex items-center gap-2 flex-1">
            <div className="flex items-center gap-2 min-w-0">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0"
                style={{
                  background: isDone
                    ? "#3fb950"
                    : isActive
                    ? "var(--accent)"
                    : "var(--bg)",
                  color: isDone || isActive ? "#fff" : "var(--text-muted)",
                  border: isDone || isActive ? "none" : "1px solid var(--border)",
                }}
              >
                {isDone ? <CheckBadgeIcon className="h-3.5 w-3.5" /> : stepNum}
              </div>
              <span
                className="text-xs font-medium hidden sm:block truncate"
                style={{
                  color: isDone
                    ? "#3fb950"
                    : isActive
                    ? "var(--accent)"
                    : "var(--text-muted)",
                }}
              >
                {label}
              </span>
            </div>
            {idx < STEP_LABELS.length - 1 && (
              <div
                className="flex-1 h-px"
                style={{ background: isDone ? "#3fb950" : "var(--border)" }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ── ReviewRow ───────────────────────────────────────────────────────── */
export function ReviewRow({ label, value }) {
  return (
    <div className="flex items-start justify-between py-2 gap-4">
      <span className="text-xs font-medium flex-shrink-0" style={{ color: "var(--text-muted)" }}>
        {label}
      </span>
      <span
        className="text-xs text-right"
        style={{ color: "var(--text)", wordBreak: "break-word" }}
      >
        {value || <span style={{ color: "var(--text-muted)" }}>—</span>}
      </span>
    </div>
  );
}

/* ── Pagination ──────────────────────────────────────────────────────── */
export function Pagination({ meta, onPage }) {
  if (!meta || meta.total_pages <= 1) return null;
  const { page, total_pages } = meta;
  return (
    <div
      className="flex items-center justify-between px-4 py-3"
      style={{ borderTop: "1px solid var(--border)" }}
    >
      <p className="text-xs" style={{ color: "var(--text-muted)" }}>
        Page {page} of {total_pages} · {meta.total} total
      </p>
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onPage(page - 1)}
          disabled={page <= 1}
          className="px-3 py-1.5 text-xs rounded-lg disabled:opacity-40"
          style={{
            background: "var(--bg-raised)",
            color: "var(--text-muted)",
            border: "1px solid var(--border)",
          }}
        >
          ← Prev
        </button>
        <button
          onClick={() => onPage(page + 1)}
          disabled={page >= total_pages}
          className="px-3 py-1.5 text-xs rounded-lg disabled:opacity-40"
          style={{
            background: "var(--bg-raised)",
            color: "var(--text-muted)",
            border: "1px solid var(--border)",
          }}
        >
          Next →
        </button>
      </div>
    </div>
  );
}

/* ── TableSkeleton ───────────────────────────────────────────────────── */
export function TableSkeleton({ cols = 10, rows = 8 }) {
  return (
    <tbody>
      {Array.from({ length: rows }).map((_, r) => (
        <tr key={r} style={{ borderBottom: "1px solid var(--border)" }}>
          {Array.from({ length: cols }).map((_, c) => (
            <td key={c} className="px-4 py-3">
              <div
                className="h-3 rounded animate-pulse"
                style={{
                  background: "var(--border)",
                  width: c === cols - 1 ? "28px" : c === 0 ? "32px" : "80%",
                }}
              />
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  );
}
