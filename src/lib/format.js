import { API_URL } from "./api.js";

const DIGITS = "०१२३४५६७८९";
export const mr = (value) => String(value ?? "").replace(/\d/g, (d) => DIGITS[d]);

const numberFmt = new Intl.NumberFormat("mr-IN");
export const mrNumber = (n) => numberFmt.format(Number(n) || 0);

export function mrDate(value, opts = { day: "numeric", month: "long", year: "numeric" }) {
  if (!value) return "";
  const d = new Date(value.length === 10 ? `${value}T00:00:00+05:30` : value);
  return new Intl.DateTimeFormat("mr-IN", { timeZone: "Asia/Kolkata", ...opts }).format(d);
}

export function enDate(value, opts = { day: "numeric", month: "long", year: "numeric" }) {
  if (!value) return "";
  const d = new Date(value.length === 10 ? `${value}T00:00:00+05:30` : value);
  return new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", ...opts }).format(d);
}

// Uploaded files live on the API host; everything else is in the website's /public folder.
export const assetUrl = (path) => {
  if (!path) return "";
  if (/^https?:\/\//.test(path)) return path;
  return path.startsWith("/uploads/") ? `${API_URL}${path}` : path;
};

export const FORT_TYPES = {
  hill: "गिरिदुर्ग",
  "hill-forest": "गिरि-वनदुर्ग",
  coastal: "सागरी दुर्ग",
  island: "जलदुर्ग",
};

export const FORT_TYPES_EN = {
  hill: "Hill Fort",
  "hill-forest": "Hill-Forest Fort",
  coastal: "Coastal Fort",
  island: "Island Fort",
};

export const PARTICIPANT_TYPES = {
  individual: "वैयक्तिक",
  family: "कुटुंब",
  housing_society: "गृहसंकुल",
  organization: "संस्था",
  group: "गट / मंडळ",
  school: "शाळा",
  college: "महाविद्यालय",
};

export const PARTICIPANT_TYPES_EN = {
  individual: "Individual",
  family: "Family",
  housing_society: "Housing Society",
  organization: "Organization",
  group: "Group / Association",
  school: "School",
  college: "College",
};

export const STATUS = {
  pending:        { label: "पडताळणी प्रलंबित",      tone: "warning" },
  info_requested: { label: "अतिरिक्त माहिती आवश्यक", tone: "warning" },
  verified:       { label: "पडताळणी पूर्ण",          tone: "success" },
  rejected:       { label: "नोंदणी अमान्य",           tone: "danger"  },
  duplicate:      { label: "छायाचित्र आधीच वापरलेले",   tone: "danger"  },
};

export const STATUS_EN = {
  pending:        { label: "Verification Pending",      tone: "warning" },
  info_requested: { label: "Additional Info Required",   tone: "warning" },
  verified:       { label: "Verified",                   tone: "success" },
  rejected:       { label: "Registration Rejected",      tone: "danger"  },
  duplicate:      { label: "Duplicate Photo",            tone: "danger"  },
};

export function youtubeId(url) {
  const m = /(?:youtu\.be\/|v=|embed\/|shorts\/)([\w-]{11})/.exec(url || "");
  return m ? m[1] : null;
}
