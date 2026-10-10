import { useState } from "react";
import { useLang, useT } from "../../context/LanguageContext.jsx";
import { Img } from "../ui/Img.jsx";
import { Lightbox } from "../ui/Lightbox.jsx";

export function PhotoGrid({ photos }) {
  const t = useT();
  const { lang } = useLang();
  const pName = (p) => (lang === "mr" ? p.name : (p.name_en || p.name));
  const pFort = (p) => (lang === "mr" ? p.fort : (p.fort_en || p.fort));
  const pDistrict = (p) => (lang === "mr" ? p.district : (p.district_en || p.district));
  const caption = (p) => [pName(p), pFort(p), pDistrict(p)].filter(Boolean).join(" · ");
  const items = photos.map((p) => ({
    src: p.image_path,
    alt: t(`${pName(p)}'s fort replica`, `${pName(p)} यांची दुर्गाची प्रतिकृती`),
    caption: caption(p),
  }));
  const [index, setIndex] = useState(null);
  return (
    <>
      <div className="masonry">
        {photos.map((p, i) => (
          <button key={p.id} type="button" className="photo-tile" onClick={() => setIndex(i)}
            aria-label={t(`Enlarge photo: ${caption(p)}`, `छायाचित्र मोठे करा: ${caption(p)}`)}>
            <Img src={p.thumb_path} alt={items[i].alt} width={p.width} height={p.height} />
            <span className="photo-tile__meta"><strong>{pName(p)}</strong>{[pFort(p), pDistrict(p)].filter(Boolean).join(" · ")}</span>
          </button>
        ))}
      </div>
      <Lightbox items={items} index={index} onClose={() => setIndex(null)} onIndex={setIndex} />
    </>
  );
}

export function PhotoFilters({ districts, forts, value, onChange }) {
  const t = useT();
  const { lang } = useLang();
  const set = (key) => (e) => onChange({ ...value, [key]: e.target.value });
  return (
    <div className="filters" role="search" aria-label={t("Filter photos", "छायाचित्रे गाळा")}>
      <div className="field">
        <label className="field__label" htmlFor="f-district">{t("District", "जिल्हा")}</label>
        <select id="f-district" className="select" value={value.district_id} onChange={set("district_id")}>
          <option value="">{t("All Districts", "सर्व जिल्हे")}</option>
          {districts.map((d) => <option key={d.id} value={d.id}>{lang === "mr" ? d.name_mr : (d.name_en || d.name_mr)}</option>)}
        </select>
      </div>
      <div className="field">
        <label className="field__label" htmlFor="f-fort">{t("Fort", "दुर्ग")}</label>
        <select id="f-fort" className="select" value={value.fort_id} onChange={set("fort_id")}>
          <option value="">{t("All Forts", "सर्व दुर्ग")}</option>
          {forts.map((f) => <option key={f.id} value={f.id}>{lang === "mr" ? f.name_mr : (f.name_en || f.name_mr)}</option>)}
        </select>
      </div>
    </div>
  );
}
