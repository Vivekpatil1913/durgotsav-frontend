import { useState } from "react";
import { assetUrl } from "../../lib/format.js";

// Lazy image that fades in once decoded; width/height reserve space to avoid layout shift (CLS).
export function Img({ src, alt = "", className = "", eager = false, ...rest }) {
  const [loaded, setLoaded] = useState(false);
  const [retried, setRetried] = useState(false);
  const url = assetUrl(src);
  return (
    <img
      // A failed image is asked for once more; one that fails again stays an empty tile, not a broken-image icon
      src={retried && url ? `${url}${url.includes("?") ? "&" : "?"}retry=1` : url}
      alt={alt}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      fetchPriority={eager ? "high" : undefined}
      onLoad={() => setLoaded(true)}
      onError={() => setRetried(true)}
      className={`fade-in-img ${loaded ? "is-loaded" : ""} ${className}`}
      {...rest}
    />
  );
}
