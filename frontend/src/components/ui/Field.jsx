import { cloneElement, useId } from 'react';
import './Field.css';

export default function Field({ label, required = false, hint, error, children }) {
  const id = useId();
  const moTa = [hint && id + '-hint', error && id + '-error'].filter(Boolean).join(' ') || undefined;
  const control = cloneElement(children, {
    id: children.props.id || id,
    required,
    'aria-required': required || undefined,
    'aria-invalid': Boolean(error) || undefined,
    'aria-describedby': moTa,
  });
  return (
    <div className="field">
      <label htmlFor={children.props.id || id} className="fieldLabel">{label}{required && <span className="fieldRequired" aria-hidden="true"> *</span>}</label>
      {control}
      {hint && <p className="fieldHint" id={id + '-hint'}>{hint}</p>}
      {error && <p className="fieldError" id={id + '-error'}>{error}</p>}
    </div>
  );
}
