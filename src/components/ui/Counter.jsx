import { animate, useInView, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useLang } from "../../context/LanguageContext.jsx";
import { mrNumber } from "../../lib/format.js";

const enFmt = new Intl.NumberFormat("en-IN");

// Counts up (Marathi or English numerals based on current language) when scrolled into view.
export function Counter({ value = 0, duration = 1.6 }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-10% 0px" });
  const reduce = useReducedMotion();
  const { lang } = useLang();
  const [shown, setShown] = useState(reduce ? value : 0);

  const format = (n) => lang === "mr" ? mrNumber(n) : enFmt.format(n);

  useEffect(() => {
    if (!inView) return undefined;
    if (reduce) {
      setShown(value);
      return undefined;
    }
    const controls = animate(0, value, { duration, ease: [0.22, 1, 0.36, 1], onUpdate: (v) => setShown(Math.round(v)) });
    return () => controls.stop();
  }, [inView, value, duration, reduce]);

  return (
    <span ref={ref} aria-label={enFmt.format(value)}>
      {format(shown)}
    </span>
  );
}
