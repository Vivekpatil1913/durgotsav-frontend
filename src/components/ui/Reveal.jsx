import { motion, useReducedMotion } from "framer-motion";

const EASE = [0.22, 1, 0.36, 1];

// Fades + lifts children into view once. `delay` staggers siblings.
export function Reveal({ as = "div", children, delay = 0, y = 28, className, ...rest }) {
  const reduce = useReducedMotion();
  const Comp = motion[as] ?? motion.div;
  return (
    <Comp
      className={className}
      initial={reduce ? false : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -10% 0px" }}
      transition={{ duration: 0.8, ease: EASE, delay }}
      {...rest}
    >
      {children}
    </Comp>
  );
}

export const staggerParent = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};
export const staggerChild = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } },
};
