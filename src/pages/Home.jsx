import { FortsShowcase } from "../components/home/FortsShowcase.jsx";
import { DurgotsavCta } from "../components/home/DurgotsavCta.jsx";
import { Hero } from "../components/home/Hero.jsx";
import "../components/home/hero.css";
import { ImportantDates } from "../components/home/ImportantDates.jsx";
import { FestivalBanner, GalleryPreview, Mission, Story, Voices, WorldRecord } from "../components/home/HomeSections.jsx";
import { Seo } from "../components/seo/Seo.jsx";
import { useSite } from "../context/SiteContext.jsx";
import { useApi } from "../hooks/useApi.js";
import { SITE_URL } from "../lib/api.js";

export default function Home() {
  const { data } = useApi("/home");
  const { settings } = useSite();

  const home = data?.data ?? {};
  const reg = settings.registration?.opens_at ? settings.registration : null;

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        name: "AMRUT — Academy of Maharashtra Research, Upliftment and Training",
        alternateName: "महाराष्ट्र संशोधन, उन्नती व प्रशिक्षण प्रबोधिनी (अमृत)",
        url: SITE_URL,
        logo: `${SITE_URL}/brand/durgotsav-logo-512.png`,
        email: settings.contact?.email,
        telephone: settings.contact?.phone,
      },
      reg && {
        "@type": "Event",
        name: "अमृत दुर्गोत्सव २०२६",
        description: settings.seo?.default_description,
        startDate: reg.opens_at,
        endDate: reg.closes_at,
        eventAttendanceMode: "https://schema.org/OnlineEventAttendanceMode",
        eventStatus: "https://schema.org/EventScheduled",
        location: { "@type": "VirtualLocation", url: `${SITE_URL}/participate` },
        image: `${SITE_URL}/og-image.jpg`,
        organizer: { "@type": "Organization", name: "AMRUT", url: SITE_URL },
        isAccessibleForFree: true,
      },
    ].filter(Boolean),
  };

  return (
    <>
      <Seo jsonLd={jsonLd} />
      <Hero />
      <Story />
      <Mission />
      <FortsShowcase forts={home.forts} />
      <ImportantDates />
      <FestivalBanner />
      <WorldRecord />
      <Voices testimonials={home.testimonials} />
      <GalleryPreview photos={home.gallery} />
      <DurgotsavCta />
    </>
  );
}
