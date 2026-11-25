// Client-side photo checks + downscale. Photos straight from the camera (up to MAX_PICK_MB) are accepted: they are
// resized to ≤2800px and re-encoded until they are small enough to upload quickly on mobile data. The server
// (UPLOAD_MAX_MB) takes at most MAX_UPLOAD_MB, which matters only when the browser cannot shrink the photo itself.
export const MAX_PICK_MB = 40;
const MAX_UPLOAD_MB = 20;
const TARGET_MB = 4;
const MB = 1024 * 1024;
const ACCEPTED = ["image/jpeg", "image/jpg", "image/pjpeg", "image/png", "image/webp"];
// No HEIC here on purpose: an iPhone then hands the photo over already converted to JPEG
export const PHOTO_ACCEPT = "image/jpeg,image/png,image/webp";
// Tried in this order: the next one only when the photo is still above TARGET_MB, or too big for the phone's memory
const ENCODINGS = [[2800, 0.9], [2800, 0.8], [2000, 0.8], [1600, 0.75]];

const tooLarge = (bytes, max, t) => {
  const size = (bytes / MB).toFixed(1);
  return new Error(t(
    `This photo is ${size} MB. The maximum allowed size is ${max} MB — please choose a smaller photo, or retake it at a lower camera resolution.`,
    `हा फोटो ${size} MB चा आहे. कमाल ${max} MB पर्यंतचाच फोटो चालेल — कृपया लहान आकाराचा फोटो निवडा, किंवा कॅमेऱ्याचे रिझोल्यूशन कमी करून पुन्हा काढा.`,
  ));
};

// Windows and some Android pickers report no type for HEIC
const isHeic = (file) => /hei[cf]/i.test(file.type) || /\.hei[cf]$/i.test(file.name);

async function encode(bitmap, side, quality) {
  const scale = Math.min(1, side / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  // JPEG has no transparency: without this, a transparent PNG's background turns black
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
  canvas.width = canvas.height = 0; // frees the memory at once (iOS keeps it otherwise)
  return blob;
}

// `t(en, mr)` picks the message language; without it errors are in Marathi.
export async function preparePhoto(file, t = (en, mr) => mr) {
  const heic = isHeic(file);
  if (!heic && !ACCEPTED.includes(file.type)) {
    throw new Error(t("Please choose a JPG, PNG or WebP photo.", "फक्त JPG, PNG किंवा WebP छायाचित्र निवडा."));
  }
  if (file.size > MAX_PICK_MB * MB) throw tooLarge(file.size, MAX_PICK_MB, t);
  let bitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    // Safari opens HEIC; other browsers cannot, and neither can the server
    if (heic) {
      throw new Error(t(
        "This is a HEIC photo, which this browser cannot open. Please save it as JPG, or set iPhone Camera → Formats to 'Most Compatible'.",
        "हे HEIC छायाचित्र या ब्राउझरमध्ये उघडत नाही. कृपया ते JPG म्हणून जतन करा, किंवा iPhone वर Camera → Formats → 'Most Compatible' निवडा.",
      ));
    }
    throw new Error(t("This photo could not be opened. Please choose another photo.", "हे छायाचित्र उघडता आले नाही. कृपया दुसरे छायाचित्र निवडा."));
  }
  const { width, height } = bitmap;
  if (width < 300 || height < 300) {
    bitmap.close?.();
    throw new Error(t("This photo is too small. Please choose a clear photo of at least 300×300 px.", "छायाचित्र खूप लहान आहे. कृपया स्पष्ट (किमान ३००×३०० px) छायाचित्र निवडा."));
  }

  let output = file;
  if (heic || Math.max(width, height) > ENCODINGS[0][0] || file.size > TARGET_MB * MB) {
    let best = null;
    for (const [side, quality] of ENCODINGS) {
      const blob = await encode(bitmap, side, quality).catch(() => null);
      if (blob && (!best || blob.size < best.size)) best = blob;
      if (best && best.size <= TARGET_MB * MB) break;
    }
    if (best && (heic || best.size < file.size)) {
      output = new File([best], file.name.replace(/\.\w+$/, "") + ".jpg", { type: "image/jpeg" });
    } else if (heic) {
      bitmap.close?.();
      throw new Error(t("This photo could not be opened. Please choose another photo.", "हे छायाचित्र उघडता आले नाही. कृपया दुसरे छायाचित्र निवडा."));
    }
  }
  bitmap.close?.();
  if (output.size > MAX_UPLOAD_MB * MB) throw tooLarge(output.size, MAX_UPLOAD_MB, t);
  return { file: output, preview: URL.createObjectURL(output), width, height };
}
