import { useLang, useT } from "../../context/LanguageContext.jsx";
import { enDate, mrDate } from "../../lib/format.js";

export function useAwardDates() {
  const { lang } = useLang();
  return (v, opts) => (v ? (lang === "mr" ? mrDate(v, opts) : enDate(v, opts)) : "");
}

export function StatusPill({ status }) {
  const t = useT();
  const date = useAwardDates();
  if (!status) return null;
  const text = {
    open: t(`Nominations open till ${date(status.closesAt)}`, `नामनिर्देशन ${date(status.closesAt)} पर्यंत सुरू`),
    not_started: t(`Nominations open on ${date(status.opensAt)}`, `नामनिर्देशन ${date(status.opensAt)} पासून सुरू होईल`),
    closed: t("Nominations closed", "नामनिर्देशनाची मुदत संपली"),
    disabled: t("Nominations currently closed", "नामनिर्देशन सध्या बंद"),
  }[status.reason];
  return <span className={`aw-pill aw-pill--${status.open ? "open" : "closed"}`}><span className="aw-pill__dot" aria-hidden="true" />{text}</span>;
}
