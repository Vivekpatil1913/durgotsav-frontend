import { motion } from "framer-motion";
import { AlertCircle, BadgeCheck, CheckCircle2, Clock, Download, ImagePlus, Loader2, Search, ShieldCheck, XCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { digitsOnly, Field } from "../components/participate/fields.jsx";
import "../components/participate/registration.css";
import { StatsBand } from "../components/home/HomeSections.jsx";
import { Seo } from "../components/seo/Seo.jsx";
import { PageHero } from "../components/ui/PageParts.jsx";
import { useLang, useT } from "../context/LanguageContext.jsx";
import { http, toApiError } from "../lib/api.js";
import { assetUrl, enDate, mrDate, STATUS, STATUS_EN } from "../lib/format.js";
import { preparePhoto } from "../lib/image.js";
import "./pages.css";

const TABS_DEF = [
  ["download", { en: "Download Certificate",      mr: "अभिनंदन पत्र डाउनलोड" },     Download    ],
  ["status",   { en: "Registration Status",        mr: "नोंदणी स्थिती" },             Clock       ],
  ["verify",   { en: "Verify Certificate",         mr: "अभिनंदन पत्र पडताळणी" },     ShieldCheck ],
];

const ERRORS = {
  404: { en: "No registration found for this registration number and mobile number. Please check the details.", mr: "या नोंदणी क्रमांक व मोबाईल क्रमांकासाठी नोंदणी सापडली नाही. कृपया तपशील तपासा." },
  409: { en: "Your registration verification is not yet complete. The certificate will be available once verification is done.", mr: "आपल्या नोंदणीची पडताळणी अद्याप पूर्ण झालेली नाही. पडताळणी पूर्ण झाल्यावर अभिनंदन पत्र उपलब्ध होईल." },
  429: { en: "Too many attempts. Please try again in a few minutes.", mr: "खूप वेळा प्रयत्न झाले. कृपया काही मिनिटांनी पुन्हा प्रयत्न करा." },
};

function Lookup({ initial, submitLabel, busy, onSubmit, error }) {
  const t = useT();
  const [registration, setRegistration] = useState(initial || "");
  const [phone, setPhone] = useState("");
  const [errs, setErrs] = useState({});
  const submit = (e) => {
    e.preventDefault();
    const next = {};
    if (!registration.trim()) next.registration = t("Please enter your registration number.", "नोंदणी क्रमांक लिहा.");
    if (!/^[6-9]\d{9}$/.test(phone)) next.phone = t("Please enter a valid 10-digit mobile number starting with 6, 7, 8 or 9.", "कृपया ६, ७, ८ किंवा ९ ने सुरू होणारा वैध १० अंकी मोबाईल क्रमांक लिहा.");
    setErrs(next);
    if (!Object.keys(next).length) onSubmit({ registration: registration.trim().toUpperCase(), phone });
  };
  return (
    <form className="form-grid form-grid--2" onSubmit={submit} noValidate>
      <Field label={t("Registration Number", "नोंदणी क्रमांक")} required error={errs.registration} hint={t("e.g. DGT26-000123 or just 123", "उदा. DGT26-000123 किंवा फक्त 123")}>
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

function DownloadTab({ initial }) {
  const t = useT();
  const { lang } = useLang();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  useEffect(() => {
    if (!done) return;
    const timer = setTimeout(() => setDone(false), 10000);
    return () => clearTimeout(timer);
  }, [done]);
  async function download(q) {
    setBusy(true);
    setError("");
    try {
      const res = await http.get("/certificates/download", { params: q, responseType: "blob", timeout: 60000 });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Durgotsav-2026-Abhinandan-Patra-${q.registration}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10000);
      setDone(true);
    } catch (err) {
      const status = err?.response?.status;
      const errObj = ERRORS[status];
      setError(errObj ? errObj[lang] || errObj.en : toApiError(err).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="stack">
      <p className="muted">
        {t(
          "Enter the registration number and mobile number received at registration. The certificate is available only after verification is complete.",
          "नोंदणी करताना मिळालेला नोंदणी क्रमांक आणि मोबाईल क्रमांक लिहा. पडताळणी पूर्ण झाल्यावरच अभिनंदन पत्र उपलब्ध होते."
        )}
      </p>
      {done && (
        <div className="alert alert--success" role="status">
          <CheckCircle2 aria-hidden="true" />
          <span>{t("Congratulations! Your certificate has been downloaded (check your Downloads folder).", "अभिनंदन! आपले अभिनंदन पत्र डाउनलोड झाले आहे (Downloads फोल्डर पाहा).")}</span>
        </div>
      )}
      <Lookup initial={initial} submitLabel={t("Download Certificate", "अभिनंदन पत्र डाउनलोड करा")} busy={busy} error={error} onSubmit={download} />
    </div>
  );
}

const STATUS_ICON = { pending: Clock, info_requested: AlertCircle, verified: BadgeCheck, rejected: XCircle, duplicate: XCircle };

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
            try { setPhoto(await preparePhoto(f)); setError(""); } catch (err) { setError(err.message); }
          }} />
      </div>
      <Field label={t("Note (optional)", "टीप (ऐच्छिक)")}>
        {(p) => <textarea {...p} className="textarea" value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={500} />}
      </Field>
      {error && <div className="alert alert--error" role="alert"><AlertCircle aria-hidden="true" /><span>{error}</span></div>}
      <div>
        <button type="submit" className="btn btn--primary" disabled={busy}>
          {busy && <Loader2 className="spin" aria-hidden="true" />} {t("Resubmit for Verification", "पुन्हा पडताळणीसाठी पाठवा")}
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
              {result.fort && <div><dt>{t("Fort", "दुर्ग")}</dt><dd>{result.fort}</dd></div>}
              {result.district && <div><dt>{t("District", "जिल्हा")}</dt><dd>{result.district}</dd></div>}
            </dl>
            {result.note && <p className="status-card__note"><strong>{t("Note from AMRUT:", "अमृत संस्थेची टीप:")}</strong> {result.note}</p>}
            {result.status === "pending" && (
              <p className="muted">
                {t(
                  "Your registration is in the verification queue. The certificate will be available here once verification is complete.",
                  "आपली नोंदणी पडताळणीसाठी रांगेत आहे. पडताळणी पूर्ण झाल्यावर अभिनंदन पत्र येथून डाउनलोड करता येईल."
                )}
              </p>
            )}
            {result.certificate_available && <DownloadInline query={query} />}
          </div>
          {result.status === "info_requested" && <Resubmit query={query} onDone={setResult} />}
        </motion.div>
      )}
    </div>
  );
}

function DownloadInline({ query }) {
  const t = useT();
  const [busy, setBusy] = useState(false);
  return (
    <button type="button" className="btn btn--primary" disabled={busy} onClick={async () => {
      setBusy(true);
      try {
        const res = await http.get("/certificates/download", { params: query, responseType: "blob", timeout: 60000 });
        const url = URL.createObjectURL(res.data);
        Object.assign(document.createElement("a"), { href: url, download: `Durgotsav-2026-${query.registration}.pdf` }).click();
        setTimeout(() => URL.revokeObjectURL(url), 10000);
      } finally {
        setBusy(false);
      }
    }}>
      {busy ? <Loader2 className="spin" aria-hidden="true" /> : <Download aria-hidden="true" />} {t("Download Certificate", "अभिनंदन पत्र डाउनलोड करा")}
    </button>
  );
}

function VerifyTab() {
  const t = useT();
  const { lang } = useLang();
  const [number, setNumber] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const fmtDate = (v) => lang === "mr" ? mrDate(v) : enDate(v);

  async function verify(e) {
    e.preventDefault();
    if (number.trim().length < 5) return setError(t("Please enter the certificate number.", "अभिनंदन पत्रावरील क्रमांक लिहा."));
    setBusy(true);
    setError("");
    setResult(null);
    try {
      const { data } = await http.get(`/certificates/verify/${encodeURIComponent(number.trim())}`);
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
  return (
    <div className="stack">
      <p className="muted">
        {t(
          "Enter the number printed at the bottom of the certificate (e.g. AMRUT-DGT26-000123) to verify it is authentic.",
          "अभिनंदन पत्राच्या खालच्या भागात छापलेला क्रमांक (उदा. AMRUT-DGT26-000123) लिहून ते अधिकृत आहे का ते तपासा."
        )}
      </p>
      <form className="cluster verify-form" onSubmit={verify} noValidate>
        <label className="sr-only" htmlFor="cert-no">{t("Certificate Number", "अभिनंदन पत्र क्रमांक")}</label>
        <input id="cert-no" className="input" value={number} onChange={(e) => setNumber(e.target.value.toUpperCase())} placeholder="AMRUT-DGT26-000123" maxLength={40} />
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
              ? <><strong>{t("Authentic certificate.", "अधिकृत अभिनंदन पत्र.")}</strong> {result.name}{result.district ? `, ${result.district}` : ""} — {fmtDate(result.issued_at)}.</>
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
  const TABS = TABS_DEF.map(([k, label, Icon]) => [k, label[lang] || label.en, Icon]);
  const tab = TABS.some(([k]) => k === params.get("tab")) ? params.get("tab") : "download";
  const select = (key) => setParams((p) => { p.set("tab", key); return p; }, { replace: true });

  return (
    <>
      <Seo
        title={t("Congratulation Certificate", "अभिनंदन पत्र")}
        description={t(
          "Durgotsav 2026 — download your digital certificate, check registration status, and verify certificates.",
          "दुर्गोत्सव २०२६ — नोंदणी क्रमांक व मोबाईल क्रमांक वापरून डिजिटल अभिनंदन पत्र डाउनलोड करा, नोंदणी स्थिती तपासा आणि अभिनंदन पत्राची पडताळणी करा."
        )}
      />
      <PageHero
        eyebrow={t("॥ Certificate ॥", "॥ अभिनंदन पत्र ॥")}
        title={t("Your Digital Certificate", "आपले डिजिटल अभिनंदन पत्र")}
        lead={t(
          "The certificate becomes available here after verification of registration and photo (usually within 24 hours).",
          "नोंदणी व छायाचित्राची पडताळणी पूर्ण झाल्यानंतर (शक्यतो २४ तासांच्या आत) अभिनंदन पत्र येथे उपलब्ध होते."
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
            {tab === "download" && <DownloadTab initial={initialReg} />}
            {tab === "status" && <StatusTab initial={initialReg} />}
            {tab === "verify" && <VerifyTab />}
          </div>
          <p className="muted" style={{ fontSize: "var(--text-sm)" }}>
            {t(
              <>The certificate is a record of participation and verified photo in Durgotsav; it does not create any financial, governmental or other rights. If you have any difficulty <Link to="/contact">contact us</Link>.</>,
              <>अभिनंदन पत्र हे दुर्गोत्सवातील सहभाग व छायाचित्राची पडताळणी पूर्ण झाल्याची नोंद आहे; त्यातून कोणताही आर्थिक, शासकीय पदाचा किंवा अन्य हक्क निर्माण होत नाही. अडचण असल्यास <Link to="/contact">संपर्क साधा</Link>.</>
            )}
          </p>
        </div>
      </section>
      <StatsBand />
    </>
  );
}
