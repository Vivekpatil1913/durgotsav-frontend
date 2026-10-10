import { useSearchParams } from "react-router-dom";
import { PhotoFilters, PhotoGrid } from "../components/gallery/PhotoGrid.jsx";
import { StatsBand } from "../components/home/HomeSections.jsx";
import { Seo } from "../components/seo/Seo.jsx";
import { EmptyState, ErrorState, PageHero, Pagination, SkeletonGrid } from "../components/ui/PageParts.jsx";
import { useLang, useT } from "../context/LanguageContext.jsx";
import { useApi } from "../hooks/useApi.js";
import { mrNumber } from "../lib/format.js";
import { scrollToTop } from "../lib/smoothScroll.js";
import "./pages.css";

export default function Album() {
  const t = useT();
  const { lang } = useLang();
  const [params, setParams] = useSearchParams();
  const page = Math.max(1, Number(params.get("page")) || 1);
  const filters = { district_id: params.get("district") || "", fort_id: params.get("fort") || "" };
  const query = { page, ...(filters.district_id && { district_id: filters.district_id }), ...(filters.fort_id && { fort_id: filters.fort_id }) };
  const { data, error, loading, reload } = useApi("/images", query);
  const districts = useApi("/districts").data?.data ?? [];
  const forts = useApi("/forts").data?.data ?? [];

  const update = (next) => {
    const p = new URLSearchParams();
    if (next.page > 1) p.set("page", next.page);
    if (next.district_id) p.set("district", next.district_id);
    if (next.fort_id) p.set("fort", next.fort_id);
    setParams(p);
    scrollToTop();
  };

  const from = data ? (data.page - 1) * data.page_size + 1 : 0;
  const to = data ? from + data.items.length - 1 : 0;
  const totalLabel = lang === "mr" ? `${mrNumber(data?.total_images ?? 0)} छायाचित्रे` : `${data?.total_images ?? 0} photos`;
  const rangeLabel = lang === "mr"
    ? `${mrNumber(data?.total_images ?? 0)} पैकी ${mrNumber(from)}–${mrNumber(to)}`
    : `${from}–${to} of ${data?.total_images ?? 0}`;

  return (
    <>
      <Seo
        title={t("Photo Album — Largest Online Album of Handmade Replicas", "फोटो अल्बम — Largest Online Photo Album of Handmade Sculptures")}
        description={t(
          "The world's largest online photo album of handmade fort replicas built by Durgotsav participants.",
          "दुर्गोत्सवात सहभागी नागरिकांनी हाताने बनवलेल्या दुर्ग प्रतिकृतींचा जगातील सर्वात मोठा ऑनलाइन फोटो अल्बम."
        )}
      />
      <PageHero
        eyebrow={t("Largest Online Photo Album of Handmade Sculptures", "Largest Online Photo Album of Handmade Sculptures")}
        title={t("Durgotsav Photo Album", "दुर्गोत्सव फोटो अल्बम")}
        lead={t(
          "A photo from every verified replica — from homes across Maharashtra.",
          "पडताळणी पूर्ण झालेल्या प्रत्येक प्रतिकृतीचे छायाचित्र — महाराष्ट्राच्या घराघरांतून."
        )}
      >
        {data && <p className="album-total"><strong>{lang === "mr" ? mrNumber(data.total_images) : data.total_images}</strong> {t("photos", "छायाचित्रे")}</p>}
      </PageHero>
      <section className="section surface-night">
        <div className="container">
          <div className="gallery-toolbar">
            <PhotoFilters districts={districts} forts={forts} value={filters} onChange={(f) => update({ ...f, page: 1 })} />
            {data?.items.length > 0 && (
              <p className="gallery-count" aria-live="polite">{rangeLabel}</p>
            )}
          </div>
          {error && <ErrorState error={error} onRetry={reload} />}
          {loading && <SkeletonGrid count={12} ratio="3 / 4" />}
          {!loading && data && data.items.length === 0 && (
            <EmptyState title={t("No photos available yet", "अजून छायाचित्रे उपलब्ध नाहीत")}>
              {t("Verified photos will appear here.", "पडताळणी पूर्ण झालेली छायाचित्रे येथे दिसतील.")}
            </EmptyState>
          )}
          {!loading && data?.items.length > 0 && <PhotoGrid photos={data.items} />}
          {data && <Pagination page={data.page} totalPages={data.total_pages} onChange={(p) => update({ ...filters, page: p })} />}
        </div>
      </section>
      <StatsBand />
    </>
  );
}
