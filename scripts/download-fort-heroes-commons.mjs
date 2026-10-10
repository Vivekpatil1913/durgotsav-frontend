import { mkdirSync, writeFileSync } from "fs";
import { get } from "https";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, "../public/images/forts");
mkdirSync(OUT_DIR, { recursive: true });

const REMAINING = [
  { slug: "shivneri",  query: "Shivneri Fort Maharashtra" },
  { slug: "vijaydurg", query: "Vijaydurg Fort Maharashtra" },
  { slug: "khanderi",  query: "Khanderi Fort Maharashtra" },
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

// Download via curl (reliable for Wikimedia)
function downloadWithCurl(url, outFile) {
  const cleanUrl = url.split("?")[0];
  execSync(`curl -sL -A "DurgotsavBot/1.0" -o "${outFile}" "${cleanUrl}"`, { stdio: "pipe" });
}

async function searchCommons(query) {
  const url = `https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&srnamespace=6&srlimit=10&format=json&origin=*`;
  const data = await fetchJson(url);
  const results = data.query?.search || [];
  for (const r of results) {
    const infoUrl = `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(r.title)}&prop=imageinfo&iiprop=url|size&format=json&origin=*`;
    try {
      const info = await fetchJson(infoUrl);
      const pages = Object.values(info.query?.pages || {});
      const imgUrl = pages[0]?.imageinfo?.[0]?.url;
      const size = pages[0]?.imageinfo?.[0]?.size || 0;
      if (imgUrl && size > 100000) return imgUrl;
    } catch {}
  }
  return null;
}

async function processFort(fort) {
  const tmpFile = join(OUT_DIR, `${fort.slug}-tmp`);
  const outPath = join(OUT_DIR, `${fort.slug}-hero.webp`);
  console.log(`\n[${fort.slug}] Searching Commons: "${fort.query}"`);

  const imgUrl = await searchCommons(fort.query);
  if (!imgUrl) { console.log("  ✗ no usable image found"); return; }
  const cleanUrl = imgUrl.split("?")[0];
  console.log(`  → ${cleanUrl}`);

  downloadWithCurl(cleanUrl, tmpFile);
  const { size: tmpSize } = await (await import("fs")).promises.stat(tmpFile);
  console.log(`  Downloaded ${(tmpSize / 1024).toFixed(1)} KB`);
  if (tmpSize < 10000) { console.log("  ✗ too small"); return; }

  await sharp(tmpFile).resize({ width: 1920, withoutEnlargement: true }).webp({ quality: 82 }).toFile(outPath);
  await (await import("fs")).promises.unlink(tmpFile);
  const { size } = await (await import("fs")).promises.stat(outPath);
  console.log(`  ✓ ${(size / 1024).toFixed(1)} KB → public/images/forts/${fort.slug}-hero.webp`);
}

(async () => {
  for (const fort of REMAINING) await processFort(fort);
  console.log("\nDone.");
})();
