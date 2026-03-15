/**
 * Modal — generic backdrop + card shell used by every detail/execute modal.
 * Eliminates the copy-pasted backdrop/card pattern across all Execute files.
 *
 * Props:
 *   isOpen      boolean
 *   onClose     () => void
 *   maxWidth    string   (default 'max-w-4xl')
 *   children    ReactNode
 */
import React, { useEffect } from 'react';

export default function Modal({ isOpen, onClose, maxWidth = 'max-w-4xl', children }) {
    // Close on Escape key
    useEffect(() => {
        if (!isOpen) return;
        const handler = (e) => e.key === 'Escape' && onClose?.();
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [isOpen, onClose]);

    // Lock body scroll while open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }}
            onClick={(e) => e.target === e.currentTarget && onClose?.()}
        >
            <div
                className={`rounded-2xl w-full ${maxWidth} max-h-[90vh] overflow-y-auto`}
                style={{
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border)',
                    boxShadow: 'var(--shadow-lg, 0 25px 50px rgba(0,0,0,0.5))',
                }}
            >
                {children}
            </div>
        </div>
    );
}
