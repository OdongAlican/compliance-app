import React from 'react';
import { cn } from '../../utils/cn';

export function Card({ className, elevated, ...props }) {
  return (
    <div
      className={cn('ui-card', className)}
      style={elevated ? { background: 'var(--bg-raised)' } : undefined}
      {...props}
    />
  );
}

export function CardHeader({ className, title, subtitle, action, ...props }) {
  if (title || subtitle || action) {
    return (
      <div className={cn('ui-card-header', className)} {...props}>
        <div>
          {title && <h2 className="ui-title text-lg">{title}</h2>}
          {subtitle && <p className="ui-subtitle mt-0.5">{subtitle}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    );
  }
  return <div className={cn('ui-card-header', className)} {...props} />;
}

export function CardBody({ className, ...props }) {
  return <div className={cn('ui-card-body', className)} {...props} />;
}

export function StatCard({ title, value, icon, trend, color = 'blue', className, ...props }) {
  const colors = {
    blue:   { bg: 'rgba(37,99,235,0.15)',  text: 'var(--accent)' },
    green:  { bg: 'rgba(22,163,74,0.15)',  text: 'var(--success)' },
    amber:  { bg: 'rgba(217,119,6,0.15)',  text: 'var(--warning)' },
    red:    { bg: 'rgba(220,38,38,0.15)',  text: 'var(--danger)' },
    purple: { bg: 'rgba(124,58,237,0.15)', text: '#a78bfa' },
    teal:   { bg: 'rgba(13,148,136,0.15)', text: '#2dd4bf' },
  };
  const c = colors[color] || colors.blue;
  return (
    <div className={cn('ui-stat', className)} {...props}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p style={{ color: 'var(--text-muted)' }} className="text-xs font-semibold uppercase tracking-wider mb-1">{title}</p>
          <p style={{ color: 'var(--text)' }} className="text-2xl font-bold leading-tight">{value}</p>
          {trend && <p style={{ color: trend.dir === 'up' ? 'var(--success)' : 'var(--danger)' }} className="text-xs mt-1 font-medium">{trend.label}</p>}
        </div>
        {icon && (
          <div style={{ background: c.bg, color: c.text }} className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
