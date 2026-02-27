import React from 'react';
import { cn } from '../../utils/cn';

export const Select = React.forwardRef(function Select(
  { label, hint, error, className, selectClassName, id, children, ...props },
  ref
) {
  const selectId = id ?? props.name;

  return (
    <label className={cn('block', className)} htmlFor={selectId}>
      {label ? <span className="ui-label">{label}</span> : null}
      <select
        ref={ref}
        id={selectId}
        className={cn(
          'ui-select',
          error && 'border-red-300 focus:border-red-500 focus:ring-red-200',
          selectClassName
        )}
        {...props}
      >
        {children}
      </select>
      {error ? <span className="ui-error">{error}</span> : hint ? <span className="ui-hint">{hint}</span> : null}
    </label>
  );
});
