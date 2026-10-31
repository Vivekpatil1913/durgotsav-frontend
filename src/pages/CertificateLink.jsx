import { AlertCircle, BadgeCheck, Clock, Loader2, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { CertificateButtons } from "../components/certificate/CertificateButtons.jsx";
import { Seo } from "../components/seo/Seo.jsx";
import { PageHero } from "../components/ui/PageParts.jsx";
import { useLang, useT } from "../context/LanguageContext.jsx";
import { http, toApiError } from "../lib/api.js";
import { assetUrl, enDate, mr, mrDate, STATUS, STATUS_EN } from "../lib/format.js";
import "../components/certificate/certificate.css";
import "./pages.css";

// /c/<token>: the participant's own page, linked from the SMS, the email and the pop-up after registering. It shows the
// registration's status and, once an admin has approved it, the certificate as PDF or image — without typing anything.
export default function CertificateLink() {
  const t = useT();
  const { lang } = useLang();
  const { token } = useParams();
  const [state, setState] = useState({ loading: true });

  useEffect(() => {
    let alive = true;
    setState({ loading: true });
    http.get(`/certificates/link/${encodeURIComponent(token)}`)
      .then((r) => alive && setState({ data: r.data.data }))
      .catch((err) => alive && setState({ error: toApiError(err) }));
    return () => {
      alive = false;
    };
  }, [token]);

  const { data, error, loading } = state;
  const num = (n) => (lang === "mr" ? mr(n) : String(n));
  const ready = data?.certificate_available;
  const refused = data && ["rejected", "duplicate"].includes(data.status);
  const tone = ready ? "ok" : refused ? "muted" : "waiting";
  const Icon = ready ? BadgeCheck : refused ? XCircle : Clock;
  const state_ = ready ? t("Certificate ready", "अभिनंदन पत्र उपलब्ध") : data && (lang === "mr" ? STATUS : STATUS_EN)[data.status]?.label;

  return (
    <>
      <Seo title={t("Your Registration", "आपली नोंदणी")} noindex />
      <PageHero eyebrow={t("॥ Certificate ॥", "॥ अभिनंदन पत्र ॥")} title={t("Your Registration & Certificate", "आपली नोंदणी व अभिनंदन पत्र")} />
      <section className="section surface-parchment">
        <div className="container container--narrow stack">
          {loading && <div className="card-light"><p className="muted"><Loader2 className="spin" aria-hidden="true" /> {t("Loading…", "लोड होत आहे…")}</p></div>}
          {error && (
            <div className="alert alert--error" role="alert">
              <AlertCircle aria-hidden="true" />
              <span>
                {error.status === 404 || error.status === 400
                  ? t("This link is not valid. Find your registrations with your mobile number instead.", "ही लिंक वैध नाही. आपल्या मोबाईल क्रमांकावरून आपल्या नोंदणी शोधा.")
                  : error.message}{" "}
                <Link to="/certificate">{t("My registrations", "माझ्या नोंदणी")}</Link>
              </span>
            </div>
          )}
          {data && (
            <article className={`cert-card cert-card--${tone}`}>
              {data.thumb_path ? <img className="cert-card__photo" src={assetUrl(data.thumb_path)} alt="" /> : <span className="cert-card__photo" aria-hidden="true" />}
              <div className="stack" style={{ gap: 12 }}>
                <span className="cert-card__state"><Icon aria-hidden="true" /> {state_}</span>
                <h2 style={{ margin: 0 }}>{data.name}</h2>
                <dl className="cert-facts">
                  <div><dt>{t("Registration number", "नोंदणी क्रमांक")}</dt><dd>{data.registration_no}</dd></div>
                  {data.durgveer_no && <div><dt>{t("Durgveer No.", "दुर्गवीर क्र.")}</dt><dd>{num(data.durgveer_no)}</dd></div>}
                </dl>
                <p className="muted" style={{ margin: 0 }}>
                  {[data.district, lang === "mr" ? mrDate(data.submitted_at) : enDate(data.submitted_at)].filter(Boolean).join(" · ")}
                </p>
                {data.note && <p className="cert-card__note"><strong>{t("Note from AMRUT:", "अमृत संस्थेची टीप:")}</strong> {data.note}</p>}
                {ready && <CertificateButtons token={token} primary={t("Get Certificate", "अभिनंदन पत्र मिळवा")} />}
                {data.status === "pending" && (
                  <p className="cert-card__hint">
                    {t("AMRUT is checking your photo and details. Once verified, your certificate can be downloaded right here — the link also comes by SMS.", "अमृत संस्था आपले छायाचित्र व माहिती तपासत आहे. पडताळणी पूर्ण झाल्यावर अभिनंदन पत्र येथूनच डाउनलोड करता येईल — त्याची लिंक SMS नेही मिळेल.")}
                  </p>
                )}
                {data.status === "info_requested" && (
                  <Link className="btn btn--outline btn--sm" to={`/certificate?tab=status&registration=${encodeURIComponent(data.registration_no)}`}>
                    {t("Send the information asked for", "मागितलेली माहिती पाठवा")}
                  </Link>
                )}
              </div>
            </article>
          )}
          <p className="muted" style={{ fontSize: "var(--text-sm)" }}>
            <Link to="/certificate">{t("All registrations on your mobile number →", "आपल्या मोबाईल क्रमांकावरील सर्व नोंदणी →")}</Link>
          </p>
        </div>
      </section>
    </>
  );
}
