/**
 * UserManagement.js — Production-ready user management page.
 *
 * State management: Redux Toolkit (usersSlice + rolesSlice)
 *   - Server-side pagination via fetchUsers thunk
 *   - Filters (search, roleTab, page) stored in Redux — survive navigation
 *   - Role list shared from rolesSlice (no duplicate API call)
 *   - Permission gating via hasPermission()
 */
import React, { useState, useEffect, useRef } from 'react';
import { PlusIcon, MagnifyingGlassIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { EllipsisVerticalIcon } from '@heroicons/react/20/solid';
import useAuth from '../../hooks/useAuth';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  fetchUsers,
  createUserThunk,
  updateUserThunk,
  deleteUserThunk,
  setPage,
  setSearch,
  setRoleTab,
  clearUsersError,
  selectUsers,
  selectUsersMeta,
  selectUsersLoading,
  selectUsersError,
  selectUsersFilters,
  selectExistingStaffIds,
} from '../../store/slices/usersSlice';
import {
  fetchRolesAndPermissions,
  selectRoles,
} from '../../store/slices/rolesSlice';
import ProfessionsService from '../../services/professions.service';
import { PERMISSIONS } from '../../utils/constants';
import CreateUserModal from './CreateUserModal';
import EditUserModal   from './EditUserModal';
import DeleteModal     from '../feedback/DeleteModal';
import LoadingSpinner  from '../feedback/LoadingSpinner';

// ── Colour helpers ────────────────────────────────────────────────────────────
const ROLE_PALETTE = [
  '#a371f7','#58a6ff','#3fb950','#f0883e','#f85149','#d29922','#39d353','#79c0ff',
];
function roleColor(roleName = '') {
  const idx = roleName.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % ROLE_PALETTE.length;
  return ROLE_PALETTE[idx];
}

// ── Action menu ───────────────────────────────────────────────────────────────
function ActionMenu({ canEdit, canDelete, onEdit, onDelete }) {
  const [open, setOpen] = useState(false);
  const ref = useRef();

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (!canEdit && !canDelete) return <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>—</span>;

  return (
    <div className="relative inline-block" ref={ref}>
      <button type="button" onClick={() => setOpen((o) => !o)}
        className="p-1 rounded hover:opacity-80 transition-opacity"
        style={{ color: 'var(--text-muted)' }}>
        <EllipsisVerticalIcon className="h-5 w-5" />
      </button>
      {open && (
        <div className="ui-menu absolute right-0 mt-1 z-50" role="menu">
          {canEdit && (
            <button type="button" role="menuitem" className="ui-menu-item"
              onClick={() => { onEdit(); setOpen(false); }}>Edit</button>
          )}
          {canDelete && (
            <>
              {canEdit && <div style={{ borderTop: '1px solid var(--border)', margin: '4px 0' }} />}
              <button type="button" role="menuitem" className="ui-menu-item"
                style={{ color: 'var(--danger)' }}
                onClick={() => { onDelete(); setOpen(false); }}>Delete</button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ── Pagination ────────────────────────────────────────────────────────────────
function Pagination({ meta, onPage }) {
  if (!meta || meta.total_pages <= 1) return null;
  const { page, total_pages, total, per_page } = meta;
  const from = (page - 1) * per_page + 1;
  const to   = Math.min(page * per_page, total);

  const pages = Array.from({ length: total_pages }, (_, i) => i + 1)
    .filter((p) => p === 1 || p === total_pages || Math.abs(p - page) <= 2)
    .reduce((acc, p, i, arr) => {
      if (i > 0 && p - arr[i - 1] > 1) acc.push('…');
      acc.push(p);
      return acc;
    }, []);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-4"
      style={{ borderTop: '1px solid var(--border)' }}>
      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
        Showing {from}–{to} of {total} users
      </p>
      <div className="flex items-center gap-1">
        <button onClick={() => onPage(page - 1)} disabled={page === 1}
          className="px-3 py-1.5 rounded-lg text-sm font-medium disabled:opacity-40"
          style={{ border: '1px solid var(--border)', color: 'var(--text-muted)', background: 'var(--bg-raised)' }}>
          ‹ Prev
        </button>
        {pages.map((item, i) =>
          item === '…' ? (
            <span key={`e-${i}`} className="px-2 text-sm" style={{ color: 'var(--text-muted)' }}>…</span>
          ) : (
            <button key={item} onClick={() => onPage(item)}
              className="w-8 h-8 rounded-lg text-sm font-medium"
              style={item === page
                ? { background: 'var(--accent)', color: '#fff' }
                : { border: '1px solid var(--border)', color: 'var(--text-muted)', background: 'var(--bg-raised)' }}>
              {item}
            </button>
          )
        )}
        <button onClick={() => onPage(page + 1)} disabled={page === total_pages}
          className="px-3 py-1.5 rounded-lg text-sm font-medium disabled:opacity-40"
          style={{ border: '1px solid var(--border)', color: 'var(--text-muted)', background: 'var(--bg-raised)' }}>
          Next ›
        </button>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function UserManagement() {
  const dispatch = useAppDispatch();
  const { hasPermission } = useAuth();

  const canView   = hasPermission(PERMISSIONS.USERS_VIEW);
  const canCreate = hasPermission(PERMISSIONS.USERS_CREATE);
  const canEdit   = hasPermission(PERMISSIONS.USERS_UPDATE);
  const canDelete = hasPermission(PERMISSIONS.USERS_DELETE);

  // ── Redux state ─────────────────────────────────────────────────────────
  const users            = useAppSelector(selectUsers);
  const meta             = useAppSelector(selectUsersMeta);
  const loading          = useAppSelector(selectUsersLoading);
  const error            = useAppSelector(selectUsersError);
  const filters          = useAppSelector(selectUsersFilters);
  const existingStaffIds = useAppSelector(selectExistingStaffIds);
  const roles            = useAppSelector(selectRoles);

  // Local professions (not stored in Redux yet — kept lightweight)
  const [professions, setProfessions] = useState([]);

  // ── Local modal state ────────────────────────────────────────────────────
  const [showCreate, setShowCreate]     = useState(false);
  const [editTarget, setEditTarget]     = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [localError, setLocalError]     = useState('');

  // ── Seed reference data once ─────────────────────────────────────────────
  useEffect(() => {
    if (roles.length === 0) dispatch(fetchRolesAndPermissions());
    ProfessionsService.list()
      .then((d) => setProfessions(Array.isArray(d) ? d : d.data ?? []))
      .catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Fetch users whenever page / roleTab change ───────────────────────────
  useEffect(() => {
    if (canView) dispatch(fetchUsers());
  }, [filters.page, filters.roleTab, canView]); // eslint-disable-line react-hooks/exhaustive-deps

  // Debounce search — resets to page 1 via setSearch action
  useEffect(() => {
    if (!canView) return;
    const t = setTimeout(() => dispatch(fetchUsers()), 400);
    return () => clearTimeout(t);
  }, [filters.search]); // eslint-disable-line react-hooks/exhaustive-deps

  const roleTabs = ['All', ...roles.map((r) => r.name)];

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleCreated = async (userData) => {
    const result = await dispatch(createUserThunk(userData));
    if (createUserThunk.fulfilled.match(result)) setShowCreate(false);
    else setLocalError(result.payload || 'Create failed.');
  };

  const handleUpdated = async (updatedUser) => {
    const result = await dispatch(updateUserThunk({ id: updatedUser.id, userData: updatedUser }));
    if (updateUserThunk.fulfilled.match(result)) setEditTarget(null);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    const result = await dispatch(deleteUserThunk(deleteTarget.id));
    if (deleteUserThunk.rejected.match(result)) setLocalError(result.payload || 'Delete failed.');
    setDeleteTarget(null);
  };

  // ── Access denied ─────────────────────────────────────────────────────────
  if (!canView) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <div className="text-4xl">🔒</div>
        <h2 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>Access Denied</h2>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          You don't have permission to view user management.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto min-h-screen" style={{ color: 'var(--text)' }}>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">User Management</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            Manage system users, roles, and access · {meta?.total ?? '…'} total
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button"
            onClick={() => { dispatch(clearUsersError()); dispatch(fetchUsers()); }}
            disabled={loading}
            className="p-2 rounded-xl transition-opacity disabled:opacity-50"
            style={{ border: '1px solid var(--border)', color: 'var(--text-muted)', background: 'var(--bg-raised)' }}
            title="Refresh">
            <ArrowPathIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          {canCreate && (
            <button type="button" onClick={() => setShowCreate(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity"
              style={{ background: 'var(--accent)', color: '#fff' }}>
              <PlusIcon className="h-4 w-4" /> Add User
            </button>
          )}
        </div>
      </div>

      {/* Error banner */}
      {(error || localError) && (
        <div className="mb-4 px-4 py-3 rounded-xl text-sm"
          style={{ background: 'color-mix(in srgb, var(--danger) 12%, transparent)', color: 'var(--danger)', border: '1px solid color-mix(in srgb, var(--danger) 25%, transparent)' }}>
          {error || localError}
        </div>
      )}

      {/* Role tabs */}
      <div className="flex flex-wrap gap-1.5 mb-5 overflow-x-auto" role="tablist">
        {roleTabs.map((tab) => (
          <button key={tab} type="button"
            onClick={() => dispatch(setRoleTab(tab))}
            role="tab" aria-selected={filters.roleTab === tab}
            className="px-3 py-1.5 rounded-full text-xs font-semibold border whitespace-nowrap transition-all"
            style={filters.roleTab === tab
              ? { background: 'var(--accent)', color: '#fff', borderColor: 'var(--accent)' }
              : { background: 'transparent', color: 'var(--text-muted)', borderColor: 'var(--border)' }}>
            {tab}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="mb-5">
        <div className="relative max-w-md">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4"
            style={{ color: 'var(--text-muted)' }} />
          <input type="text" placeholder="Search by name, email, or staff ID…"
            value={filters.search}
            onChange={(e) => dispatch(setSearch(e.target.value))}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text)' }}
          />
        </div>
      </div>

      {/* Table */}
      <div className="ui-card overflow-hidden p-0">
        {loading ? (
          <div className="py-16"><LoadingSpinner message="Loading users…" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-raised)' }}>
                  {['Staff ID', 'Name', 'Email', 'Role', 'Phone', 'Gender', 'Actions'].map((h) => (
                    <th key={h} className="ui-th text-left">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-16 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
                      No users found.{filters.search && ' Try a different search term.'}
                    </td>
                  </tr>
                ) : users.map((user) => {
                  const rColor   = roleColor(user.role?.name);
                  const fullName = [user.firstname, user.othername, user.lastname].filter(Boolean).join(' ');
                  return (
                    <tr key={user.id} className="ui-row">
                      <td className="ui-td font-mono text-xs font-bold" style={{ color: 'var(--accent)' }}>
                        {user.staff_id ?? '—'}
                      </td>
                      <td className="ui-td">
                        <p className="font-semibold text-sm">{fullName}</p>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>ID: {user.id}</p>
                      </td>
                      <td className="ui-td text-sm" style={{ color: 'var(--text-muted)' }}>{user.email}</td>
                      <td className="ui-td">
                        {user.role?.name ? (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold"
                            style={{ background: `color-mix(in srgb, ${rColor} 15%, transparent)`, color: rColor }}>
                            {user.role.name}
                          </span>
                        ) : <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>—</span>}
                      </td>
                      <td className="ui-td text-sm" style={{ color: 'var(--text-muted)' }}>{user.phone ?? '—'}</td>
                      <td className="ui-td text-sm capitalize" style={{ color: 'var(--text-muted)' }}>{user.gender ?? '—'}</td>
                      <td className="ui-td">
                        <ActionMenu
                          canEdit={canEdit} canDelete={canDelete}
                          onEdit={() => setEditTarget(user)}
                          onDelete={() => setDeleteTarget(user)}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <Pagination meta={meta} onPage={(p) => dispatch(setPage(p))} />
      </div>

      {/* Modals */}
      <CreateUserModal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={handleCreated}
        roles={roles}
        professions={professions}
        existingStaffIds={existingStaffIds}
      />

      <EditUserModal
        isOpen={Boolean(editTarget)}
        user={editTarget}
        onClose={() => setEditTarget(null)}
        onUpdated={handleUpdated}
        roles={roles}
        professions={professions}
      />

      <DeleteModal
        isOpen={Boolean(deleteTarget)}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        message={
          deleteTarget
            ? `Delete "${deleteTarget.firstname} ${deleteTarget.lastname}" (${deleteTarget.staff_id})? This cannot be undone.`
            : undefined
        }
      />
    </div>
  );
}
