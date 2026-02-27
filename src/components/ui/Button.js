import React from 'react';
import { cn } from '../../utils/cn';

const VARIANTS = {
  primary: 'ui-btn ui-btn-primary',
  outline: 'ui-btn ui-btn-outline',
  ghost: 'ui-btn ui-btn-ghost',
  danger: 'ui-btn ui-btn-danger',
};

const SIZES = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-4 py-2.5 text-base',
};

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  type,
  ...props
}) {
  return (
    <button
      type={type ?? 'button'}
      className={cn(VARIANTS[variant] ?? VARIANTS.primary, SIZES[size] ?? SIZES.md, className)}
      {...props}
    />
  );
}
