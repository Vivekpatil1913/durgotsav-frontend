import axios from "axios";

export const API_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
export const SITE_URL = (import.meta.env.VITE_SITE_URL || window.location.origin).replace(/\/$/, "");

export const http = axios.create({ baseURL: `${API_URL}/api`, timeout: 20000 });

// Normalises API / network failures into { message, status, code, details }
export function toApiError(err) {
  if (axios.isCancel?.(err) || err?.code === "ERR_CANCELED") return { canceled: true };
  const body = err?.response?.data?.error;
  if (body) return { status: err.response.status, code: body.code, message: body.message, details: body.details || {} };
  if (err?.code === "ECONNABORTED") return { message: "सर्व्हरकडून प्रतिसाद मिळाला नाही. कृपया पुन्हा प्रयत्न करा.", details: {} };
  return { message: "नेटवर्क त्रुटी. आपले इंटरनेट कनेक्शन तपासा.", details: {} };
}

// Tiny in-memory cache for GET requests so navigating back and forth doesn't refetch.
const cache = new Map();
const inflight = new Map();
const TTL = 60_000;

export async function getCached(url, params) {
  const key = `${url}?${new URLSearchParams(params || {}).toString()}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL) return hit.data;
  if (inflight.has(key)) return inflight.get(key);
  const promise = http
    .get(url, { params })
    .then((res) => {
      cache.set(key, { at: Date.now(), data: res.data });
      return res.data;
    })
    .finally(() => inflight.delete(key));
  inflight.set(key, promise);
  return promise;
}

export const peekCache = (url, params) => cache.get(`${url}?${new URLSearchParams(params || {}).toString()}`)?.data;
