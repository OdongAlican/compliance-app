/**
 * RolesPage.js — Role & permission management.
 *
 * Features:
 *  - List all roles with their permission chips
 *  - Create role (name + description)
 *  - Edit role details
 *  - Assign / revoke permissions via checkbox matrix
 *  - Delete role (blocked on server if role has users)
 *  - Permission-gated via hasPermission(PERMISSIONS.ROLES_*)
 */
import React, { useState, useEffect } from 'react';
import { PlusIcon, ArrowPathIcon, ShieldCheckIcon, MagnifyingGlassIcon, UsersIcon } from '@heroicons/react/24/outline';
import { XMarkIcon, ChevronRightIcon } from '@heroicons/react/20/solid';
import useAuth from '../../hooks/useAuth';
import { PERMISSIONS } from '../../utils/constants';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  fetchRolesAndPermissions,
  createRoleThunk,
  updateRoleThunk,
  deleteRoleThunk,
  setPermissionsThunk,
  clearRolesError,
  selectRoles,
  selectAllPermissions,
  selectRolesLoading,
  selectRolesError,
  selectPermissionsError,
} from '../../store/slices/rolesSlice';
import DeleteModal from '../../components/feedback/DeleteModal';
import LoadingSpinner from '../../components/feedback/LoadingSpinner';

// ── Helpers ──────────────────────────────────────────────────────────────────
function groupPermissions(permissions) {
  return permissions.reduce((acc, p) => {
    const [ns] = (p.key || '').split('.');
    if (!acc[ns]) acc[ns] = [];
    acc[ns].push(p);
    return acc;
  }, {});
}

// ── Role card ─────────────────────────────────────────────────────────────────
function RoleDetailPanel({ role, canEdit, canDelete, onEdit, onPermissions, onDelete }) {
  const perms  = role.permissions ?? [];
  const groups = groupPermissions(perms);

  return (
    <div className="flex flex-col gap-4" style={{ animation: 'slideUp .2s ease' }}>
      {/* Header card */}
      <div className="ui-card p-5 md:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-black flex-shrink-0"
              style={{ background: 'color-mix(in srgb, var(--accent) 15%, transparent)', color: 'var(--accent)' }}
            >
              {role.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl font-black" style={{ color: 'var(--text)' }}>{role.name}</h2>
              {role.description && (
                <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>{role.description}</p>
              )}
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span
                  className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full"
                  style={{ background: 'color-mix(in srgb, var(--accent) 12%, transparent)', color: 'var(--accent)' }}
                >
                  <ShieldCheckIcon className="h-3 w-3" />
                  {perms.length} permission{perms.length !== 1 ? 's' : ''}
                </span>
                {(role.users_count > 0) && (
                  <span
                    className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full"
                    style={{ background: 'color-mix(in srgb, #3fb950 12%, transparent)', color: '#3fb950' }}
                  >
                    <UsersIcon className="h-3 w-3" />
                    {role.users_count} user{role.users_count !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 flex-wrap justify-end">
            {canEdit && (
              <button
                type="button"
                onClick={onEdit}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:opacity-80"
                style={{ border: '1px solid var(--border)', color: 'var(--text-muted)', background: 'var(--bg-raised)' }}
              >
                Edit
              </button>
            )}
            {canEdit && (
              <button
                type="button"
                onClick={onPermissions}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:opacity-80"
                style={{ background: 'color-mix(in srgb, var(--accent) 10%, transparent)', color: 'var(--accent)', border: '1px solid color-mix(in srgb, var(--accent) 25%, transparent)' }}
              >
                Permissions
              </button>
            )}
            {canDelete && (
              <button
                type="button"
                onClick={onDelete}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:opacity-80"
                style={{ background: 'color-mix(in srgb, var(--danger) 10%, transparent)', color: 'var(--danger)', border: '1px solid color-mix(in srgb, var(--danger) 20%, transparent)' }}
              >
                Delete
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Permissions detail */}
      {perms.length > 0 ? (
        <div className="ui-card p-5 md:p-6">
          <h3 className="text-sm font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--text)' }}>
            <ShieldCheckIcon className="h-4 w-4" style={{ color: 'var(--accent)' }} />
            Assigned Permissions
            <span
              className="ml-auto text-[11px] font-bold px-2 py-0.5 rounded-full"
              style={{ background: 'color-mix(in srgb, var(--accent) 10%, transparent)', color: 'var(--accent)' }}
            >
              {perms.length}
            </span>
          </h3>
          <div className="flex flex-col gap-5">
            {Object.keys(groups).sort().map((ns) => (
              <div key={ns}>
                <p className="text-[11px] font-bold uppercase tracking-widest mb-2.5" style={{ color: 'var(--text-muted)' }}>
                  {ns}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {groups[ns].map((p) => (
                    <span
                      key={p.id ?? p.key}
                      className="px-2.5 py-1 rounded-lg text-xs font-mono"
                      style={{ background: 'color-mix(in srgb, var(--accent) 10%, transparent)', color: 'var(--accent)', border: '1px solid color-mix(in srgb, var(--accent) 20%, transparent)' }}
                    >
                      {p.key.split('.').slice(1).join('.') || p.key}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="ui-card flex flex-col items-center justify-center px-6 py-12 gap-3">
          <ShieldCheckIcon className="h-8 w-8 opacity-25" style={{ color: 'var(--text-muted)' }} />
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No permissions assigned to this role.</p>
          {canEdit && (
            <button
              type="button"
              onClick={onPermissions}
              className="text-xs font-bold px-3 py-1.5 rounded-lg transition-all hover:opacity-80"
              style={{ background: 'color-mix(in srgb, var(--accent) 10%, transparent)', color: 'var(--accent)' }}
            >
              Assign Permissions
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Create / Edit role modal ──────────────────────────────────────────────────
function RoleFormModal({ isOpen, role, onClose, onSaved }) {
  const dispatch = useAppDispatch();
  const isEdit   = Boolean(role);
  const [name, setName]     = useState('');
  const [desc, setDesc]     = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  useEffect(() => {
    if (isOpen) {
      setName(role?.name ?? '');
      setDesc(role?.description ?? '');
      setError('');
    }
  }, [isOpen, role]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const n = name.trim();
    if (!n) { setError('Role name is required.'); return; }
    setSaving(true);
    setError('');
    const payload = { name: n, description: desc.trim() };
    const result  = isEdit
      ? await dispatch(updateRoleThunk({ id: role.id, payload }))
      : await dispatch(createRoleThunk(payload));
    if ((isEdit ? updateRoleThunk : createRoleThunk).rejected.match(result)) {
      setError(result.payload || 'Save failed.');
    } else {
      onSaved(result.payload);
    }
    setSaving(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,.6)', backdropFilter: 'blur(6px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-md flex flex-col rounded-2xl overflow-hidden"
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-lg)',
          animation: 'slideUp .2s ease',
        }}
      >
        {/* Header */}
        <div className="flex-shrink-0 px-6 pt-6 pb-5" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'color-mix(in srgb, var(--accent) 12%, transparent)', color: 'var(--accent)' }}
              >
                <ShieldCheckIcon className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-black" style={{ color: 'var(--text)' }}>
                  {isEdit ? 'Edit Role' : 'Create Role'}
                </h2>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  {isEdit ? `Editing "${role.name}"` : 'Add a new role to the system'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg flex-shrink-0 transition-all hover:opacity-70"
              style={{ background: 'var(--bg-raised)', color: 'var(--text-muted)' }}
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>

          {error && (
            <div
              className="mt-4 px-4 py-2.5 rounded-xl text-sm"
              style={{ background: 'color-mix(in srgb, var(--danger) 10%, transparent)', color: 'var(--danger)', border: '1px solid color-mix(in srgb, var(--danger) 20%, transparent)' }}
            >
              {error}
            </div>
          )}
        </div>

        {/* Body */}
        <form id="role-form" onSubmit={handleSubmit}>
          <div className="px-6 py-5 flex flex-col gap-5">
            <div>
              <label className="block text-xs font-bold mb-2 uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                Role Name <span style={{ color: 'var(--danger)' }}>*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Safety Officer"
                className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                style={{ background: 'var(--bg-raised)', border: '1px solid var(--border)', color: 'var(--text)' }}
                onFocus={(e) => { e.currentTarget.style.border = '1px solid var(--accent)'; e.currentTarget.style.boxShadow = '0 0 0 3px color-mix(in srgb, var(--accent) 15%, transparent)'; }}
                onBlur={(e)  => { e.currentTarget.style.border = '1px solid var(--border)'; e.currentTarget.style.boxShadow = 'none'; }}
              />
            </div>
            <div>
              <label className="block text-xs font-bold mb-2 uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                Description
              </label>
              <textarea
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                placeholder="Optional — describe the purpose of this role…"
                rows={3}
                className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none transition-all"
                style={{ background: 'var(--bg-raised)', border: '1px solid var(--border)', color: 'var(--text)' }}
                onFocus={(e) => { e.currentTarget.style.border = '1px solid var(--accent)'; e.currentTarget.style.boxShadow = '0 0 0 3px color-mix(in srgb, var(--accent) 15%, transparent)'; }}
                onBlur={(e)  => { e.currentTarget.style.border = '1px solid var(--border)'; e.currentTarget.style.boxShadow = 'none'; }}
              />
            </div>
          </div>
        </form>

        {/* Footer */}
        <div
          className="flex-shrink-0 px-6 py-4 flex justify-end gap-2.5"
          style={{ borderTop: '1px solid var(--border)' }}
        >
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:opacity-80"
            style={{ border: '1px solid var(--border)', color: 'var(--text-muted)', background: 'var(--bg-raised)' }}
          >
            Cancel
          </button>
          <button
            type="submit"
            form="role-form"
            disabled={saving}
            className="px-5 py-2 rounded-xl text-sm font-bold transition-all hover:opacity-90 disabled:opacity-50 inline-flex items-center gap-2"
            style={{ background: 'var(--accent)', color: '#fff', boxShadow: '0 2px 8px color-mix(in srgb, var(--accent) 35%, transparent)' }}
          >
            {saving ? (
              <>
                <ArrowPathIcon className="h-3.5 w-3.5 animate-spin" />
                Saving…
              </>
            ) : isEdit ? 'Save Changes' : 'Create Role'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Permissions assignment modal ──────────────────────────────────────────────
function PermissionsModal({ isOpen, role, allPermissions, onClose, onUpdated }) {
  const dispatch = useAppDispatch();
  const [selected, setSelected] = useState(new Set());
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState('');

  useEffect(() => {
    if (isOpen && role) {
      setSelected(new Set((role.permissions ?? []).map((p) => p.key)));
      setError('');
      setSuccess('');
    }
  }, [isOpen, role]);

  if (!isOpen || !role) return null;

  const groups = groupPermissions(allPermissions);

  const toggle = (key) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    const currentKeys = new Set((role.permissions ?? []).map((p) => p.key));
    const keysToSet    = [...selected];
    const keysToRevoke = [...currentKeys].filter((k) => !selected.has(k));
    const result = await dispatch(setPermissionsThunk({
      id: role.id,
      keysToSet,
      keysToRevoke,
      allPermissions,
    }));
    if (setPermissionsThunk.rejected.match(result)) {
      setError(result.payload || 'Failed to save permissions.');
    } else {
      onUpdated(result.payload);
      setSuccess('Permissions saved!');
      setTimeout(() => setSuccess(''), 2000);
    }
    setSaving(false);
  };

  const nsKeys = Object.keys(groups).sort();
  const totalPerms = allPermissions.length;

  const toggleNs = (ns) => {
    const nsKeys_ = groups[ns].map((p) => p.key);
    const allOn   = nsKeys_.every((k) => selected.has(k));
    setSelected((prev) => {
      const next = new Set(prev);
      nsKeys_.forEach((k) => allOn ? next.delete(k) : next.add(k));
      return next;
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: 'rgba(0,0,0,.6)', backdropFilter: 'blur(6px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full sm:max-w-2xl flex flex-col overflow-hidden sm:rounded-2xl"
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-lg)',
          borderRadius: '1.25rem',
          maxHeight: '90vh',
          animation: 'slideUp .22s ease',
        }}
      >
        {/* ── Sticky header ── */}
        <div className="flex-shrink-0 px-6 pt-6 pb-5" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center text-lg font-black flex-shrink-0"
                style={{ background: 'color-mix(in srgb, var(--accent) 15%, transparent)', color: 'var(--accent)' }}
              >
                {role.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-base font-black" style={{ color: 'var(--text)' }}>Manage Permissions</h2>
                <p className="text-xs mt-0.5 flex items-center gap-1.5 flex-wrap" style={{ color: 'var(--text-muted)' }}>
                  <span>Role:</span>
                  <span
                    className="font-bold px-2 py-0.5 rounded-full text-[11px]"
                    style={{ background: 'color-mix(in srgb, var(--accent) 12%, transparent)', color: 'var(--accent)' }}
                  >
                    {role.name}
                  </span>
                  <span className="opacity-50">·</span>
                  <span>{totalPerms} available</span>
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg flex-shrink-0 transition-all hover:opacity-70"
              style={{ background: 'var(--bg-raised)', color: 'var(--text-muted)' }}
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>

          {/* Inline feedback banners */}
          {error && (
            <div
              className="mt-4 px-4 py-2.5 rounded-xl text-sm flex items-center gap-2"
              style={{ background: 'color-mix(in srgb, var(--danger) 10%, transparent)', color: 'var(--danger)', border: '1px solid color-mix(in srgb, var(--danger) 20%, transparent)' }}
            >
              {error}
            </div>
          )}
          {success && (
            <div
              className="mt-4 px-4 py-2.5 rounded-xl text-sm flex items-center gap-2"
              style={{ background: 'color-mix(in srgb, var(--success) 10%, transparent)', color: 'var(--success)', border: '1px solid color-mix(in srgb, var(--success) 20%, transparent)' }}
            >
              {success}
            </div>
          )}
        </div>

        {/* ── Scrollable body ── */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {totalPerms === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <ShieldCheckIcon className="h-10 w-10 opacity-20" style={{ color: 'var(--text-muted)' }} />
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No permissions defined yet.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {nsKeys.map((ns) => {
                const nsPerms   = groups[ns];
                const checkedNs = nsPerms.filter((p) => selected.has(p.key)).length;
                const allOn     = checkedNs === nsPerms.length;

                return (
                  <div key={ns}>
                    {/* Namespace header */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span
                          className="text-[11px] font-black uppercase tracking-widest px-2 py-0.5 rounded"
                          style={{ background: 'var(--bg-raised)', color: 'var(--text-muted)' }}
                        >
                          {ns}
                        </span>
                        <span
                          className="text-[11px] font-bold px-1.5 py-0.5 rounded-full"
                          style={{
                            background: checkedNs > 0 ? 'color-mix(in srgb, var(--accent) 12%, transparent)' : 'var(--bg-raised)',
                            color: checkedNs > 0 ? 'var(--accent)' : 'var(--text-muted)',
                          }}
                        >
                          {checkedNs}/{nsPerms.length}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleNs(ns)}
                        className="text-[11px] font-bold px-2.5 py-1 rounded-lg transition-all hover:opacity-80"
                        style={{
                          background: allOn ? 'color-mix(in srgb, var(--accent) 10%, transparent)' : 'var(--bg-raised)',
                          color: allOn ? 'var(--accent)' : 'var(--text-muted)',
                          border: `1px solid ${allOn ? 'color-mix(in srgb, var(--accent) 25%, transparent)' : 'var(--border)'}`,
                        }}
                      >
                        {allOn ? 'Deselect all' : 'Select all'}
                      </button>
                    </div>

                    {/* Permission rows */}
                    <div className="flex flex-col gap-1.5">
                      {nsPerms.map((perm) => {
                        const isOn = selected.has(perm.key);
                        return (
                          <button
                            key={perm.id ?? perm.key}
                            type="button"
                            onClick={() => toggle(perm.key)}
                            className="w-full text-left px-4 py-3 rounded-xl flex items-start gap-3 transition-all"
                            style={{
                              background: isOn
                                ? 'color-mix(in srgb, var(--accent) 8%, transparent)'
                                : 'var(--bg-raised)',
                              border: `1px solid ${isOn ? 'color-mix(in srgb, var(--accent) 25%, transparent)' : 'var(--border)'}`,
                            }}
                          >
                            {/* Custom checkbox indicator */}
                            <div
                              className="mt-0.5 w-4 h-4 rounded flex items-center justify-center flex-shrink-0 transition-all"
                              style={{
                                background: isOn ? 'var(--accent)' : 'transparent',
                                border: `2px solid ${isOn ? 'var(--accent)' : 'var(--border)'}`,
                              }}
                            >
                              {isOn && (
                                <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 12 12" fill="none">
                                  <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <span
                                className="text-xs font-mono font-bold block"
                                style={{ color: isOn ? 'var(--accent)' : 'var(--text)' }}
                              >
                                {perm.key.split('.').slice(1).join('.') || perm.key}
                              </span>
                              {perm.description && (
                                <span className="text-xs mt-0.5 block" style={{ color: 'var(--text-muted)' }}>
                                  {perm.description}
                                </span>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Sticky footer ── */}
        <div
          className="flex-shrink-0 px-6 py-4 flex items-center justify-between gap-4"
          style={{ borderTop: '1px solid var(--border)' }}
        >
          <div className="flex items-center gap-2">
            <span
              className="text-sm font-black px-2.5 py-1 rounded-lg"
              style={{ background: 'color-mix(in srgb, var(--accent) 10%, transparent)', color: 'var(--accent)' }}
            >
              {selected.size}
            </span>
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
              permission{selected.size !== 1 ? 's' : ''} selected
            </span>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:opacity-80"
              style={{ border: '1px solid var(--border)', color: 'var(--text-muted)', background: 'var(--bg-raised)' }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="px-5 py-2 rounded-xl text-sm font-bold transition-all hover:opacity-90 disabled:opacity-50 inline-flex items-center gap-2"
              style={{ background: 'var(--accent)', color: '#fff', boxShadow: '0 2px 8px color-mix(in srgb, var(--accent) 35%, transparent)' }}
            >
              {saving ? (
                <>
                  <ArrowPathIcon className="h-3.5 w-3.5 animate-spin" />
                  Saving…
                </>
              ) : (
                'Save Permissions'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function RolesPage() {
  const dispatch = useAppDispatch();
  const { hasPermission } = useAuth();

  const canView   = hasPermission(PERMISSIONS.ROLES_INDEX);
  const canCreate = hasPermission(PERMISSIONS.ROLES_CREATE);
  const canEdit   = hasPermission(PERMISSIONS.ROLES_UPDATE);
  const canDelete = hasPermission(PERMISSIONS.ROLES_DESTROY);

  const roles          = useAppSelector(selectRoles);
  const allPermissions = useAppSelector(selectAllPermissions);
  const loading        = useAppSelector(selectRolesLoading);
  const error          = useAppSelector(selectRolesError);
  const permError      = useAppSelector(selectPermissionsError);

  const [formModal, setFormModal]       = useState({ open: false, role: null });
  const [permModal, setPermModal]       = useState({ open: false, role: null });
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteError, setDeleteError]   = useState('');

  // Two-column layout state
  const [selectedRoleId, setSelectedRoleId] = useState(null);
  const [roleSearch, setRoleSearch]         = useState('');

  // Derived: always reads fresh from Redux store (auto-updates after mutations)
  const selectedRole  = roles.find((r) => r.id === selectedRoleId) ?? null;
  const filteredRoles = React.useMemo(() => {
    if (!roleSearch.trim()) return roles;
    const q = roleSearch.toLowerCase();
    return roles.filter((r) => r.name.toLowerCase().includes(q) || (r.description ?? '').toLowerCase().includes(q));
  }, [roles, roleSearch]);

  useEffect(() => {
    if (canView) dispatch(fetchRolesAndPermissions());
  }, [canView]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-select first role after load
  useEffect(() => {
    if (!selectedRoleId && roles.length > 0) setSelectedRoleId(roles[0].id);
  }, [roles.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleFormSaved = (saved) => {
    setFormModal({ open: false, role: null });
    void saved;
  };

  const handlePermissionsUpdated = (updated) => {
    setPermModal({ open: false, role: null });
    void updated;
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleteError('');
    const result = await dispatch(deleteRoleThunk(deleteTarget.id));
    if (deleteRoleThunk.rejected.match(result)) {
      setDeleteError(result.payload || 'Delete failed.');
    } else if (selectedRoleId === deleteTarget.id) {
      setSelectedRoleId(null);
    }
    setDeleteTarget(null);
  };

  if (!canView) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <div className="text-4xl">🔒</div>
        <h2 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>Access Denied</h2>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          You don't have permission to view roles.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ color: 'var(--text)' }}>

      {/* ── Hero header ── */}
      <div
        className="relative overflow-hidden px-6 md:px-10 pt-9 pb-8"
        style={{
          background: 'linear-gradient(135deg, color-mix(in srgb, #3fb950 10%, var(--bg)) 0%, var(--bg) 65%)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div
          className="absolute -top-20 -right-20 w-64 h-64 rounded-full pointer-events-none"
          style={{ background: '#3fb950', opacity: '0.04' }}
        />
        <div className="relative max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="ui-section text-[11px] mb-2">Access Control</p>
            <h1 className="text-3xl font-black tracking-tight gradient-text mb-2 leading-tight">
              Roles &amp; Permissions
            </h1>
            <p className="text-[15px]" style={{ color: 'var(--text-muted)' }}>
              {roles.length} role{roles.length !== 1 ? 's' : ''} &middot; {allPermissions.length} system permissions
            </p>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <button
              type="button"
              onClick={() => { dispatch(clearRolesError()); dispatch(fetchRolesAndPermissions()); }}
              disabled={loading}
              className="p-2.5 rounded-xl transition-all disabled:opacity-40 hover:opacity-80"
              style={{ border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-muted)' }}
              title="Refresh"
            >
              <ArrowPathIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            {canCreate && (
              <button
                type="button"
                onClick={() => setFormModal({ open: true, role: null })}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all hover:opacity-90"
                style={{ background: '#3fb950', color: '#fff', boxShadow: '0 4px 14px color-mix(in srgb, #3fb950 38%, transparent)' }}
              >
                <PlusIcon className="h-4 w-4" /> New Role
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Error */}
      {(error || permError || deleteError) && (
        <div className="max-w-7xl mx-auto px-6 md:px-10 pt-4">
          <div
            className="px-4 py-3 rounded-xl text-sm"
            style={{ background: 'color-mix(in srgb, var(--danger) 12%, transparent)', color: 'var(--danger)', border: '1px solid color-mix(in srgb, var(--danger) 25%, transparent)' }}
          >
            {error || permError || deleteError}
          </div>
        </div>
      )}

      {/* Body */}
      <div className="max-w-7xl mx-auto px-6 md:px-10 py-6">
        {loading && !roles.length ? (
          <div className="py-16"><LoadingSpinner message="Loading roles…" /></div>
        ) : roles.length === 0 ? (
          <div className="ui-card flex flex-col items-center justify-center gap-4 py-20">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ background: 'var(--bg-raised)' }}
            >
              <ShieldCheckIcon className="h-8 w-8 opacity-30" style={{ color: 'var(--text-muted)' }} />
            </div>
            <div className="text-center">
              <p className="font-semibold" style={{ color: 'var(--text)' }}>No roles yet</p>
              <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                {canCreate ? 'Click "New Role" to get started.' : 'No roles have been created.'}
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-5" style={{ animation: 'slideUp .3s ease' }}>

            {/* ── Roles sidebar ── */}
            <div className="lg:col-span-2 ui-card overflow-hidden p-0 flex flex-col">
              {/* Search + count */}
              <div
                className="px-4 py-3.5 flex items-center gap-2"
                style={{ borderBottom: '1px solid var(--border)' }}
              >
                <div className="relative flex-1">
                  <MagnifyingGlassIcon
                    className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4"
                    style={{ color: 'var(--text-muted)' }}
                  />
                  <input
                    type="text"
                    placeholder="Search roles…"
                    value={roleSearch}
                    onChange={(e) => setRoleSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl text-sm outline-none"
                    style={{ background: 'var(--bg-raised)', border: '1px solid var(--border)', color: 'var(--text)' }}
                  />
                </div>
                <span
                  className="text-xs font-semibold px-2 py-1 rounded-lg flex-shrink-0"
                  style={{ background: 'var(--bg-raised)', color: 'var(--text-muted)' }}
                >
                  {filteredRoles.length}
                </span>
              </div>

              {/* Role list */}
              <div className="overflow-y-auto" style={{ minHeight: '200px', maxHeight: 'calc(100vh - 320px)' }}>
                {filteredRoles.length === 0 ? (
                  <p className="py-8 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
                    {roleSearch ? 'No matching roles.' : 'No roles yet.'}
                  </p>
                ) : filteredRoles.map((role) => {
                  const isSelected = selectedRoleId === role.id;
                  const pCount     = role.permissions?.length ?? 0;
                  return (
                    <button
                      key={role.id}
                      type="button"
                      onClick={() => setSelectedRoleId(role.id)}
                      className="w-full text-left px-4 py-4 flex items-center gap-3 transition-all"
                      style={{
                        borderBottom: '1px solid var(--border)',
                        borderLeft: `3px solid ${isSelected ? 'var(--accent)' : 'transparent'}`,
                        background: isSelected ? 'color-mix(in srgb, var(--accent) 7%, transparent)' : 'transparent',
                      }}
                    >
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-sm font-black"
                        style={{
                          background: isSelected ? 'color-mix(in srgb, var(--accent) 18%, transparent)' : 'var(--bg-raised)',
                          color: isSelected ? 'var(--accent)' : 'var(--text-muted)',
                        }}
                      >
                        {role.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className="font-semibold text-sm truncate"
                          style={{ color: isSelected ? 'var(--accent)' : 'var(--text)' }}
                        >
                          {role.name}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                          {pCount} permission{pCount !== 1 ? 's' : ''}
                          {role.users_count > 0 && ` · ${role.users_count} user${role.users_count !== 1 ? 's' : ''}`}
                        </p>
                      </div>
                      <ChevronRightIcon
                        className="h-4 w-4 flex-shrink-0 transition-opacity"
                        style={{ color: 'var(--accent)', opacity: isSelected ? 1 : 0.3 }}
                      />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ── Role detail panel ── */}
            <div className="lg:col-span-3">
              {selectedRole ? (
                <RoleDetailPanel
                  key={selectedRole.id}
                  role={selectedRole}
                  canEdit={canEdit}
                  canDelete={canDelete}
                  onEdit={() => setFormModal({ open: true, role: selectedRole })}
                  onPermissions={() => setPermModal({ open: true, role: selectedRole })}
                  onDelete={() => { setDeleteError(''); setDeleteTarget(selectedRole); }}
                />
              ) : (
                <div
                  className="ui-card flex flex-col items-center justify-center py-20 gap-4"
                  style={{ minHeight: '300px' }}
                >
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center"
                    style={{ background: 'var(--bg-raised)' }}
                  >
                    <ShieldCheckIcon className="h-8 w-8 opacity-30" style={{ color: 'var(--text-muted)' }} />
                  </div>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                    Select a role to view its details and permissions.
                  </p>
                </div>
              )}
            </div>

          </div>
        )}
      </div>

      {/* Modals */}
      <RoleFormModal
        isOpen={formModal.open}
        role={formModal.role}
        onClose={() => setFormModal({ open: false, role: null })}
        onSaved={handleFormSaved}
      />

      <PermissionsModal
        isOpen={permModal.open}
        role={permModal.role}
        allPermissions={allPermissions}
        onClose={() => setPermModal({ open: false, role: null })}
        onUpdated={handlePermissionsUpdated}
      />

      <DeleteModal
        isOpen={Boolean(deleteTarget)}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        message={
          deleteTarget
            ? `Delete role "${deleteTarget.name}"? This cannot be undone and will fail if the role is assigned to any users.`
            : undefined
        }
      />
    </div>
  );
}
