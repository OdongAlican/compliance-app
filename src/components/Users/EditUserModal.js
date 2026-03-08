/**
 * EditUserModal.js — Edit an existing user.
 *
 * Sections:
 *   A. Core details  (all permitted fields)
 *   B. Change role   (POST /users/:id/set_role)
 *   C. Profile image (POST /users/:id/upload_profile)
 *
 * Props:
 *   isOpen      boolean
 *   user        object   — current user record from API
 *   onClose     () => void
 *   onUpdated   (user) => void
 *   roles       { id, name }[]
 *   professions { id, name }[]
 */
import React, { useState, useEffect, useRef } from 'react';
import { ArrowUpTrayIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import UsersService from '../../services/users.service';

const inputCls  = 'w-full rounded-xl px-3 py-2.5 text-sm outline-none';
const inputStyle = { background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' };
const labelCls  = 'block text-xs font-medium mb-1.5';
const labelStyle = { color: 'var(--text-muted)' };

function Field({ label, error, children }) {
  return (
    <div>
      <label className={labelCls} style={labelStyle}>{label}</label>
      {children}
      {error && <p className="text-xs mt-1" style={{ color: 'var(--danger)' }}>{error}</p>}
    </div>
  );
}

const TABS = ['Details', 'Role', 'Profile Image'];

export default function EditUserModal({ isOpen, user, onClose, onUpdated, roles = [], professions = [] }) {
  const [activeTab, setActiveTab] = useState('Details');
  const [form, setForm]           = useState({});
  const [errors, setErrors]       = useState({});
  const [saving, setSaving]       = useState(false);
  const [apiError, setApiError]   = useState('');

  // Profile image state
  const fileInputRef               = useRef();
  const [imageFile, setImageFile]  = useState(null);
  const [imagePreview, setPreview] = useState(null);
  const [imageUrl, setImageUrl]    = useState(null);
  const [uploading, setUploading]  = useState(false);

  // Role change state
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [roleMsg, setRoleMsg]               = useState('');

  useEffect(() => {
    if (user) {
      setForm({
        firstname:     user.firstname     ?? '',
        lastname:      user.lastname      ?? '',
        othername:     user.othername     ?? '',
        email:         user.email         ?? '',
        phone:         user.phone         ?? '',
        gender:        user.gender        ?? '',
        age:           user.age           ?? '',
        staff_id:      user.staff_id      ?? '',
        profession_id: user.profession_id ?? '',
      });
      setSelectedRoleId(user.role_id ?? user.role?.id ?? '');
      setErrors({});
      setApiError('');
      setRoleMsg('');
      setImageFile(null);
      setPreview(null);
      // Fetch current profile image URL
      UsersService.getProfileImage(user.id)
        .then((r) => setImageUrl(r.url))
        .catch(() => setImageUrl(null));
    }
  }, [user]);

  if (!isOpen || !user) return null;

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  /* ── A. Save details ──────────────────────────────────────────────────── */
  const handleSaveDetails = async () => {
    const e = {};
    if (form.email && !/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email.';
    if (form.phone && (form.phone.length < 7 || form.phone.length > 20))
      e.phone = 'Phone must be 7–20 characters.';
    if (form.age && (isNaN(Number(form.age)) || Number(form.age) < 0))
      e.age = 'Age must be a positive number.';
    if (Object.keys(e).length) { setErrors(e); return; }

    setErrors({});
    setApiError('');
    setSaving(true);
    try {
      const payload = {
        firstname:     form.firstname.trim() || undefined,
        lastname:      form.lastname.trim()  || undefined,
        othername:     form.othername.trim() || undefined,
        email:         form.email.trim().toLowerCase() || undefined,
        phone:         form.phone.trim() || undefined,
        gender:        form.gender || undefined,
        age:           form.age ? Number(form.age) : undefined,
        staff_id:      form.staff_id.trim() || undefined,
        profession_id: form.profession_id ? Number(form.profession_id) : undefined,
      };
      const updated = await UsersService.update(user.id, payload);
      onUpdated?.(updated);
      onClose();
    } catch (err) {
      const msgs = err?.response?.data?.errors;
      setApiError(
        Array.isArray(msgs) ? msgs.join(' · ') :
        err?.response?.data?.error || 'Update failed.'
      );
    } finally {
      setSaving(false);
    }
  };

  /* ── B. Change role ───────────────────────────────────────────────────── */
  const handleSetRole = async () => {
    if (!selectedRoleId) return;
    setRoleMsg('');
    setSaving(true);
    try {
      const updated = await UsersService.setRole(user.id, Number(selectedRoleId));
      onUpdated?.(updated);
      setRoleMsg('Role updated successfully.');
    } catch (err) {
      setRoleMsg(err?.response?.data?.error || 'Role update failed.');
    } finally {
      setSaving(false);
    }
  };

  /* ── C. Profile image ─────────────────────────────────────────────────── */
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleUpload = async () => {
    if (!imageFile) return;
    setUploading(true);
    try {
      const result = await UsersService.uploadProfileImage(user.id, imageFile);
      setImageUrl(result.url);
      setImageFile(null);
      setPreview(null);
    } catch (err) {
      setApiError(err?.response?.data?.error || 'Image upload failed.');
    } finally {
      setUploading(false);
    }
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
            <h2 className="text-base font-bold" style={{ color: 'var(--text)' }}>Edit User</h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              {user.firstname} {user.lastname} · {user.staff_id}
            </p>
          </div>
          <button onClick={onClose} className="text-xl font-bold leading-none"
            style={{ color: 'var(--text-muted)' }} aria-label="Close">×</button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-6 pt-4 shrink-0">
          {TABS.map((t) => (
            <button key={t} type="button"
              onClick={() => { setActiveTab(t); setApiError(''); setRoleMsg(''); }}
              className="px-4 py-2 rounded-full text-sm font-medium transition-all"
              style={activeTab === t
                ? { background: 'var(--accent)', color: '#fff' }
                : { color: 'var(--text-muted)', background: 'var(--bg-raised)' }}>
              {t}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {apiError && (
            <div className="mb-4 px-4 py-3 rounded-xl text-sm font-medium"
              style={{ background: 'color-mix(in srgb, var(--danger) 12%, transparent)', color: 'var(--danger)', border: '1px solid color-mix(in srgb, var(--danger) 30%, transparent)' }}>
              {apiError}
            </div>
          )}

          {/* ── Tab A: Details ── */}
          {activeTab === 'Details' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="First Name" error={errors.firstname}>
                <input type="text" className={inputCls} style={inputStyle}
                  value={form.firstname} onChange={(e) => set('firstname', e.target.value)} />
              </Field>
              <Field label="Last Name" error={errors.lastname}>
                <input type="text" className={inputCls} style={inputStyle}
                  value={form.lastname} onChange={(e) => set('lastname', e.target.value)} />
              </Field>
              <Field label="Other Name">
                <input type="text" className={inputCls} style={inputStyle}
                  value={form.othername} onChange={(e) => set('othername', e.target.value)} />
              </Field>
              <Field label="Email" error={errors.email}>
                <input type="email" className={inputCls} style={inputStyle}
                  value={form.email} onChange={(e) => set('email', e.target.value)} />
              </Field>
              <Field label="Phone" error={errors.phone}>
                <input type="tel" className={inputCls} style={inputStyle}
                  value={form.phone} onChange={(e) => set('phone', e.target.value)} />
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
              <Field label="Age" error={errors.age}>
                <input type="number" min="0" className={inputCls} style={inputStyle}
                  value={form.age} onChange={(e) => set('age', e.target.value)} />
              </Field>
              <Field label="Staff ID">
                <input type="text" className={inputCls} style={inputStyle}
                  value={form.staff_id} onChange={(e) => set('staff_id', e.target.value)} />
              </Field>
              <Field label="Profession">
                <select className={inputCls} style={inputStyle}
                  value={form.profession_id} onChange={(e) => set('profession_id', e.target.value)}>
                  <option value="">Select profession</option>
                  {professions.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </Field>
            </div>
          )}

          {/* ── Tab B: Role ── */}
          {activeTab === 'Role' && (
            <div className="space-y-5">
              <div>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  Current role: <strong style={{ color: 'var(--text)' }}>{user.role?.name ?? 'None'}</strong>
                </p>
              </div>
              <Field label="Assign New Role">
                <select className={inputCls} style={inputStyle}
                  value={selectedRoleId} onChange={(e) => setSelectedRoleId(e.target.value)}>
                  <option value="">Select role</option>
                  {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </Field>
              {roleMsg && (
                <p className="text-sm px-3 py-2 rounded-lg"
                  style={{
                    background: roleMsg.includes('success')
                      ? 'color-mix(in srgb, var(--success) 12%, transparent)'
                      : 'color-mix(in srgb, var(--danger) 12%, transparent)',
                    color: roleMsg.includes('success') ? 'var(--success)' : 'var(--danger)',
                  }}>
                  {roleMsg}
                </p>
              )}
              <button
                type="button"
                onClick={handleSetRole}
                disabled={saving || !selectedRoleId}
                className="px-6 py-2 rounded-full text-sm font-semibold disabled:opacity-50 transition-opacity"
                style={{ background: 'var(--accent)', color: '#fff' }}>
                {saving ? 'Updating…' : 'Update Role'}
              </button>
            </div>
          )}

          {/* ── Tab C: Profile Image ── */}
          {activeTab === 'Profile Image' && (
            <div className="space-y-5">
              {/* Current image */}
              <div className="flex flex-col items-center gap-3">
                {imageUrl || imagePreview ? (
                  <img
                    src={imagePreview ?? imageUrl}
                    alt="Profile"
                    className="w-28 h-28 rounded-full object-cover"
                    style={{ border: '3px solid var(--accent)' }}
                  />
                ) : (
                  <UserCircleIcon className="w-28 h-28" style={{ color: 'var(--text-muted)' }} />
                )}
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {imagePreview ? 'Preview — not yet uploaded' : imageUrl ? 'Current profile image' : 'No profile image'}
                </p>
              </div>

              {/* Upload area */}
              <div
                className="flex flex-col items-center gap-3 px-6 py-8 rounded-xl border-2 border-dashed cursor-pointer transition-colors"
                style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}
                onClick={() => fileInputRef.current?.click()}
              >
                <ArrowUpTrayIcon className="w-8 h-8" style={{ color: 'var(--text-muted)' }} />
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  Click to select an image file
                </p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>PNG, JPG, WEBP · max 10 MB</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>

              {imageFile && (
                <div className="flex items-center justify-between px-4 py-3 rounded-xl"
                  style={{ background: 'var(--bg-raised)', border: '1px solid var(--border)' }}>
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>{imageFile.name}</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {(imageFile.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleUpload}
                    disabled={uploading}
                    className="px-5 py-2 rounded-full text-sm font-semibold disabled:opacity-60 transition-opacity"
                    style={{ background: 'var(--accent)', color: '#fff' }}>
                    {uploading ? 'Uploading…' : 'Upload'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center px-6 py-4 shrink-0"
          style={{ borderTop: '1px solid var(--border)', background: 'var(--bg-raised)' }}>
          <button onClick={onClose}
            className="px-5 py-2 rounded-full text-sm font-medium"
            style={{ border: '1px solid var(--border)', color: 'var(--text-muted)', background: 'var(--bg)' }}>
            Cancel
          </button>
          {activeTab === 'Details' && (
            <button
              type="button"
              onClick={handleSaveDetails}
              disabled={saving}
              className="px-6 py-2 rounded-full text-sm font-semibold disabled:opacity-60 transition-opacity"
              style={{ background: 'var(--accent)', color: '#fff' }}>
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
