// Public like counts for the Prompt Library, stored in Supabase.
// Only two database functions are called (see supabase/prompt-likes.sql); the table itself
// is not readable from the browser. Without configuration, likes stay device-only.
import content from "../data/content.json";
import { isSecretKey } from "./keyCheck.js";

export { isSecretKey };

const cfg = content.store?.promptLibrary || {};
const URL_BASE = String(cfg.supabaseUrl || "")
  .trim()
  .replace(/\/+$/, "");
const KEY = String(cfg.supabaseKey || "").trim();

export const likesEnabled = /^https:\/\/[a-z0-9-]+\.supabase\.(co|in)$/i.test(URL_BASE) && KEY.length > 20 && !isSecretKey(KEY);

const headers = () => {
  const h = { apikey: KEY, "Content-Type": "application/json", Accept: "application/json" };
  if (/^eyJ/.test(KEY)) h.Authorization = `Bearer ${KEY}`; // legacy anon (JWT) keys
  return h;
};

async function rpc(fn, body, timeout = 8000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeout);
  try {
    const res = await fetch(`${URL_BASE}/rest/v1/rpc/${fn}`, { method: "POST", headers: headers(), body: JSON.stringify(body || {}), signal: ctrl.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(t);
  }
}

/** { slug: totalLikes } — cached for 60 s in the tab to keep page loads fast. */
export async function fetchLikeCounts() {
  if (!likesEnabled) return null;
  try {
    const c = JSON.parse(sessionStorage.getItem("hh-like-counts") || "null");
    if (c && Date.now() - c.at < 60_000) return c.map;
  } catch {
    /* ignore */
  }
  const rows = await rpc("prompt_like_counts");
  const map = {};
  for (const r of rows || []) map[r.slug] = Number(r.likes) || 0;
  try {
    sessionStorage.setItem("hh-like-counts", JSON.stringify({ at: Date.now(), map }));
  } catch {
    /* ignore */
  }
  return map;
}

/** Like (on=true) or unlike; resolves to the new total for that prompt. */
export async function sendLike(slug, visitor, on) {
  if (!likesEnabled) return null;
  try {
    sessionStorage.removeItem("hh-like-counts");
  } catch {
    /* ignore */
  }
  const n = await rpc("like_prompt", { p_slug: slug, p_visitor: visitor, p_like: !!on });
  return Number(n) || 0;
}

/** Anonymous, random id for this browser (no personal data). */
export function visitorId() {
  const K = "hh-visitor-id-v1";
  try {
    let v = localStorage.getItem(K);
    if (!v) {
      v = (crypto.randomUUID?.() || `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}-${Math.random().toString(36).slice(2, 12)}`).slice(0, 64);
      localStorage.setItem(K, v);
    }
    return v;
  } catch {
    return "";
  }
}

export const formatLikes = (n) => (n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")} jt` : n >= 10_000 ? `${(n / 1000).toFixed(1).replace(/\.0$/, "")} rb` : n.toLocaleString("id-ID"));
