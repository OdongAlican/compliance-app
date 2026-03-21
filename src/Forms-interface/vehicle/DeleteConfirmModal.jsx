/* ── Vehicle Inspection — DeleteConfirmModal ─────────────────────────── */
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { Spinner, ModalShell } from "./shared";

export default function DeleteConfirmModal({ isOpen, onClose, setup, onConfirm, loading }) {
  if (!setup) return null;
  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      title="Delete Vehicle Inspection"
      width="max-w-md"
    >
      <div className="p-6 flex flex-col gap-5">
        {/* Warning banner */}
        <div
          className="flex items-start gap-3 p-4 rounded-xl"
          style={{
            background: "color-mix(in srgb,var(--danger) 8%,transparent)",
            border: "1px solid color-mix(in srgb,var(--danger) 30%,transparent)",
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
              Deleting this inspection will permanently remove all associated checklists and issues.
            </p>
          </div>
        </div>

        {/* Setup identity */}
        <div
          className="p-4 rounded-xl"
          style={{ background: "var(--bg-raised)", border: "1px solid var(--border)" }}
        >
          <p className="text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>
            Vehicle Inspection to be deleted
          </p>
          <p className="text-sm font-bold" style={{ color: "var(--text)" }}>
            {setup.vehicle_id} ({setup.model})
          </p>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
            ID #{setup.id} · {setup.date}
          </p>
        </div>

        {/* Footer */}
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
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-60"
            style={{ background: "var(--danger)", color: "#fff" }}
          >
            {loading && <Spinner size={4} />}
            Yes, Delete
          </button>
        </div>
      </div>
    </ModalShell>
  );
}
