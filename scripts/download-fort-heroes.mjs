/**
 * Downloads the best Wikipedia hero image for each fort,
 * converts to WebP (1920px wide max), and saves to public/images/forts/.
 *
 * Run: node scripts/download-fort-heroes.mjs
 */

import { createWriteStream, mkdirSync } from "fs";
import { get as httpsGet } from "https";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, "../public/images/forts");

mkdirSync(OUT_DIR, { recursive: true });

const FORTS = [
  { slug: "shivneri",    name_en: "Shivneri" },
  { slug: "rajgad",      name_en: "Rajgad" },
  { slug: "raigad",      name_en: "Raigad" },
  { slug: "pratapgad",   name_en: "Pratapgad" },
  { slug: "lohagad",     name_en: "Lohagad" },
  { slug: "salher",      name_en: "Salher" },
  { slug: "panhala",     name_en: "Panhala" },
  { slug: "vijaydurg",   name_en: "Vijaydurg" },
  { slug: "sindhudurg",  name_en: "Sindhudurg" },
  { slug: "suvarnadurg", name_en: "Suvarnadurg" },
  { slug: "khanderi",    name_en: "Khanderi" },
  { slug: "gingee",      name_en: "Gingee" },
];

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    httpsGet(url, { headers: { "User-Agent": "DurgotsavBot/1.0" } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchJson(res.headers.location).then(resolve).catch(reject);
      }
      let data = "";
      res.on("data", (c) => (data += c));
      res.on("end", () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(new Error(`JSON parse failed: ${data.slice(0, 200)}`)); }
      });
    }).on("error", reject);
  });
}

function downloadBuffer(url) {
  return new Promise((resolve, reject) => {
    httpsGet(url, { headers: { "User-Agent": "DurgotsavBot/1.0" } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return downloadBuffer(res.headers.location).then(resolve).catch(reject);
      }
      const chunks = [];
      res.on("data", (c) => chunks.push(c));
      res.on("end", () => resolve(Buffer.concat(chunks)));
    }).on("error", reject);
  });
}

async function getWikiImageUrl(nameEn) {
  const title = encodeURIComponent(`${nameEn} Fort`);
  const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${title}`;
  const data = await fetchJson(url);
  return data.originalimage?.source || data.thumbnail?.source || null;
}

async function processFort(fort) {
  const outPath = join(OUT_DIR, `${fort.slug}-hero.webp`);
  console.log(`\n[${fort.slug}] Fetching Wikipedia summary...`);

  const imgUrl = await getWikiImageUrl(fort.name_en);
  if (!imgUrl) {
    console.log(`  ✗ No image found for ${fort.name_en}`);
    return;
  }
  console.log(`  → ${imgUrl}`);

  const buffer = await downloadBuffer(imgUrl);
  console.log(`  Downloaded ${(buffer.length / 1024).toFixed(1)} KB`);

  await sharp(buffer)
    .resize({ width: 1920, withoutEnlargement: true })
    .webp({ quality: 82 })
    .toFile(outPath);

  const { size } = await import("fs").then(m => m.promises.stat(outPath));
  console.log(`  ✓ Saved → public/images/forts/${fort.slug}-hero.webp (${(size / 1024).toFixed(1)} KB)`);
}

(async () => {
  console.log("Downloading fort hero images from Wikipedia...\n");
  for (const fort of FORTS) {
    try {
      await processFort(fort);
    } catch (err) {
      console.log(`  ✗ Error for ${fort.slug}: ${err.message}`);
    }
  }
  console.log("\nDone.");
})();
