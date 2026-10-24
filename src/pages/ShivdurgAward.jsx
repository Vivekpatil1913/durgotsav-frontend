import {
  BookOpenCheck, Building2, CalendarDays, Check, CheckCircle2, ClipboardList, Copy, ExternalLink, FileText, Landmark, LifeBuoy, Loader2,
  Mail, MapPin, Phone, Search, Trophy, User, Users,
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import "../components/award/award.css";
import { ImportantDates } from "../components/home/ImportantDates.jsx";
import { Seo } from "../components/seo/Seo.jsx";
import { Accordion } from "../components/ui/Accordion.jsx";
import { ErrorState } from "../components/ui/PageParts.jsx";
import { Reveal } from "../components/ui/Reveal.jsx";
import { EDITION_YEAR, EDITION_YEAR_MR } from "../config/edition.js";
import { useLang, useT } from "../context/LanguageContext.jsx";
import { useSite } from "../context/SiteContext.jsx";
import { useApi } from "../hooks/useApi.js";
import { http, SITE_URL, toApiError } from "../lib/api.js";
import { AWARD_PATH, localContent, pick } from "../lib/award.js";
import { assetUrl } from "../lib/format.js";
import { StatusPill, useAwardDates } from "../components/award/AwardStatus.jsx";

// Decorative full-bleed backdrop: the hill fort + saffron flag sit centre-right, the dark left
// side carries the text. alt="" because the heading already names the page.
function AwardBackdrop() {
  return (
    <div className="aw-hero__bg" aria-hidden="true">
      <picture>
        <source type="image/avif" srcSet="/images/award/fort-sunset-768.avif 768w, /images/award/fort-sunset-1280.avif 1280w, /images/award/fort-sunset-1672.avif 1672w" sizes="100vw" />
        <source type="image/webp" srcSet="/images/award/fort-sunset-768.webp 768w, /images/award/fort-sunset-1280.webp 1280w, /images/award/fort-sunset-1672.webp 1672w" sizes="100vw" />
        <img src="/images/award/fort-sunset-1280.webp" alt="" width="1672" height="941" decoding="async" fetchPriority="high" />
      </picture>
    </div>
  );
}

function StatusLookup() {
  const t = useT();
  const date = useAwardDates();
  const [ref, setRef] = useState("");
  const [mobile, setMobile] = useState("");
  const [state, setState] = useState({ loading: false, data: null, error: "" });
  async function lookup(e) {
    e.preventDefault();
    if (!/^[A-Za-z0-9-]{5,30}$/.test(ref.trim()) || !/^[6-9]\d{9}$/.test(mobile)) {
      return setState({ loading: false, data: null, error: t("Enter the reference number and a valid 10-digit mobile number.", "संदर्भ क्रमांक व १० अंकी मोबाईल क्रमांक लिहा.") });
    }
    setState({ loading: true, data: null, error: "" });
    try {
      const { data } = await http.get(`/shivdurg-award/nominations/${encodeURIComponent(ref.trim())}`, { params: { mobile } });
      setState({ loading: false, data: data.data, error: "" });
    } catch (err) {
      setState({ loading: false, data: null, error: toApiError(err).status === 404 ? t("No nomination matches these details.", "या माहितीशी जुळणारा अर्ज आढळला नाही.") : toApiError(err).message });
    }
  }
  return (
    <form className="card-light aw-lookup" onSubmit={lookup} noValidate aria-labelledby="aw-lookup-title">
      <h3 id="aw-lookup-title"><Search aria-hidden="true" /> {t("Check your nomination", "अर्जाची स्थिती तपासा")}</h3>
      <div className="aw-lookup__row">
        <label className="sr-only" htmlFor="aw-ref">{t("Reference number", "संदर्भ क्रमांक")}</label>
        <input id="aw-ref" className="input" placeholder={t("Reference no. (ASBP26-…)", "संदर्भ क्रमांक (ASBP26-…)")} value={ref} onChange={(e) => setRef(e.target.value.toUpperCase())} maxLength={30} />
        <label className="sr-only" htmlFor="aw-mob">{t("Mobile number", "मोबाईल क्रमांक")}</label>
        <input id="aw-mob" className="input" type="tel" inputMode="numeric" placeholder={t("Nominator mobile", "नामनिर्देशकाचा मोबाईल")} value={mobile}
          onChange={(e) => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))} />
        <button type="submit" className="btn btn--primary" disabled={state.loading}>{state.loading ? <Loader2 className="spin" aria-hidden="true" /> : <Search aria-hidden="true" />} {t("Check", "तपासा")}</button>
      </div>
      <div aria-live="polite">
        {state.error && <p className="field__error">{state.error}</p>}
        {state.data && (
          <div className="alert alert--success">
            <CheckCircle2 aria-hidden="true" />
            <span>
              <strong>{state.data.reference_no}</strong> · {state.data.nominee_name} —{" "}
              {state.data.status === "submitted" ? t("received", "अर्ज प्राप्त") : t("under scrutiny by the committee", "समितीकडून छाननी सुरू")}
              {" "}({date(state.data.submitted_at)})
            </span>
          </div>
        )}
      </div>
    </form>
  );
}

const OFFLINE_ADDRESS = {
  en: ["5th Floor, AMRUT Building", "Near Bhimsen Joshi Sabhagruh, Ward No. 8", "PMRDA, Aundh, Pune", "Maharashtra 411067"],
  mr: ["५ वा मजला, अमृत इमारत", "भीमसेन जोशी सभागृहाजवळ, वॉर्ड क्र. ८", "पीएमआरडीए, औंध, पुणे", "महाराष्ट्र ४११०६७"],
};
const OFFLINE_MAP_URL = "https://www.google.com/maps/search/?api=1&query=" +
  encodeURIComponent("AMRUT Building, near Bhimsen Joshi Sabhagruh, Aundh, Pune 411067");

// Postal / in-person address for offline nominations, shown under the process steps.
function OfflineAddress({ t }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(OFFLINE_ADDRESS.en.join(", "));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* clipboard blocked — the address is still selectable */ }
  };
  return (
    <div className="aw-offline">
      <div className="aw-offline__head">
        <span className="aw-offline__icon"><MapPin aria-hidden="true" /></span>
        <div>
          <h3>{t("Submitting offline?", "ऑफलाइन नामनिर्देशन")}</h3>
          <p>{t("Send the filled form and supporting documents by post or hand them in at:", "भरलेला अर्ज व आवश्यक कागदपत्रे पोस्टाने पाठवा किंवा प्रत्यक्ष येथे जमा करा:")}</p>
        </div>
      </div>
      <address className="aw-offline__address">
        <strong>{t("Maharashtra Research, Upliftment and Training Academy (AMRUT)", "महाराष्ट्र संशोधन, उन्नती व प्रशिक्षण प्रबोधिनी (अमृत)")}</strong>
        {t(OFFLINE_ADDRESS.en, OFFLINE_ADDRESS.mr).map((line) => <span key={line}>{line}</span>)}
      </address>
      <div className="cluster aw-offline__actions">
        <a className="btn btn--outline btn--sm" href={OFFLINE_MAP_URL} target="_blank" rel="noreferrer">
          <ExternalLink aria-hidden="true" /> {t("Open in Maps", "नकाशात पहा")}
        </a>
        <button type="button" className="btn btn--outline btn--sm" onClick={copy} aria-live="polite">
          {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />} {copied ? t("Copied", "कॉपी झाला") : t("Copy address", "पत्ता कॉपी करा")}
        </button>
      </div>
    </div>
  );
}

export default function ShivdurgAward() {
  const t = useT();
  const { lang } = useLang();
  const date = useAwardDates();
  const { settings } = useSite();
  const { data, error, loading, reload } = useApi("/shivdurg-award");
  const award = data?.data;
  const e = award?.edition;
  const c = localContent(e, lang);
  const status = award?.status;
  const title = e ? t(e.title_en || e.title, e.title) : t(`Shivdurg Bhushan Puraskar ${EDITION_YEAR}`, `शिवदुर्ग भूषण पुरस्कार ${EDITION_YEAR_MR}`);
  const tagline = e ? t(e.tagline_en || e.tagline, e.tagline) : "";

  const jsonLd = e && {
    "@context": "https://schema.org",
    "@type": "Event",
    name: pick(lang, e.title, e.title_en),
    description: pick(lang, e.tagline, e.tagline_en),
    startDate: e.nomination_opens_at,
    endDate: e.nomination_closes_at,
    eventAttendanceMode: "https://schema.org/OnlineEventAttendanceMode",
    eventStatus: "https://schema.org/EventScheduled",
    location: { "@type": "VirtualLocation", url: `${SITE_URL}${AWARD_PATH}` },
    image: `${SITE_URL}/images/award/fort-sunset-og.jpg`,
    organizer: { "@type": "Organization", name: "AMRUT", url: SITE_URL },
  };

  const nominate = (category) => (status?.open
    ? <Link to={`${AWARD_PATH}/nominate?type=${category}`} className="btn btn--primary">{category === "organization" ? <Building2 aria-hidden="true" /> : <User aria-hidden="true" />} {category === "organization" ? t("Nominate an Organization", "संस्था नामनिर्देशन") : t("Nominate an Individual", "व्यक्ती नामनिर्देशन")}</Link>
    : <span className="btn btn--outline" aria-disabled="true">{t("Nominations closed", "नामनिर्देशन बंद")}</span>);

  const winners = award?.winners ?? [];
  const prizes = e ? [
    ["individual", User, t("Individual category", "व्यक्तिगत विभाग"), pick(lang, e.prize_individual, e.prize_individual_en), t("For a person doing remarkable work for forts.", "गडदुर्गांसाठी उल्लेखनीय कार्य करणाऱ्या व्यक्तीसाठी.")],
    ["organization", Building2, t("Organization category", "संस्थात्मक विभाग"), pick(lang, e.prize_organization, e.prize_organization_en), t("For an organisation, trust or group working for forts.", "गडदुर्गांसाठी कार्य करणाऱ्या संस्था, न्यास किंवा गटासाठी.")],
  ] : [];

  return (
    <>
      <Seo
        title={title}
        description={e ? pick(lang, e.tagline, e.tagline_en) : t(`Shivdurg Bhushan Puraskar ${EDITION_YEAR} — honouring individuals and organisations working for fort conservation, research and awareness.`, `शिवदुर्ग भूषण पुरस्कार ${EDITION_YEAR_MR} — गडदुर्ग संवर्धन, संशोधन व जनजागृतीसाठी कार्य करणाऱ्या व्यक्ती व संस्थांचा सन्मान.`)}
        image="/images/award/fort-sunset-og.jpg"
        jsonLd={jsonLd}
      />

      <section className="aw-hero surface-night" aria-labelledby="aw-title">
        <AwardBackdrop />
        <div className="aw-hero__shade" aria-hidden="true" />
        <div className="container aw-hero__grid">
          <div className="aw-hero__text">
            <nav aria-label="breadcrumb">
              <ol className="breadcrumbs">
                <li><Link to="/">{t("Home", "मुख्य पृष्ठ")}</Link></li>
                <li aria-current="page">{t("Shivdurg Bhushan Award", "शिवदुर्ग भूषण पुरस्कार")}</li>
              </ol>
            </nav>
            <span className="aw-hero__pre">{t("Amrut", "अमृत")}</span>
            <h1 id="aw-title" className="aw-hero__title">{title}</h1>
            {tagline && <p className="aw-hero__lead">{tagline}</p>}
            <StatusPill status={status} />
            <div className="cluster aw-hero__actions">
              {e && nominate("individual")}
              {e && nominate("organization")}
              <a href="#about" className="btn btn--ghost">{t("Award details", "पुरस्काराची माहिती")}</a>
            </div>
          </div>
          <figure className="aw-hero__card">
            <picture>
              <source type="image/avif" srcSet="/images/award/shivdurg-award-480.avif 480w, /images/award/shivdurg-award-900.avif 900w" sizes="(max-width: 1024px) 0px, 20vw" />
              <source type="image/webp" srcSet="/images/award/shivdurg-award-480.webp 480w, /images/award/shivdurg-award-900.webp 900w" sizes="(max-width: 1024px) 0px, 20vw" />
              <img src="/images/award/shivdurg-award-480.webp" alt={t("Amrut Shivdurg Bhushan Puraskar award plaque", "अमृत शिवदुर्ग भूषण पुरस्काराचे सन्मानचिन्ह")}
                width="900" height="1125" loading="lazy" decoding="async" />
            </picture>
          </figure>
        </div>
      </section>

      {loading && !award && <div className="section container" aria-busy="true"><div className="skeleton" style={{ height: 320 }} /></div>}
      {error && <div className="section container"><ErrorState error={error} onRetry={reload} /></div>}

      {e && (<>
        <section id="about" className="section surface-parchment">
          <div className="container aw-split">
            <Reveal className="stack">
              <span className="eyebrow">{t("About the award", "पुरस्काराविषयी")}</span>
              <h2>{t("Honouring individuals and organisations doing outstanding work in the history, research, preservation and conservation of Maharashtra's forts.", "महाराष्ट्रातील गडदुर्गांचा इतिहास, संशोधन, जतन व संवर्धनासाठी उल्लेखनीय कार्य करणाऱ्या व्यक्ती आणि संस्थांचा सन्मान.")}</h2>
              {c.intro && <p className="aw-lead">{c.intro}</p>}
            </Reveal>
            {c.objectives?.length > 0 && (
              <Reveal className="card-light aw-card" delay={0.1}>
                <h3><Landmark aria-hidden="true" /> {t("Objectives", "उद्दिष्टे")}</h3>
                <ul className="aw-ticks">{c.objectives.map((o) => <li key={o}>{o}</li>)}</ul>
              </Reveal>
            )}
          </div>
        </section>

        <section className="section" aria-labelledby="aw-cats">
          <div className="container">
            <div className="section-head section-head--center">
              <span className="eyebrow">{t("Categories & prizes", "विभाग व पारितोषिके")}</span>
              <h2 id="aw-cats">{t("Two award categories", "पुरस्काराचे दोन विभाग")}</h2>
            </div>
            <div className="aw-prizes">
              {prizes.map(([key, Icon, name, prize, desc], i) => (
                <Reveal key={key} className="aw-prize" delay={i * 0.08}>
                  <span className="aw-prize__icon"><Icon aria-hidden="true" /></span>
                  <h3>{name}</h3>
                  <p className="aw-prize__amount">{prize}</p>
                  <p>{desc}</p>
                  {nominate(key)}
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <ImportantDates
          className="idates--award"
          watermark={false}
          only={["shiv-pratap-din"]}
          overrides={{ "shiv-pratap-din": { num: t("01", "०१"), date: `${date(e.nomination_opens_at)} – ${date(e.nomination_closes_at)}` } }}
          eyebrow={t("Award ceremony", "पुरस्कार सोहळा")}
          title={t("Shivdurg Bhushan Puraskar", "शिवदुर्ग भूषण पुरस्कार")}
          accent={t(EDITION_YEAR, EDITION_YEAR_MR)}
          subtitle={t(
            "Send your nominations within the nomination period. The award will be presented at the grand Shiv Pratap Din ceremony.",
            "नामनिर्देशन कालावधीत आपले नामनिर्देशन पाठवा. पुरस्काराचे वितरण शिव प्रताप दिनाच्या भव्य सोहळ्यात होईल."
          )}
        />

        <section className="section surface-parchment" aria-labelledby="aw-dates">
          <div className="container">
            <div className="section-head section-head--center">
              <span className="eyebrow">{t("Important dates", "महत्त्वाचे दिनांक")}</span>
              <h2 id="aw-dates">{t("Timeline", "वेळापत्रक")}</h2>
              <StatusPill status={status} />
            </div>
            <ol className="aw-timeline">
              <li className={status?.reason === "open" ? "is-current" : status?.reason === "closed" ? "is-done" : ""}>
                <CalendarDays aria-hidden="true" />
                <strong>{t("Nomination period", "नामनिर्देशन कालावधी")}</strong>
                <span>{date(e.nomination_opens_at)} – {date(e.nomination_closes_at)}</span>
              </li>
              {e.scrutiny_starts_on && (
                <li>
                  <ClipboardList aria-hidden="true" />
                  <strong>{t("Scrutiny of applications", "अर्जांची छाननी")}</strong>
                  <span>{date(e.scrutiny_starts_on)}{e.scrutiny_ends_on && e.scrutiny_ends_on !== e.scrutiny_starts_on ? ` – ${date(e.scrutiny_ends_on)}` : ""}</span>
                </li>
              )}
              <li>
                <Trophy aria-hidden="true" />
                <strong>{t("Selection & announcement", "निवड व घोषणा")}</strong>
                <span>{t("By the committee, after scrutiny", "छाननीनंतर समितीमार्फत")}</span>
              </li>
            </ol>
            {!status?.open && e.closed_note && <p className="aw-note aw-center">{pick(lang, e.closed_note, e.closed_note_en)}</p>}
          </div>
        </section>

        <section className="section" aria-labelledby="aw-how">
          <div className="container aw-columns">
            {c.eligibility?.length > 0 && (
              <Reveal className="card-light aw-card">
                <h3 id="aw-how"><Users aria-hidden="true" /> {t("Who can be nominated", "पात्रता")}</h3>
                <ul className="aw-ticks">{c.eligibility.map((x) => <li key={x}>{x}</li>)}</ul>
              </Reveal>
            )}
            {c.instructions?.length > 0 && (
              <Reveal className="card-light aw-card" delay={0.08}>
                <h3><BookOpenCheck aria-hidden="true" /> {t("How to nominate", "नामनिर्देशनाच्या सूचना")}</h3>
                <ol className="aw-numbers">{c.instructions.map((x) => <li key={x}>{x}</li>)}</ol>
              </Reveal>
            )}
          </div>
        </section>

        <section className="section surface-parchment" aria-labelledby="aw-process">
          <div className="container aw-columns">
            {c.process?.length > 0 && (
              <div>
                <span className="eyebrow">{t("Process", "प्रक्रिया")}</span>
                <h2 id="aw-process">{t("Nomination process", "नामनिर्देशन प्रक्रिया")}</h2>
                <ol className="aw-steps">{c.process.map((x, i) => <li key={x}><span>{i + 1}</span>{x}</li>)}</ol>
              </div>
            )}
            {c.documents?.length > 0 && (
              <div className="card-light aw-card">
                <h3><FileText aria-hidden="true" /> {t("Supporting documents", "आवश्यक / उपयुक्त कागदपत्रे")}</h3>
                <ul className="aw-ticks">{c.documents.map((x) => <li key={x}>{x}</li>)}</ul>
                <p className="aw-note">{t(`PDF, JPG or PNG up to ${award.uploads.max_mb} MB each, or a link.`, `PDF, JPG किंवा PNG (प्रत्येकी कमाल ${award.uploads.max_mb} MB) किंवा लिंक.`)}</p>
              </div>
            )}
          </div>
          <div className="container">
            <OfflineAddress t={t} />
          </div>
        </section>

        {winners.length > 0 && (
          <section className="section aw-winners-section surface-night" aria-labelledby="aw-winners">
            <div className="container">
              <div className="section-head section-head--center">
                <span className="eyebrow">{t("Previous winners", "मागील पुरस्कारार्थी")}</span>
                <h2 id="aw-winners">{t("Honoured for their service", "सेवेचा गौरव")}</h2>
              </div>
              <div className="aw-winners">
                {winners.map((w) => (
                  <article key={w.id} className={`aw-winner${w.photo ? " aw-winner--photo" : ""}`}>
                    {w.photo && (
                      <img className="aw-winner__photo" src={assetUrl(w.photo)} alt={pick(lang, w.name, w.name_en)}
                        width="1200" height="800" loading="lazy" decoding="async" />
                    )}
                    <Trophy aria-hidden="true" />
                    <span className="aw-winner__cat">{w.category === "organization" ? t("Organization category", "संस्थात्मक विभाग") : t("Individual category", "व्यक्तिगत विभाग")}{w.year ? ` · ${w.year}` : ""}</span>
                    <h3>{pick(lang, w.name, w.name_en)}</h3>
                    {w.description && <p>{pick(lang, w.description, w.description_en)}</p>}
                  </article>
                ))}
              </div>
            </div>
          </section>
        )}

        {award.committee?.length > 0 && (
          <section className="section" aria-labelledby="aw-committee">
            <div className="container">
              <div className="section-head section-head--center">
                <span className="eyebrow">{t("Selection committee", "निवड समिती")}</span>
                <h2 id="aw-committee">{t("Committee members", "समिती सदस्य")}</h2>
              </div>
              <ul className="aw-committee">
                {award.committee.map((m) => <li key={m.id} className="card-light"><strong>{pick(lang, m.name, m.name_en)}</strong>{m.designation && <span>{pick(lang, m.designation, m.designation_en)}</span>}</li>)}
              </ul>
            </div>
          </section>
        )}

        {c.faqs?.length > 0 && (
          <section className="section surface-parchment" aria-labelledby="aw-faq">
            <div className="container container--narrow">
              <div className="section-head section-head--center">
                <span className="eyebrow">{t("FAQ", "प्रश्नोत्तरे")}</span>
                <h2 id="aw-faq">{t("Frequently asked questions", "नेहमी विचारले जाणारे प्रश्न")}</h2>
              </div>
              <Accordion items={c.faqs.map((f, i) => ({ key: i, title: f.q, body: <p>{f.a}</p> }))} />
            </div>
          </section>
        )}

        <section id="status" className="section" aria-labelledby="aw-help">
          <div className="container aw-columns">
            <StatusLookup />
            <div className="card-light aw-card">
              <h3 id="aw-help"><LifeBuoy aria-hidden="true" /> {t("Help & contact", "मदत व संपर्क")}</h3>
              {c.help && <p>{c.help}</p>}
              <ul className="aw-contact">
                {settings.contact?.email && <li><Mail aria-hidden="true" /><a href={`mailto:${settings.contact.email}`}>{settings.contact.email}</a></li>}
                {settings.contact?.phone && <li><Phone aria-hidden="true" /><a href={`tel:${settings.contact.phone.replace(/\s/g, "")}`}>{settings.contact.phone}</a></li>}
              </ul>
              <Link to="/contact" className="link-arrow">{t("Contact page", "संपर्क पान")}</Link>
            </div>
          </div>
        </section>

        <section className="section section--tight surface-night aw-cta">
          <div className="container aw-cta__inner">
            <div>
              <h2>{t("Know someone who protects our forts?", "गडदुर्गांसाठी झटणारे कोणी ओळखीचे आहे?")}</h2>
              <p>{t("Nominate them for the Shivdurg Bhushan Puraskar.", "त्यांचे शिवदुर्ग भूषण पुरस्कारासाठी नामनिर्देशन करा.")}</p>
            </div>
            <div className="cluster">{nominate("individual")}{nominate("organization")}</div>
          </div>
        </section>
      </>)}
    </>
  );
}
