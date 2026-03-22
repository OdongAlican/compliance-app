/* ── Hand & Power Tools Inspection — ReassignModal ───────────────────── */
import { useState, useEffect } from "react";
import { UserIcon } from "@heroicons/react/24/outline";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import {
  reassignToolSupervisor,
  reassignToolSafetyOfficer,
  selectToolActionLoading,
} from "../../store/slices/toolSlice";
import toast from "react-hot-toast";
import { Field, Spinner, ModalShell } from "./shared";
import UserAutocomplete from "./UserAutocomplete";

export default function ReassignModal({ isOpen, mode, setupId, onClose }) {
  const dispatch = useAppDispatch();
  const actionLoading = useAppSelector(selectToolActionLoading);
  const [selectedUser, setSelectedUser] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (isOpen) {
      setSelectedUser(null);
      setErr("");
    }
  }, [isOpen]);

  const isSupervisor = mode === "supervisor";
  const roleFilter = isSupervisor ? "supervisor" : "safety_officer";
  const label = isSupervisor ? "Supervisor" : "Safety Officer";

  const roleName = (u) =>
    u?.role?.name
      ? u.role.name.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
      : label;

  async function handleSave() {
    if (!selectedUser) { setErr("Please select a user."); return; }
    const action = isSupervisor
      ? dispatch(reassignToolSupervisor({ id: setupId, supervisorId: Number(selectedUser.id) }))
      : dispatch(reassignToolSafetyOfficer({ id: setupId, safetyOfficerId: Number(selectedUser.id) }));
    const result = await action;
    if (
      reassignToolSupervisor.fulfilled.match(result) ||
      reassignToolSafetyOfficer.fulfilled.match(result)
    ) {
      toast.success(label + " reassigned.");
      onClose();
    } else {
      toast.error(result.payload || "Reassignment failed.");
    }
  }

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      title={isSupervisor ? "Reassign Supervisor" : "Reassign Safety Officer"}
      width="max-w-md"
    >
      <div className="p-6 flex flex-col gap-5">
        {/* Info banner */}
        <div
          className="flex items-start gap-3 p-4 rounded-xl"
          style={{
            background: "color-mix(in srgb,var(--accent) 8%,transparent)",
            border: "1px solid color-mix(in srgb,var(--accent) 25%,transparent)",
          }}
        >
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: "var(--accent)", color: "#fff" }}
          >
            <UserIcon className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>
              {isSupervisor ? "Reassign Supervisor" : "Reassign Safety Officer"}
            </p>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
              Search by name to find and select a new {isSupervisor ? "supervisor" : "safety officer"} for this inspection.
            </p>
          </div>
        </div>

        {/* Autocomplete */}
        <Field label={"New " + label} required error={err}>
          <UserAutocomplete
            roleFilter={roleFilter}
            value={selectedUser}
            onChange={(u) => { setSelectedUser(u); setErr(""); }}
            placeholder={"Search " + (isSupervisor ? "supervisors" : "safety officers") + "…"}
            error={err}
          />
        </Field>

        {/* Selection confirmation card */}
        {selectedUser && (
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
              {selectedUser.firstname?.[0]}{selectedUser.lastname?.[0]}
            </div>
            <div>
              <p className="text-sm font-bold" style={{ color: "var(--text)" }}>
                {selectedUser.firstname} {selectedUser.lastname}
              </p>
              <p className="text-xs" style={{ color: "#3fb950" }}>
                ✓ Selected · {roleName(selectedUser)}
              </p>
            </div>
          </div>
        )}

        {/* Footer */}
        <div
          className="flex justify-end gap-3 pt-2"
          style={{ borderTop: "1px solid var(--border)" }}
        >
          <button
            type="button"
            onClick={onClose}
            disabled={actionLoading}
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
            onClick={handleSave}
            disabled={actionLoading || !selectedUser}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold"
            style={{ background: "var(--accent)", color: "#fff" }}
          >
            {actionLoading && <Spinner size={4} />}
            Confirm Reassignment
          </button>
        </div>
      </div>
    </ModalShell>
  );
}
