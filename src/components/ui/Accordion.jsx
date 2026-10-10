import { AnimatePresence, motion } from "framer-motion";
import { Plus } from "lucide-react";
import { useId, useState } from "react";

export function Accordion({ items, defaultOpen = -1, renderBody = (i) => i.body }) {
  const [open, setOpen] = useState(defaultOpen);
  const id = useId();
  return (
    <div className="accordion">
      {items.map((item, i) => {
        const expanded = open === i;
        return (
          <div className="accordion__item" key={item.key ?? i}>
            <h3 style={{ margin: 0, fontFamily: "var(--font-body)" }}>
              <button
                type="button"
                className="accordion__trigger"
                aria-expanded={expanded}
                aria-controls={`${id}-${i}`}
                id={`${id}-t-${i}`}
                onClick={() => setOpen(expanded ? -1 : i)}
              >
                <span>{item.title}</span>
                <span className="accordion__icon" aria-hidden="true"><Plus size={16} /></span>
              </button>
            </h3>
            <AnimatePresence initial={false}>
              {expanded && (
                <motion.div
                  id={`${id}-${i}`}
                  role="region"
                  aria-labelledby={`${id}-t-${i}`}
                  className="accordion__panel"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                >
                  <div className="accordion__panel-inner">{renderBody(item)}</div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
