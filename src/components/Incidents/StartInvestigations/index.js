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
import React, { useEffect, useState, useRef, useCallback } from 'react';
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
  CloudArrowUpIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  CalendarDaysIcon,
  ClockIcon,
  PencilSquareIcon,
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
  'Review',
];

const STEP_META = [
  { Icon: ClipboardDocumentCheckIcon, label: 'Incident' },
  { Icon: UserCircleIcon,             label: 'People' },
  { Icon: BuildingOfficeIcon,         label: 'Properties' },
  { Icon: DocumentTextIcon,           label: 'Descriptions' },
  { Icon: BoltIcon,                   label: 'Actions' },
  { Icon: CheckCircleIcon,            label: 'Review' },
];

const EMPTY_PERSON = { user_id: '', injury_sustained: 'no', nature_of_injury: '', _user: null };
const EMPTY_PROPERTY = { type_of_property: '', description: '', nature_of_damage: '' };
const EMPTY_DESC = { narrative: '', file: null };
const EMPTY_ACTION = { description: '', user_id: '', action_date: '', action_time: '', _user: null };

const PURPLE = '#7c3aed';

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
      <button type="button" ref={btnRef} onClick={toggle}
        className="p-1 rounded hover:opacity-75"
        style={{ color: 'var(--text-muted)' }} aria-haspopup="menu">
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
        <div className="px-6 pt-6 pb-5 text-center"
          style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ background: 'rgba(239,68,68,.1)', border: '2px solid rgba(239,68,68,.2)' }}>
            <TrashIcon className="h-7 w-7" style={{ color: '#ef4444' }} />
          </div>
          <h3 className="text-base font-bold mb-1" style={{ color: 'var(--text)' }}>
            Delete Investigation
          </h3>
          <div className="inline-flex items-center gap-1.5 mt-2 px-3 py-1.5 rounded-xl"
            style={{ background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.2)' }}>
            <ClipboardDocumentCheckIcon className="h-3.5 w-3.5 flex-shrink-0" style={{ color: '#ef4444' }} />
            <span className="text-sm font-semibold" style={{ color: '#ef4444' }}>{name}</span>
          </div>
          <p className="text-xs mt-3" style={{ color: 'var(--text-muted)' }}>
            This action <strong style={{ color: 'var(--text)' }}>cannot be undone.</strong>{' '}
            All investigation data will be permanently removed.
          </p>
        </div>
        <div className="flex gap-3 px-6 py-4" style={{ background: 'var(--bg-surface)' }}>
          <button type="button" onClick={onCancel} disabled={loading}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold hover:opacity-80"
            style={{ border: '1px solid var(--border)', color: 'var(--text)', background: 'var(--bg-raised)' }}>
            Keep it
          </button>
          <button type="button" onClick={onConfirm} disabled={loading}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90 flex items-center justify-center gap-2"
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

// ── Inline user picker (single-user) ──────────────────────────────────────

function UserPicker({ value, onChange, placeholder = 'Search user…' }) {
  const [q, setQ]             = useState('');
  const [opts, setOpts]       = useState([]);
  const [open, setOpen]       = useState(false);
  const [loading, setLoading] = useState(false);
  const timer                 = useRef(null);
  const loaded                = useRef(false);
  const wrapRef               = useRef(null);
  const [dropPos, setDropPos] = useState({ top: 0, left: 0, width: 0 });

  async function search(query) {
    setLoading(true);
    try {
      const res = await (await import('../../../services/users.service')).default.list({ q: query, per_page: 10 });
      const list = Array.isArray(res) ? res : (res.data ?? []);
      setOpts(list);
    } catch (_) { setOpts([]); }
    finally { setLoading(false); }
  }

  function openDropdown() {
    if (wrapRef.current) {
      const r = wrapRef.current.getBoundingClientRect();
      setDropPos({ top: r.bottom + 4, left: r.left, width: r.width });
    }
    if (!loaded.current) { loaded.current = true; search(''); }
    setOpen(true);
  }

  function handleType(val) {
    setQ(val);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => search(val), 300);
    openDropdown();
  }

  if (value) {
    return (
      <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
        style={{ border: '1px solid var(--border)', background: 'var(--bg-surface)' }}>
        <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
          style={{ background: PURPLE }}>
          {((value.firstname?.[0] ?? '') + (value.lastname?.[0] ?? '')).toUpperCase() || '?'}
        </div>
        <span className="flex-1 text-sm font-medium truncate" style={{ color: 'var(--text)' }}>{displayName(value)}</span>
        <button type="button" onClick={() => onChange(null)}
          className="p-0.5 rounded hover:opacity-75 flex-shrink-0" style={{ color: 'var(--text-muted)' }}>
          <XMarkIcon className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div ref={wrapRef}>
      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none"
          style={{ color: 'var(--text-muted)' }} />
        <input type="text" className="ui-input w-full pl-9 pr-3"
          placeholder={placeholder} value={q}
          onChange={(e) => handleType(e.target.value)}
          onFocus={openDropdown} />
      </div>
      {open && (
        <>
          <div className="fixed inset-0 z-[70]" onClick={() => setOpen(false)} />
          <div className="fixed z-[80] rounded-xl shadow-xl overflow-y-auto"
            style={{
              top: dropPos.top, left: dropPos.left, width: dropPos.width,
              maxHeight: 260, background: 'var(--bg-raised)', border: '1px solid var(--border)',
            }}>
            {loading ? (
              <div className="flex items-center gap-2 px-4 py-3">
                <ArrowPathIcon className="h-4 w-4 animate-spin flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Loading…</p>
              </div>
            ) : opts.length === 0 ? (
              <p className="px-4 py-3 text-sm" style={{ color: 'var(--text-muted)' }}>No users found</p>
            ) : (
              <div className="py-1">
                {opts.map((u) => (
                  <button key={u.id} type="button"
                    className="w-full text-left flex items-center gap-3 px-4 py-2.5 hover:opacity-75"
                    style={{ color: 'var(--text)' }}
                    onMouseDown={(e) => { e.preventDefault(); onChange(u); setQ(''); setOpen(false); }}>
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                      style={{ background: PURPLE }}>
                      {((u.firstname?.[0] ?? '') + (u.lastname?.[0] ?? '')).toUpperCase() || '?'}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium leading-snug" style={{ color: 'var(--text)' }}>{displayName(u)}</p>
                      {u.email && <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{u.email}</p>}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ── Incident picker (for step 0) ───────────────────────────────────────────

function IncidentPicker({ value, onChange }) {
  const [opts, setOpts]       = useState([]);
  const [q, setQ]             = useState('');
  const [open, setOpen]       = useState(false);
  const [loading, setLoading] = useState(false);
  const timer                 = useRef(null);
  const wrapRef               = useRef(null);
  const [dropPos, setDropPos] = useState({ top: 0, left: 0, width: 0 });

  useEffect(() => { loadOpts(''); }, []); // eslint-disable-line

  async function loadOpts(query) {
    setLoading(true);
    try {
      const params = { per_page: 10 };
      if (query) params['filter[incident_type]'] = query;
      const res = await IncidentNotificationService.list(params);
      const list = Array.isArray(res) ? res : (res.data ?? []);
      setOpts(list);
    } catch (_) { setOpts([]); }
    finally { setLoading(false); }
  }

  function openDropdown() {
    if (wrapRef.current) {
      const r = wrapRef.current.getBoundingClientRect();
      setDropPos({ top: r.bottom + 4, left: r.left, width: r.width });
    }
    setOpen(true);
  }

  function handleType(val) {
    setQ(val);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => loadOpts(val), 400);
    openDropdown();
  }

  if (value) {
    return (
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl"
        style={{ border: '1px solid var(--border)', background: 'var(--bg-surface)' }}>
        <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(124,58,237,.12)' }}>
          <ClipboardDocumentCheckIcon className="h-4 w-4" style={{ color: PURPLE }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate" style={{ color: 'var(--text)' }}>
            {value.incident_type ?? `Incident #${value.id}`}
          </p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {value.location} · {formatDate(value.date_of_incident)}
          </p>
        </div>
        <button type="button" onClick={() => onChange(null)}
          className="p-1 rounded-lg hover:opacity-75 flex-shrink-0"
          style={{ border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
          <XMarkIcon className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div ref={wrapRef}>
      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none"
          style={{ color: 'var(--text-muted)' }} />
        <input type="text" className="ui-input w-full pl-9 pr-3"
          placeholder="Search incident notifications…"
          value={q} onChange={(e) => handleType(e.target.value)}
          onFocus={openDropdown} />
      </div>
      {open && (
        <>
          <div className="fixed inset-0 z-[70]" onClick={() => setOpen(false)} />
          <div className="fixed z-[80] rounded-xl shadow-xl overflow-y-auto"
            style={{
              top: dropPos.top, left: dropPos.left, width: dropPos.width,
              maxHeight: 320, background: 'var(--bg-raised)', border: '1px solid var(--border)',
            }}>
            {loading ? (
              <div className="flex items-center gap-2 px-4 py-3">
                <ArrowPathIcon className="h-4 w-4 animate-spin flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Loading…</p>
              </div>
            ) : opts.length === 0 ? (
              <div className="flex items-center gap-2 px-4 py-4">
                <ExclamationTriangleIcon className="h-4 w-4 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No incidents found</p>
              </div>
            ) : (
              <div className="py-1.5">
                {opts.map((item) => (
                  <button key={item.id} type="button"
                    className="w-full text-left flex items-center gap-3 px-4 py-3 hover:opacity-75"
                    style={{ color: 'var(--text)', borderBottom: '1px solid var(--border)' }}
                    onMouseDown={(e) => { e.preventDefault(); onChange(item); setQ(''); setOpen(false); }}>
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: 'rgba(124,58,237,.1)' }}>
                      <ClipboardDocumentCheckIcon className="h-4 w-4" style={{ color: PURPLE }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
                        {item.incident_type ?? `#${item.id}`}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                        {item.location} · {formatDate(item.date_of_incident)}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ── Step card & file upload — module-level so React never remounts on re-render ──

function StepCard({ index, total, label, onRemove, children }) {
  return (
    <div className="rounded-2xl overflow-hidden"
      style={{ border: '1px solid var(--border)', background: 'var(--bg-raised)' }}>
      <div className="flex items-center justify-between px-4 py-3"
        style={{ background: 'rgba(124,58,237,.06)', borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold text-white"
            style={{ background: PURPLE }}>{index + 1}</span>
          <span className="text-sm font-semibold" style={{ color: PURPLE }}>{label} #{index + 1}</span>
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>of {total}</span>
        </div>
        {total > 1 && (
          <button type="button" onClick={onRemove}
            className="p-1.5 rounded-lg hover:opacity-75"
            style={{ border: '1px solid rgba(239,68,68,.3)', color: 'var(--danger)' }}>
            <TrashIcon className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      <div className="p-5 space-y-4">{children}</div>
    </div>
  );
}

function FileUploadZone({ value, onChange }) {
  const fileRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  function handleDrop(e) {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) onChange(f);
  }

  function formatSize(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  if (value) {
    return (
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl"
        style={{ background: 'rgba(124,58,237,.06)', border: '1px solid rgba(124,58,237,.25)' }}>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(124,58,237,.15)' }}>
          <DocumentTextIcon className="h-5 w-5" style={{ color: PURPLE }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate" style={{ color: 'var(--text)' }}>{value.name}</p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{formatSize(value.size)}</p>
        </div>
        <button type="button" onClick={() => onChange(null)}
          className="p-1.5 rounded-lg hover:opacity-75 flex-shrink-0"
          style={{ border: '1px solid rgba(239,68,68,.3)', color: 'var(--danger)' }}>
          <XMarkIcon className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => fileRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className="w-full rounded-xl px-4 py-8 flex flex-col items-center gap-3 transition-all"
      style={{
        border: `2px dashed ${dragging ? PURPLE : 'var(--border)'}`,
        background: dragging ? 'rgba(124,58,237,.05)' : 'var(--bg-surface)',
      }}
    >
      <div className="w-11 h-11 rounded-xl flex items-center justify-center"
        style={{ background: 'rgba(124,58,237,.1)' }}>
        <CloudArrowUpIcon className="h-6 w-6" style={{ color: PURPLE }} />
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Drop a file or click to browse</p>
        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>PDF, images, documents — max 20 MB</p>
      </div>
      <input ref={fileRef} type="file" className="hidden"
        onChange={(e) => onChange(e.target.files?.[0] ?? null)} />
    </button>
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
        const hasUser = !!(p._user || p.user_id);
        if (hasUser && p.injury_sustained === 'yes' && !p.nature_of_injury?.trim())
          errs[`person_${i}_injury`] = 'Describe the nature of injury';
      });
    }
    if (s === 2) {
      properties.forEach((prop, i) => {
        const hasAnyData = prop.type_of_property?.trim() || prop.description?.trim() || prop.nature_of_damage?.trim();
        if (hasAnyData) {
          if (!prop.type_of_property?.trim()) errs[`prop_${i}_type`] = 'Type of property is required';
          if (!prop.nature_of_damage?.trim()) errs[`prop_${i}_damage`] = 'Nature of damage is required';
        }
      });
    }
    if (s === 3) {
      descriptions.forEach((d, i) => {
        if (!d.narrative?.trim()) errs[`desc_${i}`] = 'Narrative required';
      });
    }
    if (s === 4) {
      actions.forEach((a, i) => {
        const hasAnyData = a.description?.trim() || a._user || a.user_id;
        if (hasAnyData) {
          if (!a.description?.trim()) errs[`action_${i}_desc`] = 'Description is required';
          if (!a._user && !a.user_id) errs[`action_${i}_user`] = 'User is required';
        }
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

    const filledPeople = people.filter((p) => p._user?.id || p.user_id);
    filledPeople.forEach((p, i) => {
      const uid = p._user?.id ?? p.user_id;
      formData.append(`people_injured[${i}][user_id]`, uid);
      formData.append(`people_injured[${i}][injury_sustained]`, p.injury_sustained);
      if (p.injury_sustained === 'yes')
        formData.append(`people_injured[${i}][nature_of_injury]`, p.nature_of_injury);
    });

    const filledProperties = properties.filter((p) => p.type_of_property?.trim());
    filledProperties.forEach((prop, i) => {
      formData.append(`properties_involved[${i}][type_of_property]`, prop.type_of_property);
      formData.append(`properties_involved[${i}][description]`, prop.description ?? '');
      formData.append(`properties_involved[${i}][nature_of_damage]`, prop.nature_of_damage);
    });

    const filledDescs = descriptions.filter((d) => d.narrative?.trim());
    filledDescs.forEach((d, i) => {
      formData.append(`incident_descriptions[${i}][narrative]`, d.narrative);
      if (d.file) formData.append(`incident_descriptions[${i}][file]`, d.file);
    });

    const filledActions = actions.filter((a) => a._user?.id || a.user_id);
    filledActions.forEach((a, i) => {
      formData.append(`actions_taken[${i}][description]`, a.description);
      formData.append(`actions_taken[${i}][user_id]`, a._user?.id ?? a.user_id);
      formData.append(`actions_taken[${i}][action_date]`, a.action_date ?? '');
      formData.append(`actions_taken[${i}][action_time]`, a.action_time ?? '');
    });

    onSave(formData);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.5)' }}>
      <div className="ui-card w-full max-w-3xl"
        style={{ maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}>

        {/* ── Modal header ── */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4"
          style={{
            background: 'linear-gradient(135deg, rgba(124,58,237,.1) 0%, rgba(124,58,237,.02) 100%)',
            borderBottom: '1px solid var(--border)',
          }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(124,58,237,.15)' }}>
              <ClipboardDocumentCheckIcon className="h-5 w-5" style={{ color: PURPLE }} />
            </div>
            <div>
              <h2 className="text-base font-bold" style={{ color: 'var(--text)' }}>
                {record ? 'Edit Investigation' : 'Start New Investigation'}
              </h2>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                Step {step + 1} of {STEPS.length} — {STEPS[step]}
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose}
            className="p-1.5 rounded-lg hover:opacity-75"
            style={{ border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* ── Stepper ── */}
        <div className="flex items-center px-4 py-3 gap-1"
          style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-surface)' }}>
          {STEP_META.map((m, i) => {
            const done   = i < step;
            const active = i === step;
            return (
              <React.Fragment key={m.label}>
                <div className="flex flex-col items-center gap-0.5" style={{ minWidth: 0 }}>
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all"
                    style={{
                      background: done ? 'rgba(16,185,129,.15)' : active ? PURPLE : 'var(--border)',
                      color: done ? '#10b981' : active ? '#fff' : 'var(--text-muted)',
                    }}>
                    {done ? '✓' : i + 1}
                  </div>
                  <span className="text-[9px] font-medium text-center leading-tight hidden sm:block"
                    style={{ color: active ? PURPLE : 'var(--text-muted)', maxWidth: 52 }}>
                    {m.label}
                  </span>
                </div>
                {i < STEP_META.length - 1 && (
                  <div className="flex-1 h-px mx-0.5 transition-all"
                    style={{ background: i < step ? '#10b981' : 'var(--border)' }} />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">

          {/* Step 0: Select Incident */}
          {step === 0 && (
            <>
              <div className="rounded-2xl overflow-hidden"
                style={{ border: '1px solid var(--border)', background: 'var(--bg-raised)' }}>
                <div className="flex items-center gap-2 px-4 py-2.5"
                  style={{ background: 'rgba(124,58,237,.06)', borderBottom: '1px solid var(--border)' }}>
                  <ClipboardDocumentCheckIcon className="h-4 w-4" style={{ color: PURPLE }} />
                  <p className="text-xs font-semibold" style={{ color: PURPLE }}>Incident to Investigate</p>
                  <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full font-medium"
                    style={{ background: 'rgba(239,68,68,.1)', color: '#ef4444' }}>Required</span>
                </div>
                <div className="p-4">
                  <IncidentPicker value={selectedIncident} onChange={setSelectedIncident} />
                  <FieldError msg={errors.incident} />
                </div>
              </div>

              <div className="rounded-2xl overflow-hidden"
                style={{ border: '1px solid var(--border)', background: 'var(--bg-raised)' }}>
                <div className="flex items-center gap-2 px-4 py-2.5"
                  style={{ background: 'rgba(124,58,237,.06)', borderBottom: '1px solid var(--border)' }}>
                  <PencilSquareIcon className="h-4 w-4" style={{ color: PURPLE }} />
                  <p className="text-xs font-semibold" style={{ color: PURPLE }}>Investigation Notes</p>
                  <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full font-medium"
                    style={{ background: 'var(--bg-surface)', color: 'var(--text-muted)' }}>Optional</span>
                </div>
                <div className="p-4">
                  <textarea rows={4} className="ui-input w-full"
                    placeholder="Provide an overview of the investigation…"
                    value={notes} onChange={(e) => setNotes(e.target.value)} />
                </div>
              </div>
            </>
          )}

          {/* Step 1: People Injured */}
          {step === 1 && (
            <div className="space-y-3">
              {people.map((p, i) => (
                <StepCard key={i} index={i} total={people.length} label="Person" onRemove={() => removePerson(i)}>
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>
                      USER <span style={{ color: 'var(--danger)' }}>*</span>
                    </label>
                    <UserPicker value={p._user} onChange={(u) => updatePerson(i, '_user', u)} />
                    <FieldError msg={errors[`person_${i}_user`]} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>
                      INJURY SUSTAINED
                    </label>
                    <div className="flex gap-2">
                      {['no', 'yes'].map((val) => (
                        <button key={val} type="button"
                          onClick={() => updatePerson(i, 'injury_sustained', val)}
                          className="flex-1 py-2 rounded-xl text-sm font-semibold transition-all"
                          style={{
                            background: p.injury_sustained === val
                              ? (val === 'yes' ? 'rgba(239,68,68,.12)' : 'rgba(16,185,129,.12)')
                              : 'var(--bg-surface)',
                            border: `1px solid ${p.injury_sustained === val
                              ? (val === 'yes' ? 'rgba(239,68,68,.4)' : 'rgba(16,185,129,.4)')
                              : 'var(--border)'}`,
                            color: p.injury_sustained === val
                              ? (val === 'yes' ? '#ef4444' : '#10b981')
                              : 'var(--text-muted)',
                          }}>
                          {val === 'yes' ? '⚠ Yes' : '✓ No'}
                        </button>
                      ))}
                    </div>
                  </div>
                  {p.injury_sustained === 'yes' && (
                    <div>
                      <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>
                        NATURE OF INJURY <span style={{ color: 'var(--danger)' }}>*</span>
                      </label>
                      <input type="text" className="ui-input w-full"
                        placeholder="Describe the injury…"
                        value={p.nature_of_injury}
                        onChange={(e) => updatePerson(i, 'nature_of_injury', e.target.value)} />
                      <FieldError msg={errors[`person_${i}_injury`]} />
                    </div>
                  )}
                </StepCard>
              ))}
              <button type="button" onClick={addPerson}
                className="w-full py-2.5 rounded-2xl flex items-center justify-center gap-1.5 text-sm font-semibold hover:opacity-80 transition-all"
                style={{ border: `2px dashed ${PURPLE}`, color: PURPLE, background: 'rgba(124,58,237,.04)' }}>
                <PlusIcon className="h-4 w-4" /> Add Another Person
              </button>
            </div>
          )}

          {/* Step 2: Properties Involved */}
          {step === 2 && (
            <div className="space-y-3">
              {properties.map((prop, i) => (
                <StepCard key={i} index={i} total={properties.length} label="Property" onRemove={() => removeProperty(i)}>
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>TYPE OF PROPERTY <span style={{ color: 'var(--danger)' }}>*</span></label>
                    <input type="text" className="ui-input w-full"
                      placeholder="e.g. Vehicle, Equipment, Building…"
                      value={prop.type_of_property}
                      onChange={(e) => updateProperty(i, 'type_of_property', e.target.value)} />
                    <FieldError msg={errors[`prop_${i}_type`]} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>DESCRIPTION</label>
                    <input type="text" className="ui-input w-full"
                      placeholder="Property description…"
                      value={prop.description}
                      onChange={(e) => updateProperty(i, 'description', e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>NATURE OF DAMAGE <span style={{ color: 'var(--danger)' }}>*</span></label>
                    <input type="text" className="ui-input w-full"
                      placeholder="Describe the damage…"
                      value={prop.nature_of_damage}
                      onChange={(e) => updateProperty(i, 'nature_of_damage', e.target.value)} />
                    <FieldError msg={errors[`prop_${i}_damage`]} />
                  </div>
                </StepCard>
              ))}
              <button type="button" onClick={addProperty}
                className="w-full py-2.5 rounded-2xl flex items-center justify-center gap-1.5 text-sm font-semibold hover:opacity-80 transition-all"
                style={{ border: `2px dashed ${PURPLE}`, color: PURPLE, background: 'rgba(124,58,237,.04)' }}>
                <PlusIcon className="h-4 w-4" /> Add Another Property
              </button>
            </div>
          )}

          {/* Step 3: Incident Descriptions */}
          {step === 3 && (
            <div className="space-y-3">
              {descriptions.map((d, i) => (
                <StepCard key={i} index={i} total={descriptions.length} label="Description" onRemove={() => removeDesc(i)}>
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>
                      NARRATIVE <span style={{ color: 'var(--danger)' }}>*</span>
                    </label>
                    <textarea rows={4} className="ui-input w-full"
                      placeholder="Describe what happened in detail…"
                      value={d.narrative}
                      onChange={(e) => updateDesc(i, 'narrative', e.target.value)} />
                    <FieldError msg={errors[`desc_${i}`]} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>SUPPORTING FILE
                      <span className="ml-1 font-normal normal-case" style={{ color: 'var(--text-muted)' }}>(optional)</span>
                    </label>
                    <FileUploadZone
                      value={d.file ?? null}
                      onChange={(f) => updateDesc(i, 'file', f)}
                    />
                  </div>
                </StepCard>
              ))}
              <button type="button" onClick={addDesc}
                className="w-full py-2.5 rounded-2xl flex items-center justify-center gap-1.5 text-sm font-semibold hover:opacity-80 transition-all"
                style={{ border: `2px dashed ${PURPLE}`, color: PURPLE, background: 'rgba(124,58,237,.04)' }}>
                <PlusIcon className="h-4 w-4" /> Add Another Description
              </button>
            </div>
          )}

          {/* Step 4: Actions Taken */}
          {step === 4 && (
            <div className="space-y-3">
              {actions.map((a, i) => (
                <StepCard key={i} index={i} total={actions.length} label="Action" onRemove={() => removeAction(i)}>
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>DESCRIPTION <span style={{ color: 'var(--danger)' }}>*</span></label>
                    <input type="text" className="ui-input w-full"
                      placeholder="What action was taken?"
                      value={a.description}
                      onChange={(e) => updateAction(i, 'description', e.target.value)} />
                    <FieldError msg={errors[`action_${i}_desc`]} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>ASSIGNED TO <span style={{ color: 'var(--danger)' }}>*</span></label>
                    <UserPicker value={a._user} onChange={(u) => updateAction(i, '_user', u)} placeholder="Search user…" />
                    <FieldError msg={errors[`action_${i}_user`]} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>ACTION DATE</label>
                      <input type="date" className="ui-input w-full"
                        value={a.action_date}
                        onChange={(e) => updateAction(i, 'action_date', e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>ACTION TIME</label>
                      <input type="time" className="ui-input w-full"
                        value={a.action_time}
                        onChange={(e) => updateAction(i, 'action_time', e.target.value)} />
                    </div>
                  </div>
                </StepCard>
              ))}
              <button type="button" onClick={addAction}
                className="w-full py-2.5 rounded-2xl flex items-center justify-center gap-1.5 text-sm font-semibold hover:opacity-80 transition-all"
                style={{ border: `2px dashed ${PURPLE}`, color: PURPLE, background: 'rgba(124,58,237,.04)' }}>
                <PlusIcon className="h-4 w-4" /> Add Another Action
              </button>
            </div>
          )}

          {/* Step 5: Review */}
          {step === 5 && (() => {
            const filledPeople     = people.filter((p) => p._user || p.user_id);
            const filledProperties = properties.filter((p) => p.type_of_property);
            const filledDescs      = descriptions.filter((d) => d.narrative?.trim());
            const filledActions    = actions.filter((a) => a.description?.trim());
            const ready            = !!selectedIncident && filledDescs.length > 0;

            function SummarySection({ icon: Icon, label, count, color, children }) {
              return (
                <div className="rounded-2xl overflow-hidden"
                  style={{ border: '1px solid var(--border)', background: 'var(--bg-raised)' }}>
                  <div className="flex items-center gap-2 px-4 py-2.5"
                    style={{ background: `${color}10`, borderBottom: count > 0 ? '1px solid var(--border)' : 'none' }}>
                    <Icon className="h-4 w-4" style={{ color }} />
                    <p className="text-xs font-semibold flex-1" style={{ color }}>{label}</p>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                      style={{ background: `${color}20`, color }}>{count}</span>
                  </div>
                  {count === 0 ? (
                    <div className="px-4 py-3 flex items-center gap-2">
                      <ExclamationTriangleIcon className="h-3.5 w-3.5" style={{ color: 'var(--text-muted)' }} />
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>None added</p>
                    </div>
                  ) : children}
                </div>
              );
            }

            return (
              <div className="space-y-3">

                {/* Incident hero card */}
                <div className="rounded-2xl overflow-hidden"
                  style={{ border: '1px solid var(--border)', background: 'var(--bg-raised)' }}>
                  <div className="px-5 py-4"
                    style={{
                      background: 'linear-gradient(135deg, rgba(124,58,237,.1) 0%, rgba(124,58,237,.03) 100%)',
                      borderBottom: '1px solid var(--border)',
                    }}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: 'rgba(124,58,237,.15)' }}>
                        <ClipboardDocumentCheckIcon className="h-5 w-5" style={{ color: PURPLE }} />
                      </div>
                      <div>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Incident</p>
                        <p className="text-sm font-bold" style={{ color: 'var(--text)' }}>
                          {selectedIncident
                            ? `${selectedIncident.incident_type ?? '#' + selectedIncident.id} — ${selectedIncident.location ?? ''}`
                            : '—'}
                        </p>
                      </div>
                      <span className="ml-auto text-[10px] font-semibold px-2 py-1 rounded-full"
                        style={{ background: record ? 'rgba(245,158,11,.12)' : 'rgba(124,58,237,.12)', color: record ? '#d97706' : PURPLE }}>
                        {record ? '✎ Editing' : '+ New'}
                      </span>
                    </div>
                  </div>
                  {notes && (
                    <div className="flex gap-3 px-4 py-3">
                      <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                        style={{ background: 'rgba(124,58,237,.1)' }}>
                        <PencilSquareIcon className="h-3.5 w-3.5" style={{ color: PURPLE }} />
                      </div>
                      <p className="text-sm" style={{ color: 'var(--text)', lineHeight: 1.7 }}>{notes}</p>
                    </div>
                  )}
                </div>

                {/* Counts grid */}
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'People Injured',       val: filledPeople.length,     color: '#ef4444', Icon: UserCircleIcon },
                    { label: 'Properties Involved',  val: filledProperties.length, color: '#f59e0b', Icon: BuildingOfficeIcon },
                    { label: 'Descriptions',         val: filledDescs.length,      color: '#0ea5e9', Icon: DocumentTextIcon },
                    { label: 'Actions Taken',        val: filledActions.length,    color: '#10b981', Icon: BoltIcon },
                  ].map(({ label, val, color, Icon }) => (
                    <div key={label} className="rounded-2xl px-4 py-3 flex items-center gap-3"
                      style={{ border: '1px solid var(--border)', background: 'var(--bg-raised)' }}>
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: `${color}15` }}>
                        <Icon className="h-4 w-4" style={{ color }} />
                      </div>
                      <div>
                        <p className="text-xl font-bold leading-none" style={{ color: 'var(--text)' }}>{val}</p>
                        <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{label}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* People detail */}
                <SummarySection icon={UserCircleIcon} label="People Injured" count={filledPeople.length} color="#ef4444">
                  <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
                    {filledPeople.map((p, i) => (
                      <div key={i} className="flex items-center gap-3 px-4 py-2.5"
                        style={{ borderTop: i === 0 ? 'none' : '1px solid var(--border)' }}>
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                          style={{ background: '#ef4444' }}>
                          {((p._user?.firstname?.[0] ?? '') + (p._user?.lastname?.[0] ?? '')).toUpperCase() || (i + 1)}
                        </div>
                        <p className="flex-1 text-sm" style={{ color: 'var(--text)' }}>{displayName(p._user)}</p>
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                          style={{
                            background: p.injury_sustained === 'yes' ? 'rgba(239,68,68,.1)' : 'rgba(16,185,129,.1)',
                            color: p.injury_sustained === 'yes' ? '#ef4444' : '#10b981',
                          }}>
                          {p.injury_sustained === 'yes' ? 'Injured' : 'No injury'}
                        </span>
                      </div>
                    ))}
                  </div>
                </SummarySection>

                {/* Properties detail */}
                <SummarySection icon={BuildingOfficeIcon} label="Properties Involved" count={filledProperties.length} color="#f59e0b">
                  <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
                    {filledProperties.map((p, i) => (
                      <div key={i} className="flex items-center gap-3 px-4 py-2.5"
                        style={{ borderTop: i === 0 ? 'none' : '1px solid var(--border)' }}>
                        <div className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ background: 'rgba(245,158,11,.15)' }}>
                          <BuildingOfficeIcon className="h-3.5 w-3.5" style={{ color: '#f59e0b' }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>{p.type_of_property}</p>
                          {p.nature_of_damage && <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{p.nature_of_damage}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </SummarySection>

                {/* Descriptions detail */}
                <SummarySection icon={DocumentTextIcon} label="Incident Descriptions" count={filledDescs.length} color="#0ea5e9">
                  <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
                    {filledDescs.map((d, i) => (
                      <div key={i} className="px-4 py-3"
                        style={{ borderTop: i === 0 ? 'none' : '1px solid var(--border)' }}>
                        <p className="text-sm leading-relaxed line-clamp-3" style={{ color: 'var(--text)' }}>{d.narrative}</p>
                        {(d.file || d.file_name) && (
                          <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-1 rounded-lg"
                            style={{ background: 'rgba(124,58,237,.08)' }}>
                            <DocumentTextIcon className="h-3 w-3" style={{ color: PURPLE }} />
                            <span className="text-[10px] font-medium" style={{ color: PURPLE }}>
                              {d.file?.name ?? d.file_name}
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </SummarySection>

                {/* Actions detail */}
                <SummarySection icon={BoltIcon} label="Actions Taken" count={filledActions.length} color="#10b981">
                  <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
                    {filledActions.map((a, i) => (
                      <div key={i} className="flex items-start gap-3 px-4 py-2.5"
                        style={{ borderTop: i === 0 ? 'none' : '1px solid var(--border)' }}>
                        <div className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                          style={{ background: 'rgba(16,185,129,.15)' }}>
                          <BoltIcon className="h-3.5 w-3.5" style={{ color: '#10b981' }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>{a.description}</p>
                          <div className="flex items-center gap-2 mt-1">
                            {a._user && <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{displayName(a._user)}</span>}
                            {a.action_date && (
                              <span className="flex items-center gap-0.5 text-xs" style={{ color: 'var(--text-muted)' }}>
                                <CalendarDaysIcon className="h-3 w-3" />{formatDate(a.action_date)}
                              </span>
                            )}
                            {a.action_time && (
                              <span className="flex items-center gap-0.5 text-xs" style={{ color: 'var(--text-muted)' }}>
                                <ClockIcon className="h-3 w-3" />{a.action_time}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </SummarySection>

                {/* Readiness banner */}
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
                      {ready ? 'Ready to submit' : 'Action required'}
                    </p>
                    <p className="text-xs" style={{ color: ready ? '#10b981' : '#ef4444', opacity: 0.8 }}>
                      {ready
                        ? `Review the details above and click "${record ? 'Update Investigation' : 'Start Investigation'}" to save.`
                        : 'Select an incident and add at least one description before submitting.'}
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

          {step < 5 && saveError && (
            <div className="rounded-xl px-4 py-3 flex items-center gap-2"
              style={{ background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.2)' }}>
              <ExclamationTriangleIcon className="h-4 w-4 flex-shrink-0" style={{ color: '#ef4444' }} />
              <p className="text-sm" style={{ color: '#ef4444' }}>{saveError}</p>
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="flex justify-between gap-2 px-5 py-4"
          style={{ borderTop: '1px solid var(--border)' }}>
          <button type="button" onClick={onClose} disabled={saving}
            className="px-4 py-2 rounded-xl text-sm font-medium hover:opacity-75"
            style={{ border: '1px solid var(--border)', color: 'var(--text)' }}>
            Cancel
          </button>
          <div className="flex gap-2">
            {step > 0 && (
              <button type="button" onClick={back} disabled={saving}
                className="px-4 py-2 rounded-xl text-sm font-medium hover:opacity-75"
                style={{ border: '1px solid var(--border)', color: 'var(--text)' }}>
                Back
              </button>
            )}
            {step < STEPS.length - 1 ? (
              <button type="button" onClick={next}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-white hover:opacity-90"
                style={{ background: PURPLE }}>
                Next
              </button>
            ) : (
              <button type="button" onClick={submit} disabled={saving}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-white hover:opacity-90 flex items-center gap-2"
                style={{ background: saving ? 'rgba(124,58,237,.5)' : PURPLE }}>
                {saving
                  ? <><ArrowPathIcon className="h-4 w-4 animate-spin" /> Saving…</>
                  : <>{record ? 'Update Investigation' : 'Start Investigation'}</>}
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
  const PURPLE   = '#7c3aed';

  const stats = [
    { label: 'People',      val: record.people_injured?.length     ?? 0, color: '#ef4444', Icon: UserCircleIcon },
    { label: 'Properties',  val: record.properties_involved?.length ?? 0, color: '#f59e0b', Icon: BuildingOfficeIcon },
    { label: 'Descriptions',val: record.incident_descriptions?.length ?? 0, color: '#0ea5e9', Icon: DocumentTextIcon },
    { label: 'Actions',     val: record.actions_taken?.length       ?? 0, color: '#10b981', Icon: BoltIcon },
  ];

  function DrawerSection({ title, icon: Icon, color, count, children }) {
    return (
      <div className="rounded-2xl overflow-hidden"
        style={{ border: '1px solid var(--border)', background: 'var(--bg-raised)' }}>
        <div className="flex items-center gap-2 px-4 py-2.5"
          style={{ background: `${color}10`, borderBottom: count > 0 ? '1px solid var(--border)' : 'none' }}>
          <Icon className="h-4 w-4" style={{ color }} />
          <p className="text-xs font-semibold flex-1" style={{ color }}>{title}</p>
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
            style={{ background: `${color}20`, color }}>{count}</span>
        </div>
        {count === 0 ? (
          <div className="flex items-center gap-2 px-4 py-3">
            <ExclamationTriangleIcon className="h-3.5 w-3.5 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>None recorded</p>
          </div>
        ) : children}
      </div>
    );
  }

  return (
    <>
      <div className="fixed inset-0 z-30" style={{ background: 'rgba(0,0,0,0.4)' }}
        onClick={onClose} />
      <div className="fixed top-0 right-0 bottom-0 z-40 w-full max-w-lg flex flex-col"
        style={{ background: 'var(--bg-raised)', boxShadow: '-4px 0 24px rgba(0,0,0,.12)' }}>

        {/* Gradient header */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(124,58,237,.14) 0%, rgba(124,58,237,.04) 100%)',
          borderBottom: '1px solid var(--border)',
          flexShrink: 0,
        }}>
          {/* Title row */}
          <div className="flex items-center justify-between px-5 pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(124,58,237,.15)' }}>
                <ClipboardDocumentCheckIcon className="h-6 w-6" style={{ color: PURPLE }} />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest mb-0.5"
                  style={{ color: PURPLE, letterSpacing: '0.1em' }}>Investigation</p>
                <h2 className="text-base font-bold leading-tight" style={{ color: 'var(--text)' }}>
                  #{record.id}
                </h2>
              </div>
            </div>
            <button type="button" onClick={onClose}
              className="p-1.5 rounded-lg hover:opacity-75"
              style={{ border: '1px solid var(--border)', color: 'var(--text-muted)', background: 'var(--bg-raised)' }}>
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Incident info rows */}
          <div className="px-5 pb-4 space-y-2">
            {incident.incident_type && (
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(124,58,237,.12)' }}>
                  <BoltIcon className="h-3.5 w-3.5" style={{ color: PURPLE }} />
                </div>
                <span className="text-sm" style={{ color: 'var(--text)' }}>{incident.incident_type}</span>
              </div>
            )}
            {incident.location && (
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(124,58,237,.12)' }}>
                  <BuildingOfficeIcon className="h-3.5 w-3.5" style={{ color: PURPLE }} />
                </div>
                <span className="text-sm" style={{ color: 'var(--text)' }}>{incident.location}</span>
              </div>
            )}
            {incident.date_of_incident && (
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(124,58,237,.12)' }}>
                  <CalendarDaysIcon className="h-3.5 w-3.5" style={{ color: PURPLE }} />
                </div>
                <span className="text-sm" style={{ color: 'var(--text)' }}>{formatDate(incident.date_of_incident)}</span>
              </div>
            )}
          </div>

          {/* Stats strip */}
          <div className="grid grid-cols-4 px-4 pb-4 gap-2">
            {stats.map(({ label, val, color, Icon }) => (
              <div key={label} className="rounded-xl px-2 py-2 flex flex-col items-center gap-0.5"
                style={{ background: 'var(--bg-raised)', border: '1px solid var(--border)' }}>
                <Icon className="h-4 w-4" style={{ color }} />
                <p className="text-sm font-bold leading-none" style={{ color: 'var(--text)' }}>{val}</p>
                <p className="text-[9px] text-center leading-tight" style={{ color: 'var(--text-muted)' }}>{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">

          {/* Investigation notes */}
          {record.notes && (
            <div className="rounded-2xl overflow-hidden"
              style={{ border: '1px solid var(--border)', background: 'var(--bg-raised)' }}>
              <div className="flex items-center gap-2 px-4 py-2.5"
                style={{ background: `${PURPLE}10`, borderBottom: '1px solid var(--border)' }}>
                <PencilSquareIcon className="h-4 w-4" style={{ color: PURPLE }} />
                <p className="text-xs font-semibold" style={{ color: PURPLE }}>Investigation Notes</p>
              </div>
              <p className="px-4 py-3 text-sm leading-relaxed" style={{ color: 'var(--text)' }}>
                {record.notes}
              </p>
            </div>
          )}

          {/* People Injured */}
          <DrawerSection title="People Injured" icon={UserCircleIcon} color="#ef4444"
            count={record.people_injured?.length ?? 0}>
            <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
              {record.people_injured?.map((p, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3"
                  style={{ borderTop: i === 0 ? 'none' : '1px solid var(--border)' }}>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                    style={{ background: '#ef4444' }}>
                    {((p.user?.firstname?.[0] ?? '') + (p.user?.lastname?.[0] ?? '')).toUpperCase() || (i + 1)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>
                      {displayName(p.user ?? {})}
                    </p>
                    {p.nature_of_injury && (
                      <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{p.nature_of_injury}</p>
                    )}
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold flex-shrink-0"
                    style={{
                      background: p.injury_sustained === 'yes' ? 'rgba(239,68,68,.1)' : 'rgba(16,185,129,.1)',
                      color: p.injury_sustained === 'yes' ? '#ef4444' : '#10b981',
                    }}>
                    {p.injury_sustained === 'yes' ? 'Injured' : 'No injury'}
                  </span>
                </div>
              ))}
            </div>
          </DrawerSection>

          {/* Properties Involved */}
          <DrawerSection title="Properties Involved" icon={BuildingOfficeIcon} color="#f59e0b"
            count={record.properties_involved?.length ?? 0}>
            <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
              {record.properties_involved?.map((p, i) => (
                <div key={i} className="flex items-start gap-3 px-4 py-3"
                  style={{ borderTop: i === 0 ? 'none' : '1px solid var(--border)' }}>
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(245,158,11,.15)' }}>
                    <BuildingOfficeIcon className="h-4 w-4" style={{ color: '#f59e0b' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
                      {p.type_of_property ?? '—'}
                    </p>
                    {p.description && (
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{p.description}</p>
                    )}
                    {p.nature_of_damage && (
                      <div className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-lg"
                        style={{ background: 'rgba(245,158,11,.1)' }}>
                        <ExclamationTriangleIcon className="h-3 w-3" style={{ color: '#f59e0b' }} />
                        <span className="text-[10px] font-medium" style={{ color: '#f59e0b' }}>{p.nature_of_damage}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </DrawerSection>

          {/* Incident Descriptions */}
          <DrawerSection title="Incident Descriptions" icon={DocumentTextIcon} color="#0ea5e9"
            count={record.incident_descriptions?.length ?? 0}>
            <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
              {record.incident_descriptions?.map((d, i) => (
                <div key={i} className="px-4 py-3"
                  style={{ borderTop: i === 0 ? 'none' : '1px solid var(--border)' }}>
                  <div className="flex items-start gap-2 mb-1">
                    <div className="w-5 h-5 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ background: 'rgba(14,165,233,.12)' }}>
                      <DocumentTextIcon className="h-3 w-3" style={{ color: '#0ea5e9' }} />
                    </div>
                    <p className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
                      Description #{i + 1}
                    </p>
                  </div>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--text)', paddingLeft: '1.75rem' }}>
                    {d.narrative}
                  </p>
                  {(d.file_path || d.file_name) && (
                    <div style={{ paddingLeft: '1.75rem' }}>
                      <a href={d.file_path} target="_blank" rel="noreferrer"
                        className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg hover:opacity-80"
                        style={{ background: `${PURPLE}10`, border: `1px solid ${PURPLE}25` }}>
                        <DocumentTextIcon className="h-3 w-3" style={{ color: PURPLE }} />
                        <span className="text-[11px] font-medium" style={{ color: PURPLE }}>
                          {d.file_name ?? 'View attachment'}
                        </span>
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </DrawerSection>

          {/* Actions Taken */}
          <DrawerSection title="Actions Taken" icon={BoltIcon} color="#10b981"
            count={record.actions_taken?.length ?? 0}>
            <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
              {record.actions_taken?.map((a, i) => (
                <div key={i} className="flex items-start gap-3 px-4 py-3"
                  style={{ borderTop: i === 0 ? 'none' : '1px solid var(--border)' }}>
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(16,185,129,.15)' }}>
                    <BoltIcon className="h-4 w-4" style={{ color: '#10b981' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
                      {a.description}
                    </p>
                    {(a.user || a.action_date || a.action_time) && (
                      <div className="flex flex-wrap items-center gap-2 mt-1.5">
                        {a.user && (
                          <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                            <UserCircleIcon className="h-3.5 w-3.5" />
                            {displayName(a.user)}
                          </span>
                        )}
                        {a.action_date && (
                          <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                            <CalendarDaysIcon className="h-3.5 w-3.5" />
                            {formatDate(a.action_date)}
                          </span>
                        )}
                        {a.action_time && (
                          <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                            <ClockIcon className="h-3.5 w-3.5" />
                            {a.action_time}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </DrawerSection>
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
              {meta?.total ?? meta?.total_count ?? '—'} total records
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
