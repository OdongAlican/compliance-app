import React from 'react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { XMarkIcon } from '@heroicons/react/20/solid';

/**
 * DeleteModal — shared confirmation dialog.
 * Moved from components/Execute/Delete.js to components/feedback/.
 *
 * The original Delete.js now re-exports from here (backward-compatible).
 */
const DeleteModal = ({ isOpen, onCancel, onConfirm, message }) => {
    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,.6)', backdropFilter: 'blur(6px)' }}
            onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
        >
            <div
                className="w-full max-w-sm rounded-2xl overflow-hidden flex flex-col"
                style={{
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border)',
                    boxShadow: 'var(--shadow-lg)',
                    animation: 'slideUp .2s ease',
                }}
            >
                {/* Header */}
                <div className="px-6 pt-6 pb-5" style={{ borderBottom: '1px solid var(--border)' }}>
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <div
                                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                                style={{ background: 'color-mix(in srgb, var(--danger) 12%, transparent)' }}
                            >
                                <ExclamationTriangleIcon className="w-5 h-5" style={{ color: 'var(--danger)' }} />
                            </div>
                            <h2 className="text-base font-black" style={{ color: 'var(--text)' }}>
                                Confirm Delete
                            </h2>
                        </div>
                        <button
                            onClick={onCancel}
                            className="p-1.5 rounded-lg flex-shrink-0 transition-all hover:opacity-70"
                            style={{ background: 'var(--bg-raised)', color: 'var(--text-muted)' }}
                        >
                            <XMarkIcon className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="px-6 py-5">
                    <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                        {message || 'This action cannot be undone. Are you sure you want to permanently delete this?'}
                    </p>
                </div>

                {/* Footer */}
                <div
                    className="px-6 py-4 flex justify-end gap-2.5"
                    style={{ borderTop: '1px solid var(--border)' }}
                >
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:opacity-80"
                        style={{ border: '1px solid var(--border)', color: 'var(--text-muted)', background: 'var(--bg-raised)' }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className="px-5 py-2 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90"
                        style={{ background: 'var(--danger)', boxShadow: '0 2px 8px color-mix(in srgb, var(--danger) 35%, transparent)' }}
                    >
                        Delete
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DeleteModal;
