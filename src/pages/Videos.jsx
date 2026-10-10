import { Play, Video } from "lucide-react";
import { useState } from "react";
import { StatsBand } from "../components/home/HomeSections.jsx";
import { Seo } from "../components/seo/Seo.jsx";
import { Img } from "../components/ui/Img.jsx";
import { EmptyState, ErrorState, PageHero, SkeletonGrid } from "../components/ui/PageParts.jsx";
import { Reveal } from "../components/ui/Reveal.jsx";
import { useT } from "../context/LanguageContext.jsx";
import { useApi } from "../hooks/useApi.js";
import { youtubeId } from "../lib/format.js";
import "./pages.css";

function VideoCard({ video }) {
  const t = useT();
  const [playing, setPlaying] = useState(false);
  const id = youtubeId(video.youtube_url);
  const thumb = video.thumbnail || (id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : null);
  return (
    <article className="video-card">
      <div className="video-card__frame">
        {playing && id ? (
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`}
            title={video.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <button type="button" onClick={() => setPlaying(true)} aria-label={t(`Play video: ${video.title}`, `व्हिडिओ चालू करा: ${video.title}`)}>
            {thumb && <Img src={thumb} alt="" />}
            <span className="video-card__play"><Play aria-hidden="true" /></span>
          </button>
        )}
      </div>
      <h3>{video.title}</h3>
      {video.description && <p className="muted-night">{video.description}</p>}
    </article>
  );
}

export default function Videos() {
  const t = useT();
  const { data, error, loading, reload } = useApi("/videos");
  const videos = data?.data ?? [];
  return (
    <>
      <Seo
        title={t("Videos", "व्हिडिओ")}
        description={t("Videos about Durgotsav and the forts of Chhatrapati Shivaji.", "दुर्गोत्सव व शिवछत्रपतींच्या दुर्गांविषयी व्हिडिओ.")}
      />
      <PageHero
        eyebrow={t("Videos", "व्हिडिओ")}
        title={t("Stories of Forts, on Screen", "दुर्गांच्या कथा, पडद्यावर")}
        lead={t(
          "Selected videos about Durgotsav, fort conservation, and the history of Swarajya.",
          "दुर्गोत्सव, दुर्गसंवर्धन आणि स्वराज्याच्या इतिहासाविषयी निवडक व्हिडिओ."
        )}
      />
      <section className="section surface-night">
        <div className="container">
          {error && <ErrorState error={error} onRetry={reload} />}
          {loading && <SkeletonGrid count={3} ratio="16 / 9" />}
          {!loading && !error && videos.length === 0 && (
            <EmptyState icon={Video} title={t("Videos Coming Soon", "व्हिडिओ लवकरच")}>
              {t("Durgotsav videos will be published here.", "दुर्गोत्सवाचे व्हिडिओ येथे प्रसिद्ध केले जातील.")}
            </EmptyState>
          )}
          <div className="grid grid--3">
            {videos.map((v, i) => <Reveal key={v.id} delay={i * 0.05}><VideoCard video={v} /></Reveal>)}
          </div>
        </div>
      </section>
      <StatsBand />
    </>
  );
}
