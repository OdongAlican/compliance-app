import React from 'react';
import { TrashIcon } from '@heroicons/react/24/outline';

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
            style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
        >
            <div
                className="rounded-2xl p-8 max-w-sm w-full text-center"
                style={{
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border)',
                    boxShadow: 'var(--shadow-lg)',
                }}
            >
                <div
                    className="w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-5"
                    style={{ background: 'color-mix(in srgb, var(--danger) 15%, transparent)' }}
                >
                    <TrashIcon className="w-8 h-8" style={{ color: 'var(--danger)' }} />
                </div>

                <h2 className="text-lg font-semibold mb-2" style={{ color: 'var(--text)' }}>
                    Delete this record?
                </h2>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                    {message || 'This action cannot be undone. Are you sure you want to permanently delete this?'}
                </p>

                <div className="mt-7 flex justify-center gap-3">
                    <button
                        onClick={onCancel}
                        className="px-5 py-2 rounded-full text-sm font-medium transition-colors"
                        style={{ border: '1px solid var(--border)', color: 'var(--text-muted)', background: 'var(--bg-raised)' }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className="px-5 py-2 rounded-full text-sm font-medium text-white transition-opacity hover:opacity-90"
                        style={{ background: 'var(--danger)' }}
                    >
                        Delete
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DeleteModal;
