import { Eye } from "lucide-react";
import { useEffect, useState } from "react";
import { useLang, useT } from "../../context/LanguageContext.jsx";
import { http } from "../../lib/api.js";
import { mrNumber } from "../../lib/format.js";

const VISITOR_KEY = "durgotsav:visitor-id";
const COUNTED_DAY_KEY = "durgotsav:visit-day";
const REFRESH_MS = 60_000;
const enNumber = new Intl.NumberFormat("en-IN");
const istDay = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date()); // YYYY-MM-DD

function randomUuid() {
  if (crypto.randomUUID) return crypto.randomUUID();
  const b = crypto.getRandomValues(new Uint8Array(16));
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = [...b].map((x) => x.toString(16).padStart(2, "0")).join("");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

// Storage can be blocked (private mode, site data disabled); the server then falls back to IP + browser.
const store = {
  get: (k) => { try { return localStorage.getItem(k); } catch { return null; } },
  set: (k, v) => { try { localStorage.setItem(k, v); } catch { /* ignore */ } },
};

function visitorId() {
  let id = store.get(VISITOR_KEY);
  if (!id) {
    id = randomUuid();
    store.set(VISITOR_KEY, id);
  }
  return store.get(VISITOR_KEY) ? id : undefined;
}

// Counts each visitor once per day (IST), then keeps the total live while the page is open.
// The server enforces once-per-day too; the stored day just saves a request on repeat visits.
export function VisitorCounter() {
  const t = useT();
  const { lang } = useLang();
  const [counts, setCounts] = useState(null);

  useEffect(() => {
    let alive = true;
    const apply = (res) => alive && setCounts(res.data.data);

    const today = istDay();
    if (store.get(COUNTED_DAY_KEY) === today) http.get("/visits").then(apply).catch(() => {});
    else {
      http.post("/visits", { visitor_id: visitorId() })
        .then((res) => {
          // Mark only once the server answered, so a failed request is retried on the next page
          store.set(COUNTED_DAY_KEY, today);
          apply(res);
        })
        .catch(() => {});
    }

    const refresh = () => document.visibilityState === "visible" && http.get("/visits").then(apply).catch(() => {});
    const timer = setInterval(refresh, REFRESH_MS);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, []);

  if (!counts) return null;
  const fmt = (n) => (lang === "mr" ? mrNumber(n) : enNumber.format(n));

  return (
    <div className="visitor-counter" aria-live="polite">
      <Eye size={18} aria-hidden="true" />
      <span className="visitor-counter__label">{t("Total visitors", "एकूण भेटी")}</span>
      <strong className="visitor-counter__value">{fmt(counts.total)}</strong>
      <span className="visitor-counter__today">
        {t("Today", "आज")}: {fmt(counts.today)}
      </span>
    </div>
  );
}
