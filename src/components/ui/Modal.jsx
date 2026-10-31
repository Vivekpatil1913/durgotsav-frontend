import { X } from "lucide-react";
import { useEffect, useRef } from "react";
import { useT } from "../../context/LanguageContext.jsx";
import { lockScroll } from "../../lib/smoothScroll.js";
import "./modal.css";

// A native <dialog>: showModal() gives focus trapping, Esc and an inert page behind it.
// dismissable = false while something must finish (an upload): Esc, the backdrop and × do nothing.
export function Modal({ open, onClose, labelledBy, dismissable = true, className = "", children }) {
  const t = useT();
  const ref = useRef(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    const dlg = ref.current;
    if (!open || !dlg) return undefined;
    if (!dlg.open) dlg.showModal();
    lockScroll(true);
    return () => {
      lockScroll(false);
      if (dlg.open) dlg.close();
    };
  }, [open]);

  if (!open) return null;
  return (
    <dialog
      ref={ref}
      className={`modal ${className}`}
      aria-labelledby={labelledBy}
      onCancel={(e) => {
        e.preventDefault();
        if (dismissable) closeRef.current?.();
      }}
      onClick={(e) => { if (dismissable && e.target === e.currentTarget) closeRef.current?.(); }}
    >
      <div className="modal__card" data-lenis-prevent>
        {dismissable && (
          <button type="button" className="modal__close" aria-label={t("Close", "बंद करा")} onClick={() => closeRef.current?.()}>
            <X size={20} aria-hidden="true" />
          </button>
        )}
        {children}
      </div>
    </dialog>
  );
}
