import React from "react";
import { ResponsiveMenu } from "./Home/ResponsiveMenu";
import { HomeMenu } from "../mockData/data";
import { Link } from "react-router-dom";
import { Button } from "./ui/Button";
import { FaSun, FaMoon } from "react-icons/fa";
import { useTheme } from "../context/ThemeContext";

export function PublicLayout({ children }) {
  const [open, setOpen] = React.useState(false);
  const { darkMode, setDarkMode } = useTheme();

  return (
    <>
      {/* ── Sticky Header ── */}
      <header
        style={{
          background:   'var(--bg-surface)',
          borderBottom: '1px solid var(--border)',
        }}
        className="sticky top-0 z-50 w-full backdrop-blur supports-[backdrop-filter]:bg-transparent"
      >
        <div className="max-w-7xl mx-auto flex justify-between items-center py-4 px-5">
          {/* Logo */}
          <Link
            to="/"
            style={{ color: 'var(--accent)' }}
            className="text-xl font-black uppercase tracking-tight"
          >
            ComplianceHub
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:block">
            <ul className="flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
              {HomeMenu.map((item) => (
                <li key={item.id}>
                  <a
                    href={item.link}
                    style={{ color: 'var(--text-muted)' }}
                    className="inline-block py-1.5 px-3 rounded-lg text-sm font-medium hover:bg-[color:var(--bg-raised)] hover:text-[color:var(--text)] transition-colors"
                  >
                    {item.title}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          {/* Actions */}
          <div className="hidden md:flex items-center gap-2">
            {/* Theme toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              style={{ color: 'var(--text-muted)', background: 'var(--bg-raised)', border: '1px solid var(--border)' }}
              className="w-9 h-9 flex items-center justify-center rounded-xl hover:opacity-80 transition-opacity"
              title={darkMode ? 'Light Mode' : 'Dark Mode'}
            >
              {darkMode ? <FaSun size={14} className="text-yellow-400" /> : <FaMoon size={14} className="text-blue-500" />}
            </button>
            <Link to="/Login"><Button variant="outline" size="sm">Login</Button></Link>
            <Link to="/signin"><Button size="sm">Get Started</Button></Link>
          </div>

          {/* Mobile toggle */}
          <button
            className="md:hidden text-2xl"
            style={{ color: 'var(--text)' }}
            onClick={() => setOpen(!open)}
            aria-label="Menu"
          >
            &#9776;
          </button>
        </div>

        <ResponsiveMenu open={open} />
      </header>

      {/* Page Content */}
      <main className="max-w-6xl mx-auto px-4 md:px-6 py-8">
        {children}
      </main>
    </>
  );
}
