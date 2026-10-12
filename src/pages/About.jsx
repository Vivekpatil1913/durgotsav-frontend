import { Award, Landmark } from "lucide-react";
import { Link } from "react-router-dom";
import { StatsBand } from "../components/home/HomeSections.jsx";
import { Seo } from "../components/seo/Seo.jsx";
import { Img } from "../components/ui/Img.jsx";
import { ErrorState, PageHero } from "../components/ui/PageParts.jsx";
import { Reveal } from "../components/ui/Reveal.jsx";
import { useLang, useT } from "../context/LanguageContext.jsx";
import { useSite } from "../context/SiteContext.jsx";
import { useApi } from "../hooks/useApi.js";
import { Markdown } from "../lib/markdown.jsx";
import "./pages.css";

export default function About() {
  const { data, error, reload } = useApi("/pages/mission");
  const { settings } = useSite();
  const t = useT();
  const { lang } = useLang();
  const page = data?.data;
  const pageTitle = page ? (lang === "mr" ? page.title : (page.title_en || page.title)) : null;
  const pageBody  = page ? (lang === "mr" ? page.body  : (page.body_en  || page.body))  : null;
  return (
    <>
      <Seo title={t("Campaign Objectives", "मोहिमेचे उद्दिष्ट")} description={page?.meta_description} />
      <PageHero
        eyebrow={t("The Need & Concept of Durgotsav", "दुर्गोत्सवाची आवश्यकता व संकल्पना")}
        title={t("Campaign Objectives", pageTitle || "मोहिमेचे उद्दिष्ट")}
        lead={t(
          "Encouraging the folk tradition of building fort replicas and raising public awareness about fort conservation.",
          "गड-दुर्गांच्या प्रतिकृती तयार करण्याच्या लोकपरंपरेस प्रोत्साहन आणि दुर्गसंवर्धनाविषयी जनजागृती."
        )}
      />
      <section className="section surface-parchment">
        <div className="container about-layout">
          <article>
            {error && <ErrorState error={error} onRetry={reload} />}
            {page ? <Markdown source={pageBody} /> : !error && <div className="skeleton" style={{ height: 520 }} />}
          </article>
          <aside className="stack about-aside">
            <Reveal className="img-frame about-aside__img">
              <Img src="/images/rajgad-900.webp" alt={t("Rajgad — monsoon view", "राजगड — पावसाळ्यातील दृश्य")} width="900" height="599" />
            </Reveal>
            <Reveal className="card-light stack" delay={0.05}>
              <p className="about-fact">
                <Landmark aria-hidden="true" />
                <span><strong>{t("12 Forts", "१२ दुर्ग")}</strong> — {settings.initiative?.unesco_title}, {t("UNESCO World Heritage (2025)", "युनेस्को जागतिक वारसा (२०२५)")}</span>
              </p>
              <p className="about-fact">
                <Award aria-hidden="true" />
                <span><strong>{t("World Record", "विश्वविक्रम")}</strong> — Durgotsav 2025: Largest Online Photo Album of Handmade Sculptures</span>
              </p>
              <Link to="/participate" className="btn btn--primary btn--block">{t("Participate", "सहभागी व्हा")}</Link>
            </Reveal>
          </aside>
        </div>
      </section>
      <StatsBand />
    </>
  );
}
