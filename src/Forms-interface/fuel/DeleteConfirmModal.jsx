/* ── Fuel — DeleteConfirmModal ─────────────────────────────────────── */
import { ModalShell } from "./shared";

export default function DeleteConfirmModal({ setup, onConfirm, onClose, loading }) {
  if (!setup) return null;
  return (
    <ModalShell isOpen={Boolean(setup)} onClose={onClose} title="Delete Fuel Tank Inspection">
      <div className="px-6 py-6 flex flex-col gap-5">
        <div
          className="p-4 rounded-xl"
          style={{
            background: "color-mix(in srgb,var(--danger) 8%,transparent)",
            border: "1px solid color-mix(in srgb,var(--danger) 20%,transparent)",
          }}
        >
          <p className="text-sm font-medium" style={{ color: "var(--text)" }}>
            Are you sure you want to delete this fuel tank inspection?
          </p>
          <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
            This action is permanent and cannot be undone. All associated records
            will be removed.
          </p>
        </div>

        <div
          className="p-4 rounded-xl"
          style={{ background: "var(--bg-raised)", border: "1px solid var(--border)" }}
        >
          <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>
            Inspection to be deleted
          </p>
          <p className="text-sm font-bold" style={{ color: "var(--text)" }}>
            Tank #{setup.tank_id_number}
          </p>
          {setup.tank_location && (
            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
              {setup.tank_location}
              {setup.fuel_type ? ` · ${setup.fuel_type}` : ""}
            </p>
          )}
        </div>

        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 rounded-lg text-sm font-medium"
            style={{ background: "var(--bg-raised)", color: "var(--text)", border: "1px solid var(--border)" }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50"
            style={{ background: "var(--danger)" }}
          >
            {loading ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </ModalShell>
  );
}
