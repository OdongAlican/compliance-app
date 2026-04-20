import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldExclamationIcon } from '@heroicons/react/24/outline';
import { ROUTES } from '../utils/constants';

/**
 * AccessDenied
 *
 * Shown when:
 *  - A user navigates to a route they lack permission for (via PermissionRoute)
 *  - A page-level PermissionGate with `page` prop is rendered
 *
 * Props:
 *  permissionKey  {string}  – optional, shows which permission was missing
 *  inline         {boolean} – renders a compact card instead of full-page layout
 */
export default function AccessDenied({ permissionKey, inline = false }) {
  const navigate = useNavigate();

  const content = (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        padding: inline ? '2.5rem 1.5rem' : '4rem 1.5rem',
        maxWidth: 480,
        margin: '0 auto',
      }}
    >
      {/* Icon */}
      <div
        style={{
          background: 'rgba(220,38,38,0.1)',
          borderRadius: '50%',
          padding: '1.25rem',
          marginBottom: '1.5rem',
          display: 'inline-flex',
        }}
      >
        <ShieldExclamationIcon
          style={{ width: 40, height: 40, color: 'var(--danger)' }}
        />
      </div>

      {/* Heading */}
      <h2
        style={{
          color: 'var(--text)',
          fontSize: '1.5rem',
          fontWeight: 700,
          marginBottom: '0.5rem',
          lineHeight: 1.3,
        }}
      >
        Access Denied
      </h2>

      {/* Description */}
      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.6 }}>
        You do not have permission to view this content.
        {permissionKey && (
          <>
            {' '}Required permission:{' '}
            <code
              style={{
                background: 'var(--bg-raised)',
                border: '1px solid var(--border)',
                borderRadius: 4,
                padding: '0 6px',
                fontSize: '0.8rem',
                color: 'var(--text)',
                fontFamily: 'monospace',
              }}
            >
              {permissionKey}
            </code>
          </>
        )}
      </p>

      {/* Subtext */}
      <p
        style={{
          color: 'var(--text-muted)',
          fontSize: '0.82rem',
          marginTop: '0.75rem',
          lineHeight: 1.5,
        }}
      >
        If you believe this is a mistake, please contact your system administrator
        to have the correct permissions assigned to your role.
      </p>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '0.75rem', marginTop: '2rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            padding: '0.6rem 1.4rem',
            borderRadius: 9999,
            border: '1px solid var(--border)',
            background: 'var(--bg-raised)',
            color: 'var(--text)',
            fontSize: '0.875rem',
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          Go Back
        </button>
        <button
          onClick={() => navigate(ROUTES.DASHBOARD)}
          style={{
            padding: '0.6rem 1.4rem',
            borderRadius: 9999,
            border: 'none',
            background: 'var(--accent)',
            color: '#fff',
            fontSize: '0.875rem',
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          Go to Dashboard
        </button>
      </div>
    </div>
  );

  if (inline) {
    return (
      <div
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          boxShadow: 'var(--shadow)',
        }}
      >
        {content}
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {content}
    </div>
  );
}
