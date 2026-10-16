import { CalendarClock } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import "../components/award/award.css";
import { NominationForm } from "../components/award/NominationForm.jsx";
import { Seo } from "../components/seo/Seo.jsx";
import { ErrorState, PageHero } from "../components/ui/PageParts.jsx";
import { useLang, useT } from "../context/LanguageContext.jsx";
import { useApi } from "../hooks/useApi.js";
import { AWARD_PATH, pick } from "../lib/award.js";
import { StatusPill, useAwardDates } from "../components/award/AwardStatus.jsx";

export default function ShivdurgNominate() {
  const t = useT();
  const { lang } = useLang();
  const date = useAwardDates();
  const [params] = useSearchParams();
  const { data, error, loading, reload } = useApi("/shivdurg-award");
  const award = data?.data;
  const e = award?.edition;
  const status = award?.status;

  return (
    <>
      <Seo title={t("Nomination form — Shivdurg Bhushan Award", "नामनिर्देशन अर्ज — शिवदुर्ग भूषण पुरस्कार")} noindex />
      <PageHero
        className="page-hero--nominate"
        media={
          <picture>
            <source type="image/avif" srcSet="/images/award/nominate-sunset-768.avif 768w, /images/award/nominate-sunset-1280.avif 1280w, /images/award/nominate-sunset-1672.avif 1672w" sizes="100vw" />
            <source type="image/webp" srcSet="/images/award/nominate-sunset-768.webp 768w, /images/award/nominate-sunset-1280.webp 1280w, /images/award/nominate-sunset-1672.webp 1672w" sizes="100vw" />
            <img src="/images/award/nominate-sunset-1280.webp" alt="" width="1672" height="941" decoding="async" fetchPriority="high" />
          </picture>
        }
        eyebrow={t("Nomination", "नामनिर्देशन")}
        title={e ? pick(lang, e.title, e.title_en) : t("Shivdurg Bhushan Puraskar 2026", "शिवदुर्ग भूषण पुरस्कार २०२६")}
        crumbs={[[AWARD_PATH, t("Shivdurg Bhushan Award", "शिवदुर्ग भूषण पुरस्कार")]]}
        lead={t("Choose the category, fill in the details, add evidence, review and submit.", "विभाग निवडा, माहिती भरा, पुरावे जोडा, पुनरावलोकन करा आणि अर्ज सादर करा.")}
      >
        <StatusPill status={status} />
      </PageHero>
      <section className="section section--tight surface-parchment">
        <div className="container aw-form-wrap">
          {loading && !award && <div className="skeleton" style={{ height: 420 }} aria-busy="true" />}
          {error && <ErrorState error={error} onRetry={reload} />}
          {award && (status.open
            ? <NominationForm award={award} initialCategory={params.get("type")} />
            : (
              <div className="card-light closed-notice" role="status">
                <CalendarClock aria-hidden="true" />
                <h2>{status.reason === "not_started" ? t("Nominations will open soon", "नामनिर्देशन लवकरच सुरू होईल") : t("Nominations are closed", "नामनिर्देशन बंद आहे")}</h2>
                <p>
                  {status.reason === "not_started"
                    ? t(`Nominations open from ${date(status.opensAt)} to ${date(status.closesAt)}.`, `नामनिर्देशन ${date(status.opensAt)} ते ${date(status.closesAt)} दरम्यान स्वीकारले जातील.`)
                    : pick(lang, e.closed_note, e.closed_note_en) || t("The nomination period has ended.", "नामनिर्देशनाची मुदत संपली आहे.")}
                </p>
                <Link to={AWARD_PATH} className="btn btn--primary">{t("Back to award page", "पुरस्कार पानावर जा")}</Link>
              </div>
            ))}
        </div>
      </section>
    </>
  );
}
