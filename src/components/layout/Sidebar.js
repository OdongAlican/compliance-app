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
} from 'react-icons/fa';
import { MdOutlineDashboard } from 'react-icons/md';
import { NavLink } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';

const NAV_SECTIONS = [
  {
    label: 'Menu',
    items: [
      { to: '/', icon: FaHome, label: 'Home' },
      { to: '/inspection', icon: FaClipboard, label: 'Inspection' },
      { to: '/hazard/report', icon: FaExclamationTriangle, label: 'Hazard & Risk' },
      { to: '/incident-management', icon: FaBell, label: 'Incidents' },
      { to: '/health-and-safety', icon: FaCheckCircle, label: 'Health & Safety' },
    ],
  },
  {
    label: 'Management',
    items: [
      { to: '/user-management', icon: FaUsers, label: 'Users' },
    ],
  },
  {
    label: 'Others',
    items: [
      { to: '/capa', icon: FaCogs, label: 'CAPA' },
      { to: '/analytics', icon: FaChartBar, label: 'Analytics' },
    ],
  },
];

export const Sidebar = ({ sidebarToggle, setSidebarToggle, isMinimized, setIsMinimized }) => {
  const { darkMode, setDarkMode } = useTheme();

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
          overflow-hidden shadow-[var(--shadow-md)]
        `}
      >
        {/* ── Logo / Header ── */}
        <div
          style={{ borderBottom: '1px solid var(--border)' }}
          className="flex items-center justify-between px-3 py-4 shrink-0 h-16"
        >
          {!isMinimized ? (
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <div
                style={{ background: 'linear-gradient(135deg, var(--accent), #7c3aed)' }}
                className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-[0_0_14px_color-mix(in_srgb,var(--accent)_35%,transparent)]"
              >
                <MdOutlineDashboard size={18} className="text-white" />
              </div>
              <div className="min-w-0">
                <p style={{ color: 'var(--text)' }} className="font-bold text-sm truncate leading-tight">ComplianceHub</p>
                <p style={{ color: 'var(--text-muted)' }} className="text-[10px] truncate">Admin Portal</p>
              </div>
            </div>
          ) : (
            <div
              style={{ background: 'linear-gradient(135deg, var(--accent), #7c3aed)' }}
              className="w-8 h-8 rounded-xl flex items-center justify-center mx-auto"
            >
              <MdOutlineDashboard size={18} className="text-white" />
            </div>
          )}

          <button
            onClick={() => setIsMinimized(!isMinimized)}
            style={{ color: 'var(--text-muted)', background: 'var(--bg-raised)' }}
            className="hidden md:flex items-center justify-center w-6 h-6 rounded-lg hover:opacity-80 transition-opacity shrink-0 ml-1"
            title={isMinimized ? 'Expand' : 'Collapse'}
          >
            {isMinimized ? <FaChevronRight size={10} /> : <FaChevronLeft size={10} />}
          </button>
        </div>

        {/* ── Navigation ── */}
        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-5">
          {NAV_SECTIONS.map((section) => (
            <div key={section.label}>
              {!isMinimized && (
                <p
                  style={{ color: 'var(--text-muted)' }}
                  className="text-[10px] font-semibold uppercase tracking-widest px-2 mb-1.5"
                >
                  {section.label}
                </p>
              )}
              <ul className="space-y-0.5">
                {section.items.map((item) => (
                  <SidebarItem
                    key={item.to}
                    to={item.to}
                    icon={item.icon}
                    label={item.label}
                    minimized={isMinimized}
                  />
                ))}
              </ul>
            </div>
          ))}
        </nav>

        {/* ── Bottom actions ── */}
        <div style={{ borderTop: '1px solid var(--border)' }} className="shrink-0 p-2 space-y-1.5">
          {/* Dark / light toggle */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            style={{ background: 'var(--bg-raised)', color: 'var(--text-muted)' }}
            className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium hover:opacity-80 transition-all duration-150 ${isMinimized ? 'justify-center' : ''}`}
            title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {darkMode
              ? <FaSun size={14} className="text-yellow-400 shrink-0" />
              : <FaMoon size={14} className="text-blue-500 shrink-0" />
            }
            {!isMinimized && <span style={{ color: 'var(--text)' }}>{darkMode ? 'Light Mode' : 'Dark Mode'}</span>}
          </button>

          {/* Profile */}
          {!isMinimized ? (
            <div
              style={{ background: 'var(--bg-raised)', border: '1px solid var(--border)' }}
              className="flex items-center justify-between gap-2 rounded-xl px-3 py-2.5"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  style={{ background: 'linear-gradient(135deg, var(--accent), #7c3aed)' }}
                  className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0"
                >
                  PA
                </div>
                <div className="min-w-0">
                  <p style={{ color: 'var(--text)' }} className="text-xs font-semibold truncate">Paul Amegah</p>
                  <p style={{ color: 'var(--text-muted)' }} className="text-[10px] truncate">Admin</p>
                </div>
              </div>
              <button style={{ color: 'var(--text-muted)' }} className="hover:opacity-70 transition-opacity shrink-0" title="Sign out">
                <FaSignOutAlt size={13} />
              </button>
            </div>
          ) : (
            <button
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
const SidebarItem = ({ to, icon: Icon, label, minimized }) => (
  <li>
    <NavLink
      to={to}
      title={minimized ? label : ''}
      style={({ isActive }) =>
        isActive
          ? {
            background: 'color-mix(in srgb, var(--accent) 15%, transparent)',
            color: 'var(--accent)',
            borderLeft: '2px solid var(--accent)',
            paddingLeft: minimized ? undefined : 'calc(0.75rem - 2px)',
          }
          : { color: 'var(--text-muted)' }
      }
      className={({ isActive }) => `
        flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium
        transition-all duration-150 cursor-pointer select-none
        ${minimized ? 'justify-center' : ''}
        ${!isActive ? 'hover:bg-[color:var(--bg-raised)] hover:text-[color:var(--text)]' : ''}
      `}
    >
      {({ isActive }) => (
        <>
          <Icon size={15} className="shrink-0" />
          {!minimized && <span>{label}</span>}
        </>
      )}
    </NavLink>
  </li>
);

export default Sidebar;
