import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowRight, Award, Image as ImageIcon, Info, Trophy } from "lucide-react";
import { useLayoutEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useT } from "../../context/LanguageContext.jsx";
import { useSite } from "../../context/SiteContext.jsx";
import { useApi } from "../../hooks/useApi.js";
import { AWARD_PATH } from "../../lib/award.js";
import { prefersReducedMotion } from "../../lib/smoothScroll.js";
import { yearFrom } from "../layout/Header.jsx";
import { ColumnsIcon, FortIcon, MaharashtraIcon, PeopleIcon } from "./HeroIcons.jsx";

gsap.registerPlugin(ScrollTrigger);

// Hand-drawn brush stroke under the eyebrow (tapered both ends)
function Brush() {
  return (
    <svg className="hero__brush" viewBox="0 0 90 10" aria-hidden="true">
      <path d="M1 5.6 C 14 3.2, 30 2.6, 46 3.4 S 76 5.2, 89 4 C 76 7.4, 58 7.6, 44 7 S 14 7.8, 1 5.6 Z" />
    </svg>
  );
}

// शिवदुर्ग भूषण पुरस्कार — compact card inside the hero, pointing visitors to the full award page.
function AwardCard() {
  const t = useT();
  const award = useApi("/shivdurg-award").data?.data;
  const title = t("Shivdurg Bhushan Puraskar 2026", "शिवदुर्गभूषण पुरस्कार २०२६");
  const tagline = t(
    "Click the link below for full details of the award programme, its rules and conditions, and related information.",
    "पुरस्कार कार्यक्रमाची सविस्तर माहिती, नियम व अटी आणि संबंधित तपशील जाणून घेण्यासाठी खालील लिंकवर क्लिक करा.",
  );
  return (
    <aside className="hero-award" aria-labelledby="hero-award-title">
      <figure className="hero-award__card">
        <picture>
          <source type="image/avif" srcSet="/images/award/shivdurg-award-wide-480.avif 480w, /images/award/shivdurg-award-wide-900.avif 900w" sizes="(max-width: 1100px) 440px, 24vw" />
          <source type="image/webp" srcSet="/images/award/shivdurg-award-wide-480.webp 480w, /images/award/shivdurg-award-wide-900.webp 900w" sizes="(max-width: 1100px) 440px, 24vw" />
          <img src="/images/award/shivdurg-award-wide-480.webp" alt={t("Amrut Shivdurg Bhushan Puraskar award plaque", "अमृत शिवदुर्ग भूषण पुरस्काराचे सन्मानचिन्ह")}
            width="900" height="500" decoding="async" />
        </picture>
        {award?.status?.open && (
          <figcaption className="hero-award__badge"><Award size={13} aria-hidden="true" /> {t("Nominations open", "नामनिर्देशन सुरू")}</figcaption>
        )}
      </figure>
      <h2 id="hero-award-title" className="hero-award__title">{title}</h2>
      <p className="hero-award__lead">{tagline}</p>
      <div className="hero-award__actions">
        <Link to={`${AWARD_PATH}/nominate`} className="hero-btn hero-btn--primary hero-btn--sm">
          <span>{t("Participate", "सहभागी व्हा")}</span>
          <span className="hero-btn__circle" aria-hidden="true"><ArrowRight size={16} strokeWidth={2.6} /></span>
        </Link>
        <Link to={AWARD_PATH} className="hero-btn hero-btn--outline hero-btn--sm">
          <Info className="hero-btn__icon" aria-hidden="true" />
          <span>{t("About the Award", "पुरस्काराची माहिती")}</span>
        </Link>
      </div>
      <p className="hero-award__prizes-label" id="hero-award-prizes">
        <Trophy size={15} strokeWidth={2.2} aria-hidden="true" /> {t("Win exciting cash prizes", "आकर्षक रोख पारितोषिके जिंका")}<span className="hero-award__star" aria-hidden="true">*</span>
      </p>
      <ul className="hero-award__prizes" aria-labelledby="hero-award-prizes">
        <li><small>{t("Individual", "व्यक्तिगत विभाग")}</small> <b>₹51,000</b></li>
        <li><small>{t("Organization", "संस्थात्मक विभाग")}</small> <b>₹51,000</b></li>
      </ul>
      <p className="hero-award__note">
        <span aria-hidden="true">*</span>{" "}
        {t("Please note: cash prizes are only for the Shivdurg Bhushan Award 2026, not for Durgotsav.", "कृपया नोंद घ्यावी: रोख पारितोषिके केवळ शिवदुर्ग भूषण पुरस्कार २०२६ साठी आहेत, दुर्गोत्सवासाठी नाहीत.")}
      </p>
    </aside>
  );
}

export function Hero() {
  const { settings } = useSite();
  const t = useT();
  const root = useRef(null);
  const year = yearFrom(settings.hero?.title);

  const FEATURES = [
    [FortIcon, "12", t("Forts", "दुर्ग")],
    [ColumnsIcon, t("Recognized by", "मान्यता मिळालेले"), "UNESCO"],
    [MaharashtraIcon, t("Pride of", "अभिमान"), t("Maharashtra", "महाराष्ट्राचा")],
    [PeopleIcon, t("A Heritage", "एक वारसा"), t("For Generations", "पिढ्यांसाठी")],
  ];

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      if (prefersReducedMotion()) return;
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      tl.fromTo(".hero__bg img", { scale: 1.1 }, { scale: 1, duration: 2.6, ease: "power2.out" }, 0)
        .from(".hero__eyebrow", { opacity: 0, x: -20, duration: 0.8 }, 0.25)
        .from(".hero__brush", { scaleX: 0, transformOrigin: "0 50%", duration: 0.8 }, 0.45)
        .from(".hero__pre", { opacity: 0, y: 14, duration: 0.8 }, 0.35)
        .from(".hero__name", { opacity: 0, y: 36, duration: 1 }, 0.45)
        .from(".hero__year", { opacity: 0, x: -24, rotate: -14, duration: 1, ease: "back.out(1.6)" }, 0.75)
        .from(".hero__lead", { opacity: 0, y: 18, duration: 0.8 }, 0.95)
        .from(".hero__actions > *", { opacity: 0, y: 16, stagger: 0.12, duration: 0.7 }, 1.1)
        .from(".hero__feature", { opacity: 0, y: 14, stagger: 0.08, duration: 0.6 }, 1.3)
        .from(".hero-award", { opacity: 0, x: 28, duration: 0.9, clearProps: "transform" }, 1.15);
      const st = { trigger: root.current, start: "top top", end: "bottom top", scrub: true };
      gsap.to(".hero__bg", { yPercent: 8, ease: "none", scrollTrigger: st });
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <section className="hero" ref={root} aria-labelledby="hero-title">
      <div className="hero__bg" aria-hidden="true">
        <picture>
          <source type="image/avif" srcSet="/images/hero-fort-960.avif 960w, /images/hero-fort.avif 1855w" sizes="100vw" />
          <source type="image/webp" srcSet="/images/hero-fort-960.webp 960w, /images/hero-fort.webp 1855w" sizes="100vw" />
          <img src="/images/hero-fort.webp" alt="" width="1855" height="848" fetchPriority="high" decoding="async" />
        </picture>
      </div>
      <div className="hero__shade" aria-hidden="true" />

      <div className="hero__content">
        <p className="hero__eyebrow">
          <span className="hero__dot" aria-hidden="true" />
          {t("Maharashtra's ", "महाराष्ट्राचा ")}<b>{t("glorious heritage", "गौरवशाली वारसा")}</b>{t("... for the next generation", "...पुढील पिढीसाठी")}
        </p>
        <Brush />
        <h1 id="hero-title" className="hero__title">
          <span className="hero__pre">{t("Amrut", "अमृत")}</span>
          <span className="hero__name">{t("Durgotsav", "दुर्गोत्सव")}</span>
          <span className="hero__year">{t(year, year.replace(/[0-9]/g, (d) => "०१२३४५६७८९"[d]))}</span>
        </h1>
        <p className="hero__lead">
          {t(
            "Our 12 forts, which have stood as witnesses to the prowess of Shiv Chhatrapati, have recently been recognized as world heritage sites by UNESCO, thanks to the tireless efforts of the Maharashtra government.",
            "छत्रपती शिवाजी महाराजांच्या पराक्रमाचे साक्षीदार असणाऱ्या १२ दुर्गांना महाराष्ट्र शासनाच्या अथक प्रयत्नांमुळे युनेस्कोने नुकताच जागतिक वारसा स्थळांचा दर्जा दिला आहे."
          )}
        </p>
        <div className="hero__actions">
          <Link to="/#world-record" className="hero-btn hero-btn--primary">
            <span>{t("See world record glory", "विश्वविक्रम पाहा")}</span>
            <span className="hero-btn__circle" aria-hidden="true"><ArrowRight size={19} strokeWidth={2.6} /></span>
          </Link>
          <Link to="/album" className="hero-btn hero-btn--outline">
            <ImageIcon className="hero-btn__icon" aria-hidden="true" />
            <span>
              {t("Largest Online Photo Album", "सर्वात मोठा ऑनलाइन फोटो अल्बम")}<br />
              {t("of Handmade Sculptures", "हस्तनिर्मित शिल्पांचा")} <ArrowRight className="hero-btn__arrow" size={15} aria-hidden="true" />
            </span>
          </Link>
        </div>
      </div>

      <AwardCard />

      <ul className="hero__features" aria-label={t("Highlights", "ठळक मुद्दे")}>
        {FEATURES.map(([Icon, a, b]) => (
          <li key={b} className="hero__feature">
            <Icon className="hero__feature-icon" />
            <span>{a}<br />{b}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
