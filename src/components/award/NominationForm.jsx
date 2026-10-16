import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle, ArrowLeft, ArrowRight, Building2, Check, FileUp, Link2, Loader2, Paperclip, Plus, Send, Trash2, User,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useLang, useT } from "../../context/LanguageContext.jsx";
import { useApi } from "../../hooks/useApi.js";
import { http, toApiError } from "../../lib/api.js";
import { digits, optFind, optLabel, pick } from "../../lib/award.js";
import { CustomSelect, digitsOnly, Field } from "../participate/fields.jsx";
import "../participate/registration.css";
import { CheckGroup, ErrorText, LongText, Repeater } from "./AwardFields.jsx";
import { NominationSuccess } from "./NominationSuccess.jsx";

const LONG_MAX = 5000;
const LONG_MIN = 20;
const todayIst = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
const thisYear = () => Number(todayIst().slice(0, 4));

const newSubmissionId = () =>
  globalThis.crypto?.randomUUID?.() ??
  "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) => (c ^ (Math.random() * 16) >> (c / 4)).toString(16));

const blankOfficial = () => ({ name: "", designation: "", email: "", mobile: "", address: "" });
const blankDocument = () => ({ title: "", doc_type: "", description: "", external_url: "", file: null });

const EMPTY = () => ({
  category: "", nominator_name: "", nominator_mobile: "",
  nominee_name: "", father_or_husband_name: "", date_of_birth: "", mobile: "", email: "", address: "", district_id: "", taluka_id: "",
  org_type: "", org_type_other: "", established_on: "", established_year: "", registration_no: "", registration_date: "",
  registration_authority: "", pan: "", website_url: "", pincode: "",
  officials: [blankOfficial()],
  work_started_year: "", work_categories: [], work_category_other: "",
  activities: [], publications: [], honours: [],
  conservation_work: "", lectures_awareness: "", external_references: "",
  conservation_details: "", research_documentation: "", research_tools: [], youth_participation: "", volunteer_count: "",
  media_publicity: "", distinctive_features: "",
  documents: [],
  declaration_accepted: false, declaration_place: "", declaration_date: todayIst(), declaration_name: "",
  website: "",
});

// Which step owns a (server) error key, so a rejected submit jumps back to the right place
const STEP_PREFIXES = [
  ["category", "nominator_"],
  ["nominee_name", "father_or_husband_name", "date_of_birth", "mobile", "email", "address", "district_id", "taluka_id", "org_type",
    "established_", "registration_", "pan", "website_url", "pincode", "officials"],
  ["work_", "activities", "publications", "honours", "conservation_", "lectures_", "external_", "research_", "youth_", "volunteer_",
    "media_", "distinctive_"],
  ["documents", "doc_"],
  ["declaration_"],
];
const stepOf = (key) => STEP_PREFIXES.findIndex((prefixes) => prefixes.some((p) => key === p || key.startsWith(p)));

const MOBILE = /^[6-9]\d{9}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const URL_RE = /^https?:\/\/[^\s.]+\.[^\s]+$/i;
const PAN = /^[A-Z]{5}[0-9]{4}[A-Z]$/;

const filled = (row) => Object.entries(row).some(([k, v]) => k !== "file" ? String(v ?? "").trim() !== "" : Boolean(v));
const clean = (rows) => rows.filter(filled);

export function ageFrom(dob) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dob)) return "";
  const [y, m, d] = dob.split("-").map(Number);
  const [ty, tm, td] = todayIst().split("-").map(Number);
  const age = ty - y - (tm < m || (tm === m && td < d) ? 1 : 0);
  return age >= 0 && age < 130 ? age : "";
}

// Client-side validation, mirroring the server rules. `t(en, mr)` localises every message.
function validate(step, v, uploads, t) {
  const e = {};
  const req = (k, msg) => { if (!String(v[k] ?? "").trim()) e[k] = msg; };
  const isOrg = v.category === "organization";
  const badYear = t("Enter a valid year.", "वर्ष योग्य नाही.");
  const year = (k, min, msg) => {
    const n = Number(v[k]);
    if (!v[k]) e[k] = msg;
    else if (!Number.isInteger(n) || n < min || n > thisYear()) e[k] = badYear;
  };
  const tooLong = t(`Maximum ${LONG_MAX} characters.`, `कमाल ${LONG_MAX} अक्षरे.`);
  const long = (k, msg, required = true) => {
    const s = v[k].trim();
    if (required && s.length < LONG_MIN) e[k] = msg;
    else if (s.length > LONG_MAX) e[k] = tooLong;
  };
  const minChars = (what, whatMr) => t(`Please describe ${what} in at least ${LONG_MIN} characters.`, `${whatMr} किमान ${LONG_MIN} अक्षरांत लिहा.`);
  const mobileMsg = t("Enter a valid 10-digit mobile number (starting with 6–9).", "१० अंकी वैध मोबाईल क्रमांक लिहा (६–९ ने सुरू होणारा).");
  const emailMsg = t("Enter a valid email address.", "वैध ई-मेल लिहा.");
  const futureDate = t("The date cannot be in the future.", "दिनांक भविष्यातील आहे.");

  if (step === 0) {
    if (!v.category) e.category = t("Choose the nomination type.", "नामनिर्देशन प्रकार निवडा.");
    req("nominator_name", t("Enter the nominator's full name.", "नामनिर्देशकाचे पूर्ण नाव लिहा."));
    if (!MOBILE.test(v.nominator_mobile)) e.nominator_mobile = mobileMsg;
  }
  if (step === 1) {
    req("nominee_name", isOrg ? t("Enter the full name of the organization.", "संस्थेचे संपूर्ण नाव लिहा.") : t("Enter the full name.", "पूर्ण नाव लिहा."));
    if (!MOBILE.test(v.mobile)) e.mobile = mobileMsg;
    if (!EMAIL.test(v.email.trim())) e.email = emailMsg;
    req("address", t("Enter the address.", "पत्ता लिहा."));
    if (!v.district_id) e.district_id = t("Select the district.", "जिल्हा निवडा.");
    if (!v.taluka_id) e.taluka_id = t("Select the taluka.", "तालुका निवडा.");
    if (!isOrg) {
      req("father_or_husband_name", t("Enter the father's / husband's name.", "वडिलांचे / पतीचे नाव लिहा."));
      if (!v.date_of_birth) e.date_of_birth = t("Select the date of birth.", "जन्मतारीख निवडा.");
      else if (v.date_of_birth > todayIst() || v.date_of_birth < "1900-01-01") e.date_of_birth = t("The date of birth is not valid.", "जन्मतारीख योग्य नाही.");
    } else {
      if (!v.org_type) e.org_type = t("Select the organization type.", "संस्थेचा प्रकार निवडा.");
      if (v.org_type === "other") req("org_type_other", t("Specify the organization type.", "संस्थेचा प्रकार लिहा."));
      const yr = v.established_year || (v.established_on ? v.established_on.slice(0, 4) : "");
      if (!yr) e.established_year = t("Enter the year of establishment.", "स्थापना वर्ष लिहा.");
      else if (Number(yr) < 1800 || Number(yr) > thisYear()) e.established_year = t("The year of establishment is not valid.", "स्थापना वर्ष योग्य नाही.");
      else if (v.established_on && v.established_year && v.established_on.slice(0, 4) !== String(v.established_year)) e.established_year = t("The date and year of establishment do not match.", "स्थापना दिनांक व वर्ष जुळत नाहीत.");
      if (v.established_on > todayIst()) e.established_on = futureDate;
      if (uploads.requiresRegistration(v.org_type)) {
        req("registration_no", t("Enter the registration number.", "नोंदणी क्रमांक लिहा."));
        req("registration_date", t("Select the registration date.", "नोंदणी दिनांक निवडा."));
        req("registration_authority", t("Enter the registering authority.", "नोंदणी करणारे प्राधिकरण लिहा."));
      }
      if (v.registration_date && v.registration_date > todayIst()) e.registration_date = futureDate;
      if (v.pan && !PAN.test(v.pan)) e.pan = t("PAN is not valid (e.g. ABCDE1234F).", "PAN योग्य नाही (उदा. ABCDE1234F).");
      if (v.website_url && !URL_RE.test(v.website_url.trim())) e.website_url = t("The website must start with https://", "संकेतस्थळ https:// ने सुरू करा.");
      if (!/^[1-9]\d{5}$/.test(v.pincode)) e.pincode = t("Enter a valid 6-digit PIN code.", "६ अंकी वैध पिनकोड लिहा.");
      if (!clean(v.officials).length) e.officials = t("Add at least one authorized official.", "किमान एका अधिकृत पदाधिकाऱ्याची माहिती द्या.");
      v.officials.forEach((o, i) => {
        if (!filled(o)) return;
        if (!o.name.trim()) e[`officials.${i}.name`] = t("Enter the name.", "नाव लिहा.");
        if (!o.designation.trim()) e[`officials.${i}.designation`] = t("Enter the designation.", "पद लिहा.");
        if (!EMAIL.test(o.email.trim())) e[`officials.${i}.email`] = emailMsg;
        if (!MOBILE.test(o.mobile)) e[`officials.${i}.mobile`] = mobileMsg;
        if (!o.address.trim()) e[`officials.${i}.address`] = t("Enter the address.", "पत्ता लिहा.");
      });
    }
  }
  if (step === 2) {
    year("work_started_year", 1900, t("Enter the year the work began.", "कार्य सुरू केल्याचे वर्ष लिहा."));
    if (!isOrg && v.date_of_birth && Number(v.work_started_year) < Number(v.date_of_birth.slice(0, 4))) e.work_started_year = t("This year must be after the year of birth.", "हे वर्ष जन्मवर्षानंतरचे असावे.");
    if (!v.work_categories.length) e.work_categories = t("Select at least one work category.", "किमान एक कार्यक्षेत्र निवडा.");
    if (v.work_categories.includes("other")) req("work_category_other", t("Describe the other work.", "इतर कार्याचा तपशील लिहा."));
    if (isOrg) {
      long("conservation_details", minChars("the conservation work", "कामाचा तपशील"));
      long("distinctive_features", minChars("the distinctive features", "वैशिष्ट्ये"));
      for (const k of ["research_documentation", "youth_participation", "media_publicity"]) long(k, "", false);
      if (v.volunteer_count !== "" && !(Number.isInteger(Number(v.volunteer_count)) && Number(v.volunteer_count) >= 0)) e.volunteer_count = t("Enter a whole number.", "पूर्ण संख्या लिहा.");
    } else {
      long("conservation_work", minChars("the conservation work", "संवर्धन कार्याची माहिती"));
      for (const k of ["lectures_awareness", "external_references"]) long(k, "", false);
    }
    v.activities.forEach((a, i) => {
      if (filled(a) && !a.title.trim()) e[`activities.${i}.title`] = isOrg ? t("Enter the initiative name.", "उपक्रमाचे नाव लिहा.") : t("Enter the name of the work.", "कार्याचे नाव लिहा.");
      if (a.beneficiaries !== "" && a.beneficiaries !== undefined && !(Number(a.beneficiaries) >= 0)) e[`activities.${i}.beneficiaries`] = t("Enter a number.", "संख्या लिहा.");
    });
    for (const list of ["publications", "honours"]) {
      v[list].forEach((p, i) => {
        if (filled(p) && !p.title.trim()) e[`${list}.${i}.title`] = t("Enter the name.", "नाव लिहा.");
        if (p.year && (Number(p.year) < 1900 || Number(p.year) > thisYear())) e[`${list}.${i}.year`] = badYear;
      });
    }
  }
  if (step === 3) {
    if (v.documents.length > uploads.max_files) e.documents = t(`You can add up to ${uploads.max_files} evidence entries.`, `जास्तीत जास्त ${uploads.max_files} पुरावे जोडता येतात.`);
    v.documents.forEach((d, i) => {
      if (!filled(d)) return;
      if (!d.file && !d.external_url.trim()) e[`documents.${i}.file_field`] = t("Upload a file or give a link.", "फाइल अपलोड करा किंवा लिंक द्या.");
      if (d.external_url.trim() && !URL_RE.test(d.external_url.trim())) e[`documents.${i}.external_url`] = t("The link must start with https://", "लिंक https:// ने सुरू करा.");
      if (d.file) {
        const ext = d.file.name.split(".").pop().toLowerCase();
        const list = uploads.extensions.join(", ").toUpperCase();
        if (!uploads.extensions.includes(ext)) e[`documents.${i}.file_field`] = t(`Only ${list} files are allowed.`, `फक्त ${list} फाइल्स चालतील.`);
        else if (d.file.size > uploads.max_mb * 1024 * 1024) e[`documents.${i}.file_field`] = t(`The file must be smaller than ${uploads.max_mb} MB.`, `फाइल ${uploads.max_mb} MB पेक्षा लहान असावी.`);
      }
    });
  }
  if (step === 4) {
    if (!v.declaration_accepted) e.declaration_accepted = t("You must accept the declaration.", "घोषणापत्र मान्य करणे आवश्यक आहे.");
    req("declaration_place", t("Enter the place.", "ठिकाण लिहा."));
    req("declaration_name", t("Enter the applicant / nominator name.", "अर्जदार / नामनिर्देशकाचे नाव लिहा."));
    if (!v.declaration_date) e.declaration_date = t("Select the date.", "दिनांक निवडा.");
  }
  return e;
}

const str = (s) => (typeof s === "string" ? s.trim() : s);
const num = (s) => (s === "" || s === null || s === undefined ? undefined : Number(s));
const trimRow = (row) => Object.fromEntries(Object.entries(row).map(([k, x]) => [k, str(x)]));

function buildPayload(v, submissionId) {
  const isOrg = v.category === "organization";
  const base = {
    submission_id: submissionId, website: v.website, category: v.category,
    nominator_name: str(v.nominator_name), nominator_mobile: v.nominator_mobile,
    nominee_name: str(v.nominee_name), mobile: v.mobile, email: str(v.email), address: str(v.address),
    district_id: Number(v.district_id), taluka_id: Number(v.taluka_id),
    work_started_year: Number(v.work_started_year), work_categories: v.work_categories,
    work_category_other: v.work_categories.includes("other") ? str(v.work_category_other) : undefined,
    activities: clean(v.activities).map((a) => ({ ...trimRow(a), beneficiaries: num(a.beneficiaries) })),
    publications: clean(v.publications).map((p) => ({ ...trimRow(p), year: num(p.year) })),
    honours: clean(v.honours).map((h) => ({ ...trimRow(h), year: num(h.year) })),
    documents: [],
    declaration_accepted: v.declaration_accepted, declaration_place: str(v.declaration_place),
    declaration_date: v.declaration_date, declaration_name: str(v.declaration_name),
  };
  const files = [];
  clean(v.documents).forEach((d) => {
    const entry = { title: str(d.title), doc_type: d.doc_type || undefined, description: str(d.description), external_url: str(d.external_url) || undefined };
    if (d.file) {
      entry.file_field = `doc_${files.length}`;
      files.push([entry.file_field, d.file]);
    }
    base.documents.push(entry);
  });
  if (isOrg) {
    Object.assign(base, {
      org_type: v.org_type, org_type_other: v.org_type === "other" ? str(v.org_type_other) : undefined,
      established_on: v.established_on || undefined,
      established_year: num(v.established_year) ?? (v.established_on ? Number(v.established_on.slice(0, 4)) : undefined),
      registration_no: str(v.registration_no), registration_date: v.registration_date || undefined,
      registration_authority: str(v.registration_authority), pan: str(v.pan) || undefined, website_url: str(v.website_url) || undefined,
      pincode: v.pincode, conservation_details: str(v.conservation_details), research_documentation: str(v.research_documentation),
      research_tools: v.research_tools, youth_participation: str(v.youth_participation), volunteer_count: num(v.volunteer_count),
      media_publicity: str(v.media_publicity), distinctive_features: str(v.distinctive_features),
      officials: clean(v.officials).map(trimRow),
    });
  } else {
    Object.assign(base, {
      father_or_husband_name: str(v.father_or_husband_name), date_of_birth: v.date_of_birth,
      conservation_work: str(v.conservation_work), lectures_awareness: str(v.lectures_awareness), external_references: str(v.external_references),
    });
  }
  return { payload: base, files };
}

const fmtSize = (b) => (b > 1024 * 1024 ? `${(b / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`);

export function NominationForm({ award, initialCategory }) {
  const t = useT();
  const { lang } = useLang();
  const { options, uploads: up, edition } = award;
  const districts = useApi("/districts").data?.data ?? [];
  const talukas = useApi("/talukas").data?.data ?? [];
  const [values, setValues] = useState(() => ({ ...EMPTY(), category: ["individual", "organization"].includes(initialCategory) ? initialCategory : "" }));
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [progress, setProgress] = useState(null);
  const [result, setResult] = useState(null);
  const submissionId = useRef(newSubmissionId());
  const topRef = useRef(null);
  const isOrg = values.category === "organization";
  const n = (x) => digits(lang, x);
  const placeName = (row) => (row ? (lang === "en" ? row.name_en || row.name_mr : row.name_mr) : "");

  const uploads = useMemo(() => ({
    ...up,
    requiresRegistration: (type) => options.org_types_requiring_registration.includes(type),
  }), [up, options]);

  // Error messages follow the language switch: re-validate the visible step when the language changes
  useEffect(() => {
    setErrors((er) => (Object.keys(er).length ? validate(step, values, uploads, t) : er));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  // Warn before leaving with unsent data
  const dirty = !result && (values.nominator_name || values.nominee_name);
  useEffect(() => {
    if (!dirty) return undefined;
    const onBefore = (e) => { e.preventDefault(); e.returnValue = ""; };
    window.addEventListener("beforeunload", onBefore);
    return () => window.removeEventListener("beforeunload", onBefore);
  }, [dirty]);

  const STEPS = [
    t("Type & nominator", "प्रकार व नामनिर्देशक"),
    isOrg ? t("Organization details", "संस्थेची माहिती") : t("Personal details", "वैयक्तिक माहिती"),
    t("Work details", "कार्याची माहिती"),
    t("Evidence & links", "पुरावे व लिंक्स"),
    t("Review & declaration", "पुनरावलोकन व घोषणा"),
  ];

  const update = (patch) => {
    setValues((v) => ({ ...v, ...patch }));
    setErrors((er) => {
      const next = { ...er };
      Object.keys(patch).forEach((k) => Object.keys(next).forEach((ek) => (ek === k || ek.startsWith(`${k}.`)) && delete next[ek]));
      return next;
    });
  };
  const set = (name, transform) => (e) => {
    const raw = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    update({ [name]: transform ? transform(raw) : raw });
  };
  const fieldProps = (name) => ({ error: errors[name] });

  const scrollTop = () => topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  const focusFirstError = (errs) => requestAnimationFrame(() => {
    const key = Object.keys(errs)[0];
    const el = document.querySelector(`[data-field="${CSS.escape(key)}"]`) ?? document.querySelector(`[data-field="${CSS.escape(key.split(".")[0])}"]`);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
    el?.querySelector("input, select, textarea, button")?.focus({ preventScroll: true });
  });

  function next() {
    const errs = validate(step, values, uploads, t);
    setErrors(errs);
    if (Object.keys(errs).length) return focusFirstError(errs);
    setStep((s) => s + 1);
    scrollTop();
  }
  function back() {
    setErrors({});
    setStep((s) => s - 1);
    scrollTop();
  }

  async function submit(e) {
    e.preventDefault();
    if (progress !== null) return; // already sending (double click / Enter)
    if (step < 4) return next();
    for (let s = 0; s <= 4; s++) {
      const errs = validate(s, values, uploads, t);
      if (Object.keys(errs).length) {
        setErrors(errs);
        setStep(s);
        return focusFirstError(errs);
      }
    }
    const { payload, files } = buildPayload(values, submissionId.current);
    const body = new FormData();
    body.append("payload", JSON.stringify(payload));
    files.forEach(([field, file]) => body.append(field, file, file.name));

    setFormError("");
    setProgress(0);
    try {
      const { data } = await http.post("/shivdurg-award/nominations", body, {
        timeout: 300000,
        onUploadProgress: (p) => p.total && setProgress(Math.round((p.loaded / p.total) * 100)),
      });
      setResult(data.data);
      scrollTop();
    } catch (err) {
      const apiErr = toApiError(err);
      // Field errors: prefer our own localised message for the same field; the server text is Marathi
      const local = Object.assign({}, ...[0, 1, 2, 3, 4].map((s) => validate(s, values, uploads, t)));
      const mapped = {};
      for (const [k, m] of Object.entries(apiErr.details || {})) {
        const doc = /^doc_(\d+)$/.exec(k);
        const key = doc ? `documents.${payload.documents.findIndex((d) => d.file_field === k)}.file_field` : k;
        mapped[key] = local[key] ?? (lang === "en" ? t("Please check this field.", "") : m);
      }
      const firstStep = Math.min(...Object.keys(mapped).map(stepOf).filter((s) => s >= 0));
      if (Number.isFinite(firstStep)) {
        setErrors(mapped);
        setStep(firstStep);
        focusFirstError(mapped);
      }
      const byCode = {
        NOMINATIONS_CLOSED: t("Nominations are not being accepted at the moment.", "नामनिर्देशन सध्या स्वीकारले जात नाही."),
        RATE_LIMITED: t("Too many nominations from this network. Please try again later.", "या नेटवर्कवरून खूप अर्ज आले आहेत. कृपया काही वेळाने पुन्हा प्रयत्न करा."),
      };
      setFormError(byCode[apiErr.code]
        ?? (Object.keys(mapped).length ? t("Please correct the highlighted fields.", "कृपया चिन्हांकित माहिती दुरुस्त करा.") : null)
        ?? (lang === "mr" ? apiErr.message || null : null)
        ?? t("Could not submit the application. Please try again.", "अर्ज सादर करताना अडचण आली. कृपया पुन्हा प्रयत्न करा."));
      scrollTop();
    } finally {
      setProgress(null);
    }
  }

  if (result) return <NominationSuccess result={result} edition={edition} values={values} options={options} />;

  const workOptions = isOrg ? options.organization_work : options.individual_work;
  const districtName = (id) => placeName(districts.find((d) => String(d.id) === String(id)));
  const talukaName = (id) => placeName(talukas.find((tk) => String(tk.id) === String(id)));
  const filteredTalukas = talukas.filter((tk) => String(tk.district_id) === String(values.district_id));
  const duration = values.work_started_year && Number(values.work_started_year) <= thisYear() && Number(values.work_started_year) >= 1900
    ? thisYear() - Number(values.work_started_year) : null;
  const age = ageFrom(values.date_of_birth);
  const needsReg = uploads.requiresRegistration(values.org_type);
  const years = (x) => t(`${x} years`, `${n(x)} वर्षे`);
  const title = pick(lang, edition.title, edition.title_en);

  const input = (name, { type = "text", max = 160, transform, ...rest } = {}) => (p) => (
    <input {...p} className="input" type={type} value={values[name]} onChange={set(name, transform)} maxLength={type === "date" || type === "number" ? undefined : max} {...rest} />
  );
  const long = (name, { required, rows = 5 } = {}) => (p) => (
    <LongText {...p} value={values[name]} onChange={set(name)} max={LONG_MAX} min={required ? LONG_MIN : undefined} rows={rows} />
  );
  const selectOptions = (list) => list.map((o) => ({ value: o.value, label: optLabel(lang, o) }));

  return (
    <form className="reg-form card-light aw-form" onSubmit={submit} noValidate ref={topRef} aria-labelledby="aw-form-title">
      <div className="reg-form__head">
        <h2 id="aw-form-title">{title} — {t("Nomination form", "नामनिर्देशन अर्ज")}</h2>
        <ol className="stepper aw-stepper" aria-label={t("Form steps", "अर्जाचे टप्पे")}>
          {STEPS.map((s, i) => (
            <li key={i} className={i === step ? "is-current" : i < step ? "is-done" : ""} aria-current={i === step ? "step" : undefined}>
              <span className="stepper__dot">{i < step ? <Check size={14} aria-hidden="true" /> : n(i + 1)}</span>
              <span className="stepper__label">{s}</span>
            </li>
          ))}
        </ol>
        <p className="aw-form__required"><span className="req" aria-hidden="true">*</span> {t("Fields marked * are required.", "चिन्हांकित माहिती भरणे अनिवार्य आहे.")}</p>
      </div>

      {formError && <div className="alert alert--error" role="alert"><AlertCircle aria-hidden="true" /><span>{formError}</span></div>}
      <input type="text" name="website" value={values.website} onChange={set("website")} tabIndex={-1} autoComplete="off" className="sr-only" aria-hidden="true" />

      <AnimatePresence mode="wait" initial={false}>
        <motion.div key={step} className="reg-form__step"
          initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}>

          {step === 0 && (
            <div className="stack">
              <fieldset className="aw-type" data-field="category">
                <legend className="field__label">{t("Nomination type", "नामनिर्देशन प्रकार")}<span className="req" aria-hidden="true">*</span></legend>
                <div className="aw-type__options">
                  {[["individual", User, t("Nominate an Individual", "व्यक्ती नामनिर्देशन"), t("For a person working for forts", "गडदुर्गांसाठी कार्य करणाऱ्या व्यक्तीसाठी"), pick(lang, edition.prize_individual, edition.prize_individual_en)],
                    ["organization", Building2, t("Nominate an Organization", "संस्था नामनिर्देशन"), t("For an organisation, trust or group", "संस्था, न्यास किंवा गटासाठी"), pick(lang, edition.prize_organization, edition.prize_organization_en)]].map(([value, Icon, label, desc, prize]) => (
                    <label key={value} className={`aw-type__card ${values.category === value ? "is-checked" : ""}`}>
                      <input type="radio" name="category" value={value} checked={values.category === value}
                        onChange={() => update({ category: value, work_categories: [] })} aria-invalid={errors.category ? true : undefined} />
                      <Icon aria-hidden="true" />
                      <strong>{label}</strong>
                      <span>{desc}</span>
                      <small>{prize}</small>
                    </label>
                  ))}
                </div>
                <ErrorText>{errors.category}</ErrorText>
              </fieldset>
              <div className="form-grid form-grid--2">
                <div data-field="nominator_name">
                  <Field label={t("Nominator's full name", "नामनिर्देशकाचे पूर्ण नाव")} required {...fieldProps("nominator_name")}>
                    {input("nominator_name", { autoComplete: "name" })}
                  </Field>
                </div>
                <div data-field="nominator_mobile">
                  <Field label={t("Contact number", "संपर्क क्रमांक")} required hint={t("10-digit mobile number", "१० अंकी मोबाईल क्रमांक")} {...fieldProps("nominator_mobile")}>
                    {input("nominator_mobile", { type: "tel", inputMode: "numeric", autoComplete: "tel-national", transform: (x) => digitsOnly(x, 10) })}
                  </Field>
                </div>
              </div>
              <p className="aw-note">{t(
                "The nominator's details are kept separate from the nominee's details. If you are nominating yourself, enter your own details.",
                "नामनिर्देशकाची माहिती नामनिर्देशिताच्या माहितीपासून स्वतंत्र ठेवली जाते. स्वतःचे नामनिर्देशन करत असल्यास स्वतःचीच माहिती भरा.",
              )}</p>
            </div>
          )}

          {step === 1 && (
            <div className="stack">
              <div className="form-grid form-grid--2">
                <div className="span-2" data-field="nominee_name">
                  <Field label={isOrg ? t("Full name of the organization", "संस्थेचे संपूर्ण नाव") : t("Full name", "पूर्ण नाव")} required {...fieldProps("nominee_name")}>
                    {input("nominee_name", { max: 250, autoComplete: isOrg ? "organization" : "off" })}
                  </Field>
                </div>

                {!isOrg && (<>
                  <div className="span-2" data-field="father_or_husband_name">
                    <Field label={t("Father's / husband's name", "वडिलांचे / पतीचे नाव")} required {...fieldProps("father_or_husband_name")}>
                      {input("father_or_husband_name")}
                    </Field>
                  </div>
                  <div data-field="date_of_birth">
                    <Field label={t("Date of birth", "जन्मतारीख")} required {...fieldProps("date_of_birth")}>
                      {input("date_of_birth", { type: "date", max: todayIst(), min: "1900-01-01" })}
                    </Field>
                  </div>
                  <div>
                    <Field label={t("Age", "वय")} hint={t("Calculated automatically from the date of birth", "जन्मतारखेवरून आपोआप मोजले जाते")}>
                      {(p) => <input {...p} className="input aw-readonly" value={age === "" ? "" : years(age)} readOnly tabIndex={-1} />}
                    </Field>
                  </div>
                </>)}

                {isOrg && (<>
                  <div data-field="org_type">
                    <Field label={t("Type of organization", "संस्थेचा प्रकार")} required {...fieldProps("org_type")}>
                      {(p) => <CustomSelect {...p} value={values.org_type} placeholder={t("Select type", "प्रकार निवडा")} options={selectOptions(options.org_types)}
                        onValueChange={(val) => update({ org_type: val })} />}
                    </Field>
                  </div>
                  {values.org_type === "other" ? (
                    <div data-field="org_type_other">
                      <Field label={t("Specify the type", "इतर प्रकार")} required {...fieldProps("org_type_other")}>{input("org_type_other")}</Field>
                    </div>
                  ) : <span className="aw-grid-gap" />}
                  <div data-field="established_on">
                    <Field label={t("Date of establishment", "स्थापना दिनांक")} hint={t("If the exact date is not known, enter only the year", "माहीत नसल्यास फक्त वर्ष लिहा")} {...fieldProps("established_on")}>
                      {(p) => <input {...p} className="input" type="date" max={todayIst()} min="1800-01-01" value={values.established_on}
                        onChange={(e) => update({ established_on: e.target.value, ...(e.target.value && { established_year: e.target.value.slice(0, 4) }) })} />}
                    </Field>
                  </div>
                  <div data-field="established_year">
                    <Field label={t("Year of establishment", "स्थापना वर्ष")} required {...fieldProps("established_year")}>
                      {input("established_year", { type: "number", inputMode: "numeric", min: 1800, max: thisYear() })}
                    </Field>
                  </div>
                  <div className="span-2 aw-subhead">
                    <strong>{t("Registration details", "नोंदणी तपशील")}</strong>
                    <span>{needsReg
                      ? t("Registration details are required for the selected type of organization.", "निवडलेल्या संस्था प्रकारासाठी नोंदणी तपशील आवश्यक आहे.")
                      : t("Fill in if applicable (optional for voluntary / other organizations).", "लागू असल्यास भरा (स्वयंसेवी / इतर संस्थांसाठी ऐच्छिक).")}</span>
                  </div>
                  <div data-field="registration_no">
                    <Field label={t("Registration number", "संस्था नोंदणी क्रमांक")} required={needsReg} {...fieldProps("registration_no")}>{input("registration_no", { max: 120 })}</Field>
                  </div>
                  <div data-field="registration_date">
                    <Field label={t("Registration date", "नोंदणी दिनांक")} required={needsReg} {...fieldProps("registration_date")}>
                      {input("registration_date", { type: "date", max: todayIst(), min: "1800-01-01" })}
                    </Field>
                  </div>
                  <div className="span-2" data-field="registration_authority">
                    <Field label={t("Registering authority", "नोंदणी करणारे प्राधिकरण")} required={needsReg} {...fieldProps("registration_authority")}>{input("registration_authority", { max: 200 })}</Field>
                  </div>
                  <div data-field="pan">
                    <Field label={t("PAN number", "PAN क्रमांक")} hint={t("Optional · e.g. ABCDE1234F", "ऐच्छिक · उदा. ABCDE1234F")} {...fieldProps("pan")}>
                      {input("pan", { max: 10, autoCapitalize: "characters", transform: (x) => x.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10) })}
                    </Field>
                  </div>
                  <div data-field="website_url">
                    <Field label={t("Official website", "अधिकृत संकेतस्थळ")} hint={t("Optional · starts with https://", "ऐच्छिक · https:// ने सुरू")} {...fieldProps("website_url")}>
                      {input("website_url", { type: "url", max: 500, inputMode: "url", placeholder: "https://" })}
                    </Field>
                  </div>
                </>)}

                <div data-field="mobile">
                  <Field label={isOrg ? t("Phone / mobile number", "दूरध्वनी / मोबाईल क्रमांक") : t("Mobile number", "मोबाईल क्रमांक")} required {...fieldProps("mobile")}>
                    {input("mobile", { type: "tel", inputMode: "numeric", transform: (x) => digitsOnly(x, 10) })}
                  </Field>
                </div>
                <div data-field="email">
                  <Field label={t("Email", "ई-मेल")} required {...fieldProps("email")}>{input("email", { type: "email", inputMode: "email", autoComplete: "email" })}</Field>
                </div>
                <div className="span-2" data-field="address">
                  <Field label={isOrg ? t("Full address of the head office", "मुख्य कार्यालयाचा संपूर्ण पत्ता") : t("Full postal address", "संपूर्ण पत्रव्यवहाराचा पत्ता")} required {...fieldProps("address")}>
                    {(p) => <textarea {...p} className="textarea" rows={3} value={values.address} onChange={set("address")} maxLength={1000} />}
                  </Field>
                </div>
                <div data-field="district_id">
                  <Field label={t("District", "जिल्हा")} required {...fieldProps("district_id")}>
                    {(p) => <CustomSelect {...p} value={values.district_id} placeholder={t("Select district", "जिल्हा निवडा")} options={districts.map((d) => ({ value: d.id, label: placeName(d) }))}
                      onValueChange={(id) => update({ district_id: id, taluka_id: "" })} />}
                  </Field>
                </div>
                <div data-field="taluka_id">
                  <Field label={t("Taluka", "तालुका")} required {...fieldProps("taluka_id")}>
                    {(p) => <CustomSelect {...p} value={values.taluka_id} placeholder={values.district_id ? t("Select taluka", "तालुका निवडा") : t("Select the district first", "आधी जिल्हा निवडा")} disabled={!values.district_id}
                      options={filteredTalukas.map((tk) => ({ value: tk.id, label: placeName(tk) }))} onValueChange={(id) => update({ taluka_id: id })} />}
                  </Field>
                </div>
                {isOrg && (
                  <div data-field="pincode">
                    <Field label={t("PIN code", "पिनकोड")} required {...fieldProps("pincode")}>
                      {input("pincode", { inputMode: "numeric", transform: (x) => digitsOnly(x, 6) })}
                    </Field>
                  </div>
                )}
              </div>

              {isOrg && (
                <Repeater name="officials" title={t("Authorized officials", "अधिकृत पदाधिकारी")} min={1} max={10}
                  hint={t("Authorized contact persons on behalf of the organization. At least one is required.", "संस्थेच्या वतीने संपर्कासाठी अधिकृत व्यक्ती. किमान एक आवश्यक.")}
                  rows={values.officials} onChange={(rows) => update({ officials: rows })} errors={errors} blank={blankOfficial()}
                  columns={[
                    { key: "name", label: t("Name", "नाव"), required: true, max: 160 },
                    { key: "designation", label: t("Designation", "पद"), required: true, max: 160 },
                    { key: "email", label: t("Email", "ई-मेल"), type: "email", required: true, max: 160 },
                    { key: "mobile", label: t("Mobile number", "मोबाईल क्रमांक"), type: "tel", required: true },
                    { key: "address", label: t("Postal address", "पत्रव्यवहाराचा पत्ता"), type: "textarea", required: true, max: 1000 },
                  ]} />
              )}
            </div>
          )}

          {step === 2 && (
            <div className="stack">
              <div className="form-grid form-grid--2">
                <div data-field="work_started_year">
                  <Field label={t("Year fort-related work began", "गड-दुर्ग विषयक कार्य सुरू केल्याचे वर्ष")} required {...fieldProps("work_started_year")}>
                    {input("work_started_year", { type: "number", inputMode: "numeric", min: 1900, max: thisYear() })}
                  </Field>
                </div>
                <div>
                  <Field label={t("Total duration of work", "एकूण कार्याचा कालावधी")} hint={t("Calculated automatically from the year", "वर्षावरून आपोआप मोजले जाते")}>
                    {(p) => <input {...p} className="input aw-readonly" value={duration === null ? "" : duration === 0 ? t("Less than a year", "१ वर्षापेक्षा कमी") : years(duration)} readOnly tabIndex={-1} />}
                  </Field>
                </div>
              </div>
              <CheckGroup name="work_categories" legend={isOrg ? t("Types of work performed", "केलेल्या कार्याचे प्रकार") : t("Work categories", "कार्यक्षेत्र")} required
                hint={t("Select one or more", "एक किंवा अधिक निवडा")} options={workOptions} value={values.work_categories}
                onChange={(list) => update({ work_categories: list })} error={errors.work_categories} />
              {values.work_categories.includes("other") && (
                <div data-field="work_category_other">
                  <Field label={t("Describe the other work", "इतर कार्याचा तपशील")} required {...fieldProps("work_category_other")}>{input("work_category_other", { max: 300 })}</Field>
                </div>
              )}

              {isOrg ? (<>
                <div data-field="conservation_details">
                  <Field label={t("Details of work done for fort conservation and protection", "गड-दुर्ग संवर्धन आणि संरक्षणासाठी केलेल्या कामाचा तपशील")} required {...fieldProps("conservation_details")}>
                    {long("conservation_details", { required: true, rows: 6 })}
                  </Field>
                </div>
                <Repeater name="activities" title={t("Major initiatives", "प्रमुख उपक्रम")} empty={t("No initiatives added yet.", "अद्याप उपक्रम जोडलेले नाहीत.")} max={20}
                  rows={values.activities} onChange={(rows) => update({ activities: rows })} errors={errors}
                  blank={{ title: "", period: "", details: "", beneficiaries: "" }}
                  columns={[
                    { key: "title", label: t("Name of the initiative", "उपक्रमाचे नाव"), required: true },
                    { key: "period", label: t("Date / period", "दिनांक / कालावधी"), max: 120 },
                    { key: "beneficiaries", label: t("Number of beneficiaries", "लाभार्थी संख्या"), type: "number" },
                    { key: "details", label: t("Brief details", "संक्षिप्त तपशील"), type: "textarea" },
                  ]} />
                <div data-field="research_documentation">
                  <Field label={t("Research and historical documentation", "संशोधन आणि ऐतिहासिक दस्तऐवजीकरण")} {...fieldProps("research_documentation")}>
                    {long("research_documentation")}
                  </Field>
                </div>
                <CheckGroup name="research_tools" legend={t("Available research resources / documentation types", "उपलब्ध संशोधन साधने / दस्तऐवजीकरण प्रकार")}
                  options={options.research_tools} value={values.research_tools} onChange={(list) => update({ research_tools: list })} error={errors.research_tools} />
                <div className="form-grid form-grid--2">
                  <div className="span-2" data-field="youth_participation">
                    <Field label={t("Participation of youth and volunteers", "युवक आणि स्वयंसेवकांचा सहभाग")} {...fieldProps("youth_participation")}>
                      {long("youth_participation", { rows: 4 })}
                    </Field>
                  </div>
                  <div data-field="volunteer_count">
                    <Field label={t("Number of volunteers", "स्वयंसेवक संख्या")} {...fieldProps("volunteer_count")}>
                      {input("volunteer_count", { type: "number", inputMode: "numeric", min: 0 })}
                    </Field>
                  </div>
                </div>
                <div data-field="media_publicity">
                  <Field label={t("Writing, publications and media coverage", "लेखन, प्रकाशन आणि माध्यमांतील प्रसिद्धी")} {...fieldProps("media_publicity")}>
                    {long("media_publicity", { rows: 4 })}
                  </Field>
                </div>
              </>) : (<>
                <Repeater name="activities" title={t("Notable works", "उल्लेखनीय कार्यांची माहिती")} empty={t("No work added yet.", "अद्याप कार्य जोडलेले नाही.")} max={20}
                  hint={t("Mention the related fort(s) and the type of work.", "संबंधित गड / किल्ले व कार्याचा प्रकार नमूद करा.")}
                  rows={values.activities} onChange={(rows) => update({ activities: rows })} errors={errors}
                  blank={{ title: "", fort_name: "", work_type: "", period: "", details: "" }}
                  columns={[
                    { key: "title", label: t("Name of the work", "कार्याचे नाव"), required: true },
                    { key: "fort_name", label: t("Related fort(s)", "संबंधित गड / किल्ले") },
                    { key: "work_type", label: t("Type of work", "कार्याचा प्रकार") },
                    { key: "period", label: t("Period / year", "कालावधी / वर्ष"), max: 120 },
                    { key: "details", label: t("Brief details", "थोडक्यात तपशील"), type: "textarea" },
                  ]} />
                <div data-field="conservation_work">
                  <Field label={t("Information about work done for fort conservation", "गड-दुर्ग संवर्धनासाठी केलेल्या कार्याची माहिती")} required {...fieldProps("conservation_work")}>
                    {long("conservation_work", { required: true, rows: 6 })}
                  </Field>
                </div>
                <div data-field="lectures_awareness">
                  <Field label={t("Lectures, awareness, training and guidance", "व्याख्याने, जनजागृती, प्रशिक्षण आणि मार्गदर्शन")} {...fieldProps("lectures_awareness")}>
                    {long("lectures_awareness", { rows: 4 })}
                  </Field>
                </div>
              </>)}

              <Repeater name="publications" title={t("Research, writing and publications", "संशोधन, लेखन आणि प्रकाशनाची माहिती")} empty={t("Optional — add if applicable.", "ऐच्छिक — लागू असल्यास जोडा.")} max={20}
                rows={values.publications} onChange={(rows) => update({ publications: rows })} errors={errors}
                blank={{ title: "", pub_type: "", publisher: "", year: "", details: "" }}
                columns={[
                  { key: "title", label: t("Title of book / article / report", "पुस्तक / लेख / अहवालाचे नाव"), required: true, max: 300 },
                  { key: "pub_type", label: t("Type (book, article, paper…)", "प्रकार (पुस्तक, लेख, शोधनिबंध…)"), max: 120 },
                  { key: "publisher", label: t("Publisher / medium", "प्रकाशक / माध्यम") },
                  { key: "year", label: t("Year", "वर्ष"), type: "number" },
                  { key: "details", label: t("Details", "तपशील"), type: "textarea" },
                ]} />
              <Repeater name="honours" title={t("Awards, honours and certificates received", "प्राप्त पुरस्कार, सन्मान आणि प्रमाणपत्रे")} empty={t("Optional — add if applicable.", "ऐच्छिक — लागू असल्यास जोडा.")} max={20}
                rows={values.honours} onChange={(rows) => update({ honours: rows })} errors={errors}
                blank={{ title: "", awarded_by: "", year: "", details: "" }}
                columns={[
                  { key: "title", label: t("Name of award / honour", "पुरस्काराचे / सन्मानाचे नाव"), required: true, max: 300 },
                  { key: "awarded_by", label: t("Awarded by", "प्रदान करणारी संस्था") },
                  { key: "year", label: t("Year", "वर्ष"), type: "number" },
                  { key: "details", label: t("Details", "तपशील"), type: "textarea" },
                ]} />

              {isOrg ? (
                <div data-field="distinctive_features">
                  <Field label={t("Distinctive features of the organization's work", "संस्थेच्या कार्याची वैशिष्ट्ये")} required {...fieldProps("distinctive_features")}>
                    {long("distinctive_features", { required: true })}
                  </Field>
                </div>
              ) : (
                <div data-field="external_references">
                  <Field label={t("External references for the work (articles, websites, media)", "गड-दुर्ग क्षेत्रातील कार्याचे बाह्य संदर्भ")}
                    hint={t("Articles, websites, media mentions. Links can also be added as evidence in the next step.", "लेख, संकेतस्थळे, माध्यमांतील उल्लेख. लिंक्स पुढील टप्प्यात पुरावा म्हणूनही जोडता येतील.")} {...fieldProps("external_references")}>
                    {long("external_references", { rows: 4 })}
                  </Field>
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="stack">
              <div className="aw-upload-rules">
                <Paperclip aria-hidden="true" />
                <p>
                  {t("Add evidence of the work: upload a file, give a link, or both.", "कार्याचे पुरावे जोडा: फाइल अपलोड करा, लिंक द्या किंवा दोन्ही.")}<br />
                  {t(
                    `Allowed: ${uploads.extensions.map((x) => x.toUpperCase()).join(", ")} · max ${uploads.max_mb} MB per file · up to ${uploads.max_files} entries. For long videos, give a YouTube / Drive link.`,
                    `स्वीकृत: ${uploads.extensions.map((x) => x.toUpperCase()).join(", ")} · प्रत्येक फाइल कमाल ${uploads.max_mb} MB · जास्तीत जास्त ${uploads.max_files} नोंदी. मोठ्या चित्रफितींसाठी YouTube / Drive लिंक द्या.`,
                  )}
                </p>
              </div>
              {errors.documents && <ErrorText>{errors.documents}</ErrorText>}
              {values.documents.length === 0 && <p className="aw-repeater__empty">{t("No evidence added yet (optional, but recommended).", "अद्याप पुरावा जोडलेला नाही (ऐच्छिक, परंतु शिफारसीय).")}</p>}
              <ol className="aw-repeater__list">
                {values.documents.map((d, i) => {
                  const setDoc = (patch) => update({ documents: values.documents.map((x, j) => (j === i ? { ...x, ...patch } : x)) });
                  const fileErr = errors[`documents.${i}.file_field`];
                  return (
                    <li key={i} className="aw-repeater__row aw-doc" data-field={`documents.${i}.file_field`}>
                      <div className="aw-repeater__row-head">
                        <span className="aw-repeater__no">{n(i + 1)}</span>
                        <button type="button" className="btn btn--outline btn--sm" onClick={() => update({ documents: values.documents.filter((_, j) => j !== i) })}
                          aria-label={t(`Remove evidence ${i + 1}`, `पुरावा ${n(i + 1)} काढा`)}><Trash2 aria-hidden="true" /> {t("Remove", "काढा")}</button>
                      </div>
                      <div className="form-grid form-grid--2">
                        <Field label={t("Document title", "दस्तऐवजाचे शीर्षक")}>{(p) => <input {...p} className="input" value={d.title} maxLength={250} onChange={(e) => setDoc({ title: e.target.value })} />}</Field>
                        <Field label={t("Document type", "दस्तऐवजाचा प्रकार")}>
                          {(p) => <CustomSelect {...p} value={d.doc_type} placeholder={t("Select type", "प्रकार निवडा")} options={selectOptions(options.document_types)}
                            onValueChange={(val) => setDoc({ doc_type: val })} />}
                        </Field>
                        <div className="span-2">
                          <Field label={t("Description", "वर्णन")}>{(p) => <textarea {...p} className="textarea" rows={2} maxLength={1000} value={d.description} onChange={(e) => setDoc({ description: e.target.value })} />}</Field>
                        </div>
                        <div className="aw-file">
                          <span className="field__label">{t("File", "फाइल")}</span>
                          {d.file ? (
                            <div className="aw-file__chosen">
                              <FileUp aria-hidden="true" />
                              <span><strong>{d.file.name}</strong><small>{fmtSize(d.file.size)}</small></span>
                              <button type="button" className="btn btn--outline btn--sm" onClick={() => setDoc({ file: null })} aria-label={t("Remove file", "फाइल काढा")}><Trash2 aria-hidden="true" /></button>
                            </div>
                          ) : (
                            <label className={`aw-file__pick ${fileErr ? "has-error" : ""}`}>
                              <FileUp aria-hidden="true" /> {t("Choose file", "फाइल निवडा")}
                              <input type="file" className="sr-only" accept={uploads.extensions.map((x) => `.${x}`).join(",")}
                                onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) setDoc({ file: f }); }} />
                            </label>
                          )}
                        </div>
                        <div data-field={`documents.${i}.external_url`}>
                          <Field label={<span className="aw-label-icon"><Link2 size={14} aria-hidden="true" /> {t("External link (URL)", "बाह्य लिंक")}</span>} error={errors[`documents.${i}.external_url`]}>
                            {(p) => <input {...p} className="input" type="url" inputMode="url" placeholder="https://" maxLength={1000} value={d.external_url} onChange={(e) => setDoc({ external_url: e.target.value })} />}
                          </Field>
                        </div>
                      </div>
                      <ErrorText>{fileErr}</ErrorText>
                    </li>
                  );
                })}
              </ol>
              {values.documents.length < uploads.max_files && (
                <button type="button" className="btn btn--outline aw-repeater__add" onClick={() => update({ documents: [...values.documents, blankDocument()] })}>
                  <Plus aria-hidden="true" /> {t("Add evidence", "पुरावा जोडा")}
                </button>
              )}
            </div>
          )}

          {step === 4 && (
            <div className="stack">
              <Review values={values} options={options} districtName={districtName} talukaName={talukaName} age={age} duration={duration} years={years}
                onEdit={(s) => { setStep(s); scrollTop(); }} />
              <section className="aw-declaration">
                <h3>{t("Declaration", "घोषणापत्र")}</h3>
                <div data-field="declaration_accepted">
                  <label className="checkbox">
                    <input type="checkbox" checked={values.declaration_accepted} onChange={set("declaration_accepted")} aria-invalid={errors.declaration_accepted ? true : undefined} />
                    <span>{t(
                      "I declare that the information given in this application is true and accurate to the best of my knowledge. I agree to make the information/documents submitted available for verification if required. The decision of AMRUT / the committee regarding the selection process for the award will be final.",
                      "मी अर्जामध्ये नमूद केलेली माहिती माझ्या माहितीनुसार सत्य व अचूक आहे. सादर केलेली माहिती/कागदपत्रे आवश्यक असल्यास तपासणीसाठी उपलब्ध करून देण्यास माझी मान्यता आहे. पुरस्कारासाठी निवड प्रक्रियेसंदर्भात अमृत संस्थेचा/समितीचा निर्णय अंतिम राहील.",
                    )}</span>
                  </label>
                  <ErrorText>{errors.declaration_accepted}</ErrorText>
                </div>
                <div className="form-grid form-grid--2">
                  <div data-field="declaration_place">
                    <Field label={t("Place", "ठिकाण")} required {...fieldProps("declaration_place")}>{input("declaration_place", { max: 120 })}</Field>
                  </div>
                  <div data-field="declaration_date">
                    <Field label={t("Date", "दिनांक")} required hint={t("Today's date", "आजचा दिनांक")} {...fieldProps("declaration_date")}>
                      {(p) => <input {...p} className="input aw-readonly" type="date" value={values.declaration_date} readOnly />}
                    </Field>
                  </div>
                  <div className="span-2" data-field="declaration_name">
                    <Field label={t("Applicant / nominator name", "अर्जदार / नामनिर्देशकाचे नाव")} required {...fieldProps("declaration_name")}>
                      {input("declaration_name")}
                    </Field>
                    {!values.declaration_name && values.nominator_name && (
                      <button type="button" className="aw-link-btn" onClick={() => update({ declaration_name: values.nominator_name })}>
                        {t("Use the nominator's name", "नामनिर्देशकाचे नाव वापरा")}: {values.nominator_name}
                      </button>
                    )}
                  </div>
                </div>
              </section>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {progress !== null && (
        <div className="upload-progress" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label={t("Upload progress", "अपलोड प्रगती")}>
          <span style={{ width: `${progress}%` }} />
        </div>
      )}

      <div className="reg-form__actions">
        {step > 0 ? (
          <button type="button" className="btn btn--outline" onClick={back} disabled={progress !== null}><ArrowLeft aria-hidden="true" /> {t("Back", "मागे")}</button>
        ) : <span />}
        {step < 4 ? (
          <button type="submit" className="btn btn--primary">{step === 3 ? t("Review", "पुनरावलोकन") : t("Next", "पुढे")} <ArrowRight aria-hidden="true" /></button>
        ) : (
          <button type="submit" className="btn btn--primary" disabled={progress !== null}>
            {progress !== null
              ? <><Loader2 className="spin" aria-hidden="true" /> {t("Submitting…", "सादर करत आहे…")} {n(progress)}%</>
              : <><Send aria-hidden="true" /> {t("Submit application", "अर्ज सादर करा")}</>}
          </button>
        )}
      </div>
    </form>
  );
}

function ReviewBlock({ title, step, onEdit, children }) {
  const t = useT();
  return (
    <section className="aw-review__block">
      <header>
        <h3>{title}</h3>
        <button type="button" className="aw-link-btn" onClick={() => onEdit(step)}>{t("Edit", "बदला")}</button>
      </header>
      <dl>{children}</dl>
    </section>
  );
}
const Row = ({ k, v }) => (v === undefined || v === null || v === "" || (Array.isArray(v) && !v.length) ? null : <div><dt>{k}</dt><dd>{v}</dd></div>);

function Review({ values: v, options, districtName, talukaName, age, duration, years, onEdit }) {
  const t = useT();
  const { lang } = useLang();
  const isOrg = v.category === "organization";
  const work = isOrg ? options.organization_work : options.individual_work;
  const find = (list, value) => optFind(lang, list, value);
  const list = (rows, fmt) => (clean(rows).length ? <ul className="aw-review__list">{clean(rows).map((r, i) => <li key={i}>{fmt(r)}</li>)}</ul> : null);
  return (
    <div className="aw-review">
      <p className="aw-note">{t(
        "Please check all details carefully before submitting. The application cannot be changed after submission.",
        "अर्ज सादर करण्यापूर्वी सर्व माहिती काळजीपूर्वक तपासा. सादर केल्यानंतर अर्जात बदल करता येणार नाही.",
      )}</p>
      <ReviewBlock title={t("Nominator", "नामनिर्देशक")} step={0} onEdit={onEdit}>
        <Row k={t("Type", "प्रकार")} v={find(options.categories, v.category)} />
        <Row k={t("Name", "नाव")} v={v.nominator_name} />
        <Row k={t("Contact number", "संपर्क क्रमांक")} v={v.nominator_mobile} />
      </ReviewBlock>
      <ReviewBlock title={isOrg ? t("Organization details", "संस्थेची माहिती") : t("Personal details", "वैयक्तिक माहिती")} step={1} onEdit={onEdit}>
        <Row k={isOrg ? t("Organization", "संस्थेचे नाव") : t("Full name", "पूर्ण नाव")} v={v.nominee_name} />
        {!isOrg && <>
          <Row k={t("Father's / husband's name", "वडिलांचे / पतीचे नाव")} v={v.father_or_husband_name} />
          <Row k={t("Date of birth", "जन्मतारीख")} v={v.date_of_birth} />
          <Row k={t("Age", "वय")} v={age !== "" ? years(age) : ""} />
        </>}
        {isOrg && <>
          <Row k={t("Type of organization", "संस्थेचा प्रकार")} v={v.org_type === "other" ? v.org_type_other : find(options.org_types, v.org_type)} />
          <Row k={t("Established", "स्थापना")} v={[v.established_on, v.established_year].filter(Boolean).join(" / ")} />
          <Row k={t("Registration number", "नोंदणी क्रमांक")} v={v.registration_no} />
          <Row k={t("Registration date", "नोंदणी दिनांक")} v={v.registration_date} />
          <Row k={t("Registering authority", "नोंदणी प्राधिकरण")} v={v.registration_authority} />
          <Row k="PAN" v={v.pan} />
          <Row k={t("Website", "संकेतस्थळ")} v={v.website_url} />
        </>}
        <Row k={t("Mobile", "मोबाईल")} v={v.mobile} />
        <Row k={t("Email", "ई-मेल")} v={v.email} />
        <Row k={t("Address", "पत्ता")} v={v.address} />
        <Row k={t("District / taluka", "जिल्हा / तालुका")} v={[districtName(v.district_id), talukaName(v.taluka_id)].filter(Boolean).join(" / ")} />
        {isOrg && <Row k={t("PIN code", "पिनकोड")} v={v.pincode} />}
        {isOrg && <Row k={t("Authorized officials", "अधिकृत पदाधिकारी")} v={list(v.officials, (o) => `${o.name} (${o.designation}) · ${o.mobile} · ${o.email}`)} />}
      </ReviewBlock>
      <ReviewBlock title={t("Work details", "कार्याची माहिती")} step={2} onEdit={onEdit}>
        <Row k={t("Work began in", "कार्य सुरू वर्ष")} v={v.work_started_year ? `${v.work_started_year}${duration !== null ? ` (${years(duration)})` : ""}` : ""} />
        <Row k={t("Work categories", "कार्यक्षेत्र")} v={v.work_categories.map((k) => find(work, k)).join(", ") + (v.work_category_other ? ` — ${v.work_category_other}` : "")} />
        <Row k={isOrg ? t("Major initiatives", "प्रमुख उपक्रम") : t("Notable works", "उल्लेखनीय कार्ये")}
          v={list(v.activities, (a) => [a.title, a.fort_name, a.work_type, a.period, a.beneficiaries && t(`${a.beneficiaries} beneficiaries`, `लाभार्थी ${a.beneficiaries}`)].filter(Boolean).join(" · "))} />
        {isOrg ? <>
          <Row k={t("Conservation & protection work", "संवर्धन व संरक्षण कार्य")} v={v.conservation_details} />
          <Row k={t("Research & documentation", "संशोधन व दस्तऐवजीकरण")} v={v.research_documentation} />
          <Row k={t("Research resources", "संशोधन साधने")} v={v.research_tools.map((k) => find(options.research_tools, k)).join(", ")} />
          <Row k={t("Youth & volunteer participation", "युवक व स्वयंसेवक सहभाग")} v={[v.youth_participation, v.volunteer_count && t(`Volunteers: ${v.volunteer_count}`, `स्वयंसेवक: ${v.volunteer_count}`)].filter(Boolean).join(" · ")} />
          <Row k={t("Writing / media coverage", "लेखन / माध्यम प्रसिद्धी")} v={v.media_publicity} />
          <Row k={t("Distinctive features", "कार्याची वैशिष्ट्ये")} v={v.distinctive_features} />
        </> : <>
          <Row k={t("Conservation work", "संवर्धन कार्य")} v={v.conservation_work} />
          <Row k={t("Lectures / awareness", "व्याख्याने / जनजागृती")} v={v.lectures_awareness} />
          <Row k={t("External references", "बाह्य संदर्भ")} v={v.external_references} />
        </>}
        <Row k={t("Publications", "प्रकाशने")} v={list(v.publications, (p) => [p.title, p.pub_type, p.publisher, p.year].filter(Boolean).join(" · "))} />
        <Row k={t("Awards / honours", "पुरस्कार / सन्मान")} v={list(v.honours, (h) => [h.title, h.awarded_by, h.year].filter(Boolean).join(" · "))} />
      </ReviewBlock>
      <ReviewBlock title={t("Evidence & links", "पुरावे व लिंक्स")} step={3} onEdit={onEdit}>
        <Row k={t("Total", "एकूण")} v={digits(lang, clean(v.documents).length)} />
        <Row k={t("Entries", "नोंदी")} v={list(v.documents, (d) => [d.title || find(options.document_types, d.doc_type) || t("Evidence", "पुरावा"), d.file?.name, d.external_url].filter(Boolean).join(" · "))} />
      </ReviewBlock>
    </div>
  );
}
