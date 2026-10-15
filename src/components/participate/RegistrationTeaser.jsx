import { CalendarClock } from "lucide-react";
import { Link } from "react-router-dom";
import { useLang, useT } from "../../context/LanguageContext.jsx";
import { useSite } from "../../context/SiteContext.jsx";
import { enDate, mrDate } from "../../lib/format.js";
import "../../pages/pages.css";

export function RegistrationTeaser() {
  const t = useT();
  const { lang } = useLang();
  const { settings } = useSite();
  const reg = settings.registration ?? {};
  const fmt = (v) => v ? (lang === "mr" ? mrDate(v) : enDate(v)) : null;

  const opensAt  = fmt(reg.opens_at)  ?? (lang === "mr" ? "५ नोव्हेंबर २०२६"  : "5 November 2026");
  const closesAt = fmt(reg.closes_at) ?? (lang === "mr" ? "२० नोव्हेंबर २०२६" : "20 November 2026");

  return (
    <div className="card-light closed-notice" role="complementary">
      <CalendarClock aria-hidden="true" />
      <h2>{t("Online registration will begin soon", "ऑनलाइन नोंदणी लवकरच सुरू होईल")}</h2>
      <p>
        {t(
          `Online registration for Durgotsav will begin from ${opensAt} to ${closesAt}. Meanwhile, start preparing your fort and read the guidelines below.`,
          `दुर्गोत्सवासाठी ऑनलाइन नोंदणी ${opensAt} ते ${closesAt} दरम्यान सुरू होईल. तोपर्यंत दुर्गाची तयारी सुरू करा आणि खालील संहिता वाचा.`
        )}
      </p>
      <div className="cluster" style={{ justifyContent: "center" }}>
        <Link to="/forts" className="btn btn--primary">{t("Choose a Fort", "दुर्ग निवडा")}</Link>
        <Link to="/certificate" className="btn btn--outline">{t("Already registered?", "आधी नोंदणी केली आहे?")}</Link>
      </div>
    </div>
  );
}
