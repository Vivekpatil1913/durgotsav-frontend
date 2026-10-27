// Client-side photo checks + downscale. A picked photo must be at most MAX_UPLOAD_MB (the server's
// UPLOAD_MAX_MB); within that, resizing to ≤2800px keeps uploads fast on mobile data without changing what it shows.
export const MAX_UPLOAD_MB = 5;
const MB = 1024 * 1024;
const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIDE = 2800;

const tooLarge = (bytes, t) => {
  const size = (bytes / MB).toFixed(1);
  return new Error(t(
    `This photo is ${size} MB. The maximum allowed size is ${MAX_UPLOAD_MB} MB — please choose a smaller photo, or retake it at a lower camera resolution.`,
    `हा फोटो ${size} MB चा आहे. कमाल ${MAX_UPLOAD_MB} MB पर्यंतचाच फोटो चालेल — कृपया लहान आकाराचा फोटो निवडा, किंवा कॅमेऱ्याचे रिझोल्यूशन कमी करून पुन्हा काढा.`,
  ));
};

// `t(en, mr)` picks the message language; without it errors are in Marathi.
export async function preparePhoto(file, t = (en, mr) => mr) {
  if (!ACCEPTED.includes(file.type)) {
    throw new Error(t(
      "Please choose a JPG, PNG or WebP photo. (On iPhone, set Camera → Formats to 'Most Compatible' instead of HEIC.)",
      "फक्त JPG, PNG किंवा WebP छायाचित्र निवडा. (iPhone वरील HEIC फोटो 'Most Compatible' सेटिंगने काढा.)",
    ));
  }
  if (file.size > MAX_UPLOAD_MB * MB) throw tooLarge(file.size, t);
  let bitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    throw new Error(t("This photo could not be opened. Please choose another photo.", "हे छायाचित्र उघडता आले नाही. कृपया दुसरे छायाचित्र निवडा."));
  }
  const { width, height } = bitmap;
  if (width < 300 || height < 300) {
    bitmap.close?.();
    throw new Error(t("This photo is too small. Please choose a clear photo of at least 300×300 px.", "छायाचित्र खूप लहान आहे. कृपया स्पष्ट (किमान ३००×३०० px) छायाचित्र निवडा."));
  }

  let output = file;
  const longest = Math.max(width, height);
  if (longest > MAX_SIDE || file.size > 4 * MB) {
    const scale = Math.min(1, MAX_SIDE / longest);
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);
    canvas.getContext("2d").drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.9));
    if (blob) output = new File([blob], file.name.replace(/\.\w+$/, "") + ".jpg", { type: "image/jpeg" });
  }
  bitmap.close?.();
  if (output.size > MAX_UPLOAD_MB * MB) throw tooLarge(output.size, t);
  return { file: output, preview: URL.createObjectURL(output), width, height };
}
