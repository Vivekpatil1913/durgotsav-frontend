import { CalendarClock } from "lucide-react";
import { Link } from "react-router-dom";
import { useT } from "../../context/LanguageContext.jsx";
import { useRegistrationNotice } from "../../hooks/useRegistrationNotice.js";
import "../../pages/pages.css";

// Follows Admin → Settings "Registration form": open → a link to the form; closed → the registration dates from settings
export function RegistrationTeaser() {
  const t = useT();
  const notice = useRegistrationNotice();

  return (
    <div className="card-light closed-notice" role="complementary">
      <CalendarClock aria-hidden="true" />
      <h2>{notice.heading}</h2>
      <p>{notice.text}</p>
      {notice.note && <p>{notice.note}</p>}
      <div className="cluster" style={{ justifyContent: "center" }}>
        {notice.state === "open"
          ? <Link to="/participate#register" className="btn btn--primary">{t("Register now", "नोंदणी करा")}</Link>
          : <Link to="/forts" className="btn btn--primary">{t("Choose a Fort", "दुर्ग निवडा")}</Link>}
        <Link to="/certificate" className="btn btn--outline">{t("Already registered?", "आधी नोंदणी केली आहे?")}</Link>
      </div>
    </div>
  );
}
