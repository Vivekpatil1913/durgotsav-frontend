import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, ImageOff } from "lucide-react";
import { useLang, useT } from "../../context/LanguageContext.jsx";
import { mr } from "../../lib/format.js";
import { Mandala } from "./Ornament.jsx";
import { Reveal } from "./Reveal.jsx";

export function PageHero({ eyebrow, title, lead, crumbs = [], children }) {
  const t = useT();
  return (
    <section className="page-hero">
      <div className="page-hero__ornament" aria-hidden="true"><Mandala spin /></div>
      <div className="container">
        <nav aria-label="breadcrumb">
          <ol className="breadcrumbs">
            <li><Link to="/">{t("Home", "मुख्य पृष्ठ")}</Link></li>
            {crumbs.map(([to, label]) => <li key={to}><Link to={to}>{label}</Link></li>)}
            <li aria-current="page">{title}</li>
          </ol>
        </nav>
        <Reveal className="stack">
          {eyebrow && <span className="eyebrow">{eyebrow}</span>}
          <h1>{title}</h1>
          {lead && <p>{lead}</p>}
          {children}
        </Reveal>
      </div>
    </section>
  );
}

export function EmptyState({ icon: Icon = ImageOff, title, children }) {
  return (
    <div className="empty" role="status">
      <Icon aria-hidden="true" />
      <h3>{title}</h3>
      {children && <p>{children}</p>}
    </div>
  );
}

export function ErrorState({ error, onRetry }) {
  const t = useT();
  return (
    <div className="empty" role="alert">
      <h3>{t("Failed to load content", "माहिती लोड करता आली नाही")}</h3>
      <p>{error?.message}</p>
      {onRetry && <button type="button" className="btn btn--ghost btn--sm" onClick={onRetry}>{t("Try again", "पुन्हा प्रयत्न करा")}</button>}
    </div>
  );
}

// Numbered pagination with ellipses: 1 … 4 5 [6] 7 8 … 20
export function Pagination({ page, totalPages, onChange }) {
  const { lang } = useLang();
  const t = useT();
  if (totalPages <= 1) return null;
  const fmt = (n) => lang === "mr" ? mr(n) : String(n);
  const pages = [];
  for (let p = 1; p <= totalPages; p++) {
    if (p === 1 || p === totalPages || Math.abs(p - page) <= 2) pages.push(p);
    else if (pages[pages.length - 1] !== "…") pages.push("…");
  }
  return (
    <nav className="pagination" aria-label={t("Pages", "पृष्ठे")}>
      <button type="button" onClick={() => onChange(page - 1)} disabled={page <= 1} aria-label={t("Previous page", "मागील पृष्ठ")}><ChevronLeft size={18} /></button>
      {pages.map((p, i) =>
        p === "…" ? <span key={`e${i}`} aria-hidden="true">…</span> : (
          <button type="button" key={p} onClick={() => onChange(p)} aria-current={p === page ? "page" : undefined} aria-label={`${t("Page", "पृष्ठ")} ${fmt(p)}`}>
            {fmt(p)}
          </button>
        ),
      )}
      <button type="button" onClick={() => onChange(page + 1)} disabled={page >= totalPages} aria-label={t("Next page", "पुढील पृष्ठ")}><ChevronRight size={18} /></button>
    </nav>
  );
}

export function SkeletonGrid({ count = 8, ratio = "1 / 1" }) {
  const t = useT();
  return (
    <div className="grid grid--4" aria-busy="true" aria-label={t("Loading", "लोड होत आहे")}>
      {Array.from({ length: count }, (_, i) => <div key={i} className="skeleton" style={{ aspectRatio: ratio }} />)}
    </div>
  );
}
