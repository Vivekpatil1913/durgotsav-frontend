// शिवदुर्ग भूषण पुरस्कार — public route of the award landing page (nomination form lives under /nominate)
export const AWARD_PATH = "/shivdurg-bhushan-puraskar-2026";

// Admin-managed text exists in Marathi (always) and English (optional): English falls back to Marathi.
export const pick = (lang, mr, en) => (lang === "en" && en ? en : mr ?? "");

// Page content per language, item by item, so a partly translated edition still renders fully
export function localContent(edition, lang) {
  const mr = edition?.content ?? {};
  if (lang !== "en") return mr;
  const en = edition?.content_en ?? {};
  const list = (k) => (en[k]?.length ? en[k] : mr[k] ?? []);
  return {
    intro: en.intro || mr.intro,
    objectives: list("objectives"),
    eligibility: list("eligibility"),
    instructions: list("instructions"),
    documents: list("documents"),
    process: list("process"),
    faqs: list("faqs"),
    help: en.help || mr.help,
  };
}

// Option lists from the API carry both labels: { value, mr, en }
export const optLabel = (lang, o) => (o ? (lang === "en" ? o.en || o.mr : o.mr) : "");
export const optFind = (lang, list, value) => optLabel(lang, list?.find((o) => o.value === value)) || value;

const DEVANAGARI = "०१२३४५६७८९";
export const digits = (lang, n) => (lang === "mr" ? String(n).replace(/\d/g, (d) => DEVANAGARI[d]) : String(n));
