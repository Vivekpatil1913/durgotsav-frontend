import { http } from "./api.js";

const nameFrom = (disposition) => /filename="?([^";]+)"?/i.exec(disposition ?? "")?.[1];

// Downloads a file from the API (certificate PDF / image) and hands it to the browser under the server's file name.
// An error response arrives as a Blob; it is turned back into JSON so toApiError() can read its message.
export async function downloadFile(url, { params, filename } = {}) {
  let res;
  try {
    res = await http.get(url, { params, responseType: "blob", timeout: 90000 });
  } catch (err) {
    const body = err?.response?.data;
    if (body instanceof Blob) {
      try {
        err.response.data = JSON.parse(await body.text());
      } catch {
        /* not JSON — keep the generic message */
      }
    }
    throw err;
  }
  const href = URL.createObjectURL(res.data);
  const a = Object.assign(document.createElement("a"), { href, download: nameFrom(res.headers["content-disposition"]) ?? filename ?? "certificate" });
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(href), 10000);
}

// Certificate files behind a signed link (/c/<token>): format "pdf" or "jpg"
export const downloadCertificate = (token, format = "pdf") =>
  downloadFile(`/certificates/link/${encodeURIComponent(token)}/download`, { params: { format } });

// "Download all": every valid certificate among these links, one PDF
export const downloadAllCertificates = (tokens) =>
  downloadFile("/certificates/bundle", { params: { tokens: tokens.join(",") } });
