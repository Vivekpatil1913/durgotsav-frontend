import { useMemo, useState } from "react";
import { FortCard } from "../components/forts/FortCard.jsx";
import { FortMap } from "../components/forts/FortMap.jsx";
import { StatsBand } from "../components/home/HomeSections.jsx";
import { Seo } from "../components/seo/Seo.jsx";
import { ErrorState, PageHero, SkeletonGrid } from "../components/ui/PageParts.jsx";
import { Reveal } from "../components/ui/Reveal.jsx";
import { useLang, useT } from "../context/LanguageContext.jsx";
import { useApi } from "../hooks/useApi.js";
import { FORT_TYPES, FORT_TYPES_EN } from "../lib/format.js";
import "./pages.css";

export default function Forts() {
  const { data, error, loading, reload } = useApi("/forts");
  const { lang } = useLang();
  const t = useT();
  const [type, setType] = useState("all");
  const [active, setActive] = useState(null);
  const forts = data?.data ?? [];
  const shown = useMemo(() => (type === "all" ? forts : forts.filter((f) => f.fort_type === type)), [forts, type]);
  const available = new Set(forts.map((f) => f.fort_type));
  const fortTypes = lang === "mr" ? FORT_TYPES : FORT_TYPES_EN;

  const FILTERS = [
    ["all",          t("All Forts", "सर्व दुर्ग")],
    ["hill",         fortTypes.hill],
    ["hill-forest",  fortTypes["hill-forest"]],
    ["coastal",      fortTypes.coastal],
    ["island",       fortTypes.island],
  ];

  return (
    <>
      <Seo
        title={t("UNESCO World Heritage — 12 Forts", "युनेस्को जागतिक वारसा — १२ दुर्ग")}
        description={t(
          "Maratha Military Landscapes of India — 12 forts that witnessed the valour of Chhatrapati Shivaji: history, location and features.",
          "Maratha Military Landscapes of India — शिवछत्रपतींच्या पराक्रमाचे साक्षीदार असलेले १२ दुर्ग: इतिहास, स्थान व वैशिष्ट्ये."
        )}
      />
      <PageHero
        eyebrow={t("Maratha Military Landscapes of India", "मराठा मिलिटरी लँडस्केप्स ऑफ इंडिया")}
        title={t("Twelve UNESCO World Heritage Forts of Shivaji", "शिवछत्रपतींचे बारा जागतिक वारसा दुर्ग")}
        lead={t(
          "From the hill forts of the Sahyadri ranges to the sea forts in the ocean — this chain of forts built to protect Swarajya was included in UNESCO's World Heritage list in 2025.",
          "सह्याद्रीच्या कड्यांवरील गिरिदुर्गांपासून समुद्रातील जलदुर्गांपर्यंत — स्वराज्याच्या संरक्षणासाठी उभारलेली ही दुर्गशृंखला २०२५ मध्ये युनेस्कोच्या जागतिक वारसा यादीत समाविष्ट झाली."
        )}
      />
      <section className="section surface-night forts-page">
        <div className="container">
          {error && <ErrorState error={error} onRetry={reload} />}
          {loading && <SkeletonGrid count={6} ratio="4 / 5" />}
          {!loading && !error && (
            <div className="forts-layout">
              <Reveal className="forts-layout__map">
                <FortMap forts={forts} active={active} onHover={setActive} />
              </Reveal>
              <div>
                <div className="cluster forts-filter" role="group" aria-label={t("Filter by fort type", "दुर्ग प्रकारानुसार गाळा")}>
                  {FILTERS.filter(([k]) => k === "all" || available.has(k)).map(([key, label]) => (
                    <button key={key} type="button" className="chip" aria-pressed={type === key} onClick={() => setType(key)}>
                      {label}
                    </button>
                  ))}
                </div>
                <p className="sr-only" aria-live="polite">{shown.length} {t("forts shown", "दुर्ग दाखवले आहेत")}</p>
                <div className="grid forts-grid">
                  {shown.map((fort) => (
                    <FortCard key={fort.slug} fort={fort} index={forts.indexOf(fort)} active={active === fort.slug} onHover={setActive} />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
      <StatsBand />
    </>
  );
}
