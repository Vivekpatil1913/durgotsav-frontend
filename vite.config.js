import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { EDITION_YEAR } from "./src/config/edition.js";

// index.html is static (title and Open Graph tags for crawlers that don't run JS): fill %EDITION_YEAR% in it
const editionYear = () => ({
  name: "edition-year",
  transformIndexHtml: { order: "pre", handler: (html) => html.replaceAll("%EDITION_YEAR%", String(EDITION_YEAR)) },
});

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const api = env.VITE_DEV_API_PROXY || "http://localhost:4100";
  return {
    plugins: [react(), editionYear()],
    server: {
      port: 5173,
      // Same-origin in development: /api, /uploads and /sitemap.xml are forwarded to the Express API
      proxy: { "/api": api, "/uploads": api, "/sitemap.xml": api },
    },
    build: {
      target: "es2020",
      cssCodeSplit: true,
      rollupOptions: {
        output: {
          // Group by package so sub-paths (react-dom/client, gsap/ScrollTrigger, swiper/modules) land
          // in long-cacheable vendor chunks instead of the app chunk
          manualChunks(id) {
            const pkg = /node_modules\/((?:@[^/]+\/)?[^/]+)/.exec(id.replace(/\\/g, "/"))?.[1];
            if (!pkg) return undefined;
            if (["react", "react-dom", "scheduler", "react-router", "react-router-dom"].includes(pkg)) return "react";
            if (["framer-motion", "motion-dom", "motion-utils"].includes(pkg)) return "motion";
            if (["gsap", "lenis"].includes(pkg)) return "scroll";
            if (pkg === "swiper") return "swiper";
            return "vendor";
          },
        },
      },
    },
  };
});
