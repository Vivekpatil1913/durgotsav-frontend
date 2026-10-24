import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Globe, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { EDITION_YEAR, EDITION_YEAR_MR } from "../../config/edition.js";
import { useLang, useT } from "../../context/LanguageContext.jsx";
import { AWARD_PATH } from "../../lib/award.js";
import { lockScroll } from "../../lib/smoothScroll.js";
import "./header.css";

// NAV routes with English + Marathi labels
const NAV = [
  { to: "/about",     label: { en: "Campaign Objectives", mr: "मोहिमेचे उद्दिष्ट" } },
  { to: "/#story",    label: { en: "Information", mr: "माहिती" }, hash: true },
  { to: "/participate", label: { en: "Participation", mr: "सहभाग" } },
  { to: "/gallery",   label: { en: "Gallery", mr: "गॅलरी" } },
];

const MOBILE_EXTRA = [
  { to: AWARD_PATH, label: { en: "Shivdurg Bhushan Award", mr: "शिवदुर्ग भूषण पुरस्कार" } },
  { to: "/forts",       label: { en: "12 Forts", mr: "१२ दुर्ग" } },
  { to: "/videos",      label: { en: "Videos & Podcasts", mr: "व्हिडिओ व पॉडकास्ट" } },
  { to: "/faq",         label: { en: "FAQ", mr: "प्रश्नोत्तरे" } },
  { to: "/contact",     label: { en: "Contact", mr: "संपर्क" } },
];

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { pathname, hash } = useLocation();
  const navigate = useNavigate();
  const { lang, setLang } = useLang();
  const t = useT();
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close the menu and release the scroll lock synchronously on navigation, so
  // Layout's scroll-to-top (which runs after this effect) isn't blocked.
  useEffect(() => {
    setOpen(false);
    lockScroll(false);
  }, [pathname]);
  useEffect(() => {
    lockScroll(open);
    if (!open) return undefined;
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const getLabel = (item) => item.label[lang] ?? item.label.en;

  const navItem = (item, className) => {
    const label = getLabel(item);
    if (item.hash) {
      const targetHash = item.to.replace(/^[^#]*/, ""); // e.g. "/#story" → "#story"
      const isActive = pathname === "/" && hash === targetHash;

      const handleClick = (e) => {
        setOpen(false);
        const el = document.querySelector(targetHash);
        if (el) {
          e.preventDefault();
          el.scrollIntoView({ behavior: "smooth", block: "start" });
          navigate(item.to, { replace: false });
        }
      };

      return (
        <Link
          key={item.to}
          to={item.to}
          className={`${className || ""} ${isActive ? "active" : ""}`.trim()}
          onClick={handleClick}
        >
          {label}
        </Link>
      );
    }
    return <NavLink key={item.to} to={item.to} className={className}>{label}</NavLink>;
  };

  return (
    <header className={`site-header ${scrolled || open ? "is-solid" : ""}`}>
      <div className="site-header__bar">
        <Link to="/" className="brand" aria-label={`Amrut Durgotsav ${EDITION_YEAR} — home`}>
          <img className="brand__emblem" src="/brand/emblem-white.webp" alt={t("Government of Maharashtra Emblem", "महाराष्ट्र शासनाचे बोधचिन्ह")} width="40" height="48" />
          <img className="brand__amrut" src="/brand/amrut-white.webp" alt="AMRUT" width="96" height="48" />
          <img className="brand__logo" src="/brand/durgotsav-logo-320.webp" alt={t(`Amrut Durgotsav ${EDITION_YEAR} Logo`, `अमृत दुर्गोत्सव ${EDITION_YEAR_MR} बोधचिन्ह`)} width="44" height="44" />
          <span className="brand__name">{t("Durgotsav", "दुर्गोत्सव")}</span>
        </Link>

        <nav className="site-nav" aria-label="Main">
          {NAV.map((item) => navItem(item, "site-nav__link"))}
        </nav>

        <div className="site-header__actions">
          <Link to="/#world-record" className="site-header__cta">
            {t("World record glory", "विश्वविक्रम")} <ArrowRight size={16} aria-hidden="true" />
          </Link>
          <button
            type="button"
            className="lang-toggle"
            aria-label={lang === "mr" ? "Switch to English" : "मराठीत पहा"}
            onClick={() => setLang(lang === "mr" ? "en" : "mr")}
            title={lang === "mr" ? "Switch to English" : "मराठीत पहा"}
          >
            <Globe size={15} aria-hidden="true" />
            <span>{lang === "mr" ? "EN" : "मराठी"}</span>
          </button>
          <button
            type="button"
            className="menu-toggle"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((o) => !o)}
          >
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.nav
            id="mobile-menu"
            className="mobile-menu"
            aria-label="Mobile"
            data-lenis-prevent
            initial={{ opacity: 0, clipPath: reducedMotion ? "circle(150% at 100% 0%)" : "circle(0% at 100% 0%)" }}
            animate={{ opacity: 1, clipPath: "circle(150% at 100% 0%)" }}
            exit={{ opacity: 0, clipPath: reducedMotion ? "circle(150% at 100% 0%)" : "circle(0% at 100% 0%)" }}
            transition={{ duration: reducedMotion ? 0 : 0.55, ease: [0.65, 0, 0.35, 1] }}
          >
            <motion.ul initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: reducedMotion ? 0 : 0.05, delayChildren: reducedMotion ? 0 : 0.15 } } }}>
              {[...NAV, ...MOBILE_EXTRA].map((item) => (
                <motion.li key={item.to} variants={{ hidden: { opacity: 0, x: reducedMotion ? 0 : 24 }, show: { opacity: 1, x: 0 } }}>
                  {navItem(item)}
                </motion.li>
              ))}
            </motion.ul>
            <div className="mobile-menu__actions">
              <Link to="/#world-record" className="site-header__cta site-header__cta--block" onClick={() => setOpen(false)}>
                {t("World record glory", "विश्वविक्रम")} <ArrowRight size={16} aria-hidden="true" />
              </Link>
              <Link to="/participate#register" className="btn btn--ghost btn--lg btn--block">
                {t("Participate", "सहभाग")}
              </Link>
              <button
                type="button"
                className="btn btn--ghost btn--lg btn--block lang-toggle-mobile"
                onClick={() => { setLang(lang === "mr" ? "en" : "mr"); setOpen(false); }}
              >
                <Globe size={16} aria-hidden="true" />
                {lang === "mr" ? "Switch to English" : "मराठीत पहा"}
              </button>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
