import { AlertCircle, Check, Plus, Trash2 } from "lucide-react";
import { useId } from "react";
import { useLang, useT } from "../../context/LanguageContext.jsx";
import { digits, optLabel } from "../../lib/award.js";

export function ErrorText({ children, id }) {
  if (!children) return null;
  return <span className="field__error" id={id}><AlertCircle size={14} aria-hidden="true" />{children}</span>;
}

// Textarea with a live character counter
export function LongText({ id, value, onChange, max, min, rows = 5, ...rest }) {
  const t = useT();
  const { lang } = useLang();
  const n = value?.length ?? 0;
  return (
    <div className="aw-longtext">
      <textarea id={id} className="textarea" rows={rows} value={value ?? ""} onChange={onChange} maxLength={max} {...rest} />
      <span className={`aw-count ${min && n > 0 && n < min ? "is-short" : ""}`} aria-live="polite">
        {digits(lang, n)}/{digits(lang, max)}{min ? ` · ${t("min", "किमान")} ${digits(lang, min)}` : ""}
      </span>
    </div>
  );
}

// Multi-select rendered as accessible checkbox chips
export function CheckGroup({ legend, required, options, value, onChange, error, hint, name }) {
  const id = useId();
  const { lang } = useLang();
  const toggle = (v) => onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);
  return (
    <fieldset className="aw-checks" aria-describedby={error ? `${id}-err` : hint ? `${id}-hint` : undefined} data-field={name}>
      <legend className="field__label">{legend}{required && <span className="req" aria-hidden="true">*</span>}</legend>
      {hint && <span className="field__hint" id={`${id}-hint`}>{hint}</span>}
      <div className="aw-checks__list">
        {options.map((o) => {
          const checked = value.includes(o.value);
          return (
            <label key={o.value} className={`aw-check ${checked ? "is-checked" : ""}`}>
              <input type="checkbox" checked={checked} onChange={() => toggle(o.value)} aria-invalid={error ? true : undefined} />
              <span className="aw-check__box" aria-hidden="true">{checked && <Check size={13} strokeWidth={3} />}</span>
              <span>{optLabel(lang, o)}</span>
            </label>
          );
        })}
      </div>
      <ErrorText id={`${id}-err`}>{error}</ErrorText>
    </fieldset>
  );
}

/**
 * Add More / Remove table for repeatable entries.
 * columns: [{ key, label, type?: 'text'|'number'|'textarea'|'email'|'tel', required?, max?, placeholder?, span? }]
 */
export function Repeater({ title, hint, columns, rows, onChange, errors = {}, name, max = 20, min = 0, empty, addLabel, blank }) {
  const t = useT();
  const { lang } = useLang();
  const set = (i, key, v) => onChange(rows.map((r, j) => (j === i ? { ...r, [key]: v } : r)));
  const add = () => onChange([...rows, blank ?? Object.fromEntries(columns.map((c) => [c.key, ""]))]);
  const remove = (i) => onChange(rows.filter((_, j) => j !== i));
  return (
    <section className="aw-repeater" data-field={name} aria-label={typeof title === "string" ? title : undefined}>
      <header className="aw-repeater__head">
        <div>
          <h3 className="aw-repeater__title">{title}</h3>
          {hint && <p className="field__hint">{hint}</p>}
        </div>
        <span className="aw-repeater__count">{digits(lang, rows.length)}/{digits(lang, max)}</span>
      </header>
      {errors[name] && <ErrorText>{errors[name]}</ErrorText>}
      {rows.length === 0 && <p className="aw-repeater__empty">{empty}</p>}
      <ol className="aw-repeater__list">
        {rows.map((row, i) => (
          <li key={i} className="aw-repeater__row">
            <div className="aw-repeater__row-head">
              <span className="aw-repeater__no">{digits(lang, i + 1)}</span>
              <button type="button" className="btn btn--outline btn--sm" onClick={() => remove(i)} disabled={rows.length <= min}
                aria-label={t(`Remove entry ${i + 1}`, `नोंद ${digits(lang, i + 1)} काढा`)}>
                <Trash2 aria-hidden="true" /> {t("Remove", "काढा")}
              </button>
            </div>
            <div className="form-grid form-grid--2">
              {columns.map((c) => {
                const fid = `${name}-${i}-${c.key}`;
                const err = errors[`${name}.${i}.${c.key}`];
                const common = {
                  id: fid, value: row[c.key] ?? "", "aria-invalid": err ? true : undefined,
                  "aria-describedby": err ? `${fid}-err` : undefined, required: c.required, placeholder: c.placeholder,
                  onChange: (e) => set(i, c.key, c.type === "tel" ? e.target.value.replace(/\D/g, "").slice(0, 10) : e.target.value),
                };
                return (
                  <div key={c.key} className={`field ${c.span || c.type === "textarea" ? "span-2" : ""}`} data-field={`${name}.${i}.${c.key}`}>
                    <label className="field__label" htmlFor={fid}>{c.label}{c.required && <span className="req" aria-hidden="true">*</span>}</label>
                    {c.type === "textarea"
                      ? <textarea {...common} className="textarea" rows={3} maxLength={c.max ?? 2000} />
                      : <input {...common} className="input" type={c.type === "number" ? "number" : c.type === "email" ? "email" : c.type === "tel" ? "tel" : "text"}
                          inputMode={c.type === "number" || c.type === "tel" ? "numeric" : undefined} maxLength={c.max ?? 250} min={c.type === "number" ? 0 : undefined} />}
                    <ErrorText id={`${fid}-err`}>{err}</ErrorText>
                  </div>
                );
              })}
            </div>
          </li>
        ))}
      </ol>
      {rows.length < max && (
        <button type="button" className="btn btn--outline aw-repeater__add" onClick={add}>
          <Plus aria-hidden="true" /> {addLabel ?? t("Add more", "आणखी जोडा")}
        </button>
      )}
    </section>
  );
}
