import { CalendarClock } from "lucide-react";
import { Link } from "react-router-dom";
import { useLang, useT } from "../../context/LanguageContext.jsx";
import { useRegistrationStatus, useSite } from "../../context/SiteContext.jsx";
import { editionDate } from "../../config/edition.js";
import { enDate, mrDate } from "../../lib/format.js";
import "../../pages/pages.css";

// Follows Admin → Settings "Registration form": open → a link to the form; closed → the admin's notice, or the dates
// before registration has begun
export function RegistrationTeaser() {
  const t = useT();
  const { lang } = useLang();
  const { settings } = useSite();
  const status = useRegistrationStatus();
  const reg = settings.registration ?? {};
  const fmt = (v) => (lang === "mr" ? mrDate(v) : enDate(v));

  // The edition's usual window is shown until settings load
  const opensAt  = fmt(reg.opens_at  || editionDate("11-05"));
  const closesAt = fmt(reg.closes_at || editionDate("11-20"));
  const closed = status.reason === "closed";

  return (
    <div className="card-light closed-notice" role="complementary">
      <CalendarClock aria-hidden="true" />
      <h2>
        {status.open
          ? t("Online registration is open", "ऑनलाइन नोंदणी सुरू आहे")
          : closed
            ? t("Registration is currently closed", "नोंदणी सध्या बंद आहे")
            : t("Online registration will begin soon", "ऑनलाइन नोंदणी लवकरच सुरू होईल")}
      </h2>
      <p>
        {status.open
          ? t(
              "Register your fort replica now: fill in the form and upload a photo of yourself with your replica.",
              "आपल्या दुर्ग प्रतिकृतीची नोंदणी आताच करा — अर्ज भरा आणि प्रतिकृतीसोबतचे आपले छायाचित्र अपलोड करा."
            )
          : closed
            ? reg.note || t("Check the Updates page for registration updates.", "नोंदणीबाबतच्या अद्यतनांसाठी अपडेट्स पान पाहा.")
            : t(
                `Online registration for Durgotsav will begin from ${opensAt} to ${closesAt}. Meanwhile, start preparing your fort and read the guidelines below.`,
                `दुर्गोत्सवासाठी ऑनलाइन नोंदणी ${opensAt} ते ${closesAt} दरम्यान सुरू होईल. तोपर्यंत दुर्गाची तयारी सुरू करा आणि खालील संहिता वाचा.`
              )}
      </p>
      <div className="cluster" style={{ justifyContent: "center" }}>
        {status.open
          ? <Link to="/participate#register" className="btn btn--primary">{t("Register now", "नोंदणी करा")}</Link>
          : <Link to="/forts" className="btn btn--primary">{t("Choose a Fort", "दुर्ग निवडा")}</Link>}
        <Link to="/certificate" className="btn btn--outline">{t("Already registered?", "आधी नोंदणी केली आहे?")}</Link>
      </div>
    </div>
  );
}
