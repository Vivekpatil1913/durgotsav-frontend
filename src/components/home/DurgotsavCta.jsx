import { ArrowRight, Download } from "lucide-react";
import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useT } from "../../context/LanguageContext.jsx";
import { prefersReducedMotion } from "../../lib/smoothScroll.js";
import "./durgotsav-cta.css";

// Closing CTA above the footer. One background image (fort · sunset · warrior); every effect is a
// lightweight transform/opacity layer positioned in the image's own coordinate space (see .dcta__stage).

const IMG_W = 2018;
const IMG_H = 779;

function FortGlyph(props) {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true" {...props}>
      <path fill="currentColor" d="M4 44V24h4v-5h3v5h4V15h4v-4h2V5h2v6h2v4h4v9h4v-5h3v5h4v20H29V34a5 5 0 0 0-10 0v10Z" />
      <path fill="currentColor" d="M23 1h1.6v3.2L31 6l-6.4 1.8V9H23Z" />
    </svg>
  );
}

function HeroBackground() {
  return (
    <picture>
      <source type="image/avif" srcSet={`/images/cta-sunset-1024.avif 1024w, /images/cta-sunset.avif ${IMG_W}w`} sizes="(max-width: 760px) 140vw, 100vw" />
      <source type="image/webp" srcSet={`/images/cta-sunset-1024.webp 1024w, /images/cta-sunset.webp ${IMG_W}w`} sizes="(max-width: 760px) 140vw, 100vw" />
      <img className="dcta__img" src="/images/cta-sunset.webp" width={IMG_W} height={IMG_H} alt="" loading="lazy" decoding="async" />
    </picture>
  );
}

// Decorative ambience — all aria-hidden, all paused while the section is off-screen.
function HeroAtmosphere() {
  return (
    <div className="dcta__atmos" aria-hidden="true">
      <span className="dcta__flag-glow" />
      <span className="dcta__sun-glow" />
      <span className="dcta__mist dcta__mist--a" />
      <span className="dcta__mist dcta__mist--b" />
      <svg className="dcta__trail" viewBox={`0 0 ${IMG_W} ${IMG_H}`} preserveAspectRatio="none">
        <defs>
          <linearGradient id="dcta-trail" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#FFF4DC" />
            <stop offset="0.5" stopColor="#FFD978" />
            <stop offset="1" stopColor="#F4B63F" />
          </linearGradient>
        </defs>
        <path
          className="dcta__trail-path"
          pathLength="1000"
          d="M405 248C560 268 668 360 636 468 612 545 520 585 420 625 318 665 220 722 140 779"
        />
      </svg>
      <svg className="dcta__birds" viewBox="0 0 60 24">
        <path d="M2 10q5-6 10 0q5-6 10 0" />
        <path d="M36 18q3.5-4 7 0q3.5-4 7 0" />
      </svg>
    </div>
  );
}

export function DurgotsavCta() {
  const t = useT();
  const root = useRef(null);
  const stage = useRef(null);
  const content = useRef(null);

  // Entrance once (is-in) + ambient animation only while visible (is-active).
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    if (!("IntersectionObserver" in window)) {
      el.classList.add("is-in", "is-active");
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        el.classList.toggle("is-active", entry.isIntersecting);
        if (entry.isIntersecting) el.classList.add("is-in");
      },
      { threshold: 0.2 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Desktop-only micro parallax (≤4px), rAF-throttled, transform-only.
  useEffect(() => {
    const el = root.current;
    const fine = window.matchMedia("(hover: hover) and (pointer: fine) and (min-width: 1025px)");
    if (!el || !fine.matches || prefersReducedMotion()) return;
    const atmos = el.querySelector(".dcta__atmos");
    let frame = 0;
    let x = 0;
    let y = 0;
    const apply = () => {
      frame = 0;
      stage.current.style.transform = `translate3d(${x * -2}px, ${y * -2}px, 0)`;
      atmos.style.transform = `translate3d(${x * -2}px, ${y * -2}px, 0)`; // +2px on top of the stage = 4px
      content.current.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    };
    const onMove = (e) => {
      const r = el.getBoundingClientRect();
      x = ((e.clientX - r.left) / r.width - 0.5) * 2;
      y = ((e.clientY - r.top) / r.height - 0.5) * 2;
      if (!frame) frame = requestAnimationFrame(apply);
    };
    const onLeave = () => {
      x = 0;
      y = 0;
      if (!frame) frame = requestAnimationFrame(apply);
    };
    el.addEventListener("pointermove", onMove, { passive: true });
    el.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(frame);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <section ref={root} className="dcta" aria-labelledby="cta-title">
      <div className="dcta__scene">
        <div ref={stage} className="dcta__stage">
          <HeroBackground />
          <HeroAtmosphere />
        </div>
        <div className="dcta__scrim" aria-hidden="true" />
      </div>

      <div ref={content} className="container dcta__content">
        <div className="dcta__mark" aria-hidden="true">
          <span className="dcta__rule" />
          <FortGlyph className="dcta__mark-icon" />
          <span className="dcta__rule" />
        </div>

        <h2 id="cta-title" className="dcta__title">
          <span className="dcta__line">{t("This Diwali, a Fort", "या दिवाळीत, आपल्या")}</span>{" "}
          <span className="dcta__line">
            <em>{t("in Your Courtyard.", "अंगणात एक दुर्ग.")}</em>
          </span>
        </h2>

        <p className="dcta__lead">
          {t(
            "Pay tribute to Shivaji's forts with your own hands — and become part of Maharashtra's history.",
            "शिवछत्रपतींच्या गडदुर्गांना आपल्या हातांनी मानवंदना द्या — आणि महाराष्ट्राच्या इतिहासाचा भाग व्हा."
          )}
        </p>

        <div className="dcta__actions">
          <Link to="/participate#register" className="btn btn--lg dcta__btn dcta__btn--primary">
            <FortGlyph className="dcta__btn-fort" />
            <span>{t("Join Durgotsav", "दुर्गोत्सवात सहभागी व्हा")}</span>
            <ArrowRight className="dcta__btn-arrow" aria-hidden="true" />
          </Link>
          <Link to="/certificate" className="btn btn--lg dcta__btn dcta__btn--ghost">
            <Download className="dcta__btn-dl" aria-hidden="true" />
            <span>{t("Download Certificate", "अभिनंदन पत्र डाउनलोड")}</span>
          </Link>
        </div>
      </div>

    </section>
  );
}
