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
import { PlusIcon, ArrowPathIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import { XMarkIcon } from '@heroicons/react/20/solid';
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
function RoleCard({ role, allPermissions, canEdit, canDelete, onEdit, onPermissions, onDelete }) {
  const perms = role.permissions ?? [];

  return (
    <div className="ui-card flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'color-mix(in srgb, var(--accent) 15%, transparent)' }}>
            <ShieldCheckIcon className="h-5 w-5" style={{ color: 'var(--accent)' }} />
          </div>
          <div>
            <h3 className="font-bold text-base" style={{ color: 'var(--text)' }}>{role.name}</h3>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {perms.length} permission{perms.length !== 1 ? 's' : ''}
              {role.users_count > 0 && ` · ${role.users_count} user${role.users_count !== 1 ? 's' : ''}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {canEdit && (
            <button type="button" onClick={() => onEdit(role)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-opacity hover:opacity-80"
              style={{ background: 'var(--bg-raised)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
              Edit
            </button>
          )}
          {canEdit && (
            <button type="button" onClick={() => onPermissions(role)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-opacity hover:opacity-80"
              style={{ background: 'color-mix(in srgb, var(--accent) 10%, transparent)', color: 'var(--accent)', border: '1px solid color-mix(in srgb, var(--accent) 25%, transparent)' }}>
              Permissions
            </button>
          )}
          {canDelete && (
            <button type="button" onClick={() => onDelete(role)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-opacity hover:opacity-80"
              style={{ background: 'color-mix(in srgb, var(--danger) 10%, transparent)', color: 'var(--danger)', border: '1px solid color-mix(in srgb, var(--danger) 25%, transparent)' }}>
              Delete
            </button>
          )}
        </div>
      </div>

      {/* Description */}
      {role.description && (
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{role.description}</p>
      )}

      {/* Permission chips */}
      {perms.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {perms.map((p) => (
            <span key={p.id ?? p.key}
              className="px-2 py-0.5 rounded-full text-xs font-mono"
              style={{ background: 'color-mix(in srgb, var(--accent) 10%, transparent)', color: 'var(--accent)' }}>
              {p.key}
            </span>
          ))}
        </div>
      ) : (
        <p className="text-xs italic" style={{ color: 'var(--text-muted)' }}>No permissions assigned</p>
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,.55)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="ui-card w-full max-w-md" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold">{isEdit ? 'Edit Role' : 'Create Role'}</h2>
          <button type="button" onClick={onClose}
            className="p-1 rounded-lg transition-opacity hover:opacity-70"
            style={{ color: 'var(--text-muted)' }}>
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <p className="mb-4 px-3 py-2 rounded-lg text-sm"
            style={{ background: 'color-mix(in srgb, var(--danger) 12%, transparent)', color: 'var(--danger)' }}>
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>
              Role Name *
            </label>
            <input
              type="text" value={name} onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Safety Officer"
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
              style={{ background: 'var(--bg-raised)', border: '1px solid var(--border)', color: 'var(--text)' }}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>
              Description
            </label>
            <textarea
              value={desc} onChange={(e) => setDesc(e.target.value)}
              placeholder="Optional description…" rows={3}
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none"
              style={{ background: 'var(--bg-raised)', border: '1px solid var(--border)', color: 'var(--text)' }}
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm font-medium"
              style={{ border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="px-5 py-2 rounded-lg text-sm font-semibold disabled:opacity-50"
              style={{ background: 'var(--accent)', color: '#fff' }}>
              {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Role'}
            </button>
          </div>
        </form>
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,.55)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="ui-card w-full max-w-lg" style={{ maxHeight: '85vh', overflowY: 'auto' }}>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-bold">Manage Permissions</h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              Role: <span className="font-semibold" style={{ color: 'var(--accent)' }}>{role.name}</span>
            </p>
          </div>
          <button type="button" onClick={onClose} className="p-1 rounded-lg hover:opacity-70"
            style={{ color: 'var(--text-muted)' }}>
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <p className="mb-4 px-3 py-2 rounded-lg text-sm"
            style={{ background: 'color-mix(in srgb, var(--danger) 12%, transparent)', color: 'var(--danger)' }}>
            {error}
          </p>
        )}
        {success && (
          <p className="mb-4 px-3 py-2 rounded-lg text-sm"
            style={{ background: 'color-mix(in srgb, var(--success) 12%, transparent)', color: 'var(--success)' }}>
            {success}
          </p>
        )}

        <div className="flex flex-col gap-5 mb-6">
          {Object.keys(groups).sort().map((ns) => (
            <div key={ns}>
              <p className="text-xs font-bold uppercase tracking-wider mb-2"
                style={{ color: 'var(--text-muted)' }}>{ns}</p>
              <div className="flex flex-col gap-2">
                {groups[ns].map((perm) => (
                  <label key={perm.id ?? perm.key}
                    className="flex items-start gap-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={selected.has(perm.key)}
                      onChange={() => toggle(perm.key)}
                      className="mt-0.5"
                    />
                    <div>
                      <span className="text-sm font-mono font-semibold" style={{ color: 'var(--text)' }}>{perm.key}</span>
                      {perm.description && (
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{perm.description}</p>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            </div>
          ))}
          {allPermissions.length === 0 && (
            <p className="text-sm text-center py-6" style={{ color: 'var(--text-muted)' }}>
              No permissions defined yet.
            </p>
          )}
        </div>

        <div className="flex justify-between items-center pt-4" style={{ borderTop: '1px solid var(--border)' }}>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {selected.size} permission{selected.size !== 1 ? 's' : ''} selected
          </p>
          <div className="flex gap-3">
            <button type="button" onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm"
              style={{ border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
              Close
            </button>
            <button type="button" onClick={handleSave} disabled={saving}
              className="px-5 py-2 rounded-lg text-sm font-semibold disabled:opacity-50"
              style={{ background: 'var(--accent)', color: '#fff' }}>
              {saving ? 'Saving…' : 'Save Permissions'}
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

  const canView   = hasPermission(PERMISSIONS.ROLES_VIEW);
  const canCreate = hasPermission(PERMISSIONS.ROLES_CREATE);
  const canEdit   = hasPermission(PERMISSIONS.ROLES_UPDATE);
  const canDelete = hasPermission(PERMISSIONS.ROLES_DELETE);

  // ── Redux state ─────────────────────────────────────────────────────────
  const roles          = useAppSelector(selectRoles);
  const allPermissions = useAppSelector(selectAllPermissions);
  const loading        = useAppSelector(selectRolesLoading);
  const error          = useAppSelector(selectRolesError);
  const permError      = useAppSelector(selectPermissionsError);

  // ── Local modal state ────────────────────────────────────────────────────
  const [formModal, setFormModal]       = useState({ open: false, role: null });
  const [permModal, setPermModal]       = useState({ open: false, role: null });
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteError, setDeleteError]   = useState('');

  useEffect(() => {
    if (canView) dispatch(fetchRolesAndPermissions());
  }, [canView]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleFormSaved = (saved) => {
    setFormModal({ open: false, role: null });
    // State updated by Redux extraReducers (createRoleThunk / updateRoleThunk)
    void saved;
  };

  const handlePermissionsUpdated = (updated) => {
    setPermModal({ open: false, role: null });
    // State updated by Redux extraReducers (setPermissionsThunk)
    void updated;
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleteError('');
    const result = await dispatch(deleteRoleThunk(deleteTarget.id));
    if (deleteRoleThunk.rejected.match(result)) {
      setDeleteError(result.payload || 'Delete failed.');
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
    <div className="p-4 md:p-6 max-w-5xl mx-auto min-h-screen" style={{ color: 'var(--text)' }}>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>Roles & Permissions</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            Manage system roles and the permissions assigned to each · {roles.length} role{roles.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => { dispatch(clearRolesError()); dispatch(fetchRolesAndPermissions()); }} disabled={loading}
            className="p-2 rounded-xl transition-opacity disabled:opacity-50"
            style={{ border: '1px solid var(--border)', color: 'var(--text-muted)', background: 'var(--bg-raised)' }}
            title="Refresh">
            <ArrowPathIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          {canCreate && (
            <button type="button" onClick={() => setFormModal({ open: true, role: null })}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity"
              style={{ background: 'var(--accent)', color: '#fff' }}>
              <PlusIcon className="h-4 w-4" />
              New Role
            </button>
          )}
        </div>
      </div>

      {/* Error */}
      {(error || permError || deleteError) && (
        <div className="mb-4 px-4 py-3 rounded-xl text-sm"
          style={{ background: 'color-mix(in srgb, var(--danger) 12%, transparent)', color: 'var(--danger)', border: '1px solid color-mix(in srgb, var(--danger) 25%, transparent)' }}>
          {error || permError || deleteError}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="py-16"><LoadingSpinner message="Loading roles…" /></div>
      ) : roles.length === 0 ? (
        <div className="ui-card flex flex-col items-center justify-center gap-3 py-16">
          <ShieldCheckIcon className="h-10 w-10 opacity-30" style={{ color: 'var(--text-muted)' }} />
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            No roles yet.{canCreate && ' Click "New Role" to create one.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
          {roles.map((role) => (
            <RoleCard
              key={role.id}
              role={role}
              allPermissions={allPermissions}
              canEdit={canEdit}
              canDelete={canDelete}
              onEdit={(r) => setFormModal({ open: true, role: r })}
              onPermissions={(r) => setPermModal({ open: true, role: r })}
              onDelete={(r) => { setDeleteError(''); setDeleteTarget(r); }}
            />
          ))}
        </div>
      )}

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
