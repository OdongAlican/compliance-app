/* ── Fuel — ActionMenu ─────────────────────────────────────────────── */
import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { EllipsisVerticalIcon } from "@heroicons/react/24/outline";

export default function ActionMenu({ actions }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, right: 0 });
  const btnRef = useRef(null);
  const menuRef = useRef(null);

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
          background: open ? "var(--bg-raised)" : "transparent",
          color: "var(--text-muted)",
          border: "1px solid " + (open ? "var(--border)" : "transparent"),
        }}
      >
        <EllipsisVerticalIcon className="h-5 w-5" />
      </button>

      {open &&
        createPortal(
          <div
            ref={menuRef}
            className="fixed rounded-xl shadow-2xl py-1 overflow-hidden"
            style={{
              top: pos.top,
              right: pos.right,
              minWidth: "180px",
              background: "var(--bg-surface)",
              border: "1px solid var(--border)",
              zIndex: 99999,
            }}
          >
            {actions.map((action, i) => {
              if (action.divider) {
                return (
                  <div
                    key={i}
                    style={{ height: "1px", background: "var(--border)", margin: "4px 0" }}
                  />
                );
              }
              return (
                <button
                  key={i}
                  onClick={() => { action.onClick(); setOpen(false); }}
                  className="w-full text-left px-4 py-2.5 text-sm font-medium transition-colors"
                  style={{ color: action.danger ? "var(--danger)" : action.color ?? "var(--text)" }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-raised)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                >
                  {action.label}
                </button>
              );
            })}
          </div>,
          document.body
        )}
    </div>
  );
}
