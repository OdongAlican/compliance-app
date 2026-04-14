import React from 'react';
import {
  FaHome,
  FaClipboard,
  FaExclamationTriangle,
  FaBell,
  FaCheckCircle,
  FaUsers,
  FaCogs,
  FaChartBar,
  FaSignOutAlt,
  FaChevronRight,
  FaChevronLeft,
  FaSun,
  FaMoon,
  FaUserCog,
  FaShieldAlt,
} from 'react-icons/fa';
import { MdOutlineDashboard } from 'react-icons/md';
import { NavLink, useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import useAuth from '../../hooks/useAuth';

const NAV_SECTIONS = [
  {
    label: 'Menu',
    items: [
      { to: '/dashboard',          icon: FaHome,               label: 'Home' },
      { to: '/inspection',         icon: FaClipboard,          label: 'Inspection' },
      { to: '/hazard/report',      icon: FaExclamationTriangle, label: 'Hazard & Risk' },
      { to: '/incident-management',icon: FaBell,               label: 'Incidents' },
      { to: '/health-and-safety',  icon: FaCheckCircle,        label: 'Health & Safety' },
    ],
  },
  {
    label: 'Management',
    items: [
      { to: '/user-management', icon: FaUsers,    label: 'Users' },
      { to: '/roles',           icon: FaShieldAlt, label: 'Roles & Permissions' },
    ],
  },
  {
    label: 'Others',
    items: [
      { to: '/capa',      icon: FaCogs,     label: 'CAPA' },
      { to: '/analytics', icon: FaChartBar, label: 'Analytics' },
    ],
  },
  {
    label: 'Account',
    items: [
      { to: '/profile', icon: FaUserCog, label: 'Profile & Settings' },
    ],
  },
];

// ── Helpers ──────────────────────────────────────────────────────────────────
function getInitials(user) {
  return [user?.firstname?.[0], user?.lastname?.[0]]
    .filter(Boolean)
    .join('')
    .toUpperCase() || '?';
}

export const Sidebar = ({ sidebarToggle, setSidebarToggle, isMinimized, setIsMinimized }) => {
  const { darkMode, setDarkMode } = useTheme();
  const { user, logout }          = useAuth();
  const navigate                  = useNavigate();

  const initials  = getInitials(user);
  const fullName  = [user?.firstname, user?.lastname].filter(Boolean).join(' ') || user?.email || 'User';
  const roleName  = user?.role?.name || '';

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <>
      {/* Mobile backdrop */}
      {sidebarToggle && (
        <div
          className="md:hidden fixed inset-0 z-30 bg-black/60 backdrop-blur-sm"
          onClick={() => setSidebarToggle(false)}
        />
      )}

      <aside
        style={{
          background: 'var(--bg-surface)',
          borderRight: '1px solid var(--border)',
        }}
        className={`
          fixed inset-y-0 left-0 z-40
          flex flex-col
          transition-all duration-300 ease-in-out
          ${sidebarToggle ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0
          ${isMinimized ? 'w-[72px]' : 'w-64'}
          overflow-hidden
        `}
        style={{
          background: 'var(--bg-surface)',
          borderRight: '1px solid var(--border)',
          boxShadow: '4px 0 24px rgba(0,0,0,.06)',
        }}
      >
        {/* ── Logo / Header ── */}
        <div
          style={{ borderBottom: '1px solid var(--border)' }}
          className="flex items-center justify-between px-3 py-4 shrink-0 h-16"
        >
          {!isMinimized ? (
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                style={{
                  background: 'linear-gradient(135deg, var(--accent), #7c3aed)',
                  boxShadow: '0 0 14px color-mix(in srgb, var(--accent) 40%, transparent)',
                }}
              >
                <MdOutlineDashboard size={18} className="text-white" />
              </div>
              <div className="min-w-0">
                <p style={{ color: 'var(--text)' }} className="font-black text-sm truncate leading-tight">ComplianceHub</p>
                <p style={{ color: 'var(--text-muted)' }} className="text-[10px] truncate">Admin Portal</p>
              </div>
            </div>
          ) : (
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center mx-auto"
              style={{ background: 'linear-gradient(135deg, var(--accent), #7c3aed)' }}
            >
              <MdOutlineDashboard size={18} className="text-white" />
            </div>
          )}

          <button
            onClick={() => setIsMinimized(!isMinimized)}
            style={{ color: 'var(--text-muted)', background: 'var(--bg-raised)' }}
            className="hidden md:flex items-center justify-center w-6 h-6 rounded-lg hover:opacity-80 transition-opacity shrink-0 ml-1"
            title={isMinimized ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isMinimized ? <FaChevronRight size={9} /> : <FaChevronLeft size={9} />}
          </button>
        </div>

        {/* ── Navigation ── */}
        <nav className="flex-1 overflow-y-auto py-3 px-2.5 space-y-4">
          {NAV_SECTIONS.map((section) => (
            <div key={section.label}>
              {!isMinimized && (
                <p
                  style={{ color: 'var(--text-muted)' }}
                  className="text-[9px] font-black uppercase tracking-[0.12em] px-2.5 mb-1 mt-1"
                >
                  {section.label}
                </p>
              )}
              {isMinimized && (
                <div
                  className="mx-auto mb-1 mt-1"
                  style={{ height: '1px', background: 'var(--border)', width: '60%' }}
                />
              )}
              <ul className="space-y-0.5">
                {section.items.map((item) => (
                  <SidebarItem
                    key={item.to}
                    to={item.to}
                    icon={item.icon}
                    label={item.label}
                    minimized={isMinimized}
                    onNavigate={() => setSidebarToggle(false)}
                  />
                ))}
              </ul>
            </div>
          ))}
        </nav>

        {/* ── Bottom actions ── */}
        <div style={{ borderTop: '1px solid var(--border)' }} className="shrink-0 p-2.5 space-y-1.5">
          {/* Dark / light toggle */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            style={{ color: 'var(--text-muted)' }}
            className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150 hover:bg-[color:var(--bg-raised)] hover:opacity-90 ${isMinimized ? 'justify-center' : ''}`}
            title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {darkMode
              ? <FaSun  size={14} className="text-yellow-400 shrink-0" />
              : <FaMoon size={14} className="text-blue-500  shrink-0" />}
            {!isMinimized && (
              <span style={{ color: 'var(--text)' }} className="text-sm">
                {darkMode ? 'Light Mode' : 'Dark Mode'}
              </span>
            )}
          </button>

          {/* Profile card */}
          {!isMinimized ? (
            <div
              className="flex items-center justify-between gap-2 rounded-xl px-3 py-3 cursor-pointer group transition-all"
              style={{ background: 'var(--bg-raised)', border: '1px solid var(--border)' }}
              onClick={() => { navigate('/profile'); setSidebarToggle(false); }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && navigate('/profile')}
              title="View profile"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                {/* Avatar */}
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-black shrink-0 transition-transform group-hover:scale-105"
                  style={{ background: 'linear-gradient(135deg, var(--accent), #7c3aed)' }}
                >
                  {initials}
                </div>
                <div className="min-w-0">
                  <p style={{ color: 'var(--text)' }} className="text-xs font-bold truncate leading-snug">
                    {fullName}
                  </p>
                  {roleName && (
                    <p style={{ color: 'var(--text-muted)' }} className="text-[10px] truncate leading-snug">
                      {roleName}
                    </p>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); handleLogout(); }}
                className="p-1.5 rounded-lg flex-shrink-0 transition-all hover:opacity-70"
                style={{ color: 'var(--text-muted)' }}
                title="Sign out"
              >
                <FaSignOutAlt size={13} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleLogout}
              style={{ color: 'var(--text-muted)', background: 'var(--bg-raised)' }}
              className="w-full flex justify-center p-2.5 rounded-xl hover:opacity-80 transition-opacity"
              title="Sign out"
            >
              <FaSignOutAlt size={14} />
            </button>
          )}
        </div>
      </aside>
    </>
  );
};

/* ── SidebarItem ── */
const SidebarItem = ({ to, icon: Icon, label, minimized, onNavigate }) => (
  <li>
    <NavLink
      to={to}
      end={to === '/dashboard'}
      title={minimized ? label : undefined}
      onClick={onNavigate}
      className={({ isActive }) => `
        relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm
        transition-all duration-150 cursor-pointer select-none
        ${minimized ? 'justify-center' : ''}
        ${isActive
          ? 'font-semibold'
          : 'font-medium hover:bg-[color:var(--bg-raised)]'}
      `}
      style={({ isActive }) => isActive
        ? {
          background: 'color-mix(in srgb, var(--accent) 13%, transparent)',
          color: 'var(--accent)',
        }
        : { color: 'var(--text-muted)' }
      }
    >
      {({ isActive }) => (
        <>
          <span className="shrink-0 flex items-center">
            <Icon size={14} />
          </span>
          {!minimized && (
            <span className="truncate flex-1" style={{ color: isActive ? 'var(--accent)' : 'var(--text)' }}>
              {label}
            </span>
          )}
          {isActive && !minimized && (
            <span
              className="ml-auto w-1.5 h-1.5 rounded-full shrink-0"
              style={{ background: 'var(--accent)' }}
            />
          )}
        </>
      )}
    </NavLink>
  </li>
);

export default Sidebar;
