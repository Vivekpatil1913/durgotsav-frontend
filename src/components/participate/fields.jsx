import { AlertCircle } from "lucide-react";
import { useId } from "react";

// Labelled form controls with hint + error wiring (aria-describedby / aria-invalid).
export function Field({ label, required, hint, error, children, className = "" }) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errId = error ? `${id}-err` : undefined;
  const control = children({ id, "aria-invalid": error ? true : undefined, "aria-describedby": [hintId, errId].filter(Boolean).join(" ") || undefined, required });
  return (
    <div className={`field ${className}`}>
      <label className="field__label" htmlFor={id}>
        {label}
        {required && <span className="req" aria-hidden="true">*</span>}
      </label>
      {control}
      {hint && <span className="field__hint" id={hintId}>{hint}</span>}
      {error && <span className="field__error" id={errId}><AlertCircle size={14} aria-hidden="true" />{error}</span>}
    </div>
  );
}

export const digitsOnly = (value, max) => value.replace(/[^\d०-९]/g, "").replace(/[०-९]/g, (d) => "०१२३४५६७८९".indexOf(d)).slice(0, max);
