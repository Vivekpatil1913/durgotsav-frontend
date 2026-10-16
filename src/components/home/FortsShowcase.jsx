import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { useLayoutEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useT } from "../../context/LanguageContext.jsx";
import { useSite } from "../../context/SiteContext.jsx";
import { prefersReducedMotion } from "../../lib/smoothScroll.js";
import { FortCard } from "../forts/FortCard.jsx";

// A native scroll-snap carousel: the page scrolls normally, cards move with the arrows or by swipe/trackpad
export function FortsShowcase({ forts = [] }) {
  const { settings } = useSite();
  const t = useT();
  const track = useRef(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  // Enable/disable the arrows from the track's scroll position
  const updateEdges = () => {
    const el = track.current;
    if (!el) return;
    setAtStart(el.scrollLeft <= 2);
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 2);
  };

  // Scroll-snap keeps the previously snapped card when forts load in front of it — always start at the first fort
  useLayoutEffect(() => {
    if (track.current) track.current.scrollLeft = 0;
    updateEdges();
  }, [forts.length]);

  const go = (dir) => {
    const el = track.current;
    if (!el?.firstElementChild) return;
    const step = el.firstElementChild.offsetWidth + (parseFloat(getComputedStyle(el).columnGap) || 0);
    el.scrollBy({ left: dir * step, behavior: prefersReducedMotion() ? "auto" : "smooth" });
  };

  return (
    <section className="forts-showcase surface-night section" aria-labelledby="forts-title">
      <div className="forts-showcase__pin">
        <div className="container section-head__row">
          <div className="section-head">
            <span className="eyebrow">{t(settings.initiative?.unesco_title || "Maratha Military Landscapes of India", "मराठा मिलिटरी लँडस्केप्स ऑफ इंडिया")}</span>
            <h2 id="forts-title">{t("Twelve forts on the UNESCO World Heritage List", "युनेस्को जागतिक वारसा यादीतील बारा दुर्ग")}</h2>
            <p>{t(
              "These twelve forts, which bear witness to the prowess of Shiva Chhatrapati, were granted the status of World Heritage Sites in 2025. Build a replica of one of these forts in your yard.",
              "शिवछत्रपतींच्या पराक्रमाचे साक्षीदार असलेल्या या बारा दुर्गांना २०२५ मध्ये जागतिक वारसा स्थळांचा दर्जा मिळाला. आपल्या अंगणात यापैकी एका दुर्गाची प्रतिकृती बनवा."
            )}</p>
          </div>
          <div className="forts-showcase__actions">
            <Link to="/forts" className="link-arrow">{t("View all forts on the map", "सर्व दुर्ग नकाशावर पाहा")} <ArrowRight aria-hidden="true" /></Link>
            {forts.length > 1 && (
              <div className="forts-showcase__nav">
                <button type="button" className="forts-showcase__arrow" aria-label={t("Previous fort", "मागील दुर्ग")} onClick={() => go(-1)} disabled={atStart}>
                  <ChevronLeft size={22} aria-hidden="true" />
                </button>
                <button type="button" className="forts-showcase__arrow" aria-label={t("Next fort", "पुढील दुर्ग")} onClick={() => go(1)} disabled={atEnd}>
                  <ChevronRight size={22} aria-hidden="true" />
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="forts-showcase__track" ref={track} role="list" onScroll={updateEdges}>
          {forts.map((fort, i) => (
            <div role="listitem" key={fort.slug}>
              <FortCard fort={fort} index={i} />
            </div>
          ))}
          {forts.length > 0 && (
            <div role="listitem" className="forts-showcase__end">
              <strong>{t("Which fort is yours?", "आपला दुर्ग कोणता?")}</strong>
              <p className="muted">{t("Build a replica of any fort and join Durgotsav.", "कोणत्याही दुर्गाची प्रतिकृती बनवा आणि दुर्गोत्सवात सहभागी व्हा.")}</p>
              <Link to="/participate" className="btn btn--primary">{t("Join Now", "सहभागी व्हा")}</Link>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
