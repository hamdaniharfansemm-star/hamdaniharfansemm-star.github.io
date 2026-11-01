import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { SITE_URL, categoryById, checkoutUrlOf, formatPrice, isPublished, parsePrice } from "./src/store/catalog.js";
import { isPromptPublished } from "./src/store/prompts.js";

const root = import.meta.dirname;

const esc = (s = "") =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

const absUrl = (p) => (!p ? `${SITE_URL}/assets/banner-bg.png` : /^https?:\/\//.test(p) ? p : `${SITE_URL}${p.startsWith("/") ? "" : "/"}${p}`);

/**
 * Digital Store static pages (GitHub Pages has no server):
 *  - dev/preview: /products/<slug>/ is served by products/index.html
 *  - build: writes dist/products/<slug>/index.html for every PUBLISHED product
 *    with its own <title>, meta description, Open Graph and JSON-LD,
 *    plus dist/sitemap.xml. Demo/draft products never get a public page.
 */
function digitalStorePages() {
  const rewrite = (req, _res, next) => {
    const url = req.url || "";
    if (/^\/products\/prompts\/[^/?#.]+\/?(\?.*)?$/.test(url) || /^\/products\/[^/?#.]+\/?(\?.*)?$/.test(url)) req.url = "/products/index.html" + (url.includes("?") ? url.slice(url.indexOf("?")) : "");
    next();
  };
  return {
    name: "digital-store-pages",
    configureServer(server) {
      server.middlewares.use(rewrite);
    },
    configurePreviewServer(server) {
      server.middlewares.use((req, res, next) => {
        const u = (req.url || "").split("?")[0];
        const m = u.match(/^\/products\/((?:prompts\/)?[^/?#.]+)\/?$/);
        if (m && existsSync(resolve(root, "dist/products", m[1], "index.html"))) return next();
        rewrite(req, res, next);
      });
    },
    closeBundle() {
      const dist = resolve(root, "dist");
      const tplPath = resolve(dist, "products/index.html");
      if (!existsSync(tplPath)) return;
      const tpl = readFileSync(tplPath, "utf8");
      const content = JSON.parse(readFileSync(resolve(root, "src/data/content.json"), "utf8"));
      const products = (content.store?.products || []).filter((p) => isPublished(p) && p.slug && p.name);

      for (const p of products) {
        const url = `${SITE_URL}/products/${p.slug}/`;
        const title = `${p.name} · Digital Store · Hamdani Harfan`;
        const desc = p.shortDescription || p.description || "";
        const img = absUrl(p.coverImage);
        const price = parsePrice(p.price, p.currency);
        const ld = {
          "@context": "https://schema.org",
          "@type": "Product",
          name: p.name,
          description: desc,
          image: img,
          category: categoryById(p.category)?.label,
          brand: { "@type": "Brand", name: "Hamdani Harfan" },
          url,
          ...(price !== null && checkoutUrlOf(p)
            ? { offers: { "@type": "Offer", price: String(price), priceCurrency: p.currency === "USD" ? "USD" : "IDR", availability: "https://schema.org/InStock", url } }
            : {}),
        };
        const html = tpl
          .replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(title)}</title>`)
          .replace(/(<meta name="description" content=")[^"]*(")/, `$1${esc(desc)}$2`)
          .replace(/(<link rel="canonical" href=")[^"]*(")/, `$1${url}$2`)
          .replace(/(<meta property="og:url" content=")[^"]*(")/, `$1${url}$2`)
          .replace(/(<meta property="og:title" content=")[^"]*(")/, `$1${esc(title)}$2`)
          .replace(/(<meta property="og:description" content=")[^"]*(")/, `$1${esc(desc)}$2`)
          .replace(/(<meta property="og:image" content=")[^"]*(")/, `$1${esc(img)}$2`)
          .replace(/(<meta property="og:type" content=")[^"]*(")/, `$1product$2`)
          .replace("<!--store-seo-->", `<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, "\\u003c")}</script>`)
          .replace(
            /<noscript>[\s\S]*?<\/noscript>/,
            `<noscript><div style="font-family:system-ui,sans-serif;background:#020617;color:#e2e8f0;padding:6rem 1.5rem;text-align:center"><h1 style="font-size:2rem">${esc(p.name)}</h1><p>${esc(desc)}</p>${
              price !== null ? `<p><strong>${esc(formatPrice(p.price, p.currency))}</strong></p>` : ""
            }<p><a style="color:#f4e8d1" href="/products/">Digital Store</a></p></div></noscript>`
          );
        const dir = resolve(dist, "products", p.slug);
        mkdirSync(dir, { recursive: true });
        writeFileSync(resolve(dir, "index.html"), html);
      }

      // ── Prompt Library: /products/prompts/ (always) + one share-friendly page per published prompt
      const lib = content.store?.promptLibrary || {};
      const prompts = (content.store?.prompts || []).filter(isPromptPublished);
      const page = ({ url, title, desc, img, ld, noscript }) =>
        tpl
          .replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(title)}</title>`)
          .replace(/(<meta name="description" content=")[^"]*(")/, `$1${esc(desc)}$2`)
          .replace(/(<link rel="canonical" href=")[^"]*(")/, `$1${url}$2`)
          .replace(/(<meta property="og:url" content=")[^"]*(")/, `$1${url}$2`)
          .replace(/(<meta property="og:title" content=")[^"]*(")/, `$1${esc(title)}$2`)
          .replace(/(<meta property="og:description" content=")[^"]*(")/, `$1${esc(desc)}$2`)
          .replace(/(<meta property="og:image" content=")[^"]*(")/, `$1${esc(img)}$2`)
          .replace(/<html lang="[^"]*"/, '<html lang="id"')
          .replace("<!--store-seo-->", `<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, "\\u003c")}</script>`)
          .replace(/<noscript>[\s\S]*?<\/noscript>/, `<noscript><div style="font-family:system-ui,sans-serif;background:#020617;color:#e2e8f0;padding:6rem 1.5rem;max-width:46rem;margin:auto">${noscript}</div></noscript>`);
      const libTitle = lib.title || "Prompt AI Siap Pakai";
      const libDesc = lib.intro || "Lihat contoh hasilnya, salin prompt-nya dengan satu ketukan, lalu tempel di aplikasi AI favorit Anda.";
      const libUrl = `${SITE_URL}/products/prompts/`;
      mkdirSync(resolve(dist, "products/prompts"), { recursive: true });
      writeFileSync(
        resolve(dist, "products/prompts/index.html"),
        page({
          url: libUrl,
          title: `${libTitle} · Hamdani Harfan`,
          desc: libDesc,
          img: absUrl(prompts[0]?.image),
          ld: { "@context": "https://schema.org", "@type": "CollectionPage", name: libTitle, description: libDesc, url: libUrl },
          noscript: `<h1>${esc(libTitle)}</h1><p>${esc(libDesc)}</p><ul>${prompts.map((p) => `<li><a style="color:#f4e8d1" href="/products/prompts/${p.slug}/">${esc(p.title)}</a></li>`).join("")}</ul>`,
        })
      );
      for (const p of prompts) {
        const url = `${SITE_URL}/products/prompts/${p.slug}/`;
        const desc = (p.note || `Prompt AI siap pakai: ${p.title}. Salin dengan satu ketukan.`).slice(0, 180);
        const dir = resolve(dist, "products/prompts", p.slug);
        mkdirSync(dir, { recursive: true });
        writeFileSync(
          resolve(dir, "index.html"),
          page({
            url,
            title: `${p.title} · Prompt AI · Hamdani Harfan`,
            desc,
            img: absUrl(p.image),
            ld: { "@context": "https://schema.org", "@type": "CreativeWork", name: p.title, description: desc, image: absUrl(p.image), url, inLanguage: "id", author: { "@type": "Person", name: "Hamdani Harfan" } },
            noscript: `<h1>${esc(p.title)}</h1>${p.image ? `<img src="${esc(p.image)}" alt="" style="max-width:100%;border-radius:16px">` : ""}<pre style="white-space:pre-wrap;background:#0b1224;padding:1rem;border-radius:12px">${esc(p.prompt)}</pre>`,
          })
        );
      }

      const today = new Date().toISOString().slice(0, 10);
      const urls = [
        `${SITE_URL}/`,
        `${SITE_URL}/products/`,
        ...products.map((p) => `${SITE_URL}/products/${p.slug}/`),
        libUrl,
        ...prompts.map((p) => `${SITE_URL}/products/prompts/${p.slug}/`),
      ];
      writeFileSync(
        resolve(dist, "sitemap.xml"),
        `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
          .map((u) => `  <url><loc>${u}</loc><lastmod>${today}</lastmod></url>`)
          .join("\n")}\n</urlset>\n`
      );
      console.log(`  digital-store: ${products.length} product page(s), ${prompts.length} prompt page(s) + sitemap.xml`);
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), digitalStorePages()],
  server: { open: true },
  build: {
    rollupOptions: {
      // Three pages: public website, Digital Store (/products/) and the admin editor (/admin/)
      input: {
        main: resolve(root, "index.html"),
        products: resolve(root, "products/index.html"),
        admin: resolve(root, "admin/index.html"),
      },
    },
  },
});
