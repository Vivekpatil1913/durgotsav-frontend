import { CheckCircle2, Copy, Printer } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useLang, useT } from "../../context/LanguageContext.jsx";
import { AWARD_PATH, optFind, pick } from "../../lib/award.js";

const formatter = (lang) => new Intl.DateTimeFormat(lang === "mr" ? "mr-IN" : "en-IN", {
  timeZone: "Asia/Kolkata", day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
});

// Confirmation screen after a successful submission (Developer Requirements §15: unique reference + message)
export function NominationSuccess({ result, edition, values, options }) {
  const t = useT();
  const { lang } = useLang();
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(result.reference_no);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch { /* clipboard blocked */ }
  };
  const title = pick(lang, edition.title, edition.title_en);
  return (
    <div className="card-light reg-success aw-success" role="status" aria-live="polite">
      <span className="reg-success__icon"><CheckCircle2 aria-hidden="true" /></span>
      <h2>{t("Your nomination has been submitted successfully!", "आपले नामनिर्देशन यशस्वीरीत्या सादर झाले!")}</h2>
      <p>{t(
        `We have received your application for the ${title}. Please keep the reference number below for all future communication.`,
        `${title} साठी आपला अर्ज प्राप्त झाला आहे. पुढील पत्रव्यवहारासाठी खालील संदर्भ क्रमांक जपून ठेवा.`,
      )}</p>
      <div className="reg-success__number">
        <span>{t("Reference no.", "संदर्भ क्रमांक")}</span>
        <strong>{result.reference_no}</strong>
        <button type="button" className="btn btn--outline btn--sm" onClick={copy}>
          <Copy aria-hidden="true" /> {copied ? t("Copied", "कॉपी झाले") : t("Copy", "कॉपी करा")}
        </button>
      </div>
      <dl className="aw-success__details">
        <div><dt>{t("Category", "विभाग")}</dt><dd>{optFind(lang, options.categories, result.category)}</dd></div>
        <div><dt>{t("Nominee", "नामनिर्देशित")}</dt><dd>{result.nominee_name}</dd></div>
        <div><dt>{t("Nominator", "नामनिर्देशक")}</dt><dd>{values.nominator_name} · {values.nominator_mobile}</dd></div>
        <div><dt>{t("Submitted on", "सादर केल्याची वेळ")}</dt><dd>{formatter(lang).format(new Date(result.submitted_at))}</dd></div>
      </dl>
      <p className="aw-note">{t(
        "A submitted application cannot be changed. Applications will be scrutinised as per the schedule; you can check the status on the award page using the reference number and mobile number.",
        "अर्ज सादर झाल्यानंतर त्यात बदल करता येत नाही. छाननी नियोजित वेळापत्रकानुसार केली जाईल; अर्जाची स्थिती पुरस्कार पानावर संदर्भ क्रमांक व मोबाईल क्रमांकाने तपासता येईल.",
      )}</p>
      <div className="cluster" style={{ justifyContent: "center" }}>
        <button type="button" className="btn btn--outline" onClick={() => window.print()}><Printer aria-hidden="true" /> {t("Print receipt", "पावती छापा")}</button>
        <Link to={`${AWARD_PATH}#status`} className="btn btn--primary">{t("Back to the award page", "पुरस्कार पानावर परत जा")}</Link>
      </div>
    </div>
  );
}
