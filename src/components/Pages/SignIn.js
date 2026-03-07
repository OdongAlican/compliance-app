import { Link } from 'react-router-dom';
import { FcGoogle } from 'react-icons/fc';
import { FaEnvelope, FaLock, FaUser } from 'react-icons/fa';

const inputWrap = {
  display: 'flex', alignItems: 'center', gap: '10px',
  border: '1px solid var(--border)', borderRadius: '9999px',
  padding: '10px 18px', background: 'var(--bg-raised)',
};
const inputStyle = { flex: 1, background: 'transparent', outline: 'none', color: 'var(--text)', fontSize: '14px' };

export default function SignIn() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--bg)' }}>
      <div className="w-full max-w-md rounded-2xl p-8"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-lg)' }}>
        {/* Tabs */}
        <div className="flex gap-6 justify-center mb-8">
          <span className="text-sm font-semibold cursor-pointer pb-1"
            style={{ color: 'var(--accent)', borderBottom: '2px solid var(--accent)' }}>Register</span>
          <Link to="/login" className="text-sm font-medium cursor-pointer pb-1"
            style={{ color: 'var(--text-muted)', borderBottom: '2px solid transparent' }}>Log In</Link>
        </div>
        {/* Icon */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 mx-auto rounded-2xl flex items-center justify-center text-2xl mb-3"
            style={{ background: 'color-mix(in srgb, var(--accent) 15%, transparent)' }}>🔰</div>
          <h2 className="text-xl font-bold mb-1" style={{ color: 'var(--text)' }}>Create your account</h2>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Join the compliance management platform</p>
        </div>
        {/* Google */}
        <button type="button" className="w-full flex items-center justify-center gap-3 rounded-full py-2.5 mb-6 text-sm font-medium"
          style={{ border: '1px solid var(--border)', background: 'var(--bg-raised)', color: 'var(--text)' }}>
          <FcGoogle className="text-xl" /> Continue with Google
        </button>
        {/* Divider */}
        <div className="relative mb-6">
          <div style={{ height: '1px', background: 'var(--border)' }} />
          <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-3 text-xs"
            style={{ background: 'var(--bg-surface)', color: 'var(--text-muted)' }}>OR</span>
        </div>
        {/* Form */}
        <form className="space-y-4">
          <div className="grid grid-cols-1 gap-3">
            {['First Name', 'Last Name'].map((lbl) => (
              <div key={lbl}>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>{lbl}</label>
                <div style={inputWrap}><FaUser style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                  <input type="text" placeholder={lbl === 'First Name' ? 'John' : 'Doe'} style={inputStyle} /></div>
              </div>
            ))}
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>Email Address</label>
            <div style={inputWrap}><FaEnvelope style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
              <input type="email" placeholder="john@company.com" style={inputStyle} /></div>
          </div>
          {['Password', 'Confirm Password'].map((lbl) => (
            <div key={lbl}>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>{lbl}</label>
              <div style={inputWrap}><FaLock style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                <input type="password" placeholder="••••••••" style={inputStyle} /></div>
            </div>
          ))}
          <button type="submit" className="w-full py-3 rounded-full font-semibold text-sm transition-all"
            style={{ background: 'var(--accent)', color: '#fff' }}>Create Account</button>
        </form>
        <p className="text-xs text-center mt-6" style={{ color: 'var(--text-muted)' }}>
          By creating an account you agree to our{' '}
          <button type="button" className="underline" style={{ color: 'var(--accent)' }}>Terms &amp; Privacy Policy</button>
        </p>
      </div>
    </div>
  );
}

