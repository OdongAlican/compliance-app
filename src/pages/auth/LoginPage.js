import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FaEnvelope, FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';
import useAuth from '../../hooks/useAuth';

const inputWrap = {
  display: 'flex', alignItems: 'center', gap: '10px',
  border: '1px solid var(--border)', borderRadius: '9999px',
  padding: '10px 18px', background: 'var(--bg-raised)',
};
const inputStyle = {
  flex: 1, background: 'transparent', outline: 'none',
  color: 'var(--text)', fontSize: '14px',
};

export default function LogIn() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  // Redirect back to the page the user tried to visit, or /dashboard
  const from = location.state?.from?.pathname ?? '/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim())    return setError('Email is required.');
    if (!password)        return setError('Password is required.');

    setLoading(true);
    try {
      await login(email.trim(), password);
      navigate(from, { replace: true });
    } catch (err) {
      // Normalise error message from API { error: "Invalid email or password" }
      const msg =
        err?.response?.data?.error ||
        err?.message ||
        'Login failed. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--bg)' }}>
      <div className="w-full max-w-md rounded-2xl p-8"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-lg)' }}>

        {/* Tabs */}
        <div className="flex gap-6 justify-center mb-8">
          <Link to="/signin" className="text-sm font-medium cursor-pointer pb-1"
            style={{ color: 'var(--text-muted)', borderBottom: '2px solid transparent' }}>
            Register
          </Link>
          <span className="text-sm font-semibold cursor-pointer pb-1"
            style={{ color: 'var(--accent)', borderBottom: '2px solid var(--accent)' }}>
            Log In
          </span>
        </div>

        {/* Icon + headline */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 mx-auto rounded-2xl flex items-center justify-center text-2xl mb-3"
            style={{ background: 'color-mix(in srgb, var(--accent) 15%, transparent)' }}>
            🔰
          </div>
          <h2 className="text-xl font-bold mb-1" style={{ color: 'var(--text)' }}>Welcome back</h2>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Sign in to your compliance account</p>
        </div>

        {/* Error banner */}
        {error && (
          <div className="mb-5 px-4 py-3 rounded-xl text-sm font-medium"
            style={{ background: 'color-mix(in srgb, var(--danger) 12%, transparent)', color: 'var(--danger)', border: '1px solid color-mix(in srgb, var(--danger) 30%, transparent)' }}>
            {error}
          </div>
        )}

        {/* Form */}
        <form className="space-y-4" onSubmit={handleSubmit} noValidate>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
              Email Address
            </label>
            <div style={inputWrap}>
              <FaEnvelope style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
              <input
                type="email"
                placeholder="john@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                style={inputStyle}
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
              Password
            </label>
            <div style={inputWrap}>
              <FaLock style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
              <input
                type={showPw ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                style={inputStyle}
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPw((s) => !s)}
                style={{ color: 'var(--text-muted)', flexShrink: 0 }}
                tabIndex={-1}
                aria-label={showPw ? 'Hide password' : 'Show password'}
              >
                {showPw ? <FaEyeSlash size={14} /> : <FaEye size={14} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-full font-semibold text-sm transition-all mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
            style={{ background: 'var(--accent)', color: '#fff' }}
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <p className="text-xs text-center mt-6" style={{ color: 'var(--text-muted)' }}>
          Don&apos;t have an account?{' '}
          <Link to="/signin" className="font-medium" style={{ color: 'var(--accent)' }}>
            Contact your administrator
          </Link>
        </p>
      </div>
    </div>
  );
}

