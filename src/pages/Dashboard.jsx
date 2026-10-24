import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertCircle, Award, CheckCircle2, ChevronDown, ChevronUp,
  ChevronsUpDown, Clock, Filter, Loader2, MapPin, RefreshCw,
  TrendingUp, Upload, Users, XCircle,
} from "lucide-react";
import { Seo } from "../components/seo/Seo.jsx";
import { ErrorState, PageHero, Pagination } from "../components/ui/PageParts.jsx";
import { EDITION_YEAR, EDITION_YEAR_MR } from "../config/edition.js";
import { useLang, useT } from "../context/LanguageContext.jsx";
import { http, toApiError } from "../lib/api.js";
import { mrNumber } from "../lib/format.js";
import "./pages.css";
import "./dashboard.css";

// ---------------------------------------------------------------- helpers

/** Format large numbers: show lakhs/crores for English, Marathi numerals for mr */
function fmtBig(n, lang) {
  if (n == null) return "—";
  const num = Number(n) || 0;
  if (lang === "mr") return mrNumber(num);
  if (num >= 10_000_000) return `${(num / 10_000_000).toFixed(2)} Cr`;
  if (num >= 100_000)    return `${(num / 100_000).toFixed(2)} L`;
  return new Intl.NumberFormat("en-IN").format(num);
}

function timeSince(date) {
  if (!date) return "";
  const s = Math.floor((Date.now() - date.getTime()) / 1000);
  if (s < 60)   return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  return `${Math.floor(s / 3600)}h ago`;
}

// ---------------------------------------------------------------- useStale
// Hits the API directly (no shared cache) and auto-refreshes every `intervalMs`.
// Designed for aggregated stats where freshness matters more than deduplication.
function useStale(url, params, intervalMs = 300_000) {
  const [state, setState] = useState({ data: null, loading: true, error: null, updatedAt: null });
  const paramsKey = JSON.stringify(params || {});

  const fetch = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const res = await http.get(url, params ? { params } : undefined);
      const payload = res.data?.data ?? res.data;
      setState({ data: payload, loading: false, error: null, updatedAt: new Date() });
    } catch (err) {
      const e = toApiError(err);
      if (!e.canceled) setState((s) => ({ ...s, loading: false, error: e }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, paramsKey]);

  useEffect(() => {
    fetch();
    const id = setInterval(fetch, intervalMs);
    return () => clearInterval(id);
  }, [fetch, intervalMs]);

  return { ...state, refresh: fetch };
}

// ---------------------------------------------------------------- StatCard
function StatCard({ icon: Icon, tone, label, value, sub, loading }) {
  return (
    <div className={`dash-stat dash-stat--${tone || "default"}`}>
      <div className="dash-stat__icon">
        <Icon size={26} aria-hidden="true" />
      </div>
      <div className="dash-stat__body">
        <div className="dash-stat__value">
          {loading ? <span className="skeleton-line" /> : value}
        </div>
        <div className="dash-stat__label">{label}</div>
        {sub && <div className="dash-stat__sub">{sub}</div>}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- ReviewPipeline
function ReviewPipeline({ reviews, lang, t }) {
  if (!reviews) return null;
  const stages = [
    { key: "verified",       icon: CheckCircle2, tone: "success", label: t("Verified",           "पडताळणी पूर्ण"),      count: reviews.verified       || 0 },
    { key: "pending",        icon: Clock,        tone: "warning", label: t("Pending",             "प्रलंबित"),           count: reviews.pending        || 0 },
    { key: "info_requested", icon: AlertCircle,  tone: "warning", label: t("Info Requested",      "अतिरिक्त माहिती"),   count: reviews.info_requested || 0 },
    { key: "rejected",       icon: XCircle,      tone: "danger",  label: t("Rejected",            "नाकारलेले"),          count: reviews.rejected       || 0 },
  ];
  const total = stages.reduce((s, r) => s + r.count, 0);
  if (!total) return null;
  const pct = (n) => (total ? Math.max(Math.round((n / total) * 100), n > 0 ? 1 : 0) : 0);

  return (
    <div className="dash-pipeline">
      <p className="dash-pipeline__title">{t("Review Pipeline", "पडताळणी प्रक्रिया")}</p>
      <div className="dash-pipeline__bar" aria-hidden="true">
        {stages.filter((s) => s.count > 0).map((s) => (
          <div key={s.key} className={`dash-pipeline__seg dash-pipeline__seg--${s.tone}`} style={{ width: `${pct(s.count)}%` }} />
        ))}
      </div>
      <div className="dash-pipeline__legend">
        {stages.map(({ key, icon: Icon, tone, label, count }) => (
          <div key={key} className={`dash-pipeline__item dash-pipeline__item--${tone}`}>
            <Icon size={13} aria-hidden="true" />
            <span className="dash-pipeline__lbl">{label}</span>
            <strong className="dash-pipeline__cnt">{fmtBig(count, lang)}</strong>
            <span className="dash-pipeline__pct">({pct(count)}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- SummaryBand
function SummaryBand() {
  const t = useT();
  const { lang } = useLang();
  const { data, loading, error, refresh, updatedAt } = useStale("/dashboard/summary");

  // Tick every 15 s so "Xs ago" updates without a full refetch
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((n) => n + 1), 15_000);
    return () => clearInterval(id);
  }, []);

  const s = data || {};
  const fmt = (n) => (loading && !data ? null : fmtBig(n, lang));

  return (
    <div className="stack" style={{ gap: "var(--space-5)" }}>
      <div className="dash-row-header">
        <h2 className="dash-section-title">
          <TrendingUp size={19} aria-hidden="true" />
          {t("Live Statistics", "थेट आकडेवारी")}
        </h2>
        <div className="dash-refresh">
          {updatedAt && (
            <span className="dash-refresh__time">
              {t("Updated", "अद्ययावत")} {timeSince(updatedAt)}
            </span>
          )}
          <button type="button" className="btn btn--outline btn--sm" onClick={refresh} disabled={loading} aria-label={t("Refresh", "ताजे करा")}>
            <RefreshCw size={14} className={loading ? "spin" : ""} aria-hidden="true" />
            {t("Refresh", "ताजे करा")}
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert--error" role="alert">
          <AlertCircle size={16} aria-hidden="true" />
          <span>{error.message}</span>
        </div>
      )}

      <div className="dash-stats-grid">
        <StatCard
          icon={Users} tone="saffron"
          label={t("Total Registrations", "एकूण नोंदणी")}
          value={fmt(s.registrations?.total)}
          sub={s.registrations?.today
            ? t(`+${fmtBig(s.registrations.today, lang)} today`, `+${fmtBig(s.registrations.today, lang)} आज`)
            : null}
          loading={loading && !data}
        />
        <StatCard
          icon={Upload} tone="bronze"
          label={t("Photos Uploaded", "छायाचित्रे अपलोड")}
          value={fmt(s.uploads?.total)}
          sub={s.uploads?.pending_review
            ? t(`${fmtBig(s.uploads.pending_review, lang)} pending review`, `${fmtBig(s.uploads.pending_review, lang)} पडताळणी प्रलंबित`)
            : null}
          loading={loading && !data}
        />
        <StatCard
          icon={CheckCircle2} tone="success"
          label={t("Verified", "पडताळणी पूर्ण")}
          value={fmt(s.reviews?.verified)}
          sub={s.reviews?.pending
            ? t(`${fmtBig(s.reviews.pending, lang)} pending`, `${fmtBig(s.reviews.pending, lang)} प्रलंबित`)
            : null}
          loading={loading && !data}
        />
        <StatCard
          icon={Award} tone="gold"
          label={t("Certificates Issued", "अभिनंदन पत्रे जारी")}
          value={fmt(s.certificates?.issued)}
          loading={loading && !data}
        />
      </div>

      {data && <ReviewPipeline reviews={s.reviews} lang={lang} t={t} />}
    </div>
  );
}

// ---------------------------------------------------------------- Sort helpers
function SortIcon({ col, sortKey, sortDir }) {
  if (sortKey !== col) return <ChevronsUpDown size={13} className="dash-sort-icon dash-sort-icon--inactive" aria-hidden="true" />;
  return sortDir === "asc"
    ? <ChevronUp   size={13} className="dash-sort-icon" aria-hidden="true" />
    : <ChevronDown size={13} className="dash-sort-icon" aria-hidden="true" />;
}

// ---------------------------------------------------------------- DistrictTable
const DIST_COLS = [
  { key: "district",      en: "District",      mr: "जिल्हा",         numeric: false },
  { key: "registrations", en: "Registrations", mr: "नोंदणी",         numeric: true  },
  { key: "uploaded",      en: "Uploaded",      mr: "अपलोड",          numeric: true  },
  { key: "verified",      en: "Verified",      mr: "पडताळणी पूर्ण", numeric: true  },
  { key: "certificates",  en: "Certificates",  mr: "अभिनंदन पत्रे", numeric: true  },
];

function DistrictTable() {
  const t   = useT();
  const { lang } = useLang();
  const { data, loading, error, refresh } = useStale("/dashboard/districts", null, 300_000);
  const [sortKey, setSortKey] = useState("registrations");
  const [sortDir, setSortDir] = useState("desc");
  const [search,  setSearch]  = useState("");

  const rows     = data || [];
  const filtered = search ? rows.filter((r) => (r.district || "").toLowerCase().includes(search.toLowerCase())) : rows;
  const sorted   = [...filtered].sort((a, b) => {
    const va = a[sortKey] ?? (typeof a[sortKey] === "string" ? "" : 0);
    const vb = b[sortKey] ?? (typeof b[sortKey] === "string" ? "" : 0);
    if (typeof va === "string") return sortDir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
    return sortDir === "asc" ? va - vb : vb - va;
  });

  function toggleSort(key) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("desc"); }
  }

  if (error) return <ErrorState error={error} onRetry={refresh} />;

  return (
    <div className="dash-table-wrap">
      <div className="dash-table-header">
        <h2 className="dash-section-title">
          <MapPin size={18} aria-hidden="true" />
          {t("District-wise Statistics", "जिल्हानिहाय आकडेवारी")}
          {sorted.length > 0 && <span className="dash-count-badge">{sorted.length}</span>}
        </h2>
        <div className="dash-search">
          <Filter size={13} aria-hidden="true" />
          <input
            className="input"
            placeholder={t("Search district…", "जिल्हा शोधा…")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label={t("Filter districts", "जिल्हे गाळा")}
          />
        </div>
      </div>

      <div className="table-scroll" role="region" aria-label={t("District statistics", "जिल्हानिहाय तक्ता")} tabIndex={0}>
        <table className="dash-table">
          <thead>
            <tr>
              {DIST_COLS.map(({ key, en, mr: mrLabel, numeric }) => (
                <th key={key} scope="col" className={numeric ? "dash-th--num" : ""}>
                  <button type="button" className="dash-th-btn" onClick={() => toggleSort(key)}
                    aria-sort={sortKey === key ? (sortDir === "asc" ? "ascending" : "descending") : "none"}>
                    {lang === "mr" ? mrLabel : en}
                    <SortIcon col={key} sortKey={sortKey} sortDir={sortDir} />
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && !data
              ? Array.from({ length: 8 }, (_, i) => (
                  <tr key={i} aria-hidden="true">
                    {DIST_COLS.map(({ key }) => (
                      <td key={key}><span className="skeleton-line" style={{ width: key === "district" ? 110 : 60 }} /></td>
                    ))}
                  </tr>
                ))
              : sorted.length === 0
              ? <tr><td colSpan={DIST_COLS.length} className="dash-empty">{t("No data found", "माहिती आढळली नाही")}</td></tr>
              : sorted.map((row) => (
                  <tr key={row.district || row.id}>
                    <td className="dash-td--name">{row.district || "—"}</td>
                    {DIST_COLS.slice(1).map(({ key }) => (
                      <td key={key} className="dash-td--num">{fmtBig(row[key], lang)}</td>
                    ))}
                  </tr>
                ))
            }
          </tbody>
          {sorted.length > 1 && !loading && (
            <tfoot>
              <tr>
                <td className="dash-td--name dash-td--total">{t("Total", "एकूण")}</td>
                {DIST_COLS.slice(1).map(({ key }) => (
                  <td key={key} className="dash-td--num dash-td--total">
                    {fmtBig(sorted.reduce((acc, r) => acc + (Number(r[key]) || 0), 0), lang)}
                  </td>
                ))}
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- CityTable
const CITY_COLS = [
  { key: "city",          en: "City / Taluka", mr: "शहर / तालुका",  numeric: false },
  { key: "district",      en: "District",      mr: "जिल्हा",         numeric: false },
  { key: "registrations", en: "Registrations", mr: "नोंदणी",         numeric: true  },
  { key: "uploaded",      en: "Uploaded",      mr: "अपलोड",          numeric: true  },
  { key: "verified",      en: "Verified",      mr: "पडताळणी पूर्ण", numeric: true  },
];

const PAGE_SIZE = 25;

function CityTable() {
  const t   = useT();
  const { lang } = useLang();
  const [page,     setPage]     = useState(1);
  const [district, setDistrict] = useState("");
  const [sortKey,  setSortKey]  = useState("registrations");
  const [sortDir,  setSortDir]  = useState("desc");

  // District list for the filter dropdown (long TTL — rarely changes)
  const { data: districtData } = useStale("/dashboard/districts", null, 600_000);
  const districts = (districtData || []).map((r) => r.district).filter(Boolean).sort();

  // City data — server-side pagination & sort; fresh every 5 min
  const params = { page, limit: PAGE_SIZE, sort: sortKey, dir: sortDir, ...(district ? { district } : {}) };
  const { data, loading, error, refresh } = useStale("/dashboard/cities", params, 300_000);

  const rows       = data?.data || data?.items || [];
  const total      = data?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE) || 1;

  function toggleSort(key) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("desc"); setPage(1); }
  }

  function onDistrict(val) { setDistrict(val); setPage(1); }

  const from = (page - 1) * PAGE_SIZE + 1;
  const to   = Math.min(page * PAGE_SIZE, total);

  if (error) return <ErrorState error={error} onRetry={refresh} />;

  return (
    <div className="dash-table-wrap">
      <div className="dash-table-header">
        <h2 className="dash-section-title">
          <MapPin size={18} aria-hidden="true" />
          {t("City-wise Statistics", "शहरनिहाय आकडेवारी")}
          {total > 0 && <span className="dash-count-badge">{fmtBig(total, lang)}</span>}
        </h2>
        <div className="dash-filters">
          <div className="dash-search">
            <Filter size={13} aria-hidden="true" />
            <select
              className="input"
              value={district}
              onChange={(e) => onDistrict(e.target.value)}
              aria-label={t("Filter by district", "जिल्ह्यानुसार गाळा")}
            >
              <option value="">{t("All Districts", "सर्व जिल्हे")}</option>
              {districts.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="table-scroll" role="region" aria-label={t("City statistics", "शहरनिहाय तक्ता")} tabIndex={0}>
        <table className="dash-table">
          <thead>
            <tr>
              {CITY_COLS.map(({ key, en, mr: mrLabel, numeric }) => (
                <th key={key} scope="col" className={numeric ? "dash-th--num" : ""}>
                  <button type="button" className="dash-th-btn" onClick={() => toggleSort(key)}
                    aria-sort={sortKey === key ? (sortDir === "asc" ? "ascending" : "descending") : "none"}>
                    {lang === "mr" ? mrLabel : en}
                    <SortIcon col={key} sortKey={sortKey} sortDir={sortDir} />
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && !data
              ? Array.from({ length: 8 }, (_, i) => (
                  <tr key={i} aria-hidden="true">
                    {CITY_COLS.map(({ key }) => (
                      <td key={key}><span className="skeleton-line" style={{ width: key === "city" ? 120 : key === "district" ? 90 : 60 }} /></td>
                    ))}
                  </tr>
                ))
              : rows.length === 0
              ? <tr><td colSpan={CITY_COLS.length} className="dash-empty">{t("No data found", "माहिती आढळली नाही")}</td></tr>
              : rows.map((row, i) => (
                  <tr key={row.id ?? `${row.city}-${i}`}>
                    <td className="dash-td--name">{row.city || "—"}</td>
                    <td className="dash-td--name">{row.district || "—"}</td>
                    {CITY_COLS.slice(2).map(({ key }) => (
                      <td key={key} className="dash-td--num">{fmtBig(row[key], lang)}</td>
                    ))}
                  </tr>
                ))
            }
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="dash-pagination">
          <span className="dash-count-text">
            {total > 0
              ? t(
                  `Showing ${fmtBig(from, lang)}–${fmtBig(to, lang)} of ${fmtBig(total, lang)}`,
                  `${fmtBig(total, lang)} पैकी ${fmtBig(from, lang)}–${fmtBig(to, lang)}`
                )
              : ""}
          </span>
          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------- page
export default function Dashboard() {
  const t = useT();
  return (
    <>
      <Seo
        title={t("Dashboard — Live Statistics", "डॅशबोर्ड — थेट आकडेवारी")}
        description={t(
          `Durgotsav ${EDITION_YEAR} — real-time overview of registrations, photo uploads, verifications and certificates.`,
          `दुर्गोत्सव ${EDITION_YEAR_MR} — नोंदणी, छायाचित्र अपलोड, पडताळणी आणि अभिनंदन पत्रे यांचे वास्तवकालीन विहंगावलोकन.`
        )}
      />
      <PageHero
        eyebrow={t("॥ Dashboard ॥", "॥ डॅशबोर्ड ॥")}
        title={t("Live Statistics", "थेट आकडेवारी")}
        lead={t(
          "Real-time overview of registrations, photo uploads, verifications and certificates across Maharashtra.",
          "महाराष्ट्रभरातील नोंदणी, छायाचित्र अपलोड, पडताळणी आणि अभिनंदन पत्रे यांचे वास्तवकालीन विहंगावलोकन."
        )}
      />
      <section className="section surface-parchment">
        <div className="container" style={{ display: "grid", gap: "var(--space-8)" }}>
          <SummaryBand />
          <DistrictTable />
          <CityTable />
        </div>
      </section>
    </>
  );
}
