/**
 * StaffIdVerificationStep.js
 *
 * Step 1 of the user-creation wizard.
 *
 * Rules:
 *  1. Staff ID must exist in the pre-approved HR list (approvedStaffIds.js).
 *  2. Staff ID entry must be active (active: true). Retired IDs are rejected.
 *  3. Staff ID must not already be in use (checked via API call).
 *  4. All three checks must pass before the wizard can advance to Step 2.
 *
 * The parent passes:
 *   onVerified(staffRecord)  — called when validation passes
 *   existingStaffIds         — Set<string> of staff_ids already registered
 *   loading                  — whether the parent is fetching existing IDs
 */
import React, { useState } from 'react';
import { CheckCircleIcon, XCircleIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import APPROVED_STAFF_IDS, { findApprovedStaffId } from '../../data/approvedStaffIds';

/* ── Status icon helpers ─────────────────────────────────────────────────── */
function StatusIcon({ status }) {
  if (status === 'ok')
    return <CheckCircleIcon className="w-5 h-5" style={{ color: 'var(--success)' }} />;
  if (status === 'error')
    return <XCircleIcon className="w-5 h-5" style={{ color: 'var(--danger)' }} />;
  return null;
}

function CheckRow({ label, status, message }) {
  const color =
    status === 'ok'    ? 'var(--success)' :
    status === 'error' ? 'var(--danger)'  : 'var(--text-muted)';
  return (
    <div className="flex items-start gap-3 py-2.5"
      style={{ borderBottom: '1px solid var(--border)' }}>
      <div className="mt-0.5 shrink-0">
        <StatusIcon status={status} />
        {status === 'idle' && (
          <div className="w-5 h-5 rounded-full border-2" style={{ borderColor: 'var(--border)' }} />
        )}
      </div>
      <div>
        <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>{label}</p>
        {message && <p className="text-xs mt-0.5" style={{ color }}>{message}</p>}
      </div>
    </div>
  );
}

export default function StaffIdVerificationStep({ onVerified, existingStaffIds = new Set(), loading = false }) {
  const [query, setQuery]           = useState('');
  const [checked, setChecked]       = useState(false);
  const [result, setResult]         = useState(null); // the approved record
  const [checks, setChecks]         = useState({
    inList:     { status: 'idle', message: '' },
    isActive:   { status: 'idle', message: '' },
    notInUse:   { status: 'idle', message: '' },
  });

  const allPass = checked && Object.values(checks).every((c) => c.status === 'ok');

  const handleVerify = () => {
    const id = query.trim().toUpperCase();
    setChecked(true);
    setResult(null);

    const record = findApprovedStaffId(id);

    const inList   = Boolean(record);
    const isActive = inList && record.active;
    const notInUse = inList && !existingStaffIds.has(id);

    setChecks({
      inList: {
        status:  inList ? 'ok' : 'error',
        message: inList
          ? `Found: ${record.name} — ${record.position}, ${record.department}`
          : 'This Staff ID is not in the approved HR register.',
      },
      isActive: {
        status:  !inList ? 'idle' : isActive ? 'ok' : 'error',
        message: !inList ? '' : isActive
          ? 'Staff ID is active.'
          : 'This Staff ID has been deactivated (retired or terminated). Contact HR.',
      },
      notInUse: {
        status:  !inList || !isActive ? 'idle' : notInUse ? 'ok' : 'error',
        message: !inList || !isActive ? '' : notInUse
          ? 'Staff ID is available — no existing account found.'
          : 'An account with this Staff ID already exists in the system.',
      },
    });

    if (inList && isActive && notInUse) {
      setResult(record);
    }
  };

  const handleClear = () => {
    setQuery('');
    setChecked(false);
    setResult(null);
    setChecks({ inList: { status: 'idle', message: '' }, isActive: { status: 'idle', message: '' }, notInUse: { status: 'idle', message: '' } });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-semibold mb-1" style={{ color: 'var(--text)' }}>
          Staff ID Verification
        </h3>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Enter the employee's Staff ID to verify it against the HR approved register before creating an account.
        </p>
      </div>

      {/* Search input */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <MagnifyingGlassIcon
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
            style={{ color: 'var(--text-muted)' }}
          />
          <input
            type="text"
            placeholder="e.g. STAFF001"
            value={query}
            onChange={(e) => { setQuery(e.target.value.toUpperCase()); setChecked(false); setResult(null); }}
            onKeyDown={(e) => e.key === 'Enter' && query.trim() && handleVerify()}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none"
            style={{
              background: 'var(--bg)',
              border: '1px solid var(--border)',
              color: 'var(--text)',
            }}
            disabled={loading}
          />
        </div>
        <button
          type="button"
          onClick={handleVerify}
          disabled={!query.trim() || loading}
          className="px-4 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50 transition-opacity"
          style={{ background: 'var(--accent)', color: '#fff' }}
        >
          Verify
        </button>
        {checked && (
          <button
            type="button"
            onClick={handleClear}
            className="px-4 py-2.5 rounded-xl text-sm font-medium transition-opacity"
            style={{ border: '1px solid var(--border)', color: 'var(--text-muted)', background: 'var(--bg-raised)' }}
          >
            Clear
          </button>
        )}
      </div>

      {/* Validation checks */}
      {checked && (
        <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)', background: 'var(--bg-surface)' }}>
          <div className="px-4 py-2.5" style={{ background: 'var(--bg-raised)', borderBottom: '1px solid var(--border)' }}>
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              Verification Results — {query}
            </p>
          </div>
          <div className="px-4">
            <CheckRow label="In HR approved register" {...checks.inList} />
            <CheckRow label="Staff ID is active"      {...checks.isActive} />
            <CheckRow label="Not already in use"      {...checks.notInUse} />
          </div>
        </div>
      )}

      {/* Approved record card */}
      {result && (
        <div className="rounded-xl p-4 space-y-2"
          style={{ background: 'color-mix(in srgb, var(--success) 8%, transparent)', border: '1px solid color-mix(in srgb, var(--success) 25%, transparent)' }}>
          <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--success)' }}>
            ✓ Staff ID Verified
          </p>
          {[
            ['Staff ID',    result.id],
            ['Name (HR)',   result.name],
            ['Department',  result.department],
            ['Position',    result.position],
          ].map(([label, value]) => (
            <div key={label} className="flex gap-2 text-sm">
              <span className="w-28 shrink-0 font-medium" style={{ color: 'var(--text-muted)' }}>{label}</span>
              <span style={{ color: 'var(--text)' }}>{value}</span>
            </div>
          ))}
        </div>
      )}

      {/* Sample IDs accordion (helper) */}
      <details className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
        <summary className="px-4 py-3 text-sm font-medium cursor-pointer select-none"
          style={{ background: 'var(--bg-raised)', color: 'var(--text-muted)', listStyle: 'none' }}>
          View approved Staff ID list ({APPROVED_STAFF_IDS.filter(s => s.active).length} active)
        </summary>
        <div className="overflow-x-auto max-h-56 overflow-y-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr style={{ background: 'var(--bg-raised)', borderBottom: '1px solid var(--border)' }}>
                {['Staff ID', 'Name', 'Department', 'Position', 'Status'].map((h) => (
                  <th key={h} className="ui-th text-left whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {APPROVED_STAFF_IDS.map((s) => (
                <tr key={s.id} className="ui-row"
                  style={{ opacity: s.active ? 1 : 0.45 }}>
                  <td className="ui-td font-mono font-bold"
                    style={{ color: 'var(--accent)', cursor: 'pointer' }}
                    onClick={() => { setQuery(s.id); setChecked(false); setResult(null); }}>
                    {s.id}
                  </td>
                  <td className="ui-td">{s.name}</td>
                  <td className="ui-td">{s.department}</td>
                  <td className="ui-td">{s.position}</td>
                  <td className="ui-td">
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold"
                      style={s.active
                        ? { background: 'color-mix(in srgb,var(--success) 15%,transparent)', color: 'var(--success)' }
                        : { background: 'color-mix(in srgb,var(--danger) 15%,transparent)', color: 'var(--danger)' }}>
                      {s.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>

      {/* Proceed button */}
      <div className="flex justify-end pt-2">
        <button
          type="button"
          onClick={() => onVerified(result)}
          disabled={!allPass}
          className="px-6 py-2.5 rounded-full text-sm font-semibold transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ background: 'var(--accent)', color: '#fff' }}
        >
          Continue to User Details →
        </button>
      </div>
    </div>
  );
}
