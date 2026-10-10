import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Maximize2, Minimize2, Pause, Play, X, ZoomIn, ZoomOut } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { assetUrl } from "../../lib/format.js";
import { lockScroll } from "../../lib/smoothScroll.js";
import "./lightbox.css";

export function Lightbox({ items, index, onClose, onIndex }) {
  const open      = index !== null && index >= 0 && items[index];
  const dialogRef = useRef(null);
  const openerRef = useRef(null);
  const closeRef  = useRef(null);
  const thumbRef  = useRef(null);
  const touch     = useRef(null);

  const [zoom,       setZoom]       = useState(1);
  const [playing,    setPlaying]    = useState(false);
  const [fullscreen, setFullscreen] = useState(false);

  const go = useCallback((delta) => {
    setZoom(1);
    onIndex((index + delta + items.length) % items.length);
  }, [index, items.length, onIndex]);

  // ── slideshow ──────────────────────────────────────────────────
  useEffect(() => {
    if (!playing || !open) return;
    const id = setTimeout(() => go(1), 3000);
    return () => clearTimeout(id);
  }, [playing, open, index, go]);

  // ── fullscreen ─────────────────────────────────────────────────
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) dialogRef.current?.requestFullscreen?.();
    else document.exitFullscreen?.();
  };
  useEffect(() => {
    const h = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", h);
    return () => document.removeEventListener("fullscreenchange", h);
  }, []);

  // ── keyboard + scroll-lock ─────────────────────────────────────
  useEffect(() => {
    if (!open) return undefined;
    openerRef.current = document.activeElement;
    lockScroll(true);
    closeRef.current?.focus();
    const onKey = (e) => {
      if (e.key === "Escape")      { onClose(); return; }
      if (e.key === "ArrowRight")  go(1);
      if (e.key === "ArrowLeft")   go(-1);
      if (e.key === "+" || e.key === "=") setZoom(z => Math.min(z + 0.25, 3));
      if (e.key === "-")           setZoom(z => Math.max(z - 0.25, 0.5));
      if (e.key === "Tab") {
        const nodes = [...document.querySelectorAll(".lightbox button")];
        const i = nodes.indexOf(document.activeElement);
        e.preventDefault();
        nodes[(i + (e.shiftKey ? -1 : 1) + nodes.length) % nodes.length]?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      lockScroll(false);
      openerRef.current?.focus?.();
    };
  }, [open, go, onClose]);

  // ── keep active thumbnail in view ─────────────────────────────
  useEffect(() => {
    if (!open || !thumbRef.current) return;
    thumbRef.current
      .querySelector(".lightbox__thumb--active")
      ?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [index, open]);

  const item = open ? items[index] : null;

  return createPortal(
    <AnimatePresence>
      {item && (
        <motion.div
          ref={dialogRef}
          className="lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={item.alt || "छायाचित्र"}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={(e) => e.target === e.currentTarget && onClose()}
          onTouchStart={(e) => (touch.current = e.touches[0].clientX)}
          onTouchEnd={(e) => {
            const dx = e.changedTouches[0].clientX - (touch.current ?? 0);
            if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
          }}
        >
          {/* ── top-right toolbar ─────────────────────────────── */}
          <div className="lightbox__toolbar" role="toolbar" aria-label="Lightbox controls">
            <button type="button" className="lightbox__tool" title="Zoom in (+)"
              onClick={() => setZoom(z => Math.min(z + 0.25, 3))} aria-label="Zoom in">
              <ZoomIn size={17} />
            </button>
            <button type="button" className="lightbox__tool" title="Zoom out (-)"
              onClick={() => setZoom(z => Math.max(z - 0.25, 0.5))} aria-label="Zoom out">
              <ZoomOut size={17} />
            </button>
            <button type="button" className={`lightbox__tool${playing ? " lightbox__tool--on" : ""}`}
              title={playing ? "Pause slideshow" : "Play slideshow"}
              onClick={() => setPlaying(p => !p)} aria-label={playing ? "Pause" : "Play slideshow"}>
              {playing ? <Pause size={17} /> : <Play size={17} />}
            </button>
            <button type="button" className="lightbox__tool" title={fullscreen ? "Exit fullscreen" : "Fullscreen"}
              onClick={toggleFullscreen} aria-label={fullscreen ? "Exit fullscreen" : "Fullscreen"}>
              {fullscreen ? <Minimize2 size={17} /> : <Maximize2 size={17} />}
            </button>
            <div className="lightbox__tool-sep" aria-hidden="true" />
            <button ref={closeRef} type="button" className="lightbox__tool" title="Close (Esc)"
              onClick={onClose} aria-label="बंद करा">
              <X size={17} />
            </button>
          </div>

          {/* ── side navigation ───────────────────────────────── */}
          {items.length > 1 && (
            <>
              <button type="button" className="lightbox__nav lightbox__nav--prev"
                onClick={() => go(-1)} aria-label="मागील छायाचित्र">
                <ChevronLeft size={22} />
              </button>
              <button type="button" className="lightbox__nav lightbox__nav--next"
                onClick={() => go(1)} aria-label="पुढील छायाचित्र">
                <ChevronRight size={22} />
              </button>
            </>
          )}

          {/* ── main image ────────────────────────────────────── */}
          <motion.figure
            key={index}
            className="lightbox__figure"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="lightbox__img-wrap">
              <img
                src={assetUrl(item.src)}
                alt={item.alt || ""}
                style={{ transform: `scale(${zoom})`, transformOrigin: "center center" }}
              />
            </div>
            {(item.caption || items.length > 1) && (
              <figcaption>
                <span>{item.caption}</span>
                <span className="lightbox__count">{index + 1} / {items.length}</span>
              </figcaption>
            )}
          </motion.figure>

          {/* ── thumbnail strip ───────────────────────────────── */}
          {items.length > 1 && (
            <div ref={thumbRef} className="lightbox__thumbstrip" role="tablist" aria-label="सर्व छायाचित्रे">
              {items.map((it, i) => (
                <button
                  key={i}
                  type="button"
                  role="tab"
                  aria-selected={i === index}
                  className={`lightbox__thumb${i === index ? " lightbox__thumb--active" : ""}`}
                  onClick={() => { setZoom(1); onIndex(i); }}
                  aria-label={`छायाचित्र ${i + 1}`}
                >
                  <img src={assetUrl(it.src)} alt="" loading="lazy" />
                </button>
              ))}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
