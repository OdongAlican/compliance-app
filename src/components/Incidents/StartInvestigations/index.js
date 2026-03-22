/**
 * StartInvestigations/index.js
 *
 * Full CRUD page for Start Incident Investigations.
 *
 * Features:
 *  - Paginated table with filters
 *  - Multi-step create/edit modal
 *      Step 0 — Select Incident    (incident_investigation_id + notes)
 *      Step 1 — People Injured     (user_id, injury_sustained, nature_of_injury)
 *      Step 2 — Properties Involved (type_of_property, description, nature_of_damage)
 *      Step 3 — Incident Descriptions (narrative + optional file)
 *      Step 4 — Actions Taken / Review
 *  - Right-side detail drawer showing all nested child arrays
 *  - Delete confirmation modal
 *  - Permission-gated write actions (start_incident_investigations.update)
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
  TrashIcon,
  FunnelIcon,
  ClipboardDocumentCheckIcon,
  UserCircleIcon,
  BuildingOfficeIcon,
  DocumentTextIcon,
  BoltIcon,
} from '@heroicons/react/24/outline';
import { EllipsisVerticalIcon } from '@heroicons/react/20/solid';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import {
  fetchStartInvestigations,
  createStartInvestigation,
  updateStartInvestigation,
  deleteStartInvestigation,
  setStartInvestigationFilters,
  clearStartInvestigationErrors,
  selectStartInvestigations,
  selectStartInvestigationsMeta,
  selectStartInvestigationsLoading,
  selectStartInvestigationsError,
  selectStartInvestigationsFilters,
  selectStartInvestigationsActionLoading,
  selectStartInvestigationsActionError,
} from '../../../store/slices/startInvestigationSlice';
import { IncidentNotificationService } from '../../../services/incidents.service';
import useAuth from '../../../hooks/useAuth';

// ── Constants ──────────────────────────────────────────────────────────────

const STEPS = [
  'Select Incident',
  'People Injured',
  'Properties Involved',
  'Incident Descriptions',
  'Actions Taken',
];

const EMPTY_PERSON = { user_id: '', injury_sustained: 'no', nature_of_injury: '', _user: null };
const EMPTY_PROPERTY = { type_of_property: '', description: '', nature_of_damage: '' };
const EMPTY_DESC = { narrative: '', file: null };
const EMPTY_ACTION = { description: '', user_id: '', action_date: '', action_time: '', _user: null };

// ── Helpers ────────────────────────────────────────────────────────────────

function formatDate(d) {
  if (!d) return '—';
  try { return new Date(d).toLocaleDateString(); } catch { return d; }
}

function displayName(u) {
  if (!u) return '—';
  return `${u.firstname ?? ''} ${u.lastname ?? ''}`.trim() || u.email || `#${u.id}`;
}

// ── Reusable UI ────────────────────────────────────────────────────────────

function ActionMenu({ onView, onEdit, onDelete, canEdit, canDelete }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative inline-block text-left">
      <button type="button" onClick={() => setOpen((o) => !o)}
        className="p-1 rounded hover:opacity-75"
        style={{ color: 'var(--text-muted)' }} aria-haspopup="menu">
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
          Delete Investigation
        </h3>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Are you sure you want to delete{' '}
          <strong style={{ color: 'var(--text)' }}>{name}</strong>?
          This action cannot be undone.
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

function FieldError({ msg }) {
  if (!msg) return null;
  return <p className="text-xs mt-1" style={{ color: 'var(--danger)' }}>{msg}</p>;
}

// ── Inline user picker (single-user) ──────────────────────────────────────

function UserPicker({ value, onChange, placeholder = 'Search user…' }) {
  const [q, setQ]         = useState('');
  const [opts, setOpts]   = useState([]);
  const [open, setOpen]   = useState(false);
  const timer             = useRef(null);

  async function search(query) {
    try {
      const res = await (await import('../../../services/users.service')).default.list({ q: query, per_page: 20 });
      const list = Array.isArray(res) ? res : (res.data ?? []);
      setOpts(list);
    } catch (_) { setOpts([]); }
  }

  function handleType(val) {
    setQ(val);
    clearTimeout(timer.current);
    if (val.length >= 1) {
      timer.current = setTimeout(() => search(val), 300);
      setOpen(true);
    } else { setOpen(false); }
  }

  if (value) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg"
        style={{ border: '1px solid var(--border)', background: 'var(--bg-surface)' }}>
        <span className="flex-1 text-sm" style={{ color: 'var(--text)' }}>{displayName(value)}</span>
        <button type="button" onClick={() => onChange(null)}
          className="p-0.5 hover:opacity-75" style={{ color: 'var(--text-muted)' }}>
          <XMarkIcon className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-4 w-4 pointer-events-none"
        style={{ color: 'var(--text-muted)' }} />
      <input type="text" className="ui-input w-full pl-9"
        placeholder={placeholder} value={q}
        onChange={(e) => handleType(e.target.value)}
        onFocus={() => q && setOpen(true)} />
      {open && opts.length > 0 && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 right-0 mt-1 z-20 rounded-lg py-1 shadow-lg"
            style={{ background: 'var(--bg-raised)', border: '1px solid var(--border)' }}>
            {opts.map((u) => (
              <button key={u.id} type="button"
                className="w-full text-left px-3 py-2 text-sm hover:opacity-75"
                style={{ color: 'var(--text)' }}
                onClick={() => { onChange(u); setQ(''); setOpen(false); }}>
                {displayName(u)}
                {u.email && <span className="ml-2 text-xs" style={{ color: 'var(--text-muted)' }}>{u.email}</span>}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ── Incident picker (for step 0) ───────────────────────────────────────────

function IncidentPicker({ value, onChange }) {
  const [opts, setOpts]   = useState([]);
  const [q, setQ]         = useState('');
  const [open, setOpen]   = useState(false);
  const [loading, setLoading] = useState(false);
  const timer = useRef(null);

  useEffect(() => { loadOpts(''); }, []); // eslint-disable-line

  async function loadOpts(query) {
    setLoading(true);
    try {
      const params = { per_page: 50 };
      if (query) params['filter[incident_type]'] = query;
      const res = await IncidentNotificationService.list(params);
      const list = Array.isArray(res) ? res : (res.data ?? []);
      setOpts(list);
    } catch (_) { setOpts([]); }
    finally { setLoading(false); }
  }

  function handleType(val) {
    setQ(val);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => loadOpts(val), 400);
    setOpen(true);
  }

  if (value) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg"
        style={{ border: '1px solid var(--border)', background: 'var(--bg-surface)' }}>
        <span className="flex-1 text-sm" style={{ color: 'var(--text)' }}>
          {value.incident_type ?? `Incident #${value.id}`} — {value.location}
        </span>
        <button type="button" onClick={() => onChange(null)}
          className="p-0.5 hover:opacity-75" style={{ color: 'var(--text-muted)' }}>
          <XMarkIcon className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-4 w-4 pointer-events-none"
        style={{ color: 'var(--text-muted)' }} />
      <input type="text" className="ui-input w-full pl-9"
        placeholder="Search incident notifications…"
        value={q} onChange={(e) => handleType(e.target.value)}
        onFocus={() => setOpen(true)} />
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 right-0 mt-1 z-20 rounded-lg py-1 shadow-lg max-h-48 overflow-y-auto"
            style={{ background: 'var(--bg-raised)', border: '1px solid var(--border)' }}>
            {loading ? (
              <p className="px-3 py-2 text-xs" style={{ color: 'var(--text-muted)' }}>Loading…</p>
            ) : opts.length === 0 ? (
              <p className="px-3 py-2 text-xs" style={{ color: 'var(--text-muted)' }}>No incidents found</p>
            ) : opts.map((item) => (
              <button key={item.id} type="button"
                className="w-full text-left px-3 py-2 text-sm hover:opacity-75"
                style={{ color: 'var(--text)' }}
                onClick={() => { onChange(item); setQ(''); setOpen(false); }}>
                <span className="font-medium">{item.incident_type ?? `#${item.id}`}</span>
                <span className="ml-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                  {item.location} · {formatDate(item.date_of_incident)}
                </span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ── Create / Edit Modal ────────────────────────────────────────────────────

function InvestigationModal({ open, record, onClose, onSave, saving, saveError }) {
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState({});

  // Step 0
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [notes, setNotes] = useState('');

  // Step 1 — People Injured
  const [people, setPeople] = useState([{ ...EMPTY_PERSON }]);

  // Step 2 — Properties
  const [properties, setProperties] = useState([{ ...EMPTY_PROPERTY }]);

  // Step 3 — Descriptions
  const [descriptions, setDescriptions] = useState([{ ...EMPTY_DESC }]);

  // Step 4 — Actions
  const [actions, setActions] = useState([{ ...EMPTY_ACTION }]);

  useEffect(() => {
    if (!open) return;
    setStep(0);
    setErrors({});
    if (record) {
      setSelectedIncident(record.incident_investigation ?? null);
      setNotes(record.notes ?? '');
      setPeople(
        record.people_injured?.length
          ? record.people_injured.map((p) => ({ ...p, _user: p.user ?? null }))
          : [{ ...EMPTY_PERSON }]
      );
      setProperties(
        record.properties_involved?.length
          ? record.properties_involved
          : [{ ...EMPTY_PROPERTY }]
      );
      setDescriptions(
        record.incident_descriptions?.length
          ? record.incident_descriptions
          : [{ ...EMPTY_DESC }]
      );
      setActions(
        record.actions_taken?.length
          ? record.actions_taken.map((a) => ({ ...a, _user: a.user ?? null }))
          : [{ ...EMPTY_ACTION }]
      );
    } else {
      setSelectedIncident(null);
      setNotes('');
      setPeople([{ ...EMPTY_PERSON }]);
      setProperties([{ ...EMPTY_PROPERTY }]);
      setDescriptions([{ ...EMPTY_DESC }]);
      setActions([{ ...EMPTY_ACTION }]);
    }
  }, [open, record]);

  function validate(s) {
    const errs = {};
    if (s === 0 && !selectedIncident) errs.incident = 'Incident is required';
    if (s === 1) {
      people.forEach((p, i) => {
        if (!p.user_id && !p._user) errs[`person_${i}_user`] = 'User required';
        if (p.injury_sustained === 'yes' && !p.nature_of_injury?.trim())
          errs[`person_${i}_injury`] = 'Describe the nature of injury';
      });
    }
    if (s === 3) {
      descriptions.forEach((d, i) => {
        if (!d.narrative?.trim()) errs[`desc_${i}`] = 'Narrative required';
      });
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function next() { if (validate(step)) setStep((s) => s + 1); }
  function back() { setStep((s) => s - 1); }

  // ── Mutations for each sub-array ──

  function updatePerson(idx, key, val) {
    setPeople((arr) => arr.map((p, i) => i === idx ? { ...p, [key]: val } : p));
  }
  function addPerson()    { setPeople((arr) => [...arr, { ...EMPTY_PERSON }]); }
  function removePerson(idx) { setPeople((arr) => arr.filter((_, i) => i !== idx)); }

  function updateProperty(idx, key, val) {
    setProperties((arr) => arr.map((p, i) => i === idx ? { ...p, [key]: val } : p));
  }
  function addProperty()       { setProperties((arr) => [...arr, { ...EMPTY_PROPERTY }]); }
  function removeProperty(idx) { setProperties((arr) => arr.filter((_, i) => i !== idx)); }

  function updateDesc(idx, key, val) {
    setDescriptions((arr) => arr.map((d, i) => i === idx ? { ...d, [key]: val } : d));
  }
  function addDesc()      { setDescriptions((arr) => [...arr, { ...EMPTY_DESC }]); }
  function removeDesc(idx) { setDescriptions((arr) => arr.filter((_, i) => i !== idx)); }

  function updateAction(idx, key, val) {
    setActions((arr) => arr.map((a, i) => i === idx ? { ...a, [key]: val } : a));
  }
  function addAction()       { setActions((arr) => [...arr, { ...EMPTY_ACTION }]); }
  function removeAction(idx) { setActions((arr) => arr.filter((_, i) => i !== idx)); }

  function submit() {
    const formData = new FormData();
    formData.append('incident_investigation_id', selectedIncident.id);
    formData.append('notes', notes);

    people.forEach((p, i) => {
      const uid = p._user?.id ?? p.user_id;
      formData.append(`people_injured[${i}][user_id]`, uid);
      formData.append(`people_injured[${i}][injury_sustained]`, p.injury_sustained);
      if (p.injury_sustained === 'yes')
        formData.append(`people_injured[${i}][nature_of_injury]`, p.nature_of_injury);
    });

    properties.forEach((prop, i) => {
      formData.append(`properties_involved[${i}][type_of_property]`, prop.type_of_property);
      formData.append(`properties_involved[${i}][description]`, prop.description);
      formData.append(`properties_involved[${i}][nature_of_damage]`, prop.nature_of_damage);
    });

    descriptions.forEach((d, i) => {
      formData.append(`incident_descriptions[${i}][narrative]`, d.narrative);
      if (d.file) formData.append(`incident_descriptions[${i}][file]`, d.file);
    });

    actions.forEach((a, i) => {
      formData.append(`actions_taken[${i}][description]`, a.description);
      formData.append(`actions_taken[${i}][user_id]`, a._user?.id ?? a.user_id);
      formData.append(`actions_taken[${i}][action_date]`, a.action_date);
      formData.append(`actions_taken[${i}][action_time]`, a.action_time);
    });

    onSave(formData);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.5)' }}>
      <div className="ui-card w-full max-w-2xl"
        style={{ maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>

        {/* Header */}
        <div className="flex items-center justify-between p-5"
          style={{ borderBottom: '1px solid var(--border)' }}>
          <div>
            <h2 className="text-base font-semibold" style={{ color: 'var(--text)' }}>
              {record ? 'Edit Investigation' : 'Start New Investigation'}
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

        {/* Progress */}
        <div className="flex gap-1 px-5 pt-4">
          {STEPS.map((s, i) => (
            <div key={s} className="flex-1 h-1 rounded-full transition-all"
              style={{ background: i <= step ? '#7c3aed' : 'var(--border)' }} />
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">

          {/* ── Step 0: Select Incident ── */}
          {step === 0 && (
            <>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>
                  Incident Notification <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <IncidentPicker value={selectedIncident} onChange={setSelectedIncident} />
                <FieldError msg={errors.incident} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>
                  Investigation Notes
                </label>
                <textarea rows={4} className="ui-input w-full"
                  placeholder="Overview of the investigation…"
                  value={notes} onChange={(e) => setNotes(e.target.value)} />
              </div>
            </>
          )}

          {/* ── Step 1: People Injured ── */}
          {step === 1 && (
            <div className="space-y-4">
              {people.map((p, i) => (
                <div key={i} className="rounded-xl p-4 relative"
                  style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
                      Person #{i + 1}
                    </span>
                    {people.length > 1 && (
                      <button type="button" onClick={() => removePerson(i)}
                        className="p-0.5 hover:opacity-75" style={{ color: 'var(--danger)' }}>
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>
                        User <span style={{ color: 'var(--danger)' }}>*</span>
                      </label>
                      <UserPicker value={p._user} onChange={(u) => updatePerson(i, '_user', u)} />
                      <FieldError msg={errors[`person_${i}_user`]} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>
                        Injury Sustained
                      </label>
                      <select className="ui-input w-full"
                        value={p.injury_sustained}
                        onChange={(e) => updatePerson(i, 'injury_sustained', e.target.value)}>
                        <option value="no">No</option>
                        <option value="yes">Yes</option>
                      </select>
                    </div>
                    {p.injury_sustained === 'yes' && (
                      <div>
                        <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>
                          Nature of Injury <span style={{ color: 'var(--danger)' }}>*</span>
                        </label>
                        <input type="text" className="ui-input w-full"
                          placeholder="Describe the injury…"
                          value={p.nature_of_injury}
                          onChange={(e) => updatePerson(i, 'nature_of_injury', e.target.value)} />
                        <FieldError msg={errors[`person_${i}_injury`]} />
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <button type="button" onClick={addPerson}
                className="flex items-center gap-1.5 text-sm font-medium hover:opacity-75"
                style={{ color: 'var(--accent)' }}>
                <PlusIcon className="h-4 w-4" /> Add Person
              </button>
            </div>
          )}

          {/* ── Step 2: Properties Involved ── */}
          {step === 2 && (
            <div className="space-y-4">
              {properties.map((prop, i) => (
                <div key={i} className="rounded-xl p-4"
                  style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
                      Property #{i + 1}
                    </span>
                    {properties.length > 1 && (
                      <button type="button" onClick={() => removeProperty(i)}
                        className="p-0.5 hover:opacity-75" style={{ color: 'var(--danger)' }}>
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>
                        Type of Property
                      </label>
                      <input type="text" className="ui-input w-full"
                        placeholder="e.g. Vehicle, Equipment, Building…"
                        value={prop.type_of_property}
                        onChange={(e) => updateProperty(i, 'type_of_property', e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>
                        Description
                      </label>
                      <input type="text" className="ui-input w-full"
                        placeholder="Property description…"
                        value={prop.description}
                        onChange={(e) => updateProperty(i, 'description', e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>
                        Nature of Damage
                      </label>
                      <input type="text" className="ui-input w-full"
                        placeholder="Describe the damage…"
                        value={prop.nature_of_damage}
                        onChange={(e) => updateProperty(i, 'nature_of_damage', e.target.value)} />
                    </div>
                  </div>
                </div>
              ))}
              <button type="button" onClick={addProperty}
                className="flex items-center gap-1.5 text-sm font-medium hover:opacity-75"
                style={{ color: 'var(--accent)' }}>
                <PlusIcon className="h-4 w-4" /> Add Property
              </button>
            </div>
          )}

          {/* ── Step 3: Incident Descriptions ── */}
          {step === 3 && (
            <div className="space-y-4">
              {descriptions.map((d, i) => (
                <div key={i} className="rounded-xl p-4"
                  style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
                      Description #{i + 1}
                    </span>
                    {descriptions.length > 1 && (
                      <button type="button" onClick={() => removeDesc(i)}
                        className="p-0.5 hover:opacity-75" style={{ color: 'var(--danger)' }}>
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>
                        Narrative <span style={{ color: 'var(--danger)' }}>*</span>
                      </label>
                      <textarea rows={3} className="ui-input w-full"
                        placeholder="Describe what happened…"
                        value={d.narrative}
                        onChange={(e) => updateDesc(i, 'narrative', e.target.value)} />
                      <FieldError msg={errors[`desc_${i}`]} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>
                        Supporting File (optional)
                      </label>
                      <input type="file" className="ui-input w-full text-xs"
                        onChange={(e) => updateDesc(i, 'file', e.target.files?.[0] ?? null)} />
                    </div>
                  </div>
                </div>
              ))}
              <button type="button" onClick={addDesc}
                className="flex items-center gap-1.5 text-sm font-medium hover:opacity-75"
                style={{ color: 'var(--accent)' }}>
                <PlusIcon className="h-4 w-4" /> Add Description
              </button>
            </div>
          )}

          {/* ── Step 4: Actions Taken / Review ── */}
          {step === 4 && (
            <div className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-wider"
                style={{ color: 'var(--text-muted)' }}>Actions Taken</p>
              {actions.map((a, i) => (
                <div key={i} className="rounded-xl p-4"
                  style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
                      Action #{i + 1}
                    </span>
                    {actions.length > 1 && (
                      <button type="button" onClick={() => removeAction(i)}
                        className="p-0.5 hover:opacity-75" style={{ color: 'var(--danger)' }}>
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>
                        Description
                      </label>
                      <input type="text" className="ui-input w-full"
                        placeholder="What action was taken?"
                        value={a.description}
                        onChange={(e) => updateAction(i, 'description', e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>
                        Assigned To
                      </label>
                      <UserPicker value={a._user}
                        onChange={(u) => updateAction(i, '_user', u)}
                        placeholder="Search user…" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>
                          Action Date
                        </label>
                        <input type="date" className="ui-input w-full"
                          value={a.action_date}
                          onChange={(e) => updateAction(i, 'action_date', e.target.value)} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>
                          Action Time
                        </label>
                        <input type="time" className="ui-input w-full"
                          value={a.action_time}
                          onChange={(e) => updateAction(i, 'action_time', e.target.value)} />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              <button type="button" onClick={addAction}
                className="flex items-center gap-1.5 text-sm font-medium hover:opacity-75"
                style={{ color: 'var(--accent)' }}>
                <PlusIcon className="h-4 w-4" /> Add Action
              </button>

              {/* Summary */}
              <div className="rounded-xl p-4 mt-2"
                style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
                <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>
                  Review Summary
                </p>
                <div className="space-y-1 text-xs" style={{ color: 'var(--text)' }}>
                  <p><strong>Incident:</strong> {selectedIncident?.incident_type ?? '—'} · {selectedIncident?.location}</p>
                  <p><strong>Notes:</strong> {notes || '—'}</p>
                  <p><strong>People Injured:</strong> {people.filter(p => p._user || p.user_id).length}</p>
                  <p><strong>Properties Involved:</strong> {properties.filter(p => p.type_of_property).length}</p>
                  <p><strong>Descriptions:</strong> {descriptions.filter(d => d.narrative).length}</p>
                  <p><strong>Actions Taken:</strong> {actions.filter(a => a.description).length}</p>
                </div>
              </div>
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
                style={{ background: '#7c3aed' }}>
                Next
              </button>
            ) : (
              <button type="button" onClick={submit} disabled={saving}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-white hover:opacity-90"
                style={{ background: '#7c3aed' }}>
                {saving ? 'Saving…' : record ? 'Update' : 'Start Investigation'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Detail Drawer ──────────────────────────────────────────────────────────

function InvestigationDrawer({ record, onClose }) {
  if (!record) return null;

  const incident = record.incident_investigation ?? {};

  function Section({ title, icon: Icon, color, children }) {
    return (
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Icon className="h-4 w-4" style={{ color }} />
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
            {title}
          </p>
        </div>
        {children}
      </div>
    );
  }

  return (
    <>
      <div className="fixed inset-0 z-30" style={{ background: 'rgba(0,0,0,0.3)' }}
        onClick={onClose} />
      <div className="fixed top-0 right-0 bottom-0 z-40 w-full max-w-lg overflow-y-auto"
        style={{ background: 'var(--bg-raised)', boxShadow: 'var(--shadow-md)' }}>

        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between px-6 py-4 z-10"
          style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-raised)' }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(124,58,237,.12)' }}>
              <ClipboardDocumentCheckIcon className="h-5 w-5" style={{ color: '#7c3aed' }} />
            </div>
            <div>
              <h2 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
                Investigation #{record.id}
              </h2>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {incident.incident_type ?? '—'} · {incident.location ?? ''}
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose}
            className="p-1.5 rounded hover:opacity-75" style={{ color: 'var(--text-muted)' }}>
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-6">
          {/* Notes */}
          {record.notes && (
            <div className="rounded-xl p-4"
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
              <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Notes</p>
              <p className="text-sm" style={{ color: 'var(--text)' }}>{record.notes}</p>
            </div>
          )}

          {/* People Injured */}
          <Section title="People Injured" icon={UserCircleIcon} color="#ef4444">
            {record.people_injured?.length ? (
              <div className="space-y-2">
                {record.people_injured.map((p, i) => (
                  <div key={i} className="rounded-xl p-3"
                    style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
                    <p className="text-xs font-semibold" style={{ color: 'var(--text)' }}>
                      {displayName(p.user ?? {})}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      Injured: <strong>{p.injury_sustained}</strong>
                      {p.nature_of_injury && ` — ${p.nature_of_injury}`}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>None recorded</p>
            )}
          </Section>

          {/* Properties Involved */}
          <Section title="Properties Involved" icon={BuildingOfficeIcon} color="#d97706">
            {record.properties_involved?.length ? (
              <div className="space-y-2">
                {record.properties_involved.map((p, i) => (
                  <div key={i} className="rounded-xl p-3"
                    style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
                    <p className="text-xs font-semibold" style={{ color: 'var(--text)' }}>
                      {p.type_of_property ?? '—'}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{p.description}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      Damage: {p.nature_of_damage || '—'}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>None recorded</p>
            )}
          </Section>

          {/* Descriptions */}
          <Section title="Incident Descriptions" icon={DocumentTextIcon} color="#2563eb">
            {record.incident_descriptions?.length ? (
              <div className="space-y-2">
                {record.incident_descriptions.map((d, i) => (
                  <div key={i} className="rounded-xl p-3"
                    style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
                    <p className="text-xs" style={{ color: 'var(--text)' }}>{d.narrative}</p>
                    {d.file_url && (
                      <a href={d.file_url} target="_blank" rel="noreferrer"
                        className="text-xs mt-1 hover:underline" style={{ color: 'var(--accent)' }}>
                        View attachment
                      </a>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>None recorded</p>
            )}
          </Section>

          {/* Actions Taken */}
          <Section title="Actions Taken" icon={BoltIcon} color="#7c3aed">
            {record.actions_taken?.length ? (
              <div className="space-y-2">
                {record.actions_taken.map((a, i) => (
                  <div key={i} className="rounded-xl p-3"
                    style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
                    <p className="text-xs font-semibold" style={{ color: 'var(--text)' }}>{a.description}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      {displayName(a.user ?? {})}
                      {a.action_date && ` · ${formatDate(a.action_date)}`}
                      {a.action_time && ` ${a.action_time}`}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>None recorded</p>
            )}
          </Section>
        </div>
      </div>
    </>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────

const TABLE_COLS = ['#', 'Incident', 'Notes', 'Injured', 'Properties', 'Actions', ''];

export default function StartInvestigationsPage() {
  const dispatch = useAppDispatch();
  const { hasPermission } = useAuth();
  const canEdit = hasPermission('start_incident_investigations.update');

  const items         = useAppSelector(selectStartInvestigations);
  const meta          = useAppSelector(selectStartInvestigationsMeta);
  const loading       = useAppSelector(selectStartInvestigationsLoading);
  const error         = useAppSelector(selectStartInvestigationsError);
  const filters       = useAppSelector(selectStartInvestigationsFilters);
  const actionLoading = useAppSelector(selectStartInvestigationsActionLoading);
  const actionError   = useAppSelector(selectStartInvestigationsActionError);

  const [modal, setModal]                 = useState(false);
  const [editRecord, setEditRecord]       = useState(null);
  const [drawerRecord, setDrawerRecord]   = useState(null);
  const [deleteTarget, setDeleteTarget]   = useState(null);
  const [showFilters, setShowFilters]     = useState(false);
  const filterTimer = useRef(null);

  const load = useCallback(
    () => dispatch(fetchStartInvestigations(filters)),
    [dispatch, filters]
  );

  useEffect(() => { load(); }, [load]);

  function handleFilterChange(key, val) {
    clearTimeout(filterTimer.current);
    filterTimer.current = setTimeout(
      () => dispatch(setStartInvestigationFilters({ [key]: val, page: 1 })),
      400
    );
  }

  function openCreate() {
    dispatch(clearStartInvestigationErrors());
    setEditRecord(null);
    setModal(true);
  }

  function openEdit(record) {
    dispatch(clearStartInvestigationErrors());
    setEditRecord(record);
    setModal(true);
  }

  async function handleSave(payload) {
    let action;
    if (editRecord) {
      action = await dispatch(updateStartInvestigation({ id: editRecord.id, data: payload }));
    } else {
      action = await dispatch(createStartInvestigation(payload));
    }
    if (!action.error) {
      toast.success(editRecord ? 'Investigation updated' : 'Investigation started');
      setModal(false);
      setEditRecord(null);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    const action = await dispatch(deleteStartInvestigation(deleteTarget.id));
    if (!action.error) {
      toast.success('Investigation deleted');
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
            style={{ background: 'rgba(124,58,237,.12)' }}>
            <ClipboardDocumentCheckIcon className="h-6 w-6" style={{ color: '#7c3aed' }} />
          </div>
          <div>
            <h1 className="text-xl font-bold" style={{ color: 'var(--text)' }}>
              Start Incident Investigations
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
              style={{ background: '#7c3aed' }}>
              <PlusIcon className="h-4 w-4" />
              Start Investigation
            </button>
          )}
        </div>
      </div>

      {/* ── Filters ── */}
      {showFilters && (
        <div className="ui-card p-4 mb-5">
          <input type="text" className="ui-input w-full max-w-xs"
            placeholder="Filter by incident ID…"
            defaultValue={filters['filter[incident_investigation_id]']}
            onChange={(e) => handleFilterChange('filter[incident_investigation_id]', e.target.value)} />
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
                    <ClipboardDocumentCheckIcon className="h-8 w-8 mx-auto mb-2 opacity-30"
                      style={{ color: 'var(--text-muted)' }} />
                    <p style={{ color: 'var(--text-muted)' }}>No investigations found</p>
                  </td>
                </tr>
              ) : (
                items.map((item, idx) => {
                  const inc = item.incident_investigation ?? {};
                  return (
                    <tr key={item.id} className="ui-row">
                      <td className="ui-td" style={{ color: 'var(--text-muted)' }}>
                        {(page - 1) * (filters.per_page ?? 10) + idx + 1}
                      </td>
                      <td className="ui-td">
                        <div>
                          <p className="text-xs font-semibold" style={{ color: 'var(--text)' }}>
                            {inc.incident_type ?? `#${inc.id ?? '—'}`}
                          </p>
                          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                            {inc.location ?? '—'}
                          </p>
                        </div>
                      </td>
                      <td className="ui-td max-w-xs">
                        <p className="text-xs truncate" style={{ color: 'var(--text)' }}>
                          {item.notes || '—'}
                        </p>
                      </td>
                      <td className="ui-td text-center">
                        <span className="text-xs font-medium"
                          style={{ color: 'var(--text-muted)' }}>
                          {item.people_injured?.length ?? 0}
                        </span>
                      </td>
                      <td className="ui-td text-center">
                        <span className="text-xs font-medium"
                          style={{ color: 'var(--text-muted)' }}>
                          {item.properties_involved?.length ?? 0}
                        </span>
                      </td>
                      <td className="ui-td text-center">
                        <span className="text-xs font-medium"
                          style={{ color: 'var(--text-muted)' }}>
                          {item.actions_taken?.length ?? 0}
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
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <Pagination
          meta={meta}
          page={page}
          onPage={(p) => dispatch(setStartInvestigationFilters({ page: p }))}
        />
      </div>

      {/* ── Modals ── */}
      <InvestigationModal
        open={modal}
        record={editRecord}
        onClose={() => { setModal(false); setEditRecord(null); }}
        onSave={handleSave}
        saving={actionLoading}
        saveError={actionError}
      />

      <DeleteConfirmModal
        open={!!deleteTarget}
        name={deleteTarget ? `Investigation #${deleteTarget.id}` : ''}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={actionLoading}
      />

      <InvestigationDrawer record={drawerRecord} onClose={() => setDrawerRecord(null)} />
    </div>
  );
}
