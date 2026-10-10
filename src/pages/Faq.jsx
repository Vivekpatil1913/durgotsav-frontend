import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { StatsBand } from "../components/home/HomeSections.jsx";
import { Seo } from "../components/seo/Seo.jsx";
import { Accordion } from "../components/ui/Accordion.jsx";
import { EmptyState, ErrorState, PageHero } from "../components/ui/PageParts.jsx";
import { useT } from "../context/LanguageContext.jsx";
import { useApi } from "../hooks/useApi.js";
import "./pages.css";

export default function Faq() {
  const t = useT();
  const { data, error, loading, reload } = useApi("/faqs");
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const faqs = data?.data ?? [];
  const categories = [...new Set(faqs.map((f) => f.category).filter(Boolean))];
  const shown = useMemo(
    () => faqs.filter((f) => (!category || f.category === category) && (!q || `${f.question} ${f.answer}`.toLowerCase().includes(q.toLowerCase()))),
    [faqs, q, category],
  );
  const jsonLd = faqs.length && {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.question, acceptedAnswer: { "@type": "Answer", text: f.answer } })),
  };

  return (
    <>
      <Seo
        title={t("FAQ — Frequently Asked Questions", "प्रश्नोत्तरे (FAQ)")}
        description={t(
          "Durgotsav 2026 — frequently asked questions about participation, registration, photos and certificates.",
          "दुर्गोत्सव २०२६ — सहभाग, नोंदणी, छायाचित्र आणि अभिनंदन पत्राविषयी वारंवार विचारले जाणारे प्रश्न."
        )}
        jsonLd={jsonLd || undefined}
      />
      <PageHero
        eyebrow="FAQ"
        title={t("Frequently Asked Questions", "वारंवार विचारले जाणारे प्रश्न")}
        lead={t("Couldn't find an answer? Write to us from the Contact page.", "उत्तर सापडले नाही? संपर्क पानावरून आम्हाला लिहा.")}
      />
      <section className="section surface-parchment">
        <div className="container container--narrow stack">
          <div className="faq-tools">
            <label className="faq-search">
              <Search aria-hidden="true" />
              <span className="sr-only">{t("Search questions", "प्रश्न शोधा")}</span>
              <input
                className="input"
                type="search"
                placeholder={t("Search questions… (e.g. photo)", "प्रश्न शोधा… (उदा. छायाचित्र)")}
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </label>
            {categories.length > 1 && (
              <div className="cluster" role="group" aria-label={t("Topic", "विषय")}>
                <button type="button" className="chip chip--light" aria-pressed={!category} onClick={() => setCategory("")}>{t("All", "सर्व")}</button>
                {categories.map((c) => <button key={c} type="button" className="chip chip--light" aria-pressed={category === c} onClick={() => setCategory(c)}>{c}</button>)}
              </div>
            )}
          </div>
          {error && <ErrorState error={error} onRetry={reload} />}
          {loading && <div className="skeleton" style={{ height: 400 }} />}
          {!loading && shown.length === 0 && !error && (
            <EmptyState title={t("No questions found", "असा प्रश्न आढळला नाही")}>
              <Link to="/contact">{t("Ask us", "आम्हाला विचारा")}</Link>
            </EmptyState>
          )}
          {shown.length > 0 && <Accordion key={`${q}-${category}`} items={shown.map((f) => ({ key: f.id, title: f.question, body: f.answer }))} />}
        </div>
      </section>
      <StatsBand />
    </>
  );
}
