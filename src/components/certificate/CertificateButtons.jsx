import { AlertCircle, Download, FileImage, Loader2 } from "lucide-react";
import { useState } from "react";
import { useT } from "../../context/LanguageContext.jsx";
import { toApiError } from "../../lib/api.js";
import { downloadCertificate } from "../../lib/download.js";
import "./certificate.css";

// Download failures in the participant's language (the API answers in English)
export function certificateError(err, t) {
  const e = toApiError(err);
  if (e.code === "NOT_VERIFIED") {
    return t("This registration has not been verified yet. The certificate will be available once AMRUT has verified it.", "या नोंदणीची पडताळणी अद्याप झालेली नाही. पडताळणी पूर्ण झाल्यावर अभिनंदन पत्र उपलब्ध होईल.");
  }
  if (e.code === "NOT_AVAILABLE") {
    return t("This certificate is not available right now. Check the registration status for the reason.", "हे अभिनंदन पत्र सध्या उपलब्ध नाही. कारणासाठी नोंदणीची स्थिती पाहा.");
  }
  if (e.status === 404) return t("This certificate link is not valid.", "ही अभिनंदन पत्राची लिंक वैध नाही.");
  if (e.status === 429) return t("Too many downloads. Please try again in a few minutes.", "खूप वेळा डाउनलोड झाले. कृपया काही मिनिटांनी पुन्हा प्रयत्न करा.");
  return e.message;
}

/**
 * PDF and high-resolution image (JPG) of one certificate, from its signed link.
 * primary: label of the PDF button ("Get certificate" in the pop-up after registration).
 */
export function CertificateButtons({ token, primary, size = "" }) {
  const t = useT();
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState("");
  async function get(format) {
    setBusy(format);
    setError("");
    try {
      await downloadCertificate(token, format);
    } catch (err) {
      setError(certificateError(err, t));
    } finally {
      setBusy(null);
    }
  }
  const sm = size === "sm" ? " btn--sm" : "";
  return (
    <div className="cert-buttons">
      <button type="button" className={`btn btn--primary${sm}`} onClick={() => get("pdf")} disabled={Boolean(busy)}>
        {busy === "pdf" ? <Loader2 className="spin" aria-hidden="true" /> : <Download aria-hidden="true" />}
        {primary ?? t("Download PDF", "PDF डाउनलोड करा")}
      </button>
      <button type="button" className={`btn btn--outline${sm}`} onClick={() => get("jpg")} disabled={Boolean(busy)}>
        {busy === "jpg" ? <Loader2 className="spin" aria-hidden="true" /> : <FileImage aria-hidden="true" />}
        {t("Image (JPG)", "प्रतिमा (JPG)")}
      </button>
      {error && <p className="field__error cert-buttons__error" role="alert"><AlertCircle size={14} aria-hidden="true" />{error}</p>}
    </div>
  );
}
