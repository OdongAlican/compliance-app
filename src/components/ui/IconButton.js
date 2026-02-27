import React from 'react';
import { cn } from '../../utils/cn';

export function IconButton({ className, type, ...props }) {
  return (
    <button
      type={type ?? 'button'}
      className={cn(
        'inline-flex h-9 w-9 items-center justify-center rounded-lg',
        'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
        'transition-colors focus-visible:outline-none',
        className
      )}
      {...props}
    />
  );
}
