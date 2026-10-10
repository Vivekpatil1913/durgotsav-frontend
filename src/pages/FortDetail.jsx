import { ArrowLeft, ArrowRight, MapPin } from "lucide-react";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { FortVisual } from "../components/forts/FortCard.jsx";
import { FortMapEmbed, FortWikiPhotos, useWikiHeroImage } from "../components/forts/FortExtras.jsx";
import "../components/forts/forts.css";
import { Seo } from "../components/seo/Seo.jsx";
import { Img } from "../components/ui/Img.jsx";
import { Lightbox } from "../components/ui/Lightbox.jsx";
import { Divider } from "../components/ui/Ornament.jsx";
import { ErrorState } from "../components/ui/PageParts.jsx";
import { Reveal } from "../components/ui/Reveal.jsx";
import { useLang, useT } from "../context/LanguageContext.jsx";
import { useApi } from "../hooks/useApi.js";
import { SITE_URL } from "../lib/api.js";
import { assetUrl, FORT_TYPES, FORT_TYPES_EN } from "../lib/format.js";
import NotFound from "./NotFound.jsx";
import "./pages.css";

export default function FortDetail() {
  const t = useT();
  const { lang } = useLang();
  const { slug } = useParams();
  const { data, error, loading, reload } = useApi(`/forts/${slug}`);
  const [lightbox, setLightbox] = useState(null);
  const [replicaBox, setReplicaBox] = useState(null);
  const wikiHeroSrc = useWikiHeroImage(data?.data?.slug, data?.data?.name_en);

  if (error?.status === 404) return <NotFound />;
  if (error) return <div className="page-hero"><ErrorState error={error} onRetry={reload} /></div>;
  if (loading || !data) return <div className="page-fallback" aria-busy="true" />;

  const fort = data.data;
  const fortTypeMap = lang === "mr" ? FORT_TYPES : FORT_TYPES_EN;
  const fortName = lang === "mr" ? fort.name_mr : fort.name_en;
  const gallery = fort.images.map((img) => ({ src: img.image_path, alt: img.caption || fortName, caption: img.caption }));
  const replicas = fort.replicas.map((p) => ({
    src: p.image_path,
    alt: t(`${p.name}'s replica of ${fort.name_en} Fort`, `${fort.name_mr} दुर्गाची प्रतिकृती — ${p.name}`),
    caption: [p.name, p.district].filter(Boolean).join(" · "),
  }));
  const paragraphs = (fort.history || "").split(/\n\s*\n/).filter(Boolean);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LandmarksOrHistoricalBuildings",
    name: `${fort.name_en} Fort`,
    alternateName: fort.name_mr,
    description: fort.summary,
    url: `${SITE_URL}/forts/${fort.slug}`,
    image: fort.cover_image ? assetUrl(fort.cover_image) : undefined,
    geo: fort.latitude ? { "@type": "GeoCoordinates", latitude: fort.latitude, longitude: fort.longitude } : undefined,
    address: { "@type": "PostalAddress", addressRegion: fort.state, addressCountry: "IN" },
  };

  return (
    <>
      <Seo title={`${fort.name_mr} (${fort.name_en})`} description={fort.summary} image={fort.cover_image} type="article" jsonLd={jsonLd} />
      <section className="fort-hero">
        <div className="fort-hero__media" aria-hidden="true"><FortVisual fort={fort} index={fort.sort_order} eager wikiSrc={wikiHeroSrc} /></div>
        <div className="fort-hero__shade" aria-hidden="true" />
        <div className="container fort-hero__content">
          <nav aria-label="breadcrumb">
            <ol className="breadcrumbs">
              <li><Link to="/">{t("Home", "मुख्य पृष्ठ")}</Link></li>
              <li><Link to="/forts">{t("12 Forts", "१२ दुर्ग")}</Link></li>
              <li aria-current="page">{fortName}</li>
            </ol>
          </nav>
          <Reveal className="stack">
            <div className="cluster">
              <span className="badge">{fortTypeMap[fort.fort_type]}</span>
              {fort.is_unesco && <span className="badge">{t("UNESCO World Heritage", "UNESCO जागतिक वारसा")}</span>}
            </div>
            <h1>{fort.name_mr}<span className="fort-hero__en">{fort.name_en}</span></h1>
            {fort.tagline && <p className="fort-hero__tagline">{fort.tagline}</p>}
            {fort.location_mr && (
              <p className="fort-hero__loc">
                <MapPin size={16} aria-hidden="true" />
                {" "}{lang === "mr" ? fort.location_mr : (fort.location_en || fort.location_mr)}
                {fort.state && fort.state !== "महाराष्ट्र" ? `, ${fort.state}` : ""}
              </p>
            )}
          </Reveal>
        </div>
      </section>

      <section className="section surface-parchment">
        <div className="container fort-body">
          <Reveal className="stack fort-body__main">
            {fort.summary && <p className="fort-body__summary">{fort.summary}</p>}
            <Divider className="story__divider" />
            <div className="prose">
              {paragraphs.map((p, i) => <p key={i}>{p}</p>)}
            </div>
          </Reveal>
          <Reveal as="aside" delay={0.1} className="fort-facts card-light" aria-label={t("Key Facts", "ठळक माहिती")}>
            <h2>{t("Key Facts", "ठळक माहिती")}</h2>
            <dl>
              {fort.facts.map((f) => (
                <div key={f.label}><dt>{f.label}</dt><dd>{f.value}</dd></div>
              ))}
              {fort.elevation_m && <div><dt>{t("Elevation", "उंची")}</dt><dd>{fort.elevation_m} {t("m.", "मी.")}</dd></div>}
            </dl>
            <Link to="/participate#register" className="btn btn--primary btn--block">
              {t(`Build a replica of this fort`, `या दुर्गाची प्रतिकृती बनवा`)}
            </Link>
          </Reveal>
        </div>
      </section>

      {gallery.length > 0 && (
        <section className="section surface-night" aria-labelledby="fort-photos">
          <div className="container">
            <h2 id="fort-photos" className="section-title" style={{ marginBottom: "var(--space-6)" }}>
              {t("Photos", "छायाचित्रे")}
            </h2>
            <div className="masonry">
              {fort.images.map((img, i) => (
                <button key={img.id} type="button" className="photo-tile" onClick={() => setLightbox(i)}
                  aria-label={t(`Enlarge photo: ${img.caption || fortName}`, `छायाचित्र मोठे करा: ${img.caption || fortName}`)}>
                  <Img src={img.image_path} alt={img.caption || fortName} />
                </button>
              ))}
            </div>
            <Lightbox items={gallery} index={lightbox} onClose={() => setLightbox(null)} onIndex={setLightbox} />
          </div>
        </section>
      )}

      {replicas.length > 0 && (
        <section className="section surface-night-raised" aria-labelledby="fort-replicas">
          <div className="container">
            <div className="section-head">
              <span className="eyebrow">{t("Replicas by Fort Builders", "दुर्गवीरांच्या प्रतिकृती")}</span>
              <h2 id="fort-replicas">
                {t(`${fort.name_en} Built in Every Home`, `घराघरांत उभा राहिलेला ${fort.name_mr}`)}
              </h2>
            </div>
            <div className="masonry">
              {fort.replicas.map((p, i) => (
                <button key={p.id} type="button" className="photo-tile" onClick={() => setReplicaBox(i)}
                  aria-label={t(`Enlarge photo: ${replicas[i].caption}`, `छायाचित्र मोठे करा: ${replicas[i].caption}`)}>
                  <Img src={p.thumb_path} alt={replicas[i].alt} />
                  <span className="photo-tile__meta"><strong>{p.name}</strong>{p.district}</span>
                </button>
              ))}
            </div>
            <Lightbox items={replicas} index={replicaBox} onClose={() => setReplicaBox(null)} onIndex={setReplicaBox} />
          </div>
        </section>
      )}

      <FortWikiPhotos nameEn={fort.name_en} />
      <FortMapEmbed lat={fort.latitude} lng={fort.longitude} nameEn={fort.name_en} />

      <nav className="fort-pager surface-night" aria-label={t("Other Forts", "इतर दुर्ग")}>
        <div className="container fort-pager__inner">
          {fort.prev ? (
            <Link to={`/forts/${fort.prev.slug}`} className="fort-pager__link">
              <ArrowLeft aria-hidden="true" />
              <span>
                <small>{t("Previous Fort", "मागील दुर्ग")}</small>
                {lang === "mr" ? fort.prev.name_mr : (fort.prev.name_en || fort.prev.name_mr)}
              </span>
            </Link>
          ) : <span />}
          {fort.next && (
            <Link to={`/forts/${fort.next.slug}`} className="fort-pager__link fort-pager__link--next">
              <span>
                <small>{t("Next Fort", "पुढील दुर्ग")}</small>
                {lang === "mr" ? fort.next.name_mr : (fort.next.name_en || fort.next.name_mr)}
              </span>
              <ArrowRight aria-hidden="true" />
            </Link>
          )}
        </div>
      </nav>
    </>
  );
}
