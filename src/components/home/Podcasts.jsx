import { ExternalLink, Headphones, Loader2, Play } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useLang, useT } from "../../context/LanguageContext.jsx";
import { usePagedApi } from "../../hooks/usePagedApi.js";
import { Img } from "../ui/Img.jsx";
import { Reveal } from "../ui/Reveal.jsx";
import "./podcasts.css";


const PAGE = 10; // episodes fetched per request as the playlist scrolls

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
  const listRef = useRef(null);
  const sentinelRef = useRef(null);
  // Episodes are managed in the admin panel (Content → Podcasts); the API serves them page by page
  const { items: episodes, total, page, hasMore, loading, error, loadMore, retry } = usePagedApi("/podcasts", PAGE);
  const current = episodes[active];
  const title = (p) => t(p.title_en, p.title_mr);

  // Fetch the next page when the end of the playlist scrolls near, so 100+ episodes never load (or render) at once.
  // A fresh observer per page re-checks the sentinel, which keeps filling a list still too short to scroll.
  useEffect(() => {
    const root = listRef.current;
    const sentinel = sentinelRef.current;
    if (!hasMore || error || !root || !sentinel) return undefined;
    const io = new IntersectionObserver(([entry]) => entry.isIntersecting && loadMore(), {
      root,
      rootMargin: "0px 0px 240px 0px",
    });
    io.observe(sentinel);
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, hasMore, error]);

  if (!current) return null;

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
                  key={current.youtube_id}
                  src={`https://www.youtube-nocookie.com/embed/${current.youtube_id}?autoplay=1&rel=0`}
                  title={title(current)}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <button type="button" onClick={() => setPlaying(true)} aria-label={t(`Play: ${title(current)}`, `चालू करा: ${title(current)}`)}>
                  <Img src={thumb(current.youtube_id, "hqdefault")} alt="" width="480" height="360" />
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
              <a className="podcasts__yt" href={`https://youtu.be/${current.youtube_id}`} target="_blank" rel="noopener noreferrer">
                {t("Watch on YouTube", "YouTube वर पाहा")} <ExternalLink size={14} aria-hidden="true" />
              </a>
            </div>
          </Reveal>

          <Reveal delay={0.1} className="podcasts__aside">
            <div className="podcasts__list-wrap">
              <p className="podcasts__count">
                {t(`${total} episodes`, `${toMr(total)} भाग`)}
              </p>
              {/* data-lenis-prevent: let the wheel scroll this list natively instead of the page */}
              <ol ref={listRef} className="podcasts__list" data-lenis-prevent>
                {episodes.map((p, i) => (
                  <li key={p.id}>
                    <button
                      type="button"
                      className={`podcasts__item ${i === active ? "is-active" : ""}`}
                      aria-current={i === active ? "true" : undefined}
                      onClick={() => select(i)}
                    >
                      <span className="podcasts__thumb">
                        <Img src={thumb(p.youtube_id, "mqdefault")} alt="" width="320" height="180" />
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
                {hasMore && (
                  <li ref={sentinelRef} className="podcasts__more" aria-live="polite">
                    {error ? (
                      <button type="button" className="podcasts__retry" onClick={retry}>
                        {t("Couldn't load more episodes — retry", "आणखी भाग लोड झाले नाहीत — पुन्हा प्रयत्न करा")}
                      </button>
                    ) : (
                      loading && (
                        <>
                          <Loader2 size={16} className="spin" aria-hidden="true" />
                          {t("Loading more episodes…", "आणखी भाग लोड होत आहेत…")}
                        </>
                      )
                    )}
                  </li>
                )}
              </ol>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
