import React from 'react';
import { ClipboardDocumentCheckIcon } from '@heroicons/react/24/outline';

/**
 * EmptyState — shown when a table or list has no data.
 */
export default function EmptyState({ message = 'No records found.', icon: Icon = ClipboardDocumentCheckIcon }) {
    return (
        <div className="flex flex-col items-center justify-center gap-3 py-10">
            <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center"
                style={{ background: 'color-mix(in srgb, var(--accent) 10%, transparent)' }}
            >
                <Icon className="w-7 h-7" style={{ color: 'var(--accent)' }} />
            </div>
            <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
                {message}
            </p>
        </div>
    );
}
