/**
 * IncidentNotifications/index.js
 *
 * Full CRUD page for Incident Notifications.
 *
 * Features:
 *  - Paginated table with filters (type, location, date)
 *  - Multi-step create/edit modal
 *      Step 0 — Basic Info  (type, email, location, description, dates)
 *      Step 1 — Reporter    (debounced live search, optional single-select)
 *      Step 2 — Safety Officers (debounced live search, multi-select chips)
 *      Step 3 — Supervisors (debounced live search, multi-select chips)
 *      Step 4 — Review      (rich summary with group cards and readiness banner)
 *  - Right-side detail drawer with inline Witness Statements manager
 *  - Assign safety officers / supervisors from drawer
 *  - Delete confirmation modal
 *  - Permission-gated write actions (incident_notifications.update)
 */
import React, { useEffect, useState, useRef, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  PlusIcon,
  ArrowPathIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PencilSquareIcon,
  TrashIcon,
  FunnelIcon,
  BellAlertIcon,
  MapPinIcon,
  CalendarDaysIcon,
  ClockIcon,
  EnvelopeIcon,
  ShieldCheckIcon,
  UserGroupIcon,
  UserCircleIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import { EllipsisVerticalIcon } from '@heroicons/react/20/solid';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import {
  fetchIncidentNotifications,
  createIncidentNotification,
  updateIncidentNotification,
  deleteIncidentNotification,
  assignIncidentSafetyOfficers,
  assignIncidentSupervisors,
  setIncidentNotificationFilters,
  clearIncidentNotificationErrors,
  selectIncidentNotifications,
  selectIncidentNotificationsMeta,
  selectIncidentNotificationsLoading,
  selectIncidentNotificationsError,
  selectIncidentNotificationsFilters,
  selectIncidentNotificationsActionLoading,
  selectIncidentNotificationsActionError,
} from '../../../store/slices/incidentNotificationSlice';
import { WitnessStatementService } from '../../../services/incidents.service';
import useAuth from '../../../hooks/useAuth';
import UserMultiSelect from '../../HazardRiskManagement/shared/UserMultiSelect';

// ── Constants ──────────────────────────────────────────────────────────────

const INCIDENT_TYPES = [
  'Near Miss', 'Injury', 'Property Damage', 'Fire', 'Environmental',
  'Theft', 'Assault', 'Vehicle Accident', 'Other',
];

const STEPS = ['Basic Info', 'Reporter', 'Safety Officers', 'Supervisors', 'Review'];

const EMPTY_FORM = {
  incident_type: '',
  email: '',
  location: '',
  description: '',
  reporter_id: '',
  time_of_incident: '',
  date_of_incident: '',
  date_of_reporting: '',
};

const EMPTY_PEOPLE = { safety_officers: [], supervisors: [] };

const EMPTY_WITNESS = {
  witness_id: '',
  date_of_statement: '',
  date_of_incident: '',
  time_of_incident: '',
  location_of_incident: '',
  your_involvement: '',
  statement: '',
};

// ── Helpers ────────────────────────────────────────────────────────────────

function formatDate(d) {
  if (!d) return '—';
  try { return new Date(d).toLocaleDateString(); } catch { return d; }
}

function displayName(u) {
  if (!u) return '—';
  return `${u.firstname ?? ''} ${u.lastname ?? ''}`.trim() || u.email || `#${u.id}`;
}

function NameList({ arr }) {
  if (!arr?.length) return <span style={{ color: 'var(--text-muted)' }}>—</span>;
  return <span>{arr.map(displayName).join(', ')}</span>;
}

// ── Reusable UI primitives ─────────────────────────────────────────────────

function ActionMenu({ onView, onEdit, onDelete, canEdit, canDelete }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos]   = useState({ top: 0, right: 0 });
  const btnRef = useRef(null);

  function toggle() {
    if (!open && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      setPos({ top: r.bottom + 4, right: window.innerWidth - r.right });
    }
    setOpen((o) => !o);
  }

  return (
    <div className="relative inline-block text-left">
      <button
        ref={btnRef}
        type="button"
        onClick={toggle}
        className="p-1 rounded hover:opacity-75"
        style={{ color: 'var(--text-muted)' }}
        aria-haspopup="menu"
      >
        <EllipsisVerticalIcon className="h-5 w-5" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="ui-menu fixed z-50" role="menu"
            style={{ top: pos.top, right: pos.right }}>
            <button type="button" role="menuitem" className="ui-menu-item"
              onClick={() => { onView(); setOpen(false); }}>
              View Details
            </button>
            {canEdit && (
              <button type="button" role="menuitem" className="ui-menu-item"
                onClick={() => { onEdit(); setOpen(false); }}>
                Edit
              </button>
            )}
            {canDelete && (
              <>
                <div style={{ borderTop: '1px solid var(--border)', margin: '4px 0' }} />
                <button type="button" role="menuitem" className="ui-menu-item"
                  style={{ color: 'var(--danger)' }}
                  onClick={() => { onDelete(); setOpen(false); }}>
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

function TableSkeleton({ cols }) {
  return Array.from({ length: 5 }).map((_, i) => (
    <tr key={i} className="ui-row animate-pulse">
      {Array.from({ length: cols }).map((__, j) => (
        <td key={j} className="ui-td">
          <div className="h-4 rounded"
            style={{ background: 'var(--border)', width: j === cols - 1 ? 32 : '70%' }} />
        </td>
      ))}
    </tr>
  ));
}

function Pagination({ meta, page, onPage }) {
  if (!meta || (meta.total_pages ?? 1) <= 1) return null;
  return (
    <div className="flex items-center justify-between px-4 py-3"
      style={{ borderTop: '1px solid var(--border)' }}>
      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
        Page {page} of {meta.total_pages} &mdash;{' '}
        {meta.total_count ?? meta.total ?? 0} records
      </p>
      <div className="flex items-center gap-1">
        <button onClick={() => onPage(page - 1)} disabled={page <= 1}
          className="p-1.5 rounded hover:opacity-75 disabled:opacity-30"
          style={{ color: 'var(--text-muted)' }}>
          <ChevronLeftIcon className="h-4 w-4" />
        </button>
        <button onClick={() => onPage(page + 1)} disabled={page >= meta.total_pages}
          className="p-1.5 rounded hover:opacity-75 disabled:opacity-30"
          style={{ color: 'var(--text-muted)' }}>
          <ChevronRightIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function DeleteConfirmModal({ open, name, onConfirm, onCancel, loading }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.55)' }}>
      <div className="ui-card w-full max-w-sm overflow-hidden"
        style={{ border: '1px solid rgba(239,68,68,.25)' }}>

        {/* Top danger band */}
        <div className="px-6 pt-6 pb-5 text-center"
          style={{ borderBottom: '1px solid var(--border)' }}>
          {/* Icon */}
          <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ background: 'rgba(239,68,68,.1)', border: '2px solid rgba(239,68,68,.2)' }}>
            <TrashIcon className="h-7 w-7" style={{ color: '#ef4444' }} />
          </div>

          <h3 className="text-base font-bold mb-1" style={{ color: 'var(--text)' }}>
            Delete Incident Notification
          </h3>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            You are about to permanently delete
          </p>

          {/* Name pill */}
          <div className="inline-flex items-center gap-1.5 mt-2 px-3 py-1.5 rounded-xl"
            style={{ background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.2)' }}>
            <BellAlertIcon className="h-3.5 w-3.5 flex-shrink-0" style={{ color: '#ef4444' }} />
            <span className="text-sm font-semibold" style={{ color: '#ef4444' }}>{name}</span>
          </div>

          <p className="text-xs mt-3" style={{ color: 'var(--text-muted)' }}>
            This action <strong style={{ color: 'var(--text)'}}>cannot be undone.</strong> All associated data including witness statements will be permanently removed.
          </p>
        </div>

        {/* Footer actions */}
        <div className="flex gap-3 px-6 py-4" style={{ background: 'var(--bg-surface)' }}>
          <button type="button" onClick={onCancel} disabled={loading}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold hover:opacity-80 transition-opacity"
            style={{ border: '1px solid var(--border)', color: 'var(--text)', background: 'var(--bg-raised)' }}>
            Keep it
          </button>
          <button type="button" onClick={onConfirm} disabled={loading}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
            style={{ background: loading ? 'rgba(239,68,68,.5)' : '#ef4444' }}>
            {loading
              ? <><ArrowPathIcon className="h-4 w-4 animate-spin" /> Deleting…</>
              : <><TrashIcon className="h-4 w-4" /> Yes, delete</>}
          </button>
        </div>
      </div>
    </div>
  );
}

function FieldError({ msg }) {
  if (!msg) return null;
  return <p className="text-xs mt-1" style={{ color: 'var(--danger)' }}>{msg}</p>;
}

// ── Create / Edit Modal ────────────────────────────────────────────────────

/**
 * Reusable debounced user search panel used for Reporter, Safety Officers, Supervisors.
 * single=true → only one user can be selected (Reporter)
 * single=false → multi-select with chips (Officers / Supervisors)
 */
function UserSearchPanel({
  label, hint, single = false, roleFilter = null,
  selected, onSelect, onRemove, error,
  accentColor = 'var(--accent)',
}) {
  const [query, setQuery]     = useState('');
  const [opts, setOpts]       = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen]       = useState(false);
  const debounceRef           = useRef(null);
  const inputRef              = useRef(null);

  // Clear results when panel becomes irrelevant (e.g. single & already selected)
  useEffect(() => { return () => clearTimeout(debounceRef.current); }, []);

  async function fetchUsers(q) {
    setLoading(true);
    try {
      const params = { per_page: 25 };
      if (q)          params.q                = q;
      if (roleFilter) params['filter[role]']  = roleFilter;
      const res  = await (await import('../../../services/users.service')).default.list(params);
      const list = Array.isArray(res) ? res : (res.data ?? []);
      // filter out already-selected
      const selectedIds = Array.isArray(selected)
        ? selected.map((u) => u.id)
        : selected ? [selected.id] : [];
      setOpts(list.filter((u) => !selectedIds.includes(u.id)));
    } catch (_) {
      setOpts([]);
    } finally {
      setLoading(false);
    }
  }

  function handleInput(val) {
    setQuery(val);
    clearTimeout(debounceRef.current);
    if (val.length >= 1) {
      setOpen(true);
      debounceRef.current = setTimeout(() => fetchUsers(val), 300);
    } else {
      setOpen(false);
      setOpts([]);
    }
  }

  function openDropdown() {
    if (!open) {
      setOpen(true);
      if (!opts.length) fetchUsers(query);
    }
  }

  function pick(u) {
    onSelect(u);
    setQuery('');
    setOpts([]);
    setOpen(false);
  }

  const isAlreadySelected = single
    ? !!selected
    : Array.isArray(selected) && selected.length > 0;

  return (
    <div className="space-y-3">
      {/* Section header */}
      <div className="flex items-start gap-3 pb-3" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="flex-1">
          <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{label}</p>
          {hint && <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{hint}</p>}
        </div>
        {isAlreadySelected && (
          <span className="text-xs px-2 py-0.5 rounded-full font-medium"
            style={{ background: 'rgba(16,185,129,.12)', color: '#10b981' }}>
            {single ? '1 selected' : `${selected.length} selected`}
          </span>
        )}
      </div>

      {/* Search input */}
      {(!single || !selected) && (
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-4 w-4 pointer-events-none"
            style={{ color: 'var(--text-muted)' }} />
          {loading && (
            <ArrowPathIcon className="absolute right-3 top-2.5 h-4 w-4 animate-spin pointer-events-none"
              style={{ color: 'var(--text-muted)' }} />
          )}
          <input
            ref={inputRef}
            type="text"
            className="ui-input w-full pl-9 pr-9"
            placeholder={`Search ${label.toLowerCase()} by name or email…`}
            value={query}
            onChange={(e) => handleInput(e.target.value)}
            onFocus={openDropdown}
          />

          {/* Dropdown */}
          {open && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
              <div className="absolute left-0 right-0 mt-1 z-20 rounded-xl overflow-hidden shadow-lg"
                style={{ background: 'var(--bg-raised)', border: '1px solid var(--border)' }}>
                {loading ? (
                  <div className="px-4 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                    Searching…
                  </div>
                ) : opts.length === 0 ? (
                  <div className="px-4 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                    {query.length >= 1 ? 'No results found' : 'Start typing to search'}
                  </div>
                ) : (
                  <ul className="max-h-52 overflow-y-auto py-1">
                    {opts.map((u) => (
                      <li key={u.id}>
                        <button
                          type="button"
                          className="w-full flex items-center gap-3 px-3 py-2.5 hover:opacity-80 text-left"
                          style={{ background: 'transparent' }}
                          onClick={() => pick(u)}
                        >
                          {/* Avatar initials */}
                          <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold text-white"
                            style={{ background: accentColor }}>
                            {((u.firstname?.[0] ?? '') + (u.lastname?.[0] ?? '')).toUpperCase() ||
                              (u.email?.[0] ?? '?').toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate" style={{ color: 'var(--text)' }}>
                              {displayName(u)}
                            </p>
                            {u.email && (
                              <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                                {u.email}
                              </p>
                            )}
                          </div>
                          {u.role && (
                            <span className="text-xs px-1.5 py-0.5 rounded font-medium flex-shrink-0"
                              style={{ background: 'var(--bg-surface)', color: 'var(--text-muted)' }}>
                              {typeof u.role === 'object' ? (u.role.name ?? u.role.description ?? '') : u.role}
                            </span>
                          )}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Single selection card (Reporter) ── */}
      {single && selected && (
        <div className="flex items-center gap-3 p-3 rounded-xl"
          style={{ background: 'var(--bg-surface)', border: `1px solid var(--border)` }}>
          <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold text-white"
            style={{ background: accentColor }}>
            {((selected.firstname?.[0] ?? '') + (selected.lastname?.[0] ?? '')).toUpperCase() ||
              (selected.email?.[0] ?? '?').toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
              {displayName(selected)}
            </p>
            {selected.email && (
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{selected.email}</p>
            )}
          </div>
          <button type="button" onClick={onRemove}
            className="p-1.5 rounded-lg hover:opacity-75 flex-shrink-0"
            style={{ border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* ── Multi-select chips ── */}
      {!single && Array.isArray(selected) && selected.length > 0 && (
        <div className="space-y-1.5">
          {selected.map((u) => (
            <div key={u.id}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl"
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
              <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold text-white"
                style={{ background: accentColor }}>
                {((u.firstname?.[0] ?? '') + (u.lastname?.[0] ?? '')).toUpperCase() ||
                  (u.email?.[0] ?? '?').toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate" style={{ color: 'var(--text)' }}>
                  {displayName(u)}
                </p>
                {u.email && (
                  <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{u.email}</p>
                )}
              </div>
              <button type="button" onClick={() => onRemove(u.id)}
                className="p-0.5 hover:opacity-75 flex-shrink-0"
                style={{ color: 'var(--danger)' }}>
                <XMarkIcon className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {error && <FieldError msg={error} />}
    </div>
  );
}

function IncidentNotificationModal({ open, record, onClose, onSave, saving, saveError }) {
  const [step, setStep]     = useState(0);
  const [form, setForm]     = useState(EMPTY_FORM);
  const [people, setPeople] = useState(EMPTY_PEOPLE);
  const [errors, setErrors] = useState({});
  const [selectedReporter, setSelectedReporter] = useState(null);

  useEffect(() => {
    if (!open) return;
    setStep(0);
    setErrors({});
    if (record) {
      setForm({
        incident_type:     record.incident_type ?? '',
        email:             record.email ?? '',
        location:          record.location ?? '',
        description:       record.description ?? '',
        reporter_id:       record.reporter_id ?? record.reporter?.id ?? '',
        time_of_incident:  record.time_of_incident ?? '',
        date_of_incident:  record.date_of_incident ?? '',
        date_of_reporting: record.date_of_reporting ?? '',
      });
      setPeople({
        safety_officers: record.safety_officers ?? [],
        supervisors:     record.supervisors ?? [],
      });
      setSelectedReporter(record.reporter ?? null);
    } else {
      setForm(EMPTY_FORM);
      setPeople(EMPTY_PEOPLE);
      setSelectedReporter(null);
    }
  }, [open, record]);

  function setField(k, v) { setForm((f) => ({ ...f, [k]: v })); }

  function selectReporter(u) {
    setSelectedReporter(u);
    setForm((f) => ({ ...f, reporter_id: u.id }));
  }

  function removeReporter() {
    setSelectedReporter(null);
    setForm((f) => ({ ...f, reporter_id: '' }));
  }

  function addOfficer(u) {
    setPeople((p) => ({
      ...p,
      safety_officers: p.safety_officers.find((x) => x.id === u.id)
        ? p.safety_officers
        : [...p.safety_officers, u],
    }));
  }

  function removeOfficer(id) {
    setPeople((p) => ({ ...p, safety_officers: p.safety_officers.filter((u) => u.id !== id) }));
  }

  function addSupervisor(u) {
    setPeople((p) => ({
      ...p,
      supervisors: p.supervisors.find((x) => x.id === u.id)
        ? p.supervisors
        : [...p.supervisors, u],
    }));
  }

  function removeSupervisor(id) {
    setPeople((p) => ({ ...p, supervisors: p.supervisors.filter((u) => u.id !== id) }));
  }

  function validate(s) {
    const errs = {};
    if (s === 0) {
      if (!form.incident_type)        errs.incident_type    = 'Incident type is required';
      if (!form.email.trim())         errs.email            = 'Contact email is required';
      if (!form.location.trim())      errs.location         = 'Location is required';
      if (!form.description.trim())   errs.description      = 'Description is required';
      if (!form.date_of_incident)     errs.date_of_incident = 'Date of incident is required';
      if (!form.date_of_reporting)    errs.date_of_reporting = 'Date of reporting is required';
    }
    if (s === 2) {
      if (!people.safety_officers.length) errs.safety_officers = 'Add at least one safety officer';
    }
    if (s === 3) {
      if (!people.supervisors.length) errs.supervisors = 'Add at least one supervisor';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function next() { if (validate(step)) setStep((s) => s + 1); }
  function back() { setStep((s) => s - 1); }

  function submit() {
    if (!people.safety_officers.length) { setErrors({ safety_officers: 'Add at least one safety officer' }); setStep(2); return; }
    if (!people.supervisors.length) { setErrors({ supervisors: 'Add at least one supervisor' }); setStep(3); return; }
    onSave({
      ...form,
      safety_officer_ids: people.safety_officers.map((u) => u.id),
      supervisor_ids:     people.supervisors.map((u) => u.id),
    });
  }

  if (!open) return null;

  // Step icon indicators
  const STEP_META = [
    { icon: '📋', label: 'Basic Info' },
    { icon: '👤', label: 'Reporter' },
    { icon: '🛡️', label: 'Safety Officers' },
    { icon: '👔', label: 'Supervisors' },
    { icon: '✅', label: 'Review' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.5)' }}>
      <div className="ui-card w-full max-w-xl" style={{ maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>

        {/* ── Modal Header ── */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4"
          style={{ borderBottom: '1px solid var(--border)' }}>
          <div>
            <h2 className="text-base font-semibold" style={{ color: 'var(--text)' }}>
              {record ? 'Edit Incident Notification' : 'New Incident Notification'}
            </h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              Step {step + 1} of {STEPS.length} — {STEPS[step]}
            </p>
          </div>
          <button type="button" onClick={onClose}
            className="p-1.5 rounded hover:opacity-75" style={{ color: 'var(--text-muted)' }}>
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* ── Stepper tabs ── */}
        <div className="flex items-center px-5 py-3 gap-1"
          style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-surface)' }}>
          {STEP_META.map((m, i) => {
            const done    = i < step;
            const active  = i === step;
            return (
              <React.Fragment key={m.label}>
                <div className="flex flex-col items-center gap-0.5" style={{ minWidth: 0 }}>
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all"
                    style={{
                      background: done
                        ? 'rgba(16,185,129,.15)'
                        : active
                        ? 'var(--accent)'
                        : 'var(--border)',
                      color: done
                        ? '#10b981'
                        : active
                        ? '#fff'
                        : 'var(--text-muted)',
                    }}
                  >
                    {done ? '✓' : i + 1}
                  </div>
                  <span
                    className="text-[10px] font-medium text-center leading-tight hidden sm:block"
                    style={{ color: active ? 'var(--accent)' : 'var(--text-muted)', maxWidth: 60 }}
                  >
                    {m.label}
                  </span>
                </div>
                {i < STEP_META.length - 1 && (
                  <div className="flex-1 h-px mx-1 transition-all"
                    style={{ background: i < step ? '#10b981' : 'var(--border)' }} />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">

          {/* Step 0: Basic Info */}
          {step === 0 && (
            <>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>
                  Incident Type <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <select value={form.incident_type}
                  onChange={(e) => setField('incident_type', e.target.value)}
                  className="ui-input w-full">
                  <option value="">Select type…</option>
                  {INCIDENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
                <FieldError msg={errors.incident_type} />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>
                  Contact Email <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <input type="email" className="ui-input w-full"
                  placeholder="reporter@company.com"
                  value={form.email}
                  onChange={(e) => setField('email', e.target.value)} />
                <FieldError msg={errors.email} />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>
                  Location <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <input type="text" className="ui-input w-full"
                  placeholder="Where did the incident occur?"
                  value={form.location}
                  onChange={(e) => setField('location', e.target.value)} />
                <FieldError msg={errors.location} />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>
                  Description <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <textarea rows={3} className="ui-input w-full"
                  placeholder="Briefly describe what happened…"
                  value={form.description}
                  onChange={(e) => setField('description', e.target.value)} />
                <FieldError msg={errors.description} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>
                    Date of Incident <span style={{ color: 'var(--danger)' }}>*</span>
                  </label>
                  <input type="date" className="ui-input w-full"
                    value={form.date_of_incident}
                    onChange={(e) => setField('date_of_incident', e.target.value)} />
                  <FieldError msg={errors.date_of_incident} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>
                    Time of Incident
                  </label>
                  <input type="time" className="ui-input w-full"
                    value={form.time_of_incident}
                    onChange={(e) => setField('time_of_incident', e.target.value)} />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>
                  Date of Reporting <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <input type="date" className="ui-input w-full"
                  value={form.date_of_reporting}
                  onChange={(e) => setField('date_of_reporting', e.target.value)} />
                <FieldError msg={errors.date_of_reporting} />
              </div>
            </>
          )}

          {/* Step 1: Reporter */}
          {step === 1 && (
            <UserSearchPanel
              label="Reporter"
              hint="Search and select the person reporting this incident. Optional — can be left blank."
              single
              selected={selectedReporter}
              onSelect={selectReporter}
              onRemove={removeReporter}
              accentColor="#ef4444"
            />
          )}

          {/* Step 2: Safety Officers */}
          {step === 2 && (
            <UserSearchPanel
              label="Safety Officers"
              hint="Add all safety officers who should be notified of this incident."
              roleFilter="safety_officer"
              selected={people.safety_officers}
              onSelect={addOfficer}
              onRemove={removeOfficer}
              error={errors.safety_officers}
              accentColor="#2563eb"
            />
          )}

          {/* Step 3: Supervisors */}
          {step === 3 && (
            <UserSearchPanel
              label="Supervisors"
              hint="Add all supervisors who should be assigned to this incident."
              roleFilter="supervisor"
              selected={people.supervisors}
              onSelect={addSupervisor}
              onRemove={removeSupervisor}
              error={errors.supervisors}
              accentColor="#7c3aed"
            />
          )}

          {/* Step 4: Review */}
          {step === 4 && (() => {
            const ready = !!(people.safety_officers.length && people.supervisors.length);

            /* Reusable person row for officer / supervisor lists */
            function PersonRow({ user, accentBg, accentText }) {
              const initials = ((user.firstname?.[0] ?? '') + (user.lastname?.[0] ?? '')).toUpperCase() || (user.email?.[0] ?? '?').toUpperCase();
              return (
                <div className="flex items-center gap-3 px-4 py-2.5"
                  style={{ borderTop: '1px solid var(--border)' }}>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold text-white"
                    style={{ background: accentBg }}>
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium leading-snug" style={{ color: 'var(--text)' }}>
                      {displayName(user)}
                    </p>
                    {user.email && (
                      <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{user.email}</p>
                    )}
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
                    style={{ background: `${accentBg}22`, color: accentText }}>
                    {typeof user.role === 'object' ? (user.role?.name ?? '') : (user.role ?? '')}
                  </span>
                </div>
              );
            }

            return (
              <div className="space-y-3">

                {/* ── Hero incident card ── */}
                <div className="rounded-2xl overflow-hidden"
                  style={{ border: '1px solid var(--border)', background: 'var(--bg-raised)' }}>

                  {/* Top colour band */}
                  <div className="px-5 py-4"
                    style={{
                      background: 'linear-gradient(135deg, rgba(239,68,68,.12) 0%, rgba(239,68,68,.04) 100%)',
                      borderBottom: '1px solid var(--border)',
                    }}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ background: 'rgba(239,68,68,.15)' }}>
                          <BellAlertIcon className="h-5 w-5" style={{ color: '#ef4444' }} />
                        </div>
                        <div>
                          <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Incident Type</p>
                          <p className="text-base font-bold" style={{ color: 'var(--text)' }}>
                            {form.incident_type || '—'}
                          </p>
                        </div>
                      </div>
                      <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full flex-shrink-0 mt-0.5"
                        style={{
                          background: record ? 'rgba(245,158,11,.12)' : 'rgba(16,185,129,.12)',
                          color: record ? '#d97706' : '#10b981',
                        }}>
                        {record ? '✎ Editing' : '+ New'}
                      </span>
                    </div>
                  </div>

                  {/* Field rows */}
                  {[
                    { Icon: MapPinIcon,       label: 'Location',          val: form.location,                       color: '#0ea5e9' },
                    { Icon: EnvelopeIcon,     label: 'Contact Email',     val: form.email,                          color: '#8b5cf6' },
                    { Icon: CalendarDaysIcon, label: 'Date of Incident',  val: formatDate(form.date_of_incident),   color: '#ef4444' },
                    { Icon: ClockIcon,        label: 'Time of Incident',  val: form.time_of_incident || '—',        color: '#f59e0b' },
                    { Icon: CalendarDaysIcon, label: 'Date of Reporting', val: formatDate(form.date_of_reporting),  color: '#10b981' },
                    { Icon: UserCircleIcon,   label: 'Reporter',          val: selectedReporter ? displayName(selectedReporter) : '—', color: '#64748b' },
                  ].map(({ Icon, label, val, color }) => (
                    <div key={label} className="flex items-center gap-3 px-4 py-2.5"
                      style={{ borderTop: '1px solid var(--border)' }}>
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: `${color}18` }}>
                        <Icon className="h-3.5 w-3.5" style={{ color }} />
                      </div>
                      <p className="w-32 text-xs flex-shrink-0" style={{ color: 'var(--text-muted)' }}>{label}</p>
                      <p className="flex-1 text-sm font-medium truncate" style={{ color: 'var(--text)' }}>{val || '—'}</p>
                    </div>
                  ))}

                  {/* Description */}
                  {form.description && (
                    <div className="px-4 py-3 flex gap-3"
                      style={{ borderTop: '1px solid var(--border)' }}>
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: 'rgba(71,85,105,.1)' }}>
                        <DocumentTextIcon className="h-3.5 w-3.5" style={{ color: '#64748b' }} />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Description</p>
                        <p className="text-sm" style={{ color: 'var(--text)', lineHeight: 1.7 }}>
                          {form.description}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* ── People grid ── */}
                <div className="grid grid-cols-2 gap-3">

                  {/* Safety Officers */}
                  <div className="rounded-2xl overflow-hidden"
                    style={{ border: '1px solid var(--border)', background: 'var(--bg-raised)', gridColumn: people.supervisors.length === 0 && people.safety_officers.length > 2 ? 'span 2' : undefined }}>
                    <div className="flex items-center gap-2 px-4 py-2.5"
                      style={{ background: 'rgba(37,99,235,.07)', borderBottom: people.safety_officers.length ? '1px solid var(--border)' : 'none' }}>
                      <ShieldCheckIcon className="h-4 w-4" style={{ color: '#2563eb' }} />
                      <p className="text-xs font-semibold" style={{ color: '#2563eb' }}>Safety Officers</p>
                      <span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                        style={{ background: 'rgba(37,99,235,.15)', color: '#2563eb' }}>
                        {people.safety_officers.length}
                      </span>
                    </div>
                    {people.safety_officers.length === 0 ? (
                      <div className="px-4 py-3 flex items-center gap-2">
                        <ExclamationTriangleIcon className="h-3.5 w-3.5 flex-shrink-0" style={{ color: 'var(--danger)' }} />
                        <p className="text-xs" style={{ color: 'var(--danger)' }}>None assigned</p>
                      </div>
                    ) : (
                      <div>
                        {people.safety_officers.map((u) => (
                          <PersonRow key={u.id} user={u} accentBg="#2563eb" accentText="#2563eb" />
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Supervisors */}
                  <div className="rounded-2xl overflow-hidden"
                    style={{ border: '1px solid var(--border)', background: 'var(--bg-raised)' }}>
                    <div className="flex items-center gap-2 px-4 py-2.5"
                      style={{ background: 'rgba(124,58,237,.07)', borderBottom: people.supervisors.length ? '1px solid var(--border)' : 'none' }}>
                      <UserGroupIcon className="h-4 w-4" style={{ color: '#7c3aed' }} />
                      <p className="text-xs font-semibold" style={{ color: '#7c3aed' }}>Supervisors</p>
                      <span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                        style={{ background: 'rgba(124,58,237,.15)', color: '#7c3aed' }}>
                        {people.supervisors.length}
                      </span>
                    </div>
                    {people.supervisors.length === 0 ? (
                      <div className="px-4 py-3 flex items-center gap-2">
                        <ExclamationTriangleIcon className="h-3.5 w-3.5 flex-shrink-0" style={{ color: 'var(--danger)' }} />
                        <p className="text-xs" style={{ color: 'var(--danger)' }}>None assigned</p>
                      </div>
                    ) : (
                      <div>
                        {people.supervisors.map((u) => (
                          <PersonRow key={u.id} user={u} accentBg="#7c3aed" accentText="#7c3aed" />
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* ── Readiness banner ── */}
                <div className="rounded-2xl px-4 py-3 flex items-center gap-3"
                  style={{
                    background: ready ? 'rgba(16,185,129,.06)' : 'rgba(239,68,68,.06)',
                    border: `1px solid ${ready ? 'rgba(16,185,129,.25)' : 'rgba(239,68,68,.25)'}`,
                  }}>
                  {ready
                    ? <CheckCircleIcon className="h-5 w-5 flex-shrink-0" style={{ color: '#10b981' }} />
                    : <ExclamationTriangleIcon className="h-5 w-5 flex-shrink-0" style={{ color: '#ef4444' }} />}
                  <div className="flex-1">
                    <p className="text-xs font-semibold mb-0.5"
                      style={{ color: ready ? '#10b981' : '#ef4444' }}>
                      {ready ? 'All good — ready to submit' : 'Action required'}
                    </p>
                    <p className="text-xs" style={{ color: ready ? '#10b981' : '#ef4444', opacity: 0.8 }}>
                      {ready
                        ? `Review the details above then click "${record ? 'Update Notification' : 'Submit Notification'}" to save.`
                        : 'Go back and assign at least one safety officer and one supervisor.'}
                    </p>
                  </div>
                </div>

                {saveError && (
                  <div className="rounded-2xl px-4 py-3 flex items-center gap-2"
                    style={{ background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.2)' }}>
                    <ExclamationTriangleIcon className="h-4 w-4 flex-shrink-0" style={{ color: '#ef4444' }} />
                    <p className="text-sm" style={{ color: '#ef4444' }}>{saveError}</p>
                  </div>
                )}
              </div>
            );
          })()}
        </div>

        {/* ── Footer ── */}
        <div className="flex justify-between gap-2 p-5"
          style={{ borderTop: '1px solid var(--border)' }}>
          <button type="button" onClick={onClose} disabled={saving}
            className="px-4 py-2 rounded-lg text-sm font-medium hover:opacity-75"
            style={{ border: '1px solid var(--border)', color: 'var(--text)' }}>
            Cancel
          </button>
          <div className="flex gap-2">
            {step > 0 && (
              <button type="button" onClick={back} disabled={saving}
                className="px-4 py-2 rounded-lg text-sm font-medium hover:opacity-75"
                style={{ border: '1px solid var(--border)', color: 'var(--text)' }}>
                Back
              </button>
            )}
            {step < STEPS.length - 1 ? (
              <button type="button" onClick={next}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-white hover:opacity-90"
                style={{ background: 'var(--accent)' }}>
                Next
              </button>
            ) : (
              <button type="button" onClick={submit} disabled={saving}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-white hover:opacity-90"
                style={{
                  background: (people.safety_officers.length && people.supervisors.length)
                    ? 'var(--accent)'
                    : 'var(--border)',
                  color: (people.safety_officers.length && people.supervisors.length) ? '#fff' : 'var(--text-muted)',
                }}>
                {saving ? 'Saving…' : record ? 'Update Notification' : 'Submit Notification'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Witness Statement Modal ────────────────────────────────────────────────

function WitnessModal({ open, notifId, witness, onClose, onSave, saving, saveError }) {
  const [form, setForm] = useState(EMPTY_WITNESS);
  const [errors, setErrors] = useState({});

  // Witness user search
  const [wQuery, setWQuery]     = useState('');
  const [wOpts, setWOpts]       = useState([]);
  const [wOpen, setWOpen]       = useState(false);
  const [selectedW, setSelectedW] = useState(null);
  const wTimer = useRef(null);

  useEffect(() => {
    if (!open) return;
    setErrors({});
    if (witness) {
      setForm({
        witness_id:           witness.witness_id ?? witness.witness?.id ?? '',
        date_of_statement:    witness.date_of_statement ?? '',
        date_of_incident:     witness.date_of_incident ?? '',
        time_of_incident:     witness.time_of_incident ?? '',
        location_of_incident: witness.location_of_incident ?? '',
        your_involvement:     witness.your_involvement ?? '',
        statement:            witness.statement ?? '',
      });
      setSelectedW(witness.witness ?? null);
    } else {
      setForm(EMPTY_WITNESS);
      setSelectedW(null);
    }
  }, [open, witness]);

  async function searchWitnesses(q) {
    try {
      const res = await (await import('../../../services/users.service')).default.list({ q, per_page: 20 });
      const list = Array.isArray(res) ? res : (res.data ?? []);
      setWOpts(list);
    } catch (_) { setWOpts([]); }
  }

  function handleWSearch(val) {
    setWQuery(val);
    clearTimeout(wTimer.current);
    if (val.length >= 1) {
      wTimer.current = setTimeout(() => searchWitnesses(val), 300);
      setWOpen(true);
    } else { setWOpen(false); }
  }

  function setField(k, v) { setForm((f) => ({ ...f, [k]: v })); }

  function validate() {
    const errs = {};
    if (!form.witness_id)                  errs.witness_id = 'Witness is required';
    if (!form.date_of_statement)           errs.date_of_statement = 'Date of statement is required';
    if (!form.date_of_incident)            errs.date_of_incident = 'Date of incident is required';
    if (!form.location_of_incident.trim()) errs.location_of_incident = 'Location is required';
    if (!form.statement.trim())            errs.statement = 'Statement is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function submit() {
    if (validate()) onSave(form);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.5)' }}>
      <div className="ui-card w-full max-w-lg" style={{ maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
        <div className="flex items-center justify-between p-5"
          style={{ borderBottom: '1px solid var(--border)' }}>
          <h2 className="text-base font-semibold" style={{ color: 'var(--text)' }}>
            {witness ? 'Edit Witness Statement' : 'Add Witness Statement'}
          </h2>
          <button type="button" onClick={onClose}
            className="p-1.5 rounded hover:opacity-75" style={{ color: 'var(--text-muted)' }}>
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Witness user search */}
          <div className="relative">
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>
              Witness <span style={{ color: 'var(--danger)' }}>*</span>
            </label>
            {selectedW ? (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg"
                style={{ border: '1px solid var(--border)', background: 'var(--bg-surface)' }}>
                <span className="flex-1 text-sm" style={{ color: 'var(--text)' }}>
                  {displayName(selectedW)}
                </span>
                <button type="button"
                  onClick={() => { setSelectedW(null); setField('witness_id', ''); }}
                  className="p-0.5 hover:opacity-75" style={{ color: 'var(--text-muted)' }}>
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-4 w-4 pointer-events-none"
                  style={{ color: 'var(--text-muted)' }} />
                <input type="text" className="ui-input w-full pl-9"
                  placeholder="Search witness by name…"
                  value={wQuery}
                  onChange={(e) => handleWSearch(e.target.value)}
                  onFocus={() => wQuery && setWOpen(true)} />
              </div>
            )}
            {wOpen && wOpts.length > 0 && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setWOpen(false)} />
                <div className="absolute left-0 right-0 mt-1 z-20 rounded-lg py-1 shadow-lg"
                  style={{ background: 'var(--bg-raised)', border: '1px solid var(--border)' }}>
                  {wOpts.map((u) => (
                    <button key={u.id} type="button"
                      className="w-full text-left px-3 py-2 text-sm hover:opacity-75"
                      style={{ color: 'var(--text)' }}
                      onClick={() => {
                        setSelectedW(u);
                        setField('witness_id', u.id);
                        setWQuery('');
                        setWOpen(false);
                      }}>
                      {displayName(u)}
                    </button>
                  ))}
                </div>
              </>
            )}
            <FieldError msg={errors.witness_id} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>
                Date of Statement <span style={{ color: 'var(--danger)' }}>*</span>
              </label>
              <input type="date" className="ui-input w-full"
                value={form.date_of_statement}
                onChange={(e) => setField('date_of_statement', e.target.value)} />
              <FieldError msg={errors.date_of_statement} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>
                Date of Incident <span style={{ color: 'var(--danger)' }}>*</span>
              </label>
              <input type="date" className="ui-input w-full"
                value={form.date_of_incident}
                onChange={(e) => setField('date_of_incident', e.target.value)} />
              <FieldError msg={errors.date_of_incident} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>
                Time of Incident
              </label>
              <input type="time" className="ui-input w-full"
                value={form.time_of_incident}
                onChange={(e) => setField('time_of_incident', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>
                Location of Incident <span style={{ color: 'var(--danger)' }}>*</span>
              </label>
              <input type="text" className="ui-input w-full"
                placeholder="Where?"
                value={form.location_of_incident}
                onChange={(e) => setField('location_of_incident', e.target.value)} />
              <FieldError msg={errors.location_of_incident} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>
              Your Involvement
            </label>
            <input type="text" className="ui-input w-full"
              placeholder="How were you involved?"
              value={form.your_involvement}
              onChange={(e) => setField('your_involvement', e.target.value)} />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>
              Statement <span style={{ color: 'var(--danger)' }}>*</span>
            </label>
            <textarea rows={4} className="ui-input w-full"
              placeholder="Provide a detailed witness statement…"
              value={form.statement}
              onChange={(e) => setField('statement', e.target.value)} />
            <FieldError msg={errors.statement} />
          </div>

          {saveError && (
            <p className="text-sm" style={{ color: 'var(--danger)' }}>{saveError}</p>
          )}
        </div>

        <div className="flex justify-end gap-2 p-5"
          style={{ borderTop: '1px solid var(--border)' }}>
          <button type="button" onClick={onClose} disabled={saving}
            className="px-4 py-2 rounded-lg text-sm font-medium hover:opacity-75"
            style={{ border: '1px solid var(--border)', color: 'var(--text)' }}>
            Cancel
          </button>
          <button type="button" onClick={submit} disabled={saving}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-white hover:opacity-90"
            style={{ background: 'var(--accent)' }}>
            {saving ? 'Saving…' : witness ? 'Update' : 'Add Statement'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Detail Drawer ──────────────────────────────────────────────────────────

function DetailDrawer({ record, onClose, canEdit, onUpdate }) {
  const dispatch = useAppDispatch();
  const [witnesses, setWitnesses]         = useState([]);
  const [wLoading, setWLoading]           = useState(false);
  const [wModal, setWModal]               = useState(false);
  const [editWitness, setEditWitness]     = useState(null);
  const [wSaving, setWSaving]             = useState(false);
  const [wError, setWError]               = useState(null);
  const [deleteW, setDeleteW]             = useState(null);
  const [deletingW, setDeletingW]         = useState(false);

  // Reassign officers/supervisors
  const [reassignTarget, setReassignTarget] = useState(null); // 'officers' | 'supervisors'
  const [reassignUsers, setReassignUsers]   = useState([]);
  const [reassignSaving, setReassignSaving] = useState(false);
  const [reassignError, setReassignError]   = useState(null);

  async function handleReassign() {
    if (!reassignTarget || !record) return;
    setReassignSaving(true);
    setReassignError(null);
    try {
      let action;
      if (reassignTarget === 'officers') {
        action = await dispatch(assignIncidentSafetyOfficers({
          id: record.id,
          safety_officer_ids: reassignUsers.map((u) => u.id),
        }));
      } else {
        action = await dispatch(assignIncidentSupervisors({
          id: record.id,
          supervisor_ids: reassignUsers.map((u) => u.id),
        }));
      }
      if (action.error) {
        setReassignError(action.payload ?? 'Failed to reassign');
      } else {
        toast.success(reassignTarget === 'officers' ? 'Safety officers updated' : 'Supervisors updated');
        const updated = action.payload?.data ?? action.payload;
        if (updated && onUpdate) onUpdate(updated);
        setReassignTarget(null);
      }
    } finally {
      setReassignSaving(false);
    }
  }

  const loadWitnesses = useCallback(async () => {
    if (!record) return;
    setWLoading(true);
    try {
      const res = await WitnessStatementService.list(record.id);
      const list = Array.isArray(res) ? res : (res.data ?? []);
      setWitnesses(list);
    } catch (_) {
      setWitnesses([]);
    } finally {
      setWLoading(false);
    }
  }, [record]);

  useEffect(() => { loadWitnesses(); }, [loadWitnesses]);

  async function saveWitness(data) {
    setWSaving(true);
    setWError(null);
    try {
      if (editWitness) {
        await WitnessStatementService.update(record.id, editWitness.id, data);
        toast.success('Witness statement updated');
      } else {
        await WitnessStatementService.create(record.id, data);
        toast.success('Witness statement added');
      }
      setWModal(false);
      setEditWitness(null);
      loadWitnesses();
    } catch (err) {
      setWError(err.response?.data?.message ?? 'Failed to save witness statement');
    } finally {
      setWSaving(false);
    }
  }

  async function confirmDeleteWitness() {
    if (!deleteW) return;
    setDeletingW(true);
    try {
      await WitnessStatementService.remove(record.id, deleteW.id);
      toast.success('Witness statement deleted');
      setDeleteW(null);
      loadWitnesses();
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Failed to delete');
    } finally {
      setDeletingW(false);
    }
  }

  if (!record) return null;

  /* Helpers scoped to this render */
  function DrawerPersonRow({ user, accentBg, accentText }) {
    const initials = ((user.firstname?.[0] ?? '') + (user.lastname?.[0] ?? '')).toUpperCase() ||
      (user.email?.[0] ?? '?').toUpperCase();
    return (
      <div className="flex items-center gap-3 px-4 py-2.5"
        style={{ borderTop: '1px solid var(--border)' }}>
        <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold text-white"
          style={{ background: accentBg }}>
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium leading-snug" style={{ color: 'var(--text)' }}>
            {displayName(user)}
          </p>
          {user.email && (
            <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{user.email}</p>
          )}
        </div>
        {user.role && (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
            style={{ background: `${accentBg}22`, color: accentText }}>
            {typeof user.role === 'object' ? (user.role?.name ?? '') : user.role}
          </span>
        )}
      </div>
    );
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-30" style={{ background: 'rgba(0,0,0,0.35)' }}
        onClick={onClose} />

      {/* Drawer panel */}
      <div className="fixed top-0 right-0 bottom-0 z-40 w-full max-w-lg flex flex-col"
        style={{ background: 'var(--bg-raised)', boxShadow: '-4px 0 24px rgba(0,0,0,.15)' }}>

        {/* ── Sticky header ── */}
        <div className="flex-shrink-0 px-5 pt-5 pb-4"
          style={{
            background: 'linear-gradient(135deg, rgba(239,68,68,.1) 0%, rgba(239,68,68,.02) 100%)',
            borderBottom: '1px solid var(--border)',
          }}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(239,68,68,.15)' }}>
                <BellAlertIcon className="h-6 w-6" style={{ color: '#ef4444' }} />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-base font-bold" style={{ color: 'var(--text)' }}>
                    {record.incident_type ?? 'Incident'}
                  </h2>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                    style={{ background: 'rgba(239,68,68,.12)', color: '#ef4444' }}>
                    #{record.id}
                  </span>
                </div>
                <p className="text-xs mt-0.5 flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                  <MapPinIcon className="h-3 w-3 inline-block flex-shrink-0" />
                  {record.location || '—'}
                </p>
              </div>
            </div>
            <button type="button" onClick={onClose}
              className="p-1.5 rounded-lg hover:opacity-75 flex-shrink-0"
              style={{ border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
              <XMarkIcon className="h-4.5 w-4.5" />
            </button>
          </div>
        </div>

        {/* ── Scrollable body ── */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-5 py-4 space-y-4">

            {/* Incident details card */}
            <div className="rounded-2xl overflow-hidden"
              style={{ border: '1px solid var(--border)', background: 'var(--bg-surface)' }}>
              {[
                { Icon: BellAlertIcon,    label: 'Incident Type',    val: record.incident_type,                color: '#ef4444' },
                { Icon: MapPinIcon,       label: 'Location',         val: record.location,                     color: '#0ea5e9' },
                { Icon: EnvelopeIcon,     label: 'Contact Email',    val: record.email,                        color: '#8b5cf6' },
                { Icon: CalendarDaysIcon, label: 'Date of Incident', val: formatDate(record.date_of_incident),  color: '#ef4444' },
                { Icon: ClockIcon,        label: 'Time',             val: record.time_of_incident || '—',      color: '#f59e0b' },
                { Icon: CalendarDaysIcon, label: 'Date Reported',    val: formatDate(record.date_of_reporting), color: '#10b981' },
                ...(record.reporter ? [{ Icon: UserCircleIcon, label: 'Reporter', val: displayName(record.reporter), color: '#64748b' }] : []),
              ].map(({ Icon, label, val, color }, idx) => (
                <div key={label}
                  className="flex items-center gap-3 px-4 py-3"
                  style={{ borderTop: idx === 0 ? 'none' : '1px solid var(--border)' }}>
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: `${color}18` }}>
                    <Icon className="h-3.5 w-3.5" style={{ color }} />
                  </div>
                  <p className="w-32 text-xs flex-shrink-0" style={{ color: 'var(--text-muted)' }}>{label}</p>
                  <p className="flex-1 text-sm font-medium" style={{ color: 'var(--text)' }}>{val || '—'}</p>
                </div>
              ))}

              {/* Description inline */}
              {record.description && (
                <div className="flex gap-3 px-4 py-3" style={{ borderTop: '1px solid var(--border)' }}>
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(100,116,139,.1)' }}>
                    <DocumentTextIcon className="h-3.5 w-3.5" style={{ color: '#64748b' }} />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Description</p>
                    <p className="text-sm" style={{ color: 'var(--text)', lineHeight: 1.7 }}>{record.description}</p>
                  </div>
                </div>
              )}
            </div>

            {/* ── People grid ── */}
            <div className="grid grid-cols-2 gap-3">

              {/* Safety Officers */}
              <div className="rounded-2xl overflow-hidden"
                style={{ border: '1px solid var(--border)', background: 'var(--bg-surface)' }}>
                <div className="flex items-center gap-2 px-4 py-2.5"
                  style={{
                    background: 'rgba(37,99,235,.07)',
                    borderBottom: record.safety_officers?.length ? '1px solid var(--border)' : 'none',
                  }}>
                  <ShieldCheckIcon className="h-4 w-4" style={{ color: '#2563eb' }} />
                  <p className="text-xs font-semibold flex-1" style={{ color: '#2563eb' }}>Safety Officers</p>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                    style={{ background: 'rgba(37,99,235,.15)', color: '#2563eb' }}>
                    {record.safety_officers?.length ?? 0}
                  </span>
                </div>
                {canEdit && (
                  <div className="px-4 py-2" style={{ borderBottom: '1px solid var(--border)' }}>
                    <button type="button"
                      onClick={() => { setReassignTarget('officers'); setReassignUsers(record.safety_officers ?? []); setReassignError(null); }}
                      className="w-full text-xs font-semibold py-1 rounded-lg hover:opacity-80"
                      style={{ background: 'rgba(37,99,235,.1)', color: '#2563eb' }}>
                      Reassign
                    </button>
                  </div>
                )}
                {record.safety_officers?.length ? (
                  record.safety_officers.map((u) => (
                    <DrawerPersonRow key={u.id} user={u} accentBg="#2563eb" accentText="#2563eb" />
                  ))
                ) : (
                  <div className="px-4 py-3 flex items-center gap-2">
                    <ExclamationTriangleIcon className="h-3.5 w-3.5" style={{ color: 'var(--text-muted)' }} />
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>None assigned</p>
                  </div>
                )}
              </div>

              {/* Supervisors */}
              <div className="rounded-2xl overflow-hidden"
                style={{ border: '1px solid var(--border)', background: 'var(--bg-surface)' }}>
                <div className="flex items-center gap-2 px-4 py-2.5"
                  style={{
                    background: 'rgba(124,58,237,.07)',
                    borderBottom: record.supervisors?.length ? '1px solid var(--border)' : 'none',
                  }}>
                  <UserGroupIcon className="h-4 w-4" style={{ color: '#7c3aed' }} />
                  <p className="text-xs font-semibold flex-1" style={{ color: '#7c3aed' }}>Supervisors</p>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                    style={{ background: 'rgba(124,58,237,.15)', color: '#7c3aed' }}>
                    {record.supervisors?.length ?? 0}
                  </span>
                </div>
                {canEdit && (
                  <div className="px-4 py-2" style={{ borderBottom: '1px solid var(--border)' }}>
                    <button type="button"
                      onClick={() => { setReassignTarget('supervisors'); setReassignUsers(record.supervisors ?? []); setReassignError(null); }}
                      className="w-full text-xs font-semibold py-1 rounded-lg hover:opacity-80"
                      style={{ background: 'rgba(124,58,237,.1)', color: '#7c3aed' }}>
                      Reassign
                    </button>
                  </div>
                )}
                {record.supervisors?.length ? (
                  record.supervisors.map((u) => (
                    <DrawerPersonRow key={u.id} user={u} accentBg="#7c3aed" accentText="#7c3aed" />
                  ))
                ) : (
                  <div className="px-4 py-3 flex items-center gap-2">
                    <ExclamationTriangleIcon className="h-3.5 w-3.5" style={{ color: 'var(--text-muted)' }} />
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>None assigned</p>
                  </div>
                )}
              </div>
            </div>

            {/* ── Witness Statements ── */}
            <div className="rounded-2xl overflow-hidden"
              style={{ border: '1px solid var(--border)', background: 'var(--bg-surface)' }}>
              {/* Section header */}
              <div className="flex items-center gap-2 px-4 py-3"
                style={{ background: 'rgba(245,158,11,.07)', borderBottom: '1px solid var(--border)' }}>
                <div className="w-6 h-6 rounded-lg flex items-center justify-center"
                  style={{ background: 'rgba(245,158,11,.2)' }}>
                  <DocumentTextIcon className="h-3.5 w-3.5" style={{ color: '#d97706' }} />
                </div>
                <p className="text-xs font-semibold flex-1" style={{ color: '#d97706' }}>
                  Witness Statements
                </p>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                  style={{ background: 'rgba(245,158,11,.2)', color: '#d97706' }}>
                  {witnesses.length}
                </span>
                {canEdit && (
                  <button type="button"
                    onClick={() => { setEditWitness(null); setWModal(true); }}
                    className="flex items-center gap-1 ml-1 px-2.5 py-1 rounded-lg text-xs font-semibold hover:opacity-90"
                    style={{ background: 'var(--accent)', color: '#fff' }}>
                    <PlusIcon className="h-3 w-3" />
                    Add
                  </button>
                )}
              </div>

              {/* Witness list */}
              {wLoading ? (
                <div className="p-4 space-y-2">
                  {[1, 2].map((i) => (
                    <div key={i} className="h-16 rounded-xl animate-pulse"
                      style={{ background: 'var(--bg-raised)' }} />
                  ))}
                </div>
              ) : witnesses.length === 0 ? (
                <div className="px-4 py-6 text-center">
                  <DocumentTextIcon className="h-8 w-8 mx-auto mb-2 opacity-30" style={{ color: 'var(--text-muted)' }} />
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>No witness statements yet.</p>
                  {canEdit && (
                    <button type="button"
                      onClick={() => { setEditWitness(null); setWModal(true); }}
                      className="mt-3 text-xs font-semibold hover:opacity-75"
                      style={{ color: 'var(--accent)' }}>
                      + Add the first one
                    </button>
                  )}
                </div>
              ) : (
                <div className="divide-y" style={{ '--tw-divide-opacity': 1, borderColor: 'var(--border)' }}>
                  {witnesses.map((w, idx) => (
                    <div key={w.id} className="px-4 py-3"
                      style={{ borderTop: idx === 0 ? 'none' : '1px solid var(--border)' }}>
                      <div className="flex items-start gap-3">
                        {/* Avatar */}
                        <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold text-white mt-0.5"
                          style={{ background: '#d97706' }}>
                          {((w.witness?.firstname?.[0] ?? '') + (w.witness?.lastname?.[0] ?? '')).toUpperCase() || '?'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
                              {displayName(w.witness ?? {})}
                            </p>
                            {w.date_of_statement && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full flex-shrink-0"
                                style={{ background: 'var(--bg-raised)', color: 'var(--text-muted)' }}>
                                {formatDate(w.date_of_statement)}
                              </span>
                            )}
                          </div>
                          {w.location_of_incident && (
                            <p className="text-xs mt-0.5 flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                              <MapPinIcon className="h-3 w-3 flex-shrink-0" />
                              {w.location_of_incident}
                            </p>
                          )}
                          {w.statement && (
                            <p className="text-xs mt-1.5 leading-relaxed line-clamp-3" style={{ color: 'var(--text)' }}>
                              {w.statement}
                            </p>
                          )}
                        </div>
                        {canEdit && (
                          <div className="flex gap-1 flex-shrink-0">
                            <button type="button"
                              onClick={() => { setEditWitness(w); setWModal(true); }}
                              className="p-1.5 rounded-lg hover:opacity-75"
                              style={{ border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                              <PencilSquareIcon className="h-3.5 w-3.5" />
                            </button>
                            <button type="button"
                              onClick={() => setDeleteW(w)}
                              className="p-1.5 rounded-lg hover:opacity-75"
                              style={{ border: '1px solid rgba(239,68,68,.3)', color: 'var(--danger)' }}>
                              <TrashIcon className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* Witness Modal */}
      <WitnessModal
        open={wModal}
        notifId={record.id}
        witness={editWitness}
        onClose={() => { setWModal(false); setEditWitness(null); setWError(null); }}
        onSave={saveWitness}
        saving={wSaving}
        saveError={wError}
      />

      {/* Delete Witness Confirm */}
      <DeleteConfirmModal
        open={!!deleteW}
        name={deleteW ? `${displayName(deleteW.witness ?? {})} statement` : ''}
        onConfirm={confirmDeleteWitness}
        onCancel={() => setDeleteW(null)}
        loading={deletingW}
      />

      {/* Reassign Officers / Supervisors Modal */}
      {reassignTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="ui-card w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold" style={{ color: 'var(--text)' }}>
                Reassign {reassignTarget === 'officers' ? 'Safety Officers' : 'Supervisors'}
              </h3>
              <button type="button" onClick={() => setReassignTarget(null)}
                className="p-1 rounded hover:opacity-75" style={{ color: 'var(--text-muted)' }}>
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <UserMultiSelect
              label={reassignTarget === 'officers' ? 'Safety Officers' : 'Supervisors'}
              roleFilter={reassignTarget === 'officers' ? 'safety_officer' : 'supervisor'}
              value={reassignUsers}
              onChange={setReassignUsers}
              error={reassignError}
            />
            {reassignError && (
              <p className="text-sm" style={{ color: 'var(--danger)' }}>{reassignError}</p>
            )}
            <div className="flex justify-end gap-2 pt-1">
              <button type="button" onClick={() => setReassignTarget(null)} disabled={reassignSaving}
                className="px-4 py-2 rounded-lg text-sm font-medium hover:opacity-75"
                style={{ border: '1px solid var(--border)', color: 'var(--text)' }}>
                Cancel
              </button>
              <button type="button" onClick={handleReassign} disabled={reassignSaving}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-white hover:opacity-90"
                style={{ background: 'var(--accent)' }}>
                {reassignSaving ? 'Saving…' : 'Update'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────

const TABLE_COLS = ['#', 'Type', 'Location', 'Date of Incident', 'Reporter', 'Officers', 'Supervisors', 'Witnesses', ''];

export default function IncidentNotificationsPage() {
  const dispatch    = useAppDispatch();
  const { hasPermission } = useAuth();
  const canEdit = hasPermission('incident_notifications.update');

  const items         = useAppSelector(selectIncidentNotifications);
  const meta          = useAppSelector(selectIncidentNotificationsMeta);
  const loading       = useAppSelector(selectIncidentNotificationsLoading);
  const error         = useAppSelector(selectIncidentNotificationsError);
  const filters       = useAppSelector(selectIncidentNotificationsFilters);
  const actionLoading = useAppSelector(selectIncidentNotificationsActionLoading);
  const actionError   = useAppSelector(selectIncidentNotificationsActionError);

  const [modal, setModal]         = useState(false);
  const [editRecord, setEditRecord] = useState(null);
  const [drawerRecord, setDrawerRecord] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [showFilters, setShowFilters]   = useState(false);

  const filterTimer = useRef(null);

  const load = useCallback(
    () => dispatch(fetchIncidentNotifications(filters)),
    [dispatch, filters]
  );

  useEffect(() => { load(); }, [load]);

  function updateFilter(key, val) {
    dispatch(setIncidentNotificationFilters({ [key]: val, page: 1 }));
  }

  function handleFilterChange(key, val) {
    clearTimeout(filterTimer.current);
    filterTimer.current = setTimeout(() => updateFilter(key, val), 400);
  }

  function openCreate() {
    dispatch(clearIncidentNotificationErrors());
    setEditRecord(null);
    setModal(true);
  }

  function openEdit(record) {
    dispatch(clearIncidentNotificationErrors());
    setEditRecord(record);
    setModal(true);
  }

  async function handleSave(payload) {
    let action;
    if (editRecord) {
      action = await dispatch(updateIncidentNotification({ id: editRecord.id, data: payload }));
    } else {
      action = await dispatch(createIncidentNotification(payload));
    }
    if (!action.error) {
      toast.success(editRecord ? 'Notification updated' : 'Notification created');
      setModal(false);
      setEditRecord(null);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    const action = await dispatch(deleteIncidentNotification(deleteTarget.id));
    if (!action.error) {
      toast.success('Notification deleted');
      setDeleteTarget(null);
    } else {
      toast.error(actionError ?? 'Delete failed');
    }
  }

  const page = filters.page ?? 1;

  return (
    <div className="ui-page" style={{ color: 'var(--text)' }}>

      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(239,68,68,.12)' }}>
            <BellAlertIcon className="h-6 w-6" style={{ color: '#ef4444' }} />
          </div>
          <div>
            <h1 className="text-xl font-bold" style={{ color: 'var(--text)' }}>
              Incident Notifications
            </h1>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {meta?.total_count ?? '—'} total records
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button type="button" onClick={() => setShowFilters((f) => !f)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium hover:opacity-75"
            style={{ border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
            <FunnelIcon className="h-4 w-4" />
            Filters
          </button>
          <button type="button" onClick={load} disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium hover:opacity-75"
            style={{ border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
            <ArrowPathIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          {canEdit && (
            <button type="button" onClick={openCreate}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white hover:opacity-90"
              style={{ background: '#ef4444' }}>
              <PlusIcon className="h-4 w-4" />
              New Notification
            </button>
          )}
        </div>
      </div>

      {/* ── Filters ── */}
      {showFilters && (
        <div className="ui-card p-4 mb-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-4 w-4 pointer-events-none"
              style={{ color: 'var(--text-muted)' }} />
            <input type="text" className="ui-input w-full pl-9" placeholder="Search type…"
              defaultValue={filters['filter[incident_type]']}
              onChange={(e) => handleFilterChange('filter[incident_type]', e.target.value)} />
          </div>
          <input type="text" className="ui-input w-full" placeholder="Filter by location…"
            defaultValue={filters['filter[location]']}
            onChange={(e) => handleFilterChange('filter[location]', e.target.value)} />
          <input type="date" className="ui-input w-full"
            defaultValue={filters['filter[date_of_incident]']}
            onChange={(e) => handleFilterChange('filter[date_of_incident]', e.target.value)} />
        </div>
      )}

      {/* ── Error Banner ── */}
      {error && (
        <div className="rounded-xl px-4 py-3 mb-5 text-sm"
          style={{ background: 'rgba(239,68,68,.08)', color: '#ef4444', border: '1px solid rgba(239,68,68,.2)' }}>
          {error}
        </div>
      )}

      {/* ── Table ── */}
      <div className="ui-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                {TABLE_COLS.map((col) => (
                  <th key={col} className="ui-th">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableSkeleton cols={TABLE_COLS.length} />
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={TABLE_COLS.length} className="ui-td text-center py-12">
                    <BellAlertIcon className="h-8 w-8 mx-auto mb-2 opacity-30"
                      style={{ color: 'var(--text-muted)' }} />
                    <p style={{ color: 'var(--text-muted)' }}>No incident notifications found</p>
                  </td>
                </tr>
              ) : (
                items.map((item, idx) => (
                  <tr key={item.id} className="ui-row">
                    <td className="ui-td" style={{ color: 'var(--text-muted)' }}>
                      {(page - 1) * (filters.per_page ?? 10) + idx + 1}
                    </td>
                    <td className="ui-td">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                        style={{ background: 'rgba(239,68,68,.1)', color: '#dc2626' }}>
                        {item.incident_type ?? '—'}
                      </span>
                    </td>
                    <td className="ui-td" style={{ color: 'var(--text)' }}>
                      {item.location ?? '—'}
                    </td>
                    <td className="ui-td" style={{ color: 'var(--text-muted)' }}>
                      {formatDate(item.date_of_incident)}
                    </td>
                    <td className="ui-td">
                      {item.reporter ? (
                        <span className="text-xs" style={{ color: 'var(--text)' }}>
                          {displayName(item.reporter)}
                        </span>
                      ) : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                    </td>
                    <td className="ui-td text-xs">
                      <NameList arr={item.safety_officers} />
                    </td>
                    <td className="ui-td text-xs">
                      <NameList arr={item.supervisors} />
                    </td>
                    <td className="ui-td">
                      <span className="text-xs font-medium"
                        style={{ color: 'var(--text-muted)' }}>
                        {item.witness_statements_count ?? item.witness_statements?.length ?? 0}
                      </span>
                    </td>
                    <td className="ui-td">
                      <ActionMenu
                        onView={() => setDrawerRecord(item)}
                        onEdit={() => openEdit(item)}
                        onDelete={() => setDeleteTarget(item)}
                        canEdit={canEdit}
                        canDelete={canEdit}
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
          onPage={(p) => dispatch(setIncidentNotificationFilters({ page: p }))}
        />
      </div>

      {/* ── Modals  ── */}
      <IncidentNotificationModal
        open={modal}
        record={editRecord}
        onClose={() => { setModal(false); setEditRecord(null); }}
        onSave={handleSave}
        saving={actionLoading}
        saveError={actionError}
      />

      <DeleteConfirmModal
        open={!!deleteTarget}
        name={deleteTarget?.incident_type ?? 'this notification'}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={actionLoading}
      />

      <DetailDrawer
        record={drawerRecord}
        onClose={() => setDrawerRecord(null)}
        canEdit={canEdit}
        onUpdate={(updated) => setDrawerRecord(updated)}
      />
    </div>
  );
}
