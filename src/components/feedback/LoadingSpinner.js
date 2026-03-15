import React from 'react';

/**
 * LoadingSpinner — used by Table and async page loads.
 */
export default function LoadingSpinner({ size = 32, message = 'Loading…' }) {
    return (
        <div className="flex flex-col items-center justify-center gap-3 py-6">
            <svg
                width={size}
                height={size}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="animate-spin"
                style={{ color: 'var(--accent)' }}
            >
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
            {message && (
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                    {message}
                </p>
            )}
        </div>
    );
}
