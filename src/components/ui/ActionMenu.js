/**
 * ActionMenu — 3-dot dropdown used in every data table's action column.
 * Replaces the duplicated ActionMenu definition copied into every *Interface.js.
 *
 * Props:
 *   items  Array<{ label: string, icon?: ReactNode, onClick: () => void, danger?: boolean }>
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { EllipsisVerticalIcon } from '@heroicons/react/24/outline';

export default function ActionMenu({ items = [] }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    const handleClickOutside = useCallback((e) => {
        if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }, []);

    useEffect(() => {
        if (open) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [open, handleClickOutside]);

    return (
        <div ref={ref} className="relative inline-block">
            <button
                onClick={() => setOpen((o) => !o)}
                className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors"
                style={{ color: 'var(--text-muted)', background: 'var(--bg-raised)', border: '1px solid var(--border)' }}
                aria-label="Actions"
            >
                <EllipsisVerticalIcon className="w-4 h-4" />
            </button>

            {open && (
                <ul
                    className="absolute right-0 z-30 mt-1 min-w-[160px] rounded-xl py-1 shadow-lg ui-menu"
                    style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
                >
                    {items.map((item, i) => (
                        <li key={i}>
                            <button
                                onClick={() => { setOpen(false); item.onClick(); }}
                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-left transition-colors hover:opacity-80 ui-menu-item"
                                style={{ color: item.danger ? 'var(--danger)' : 'var(--text)' }}
                            >
                                {item.icon && <span className="w-4 h-4 shrink-0">{item.icon}</span>}
                                {item.label}
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
