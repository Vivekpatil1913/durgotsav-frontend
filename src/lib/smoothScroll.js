import Lenis from "lenis";

let lenis = null;

export const prefersReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Lenis drives the window's own scroll position, so GSAP ScrollTrigger and IntersectionObserver keep working.
export function startSmoothScroll() {
  if (lenis || prefersReducedMotion() || window.matchMedia("(pointer: coarse)").matches) return () => {};
  lenis = new Lenis({ duration: 1.1, smoothWheel: true, wheelMultiplier: 0.9 });
  let frame;
  const raf = (time) => {
    lenis?.raf(time);
    frame = requestAnimationFrame(raf);
  };
  frame = requestAnimationFrame(raf);
  return () => {
    cancelAnimationFrame(frame);
    lenis?.destroy();
    lenis = null;
  };
}

// Modals / lightbox pause smooth scrolling and lock the page
export function lockScroll(locked) {
  if (lenis) (locked ? lenis.stop() : lenis.start());
  document.documentElement.style.overflow = locked ? "hidden" : "";
}

export function scrollToTop() {
  // force: still jump while Lenis is stopped (e.g. a menu/modal was open)
  if (lenis) lenis.scrollTo(0, { immediate: true, force: true });
  window.scrollTo({ top: 0, left: 0, behavior: "instant" });
}

export function scrollToElement(el) {
  if (!el) return;
  if (lenis) lenis.scrollTo(el, { offset: -90 });
  else el.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "start" });
}
