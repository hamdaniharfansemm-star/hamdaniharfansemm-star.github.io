import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import content from "../data/content.json";
import { EASE_OUT } from "../lib/motion.js";
import { isPublished, productPath, visibleProducts } from "./catalog.js";
import { BuyButton, Cover, GoldPrice } from "./ProductParts.jsx";
import { PROMPTS_BASE, copyText, matchesPrompt, promptPath, promptTags, selectElementText, visiblePrompts } from "./prompts.js";
import { CloseSmall, EyeIcon, SearchIcon, SparkIcon } from "./StoreIcons.jsx";

const store = content.store || {};
const lib = store.promptLibrary || {};
const fade = (delay = 0) => ({ initial: { opacity: 0, y: 18 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, amount: 0.15 }, transition: { duration: 0.7, ease: EASE_OUT, delay } });

/* ───────── small icons ───────── */
const ico = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true, viewBox: "0 0 24 24" };
const CopyIcon = (p) => (
  <svg width="16" height="16" {...ico} {...p}>
    <rect x="9" y="9" width="11" height="11" rx="2.5" />
    <path d="M5 15V6a2 2 0 0 1 2-2h8" />
  </svg>
);
const CheckIcon = (p) => (
  <svg width="16" height="16" {...ico} strokeWidth={2.4} {...p}>
    <path d="m5 12.5 4.2 4.2L19 7" />
  </svg>
);
const ShareIcon = (p) => (
  <svg width="16" height="16" {...ico} {...p}>
    <path d="M12 3v12M7.5 7.5 12 3l4.5 4.5" />
    <path d="M5 13v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5" />
  </svg>
);
const ExpandIcon = (p) => (
  <svg width="15" height="15" {...ico} {...p}>
    <path d="M14 4h6v6M10 20H4v-6M20 4l-7 7M4 20l7-7" />
  </svg>
);

/* ───────── copy / share state ───────── */
function useCopy() {
  const [state, setState] = useState("idle"); // idle | done | manual
  const timer = useRef(0);
  useEffect(() => () => clearTimeout(timer.current), []);
  const run = async (text, preEl) => {
    const ok = await copyText(text);
    if (!ok) selectElementText(preEl);
    setState(ok ? "done" : "manual");
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setState("idle"), ok ? 2200 : 5000);
    return ok;
  };
  return [state, run];
}

async function sharePrompt(p) {
  const url = `${window.location.origin}${promptPath(p)}`;
  if (navigator.share) {
    try {
      await navigator.share({ title: p.title, text: `Prompt AI: ${p.title}`, url });
      return "shared";
    } catch {
      return "cancel";
    }
  }
  return (await copyText(url)) ? "link" : "fail";
}

/* ───────── Prompt card ───────── */
export function PromptCard({ prompt: p, focused = false, onImage, onToast, index = 0, compact = false }) {
  const preRef = useRef(null);
  const cardRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [copyState, copy] = useCopy();
  const long = String(p.prompt || "").length > (compact ? 160 : 340);

  useEffect(() => {
    if (!focused || !cardRef.current) return;
    const t = setTimeout(() => cardRef.current.scrollIntoView({ behavior: "smooth", block: "start" }), 450);
    return () => clearTimeout(t);
  }, [focused]);

  const doCopy = async () => {
    const ok = await copy(p.prompt, preRef.current);
    onToast?.(ok ? "Prompt tersalin — tinggal tempel (paste) di aplikasi AI Anda." : "Tekan lama teks prompt yang sudah ditandai, lalu pilih Salin.");
  };
  const doShare = async () => {
    const r = await sharePrompt(p);
    if (r === "link") onToast?.("Link prompt tersalin — bagikan ke teman Anda.");
    if (r === "fail") onToast?.("Link tidak bisa disalin di browser ini.");
  };

  return (
    <motion.article
      ref={cardRef}
      id={`prompt-${p.slug}`}
      {...fade(Math.min(index, 6) * 0.06)}
      className={`card-navy group relative flex h-full scroll-mt-28 flex-col overflow-hidden rounded-[1.75rem] ${focused ? "prompt-focus" : ""}`}
    >
      {/* Image preview */}
      <button
        type="button"
        onClick={() => p.image && onImage?.(p)}
        className="relative block aspect-square w-full overflow-hidden bg-[#0b1224] text-left"
        aria-label={p.image ? `Lihat gambar penuh: ${p.title}` : p.title}
        disabled={!p.image}
      >
        {p.image ? (
          <img src={p.image} alt={`Contoh hasil prompt: ${p.title}`} loading={index < 2 ? "eager" : "lazy"} decoding="async" className="h-full w-full object-cover transition-transform duration-[1.2s] ease-[cubic-bezier(.22,1,.36,1)] [@media(hover:hover)]:group-hover:scale-[1.03]" />
        ) : (
          <div className="grid h-full w-full place-items-center bg-[radial-gradient(circle_at_30%_20%,rgba(124,58,237,.35),transparent_55%),radial-gradient(circle_at_75%_80%,rgba(245,196,81,.18),transparent_50%)]">
            <span className="grid h-14 w-14 place-items-center rounded-2xl border border-white/10 bg-white/5 text-amber-200">
              <SparkIcon width={26} height={26} />
            </span>
          </div>
        )}
        <span aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[#060a19]/80 to-transparent" />
        <span className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          {p.status !== "published" && <span className="rounded-full border border-amber-300/50 bg-amber-950/80 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-200">Draft</span>}
          {p.tool && <span className="rounded-full border border-white/15 bg-black/55 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white backdrop-blur-sm">{p.tool}</span>}
        </span>
        {p.image && (
          <span className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-black/55 px-2.5 py-1.5 text-[11px] font-semibold text-white backdrop-blur-sm">
            <ExpandIcon /> Lihat penuh
          </span>
        )}
      </button>

      <div className="flex flex-1 flex-col p-5 sm:p-6">
        {p.category && <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-300/90">{p.category}</p>}
        <h3 className="mt-1.5 font-display text-xl font-bold leading-snug text-white sm:text-[1.4rem]">{p.title}</h3>
        {p.note && !compact && <p className="mt-2 text-sm leading-relaxed text-slate-400">{p.note}</p>}

        {/* Prompt text box */}
        <div className="relative mt-4 flex-1">
          <div className={`relative overflow-hidden rounded-2xl border border-white/10 bg-[#040816] ${open || !long ? "" : compact ? "max-h-28" : "max-h-48"}`}>
            <div className="flex items-center justify-between border-b border-white/5 px-4 py-2">
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500">Prompt</span>
              <button
                type="button"
                onClick={doCopy}
                aria-label={`Salin prompt ${p.title}`}
                className={`inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[11px] font-semibold transition-colors ${copyState === "done" ? "text-emerald-300" : "text-slate-300 hover:bg-white/5 hover:text-white"}`}
              >
                {copyState === "done" ? <CheckIcon width={14} height={14} /> : <CopyIcon width={14} height={14} />}
                {copyState === "done" ? "Tersalin" : "Salin"}
              </button>
            </div>
            <pre ref={preRef} className="whitespace-pre-wrap break-words px-4 py-3 font-mono text-[12.5px] leading-relaxed text-slate-200 selection:bg-amber-300/30 sm:text-[13px]">
              {p.prompt}
            </pre>
            {long && !open && <span aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#040816] to-transparent" />}
          </div>
          {long && (
            <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} className="mt-2 text-xs font-semibold text-cyan-300 underline-offset-4 hover:underline">
              {open ? "Ringkas prompt" : "Tampilkan prompt lengkap"}
            </button>
          )}
        </div>

        {/* Actions */}
        <div className="mt-5 grid grid-cols-[1fr_auto] gap-2.5">
          <button
            type="button"
            onClick={doCopy}
            className={`inline-flex items-center justify-center gap-2 rounded-full px-5 py-3.5 text-sm font-bold transition-[background,color,box-shadow] duration-300 ${
              copyState === "done" ? "bg-emerald-400 text-slate-950 shadow-[0_10px_30px_-12px_rgba(52,211,153,.7)]" : "cta-gold text-slate-950"
            }`}
          >
            <span className="relative z-10 inline-flex items-center gap-2">
              {copyState === "done" ? <CheckIcon /> : <CopyIcon />}
              {copyState === "done" ? "Tersalin!" : copyState === "manual" ? "Tekan lama untuk salin" : "Copy Prompt"}
            </span>
          </button>
          <button
            type="button"
            onClick={doShare}
            aria-label={`Bagikan prompt ${p.title}`}
            className="grid h-full w-12 place-items-center rounded-full border border-white/15 text-slate-200 transition-colors hover:border-white/40 hover:text-white"
          >
            <ShareIcon />
          </button>
        </div>
        {compact && (
          <a href={promptPath(p)} className="mt-3 inline-flex items-center gap-1.5 self-start text-xs font-semibold text-slate-400 hover:text-white">
            <EyeIcon width={14} height={14} /> Buka halaman prompt
          </a>
        )}
      </div>
    </motion.article>
  );
}

/* ───────── Lightbox ───────── */
function ImageLightbox({ prompt: p, onClose }) {
  const closeRef = useRef(null);
  useEffect(() => {
    if (!p) return;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [p, onClose]);
  return (
    <AnimatePresence>
      {p && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label={p.title}
          className="fixed inset-0 z-[80] flex flex-col items-center justify-center bg-[#020617]/95 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: EASE_OUT }}
          onClick={onClose}
        >
          <button ref={closeRef} type="button" onClick={onClose} aria-label="Tutup" className="absolute right-4 top-4 grid h-11 w-11 place-items-center rounded-full border border-white/15 bg-white/5 text-white">
            <CloseSmall />
          </button>
          <motion.img
            src={p.image}
            alt={`Contoh hasil prompt: ${p.title}`}
            className="max-h-[80svh] max-w-full rounded-2xl object-contain shadow-2xl"
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.45, ease: EASE_OUT }}
            onClick={(e) => e.stopPropagation()}
          />
          <p className="mt-4 max-w-xl text-center font-display text-lg font-semibold text-white">{p.title}</p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ───────── Toast ───────── */
function useToast() {
  const [msg, setMsg] = useState("");
  const timer = useRef(0);
  const show = (m) => {
    setMsg(m);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setMsg(""), 3200);
  };
  const node = (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-5 z-[75] flex justify-center px-4">
      <AnimatePresence>
        {msg && (
          <motion.p
            key={msg}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.35, ease: EASE_OUT }}
            className="max-w-md rounded-2xl border border-emerald-300/30 bg-[#04120d]/95 px-4 py-3 text-center text-sm font-medium text-emerald-100 shadow-2xl shadow-black/60"
          >
            {msg}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
  return [node, show];
}

/* ───────── Upsell to a paid product (optional, set in admin) ───────── */
function PromptUpsell({ preview }) {
  const slug = lib.ctaProduct;
  const p = useMemo(() => (slug ? visibleProducts(store.products, preview).find((x) => x.slug === slug) : null), [slug, preview]);
  if (!p || (!preview && !isPublished(p))) return null;
  return (
    <motion.aside {...fade()} aria-label="Produk rekomendasi" className="card-navy mx-auto mt-14 grid max-w-5xl items-center gap-6 overflow-hidden rounded-[2rem] p-5 sm:p-7 md:grid-cols-[minmax(0,15rem)_1fr]">
      <a href={productPath(p)} className="block aspect-[4/3] overflow-hidden rounded-2xl">
        <Cover product={p} />
      </a>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-300">{lib.ctaKicker || "Mau hasil yang lebih tajam?"}</p>
        <h2 className="mt-2 font-display text-2xl font-bold leading-snug text-white sm:text-3xl">{p.name}</h2>
        {p.shortDescription && <p className="mt-2 text-sm leading-relaxed text-slate-400">{p.shortDescription}</p>}
        <div className="mt-4">
          <GoldPrice product={p} />
        </div>
        <div className="mt-5 grid gap-2.5 sm:grid-cols-[minmax(0,1fr)_auto]">
          <BuyButton product={p} size="lg" full />
          <a href={productPath(p) + (preview ? "?preview=1" : "")} className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 px-6 py-3.5 text-sm font-semibold text-slate-200 hover:border-white/40 hover:text-white sm:shrink-0">
            <EyeIcon /> Detail
          </a>
        </div>
      </div>
    </motion.aside>
  );
}

/* ───────── Full page: /products/prompts/ and /products/prompts/<slug>/ ───────── */
export function PromptLibraryPage({ preview = false, focusSlug = "", source = "" }) {
  const all = useMemo(() => visiblePrompts(store.prompts, preview), [preview]);
  const tags = useMemo(() => promptTags(all), [all]);
  const [q, setQ] = useState("");
  const [tag, setTag] = useState("");
  const [lightbox, setLightbox] = useState(null);
  const [toast, showToast] = useToast();
  const focused = all.find((p) => p.slug === focusSlug);
  const results = all.filter((p) => (!tag || String(p.category || "").toLowerCase() === tag.toLowerCase()) && matchesPrompt(p, q));
  const fromIG = /manychat|instagram|^ig/.test(source);

  useEffect(() => {
    document.title = focused ? `${focused.title} · Prompt AI · Hamdani Harfan` : `${lib.title || "Prompt AI Siap Pakai"} · Hamdani Harfan`;
    document.documentElement.lang = "id";
  }, [focused]);

  return (
    <>
      <section className="relative px-5 pb-8 pt-28 sm:px-8 md:pt-36">
        <div className="mx-auto max-w-6xl">
          <nav aria-label="Breadcrumb" className="text-xs text-slate-500">
            <a href="/products/" className="hover:text-white">Digital Store</a>
            <span className="mx-2">/</span>
            <span className="text-slate-300">Prompt AI</span>
          </nav>
          <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: EASE_OUT }} className="mt-6 inline-flex items-center gap-2 rounded-full border border-amber-300/30 bg-amber-300/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-200">
            <SparkIcon width={14} height={14} /> {lib.eyebrow || "Gratis · Free AI Prompts"}
          </motion.p>
          <motion.h1 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: EASE_OUT, delay: 0.06 }} className="mt-4 max-w-3xl font-display text-4xl font-bold leading-[1.05] tracking-tight text-white sm:text-5xl md:text-6xl">
            {lib.title || "Prompt AI Siap Pakai"}
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: EASE_OUT, delay: 0.12 }} className="mt-4 max-w-2xl text-base leading-relaxed text-slate-400 sm:text-lg">
            {lib.intro || "Lihat contoh hasilnya, salin prompt-nya dengan satu ketukan, lalu tempel di ChatGPT, Gemini, atau aplikasi AI favorit Anda."}
          </motion.p>

          {fromIG && (
            <p className="mt-6 rounded-2xl border border-cyan-300/20 bg-cyan-300/5 px-4 py-3 text-sm text-cyan-50">
              👋 Hai, dari Instagram! {focused ? <>Prompt yang Anda minta ada di bawah — ketuk <b>Copy Prompt</b>.</> : <>Pilih prompt, lalu ketuk <b>Copy Prompt</b>.</>}
            </p>
          )}

          {all.length > 1 && (
            <div className="mt-8 grid gap-3">
              <label className="relative block max-w-xl">
                <span className="sr-only">Cari prompt</span>
                <SearchIcon className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" width={18} height={18} />
                <input
                  type="search"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Cari prompt… (mis. kemerdekaan, logo, poster)"
                  className="w-full rounded-full border border-white/10 bg-[#060a19]/90 py-3.5 pl-11 pr-4 text-[16px] text-white placeholder:text-slate-500 outline-none transition focus:border-amber-200/50 focus:ring-4 focus:ring-amber-200/10 sm:text-sm"
                />
              </label>
              {tags.length > 1 && (
                <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 sm:mx-0 sm:flex-wrap sm:px-0" role="group" aria-label="Filter topik">
                  {["", ...tags].map((t) => (
                    <button
                      key={t || "all"}
                      type="button"
                      onClick={() => setTag(t)}
                      aria-pressed={tag === t}
                      className={`shrink-0 whitespace-nowrap rounded-full border px-4 py-2 text-xs font-semibold transition-colors ${tag === t ? "border-amber-300 bg-amber-300 text-slate-950" : "border-white/10 bg-white/[0.04] text-slate-300 hover:text-white"}`}
                    >
                      {t || "Semua"}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      <section aria-label="Daftar prompt" className="px-5 pb-20 sm:px-8">
        <div className="mx-auto max-w-6xl">
          {all.length === 0 ? (
            <div className="card-navy rounded-[2rem] px-6 py-16 text-center">
              <p className="font-display text-2xl font-bold text-white">Prompt segera hadir.</p>
              <p className="mx-auto mt-2 max-w-md text-sm text-slate-400">Koleksi prompt sedang disiapkan. Sambil menunggu, lihat produk di Digital Store.</p>
              <a href="/products/" className="cta-gold mt-6 inline-flex rounded-full px-6 py-3 text-sm font-bold text-slate-950">
                <span className="relative z-10">Ke Digital Store</span>
              </a>
            </div>
          ) : results.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-slate-300">Tidak ada prompt yang cocok dengan “{q}”.</p>
              <button type="button" onClick={() => (setQ(""), setTag(""))} className="mt-4 rounded-full border border-white/15 px-5 py-2.5 text-sm font-semibold text-slate-200 hover:bg-white/5">
                Tampilkan semua
              </button>
            </div>
          ) : (
            <>
              <p className="mb-5 text-sm text-slate-400">
                {results.length} prompt{q || tag ? " ditemukan" : ""}
              </p>
              <div className={`grid gap-6 ${results.length === 1 ? "mx-auto max-w-lg" : "sm:grid-cols-2 lg:grid-cols-3"}`}>
                {results.map((p, i) => (
                  <PromptCard key={p.slug} prompt={p} index={i} focused={p.slug === focusSlug} onImage={setLightbox} onToast={showToast} />
                ))}
              </div>
            </>
          )}
          <PromptUpsell preview={preview} />
        </div>
      </section>
      <ImageLightbox prompt={lightbox} onClose={() => setLightbox(null)} />
      {toast}
    </>
  );
}

/* ───────── Teaser on the store catalog (/products/) ───────── */
export function PromptTeaser({ preview = false }) {
  const all = useMemo(() => visiblePrompts(store.prompts, preview), [preview]);
  const [lightbox, setLightbox] = useState(null);
  const [toast, showToast] = useToast();
  if (!all.length) return null;
  const shown = all.slice(0, 3);
  return (
    <section id="prompts" aria-labelledby="prompts-title" className="scroll-mt-24 px-5 py-16 sm:px-8 md:py-20">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-300">
              <SparkIcon width={14} height={14} /> {lib.eyebrow || "Gratis · Free AI Prompts"}
            </p>
            <h2 id="prompts-title" className="mt-3 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
              {lib.title || "Prompt AI Siap Pakai"}
            </h2>
          </div>
          <a href={PROMPTS_BASE + (preview ? "?preview=1" : "")} className="inline-flex items-center gap-2 rounded-full border border-white/15 px-5 py-2.5 text-sm font-semibold text-slate-200 transition-colors hover:border-amber-200/60 hover:text-white">
            Lihat semua prompt{all.length > 3 ? ` (${all.length})` : ""} →
          </a>
        </div>
        <div className={`mt-8 grid gap-6 ${shown.length === 1 ? "max-w-lg" : "sm:grid-cols-2 lg:grid-cols-3"}`}>
          {shown.map((p, i) => (
            <PromptCard key={p.slug} prompt={p} index={i} compact onImage={setLightbox} onToast={showToast} />
          ))}
        </div>
      </div>
      <ImageLightbox prompt={lightbox} onClose={() => setLightbox(null)} />
      {toast}
    </section>
  );
}
