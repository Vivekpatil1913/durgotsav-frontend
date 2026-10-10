import { Link } from "react-router-dom";
import { FortArt } from "../components/forts/FortArt.jsx";
import { Seo } from "../components/seo/Seo.jsx";
import { useT } from "../context/LanguageContext.jsx";
import "./pages.css";

export default function NotFound() {
  const t = useT();
  return (
    <>
      <Seo title={t("Page Not Found", "पान सापडले नाही")} noindex />
      <section className="page-hero not-found">
        <div className="container container--narrow stack" style={{ justifyItems: "center", textAlign: "center" }}>
          <FortArt type="hill" variant={1} className="not-found__art" />
          <p className="eyebrow">404</p>
          <h1>{t("This bastion is yet to be built!", "हा बुरूज अजून बांधायचा आहे!")}</h1>
          <p>{t("The page you are looking for was not found.", "आपण शोधत असलेले पान सापडले नाही.")}</p>
          <div className="cluster" style={{ justifyContent: "center" }}>
            <Link to="/" className="btn btn--primary">{t("Home", "मुख्य पृष्ठ")}</Link>
            <Link to="/forts" className="btn btn--ghost">{t("See 12 Forts", "१२ दुर्ग पहा")}</Link>
          </div>
        </div>
      </section>
    </>
  );
}
