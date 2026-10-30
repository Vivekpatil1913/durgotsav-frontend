import { useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { StatsBand } from "../components/home/HomeSections.jsx";
import { Highlights2025 } from "../components/gallery/Highlights2025.jsx";
import { PhotoFilters, PhotoGrid } from "../components/gallery/PhotoGrid.jsx";
import { Seo } from "../components/seo/Seo.jsx";
import { EmptyState, ErrorState, PageHero, Pagination, SkeletonGrid } from "../components/ui/PageParts.jsx";
import { useLang, useT } from "../context/LanguageContext.jsx";
import { useApi } from "../hooks/useApi.js";
import { mrNumber } from "../lib/format.js";
import { scrollToElement } from "../lib/smoothScroll.js";
import "./pages.css";

const PAGE_SIZE = 10;

// Page and filters live in the URL (?page=&district=&fort=) and go to the API as-is — the server filters,
// counts and pages, so only PAGE_SIZE photos are ever fetched or rendered, however large the gallery grows.
export default function Gallery() {
  const t = useT();
  const { lang } = useLang();
  const [params, setParams] = useSearchParams();
  const asked = Number(params.get("page"));
  const page = Number.isSafeInteger(asked) && asked > 1 ? asked : 1;
  const filters = { district_id: params.get("district") || "", fort_id: params.get("fort") || "" };
  const query = { page, limit: PAGE_SIZE, ...(filters.district_id && { district_id: filters.district_id }), ...(filters.fort_id && { fort_id: filters.fort_id }) };
  const { data, error, loading, fetching, reload } = useApi("/gallery", query);
  const districts = useApi("/districts").data?.data ?? [];
  const forts = useApi("/forts").data?.data ?? [];
  const top = useRef(null);

  const update = (next, options) => {
    const p = new URLSearchParams();
    if (next.page > 1) p.set("page", next.page);
    if (next.district_id) p.set("district", next.district_id);
    if (next.fort_id) p.set("fort", next.fort_id);
    setParams(p, options);
  };
  const goToPage = (p) => {
    update({ ...filters, page: p });
    scrollToElement(top.current);
  };

  // The API clamps a page past the end (an old link, or photos removed since) — keep the URL in step with it,
  // and replace an invalid ?page= (0, -3, 1.5, abc) with the page actually shown
  const served = data?.meta.page;
  const pageParam = params.get("page");
  useEffect(() => {
    if (!fetching && served && pageParam !== (served > 1 ? String(served) : null)) update({ ...filters, page: served }, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetching, served, pageParam]);

  const photos = data?.data ?? [];
  const meta = data?.meta;
  const from = meta ? (meta.page - 1) * meta.limit + 1 : 0;
  const to = from + photos.length - 1;
  const rangeLabel = lang === "mr"
    ? `${mrNumber(meta?.total ?? 0)} पैकी ${mrNumber(from)}–${mrNumber(to)} छायाचित्रे`
    : `${from}–${to} of ${meta?.total ?? 0} photos`;

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
      <Highlights2025 />
      <section className="section surface-night">
        <div className="container" ref={top}>
          <div className="gallery-toolbar">
            <PhotoFilters districts={districts} forts={forts} value={filters} onChange={(f) => update({ ...f, page: 1 })} />
            {photos.length > 0 && <p className="gallery-count" aria-live="polite">{rangeLabel}</p>}
          </div>
          {error && <ErrorState error={error} onRetry={reload} />}
          {loading && <SkeletonGrid count={PAGE_SIZE} ratio="3 / 4" />}
          {!loading && !fetching && data && photos.length === 0 && (
            <EmptyState title={t("No photos available yet", "अजून छायाचित्रे उपलब्ध नाहीत")}>
              {t("Selected photos for this filter will appear here soon.", "या निवडीसाठी निवडक छायाचित्रे लवकरच येथे दिसतील.")}
            </EmptyState>
          )}
          {photos.length > 0 && (
            <div className="gallery-results" aria-busy={fetching}>
              <PhotoGrid photos={photos} />
            </div>
          )}
          {meta && <Pagination page={Math.min(page, meta.totalPages)} totalPages={meta.totalPages} onChange={goToPage} />}
        </div>
      </section>
      <StatsBand />
    </>
  );
}
