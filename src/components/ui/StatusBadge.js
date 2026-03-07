/**
 * StatusBadge — colour-mix pill for inspection/record statuses.
 * Centralises the status → colour logic that was duplicated in every interface.
 *
 * Props:
 *   status  string   — 'Pending' | 'In Progress' | 'Completed' | 'Approved' | 'Rejected'
 *   size    'sm'|'md'  (default 'sm')
 */
import React from 'react';

const STATUS_HEX = {
    'Pending': '#d29922',
    'In Progress': '#58a6ff',
    'Completed': '#3fb950',
    'Approved': '#3fb950',
    'Rejected': '#f85149',
};

export default function StatusBadge({ status, size = 'sm' }) {
    const hex = STATUS_HEX[status] || '#8b949e';
    const sizeClass = size === 'md' ? 'px-3 py-1 text-sm' : 'px-2 py-0.5 text-xs';

    return (
        <span
            className={`inline-flex items-center rounded-full font-semibold whitespace-nowrap ${sizeClass}`}
            style={{
                background: `color-mix(in srgb, ${hex} 15%, transparent)`,
                color: hex,
            }}
        >
            {status}
        </span>
    );
}
