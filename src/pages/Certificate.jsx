import { motion } from "framer-motion";
import { AlertCircle, BadgeCheck, CheckCircle2, ChevronLeft, ChevronRight, Clock, Files, ImagePlus, Loader2, Search, ShieldCheck, Smartphone, XCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CertificateButtons, certificateError } from "../components/certificate/CertificateButtons.jsx";
import { Captcha } from "../components/participate/Captcha.jsx";
import { digitsOnly, Field } from "../components/participate/fields.jsx";
import "../components/participate/registration.css";
import { StatsBand } from "../components/home/HomeSections.jsx";
import { Seo } from "../components/seo/Seo.jsx";
import { PageHero } from "../components/ui/PageParts.jsx";
import { EDITION_YEAR, EDITION_YEAR_MR, NUMBER_PREFIX } from "../config/edition.js";
import { useLang, useT } from "../context/LanguageContext.jsx";
import { useSite } from "../context/SiteContext.jsx";
import { http, toApiError } from "../lib/api.js";
import { downloadAllCertificates } from "../lib/download.js";
import { assetUrl, enDate, mr, mrDate, STATUS, STATUS_EN } from "../lib/format.js";
import { preparePhoto } from "../lib/image.js";
import "./pages.css";

// "download" keeps its key (older links say ?tab=download); it now looks certificates up by mobile number (SRS v2.1 §5)
const TABS_DEF = [
  ["download", { en: "My Registrations",           mr: "माझ्या नोंदणी" },              Smartphone  ],
  ["status",   { en: "Registration Status",        mr: "नोंदणी स्थिती" },             Clock       ],
  ["verify",   { en: "Verify Certificate",         mr: "अभिनंदन पत्र पडताळणी" },     ShieldCheck ],
];

const ERRORS = {
  404: { en: "No registration found for this registration number and mobile number. Please check the details.", mr: "या नोंदणी क्रमांक व मोबाईल क्रमांकासाठी नोंदणी सापडली नाही. कृपया तपशील तपासा." },
  409: { en: "This certificate is not available right now. Check the registration status for the reason.", mr: "हे अभिनंदन पत्र सध्या उपलब्ध नाही. कारणासाठी नोंदणीची स्थिती पाहा." },
  429: { en: "Too many attempts. Please try again in a few minutes.", mr: "खूप वेळा प्रयत्न झाले. कृपया काही मिनिटांनी पुन्हा प्रयत्न करा." },
};

const MOBILE_ERROR = ["Please enter a valid 10-digit mobile number starting with 6, 7, 8 or 9.", "कृपया ६, ७, ८ किंवा ९ ने सुरू होणारा वैध १० अंकी मोबाईल क्रमांक लिहा."];
const CAPTCHA_PROMPT = ["Please tick 'I am not a robot' (मी रोबोट नाही) to continue.", "कृपया पुढे पाठवण्यासाठी 'मी रोबोट नाही' (I am not a robot) निवडा."];

// ---------------------------------------------------------------- my registrations (by mobile number)

/**
 * Every registration of one mobile number — any number of them — newest first, PAGE_SIZE at a time. The first page
 * needs the CAPTCHA; it returns a lookup token that fetches the following pages (30 minutes) without a new tick.
 * pages: the pages seen so far, [{ data, next_before }]; Previous shows them again without asking the server.
 */
function MyCertificatesTab() {
  const t = useT();
  const { lang } = useLang();
  const { settings } = useSite();
  const captchaConfig = settings.captcha ?? null;
  const [phone, setPhone] = useState("");
  const [captchaToken, setCaptchaToken] = useState(null);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState("");
  const [session, setSession] = useState(null); // { lookupToken, total, pageSize }
  const [pages, setPages] = useState([]);
  const [pageIndex, setPageIndex] = useState(0);
  const [allBusy, setAllBusy] = useState(false);
  const [allError, setAllError] = useState("");
  const captchaRef = useRef(null);
  const listRef = useRef(null);
  const fmtDate = (v) => (lang === "mr" ? mrDate(v) : enDate(v));
  const num = (n) => (lang === "mr" ? mr(n) : String(n));
  const expired = t("This search has expired. Please search again.", "ही शोध मुदत संपली. कृपया पुन्हा शोधा.");

  async function search(e) {
    e.preventDefault();
    const next = {};
    if (!/^[6-9]\d{9}$/.test(phone)) next.phone = t(...MOBILE_ERROR);
    if (captchaConfig && !captchaToken) next.captcha = t(...CAPTCHA_PROMPT);
    setErrors(next);
    if (Object.keys(next).length) return;
    setBusy(true);
    setError("");
    setAllError("");
    try {
      const { data } = await http.post("/certificates/lookup", { phone, captcha_token: captchaToken ?? undefined });
      setSession({ lookupToken: data.meta.lookup_token, total: data.meta.total, pageSize: data.meta.page_size });
      setPages([{ data: data.data, next_before: data.meta.next_before }]);
      setPageIndex(0);
    } catch (err) {
      const apiErr = toApiError(err);
      if (apiErr.code?.startsWith("CAPTCHA")) setErrors({ captcha: t("The 'I am not a robot' check expired. Please tick it again.", "'मी रोबोट नाही' तपासणीची मुदत संपली. कृपया पुन्हा खूण करा.") });
      else setError(ERRORS[apiErr.status]?.[lang] ?? apiErr.message);
      setSession(null);
      setPages([]);
    } finally {
      setBusy(false);
      captchaRef.current?.reset();
    }
  }

  const showPage = (index) => {
    setPageIndex(index);
    setAllError("");
    requestAnimationFrame(() => listRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };

  async function nextPage() {
    if (pageIndex + 1 < pages.length) return showPage(pageIndex + 1);
    setBusy(true);
    setError("");
    try {
      const { data } = await http.get("/certificates/lookup", { params: { lookup_token: session.lookupToken, before: pages[pageIndex].next_before } });
      setPages((p) => [...p, { data: data.data, next_before: data.meta.next_before }]);
      showPage(pageIndex + 1);
    } catch (err) {
      const apiErr = toApiError(err);
      setError(apiErr.code === "LOOKUP_EXPIRED" || apiErr.status === 400 ? expired : ERRORS[apiErr.status]?.[lang] ?? apiErr.message);
      if (apiErr.code === "LOOKUP_EXPIRED") {
        setSession(null);
        setPages([]);
      }
    } finally {
      setBusy(false);
    }
  }

  const page = pages[pageIndex];
  const list = page?.data ?? null;
  const pageCount = session ? Math.max(1, Math.ceil(session.total / (session.pageSize || 20))) : 0;
  const available = list?.filter((r) => r.certificate_available) ?? [];

  async function downloadAll() {
    setAllBusy(true);
    setAllError("");
    try {
      await downloadAllCertificates(available.map((r) => r.token));
    } catch (err) {
      setAllError(certificateError(err, t));
    } finally {
      setAllBusy(false);
    }
  }

  return (
    <div className="stack">
      <p className="muted">
        {t(
          "Enter the mobile number you registered with. Every registration on that number is listed with its status; approved ones can be downloaded as a PDF or image, or all of a page at once.",
          "नोंदणी करताना दिलेला मोबाईल क्रमांक लिहा. त्या क्रमांकावरील सर्व नोंदणी स्थितीसह येथे दिसतील; पडताळणी पूर्ण झालेली अभिनंदन पत्रे PDF किंवा प्रतिमा म्हणून, किंवा एका पानावरील सर्व एकत्र डाउनलोड करा.",
        )}
      </p>
      <form className="stack" onSubmit={search} noValidate>
        <Field label={t("Registered Mobile Number", "नोंदणीकृत मोबाईल क्रमांक")} required error={errors.phone}>
          {(p) => (
            <input {...p} className="input" type="tel" inputMode="numeric" value={phone} autoComplete="tel-national"
              placeholder={t("10-digit number", "१० अंकी क्रमांक")}
              onChange={(e) => { setPhone(digitsOnly(e.target.value, 10)); setErrors((er) => ({ ...er, phone: undefined })); }} />
          )}
        </Field>
        <Captcha ref={captchaRef} config={captchaConfig} invalid={Boolean(errors.captcha)}
          onChange={(token) => { setCaptchaToken(token); if (token) setErrors((er) => ({ ...er, captcha: undefined })); }} />
        {errors.captcha && <div className="alert alert--error" role="alert"><AlertCircle aria-hidden="true" /><span>{errors.captcha}</span></div>}
        {error && <div className="alert alert--error" role="alert"><AlertCircle aria-hidden="true" /><span>{error}</span></div>}
        <div>
          <button type="submit" className={`btn btn--primary ${captchaConfig && !captchaToken ? "reg-submit is-blocked" : ""}`} disabled={busy}>
            {busy && !session ? <Loader2 className="spin" aria-hidden="true" /> : <Search aria-hidden="true" />} {t("Find my registrations", "माझ्या नोंदणी शोधा")}
          </button>
        </div>
      </form>

      {list && list.length === 0 && (
        <div className="alert alert--info" role="status">
          <AlertCircle aria-hidden="true" />
          <span>
            {t("No registration was found for this mobile number.", "या मोबाईल क्रमांकावर कोणतीही नोंदणी आढळली नाही.")}{" "}
            <Link to="/participate">{t("Register now", "आता नोंदणी करा")}</Link>
          </span>
        </div>
      )}

      {list && list.length > 0 && (
        <motion.section ref={listRef} className="stack cert-results" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} aria-live="polite">
          <div className="cert-list__head">
            <h3>
              {t(`${session.total} registration(s) on this number`, `या क्रमांकावर ${mr(session.total)} नोंदणी`)}
              {pageCount > 1 && <small className="cert-list__page"> · {t(`page ${pageIndex + 1} of ${pageCount}`, `पान ${mr(pageIndex + 1)} / ${mr(pageCount)}`)}</small>}
            </h3>
            {available.length > 1 && (
              <button type="button" className="btn btn--primary btn--sm" onClick={downloadAll} disabled={allBusy}>
                {allBusy ? <Loader2 className="spin" aria-hidden="true" /> : <Files aria-hidden="true" />}
                {pageCount > 1
                  ? t(`Download this page's ${available.length} (PDF)`, `या पानावरील ${mr(available.length)} डाउनलोड करा (PDF)`)
                  : t(`Download all ${available.length} (PDF)`, `सर्व ${mr(available.length)} डाउनलोड करा (PDF)`)}
              </button>
            )}
          </div>
          {allError && <p className="field__error" role="alert"><AlertCircle size={14} aria-hidden="true" />{allError}</p>}
          <ul className="cert-list">
            {list.map((r) => {
              const tone = r.certificate_available ? "ok" : ["rejected", "duplicate"].includes(r.status) ? "muted" : "waiting";
              const state = r.certificate_available
                ? t("Certificate ready", "अभिनंदन पत्र उपलब्ध")
                : (lang === "mr" ? STATUS : STATUS_EN)[r.status]?.label;
              const Icon = r.certificate_available ? BadgeCheck : tone === "muted" ? XCircle : Clock;
              return (
                <li key={r.registration_no} className={`cert-card cert-card--${tone}`}>
                  {r.thumb_path ? <img className="cert-card__photo" src={assetUrl(r.thumb_path)} alt="" loading="lazy" /> : <span className="cert-card__photo" aria-hidden="true" />}
                  <div className="stack" style={{ gap: 10 }}>
                    <span className="cert-card__state"><Icon aria-hidden="true" /> {state}</span>
                    <div>
                      <h3>{r.name}</h3>
                      <p className="cert-card__meta">
                        <span>{t("Reg. No.", "नोंदणी क्र.")} <strong>{r.registration_no}</strong></span>
                        {r.durgveer_no && <span>{t("Durgveer No.", "दुर्गवीर क्र.")} <strong>{num(r.durgveer_no)}</strong></span>}
                        <span>{fmtDate(r.submitted_at)}</span>
                        {r.district && <span>{r.district}</span>}
                      </p>
                    </div>
                    {r.note && <p className="cert-card__note"><strong>{t("Note from AMRUT:", "अमृत संस्थेची टीप:")}</strong> {r.note}</p>}
                    {r.status === "pending" && (
                      <p className="cert-card__hint">{t("The certificate will be ready here once AMRUT has verified this registration.", "अमृत संस्थेकडून पडताळणी झाल्यावर अभिनंदन पत्र येथे उपलब्ध होईल.")}</p>
                    )}
                    {r.certificate_available && <CertificateButtons token={r.token} size="sm" />}
                    {r.status === "info_requested" && (
                      <Link className="btn btn--outline btn--sm" to={`/certificate?tab=status&registration=${encodeURIComponent(r.registration_no)}`}>
                        {t("Send the information asked for", "मागितलेली माहिती पाठवा")}
                      </Link>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
          {pageCount > 1 && (
            <nav className="cert-pager" aria-label={t("Pages", "पाने")}>
              <button type="button" className="btn btn--outline btn--sm" onClick={() => showPage(pageIndex - 1)} disabled={busy || pageIndex === 0}>
                <ChevronLeft aria-hidden="true" /> {t("Previous", "मागील")}
              </button>
              <span className="cert-pager__pos">{t(`Page ${pageIndex + 1} of ${pageCount}`, `पान ${mr(pageIndex + 1)} / ${mr(pageCount)}`)}</span>
              <button type="button" className="btn btn--outline btn--sm" onClick={nextPage} disabled={busy || !page.next_before}>
                {busy ? <Loader2 className="spin" aria-hidden="true" /> : null}{t("Next", "पुढील")} <ChevronRight aria-hidden="true" />
              </button>
            </nav>
          )}
        </motion.section>
      )}
    </div>
  );
}

// ---------------------------------------------------------------- status (registration number + mobile)

function Lookup({ initial, submitLabel, busy, onSubmit, error }) {
  const t = useT();
  const [registration, setRegistration] = useState(initial || "");
  const [phone, setPhone] = useState("");
  const [errs, setErrs] = useState({});
  const submit = (e) => {
    e.preventDefault();
    const next = {};
    if (!registration.trim()) next.registration = t("Please enter your registration number.", "नोंदणी क्रमांक लिहा.");
    if (!/^[6-9]\d{9}$/.test(phone)) next.phone = t(...MOBILE_ERROR);
    setErrs(next);
    if (!Object.keys(next).length) onSubmit({ registration: registration.trim().toUpperCase(), phone });
  };
  return (
    <form className="form-grid form-grid--2" onSubmit={submit} noValidate>
      <Field label={t("Registration Number", "नोंदणी क्रमांक")} required error={errs.registration} hint={t(`e.g. ${NUMBER_PREFIX}-010123 or just 10123`, `उदा. ${NUMBER_PREFIX}-010123 किंवा फक्त 10123`)}>
        {(p) => <input {...p} className="input" value={registration} onChange={(e) => setRegistration(e.target.value)} autoComplete="off" maxLength={20} />}
      </Field>
      <Field label={t("Mobile Number", "मोबाईल क्रमांक")} required error={errs.phone}>
        {(p) => <input {...p} className="input" type="tel" inputMode="numeric" value={phone} onChange={(e) => setPhone(digitsOnly(e.target.value, 10))} autoComplete="tel-national" autoFocus={Boolean(initial)} />}
      </Field>
      {error && <div className="alert alert--error span-2" role="alert"><AlertCircle aria-hidden="true" /><span>{error}</span></div>}
      <div className="span-2">
        <button type="submit" className="btn btn--primary" disabled={busy}>
          {busy ? <Loader2 className="spin" aria-hidden="true" /> : <Search aria-hidden="true" />} {submitLabel}
        </button>
      </div>
    </form>
  );
}

const STATUS_ICON = { pending: CheckCircle2, info_requested: AlertCircle, verified: BadgeCheck, rejected: XCircle, duplicate: XCircle };

function Resubmit({ query, onDone }) {
  const t = useT();
  const [photo, setPhoto] = useState(null);
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef(null);
  useEffect(() => () => photo && URL.revokeObjectURL(photo.preview), [photo]);

  async function submit(e) {
    e.preventDefault();
    if (!photo && !notes.trim()) return setError(t("Select a new photo or write information.", "नवीन छायाचित्र निवडा किंवा माहिती लिहा."));
    setBusy(true);
    setError("");
    const body = new FormData();
    body.append("phone", query.phone);
    if (notes.trim()) body.append("replica_notes", notes.trim());
    if (photo) body.append("photo", photo.file);
    try {
      const { data } = await http.post(`/registrations/${encodeURIComponent(query.registration)}/resubmit`, body, { timeout: 120000 });
      onDone(data.data);
    } catch (err) {
      setError(toApiError(err).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <form className="stack resubmit" onSubmit={submit}>
      <h3>{t("Send Additional Information", "अतिरिक्त माहिती पाठवा")}</h3>
      <div className={`dropzone ${photo ? "has-photo" : ""}`}>
        {photo ? (
          <div className="dropzone__preview"><img src={photo.preview} alt={t("New photo", "नवीन छायाचित्र")} /></div>
        ) : (
          <button type="button" className="dropzone__empty" onClick={() => fileRef.current?.click()}>
            <ImagePlus aria-hidden="true" /><strong>{t("Select a new photo", "नवीन छायाचित्र निवडा")}</strong>
          </button>
        )}
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" aria-label={t("New photo", "नवीन छायाचित्र")} tabIndex={-1}
          onChange={async (e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            e.target.value = ""; // so picking the same file again after an error retries it
            try { setPhoto(await preparePhoto(f, t)); setError(""); } catch (err) { setError(err.message); }
          }} />
      </div>
      <Field label={t("Note (optional)", "टीप (ऐच्छिक)")}>
        {(p) => <textarea {...p} className="textarea" value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={500} />}
      </Field>
      {error && <div className="alert alert--error" role="alert"><AlertCircle aria-hidden="true" /><span>{error}</span></div>}
      <div>
        <button type="submit" className="btn btn--primary" disabled={busy}>
          {busy && <Loader2 className="spin" aria-hidden="true" />} {t("Resubmit", "पुन्हा पाठवा")}
        </button>
      </div>
    </form>
  );
}

function StatusTab({ initial }) {
  const t = useT();
  const { lang } = useLang();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [query, setQuery] = useState(null);
  const fmtDate = (v) => lang === "mr" ? mrDate(v) : enDate(v);
  const statusMap = lang === "mr" ? STATUS : STATUS_EN;

  async function check(q) {
    setBusy(true);
    setError("");
    try {
      const { data } = await http.get("/registrations/status", { params: q });
      setResult(data.data);
      setQuery(q);
    } catch (err) {
      const e = toApiError(err);
      const errObj = ERRORS[e.status];
      setError(errObj ? errObj[lang] || errObj.en : e.message);
      setResult(null);
    } finally {
      setBusy(false);
    }
  }
  const s = result && statusMap[result.status];
  const Icon = result && STATUS_ICON[result.status];
  return (
    <div className="stack">
      <Lookup initial={initial} submitLabel={t("Check Status", "स्थिती तपासा")} busy={busy} error={error} onSubmit={check} />
      {result && (
        <motion.div className={`status-card status-card--${s.tone}`} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} role="status">
          {result.thumb_path && <img src={assetUrl(result.thumb_path)} alt={t("Your photo", "आपले छायाचित्र")} className="status-card__photo" />}
          <div className="stack">
            <p className="status-card__state"><Icon aria-hidden="true" /> {s.label}</p>
            <h3>{result.name}</h3>
            <dl className="status-card__meta">
              <div><dt>{t("Registration Number", "नोंदणी क्रमांक")}</dt><dd>{result.registration_no}</dd></div>
              <div><dt>{t("Registration Date", "नोंदणी दिनांक")}</dt><dd>{fmtDate(result.submitted_at)}</dd></div>
              {result.durgveer_no && <div><dt>{t("Durgveer No.", "दुर्गवीर क्र.")}</dt><dd>{lang === "mr" ? mr(result.durgveer_no) : result.durgveer_no}</dd></div>}
              {result.fort && <div><dt>{t("Fort", "दुर्ग")}</dt><dd>{result.fort}</dd></div>}
              {result.district && <div><dt>{t("District", "जिल्हा")}</dt><dd>{result.district}</dd></div>}
            </dl>
            {result.note && <p className="status-card__note"><strong>{t("Note from AMRUT:", "अमृत संस्थेची टीप:")}</strong> {result.note}</p>}
            {result.status === "pending" && (
              <p className="muted">
                {result.certificate_available
                  ? t(
                    "Your certificate is ready. AMRUT will also review the photo; a registration that breaks the rules can be withdrawn.",
                    "आपले अभिनंदन पत्र तयार आहे. अमृत संस्था छायाचित्राचीही तपासणी करेल; नियमांनुसार नसलेली नोंदणी अमान्य होऊ शकते."
                  )
                  : t(
                    "Your registration is in the verification queue. The certificate will be available here once verification is complete.",
                    "आपली नोंदणी पडताळणीसाठी रांगेत आहे. पडताळणी पूर्ण झाल्यावर अभिनंदन पत्र येथून डाउनलोड करता येईल."
                  )}
              </p>
            )}
            {result.certificate_available && result.token && <CertificateButtons token={result.token} />}
          </div>
          {result.status === "info_requested" && <Resubmit query={query} onDone={setResult} />}
        </motion.div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------- verify (by the number printed on the certificate)

function VerifyTab({ initial }) {
  const t = useT();
  const { lang } = useLang();
  const [number, setNumber] = useState((initial || "").toUpperCase());
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const fmtDate = (v) => lang === "mr" ? mrDate(v) : enDate(v);

  async function verify(value) {
    if (value.trim().length < 5) return setError(t("Please enter the certificate number.", "अभिनंदन पत्रावरील क्रमांक लिहा."));
    setBusy(true);
    setError("");
    setResult(null);
    try {
      const { data } = await http.get(`/certificates/verify/${encodeURIComponent(value.trim())}`);
      setResult(data.data);
    } catch (err) {
      const e2 = toApiError(err);
      setError(e2.status === 404
        ? t("No certificate found for this number.", "या क्रमांकाचे अभिनंदन पत्र आढळले नाही.")
        : e2.message);
    } finally {
      setBusy(false);
    }
  }
  // Opened from a link with the number filled in (?tab=verify&no=…): check it straight away
  useEffect(() => {
    if (initial) verify(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial]);

  return (
    <div className="stack">
      <p className="muted">
        {t(
          `Enter the number printed at the bottom of the certificate (e.g. AMRUT-${NUMBER_PREFIX}-010123) to verify it is authentic.`,
          `अभिनंदन पत्राच्या खालच्या भागात छापलेला क्रमांक (उदा. AMRUT-${NUMBER_PREFIX}-010123) लिहून ते अधिकृत आहे का ते तपासा.`
        )}
      </p>
      <form className="cluster verify-form" onSubmit={(e) => { e.preventDefault(); verify(number); }} noValidate>
        <label className="sr-only" htmlFor="cert-no">{t("Certificate Number", "अभिनंदन पत्र क्रमांक")}</label>
        <input id="cert-no" className="input" value={number} onChange={(e) => setNumber(e.target.value.toUpperCase())} placeholder={`AMRUT-${NUMBER_PREFIX}-010123`} maxLength={40} />
        <button type="submit" className="btn btn--primary" disabled={busy}>
          {busy ? <Loader2 className="spin" aria-hidden="true" /> : <ShieldCheck aria-hidden="true" />} {t("Verify", "पडताळा")}
        </button>
      </form>
      {error && <div className="alert alert--error" role="alert"><AlertCircle aria-hidden="true" /><span>{error}</span></div>}
      {result && (
        <div className={`alert ${result.valid ? "alert--success" : "alert--error"}`} role="status">
          {result.valid ? <BadgeCheck aria-hidden="true" /> : <XCircle aria-hidden="true" />}
          <span>
            {result.valid
              ? <><strong>{t("Authentic certificate.", "अधिकृत अभिनंदन पत्र.")}</strong> {result.name}{result.district ? `, ${result.district}` : ""} — {t("Durgveer No.", "दुर्गवीर क्र.")} {lang === "mr" ? mr(result.durgveer_no) : result.durgveer_no} · {result.registration_no} · {fmtDate(result.issued_at)}.</>
              : <><strong>{t("This certificate has been cancelled.", "हे अभिनंदन पत्र रद्द करण्यात आले आहे.")}</strong></>}
          </span>
        </div>
      )}
    </div>
  );
}

export default function Certificate() {
  const t = useT();
  const { lang } = useLang();
  const [params, setParams] = useSearchParams();
  const initialReg = params.get("registration") || "";
  const initialNo = params.get("no") || "";
  const TABS = TABS_DEF.map(([k, label, Icon]) => [k, label[lang] || label.en, Icon]);
  // Earlier emails link here with ?registration=… and verification links with ?no=…: open the tab that answers them
  const fallback = initialNo ? "verify" : initialReg ? "status" : "download";
  const tab = TABS.some(([k]) => k === params.get("tab")) ? params.get("tab") : fallback;
  const select = (key) => setParams((p) => { p.set("tab", key); return p; }, { replace: true });

  return (
    <>
      <Seo
        title={t("Congratulation Certificate", "अभिनंदन पत्र")}
        description={t(
          `Durgotsav ${EDITION_YEAR} — get all your digital certificates with your mobile number, check registration status, and verify certificates.`,
          `दुर्गोत्सव ${EDITION_YEAR_MR} — मोबाईल क्रमांकावरून आपली सर्व डिजिटल अभिनंदन पत्रे डाउनलोड करा, नोंदणी स्थिती तपासा आणि अभिनंदन पत्राची पडताळणी करा.`
        )}
      />
      <PageHero
        eyebrow={t("॥ Certificate ॥", "॥ अभिनंदन पत्र ॥")}
        title={t("Your Digital Certificate", "आपले डिजिटल अभिनंदन पत्र")}
        lead={t(
          "Your certificate is ready here once AMRUT has verified your registration and photo. Find every registration on your mobile number here.",
          "अमृत संस्थेकडून नोंदणी व छायाचित्राची पडताळणी पूर्ण झाल्यावर आपले अभिनंदन पत्र येथे उपलब्ध होते. आपल्या मोबाईल क्रमांकावरील सर्व नोंदणी येथे पाहा."
        )}
      />
      <section className="section surface-parchment">
        <div className="container container--narrow stack">
          <div className="tabs tabs--light" role="tablist" aria-label={t("Certificate Services", "अभिनंदन पत्र सेवा")}>
            {TABS.map(([key, label, Icon]) => (
              <button key={key} type="button" role="tab" id={`tab-${key}`} aria-controls={`panel-${key}`} aria-selected={tab === key} className="tab" onClick={() => select(key)}>
                {tab === key && <motion.span layoutId="cert-tab" className="tab__bg" transition={{ type: "spring", stiffness: 400, damping: 34 }} />}
                <span><Icon size={16} aria-hidden="true" style={{ display: "inline", verticalAlign: "-3px", marginRight: 6 }} />{label}</span>
              </button>
            ))}
          </div>
          <div className="card-light" role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`}>
            {tab === "download" && <MyCertificatesTab />}
            {tab === "status" && <StatusTab initial={initialReg} />}
            {tab === "verify" && <VerifyTab initial={initialNo} />}
          </div>
          <p className="muted" style={{ fontSize: "var(--text-sm)" }}>
            {t(
              <>The certificate is a record of participation in Durgotsav; it does not create any financial, governmental or other rights. If you have any difficulty <Link to="/contact">contact us</Link>.</>,
              <>अभिनंदन पत्र हे दुर्गोत्सवातील सहभागाची नोंद आहे; त्यातून कोणताही आर्थिक, शासकीय पदाचा किंवा अन्य हक्क निर्माण होत नाही. अडचण असल्यास <Link to="/contact">संपर्क साधा</Link>.</>
            )}
          </p>
        </div>
      </section>
      <StatsBand />
    </>
  );
}
