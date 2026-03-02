import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { FaBars, FaBell, FaSearch } from 'react-icons/fa';
import { useLocation } from 'react-router-dom';

const PAGE_TITLES = {
  '/':                    'Home',
  '/dashboard':           'Dashboard',
  '/inspection':          'Inspection',
  '/hazard/report':       'Hazard & Risk Management',
  '/incident-management': 'Incident Management',
  '/health-and-safety':   'Health & Safety Audit',
  '/user-management':     'User Management',
  '/capa':                'CAPA',
  '/analytics':           'Analytics',
};

export function Layout({ children, sidebarToggle, setSidebarToggle }) {
  const [isMinimized, setIsMinimized] = useState(false);
  const location = useLocation();
  const title = PAGE_TITLES[location.pathname] || 'Dashboard';

  return (
    <div className="flex min-h-screen relative" style={{ background: 'var(--bg)' }}>
      {/* Sidebar */}
      <Sidebar
        sidebarToggle={sidebarToggle}
        setSidebarToggle={setSidebarToggle}
        isMinimized={isMinimized}
        setIsMinimized={setIsMinimized}
      />

      {/* Content area */}
      <div
        className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${isMinimized ? 'md:ml-[72px]' : 'md:ml-64'}`}
      >
        {/* ── Top Header ── */}
        <header
          style={{
            background:   'var(--bg-surface)',
            borderBottom: '1px solid var(--border)',
          }}
          className="sticky top-0 z-20 h-16 flex items-center justify-between px-4 md:px-6 gap-4 shrink-0"
        >
          {/* Left: mobile toggle + page title */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarToggle(!sidebarToggle)}
              style={{ color: 'var(--text-muted)', background: 'var(--bg-raised)' }}
              className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg hover:opacity-80 transition-opacity"
              aria-label="Toggle sidebar"
            >
              <FaBars size={16} />
            </button>
            <div>
              <h1 style={{ color: 'var(--text)' }} className="font-bold text-base md:text-lg leading-tight">{title}</h1>
            </div>
          </div>

          {/* Right: search + notifications */}
          <div className="flex items-center gap-2">
            {/* Search bar (desktop) */}
            <div
              style={{ background: 'var(--bg-raised)', border: '1px solid var(--border)' }}
              className="hidden md:flex items-center gap-2 rounded-xl px-3 py-2 w-52"
            >
              <FaSearch size={13} style={{ color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search..."
                style={{ background: 'transparent', color: 'var(--text)', outline: 'none' }}
                className="text-sm flex-1 min-w-0 placeholder:text-[color:var(--text-muted)]"
              />
            </div>

            {/* Notifications */}
            <button
              style={{ color: 'var(--text-muted)', background: 'var(--bg-raised)', border: '1px solid var(--border)' }}
              className="relative w-9 h-9 flex items-center justify-center rounded-xl hover:opacity-80 transition-opacity"
              title="Notifications"
            >
              <FaBell size={15} />
              <span
                style={{ background: 'var(--danger)' }}
                className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
              />
            </button>
          </div>
        </header>

        {/* ── Main content ── */}
        <main className="flex-1 px-4 md:px-6 py-6 overflow-auto">
          <div className="max-w-6xl mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
