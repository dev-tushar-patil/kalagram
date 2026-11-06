import { useId } from 'react';

/** A labelled form control with its error wired up for screen readers. */
export default function Field({ label, error, required, hint, as = 'input', children, className = '', ...props }) {
  const id = useId();
  const Control = as;
  const errorId = `${id}-error`;
  return (
    <div className={`field ${error ? 'has-error' : ''} ${className}`}>
      <label htmlFor={id}>
        {label}
        {required && <span className="required" aria-hidden="true"> *</span>}
      </label>
      <Control
        id={id}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        {...props}
      >
        {children}
      </Control>
      {hint && !error && <small className="field-hint">{hint}</small>}
      {error && <small id={errorId} className="field-error">{error}</small>}
    </div>
  );
}
