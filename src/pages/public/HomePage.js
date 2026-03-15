import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { ShieldCheck, BarChart2, FileText, Bell, Settings, Zap } from 'lucide-react';
import { Products } from './ProductsPage';
import { Solutions } from './SolutionsPage';
import { Contacts } from './ContactsPage';

const features = [
  { id: 1, icon: BarChart2, label: 'Dashboard', desc: 'Real-time compliance metrics' },
  { id: 2, icon: FileText, label: 'Reports & Analytics', desc: 'Comprehensive reporting tools' },
  { id: 3, icon: ShieldCheck, label: 'Custom Forms', desc: 'Flexible inspection forms' },
  { id: 4, icon: FileText, label: 'Document Control', desc: 'Centralized document management' },
  { id: 5, icon: Settings, label: 'Automation', desc: 'Streamline your workflows' },
  { id: 6, icon: Bell, label: 'Notifications', desc: 'Stay informed instantly' },
];

const stats = [
  { value: '10,000+', label: 'Organizations' },
  { value: '99.9%', label: 'Uptime' },
  { value: '50M+', label: 'Reports Generated' },
  { value: '4.9★', label: 'User Rating' },
];

export function Home() {
  return (
    <main className="scroll-smooth">
      {/* ── Hero ── */}
      <section
        className="relative min-h-[90vh] flex items-center justify-center py-20 px-4 overflow-hidden"
        style={{ background: 'var(--bg)' }}
      >
        {/* Background glow blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className="absolute w-[600px] h-[600px] rounded-full blur-[120px] opacity-20 -top-20 -left-32"
            style={{ background: 'var(--accent)' }}
          />
          <div
            className="absolute w-[400px] h-[400px] rounded-full blur-[100px] opacity-15 bottom-0 right-0"
            style={{ background: '#7c3aed' }}
          />
        </div>

        <div className="relative max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="flex justify-center mb-6">
            <span
              style={{ background: 'color-mix(in srgb, var(--accent) 15%, transparent)', color: 'var(--accent)', border: '1px solid color-mix(in srgb, var(--accent) 30%, transparent)' }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold"
            >
              <Zap size={14} />
              Workplace Safety Platform
            </span>
          </div>

          {/* Headline */}
          <h1
            style={{ color: 'var(--text)' }}
            className="text-5xl md:text-6xl font-black tracking-tight mb-6 leading-tight"
          >
            Build a Safer,<br />
            <span style={{ color: 'var(--accent)' }}>Smarter Workplace</span>
          </h1>

          <p style={{ color: 'var(--text-muted)' }} className="text-lg md:text-xl leading-relaxed mb-10 max-w-2xl mx-auto">
            Streamline compliance, reduce risk, and protect your people with a powerful all-in-one platform for modern organizations.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-14">
            <Link to="/dashboard">
              <Button size="lg">Get Started Free</Button>
            </Link>
            <Link to="/signin">
              <Button variant="outline" size="lg">Sign In</Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-2xl mx-auto">
            {stats.map((s, i) => (
              <div key={i} className="text-center">
                <p style={{ color: 'var(--text)' }} className="text-2xl font-black">{s.value}</p>
                <p style={{ color: 'var(--text-muted)' }} className="text-xs font-medium">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section style={{ background: 'var(--bg-surface)', borderTop: '1px solid var(--border)' }} className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p style={{ color: 'var(--accent)' }} className="text-sm font-bold uppercase tracking-widest mb-2">Platform Features</p>
            <h2 style={{ color: 'var(--text)' }} className="text-4xl font-black mb-3">Everything you need</h2>
            <p style={{ color: 'var(--text-muted)' }} className="text-base max-w-xl mx-auto">A complete toolkit for modern compliance and workplace safety management.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.id}
                  style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
                  className="rounded-2xl p-6 flex gap-4 items-start hover:shadow-[var(--shadow-md)] transition-shadow"
                >
                  <div
                    style={{ background: 'color-mix(in srgb, var(--accent) 15%, transparent)', color: 'var(--accent)' }}
                    className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                  >
                    <Icon size={20} />
                  </div>
                  <div>
                    <h3 style={{ color: 'var(--text)' }} className="font-bold text-sm mb-1">{f.label}</h3>
                    <p style={{ color: 'var(--text-muted)' }} className="text-xs leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Other Sections ── */}
      <section id="products" style={{ background: 'var(--bg)', borderTop: '1px solid var(--border)' }} className="py-16 px-4"><Products /></section>
      <section id="solutions" style={{ background: 'var(--bg-surface)', borderTop: '1px solid var(--border)' }} className="py-16 px-4"><Solutions /></section>
      <section id="contacts" style={{ background: 'var(--bg)', borderTop: '1px solid var(--border)' }} className="py-16 px-4"><Contacts /></section>
    </main>
  );
}
