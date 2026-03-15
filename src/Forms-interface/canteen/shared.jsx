/* ── Canteen — shared primitive components ─────────────────────────────── */
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

/* ── Field ───────────────────────────────────────────────────────────── */
export function Field({ label, required, error, hint, children }) {
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

/* ── Pagination ──────────────────────────────────────────────────────── */
export function Pagination({ meta, onPage }) {
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

/* ── ModalShell ──────────────────────────────────────────────────────── */
export function ModalShell({ isOpen, onClose, title, width = "max-w-lg", children }) {
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

/* ── ReviewRow ───────────────────────────────────────────────────────── */
export function ReviewRow({ label, value }) {
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

/* ── TableSkeleton ───────────────────────────────────────────────────── */
export function TableSkeleton({ cols = 9, rows = 5 }) {
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

/* ── StepIndicator ───────────────────────────────────────────────────── */

export function StepIndicator({ currentStep, completedSteps }) {
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
                  {isCompleted ? <CheckBadgeIcon className="h-4 w-4" /> : stepNum}
                </div>
                <span
                  className="text-[10px] font-semibold whitespace-nowrap"
                  style={{
                    color: isCompleted ? "#3fb950" : isActive ? "var(--accent)" : "var(--text-muted)",
                  }}
                >
                  {label}
                </span>
              </div>
              {!isLast && (
                <div
                  className="h-0.5 flex-1 mx-1 mb-5 rounded-full transition-all duration-200"
                  style={{ background: isCompleted ? "#3fb950" : "var(--border)" }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
