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
  if (lenis) lenis.scrollTo(0, { immediate: true });
  else window.scrollTo(0, 0);
}

export function scrollToElement(el) {
  if (!el) return;
  if (lenis) lenis.scrollTo(el, { offset: -90 });
  else el.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "start" });
}
