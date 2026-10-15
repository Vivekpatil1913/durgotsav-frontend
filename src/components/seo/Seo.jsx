import { useLocation } from "react-router-dom";
import { SITE_URL } from "../../lib/api.js";
import { assetUrl } from "../../lib/format.js";
import { useSite } from "../../context/SiteContext.jsx";

// React 19 hoists <title>, <meta> and <link> rendered anywhere into <head>.
export function Seo({ title, description, image, imageAlt, type = "website", noindex = false, jsonLd }) {
  const { settings } = useSite();
  const seo = settings.seo ?? {};
  const { pathname } = useLocation();
  const siteName = seo.site_name || "अमृत दुर्गोत्सव २०२६";
  const fullTitle = title ? `${title} | ${siteName}` : seo.default_title || siteName;
  const desc = description || seo.default_description || "";
  const img = image || seo.og_image || "/og-image.jpg";
  const absImage = /^https?:/.test(assetUrl(img)) ? assetUrl(img) : `${SITE_URL}${img}`;
  const canonical = `${SITE_URL}${pathname === "/" ? "" : pathname}`;
  const imgAlt = imageAlt || title || siteName;

  return (
    <>
      <title>{fullTitle}</title>
      <meta name="description" content={desc} />
      <link rel="canonical" href={canonical} />
      <link rel="alternate" hreflang="en" href={canonical} />
      <link rel="alternate" hreflang="mr" href={canonical} />
      <link rel="alternate" hreflang="x-default" href={canonical} />
      {noindex && <meta name="robots" content="noindex" />}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={desc} />
      <meta property="og:url" content={canonical} />
      <meta property="og:type" content={type} />
      <meta property="og:image" content={absImage} />
      <meta property="og:image:alt" content={imgAlt} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={desc} />
      <meta name="twitter:image" content={absImage} />
      <meta name="twitter:image:alt" content={imgAlt} />
      <meta name="twitter:site" content="@AmrutDurgotsav" />
      {jsonLd && (Array.isArray(jsonLd) ? jsonLd : [jsonLd]).map((schema, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }} />
      ))}
    </>
  );
}
