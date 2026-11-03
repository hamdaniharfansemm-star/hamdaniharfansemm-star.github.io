// Prompt Library helpers — shared by the store UI and the build step (vite.config.js).
// Data lives in content.json → store.prompts[] and store.promptLibrary.

export const PROMPTS_BASE = "/products/prompts/";

export const promptPath = (p) => `${PROMPTS_BASE}${encodeURIComponent(p.slug)}/`;

export const isPromptPublished = (p) => p?.status === "published" && !!p.slug && !!p.title && !!String(p.prompt || "").trim();

/** URL-safe, length-capped slug (a pasted paragraph must never break the build). */
export function safeSlug(s = "") {
  const clean = String(s)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (clean.length <= 70) return clean;
  const cut = clean.slice(0, 70);
  return (cut.includes("-") ? cut.slice(0, cut.lastIndexOf("-")) : cut).replace(/-+$/g, "");
}

/** Published prompts (or every prompt in ?preview=1) in the order set in the admin. Slugs are normalised. */
export function visiblePrompts(list = [], preview = false) {
  return (Array.isArray(list) ? list : [])
    .map((p) => (p && (p.slug || p.title) ? { ...p, slug: safeSlug(p.slug || p.title) } : p))
    .filter((p) => p && p.slug && p.title && (preview || isPromptPublished(p))); // order = admin order
}

/** "AI Art / Cinematic Portrait, Space" → ["AI Art", "Cinematic Portrait", "Space"]; "1/7 Scale" stays whole */
export const splitList = (v) =>
  String(v || "")
    .split(/\s+\/\s+|\s*[,|;]\s*/) // "A / B" or "A, B" — but keep "1/7" intact
    .map((x) => x.trim())
    .filter(Boolean);

/** Unique topic tags across prompts, most used first. */
export function promptTags(list = []) {
  const count = new Map();
  for (const p of list)
    for (const t of splitList(p.category)) {
      const k = t.toLowerCase();
      const cur = count.get(k) || { label: t, n: 0 };
      cur.n += 1;
      count.set(k, cur);
    }
  return [...count.values()].sort((a, b) => b.n - a.n || a.label.localeCompare(b.label)).map((x) => x.label);
}

export const hasTag = (p, tag) => !tag || splitList(p.category).some((t) => t.toLowerCase() === tag.toLowerCase());

export const wordCount = (s) => (String(s || "").trim().match(/\S+/g) || []).length;

export function matchesPrompt(p, q) {
  const s = q.trim().toLowerCase();
  if (!s) return true;
  return [p.title, p.category, p.tool, p.prompt, p.note].some((v) => String(v || "").toLowerCase().includes(s));
}

/**
 * Copy text to the clipboard. Works in normal browsers AND in Instagram / Facebook / TikTok
 * in-app browsers, where navigator.clipboard is often missing or blocked.
 * Returns true when the text was copied.
 */
export async function copyText(text) {
  const fallback = () => {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.cssText = "position:fixed;top:0;left:0;width:1px;height:1px;opacity:0;font-size:16px";
    document.body.appendChild(ta);
    const sel = document.getSelection();
    const prev = sel && sel.rangeCount ? sel.getRangeAt(0) : null;
    ta.focus();
    ta.select();
    ta.setSelectionRange(0, text.length); // iOS
    let ok = false;
    try {
      ok = document.execCommand("copy");
    } catch {
      ok = false;
    }
    ta.remove();
    if (prev && sel) {
      sel.removeAllRanges();
      sel.addRange(prev);
    }
    return ok;
  };
  // In-app browsers: use the synchronous path first so the tap still counts as a user gesture.
  if (!navigator.clipboard || !window.isSecureContext) return fallback();
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return fallback();
  }
}

/** Select the text inside an element so the visitor can long-press → Copy as a last resort. */
export function selectElementText(el) {
  if (!el) return;
  const range = document.createRange();
  range.selectNodeContents(el);
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
}
