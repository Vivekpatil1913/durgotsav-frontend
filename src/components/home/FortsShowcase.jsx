import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowRight } from "lucide-react";
import { useLayoutEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useT } from "../../context/LanguageContext.jsx";
import { useSite } from "../../context/SiteContext.jsx";
import { prefersReducedMotion } from "../../lib/smoothScroll.js";
import { FortCard } from "../forts/FortCard.jsx";

gsap.registerPlugin(ScrollTrigger);

// Desktop (≥1024px, motion allowed): the section pins and the card track scrolls sideways with the page.
// Touch / small screens / reduced motion: a native swipeable carousel with scroll-snap.
export function FortsShowcase({ forts = [] }) {
  const { settings } = useSite();
  const t = useT();
  const section = useRef(null);
  const track = useRef(null);
  const [pinned, setPinned] = useState(false);

  useLayoutEffect(() => {
    if (!forts.length) return undefined;
    const mm = gsap.matchMedia();
    mm.add("(min-width: 1024px) and (prefers-reduced-motion: no-preference) and (pointer: fine)", () => {
      if (prefersReducedMotion()) return undefined;
      setPinned(true);
      const distance = () => track.current.scrollWidth - window.innerWidth;
      const tween = gsap.to(track.current, {
        x: () => -distance(),
        ease: "none",
        scrollTrigger: {
          trigger: section.current,
          start: "top top",
          end: () => `+=${distance()}`,
          pin: true,
          scrub: 0.6,
          invalidateOnRefresh: true,
          anticipatePin: 1,
        },
      });
      gsap.to(".forts-showcase__progress span", {
        scaleX: 1,
        ease: "none",
        scrollTrigger: { trigger: section.current, start: "top top", end: () => `+=${distance()}`, scrub: true },
      });
      return () => {
        tween.scrollTrigger?.kill();
        tween.kill();
        setPinned(false);
      };
    });
    return () => mm.revert();
  }, [forts.length]);

  // Scroll-snap keeps the previously snapped card when forts load in front of it — always start at the first fort
  useLayoutEffect(() => {
    if (track.current) track.current.scrollLeft = 0;
  }, [forts.length]);

  // The pinned layout changes the track's width, so measurements must be redone after it renders
  useLayoutEffect(() => {
    if (pinned) ScrollTrigger.refresh();
  }, [pinned]);

  return (
    <section ref={section} className={`forts-showcase surface-night ${pinned ? "forts-showcase--pinned" : "section"}`} aria-labelledby="forts-title">
      <div className="forts-showcase__pin">
        <div className="container section-head__row">
          {/* plain div: GSAP re-parents the pinned section, which breaks in-view reveals */}
          <div className="section-head">
            <span className="eyebrow">{settings.initiative?.unesco_title || "Maratha Military Landscapes of India"}</span>
            <h2 id="forts-title">{t("Twelve forts on the UNESCO World Heritage List", "युनेस्को जागतिक वारसा यादीतील बारा दुर्ग")}</h2>
            <p>{t(
              "These twelve forts, which bear witness to the prowess of Shiva Chhatrapati, were granted the status of World Heritage Sites in 2025. Build a replica of one of these forts in your yard.",
              "शिवछत्रपतींच्या पराक्रमाचे साक्षीदार असलेल्या या बारा दुर्गांना २०२५ मध्ये जागतिक वारसा स्थळांचा दर्जा मिळाला. आपल्या अंगणात यापैकी एका दुर्गाची प्रतिकृती बनवा."
            )}</p>
          </div>
          <Link to="/forts" className="link-arrow">{t("View all forts on the map", "सर्व दुर्ग नकाशावर पाहा")} <ArrowRight aria-hidden="true" /></Link>
        </div>

        <div className="forts-showcase__track" ref={track} role="list">
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
        {pinned && <div className="forts-showcase__progress" aria-hidden="true"><span /></div>}
      </div>
    </section>
  );
}
