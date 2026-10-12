import { ArrowUpRight } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useLang } from "../../context/LanguageContext.jsx";
import { FORT_TYPES, FORT_TYPES_EN, mr } from "../../lib/format.js";
import { Img } from "../ui/Img.jsx";
import { FortArt } from "./FortArt.jsx";
import "./forts.css";

export function FortVisual({ fort, index = 0, eager, wikiSrc }) {
  const { lang } = useLang();
  const [imgFailed, setImgFailed] = useState(false);
  const src = fort.cover_image || wikiSrc;
  const fortName = lang === "mr" ? fort.name_mr : fort.name_en;

  if (src && !imgFailed) {
    return (
      <Img
        src={src}
        alt={lang === "mr" ? `${fort.name_mr} दुर्ग` : `${fort.name_en} Fort`}
        eager={eager}
        onError={() => setImgFailed(true)}
      />
    );
  }
  return (
    <FortArt
      type={fort.fort_type}
      variant={index}
      title={lang === "mr" ? `${fort.name_mr} — चित्ररूप` : `${fort.name_en} — Illustration`}
    />
  );
}

export function FortCard({ fort, index = 0, onHover, active }) {
  const { lang } = useLang();
  const fortTypes = lang === "mr" ? FORT_TYPES : FORT_TYPES_EN;
  const cardNum = lang === "mr" ? mr(String(index + 1).padStart(2, "0")) : String(index + 1).padStart(2, "0");

  return (
    <Link
      to={`/forts/${fort.slug}`}
      className={`fort-card ${active ? "is-active" : ""}`}
      onMouseEnter={() => onHover?.(fort.slug)}
      onMouseLeave={() => onHover?.(null)}
      onFocus={() => onHover?.(fort.slug)}
      onBlur={() => onHover?.(null)}
    >
      <div className="fort-card__media">
        <FortVisual fort={fort} index={index} />
      </div>
      <div className="fort-card__body">
        <span className="fort-card__num" aria-hidden="true">{cardNum}</span>
        <div className="fort-card__titles">
          <h3>{lang === "mr" ? fort.name_mr : fort.name_en}</h3>
          <p className="fort-card__en">{lang === "mr" ? fort.name_en : fort.name_mr}</p>
        </div>
        {fort.tagline && <p className="fort-card__tagline">{fort.tagline}</p>}
        <div className="fort-card__meta">
          <span className="badge">{fortTypes[fort.fort_type]}</span>
          <span className="fort-card__loc">{fort.location_mr}</span>
        </div>
        <ArrowUpRight className="fort-card__arrow" aria-hidden="true" />
      </div>
    </Link>
  );
}
