import React from 'react';
import { FaClipboardCheck, FaShieldAlt, FaFireExtinguisher, FaUserCheck, FaTools, FaFlask, FaSwimmingPool, FaCar, FaArrowRight } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const inspections = [
  { title: 'Canteen Inspection',                      formPath: '/form/canteen',          icon: FaUserCheck,       color: 'blue' },
  { title: 'Fuel Storage Tank Inspection',            formPath: '/form/fuel',             icon: FaFireExtinguisher, color: 'amber' },
  { title: 'Hand & Power Tool Inspection',            formPath: '/form/tool',             icon: FaTools,            color: 'green' },
  { title: 'PPE Inspection Form',                     formPath: '/form/ppe',              icon: FaShieldAlt,        color: 'purple' },
  { title: 'Science Laboratory Inspection',           formPath: '/form/science-laboratory', icon: FaFlask,          color: 'teal' },
  { title: 'Swimming Pool Inspection',                formPath: '/form/swimming-pool',    icon: FaSwimmingPool,     color: 'blue' },
  { title: 'Vehicle Inspection Form',                 formPath: '/form/vehicle',          icon: FaCar,              color: 'red' },
];

const COLORS = {
  blue:   { bg: 'rgba(37,99,235,.15)',  color: '#2563eb' },
  amber:  { bg: 'rgba(217,119,6,.15)',  color: '#d97706' },
  green:  { bg: 'rgba(22,163,74,.15)',  color: '#16a34a' },
  purple: { bg: 'rgba(124,58,237,.15)', color: '#7c3aed' },
  teal:   { bg: 'rgba(13,148,136,.15)', color: '#0d9488' },
  red:    { bg: 'rgba(220,38,38,.15)',  color: '#dc2626' },
};

export default function InspectionDashboard() {
  const navigate = useNavigate();

  return (
    <div className="space-y-8 pb-8">
      {/* Header */}
      <div>
        <h1 style={{ color: 'var(--text)' }} className="text-2xl font-bold mb-1">Inspection Forms</h1>
        <p style={{ color: 'var(--text-muted)' }} className="text-sm">Access and complete all safety and compliance inspections. Click a card to begin.</p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {inspections.map((item, idx) => {
          const Icon = item.icon || FaClipboardCheck;
          const c = COLORS[item.color] || COLORS.blue;
          return (
            <button
              key={idx}
              onClick={() => navigate(item.formPath)}
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', textAlign: 'left' }}
              className="group rounded-2xl p-6 flex flex-col gap-4 hover:shadow-[var(--shadow-md)] hover:translate-y-[-2px] transition-all duration-200 cursor-pointer"
            >
              <div style={{ background: c.bg, color: c.color }} className="w-12 h-12 rounded-xl flex items-center justify-center">
                <Icon size={22} />
              </div>
              <div className="flex-1">
                <h2 style={{ color: 'var(--text)' }} className="text-base font-semibold leading-tight mb-1">{item.title}</h2>
                <p style={{ color: 'var(--text-muted)' }} className="text-xs">Inspection Form</p>
              </div>
              <div className="flex items-center gap-2">
                <span style={{ background: c.bg, color: c.color }} className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full">Inspection</span>
                <FaArrowRight style={{ color: c.color }} size={12} className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
