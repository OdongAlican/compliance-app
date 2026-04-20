/* ── Canteen — DeleteConfirmModal ────────────────────────────────────── */
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { Spinner, ModalShell } from "./shared";
import moment from "moment";

export default function DeleteConfirmModal({ isOpen, onClose, setup, loading, onConfirm }) {
  return (
    <ModalShell isOpen={isOpen} onClose={onClose} title="Delete Inspection" width="max-w-sm">
      <div className="p-6 flex flex-col gap-4">
        {/* Warning banner */}
        <div
          className="flex items-start gap-3 p-4 rounded-xl"
          style={{
            background: "color-mix(in srgb,var(--danger) 8%,transparent)",
            border: "1px solid color-mix(in srgb,var(--danger) 25%,transparent)",
          }}
        >
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: "var(--danger)", color: "#fff" }}
          >
            <ExclamationTriangleIcon className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>
              This action cannot be undone
            </p>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
              The inspection record and all associated data will be permanently removed.
            </p>
          </div>
        </div>

        {/* Inspection details card */}
        {setup && (
          <div
            className="p-4 rounded-xl"
            style={{ background: "var(--bg-raised)", border: "1px solid var(--border)" }}
          >
            <p
              className="text-[11px] font-semibold uppercase tracking-wider mb-1.5"
              style={{ color: "var(--text-muted)" }}
            >
              Inspection to delete
            </p>
            <p className="text-sm font-bold" style={{ color: "var(--danger)" }}>
              {setup.name}
            </p>
            {setup.location && (
              <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                {setup.location}
              </p>
            )}
            {setup.date && (
              <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                {moment(setup.date).format("MMMM D, YYYY")}{setup.time ? " · " + moment(setup.time, "HH:mm").format("h:mm A") : ""}
              </p>
            )}
          </div>
        )}

        {/* Footer */}
        <div
          className="flex justify-end gap-3 pt-1"
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
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold"
            style={{ background: "var(--danger)", color: "#fff" }}
          >
            {loading && <Spinner size={4} />}
            Delete Inspection
          </button>
        </div>
      </div>
    </ModalShell>
  );
}
