import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  EllipsisVerticalIcon,
  PencilSquareIcon,
  TrashIcon,
  ArrowPathIcon,
  PlayIcon,
  EyeIcon,
} from "@heroicons/react/24/outline";

export default function ActionMenu({ setup, onEdit, onDelete, onReassign, onStart, onView }) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (!open) return;
    function handler(e) {
      setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  function handleToggle(e) {
    e.stopPropagation();
    const rect = btnRef.current?.getBoundingClientRect();
    if (rect) {
      setPos({
        top: rect.bottom + window.scrollY + 4,
        left: rect.right + window.scrollX - 176,
      });
    }
    setOpen((v) => !v);
  }

  const items = [
    { label: "View Details", icon: EyeIcon, action: onView, show: !!onView },
    { label: "Start Inspection", icon: PlayIcon, action: onStart, show: !!onStart },
    { label: "Edit Setup", icon: PencilSquareIcon, action: onEdit, show: !!onEdit },
    { label: "Reassign", icon: ArrowPathIcon, action: onReassign, show: !!onReassign },
    { label: "Delete", icon: TrashIcon, action: onDelete, show: !!onDelete, danger: true },
  ].filter((i) => i.show);

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onMouseDown={handleToggle}
        className="p-1.5 rounded-lg hover:opacity-70 flex-shrink-0"
        style={{ color: "var(--text-muted)", lineHeight: 0 }}
        aria-label="Actions"
      >
        <EllipsisVerticalIcon className="h-4 w-4" />
      </button>

      {open &&
        createPortal(
          <div
            onMouseDown={(e) => e.stopPropagation()}
            className="fixed z-[9999] w-44 rounded-xl shadow-xl overflow-hidden"
            style={{
              top: pos.top + "px",
              left: pos.left + "px",
              background: "var(--bg)",
              border: "1px solid var(--border)",
            }}
          >
            {items.map(({ label, icon: Icon, action, danger }) => (
              <button
                key={label}
                type="button"
                className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm hover:opacity-80 transition-opacity"
                style={{
                  color: danger ? "var(--danger)" : "var(--text)",
                  background: "transparent",
                }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  setOpen(false);
                  action?.(setup);
                }}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                {label}
              </button>
            ))}
          </div>,
          document.body
        )}
    </>
  );
}
