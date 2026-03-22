/**
 * IncidentNotifications/index.js
 *
 * Full CRUD page for Incident Notifications.
 *
 * Features:
 *  - Paginated table with filters (type, location, date)
 *  - Multi-step create/edit modal
 *      Step 0 — Basic Info  (type, email, location, description, reporter, dates)
 *      Step 1 — Assign People (safety officers + supervisors via UserMultiSelect)
 *      Step 2 — Review
 *  - Right-side detail drawer with inline Witness Statements manager
 *  - Assign safety officers / supervisors from drawer
 *  - Delete confirmation modal
 *  - Permission-gated write actions (incident_notifications.update)
 */
import { useEffect, useState, useRef, useCallback } from 'react';
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
} from '@heroicons/react/24/outline';
import { EllipsisVerticalIcon } from '@heroicons/react/20/solid';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import {
  fetchIncidentNotifications,
  createIncidentNotification,
  updateIncidentNotification,
  deleteIncidentNotification,
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

const STEPS = ['Basic Info', 'Assign People', 'Review'];

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
  return (
    <div className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="p-1 rounded hover:opacity-75"
        style={{ color: 'var(--text-muted)' }}
        aria-haspopup="menu"
      >
        <EllipsisVerticalIcon className="h-5 w-5" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="ui-menu absolute right-0 mt-1 z-50" role="menu">
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
      style={{ background: 'rgba(0,0,0,0.5)' }}>
      <div className="ui-card max-w-sm w-full p-6 space-y-4">
        <h3 className="text-base font-semibold" style={{ color: 'var(--text)' }}>
          Delete Incident Notification
        </h3>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Are you sure you want to delete{' '}
          <strong style={{ color: 'var(--text)' }}>{name}</strong>?
          This cannot be undone.
        </p>
        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onCancel} disabled={loading}
            className="px-4 py-2 rounded-lg text-sm font-medium hover:opacity-75"
            style={{ border: '1px solid var(--border)', color: 'var(--text)' }}>
            Cancel
          </button>
          <button type="button" onClick={onConfirm} disabled={loading}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-white hover:opacity-90"
            style={{ background: 'var(--danger)' }}>
            {loading ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}

function ReviewRow({ label, value }) {
  return (
    <div className="flex gap-3">
      <span className="text-xs font-medium w-36 flex-shrink-0"
        style={{ color: 'var(--text-muted)' }}>{label}</span>
      <span className="text-xs flex-1" style={{ color: 'var(--text)' }}>{value || '—'}</span>
    </div>
  );
}

function FieldError({ msg }) {
  if (!msg) return null;
  return <p className="text-xs mt-1" style={{ color: 'var(--danger)' }}>{msg}</p>;
}

// ── Create / Edit Modal ────────────────────────────────────────────────────

function IncidentNotificationModal({ open, record, onClose, onSave, saving, saveError, users }) {
  const [step, setStep]     = useState(0);
  const [form, setForm]     = useState(EMPTY_FORM);
  const [people, setPeople] = useState(EMPTY_PEOPLE);
  const [errors, setErrors] = useState({});

  // Reporter search state
  const [reporterQuery, setReporterQuery]   = useState('');
  const [reporterOpts, setReporterOpts]     = useState([]);
  const [reporterOpen, setReporterOpen]     = useState(false);
  const [selectedReporter, setSelectedReporter] = useState(null);
  const reporterTimer = useRef(null);

  useEffect(() => {
    if (!open) return;
    setStep(0);
    setErrors({});
    if (record) {
      setForm({
        incident_type:    record.incident_type ?? '',
        email:            record.email ?? '',
        location:         record.location ?? '',
        description:      record.description ?? '',
        reporter_id:      record.reporter_id ?? record.reporter?.id ?? '',
        time_of_incident: record.time_of_incident ?? '',
        date_of_incident: record.date_of_incident ?? '',
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

  async function searchReporters(q) {
    try {
      const res = await (await import('../../../services/users.service')).default.list({ q, per_page: 20 });
      const list = Array.isArray(res) ? res : (res.data ?? []);
      setReporterOpts(list);
    } catch (_) { setReporterOpts([]); }
  }

  function handleReporterSearch(val) {
    setReporterQuery(val);
    clearTimeout(reporterTimer.current);
    if (val.length >= 1) {
      reporterTimer.current = setTimeout(() => searchReporters(val), 300);
      setReporterOpen(true);
    } else {
      setReporterOpen(false);
    }
  }

  function selectReporter(u) {
    setSelectedReporter(u);
    setForm((f) => ({ ...f, reporter_id: u.id }));
    setReporterQuery('');
    setReporterOpen(false);
  }

  function setField(k, v) { setForm((f) => ({ ...f, [k]: v })); }

  function validate(s) {
    const errs = {};
    if (s === 0) {
      if (!form.incident_type)        errs.incident_type   = 'Type is required';
      if (!form.location.trim())      errs.location        = 'Location is required';
      if (!form.description.trim())   errs.description     = 'Description is required';
      if (!form.date_of_incident)     errs.date_of_incident = 'Date of incident is required';
      if (!form.date_of_reporting)    errs.date_of_reporting = 'Date of reporting is required';
    }
    if (s === 1) {
      if (!people.safety_officers.length) errs.safety_officers = 'At least one safety officer required';
      if (!people.supervisors.length)     errs.supervisors     = 'At least one supervisor required';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function next() { if (validate(step)) setStep((s) => s + 1); }
  function back() { setStep((s) => s - 1); }

  function submit() {
    const errs = {};
    if (!people.safety_officers.length) errs.safety_officers = 'At least one safety officer required';
    if (!people.supervisors.length)     errs.supervisors     = 'At least one supervisor required';
    if (Object.keys(errs).length) { setErrors(errs); setStep(1); return; }

    onSave({
      ...form,
      safety_officer_ids: people.safety_officers.map((u) => u.id),
      supervisor_ids:     people.supervisors.map((u) => u.id),
    });
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.5)' }}>
      <div className="ui-card w-full max-w-xl" style={{ maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>

        {/* Header */}
        <div className="flex items-center justify-between p-5"
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

        {/* Step indicators */}
        <div className="flex gap-1 px-5 pt-4">
          {STEPS.map((s, i) => (
            <div key={s} className="flex-1 h-1 rounded-full transition-all"
              style={{ background: i <= step ? 'var(--accent)' : 'var(--border)' }} />
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">

          {/* ── Step 0: Basic Info ── */}
          {step === 0 && (
            <>
              {/* Incident Type */}
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>
                  Incident Type <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <select
                  value={form.incident_type}
                  onChange={(e) => setField('incident_type', e.target.value)}
                  className="ui-input w-full"
                >
                  <option value="">Select type…</option>
                  {INCIDENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
                <FieldError msg={errors.incident_type} />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>
                  Contact Email
                </label>
                <input type="email" className="ui-input w-full"
                  placeholder="reporter@company.com"
                  value={form.email}
                  onChange={(e) => setField('email', e.target.value)} />
              </div>

              {/* Location */}
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

              {/* Description */}
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

              {/* Reporter */}
              <div className="relative">
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>
                  Reporter
                </label>
                {selectedReporter ? (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg"
                    style={{ border: '1px solid var(--border)', background: 'var(--bg-surface)' }}>
                    <span className="flex-1 text-sm" style={{ color: 'var(--text)' }}>
                      {displayName(selectedReporter)}
                    </span>
                    <button type="button"
                      onClick={() => { setSelectedReporter(null); setField('reporter_id', ''); }}
                      className="p-0.5 hover:opacity-75" style={{ color: 'var(--text-muted)' }}>
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-4 w-4 pointer-events-none"
                      style={{ color: 'var(--text-muted)' }} />
                    <input type="text" className="ui-input w-full pl-9"
                      placeholder="Search by name or email…"
                      value={reporterQuery}
                      onChange={(e) => handleReporterSearch(e.target.value)}
                      onFocus={() => reporterQuery && setReporterOpen(true)} />
                  </div>
                )}
                {reporterOpen && reporterOpts.length > 0 && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setReporterOpen(false)} />
                    <div className="absolute left-0 right-0 mt-1 z-20 rounded-lg py-1 shadow-lg"
                      style={{ background: 'var(--bg-raised)', border: '1px solid var(--border)' }}>
                      {reporterOpts.map((u) => (
                        <button key={u.id} type="button"
                          className="w-full text-left px-3 py-2 text-sm hover:opacity-75"
                          style={{ color: 'var(--text)' }}
                          onClick={() => selectReporter(u)}>
                          {displayName(u)}
                          {u.email && <span className="ml-2 text-xs" style={{ color: 'var(--text-muted)' }}>{u.email}</span>}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Dates */}
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

          {/* ── Step 1: Assign People ── */}
          {step === 1 && (
            <>
              <UserMultiSelect
                label="Safety Officers"
                roleFilter="safety_officer"
                value={people.safety_officers}
                onChange={(v) => setPeople((p) => ({ ...p, safety_officers: v }))}
                error={errors.safety_officers}
              />
              <UserMultiSelect
                label="Supervisors"
                roleFilter="supervisor"
                value={people.supervisors}
                onChange={(v) => setPeople((p) => ({ ...p, supervisors: v }))}
                error={errors.supervisors}
              />
            </>
          )}

          {/* ── Step 2: Review ── */}
          {step === 2 && (
            <div className="space-y-2 rounded-xl p-4"
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
              <ReviewRow label="Type"            value={form.incident_type} />
              <ReviewRow label="Email"           value={form.email} />
              <ReviewRow label="Location"        value={form.location} />
              <ReviewRow label="Description"     value={form.description} />
              <ReviewRow label="Reporter"        value={selectedReporter ? displayName(selectedReporter) : form.reporter_id} />
              <ReviewRow label="Date of Incident" value={formatDate(form.date_of_incident)} />
              <ReviewRow label="Time"            value={form.time_of_incident} />
              <ReviewRow label="Date Reported"   value={formatDate(form.date_of_reporting)} />
              <ReviewRow label="Safety Officers" value={people.safety_officers.map(displayName).join(', ')} />
              <ReviewRow label="Supervisors"     value={people.supervisors.map(displayName).join(', ')} />
            </div>
          )}

          {saveError && (
            <p className="text-sm" style={{ color: 'var(--danger)' }}>{saveError}</p>
          )}
        </div>

        {/* Footer */}
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
                style={{ background: 'var(--accent)' }}>
                {saving ? 'Saving…' : record ? 'Update' : 'Create'}
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

function DetailDrawer({ record, onClose, canEdit }) {
  const [witnesses, setWitnesses]         = useState([]);
  const [wLoading, setWLoading]           = useState(false);
  const [wModal, setWModal]               = useState(false);
  const [editWitness, setEditWitness]     = useState(null);
  const [wSaving, setWSaving]             = useState(false);
  const [wError, setWError]               = useState(null);
  const [deleteW, setDeleteW]             = useState(null);
  const [deletingW, setDeletingW]         = useState(false);

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

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-30" style={{ background: 'rgba(0,0,0,0.3)' }}
        onClick={onClose} />

      {/* Drawer */}
      <div className="fixed top-0 right-0 bottom-0 z-40 w-full max-w-lg overflow-y-auto"
        style={{ background: 'var(--bg-raised)', boxShadow: 'var(--shadow-md)' }}>

        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between px-6 py-4 z-10"
          style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-raised)' }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(239,68,68,.12)' }}>
              <BellAlertIcon className="h-5 w-5" style={{ color: '#ef4444' }} />
            </div>
            <div>
              <h2 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
                {record.incident_type ?? 'Incident'}
              </h2>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                #{record.id} · {record.location}
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose}
            className="p-1.5 rounded hover:opacity-75" style={{ color: 'var(--text-muted)' }}>
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Incident details */}
        <div className="px-6 py-5 space-y-4">
          <div className="rounded-xl p-4 space-y-2"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
            <DetailRow label="Type"              value={record.incident_type} />
            <DetailRow label="Email"             value={record.email} />
            <DetailRow label="Location"          value={record.location} />
            <DetailRow label="Date of Incident"  value={formatDate(record.date_of_incident)} />
            <DetailRow label="Time"              value={record.time_of_incident || '—'} />
            <DetailRow label="Date Reported"     value={formatDate(record.date_of_reporting)} />
            {record.reporter && (
              <DetailRow label="Reporter"        value={displayName(record.reporter)} />
            )}
          </div>

          {record.description && (
            <div className="rounded-xl p-4"
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
              <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>
                Description
              </p>
              <p className="text-sm" style={{ color: 'var(--text)' }}>{record.description}</p>
            </div>
          )}

          {/* Safety Officers */}
          <div>
            <p className="text-xs font-medium uppercase tracking-wider mb-2"
              style={{ color: 'var(--text-muted)' }}>Safety Officers</p>
            {record.safety_officers?.length ? (
              <div className="flex flex-wrap gap-2">
                {record.safety_officers.map((u) => (
                  <span key={u.id}
                    className="text-xs px-2.5 py-1 rounded-full font-medium"
                    style={{ background: 'rgba(37,99,235,.1)', color: '#2563eb' }}>
                    {displayName(u)}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>None assigned</p>
            )}
          </div>

          {/* Supervisors */}
          <div>
            <p className="text-xs font-medium uppercase tracking-wider mb-2"
              style={{ color: 'var(--text-muted)' }}>Supervisors</p>
            {record.supervisors?.length ? (
              <div className="flex flex-wrap gap-2">
                {record.supervisors.map((u) => (
                  <span key={u.id}
                    className="text-xs px-2.5 py-1 rounded-full font-medium"
                    style={{ background: 'rgba(124,58,237,.1)', color: '#7c3aed' }}>
                    {displayName(u)}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>None assigned</p>
            )}
          </div>

          {/* ── Witness Statements ── */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold uppercase tracking-wider"
                style={{ color: 'var(--text-muted)' }}>
                Witness Statements ({witnesses.length})
              </p>
              {canEdit && (
                <button type="button"
                  onClick={() => { setEditWitness(null); setWModal(true); }}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium hover:opacity-90"
                  style={{ background: 'var(--accent)', color: '#fff' }}>
                  <PlusIcon className="h-3.5 w-3.5" />
                  Add
                </button>
              )}
            </div>

            {wLoading ? (
              <div className="space-y-2">
                {[1, 2].map((i) => (
                  <div key={i} className="h-16 rounded-xl animate-pulse"
                    style={{ background: 'var(--bg-surface)' }} />
                ))}
              </div>
            ) : witnesses.length === 0 ? (
              <div className="rounded-xl p-4 text-center"
                style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  No witness statements yet.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {witnesses.map((w) => (
                  <div key={w.id}
                    className="rounded-xl p-4"
                    style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold" style={{ color: 'var(--text)' }}>
                          {displayName(w.witness ?? {})}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                          {formatDate(w.date_of_statement)} · {w.location_of_incident}
                        </p>
                        <p className="text-xs mt-1 line-clamp-2" style={{ color: 'var(--text)' }}>
                          {w.statement}
                        </p>
                      </div>
                      {canEdit && (
                        <div className="flex gap-1 flex-shrink-0">
                          <button type="button"
                            onClick={() => { setEditWitness(w); setWModal(true); }}
                            className="p-1 rounded hover:opacity-75"
                            style={{ color: 'var(--text-muted)' }}>
                            <PencilSquareIcon className="h-4 w-4" />
                          </button>
                          <button type="button"
                            onClick={() => setDeleteW(w)}
                            className="p-1 rounded hover:opacity-75"
                            style={{ color: 'var(--danger)' }}>
                            <TrashIcon className="h-4 w-4" />
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
    </>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="flex gap-3">
      <span className="text-xs font-medium w-28 flex-shrink-0"
        style={{ color: 'var(--text-muted)' }}>{label}</span>
      <span className="text-xs flex-1" style={{ color: 'var(--text)' }}>
        {value ?? '—'}
      </span>
    </div>
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
      />
    </div>
  );
}
