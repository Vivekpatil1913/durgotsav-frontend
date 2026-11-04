import { editionDate } from "../config/edition.js";
import { useLang, useT } from "../context/LanguageContext.jsx";
import { useRegistrationStatus, useSite } from "../context/SiteContext.jsx";
import { enDate, mrDate } from "../lib/format.js";

// What the website says about registration (Participation page, home and fort page card). The dates always come from
// Admin → Settings → Registration dates, never from typed text. The admin's notice is an optional extra line in which
// {opens} and {closes} stand for those dates.
//   open: the form is on   soon: closed, before the closing date   closed: closed, after the closing date
export function useRegistrationNotice() {
  const t = useT();
  const { lang } = useLang();
  const { settings } = useSite();
  const status = useRegistrationStatus();
  const reg = settings.registration ?? {};
  const fmt = (v) => (lang === "mr" ? mrDate(v) : enDate(v));
  // The edition's usual dates are shown until settings load
  const opensAt = fmt(reg.opens_at || editionDate("11-05"));
  const closesAt = fmt(reg.closes_at || editionDate("11-20"));
  const note = (reg.note ?? "").replaceAll("{opens}", opensAt).replaceAll("{closes}", closesAt).trim();

  if (status.open) {
    return {
      state: "open",
      heading: t("Online registration is open", "ऑनलाइन नोंदणी सुरू आहे"),
      text: t(
        "Register your fort replica now: fill in the form and upload a selfie with your replica or a photograph of the fort replica.",
        "आपल्या दुर्ग प्रतिकृतीची नोंदणी आताच करा — अर्ज भरा आणि प्रतिकृतीसोबतचा सेल्फी किंवा दुर्ग प्रतिकृतीचे छायाचित्र अपलोड करा."
      ),
      note: "",
    };
  }
  if (status.reason === "closed") {
    return {
      state: "closed",
      heading: t("Registration is closed", "नोंदणी बंद झाली आहे"),
      text: t(`Online registration for Durgotsav closed on ${closesAt}.`, `दुर्गोत्सवासाठी ऑनलाइन नोंदणी ${closesAt} रोजी बंद झाली.`),
      note,
    };
  }
  return {
    state: "soon",
    heading: t("Online registration will begin soon", "ऑनलाइन नोंदणी लवकरच सुरू होईल"),
    text: t(
      `Online registration for Durgotsav will begin from ${opensAt} to ${closesAt}. Meanwhile, start preparing your fort and read the guidelines below.`,
      `दुर्गोत्सवासाठी ऑनलाइन नोंदणी ${opensAt} ते ${closesAt} दरम्यान सुरू होईल. तोपर्यंत दुर्गाची तयारी सुरू करा आणि खालील संहिता वाचा.`
    ),
    note,
  };
}
