import { createContext, useContext, useEffect, useState } from "react";

const LanguageContext = createContext({ lang: "en", setLang: () => {} });

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(() => {
    try { return localStorage.getItem("durgotsav-lang") || "en"; } catch { return "en"; }
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
