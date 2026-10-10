import { Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { StatsBand } from "../components/home/HomeSections.jsx";
import { PhotoFilters, PhotoGrid } from "../components/gallery/PhotoGrid.jsx";
import { Seo } from "../components/seo/Seo.jsx";
import { EmptyState, ErrorState, PageHero, SkeletonGrid } from "../components/ui/PageParts.jsx";
import { useLang, useT } from "../context/LanguageContext.jsx";
import { useApi } from "../hooks/useApi.js";
import { http, toApiError } from "../lib/api.js";
import { mrNumber } from "../lib/format.js";
import "./pages.css";

const PAGE = 24;

export default function Gallery() {
  const t = useT();
  const { lang } = useLang();
  const districts = useApi("/districts").data?.data ?? [];
  const forts = useApi("/forts").data?.data ?? [];
  const [filters, setFilters] = useState({ district_id: "", fort_id: "" });
  const [state, setState] = useState({ items: [], page: 0, totalPages: 1, total: 0, loading: true, error: null });
  const sentinel = useRef(null);
  const loadingRef = useRef(false);

  async function load(page, reset = false) {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const params = { page, limit: PAGE, ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v)) };
      const { data } = await http.get("/gallery", { params });
      setState((s) => ({
        items: reset ? data.data : [...s.items, ...data.data],
        page,
        totalPages: data.meta.totalPages,
        total: data.meta.total,
        loading: false,
        error: null,
      }));
    } catch (err) {
      setState((s) => ({ ...s, loading: false, error: toApiError(err) }));
    } finally {
      loadingRef.current = false;
    }
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(1, true); }, [filters.district_id, filters.fort_id]);

  useEffect(() => {
    const el = sentinel.current;
    if (!el) return undefined;
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !loadingRef.current && state.page < state.totalPages) load(state.page + 1);
    }, { rootMargin: "600px 0px" });
    io.observe(el);
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.page, state.totalPages]);

  const countLabel = lang === "mr" ? `${mrNumber(state.total)} छायाचित्रे` : `${state.total} photos`;

  return (
    <>
      <Seo
        title={t("Gallery — Fort Replicas", "गॅलरी — दुर्गवीरांच्या प्रतिकृती")}
        description={t(
          "Selected photos of fort replicas built in homes across Maharashtra by Durgotsav participants.",
          "दुर्गोत्सवात सहभागी झालेल्या नागरिकांनी घराघरात उभारलेल्या दुर्गांच्या प्रतिकृतींची निवडक छायाचित्रे."
        )}
      />
      <PageHero
        eyebrow={t("Gallery", "गॅलरी")}
        title={t("Forts Built in Every Home", "घराघरांत उभे राहिलेले दुर्ग")}
        lead={t(
          "Selected photos of verified replicas. Open the Photo Album to see all photos.",
          "पडताळणी पूर्ण झालेल्या प्रतिकृतींपैकी निवडक छायाचित्रे. सर्व छायाचित्रे पाहण्यासाठी फोटो अल्बम उघडा."
        )}
      />
      <section className="section surface-night">
        <div className="container">
          <div className="gallery-toolbar">
            <PhotoFilters districts={districts} forts={forts} value={filters} onChange={setFilters} />
            {!state.loading && <p className="gallery-count" aria-live="polite">{countLabel}</p>}
          </div>
          {state.error && <ErrorState error={state.error} onRetry={() => load(1, true)} />}
          {state.loading && state.items.length === 0 && <SkeletonGrid count={8} ratio="3 / 4" />}
          {!state.loading && !state.error && state.items.length === 0 && (
            <EmptyState title={t("No photos available yet", "अजून छायाचित्रे उपलब्ध नाहीत")}>
              {t("Selected photos for this filter will appear here soon.", "या निवडीसाठी निवडक छायाचित्रे लवकरच येथे दिसतील.")}
            </EmptyState>
          )}
          {state.items.length > 0 && <PhotoGrid photos={state.items} />}
          <div ref={sentinel} aria-hidden="true" />
          {state.loading && state.items.length > 0 && (
            <p className="load-more"><Loader2 className="spin" aria-hidden="true" /> {t("Loading more photos…", "आणखी छायाचित्रे लोड होत आहेत…")}</p>
          )}
        </div>
      </section>
      <StatsBand />
    </>
  );
}
