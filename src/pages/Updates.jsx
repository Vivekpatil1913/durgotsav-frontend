import { Megaphone, Pin } from "lucide-react";
import { Link } from "react-router-dom";
import { StatsBand } from "../components/home/HomeSections.jsx";
import { Seo } from "../components/seo/Seo.jsx";
import { EmptyState, ErrorState, PageHero } from "../components/ui/PageParts.jsx";
import { Reveal } from "../components/ui/Reveal.jsx";
import { EDITION_YEAR, EDITION_YEAR_MR } from "../config/edition.js";
import { useLang, useT } from "../context/LanguageContext.jsx";
import { useApi } from "../hooks/useApi.js";
import { enDate, mrDate } from "../lib/format.js";
import "./pages.css";

export default function Updates() {
  const t = useT();
  const { lang } = useLang();
  const { data, error, loading, reload } = useApi("/announcements");
  const items = data?.data ?? [];
  const fmtDate = (v) => lang === "mr" ? mrDate(v) : enDate(v);

  return (
    <>
      <Seo
        title={t("Updates & Announcements", "अपडेट्स व घोषणा")}
        description={t(
          `Official announcements, rule changes and schedule updates for Durgotsav ${EDITION_YEAR}.`,
          `दुर्गोत्सव ${EDITION_YEAR_MR} बाबतच्या अधिकृत घोषणा, नियम व कालावधीतील बदल.`
        )}
      />
      <PageHero
        eyebrow={t("Official Announcements", "अधिकृत घोषणा")}
        title={t("Updates", "अपडेट्स")}
        lead={t(
          "Changes to rules, schedule or procedures are published on this official platform.",
          "नियम, कालावधी किंवा कार्यपद्धतीतील बदलांची माहिती या अधिकृत व्यासपीठावर प्रसिद्ध केली जाते."
        )}
      />
      <section className="section surface-parchment">
        <div className="container container--narrow">
          {error && <ErrorState error={error} onRetry={reload} />}
          {loading && <div className="skeleton" style={{ height: 240 }} />}
          {!loading && !error && items.length === 0 && (
            <EmptyState icon={Megaphone} title={t("No announcements at this time", "सध्या कोणतीही घोषणा नाही")} />
          )}
          <ol className="updates-list">
            {items.map((a, i) => (
              <Reveal as="li" key={a.id} delay={i * 0.04} className="card-light update-item">
                <p className="update-item__meta">
                  {a.is_pinned && <span className="badge"><Pin size={12} aria-hidden="true" /> {t("Important", "महत्त्वाचे")}</span>}
                  <time dateTime={a.published_at}>{fmtDate(a.published_at)}</time>
                </p>
                <h2>{a.title}</h2>
                {a.body && <p className="muted">{a.body}</p>}
                {a.link_url && (
                  a.link_url.startsWith("/")
                    ? <Link to={a.link_url} className="link-arrow">{a.link_label || t("More Info", "अधिक माहिती")} →</Link>
                    : <a href={a.link_url} className="link-arrow" target="_blank" rel="noopener noreferrer">{a.link_label || t("More Info", "अधिक माहिती")} →</a>
                )}
              </Reveal>
            ))}
          </ol>
        </div>
      </section>
      <StatsBand />
    </>
  );
}
