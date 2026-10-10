import { createContext, useContext } from "react";
import { useApi } from "../hooks/useApi.js";

const SiteContext = createContext({ settings: {}, loading: true });

// Public site settings (contact, social, hero, registration window…) loaded once for the whole app.
export function SiteProvider({ children }) {
  const { data, loading } = useApi("/settings");
  return <SiteContext.Provider value={{ settings: data?.data ?? {}, loading }}>{children}</SiteContext.Provider>;
}

export const useSite = () => useContext(SiteContext);

export function useRegistrationStatus() {
  const { settings } = useSite();
  return settings.registration_status ?? { open: false, reason: "loading" };
}
