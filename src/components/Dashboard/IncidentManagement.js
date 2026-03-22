/**
 * IncidentManagement.js — Landing page for the Incident Management module.
 *
 * Professional card-based landing. No tables. Mirrors HazardRiskInterface.js design language.
 * Live API counts, module cards, workflow steps, incident type reference, best practices.
 */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BellAlertIcon,
  ClipboardDocumentCheckIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import {
  IncidentNotificationService,
  StartInvestigationService,
} from '../../services/incidents.service';

const CARDS = [
  {
    label: "Incident Notifications",
    description: "Report and track workplace incidents. Notify safety officers, assign supervisors, and capture witness statements.",
    icon: BellAlertIcon,
    color: "#ef4444",
    bg: "color-mix(in srgb,#ef4444 12%,transparent)",
    route: "/incident/notifications",
    stats: "notifications",
    statsLabel: "Total Notifications",
  },
  {
    label: "Incident Investigations",
    description: "Launch formal investigations. Document people injured, property damage, descriptions, and corrective actions.",
    icon: ClipboardDocumentCheckIcon,
    color: "#7c3aed",
    bg: "color-mix(in srgb,#7c3aed 12%,transparent)",
    route: "/incident/investigations",
    stats: "investigations",
    statsLabel: "Total Investigations",
  },
];

const WORKFLOW = [
  {
    step: 1,
    title: "Report the Incident",
    detail: "Log the incident immediately with full details: type, location, date/time, persons involved, and a description of what occurred.",
    icon: BellAlertIcon,
    color: "#ef4444",
  },
  {
    step: 2,
    title: "Notify Stakeholders & Assign Officers",
    detail: "Assign safety officers and supervisors to the incident. Collect witness statements to build a complete picture of the event.",
    icon: UserGroupIcon,
    color: "#f97316",
  },
  {
    step: 3,
    title: "Investigate & Document",
    detail: "Conduct a formal investigation: record injuries, property damage, incident descriptions, and actions taken to prevent recurrence.",
    icon: ClipboardDocumentCheckIcon,
    color: "#7c3aed",
  },
];

const INCIDENT_TYPES_REF = [
  "Near Miss", "Injury / First Aid", "Property Damage",
  "Fire / Explosion", "Environmental Spill", "Vehicle Accident",
  "Theft / Vandalism", "Assault / Aggression",
];

const TIPS = [
  { title: "Report Immediately", body: "All incidents, however minor, should be reported as soon as possible to preserve evidence and ensure prompt action." },
  { title: "Preserve the Scene", body: "Do not disturb the incident scene unless there is immediate danger. Photographs and physical evidence are critical to investigation." },
  { title: "Collect All Witnesses", body: "Obtain statements from all witnesses promptly. Memory fades — early statements are far more reliable and defensible." },
  { title: "Root Cause Analysis", body: "Effective investigations identify root causes, not just symptoms. Use findings to implement systemic corrective actions." },
];

export default function IncidentInvestigationForm() {
  const navigate = useNavigate();
  const [counts, setCounts] = useState({ notifications: null, investigations: null });

  useEffect(() => {
    Promise.allSettled([
      IncidentNotificationService.list({ per_page: 1 }),
      StartInvestigationService.list({ per_page: 1 }),
    ]).then(([n, i]) => {
      const extract = (res) => {
        if (res.status !== 'fulfilled') return null;
        const v = res.value;
        return v?.meta?.total_count ?? v?.meta?.total ?? (Array.isArray(v) ? v.length : null);
      };
      setCounts({ notifications: extract(n), investigations: extract(i) });
    });
  }, []);

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      {/* Hero Banner */}
      <div
        className="relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #991b1b 0%, #b45309 50%, #7c3aed 100%)',
          padding: '3rem 2rem 4rem',
        }}
      >
        {/* Decorative circles */}
        <div style={{ position: 'absolute', top: '-60px', right: '-60px', width: '280px', height: '280px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
        <div style={{ position: 'absolute', bottom: '-80px', left: '-40px', width: '220px', height: '220px', borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />

        <div className="relative max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
            <div style={{ flex: 1, minWidth: 0, maxWidth: '560px' }}>
              <div className="flex items-center gap-3 mb-4">
                <span
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
                  style={{ background: 'rgba(255,255,255,0.18)', color: '#fff', border: '1px solid rgba(255,255,255,0.25)' }}
                >
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#4ade80', display: 'inline-block' }} />
                  Active Module
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Incident Management</h1>
              <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '1rem', maxWidth: '520px' }}>
                Centralised platform to report, investigate, and resolve workplace incidents — from first notification to root-cause resolution.
              </p>
            </div>

            {/* Live stat chips */}
            <div className="flex flex-wrap gap-3">
              {CARDS.map((c) => (
                <div
                  key={c.stats}
                  className="flex flex-col items-center justify-center px-5 py-3 rounded-xl"
                  style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', minWidth: 110, backdropFilter: 'blur(8px)' }}
                >
                  <span className="text-2xl font-bold text-white">
                    {counts[c.stats] === null ? '—' : counts[c.stats]}
                  </span>
                  <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.7rem', marginTop: 2, textAlign: 'center' }}>{c.statsLabel}</span>
                </div>
              ))}
            </div>
          </div>

          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.78rem', marginTop: '1.5rem' }}>{today}</p>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-6xl mx-auto px-4 md:px-6" style={{ marginTop: '2rem', position: 'relative', zIndex: 1 }}>

        {/* Module cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
          {CARDS.map((c) => {
            const Icon = c.icon;
            return (
              <button
                key={c.route}
                type="button"
                onClick={() => navigate(c.route)}
                className="ui-card text-left group transition-all hover:scale-[1.02] cursor-pointer"
                style={{ padding: '1.5rem' }}
              >
                <div className="flex items-start gap-4">
                  <span
                    className="flex-shrink-0 rounded-xl flex items-center justify-center"
                    style={{ width: 52, height: 52, background: c.bg }}
                  >
                    <Icon style={{ width: 26, height: 26, color: c.color }} />
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-bold text-base" style={{ color: 'var(--text)' }}>{c.label}</h3>
                      <span
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-lg font-light"
                        style={{ color: c.color }}
                      >→</span>
                    </div>
                    <p className="text-sm mt-1" style={{ color: 'var(--text-muted)', lineHeight: '1.5' }}>{c.description}</p>
                    {counts[c.stats] !== null && (
                      <div className="flex items-center gap-1.5 mt-3">
                        <span
                          className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold"
                          style={{ background: c.bg, color: c.color }}
                        >
                          {counts[c.stats]} {c.statsLabel}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* How It Works */}
        <div className="ui-card mb-6" style={{ padding: '1.5rem' }}>
          <h2 className="font-bold text-base mb-4" style={{ color: 'var(--text)' }}>How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {WORKFLOW.map(({ step, title, detail, icon: Icon, color }) => (
              <div key={step} className="flex gap-4">
                <div className="flex-shrink-0 flex flex-col items-center">
                  <span
                    className="flex items-center justify-center rounded-full text-xs font-bold text-white"
                    style={{ width: 32, height: 32, background: color, flexShrink: 0 }}
                  >
                    {step}
                  </span>
                  {step < WORKFLOW.length && (
                    <div style={{ width: 2, flex: 1, background: 'var(--border)', marginTop: 4 }} />
                  )}
                </div>
                <div style={{ paddingTop: 4 }}>
                  <div className="flex items-center gap-2 mb-1">
                    <Icon style={{ width: 16, height: 16, color }} />
                    <span className="font-semibold text-sm" style={{ color: 'var(--text)' }}>{title}</span>
                  </div>
                  <p className="text-xs" style={{ color: 'var(--text-muted)', lineHeight: '1.6' }}>{detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom row: Incident Types + Best Practices */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">

          {/* Incident Types */}
          <div className="ui-card" style={{ padding: '1.5rem' }}>
            <h2 className="font-bold text-base mb-4" style={{ color: 'var(--text)' }}>Incident Types Covered</h2>
            <div className="flex flex-wrap gap-2">
              {INCIDENT_TYPES_REF.map((t) => (
                <span
                  key={t}
                  className="text-xs font-medium px-3 py-1.5 rounded-full"
                  style={{ background: 'color-mix(in srgb,#ef4444 10%,transparent)', color: '#ef4444', border: '1px solid color-mix(in srgb,#ef4444 25%,transparent)' }}
                >
                  {t}
                </span>
              ))}
            </div>
          </div>

          {/* Best Practices */}
          <div className="ui-card" style={{ padding: '1.5rem' }}>
            <h2 className="font-bold text-base mb-4" style={{ color: 'var(--text)' }}>Best Practices</h2>
            <ul className="space-y-3">
              {TIPS.map(({ title, body }) => (
                <li key={title} className="flex gap-3">
                  <span
                    className="flex-shrink-0 mt-1 rounded-full"
                    style={{ width: 8, height: 8, background: '#ef4444', marginTop: 6 }}
                  />
                  <div>
                    <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{title}: </span>
                    <span className="text-sm" style={{ color: 'var(--text-muted)' }}>{body}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}