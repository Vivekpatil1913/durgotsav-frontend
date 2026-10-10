import { Seo } from "../components/seo/Seo.jsx";
import { ErrorState, PageHero } from "../components/ui/PageParts.jsx";
import { useApi } from "../hooks/useApi.js";
import { mrDate } from "../lib/format.js";
import { Markdown } from "../lib/markdown.jsx";
import NotFound from "./NotFound.jsx";
import "./pages.css";

const EYEBROW = { rules: "परिशिष्ट-अ", privacy: "धोरण", terms: "अटी" };

// CMS-managed long-form pages (rules, privacy, terms).
export default function ContentPage({ slug }) {
  const { data, error, loading, reload } = useApi(`/pages/${slug}`);
  if (error?.status === 404) return <NotFound />;
  const page = data?.data;
  return (
    <>
      {page && <Seo title={page.title} description={page.meta_description} />}
      <PageHero eyebrow={EYEBROW[slug]} title={page?.title ?? "…"} />
      <section className="section surface-parchment">
        <div className="container container--narrow">
          {error && <ErrorState error={error} onRetry={reload} />}
          {loading && <div className="skeleton" style={{ height: 480 }} />}
          {page && (
            <article>
              <Markdown source={page.body} />
              <p className="muted page-updated">शेवटचे अद्यतन: {mrDate(page.updated_at)}</p>
            </article>
          )}
        </div>
      </section>
    </>
  );
}
