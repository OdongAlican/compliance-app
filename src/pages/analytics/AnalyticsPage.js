import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart, Bar,
  LineChart, Line,
  AreaChart, Area,
  PieChart, Pie, Cell,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';
import { motion } from 'framer-motion';
import {
  BarChart2, RefreshCw, AlertTriangle, Shield,
  Activity, CheckCircle, FileText, Zap, TrendingUp, Clock,
} from 'lucide-react';
import { fetchAnalyticsData } from '../../services/analytics.service';

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const PALETTE = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
  '#8b5cf6', '#06b6d4', '#f97316', '#6366f1',
  '#ec4899', '#84cc16',
];

const STATUS_COLOR = {
  pending:     '#f59e0b',
  in_progress: '#3b82f6',
  completed:   '#10b981',
};

const DATE_RANGES = [
  { label: '30 Days',    days: 30  },
  { label: '90 Days',    days: 90  },
  { label: '12 Months',  days: 365 },
  { label: 'All Time',   days: null },
];

// ─────────────────────────────────────────────────────────────────────────────
// Data utilities
// ─────────────────────────────────────────────────────────────────────────────

const groupCount = (items, field, top = 10) =>
  Object.entries(
    items.reduce((m, it) => {
      const k = it[field] || 'Unknown';
      m[k] = (m[k] || 0) + 1;
      return m;
    }, {})
  )
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, top);

const monthlyTrend = (items, dateField) => {
  const now = new Date();
  const months = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1);
    return {
      month: d.toLocaleDateString('en', { month: 'short', year: '2-digit' }),
      year: d.getFullYear(),
      mon:  d.getMonth(),
      count: 0,
    };
  });
  items.forEach((item) => {
    const d = new Date(item[dateField]);
    if (!isNaN(d)) {
      const idx = months.findIndex((x) => x.year === d.getFullYear() && x.mon === d.getMonth());
      if (idx !== -1) months[idx].count++;
    }
  });
  return months.map(({ month, count }) => ({ month, count }));
};

const byStatus = (items) =>
  items.reduce(
    (m, it) => {
      const s = it.status || 'pending';
      if (s in m) m[s]++;
      return m;
    },
    { pending: 0, in_progress: 0, completed: 0 }
  );

const filterDate = (items, field, days) => {
  if (!days) return items;
  const cutoff = new Date(Date.now() - days * 86_400_000);
  return items.filter((it) => new Date(it[field]) >= cutoff);
};

// ─────────────────────────────────────────────────────────────────────────────
// Shared chart UI
// ─────────────────────────────────────────────────────────────────────────────

const RADIAN = Math.PI / 180;
const PieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  if (percent < 0.05) return null;
  const r = innerRadius + (outerRadius - innerRadius) * 0.5;
  return (
    <text
      x={cx + r * Math.cos(-midAngle * RADIAN)}
      y={cy + r * Math.sin(-midAngle * RADIAN)}
      fill="white"
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={11}
      fontWeight={700}
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background:   'var(--bg-surface)',
        border:       '1px solid var(--border)',
        borderRadius: '0.5rem',
        padding:      '0.625rem 0.875rem',
        boxShadow:    '0 8px 20px rgba(0,0,0,0.18)',
        fontSize:     '0.8rem',
        minWidth:     120,
      }}
    >
      {label && (
        <p style={{ color: 'var(--text-muted)', marginBottom: '0.375rem', fontWeight: 600, fontSize: '0.75rem' }}>
          {label}
        </p>
      )}
      {payload.map((entry, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.125rem 0' }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: entry.color, flexShrink: 0 }} />
          <span style={{ color: 'var(--text-muted)' }}>{entry.name}:</span>
          <span style={{ fontWeight: 700, color: entry.color }}>{entry.value.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
};

const Empty = ({ message = 'No data available for the selected period' }) => (
  <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '0.5rem' }}>
    <FileText size={30} style={{ color: 'var(--text-muted)', opacity: 0.35 }} />
    <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', textAlign: 'center' }}>{message}</p>
  </div>
);

const Shimmer = ({ h = 220 }) => (
  <div
    style={{
      height: h,
      borderRadius: '0.75rem',
      background: 'var(--border)',
      animation: 'analytics-pulse 1.6s ease-in-out infinite',
    }}
  />
);

/** Card container for a single chart */
const ChartCard = ({ title, children, span = 1 }) => (
  <motion.div
    initial={{ opacity: 0, y: 14 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.35 }}
    style={{
      background:   'var(--bg-surface)',
      border:       '1px solid var(--border)',
      borderRadius: '0.875rem',
      padding:      '1.25rem 1.5rem',
      gridColumn:   span > 1 ? `span ${span}` : undefined,
      minWidth:     0, // prevent grid blowout
    }}
  >
    <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text)', marginBottom: '1.125rem' }}>
      {title}
    </h3>
    {children}
  </motion.div>
);

/** Section divider with icon */
const SectionTitle = ({ label, icon: Icon, color }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
    <span style={{ background: `${color}1a`, borderRadius: '0.5rem', padding: '0.45rem', display: 'flex' }}>
      <Icon size={18} style={{ color }} />
    </span>
    <h2 style={{ fontSize: '1.0625rem', fontWeight: 700, color: 'var(--text)', margin: 0 }}>{label}</h2>
    <div style={{ flex: 1, height: 1, background: 'var(--border)', marginLeft: '0.5rem' }} />
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const [raw,         setRaw]         = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [refreshing,  setRefreshing]  = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [range,       setRange]       = useState(365); // days, null = all time

  const load = useCallback(async () => {
    try {
      const data = await fetchAnalyticsData();
      setRaw(data);
      setLastUpdated(new Date());
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const refresh = () => {
    setRefreshing(true);
    load();
  };

  // ── Derived / memoised data ──────────────────────────────────────────────
  const d = useMemo(() => {
    if (!raw) return null;

    const f = (items, field) => filterDate(items, field, range);

    // ── Incidents ──────────────────────────────────────────────────────────
    const incidents   = f(raw.incidents, 'date_of_incident');
    const incByType   = groupCount(incidents, 'incident_type');
    const incByLoc    = groupCount(incidents, 'location', 8);
    const incTrend    = monthlyTrend(raw.incidents, 'date_of_incident');

    // ── Hazards ────────────────────────────────────────────────────────────
    const hazards     = f(raw.hazards, 'report_date');
    const hazByType   = groupCount(hazards, 'hazard_type');
    const hazByLoc    = groupCount(hazards, 'location', 8);
    const hazTrend    = monthlyTrend(raw.hazards, 'report_date');

    // ── Risk Assessments ───────────────────────────────────────────────────
    const ra          = f(raw.riskAssessments, 'date');
    const perfRA      = f(raw.performedRA, 'created_at');

    // ── Inspections ────────────────────────────────────────────────────────
    const INSP_LABELS = {
      canteen:     'Canteen',
      fuel:        'Fuel Tank',
      tool:        'Hand / Power Tools',
      ppe:         'PPE',
      scienceLab:  'Science Lab',
      swimmingPool:'Swimming Pool',
      vehicle:     'Vehicle',
    };
    const inspSummary = Object.entries(INSP_LABELS).map(([key, name]) => {
      const items = f(raw.inspections[key], 'date');
      const { pending, in_progress, completed } = byStatus(items);
      return { name, pending, in_progress, completed, total: items.length };
    });
    const inspStatusDoughnut = [
      { name: 'Pending',     value: inspSummary.reduce((s, r) => s + r.pending,     0) },
      { name: 'In Progress', value: inspSummary.reduce((s, r) => s + r.in_progress, 0) },
      { name: 'Completed',   value: inspSummary.reduce((s, r) => s + r.completed,   0) },
    ].filter((d) => d.value > 0);

    const allInspItems = Object.values(raw.inspections).flat();
    const inspTrend    = monthlyTrend(allInspItems, 'date');

    // ── H&S Modules ────────────────────────────────────────────────────────
    const HSA_LABELS = {
      wir:        'WIR',
      tc:         'Training & Comp.',
      ep:         'Emergency Prep.',
      ppeComp:    'PPE Compliance',
      cs:         'Contractor Safety',
      mrm:        'MRM',
      capa:       'CAPA',
      checklists: 'Checklist',
    };
    const hsaSummary = Object.entries(HSA_LABELS).map(([key, name]) => {
      const items = f(raw.hsaModules[key], 'date');
      const { pending, in_progress, completed } = byStatus(items);
      return { name, pending, in_progress, completed, total: items.length };
    });
    const hsaStatusDoughnut = [
      { name: 'Pending',     value: hsaSummary.reduce((s, r) => s + r.pending,     0) },
      { name: 'In Progress', value: hsaSummary.reduce((s, r) => s + r.in_progress, 0) },
      { name: 'Completed',   value: hsaSummary.reduce((s, r) => s + r.completed,   0) },
    ].filter((d) => d.value > 0);

    const hsaRadar = hsaSummary.map((m) => ({
      module: m.name,
      rate: m.total ? Math.round((m.completed / m.total) * 100) : 0,
    }));

    // ── KPIs ───────────────────────────────────────────────────────────────
    const inspCompleted = inspSummary.reduce((s, r) => s + r.completed, 0);
    const hsaCompleted  = hsaSummary.reduce((s, r) => s + r.completed,  0);

    return {
      incidents, incByType, incByLoc, incTrend,
      hazards, hazByType, hazByLoc, hazTrend,
      ra, perfRA,
      inspSummary, inspStatusDoughnut, inspTrend,
      hsaSummary, hsaStatusDoughnut, hsaRadar,
      kpi: {
        incidents:    incidents.length,
        hazards:      hazards.length,
        ra:           ra.length,
        inspCompleted,
        hsaCompleted,
        perfRA:       perfRA.length,
      },
    };
  }, [raw, range]);

  // ── Grid helpers ─────────────────────────────────────────────────────────
  const threeCol = {
    display:             'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap:                 '1.25rem',
  };

  const KPI_META = [
    { key: 'incidents',    label: 'Incidents',         icon: AlertTriangle, color: '#ef4444', sub: 'Reports filed'             },
    { key: 'hazards',      label: 'Hazard Reports',    icon: Zap,           color: '#f59e0b', sub: 'Hazards identified'         },
    { key: 'ra',           label: 'Risk Assessments',  icon: Activity,      color: '#8b5cf6', sub: 'Assessments documented'     },
    { key: 'inspCompleted',label: 'Inspections Done',  icon: CheckCircle,   color: '#10b981', sub: 'Completed inspections'      },
    { key: 'hsaCompleted', label: 'H&S Audits Done',   icon: Shield,        color: '#3b82f6', sub: 'Completed audit records'    },
    { key: 'perfRA',       label: 'RA Performed',      icon: TrendingUp,    color: '#06b6d4', sub: 'Risk assessments performed' },
  ];

  return (
    <div style={{ padding: '1.5rem 2rem', maxWidth: 1560, margin: '0 auto' }}>

      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ background: '#3b82f61a', borderRadius: '0.75rem', padding: '0.625rem', display: 'flex' }}>
            <BarChart2 size={24} style={{ color: '#3b82f6' }} />
          </span>
          <div>
            <h1 style={{ fontSize: '1.375rem', fontWeight: 800, color: 'var(--text)', margin: 0 }}>
              Analytics Dashboard
            </h1>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '2px 0 0' }}>
              {lastUpdated
                ? `Last updated: ${lastUpdated.toLocaleTimeString()}`
                : 'Loading compliance data…'}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flexWrap: 'wrap' }}>
          {/* Date-range pills */}
          <div style={{ display: 'flex', gap: '0.3rem', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '0.625rem', padding: '0.25rem' }}>
            {DATE_RANGES.map(({ label, days }) => (
              <button
                key={label}
                onClick={() => setRange(days)}
                style={{
                  padding:     '0.35rem 0.8rem',
                  borderRadius: '0.45rem',
                  fontSize:    '0.78rem',
                  fontWeight:  500,
                  cursor:      'pointer',
                  border:      'none',
                  transition:  'all 0.15s',
                  background:  range === days ? '#3b82f6' : 'transparent',
                  color:       range === days ? '#fff'    : 'var(--text-muted)',
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Refresh */}
          <button
            onClick={refresh}
            disabled={refreshing}
            style={{
              display:    'flex', alignItems: 'center', gap: '0.4rem',
              padding:    '0.45rem 1rem',
              borderRadius: '0.5rem',
              border:     '1px solid var(--border)',
              background: 'var(--bg-surface)',
              color:      'var(--text)',
              cursor:     refreshing ? 'not-allowed' : 'pointer',
              fontSize:   '0.82rem',
              fontWeight: 500,
              opacity:    refreshing ? 0.6 : 1,
            }}
          >
            <RefreshCw size={13} style={{ animation: refreshing ? 'analytics-spin 1s linear infinite' : 'none' }} />
            Refresh
          </button>
        </div>
      </div>

      {/* ── KPI Row ──────────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '1rem', marginBottom: '2.25rem' }}>
        {KPI_META.map(({ key, label, icon: Icon, color, sub }, i) => (
          <motion.div
            key={key}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06, duration: 0.3 }}
            style={{
              background:   'var(--bg-surface)',
              border:       '1px solid var(--border)',
              borderRadius: '0.875rem',
              padding:      '1.125rem 1.25rem',
              position:     'relative',
              overflow:     'hidden',
            }}
          >
            <div style={{ position: 'absolute', right: -14, top: -14, background: `${color}12`, width: 90, height: 90, borderRadius: '50%' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.625rem' }}>
              <p style={{ fontSize: '0.71rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.055em', margin: 0 }}>
                {label}
              </p>
              <span style={{ background: `${color}1a`, borderRadius: '0.4rem', padding: '0.35rem', display: 'flex' }}>
                <Icon size={14} style={{ color }} />
              </span>
            </div>
            {loading ? (
              <div style={{ height: 34, borderRadius: 6, background: 'var(--border)', opacity: 0.6, animation: 'analytics-pulse 1.6s ease-in-out infinite' }} />
            ) : (
              <p style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text)', margin: 0, lineHeight: 1 }}>
                {(d?.kpi[key] ?? 0).toLocaleString()}
              </p>
            )}
            <p style={{ fontSize: '0.71rem', color: 'var(--text-muted)', margin: '0.375rem 0 0' }}>{sub}</p>
          </motion.div>
        ))}
      </div>

      {/* ── SECTION 1 — Incident Analytics ──────────────────────────────── */}
      <div style={{ marginBottom: '2.5rem' }}>
        <SectionTitle label="Incident Analytics" icon={AlertTriangle} color="#ef4444" />

        {loading ? (
          <div style={threeCol}>
            <Shimmer /> <Shimmer /> <Shimmer />
          </div>
        ) : (
          <div style={threeCol}>
            {/* Trend */}
            <ChartCard title="Monthly Incident Trend (12 months)">
              {d.incTrend.some((x) => x.count > 0) ? (
                <ResponsiveContainer width="100%" height={210}>
                  <AreaChart data={d.incTrend}>
                    <defs>
                      <linearGradient id="incGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#ef4444" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0}    />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="month" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip content={<ChartTooltip />} />
                    <Area type="monotone" dataKey="count" name="Incidents" stroke="#ef4444" fill="url(#incGrad)" strokeWidth={2.5} dot={{ r: 3, fill: '#ef4444' }} activeDot={{ r: 5 }} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : <Empty />}
            </ChartCard>

            {/* By type */}
            <ChartCard title="Incidents by Type">
              {d.incByType.length ? (
                <ResponsiveContainer width="100%" height={210}>
                  <PieChart>
                    <Pie data={d.incByType} cx="50%" cy="50%" innerRadius={58} outerRadius={88} dataKey="value" labelLine={false} label={PieLabel}>
                      {d.incByType.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
                    </Pie>
                    <Tooltip content={<ChartTooltip />} />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '0.73rem', color: 'var(--text-muted)' }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : <Empty />}
            </ChartCard>

            {/* By location */}
            <ChartCard title="Top Incident Locations">
              {d.incByLoc.length ? (
                <ResponsiveContainer width="100%" height={210}>
                  <BarChart data={d.incByLoc} layout="vertical" margin={{ left: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                    <XAxis type="number" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <YAxis type="category" dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} width={95} />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar dataKey="value" name="Incidents" radius={[0, 4, 4, 0]}>
                      {d.incByLoc.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : <Empty />}
            </ChartCard>
          </div>
        )}
      </div>

      {/* ── SECTION 2 — Hazard & Risk ─────────────────────────────────── */}
      <div style={{ marginBottom: '2.5rem' }}>
        <SectionTitle label="Hazard & Risk Management" icon={Zap} color="#f59e0b" />

        {loading ? (
          <div style={threeCol}>
            <Shimmer /> <Shimmer /> <Shimmer />
          </div>
        ) : (
          <div style={threeCol}>
            {/* Hazard by type */}
            <ChartCard title="Hazard Reports by Type">
              {d.hazByType.length ? (
                <ResponsiveContainer width="100%" height={210}>
                  <BarChart data={d.hazByType} margin={{ bottom: 22 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} angle={-25} textAnchor="end" />
                    <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar dataKey="value" name="Hazards" radius={[4, 4, 0, 0]}>
                      {d.hazByType.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : <Empty />}
            </ChartCard>

            {/* Hazard trend */}
            <ChartCard title="Hazard Reporting Trend (12 months)">
              {d.hazTrend.some((x) => x.count > 0) ? (
                <ResponsiveContainer width="100%" height={210}>
                  <LineChart data={d.hazTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="month" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip content={<ChartTooltip />} />
                    <Line type="monotone" dataKey="count" name="Hazards" stroke="#f59e0b" strokeWidth={2.5} dot={{ r: 3, fill: '#f59e0b' }} activeDot={{ r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : <Empty />}
            </ChartCard>

            {/* Risk assessment overview */}
            <ChartCard title="Risk Assessment Overview">
              {(d.ra.length || d.perfRA.length) ? (
                <ResponsiveContainer width="100%" height={210}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Documented',   value: d.ra.length    },
                        { name: 'Performed',    value: d.perfRA.length },
                      ].filter((x) => x.value > 0)}
                      cx="50%" cy="50%"
                      innerRadius={58} outerRadius={88}
                      dataKey="value" labelLine={false} label={PieLabel}
                    >
                      <Cell fill="#8b5cf6" />
                      <Cell fill="#06b6d4" />
                    </Pie>
                    <Tooltip content={<ChartTooltip />} />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '0.73rem', color: 'var(--text-muted)' }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : <Empty />}
            </ChartCard>
          </div>
        )}
      </div>

      {/* ── SECTION 3 — Inspections ────────────────────────────────────── */}
      <div style={{ marginBottom: '2.5rem' }}>
        <SectionTitle label="Inspection Modules" icon={CheckCircle} color="#10b981" />

        {loading ? (
          <div style={threeCol}>
            <Shimmer h={260} /> <Shimmer h={260} /> <Shimmer h={260} />
          </div>
        ) : (
          <div style={{ ...threeCol, gridTemplateColumns: '2fr 1fr 1fr' }}>
            {/* Stacked bar — status by module */}
            <ChartCard title="Status by Inspection Module">
              {d.inspSummary.some((r) => r.total > 0) ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={d.inspSummary} margin={{ bottom: 35 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 9.5 }} axisLine={false} tickLine={false} angle={-22} textAnchor="end" />
                    <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip content={<ChartTooltip />} />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '0.73rem', color: 'var(--text-muted)' }} />
                    <Bar dataKey="pending"     name="Pending"     stackId="s" fill={STATUS_COLOR.pending}     />
                    <Bar dataKey="in_progress" name="In Progress" stackId="s" fill={STATUS_COLOR.in_progress} />
                    <Bar dataKey="completed"   name="Completed"   stackId="s" fill={STATUS_COLOR.completed}   radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : <Empty />}
            </ChartCard>

            {/* Doughnut — overall status */}
            <ChartCard title="Overall Inspection Status">
              {d.inspStatusDoughnut.length ? (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={d.inspStatusDoughnut} cx="50%" cy="45%" innerRadius={62} outerRadius={92} dataKey="value" labelLine={false} label={PieLabel}>
                      <Cell fill={STATUS_COLOR.pending}     />
                      <Cell fill={STATUS_COLOR.in_progress} />
                      <Cell fill={STATUS_COLOR.completed}   />
                    </Pie>
                    <Tooltip content={<ChartTooltip />} />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '0.73rem', color: 'var(--text-muted)' }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : <Empty />}
            </ChartCard>

            {/* Area — monthly activity */}
            <ChartCard title="Monthly Inspection Activity">
              {d.inspTrend.some((x) => x.count > 0) ? (
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={d.inspTrend}>
                    <defs>
                      <linearGradient id="inspGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#10b981" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}    />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="month" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip content={<ChartTooltip />} />
                    <Area type="monotone" dataKey="count" name="Inspections" stroke="#10b981" fill="url(#inspGrad)" strokeWidth={2.5} dot={{ r: 3, fill: '#10b981' }} activeDot={{ r: 5 }} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : <Empty />}
            </ChartCard>
          </div>
        )}
      </div>

      {/* ── SECTION 4 — Health & Safety Audits ──────────────────────────── */}
      <div style={{ marginBottom: '2.5rem' }}>
        <SectionTitle label="Health & Safety Audits" icon={Shield} color="#3b82f6" />

        {loading ? (
          <div style={threeCol}>
            <Shimmer h={260} /> <Shimmer h={260} /> <Shimmer h={260} />
          </div>
        ) : (
          <div style={{ ...threeCol, gridTemplateColumns: '2fr 1fr 1fr' }}>
            {/* Grouped bar — status per module */}
            <ChartCard title="Audit Status by H&S Module">
              {d.hsaSummary.some((r) => r.total > 0) ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={d.hsaSummary} margin={{ bottom: 35 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 9.5 }} axisLine={false} tickLine={false} angle={-22} textAnchor="end" />
                    <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip content={<ChartTooltip />} />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '0.73rem', color: 'var(--text-muted)' }} />
                    <Bar dataKey="pending"     name="Pending"     fill={STATUS_COLOR.pending}     radius={[4, 4, 0, 0]} />
                    <Bar dataKey="in_progress" name="In Progress" fill={STATUS_COLOR.in_progress} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="completed"   name="Completed"   fill={STATUS_COLOR.completed}   radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : <Empty />}
            </ChartCard>

            {/* Doughnut — overall H&S status */}
            <ChartCard title="Overall H&S Audit Status">
              {d.hsaStatusDoughnut.length ? (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={d.hsaStatusDoughnut} cx="50%" cy="45%" innerRadius={62} outerRadius={92} dataKey="value" labelLine={false} label={PieLabel}>
                      <Cell fill={STATUS_COLOR.pending}     />
                      <Cell fill={STATUS_COLOR.in_progress} />
                      <Cell fill={STATUS_COLOR.completed}   />
                    </Pie>
                    <Tooltip content={<ChartTooltip />} />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '0.73rem', color: 'var(--text-muted)' }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : <Empty />}
            </ChartCard>

            {/* Radar — module completion % */}
            <ChartCard title="Module Completion Rate (%)">
              {d.hsaRadar.some((x) => x.rate > 0) ? (
                <ResponsiveContainer width="100%" height={250}>
                  <RadarChart data={d.hsaRadar} margin={{ top: 10, right: 24, bottom: 10, left: 24 }}>
                    <PolarGrid stroke="var(--border)" />
                    <PolarAngleAxis dataKey="module" tick={{ fill: 'var(--text-muted)', fontSize: 9.5 }} />
                    <PolarRadiusAxis domain={[0, 100]} tick={{ fill: 'var(--text-muted)', fontSize: 9 }} tickCount={5} />
                    <Radar name="Completion %" dataKey="rate" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.22} dot={{ r: 3, fill: '#3b82f6' }} />
                    <Tooltip content={<ChartTooltip />} />
                  </RadarChart>
                </ResponsiveContainer>
              ) : <Empty />}
            </ChartCard>
          </div>
        )}
      </div>

      {/* ── SECTION 5 — Comparative Overview ─────────────────────────────── */}
      <div style={{ marginBottom: '2rem' }}>
        <SectionTitle label="Comparative Overview" icon={TrendingUp} color="#6366f1" />

        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
            <Shimmer h={260} /> <Shimmer h={260} />
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
            {/* Combined module totals bar */}
            <ChartCard title="Records by Module (All time)">
              {(() => {
                const allModules = [
                  { name: 'Incidents',     value: raw.incidents.length      },
                  { name: 'Hazards',       value: raw.hazards.length        },
                  { name: 'Risk Assess.',  value: raw.riskAssessments.length },
                  { name: 'Canteen',       value: raw.inspections.canteen.length       },
                  { name: 'Fuel',          value: raw.inspections.fuel.length          },
                  { name: 'Tools',         value: raw.inspections.tool.length          },
                  { name: 'PPE',           value: raw.inspections.ppe.length           },
                  { name: 'Science Lab',   value: raw.inspections.scienceLab.length    },
                  { name: 'Swimming',      value: raw.inspections.swimmingPool.length  },
                  { name: 'Vehicle',       value: raw.inspections.vehicle.length       },
                  { name: 'WIR',           value: raw.hsaModules.wir.length            },
                  { name: 'TC',            value: raw.hsaModules.tc.length             },
                  { name: 'EP',            value: raw.hsaModules.ep.length             },
                  { name: 'PPE Comp.',     value: raw.hsaModules.ppeComp.length        },
                  { name: 'CS',            value: raw.hsaModules.cs.length             },
                  { name: 'MRM',           value: raw.hsaModules.mrm.length            },
                  { name: 'CAPA',          value: raw.hsaModules.capa.length           },
                  { name: 'Checklist',     value: raw.hsaModules.checklists.length     },
                ].filter((x) => x.value > 0);

                return allModules.length ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={allModules} margin={{ bottom: 35 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                      <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 9.5 }} axisLine={false} tickLine={false} angle={-30} textAnchor="end" />
                      <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                      <Tooltip content={<ChartTooltip />} />
                      <Bar dataKey="value" name="Total records" radius={[4, 4, 0, 0]}>
                        {allModules.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : <Empty />;
              })()}
            </ChartCard>

            {/* Dual axis: incidents vs hazards monthly */}
            <ChartCard title="Incidents vs Hazards — Monthly Trend">
              {(d.incTrend.some((x) => x.count > 0) || d.hazTrend.some((x) => x.count > 0)) ? (
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart
                    data={d.incTrend.map((inc, i) => ({
                      month:     inc.month,
                      incidents: inc.count,
                      hazards:   d.hazTrend[i]?.count ?? 0,
                    }))}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="month" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip content={<ChartTooltip />} />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '0.73rem', color: 'var(--text-muted)' }} />
                    <Line type="monotone" dataKey="incidents" name="Incidents" stroke="#ef4444" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                    <Line type="monotone" dataKey="hazards"   name="Hazards"   stroke="#f59e0b" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} strokeDasharray="5 3" />
                  </LineChart>
                </ResponsiveContainer>
              ) : <Empty />}
            </ChartCard>
          </div>
        )}
      </div>

      {/* ── Footer note ─────────────────────────────────────────────────── */}
      <div style={{ textAlign: 'center', padding: '1rem 0 0.5rem', borderTop: '1px solid var(--border)' }}>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          <Clock size={12} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
          Data reflects records accessible to your account. Charts showing no data indicate either no records or restricted access.
        </p>
      </div>

      {/* ── Keyframe styles ──────────────────────────────────────────────── */}
      <style>{`
        @keyframes analytics-pulse {
          0%, 100% { opacity: 0.5; }
          50%       { opacity: 0.8; }
        }
        @keyframes analytics-spin {
          from { transform: rotate(0deg);   }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
