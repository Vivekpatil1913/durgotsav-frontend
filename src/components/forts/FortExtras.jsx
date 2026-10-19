import { Maximize2, ZoomIn } from "lucide-react";
import { useEffect, useState } from "react";
import { useT } from "../../context/LanguageContext.jsx";
import { Lightbox } from "../ui/Lightbox.jsx";

export function useWikiHeroImage(slug, nameEn) {
  const [src, setSrc] = useState(null);

  useEffect(() => {
    if (!nameEn) return;
    let cancelled = false;

    async function resolve() {
      if (slug) {
        const localUrl = `/images/forts/${slug}-hero.webp`;
        try {
          const res = await fetch(localUrl, { method: "HEAD" });
          if (!cancelled && res.ok) { setSrc(localUrl); return; }
        } catch {}
      }
      try {
        const res = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(nameEn + " Fort")}`);
        if (res.ok) {
          const data = await res.json();
          const url = data.originalimage?.source || data.thumbnail?.source;
          if (!cancelled && url) setSrc(url);
        }
      } catch {}
    }

    resolve();
    return () => { cancelled = true; };
  }, [slug, nameEn]);

  return src;
}

export function FortWikiPhotos({ nameEn }) {
  const t = useT();
  const [photos, setPhotos] = useState([]);
  const [lightbox, setLightbox] = useState(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!nameEn) return;
    const title = `${nameEn} Fort`;
    fetch(`https://en.wikipedia.org/api/rest_v1/page/media-list/${encodeURIComponent(title)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => {
        const imgs = (data.items || [])
          .filter((item) => item.type === "image" && item.showInGallery !== false)
          .map((item) => {
            const srcset = item.srcset || [];
            const best = srcset[srcset.length - 1]?.src || srcset[0]?.src;
            if (!best) return null;
            return {
              src: best.startsWith("//") ? `https:${best}` : best,
              alt: (item.title || "").replace(/^File:|\.jpe?g$|\.png$|\.svg$/gi, "").replace(/_/g, " ").trim(),
              caption: (item.caption?.text || "").replace(/<[^>]+>/g, "").trim(),
            };
          })
          .filter(Boolean)
          .slice(0, 15);
        setPhotos(imgs);
      })
      .catch(() => {})
      .finally(() => setDone(true));
  }, [nameEn]);

  if (!done || photos.length === 0) return null;

  return (
    <section className="section surface-night" aria-labelledby="wiki-photos-hd">
      <div className="container">
        <div className="section-head">
          <span className="eyebrow">{t("Actual Photos", "वास्तविक छायाचित्रे")}</span>
          <h2 id="wiki-photos-hd">{t("Photos from Wikipedia", "विकिपीडियावरील छायाचित्रे")}</h2>
        </div>
        <div className="masonry">
          {photos.map((p, i) => (
            <button key={i} type="button" className="photo-tile" onClick={() => setLightbox(i)}
              aria-label={t(`Enlarge photo: ${p.alt}`, `छायाचित्र मोठे करा: ${p.alt}`)}>
              <img src={p.src} alt={p.alt} loading="lazy" />
              {p.caption && <span className="photo-tile__meta">{p.caption}</span>}
            </button>
          ))}
        </div>
        <Lightbox items={photos} index={lightbox} onClose={() => setLightbox(null)} onIndex={setLightbox} />
        <p className="fort-wiki-credit">
          {t("Photos:", "छायाचित्रे:")} <a href={`https://en.wikipedia.org/wiki/${encodeURIComponent(nameEn + " Fort")}`} target="_blank" rel="noopener noreferrer">Wikipedia</a> (Creative Commons)
        </p>
      </div>
    </section>
  );
}

export function FortMapEmbed({ lat, lng, nameEn }) {
  const t = useT();
  if (!lat && !lng && !nameEn) return null;

  const q = lat && lng ? `${lat},${lng}` : `${nameEn} Fort Maharashtra`;
  const src = `https://maps.google.com/maps?q=${encodeURIComponent(q)}&z=15&output=embed&t=k`;

  return (
    <section className="section section--tight surface-parchment" aria-labelledby="fort-map-hd">
      <div className="container">
        <div className="section-head">
          <span className="eyebrow">{t("Location", "स्थान")}</span>
          <h2 id="fort-map-hd">{t("View on Map", "नकाशावर पाहा")}</h2>
        </div>
        <div className="fort-gmap-wrap">
          <iframe
            title={`${nameEn} Fort — Google Maps`}
            src={src}
            width="100%"
            height="100%"
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </div>
    </section>
  );
}

// Hand-drawn layout plans (gates, bastions, tanks, temples) kept in /public/images/forts/plans.
const FORT_PLANS = {
  gingee:      ["gingee"],
  lohagad:     ["lohagad"],
  panhala:     ["panhala-2", "panhala"],
  pratapgad:   ["pratapgad"],
  raigad:      ["raigad"],
  rajgad:      ["rajgad"],
  shivneri:    ["shivneri"],
  sindhudurg:  ["sindhudurg"],
  suvarnadurg: ["suvarnadurg"],
  vijaydurg:   ["vijaydurg"],
};

export function FortPlan({ slug, nameEn, nameMr }) {
  const t = useT();
  const [lightbox, setLightbox] = useState(null);
  const files = FORT_PLANS[slug];
  if (!files) return null;

  const many = files.length > 1;
  const items = files.map((file, i) => {
    const label = many
      ? t(`${nameEn} Fort plan — ${i + 1} of ${files.length}`, `${nameMr} दुर्ग आराखडा — ${i + 1} / ${files.length}`)
      : t(`${nameEn} Fort plan`, `${nameMr} दुर्ग आराखडा`);
    return { src: `/images/forts/plans/${file}.webp`, alt: label, caption: label };
  });

  return (
    <section className="section surface-parchment fort-plan" aria-labelledby="fort-plan-hd">
      <div className="container">
        <div className="section-head section-head--center">
          <span className="eyebrow">{t("Fort Layout", "दुर्गाचा आराखडा")}</span>
          <h2 id="fort-plan-hd">{t(`Plan of ${nameEn} Fort`, `${nameMr} — दुर्ग नकाशा`)}</h2>
          <p>
            {t(
              "Gates, bastions, water tanks and temples as marked on the fort plan. Tap the plan to zoom in.",
              "दरवाजे, बुरूज, तलाव व मंदिरे — दुर्गाच्या आराखड्यावर दर्शविलेली ठिकाणे. मोठे पाहण्यासाठी नकाशावर टॅप करा."
            )}
          </p>
        </div>
        <div className={`fort-plan__grid${many ? " fort-plan__grid--multi" : ""}`}>
          {items.map((item, i) => (
            <button key={item.src} type="button" className="fort-plan__plate" onClick={() => setLightbox(i)}
              aria-label={t(`Enlarge: ${item.alt}`, `मोठे करा: ${item.alt}`)}>
              <span className="fort-plan__paper">
                <img src={item.src} alt={item.alt} loading="lazy" />
                <span className="fort-plan__hint" aria-hidden="true"><ZoomIn size={22} /></span>
              </span>
              <span className="fort-plan__caption">
                <span>{many ? t(`Plan ${i + 1}`, `आराखडा ${i + 1}`) : t("Fort plan", "दुर्ग आराखडा")}</span>
                <span className="fort-plan__cta"><Maximize2 size={14} aria-hidden="true" />{t("View full size", "पूर्ण आकारात पाहा")}</span>
              </span>
            </button>
          ))}
        </div>
        <Lightbox items={items} index={lightbox} onClose={() => setLightbox(null)} onIndex={setLightbox} />
      </div>
    </section>
  );
}
