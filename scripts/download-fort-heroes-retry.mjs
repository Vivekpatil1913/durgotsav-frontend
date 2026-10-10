import { mkdirSync } from "fs";
import { get } from "https";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, "../public/images/forts");
mkdirSync(OUT_DIR, { recursive: true });

const RETRIES = [
  { slug: "shivneri",    titles: ["Shivneri", "Shivneri Fort"] },
  { slug: "vijaydurg",   titles: ["Vijaydurg", "Vijaydurg Fort"] },
  { slug: "salher",      titles: ["Salher Fort", "Salher"] },
  { slug: "suvarnadurg", titles: ["Suvarnadurg", "Suvarnadurg Fort"] },
  { slug: "khanderi",    titles: ["Khanderi Island", "Khanderi Fort"] },
];

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    get(url, { headers: { "User-Agent": "DurgotsavBot/1.0" } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location)
        return fetchJson(res.headers.location).then(resolve).catch(reject);
      let data = "";
      res.on("data", (c) => (data += c));
      res.on("end", () => { try { resolve(JSON.parse(data)); } catch { reject(new Error("not json")); } });
    }).on("error", reject);
  });
}

function downloadBuffer(url) {
  const cleanUrl = url.split("?")[0];
  return new Promise((resolve, reject) => {
    get(cleanUrl, { headers: { "User-Agent": "DurgotsavBot/1.0" } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location)
        return downloadBuffer(res.headers.location).then(resolve).catch(reject);
      const chunks = [];
      res.on("data", (c) => chunks.push(c));
      res.on("end", () => resolve(Buffer.concat(chunks)));
    }).on("error", reject);
  });
}

async function getImageUrl(title) {
  // Try summary endpoint
  try {
    const d = await fetchJson(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`);
    if (d.originalimage?.source) return d.originalimage.source;
    if (d.thumbnail?.source) return d.thumbnail.source;
  } catch {}
  // Try pageimages API
  try {
    const d = await fetchJson(`https://en.wikipedia.org/w/api.php?action=query&prop=pageimages&piprop=original&titles=${encodeURIComponent(title)}&format=json&origin=*`);
    const pages = Object.values(d.query?.pages || {});
    if (pages[0]?.original?.source) return pages[0].original.source;
  } catch {}
  return null;
}

async function processFort(fort) {
  const outPath = join(OUT_DIR, `${fort.slug}-hero.webp`);
  console.log(`\n[${fort.slug}]`);

  for (const title of fort.titles) {
    console.log(`  Trying "${title}"...`);
    const imgUrl = await getImageUrl(title);
    if (!imgUrl) { console.log("    no image"); continue; }
    console.log(`    ${imgUrl.split("?")[0]}`);

    try {
      const buf = await downloadBuffer(imgUrl);
      if (buf.length < 10000) { console.log(`    too small (${buf.length}B)`); continue; }
      await sharp(buf).resize({ width: 1920, withoutEnlargement: true }).webp({ quality: 82 }).toFile(outPath);
      const { size } = await (await import("fs")).promises.stat(outPath);
      console.log(`  ✓ ${(size / 1024).toFixed(1)} KB → public/images/forts/${fort.slug}-hero.webp`);
      return;
    } catch (e) { console.log(`    failed: ${e.message}`); }
  }
  console.log(`  ✗ all attempts failed`);
}

(async () => {
  for (const fort of RETRIES) await processFort(fort);
  console.log("\nDone.");
})();
