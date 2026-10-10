// Client-side photo checks + downscale. Phone cameras produce 5–15 MB images; resizing to ≤2800px here
// keeps uploads fast on mobile data and inside the server limit, without changing what the photo shows.
export const MAX_UPLOAD_MB = 8;
const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIDE = 2800;

export async function preparePhoto(file) {
  if (!ACCEPTED.includes(file.type)) {
    throw new Error("फक्त JPG, PNG किंवा WebP छायाचित्र निवडा. (iPhone वरील HEIC फोटो 'Most Compatible' सेटिंगने काढा.)");
  }
  let bitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    throw new Error("हे छायाचित्र उघडता आले नाही. कृपया दुसरे छायाचित्र निवडा.");
  }
  const { width, height } = bitmap;
  if (width < 300 || height < 300) {
    bitmap.close?.();
    throw new Error("छायाचित्र खूप लहान आहे. कृपया स्पष्ट (किमान ३००×३०० px) छायाचित्र निवडा.");
  }

  let output = file;
  const longest = Math.max(width, height);
  if (longest > MAX_SIDE || file.size > 4 * 1024 * 1024) {
    const scale = Math.min(1, MAX_SIDE / longest);
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);
    canvas.getContext("2d").drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.9));
    if (blob) output = new File([blob], file.name.replace(/\.\w+$/, "") + ".jpg", { type: "image/jpeg" });
  }
  bitmap.close?.();
  if (output.size > MAX_UPLOAD_MB * 1024 * 1024) throw new Error(`छायाचित्र ${MAX_UPLOAD_MB} MB पेक्षा मोठे नसावे.`);
  return { file: output, preview: URL.createObjectURL(output), width, height };
}
