import { ExternalLink, Headphones, Play } from "lucide-react";
import { useState } from "react";
import { useLang, useT } from "../../context/LanguageContext.jsx";
import { Img } from "../ui/Img.jsx";
import { Reveal } from "../ui/Reveal.jsx";
import "./podcasts.css";

// Podcasts recorded during Durgotsav 2025 (YouTube video ids)
export const PODCASTS = [
  {
    id: "a1e7gGWgisQ",
    title: { mr: "शिवछत्रपतींचे गडदुर्ग रहस्य – प्र. के. घाणेकर यांची ज्ञानगाथा | भाग पहिला", en: "Secrets of Shivaji Maharaj's Forts – The Knowledge Saga of P. K. Ghanekar | Part 1" },
  },
  {
    id: "q6-J8HfxacY",
    title: { mr: "शिवछत्रपतींचे गडदुर्ग रहस्य – प्र. के. घाणेकर यांची ज्ञानगाथा | भाग दुसरा", en: "Secrets of Shivaji Maharaj's Forts – The Knowledge Saga of P. K. Ghanekar | Part 2" },
  },
  {
    id: "ERUZw50VpSI",
    title: { mr: "छत्रपतींच्या किल्ल्यांमागची कथा: शौर्य आणि संस्कारांचा प्रवास", en: "The Story Behind Chhatrapati's Forts: A Journey of Valour and Values" },
  },
  {
    id: "Jvdb3nCGpsc",
    title: { mr: "Inside AMRUT’s Guinness Record: Official Remarks by Mr. Praveen Patel", en: "Inside AMRUT’s Guinness Record: Official Remarks by Mr. Praveen Patel" },
  },
  {
    id: "SOxzZ50gEoM",
    title: { mr: "SHIVABA RAJA – By AMRUT", en: "SHIVABA RAJA – By AMRUT" },
  },
];

const thumb = (id, size = "hqdefault") => `https://i.ytimg.com/vi/${id}/${size}.jpg`;
const toMr = (s) => String(s).replace(/[0-9]/g, (d) => "०१२३४५६७८९"[d]);
const num = (n, mr) => {
  const s = String(n).padStart(2, "0");
  return mr ? toMr(s) : s;
};

export function Podcasts({ className = "" }) {
  const t = useT();
  const isMr = useLang().lang === "mr";
  const [active, setActive] = useState(0);
  const [playing, setPlaying] = useState(false);
  const current = PODCASTS[active];
  const title = (p) => t(p.title.en, p.title.mr);

  const select = (i) => {
    setActive(i);
    setPlaying(true);
  };

  return (
    <section id="podcasts" className={`section surface-parchment podcasts ${className}`.trim()} aria-labelledby="podcasts-title">
      <div className="container">
        <Reveal className="section-head podcasts__head">
          <span className="eyebrow">{t("Durgotsav 2025 — Podcasts", "दुर्गोत्सव २०२५ — पॉडकास्ट")}</span>
          <h2 id="podcasts-title" className="podcasts__title">{t("Listen to the Stories of Forts", "दुर्गांच्या कथा ऐका")}</h2>
          <p className="podcasts__lead">
            {t(
              "Conversations recorded during last year's Durgotsav — historians, experts and the AMRUT team on the forts of Chhatrapati Shivaji Maharaj and the world record journey.",
              "गेल्या वर्षीच्या दुर्गोत्सवात झालेले संवाद — शिवछत्रपतींचे दुर्ग आणि विश्वविक्रमाच्या प्रवासाविषयी इतिहासतज्ज्ञ, अभ्यासक व अमृत टीमचे विचार."
            )}
          </p>
        </Reveal>

        <div className="podcasts__layout">
          <Reveal className="podcasts__player">
            <div className="podcasts__frame">
              {playing ? (
                <iframe
                  key={current.id}
                  src={`https://www.youtube-nocookie.com/embed/${current.id}?autoplay=1&rel=0`}
                  title={title(current)}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <button type="button" onClick={() => setPlaying(true)} aria-label={t(`Play: ${title(current)}`, `चालू करा: ${title(current)}`)}>
                  <Img src={thumb(current.id, "hqdefault")} alt="" width="480" height="360" />
                  <span className="podcasts__play" aria-hidden="true"><Play size={30} fill="currentColor" /></span>
                </button>
              )}
            </div>
            <div className="podcasts__now">
              <span className="podcasts__badge">
                <Headphones size={14} aria-hidden="true" />
                {t("Episode", "भाग")} {num(active + 1, isMr)}
              </span>
              <h3>{title(current)}</h3>
              <a className="podcasts__yt" href={`https://youtu.be/${current.id}`} target="_blank" rel="noopener noreferrer">
                {t("Watch on YouTube", "YouTube वर पाहा")} <ExternalLink size={14} aria-hidden="true" />
              </a>
            </div>
          </Reveal>

          <Reveal delay={0.1} className="podcasts__list-wrap">
            <p className="podcasts__count">
              {t(`${PODCASTS.length} episodes`, `${toMr(PODCASTS.length)} भाग`)}
            </p>
            <ol className="podcasts__list">
              {PODCASTS.map((p, i) => (
                <li key={p.id}>
                  <button
                    type="button"
                    className={`podcasts__item ${i === active ? "is-active" : ""}`}
                    aria-current={i === active ? "true" : undefined}
                    onClick={() => select(i)}
                  >
                    <span className="podcasts__thumb">
                      <Img src={thumb(p.id, "mqdefault")} alt="" width="320" height="180" />
                      <span className="podcasts__thumb-play" aria-hidden="true"><Play size={14} fill="currentColor" /></span>
                    </span>
                    <span className="podcasts__meta">
                      <span className="podcasts__num">
                        {t("Episode", "भाग")} {num(i + 1, isMr)}
                        {i === active && playing && <span className="podcasts__live"> • {t("Now playing", "सध्या चालू")}</span>}
                      </span>
                      <span className="podcasts__name">{title(p)}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ol>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
