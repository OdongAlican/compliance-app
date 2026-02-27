import React from 'react';
import { cn } from '../../utils/cn';

const VARIANTS = {
  neutral: 'ui-badge bg-gray-100 text-gray-800',
  info: 'ui-badge bg-blue-100 text-blue-700',
  success: 'ui-badge bg-green-100 text-green-700',
  warning: 'ui-badge bg-yellow-100 text-yellow-800',
  danger: 'ui-badge bg-red-100 text-red-700',
};

export function Badge({ variant = 'neutral', className, ...props }) {
  return <span className={cn(VARIANTS[variant] ?? VARIANTS.neutral, className)} {...props} />;
}
