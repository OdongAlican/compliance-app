/**
 * ProfilePage.js — Logged-in user's own profile.
 *
 * Sections:
 *  - Personal information (name, phone, gender, etc.)
 *  - Profile photo (upload / preview)
 *  - Change password
 */
import React, { useState, useEffect, useRef } from 'react';
import {
  UserCircleIcon,
  CameraIcon,
  KeyIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ArrowPathIcon,
  EyeIcon,
  EyeSlashIcon,
} from '@heroicons/react/24/outline';
import useAuth from '../../hooks/useAuth';
import { useAppDispatch } from '../../store/hooks';
import { patchUser } from '../../store/slices/authSlice';
import { TokenService } from '../../services/index';
import UsersService, { changePassword } from '../../services/users.service';

// ── Helpers ──────────────────────────────────────────────────────────────────
function getInitials(user) {
  return [user?.firstname?.[0], user?.lastname?.[0]]
    .filter(Boolean)
    .join('')
    .toUpperCase() || '?';
}

// ── Inline feedback banner ────────────────────────────────────────────────────
function Feedback({ type, message }) {
  if (!message) return null;
  const isSuccess = type === 'success';
  return (
    <div
      className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm"
      style={{
        background: isSuccess
          ? 'color-mix(in srgb, var(--success) 10%, transparent)'
          : 'color-mix(in srgb, var(--danger) 10%, transparent)',
        color: isSuccess ? 'var(--success)' : 'var(--danger)',
        border: `1px solid ${isSuccess
          ? 'color-mix(in srgb, var(--success) 20%, transparent)'
          : 'color-mix(in srgb, var(--danger) 20%, transparent)'}`,
      }}
    >
      {isSuccess
        ? <CheckCircleIcon className="h-4 w-4 flex-shrink-0" />
        : <ExclamationCircleIcon className="h-4 w-4 flex-shrink-0" />}
      {message}
    </div>
  );
}

// ── Styled label + input ──────────────────────────────────────────────────────
function Field({ label, children, hint }) {
  return (
    <div>
      <label className="block text-xs font-bold uppercase tracking-wide mb-1.5" style={{ color: 'var(--text-muted)' }}>
        {label}
      </label>
      {children}
      {hint && <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{hint}</p>}
    </div>
  );
}

const INPUT_BASE = {
  background: 'var(--bg-raised)',
  border: '1px solid var(--border)',
  color: 'var(--text)',
};

function TextInput({ value, onChange, placeholder, disabled, type = 'text' }) {
  const [focused, setFocused] = useState(false);
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all disabled:opacity-50"
      style={{
        ...INPUT_BASE,
        border: focused ? '1px solid var(--accent)' : '1px solid var(--border)',
        boxShadow: focused ? '0 0 0 3px color-mix(in srgb, var(--accent) 15%, transparent)' : 'none',
      }}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    />
  );
}

function SelectInput({ value, onChange, options, disabled }) {
  const [focused, setFocused] = useState(false);
  return (
    <select
      value={value}
      onChange={onChange}
      disabled={disabled}
      className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all disabled:opacity-50 appearance-none"
      style={{
        ...INPUT_BASE,
        border: focused ? '1px solid var(--accent)' : '1px solid var(--border)',
        boxShadow: focused ? '0 0 0 3px color-mix(in srgb, var(--accent) 15%, transparent)' : 'none',
      }}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    >
      <option value="">— Select —</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

function PasswordInput({ value, onChange, placeholder, disabled }) {
  const [show, setShow] = useState(false);
  const [focused, setFocused] = useState(false);
  return (
    <div className="relative">
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full px-4 py-3 pr-10 rounded-xl text-sm outline-none transition-all disabled:opacity-50"
        style={{
          ...INPUT_BASE,
          border: focused ? '1px solid var(--accent)' : '1px solid var(--border)',
          boxShadow: focused ? '0 0 0 3px color-mix(in srgb, var(--accent) 15%, transparent)' : 'none',
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="absolute right-3 top-1/2 -translate-y-1/2 transition-opacity hover:opacity-70"
        style={{ color: 'var(--text-muted)' }}
        tabIndex={-1}
      >
        {show ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
      </button>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function ProfilePage() {
  const dispatch   = useAppDispatch();
  const { user }   = useAuth();

  // ── Avatar / photo ──
  const fileRef    = useRef(null);
  const [photoUrl, setPhotoUrl]       = useState(null);
  const [photoLoading, setPhotoLoading] = useState(false);
  const [photoError, setPhotoError]   = useState('');
  const [photoSuccess, setPhotoSuccess] = useState('');

  // ── Personal info form ──
  const [form, setForm] = useState({
    firstname:  '',
    lastname:   '',
    othername:  '',
    phone:      '',
    gender:     '',
  });
  const [infoSaving,  setInfoSaving]  = useState(false);
  const [infoError,   setInfoError]   = useState('');
  const [infoSuccess, setInfoSuccess] = useState('');

  // ── Password form ──
  const [pw, setPw] = useState({ current_password: '', password: '', password_confirmation: '' });
  const [pwSaving,  setPwSaving]  = useState(false);
  const [pwError,   setPwError]   = useState('');
  const [pwSuccess, setPwSuccess] = useState('');

  // Populate form from Redux user
  useEffect(() => {
    if (user) {
      setForm({
        firstname:  user.firstname  || '',
        lastname:   user.lastname   || '',
        othername:  user.othername  || '',
        phone:      user.phone      || '',
        gender:     user.gender     || '',
      });
    }
  }, [user]);

  // Fetch profile image
  useEffect(() => {
    if (!user?.id) return;
    UsersService.getProfileImage(user.id)
      .then((data) => { if (data?.url) setPhotoUrl(data.url); })
      .catch(() => {});
  }, [user?.id]);

  if (!user) return null;

  const initials = getInitials(user);
  const fullName = [user.firstname, user.lastname].filter(Boolean).join(' ') || user.email;

  // ── Handlers ──
  const handleInfoSave = async (e) => {
    e.preventDefault();
    setInfoSaving(true);
    setInfoError('');
    setInfoSuccess('');
    try {
      const updated = await UsersService.update(user.id, form);
      const updatedUser = updated?.user ?? updated;
      dispatch(patchUser(updatedUser));
      TokenService.setUser({ ...user, ...updatedUser });
      setInfoSuccess('Profile updated successfully.');
      setTimeout(() => setInfoSuccess(''), 4000);
    } catch (err) {
      setInfoError(err?.response?.data?.message || err?.message || 'Update failed.');
    } finally {
      setInfoSaving(false);
    }
  };

  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoLoading(true);
    setPhotoError('');
    setPhotoSuccess('');
    // Optimistic preview
    const preview = URL.createObjectURL(file);
    setPhotoUrl(preview);
    try {
      const data = await UsersService.uploadProfileImage(user.id, file);
      if (data?.url) setPhotoUrl(data.url);
      setPhotoSuccess('Photo updated.');
      setTimeout(() => setPhotoSuccess(''), 4000);
    } catch (err) {
      setPhotoError(err?.response?.data?.message || 'Photo upload failed.');
      setPhotoUrl(null);
    } finally {
      setPhotoLoading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handlePasswordSave = async (e) => {
    e.preventDefault();
    if (pw.password !== pw.password_confirmation) {
      setPwError('New passwords do not match.');
      return;
    }
    if (pw.password.length < 8) {
      setPwError('Password must be at least 8 characters.');
      return;
    }
    setPwSaving(true);
    setPwError('');
    setPwSuccess('');
    try {
      await changePassword(user.id, pw);
      setPwSuccess('Password changed successfully.');
      setPw({ current_password: '', password: '', password_confirmation: '' });
      setTimeout(() => setPwSuccess(''), 4000);
    } catch (err) {
      setPwError(err?.response?.data?.message || err?.message || 'Password change failed.');
    } finally {
      setPwSaving(false);
    }
  };

  const setField = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const setPwField = (key) => (e) => setPw((p) => ({ ...p, [key]: e.target.value }));

  return (
    <div className="min-h-screen" style={{ color: 'var(--text)', animation: 'fadeIn .3s ease' }}>

      {/* ── Hero header ── */}
      <div
        className="relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, var(--accent) 0%, #7c3aed 60%, #2563eb 100%)' }}
      >
        {/* Decorative blobs */}
        <div className="absolute -top-10 -right-10 w-64 h-64 rounded-full opacity-10"
          style={{ background: 'white' }} />
        <div className="absolute bottom-0 left-1/3 w-40 h-40 rounded-full opacity-10"
          style={{ background: 'white' }} />

        <div className="relative max-w-5xl mx-auto px-6 md:px-10 py-8 flex flex-col sm:flex-row items-start sm:items-end gap-5">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div
              className="w-24 h-24 rounded-3xl overflow-hidden flex items-center justify-center text-3xl font-black text-white"
              style={{ background: 'rgba(255,255,255,.2)', border: '3px solid rgba(255,255,255,.35)' }}
            >
              {photoUrl
                ? <img src={photoUrl} alt="Profile" className="w-full h-full object-cover" />
                : initials}
            </div>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={photoLoading}
              className="absolute -bottom-2 -right-2 w-8 h-8 rounded-xl flex items-center justify-center transition-all hover:opacity-90 disabled:opacity-50"
              style={{ background: 'white', color: 'var(--accent)', boxShadow: '0 2px 8px rgba(0,0,0,.2)' }}
              title="Upload photo"
            >
              {photoLoading
                ? <ArrowPathIcon className="h-3.5 w-3.5 animate-spin" />
                : <CameraIcon className="h-3.5 w-3.5" />}
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="sr-only" onChange={handlePhotoChange} />
          </div>

          {/* Name + role */}
          <div className="pb-1">
            <h1 className="text-2xl font-black text-white">{fullName}</h1>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span
                className="text-xs font-bold px-2.5 py-1 rounded-full"
                style={{ background: 'rgba(255,255,255,.2)', color: 'white' }}
              >
                {user.role?.name || 'No role'}
              </span>
              <span className="text-xs text-white/70">{user.email}</span>
            </div>
            {(photoError || photoSuccess) && (
              <p
                className="text-xs mt-2 font-semibold"
                style={{ color: photoError ? '#fca5a5' : '#86efac' }}
              >
                {photoError || photoSuccess}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="max-w-5xl mx-auto px-6 md:px-10 py-8 grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* ── Personal Information (3/5) ── */}
        <div className="lg:col-span-3">
          <div className="ui-card p-6" style={{ animation: 'slideUp .25s ease' }}>
            <div className="flex items-center gap-3 mb-6" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '1.25rem' }}>
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'color-mix(in srgb, var(--accent) 12%, transparent)', color: 'var(--accent)' }}
              >
                <UserCircleIcon className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-sm font-black" style={{ color: 'var(--text)' }}>Personal Information</h2>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Update your name and contact details</p>
              </div>
            </div>

            <Feedback type="error"   message={infoError} />
            <Feedback type="success" message={infoSuccess} />
            {(infoError || infoSuccess) && <div className="mb-4" />}

            <form onSubmit={handleInfoSave}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="First Name">
                  <TextInput value={form.firstname} onChange={setField('firstname')} placeholder="First name" />
                </Field>
                <Field label="Last Name">
                  <TextInput value={form.lastname} onChange={setField('lastname')} placeholder="Last name" />
                </Field>
                <Field label="Other Name">
                  <TextInput value={form.othername} onChange={setField('othername')} placeholder="Other / middle name" />
                </Field>
                <Field label="Phone">
                  <TextInput value={form.phone} onChange={setField('phone')} placeholder="+233 XX XXX XXXX" type="tel" />
                </Field>
                <Field label="Gender">
                  <SelectInput
                    value={form.gender}
                    onChange={setField('gender')}
                    options={[{ value: 'male', label: 'Male' }, { value: 'female', label: 'Female' }, { value: 'other', label: 'Other' }]}
                  />
                </Field>
                <Field label="Email" hint="Contact an administrator to change your email.">
                  <TextInput value={user.email} disabled type="email" />
                </Field>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  type="submit"
                  disabled={infoSaving}
                  className="px-6 py-2.5 rounded-xl text-sm font-bold transition-all hover:opacity-90 disabled:opacity-50 inline-flex items-center gap-2"
                  style={{ background: 'var(--accent)', color: '#fff', boxShadow: '0 2px 8px color-mix(in srgb, var(--accent) 35%, transparent)' }}
                >
                  {infoSaving && <ArrowPathIcon className="h-3.5 w-3.5 animate-spin" />}
                  {infoSaving ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* ── Right column (2/5) ── */}
        <div className="lg:col-span-2 flex flex-col gap-6">

          {/* Change Password */}
          <div className="ui-card p-6" style={{ animation: 'slideUp .3s ease' }}>
            <div className="flex items-center gap-3 mb-6" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '1.25rem' }}>
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'color-mix(in srgb, var(--warning) 12%, transparent)', color: 'var(--warning)' }}
              >
                <KeyIcon className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-sm font-black" style={{ color: 'var(--text)' }}>Change Password</h2>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Choose a strong password</p>
              </div>
            </div>

            <Feedback type="error"   message={pwError} />
            <Feedback type="success" message={pwSuccess} />
            {(pwError || pwSuccess) && <div className="mb-4" />}

            <form onSubmit={handlePasswordSave} className="flex flex-col gap-4">
              <Field label="Current Password">
                <PasswordInput
                  value={pw.current_password}
                  onChange={setPwField('current_password')}
                  placeholder="Current password"
                  disabled={pwSaving}
                />
              </Field>
              <Field label="New Password">
                <PasswordInput
                  value={pw.password}
                  onChange={setPwField('password')}
                  placeholder="Min. 8 characters"
                  disabled={pwSaving}
                />
              </Field>
              <Field label="Confirm New Password">
                <PasswordInput
                  value={pw.password_confirmation}
                  onChange={setPwField('password_confirmation')}
                  placeholder="Repeat new password"
                  disabled={pwSaving}
                />
              </Field>
              <div className="flex justify-end mt-1">
                <button
                  type="submit"
                  disabled={pwSaving || !pw.current_password || !pw.password}
                  className="px-5 py-2.5 rounded-xl text-sm font-bold transition-all hover:opacity-90 disabled:opacity-50 inline-flex items-center gap-2"
                  style={{ background: 'var(--warning)', color: '#fff', boxShadow: '0 2px 8px color-mix(in srgb, var(--warning) 35%, transparent)' }}
                >
                  {pwSaving && <ArrowPathIcon className="h-3.5 w-3.5 animate-spin" />}
                  {pwSaving ? 'Updating…' : 'Change Password'}
                </button>
              </div>
            </form>
          </div>

          {/* Account info card */}
          <div className="ui-card p-5" style={{ animation: 'slideUp .35s ease' }}>
            <p className="text-xs font-black uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>Account</p>
            <div className="flex flex-col gap-3">
              {[
                { label: 'Staff ID',   value: user.staff_id  || '—' },
                { label: 'Role',       value: user.role?.name || '—' },
                { label: 'Email',      value: user.email },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between gap-3">
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</span>
                  <span
                    className="text-xs font-semibold text-right truncate max-w-[60%]"
                    style={{ color: 'var(--text)' }}
                    title={value}
                  >
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
