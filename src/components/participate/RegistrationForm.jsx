import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, ArrowLeft, ArrowRight, Check, CheckCircle2, Copy, ImagePlus, Loader2, RefreshCw } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useLang, useT } from "../../context/LanguageContext.jsx";
import { useApi } from "../../hooks/useApi.js";
import { http, toApiError } from "../../lib/api.js";
import { PARTICIPANT_TYPES, PARTICIPANT_TYPES_EN } from "../../lib/format.js";
import { MAX_UPLOAD_MB, preparePhoto } from "../../lib/image.js";
import { digitsOnly, Field } from "./fields.jsx";
import "./registration.css";

const ORG_TYPES = new Set(["housing_society", "organization", "group", "school", "college"]);
const EMPTY = { participant_type: "individual", name: "", organization_name: "", phone: "", email: "", district_id: "", city: "", fort_id: "", replica_notes: "", consent: false, website: "" };
const STEP_FIELDS = [
  ["participant_type", "name", "organization_name", "phone", "email", "district_id", "city"],
  ["fort_id", "replica_notes", "photo"],
  ["consent"],
];

function validate(step, v, photo, t) {
  const e = {};
  if (step === 0) {
    if (v.name.trim().length < 2) e.name = t("Please enter your full name.", "कृपया पूर्ण नाव लिहा.");
    if (ORG_TYPES.has(v.participant_type) && !v.organization_name.trim()) e.organization_name = t("Enter the name of the organisation / school.", "संस्थेचे / शाळेचे नाव लिहा.");
    if (!/^[6-9]\d{9}$/.test(v.phone)) e.phone = t("Enter a valid 10-digit mobile number (starting with 6, 7, 8 or 9).", "१० अंकी मोबाईल क्रमांक लिहा (६, ७, ८ किंवा ९ ने सुरू होणारा).");
    if (!v.email.trim()) e.email = t("Please enter your email address.", "ईमेल पत्ता लिहा.");
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email.trim())) e.email = t("Email address is invalid.", "ईमेल पत्ता योग्य नाही.");
    if (!v.district_id) e.district_id = t("Please select your district.", "आपला जिल्हा निवडा.");
  }
  if (step === 1 && !photo) e.photo = t("Please select a photo of yourself with your replica.", "प्रतिकृतीसोबतचे आपले छायाचित्र निवडा.");
  if (step === 2 && !v.consent) e.consent = t("You must accept the rules to proceed.", "पुढे जाण्यासाठी नियम मान्य करणे आवश्यक आहे.");
  return e;
}

export function RegistrationForm() {
  const t = useT();
  const { lang } = useLang();
  const districts = useApi("/districts").data?.data ?? [];
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

  const STEPS = [
    t("Your Details", "आपली माहिती"),
    t("Fort & Photo", "दुर्ग व छायाचित्र"),
    t("Review", "पुनरावलोकन"),
  ];
  const participantTypes = lang === "mr" ? PARTICIPANT_TYPES : PARTICIPANT_TYPES_EN;

  useEffect(() => () => photo && URL.revokeObjectURL(photo.preview), [photo]);

  const set = (name) => (e) => {
    const value = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setValues((v) => ({ ...v, [name]: name === "phone" ? digitsOnly(value, 10) : value }));
    if (errors[name]) setErrors((er) => ({ ...er, [name]: undefined }));
  };

  async function onPhoto(file) {
    if (!file) return;
    setPreparing(true);
    setErrors((er) => ({ ...er, photo: undefined }));
    try {
      if (photo) URL.revokeObjectURL(photo.preview);
      setPhoto(await preparePhoto(file));
    } catch (err) {
      setPhoto(null);
      setErrors((er) => ({ ...er, photo: err.message }));
    } finally {
      setPreparing(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  const focusFirstError = (errs) =>
    requestAnimationFrame(() => document.querySelector(`[data-field="${Object.keys(errs)[0]}"] input, [data-field="${Object.keys(errs)[0]}"] select, [data-field="${Object.keys(errs)[0]}"] button`)?.focus());

  function next() {
    const errs = validate(step, values, photo, t);
    setErrors(errs);
    if (Object.keys(errs).length) return focusFirstError(errs);
    setStep((s) => s + 1);
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function submit(e) {
    e.preventDefault();
    if (step < 2) return next();
    const errs = validate(2, values, photo, t);
    setErrors(errs);
    if (Object.keys(errs).length) return focusFirstError(errs);

    const body = new FormData();
    body.append("participant_type", values.participant_type);
    body.append("name", values.name.trim());
    if (ORG_TYPES.has(values.participant_type)) body.append("organization_name", values.organization_name.trim());
    body.append("phone", values.phone);
    body.append("email", values.email.trim());
    body.append("country", "India");
    body.append("district_id", values.district_id);
    if (values.city) body.append("city", values.city.trim());
    if (values.fort_id) body.append("fort_id", values.fort_id);
    if (values.replica_notes) body.append("replica_notes", values.replica_notes.trim());
    body.append("consent", "true");
    body.append("website", values.website);
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

  if (result) return <Success result={result} onReset={() => { setResult(null); setValues(EMPTY); setPhoto(null); setStep(0); }} />;

  const fortName = forts.find((f) => String(f.id) === String(values.fort_id));
  const fortLabel = fortName ? (lang === "mr" ? fortName.name_mr : (fortName.name_en || fortName.name_mr)) : null;
  const districtName = districts.find((d) => String(d.id) === String(values.district_id));
  const districtLabel = districtName ? (lang === "mr" ? districtName.name_mr : (districtName.name_en || districtName.name_mr)) : null;

  return (
    <form className="reg-form card-light" onSubmit={submit} noValidate ref={topRef} aria-labelledby="reg-title">
      <div className="reg-form__head">
        <h2 id="reg-title">{t("Durgotsav 2026 Registration", "दुर्गोत्सव २०२६ नोंदणी")}</h2>
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
              <fieldset className="span-2 type-picker" data-field="participant_type">
                <legend className="field__label">{t("Participation Type", "सहभागाचा प्रकार")}</legend>
                <div className="type-picker__options">
                  {Object.entries(participantTypes).map(([key, label]) => (
                    <label key={key} className={`type-option ${values.participant_type === key ? "is-checked" : ""}`}>
                      <input type="radio" name="participant_type" value={key} checked={values.participant_type === key} onChange={set("participant_type")} />
                      {label}
                    </label>
                  ))}
                </div>
              </fieldset>
              <div className="span-2" data-field="name">
                <Field
                  label={ORG_TYPES.has(values.participant_type) ? t("Representative's Full Name", "प्रतिनिधीचे पूर्ण नाव") : t("Full Name", "पूर्ण नाव")}
                  required
                  error={errors.name}
                  hint={t("This name will be printed on the certificate.", "अभिनंदन पत्रावर हेच नाव छापले जाईल.")}
                >
                  {(p) => <input {...p} className="input" value={values.name} onChange={set("name")} maxLength={150} autoComplete="name" />}
                </Field>
              </div>
              {ORG_TYPES.has(values.participant_type) && (
                <div className="span-2" data-field="organization_name">
                  <Field label={t("Organisation / Society / School Name", "संस्था / गृहसंकुल / शाळेचे नाव")} required error={errors.organization_name}>
                    {(p) => <input {...p} className="input" value={values.organization_name} onChange={set("organization_name")} maxLength={200} autoComplete="organization" />}
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
              <div data-field="district_id">
                <Field label={t("District", "जिल्हा")} required error={errors.district_id}>
                  {(p) => (
                    <select {...p} className="select" value={values.district_id} onChange={set("district_id")}>
                      <option value="">{t("Select District", "जिल्हा निवडा")}</option>
                      {districts.map((d) => <option key={d.id} value={d.id}>{lang === "mr" ? d.name_mr : (d.name_en || d.name_mr)}</option>)}
                    </select>
                  )}
                </Field>
              </div>
              <div data-field="city">
                <Field label={t("City / Village", "शहर / गाव")}>
                  {(p) => <input {...p} className="input" value={values.city} onChange={set("city")} maxLength={120} autoComplete="address-level2" />}
                </Field>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="form-grid">
              <div data-field="fort_id">
                <Field
                  label={t("Which fort's replica did you build?", "आपण कोणत्या दुर्गाची प्रतिकृती बनवली?")}
                  hint={t("Select a fort from the UNESCO list, or leave blank if it is another fort.", "युनेस्को यादीतील दुर्ग निवडा, किंवा इतर दुर्ग असल्यास रिकामे ठेवा.")}
                >
                  {(p) => (
                    <select {...p} className="select" value={values.fort_id} onChange={set("fort_id")}>
                      <option value="">{t("Other Fort / My Own Design", "इतर दुर्ग / माझी कल्पना")}</option>
                      {forts.map((f) => <option key={f.id} value={f.id}>{f.name_mr} ({f.name_en})</option>)}
                    </select>
                  )}
                </Field>
              </div>
              <div data-field="photo">
                <span className="field__label" id="photo-label">
                  {t("Your photo with the replica", "प्रतिकृतीसोबतचे आपले छायाचित्र")}
                  <span className="req" aria-hidden="true">*</span>
                </span>
                <div
                  className={`dropzone ${photo ? "has-photo" : ""} ${errors.photo ? "has-error" : ""}`}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => { e.preventDefault(); onPhoto(e.dataTransfer.files?.[0]); }}
                >
                  {photo ? (
                    <div className="dropzone__preview">
                      <img src={photo.preview} alt={t("Selected photo", "निवडलेले छायाचित्र")} />
                      <button type="button" className="btn btn--outline btn--sm" onClick={() => fileRef.current?.click()}>
                        <RefreshCw aria-hidden="true" /> {t("Choose a different photo", "दुसरे छायाचित्र")}
                      </button>
                    </div>
                  ) : (
                    <button type="button" className="dropzone__empty" onClick={() => fileRef.current?.click()} aria-describedby="photo-rules">
                      {preparing ? <Loader2 className="spin" aria-hidden="true" /> : <ImagePlus aria-hidden="true" />}
                      <strong>{preparing ? t("Preparing photo…", "छायाचित्र तयार करत आहे…") : t("Select or drag a photo here", "छायाचित्र निवडा किंवा येथे ओढा")}</strong>
                      <span>{t("You can take a photo directly with your mobile camera.", "मोबाईलवर कॅमेराने थेट फोटो काढू शकता")}</span>
                    </button>
                  )}
                  <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" aria-labelledby="photo-label" onChange={(e) => onPhoto(e.target.files?.[0])} tabIndex={-1} />
                </div>
                {errors.photo && <span className="field__error"><AlertCircle size={14} aria-hidden="true" />{errors.photo}</span>}
                <ul className="photo-rules" id="photo-rules">
                  <li>{t("Both you and your replica must be clearly visible in the photo.", "छायाचित्रात आपण व आपली प्रतिकृती दोन्ही स्पष्ट दिसावेत.")}</li>
                  <li>{t("Only a photo of a replica you built yourself — no internet images or edited photos.", "स्वतः बनवलेल्या प्रतिकृतीचेच छायाचित्र — इंटरनेटवरील / फेरफार केलेले नको.")}</li>
                  <li>JPG, PNG {t("or", "किंवा")} WebP · {t("Max", "कमाल")} {MAX_UPLOAD_MB} MB · {t("One registration per photo.", "एका छायाचित्राने एकच नोंदणी.")}</li>
                </ul>
              </div>
              <div data-field="replica_notes">
                <Field
                  label={t("Brief description of the replica (optional)", "प्रतिकृतीबद्दल थोडक्यात (ऐच्छिक)")}
                  hint={t("Materials used, participating members, etc.", "वापरलेले साहित्य, सहभागी सदस्य इ.")}
                >
                  {(p) => <textarea {...p} className="textarea" value={values.replica_notes} onChange={set("replica_notes")} maxLength={500} />}
                </Field>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="stack">
              <div className="review">
                {photo && <img src={photo.preview} alt="" className="review__photo" />}
                <dl>
                  <div><dt>{t("Type", "प्रकार")}</dt><dd>{participantTypes[values.participant_type]}</dd></div>
                  <div><dt>{t("Name", "नाव")}</dt><dd>{values.name}</dd></div>
                  {ORG_TYPES.has(values.participant_type) && <div><dt>{t("Organisation", "संस्था")}</dt><dd>{values.organization_name}</dd></div>}
                  <div><dt>{t("Mobile", "मोबाईल")}</dt><dd>{values.phone}</dd></div>
                  {values.email && <div><dt>{t("Email", "ईमेल")}</dt><dd>{values.email}</dd></div>}
                  <div><dt>{t("Location", "ठिकाण")}</dt><dd>{[values.city, districtLabel].filter(Boolean).join(", ")}</dd></div>
                  <div><dt>{t("Fort", "दुर्ग")}</dt><dd>{fortLabel || t("Other Fort", "इतर दुर्ग")}</dd></div>
                </dl>
              </div>
              <div data-field="consent">
                <label className="checkbox">
                  <input type="checkbox" checked={values.consent} onChange={set("consent")} aria-invalid={errors.consent ? true : undefined} />
                  <span>
                    {t(
                      <>I have read the <Link to="/rules" target="_blank">Durgotsav Code</Link> and <Link to="/terms" target="_blank">Terms</Link>. This replica was built by me / us and the information provided is true. I consent to this photo being displayed in the Durgotsav album after verification.</>,
                      <>मी <Link to="/rules" target="_blank">दुर्गोत्सव संहिता</Link> व <Link to="/terms" target="_blank">अटी</Link> वाचल्या आहेत. ही प्रतिकृती मी / आम्ही स्वतः तयार केली असून दिलेली माहिती सत्य आहे. पडताळणीनंतर हे छायाचित्र दुर्गोत्सव अल्बममध्ये प्रदर्शित करण्यास माझी संमती आहे.</>
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
          <button type="button" className="btn btn--primary" disabled style={{ cursor: "not-allowed" }}>
            {t("Coming soon", "लवकरच येत आहे")}
          </button>
        ) : (
          <button type="submit" className="btn btn--primary" disabled={progress !== null}>
            {progress !== null
              ? <><Loader2 className="spin" aria-hidden="true" /> {t(`Uploading ${progress}%`, `अपलोड ${progress}%`)}</>
              : <>{t("Complete Registration", "नोंदणी पूर्ण करा")} <Check aria-hidden="true" /></>}
          </button>
        )}
      </div>
    </form>
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
      <p>{t("Thank you for participating in Durgotsav 2026. Your registration number:", "दुर्गोत्सव २०२६ मध्ये सहभागी झाल्याबद्दल धन्यवाद. आपला नोंदणी क्रमांक:")}</p>
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
