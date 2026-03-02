import React from 'react';
import {
  FaClipboardList, FaHardHat, FaFirstAid, FaFire, FaListAlt, FaUsers, FaHistory, FaArrowRight,
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const items = [
  { title: 'Checklist',                formPath: '/form/checklist',  icon: FaClipboardList, color: 'blue' },
  { title: 'Workplace Inspection',     formPath: '/form/workplace',  icon: FaHardHat,       color: 'amber' },
  { title: 'Emergency Preparedness',   formPath: '/form/emergency',  icon: FaFire,          color: 'red' },
  { title: 'PPE Compliance',           formPath: '/form/ppe-com',    icon: FaFirstAid,      color: 'purple' },
  { title: 'CAPA Tracking',            formPath: '/form/capa',       icon: FaListAlt,       color: 'teal' },
  { title: 'Management Review Meeting',formPath: '/form/management', icon: FaUsers,         color: 'green' },
  { title: 'Recent Audit',             formPath: '/form/audit',      icon: FaHistory,       color: 'blue' },
];

const COLORS = {
  blue:   { bg: 'rgba(37,99,235,.15)',  color: '#2563eb' },
  amber:  { bg: 'rgba(217,119,6,.15)',  color: '#d97706' },
  red:    { bg: 'rgba(220,38,38,.15)',  color: '#dc2626' },
  purple: { bg: 'rgba(124,58,237,.15)', color: '#7c3aed' },
  teal:   { bg: 'rgba(13,148,136,.15)', color: '#0d9488' },
  green:  { bg: 'rgba(22,163,74,.15)',  color: '#16a34a' },
};

export default function HealthAndSafetyDashboard() {
  const navigate = useNavigate();

  return (
    <div className="space-y-8 pb-8">
      <div>
        <h1 style={{ color: 'var(--text)' }} className="text-2xl font-bold mb-1">Health & Safety Audit</h1>
        <p style={{ color: 'var(--text-muted)' }} className="text-sm">Manage all health and safety compliance forms. Click a card to begin.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {items.map((item, idx) => {
          const Icon = item.icon;
          const c = COLORS[item.color] || COLORS.blue;
          return (
            <button
              key={idx}
              onClick={() => navigate(item.formPath)}
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', textAlign: 'left' }}
              className="group rounded-2xl p-6 flex flex-col gap-4 hover:shadow-[var(--shadow-md)] hover:translate-y-[-2px] transition-all duration-200 cursor-pointer w-full"
            >
              <div style={{ background: c.bg, color: c.color }} className="w-12 h-12 rounded-xl flex items-center justify-center">
                <Icon size={22} />
              </div>
              <div className="flex-1">
                <h2 style={{ color: 'var(--text)' }} className="text-base font-semibold leading-tight mb-1">{item.title}</h2>
                <p style={{ color: 'var(--text-muted)' }} className="text-xs">Health & Safety</p>
              </div>
              <div className="flex items-center">
                <span style={{ background: c.bg, color: c.color }} className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full">Audit Form</span>
                <FaArrowRight style={{ color: c.color }} size={12} className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
