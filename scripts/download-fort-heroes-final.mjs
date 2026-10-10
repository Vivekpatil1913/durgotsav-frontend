import { mkdirSync, writeFileSync, unlinkSync, statSync } from "fs";
import { get } from "https";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { execSync, execFileSync } from "child_process";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, "../public/images/forts");
mkdirSync(OUT_DIR, { recursive: true });

const REMAINING = [
  { slug: "vijaydurg", queries: ["Vijaydurg", "Vijaydurg Fort", "Sindhudurg fort"] },
  { slug: "khanderi",  queries: ["Khanderi island", "Khanderi", "Khanderi fort lighthouse"] },
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

function tryDownload(url, tmpFile) {
  try {
    const cleanUrl = url.split("?")[0];
    execSync(`curl -sL -A "DurgotsavBot/1.0" --max-time 30 -o "${tmpFile}" "${cleanUrl}"`, { stdio: "pipe" });
    const { size } = statSync(tmpFile);
    return size;
  } catch { return 0; }
}

async function searchCommons(query) {
  const url = `https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&srnamespace=6&srlimit=20&format=json&origin=*`;
  const data = await fetchJson(url);
  const results = data.query?.search || [];
  const urls = [];
  for (const r of results) {
    try {
      const infoUrl = `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(r.title)}&prop=imageinfo&iiprop=url|size&format=json&origin=*`;
      const info = await fetchJson(infoUrl);
      const pages = Object.values(info.query?.pages || {});
      const imgUrl = pages[0]?.imageinfo?.[0]?.url;
      const size = pages[0]?.imageinfo?.[0]?.size || 0;
      if (imgUrl && size > 100000) urls.push(imgUrl);
    } catch {}
  }
  return urls;
}

async function processFort(fort) {
  const tmpFile = join(OUT_DIR, `${fort.slug}-tmp`);
  const outPath = join(OUT_DIR, `${fort.slug}-hero.webp`);
  console.log(`\n[${fort.slug}]`);

  for (const query of fort.queries) {
    console.log(`  Query: "${query}"`);
    const candidates = await searchCommons(query);
    console.log(`  ${candidates.length} candidates`);

    for (const imgUrl of candidates) {
      const cleanUrl = imgUrl.split("?")[0];
      console.log(`    Testing: ${cleanUrl.split("/").pop()}`);
      const dlSize = tryDownload(imgUrl, tmpFile);
      if (dlSize < 50000) { console.log(`      → ${dlSize}B (skip)`); continue; }
      console.log(`      → ${(dlSize / 1024).toFixed(0)} KB ✓`);

      try {
        await sharp(tmpFile).resize({ width: 1920, withoutEnlargement: true }).webp({ quality: 82 }).toFile(outPath);
        try { unlinkSync(tmpFile); } catch {}
        const { size } = statSync(outPath);
        console.log(`  ✓ Saved ${(size / 1024).toFixed(1)} KB → public/images/forts/${fort.slug}-hero.webp`);
        return;
      } catch (e) { console.log(`      convert error: ${e.message}`); }
    }
  }
  console.log(`  ✗ No working image found`);
}

(async () => {
  for (const fort of REMAINING) await processFort(fort);
  console.log("\nDone.");
})();
