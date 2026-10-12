import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowRight, Image as ImageIcon } from "lucide-react";
import { useLayoutEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useT } from "../../context/LanguageContext.jsx";
import { useSite } from "../../context/SiteContext.jsx";
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
        .from(".hero__name", { opacity: 0, y: 36, duration: 1 }, 0.4)
        .from(".hero__year", { opacity: 0, x: -24, rotate: -14, duration: 1, ease: "back.out(1.6)" }, 0.75)
        .from(".hero__lead", { opacity: 0, y: 18, duration: 0.8 }, 0.95)
        .from(".hero__actions > *", { opacity: 0, y: 16, stagger: 0.12, duration: 0.7 }, 1.1)
        .from(".hero__feature", { opacity: 0, y: 14, stagger: 0.08, duration: 0.6 }, 1.3);
      const st = { trigger: root.current, start: "top top", end: "bottom top", scrub: true };
      gsap.to(".hero__bg", { yPercent: 8, ease: "none", scrollTrigger: st });
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <section className="hero" ref={root} aria-labelledby="hero-title">
      <div className="hero__bg" aria-hidden="true">
        <img src="/images/hero-sunset.webp" srcSet="/images/hero-sunset-960.webp 960w, /images/hero-sunset.webp 1920w" sizes="100vw" alt="" fetchPriority="high" decoding="async" />
      </div>
      <div className="hero__shade" aria-hidden="true" />

      <div className="hero__content">
        <p className="hero__eyebrow">
          <span className="hero__dot" aria-hidden="true" />
          {t("Maharashtra's ", "महाराष्ट्राचा ")}<b>{t("glorious heritage", "गौरवशाली वारसा")}</b>{t("... for the next generation", "...पुढील पिढीसाठी")}
        </p>
        <Brush />
        <h1 id="hero-title" className="hero__title">
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
