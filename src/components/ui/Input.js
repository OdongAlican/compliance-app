import React from 'react';
import { cn } from '../../utils/cn';

export const Input = React.forwardRef(function Input(
  { label, hint, error, className, inputClassName, id, required, prefix, suffix, ...props },
  ref
) {
  const inputId = id ?? props.name;

  return (
    <div className={cn('block', className)}>
      {label ? (
        <label htmlFor={inputId} className="ui-label">
          {label}
          {required && <span style={{ color: 'var(--danger)' }} className="ml-0.5">*</span>}
        </label>
      ) : null}
      <div className="relative">
        {prefix && (
          <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none" style={{ color: 'var(--text-muted)' }}>
            {prefix}
          </div>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'ui-input',
            prefix && 'pl-9',
            suffix && 'pr-9',
            error && 'border-[color:var(--danger)]',
            inputClassName
          )}
          aria-invalid={!!error}
          {...props}
        />
        {suffix && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3.5 pointer-events-none" style={{ color: 'var(--text-muted)' }}>
            {suffix}
          </div>
        )}
      </div>
      {error
        ? <span className="ui-error flex items-center gap-1 mt-1.5">{error}</span>
        : hint
        ? <span className="ui-hint mt-1.5">{hint}</span>
        : null}
    </div>
  );
});
