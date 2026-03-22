/**
 * HazardRiskInterface.js — Landing page for the Hazard & Risk Management module.
 */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ExclamationTriangleIcon,
  ShieldExclamationIcon,
  ClipboardDocumentCheckIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  LightBulbIcon,
  ArrowTrendingUpIcon,
  ChartBarSquareIcon,
} from '@heroicons/react/24/outline';
import {
  HazardReportService,
  RiskAssessmentService,
  PerformedRiskAssessmentService,
} from '../../services/hazardAndRisk.service';

const CARDS = [
  {
    label:       'Hazard Reports',
    description: 'Log and track workplace hazard incidents, injured people and corrective actions.',
    icon:        ExclamationTriangleIcon,
    color:       '#dc2626',
    bg:          'rgba(220,38,38,.12)',
    route:       '/hazard/reports',
  },
  {
    label:       'Risk Assessments',
    description: 'Define risk assessment templates with activities, locations and assigned officers.',
    icon:        ShieldExclamationIcon,
    color:       '#d97706',
    bg:          'rgba(217,119,6,.12)',
    route:       '/hazard/risk-assessments',
  },
  {
    label:       'Performed Risk Assessments',
    description: 'Record executed risk assessments, add entries and track corrective actions.',
    icon:        ClipboardDocumentCheckIcon,
    color:       '#16a34a',
    bg:          'rgba(22,163,74,.12)',
    route:       '/hazard/performed-risk-assessments',
  },
];

const WORKFLOW = [
  {
    step: 1,
    title: 'Log a Hazard Report',
    desc: 'When a hazard is identified, create a report and record any injured people along with initial findings.',
    icon: ExclamationTriangleIcon,
    color: '#dc2626',
    bg: 'rgba(220,38,38,.12)',
  },
  {
    step: 2,
    title: 'Create a Risk Assessment',
    desc: 'Define the activity, location and risks. Assign safety officers and supervisors to own the assessment.',
    icon: ShieldExclamationIcon,
    color: '#d97706',
    bg: 'rgba(217,119,6,.12)',
  },
  {
    step: 3,
    title: 'Perform the Assessment',
    desc: 'Execute the risk assessment, add hazard entries, assign control measures and manage corrective actions.',
    icon: ClipboardDocumentCheckIcon,
    color: '#16a34a',
    bg: 'rgba(22,163,74,.12)',
  },
];

const RISK_LEVELS = [
  { label: 'Low',      range: '1 – 4',   color: '#16a34a', bg: 'rgba(22,163,74,.12)' },
  { label: 'Medium',   range: '5 – 9',   color: '#d97706', bg: 'rgba(217,119,6,.12)' },
  { label: 'High',     range: '10 – 16', color: '#dc2626', bg: 'rgba(220,38,38,.12)' },
  { label: 'Critical', range: '17 +',    color: '#7c3aed', bg: 'rgba(124,58,237,.12)' },
];

const TIPS = [
  'Review new hazard reports within 24 hours of submission.',
  'Ensure every risk assessment has a designated safety officer assigned.',
  'Follow up on corrective actions before their scheduled due dates.',
  'Re-assess residual risk after implementing new control measures.',
];

export default function HazardRiskInterface() {
  const navigate = useNavigate();
  const [counts, setCounts] = useState({ reports: null, assessments: null, performed: null });

  useEffect(() => {
    Promise.allSettled([
      HazardReportService.list({ per_page: 1 }),
      RiskAssessmentService.list({ per_page: 1 }),
      PerformedRiskAssessmentService.list({ per_page: 1 }),
    ]).then(([r, a, p]) => {
      const extract = (res) => {
        if (res.status !== 'fulfilled') return null;
        const v = res.value;
        return v?.meta?.total_count ?? v?.meta?.total ?? (Array.isArray(v) ? v.length : null);
      };
      setCounts({ reports: extract(r), assessments: extract(a), performed: extract(p) });
    });
  }, []);

  const today = new Date().toLocaleDateString('en-GB', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  return (
    <div className="ui-page" style={{ color: 'var(--text)' }}>

      {/* ── Hero Banner ── */}
      <div
        className="rounded-2xl p-8 mb-8 relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(220,38,38,.07) 0%, rgba(217,119,6,.05) 50%, rgba(22,163,74,.07) 100%)',
          border: '1px solid var(--border)',
        }}
      >
        {/* decorative blobs */}
        <div style={{ position: 'absolute', top: -50, right: -50, width: 180, height: 180, borderRadius: '50%', background: 'rgba(220,38,38,.05)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -30, right: 140, width: 110, height: 110, borderRadius: '50%', background: 'rgba(22,163,74,.05)', pointerEvents: 'none' }} />

        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>
              Safety Management System
            </p>
            <h1 className="text-3xl font-extrabold leading-tight" style={{ color: 'var(--text)' }}>
              Hazard &amp; Risk<br />Management
            </h1>
            <p className="text-sm mt-3 max-w-md leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              Proactively identify, assess and control workplace hazards to maintain a safe working
              environment across your organisation.
            </p>
          </div>
          <div className="flex-shrink-0 flex flex-col sm:items-end gap-2">
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
              style={{ background: 'rgba(22,163,74,.12)', color: '#16a34a' }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-current" /> Active
            </span>
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{today}</span>
          </div>
        </div>
      </div>

      {/* ── Live Count Stats ── */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Hazard Reports',       value: counts.reports,     color: '#dc2626', bg: 'rgba(220,38,38,.10)',  icon: ExclamationTriangleIcon,    route: '/hazard/reports' },
          { label: 'Risk Assessments',      value: counts.assessments, color: '#d97706', bg: 'rgba(217,119,6,.10)', icon: ShieldExclamationIcon,      route: '/hazard/risk-assessments' },
          { label: 'Performed Assessments', value: counts.performed,   color: '#16a34a', bg: 'rgba(22,163,74,.10)', icon: ClipboardDocumentCheckIcon, route: '/hazard/performed-risk-assessments' },
        ].map(({ label, value, color, bg, icon: Icon, route }) => (
          <button
            key={label}
            type="button"
            onClick={() => navigate(route)}
            className="ui-card p-5 flex items-center gap-4 text-left hover:scale-[1.02] transition-transform cursor-pointer"
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: bg }}
            >
              <Icon className="w-5 h-5" style={{ color }} />
            </div>
            <div>
              <p className="text-2xl font-extrabold leading-none" style={{ color }}>
                {value === null
                  ? <span className="inline-block w-8 h-6 rounded animate-pulse" style={{ background: 'var(--border)' }} />
                  : value}
              </p>
              <p className="text-xs mt-0.5 font-medium" style={{ color: 'var(--text-muted)' }}>{label}</p>
            </div>
          </button>
        ))}
      </div>

      {/* ── Module Cards ── */}
      <div className="mb-8">
        <h2 className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: 'var(--text-muted)' }}>
          Modules
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {CARDS.map(({ label, description, icon: Icon, color, bg, route }) => (
            <button
              key={route}
              type="button"
              onClick={() => navigate(route)}
              className="ui-card flex flex-col gap-4 p-6 text-left group hover:scale-[1.015] transition-transform cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div
                  className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
                  style={{ background: bg }}
                >
                  <Icon className="w-5 h-5" style={{ color }} />
                </div>
                <ArrowRightIcon
                  className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-all -translate-x-1 group-hover:translate-x-0"
                  style={{ color }}
                />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{label}</h3>
                <p className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--text-muted)' }}>{description}</p>
              </div>
              <span className="text-xs font-semibold" style={{ color }}>Open →</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Bottom Row: Workflow + Risk Reference + Best Practices ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Workflow — 2 cols */}
        <div className="lg:col-span-2 ui-card p-6">
          <div className="flex items-center gap-2 mb-6">
            <ArrowTrendingUpIcon className="h-4 w-4" style={{ color: 'var(--text-muted)' }} />
            <h2 className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
              How It Works
            </h2>
          </div>

          <div className="flex flex-col sm:flex-row gap-6 sm:gap-0 relative">
            {/* horizontal connector */}
            <div
              className="hidden sm:block absolute top-5 left-[calc(33%+8px)] right-[calc(33%+8px)] h-px"
              style={{ background: 'var(--border)' }}
            />

            {WORKFLOW.map(({ step, title, desc, icon: Icon, color, bg }) => (
              <div key={step} className="flex-1 flex sm:flex-col items-start sm:items-center gap-4 sm:gap-3 sm:text-center relative">
                {/* mobile: vertical connector */}
                <div
                  className="sm:hidden absolute left-5 top-10 bottom-0 w-px"
                  style={{ background: 'var(--border)' }}
                />
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 relative z-10"
                  style={{ background: bg }}
                >
                  <Icon className="w-5 h-5" style={{ color }} />
                </div>
                <div className="flex-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color }}>
                    Step {step}
                  </p>
                  <p className="text-xs font-semibold mb-1" style={{ color: 'var(--text)' }}>{title}</p>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-5">

          {/* Risk Score Guide */}
          <div className="ui-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <ChartBarSquareIcon className="h-4 w-4" style={{ color: 'var(--text-muted)' }} />
              <h2 className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                Risk Score Guide
              </h2>
            </div>
            <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
              Score = Probability × Consequence
            </p>
            <div className="space-y-2">
              {RISK_LEVELS.map(({ label, range, color, bg }) => (
                <div key={label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: color }} />
                    <span className="text-xs font-medium" style={{ color: 'var(--text)' }}>{label}</span>
                  </div>
                  <span
                    className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                    style={{ background: bg, color }}
                  >
                    {range}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Best Practices */}
          <div className="ui-card p-5 flex-1">
            <div className="flex items-center gap-2 mb-4">
              <LightBulbIcon className="h-4 w-4" style={{ color: 'var(--text-muted)' }} />
              <h2 className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                Best Practices
              </h2>
            </div>
            <ul className="space-y-2.5">
              {TIPS.map((tip, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <CheckCircleIcon className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" style={{ color: '#16a34a' }} />
                  <span className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}


