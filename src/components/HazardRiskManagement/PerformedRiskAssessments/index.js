/**
 * PerformedRiskAssessments/index.js
 *
 * Full CRUD page for Performed Risk Assessments.
 *
 * Features:
 *  - Paginated table: Risk Assessment, Performed Date, Note, Entries count
 *  - Multi-step create modal (Select RA + Date → Add Entries → Review)
 *  - Right-side detail drawer showing all entries (with corrective actions,
 *    priority, people at risk, contractors)
 *  - Delete confirmation modal
 *  - Permission-gated actions (performed_risk_assessments.update)
 */
import { useEffect, useState, useRef, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  PlusIcon,
  ArrowPathIcon,
  XMarkIcon,
  ClipboardDocumentCheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  TrashIcon,
  BoltIcon,
  UserGroupIcon,
  FlagIcon,
  CheckCircleIcon,
  PhotoIcon,
  DocumentArrowUpIcon,
  MapPinIcon,
  CalendarDaysIcon,
  ArrowTopRightOnSquareIcon,
  ShieldExclamationIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import { EllipsisVerticalIcon } from '@heroicons/react/20/solid';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import {
  fetchPerformedRiskAssessments,
  createPerformedRiskAssessment,
  updatePerformedRiskAssessment,
  deletePerformedRiskAssessment,
  setPerformedRiskAssessmentFilters,
  clearPerformedRiskAssessmentErrors,
  selectPerformedRiskAssessments,
  selectPerformedRiskAssessmentsMeta,
  selectPerformedRiskAssessmentsLoading,
  selectPerformedRiskAssessmentsError,
  selectPerformedRiskAssessmentsFilters,
  selectPerformedRiskAssessmentsActionLoading,
  selectPerformedRiskAssessmentsActionError,
} from '../../../store/slices/performedRiskAssessmentSlice';
import {
  RiskAssessmentService,
  PerformedRiskAssessmentService,
  CorrectiveActionService,
  EntryPriorityService,
  PerformedEntryService,
  HazardReportService,
} from '../../../services/hazardAndRisk.service';
import UsersService from '../../../services/users.service';
import useAuth from '../../../hooks/useAuth';

// ── Helpers ────────────────────────────────────────────────────────────────

function formatDate(d) {
  if (!d) return '—';
  try { return new Date(d).toLocaleDateString(); } catch { return d; }
}

function displayName(u) {
  if (!u) return '—';
  return `${u.firstname ?? ''} ${u.lastname ?? ''}`.trim() || u.email || `#${u.id}`;
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

// ── Table primitives ───────────────────────────────────────────────────────

const TABLE_COLS = ['#', 'Risk Assessment', 'Performed Date', 'Note', 'Entries', ''];

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
          Delete Performed Risk Assessment
        </h3>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Are you sure you want to delete{' '}
          <strong style={{ color: 'var(--text)' }}>{name}</strong>? All associated
          entries and corrective actions will be removed. This cannot be undone.
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

// ── Create Modal ───────────────────────────────────────────────────────────

const STEPS = ['Select Assessment', 'Add Entries', 'Review'];

const EMPTY_ENTRY = { hazard_description: '', current_control_measures: '' };

function EntryForm({ entry, index, onChange, onRemove, error }) {
  return (
    <div
      className="rounded-xl p-3 space-y-3"
      style={{ background: 'var(--bg-raised)', border: '1px solid var(--border)' }}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
          Entry {index + 1}
        </span>
        {onRemove && (
          <button
            type="button" onClick={onRemove}
            className="p-1 rounded hover:opacity-75"
            style={{ color: 'var(--danger)' }}
            title="Remove entry"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        )}
      </div>

      <div>
        <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text)' }}>
          Hazard Description <span style={{ color: 'var(--danger)' }}>*</span>
        </label>
        <textarea
          className="ui-input w-full resize-none text-sm"
          rows={2}
          value={entry.hazard_description}
          onChange={(e) => onChange({ ...entry, hazard_description: e.target.value })}
          placeholder="Describe the hazard…"
        />
        {error?.hazard_description && (
          <p className="text-xs mt-0.5" style={{ color: 'var(--danger)' }}>
            {error.hazard_description}
          </p>
        )}
      </div>

      <div>
        <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text)' }}>
          Current Control Measures <span style={{ color: 'var(--danger)' }}>*</span>
        </label>
        <textarea
          className="ui-input w-full resize-none text-sm"
          rows={2}
          value={entry.current_control_measures}
          onChange={(e) => onChange({ ...entry, current_control_measures: e.target.value })}
          placeholder="List current control measures…"
        />
        {error?.current_control_measures && (
          <p className="text-xs mt-0.5" style={{ color: 'var(--danger)' }}>
            {error.current_control_measures}
          </p>
        )}
      </div>
    </div>
  );
}

function CreateModal({ open, pra, onClose, onSave, saving, saveError }) {
  const isEdit = !!pra;
  const [step, setStep] = useState(0);
  const [raList, setRaList] = useState([]);
  const [raLoading, setRaLoading] = useState(false);
  const [form, setForm] = useState({ risk_assessment_id: '', performed_date: '', note: '' });
  const [entries, setEntries] = useState([{ ...EMPTY_ENTRY }]);
  const [errors, setErrors] = useState({});
  const [entryErrors, setEntryErrors] = useState([]);

  // Load risk assessments for dropdown and pre-populate when editing
  useEffect(() => {
    if (!open) return;
    setStep(0);
    setErrors({});
    setEntryErrors([]);

    if (isEdit) {
      setForm({
        risk_assessment_id: String(pra.risk_assessment_id ?? ''),
        performed_date: pra.performed_date ?? '',
        note: pra.note ?? '',
      });
      const existingEntries = (pra.performed_risk_assessment_entries ?? []).map((e) => ({
        hazard_description: e.hazard_description ?? '',
        current_control_measures: e.current_control_measures ?? '',
      }));
      setEntries(existingEntries.length > 0 ? existingEntries : [{ ...EMPTY_ENTRY }]);
    } else {
      setForm({ risk_assessment_id: '', performed_date: '', note: '' });
      setEntries([{ ...EMPTY_ENTRY }]);
    }

    setRaLoading(true);
    RiskAssessmentService.list({ per_page: 100 })
      .then((res) => {
        const list = Array.isArray(res) ? res : (res.data ?? []);
        setRaList(list);
      })
      .catch(() => toast.error('Failed to load risk assessments'))
      .finally(() => setRaLoading(false));
  }, [open, isEdit, pra]);

  function validateStep0() {
    const errs = {};
    if (!form.risk_assessment_id) errs.risk_assessment_id = 'Please select a risk assessment';
    if (!form.performed_date) errs.performed_date = 'Performed date is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function validateStep1() {
    const errs = entries.map((e) => {
      const err = {};
      if (!e.hazard_description?.trim()) err.hazard_description = 'Required';
      if (!e.current_control_measures?.trim()) err.current_control_measures = 'Required';
      return err;
    });
    setEntryErrors(errs);
    return errs.every((e) => Object.keys(e).length === 0);
  }

  function next() {
    if (step === 0 && validateStep0()) setStep(1);
    if (step === 1 && validateStep1()) setStep(2);
  }
  function back() { setStep((s) => s - 1); }

  function addEntry() {
    setEntries((prev) => [...prev, { ...EMPTY_ENTRY }]);
    setEntryErrors((prev) => [...prev, {}]);
  }

  function removeEntry(i) {
    if (entries.length <= 1) return; // At least one entry required
    setEntries((prev) => prev.filter((_, idx) => idx !== i));
    setEntryErrors((prev) => prev.filter((_, idx) => idx !== i));
  }

  function updateEntry(i, updated) {
    setEntries((prev) => prev.map((e, idx) => (idx === i ? updated : e)));
  }

  function submit() {
    if (!validateStep1()) { setStep(1); return; }
    const payload = {
      performed_date: form.performed_date,
      entries: entries.map(({ hazard_description, current_control_measures }) => ({
        hazard_description,
        current_control_measures,
      })),
    };
    if (!isEdit) payload.risk_assessment_id = Number(form.risk_assessment_id);
    if (form.note.trim()) payload.note = form.note;
    onSave(payload);
  }

  const selectedRA = raList.find((r) => String(r.id) === String(form.risk_assessment_id));

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
            {isEdit ? 'Edit Performed Risk Assessment' : 'New Performed Risk Assessment'}
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

        {/* ── Step 0: Select Assessment ── */}
        {step === 0 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text)' }}>
                Risk Assessment <span style={{ color: 'var(--danger)' }}>*</span>
              </label>
              <select
                className="ui-input w-full"
                value={form.risk_assessment_id}
                onChange={(e) => setForm({ ...form, risk_assessment_id: e.target.value })}
                disabled={raLoading || isEdit}
              >
                <option value="">
                  {raLoading ? 'Loading…' : '— Select a risk assessment —'}
                </option>
                {raList.map((ra) => (
                  <option key={ra.id} value={ra.id}>
                    #{ra.id} — {ra.activity} ({ra.location})
                  </option>
                ))}
              </select>
              {errors.risk_assessment_id && (
                <p className="text-xs mt-1" style={{ color: 'var(--danger)' }}>
                  {errors.risk_assessment_id}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text)' }}>
                Performed Date <span style={{ color: 'var(--danger)' }}>*</span>
              </label>
              <input
                type="date"
                className="ui-input w-full"
                value={form.performed_date}
                onChange={(e) => setForm({ ...form, performed_date: e.target.value })}
              />
              {errors.performed_date && (
                <p className="text-xs mt-1" style={{ color: 'var(--danger)' }}>
                  {errors.performed_date}
                </p>
              )}
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
                placeholder="Optional notes about this execution…"
              />
            </div>
          </div>
        )}

        {/* ── Step 1: Add Entries ── */}
        {step === 1 && (
          <div className="space-y-3">
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Add at least one entry describing the hazard and current control measures.
            </p>
            {entries.map((entry, i) => (
              <EntryForm
                key={i}
                entry={entry}
                index={i}
                onChange={(updated) => updateEntry(i, updated)}
                onRemove={entries.length > 1 ? () => removeEntry(i) : null}
                error={entryErrors[i]}
              />
            ))}
            <button
              type="button"
              onClick={addEntry}
              className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg w-full justify-center hover:opacity-80"
              style={{ border: '1px dashed var(--border)', color: 'var(--accent)' }}
            >
              <PlusIcon className="h-4 w-4" /> Add Another Entry
            </button>
          </div>
        )}

        {/* ── Step 2: Review ── */}
        {step === 2 && (
          <div className="space-y-3">
            <div
              className="rounded-xl p-4 space-y-2.5"
              style={{ background: 'var(--bg-raised)', border: '1px solid var(--border)' }}
            >
              <div className="flex gap-3">
                <span className="text-xs font-medium w-36 flex-shrink-0" style={{ color: 'var(--text-muted)' }}>
                  Risk Assessment
                </span>
                <span className="text-xs flex-1" style={{ color: 'var(--text)' }}>
                  {selectedRA ? `#${selectedRA.id} — ${selectedRA.activity}` : form.risk_assessment_id}
                </span>
              </div>
              <div className="flex gap-3">
                <span className="text-xs font-medium w-36 flex-shrink-0" style={{ color: 'var(--text-muted)' }}>
                  Performed Date
                </span>
                <span className="text-xs flex-1" style={{ color: 'var(--text)' }}>
                  {form.performed_date}
                </span>
              </div>
              <div className="flex gap-3">
                <span className="text-xs font-medium w-36 flex-shrink-0" style={{ color: 'var(--text-muted)' }}>
                  Notes
                </span>
                <span className="text-xs flex-1" style={{ color: 'var(--text)' }}>
                  {form.note || '—'}
                </span>
              </div>
              <div className="flex gap-3">
                <span className="text-xs font-medium w-36 flex-shrink-0" style={{ color: 'var(--text-muted)' }}>
                  Entries
                </span>
                <span className="text-xs flex-1" style={{ color: 'var(--text)' }}>
                  {entries.length} entr{entries.length !== 1 ? 'ies' : 'y'}
                </span>
              </div>
            </div>

            {/* Entry preview list */}
            <div className="space-y-2">
              {entries.map((e, i) => (
                <div
                  key={i}
                  className="rounded-lg px-3 py-2 space-y-1"
                  style={{ background: 'var(--bg-raised)', border: '1px solid var(--border)' }}
                >
                  <p className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
                    Entry {i + 1}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--text)' }}>
                    <span className="font-medium">Hazard:</span> {e.hazard_description}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--text)' }}>
                    <span className="font-medium">Controls:</span> {e.current_control_measures}
                  </p>
                </div>
              ))}
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
              {saving ? (isEdit ? 'Saving…' : 'Creating…') : (isEdit ? 'Save Changes' : 'Create')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Execute Entry Modal ────────────────────────────────────────────────────

function FileUploadZone({ label, required, accept, file, onChange, hint, error, icon: Icon }) {
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);

  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) onChange(f);
  }

  const previewUrl = file && file.type?.startsWith('image/') ? URL.createObjectURL(file) : null;

  return (
    <div>
      <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text)' }}>
        {label} {required && <span style={{ color: 'var(--danger)' }}>*</span>}
      </label>
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className="relative rounded-xl cursor-pointer transition-all"
        style={{
          border: `2px dashed ${error ? 'var(--danger)' : dragOver ? 'var(--accent)' : file ? '#16a34a' : 'var(--border)'}`,
          background: dragOver ? 'var(--bg-raised)' : file ? 'rgba(22,163,74,.04)' : 'var(--bg-raised)',
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="sr-only"
          onChange={(e) => onChange(e.target.files?.[0] ?? null)}
        />
        {file ? (
          <div className="flex items-center gap-3 p-3">
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="preview"
                className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                style={{ border: '1px solid var(--border)' }}
              />
            ) : (
              <div
                className="w-16 h-16 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(22,163,74,.12)' }}
              >
                <Icon className="h-7 w-7" style={{ color: '#16a34a' }} />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold truncate" style={{ color: 'var(--text)' }}>{file.name}</p>
              <p className="text-[11px] mt-0.5" style={{ color: '#16a34a' }}>
                {(file.size / 1024).toFixed(1)} KB &mdash; ready to upload
              </p>
            </div>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onChange(null); }}
              className="p-1.5 rounded-lg hover:opacity-75 flex-shrink-0"
              style={{ color: 'var(--danger)' }}
              title="Remove"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-6 gap-2">
            <Icon className="h-8 w-8" style={{ color: 'var(--text-muted)' }} />
            <div className="text-center">
              <p className="text-xs font-medium" style={{ color: 'var(--text)' }}>Click or drag &amp; drop</p>
              {hint && <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{hint}</p>}
            </div>
          </div>
        )}
      </div>
      {error && <p className="text-xs mt-1" style={{ color: 'var(--danger)' }}>{error}</p>}
    </div>
  );
}

function PeopleAtRiskInput({ value, onChange }) {
  const [input, setInput] = useState('');

  function add() {
    const t = input.trim();
    if (!t || value.includes(t)) return;
    onChange([...value, t]);
    setInput('');
  }

  function handleKey(e) {
    if (e.key === 'Enter') { e.preventDefault(); add(); }
  }

  return (
    <div>
      <div className="flex gap-2">
        <input
          className="ui-input flex-1 text-sm"
          placeholder="e.g. Maintenance staff, Visitors…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
        />
        <button
          type="button"
          onClick={add}
          disabled={!input.trim()}
          className="px-3 rounded-lg text-xs font-semibold hover:opacity-80 disabled:opacity-40 transition-opacity"
          style={{ background: 'rgba(220,38,38,.12)', color: '#dc2626', border: '1px solid rgba(220,38,38,.2)' }}
        >
          + Add
        </button>
      </div>
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2.5">
          {value.map((t, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium"
              style={{ background: 'rgba(220,38,38,.1)', color: '#dc2626', border: '1px solid rgba(220,38,38,.2)' }}
            >
              {t}
              <button
                type="button"
                onClick={() => onChange(value.filter((_, j) => j !== i))}
                className="ml-0.5 hover:opacity-70 leading-none"
              >
                <XMarkIcon className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function ExecuteEntryModal({ entry, open, onClose, onDone }) {
  const [form, setForm] = useState({ hazard_id: '', due_date: '', note: '' });
  const [imageBefore, setImageBefore] = useState(null);
  const [proofFile, setProofFile] = useState(null);
  const [peopleAtRisk, setPeopleAtRisk] = useState([]);
  const [hazardList, setHazardList] = useState([]);
  const [hazardLoading, setHazardLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!open) return;
    setForm({ hazard_id: '', due_date: '', note: '' });
    setImageBefore(null);
    setProofFile(null);
    setPeopleAtRisk([]);
    setErrors({});
    setHazardLoading(true);
    HazardReportService.list({ per_page: 100 })
      .then((res) => {
        const list = Array.isArray(res) ? res : (res.data ?? []);
        setHazardList(list);
      })
      .catch(() => toast.error('Failed to load hazard reports'))
      .finally(() => setHazardLoading(false));
  }, [open]);

  function validate() {
    const errs = {};
    if (!form.hazard_id) errs.hazard_id = 'Hazard report is required';
    if (!form.due_date) errs.due_date = 'Due date is required';
    if (!imageBefore) errs.image_before = 'Image before is required';
    if (!proofFile) errs.proof_of_completion = 'Proof of completion is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function submit() {
    if (!validate()) return;
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('hazard_id', form.hazard_id);
      fd.append('due_date', form.due_date);
      if (form.note) fd.append('note', form.note);
      fd.append('image_before', imageBefore);
      fd.append('proof_of_completion', proofFile);
      peopleAtRisk.forEach((t) => fd.append('people_at_risk_titles[]', t));
      await PerformedEntryService.execute(entry.id, fd);
      toast.success('Entry executed successfully.');
      onDone();
      onClose();
    } catch (e) {
      const msgs = e.response?.data?.errors ?? e.response?.data?.message ?? 'Execution failed.';
      toast.error(Array.isArray(msgs) ? msgs.join(', ') : String(msgs));
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.65)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="ui-card w-full max-w-lg flex flex-col"
        style={{ maxHeight: '92vh' }}
      >
        {/* Header */}
        <div
          className="flex items-center gap-3 px-6 py-4 flex-shrink-0"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(22,163,74,.12)' }}
          >
            <BoltIcon className="h-5 w-5" style={{ color: '#16a34a' }} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold" style={{ color: 'var(--text)' }}>Execute Entry</h3>
            <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>
              {entry?.hazard_description}
            </p>
          </div>
          <button
            type="button" onClick={onClose}
            className="p-1.5 rounded-lg hover:opacity-75"
            style={{ color: 'var(--text-muted)' }}
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

          {/* Section: Linkage */}
          <div className="space-y-4">
            <p
              className="text-[11px] font-bold uppercase tracking-widest"
              style={{ color: 'var(--text-muted)' }}
            >
              Linkage &amp; Timeline
            </p>
            {/* Hazard Report */}
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text)' }}>
                Hazard Report <span style={{ color: 'var(--danger)' }}>*</span>
              </label>
              <select
                className="ui-input w-full"
                value={form.hazard_id}
                onChange={(e) => setForm({ ...form, hazard_id: e.target.value })}
              >
                <option value="">{hazardLoading ? 'Loading…' : '— Select hazard report —'}</option>
                {hazardList.map((h) => (
                  <option key={h.id} value={h.id}>
                    #{h.id} &mdash; {h.hazard_type} @ {h.location}
                  </option>
                ))}
              </select>
              {errors.hazard_id && (
                <p className="text-xs mt-1" style={{ color: 'var(--danger)' }}>{errors.hazard_id}</p>
              )}
            </div>

            {/* Due Date + Note row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text)' }}>
                  Due Date <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <input
                  type="date" className="ui-input w-full"
                  value={form.due_date}
                  onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                />
                {errors.due_date && (
                  <p className="text-xs mt-1" style={{ color: 'var(--danger)' }}>{errors.due_date}</p>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text)' }}>
                  Note <span style={{ color: 'var(--text-muted)' }}>(optional)</span>
                </label>
                <input
                  type="text" className="ui-input w-full"
                  value={form.note}
                  onChange={(e) => setForm({ ...form, note: e.target.value })}
                  placeholder="Brief note…"
                />
              </div>
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--border)' }} />

          {/* Section: Evidence */}
          <div className="space-y-4">
            <p
              className="text-[11px] font-bold uppercase tracking-widest"
              style={{ color: 'var(--text-muted)' }}
            >
              Evidence Files <span style={{ color: 'var(--danger)' }}>*</span>
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FileUploadZone
                label="Image Before"
                required
                accept="image/*"
                file={imageBefore}
                onChange={setImageBefore}
                hint="Photo of hazard before mitigation"
                error={errors.image_before}
                icon={PhotoIcon}
              />
              <FileUploadZone
                label="Proof of Completion"
                required
                accept="image/*,application/pdf"
                file={proofFile}
                onChange={setProofFile}
                hint="Image or PDF confirming completion"
                error={errors.proof_of_completion}
                icon={DocumentArrowUpIcon}
              />
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--border)' }} />

          {/* Section: People at Risk */}
          <div className="space-y-3">
            <div>
              <p
                className="text-[11px] font-bold uppercase tracking-widest"
                style={{ color: 'var(--text-muted)' }}
              >
                People at Risk <span style={{ color: 'var(--text-muted)', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional)</span>
              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                Type a group or role name and press Enter or click Add.
              </p>
            </div>
            <PeopleAtRiskInput value={peopleAtRisk} onChange={setPeopleAtRisk} />
          </div>
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-end gap-3 px-6 py-4 flex-shrink-0"
          style={{ borderTop: '1px solid var(--border)', background: 'var(--bg-raised)' }}
        >
          <button
            type="button" onClick={onClose} disabled={submitting}
            className="px-4 py-2 rounded-lg text-sm font-medium hover:opacity-75"
            style={{ border: '1px solid var(--border)', color: 'var(--text)' }}
          >
            Cancel
          </button>
          <button
            type="button" onClick={submit} disabled={submitting}
            className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
            style={{ background: '#16a34a' }}
          >
            <BoltIcon className="h-4 w-4" />
            {submitting ? 'Executing…' : 'Execute Entry'}
          </button>
        </div>
      </div>
    </div>
  );
}



// ── Corrective Action Modal ────────────────────────────────────────────────

function CorrectiveActionModal({ entry, open, onClose, onDone }) {
  const EMPTY_SCORE = { probability: '', consequence: '', result: '' };
  const [form, setForm]       = useState({ description: '' });
  const [inherent, setInherent] = useState({ ...EMPTY_SCORE });
  const [residual, setResidual] = useState({ ...EMPTY_SCORE });
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors]   = useState({});

  useEffect(() => {
    if (!open) return;
    setForm({ description: '' });
    setInherent({ ...EMPTY_SCORE });
    setResidual({ ...EMPTY_SCORE });
    setErrors({});
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  function validate() {
    const errs = {};
    if (!form.description?.trim()) errs.description = 'Description is required';
    if (!inherent.probability || !inherent.consequence || !inherent.result)
      errs.inherent = 'All inherent risk score fields are required';
    if (!residual.probability || !residual.consequence || !residual.result)
      errs.residual = 'All residual risk score fields are required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function submit() {
    if (!validate()) return;
    setSubmitting(true);
    try {
      await CorrectiveActionService.create({
        performed_risk_assessment_entry_id: entry.id,
        description: form.description,
        inherent_risk_score: {
          probability: Number(inherent.probability),
          consequence: Number(inherent.consequence),
          result: Number(inherent.result),
        },
        residual_risk_score: {
          probability: Number(residual.probability),
          consequence: Number(residual.consequence),
          result: Number(residual.result),
        },
      });
      toast.success('Corrective action added.');
      onDone();
      onClose();
    } catch (e) {
      const msgs = e.response?.data?.errors ?? e.response?.data?.message ?? 'Failed to save.';
      toast.error(Array.isArray(msgs) ? msgs.join(', ') : String(msgs));
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) return null;

  // Compute live score result as probability × consequence
  const inherentResult = inherent.probability && inherent.consequence
    ? Number(inherent.probability) * Number(inherent.consequence) : null;
  const residualResult = residual.probability && residual.consequence
    ? Number(residual.probability) * Number(residual.consequence) : null;

  function riskColor(val) {
    if (!val) return 'var(--text-muted)';
    if (val >= 17) return '#7c3aed';
    if (val >= 10) return '#dc2626';
    if (val >= 5)  return '#d97706';
    return '#16a34a';
  }
  function riskLabel(val) {
    if (!val) return null;
    if (val >= 17) return 'Critical';
    if (val >= 10) return 'High';
    if (val >= 5)  return 'Medium';
    return 'Low';
  }

  function ScoreSection({ label, accent, value, onChange, error }) {
    const computed = value.probability && value.consequence
      ? Number(value.probability) * Number(value.consequence) : null;
    const color = riskColor(computed);
    const rlabel = riskLabel(computed);

    return (
      <div
        className="rounded-2xl overflow-hidden"
        style={{ border: `1px solid ${accent}30` }}
      >
        {/* Section header */}
        <div
          className="flex items-center justify-between px-4 py-2.5"
          style={{ background: `${accent}10`, borderBottom: `1px solid ${accent}20` }}
        >
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: accent }}>
            {label}
          </p>
          {computed != null && (
            <span
              className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold"
              style={{ background: `${color}18`, color, border: `1px solid ${color}30` }}
            >
              {computed} · {rlabel}
            </span>
          )}
        </div>
        <div className="px-4 py-3">
          <div className="grid grid-cols-3 gap-3">
            {[
              { key: 'probability', hint: '1 – 5' },
              { key: 'consequence', hint: '1 – 5' },
              { key: 'result',      hint: 'auto' },
            ].map(({ key, hint }) => (
              <div key={key}>
                <label
                  className="block text-[10px] font-semibold uppercase tracking-wide mb-1"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {key}
                </label>
                <input
                  type="number" min={1} max={25}
                  className="ui-input w-full text-sm font-semibold text-center"
                  value={value[key]}
                  onChange={(e) => onChange({ ...value, [key]: e.target.value })}
                  placeholder={hint}
                  style={{ borderColor: error ? 'var(--danger)' : undefined }}
                />
              </div>
            ))}
          </div>
          {error && (
            <p className="text-[11px] mt-2" style={{ color: 'var(--danger)' }}>{error}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.65)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="ui-card w-full max-w-lg flex flex-col"
        style={{ maxHeight: '92vh' }}
      >
        {/* ── Header ── */}
        <div
          className="flex items-center gap-4 px-6 py-5 flex-shrink-0"
          style={{
            borderBottom: '1px solid var(--border)',
            background: 'linear-gradient(to bottom, var(--bg-raised), var(--bg))',
          }}
        >
          <div
            className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(217,119,6,.15)', border: '1px solid rgba(217,119,6,.2)' }}
          >
            <CheckCircleIcon className="h-6 w-6" style={{ color: '#d97706' }} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold" style={{ color: 'var(--text)' }}>
              Add Corrective Action
            </h3>
            <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>
              {entry?.hazard_description}
            </p>
          </div>
          <button
            type="button" onClick={onClose}
            className="p-1.5 rounded-lg hover:opacity-75 flex-shrink-0"
            style={{ color: 'var(--text-muted)' }}
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Description */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wide mb-2" style={{ color: 'var(--text-muted)' }}>
              Description <span style={{ color: 'var(--danger)' }}>*</span>
            </label>
            <textarea
              className="ui-input w-full resize-none"
              rows={4}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Describe the corrective action to be taken…"
              style={{ borderColor: errors.description ? 'var(--danger)' : undefined }}
            />
            {errors.description && (
              <p className="text-[11px] mt-1" style={{ color: 'var(--danger)' }}>{errors.description}</p>
            )}
          </div>

          <div style={{ borderTop: '1px solid var(--border)' }} />

          {/* Risk Scores */}
          <div className="space-y-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                Risk Scores
              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                Enter probability and consequence (1–5). Result = Probability × Consequence.
              </p>
            </div>

            {/* Live risk comparison */}
            {(inherentResult != null || residualResult != null) && (
              <div
                className="flex items-center justify-around py-3 px-4 rounded-xl"
                style={{ background: 'var(--bg-raised)', border: '1px solid var(--border)' }}
              >
                <div className="text-center">
                  <p className="text-[10px] font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--text-muted)' }}>Inherent</p>
                  <span
                    className="text-xl font-black"
                    style={{ color: riskColor(inherentResult) }}
                  >
                    {inherentResult ?? '—'}
                  </span>
                  {inherentResult && <p className="text-[10px] mt-0.5 font-semibold" style={{ color: riskColor(inherentResult) }}>{riskLabel(inherentResult)}</p>}
                </div>
                <div style={{ width: 1, height: 40, background: 'var(--border)' }} />
                <div className="text-center">
                  <p className="text-[10px] font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--text-muted)' }}>Residual</p>
                  <span
                    className="text-xl font-black"
                    style={{ color: riskColor(residualResult) }}
                  >
                    {residualResult ?? '—'}
                  </span>
                  {residualResult && <p className="text-[10px] mt-0.5 font-semibold" style={{ color: riskColor(residualResult) }}>{riskLabel(residualResult)}</p>}
                </div>
              </div>
            )}

            <ScoreSection
              label="Inherent Risk Score"
              accent="#dc2626"
              value={inherent}
              onChange={setInherent}
              error={errors.inherent}
            />
            <ScoreSection
              label="Residual Risk Score"
              accent="#16a34a"
              value={residual}
              onChange={setResidual}
              error={errors.residual}
            />
          </div>
        </div>

        {/* ── Footer ── */}
        <div
          className="flex items-center justify-end gap-3 px-6 py-4 flex-shrink-0"
          style={{ borderTop: '1px solid var(--border)', background: 'var(--bg-raised)' }}
        >
          <button
            type="button" onClick={onClose} disabled={submitting}
            className="px-4 py-2 rounded-lg text-sm font-medium hover:opacity-75"
            style={{ border: '1px solid var(--border)', color: 'var(--text)' }}
          >
            Cancel
          </button>
          <button
            type="button" onClick={submit} disabled={submitting}
            className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
            style={{ background: '#d97706' }}
          >
            <CheckCircleIcon className="h-4 w-4" />
            {submitting ? 'Saving…' : 'Add Corrective Action'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Priority Modal ─────────────────────────────────────────────────────────

const PRIORITY_LEVELS = [
  { label: 'Low',      color: '#16a34a', bg: 'rgba(22,163,74,.12)',  border: 'rgba(22,163,74,.25)',  desc: 'Monitor and review periodically' },
  { label: 'Medium',   color: '#d97706', bg: 'rgba(217,119,6,.12)',  border: 'rgba(217,119,6,.25)',  desc: 'Address within the month' },
  { label: 'High',     color: '#dc2626', bg: 'rgba(220,38,38,.12)',  border: 'rgba(220,38,38,.25)',  desc: 'Requires prompt attention' },
  { label: 'Critical', color: '#7c3aed', bg: 'rgba(124,58,237,.12)', border: 'rgba(124,58,237,.25)', desc: 'Must be resolved immediately' },
];

function PriorityModal({ entry, open, onClose, onDone }) {
  const existing = entry?.priority ?? null;
  const [form, setForm] = useState({ priority_level: '', due_date: '' });
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!open) return;
    setForm({
      priority_level: existing?.priority_level ?? '',
      due_date: existing?.due_date ?? '',
    });
    setErrors({});
  }, [open, existing]);

  function validate() {
    const errs = {};
    if (!form.priority_level) errs.priority_level = 'Please select a priority level';
    if (!form.due_date) errs.due_date = 'Due date is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function submit() {
    if (!validate()) return;
    setSubmitting(true);
    try {
      if (existing?.id) {
        await EntryPriorityService.update(existing.id, form);
        toast.success('Priority updated.');
      } else {
        await EntryPriorityService.create({
          performed_risk_assessment_entry_id: entry.id,
          ...form,
        });
        toast.success('Priority set.');
      }
      onDone();
      onClose();
    } catch (e) {
      const msgs = e.response?.data?.errors ?? e.response?.data?.message ?? 'Failed to save.';
      toast.error(Array.isArray(msgs) ? msgs.join(', ') : String(msgs));
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) return null;

  const selectedMeta = PRIORITY_LEVELS.find((l) => l.label === form.priority_level);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.65)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="ui-card w-full max-w-md flex flex-col"
        style={{ maxHeight: '90vh' }}
      >
        {/* ── Header ── */}
        <div
          className="flex items-center gap-4 px-6 py-5 flex-shrink-0"
          style={{
            borderBottom: '1px solid var(--border)',
            background: 'linear-gradient(to bottom, var(--bg-raised), var(--bg))',
          }}
        >
          <div
            className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{
              background: selectedMeta ? `${selectedMeta.bg}` : 'rgba(124,58,237,.12)',
              border: `1px solid ${selectedMeta?.border ?? 'rgba(124,58,237,.2)'}`,
              transition: 'background 0.2s, border-color 0.2s',
            }}
          >
            <FlagIcon
              className="h-6 w-6"
              style={{ color: selectedMeta?.color ?? '#7c3aed', transition: 'color 0.2s' }}
            />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold" style={{ color: 'var(--text)' }}>
              {existing ? 'Update Priority' : 'Set Priority'}
            </h3>
            <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>
              {entry?.hazard_description}
            </p>
          </div>
          <button
            type="button" onClick={onClose}
            className="p-1.5 rounded-lg hover:opacity-75 flex-shrink-0"
            style={{ color: 'var(--text-muted)' }}
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          {/* Priority level grid */}
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>
              Priority Level <span style={{ color: 'var(--danger)' }}>*</span>
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              {PRIORITY_LEVELS.map(({ label, color, bg, border, desc }) => {
                const selected = form.priority_level === label;
                return (
                  <button
                    key={label}
                    type="button"
                    onClick={() => setForm({ ...form, priority_level: label })}
                    className="text-left p-3.5 rounded-2xl transition-all duration-200"
                    style={{
                      background: selected ? bg : 'var(--bg-raised)',
                      border: `1.5px solid ${selected ? border : 'var(--border)'}`,
                      boxShadow: selected ? `0 0 0 2px ${color}20` : 'none',
                    }}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ background: color }}
                      />
                      <p className="text-sm font-bold" style={{ color: selected ? color : 'var(--text)' }}>
                        {label}
                      </p>
                      {selected && (
                        <CheckCircleIcon className="h-4 w-4 ml-auto flex-shrink-0" style={{ color }} />
                      )}
                    </div>
                    <p className="text-[11px] leading-relaxed pl-4" style={{ color: 'var(--text-muted)' }}>
                      {desc}
                    </p>
                  </button>
                );
              })}
            </div>
            {errors.priority_level && (
              <p className="text-[11px] mt-2" style={{ color: 'var(--danger)' }}>{errors.priority_level}</p>
            )}
          </div>

          <div style={{ borderTop: '1px solid var(--border)' }} />

          {/* Due date */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>
              Due Date <span style={{ color: 'var(--danger)' }}>*</span>
            </label>
            <input
              type="date"
              className="ui-input w-full"
              value={form.due_date}
              onChange={(e) => setForm({ ...form, due_date: e.target.value })}
              style={{ borderColor: errors.due_date ? 'var(--danger)' : undefined }}
            />
            {errors.due_date && (
              <p className="text-[11px] mt-1" style={{ color: 'var(--danger)' }}>{errors.due_date}</p>
            )}
          </div>
        </div>

        {/* ── Footer ── */}
        <div
          className="flex items-center justify-end gap-3 px-6 py-4 flex-shrink-0"
          style={{ borderTop: '1px solid var(--border)', background: 'var(--bg-raised)' }}
        >
          <button
            type="button" onClick={onClose} disabled={submitting}
            className="px-4 py-2 rounded-lg text-sm font-medium hover:opacity-75"
            style={{ border: '1px solid var(--border)', color: 'var(--text)' }}
          >
            Cancel
          </button>
          <button
            type="button" onClick={submit} disabled={submitting}
            className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
            style={{ background: selectedMeta?.color ?? '#7c3aed' }}
          >
            <FlagIcon className="h-4 w-4" />
            {submitting ? 'Saving…' : (existing ? 'Update Priority' : 'Set Priority')}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Contractor Modal ───────────────────────────────────────────────────────

function ContractorModal({ entry, open, onClose, onDone }) {
  const [users, setUsers]         = useState([]);
  const [selected, setSelected]   = useState([]);
  const [query, setQuery]         = useState('');
  const [fetching, setFetching]   = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const searchTimer = useRef(null);

  useEffect(() => {
    if (!open) return;
    setSelected(entry?.contractors ?? []);
    setQuery('');
    loadUsers('');
  }, [open, entry]); // eslint-disable-line react-hooks/exhaustive-deps

  async function loadUsers(q) {
    setFetching(true);
    try {
      const params = { per_page: 50, 'filter[role]': 'contractor' };
      if (q) params.q = q;
      const res = await UsersService.list(params);
      const list = Array.isArray(res) ? res : (res.data ?? []);
      setUsers(list);
    } catch (_) { }
    finally { setFetching(false); }
  }

  function handleSearch(val) {
    setQuery(val);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => loadUsers(val), 300);
  }

  function toggle(u) {
    setSelected((prev) =>
      prev.find((v) => v.id === u.id) ? prev.filter((v) => v.id !== u.id) : [...prev, u]
    );
  }

  async function submit() {
    setSubmitting(true);
    try {
      await PerformedEntryService.assignContractor(entry.id, {
        contractor_ids: selected.map((u) => u.id),
      });
      toast.success('Contractors updated.');
      onDone();
      onClose();
    } catch (e) {
      const msgs = e.response?.data?.errors ?? e.response?.data?.message ?? 'Failed to assign.';
      toast.error(Array.isArray(msgs) ? msgs.join(', ') : String(msgs));
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) return null;

  const unselected = users.filter((u) => !selected.find((s) => s.id === u.id));

  function initials(u) {
    const f = (u.firstname ?? '')[0] ?? '';
    const l = (u.lastname ?? '')[0] ?? '';
    return (f + l).toUpperCase() || (u.email ?? '#')[0].toUpperCase();
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.65)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="ui-card w-full max-w-md flex flex-col"
        style={{ maxHeight: '88vh' }}
      >
        {/* ── Header ── */}
        <div
          className="flex items-center gap-4 px-6 py-5 flex-shrink-0"
          style={{
            borderBottom: '1px solid var(--border)',
            background: 'linear-gradient(to bottom, var(--bg-raised), var(--bg))',
          }}
        >
          <div
            className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(124,58,237,.12)', border: '1px solid rgba(124,58,237,.2)' }}
          >
            <UserGroupIcon className="h-6 w-6" style={{ color: '#7c3aed' }} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold" style={{ color: 'var(--text)' }}>Assign Contractors</h3>
            <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>
              {entry?.hazard_description}
            </p>
          </div>
          <button
            type="button" onClick={onClose}
            className="p-1.5 rounded-lg hover:opacity-75 flex-shrink-0"
            style={{ color: 'var(--text-muted)' }}
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* ── Selected strip ── */}
        {selected.length > 0 && (
          <div
            className="px-6 py-3 flex flex-wrap gap-2 flex-shrink-0"
            style={{ borderBottom: '1px solid var(--border)', background: 'rgba(124,58,237,.04)' }}
          >
            {selected.map((u) => (
              <span
                key={u.id}
                className="inline-flex items-center gap-1.5 pl-1 pr-2 py-0.5 rounded-full text-xs font-medium"
                style={{ background: 'rgba(124,58,237,.12)', color: '#7c3aed', border: '1px solid rgba(124,58,237,.2)' }}
              >
                <span
                  className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0"
                  style={{ background: '#7c3aed', color: '#fff' }}
                >
                  {initials(u)}
                </span>
                {displayName(u)}
                <button
                  type="button" onClick={() => toggle(u)}
                  className="ml-0.5 hover:opacity-60 leading-none"
                >
                  <XMarkIcon className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* ── Search ── */}
        <div className="px-6 pt-4 pb-2 flex-shrink-0">
          <div className="relative">
            <MagnifyingGlassIcon
              className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ color: 'var(--text-muted)' }}
            />
            <input
              className="ui-input w-full pl-9 text-sm"
              placeholder="Search contractors by name…"
              value={query}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>
        </div>

        {/* ── Contractor list ── */}
        <div className="flex-1 overflow-y-auto px-6 py-2 space-y-1.5 min-h-0">
          {fetching ? (
            <div className="flex flex-col items-center gap-2 py-8">
              <ArrowPathIcon className="h-5 w-5 animate-spin" style={{ color: 'var(--text-muted)' }} />
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Loading contractors…</p>
            </div>
          ) : unselected.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <UserGroupIcon className="h-7 w-7 opacity-20" style={{ color: 'var(--text-muted)' }} />
              <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
                {query ? 'No contractors match your search' : 'No contractors available'}
              </p>
            </div>
          ) : unselected.map((u) => (
            <button
              key={u.id}
              type="button"
              onClick={() => toggle(u)}
              className="w-full flex items-center gap-3 p-3 rounded-xl hover:scale-[1.005] transition-all text-left"
              style={{ background: 'var(--bg-raised)', border: '1px solid var(--border)' }}
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0"
                style={{ background: 'rgba(124,58,237,.12)', color: '#7c3aed' }}
              >
                {initials(u)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate" style={{ color: 'var(--text)' }}>
                  {displayName(u)}
                </p>
                {u.email && (
                  <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{u.email}</p>
                )}
              </div>
              <PlusIcon className="h-4 w-4 flex-shrink-0" style={{ color: 'var(--text-muted)', opacity: 0.5 }} />
            </button>
          ))}
        </div>

        {/* ── Footer ── */}
        <div
          className="flex items-center justify-between px-6 py-4 flex-shrink-0"
          style={{ borderTop: '1px solid var(--border)', background: 'var(--bg-raised)' }}
        >
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {selected.length} contractor{selected.length !== 1 ? 's' : ''} selected
          </p>
          <div className="flex items-center gap-3">
            <button
              type="button" onClick={onClose} disabled={submitting}
              className="px-4 py-2 rounded-lg text-sm font-medium hover:opacity-75"
              style={{ border: '1px solid var(--border)', color: 'var(--text)' }}
            >
              Cancel
            </button>
            <button
              type="button" onClick={submit} disabled={submitting}
              className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
              style={{ background: '#7c3aed' }}
            >
              <UserGroupIcon className="h-4 w-4" />
              {submitting ? 'Saving…' : 'Save Contractors'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Risk Score Badge ───────────────────────────────────────────────────────

function RiskScoreBadge({ score, label }) {
  if (!score) return null;
  const result = score.result ?? score.probability * score.consequence;
  let color = '#16a34a';
  if (result >= 5) color = '#d97706';
  if (result >= 10) color = '#dc2626';
  if (result >= 17) color = '#7c3aed';

  return (
    <span
      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold"
      style={{ background: `${color}18`, color, border: `1px solid ${color}30` }}
      title={`${label} risk score`}
    >
      {result} <span style={{ fontWeight: 400 }}>{label}</span>
    </span>
  );
}

// ── Section Panel ──────────────────────────────────────────────────────────

// ── Detail Drawer ──────────────────────────────────────────────────────────

function DetailDrawer({ pra, onClose }) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchDetail = useCallback(() => {
    if (!pra) { setDetail(null); return; }
    setLoading(true);
    PerformedRiskAssessmentService.get(pra.id)
      .then((res) => setDetail(res.data ?? res))
      .catch(() => { setDetail(pra); toast.error('Could not load full details.'); })
      .finally(() => setLoading(false));
  }, [pra]);

  useEffect(() => { fetchDetail(); }, [fetchDetail]);

  if (!pra) return null;

  const d = detail ?? pra;
  const entries = d.performed_risk_assessment_entries ?? [];
  const executedCount = entries.filter((e) => !!e.hazard_id).length;
  const ra = d.risk_assessment ?? {};
  const officers = ra.safety_officers ?? [];
  const supervisors = ra.supervisors ?? [];

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/40" onClick={onClose} />
      <div
        className="fixed right-0 top-0 bottom-0 z-50 flex flex-col w-full max-w-xl"
        style={{ background: 'var(--bg)', borderLeft: '1px solid var(--border)', boxShadow: '-8px 0 32px rgba(0,0,0,.18)' }}
      >
        {/* ── Header ── */}
        <div
          className="flex items-start gap-3 px-6 py-5 flex-shrink-0"
          style={{
            borderBottom: '1px solid var(--border)',
            background: 'linear-gradient(to bottom, var(--bg-raised), var(--bg))',
          }}
        >
          <div
            className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 mt-0.5"
            style={{ background: 'rgba(22,163,74,.15)', border: '1px solid rgba(22,163,74,.2)' }}
          >
            <ClipboardDocumentCheckIcon className="h-6 w-6" style={{ color: '#16a34a' }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-bold" style={{ color: 'var(--text)' }}>
                {ra.activity ?? `Risk Assessment #${d.risk_assessment_id}`}
              </h3>
            </div>
            <div className="flex items-center flex-wrap gap-x-3 gap-y-1 mt-1.5">
              {ra.location && (
                <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                  <MapPinIcon className="h-3.5 w-3.5 flex-shrink-0" />
                  {ra.location}
                </span>
              )}
              <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                <CalendarDaysIcon className="h-3.5 w-3.5 flex-shrink-0" />
                {formatDate(d.performed_date)}
              </span>
            </div>
            {/* Stats row */}
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              <span
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold"
                style={{ background: 'rgba(22,163,74,.1)', color: '#16a34a', border: '1px solid rgba(22,163,74,.2)' }}
              >
                <ClipboardDocumentCheckIcon className="h-3 w-3" />
                {entries.length} {entries.length === 1 ? 'Entry' : 'Entries'}
              </span>
              {executedCount > 0 && (
                <span
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold"
                  style={{ background: 'rgba(22,163,74,.1)', color: '#16a34a', border: '1px solid rgba(22,163,74,.2)' }}
                >
                  <CheckCircleIcon className="h-3 w-3" />
                  {executedCount} Executed
                </span>
              )}
              {d.note && (
                <span
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px]"
                  style={{ background: 'var(--bg-raised)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}
                >
                  {d.note}
                </span>
              )}
            </div>
          </div>
          <button
            type="button" onClick={onClose}
            className="p-1.5 rounded-lg hover:opacity-75 flex-shrink-0"
            style={{ color: 'var(--text-muted)' }}
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          {/* Loading skeleton */}
          {loading && (
            <div className="space-y-3 animate-pulse">
              <div className="h-24 rounded-xl" style={{ background: 'var(--bg-raised)' }} />
              {[1, 2].map((i) => (
                <div key={i} className="h-20 rounded-xl" style={{ background: 'var(--bg-raised)' }} />
              ))}
            </div>
          )}

          {!loading && (
            <>
              {/* ── Assessment Info ── */}
              {(ra.date || ra.activity || officers.length > 0 || supervisors.length > 0) && (
                <section>
                  <p
                    className="text-[11px] font-bold uppercase tracking-widest mb-3"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    Risk Assessment
                  </p>
                  <div
                    className="rounded-xl p-4 space-y-3"
                    style={{ background: 'var(--bg-raised)', border: '1px solid var(--border)', borderLeft: '3px solid #d97706' }}
                  >
                    {ra.date && (
                      <div className="flex gap-3">
                        <span className="text-xs w-28 flex-shrink-0 font-medium" style={{ color: 'var(--text-muted)' }}>Issued</span>
                        <span className="text-xs" style={{ color: 'var(--text)' }}>{formatDate(ra.date)}</span>
                      </div>
                    )}
                    {ra.note && (
                      <div className="flex gap-3">
                        <span className="text-xs w-28 flex-shrink-0 font-medium" style={{ color: 'var(--text-muted)' }}>RA Note</span>
                        <span className="text-xs italic" style={{ color: 'var(--text)' }}>{ra.note}</span>
                      </div>
                    )}
                    {officers.length > 0 && (
                      <div className="flex gap-3">
                        <span className="text-xs w-28 flex-shrink-0 font-medium" style={{ color: 'var(--text-muted)' }}>Safety Officers</span>
                        <div className="flex flex-wrap gap-1">
                          {officers.map((o) => (
                            <span key={o.id} className="px-2 py-0.5 rounded-full text-[11px] font-medium"
                              style={{ background: 'rgba(37,99,235,.1)', color: '#2563eb' }}>
                              {displayName(o)}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {supervisors.length > 0 && (
                      <div className="flex gap-3">
                        <span className="text-xs w-28 flex-shrink-0 font-medium" style={{ color: 'var(--text-muted)' }}>Supervisors</span>
                        <div className="flex flex-wrap gap-1">
                          {supervisors.map((s) => (
                            <span key={s.id} className="px-2 py-0.5 rounded-full text-[11px] font-medium"
                              style={{ background: 'rgba(124,58,237,.1)', color: '#7c3aed' }}>
                              {displayName(s)}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </section>
              )}

              {/* ── Entries ── */}
              <section>
                <div className="flex items-center justify-between mb-3">
                  <p
                    className="text-[11px] font-bold uppercase tracking-widest"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    Entries
                  </p>
                  <div className="flex items-center gap-2">
                    <span
                      className="px-2 py-0.5 rounded-full text-[11px] font-bold"
                      style={{ background: 'rgba(22,163,74,.12)', color: '#16a34a' }}
                    >
                      {entries.length}
                    </span>
                    <button
                      type="button"
                      onClick={fetchDetail}
                      className="p-1 rounded hover:opacity-75"
                      style={{ color: 'var(--text-muted)' }}
                      title="Refresh"
                    >
                      <ArrowPathIcon className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {entries.length === 0 ? (
                  <div
                    className="rounded-xl p-8 flex flex-col items-center gap-3 text-center"
                    style={{ background: 'var(--bg-raised)', border: '1px dashed var(--border)' }}
                  >
                    <ExclamationTriangleIcon className="h-8 w-8" style={{ color: 'var(--text-muted)', opacity: 0.4 }} />
                    <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>No entries recorded</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {entries.map((entry, i) => (
                      <EntryCard key={entry.id ?? i} entry={entry} index={i} onRefresh={fetchDetail} />
                    ))}
                  </div>
                )}
              </section>
            </>
          )}
        </div>
      </div>
    </>
  );
}

// ── Entry Card ─────────────────────────────────────────────────────────────

const PRIORITY_COLOR_MAP = {
  Low:      { bg: 'rgba(22,163,74,.12)',    text: '#16a34a',  border: 'rgba(22,163,74,.25)' },
  Medium:   { bg: 'rgba(217,119,6,.12)',    text: '#d97706',  border: 'rgba(217,119,6,.25)' },
  High:     { bg: 'rgba(220,38,38,.12)',    text: '#dc2626',  border: 'rgba(220,38,38,.25)' },
  Critical: { bg: 'rgba(124,58,237,.12)',   text: '#7c3aed',  border: 'rgba(124,58,237,.25)' },
};

function EntryCard({ entry, index, onRefresh }) {
  const { hasPermission } = useAuth();
  const canAssignContractor    = hasPermission('performed_risk_assessment_entries.assign_contractor');
  const canSetPriority         = hasPermission('performed_risk_assessment_entry_priorities.create') || hasPermission('performed_risk_assessment_entry_priorities.update');
  const canAddCorrectiveAction = hasPermission('risk_assessment_entry_corrective_actions.create');
  const canExecuteEntry        = hasPermission('performed_risk_assessment_entries.execute');

  const [expanded, setExpanded] = useState(false);
  const [executeOpen, setExecuteOpen] = useState(false);
  const [correctiveOpen, setCorrectiveOpen] = useState(false);
  const [priorityOpen, setPriorityOpen] = useState(false);
  const [contractorOpen, setContractorOpen] = useState(false);

  const isExecuted      = !!entry.hazard_id;
  const priorityLevel   = entry.priority?.priority_level;
  const priorityColors  = priorityLevel ? (PRIORITY_COLOR_MAP[priorityLevel] ?? PRIORITY_COLOR_MAP.Medium) : null;
  const caCount         = entry.corrective_actions?.length ?? 0;
  const contractorCount = entry.contractors?.length ?? 0;

  return (
    <>
      <div
        className="rounded-xl overflow-hidden transition-shadow"
        style={{
          border: '1px solid var(--border)',
          boxShadow: expanded ? '0 4px 20px rgba(0,0,0,.08)' : 'none',
        }}
      >
        {/* ── Collapsed Header ── */}
        <button
          type="button"
          className="w-full flex items-center gap-3 px-4 py-3 text-left transition-opacity hover:opacity-90"
          style={{ background: 'var(--bg-raised)' }}
          onClick={() => setExpanded((o) => !o)}
        >
          {/* Index circle */}
          <span
            className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold"
            style={{
              background: isExecuted ? 'rgba(22,163,74,.15)' : 'var(--bg)',
              color: isExecuted ? '#16a34a' : 'var(--text-muted)',
              border: `1.5px solid ${isExecuted ? 'rgba(22,163,74,.3)' : 'var(--border)'}`,
            }}
          >
            {index + 1}
          </span>

          {/* Description */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold leading-snug" style={{ color: 'var(--text)' }}>
              {entry.hazard_description}
            </p>
            <p className="text-xs mt-0.5 line-clamp-1" style={{ color: 'var(--text-muted)' }}>
              {entry.current_control_measures}
            </p>
          </div>

          {/* Mini-badges */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {isExecuted && (
              <span
                className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold"
                style={{ background: 'rgba(22,163,74,.12)', color: '#16a34a' }}
              >
                <CheckCircleIcon className="h-3 w-3" /> Done
              </span>
            )}
            {priorityColors && (
              <span
                className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold"
                style={{ background: priorityColors.bg, color: priorityColors.text }}
              >
                {priorityLevel}
              </span>
            )}
            {caCount > 0 && (
              <span
                className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold"
                style={{ background: 'rgba(217,119,6,.1)', color: '#d97706' }}
              >
                {caCount} CA
              </span>
            )}
            <ChevronDownIcon
              className="h-4 w-4 transition-transform duration-200"
              style={{
                color: 'var(--text-muted)',
                transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
              }}
            />
          </div>
        </button>

        {/* ── Expanded Body ── */}
        {expanded && (
          <div className="divide-y" style={{ borderTop: '1px solid var(--border)' }}>

            {/* Hazard & Controls detail */}
            <div className="px-4 py-3 space-y-2" style={{ background: 'var(--bg)' }}>
              <div className="flex gap-3">
                <span className="text-xs font-medium w-24 flex-shrink-0" style={{ color: 'var(--text-muted)' }}>Hazard</span>
                <span className="text-xs" style={{ color: 'var(--text)' }}>{entry.hazard_description}</span>
              </div>
              <div className="flex gap-3">
                <span className="text-xs font-medium w-24 flex-shrink-0" style={{ color: 'var(--text-muted)' }}>Controls</span>
                <span className="text-xs" style={{ color: 'var(--text)' }}>{entry.current_control_measures}</span>
              </div>
              {entry.due_date && (
                <div className="flex gap-3">
                  <span className="text-xs font-medium w-24 flex-shrink-0" style={{ color: 'var(--text-muted)' }}>Due Date</span>
                  <span className="text-xs" style={{ color: 'var(--text)' }}>{formatDate(entry.due_date)}</span>
                </div>
              )}
              {entry.note && (
                <div className="flex gap-3">
                  <span className="text-xs font-medium w-24 flex-shrink-0" style={{ color: 'var(--text-muted)' }}>Note</span>
                  <span className="text-xs italic" style={{ color: 'var(--text)' }}>{entry.note}</span>
                </div>
              )}
            </div>

            {/* People at Risk */}
            {entry.people_at_risks?.length > 0 && (
              <div className="px-4 py-3" style={{ background: 'var(--bg)' }}>
                <p className="text-[11px] font-bold uppercase tracking-wide mb-2" style={{ color: '#dc2626', opacity: 0.8 }}>
                  People at Risk
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {entry.people_at_risks.map((p, pi) => (
                    <span
                      key={pi}
                      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium"
                      style={{ background: 'rgba(220,38,38,.1)', color: '#dc2626', border: '1px solid rgba(220,38,38,.15)' }}
                    >
                      <ExclamationTriangleIcon className="h-3 w-3" />
                      {p.title ?? p.name ?? p}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Contractors */}
            <div className="px-4 py-3" style={{ background: 'var(--bg)' }}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[11px] font-bold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                  Contractors {contractorCount > 0 && `(${contractorCount})`}
                </p>
                {canAssignContractor && (
                  <button
                    type="button"
                    onClick={() => setContractorOpen(true)}
                    className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg hover:opacity-80"
                    style={{ background: 'rgba(124,58,237,.1)', color: '#7c3aed', border: '1px solid rgba(124,58,237,.15)' }}
                  >
                    <UserGroupIcon className="h-3 w-3" />
                    {contractorCount > 0 ? 'Edit' : 'Assign'}
                  </button>
                )}
              </div>
              {contractorCount > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {entry.contractors.map((c) => (
                    <span key={c.id} className="px-2.5 py-0.5 rounded-full text-[11px] font-medium"
                      style={{ background: 'rgba(124,58,237,.1)', color: '#7c3aed', border: '1px solid rgba(124,58,237,.15)' }}>
                      {displayName(c)}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>No contractors assigned.</p>
              )}
            </div>

            {/* Priority */}
            <div className="px-4 py-3" style={{ background: 'var(--bg)' }}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[11px] font-bold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Priority</p>
                {canSetPriority && (
                  <button
                    type="button"
                    onClick={() => setPriorityOpen(true)}
                    className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg hover:opacity-80"
                    style={{ background: 'rgba(217,119,6,.1)', color: '#d97706', border: '1px solid rgba(217,119,6,.15)' }}
                  >
                    <FlagIcon className="h-3 w-3" />
                    {priorityLevel ? 'Edit' : 'Set'}
                  </button>
                )}
              </div>
              {entry.priority ? (
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className="px-3 py-1 rounded-full text-xs font-bold"
                    style={{
                      background: priorityColors?.bg ?? 'var(--bg-raised)',
                      color: priorityColors?.text ?? 'var(--text)',
                      border: `1px solid ${priorityColors?.border ?? 'var(--border)'}`,
                    }}
                  >
                    {priorityLevel}
                  </span>
                  {entry.priority.due_date && (
                    <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                      <CalendarDaysIcon className="h-3.5 w-3.5" /> Due {formatDate(entry.priority.due_date)}
                    </span>
                  )}
                </div>
              ) : (
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>No priority set.</p>
              )}
            </div>

            {/* Corrective Actions */}
            <div className="px-4 py-3" style={{ background: 'var(--bg)' }}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[11px] font-bold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                  Corrective Actions {caCount > 0 && `(${caCount})`}
                </p>
                {canAddCorrectiveAction && (
                  <button
                    type="button"
                    onClick={() => setCorrectiveOpen(true)}
                    className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg hover:opacity-80"
                    style={{ background: 'rgba(217,119,6,.1)', color: '#d97706', border: '1px solid rgba(217,119,6,.15)' }}
                  >
                    <PlusIcon className="h-3 w-3" /> Add
                  </button>
                )}
              </div>
              {caCount > 0 ? (
                <div className="space-y-2">
                  {entry.corrective_actions.map((ca, ci) => (
                    <div
                      key={ca.id}
                      className="rounded-lg p-3 space-y-2"
                      style={{ background: 'var(--bg-raised)', border: '1px solid var(--border)', borderLeft: '3px solid #d97706' }}
                    >
                      <p className="text-xs leading-relaxed" style={{ color: 'var(--text)' }}>
                        <span className="font-semibold mr-1" style={{ color: 'var(--text-muted)' }}>#{ci + 1}</span>
                        {ca.description}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        <RiskScoreBadge score={ca.inherent_risk_score} label="Inherent" />
                        <RiskScoreBadge score={ca.residual_risk_score} label="Residual" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>No corrective actions yet.</p>
              )}
            </div>

            {/* Execute / Executed status */}
            <div className="px-4 py-3" style={{ background: 'var(--bg)' }}>
              {!isExecuted ? (
                canExecuteEntry ? (
                  <button
                    type="button"
                    onClick={() => setExecuteOpen(true)}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold hover:opacity-90 transition-opacity"
                    style={{
                      background: 'linear-gradient(135deg, rgba(22,163,74,.15) 0%, rgba(22,163,74,.08) 100%)',
                      color: '#16a34a',
                      border: '1.5px dashed rgba(22,163,74,.4)',
                    }}
                  >
                    <BoltIcon className="h-5 w-5" /> Execute This Entry
                  </button>
                ) : (
                  <div
                    className="flex items-center gap-2 py-2.5 px-3 rounded-lg text-xs"
                    style={{ background: 'var(--bg-raised)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}
                  >
                    <ShieldExclamationIcon className="h-4 w-4 flex-shrink-0" />
                    Pending execution
                  </div>
                )
              ) : (
                <div
                  className="rounded-xl p-4 space-y-3"
                  style={{ background: 'rgba(22,163,74,.06)', border: '1px solid rgba(22,163,74,.2)' }}
                >
                  <div className="flex items-center gap-2">
                    <CheckCircleIcon className="h-5 w-5 flex-shrink-0" style={{ color: '#16a34a' }} />
                    <p className="text-sm font-bold" style={{ color: '#16a34a' }}>Entry Executed</p>
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      Linked to Hazard #{entry.hazard_id}
                      {entry.hazard?.location && ` · ${entry.hazard.location}`}
                    </p>
                  </div>
                  {/* Evidence links */}
                  {(entry.image_before_path || entry.proof_of_completion_path) && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {entry.image_before_path && (
                        <a
                          href={entry.image_before_path}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-lg hover:opacity-80 transition-opacity"
                          style={{ background: 'rgba(22,163,74,.12)', color: '#16a34a', border: '1px solid rgba(22,163,74,.2)' }}
                        >
                          <PhotoIcon className="h-3.5 w-3.5" /> Image Before
                          <ArrowTopRightOnSquareIcon className="h-3 w-3 opacity-60" />
                        </a>
                      )}
                      {entry.proof_of_completion_path && (
                        <a
                          href={entry.proof_of_completion_path}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-lg hover:opacity-80 transition-opacity"
                          style={{ background: 'rgba(22,163,74,.12)', color: '#16a34a', border: '1px solid rgba(22,163,74,.2)' }}
                        >
                          <DocumentArrowUpIcon className="h-3.5 w-3.5" /> Proof of Completion
                          <ArrowTopRightOnSquareIcon className="h-3 w-3 opacity-60" />
                        </a>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

          </div>
        )}
      </div>

      {/* Per-entry modals */}
      <ExecuteEntryModal
        entry={entry} open={executeOpen}
        onClose={() => setExecuteOpen(false)} onDone={onRefresh}
      />
      <CorrectiveActionModal
        entry={entry} open={correctiveOpen}
        onClose={() => setCorrectiveOpen(false)} onDone={onRefresh}
      />
      <PriorityModal
        entry={entry} open={priorityOpen}
        onClose={() => setPriorityOpen(false)} onDone={onRefresh}
      />
      <ContractorModal
        entry={entry} open={contractorOpen}
        onClose={() => setContractorOpen(false)} onDone={onRefresh}
      />
    </>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────

export default function PerformedRiskAssessmentsPage() {
  const dispatch = useAppDispatch();
  const { hasPermission } = useAuth();

  const items = useAppSelector(selectPerformedRiskAssessments);
  const meta = useAppSelector(selectPerformedRiskAssessmentsMeta);
  const loading = useAppSelector(selectPerformedRiskAssessmentsLoading);
  const error = useAppSelector(selectPerformedRiskAssessmentsError);
  const filters = useAppSelector(selectPerformedRiskAssessmentsFilters);
  const actionLoading = useAppSelector(selectPerformedRiskAssessmentsActionLoading);
  const actionError = useAppSelector(selectPerformedRiskAssessmentsActionError);

  const canCreate = hasPermission('perform_risk_assessments.create');
  const canEdit   = hasPermission('perform_risk_assessments.update');
  const canDelete = hasPermission('perform_risk_assessments.destroy');

  const [createOpen, setCreateOpen] = useState(false);
  const [editPra, setEditPra] = useState(null);
  const [detailPra, setDetailPra] = useState(null);
  const [deleteTgt, setDeleteTgt] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [dateInput, setDateInput] = useState('');
  const dateTimer = useRef(null);

  const filterDate = filters['filter[performed_date]'];

  useEffect(() => {
    dispatch(fetchPerformedRiskAssessments(filters));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, filters.page, filterDate, filters['filter[risk_assessment_id]']]);

  useEffect(() => {
    if (error) { toast.error(error); dispatch(clearPerformedRiskAssessmentErrors()); }
  }, [error, dispatch]);

  useEffect(() => {
    if (actionError) { toast.error(actionError); dispatch(clearPerformedRiskAssessmentErrors()); }
  }, [actionError, dispatch]);

  function handleDateSearch(val) {
    setDateInput(val);
    clearTimeout(dateTimer.current);
    dateTimer.current = setTimeout(
      () => dispatch(setPerformedRiskAssessmentFilters({ 'filter[performed_date]': val, page: 1 })),
      400,
    );
  }

  async function handleSave(payload) {
    const result = await dispatch(createPerformedRiskAssessment(payload));
    if (createPerformedRiskAssessment.fulfilled.match(result)) {
      toast.success('Performed risk assessment created.');
      setCreateOpen(false);
      dispatch(fetchPerformedRiskAssessments(filters));
    }
  }

  async function handleEdit(payload) {
    if (!editPra) return;
    const result = await dispatch(updatePerformedRiskAssessment({ id: editPra.id, data: payload }));
    if (updatePerformedRiskAssessment.fulfilled.match(result)) {
      toast.success('Performed risk assessment updated.');
      setEditPra(null);
      dispatch(fetchPerformedRiskAssessments(filters));
    }
  }

  async function handleDelete() {
    if (!deleteTgt) return;
    setDeleting(true);
    const result = await dispatch(deletePerformedRiskAssessment(deleteTgt.id));
    setDeleting(false);
    if (deletePerformedRiskAssessment.fulfilled.match(result)) {
      toast.success('Record deleted.');
      setDeleteTgt(null);
    }
  }

  const page = filters.page;

  return (
    <div className="ui-page" style={{ color: 'var(--text)' }}>

      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(22,163,74,.12)' }}
          >
            <ClipboardDocumentCheckIcon className="w-5 h-5" style={{ color: '#16a34a' }} />
          </div>
          <div>
            <h1 className="text-xl font-bold leading-tight" style={{ color: 'var(--text)' }}>
              Performed Risk Assessments
            </h1>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              {meta
                ? `${meta.total_count ?? meta.total ?? 0} record${(meta.total_count ?? meta.total ?? 0) !== 1 ? 's' : ''}`
                : 'Track executed risk assessment sessions'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => dispatch(fetchPerformedRiskAssessments(filters))}
            disabled={loading}
            className="p-2 rounded-lg hover:opacity-75"
            style={{ color: 'var(--text-muted)' }}
            title="Refresh"
          >
            <ArrowPathIcon className={`h-4 w-4${loading ? ' animate-spin' : ''}`} />
          </button>
          {canCreate && (
            <button
              onClick={() => setCreateOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white hover:opacity-90"
              style={{ background: 'var(--accent)' }}
            >
              <PlusIcon className="h-4 w-4" /> New Record
            </button>
          )}
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="relative">
          <span
            className="absolute left-3 top-1/2 -translate-y-1/2 text-xs pointer-events-none"
            style={{ color: 'var(--text-muted)' }}
          >
            Date:
          </span>
          <input
            type="date"
            className="ui-input pl-14"
            style={{ width: 200 }}
            value={dateInput}
            onChange={(e) => handleDateSearch(e.target.value)}
          />
        </div>
        {dateInput && (
          <button
            type="button"
            onClick={() => { setDateInput(''); dispatch(setPerformedRiskAssessmentFilters({ 'filter[performed_date]': '', page: 1 })); }}
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
              ) : items.length === 0 ? (
                <tr>
                  <td
                    colSpan={TABLE_COLS.length}
                    className="ui-td text-center py-12"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    No performed risk assessments found.
                  </td>
                </tr>
              ) : (
                items.map((pra, idx) => {
                  const entriesCount = pra.performed_risk_assessment_entries?.length ?? 0;
                  return (
                    <tr key={pra.id} className="ui-row">
                      <td className="ui-td" style={{ color: 'var(--text-muted)' }}>
                        {(page - 1) * filters.per_page + idx + 1}
                      </td>
                      <td className="ui-td font-medium">
                        {pra.risk_assessment?.activity ?? `RA #${pra.risk_assessment_id}`}
                      </td>
                      <td className="ui-td" style={{ color: 'var(--text-muted)' }}>
                        {formatDate(pra.performed_date)}
                      </td>
                      <td
                        className="ui-td"
                        style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-muted)' }}
                      >
                        {pra.note || '—'}
                      </td>
                      <td className="ui-td">
                        {entriesCount > 0 ? (
                          <span
                            className="inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold"
                            style={{ background: 'rgba(22,163,74,.12)', color: '#16a34a' }}
                          >
                            {entriesCount}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>0</span>
                        )}
                      </td>
                      <td className="ui-td text-right">
                        <ActionMenu
                          onView={() => setDetailPra(pra)}
                          onEdit={() => setEditPra(pra)}
                          onDelete={() => setDeleteTgt(pra)}
                          canEdit={canEdit}
                          canDelete={canDelete}
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
          onPage={(p) => dispatch(setPerformedRiskAssessmentFilters({ page: p }))}
        />
      </div>

      {/* ── Modals & Drawers ── */}
      <CreateModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSave={handleSave}
        saving={actionLoading}
        saveError={actionError}
      />
      <CreateModal
        open={!!editPra}
        pra={editPra}
        onClose={() => setEditPra(null)}
        onSave={handleEdit}
        saving={actionLoading}
        saveError={actionError}
      />
      <DetailDrawer
        pra={detailPra}
        onClose={() => setDetailPra(null)}
      />
      <DeleteConfirmModal
        open={!!deleteTgt}
        name={deleteTgt ? `Performed RA #${deleteTgt.id}` : ''}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTgt(null)}
        loading={deleting}
      />
    </div>
  );
}
