import { useState } from "react";
import { assetUrl } from "../../lib/format.js";

// Lazy image that fades in once decoded; width/height reserve space to avoid layout shift (CLS).
export function Img({ src, alt = "", className = "", eager = false, ...rest }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <img
      src={assetUrl(src)}
      alt={alt}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      fetchPriority={eager ? "high" : undefined}
      onLoad={() => setLoaded(true)}
      className={`fade-in-img ${loaded ? "is-loaded" : ""} ${className}`}
      {...rest}
    />
  );
}
