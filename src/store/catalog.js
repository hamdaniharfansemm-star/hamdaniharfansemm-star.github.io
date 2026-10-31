// ─────────────────────────────────────────────────────────────
//  Digital Store — pure helpers (no React, no JSON imports).
//  Used by the store pages AND by vite.config.js at build time,
//  so catalog, detail pages, SEO pages and sitemap share one source.
// ─────────────────────────────────────────────────────────────

export const CATEGORIES = [
  { id: "ebooks", label: "Modules & E-books", short: "E-books", blurb: "Practical guides and learning modules you can read at your own pace." },
  { id: "blueprints", label: "Blueprints", short: "Blueprints", blurb: "Feature specs, user flows and architecture plans for real products." },
  { id: "apps", label: "Apps", short: "Apps", blurb: "Ready-to-use applications and digital tools." },
  { id: "courses", label: "Online Courses", short: "Courses", blurb: "Structured lessons that take you from idea to a working result." },
  { id: "templates", label: "Templates & Source Code", short: "Templates", blurb: "Production-ready starting points you can customise and ship." },
];

export const categoryById = (id) => CATEGORIES.find((c) => c.id === id);

/** published = public · draft/demo = only visible in preview mode (?preview=1) */
export const STATUSES = ["published", "draft", "demo"];

export const isPublished = (p) => p?.status === "published";

export function visibleProducts(products = [], preview = false) {
  return products.filter((p) => p && p.slug && p.name && (isPublished(p) || preview));
}

export function slugify(s = "") {
  return (
    String(s)
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 80) || "product"
  );
}

/** Accepts numbers or strings like "149.000", "Rp 149.000", "1,250.50". Returns a number or null. */
export function parsePrice(value, currency = "IDR") {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  let s = String(value).trim();
  if (currency === "IDR") s = s.replace(/[^\d]/g, "");
  else s = s.replace(/[^\d.]/g, "");
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

export function formatPrice(value, currency = "IDR") {
  const n = parsePrice(value, currency);
  if (n === null) return "";
  if (n === 0) return "Free";
  const cur = currency === "USD" ? "USD" : "IDR";
  return new Intl.NumberFormat(cur === "IDR" ? "id-ID" : "en-US", {
    style: "currency",
    currency: cur,
    maximumFractionDigits: cur === "IDR" ? 0 : 2,
    minimumFractionDigits: 0,
  }).format(n);
}

/** Only real https links count as a configured checkout. */
export function checkoutUrlOf(p) {
  const url = String(p?.checkoutUrl || "").trim();
  if (!/^https:\/\/[^\s/$.?#].[^\s]*$/i.test(url)) return "";
  return url;
}

export const NEW_DAYS = 45;

/** "New" badge only when the product has a real release date within the last NEW_DAYS days. */
export function isNew(p, now = Date.now()) {
  const t = Date.parse(p?.releaseDate || "");
  if (!Number.isFinite(t)) return false;
  const days = (now - t) / 86400000;
  return days >= 0 && days <= NEW_DAYS;
}

export const productPath = (p) => `/products/${p.slug}/`;

export function relatedProducts(all, product, limit = 3) {
  const others = all.filter((p) => p.slug !== product.slug);
  const same = others.filter((p) => p.category === product.category);
  const rest = others.filter((p) => p.category !== product.category);
  return [...same, ...rest].slice(0, limit);
}

export function matchesQuery(p, q) {
  if (!q) return true;
  const hay = [p.name, p.shortDescription, p.description, ...(p.features || []), categoryById(p.category)?.label]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return q
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((w) => hay.includes(w));
}

export const SITE_URL = "https://hamdaniharfan.com";

/** Discount % only when the owner set an originalPrice higher than the current price. */
export function discountPercent(p) {
  const now = parsePrice(p?.price, p?.currency);
  const was = parsePrice(p?.originalPrice, p?.currency);
  if (now === null || was === null || was <= now || now <= 0) return 0;
  return Math.round(((was - now) / was) * 100);
}
