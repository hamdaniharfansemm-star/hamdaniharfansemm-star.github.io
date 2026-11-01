// Prompt Library helpers — shared by the store UI and the build step (vite.config.js).
// Data lives in content.json → store.prompts[] and store.promptLibrary.

export const PROMPTS_BASE = "/products/prompts/";

export const promptPath = (p) => `${PROMPTS_BASE}${encodeURIComponent(p.slug)}/`;

export const isPromptPublished = (p) => p?.status === "published" && !!p.slug && !!p.title && !!String(p.prompt || "").trim();

/** Published prompts (or every prompt in ?preview=1), newest first. */
export function visiblePrompts(list = [], preview = false) {
  return (Array.isArray(list) ? list : [])
    .filter((p) => p && p.slug && p.title && (preview || isPromptPublished(p)))
    .sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));
}

export function promptTags(list = []) {
  const seen = new Map();
  for (const p of list) {
    const t = String(p.category || "").trim();
    if (t) seen.set(t.toLowerCase(), t);
  }
  return [...seen.values()];
}

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
