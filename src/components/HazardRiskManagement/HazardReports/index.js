/**
 * HazardReports/index.js
 *
 * Full CRUD page for Hazard Reports.
 *
 * Features:
 *  - Paginated table: Location, Hazard Type, Date, Officers, Supervisors, Injured count
 *  - Multi-step create/edit modal (Basic Info → Assign People → Review)
 *  - Right-side detail drawer with injured-people management
 *  - Delete confirmation modal
 *  - Debounced search filters
 *  - Permission-gated write actions (hazard_reports.update)
 */
import { useEffect, useState, useRef } from 'react';
import toast from 'react-hot-toast';
import {
  PlusIcon,
  ArrowPathIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PencilSquareIcon,
  TrashIcon,
  FunnelIcon,
  CheckBadgeIcon,
} from '@heroicons/react/24/outline';
import { EllipsisVerticalIcon } from '@heroicons/react/20/solid';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import {
  fetchHazardReports,
  createHazardReport,
  updateHazardReport,
  deleteHazardReport,
  setHazardReportFilters,
  clearHazardReportErrors,
  selectHazardReports,
  selectHazardReportsMeta,
  selectHazardReportsLoading,
  selectHazardReportsError,
  selectHazardReportsFilters,
  selectHazardReportsActionLoading,
  selectHazardReportsActionError,
} from '../../../store/slices/hazardReportSlice';
import { InjuredPersonService } from '../../../services/hazardAndRisk.service';
import useAuth from '../../../hooks/useAuth';
import UserMultiSelect from '../shared/UserMultiSelect';

// ── Helpers ────────────────────────────────────────────────────────────────

function formatDate(d) {
  if (!d) return '—';
  try { return new Date(d).toLocaleDateString(); } catch { return d; }
}

function displayName(u) {
  return `${u.firstname ?? ''} ${u.lastname ?? ''}`.trim() || u.email || `#${u.id}`;
}

function NameList({ arr }) {
  if (!arr?.length) return <span style={{ color: 'var(--text-muted)' }}>—</span>;
  return <span>{arr.map(displayName).join(', ')}</span>;
}

// ── ActionMenu ─────────────────────────────────────────────────────────────

function ActionMenu({ onView, onEdit, onDelete, canEdit, canDelete }) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, right: 0 });
  const btnRef = useRef(null);

  function handleOpen() {
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setCoords({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
    }
    setOpen((o) => !o);
  }

  return (
    <div className="relative inline-block text-left">
      <button
        ref={btnRef}
        type="button"
        onClick={handleOpen}
        className="p-1 rounded hover:opacity-75"
        style={{ color: 'var(--text-muted)' }}
        aria-haspopup="menu"
      >
        <EllipsisVerticalIcon className="h-5 w-5" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            className="ui-menu fixed z-50"
            style={{ top: coords.top, right: coords.right }}
            role="menu"
          >
            <button
              type="button" role="menuitem" className="ui-menu-item"
              onClick={() => { onView(); setOpen(false); }}
            >
              View Details
            </button>
            {canEdit && (
              <button
                type="button" role="menuitem" className="ui-menu-item"
                onClick={() => { onEdit(); setOpen(false); }}
              >
                Edit
              </button>
            )}
            {canDelete && (
              <>
                <div style={{ borderTop: '1px solid var(--border)', margin: '4px 0' }} />
                <button
                  type="button" role="menuitem" className="ui-menu-item"
                  style={{ color: 'var(--danger)' }}
                  onClick={() => { onDelete(); setOpen(false); }}
                >
                  Delete
                </button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ── Shared table primitives ────────────────────────────────────────────────

const TABLE_COLS = [
  '#', 'Location', 'Hazard Type', 'Date',
  'Safety Officers', 'Supervisors', 'Injured', '',
];

function TableSkeleton({ cols }) {
  return Array.from({ length: 5 }).map((_, i) => (
    <tr key={i} className="ui-row animate-pulse">
      {Array.from({ length: cols }).map((__, j) => (
        <td key={j} className="ui-td">
          <div
            className="h-4 rounded"
            style={{ background: 'var(--border)', width: j === cols - 1 ? 32 : '70%' }}
          />
        </td>
      ))}
    </tr>
  ));
}

function Pagination({ meta, page, onPage }) {
  if (!meta || (meta.total_pages ?? 1) <= 1) return null;
  return (
    <div
      className="flex items-center justify-between px-4 py-3"
      style={{ borderTop: '1px solid var(--border)' }}
    >
      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
        Page {page} of {meta.total_pages} &mdash;{' '}
        {meta.total_count ?? meta.total ?? 0} records
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPage(page - 1)}
          disabled={page <= 1}
          className="p-1.5 rounded hover:opacity-75 disabled:opacity-30"
          style={{ color: 'var(--text-muted)' }}
        >
          <ChevronLeftIcon className="h-4 w-4" />
        </button>
        <button
          onClick={() => onPage(page + 1)}
          disabled={page >= meta.total_pages}
          className="p-1.5 rounded hover:opacity-75 disabled:opacity-30"
          style={{ color: 'var(--text-muted)' }}
        >
          <ChevronRightIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// ── Delete Confirm Modal ───────────────────────────────────────────────────

function DeleteConfirmModal({ open, report, onConfirm, onCancel, loading }) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.5)' }}
    >
      <div className="ui-card max-w-sm w-full p-6 space-y-4">

        {/* Warning banner */}
        <div
          className="flex items-start gap-3 p-4 rounded-xl"
          style={{
            background: 'color-mix(in srgb,var(--danger) 8%,transparent)',
            border: '1px solid color-mix(in srgb,var(--danger) 25%,transparent)',
          }}
        >
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: 'var(--danger)', color: '#fff' }}
          >
            <ExclamationTriangleIcon className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
              This action cannot be undone
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              The hazard report and all associated data will be permanently removed.
            </p>
          </div>
        </div>

        {/* Report details card */}
        {report && (
          <div
            className="p-4 rounded-xl"
            style={{ background: 'var(--bg-raised)', border: '1px solid var(--border)' }}
          >
            <p
              className="text-[11px] font-semibold uppercase tracking-wider mb-1.5"
              style={{ color: 'var(--text-muted)' }}
            >
              Report to delete
            </p>
            <p className="text-sm font-bold" style={{ color: 'var(--danger)' }}>
              Report #{report.id} &mdash; {report.hazard_type}
            </p>
            {report.location && (
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                {report.location}
              </p>
            )}
            {report.report_date && (
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                {formatDate(report.report_date)}
              </p>
            )}
          </div>
        )}

        {/* Footer */}
        <div
          className="flex justify-end gap-3 pt-1"
          style={{ borderTop: '1px solid var(--border)' }}
        >
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 rounded-lg text-sm font-medium hover:opacity-75"
            style={{ background: 'var(--bg-raised)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
            style={{ background: 'var(--danger)' }}
          >
            {loading ? 'Deleting…' : 'Delete Report'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Hazard Report Create/Edit Modal ────────────────────────────────────────

const STEPS = ['Basic Info', 'Safety Officers', 'Supervisors', 'Review'];

const EMPTY_FORM = {
  location: '',
  hazard_type: '',
  report_date: '',
  other: '',
};

const EMPTY_PEOPLE = { safety_officers: [], supervisors: [] };

function ReviewRow({ label, value }) {
  return (
    <div
      className="flex flex-col gap-0.5 p-3 rounded-lg"
      style={{ background: 'var(--bg-raised)', border: '1px solid var(--border)' }}
    >
      <span className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
        {label}
      </span>
      <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>
        {value || '—'}
      </span>
    </div>
  );
}

function HazardReportModal({ open, report, onClose, onSave, saving, saveError }) {
  const [step, setStep]     = useState(0);
  const [form, setForm]     = useState(EMPTY_FORM);
  const [people, setPeople] = useState(EMPTY_PEOPLE);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!open) return;
    setStep(0);
    setErrors({});
    if (report) {
      setForm({
        location:    report.location ?? '',
        hazard_type: report.hazard_type ?? '',
        report_date: report.report_date ?? '',
        other:       report.other ?? '',
      });
      setPeople({
        safety_officers: report.safety_officers ?? [],
        supervisors:     report.supervisors ?? [],
      });
    } else {
      setForm(EMPTY_FORM);
      setPeople(EMPTY_PEOPLE);
    }
  }, [open, report]);

  function validate(s) {
    const errs = {};
    if (s === 0) {
      if (!form.location.trim())    errs.location    = 'Location is required';
      if (!form.hazard_type.trim()) errs.hazard_type = 'Hazard type is required';
    }
    if (s === 1) {
      if (!people.safety_officers.length)
        errs.safety_officers = 'At least one safety officer is required';
    }
    if (s === 2) {
      if (!people.supervisors.length)
        errs.supervisors = 'At least one supervisor is required';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function next() { if (validate(step)) setStep((s) => s + 1); }
  function back() { setStep((s) => s - 1); }

  function submit() {
    // Re-validate people steps before submit
    const errs = {};
    if (!people.safety_officers.length)
      errs.safety_officers = 'At least one safety officer is required';
    if (!people.supervisors.length)
      errs.supervisors = 'At least one supervisor is required';
    if (Object.keys(errs).length) {
      setErrors(errs);
      setStep(errs.safety_officers ? 1 : 2);
      return;
    }

    const payload = {
      ...form,
      safety_officer_ids: people.safety_officers.map((u) => u.id),
      supervisor_ids:     people.supervisors.map((u) => u.id),
    };
    if (!payload.report_date) delete payload.report_date;
    if (!payload.other)       delete payload.other;
    onSave(payload);
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.5)' }}
    >
      <div
        className="ui-card w-full max-w-lg p-6 space-y-5"
        style={{ maxHeight: '90vh', overflowY: 'auto' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold" style={{ color: 'var(--text)' }}>
            {report ? 'Edit Hazard Report' : 'New Hazard Report'}
          </h2>
          <button
            type="button" onClick={onClose}
            className="p-1 rounded hover:opacity-75"
            style={{ color: 'var(--text-muted)' }}
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Step indicators */}
        <div className="flex items-center gap-2">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2 flex-1 last:flex-none">
              <div className="flex items-center gap-1.5">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0"
                  style={
                    i <= step
                      ? { background: 'var(--accent)', color: '#fff' }
                      : { background: 'var(--border)', color: 'var(--text-muted)' }
                  }
                >
                  {i < step ? '✓' : i + 1}
                </div>
                <span
                  className="text-xs font-medium hidden sm:inline"
                  style={{ color: i === step ? 'var(--text)' : 'var(--text-muted)' }}
                >
                  {s}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
              )}
            </div>
          ))}
        </div>

        {/* ── Step 0: Basic Info ── */}
        {step === 0 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text)' }}>
                Location <span style={{ color: 'var(--danger)' }}>*</span>
              </label>
              <input
                className="ui-input w-full"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="e.g. Building A, Site B"
              />
              {errors.location && (
                <p className="text-xs mt-1" style={{ color: 'var(--danger)' }}>{errors.location}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text)' }}>
                Hazard Type <span style={{ color: 'var(--danger)' }}>*</span>
              </label>
              <input
                className="ui-input w-full"
                value={form.hazard_type}
                onChange={(e) => setForm({ ...form, hazard_type: e.target.value })}
                placeholder="e.g. Chemical, Electrical, Fire"
                list="hazard-type-datalist"
              />
              <datalist id="hazard-type-datalist">
                {['Chemical','Electrical','Fire','Biological','Physical','Ergonomic','Mechanical','Other']
                  .map((t) => <option key={t} value={t} />)}
              </datalist>
              {errors.hazard_type && (
                <p className="text-xs mt-1" style={{ color: 'var(--danger)' }}>{errors.hazard_type}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text)' }}>
                Report Date
              </label>
              <input
                type="date"
                className="ui-input w-full"
                value={form.report_date}
                onChange={(e) => setForm({ ...form, report_date: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text)' }}>
                Additional Notes
              </label>
              <textarea
                className="ui-input w-full resize-none"
                rows={3}
                value={form.other}
                onChange={(e) => setForm({ ...form, other: e.target.value })}
                placeholder="Any additional details…"
              />
            </div>
          </div>
        )}

        {/* ── Step 1: Safety Officers ── */}
        {step === 1 && (
          <div className="flex flex-col gap-5">
            {/* Canteen-style info banner */}
            <div
              className="flex items-start gap-3 p-4 rounded-xl"
              style={{
                background: 'color-mix(in srgb,var(--accent) 8%,transparent)',
                border: '1px solid color-mix(in srgb,var(--accent) 25%,transparent)',
              }}
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold"
                style={{ background: 'var(--accent)', color: '#fff' }}
              >
                2
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
                  Assign Safety Officers
                </p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  Search by name — select one or more safety officers for this report.
                </p>
              </div>
            </div>

            {/* Field wrapper + search */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
                Safety Officers <span style={{ color: 'var(--danger)' }}>*</span>
              </label>
              <UserMultiSelect
                roleFilter="safety_officer"
                value={people.safety_officers}
                onChange={(v) => setPeople({ ...people, safety_officers: v })}
                error={errors.safety_officers}
                showChips={false}
              />
              {errors.safety_officers && (
                <p className="text-[11px]" style={{ color: 'var(--danger)' }}>
                  {errors.safety_officers}
                </p>
              )}
            </div>

            {/* Green confirmation cards */}
            {people.safety_officers.map((u) => (
              <div
                key={u.id}
                className="flex items-center gap-3 p-4 rounded-xl"
                style={{
                  background: 'color-mix(in srgb,#3fb950 8%,transparent)',
                  border: '1px solid color-mix(in srgb,#3fb950 30%,transparent)',
                }}
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                  style={{ background: '#3fb950', color: '#fff' }}
                >
                  {(u.firstname ?? u.email ?? '#')[0]?.toUpperCase()}
                  {(u.lastname ?? '')[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold" style={{ color: 'var(--text)' }}>
                    {displayName(u)}
                  </p>
                  <p className="text-xs" style={{ color: '#3fb950' }}>
                    ✓ Assigned &middot; Safety Officer
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setPeople({
                      ...people,
                      safety_officers: people.safety_officers.filter((x) => x.id !== u.id),
                    })
                  }
                  className="p-1 rounded hover:opacity-70 flex-shrink-0"
                  style={{ color: 'var(--text-muted)' }}
                  title="Remove"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* ── Step 2: Supervisors ── */}
        {step === 2 && (
          <div className="flex flex-col gap-5">
            {/* Canteen-style info banner */}
            <div
              className="flex items-start gap-3 p-4 rounded-xl"
              style={{
                background: 'color-mix(in srgb,var(--accent) 8%,transparent)',
                border: '1px solid color-mix(in srgb,var(--accent) 25%,transparent)',
              }}
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold"
                style={{ background: 'var(--accent)', color: '#fff' }}
              >
                3
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
                  Assign Supervisors
                </p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  Search by name — select one or more supervisors for this report.
                </p>
              </div>
            </div>

            {/* Field wrapper + search */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
                Supervisors <span style={{ color: 'var(--danger)' }}>*</span>
              </label>
              <UserMultiSelect
                roleFilter="supervisor"
                value={people.supervisors}
                onChange={(v) => setPeople({ ...people, supervisors: v })}
                error={errors.supervisors}
                showChips={false}
              />
              {errors.supervisors && (
                <p className="text-[11px]" style={{ color: 'var(--danger)' }}>
                  {errors.supervisors}
                </p>
              )}
            </div>

            {/* Green confirmation cards */}
            {people.supervisors.map((u) => (
              <div
                key={u.id}
                className="flex items-center gap-3 p-4 rounded-xl"
                style={{
                  background: 'color-mix(in srgb,#3fb950 8%,transparent)',
                  border: '1px solid color-mix(in srgb,#3fb950 30%,transparent)',
                }}
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                  style={{ background: '#3fb950', color: '#fff' }}
                >
                  {(u.firstname ?? u.email ?? '#')[0]?.toUpperCase()}
                  {(u.lastname ?? '')[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold" style={{ color: 'var(--text)' }}>
                    {displayName(u)}
                  </p>
                  <p className="text-xs" style={{ color: '#3fb950' }}>
                    ✓ Assigned &middot; Supervisor
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setPeople({
                      ...people,
                      supervisors: people.supervisors.filter((x) => x.id !== u.id),
                    })
                  }
                  className="p-1 rounded hover:opacity-70 flex-shrink-0"
                  style={{ color: 'var(--text-muted)' }}
                  title="Remove"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* ── Step 3: Review ── */}
        {step === 3 && (
          <div className="space-y-4">
            {/* All-steps-complete banner */}
            <div
              className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-semibold"
              style={{
                background: 'color-mix(in srgb,#3fb950 10%,transparent)',
                color: '#3fb950',
                border: '1px solid color-mix(in srgb,#3fb950 25%,transparent)',
              }}
            >
              <CheckBadgeIcon className="h-4 w-4 flex-shrink-0" />
              All steps complete — please review before submitting.
            </div>

            {/* Report Details section */}
            <div className="space-y-2">
              <p
                className="text-xs font-bold uppercase tracking-wider"
                style={{ color: 'var(--text-muted)' }}
              >
                Report Details
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <ReviewRow label="Location" value={form.location} />
                </div>
                <ReviewRow label="Hazard Type" value={form.hazard_type} />
                <ReviewRow label="Report Date" value={form.report_date || 'Auto-set by server'} />
                <div className="col-span-2">
                  <ReviewRow label="Additional Notes" value={form.other} />
                </div>
              </div>
            </div>

            {/* Assignees section */}
            <div className="space-y-2">
              <p
                className="text-xs font-bold uppercase tracking-wider"
                style={{ color: 'var(--text-muted)' }}
              >
                Assignees
              </p>

              {people.safety_officers.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-[11px] font-semibold" style={{ color: 'var(--text-muted)' }}>Safety Officers</p>
                  <div className="flex flex-wrap gap-2">
                    {people.safety_officers.map((u) => (
                      <div
                        key={u.id}
                        className="flex items-center gap-3 p-3 rounded-lg flex-1"
                        style={{
                          background: 'var(--bg-raised)',
                          border: '1px solid var(--border)',
                          minWidth: 180,
                        }}
                      >
                        <div
                          className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                          style={{
                            background: 'color-mix(in srgb,var(--accent) 20%,transparent)',
                            color: 'var(--accent)',
                          }}
                        >
                          {(u.firstname ?? u.email ?? '#')[0]?.toUpperCase()}
                          {(u.lastname ?? '')[0]?.toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-[11px] font-semibold" style={{ color: 'var(--text-muted)' }}>Safety Officer</p>
                          <p className="text-sm font-semibold truncate" style={{ color: 'var(--text)' }}>{displayName(u)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {people.supervisors.length > 0 && (
                <div className="space-y-1.5 mt-2">
                  <p className="text-[11px] font-semibold" style={{ color: 'var(--text-muted)' }}>Supervisors</p>
                  <div className="flex flex-wrap gap-2">
                    {people.supervisors.map((u) => (
                      <div
                        key={u.id}
                        className="flex items-center gap-3 p-3 rounded-lg flex-1"
                        style={{
                          background: 'var(--bg-raised)',
                          border: '1px solid var(--border)',
                          minWidth: 180,
                        }}
                      >
                        <div
                          className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                          style={{
                            background: 'color-mix(in srgb,#d97706 20%,transparent)',
                            color: '#d97706',
                          }}
                        >
                          {(u.firstname ?? u.email ?? '#')[0]?.toUpperCase()}
                          {(u.lastname ?? '')[0]?.toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-[11px] font-semibold" style={{ color: 'var(--text-muted)' }}>Supervisor</p>
                          <p className="text-sm font-semibold truncate" style={{ color: 'var(--text)' }}>{displayName(u)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {people.safety_officers.length === 0 && people.supervisors.length === 0 && (
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>No assignees selected.</p>
              )}
            </div>

            {saveError && (
              <p className="text-sm text-center" style={{ color: 'var(--danger)' }}>
                {saveError}
              </p>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-between pt-1">
          <button
            type="button"
            onClick={step === 0 ? onClose : back}
            className="px-4 py-2 rounded-lg text-sm font-medium hover:opacity-75"
            style={{ border: '1px solid var(--border)', color: 'var(--text)' }}
          >
            {step === 0 ? 'Cancel' : 'Back'}
          </button>
          {step < STEPS.length - 1 ? (
            <button
              type="button" onClick={next}
              className="px-4 py-2 rounded-lg text-sm font-semibold text-white hover:opacity-90"
              style={{ background: 'var(--accent)' }}
            >
              Next
            </button>
          ) : (
            <button
              type="button" onClick={submit} disabled={saving}
              className="px-4 py-2 rounded-lg text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
              style={{ background: 'var(--accent)' }}
            >
              {saving ? 'Saving…' : report ? 'Save Changes' : 'Create Report'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Injured People Manager (used inside the detail drawer) ─────────────────

const EMPTY_INJURY = { name: '', injury_type: '', injury_description: '', action_taken: '' };

function InjuredPeopleManager({ reportId }) {
  const [people,    setPeople]    = useState([]);
  const [loading,   setLoading]   = useState(false);
  const [formState, setFormState] = useState(null); // null=hidden, object=add/edit
  const [saving,    setSaving]    = useState(false);
  const [fieldErrs, setFieldErrs] = useState({});

  useEffect(() => {
    if (!reportId) return;
    setLoading(true);
    InjuredPersonService.list(reportId)
      .then((res) => {
        const list = Array.isArray(res) ? res : (res.data ?? []);
        setPeople(list);
      })
      .catch(() => toast.error('Failed to load injured people'))
      .finally(() => setLoading(false));
  }, [reportId]);

  function validateInjury(f) {
    const errs = {};
    if (!f.name?.trim())        errs.name        = 'Full name is required';
    if (!f.injury_type?.trim()) errs.injury_type = 'Injury type is required';
    return errs;
  }

  async function saveInjury() {
    const errs = validateInjury(formState);
    setFieldErrs(errs);
    if (Object.keys(errs).length) return;

    setSaving(true);
    try {
      if (formState.id) {
        const raw = await InjuredPersonService.update(reportId, formState.id, formState);
        const updated = raw.data ?? raw;
        setPeople((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
        toast.success('Record updated.');
      } else {
        const raw = await InjuredPersonService.create(reportId, formState);
        const created = raw.data ?? raw;
        setPeople((prev) => [created, ...prev]);
        toast.success('Person added.');
      }
      setFormState(null);
    } catch (e) {
      toast.error(e.response?.data?.message ?? 'Save failed.');
    } finally {
      setSaving(false);
    }
  }

  async function removeInjury(id) {
    if (!window.confirm('Remove this injured person record?')) return;
    try {
      await InjuredPersonService.remove(reportId, id);
      setPeople((prev) => prev.filter((p) => p.id !== id));
      toast.success('Removed.');
    } catch {
      toast.error('Delete failed.');
    }
  }

  const INJURY_FIELDS = [
    { key: 'name',               label: 'Full Name',    required: true,  placeholder: 'e.g. John Doe' },
    { key: 'injury_type',        label: 'Injury Type',  required: true,  placeholder: 'e.g. Laceration, Burns' },
    { key: 'injury_description', label: 'Description',  required: false, placeholder: 'Describe the injury…' },
    { key: 'action_taken',       label: 'Action Taken', required: false, placeholder: 'First aid administered…' },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
          Injured People
        </h4>
        {!formState && (
          <button
            type="button"
            onClick={() => { setFormState({ ...EMPTY_INJURY }); setFieldErrs({}); }}
            className="flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-lg"
            style={{ background: 'color-mix(in srgb,var(--accent) 12%,transparent)', color: 'var(--accent)' }}
          >
            <PlusIcon className="h-3.5 w-3.5" /> Add
          </button>
        )}
      </div>

      {loading && <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Loading…</p>}

      {/* Add / Edit inline form */}
      {formState && (
        <div
          className="rounded-xl p-3 space-y-3"
          style={{ background: 'var(--bg-raised)', border: '1px solid var(--border)' }}
        >
          {INJURY_FIELDS.map(({ key, label, required, placeholder }) => (
            <div key={key}>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text)' }}>
                {label}
                {required && <span style={{ color: 'var(--danger)' }}> *</span>}
              </label>
              <input
                className="ui-input w-full text-sm"
                value={formState[key] ?? ''}
                onChange={(e) => setFormState({ ...formState, [key]: e.target.value })}
                placeholder={placeholder}
              />
              {fieldErrs[key] && (
                <p className="text-xs mt-0.5" style={{ color: 'var(--danger)' }}>
                  {fieldErrs[key]}
                </p>
              )}
            </div>
          ))}
          <div className="flex gap-2 justify-end pt-1">
            <button
              type="button" onClick={() => setFormState(null)} disabled={saving}
              className="text-xs px-3 py-1.5 rounded-lg hover:opacity-75"
              style={{ border: '1px solid var(--border)', color: 'var(--text)' }}
            >
              Cancel
            </button>
            <button
              type="button" onClick={saveInjury} disabled={saving}
              className="text-xs px-3 py-1.5 rounded-lg font-semibold text-white hover:opacity-90"
              style={{ background: 'var(--accent)' }}
            >
              {saving ? 'Saving…' : formState.id ? 'Update' : 'Add'}
            </button>
          </div>
        </div>
      )}

      {/* Existing injured people list */}
      {!loading && people.length === 0 && !formState && (
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          No injured people recorded for this report.
        </p>
      )}

      {people.map((p) => (
        <div
          key={p.id}
          className="flex items-start gap-3 py-2.5"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>
              {p.name}
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              {p.injury_type}
            </p>
            {p.injury_description && (
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                {p.injury_description}
              </p>
            )}
            {p.action_taken && (
              <p className="text-xs mt-0.5 italic" style={{ color: 'var(--text-muted)' }}>
                Action: {p.action_taken}
              </p>
            )}
          </div>
          <div className="flex items-center gap-0.5 flex-shrink-0">
            <button
              type="button"
              onClick={() => { setFormState({ ...p }); setFieldErrs({}); }}
              className="p-1.5 rounded hover:opacity-75"
              style={{ color: 'var(--accent)' }}
              title="Edit"
            >
              <PencilSquareIcon className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => removeInjury(p.id)}
              className="p-1.5 rounded hover:opacity-75"
              style={{ color: 'var(--danger)' }}
              title="Remove"
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Detail Drawer ──────────────────────────────────────────────────────────

function DetailDrawer({ report, onClose, onEdit, canEdit }) {
  if (!report) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/40" onClick={onClose} />
      <div
        className="fixed right-0 top-0 bottom-0 z-50 flex flex-col w-full max-w-md"
        style={{ background: 'var(--bg)', borderLeft: '1px solid var(--border)' }}
      >
        {/* Drawer header */}
        <div
          className="flex items-center gap-3 px-5 py-4 flex-shrink-0"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(220,38,38,.12)' }}
          >
            <ExclamationTriangleIcon className="h-5 w-5" style={{ color: '#dc2626' }} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold truncate" style={{ color: 'var(--text)' }}>
              Hazard Report #{report.id}
            </h3>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {report.hazard_type}
            </p>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {canEdit && (
              <button
                type="button" onClick={() => onEdit(report)}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg hover:opacity-80"
                style={{ background: 'color-mix(in srgb,var(--accent) 12%,transparent)', color: 'var(--accent)' }}
              >
                Edit
              </button>
            )}
            <button
              type="button" onClick={onClose}
              className="p-1.5 rounded-lg hover:opacity-75"
              style={{ color: 'var(--text-muted)' }}
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Drawer body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {/* Basic info section */}
          <section>
            <h4
              className="text-xs font-semibold uppercase tracking-wide mb-3"
              style={{ color: 'var(--text-muted)' }}
            >
              Report Details
            </h4>
            <div className="space-y-2.5">
              {[
                ['Location',    report.location],
                ['Hazard Type', report.hazard_type],
                ['Date',        formatDate(report.report_date)],
                ['Notes',       report.other || '—'],
              ].map(([k, v]) => (
                <div key={k} className="flex gap-3">
                  <span
                    className="text-xs font-medium w-24 flex-shrink-0"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {k}
                  </span>
                  <span className="text-xs flex-1" style={{ color: 'var(--text)' }}>
                    {v}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* Safety Officers */}
          <section>
            <h4
              className="text-xs font-semibold uppercase tracking-wide mb-2"
              style={{ color: 'var(--text-muted)' }}
            >
              Safety Officers
            </h4>
            {report.safety_officers?.length ? (
              <div className="flex flex-wrap gap-1.5">
                {report.safety_officers.map((u) => (
                  <span
                    key={u.id}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                    style={{
                      background: 'color-mix(in srgb,var(--accent) 12%,transparent)',
                      color: 'var(--accent)',
                    }}
                  >
                    {displayName(u)}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                None assigned.
              </p>
            )}
          </section>

          {/* Supervisors */}
          <section>
            <h4
              className="text-xs font-semibold uppercase tracking-wide mb-2"
              style={{ color: 'var(--text-muted)' }}
            >
              Supervisors
            </h4>
            {report.supervisors?.length ? (
              <div className="flex flex-wrap gap-1.5">
                {report.supervisors.map((u) => (
                  <span
                    key={u.id}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                    style={{ background: 'rgba(217,119,6,.12)', color: '#d97706' }}
                  >
                    {displayName(u)}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                None assigned.
              </p>
            )}
          </section>

          {/* Injured people management */}
          <section>
            <InjuredPeopleManager reportId={report.id} />
          </section>
        </div>
      </div>
    </>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────

export default function HazardReportsPage() {
  const dispatch = useAppDispatch();
  const { hasPermission } = useAuth();

  const reports       = useAppSelector(selectHazardReports);
  const meta          = useAppSelector(selectHazardReportsMeta);
  const loading       = useAppSelector(selectHazardReportsLoading);
  const error         = useAppSelector(selectHazardReportsError);
  const filters       = useAppSelector(selectHazardReportsFilters);
  const actionLoading = useAppSelector(selectHazardReportsActionLoading);
  const actionError   = useAppSelector(selectHazardReportsActionError);

  // hazard_reports.update covers create, edit and delete
  const canWrite = hasPermission('hazard_reports.update');

  const [modal,        setModal]        = useState({ open: false, report: null });
  const [detailReport, setDetailReport] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting,     setDeleting]     = useState(false);
  const [locInput,     setLocInput]     = useState('');
  const [typeInput,    setTypeInput]    = useState('');
  const locTimer  = useRef(null);
  const typeTimer = useRef(null);

  const filterLoc  = filters['filter[location]'];
  const filterType = filters['filter[hazard_type]'];
  const filterDate = filters['filter[report_date]'];

  useEffect(() => {
    dispatch(fetchHazardReports(filters));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, filters.page, filterLoc, filterType, filterDate]);

  useEffect(() => {
    if (error) { toast.error(error); dispatch(clearHazardReportErrors()); }
  }, [error, dispatch]);

  useEffect(() => {
    if (actionError) { toast.error(actionError); dispatch(clearHazardReportErrors()); }
  }, [actionError, dispatch]);

  function handleLocSearch(val) {
    setLocInput(val);
    clearTimeout(locTimer.current);
    locTimer.current = setTimeout(
      () => dispatch(setHazardReportFilters({ 'filter[location]': val, page: 1 })),
      400,
    );
  }

  function handleTypeSearch(val) {
    setTypeInput(val);
    clearTimeout(typeTimer.current);
    typeTimer.current = setTimeout(
      () => dispatch(setHazardReportFilters({ 'filter[hazard_type]': val, page: 1 })),
      400,
    );
  }

  function clearFilters() {
    setLocInput('');
    setTypeInput('');
    dispatch(setHazardReportFilters({ 'filter[location]': '', 'filter[hazard_type]': '', page: 1 }));
  }

  async function handleSave(payload) {
    const isEdit = !!modal.report;
    const result = isEdit
      ? await dispatch(updateHazardReport({ id: modal.report.id, data: payload }))
      : await dispatch(createHazardReport(payload));

    const fulfilled = isEdit
      ? updateHazardReport.fulfilled.match(result)
      : createHazardReport.fulfilled.match(result);

    if (fulfilled) {
      toast.success(isEdit ? 'Report updated.' : 'Report created.');
      setModal({ open: false, report: null });
      dispatch(fetchHazardReports(filters));
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    const result = await dispatch(deleteHazardReport(deleteTarget.id));
    setDeleting(false);
    if (deleteHazardReport.fulfilled.match(result)) {
      toast.success('Report deleted.');
      setDeleteTarget(null);
    }
  }

  const page        = filters.page;
  const hasFilters  = !!(locInput || typeInput);

  return (
    <div className="ui-page" style={{ color: 'var(--text)' }}>

      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(220,38,38,.12)' }}
          >
            <ExclamationTriangleIcon className="w-5 h-5" style={{ color: '#dc2626' }} />
          </div>
          <div>
            <h1 className="text-xl font-bold leading-tight" style={{ color: 'var(--text)' }}>
              Hazard Reports
            </h1>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              {meta
                ? `${meta.total_count ?? meta.total ?? 0} report${(meta.total_count ?? meta.total ?? 0) !== 1 ? 's' : ''}`
                : 'Manage hazard incident reports'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => dispatch(fetchHazardReports(filters))}
            disabled={loading}
            className="p-2 rounded-lg hover:opacity-75"
            style={{ color: 'var(--text-muted)' }}
            title="Refresh"
          >
            <ArrowPathIcon className={`h-4 w-4${loading ? ' animate-spin' : ''}`} />
          </button>
          {canWrite && (
            <button
              onClick={() => setModal({ open: true, report: null })}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white hover:opacity-90"
              style={{ background: 'var(--accent)' }}
            >
              <PlusIcon className="h-4 w-4" /> New Report
            </button>
          )}
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="relative">
          <MagnifyingGlassIcon
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none"
            style={{ color: 'var(--text-muted)' }}
          />
          <input
            className="ui-input pl-9"
            style={{ width: 200 }}
            placeholder="Filter by location…"
            value={locInput}
            onChange={(e) => handleLocSearch(e.target.value)}
          />
        </div>
        <div className="relative">
          <FunnelIcon
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none"
            style={{ color: 'var(--text-muted)' }}
          />
          <input
            className="ui-input pl-9"
            style={{ width: 200 }}
            placeholder="Filter by hazard type…"
            value={typeInput}
            onChange={(e) => handleTypeSearch(e.target.value)}
          />
        </div>
        {hasFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg hover:opacity-75"
            style={{ color: 'var(--text-muted)' }}
          >
            <XMarkIcon className="h-3.5 w-3.5" /> Clear
          </button>
        )}
      </div>

      {/* ── Table ── */}
      <div className="ui-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {TABLE_COLS.map((c) => (
                  <th key={c} className="ui-th">{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableSkeleton cols={TABLE_COLS.length} />
              ) : reports.length === 0 ? (
                <tr>
                  <td
                    colSpan={TABLE_COLS.length}
                    className="ui-td text-center py-12"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    No hazard reports found.
                  </td>
                </tr>
              ) : (
                reports.map((r, idx) => (
                  <tr key={r.id} className="ui-row">
                    <td className="ui-td" style={{ color: 'var(--text-muted)' }}>
                      {(page - 1) * filters.per_page + idx + 1}
                    </td>
                    <td className="ui-td font-medium">{r.location}</td>
                    <td className="ui-td">{r.hazard_type}</td>
                    <td className="ui-td" style={{ color: 'var(--text-muted)' }}>
                      {formatDate(r.report_date)}
                    </td>
                    <td
                      className="ui-td"
                      style={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                    >
                      <NameList arr={r.safety_officers} />
                    </td>
                    <td
                      className="ui-td"
                      style={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                    >
                      <NameList arr={r.supervisors} />
                    </td>
                    <td className="ui-td">
                      {r.injured_people?.length ? (
                        <span
                          className="inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold"
                          style={{ background: 'rgba(220,38,38,.12)', color: '#dc2626' }}
                        >
                          {r.injured_people.length}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>0</span>
                      )}
                    </td>
                    <td className="ui-td text-right">
                      <ActionMenu
                        onView={() => setDetailReport(r)}
                        onEdit={() => setModal({ open: true, report: r })}
                        onDelete={() => setDeleteTarget(r)}
                        canEdit={canWrite}
                        canDelete={canWrite}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <Pagination
          meta={meta}
          page={page}
          onPage={(p) => dispatch(setHazardReportFilters({ page: p }))}
        />
      </div>

      {/* ── Modals & Drawers ── */}
      <HazardReportModal
        open={modal.open}
        report={modal.report}
        onClose={() => setModal({ open: false, report: null })}
        onSave={handleSave}
        saving={actionLoading}
        saveError={actionError}
      />
      <DetailDrawer
        report={detailReport}
        onClose={() => setDetailReport(null)}
        onEdit={(r) => { setDetailReport(null); setModal({ open: true, report: r }); }}
        canEdit={canWrite}
      />
      <DeleteConfirmModal
        open={!!deleteTarget}
        report={deleteTarget}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </div>
  );
}
