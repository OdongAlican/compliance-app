/* ── Fuel — ReassignModal ──────────────────────────────────────────── */
import { useState } from "react";
import { useAppDispatch } from "../../store/hooks";
import {
  reassignFuelSupervisor,
  reassignFuelSafetyOfficer,
  fetchFuelSetups,
} from "../../store/slices/fuelSlice";
import toast from "react-hot-toast";
import { ModalShell, Spinner } from "./shared";
import UserAutocomplete from "./UserAutocomplete";

export default function ReassignModal({ isOpen, mode, setupId, onClose }) {
  const dispatch = useAppDispatch();
  const [user, setUser] = useState(null);
  const [saving, setSaving] = useState(false);

  const isSO = mode === "safety_officer";
  const title = isSO ? "Reassign Safety Officer" : "Reassign Supervisor";
  const roleFilter = isSO ? "safety_officer" : "supervisor";

  async function handleSave() {
    if (!user || !setupId) return;
    setSaving(true);
    try {
      const action = isSO
        ? reassignFuelSafetyOfficer({ id: setupId, safetyOfficerId: user.id })
        : reassignFuelSupervisor({ id: setupId, supervisorId: user.id });
      const result = await dispatch(action);
      if (action.fulfilled?.match?.(result) || result?.payload) {
        toast.success(`${isSO ? "Safety officer" : "Supervisor"} reassigned.`);
        dispatch(fetchFuelSetups());
        setUser(null);
        onClose();
      } else {
        toast.error(result.payload || "Reassignment failed.");
      }
    } catch {
      toast.error("Reassignment failed.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <ModalShell isOpen={isOpen} onClose={() => { setUser(null); onClose(); }} title={title}>
      <div className="px-6 py-6 flex flex-col gap-5">
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          Search and select a {isSO ? "safety officer" : "supervisor"} to assign
          to this inspection.
        </p>
        <UserAutocomplete
          roleFilter={roleFilter}
          value={user}
          onChange={setUser}
          placeholder={`Search ${isSO ? "safety officers" : "supervisors"}…`}
        />
        <div className="flex gap-3 justify-end">
          <button
            onClick={() => { setUser(null); onClose(); }}
            disabled={saving}
            className="px-4 py-2 rounded-lg text-sm font-medium"
            style={{ background: "var(--bg-raised)", color: "var(--text)", border: "1px solid var(--border)" }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!user || saving}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50 flex items-center gap-2"
            style={{ background: "var(--accent)" }}
          >
            {saving ? <Spinner size={3} /> : null}
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </ModalShell>
  );
}
