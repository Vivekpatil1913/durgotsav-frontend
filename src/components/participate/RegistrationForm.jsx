import { AlertCircle, Camera, Check, CheckCircle2, Clock, Copy, ImagePlus, Loader2, Pencil, RefreshCw, Send, Smartphone, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { EDITION_YEAR, EDITION_YEAR_MR } from "../../config/edition.js";
import { useLang, useT } from "../../context/LanguageContext.jsx";
import { useSite } from "../../context/SiteContext.jsx";
import { useApi } from "../../hooks/useApi.js";
import { http, toApiError } from "../../lib/api.js";
import { mr } from "../../lib/format.js";
import { MAX_UPLOAD_MB, preparePhoto } from "../../lib/image.js";
import "../certificate/certificate.css";
import { Modal } from "../ui/Modal.jsx";
import { Captcha } from "./Captcha.jsx";
import { CustomSelect, digitsOnly, Field } from "./fields.jsx";
import { FrameShare, PHOTO_RULE, PhotoExamples } from "./PhotoGuide.jsx";
import { spokenDigits, VoiceButton, VoiceLanguage } from "./VoiceInput.jsx";
import "./registration.css";

// SRS v2.1 §2: one page, no steps. Name (a person, organisation, family or society — one field), mobile, optional
// WhatsApp and email, district, photo, consent, then "I am not a robot" and Submit → check-your-details pop-up →
// "registered" pop-up. The certificate is generated once an admin approves the registration; the participant follows
// it on their own status page (/c/<token>, also sent by SMS). Any number of registrations may use one mobile number.
const NAME_MAX = 150;
const EMPTY = { name: "", phone: "", whatsapp_number: "", whatsapp_same: false, email: "", district_id: "", consent: false, website: "" };
// Kept for "Register another": the same person often registers more replicas with the same number
const KEEP_FOR_NEXT = ["phone", "whatsapp_number", "whatsapp_same", "email", "district_id"];
const FIELD_ORDER = ["name", "phone", "whatsapp_number", "email", "district_id", "photo", "consent", "captcha"];

// One id per form fill, sent with every submit attempt so a retry after a dropped connection
// returns the registration already saved instead of creating a second one.
const newSubmissionId = () =>
  globalThis.crypto?.randomUUID?.() ??
  "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) => (c ^ (Math.random() * 16) >> (c / 4)).toString(16));

// While "same as mobile" is ticked the WhatsApp box mirrors the mobile number; unticking brings back what was typed there.
const whatsappOf = (v) => (v.whatsapp_same ? v.phone : v.whatsapp_number);

function validate(v, photo, t) {
  const e = {};
  if (v.name.trim().length < 2) {
    e.name = t("Please enter the full name, or the name of the organisation / family / society.", "कृपया पूर्ण नाव, किंवा संस्था / कुटुंब / सोसायटीचे नाव लिहा.");
  }
  if (!/^[6-9]\d{9}$/.test(v.phone)) e.phone = t("Enter a valid 10-digit mobile number (starting with 6, 7, 8 or 9).", "१० अंकी मोबाईल क्रमांक लिहा (६, ७, ८ किंवा ९ ने सुरू होणारा).");
  if (!v.whatsapp_same && v.whatsapp_number && !/^[6-9]\d{9}$/.test(v.whatsapp_number)) {
    e.whatsapp_number = t("Enter a valid 10-digit WhatsApp number, or leave it blank.", "१० अंकी WhatsApp क्रमांक लिहा, किंवा रिकामे ठेवा.");
  }
  // optional (SRS v2.1 REQ-01), but checked when given
  if (v.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email.trim())) e.email = t("Email address is invalid — correct it or leave it blank.", "ईमेल पत्ता योग्य नाही — दुरुस्त करा किंवा रिकामा ठेवा.");
  if (!v.district_id) e.district_id = t("Please select your district.", "आपला जिल्हा निवडा.");
  if (!photo) e.photo = t("Please select a photo of your replica with its builder(s).", "प्रतिकृती व ती घडवणाऱ्यांचा फोटो निवडा.");
  if (!v.consent) e.consent = t("You must accept the rules to proceed.", "पुढे जाण्यासाठी नियम मान्य करणे आवश्यक आहे.");
  return e;
}

export function RegistrationForm() {
  const t = useT();
  const { lang } = useLang();
  const { settings } = useSite();
  // null: the API has the check switched off (automated tests); otherwise { provider, site_key }
  const captchaConfig = settings.captcha ?? null;
  const districts = useApi("/districts").data?.data ?? [];
  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [photo, setPhoto] = useState(null);
  const [preparing, setPreparing] = useState(false);
  const [progress, setProgress] = useState(null);
  const [formError, setFormError] = useState("");
  const [captchaToken, setCaptchaToken] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const [result, setResult] = useState(null);
  const [resultOpen, setResultOpen] = useState(false);
  const [voiceLang, setVoiceLang] = useState(lang === "mr" ? "mr-IN" : "en-IN");
  const [voiceNote, setVoiceNote] = useState("");
  const formRef = useRef(null);
  const fileRef = useRef(null);
  const whatsappRef = useRef(null);
  const captchaRef = useRef(null);
  const photoRef = useRef(photo);
  photoRef.current = photo;
  const submissionId = useRef(newSubmissionId());

  const whatsapp = whatsappOf(values);
  const captchaOk = !captchaConfig || Boolean(captchaToken);
  const busy = progress !== null;

  // The preview is revoked when replaced/removed; this frees whatever is left on unmount.
  useEffect(() => () => photoRef.current && URL.revokeObjectURL(photoRef.current.preview), []);

  const setField = (name, value) => {
    setValues((v) => ({ ...v, [name]: value }));
    if (errors[name]) setErrors((er) => ({ ...er, [name]: undefined }));
  };
  const set = (name) => (e) => {
    const value = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setField(name, name === "phone" || name === "whatsapp_number" ? digitsOnly(value, 10) : value);
  };

  function setWhatsappSame(e) {
    const same = e.target.checked;
    setValues((v) => ({ ...v, whatsapp_same: same }));
    setErrors((er) => ({ ...er, whatsapp_number: undefined }));
    // unticked: the numbers differ, so take the participant straight to the WhatsApp box
    if (!same) requestAnimationFrame(() => whatsappRef.current?.focus());
  }

  function onCaptcha(token) {
    setCaptchaToken(token);
    if (token) setErrors((er) => ({ ...er, captcha: undefined }));
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

  const focusFirstError = (errs) => {
    const first = FIELD_ORDER.find((f) => errs[f]);
    requestAnimationFrame(() => {
      const box = formRef.current?.querySelector(`[data-field="${first}"]`);
      box?.scrollIntoView({ behavior: "smooth", block: "center" });
      box?.querySelector("input:not([type=file]), button, iframe")?.focus({ preventScroll: true });
    });
  };

  // Submit is blocked until "I am not a robot" is ticked (SRS §3); a blocked click explains why, in the page language
  function onSubmit(e) {
    e.preventDefault();
    if (busy || confirming) return;
    const errs = validate(values, photo, t);
    if (!captchaOk) errs.captcha = t("Please tick 'I am not a robot' (मी रोबोट नाही) to continue.", "कृपया पुढे पाठवण्यासाठी 'मी रोबोट नाही' (I am not a robot) निवडा.");
    setErrors(errs);
    if (Object.keys(errs).length) return focusFirstError(errs);
    setFormError("");
    setConfirming(true);
  }

  // Errors the API sends back, put next to their fields in the page language
  function showServerError(err) {
    const apiErr = toApiError(err);
    const next = {};
    if (apiErr.code === "CAPTCHA_REQUIRED" || apiErr.code === "CAPTCHA_FAILED") {
      next.captcha = t("The 'I am not a robot' check expired. Please tick it again and submit.", "'मी रोबोट नाही' तपासणीची मुदत संपली. कृपया पुन्हा खूण करून सबमिट करा.");
    } else if (apiErr.code === "CAPTCHA_UNAVAILABLE") {
      next.captcha = t("The security check could not be completed. Please try again in a moment.", "सुरक्षा तपासणी पूर्ण होऊ शकली नाही. कृपया थोड्या वेळाने पुन्हा प्रयत्न करा.");
    } else if (apiErr.code === "REGISTRATION_CLOSED") {
      setFormError(t("Registration is closed right now.", "नोंदणी सध्या बंद आहे."));
    } else if (apiErr.status === 429) {
      setFormError(t("Too many registrations from this network. Please try again later.", "या नेटवर्कवरून खूप नोंदणी झाल्या. कृपया थोड्या वेळाने पुन्हा प्रयत्न करा."));
    } else {
      const own = validate(values, photo, t);
      for (const [field, message] of Object.entries(apiErr.details ?? {})) {
        if (FIELD_ORDER.includes(field) && typeof message === "string") next[field] = own[field] ?? message;
      }
      if (!Object.keys(next).length) setFormError(apiErr.message || t("An error occurred during registration.", "नोंदणी करताना अडचण आली."));
    }
    setErrors((er) => ({ ...er, ...next }));
    if (Object.keys(next).length) focusFirstError(next);
  }

  async function send() {
    if (busy) return;
    const body = new FormData();
    body.append("name", values.name.trim());
    body.append("phone", values.phone);
    if (whatsapp) body.append("whatsapp_number", whatsapp);
    if (values.email.trim()) body.append("email", values.email.trim());
    body.append("country", "India");
    body.append("district_id", values.district_id);
    body.append("consent", "true");
    body.append("website", values.website);
    body.append("submission_id", submissionId.current);
    if (captchaToken) body.append("captcha_token", captchaToken);
    body.append("photo", photo.file);

    setFormError("");
    setProgress(0);
    try {
      const { data } = await http.post("/registrations", body, {
        timeout: 120000,
        onUploadProgress: (p) => p.total && setProgress(Math.round((p.loaded / p.total) * 100)),
      });
      setResult(data.data);
      setResultOpen(true);
      setConfirming(false);
    } catch (err) {
      setConfirming(false);
      showServerError(err);
    } finally {
      setProgress(null);
      // A token is good for one submit: ask for a fresh tick before the next one
      captchaRef.current?.reset();
    }
  }

  function registerAnother() {
    submissionId.current = newSubmissionId();
    setValues((v) => ({ ...EMPTY, ...Object.fromEntries(KEEP_FOR_NEXT.map((k) => [k, v[k]])) }));
    replacePhoto(null);
    setErrors({});
    setResult(null);
    setResultOpen(false);
    requestAnimationFrame(() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  const district = districts.find((d) => String(d.id) === String(values.district_id));
  const districtLabel = district ? (lang === "mr" ? district.name_mr : (district.name_en || district.name_mr)) : "";

  if (result) {
    return (
      <>
        <Success result={result} email={values.email.trim()} onAnother={registerAnother} />
        <Modal open={resultOpen} onClose={() => setResultOpen(false)} labelledBy="reg-done-title" className="modal--result">
          <Success result={result} email={values.email.trim()} onAnother={registerAnother} inModal />
        </Modal>
      </>
    );
  }

  return (
    <>
      <PhotoExamples />
      <form className="reg-form card-light" onSubmit={onSubmit} noValidate ref={formRef} aria-labelledby="reg-title">
        <div className="reg-form__head">
          <h2 id="reg-title">{t(`Durgotsav ${EDITION_YEAR} Registration`, `दुर्गोत्सव ${EDITION_YEAR_MR} नोंदणी`)}</h2>
          <p className="muted reg-form__lead">
            {t(
              "Fill in this one page and submit. Once AMRUT has checked your photo and details, your certificate is ready to download and its link comes by SMS. One mobile number can be used for any number of registrations.",
              "हे एकच पान भरून सबमिट करा. अमृत संस्थेकडून छायाचित्र व माहितीची पडताळणी झाल्यावर आपले अभिनंदन पत्र डाउनलोड करता येईल आणि त्याची लिंक SMS ने मिळेल. एका मोबाईल क्रमांकावरून कितीही नोंदणी करता येतात.",
            )}
          </p>
          <VoiceLanguage value={voiceLang} onChange={setVoiceLang} />
          {voiceNote && <p className="voice-lang__note" role="status">{voiceNote}</p>}
        </div>

        {formError && (
          <div className="alert alert--error" role="alert"><AlertCircle aria-hidden="true" /><span>{formError}</span></div>
        )}

        <input type="text" name="website" value={values.website} onChange={set("website")} tabIndex={-1} autoComplete="off" className="sr-only" aria-hidden="true" />

        <div className="form-grid form-grid--2">
          <div className="span-2" data-field="name">
            <Field
              label={t("Full Name / Organisation / Family / Society", "पूर्ण नाव / संस्था / कुटुंब / सोसायटी")}
              required
              error={errors.name}
              hint={t("This name will be printed on the certificate exactly as written here.", "अभिनंदन पत्रावर हेच नाव जसेच्या तसे छापले जाईल.")}
            >
              {(p) => (
                <div className="input-voice">
                  <input {...p} className="input" value={values.name} onChange={set("name")} maxLength={NAME_MAX} autoComplete="name"
                    placeholder={t("e.g. Rahul Patil / Patil Family / Shivneri Housing Society", "उदा. राहुल पाटील / पाटील परिवार / शिवनेरी गृहनिर्माण संस्था")} />
                  <VoiceButton
                    lang={voiceLang}
                    label={t("Speak the name", "नाव बोलून भरा")}
                    onError={setVoiceNote}
                    onText={(text) => {
                      setVoiceNote("");
                      setField("name", `${values.name.trim()} ${text}`.trim().slice(0, NAME_MAX));
                    }}
                  />
                </div>
              )}
            </Field>
          </div>

          <div data-field="phone">
            <Field label={t("Mobile Number", "मोबाईल क्रमांक")} required error={errors.phone}
              hint={t("The certificate link is sent here by SMS.", "अभिनंदन पत्राची लिंक या क्रमांकावर SMS ने पाठवली जाईल.")}>
              {(p) => (
                <div className="input-voice">
                  <input {...p} className="input" type="tel" inputMode="numeric" value={values.phone} onChange={set("phone")} placeholder={t("10-digit number", "१० अंकी क्रमांक")} autoComplete="tel-national" />
                  <VoiceButton
                    lang={voiceLang}
                    label={t("Speak the mobile number", "मोबाईल क्रमांक बोलून भरा")}
                    onError={setVoiceNote}
                    onText={(text) => {
                      setVoiceNote("");
                      setField("phone", digitsOnly(spokenDigits(text), 10));
                    }}
                  />
                </div>
              )}
            </Field>
            <label className="checkbox whatsapp-same">
              <input type="checkbox" checked={values.whatsapp_same} onChange={setWhatsappSame} />
              <span>{t("My WhatsApp number is the same as my mobile number", "माझा WhatsApp क्रमांक व मोबाईल क्रमांक एकच आहे")}</span>
            </label>
          </div>
          <div data-field="whatsapp_number">
            <Field
              label={`${t("WhatsApp Number", "WhatsApp क्रमांक")} ${t("(optional)", "(ऐच्छिक)")}`}
              error={errors.whatsapp_number}
              hint={values.whatsapp_same
                ? t("Filled from your mobile number. Untick the box to enter a different one.", "मोबाईल क्रमांकावरून भरला आहे. वेगळा क्रमांक लिहिण्यासाठी खूण काढा.")
                : t("Leave blank if you don't use WhatsApp.", "WhatsApp वापरत नसल्यास रिकामे ठेवा.")}
            >
              {(p) => (
                <input {...p} ref={whatsappRef} className="input" type="tel" inputMode="numeric" value={whatsapp} onChange={set("whatsapp_number")}
                  readOnly={values.whatsapp_same} placeholder={t("10-digit number", "१० अंकी क्रमांक")} autoComplete="off" />
              )}
            </Field>
          </div>

          <div data-field="email">
            <Field
              label={`${t("Email", "ईमेल")} ${t("(optional)", "(ऐच्छिक)")}`}
              error={errors.email}
              hint={t("If given, the certificate is also emailed to you.", "ईमेल दिल्यास अभिनंदन पत्र ईमेलवरही पाठवले जाईल.")}
            >
              {(p) => <input {...p} className="input" type="email" inputMode="email" value={values.email} onChange={set("email")} maxLength={160} autoComplete="email" placeholder="name@example.com" />}
            </Field>
          </div>
          <div data-field="district_id">
            <Field label={t("District", "जिल्हा")} required error={errors.district_id}>
              {(p) => (
                <CustomSelect
                  {...p}
                  value={values.district_id}
                  placeholder={t("Select District", "जिल्हा निवडा")}
                  options={districts.map((d) => ({ value: d.id, label: lang === "mr" ? d.name_mr : (d.name_en || d.name_mr) }))}
                  onValueChange={(id) => setField("district_id", id)}
                />
              )}
            </Field>
          </div>

          <div className="span-2" data-field="photo">
            <section className="photo-guide" aria-labelledby="photo-guide-title">
              <header className="photo-guide__head">
                <span className="photo-guide__icon"><Camera aria-hidden="true" /></span>
                <div>
                  <h3 id="photo-guide-title">{t("Before you upload your replica photo", "दुर्ग प्रतिकृतीचा फोटो अपलोड करताना घ्यावयाची काळजी")}</h3>
                  <span className="photo-guide__tag">{t("About 75% fort replica · 25% you / your team", "सुमारे ७५% दुर्ग प्रतिकृती · २५% आपण / आपली टीम")}</span>
                </div>
              </header>
              <FrameShare guide={PHOTO_RULE} />
              <ul className="photo-guide__rules" id="photo-rules">
                <li><Check aria-hidden="true" />{t("The replica fills most of the frame; you or your team stand beside it (a selfie works).", "फोटोचा बहुतांश भाग प्रतिकृतीने व्यापलेला असावा; आपण किंवा आपली टीम बाजूला उभे असावे (सेल्फीही चालेल).")}</li>
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

          <div className="span-2" data-field="consent">
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

        {/* SRS §3: immediately above Submit */}
        <div className="reg-form__submit">
          <Captcha ref={captchaRef} config={captchaConfig} onChange={onCaptcha} invalid={Boolean(errors.captcha)} />
          {errors.captcha && (
            <div className="alert alert--error" role="alert" id="captcha-required"><AlertCircle aria-hidden="true" /><span>{errors.captcha}</span></div>
          )}
          <button
            type="submit"
            className={`btn btn--primary btn--lg reg-submit ${captchaOk ? "" : "is-blocked"}`}
            disabled={preparing || busy}
            aria-describedby={captchaOk ? undefined : "captcha-hint"}
          >
            <Send aria-hidden="true" /> {t("Submit", "सबमिट करा")}
          </button>
          {!captchaOk && (
            <span className="field__hint" id="captcha-hint">
              {t("Tick “I am not a robot” above to enable Submit.", "सबमिट करण्यासाठी वरील “मी रोबोट नाही” वर खूण करा.")}
            </span>
          )}
        </div>
      </form>

      <Modal open={confirming} onClose={() => setConfirming(false)} labelledBy="confirm-title" dismissable={!busy} className="modal--confirm">
        <h2 id="confirm-title" className="modal__title">{t("Is the name correct? Please check", "नाव बरोबर आहे का ते तपासा")}</h2>
        <p className="modal__lead">{t("Check all the details once more — after verification the certificate is made from them.", "कृपया सर्व माहिती तपासा — पडताळणीनंतर याच माहितीवरून आपले अभिनंदन पत्र तयार होईल.")}</p>
        <div className="confirm-name">
          <span>{t("Name printed on the certificate", "अभिनंदन पत्रावर छापले जाणारे नाव")}</span>
          <strong>{values.name.trim()}</strong>
        </div>
        <div className="review">
          <div className="review__photos">{photo && <img src={photo.preview} alt="" className="review__photo" />}</div>
          <dl>
            <div><dt>{t("Mobile", "मोबाईल")}</dt><dd>{values.phone}</dd></div>
            {whatsapp && <div><dt>WhatsApp</dt><dd>{whatsapp}</dd></div>}
            <div><dt>{t("Email", "ईमेल")}</dt><dd>{values.email.trim() || "—"}</dd></div>
            <div><dt>{t("District", "जिल्हा")}</dt><dd>{districtLabel}</dd></div>
          </dl>
        </div>
        {busy && (
          <div className="stack" style={{ gap: 6 }}>
            <div className="upload-progress" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label={t("Upload progress", "अपलोड प्रगती")}>
              <span style={{ width: `${progress}%` }} />
            </div>
            <span className="field__hint" aria-live="polite">
              {progress < 100 ? t(`Uploading ${progress}%`, `अपलोड ${mr(progress)}%`) : t("Saving your registration…", "आपली नोंदणी जतन करत आहे…")}
            </span>
          </div>
        )}
        <div className="modal__actions">
          <button type="button" className="btn btn--outline" onClick={() => setConfirming(false)} disabled={busy}>
            <Pencil aria-hidden="true" /> {t("Edit details", "माहिती दुरुस्त करा")}
          </button>
          <button type="button" className="btn btn--primary" onClick={send} disabled={busy} autoFocus>
            {busy ? <Loader2 className="spin" aria-hidden="true" /> : <Check aria-hidden="true" />} {t("Yes, all correct — Submit", "होय, माहिती बरोबर आहे — सबमिट करा")}
          </button>
        </div>
      </Modal>
    </>
  );
}

// After a successful submit: shown in the pop-up (inModal) and, once that is closed, on the page. The certificate is
// not there yet — it is generated when an admin approves the registration; the status link follows it.
function Success({ result, email, onAnother, inModal = false }) {
  const t = useT();
  const [copied, setCopied] = useState(false);
  const cardRef = useRef(null);
  // The card replaces the much taller form, so the old scroll position would land below it — bring it into view once mounted.
  // Braces matter: newer browsers return a Promise from scrollIntoView, and React would call it as the effect's cleanup and crash.
  useEffect(() => {
    if (!inModal) cardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [inModal]);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(result.registration_no);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked — number is visible anyway */
    }
  };
  const Title = inModal ? "h2" : "h3";
  return (
    <div ref={cardRef} className={inModal ? "reg-success reg-success--modal" : "reg-success card-light"} role={inModal ? undefined : "status"}>
      <span className="reg-success__icon"><CheckCircle2 aria-hidden="true" /></span>
      <Title id={inModal ? "reg-done-title" : undefined}>{t("Registration Successful! Jai Bhavani, Jai Shivaji!", "नोंदणी यशस्वी! जय भवानी, जय शिवाजी!")}</Title>
      <p>
        {t(
          `Thank you for taking part in Durgotsav ${EDITION_YEAR}. AMRUT will now check your photo and details; once verified, your certificate will be ready to download.`,
          `दुर्गोत्सव ${EDITION_YEAR_MR} मध्ये सहभागी झाल्याबद्दल धन्यवाद. अमृत संस्था आता आपले छायाचित्र व माहितीची पडताळणी करेल; पडताळणी पूर्ण झाल्यावर आपले अभिनंदन पत्र डाउनलोड करता येईल.`,
        )}
      </p>
      <dl className="cert-facts">
        <div>
          <dt>{t("Registration number", "नोंदणी क्रमांक")}</dt>
          <dd>
            {result.registration_no}
            <button type="button" className="copy-btn" onClick={copy} aria-label={copied ? t("Copied", "कॉपी झाले") : t("Copy registration number", "नोंदणी क्रमांक कॉपी करा")}>
              {copied ? <Check size={15} aria-hidden="true" /> : <Copy size={15} aria-hidden="true" />}
            </button>
          </dd>
        </div>
        <div>
          <dt>{t("Status", "स्थिती")}</dt>
          <dd className="cert-facts__status"><Clock size={16} aria-hidden="true" /> {t("Verification pending", "पडताळणी प्रलंबित")}</dd>
        </div>
      </dl>
      <p className="muted reg-success__note">
        <Smartphone size={16} aria-hidden="true" />
        <span>
          {email
            ? t("A confirmation with your status link has been sent to your mobile by SMS. After verification you will get the certificate link by SMS and the certificate by email.", "नोंदणीची स्थिती पाहण्याची लिंक आपल्या मोबाईलवर SMS ने पाठवली आहे. पडताळणीनंतर अभिनंदन पत्राची लिंक SMS ने आणि अभिनंदन पत्र ईमेलवर मिळेल.")
            : t("A confirmation with your status link has been sent to your mobile by SMS. After verification you will get the certificate link by SMS.", "नोंदणीची स्थिती पाहण्याची लिंक आपल्या मोबाईलवर SMS ने पाठवली आहे. पडताळणीनंतर अभिनंदन पत्राची लिंक SMS ने मिळेल.")}
        </span>
      </p>
      <div className="cluster" style={{ justifyContent: "center" }}>
        <Link to={`/c/${result.token}`} className="btn btn--primary">
          <Clock aria-hidden="true" /> {t("View registration status", "नोंदणीची स्थिती पाहा")}
        </Link>
        <button type="button" className="btn btn--outline" onClick={onAnother}>
          {t("Register Another", "आणखी एक नोंदणी करा")}
        </button>
      </div>
    </div>
  );
}
