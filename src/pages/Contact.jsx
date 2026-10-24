import { AlertCircle, CheckCircle2, Clock, Loader2, Mail, MapPin, MessageCircle, Phone, Send } from "lucide-react";
import { useState } from "react";
import { Field } from "../components/participate/fields.jsx";
import "../components/participate/registration.css";
import { StatsBand } from "../components/home/HomeSections.jsx";
import { Seo } from "../components/seo/Seo.jsx";
import { PageHero } from "../components/ui/PageParts.jsx";
import { EDITION_YEAR, EDITION_YEAR_MR } from "../config/edition.js";
import { useLang, useT } from "../context/LanguageContext.jsx";
import { useSite } from "../context/SiteContext.jsx";
import { http, toApiError } from "../lib/api.js";
import "./pages.css";

const EMPTY = { name: "", email: "", phone: "", subject: "", message: "", website: "" };

export default function Contact() {
  const { settings } = useSite();
  const t = useT();
  const { lang } = useLang();
  const c = settings.contact ?? {};
  const [v, setV] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState({ busy: false, done: false, error: "" });
  const set = (k) => (e) => setV((s) => ({ ...s, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    const errs = {};
    if (v.name.trim().length < 2) errs.name = t("Please enter your name.", "नाव लिहा.");
    if (!v.email.trim() && !v.phone.trim()) errs.email = t("Please provide an email or phone number.", "ईमेल किंवा फोन क्रमांक द्या.");
    if (v.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email)) errs.email = t("Email address is invalid.", "ईमेल पत्ता योग्य नाही.");
    if (v.phone && !/^\+?\d{10,13}$/.test(v.phone.replace(/\s/g, ""))) errs.phone = t("Phone number is invalid.", "फोन क्रमांक योग्य नाही.");
    if (v.message.trim().length < 10) errs.message = t("Please write a message of at least 10 characters.", "किमान १० अक्षरांचा संदेश लिहा.");
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setStatus({ busy: true, done: false, error: "" });
    try {
      await http.post("/contact", { ...v, phone: v.phone.replace(/\s/g, "") });
      setStatus({ busy: false, done: true, error: "" });
      setV(EMPTY);
    } catch (err) {
      const apiErr = toApiError(err);
      setErrors(apiErr.details || {});
      setStatus({ busy: false, done: false, error: apiErr.message });
    }
  }

  return (
    <>
      <Seo
        title={t("Contact & Help", "संपर्क व मदत")}
        description={t(
          `Durgotsav ${EDITION_YEAR} — contact AMRUT for help with registration, photo upload or certificate.`,
          `दुर्गोत्सव ${EDITION_YEAR_MR} — नोंदणी, छायाचित्र अपलोड किंवा अभिनंदन पत्राविषयी मदतीसाठी अमृत संस्थेशी संपर्क साधा.`
        )}
      />
      <PageHero
        eyebrow={t("Helpline", "हेल्पलाइन")}
        title={t("Contact & Help", "संपर्क व मदत")}
        lead={t(
          "If you face a technical issue while uploading your photo or have any questions, let us know.",
          "छायाचित्र अपलोड करताना तांत्रिक अडचण आल्यास किंवा कोणताही प्रश्न असल्यास आम्हाला कळवा."
        )}
      />
      <section className="section surface-parchment">
        <div className="container contact-layout">
          <aside className="stack contact-info" aria-label={t("Contact details", "संपर्क तपशील")}>
            {c.phone && (
              <a className="contact-tile" href={`tel:${c.phone.replace(/\s/g, "")}`}>
                <Phone aria-hidden="true" />
                <span><small>{t("Phone", "फोन")}</small>{c.phone}</span>
              </a>
            )}
            {c.whatsapp && (
              <a className="contact-tile" href={`https://wa.me/${c.whatsapp}`} target="_blank" rel="noopener noreferrer">
                <MessageCircle aria-hidden="true" />
                <span><small>WhatsApp</small>{t("Send a message", "संदेश पाठवा")}</span>
              </a>
            )}
            {c.email && (
              <a className="contact-tile" href={`mailto:${c.email}`}>
                <Mail aria-hidden="true" />
                <span><small>{t("Email", "ईमेल")}</small>{c.email}</span>
              </a>
            )}
            {c.hours && (
              <div className="contact-tile">
                <Clock aria-hidden="true" />
                <span><small>{t("Hours", "वेळ")}</small>{c.hours}</span>
              </div>
            )}
            {(lang === "mr" ? c.address : (c.address_en || c.address)) && (
              <div className="contact-tile">
                <MapPin aria-hidden="true" />
                <span><small>{t("Address", "पत्ता")}</small>{lang === "mr" ? c.address : (c.address_en || c.address)}</span>
              </div>
            )}
          </aside>
          <form className="card-light stack" onSubmit={submit} noValidate aria-labelledby="contact-title">
            <h2 id="contact-title" className="contact-title">{t("Write to Us", "आम्हाला लिहा")}</h2>
            {status.done && (
              <div className="alert alert--success" role="status">
                <CheckCircle2 aria-hidden="true" />
                <span>{t("Thank you! We received your message. We will contact you soon.", "धन्यवाद! आपला संदेश मिळाला. आम्ही लवकरच संपर्क साधू.")}</span>
              </div>
            )}
            {status.error && (
              <div className="alert alert--error" role="alert">
                <AlertCircle aria-hidden="true" />
                <span>{status.error}</span>
              </div>
            )}
            <input type="text" name="website" value={v.website} onChange={set("website")} tabIndex={-1} autoComplete="off" className="sr-only" aria-hidden="true" />
            <div className="form-grid form-grid--2">
              <div className="span-2">
                <Field label={t("Name", "नाव")} required error={errors.name}>
                  {(p) => <input {...p} className="input" value={v.name} onChange={set("name")} autoComplete="name" maxLength={150} />}
                </Field>
              </div>
              <Field label={t("Email", "ईमेल")} error={errors.email}>
                {(p) => <input {...p} className="input" type="email" value={v.email} onChange={set("email")} autoComplete="email" maxLength={160} />}
              </Field>
              <Field label={t("Phone", "फोन")} error={errors.phone}>
                {(p) => <input {...p} className="input" type="tel" value={v.phone} onChange={set("phone")} autoComplete="tel" maxLength={15} />}
              </Field>
              <div className="span-2">
                <Field label={t("Subject", "विषय")} error={errors.subject}>
                  {(p) => <input {...p} className="input" value={v.subject} onChange={set("subject")} maxLength={200} placeholder={t("e.g. Photo upload not working", "उदा. छायाचित्र अपलोड होत नाही")} />}
                </Field>
              </div>
              <div className="span-2">
                <Field
                  label={t("Message", "संदेश")}
                  required
                  error={errors.message}
                  hint={t("If you have already registered, please include your registration number.", "नोंदणी केली असल्यास नोंदणी क्रमांक लिहा.")}
                >
                  {(p) => <textarea {...p} className="textarea" rows={5} value={v.message} onChange={set("message")} maxLength={4000} />}
                </Field>
              </div>
            </div>
            <div>
              <button type="submit" className="btn btn--primary" disabled={status.busy}>
                {status.busy ? <Loader2 className="spin" aria-hidden="true" /> : <Send aria-hidden="true" />}
                {" "}{t("Send Message", "संदेश पाठवा")}
              </button>
            </div>
          </form>
        </div>
      </section>
      <StatsBand />
    </>
  );
}
