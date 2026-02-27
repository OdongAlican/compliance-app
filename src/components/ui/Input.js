import React from 'react';
import { cn } from '../../utils/cn';

export const Input = React.forwardRef(function Input(
  { label, hint, error, className, inputClassName, id, ...props },
  ref
) {
  const inputId = id ?? props.name;

  return (
    <label className={cn('block', className)} htmlFor={inputId}>
      {label ? <span className="ui-label">{label}</span> : null}
      <input
        ref={ref}
        id={inputId}
        className={cn(
          'ui-input',
          error && 'border-red-300 focus:border-red-500 focus:ring-red-200',
          inputClassName
        )}
        {...props}
      />
      {error ? <span className="ui-error">{error}</span> : hint ? <span className="ui-hint">{hint}</span> : null}
    </label>
  );
});
