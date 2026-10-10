import { motion, useReducedMotion } from "framer-motion";
import { MessageCircle } from "lucide-react";
import { Suspense, useEffect, useRef } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { useT } from "../../context/LanguageContext.jsx";
import { useSite } from "../../context/SiteContext.jsx";
import { scrollToElement, scrollToTop } from "../../lib/smoothScroll.js";
import { Footer } from "./Footer.jsx";
import { Header } from "./Header.jsx";

function PageFallback() {
  const t = useT();
  return <div className="page-fallback" aria-busy="true" aria-label={t("Loading", "लोड होत आहे")} />;
}

// Scroll to top on navigation, or to #hash targets once the lazy page has rendered.
function useScrollRestoration() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (!hash) {
      scrollToTop();
      return undefined;
    }
    // Jump to top immediately so browser scroll-restoration doesn't lock us
    // at whatever position the home page was last seen at.
    scrollToTop();
    let tries = 0;
    const timer = setInterval(() => {
      const el = document.getElementById(hash.slice(1));
      if (el || ++tries > 50) {
        clearInterval(timer);
        if (!el) return;
        // Sections have large padding-top before their visible content.
        // Scrolling to the first eyebrow/heading inside puts content right
        // below the fixed header rather than leaving a blank padding gap.
        const target =
          el.tagName === 'SECTION'
            ? el.querySelector('.eyebrow, h1, h2, h3') ?? el
            : el;
        scrollToElement(target);
      }
    }, 100);
    return () => clearInterval(timer);
  }, [pathname, hash]);
}

export function Layout() {
  const { pathname } = useLocation();
  const reduce = useReducedMotion();
  const { settings } = useSite();
  const mainRef = useRef(null);
  useScrollRestoration();

  const t = useT();
  const whatsapp = settings.contact?.whatsapp;
  return (
    <>
      <a href="#main" className="skip-link">{t("Skip to main content", "मुख्य मजकुराकडे जा")}</a>
      <Header />
      <main id="main" ref={mainRef} tabIndex={-1}>
        <Suspense fallback={<PageFallback />}>
          <motion.div
            key={pathname}
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <Outlet />
          </motion.div>
        </Suspense>
      </main>
      <Footer />
      {whatsapp && (
        <a
          className="help-fab"
          href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(t("Hello! I need help with Durgotsav 2026.", "नमस्कार! मला दुर्गोत्सव २०२६ बद्दल मदत हवी आहे."))}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={t("Get help on WhatsApp", "WhatsApp वर मदत मिळवा")}
        >
          <MessageCircle size={22} />
          <span>{t("Help", "मदत")}</span>
        </a>
      )}
    </>
  );
}
