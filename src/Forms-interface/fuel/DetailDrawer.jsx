/* ── Fuel — DetailDrawer ─────────────────────────────────────────────── */
import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  BeakerIcon,
  CalendarDaysIcon,
  XMarkIcon,
  ArrowPathIcon,
  CheckBadgeIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import { FuelPerformService } from "../../services/fuel.service";
import { Spinner, ReviewRow } from "./shared";
import { STATUS_STYLE } from "./constants";
import ExecutionDetailModal from "./ExecutionDetailModal";

export default function DetailDrawer({ isOpen, onClose, setup }) {
  const [performs, setPerforms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [signing, setSigning] = useState(null);
  const [detailPerform, setDetailPerform] = useState(null);

  const load = useCallback(async () => {
    if (!setup) return;
    setLoading(true);
    setError("");
    try {
      const res = await FuelPerformService.list(setup.id, { per_page: 20 });
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
      await FuelPerformService.signOff(pid);
      toast.success("Signed off.");
      load();
    } catch (e) {
      toast.error(e?.response?.data?.error || "Sign-off failed.");
    } finally {
      setSigning(null);
    }
  }

  if (!isOpen || !setup) return null;

  const status = setup.status ?? "Pending";
  const sStyle = STATUS_STYLE[status] ?? { background: "var(--bg-raised)", color: "var(--text-muted)" };

  const so = setup.safety_officer;
  const soName = so ? so.firstname + " " + so.lastname : null;
  const soInitials = so ? (so.firstname?.[0] ?? "") + (so.lastname?.[0] ?? "") : soName ? soName[0] : "?";

  const sup = setup.supervisor;
  const supName = sup ? sup.firstname + " " + sup.lastname : null;
  const supInitials = sup ? (sup.firstname?.[0] ?? "") + (sup.lastname?.[0] ?? "") : supName ? supName[0] : "?";

  const drawer = createPortal(
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
          className="flex items-start justify-between px-6 py-5 flex-shrink-0"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <div className="flex items-start gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "color-mix(in srgb,var(--accent) 15%,transparent)" }}
            >
              <BeakerIcon className="w-5 h-5" style={{ color: "var(--accent)" }} />
            </div>
            <div>
              <h2 className="font-bold text-base leading-tight" style={{ color: "var(--text)" }}>
                Tank #{setup.tank_id_number}
              </h2>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                Fuel Tank Inspection · #{setup.id}
              </p>
              <span
                className="inline-block mt-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-full"
                style={sStyle}
              >
                {status}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:opacity-70 flex-shrink-0"
            style={{ color: "var(--text-muted)" }}
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Inspection details */}
        <div className="px-6 py-5" style={{ borderBottom: "1px solid var(--border)" }}>
          <p className="text-[11px] font-bold uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)" }}>
            Inspection Details
          </p>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <ReviewRow label="Location" value={setup.tank_location} />
            <ReviewRow label="Fuel Type" value={setup.fuel_type} />
            <ReviewRow label="Date" value={setup.date} />
            <ReviewRow label="Time" value={setup.time} />
            {setup.note && (
              <div className="col-span-2">
                <ReviewRow label="Note" value={setup.note} />
              </div>
            )}
          </div>

          <p className="text-[11px] font-bold uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)" }}>
            Assigned Personnel
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div
              className="p-3 rounded-xl flex items-center gap-3"
              style={{ background: "var(--bg-raised)", border: "1px solid var(--border)" }}
            >
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                style={{ background: "color-mix(in srgb,var(--accent) 20%,transparent)", color: "var(--accent)" }}
              >
                {soInitials}
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                  Safety Officer
                </p>
                <p className="text-xs font-semibold truncate" style={{ color: "var(--text)" }}>
                  {soName ?? "—"}
                </p>
              </div>
            </div>
            <div
              className="p-3 rounded-xl flex items-center gap-3"
              style={{ background: "var(--bg-raised)", border: "1px solid var(--border)" }}
            >
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                style={{ background: "color-mix(in srgb,#3fb950 15%,transparent)", color: "#3fb950" }}
              >
                {supInitials}
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                  Supervisor
                </p>
                <p className="text-xs font-semibold truncate" style={{ color: "var(--text)" }}>
                  {supName ?? "—"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Execution log */}
        <div className="flex-1 px-6 py-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-sm" style={{ color: "var(--text)" }}>
                Execution Log
              </h3>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                {performs.length} execution{performs.length !== 1 ? "s" : ""} recorded
              </p>
            </div>
            <button
              onClick={load}
              title="Refresh"
              className="p-1.5 rounded-lg hover:opacity-70"
              style={{ color: "var(--text-muted)", border: "1px solid var(--border)" }}
            >
              <ArrowPathIcon className="h-4 w-4" />
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-10"><Spinner /></div>
          ) : error ? (
            <div
              className="p-4 rounded-xl text-sm text-center"
              style={{
                background: "color-mix(in srgb,var(--danger) 8%,transparent)",
                border: "1px solid color-mix(in srgb,var(--danger) 20%,transparent)",
                color: "var(--danger)",
              }}
            >
              {error}
            </div>
          ) : performs.length === 0 ? (
            <div
              className="p-6 rounded-xl text-center"
              style={{ background: "var(--bg-raised)", border: "1px solid var(--border)" }}
            >
              <CalendarDaysIcon className="h-8 w-8 mx-auto mb-2" style={{ color: "var(--text-muted)", opacity: 0.5 }} />
              <p className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>No executions yet</p>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                Use "Start Inspection" to record a new execution.
              </p>
            </div>
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
                      border: signed
                        ? "1px solid color-mix(in srgb,#3fb950 30%,transparent)"
                        : "1px solid var(--border)",
                    }}
                  >
                    <div
                      className="flex items-start justify-between gap-3 cursor-pointer"
                      onClick={() => setDetailPerform(p)}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                            style={
                              signed
                                ? { background: "color-mix(in srgb,#3fb950 15%,transparent)", color: "#3fb950" }
                                : { background: "color-mix(in srgb,#d29922 15%,transparent)", color: "#d29922" }
                            }
                          >
                            {signed ? "✓ Signed Off" : "Pending Sign-Off"}
                          </span>
                          <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>#{p.id}</span>
                        </div>
                        <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>
                          {p.date}{" "}
                          <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>at</span>{" "}
                          {p.time}
                        </p>
                        {p.note && (
                          <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>{p.note}</p>
                        )}
                        {signed && p.signed_off_at && (
                          <p className="text-[10px] mt-1" style={{ color: "#3fb950" }}>
                            Signed off on {new Date(p.signed_off_at).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      {!signed && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleSignOff(p.id); }}
                          disabled={signing === p.id}
                          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg flex-shrink-0"
                          style={{
                            background: "color-mix(in srgb,#3fb950 15%,transparent)",
                            color: "#3fb950",
                            border: "1px solid color-mix(in srgb,#3fb950 30%,transparent)",
                          }}
                        >
                          {signing === p.id ? <Spinner size={3} /> : <CheckBadgeIcon className="h-3.5 w-3.5" />}
                          Sign Off
                        </button>
                      )}
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

  return (
    <>
      {drawer}
      <ExecutionDetailModal
        isOpen={Boolean(detailPerform)}
        onClose={() => setDetailPerform(null)}
        perform={detailPerform}
        setup={setup}
      />
    </>
  );
}
