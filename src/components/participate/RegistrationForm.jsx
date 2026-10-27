import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, ArrowLeft, ArrowRight, Building2, Camera, Check, CheckCircle2, Copy, GraduationCap, House, ImagePlus, Landmark, Loader2, RefreshCw, School, Trash2, User, Users } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { EDITION_YEAR, EDITION_YEAR_MR } from "../../config/edition.js";
import { useLang, useT } from "../../context/LanguageContext.jsx";
import { useApi } from "../../hooks/useApi.js";
import { http, toApiError } from "../../lib/api.js";
import { mr } from "../../lib/format.js";
import { MAX_UPLOAD_MB, preparePhoto } from "../../lib/image.js";
import { CustomSelect, digitsOnly, Field } from "./fields.jsx";
import { FrameShare, PHOTO_GUIDES, PhotoExamples } from "./PhotoGuide.jsx";
import "./registration.css";

// Who is registering (server: PARTICIPANT_TYPES). Every type but "individual" names its group (`org`,
// sent as organization_name) and says how many members built the replica (`members`, sent as members_count).
// Labels are [English, Marathi].
const REPRESENTATIVE = ["Representative's Full Name", "प्रतिनिधीचे पूर्ण नाव"];
const PARTICIPANT_TYPES = [
  {
    value: "individual", Icon: User, label: ["Individual", "वैयक्तिक"],
    about: ["You built the replica on your own.", "प्रतिकृती आपण एकट्याने बनवली आहे."],
    name: ["Full Name", "पूर्ण नाव"],
  },
  {
    value: "family", Icon: House, label: ["Family", "कुटुंब"],
    about: ["Built together with your family members.", "कुटुंबातील सदस्यांनी मिळून बनवली आहे."],
    name: ["Head of Family's Full Name", "कुटुंबप्रमुखाचे पूर्ण नाव"],
    org: ["Family Name", "कुटुंबाचे नाव"], orgOptional: true, orgExample: ["e.g. Patil Family", "उदा. पाटील परिवार"],
    members: ["Number of family members", "कुटुंबातील सदस्य संख्या"],
  },
  {
    value: "group", Icon: Users, label: ["Friends / Mandal", "मित्र / मंडळ"],
    about: ["A group of friends, a mandal or a team.", "मित्रांचा ग्रुप, मंडळ किंवा टीम."],
    name: REPRESENTATIVE,
    org: ["Group / Mandal Name", "ग्रुप / मंडळाचे नाव"],
    members: ["Number of members", "सदस्य संख्या"],
  },
  {
    value: "housing_society", Icon: Building2, label: ["Housing Society", "गृहनिर्माण संस्था"],
    about: ["Residents of a housing society, together.", "गृहनिर्माण संस्थेतील रहिवाशांनी मिळून."],
    name: REPRESENTATIVE,
    org: ["Housing Society Name", "गृहनिर्माण संस्थेचे नाव"],
    members: ["Number of participating residents", "सहभागी रहिवाशांची संख्या"],
  },
  {
    value: "school", Icon: School, label: ["School", "शाळा"],
    about: ["Students of a school, with their teachers.", "शाळेचे विद्यार्थी व शिक्षक."],
    name: ["Teacher / Representative's Full Name", "शिक्षक / प्रतिनिधीचे पूर्ण नाव"],
    org: ["School Name", "शाळेचे नाव"],
    members: ["Number of participating students", "सहभागी विद्यार्थ्यांची संख्या"],
  },
  {
    value: "college", Icon: GraduationCap, label: ["College", "महाविद्यालय"],
    about: ["Students of a college.", "महाविद्यालयाचे विद्यार्थी."],
    name: ["Professor / Representative's Full Name", "प्राध्यापक / प्रतिनिधीचे पूर्ण नाव"],
    org: ["College Name", "महाविद्यालयाचे नाव"],
    members: ["Number of participating students", "सहभागी विद्यार्थ्यांची संख्या"],
  },
  {
    value: "organization", Icon: Landmark, label: ["Organisation", "संस्था"],
    about: ["An NGO, company, club or other organisation.", "स्वयंसेवी संस्था, कंपनी, क्लब किंवा इतर संस्था."],
    name: REPRESENTATIVE,
    org: ["Organisation Name", "संस्थेचे नाव"],
    members: ["Number of members", "सदस्य संख्या"],
  },
];
const typeOf = (value) => PARTICIPANT_TYPES.find((p) => p.value === value) ?? PARTICIPANT_TYPES[0];

const MEMBERS_MIN = 2;
const MEMBERS_MAX = 10000;

// Explicit dropdown choice for a fort outside the list; sent to the API as no fort_id.
const OTHER_FORT = "other";

const NOTES_MIN = 2;
const NOTES_MAX = 300;

const EMPTY = { participant_type: "individual", division_id: "", name: "", organization_name: "", members_count: "", phone: "", email: "", district_id: "", taluka_id: "", fort_id: "", replica_notes: "", consent: false, website: "" };
const STEP_FIELDS = [
  ["participant_type", "division_id", "name", "organization_name", "members_count", "phone", "email", "district_id", "taluka_id"],
  ["fort_id", "replica_notes", "photo"],
  ["consent"],
];

// One id per form fill, sent with every submit attempt so a retry after a dropped connection
// returns the registration already saved instead of creating a second one.
const newSubmissionId = () =>
  globalThis.crypto?.randomUUID?.() ??
  "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) => (c ^ (Math.random() * 16) >> (c / 4)).toString(16));

function validate(step, v, photo, t) {
  const e = {};
  if (step === 0) {
    const type = typeOf(v.participant_type);
    if (!v.division_id) e.division_id = t("Please select your division.", "आपला विभाग निवडा.");
    if (v.name.trim().length < 2) e.name = t("Please enter your full name.", "कृपया पूर्ण नाव लिहा.");
    if (type.org && !type.orgOptional && !v.organization_name.trim()) {
      e.organization_name = t(`Please enter the ${type.org[0].toLowerCase()}.`, `${type.org[1]} लिहा.`);
    }
    if (type.members) {
      const n = Number(v.members_count);
      if (!v.members_count) e.members_count = t("Please enter how many members built the replica.", "प्रतिकृती बनवणाऱ्या सदस्यांची संख्या लिहा.");
      else if (n < MEMBERS_MIN) e.members_count = t(`A group needs at least ${MEMBERS_MIN} members.`, `गटात किमान ${mr(MEMBERS_MIN)} सदस्य असावेत.`);
      else if (n > MEMBERS_MAX) e.members_count = t(`Please enter at most ${MEMBERS_MAX} members.`, `कमाल ${mr(MEMBERS_MAX)} सदस्य लिहा.`);
    }
    if (!/^[6-9]\d{9}$/.test(v.phone)) e.phone = t("Enter a valid 10-digit mobile number (starting with 6, 7, 8 or 9).", "१० अंकी मोबाईल क्रमांक लिहा (६, ७, ८ किंवा ९ ने सुरू होणारा).");
    if (!v.email.trim()) e.email = t("Please enter your email address.", "ईमेल पत्ता लिहा.");
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email.trim())) e.email = t("Email address is invalid.", "ईमेल पत्ता योग्य नाही.");
    if (!v.district_id) e.district_id = t("Please select your district.", "आपला जिल्हा निवडा.");
    if (!v.taluka_id) e.taluka_id = t("Please select your taluka.", "आपला तालुका निवडा.");
  }
  if (step === 1) {
    if (!v.fort_id) e.fort_id = t("Please select the fort your replica is based on.", "आपली प्रतिकृती कोणत्या दुर्गाची आहे ते निवडा.");
    if (!photo) e.photo = t("Please select a photo of your replica with its builder(s).", "प्रतिकृती व ती घडवणाऱ्यांचा फोटो निवडा.");
    // optional, but if filled it must be a real description
    const notes = v.replica_notes.trim();
    if (notes && notes.length < NOTES_MIN) e.replica_notes = t(`Please write at least ${NOTES_MIN} characters, or leave it blank.`, `किमान ${NOTES_MIN} अक्षरे लिहा, किंवा रिकामे ठेवा.`);
    else if (notes.length > NOTES_MAX) e.replica_notes = t(`Please keep it within ${NOTES_MAX} characters.`, `कमाल ${NOTES_MAX} अक्षरांत लिहा.`);
  }
  if (step === 2 && !v.consent) e.consent = t("You must accept the rules to proceed.", "पुढे जाण्यासाठी नियम मान्य करणे आवश्यक आहे.");
  return e;
}

export function RegistrationForm() {
  const t = useT();
  const { lang } = useLang();
  const divisions = useApi("/divisions").data?.data ?? [];
  const districts = useApi("/districts").data?.data ?? [];
  const talukas = useApi("/talukas").data?.data ?? [];
  const forts = useApi("/forts").data?.data ?? [];
  const [step, setStep] = useState(0);
  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [photo, setPhoto] = useState(null);
  const [preparing, setPreparing] = useState(false);
  const [progress, setProgress] = useState(null);
  const [formError, setFormError] = useState("");
  const [result, setResult] = useState(null);
  const topRef = useRef(null);
  const fileRef = useRef(null);
  const photoRef = useRef(photo);
  photoRef.current = photo;
  const submissionId = useRef(newSubmissionId());

  const STEPS = [
    t("Your Details", "आपली माहिती"),
    t("Fort & Photo", "दुर्ग व छायाचित्र"),
    t("Review", "पुनरावलोकन"),
  ];
  const type = typeOf(values.participant_type);
  const guide = type.value === "individual" ? PHOTO_GUIDES.individual : PHOTO_GUIDES.group;

  // The preview is revoked when replaced/removed; this frees whatever is left on unmount.
  useEffect(() => () => photoRef.current && URL.revokeObjectURL(photoRef.current.preview), []);

  const set = (name) => (e) => {
    const value = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    const clean = name === "phone" ? digitsOnly(value, 10) : name === "members_count" ? digitsOnly(value, 5) : value;
    setValues((v) => ({ ...v, [name]: clean }));
    if (errors[name]) setErrors((er) => ({ ...er, [name]: undefined }));
  };

  // A different type is a fresh registration: everything filled so far (photo included) is cleared.
  function chooseType(value) {
    if (value === values.participant_type) return;
    setValues({ ...EMPTY, participant_type: value });
    setErrors({});
    setFormError("");
    replacePhoto(null);
  }

  function replacePhoto(next) {
    if (photoRef.current) URL.revokeObjectURL(photoRef.current.preview);
    setPhoto(next);
  }

  async function addPhoto(fileList) {
    const file = fileList?.[0];
    if (fileRef.current) fileRef.current.value = "";
    if (!file || preparing) return;
    setPreparing(true);
    setErrors((er) => ({ ...er, photo: undefined }));
    try {
      replacePhoto(await preparePhoto(file, t));
    } catch (err) {
      setErrors((er) => ({ ...er, photo: err.message }));
    } finally {
      setPreparing(false);
    }
  }

  const pickPhoto = () => fileRef.current?.click();

  const focusFirstError = (errs) =>
    requestAnimationFrame(() => document.querySelector(`[data-field="${Object.keys(errs)[0]}"] input, [data-field="${Object.keys(errs)[0]}"] select, [data-field="${Object.keys(errs)[0]}"] textarea, [data-field="${Object.keys(errs)[0]}"] button`)?.focus());

  function next() {
    const errs = validate(step, values, photo, t);
    setErrors(errs);
    if (Object.keys(errs).length) return focusFirstError(errs);
    setStep((s) => s + 1);
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function submit(e) {
    e.preventDefault();
    if (progress !== null) return; // a submit is already in flight (Enter key while uploading)
    if (step < 2) return next();
    const errs = validate(2, values, photo, t);
    setErrors(errs);
    if (Object.keys(errs).length) return focusFirstError(errs);

    const body = new FormData();
    body.append("participant_type", values.participant_type);
    body.append("name", values.name.trim());
    if (type.org && values.organization_name.trim()) body.append("organization_name", values.organization_name.trim());
    if (type.members) body.append("members_count", values.members_count);
    body.append("phone", values.phone);
    body.append("email", values.email.trim());
    body.append("country", "India");
    body.append("district_id", values.district_id);
    if (values.division_id) body.append("division_id", values.division_id);
    if (values.taluka_id) body.append("taluka_id", values.taluka_id);
    if (values.fort_id && values.fort_id !== OTHER_FORT) body.append("fort_id", values.fort_id);
    if (values.replica_notes) body.append("replica_notes", values.replica_notes.trim());
    body.append("consent", "true");
    body.append("website", values.website);
    body.append("submission_id", submissionId.current);
    body.append("photo", photo.file);

    setFormError("");
    setProgress(0);
    try {
      const { data } = await http.post("/registrations", body, {
        timeout: 120000,
        onUploadProgress: (p) => p.total && setProgress(Math.round((p.loaded / p.total) * 100)),
      });
      setResult(data.data);
      topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (err) {
      const apiErr = toApiError(err);
      const fieldErrors = apiErr.details || {};
      const errStep = STEP_FIELDS.findIndex((fields) => fields.some((f) => fieldErrors[f]));
      if (errStep >= 0) {
        setErrors(Object.fromEntries(Object.entries(fieldErrors).filter(([, m]) => typeof m === "string")));
        setStep(errStep);
      }
      setFormError(apiErr.message || t("An error occurred during registration.", "नोंदणी करताना अडचण आली."));
    } finally {
      setProgress(null);
    }
  }

  if (result) return <Success result={result} onReset={() => { submissionId.current = newSubmissionId(); setResult(null); setValues(EMPTY); replacePhoto(null); setStep(0); }} />;

  const filteredDistricts = values.division_id
    ? districts.filter((d) => String(d.division_id) === String(values.division_id))
    : [];
  const filteredTalukas = values.district_id
    ? talukas.filter((tk) => String(tk.district_id) === String(values.district_id))
    : [];

  const fortName = forts.find((f) => String(f.id) === String(values.fort_id));
  const fortLabel = fortName ? (lang === "mr" ? fortName.name_mr : (fortName.name_en || fortName.name_mr)) : null;
  const districtName = districts.find((d) => String(d.id) === String(values.district_id));
  const districtLabel = districtName ? (lang === "mr" ? districtName.name_mr : (districtName.name_en || districtName.name_mr)) : null;

  return (
    <>
    <PhotoExamples />
    <form className="reg-form card-light" onSubmit={submit} noValidate ref={topRef} aria-labelledby="reg-title">
      <div className="reg-form__head">
        <h2 id="reg-title">{t(`Durgotsav ${EDITION_YEAR} Registration`, `दुर्गोत्सव ${EDITION_YEAR_MR} नोंदणी`)}</h2>
        <ol className="stepper" aria-label={t("Registration steps", "नोंदणीचे टप्पे")}>
          {STEPS.map((label, i) => (
            <li key={label} className={i === step ? "is-current" : i < step ? "is-done" : ""} aria-current={i === step ? "step" : undefined}>
              <span className="stepper__dot">{i < step ? <Check size={14} aria-hidden="true" /> : ["1", "2", "3"][i]}</span>
              <span className="stepper__label">{label}</span>
            </li>
          ))}
        </ol>
      </div>

      {formError && (
        <div className="alert alert--error" role="alert"><AlertCircle aria-hidden="true" /><span>{formError}</span></div>
      )}

      <input type="text" name="website" value={values.website} onChange={set("website")} tabIndex={-1} autoComplete="off" className="sr-only" aria-hidden="true" />

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="reg-form__step"
        >
          {step === 0 && (
            <div className="form-grid form-grid--2">
              <fieldset className="type-picker span-2" data-field="participant_type" aria-describedby="type-about">
                <legend className="field__label">
                  {t("Participating as", "सहभागाचा प्रकार")}
                  <span className="req" aria-hidden="true">*</span>
                </legend>
                <div className="type-picker__options">
                  {PARTICIPANT_TYPES.map(({ value, Icon, label }) => (
                    <label key={value} className={`type-option ${values.participant_type === value ? "is-checked" : ""}`}>
                      <input type="radio" name="participant_type" value={value} checked={values.participant_type === value} onChange={() => chooseType(value)} />
                      <Icon aria-hidden="true" />
                      <span>{t(...label)}</span>
                    </label>
                  ))}
                </div>
                <p className="type-picker__about" id="type-about" aria-live="polite">{t(...type.about)}</p>
              </fieldset>

              {type.org && (
                <div className="span-2 field-reveal" key={`org-${type.value}`} data-field="organization_name">
                  <Field
                    label={type.orgOptional ? `${t(...type.org)} ${t("(optional)", "(ऐच्छिक)")}` : t(...type.org)}
                    required={!type.orgOptional}
                    error={errors.organization_name}
                  >
                    {(p) => (
                      <input {...p} className="input" value={values.organization_name} onChange={set("organization_name")} maxLength={200}
                        autoComplete={type.value === "family" ? "family-name" : "organization"}
                        placeholder={type.orgExample ? t(...type.orgExample) : undefined} />
                    )}
                  </Field>
                </div>
              )}
              <div className={type.members ? "" : "span-2"} data-field="name">
                <Field
                  label={t(...type.name)}
                  required
                  error={errors.name}
                  hint={t("This name will be printed on the certificate.", "अभिनंदन पत्रावर हेच नाव छापले जाईल.")}
                >
                  {(p) => <input {...p} className="input" value={values.name} onChange={set("name")} maxLength={150} autoComplete="name" />}
                </Field>
              </div>
              {type.members && (
                <div className="field-reveal" key={`members-${type.value}`} data-field="members_count">
                  <Field
                    label={t(...type.members)}
                    required
                    error={errors.members_count}
                    hint={t("Everyone who helped build the replica, including you.", "प्रतिकृती बनवण्यात सहभागी सर्वजण, आपल्यासह.")}
                  >
                    {(p) => (
                      <input {...p} className="input" type="text" inputMode="numeric" value={values.members_count} onChange={set("members_count")}
                        placeholder={t(`e.g. ${type.value === "family" ? 4 : 15}`, `उदा. ${type.value === "family" ? "४" : "१५"}`)} autoComplete="off" />
                    )}
                  </Field>
                </div>
              )}
              <div data-field="phone">
                <Field
                  label={t("Mobile Number", "मोबाईल क्रमांक")}
                  required
                  error={errors.phone}
                  hint={t("The certificate notification will be sent to this number.", "अभिनंदन पत्राची सूचना या क्रमांकावर येईल.")}
                >
                  {(p) => <input {...p} className="input" type="tel" inputMode="numeric" value={values.phone} onChange={set("phone")} placeholder={t("10-digit number", "१० अंकी क्रमांक")} autoComplete="tel-national" />}
                </Field>
              </div>
              <div data-field="email">
                <Field
                  label={t("Email", "ईमेल")}
                  required
                  error={errors.email}
                  hint={t("The certificate will also be emailed to you.", "अभिनंदन पत्र ईमेलवरही पाठवले जाईल.")}
                >
                  {(p) => <input {...p} className="input" type="email" inputMode="email" value={values.email} onChange={set("email")} maxLength={160} autoComplete="email" />}
                </Field>
              </div>
              <div data-field="division_id">
                <Field label={t("Division", "विभाग")} required error={errors.division_id}>
                  {(p) => (
                    <CustomSelect
                      {...p}
                      value={values.division_id}
                      placeholder={t("Select Division", "विभाग निवडा")}
                      options={divisions.map((div) => ({
                        value: div.id,
                        label: lang === "mr" ? (div.name_mr || div.name_en) : (div.name_en || div.name_mr),
                      }))}
                      onValueChange={(id) => {
                        setValues((v) => ({ ...v, division_id: id, district_id: "", taluka_id: "" }));
                        setErrors((er) => ({ ...er, division_id: undefined, district_id: undefined, taluka_id: undefined }));
                      }}
                    />
                  )}
                </Field>
              </div>
              <div data-field="district_id">
                <Field label={t("District", "जिल्हा")} required error={errors.district_id}>
                  {(p) => (
                    <CustomSelect
                      {...p}
                      value={values.district_id}
                      placeholder={t("Select District", "जिल्हा निवडा")}
                      options={filteredDistricts.map((d) => ({
                        value: d.id,
                        label: lang === "mr" ? d.name_mr : (d.name_en || d.name_mr),
                      }))}
                      onValueChange={(id) => {
                        setValues((v) => ({ ...v, district_id: id, taluka_id: "" }));
                        setErrors((er) => ({ ...er, district_id: undefined, taluka_id: undefined }));
                      }}
                      disabled={!values.division_id}
                    />
                  )}
                </Field>
              </div>
              <div data-field="taluka_id">
                <Field label={t("Taluka", "तालुका")} required error={errors.taluka_id}>
                  {(p) => (
                    <CustomSelect
                      {...p}
                      value={values.taluka_id}
                      placeholder={t("Select Taluka", "तालुका निवडा")}
                      options={filteredTalukas.map((tk) => ({
                        value: tk.id,
                        label: lang === "mr" ? tk.name_mr : (tk.name_en || tk.name_mr),
                      }))}
                      onValueChange={(id) => {
                        setValues((v) => ({ ...v, taluka_id: id }));
                        if (errors.taluka_id) setErrors((er) => ({ ...er, taluka_id: undefined }));
                      }}
                      disabled={!values.district_id}
                    />
                  )}
                </Field>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="form-grid">
              <div data-field="fort_id">
                <Field
                  label={t("Which fort's replica did you build?", "आपण कोणत्या दुर्गाची प्रतिकृती बनवली?")}
                  required
                  error={errors.fort_id}
                  hint={t("Select a fort from the UNESCO list, or choose “Other Fort / My Own Design”.", "युनेस्को यादीतील दुर्ग निवडा, किंवा “इतर दुर्ग / माझी कल्पना” निवडा.")}
                >
                  {(p) => (
                    <CustomSelect
                      {...p}
                      value={values.fort_id}
                      placeholder={t("Select a fort", "दुर्ग निवडा")}
                      options={[
                        ...forts.map((f) => ({
                          value: f.id,
                          label: `${f.name_mr} (${f.name_en})`,
                        })),
                        { value: OTHER_FORT, label: t("Other Fort / My Own Design", "इतर दुर्ग / माझी कल्पना") },
                      ]}
                      onValueChange={(id) => {
                        setValues((v) => ({ ...v, fort_id: id }));
                        if (errors.fort_id) setErrors((er) => ({ ...er, fort_id: undefined }));
                      }}
                    />
                  )}
                </Field>
              </div>
              <div data-field="photo">
                <section className="photo-guide" aria-labelledby="photo-guide-title">
                  <header className="photo-guide__head">
                    <span className="photo-guide__icon"><Camera aria-hidden="true" /></span>
                    <div>
                      <h3 id="photo-guide-title">{t("Before you upload your replica photo", "दुर्ग प्रतिकृतीचा फोटो अपलोड करताना घ्यावयाची काळजी")}</h3>
                      <span className="photo-guide__tag">{t(...guide.title)}</span>
                    </div>
                  </header>
                  <p className="photo-guide__body">{t(...guide.body)}</p>
                  <FrameShare guide={guide} />
                  <ul className="photo-guide__rules" id="photo-rules">
                    <li><Check aria-hidden="true" />{t("Keep the whole replica in the frame, in good light and in focus.", "संपूर्ण प्रतिकृती फ्रेममध्ये, चांगल्या प्रकाशात व स्पष्ट दिसावी.")}</li>
                    <li><Check aria-hidden="true" />{t("Only a replica you built yourself — no internet, AI-made or edited photos.", "स्वतः बनवलेल्या प्रतिकृतीचाच फोटो — इंटरनेटवरील, AI ने बनवलेले किंवा एडिट केलेले फोटो नकोत.")}</li>
                    <li><Check aria-hidden="true" /><span>{t("One photo · JPG, PNG or WebP · ", "एकच फोटो · JPG, PNG किंवा WebP · ")}<strong>{t(`max ${MAX_UPLOAD_MB} MB`, `कमाल ${MAX_UPLOAD_MB} MB`)}</strong></span></li>
                  </ul>
                </section>

                <span className="field__label photo-upload__label" id="photo-label">
                  {t("Upload photo", "फोटो अपलोड करा")}
                  <span className="req" aria-hidden="true">*</span>
                </span>
                <div
                  className={`dropzone ${photo ? "has-photo" : ""} ${errors.photo ? "has-error" : ""}`}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => { e.preventDefault(); addPhoto(e.dataTransfer.files); }}
                >
                  {photo ? (
                    <div className="dropzone__preview">
                      <img src={photo.preview} alt={t("Selected photo", "निवडलेला फोटो")} />
                      <div className="dropzone__actions">
                        <button type="button" className="btn btn--outline btn--sm" onClick={pickPhoto} disabled={preparing}>
                          {preparing ? <Loader2 className="spin" aria-hidden="true" /> : <RefreshCw aria-hidden="true" />} {t("Change", "बदला")}
                        </button>
                        <button type="button" className="btn btn--outline btn--sm" onClick={() => replacePhoto(null)} disabled={preparing}>
                          <Trash2 aria-hidden="true" /> {t("Remove", "काढा")}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button type="button" className="dropzone__empty" onClick={pickPhoto} disabled={preparing}
                      aria-describedby="photo-rules" aria-invalid={errors.photo ? true : undefined}>
                      {preparing ? <Loader2 className="spin" aria-hidden="true" /> : <ImagePlus aria-hidden="true" />}
                      <strong>{preparing ? t("Preparing photo…", "फोटो तयार करत आहे…") : t("Select or drag your photo here", "फोटो निवडा किंवा येथे ओढा")}</strong>
                      <span>{t("You can take a photo directly with your mobile camera.", "मोबाईल कॅमेऱ्याने थेट फोटो काढू शकता.")}</span>
                    </button>
                  )}
                </div>
                {errors.photo && <span className="field__error"><AlertCircle size={14} aria-hidden="true" />{errors.photo}</span>}
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="sr-only"
                  aria-labelledby="photo-label"
                  onChange={(e) => addPhoto(e.target.files)}
                  tabIndex={-1}
                />
              </div>
              <div data-field="replica_notes">
                <Field
                  label={t("Brief description of the replica (optional)", "प्रतिकृतीबद्दल थोडक्यात (ऐच्छिक)")}
                  error={errors.replica_notes}
                  hint={<>
                    {t("Materials used, participating members, etc.", "वापरलेले साहित्य, सहभागी सदस्य इ.")}
                    <span className="char-count" aria-live="polite">{values.replica_notes.length}/{NOTES_MAX}</span>
                  </>}
                >
                  {(p) => <textarea {...p} className="textarea" value={values.replica_notes} onChange={set("replica_notes")} maxLength={NOTES_MAX} />}
                </Field>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="stack">
              <div className="review">
                <div className="review__photos">
                  {photo && <img src={photo.preview} alt="" className="review__photo" />}
                </div>
                <dl>
                  <div><dt>{t("Type", "प्रकार")}</dt><dd>{t(...type.label)}</dd></div>
                  {type.org && values.organization_name.trim() && <div><dt>{t(...type.org)}</dt><dd>{values.organization_name}</dd></div>}
                  <div><dt>{t("Name", "नाव")}</dt><dd>{values.name}</dd></div>
                  {type.members && <div><dt>{t("Members", "सदस्य")}</dt><dd>{t(values.members_count, mr(values.members_count))}</dd></div>}
                  <div><dt>{t("Mobile", "मोबाईल")}</dt><dd>{values.phone}</dd></div>
                  {values.email && <div><dt>{t("Email", "ईमेल")}</dt><dd>{values.email}</dd></div>}
                  <div><dt>{t("Division", "विभाग")}</dt><dd>{(() => { const div = divisions.find((d) => String(d.id) === String(values.division_id)); return div ? (lang === "mr" ? div.name_mr || div.name_en : div.name_en || div.name_mr) : ""; })()}</dd></div>
                  <div><dt>{t("District", "जिल्हा")}</dt><dd>{districtLabel}</dd></div>
                  {values.taluka_id && <div><dt>{t("Taluka", "तालुका")}</dt><dd>{(() => { const tk = talukas.find((t) => String(t.id) === String(values.taluka_id)); return tk ? (lang === "mr" ? tk.name_mr : (tk.name_en || tk.name_mr)) : ""; })()}</dd></div>}
                  <div><dt>{t("Fort", "दुर्ग")}</dt><dd>{fortLabel || t("Other Fort", "इतर दुर्ग")}</dd></div>
                </dl>
              </div>
              <div data-field="consent">
                <label className="checkbox">
                  <input type="checkbox" checked={values.consent} onChange={set("consent")} aria-invalid={errors.consent ? true : undefined} />
                  <span>
                    {t(
                      <>I have read the <Link to="/rules" target="_blank">Durgotsav Code</Link> and <Link to="/terms" target="_blank">Terms</Link>. This replica was built by me / us and the information provided is true. I consent to this photo being displayed in the Durgotsav album after verification.</>,
                      <>मी <Link to="/rules" target="_blank">दुर्गोत्सव संहिता</Link> व <Link to="/terms" target="_blank">अटी</Link> वाचल्या आहेत. ही प्रतिकृती मी / आम्ही स्वतः तयार केली असून दिलेली माहिती सत्य आहे. पडताळणीनंतर हा फोटो दुर्गोत्सव अल्बममध्ये प्रदर्शित करण्यास माझी संमती आहे.</>
                    )}
                  </span>
                </label>
                {errors.consent && <span className="field__error"><AlertCircle size={14} aria-hidden="true" />{errors.consent}</span>}
              </div>
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
          <button type="button" className="btn btn--outline" onClick={() => setStep((s) => s - 1)} disabled={progress !== null}>
            <ArrowLeft aria-hidden="true" /> {t("Back", "मागे")}
          </button>
        ) : <span />}
        {step < 2 ? (
          <button type="submit" className="btn btn--primary" disabled={preparing}>
            {t("Next", "पुढे")} <ArrowRight aria-hidden="true" />
          </button>
        ) : (
          <button type="submit" className="btn btn--primary" disabled={progress !== null}>
            {progress !== null
              ? <><Loader2 className="spin" aria-hidden="true" /> {progress < 100
                ? t(`Uploading ${progress}%`, `अपलोड ${progress}%`)
                : t("Saving your photo…", "फोटो जतन करत आहे…")}</>
              : <>{t("Complete Registration", "नोंदणी पूर्ण करा")} <Check aria-hidden="true" /></>}
          </button>
        )}
      </div>
    </form>
    </>
  );
}

function Success({ result, onReset }) {
  const t = useT();
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(result.registration_no);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked — number is visible anyway */
    }
  };
  return (
    <motion.div className="reg-success card-light" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} role="status" aria-live="polite">
      <motion.span className="reg-success__icon" initial={{ scale: 0, rotate: -40 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 220, damping: 14, delay: 0.15 }}>
        <CheckCircle2 aria-hidden="true" />
      </motion.span>
      <h2>{t("Registration Successful! Jai Bhavani, Jai Shivaji!", "नोंदणी यशस्वी! जय भवानी, जय शिवाजी!")}</h2>
      <p>{t(`Thank you for participating in Durgotsav ${EDITION_YEAR}. Your registration number:`, `दुर्गोत्सव ${EDITION_YEAR_MR} मध्ये सहभागी झाल्याबद्दल धन्यवाद. आपला नोंदणी क्रमांक:`)}</p>
      <div className="reg-success__number">
        <strong>{result.registration_no}</strong>
        <button type="button" className="btn btn--outline btn--sm" onClick={copy}>
          <Copy aria-hidden="true" /> {copied ? t("Copied", "कॉपी झाले") : t("Copy", "कॉपी करा")}
        </button>
      </div>
      <p className="muted">
        {t(
          "Please keep this number safe. Once verification is complete (usually within 24 hours), you can download your certificate using your registration number and mobile number.",
          "कृपया हा क्रमांक जपून ठेवा. पडताळणी पूर्ण झाल्यावर (शक्यतो २४ तासांत) नोंदणी क्रमांक व मोबाईल क्रमांक वापरून अभिनंदन पत्र डाउनलोड करता येईल."
        )}
      </p>
      <div className="cluster" style={{ justifyContent: "center" }}>
        <Link to={`/certificate?registration=${encodeURIComponent(result.registration_no)}&tab=status`} className="btn btn--primary">
          {t("View Registration Status", "नोंदणी स्थिती पहा")}
        </Link>
        <button type="button" className="btn btn--outline" onClick={onReset}>
          {t("Register Another", "आणखी एक नोंदणी")}
        </button>
      </div>
    </motion.div>
  );
}
