/**
 * UserDashboard.js — User Administration overview page.
 *
 * Shows:
 *  - Summary stats: total users, total roles
 *  - Users per role breakdown (derived from a batch API call)
 *  - Navigation cards: to the full user list and to roles management
 */
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UsersIcon,
  ShieldCheckIcon,
  ArrowRightIcon,
  UserPlusIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import useAuth from '../../hooks/useAuth';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  fetchRolesAndPermissions,
  selectRoles,
  selectRolesLoading,
} from '../../store/slices/rolesSlice';
import UsersService from '../../services/users.service';
import LoadingSpinner from '../feedback/LoadingSpinner';
import { PERMISSIONS } from '../../utils/constants';

// ── Colour helpers ────────────────────────────────────────────────────────────
const ROLE_PALETTE = [
  '#a371f7', '#58a6ff', '#3fb950', '#f0883e',
  '#f85149', '#d29922', '#39d353', '#79c0ff',
];
function roleColor(name = '') {
  const idx = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % ROLE_PALETTE.length;
  return ROLE_PALETTE[idx];
}

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, accent, sub, loading }) {
  return (
    <div className="ui-stat" style={{ padding: '1.25rem 1.5rem' }}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div
          className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{ background: `color-mix(in srgb, ${accent} 15%, transparent)` }}
        >
          <Icon className="h-5 w-5" style={{ color: accent }} />
        </div>
        <div className="h-1.5 w-12 rounded-full mt-3" style={{ background: `color-mix(in srgb, ${accent} 35%, transparent)` }} />
      </div>
      {loading ? (
        <div className="h-9 w-16 rounded-lg animate-pulse mb-1" style={{ background: 'var(--bg-raised)' }} />
      ) : (
        <p className="text-4xl font-black tabular-nums" style={{ color: 'var(--text)', letterSpacing: '-0.03em' }}>
          {value ?? 0}
        </p>
      )}
      <p className="text-[11px] font-semibold uppercase tracking-widest mt-1" style={{ color: 'var(--text-muted)' }}>
        {label}
      </p>
      {sub && !loading && (
        <p className="text-xs mt-1.5" style={{ color: 'var(--text-muted)' }}>{sub}</p>
      )}
    </div>
  );
}

// ── Role bar ──────────────────────────────────────────────────────────────────
function RoleBar({ name, count, total, onNavigate }) {
  const color = roleColor(name);
  const pct   = total > 0 ? Math.round((count / total) * 100) : 0;

  return (
    <button
      type="button"
      className="w-full group flex items-center gap-4 px-6 py-3.5 transition-colors text-left"
      style={{ borderBottom: '1px solid var(--border)' }}
      onClick={onNavigate}
    >
      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
      <p className="text-sm font-semibold w-[160px] truncate" style={{ color: 'var(--text)' }}>{name}</p>
      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-raised)' }}>
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      <span className="text-sm font-bold w-8 text-right tabular-nums" style={{ color: 'var(--text)' }}>{count}</span>
      <span className="text-xs w-10 text-right" style={{ color: 'var(--text-muted)' }}>{pct}%</span>
      <ArrowRightIcon
        className="h-4 w-4 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-all duration-200 group-hover:translate-x-0.5"
        style={{ color: 'var(--accent)' }}
      />
    </button>
  );
}

// ── Feature tile ──────────────────────────────────────────────────────────────
function FeatureTile({ icon: Icon, accentColor, title, description, badge, cta, onClick, disabled }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="group relative text-left overflow-hidden w-full"
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: '1rem',
        padding: '1.5rem',
        boxShadow: 'var(--shadow)',
        transition: 'transform 0.25s ease, box-shadow 0.25s ease',
        opacity: disabled ? 0.45 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
      onMouseEnter={(e) => { if (!disabled) { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = 'var(--shadow-lg)'; } }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = 'var(--shadow)'; }}
    >
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{ background: `linear-gradient(135deg, color-mix(in srgb, ${accentColor} 7%, transparent) 0%, transparent 55%)` }}
      />
      <div className="relative flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center"
            style={{ background: `color-mix(in srgb, ${accentColor} 15%, transparent)` }}
          >
            <Icon className="h-6 w-6" style={{ color: accentColor }} />
          </div>
          {badge && (
            <span
              className="text-[11px] font-bold px-2.5 py-1 rounded-full"
              style={{ background: `color-mix(in srgb, ${accentColor} 12%, transparent)`, color: accentColor }}
            >
              {badge}
            </span>
          )}
        </div>
        <div>
          <h3 className="font-bold text-base mb-1" style={{ color: 'var(--text)' }}>{title}</h3>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>{description}</p>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-bold" style={{ color: accentColor }}>
          {cta}
          <ArrowRightIcon className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1" />
        </div>
      </div>
    </button>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function UserDashboard() {
  const dispatch   = useAppDispatch();
  const navigate   = useNavigate();
  const { hasPermission } = useAuth();

  const roles        = useAppSelector(selectRoles);
  const rolesLoading = useAppSelector(selectRolesLoading);

  const canViewUsers = hasPermission(PERMISSIONS.USERS_INDEX);
  const canViewRoles = hasPermission(PERMISSIONS.ROLES_INDEX);
  const canCreateUser = hasPermission(PERMISSIONS.USERS_CREATE);

  const [userStats, setUserStats]   = useState({ total: 0, byRole: {} });
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError]   = useState(null);

  // Load roles so we get the complete role list (even roles with 0 users in batch)
  useEffect(() => {
    dispatch(fetchRolesAndPermissions());
  }, [dispatch]);

  // Fetch a batch of users and derive role distribution
  useEffect(() => {
    if (!canViewUsers) return;
    setStatsLoading(true);
    setStatsError(null);
    UsersService.list({ per_page: 100, page: 1 })
      .then((res) => {
        const users = Array.isArray(res) ? res : (res.data ?? []);
        const total = res.meta?.total ?? users.length;
        const byRole = {};
        users.forEach((u) => {
          const name = u.role?.name ?? 'Unassigned';
          byRole[name] = (byRole[name] ?? 0) + 1;
        });
        setUserStats({ total, byRole });
      })
      .catch(() => setStatsError('Could not load user statistics.'))
      .finally(() => setStatsLoading(false));
  }, [canViewUsers]);

  // Build ordered rows: roles from API first (preserves known role names), then any extras
  const roleRows = React.useMemo(() => {
    const known = roles.map((r) => ({
      name:  r.name,
      count: userStats.byRole[r.name] ?? 0,
    }));
    // Any names in byRole not covered by known roles (e.g. 'Unassigned')
    const knownNames = new Set(roles.map((r) => r.name));
    const extras = Object.entries(userStats.byRole)
      .filter(([name]) => !knownNames.has(name))
      .map(([name, count]) => ({ name, count }));
    return [...known, ...extras].sort((a, b) => b.count - a.count);
  }, [roles, userStats.byRole]);

  const loading = rolesLoading || statsLoading;

  return (
    <div className="min-h-screen" style={{ color: 'var(--text)' }}>

      {/* ── Hero banner ── */}
      <div
        className="relative overflow-hidden px-6 md:px-10 pt-10 pb-9"
        style={{
          background: 'linear-gradient(135deg, color-mix(in srgb, var(--accent) 13%, var(--bg)) 0%, var(--bg) 65%)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div
          className="absolute -top-24 -right-24 w-80 h-80 rounded-full pointer-events-none"
          style={{ background: 'var(--accent)', opacity: '0.045' }}
        />
        <div className="relative max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div>
            <p className="ui-section text-[11px] mb-2">People &amp; Access</p>
            <h1 className="text-3xl font-black tracking-tight gradient-text mb-2 leading-tight">
              User Administration
            </h1>
            <p className="text-[15px] max-w-lg" style={{ color: 'var(--text-muted)' }}>
              Manage user accounts, define roles, and control access across your organisation.
            </p>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <button
              type="button"
              disabled={loading}
              onClick={() => dispatch(fetchRolesAndPermissions())}
              className="p-2.5 rounded-xl transition-all disabled:opacity-40 hover:opacity-80"
              style={{ border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-muted)' }}
              title="Refresh"
            >
              <ArrowPathIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            {canCreateUser && canViewUsers && (
              <button
                type="button"
                onClick={() => navigate('/user-management/users')}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all hover:opacity-90"
                style={{
                  background: 'var(--accent)',
                  color: '#fff',
                  boxShadow: '0 4px 14px color-mix(in srgb, var(--accent) 38%, transparent)',
                }}
              >
                <UserPlusIcon className="h-4 w-4" /> Add User
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Page body ── */}
      <div className="max-w-7xl mx-auto px-6 md:px-10 py-7">

        {/* Stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-7" style={{ animation: 'slideUp .3s ease' }}>
          <StatCard
            icon={UsersIcon}
            label="Total Users"
            value={userStats.total}
            accent="var(--accent)"
            sub="registered accounts"
            loading={statsLoading}
          />
          <StatCard
            icon={ShieldCheckIcon}
            label="Roles Defined"
            value={roles.length}
            accent="#3fb950"
            sub="access categories"
            loading={rolesLoading}
          />
          <StatCard
            icon={ExclamationTriangleIcon}
            label="Unassigned"
            value={userStats.byRole['Unassigned'] ?? 0}
            accent="var(--warning)"
            sub="no role assigned"
            loading={statsLoading}
          />
        </div>

        {/* Distribution + Feature tiles */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

          {/* Distribution — 3 cols */}
          <div className="lg:col-span-3 ui-card overflow-hidden p-0" style={{ animation: 'slideUp .38s ease' }}>
            <div
              className="flex items-center justify-between px-6 py-5"
              style={{ borderBottom: '1px solid var(--border)' }}
            >
              <div>
                <h2 className="font-bold text-base" style={{ color: 'var(--text)' }}>Users by Role</h2>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  Click any row to view filtered list
                </p>
              </div>
              {canViewUsers && (
                <button
                  type="button"
                  onClick={() => navigate('/user-management/users')}
                  className="text-xs font-bold flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all hover:opacity-80"
                  style={{ color: 'var(--accent)', background: 'color-mix(in srgb, var(--accent) 10%, transparent)' }}
                >
                  See all <ArrowRightIcon className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {statsError && (
              <div
                className="flex items-center gap-2 mx-5 my-4 px-4 py-3 rounded-xl text-sm"
                style={{ background: 'color-mix(in srgb, var(--danger) 10%, transparent)', color: 'var(--danger)' }}
              >
                <ExclamationTriangleIcon className="h-4 w-4 flex-shrink-0" />
                {statsError}
              </div>
            )}

            {loading ? (
              <div className="py-12"><LoadingSpinner message="Loading…" /></div>
            ) : roleRows.length === 0 ? (
              <p className="py-12 text-center text-sm" style={{ color: 'var(--text-muted)' }}>No roles found.</p>
            ) : (
              <div>
                {roleRows.map((row) => (
                  <RoleBar
                    key={row.name}
                    name={row.name}
                    count={row.count}
                    total={userStats.total}
                    onNavigate={() => navigate('/user-management/users', { state: { roleTab: row.name } })}
                  />
                ))}
              </div>
            )}

            {!loading && userStats.total > 100 && (
              <p
                className="px-6 py-3 text-xs"
                style={{ color: 'var(--text-muted)', borderTop: '1px solid var(--border)' }}
              >
                Distribution based on first 100 users. View the full list for precise figures.
              </p>
            )}
          </div>

          {/* Feature tiles — 2 cols */}
          <div className="lg:col-span-2 flex flex-col gap-4" style={{ animation: 'slideUp .45s ease' }}>
            <FeatureTile
              icon={UsersIcon}
              accentColor="var(--accent)"
              title="User List"
              description="Browse, search, create, and manage all user accounts, including role assignments."
              cta="Manage users"
              badge={canViewUsers && userStats.total > 0 ? `${userStats.total} users` : undefined}
              disabled={!canViewUsers}
              onClick={() => navigate('/user-management/users')}
            />
            <FeatureTile
              icon={ShieldCheckIcon}
              accentColor="#3fb950"
              title="Roles & Permissions"
              description="Create roles, assign permission sets, and control what each role can access."
              cta="Configure access"
              badge={roles.length > 0 ? `${roles.length} roles` : undefined}
              disabled={!canViewRoles}
              onClick={() => navigate('/roles')}
            />
          </div>

        </div>
      </div>
    </div>
  );
}
