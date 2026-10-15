import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, Check, ChevronDown } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

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

export function CustomSelect({
  id, value, onValueChange, disabled, options, placeholder,
  "aria-invalid": invalid, "aria-describedby": describedBy, required,
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const selected = options.find((o) => String(o.value) === String(value));

  useEffect(() => {
    if (!open) return;
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", close); document.removeEventListener("keydown", onKey); };
  }, [open]);

  return (
    <div
      ref={ref}
      className={["cselect", open && "is-open", disabled && "is-disabled", invalid && "has-error"].filter(Boolean).join(" ")}
    >
      <button
        type="button"
        id={id}
        className="cselect__trigger"
        onClick={() => !disabled && setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-describedby={describedBy}
        aria-required={required}
        aria-invalid={invalid}
        disabled={disabled}
      >
        <span className={selected ? "cselect__value" : "cselect__placeholder"}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown className="cselect__chevron" size={18} aria-hidden="true" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.ul
            className="cselect__menu"
            role="listbox"
            aria-label={placeholder}
            initial={{ opacity: 0, y: -6, scaleY: 0.94 }}
            animate={{ opacity: 1, y: 0, scaleY: 1 }}
            exit={{ opacity: 0, y: -6, scaleY: 0.94 }}
            transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
            style={{ transformOrigin: "top" }}
            onWheel={(e) => e.stopPropagation()}
          >
            {options.map((opt) => (
              <li
                key={opt.value}
                role="option"
                aria-selected={String(opt.value) === String(value)}
                className={`cselect__option${String(opt.value) === String(value) ? " is-selected" : ""}`}
                onMouseDown={() => { onValueChange(opt.value); setOpen(false); }}
              >
                <span>{opt.label}</span>
                {String(opt.value) === String(value) && <Check size={14} aria-hidden="true" />}
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

export const digitsOnly = (value, max) =>
  value.replace(/[^\d०-९]/g, "").replace(/[०-९]/g, (d) => "०१२३४५६७८९".indexOf(d)).slice(0, max);
