import { Expand } from "lucide-react";
import { useState } from "react";
import { useT } from "../../context/LanguageContext.jsx";
import { Img } from "../ui/Img.jsx";
import { Lightbox } from "../ui/Lightbox.jsx";
import { Reveal } from "../ui/Reveal.jsx";
import "./highlights.css";

// Curated fort replicas from Durgotsav 2025 — [number, width, height] of the full-size WebP
const PHOTOS = [
  [1, 1280, 720], [2, 1280, 590], [3, 1600, 1082], [4, 1200, 1600], [5, 1200, 1600], [6, 1600, 1171],
  [7, 1200, 1600], [8, 1600, 720], [9, 1600, 1200], [10, 1200, 1600], [11, 1040, 780], [12, 1600, 900],
  [13, 836, 754], [14, 1280, 960], [15, 1600, 1234], [16, 1600, 1200], [17, 1600, 905], [18, 1280, 960],
];

const path = (n, suffix = "") => `/images/gallery-2025/durgotsav-2025-${String(n).padStart(2, "0")}${suffix}.webp`;

export const HIGHLIGHTS_2025 = PHOTOS.map(([n, width, height]) => ({ n, width, height, src: path(n), thumb: path(n, "-sm") }));

export function Highlights2025({ limit, className = "" }) {
  const t = useT();
  const [index, setIndex] = useState(null);
  const photos = limit ? HIGHLIGHTS_2025.slice(0, limit) : HIGHLIGHTS_2025;
  const alt = t("Fort replica — Durgotsav 2025", "दुर्गाची प्रतिकृती — दुर्गोत्सव २०२५");
  const items = photos.map((p) => ({ src: p.src, alt, caption: t("Durgotsav 2025 — Selected Highlights", "दुर्गोत्सव २०२५ — निवडक क्षणचित्रे") }));

  return (
    <section className={`section surface-parchment highlights ${className}`.trim()} aria-labelledby="hl-title">
      <div className="container">
        <Reveal className="section-head highlights__head">
          <span className="eyebrow">{t("Durgotsav 2025 — Selected Highlights", "दुर्गोत्सव २०२५ — निवडक क्षणचित्रे")}</span>
          <h2 id="hl-title">{t("Forts That Stood Tall Last Year", "गेल्या वर्षी उभे राहिलेले दुर्ग")}</h2>
          <p>
            {t(
              "A curated selection of fort replicas built by Durgvirs across Maharashtra during Durgotsav 2025.",
              "दुर्गोत्सव २०२५ मध्ये महाराष्ट्रभरातील दुर्गवीरांनी साकारलेल्या दुर्गप्रतिकृतींपैकी निवडक छायाचित्रे."
            )}
          </p>
        </Reveal>

        <div className="highlights__grid">
          {photos.map((p, i) => (
            <button
              key={p.n}
              type="button"
              className={`highlights__tile ${p.height > p.width ? "is-tall" : ""} ${p.width / p.height > 1.9 ? "is-wide" : ""}`.trim()}
              onClick={() => setIndex(i)}
              aria-label={t(`Enlarge photo ${i + 1}`, `छायाचित्र ${i + 1} मोठे करा`)}
            >
              <Img src={p.thumb} alt={alt} width={p.width} height={p.height} />
              <span className="highlights__zoom" aria-hidden="true"><Expand size={16} /></span>
            </button>
          ))}
        </div>
      </div>
      <Lightbox items={items} index={index} onClose={() => setIndex(null)} onIndex={setIndex} />
    </section>
  );
}
