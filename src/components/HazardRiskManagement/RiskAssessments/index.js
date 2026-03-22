/**
 * RiskAssessments/index.js
 *
 * Full CRUD page for Risk Assessment definitions.
 *
 * Features:
 *  - Paginated table: Activity, Location, Date, Note, Officers, Supervisors
 *  - Multi-step create/edit modal (Basic Info → Assign People → Review)
 *  - Right-side detail drawer for read-only view
 *  - Delete confirmation modal
 *  - Debounced search/filter inputs
 *  - Permission-gated actions (risk_assessments.update)
 */
import { useEffect, useState, useRef } from 'react';
import toast from 'react-hot-toast';
import {
  PlusIcon,
  ArrowPathIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  ShieldExclamationIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';
import { EllipsisVerticalIcon } from '@heroicons/react/20/solid';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import {
  fetchRiskAssessments,
  createRiskAssessment,
  updateRiskAssessment,
  deleteRiskAssessment,
  setRiskAssessmentFilters,
  clearRiskAssessmentErrors,
  selectRiskAssessments,
  selectRiskAssessmentsMeta,
  selectRiskAssessmentsLoading,
  selectRiskAssessmentsError,
  selectRiskAssessmentsFilters,
  selectRiskAssessmentsActionLoading,
  selectRiskAssessmentsActionError,
} from '../../../store/slices/riskAssessmentSlice';
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
      setCoords({
        top: rect.bottom + 4,
        right: window.innerWidth - rect.right,
      });
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

// ── Table primitives ───────────────────────────────────────────────────────

const TABLE_COLS = ['#', 'Activity', 'Location', 'Date', 'Note', 'Officers', 'Supervisors', ''];

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
          onClick={() => onPage(page - 1)} disabled={page <= 1}
          className="p-1.5 rounded hover:opacity-75 disabled:opacity-30"
          style={{ color: 'var(--text-muted)' }}
        >
          <ChevronLeftIcon className="h-4 w-4" />
        </button>
        <button
          onClick={() => onPage(page + 1)} disabled={page >= meta.total_pages}
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

function DeleteConfirmModal({ open, name, onConfirm, onCancel, loading }) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.5)' }}
    >
      <div className="ui-card max-w-sm w-full p-6 space-y-4">
        <h3 className="text-base font-semibold" style={{ color: 'var(--text)' }}>
          Delete Risk Assessment
        </h3>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Are you sure you want to delete{' '}
          <strong style={{ color: 'var(--text)' }}>{name}</strong>? This cannot be undone.
        </p>
        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button" onClick={onCancel} disabled={loading}
            className="px-4 py-2 rounded-lg text-sm font-medium hover:opacity-75"
            style={{ border: '1px solid var(--border)', color: 'var(--text)' }}
          >
            Cancel
          </button>
          <button
            type="button" onClick={onConfirm} disabled={loading}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-white hover:opacity-90"
            style={{ background: 'var(--danger)' }}
          >
            {loading ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Risk Assessment Create/Edit Modal ──────────────────────────────────────

const STEPS = ['Basic Info', 'Safety Officers', 'Supervisors', 'Review'];

const EMPTY_FORM   = { activity: '', location: '', date: '', note: '' };
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

function RiskAssessmentModal({ open, assessment, onClose, onSave, saving, saveError }) {
  const [step, setStep]     = useState(0);
  const [form, setForm]     = useState(EMPTY_FORM);
  const [people, setPeople] = useState(EMPTY_PEOPLE);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!open) return;
    setStep(0);
    setErrors({});
    if (assessment) {
      setForm({
        activity: assessment.activity ?? '',
        location: assessment.location ?? '',
        date:     assessment.date ?? '',
        note:     assessment.note ?? '',
      });
      setPeople({
        safety_officers: assessment.safety_officers ?? [],
        supervisors:     assessment.supervisors ?? [],
      });
    } else {
      setForm(EMPTY_FORM);
      setPeople(EMPTY_PEOPLE);
    }
  }, [open, assessment]);


  function validate(s) {
    const errs = {};
    if (s === 0) {
      if (!form.activity.trim()) errs.activity = 'Activity is required';
      if (!form.location.trim()) errs.location = 'Location is required';
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
    if (!payload.date) delete payload.date;
    if (!payload.note) delete payload.note;
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
            {assessment ? 'Edit Risk Assessment' : 'New Risk Assessment'}
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
                Activity <span style={{ color: 'var(--danger)' }}>*</span>
              </label>
              <input
                className="ui-input w-full"
                value={form.activity}
                onChange={(e) => setForm({ ...form, activity: e.target.value })}
                placeholder="e.g. Chemical Mixing, Electrical Maintenance"
              />
              {errors.activity && (
                <p className="text-xs mt-1" style={{ color: 'var(--danger)' }}>{errors.activity}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text)' }}>
                Location <span style={{ color: 'var(--danger)' }}>*</span>
              </label>
              <input
                className="ui-input w-full"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="e.g. Building A, Warehouse"
              />
              {errors.location && (
                <p className="text-xs mt-1" style={{ color: 'var(--danger)' }}>{errors.location}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text)' }}>
                Date
              </label>
              <input
                type="date"
                className="ui-input w-full"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text)' }}>
                Notes
              </label>
              <textarea
                className="ui-input w-full resize-none"
                rows={3}
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
                placeholder="Additional risk assessment notes…"
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
                  Search by name — select one or more safety officers for this assessment.
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
                    ✓ Assigned · Safety Officer
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
                  Search by name — select one or more supervisors for this assessment.
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
                    ✓ Assigned · Supervisor
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
              {/* Use a check icon if available, else fallback to a checkmark */}
              <span style={{fontWeight:'bold',fontSize:'1.1em'}}>✓</span>
              All steps complete — please review before submitting.
            </div>

            {/* Assessment Details section */}
            <div className="space-y-2">
              <p
                className="text-xs font-bold uppercase tracking-wider"
                style={{ color: 'var(--text-muted)' }}
              >
                Assessment Details
              </p>
              <div className="grid grid-cols-2 gap-3">
                <ReviewRow label="Activity" value={form.activity} />
                <ReviewRow label="Location" value={form.location} />
                <ReviewRow label="Date" value={form.date || 'Auto-set by server'} />
                <ReviewRow label="Notes" value={form.note || '—'} />
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
              <p className="text-sm text-center" style={{ color: 'var(--danger)' }}>{saveError}</p>
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
              {saving ? 'Saving…' : assessment ? 'Save Changes' : 'Create Assessment'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Detail Drawer ──────────────────────────────────────────────────────────

function DetailDrawer({ assessment, onClose, onEdit, canEdit }) {
  if (!assessment) return null;

  const officerCount    = assessment.safety_officers?.length  ?? 0;
  const supervisorCount = assessment.supervisors?.length      ?? 0;
  const entryCount      = assessment.risk_assessment_entries?.length ?? 0;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/40" onClick={onClose} />
      <div
        className="fixed right-0 top-0 bottom-0 z-50 flex flex-col w-full max-w-lg"
        style={{ background: 'var(--bg)', borderLeft: '1px solid var(--border)' }}
      >
        {/* ── Hero header ── */}
        <div
          className="flex-shrink-0 px-6 py-5"
          style={{
            background: 'linear-gradient(135deg,rgba(217,119,6,0.10) 0%,rgba(217,119,6,0.03) 100%)',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <div className="flex items-start gap-4">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(217,119,6,0.15)', border: '1px solid rgba(217,119,6,0.25)' }}
            >
              <ShieldExclamationIcon className="h-6 w-6" style={{ color: '#d97706' }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-widest mb-0.5" style={{ color: '#d97706', opacity: 0.7 }}>
                Assessment #{assessment.id}
              </p>
              <h3 className="text-base font-bold leading-tight truncate" style={{ color: 'var(--text)' }}>
                {assessment.activity}
              </h3>
              <p className="text-xs mt-1 truncate" style={{ color: 'var(--text-muted)' }}>
                {assessment.location}
              </p>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {canEdit && (
                <button
                  type="button" onClick={() => onEdit(assessment)}
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
          {/* Stats bar */}
          <div className="flex items-center gap-2 mt-4">
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg"
              style={{ background: 'color-mix(in srgb,var(--accent) 10%,transparent)', border: '1px solid color-mix(in srgb,var(--accent) 20%,transparent)' }}
            >
              <span className="text-sm font-bold" style={{ color: 'var(--accent)' }}>{officerCount}</span>
              <span className="text-[11px] font-medium" style={{ color: 'var(--accent)', opacity: 0.8 }}>Officers</span>
            </div>
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg"
              style={{ background: 'rgba(217,119,6,0.1)', border: '1px solid rgba(217,119,6,0.2)' }}
            >
              <span className="text-sm font-bold" style={{ color: '#d97706' }}>{supervisorCount}</span>
              <span className="text-[11px] font-medium" style={{ color: '#d97706', opacity: 0.8 }}>Supervisors</span>
            </div>
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg"
              style={{ background: 'rgba(59,130,246,0.10)', border: '1px solid rgba(59,130,246,0.15)' }}
            >
              <span className="text-sm font-bold" style={{ color: '#3b82f6' }}>{entryCount}</span>
              <span className="text-[11px] font-medium" style={{ color: '#3b82f6', opacity: 0.8 }}>Entries</span>
            </div>
          </div>
        </div>

        {/* ── Drawer body ── */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* Assessment Details — card grid */}
          <section>
            <h4 className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>
              Assessment Details
            </h4>
            <div className="grid grid-cols-2 gap-2.5">
              <div
                className="col-span-2 p-3 rounded-xl"
                style={{ background: 'var(--bg-raised)', border: '1px solid var(--border)' }}
              >
                <p className="text-[10px] font-semibold uppercase tracking-wider mb-0.5" style={{ color: 'var(--text-muted)' }}>Activity</p>
                <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{assessment.activity || '—'}</p>
              </div>
              <div
                className="p-3 rounded-xl"
                style={{ background: 'var(--bg-raised)', border: '1px solid var(--border)' }}
              >
                <p className="text-[10px] font-semibold uppercase tracking-wider mb-0.5" style={{ color: 'var(--text-muted)' }}>Location</p>
                <p className="text-sm font-semibold" style={{ color: 'var(--accent)' }}>{assessment.location || '—'}</p>
              </div>
              <div
                className="p-3 rounded-xl"
                style={{ background: 'var(--bg-raised)', border: '1px solid var(--border)' }}
              >
                <p className="text-[10px] font-semibold uppercase tracking-wider mb-0.5" style={{ color: 'var(--text-muted)' }}>Date</p>
                <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{formatDate(assessment.date) || '—'}</p>
              </div>
              {assessment.note && (
                <div
                  className="col-span-2 p-3 rounded-xl"
                  style={{ background: 'var(--bg-raised)', border: '1px solid var(--border)' }}
                >
                  <p className="text-[10px] font-semibold uppercase tracking-wider mb-0.5" style={{ color: 'var(--text-muted)' }}>Notes</p>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--text)' }}>{assessment.note}</p>
                </div>
              )}
            </div>
          </section>

          {/* Safety Officers */}
          <section>
            <h4 className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>
              Safety Officers
            </h4>
            {assessment.safety_officers?.length ? (
              <div className="space-y-2">
                {assessment.safety_officers.map((u) => (
                  <div
                    key={u.id}
                    className="flex items-center gap-3 p-3 rounded-xl"
                    style={{ background: 'var(--bg-raised)', border: '1px solid var(--border)' }}
                  >
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                      style={{ background: 'color-mix(in srgb,var(--accent) 15%,transparent)', color: 'var(--accent)' }}
                    >
                      {(u.firstname ?? u.email ?? '#')[0]?.toUpperCase()}
                      {(u.lastname ?? '')[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: 'var(--text)' }}>{displayName(u)}</p>
                      <p className="text-[11px] font-medium" style={{ color: 'var(--accent)' }}>Safety Officer</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>None assigned.</p>
            )}
          </section>

          {/* Supervisors */}
          <section>
            <h4 className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>
              Supervisors
            </h4>
            {assessment.supervisors?.length ? (
              <div className="space-y-2">
                {assessment.supervisors.map((u) => (
                  <div
                    key={u.id}
                    className="flex items-center gap-3 p-3 rounded-xl"
                    style={{ background: 'var(--bg-raised)', border: '1px solid var(--border)' }}
                  >
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                      style={{ background: 'rgba(217,119,6,0.15)', color: '#d97706' }}
                    >
                      {(u.firstname ?? u.email ?? '#')[0]?.toUpperCase()}
                      {(u.lastname ?? '')[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: 'var(--text)' }}>{displayName(u)}</p>
                      <p className="text-[11px] font-medium" style={{ color: '#d97706' }}>Supervisor</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>None assigned.</p>
            )}
          </section>

          {/* Entries count */}
          <section>
            <h4 className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>
              Assessment Entries
            </h4>
            <div className="p-3 rounded-xl" style={{ background: 'var(--bg-raised)', border: '1px solid var(--border)' }}>
              <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
                {entryCount} entr{entryCount !== 1 ? 'ies' : 'y'} defined.
              </span>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────

export default function RiskAssessmentsPage() {
  const dispatch = useAppDispatch();
  const { hasPermission } = useAuth();

  const assessments   = useAppSelector(selectRiskAssessments);
  const meta          = useAppSelector(selectRiskAssessmentsMeta);
  const loading       = useAppSelector(selectRiskAssessmentsLoading);
  const error         = useAppSelector(selectRiskAssessmentsError);
  const filters       = useAppSelector(selectRiskAssessmentsFilters);
  const actionLoading = useAppSelector(selectRiskAssessmentsActionLoading);
  const actionError   = useAppSelector(selectRiskAssessmentsActionError);

  const canWrite = hasPermission('risk_assessments.update');

  const [modal,      setModal]      = useState({ open: false, assessment: null });
  const [detailItem, setDetailItem] = useState(null);
  const [deleteTgt,  setDeleteTgt]  = useState(null);
  const [deleting,   setDeleting]   = useState(false);
  const [actInput,   setActInput]   = useState('');
  const [locInput,   setLocInput]   = useState('');
  const actTimer = useRef(null);
  const locTimer = useRef(null);

  const filterAct = filters['filter[activity]'];
  const filterLoc = filters['filter[location]'];
  const filterDt  = filters['filter[date]'];

  useEffect(() => {
    dispatch(fetchRiskAssessments(filters));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, filters.page, filterAct, filterLoc, filterDt]);

  useEffect(() => {
    if (error) { toast.error(error); dispatch(clearRiskAssessmentErrors()); }
  }, [error, dispatch]);

  useEffect(() => {
    if (actionError) { toast.error(actionError); dispatch(clearRiskAssessmentErrors()); }
  }, [actionError, dispatch]);

  function handleActSearch(val) {
    setActInput(val);
    clearTimeout(actTimer.current);
    actTimer.current = setTimeout(
      () => dispatch(setRiskAssessmentFilters({ 'filter[activity]': val, page: 1 })),
      400,
    );
  }

  function handleLocSearch(val) {
    setLocInput(val);
    clearTimeout(locTimer.current);
    locTimer.current = setTimeout(
      () => dispatch(setRiskAssessmentFilters({ 'filter[location]': val, page: 1 })),
      400,
    );
  }

  function clearFilters() {
    setActInput('');
    setLocInput('');
    dispatch(setRiskAssessmentFilters({ 'filter[activity]': '', 'filter[location]': '', page: 1 }));
  }

  async function handleSave(payload) {
    const isEdit = !!modal.assessment;
    const result = isEdit
      ? await dispatch(updateRiskAssessment({ id: modal.assessment.id, data: payload }))
      : await dispatch(createRiskAssessment(payload));

    const fulfilled = isEdit
      ? updateRiskAssessment.fulfilled.match(result)
      : createRiskAssessment.fulfilled.match(result);

    if (fulfilled) {
      toast.success(isEdit ? 'Assessment updated.' : 'Assessment created.');
      setModal({ open: false, assessment: null });
      dispatch(fetchRiskAssessments(filters));
    }
  }

  async function handleDelete() {
    if (!deleteTgt) return;
    setDeleting(true);
    const result = await dispatch(deleteRiskAssessment(deleteTgt.id));
    setDeleting(false);
    if (deleteRiskAssessment.fulfilled.match(result)) {
      toast.success('Assessment deleted.');
      setDeleteTgt(null);
    }
  }

  const page       = filters.page;
  const hasFilters = !!(actInput || locInput);

  return (
    <div className="ui-page" style={{ color: 'var(--text)' }}>

      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(217,119,6,.12)' }}
          >
            <ShieldExclamationIcon className="w-5 h-5" style={{ color: '#d97706' }} />
          </div>
          <div>
            <h1 className="text-xl font-bold leading-tight" style={{ color: 'var(--text)' }}>
              Risk Assessments
            </h1>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              {meta
                ? `${meta.total_count ?? meta.total ?? 0} assessment${(meta.total_count ?? meta.total ?? 0) !== 1 ? 's' : ''}`
                : 'Manage risk assessment definitions'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => dispatch(fetchRiskAssessments(filters))}
            disabled={loading}
            className="p-2 rounded-lg hover:opacity-75"
            style={{ color: 'var(--text-muted)' }}
            title="Refresh"
          >
            <ArrowPathIcon className={`h-4 w-4${loading ? ' animate-spin' : ''}`} />
          </button>
          {canWrite && (
            <button
              onClick={() => setModal({ open: true, assessment: null })}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white hover:opacity-90"
              style={{ background: 'var(--accent)' }}
            >
              <PlusIcon className="h-4 w-4" /> New Assessment
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
            placeholder="Filter by activity…"
            value={actInput}
            onChange={(e) => handleActSearch(e.target.value)}
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
            placeholder="Filter by location…"
            value={locInput}
            onChange={(e) => handleLocSearch(e.target.value)}
          />
        </div>
        {hasFilters && (
          <button
            type="button" onClick={clearFilters}
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
              ) : assessments.length === 0 ? (
                <tr>
                  <td
                    colSpan={TABLE_COLS.length}
                    className="ui-td text-center py-12"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    No risk assessments found.
                  </td>
                </tr>
              ) : (
                assessments.map((a, idx) => (
                  <tr key={a.id} className="ui-row">
                    <td className="ui-td" style={{ color: 'var(--text-muted)' }}>
                      {(page - 1) * filters.per_page + idx + 1}
                    </td>
                    <td className="ui-td font-medium">{a.activity}</td>
                    <td className="ui-td">{a.location}</td>
                    <td className="ui-td" style={{ color: 'var(--text-muted)' }}>
                      {formatDate(a.date)}
                    </td>
                    <td
                      className="ui-td"
                      style={{ maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-muted)' }}
                    >
                      {a.note || '—'}
                    </td>
                    <td
                      className="ui-td"
                      style={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                    >
                      <NameList arr={a.safety_officers} />
                    </td>
                    <td
                      className="ui-td"
                      style={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                    >
                      <NameList arr={a.supervisors} />
                    </td>
                    <td className="ui-td text-right">
                      <ActionMenu
                        onView={() => setDetailItem(a)}
                        onEdit={() => setModal({ open: true, assessment: a })}
                        onDelete={() => setDeleteTgt(a)}
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
          onPage={(p) => dispatch(setRiskAssessmentFilters({ page: p }))}
        />
      </div>

      {/* ── Modals & Drawers ── */}
      <RiskAssessmentModal
        open={modal.open}
        assessment={modal.assessment}
        onClose={() => setModal({ open: false, assessment: null })}
        onSave={handleSave}
        saving={actionLoading}
        saveError={actionError}
      />
      <DetailDrawer
        assessment={detailItem}
        onClose={() => setDetailItem(null)}
        onEdit={(a) => { setDetailItem(null); setModal({ open: true, assessment: a }); }}
        canEdit={canWrite}
      />
      <DeleteConfirmModal
        open={!!deleteTgt}
        name={deleteTgt ? `Assessment #${deleteTgt.id} — ${deleteTgt.activity}` : ''}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTgt(null)}
        loading={deleting}
      />
    </div>
  );
}
