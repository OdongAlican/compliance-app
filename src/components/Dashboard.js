import React from 'react';
import {
  AlertCircle, CheckCircle, Clock, Activity,
  ShieldCheck, Clipboard, Users, BarChart2, ArrowUpRight, ArrowDownRight,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

/* ── Stat card ── */
function StatCard({ icon: Icon, title, value, change, up, color }) {
  const palette = {
    blue:   { ring: 'rgba(37,99,235,.18)',  ico: 'var(--accent)',  },
    green:  { ring: 'rgba(22,163,74,.18)',  ico: 'var(--success)', },
    amber:  { ring: 'rgba(217,119,6,.18)',  ico: 'var(--warning)', },
    red:    { ring: 'rgba(220,38,38,.18)',  ico: 'var(--danger)',  },
    purple: { ring: 'rgba(124,58,237,.18)', ico: '#a78bfa',        },
  };
  const p = palette[color] || palette.blue;
  return (
    <div
      style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
      className="rounded-2xl p-5 flex flex-col gap-4 hover:shadow-[var(--shadow-md)] transition-shadow"
    >
      <div className="flex items-start justify-between gap-3">
        <div style={{ background: p.ring, color: p.ico }} className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0">
          {Icon && <Icon size={20} />}
        </div>
        <span
          style={{ color: up ? 'var(--success)' : 'var(--danger)', background: up ? 'rgba(22,163,74,.12)' : 'rgba(220,38,38,.12)' }}
          className="flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full"
        >
          {up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
          {change}
        </span>
      </div>
      <div>
        <p style={{ color: 'var(--text-muted)' }} className="text-xs font-medium uppercase tracking-wider mb-1">{title}</p>
        <p style={{ color: 'var(--text)' }} className="text-3xl font-bold leading-none">{value}</p>
      </div>
    </div>
  );
}

function SectionHeading({ children, action }) {
  return (
    <div className="flex items-center justify-between gap-4 mb-5">
      <h2 style={{ color: 'var(--text)' }} className="text-lg font-bold">{children}</h2>
      {action}
    </div>
  );
}

function QuickAction({ icon: Icon, title, desc, color, to, navigate }) {
  const palette = {
    red:   { bg: 'rgba(220,38,38,.12)', color: 'var(--danger)' },
    amber: { bg: 'rgba(217,119,6,.12)', color: 'var(--warning)' },
    blue:  { bg: 'rgba(37,99,235,.12)', color: 'var(--accent)' },
    green: { bg: 'rgba(22,163,74,.12)', color: 'var(--success)' },
  };
  const p = palette[color] || palette.blue;
  return (
    <div
      style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', cursor: 'pointer' }}
      className="rounded-2xl p-5 flex flex-col gap-3 hover:shadow-[var(--shadow-md)] transition-all hover:translate-y-[-2px]"
      onClick={() => to && navigate(to)}
    >
      <div style={{ background: p.bg, color: p.color }} className="w-11 h-11 rounded-xl flex items-center justify-center">
        {Icon && <Icon size={20} />}
      </div>
      <div>
        <h3 style={{ color: 'var(--text)' }} className="font-semibold text-sm mb-0.5">{title}</h3>
        <p style={{ color: 'var(--text-muted)' }} className="text-xs leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

const recentActivity = [
  { id: 1, type: 'hazard',     title: 'Wet floor reported',       location: 'Building A', time: '2h ago', status: 'open' },
  { id: 2, type: 'assessment', title: 'Risk Assessment completed', location: 'Building B', time: '4h ago', status: 'done' },
  { id: 3, type: 'incident',   title: 'Minor injury reported',     location: 'Warehouse',  time: '1d ago', status: 'progress' },
  { id: 4, type: 'inspection', title: 'Vehicle inspection passed', location: 'Yard',       time: '1d ago', status: 'done' },
  { id: 5, type: 'hazard',     title: 'Chemical spill (resolved)', location: 'Lab C',      time: '2d ago', status: 'done' },
];

const STATUS = {
  open:     { label: 'Open',       bg: 'rgba(220,38,38,.12)', color: 'var(--danger)' },
  done:     { label: 'Resolved',   bg: 'rgba(22,163,74,.12)', color: 'var(--success)' },
  progress: { label: 'In Progress', bg: 'rgba(217,119,6,.12)', color: 'var(--warning)' },
};

const Dashboard = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-10 pb-8">
      {/* ── Welcome banner ── */}
      <div
        style={{ background: 'linear-gradient(135deg, color-mix(in srgb, var(--accent) 10%, var(--bg-surface)), var(--bg-surface))', border: '1px solid var(--border)' }}
        className="rounded-2xl px-6 py-7 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5"
      >
        <div>
          <p style={{ color: 'var(--text-muted)' }} className="text-sm font-medium mb-1">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
          <h1 style={{ color: 'var(--text)' }} className="text-2xl font-bold mb-1">Welcome back, Paul 👋</h1>
          <p style={{ color: 'var(--text-muted)' }} className="text-sm">Here's your compliance overview for today.</p>
        </div>
        <button
          onClick={() => navigate('/inspection')}
          style={{ background: 'var(--accent)' }}
          className="flex items-center gap-2 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:brightness-110 transition-all active:scale-95 shrink-0"
        >
          <Clipboard size={15} />
          New Inspection
        </button>
      </div>

      {/* ── Inspections KPIs ── */}
      <section>
        <SectionHeading action={
          <button onClick={() => navigate('/inspection')} style={{ color: 'var(--accent)' }} className="text-xs font-semibold hover:underline flex items-center gap-1">View all <ArrowUpRight size={11} /></button>
        }>Inspections</SectionHeading>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <StatCard icon={Clipboard}   title="Total Reports"    value="247" change="12%" up   color="blue"  />
          <StatCard icon={CheckCircle} title="Resolved Issues"  value="189" change="8%"  up   color="green" />
          <StatCard icon={Clock}       title="In Progress"      value="58"  change="3%"  down color="amber" />
        </div>
      </section>

      {/* ── Hazard KPIs ── */}
      <section>
        <SectionHeading action={
          <button onClick={() => navigate('/hazard/report')} style={{ color: 'var(--accent)' }} className="text-xs font-semibold hover:underline flex items-center gap-1">View all <ArrowUpRight size={11} /></button>
        }>Hazard & Risk Management</SectionHeading>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard icon={AlertCircle} title="Open Reports" value="34"  change="5%"  down color="red"    />
          <StatCard icon={CheckCircle} title="Resolved"     value="128" change="14%" up   color="green"  />
          <StatCard icon={Clock}       title="In Progress"  value="22"  change="2%"  up   color="amber"  />
          <StatCard icon={Activity}    title="Assessments"  value="61"  change="9%"  up   color="purple" />
        </div>
      </section>

      {/* ── Quick Actions + Recent Activity ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <section>
          <SectionHeading>Quick Actions</SectionHeading>
          <div className="grid grid-cols-2 gap-4">
            <QuickAction icon={AlertCircle} title="Hazard Report"   desc="Report a new safety hazard" color="red"   to="/hazard/report"  navigate={navigate} />
            <QuickAction icon={ShieldCheck} title="Risk Assessment" desc="Conduct a risk assessment"  color="amber" to="/form/risk"       navigate={navigate} />
            <QuickAction icon={Clipboard}   title="New Inspection"  desc="Start an inspection form"   color="blue"  to="/inspection"      navigate={navigate} />
            <QuickAction icon={Users}       title="User Management" desc="Manage users and roles"     color="green" to="/user-management" navigate={navigate} />
          </div>
        </section>

        <section>
          <SectionHeading action={<button style={{ color: 'var(--accent)' }} className="text-xs font-semibold hover:underline">See all</button>}>
            Recent Activity
          </SectionHeading>
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }} className="rounded-2xl overflow-hidden">
            {recentActivity.map((a, i) => {
              const s = STATUS[a.status] || STATUS.open;
              return (
                <div
                  key={a.id}
                  style={{ borderBottom: i < recentActivity.length - 1 ? '1px solid var(--border)' : 'none' }}
                  className="flex items-center gap-4 px-5 py-3.5 hover:bg-[color:var(--bg-raised)] transition-colors"
                >
                  <div style={{ background: 'var(--bg-raised)', color: 'var(--text-muted)' }} className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0">
                    {a.type === 'hazard' ? <AlertCircle size={14} /> : a.type === 'inspection' ? <Clipboard size={14} /> : <Activity size={14} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p style={{ color: 'var(--text)' }} className="text-sm font-medium truncate">{a.title}</p>
                    <p style={{ color: 'var(--text-muted)' }} className="text-xs">{a.location} · {a.time}</p>
                  </div>
                  <span style={{ background: s.bg, color: s.color }} className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full shrink-0">{s.label}</span>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* ── Bottom row ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <StatCard icon={Users}       title="Total Users"     value="182" change="6%"  up   color="blue"  />
        <StatCard icon={BarChart2}   title="Compliance Rate" value="94%" change="2%"  up   color="green" />
        <StatCard icon={ShieldCheck} title="Pending CAPAs"   value="17"  change="4%"  down color="red"   />
      </div>
    </div>
  );
};

export default Dashboard;
