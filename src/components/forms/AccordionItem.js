/**
 * AccordionItem — reusable collapsible section.
 * Extracted from CanteenForm.js (same pattern in every multi-section modal).
 *
 * Props:
 *   value     string   — unique identifier for this item
 *   trigger   string | ReactNode — header label
 *   open      boolean
 *   onToggle  () => void
 *   children  ReactNode
 */
import React from 'react';
import { ChevronDown } from 'lucide-react';

export default function AccordionItem({ trigger, open = false, onToggle, children }) {
    return (
        <li className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
            <header
                role="button"
                onClick={onToggle}
                className="flex justify-between items-center px-4 py-3 font-medium cursor-pointer select-none"
                style={{ background: 'var(--bg-raised)', color: 'var(--text)' }}
            >
                <span className="text-sm font-semibold">{trigger}</span>
                <ChevronDown
                    size={16}
                    className={`transition-transform ${open ? 'rotate-180' : ''}`}
                    style={{ color: 'var(--text-muted)' }}
                />
            </header>
            <div
                className="overflow-hidden transition-all duration-300"
                style={{ height: open ? 'auto' : 0 }}
            >
                {open && (
                    <div className="p-4" style={{ background: 'var(--bg-surface)' }}>
                        {children}
                    </div>
                )}
            </div>
        </li>
    );
}
