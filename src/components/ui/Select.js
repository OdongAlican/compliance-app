import React from 'react';
import { cn } from '../../utils/cn';

export const Select = React.forwardRef(function Select(
  { label, hint, error, className, selectClassName, id, children, required, ...props },
  ref
) {
  const selectId = id ?? props.name;

  return (
    <div className={cn('block', className)}>
      {label ? (
        <label htmlFor={selectId} className="ui-label">
          {label}
          {required && <span style={{ color: 'var(--danger)' }} className="ml-0.5">*</span>}
        </label>
      ) : null}
      <select
        ref={ref}
        id={selectId}
        className={cn(
          'ui-select',
          error && 'border-[color:var(--danger)]',
          selectClassName
        )}
        aria-invalid={!!error}
        {...props}
      >
        {children}
      </select>
      {error
        ? <span className="ui-error mt-1.5">{error}</span>
        : hint
        ? <span className="ui-hint mt-1.5">{hint}</span>
        : null}
    </div>
  );
});
