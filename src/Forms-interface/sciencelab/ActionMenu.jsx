/* ── Science Lab Inspection — ActionMenu ─────────────────────────────── */
import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { EllipsisVerticalIcon } from "@heroicons/react/24/outline";

export default function ActionMenu({ actions }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, right: 0 });
  const btnRef = useRef(null);
  const menuRef = useRef(null);

  /* Close on outside click */
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
      {open &&
        createPortal(
          <div
            ref={menuRef}
            className="ui-menu w-56"
            style={{ position: "fixed", top: pos.top, right: pos.right, zIndex: 10001 }}
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
