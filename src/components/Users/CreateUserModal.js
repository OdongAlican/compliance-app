/**
 * CreateUserModal.js — 3-step wizard for user creation.
 *
 * Step 1: Staff ID Verification (HR approved list + uniqueness check)
 * Step 2: Fill user details  (pre-filled from HR record where possible)
 * Step 3: Review & Submit
 *
 * Props:
 *   isOpen          boolean
 *   onClose         () => void
 *   onCreated       (user) => void
 *   roles           { id, name }[]
 *   professions     { id, name }[]
 *   existingStaffIds Set<string>  — already-registered IDs (blocks re-use)
 */
import React, { useState } from 'react';
import StaffIdVerificationStep from './StaffIdVerificationStep';
import UsersService from '../../services/users.service';
import StepIndicator from '../ui/StepIndicator';

const STEPS = ['Staff ID', 'User Details', 'Review'];

const inputCls = 'w-full rounded-xl px-3 py-2.5 text-sm outline-none';
const inputStyle = { background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' };
const labelCls  = 'block text-xs font-medium mb-1.5';
const labelStyle = { color: 'var(--text-muted)' };

function Field({ label, required, children }) {
  return (
    <div>
      <label className={labelCls} style={labelStyle}>
        {label}{required && <span style={{ color: 'var(--danger)' }}> *</span>}
      </label>
      {children}
    </div>
  );
}

/* ── Step 2: Details form ───────────────────────────────────────────────── */
function DetailsStep({ staffRecord, form, setForm, roles, professions, errors }) {
  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-base font-semibold mb-1" style={{ color: 'var(--text)' }}>User Details</h3>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Fields pre-filled from HR record. Verify and complete all required fields.
        </p>
      </div>

      {/* HR record badge */}
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl"
        style={{ background: 'color-mix(in srgb, var(--accent) 8%, transparent)', border: '1px solid color-mix(in srgb, var(--accent) 25%, transparent)' }}>
        <div>
          <p className="text-xs font-semibold" style={{ color: 'var(--accent)' }}>HR Record Linked</p>
          <p className="text-sm font-medium mt-0.5" style={{ color: 'var(--text)' }}>
            {staffRecord.id} — {staffRecord.name} · {staffRecord.department}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="First Name" required>
          <input type="text" className={inputCls} style={inputStyle}
            value={form.firstname} onChange={(e) => set('firstname', e.target.value)} placeholder="First name" />
          {errors.firstname && <p className="text-xs mt-1" style={{ color: 'var(--danger)' }}>{errors.firstname}</p>}
        </Field>
        <Field label="Last Name" required>
          <input type="text" className={inputCls} style={inputStyle}
            value={form.lastname} onChange={(e) => set('lastname', e.target.value)} placeholder="Last name" />
          {errors.lastname && <p className="text-xs mt-1" style={{ color: 'var(--danger)' }}>{errors.lastname}</p>}
        </Field>
        <Field label="Other Name">
          <input type="text" className={inputCls} style={inputStyle}
            value={form.othername} onChange={(e) => set('othername', e.target.value)} placeholder="Middle name (optional)" />
        </Field>
        <Field label="Email Address" required>
          <input type="email" className={inputCls} style={inputStyle}
            value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="user@company.com" />
          {errors.email && <p className="text-xs mt-1" style={{ color: 'var(--danger)' }}>{errors.email}</p>}
        </Field>
        <Field label="Staff ID" required>
          <input type="text" className={inputCls}
            style={{ ...inputStyle, opacity: 0.7, cursor: 'not-allowed' }}
            value={form.staff_id} readOnly />
        </Field>
        <Field label="Phone Number">
          <input type="tel" className={inputCls} style={inputStyle}
            value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="0712345678" />
          {errors.phone && <p className="text-xs mt-1" style={{ color: 'var(--danger)' }}>{errors.phone}</p>}
        </Field>
        <Field label="Gender">
          <select className={inputCls} style={inputStyle}
            value={form.gender} onChange={(e) => set('gender', e.target.value)}>
            <option value="">Select gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </Field>
        <Field label="Age">
          <input type="number" min="0" className={inputCls} style={inputStyle}
            value={form.age} onChange={(e) => set('age', e.target.value)} placeholder="e.g. 30" />
          {errors.age && <p className="text-xs mt-1" style={{ color: 'var(--danger)' }}>{errors.age}</p>}
        </Field>
        <Field label="Role" required>
          <select className={inputCls} style={inputStyle}
            value={form.role_id} onChange={(e) => set('role_id', e.target.value)}>
            <option value="">Select role</option>
            {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
          {errors.role_id && <p className="text-xs mt-1" style={{ color: 'var(--danger)' }}>{errors.role_id}</p>}
        </Field>
        <Field label="Profession">
          <select className={inputCls} style={inputStyle}
            value={form.profession_id} onChange={(e) => set('profession_id', e.target.value)}>
            <option value="">Select profession (optional)</option>
            {professions.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </Field>
      </div>
    </div>
  );
}

/* ── Step 3: Review ─────────────────────────────────────────────────────── */
function ReviewStep({ form, roles, professions }) {
  const roleName = roles.find((r) => String(r.id) === String(form.role_id))?.name ?? '—';
  const profName = professions.find((p) => String(p.id) === String(form.profession_id))?.name ?? '—';

  const rows = [
    ['Staff ID',    form.staff_id],
    ['First Name',  form.firstname],
    ['Last Name',   form.lastname],
    ['Other Name',  form.othername || '—'],
    ['Email',       form.email],
    ['Phone',       form.phone || '—'],
    ['Gender',      form.gender || '—'],
    ['Age',         form.age || '—'],
    ['Role',        roleName],
    ['Profession',  profName],
  ];

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-base font-semibold mb-1" style={{ color: 'var(--text)' }}>Review & Confirm</h3>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Verify details below. A temporary password will be auto-generated and emailed to the user.
        </p>
      </div>
      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
        {rows.map(([label, value], i) => (
          <div key={label} className="flex text-sm"
            style={{ borderBottom: i < rows.length - 1 ? '1px solid var(--border)' : 'none' }}>
            <div className="w-36 px-4 py-3 shrink-0 font-medium" style={{ background: 'var(--bg-raised)', color: 'var(--text-muted)' }}>
              {label}
            </div>
            <div className="px-4 py-3 flex-1" style={{ color: 'var(--text)' }}>{value}</div>
          </div>
        ))}
      </div>
      <div className="px-4 py-3 rounded-xl text-sm"
        style={{ background: 'color-mix(in srgb, var(--warning) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--warning) 25%, transparent)', color: 'var(--warning)' }}>
        ⚠ The user will receive an email with their temporary password. They must change it on first login.
      </div>
    </div>
  );
}

/* ── Main modal ─────────────────────────────────────────────────────────── */
export default function CreateUserModal({ isOpen, onClose, onCreated, roles = [], professions = [], existingStaffIds = new Set() }) {
  const [step, setStep]             = useState(0);
  const [staffRecord, setStaffRecord] = useState(null);
  const [form, setForm]             = useState({
    staff_id: '', firstname: '', lastname: '', othername: '',
    email: '', phone: '', gender: '', age: '', role_id: '', profession_id: '',
  });
  const [errors, setErrors]         = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError]     = useState('');

  if (!isOpen) return null;

  // ── Step 1: Staff ID verified ──────────────────────────────────────────
  const handleVerified = (record) => {
    setStaffRecord(record);
    // Pre-fill staff_id and split HR name into first/last
    const [firstname = '', ...rest] = record.name.split(' ');
    const lastname = rest.join(' ');
    setForm((prev) => ({ ...prev, staff_id: record.id, firstname, lastname }));
    setStep(1);
  };

  // ── Step 2 → 3: Validate details ──────────────────────────────────────
  const validateDetails = () => {
    const e = {};
    if (!form.firstname.trim()) e.firstname = 'First name is required.';
    if (!form.lastname.trim())  e.lastname  = 'Last name is required.';
    if (!form.email.trim())     e.email     = 'Email is required.';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email.';
    if (!form.role_id)          e.role_id   = 'Select a role.';
    if (form.phone && (form.phone.length < 7 || form.phone.length > 20))
      e.phone = 'Phone must be 7–20 characters.';
    if (form.age && (isNaN(Number(form.age)) || Number(form.age) < 0))
      e.age = 'Age must be a positive number.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const goNext = () => {
    if (step === 1 && !validateDetails()) return;
    setStep((s) => s + 1);
  };

  // ── Submit ─────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    setApiError('');
    setSubmitting(true);
    try {
      const payload = {
        staff_id:      form.staff_id,
        firstname:     form.firstname.trim(),
        lastname:      form.lastname.trim(),
        othername:     form.othername.trim() || undefined,
        email:         form.email.trim().toLowerCase(),
        phone:         form.phone.trim() || undefined,
        gender:        form.gender || undefined,
        age:           form.age ? Number(form.age) : undefined,
        role_id:       Number(form.role_id),
        profession_id: form.profession_id ? Number(form.profession_id) : undefined,
      };
      const created = await UsersService.create(payload);
      onCreated?.(created);
      onClose();
    } catch (err) {
      const msgs = err?.response?.data?.errors;
      setApiError(
        Array.isArray(msgs) ? msgs.join(' · ') :
        err?.response?.data?.error || 'Failed to create user. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setStep(0); setStaffRecord(null);
    setForm({ staff_id: '', firstname: '', lastname: '', othername: '', email: '', phone: '', gender: '', age: '', role_id: '', profession_id: '' });
    setErrors({}); setApiError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-2xl max-h-[92vh] flex flex-col rounded-2xl overflow-hidden"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-lg)' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 shrink-0"
          style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-raised)' }}>
          <div>
            <h2 className="text-base font-bold" style={{ color: 'var(--text)' }}>Create New User</h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Step {step + 1} of {STEPS.length}</p>
          </div>
          <button onClick={handleClose} className="text-xl font-bold leading-none"
            style={{ color: 'var(--text-muted)' }} aria-label="Close">×</button>
        </div>

        {/* Step indicator */}
        <div className="px-6 pt-5 shrink-0">
          <StepIndicator steps={STEPS} currentStep={step} />
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {apiError && (
            <div className="mb-4 px-4 py-3 rounded-xl text-sm font-medium"
              style={{ background: 'color-mix(in srgb, var(--danger) 12%, transparent)', color: 'var(--danger)', border: '1px solid color-mix(in srgb, var(--danger) 30%, transparent)' }}>
              {apiError}
            </div>
          )}
          {step === 0 && (
            <StaffIdVerificationStep
              onVerified={handleVerified}
              existingStaffIds={existingStaffIds}
            />
          )}
          {step === 1 && (
            <DetailsStep
              staffRecord={staffRecord}
              form={form}
              setForm={setForm}
              roles={roles}
              professions={professions}
              errors={errors}
            />
          )}
          {step === 2 && (
            <ReviewStep form={form} roles={roles} professions={professions} />
          )}
        </div>

        {/* Footer (steps 1+ only — step 0 has its own proceed button) */}
        {step > 0 && (
          <div className="flex justify-between items-center px-6 py-4 shrink-0"
            style={{ borderTop: '1px solid var(--border)', background: 'var(--bg-raised)' }}>
            <button
              type="button"
              onClick={() => setStep((s) => s - 1)}
              disabled={submitting}
              className="px-5 py-2 rounded-full text-sm font-medium transition-opacity"
              style={{ border: '1px solid var(--border)', color: 'var(--text-muted)', background: 'var(--bg)' }}
            >
              ← Back
            </button>
            {step < STEPS.length - 1 ? (
              <button
                type="button"
                onClick={goNext}
                className="px-6 py-2 rounded-full text-sm font-semibold transition-opacity"
                style={{ background: 'var(--accent)', color: '#fff' }}
              >
                Next →
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="px-6 py-2 rounded-full text-sm font-semibold disabled:opacity-60 transition-opacity"
                style={{ background: 'var(--success)', color: '#fff' }}
              >
                {submitting ? 'Creating…' : 'Create User'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
