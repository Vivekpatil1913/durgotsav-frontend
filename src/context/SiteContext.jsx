import { createContext, useContext, useEffect } from "react";
import { EDITION_YEAR } from "../config/edition.js";
import { useApi } from "../hooks/useApi.js";

const SiteContext = createContext({ settings: {}, loading: true });

// Public site settings (contact, social, hero, registration window…) loaded once for the whole app.
// Admin text saying {year} arrives already filled in by the API.
export function SiteProvider({ children }) {
  const { data, loading } = useApi("/settings");
  const settings = data?.data ?? {};
  // The website and the API must be deployed for the same edition (EDITION_YEAR in both src/config/edition.js)
  useEffect(() => {
    if (settings.edition_year && settings.edition_year !== EDITION_YEAR) {
      console.warn(`Edition year mismatch: website ${EDITION_YEAR}, API ${settings.edition_year}. Set the same EDITION_YEAR in the website, API and admin console.`);
    }
  }, [settings.edition_year]);
  return <SiteContext.Provider value={{ settings, loading }}>{children}</SiteContext.Provider>;
}

export const useSite = () => useContext(SiteContext);

export function useRegistrationStatus() {
  const { settings } = useSite();
  return settings.registration_status ?? { open: false, reason: "loading" };
}
