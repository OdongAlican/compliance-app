import React from 'react';
import { cn } from '../../utils/cn';

const VARIANTS = {
  neutral: { background: 'color-mix(in srgb, var(--text-muted) 18%, transparent)', color: 'var(--text-muted)' },
  info:    { background: 'color-mix(in srgb, var(--accent)    18%, transparent)', color: 'var(--accent)' },
  success: { background: 'color-mix(in srgb, var(--success)   18%, transparent)', color: 'var(--success)' },
  warning: { background: 'color-mix(in srgb, var(--warning)   18%, transparent)', color: 'var(--warning)' },
  danger:  { background: 'color-mix(in srgb, var(--danger)    18%, transparent)', color: 'var(--danger)' },
};

export function Badge({ variant = 'neutral', className, dot, ...props }) {
  const style = VARIANTS[variant] || VARIANTS.neutral;
  return (
    <span
      className={cn('ui-badge', className)}
      style={style}
      {...props}
    >
      {dot && (
        <span
          className="w-1.5 h-1.5 rounded-full mr-1.5 inline-block"
          style={{ background: style.color }}
        />
      )}
      {props.children}
    </span>
  );
}
