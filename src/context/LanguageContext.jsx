import { createContext, useContext, useEffect, useState } from "react";

// SRS v2.1 §7: native Marathi interface. Marathi is the default; a visitor's own choice (header toggle) is remembered.
const LanguageContext = createContext({ lang: "mr", setLang: () => {} });

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(() => {
    try { return localStorage.getItem("durgotsav-lang") || "mr"; } catch { return "mr"; }
  });

  const setLang = (l) => {
    setLangState(l);
    try { localStorage.setItem("durgotsav-lang", l); } catch {}
  };

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  return (
    <LanguageContext.Provider value={{ lang, setLang }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLang = () => useContext(LanguageContext);

// t("English text", "मराठी मजकूर") returns the correct string for current language.
export function useT() {
  const { lang } = useLang();
  return (en, mr) => lang === "mr" ? mr : en;
}
