import { Link, useRouteError } from "react-router-dom";
import { useT } from "../../context/LanguageContext.jsx";

export function RouteError() {
  const t = useT();
  const error = useRouteError();
  const chunkFailed = /Failed to fetch dynamically imported module|Importing a module script failed/i.test(error?.message || "");
  return (
    <div className="page-hero" style={{ minHeight: "100vh" }}>
      <div className="container container--narrow stack">
        <p className="eyebrow">{t("Error", "त्रुटी")}</p>
        <h1>{chunkFailed
          ? t("A new version of the site is available", "संकेतस्थळाची नवी आवृत्ती उपलब्ध आहे")
          : t("Something went wrong", "काहीतरी चुकले")
        }</h1>
        <p>{chunkFailed
          ? t("Please reload the page.", "कृपया पान पुन्हा लोड करा.")
          : t("There was a problem displaying this page. Please try again.", "हे पान दाखवताना अडचण आली. कृपया पुन्हा प्रयत्न करा.")
        }</p>
        <div className="cluster">
          <button type="button" className="btn btn--primary" onClick={() => window.location.reload()}>
            {t("Reload", "पुन्हा लोड करा")}
          </button>
          <Link to="/" className="btn btn--ghost">{t("Home", "मुख्य पृष्ठ")}</Link>
        </div>
      </div>
    </div>
  );
}
