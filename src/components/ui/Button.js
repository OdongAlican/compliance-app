import React from 'react';
import { cn } from '../../utils/cn';

const VARIANTS = {
  primary: 'ui-btn ui-btn-primary',
  outline: 'ui-btn ui-btn-outline',
  ghost:   'ui-btn ui-btn-ghost',
  danger:  'ui-btn ui-btn-danger',
  success: 'ui-btn ui-btn-success',
};

const SIZES = {
  xs: 'px-2.5 py-1 text-xs',
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2.5 text-sm',
  lg: 'px-5 py-3 text-base',
};

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  type,
  icon,
  children,
  loading,
  ...props
}) {
  return (
    <button
      type={type ?? 'button'}
      className={cn(VARIANTS[variant] ?? VARIANTS.primary, SIZES[size] ?? SIZES.md, className)}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : icon ? (
        <span className="shrink-0">{icon}</span>
      ) : null}
      {children}
    </button>
  );
}
