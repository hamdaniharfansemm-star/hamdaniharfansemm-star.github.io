import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import content from "../data/content.json";
import { EASE_OUT } from "../lib/motion.js";
import { isPublished, productPath, visibleProducts } from "./catalog.js";
import { BuyButton, Cover, GoldPrice } from "./ProductParts.jsx";
import { PROMPTS_BASE, copyText, hasTag, matchesPrompt, promptPath, promptTags, selectElementText, splitList, visiblePrompts, wordCount } from "./prompts.js";
import { ChevronIcon, CloseSmall, EyeIcon, SearchIcon, SparkIcon } from "./StoreIcons.jsx";

const store = content.store || {};
const lib = store.promptLibrary || {};
const fade = (delay = 0) => ({ initial: { opacity: 0, y: 16 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, amount: 0.1 }, transition: { duration: 0.7, ease: EASE_OUT, delay } });

/* ───────── icons ───────── */
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
  <svg width="14" height="14" {...ico} {...p}>
    <path d="M14 4h6v6M10 20H4v-6M20 4l-7 7M4 20l7-7" />
  </svg>
);
const GridIcon = (p) => (
  <svg width="15" height="15" {...ico} {...p}>
    <rect x="4" y="4" width="7" height="7" rx="1.5" />
    <rect x="13" y="4" width="7" height="7" rx="1.5" />
    <rect x="4" y="13" width="7" height="7" rx="1.5" />
    <rect x="13" y="13" width="7" height="7" rx="1.5" />
  </svg>
);
const SlidesIcon = (p) => (
  <svg width="15" height="15" {...ico} {...p}>
    <rect x="7" y="5" width="10" height="14" rx="2" />
    <path d="M3 7v10M21 7v10" />
  </svg>
);
const ChevronLeft = (p) => <ChevronIcon {...p} style={{ transform: "rotate(180deg)" }} />;

/* ───────── shared behaviour ───────── */
function useCopy() {
  const [state, setState] = useState("idle"); // idle | done | manual
  const timer = useRef(0);
  useEffect(() => () => clearTimeout(timer.current), []);
  const run = async (text, selectEl) => {
    const ok = await copyText(text);
    if (!ok) selectElementText(selectEl);
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

function useToast() {
  const [msg, setMsg] = useState("");
  const timer = useRef(0);
  const show = useCallback((m) => {
    setMsg(m);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setMsg(""), 3200);
  }, []);
  const node = (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-5 z-[95] flex justify-center px-4">
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

const copiedMsg = (ok) => (ok ? "Prompt tersalin — tinggal tempel (paste) di aplikasi AI Anda." : "Tekan lama teks prompt yang sudah ditandai, lalu pilih Salin.");
const firstTool = (tool) => {
  const list = splitList(tool);
  return list.length ? { first: list[0], more: list.length - 1 } : null;
};

/* ───────── Compact card (4 per row on desktop) ───────── */
export function PromptMiniCard({ prompt: p, onOpen, onToast, focused = false, eager = false }) {
  const [copyState, copy] = useCopy();
  const tags = splitList(p.category);
  const tool = firstTool(p.tool);
  const words = wordCount(p.prompt);
  const doCopy = async (e) => {
    e.stopPropagation();
    const ok = await copy(p.prompt, null);
    if (!ok) onOpen?.(p); // show the full text so it can be long-pressed
    onToast?.(copiedMsg(ok));
  };

  return (
    <article
      id={`prompt-${p.slug}`}
      className={`card-navy group @container relative flex h-full flex-col overflow-hidden rounded-2xl transition-[border-color,box-shadow] duration-500 [@media(hover:hover)]:hover:border-amber-200/30 ${focused ? "prompt-focus" : ""}`}
    >
      <button type="button" onClick={() => onOpen?.(p)} className="relative block aspect-[4/5] w-full overflow-hidden bg-[#0b1224] text-left" aria-label={`Buka detail prompt: ${p.title}`}>
        {p.image ? (
          <img
            src={p.image}
            alt={`Contoh hasil: ${p.title}`}
            loading={eager ? "eager" : "lazy"}
            decoding="async"
            draggable="false"
            className="h-full w-full object-cover object-[50%_20%] transition-transform duration-[1.2s] ease-[cubic-bezier(.22,1,.36,1)] [@media(hover:hover)]:group-hover:scale-[1.04]"
          />
        ) : (
          <div className="grid h-full w-full place-items-center bg-[radial-gradient(circle_at_30%_20%,rgba(124,58,237,.35),transparent_55%),radial-gradient(circle_at_75%_80%,rgba(245,196,81,.18),transparent_50%)]">
            <SparkIcon width={26} height={26} className="text-amber-200" />
          </div>
        )}
        <span aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-[#060a19] via-[#060a19]/50 to-transparent" />
        <span className="absolute left-2 top-2 flex max-w-[calc(100%-1rem)] flex-wrap gap-1">
          {p.status !== "published" && <span className="rounded-full bg-amber-400 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-slate-950">Draft</span>}
          {tool && (
            <span className="truncate rounded-full border border-white/15 bg-black/60 px-2 py-0.5 text-[9.5px] font-semibold text-white backdrop-blur-sm">
              {tool.first}
              {tool.more > 0 && <span className="text-slate-400"> +{tool.more}</span>}
            </span>
          )}
        </span>
        {/* title over the image bottom */}
        <span className="absolute inset-x-0 bottom-0 p-3">
          {tags[0] && <span className="block truncate text-[9.5px] font-bold uppercase tracking-[0.16em] text-amber-300">{tags[0]}</span>}
          <span className="mt-0.5 line-clamp-2 font-display text-[15px] font-bold leading-snug text-white @[240px]:text-base">{p.title}</span>
        </span>
      </button>

      <div className="flex flex-1 flex-col gap-2.5 p-3">
        <button type="button" onClick={() => onOpen?.(p)} className="block rounded-xl border border-white/[0.07] bg-[#040816] px-2.5 py-2 text-left transition-colors hover:border-white/15" aria-label={`Baca prompt lengkap: ${p.title}`}>
          <span className="line-clamp-3 font-mono text-[10.5px] leading-[1.55] text-slate-300 @[240px]:text-[11px]">{p.prompt}</span>
        </button>
        <p className="flex min-w-0 items-center gap-1.5 text-[10px] text-slate-500">
          <span className="shrink-0 whitespace-nowrap">{words} kata</span>
          {tags.length > 1 && (
            <>
              <span aria-hidden>·</span>
              <span className="truncate">{tags.slice(1, 3).join(", ")}{tags.length > 3 ? "…" : ""}</span>
            </>
          )}
        </p>
        <div className="mt-auto grid grid-cols-[1fr_auto] gap-2">
          <button
            type="button"
            onClick={doCopy}
            className={`inline-flex h-9 items-center justify-center gap-1.5 rounded-full px-3 text-xs font-bold transition-[background,box-shadow] duration-300 ${
              copyState === "done" ? "bg-emerald-400 text-slate-950" : "cta-gold text-slate-950"
            }`}
          >
            <span className="relative z-10 inline-flex items-center gap-1.5 whitespace-nowrap">
              {copyState === "done" ? <CheckIcon width={14} height={14} /> : <CopyIcon width={14} height={14} />}
              {copyState === "done" ? "Tersalin" : (
                <>
                  Copy<span className="hidden @[200px]:inline"> Prompt</span>
                </>
              )}
            </span>
          </button>
          <button type="button" onClick={() => onOpen?.(p)} aria-label={`Detail prompt ${p.title}`} className="grid h-9 w-9 place-items-center rounded-full border border-white/15 text-slate-200 transition-colors hover:border-white/40 hover:text-white">
            <EyeIcon width={15} height={15} />
          </button>
        </div>
      </div>
    </article>
  );
}

/* ───────── Carousel (swipe on touch, drag/arrows on desktop) ───────── */
export function PromptCarousel({ title, kicker, items, onOpen, onToast, focusSlug = "", action = null }) {
  const trackRef = useRef(null);
  const [state, setState] = useState({ start: true, end: false, from: 1, to: 1, frac: 1 });
  const drag = useRef(null);

  const measure = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    const gap = parseFloat(getComputedStyle(el).columnGap) || 0;
    const card = el.firstElementChild?.getBoundingClientRect().width || el.clientWidth;
    const step = card + gap;
    const n = items.length;
    const perView = Math.max(1, Math.min(n, Math.floor((el.clientWidth - (parseFloat(getComputedStyle(el).paddingLeft) || 0) + gap + 1) / step)));
    const end = el.scrollLeft >= max - 2;
    const first = end ? n - perView : Math.min(n - perView, Math.round(el.scrollLeft / step));
    setState({ start: el.scrollLeft <= 2, end, from: first + 1, to: first + perView, frac: perView / n + (max > 0 ? el.scrollLeft / max : 1) * (1 - perView / n) });
  }, [items.length]);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    let raf = 0;
    const on = () => {
      if (!raf) raf = requestAnimationFrame(() => ((raf = 0), measure()));
    };
    measure();
    el.addEventListener("scroll", on, { passive: true });
    window.addEventListener("resize", on);
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("scroll", on);
      window.removeEventListener("resize", on);
    };
  }, [measure]);

  // bring the focused card into view inside the track
  useEffect(() => {
    if (!focusSlug || !trackRef.current) return;
    const card = trackRef.current.querySelector(`#prompt-${CSS.escape(focusSlug)}`);
    const el = trackRef.current;
    if (card) el.scrollTo({ left: card.parentElement.offsetLeft - el.offsetLeft - (parseFloat(getComputedStyle(el).paddingLeft) || 0), behavior: "smooth" });
  }, [focusSlug]);

  const go = (dir) => {
    const el = trackRef.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.98, behavior: "smooth" });
  };

  // mouse drag-to-swipe (touch uses native scrolling)
  const onPointerDown = (e) => {
    if (e.pointerType !== "mouse" || e.button !== 0) return;
    const el = trackRef.current;
    drag.current = { x: e.clientX, left: el.scrollLeft, moved: false };
  };
  const onPointerMove = (e) => {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.x;
    if (!d.moved && Math.abs(dx) > 6) {
      d.moved = true;
      trackRef.current.classList.add("is-dragging");
    }
    if (d.moved) trackRef.current.scrollLeft = d.left - dx;
  };
  const endDrag = () => {
    const d = drag.current;
    drag.current = null;
    const el = trackRef.current;
    if (!d || !el) return;
    el.classList.remove("is-dragging");
    if (d.moved) {
      const first = el.firstElementChild;
      const gap = parseFloat(getComputedStyle(el).columnGap) || 0;
      const step = (first?.getBoundingClientRect().width || 1) + gap;
      el.scrollTo({ left: Math.round(el.scrollLeft / step) * step, behavior: "smooth" });
      const stop = (ev) => (ev.stopPropagation(), ev.preventDefault());
      el.addEventListener("click", stop, { capture: true, once: true });
      setTimeout(() => el.removeEventListener("click", stop, { capture: true }), 50);
    }
  };

  const showNav = !(state.start && state.end);

  return (
    <div className="relative min-w-0 max-w-full">
      <div className="mb-4 flex items-end justify-between gap-3">
        <div className="min-w-0">
          {kicker && <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-300/90">{kicker}</p>}
          {title && (
            <h2 className="mt-1 truncate font-display text-xl font-bold text-white sm:text-2xl">
              {title} <span className="font-sans text-sm font-medium text-slate-500">{items.length}</span>
            </h2>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {action}
          {showNav && (
            <>
              <button type="button" onClick={() => go(-1)} disabled={state.start} aria-label="Geser ke kiri" className="hidden h-10 w-10 place-items-center rounded-full border border-white/15 text-white transition-[opacity,background] hover:bg-white/10 disabled:opacity-30 sm:grid">
                <ChevronLeft width={18} height={18} />
              </button>
              <button type="button" onClick={() => go(1)} disabled={state.end} aria-label="Geser ke kanan" className="hidden h-10 w-10 place-items-center rounded-full border border-white/15 text-white transition-[opacity,background] hover:bg-white/10 disabled:opacity-30 sm:grid">
                <ChevronIcon width={18} height={18} />
              </button>
            </>
          )}
        </div>
      </div>

      <ul
        ref={trackRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerLeave={endDrag}
        aria-label={title || "Prompt"}
        className="prompt-track no-scrollbar -mx-5 flex min-w-0 snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-5 px-5 pb-2 sm:mx-0 sm:gap-4 sm:scroll-px-0 sm:px-0 lg:gap-5"
      >
        {items.map((p, i) => (
          <li key={p.slug} className="w-[calc((100%-0.75rem)/2.2)] shrink-0 snap-start sm:w-[calc((100%-2rem)/3)] lg:w-[calc((100%-3.75rem)/4)]">
            <PromptMiniCard prompt={p} onOpen={onOpen} onToast={onToast} focused={p.slug === focusSlug} eager={i < 4} />
          </li>
        ))}
      </ul>

      {showNav && (
        <div className="mt-3 flex items-center gap-3" aria-hidden>
          <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-gradient-to-r from-amber-200 to-amber-400 transition-[width] duration-300 ease-out" style={{ width: `${Math.min(100, state.frac * 100)}%` }} />
          </div>
          <span className="whitespace-nowrap font-mono text-[11px] text-slate-500">
            {state.from === state.to ? state.from : `${state.from}–${state.to}`} / {items.length}
          </span>
          {!state.end && <span className="text-[11px] text-slate-500 sm:hidden">geser →</span>}
        </div>
      )}
    </div>
  );
}

/* ───────── Detail sheet: full-screen on phones, centred dialog on desktop ─────────
   Built without drag physics or absolute pop-layout tricks so it can never end up
   off-screen. Swipe = plain touch events; image tap = full-screen zoom view. */
function useSwipe(onLeft, onRight) {
  const start = useRef(null);
  return {
    onTouchStart: (e) => {
      const t = e.touches[0];
      start.current = { x: t.clientX, y: t.clientY, at: Date.now() };
    },
    onTouchEnd: (e) => {
      const s0 = start.current;
      start.current = null;
      if (!s0) return;
      const t = e.changedTouches[0];
      const dx = t.clientX - s0.x;
      const dy = t.clientY - s0.y;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.4 && Date.now() - s0.at < 800) (dx < 0 ? onLeft : onRight)();
    },
  };
}

function ZoomView({ prompt: p, onClose }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && (e.stopPropagation(), onClose());
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [onClose]);
  return (
    <div role="dialog" aria-modal="true" aria-label={`Gambar penuh: ${p.title}`} className="prompt-fade fixed inset-0 z-[100] flex flex-col bg-black" onClick={onClose}>
      <div className="flex shrink-0 items-center justify-between gap-3 px-4 py-3 text-white">
        <p className="min-w-0 truncate text-sm font-semibold">{p.title}</p>
        <button type="button" onClick={onClose} aria-label="Tutup gambar" className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/10 hover:bg-white/20">
          <CloseSmall />
        </button>
      </div>
      <div className="flex min-h-0 flex-1 items-center justify-center p-2 [touch-action:pinch-zoom]">
        <img src={p.image} alt={`Contoh hasil: ${p.title}`} className="max-h-full max-w-full object-contain" onClick={(e) => e.stopPropagation()} />
      </div>
      <p className="shrink-0 pb-[max(1rem,env(safe-area-inset-bottom))] text-center text-xs text-slate-400">Cubit untuk memperbesar · ketuk area gelap untuk menutup</p>
    </div>
  );
}

function PromptSheet({ list, index, onIndex, onClose, onToast, syncUrl = false }) {
  const p = index >= 0 ? list[index] : null;
  const preRef = useRef(null);
  const closeRef = useRef(null);
  const scrollRef = useRef(null);
  const [copyState, copy] = useCopy();
  const [zoom, setZoom] = useState(false);
  const [dir, setDir] = useState(0);
  const open = !!p;
  const many = list.length > 1;

  const go = useCallback(
    (d) => {
      if (!list.length) return;
      setDir(d);
      setZoom(false);
      onIndex((index + d + list.length) % list.length);
    },
    [index, list.length, onIndex]
  );
  const swipe = useSwipe(() => many && go(1), () => many && go(-1));

  useEffect(() => {
    if (!open) return;
    const html = document.documentElement;
    const prev = [document.body.style.overflow, html.style.overflow];
    document.body.style.overflow = "hidden";
    html.style.overflow = "hidden";
    const t = setTimeout(() => closeRef.current?.focus({ preventScroll: true }), 60);
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight" && many) go(1);
      if (e.key === "ArrowLeft" && many) go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(t);
      [document.body.style.overflow, html.style.overflow] = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, go, onClose, many]);

  // new prompt → back to the top of the sheet
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
  }, [p?.slug]);

  // keep the address bar shareable: /products/prompts/<slug>/
  useEffect(() => {
    if (!syncUrl) return;
    const search = window.location.search;
    window.history.replaceState(null, "", (p ? promptPath(p) : PROMPTS_BASE) + search);
    document.title = p ? `${p.title} · Prompt AI · Hamdani Harfan` : `${lib.title || "Prompt AI Siap Pakai"} · Hamdani Harfan`;
  }, [p, syncUrl]);

  if (!open) return null;

  const doCopy = async () => onToast(copiedMsg(await copy(p.prompt, preRef.current)));
  const doShare = async () => {
    const r = await sharePrompt(p);
    if (r === "link") onToast("Link prompt tersalin — bagikan ke teman Anda.");
    if (r === "fail") onToast("Link tidak bisa disalin di browser ini.");
  };
  const tags = splitList(p.category);
  const tools = splitList(p.tool);
  const words = wordCount(p.prompt);
  const anim = dir > 0 ? "prompt-in-right" : dir < 0 ? "prompt-in-left" : "prompt-fade";

  return (
    <div className="fixed inset-0 z-[90] flex items-stretch justify-center md:items-center md:p-6">
      <button type="button" tabIndex={-1} aria-label="Tutup" onClick={onClose} className="prompt-fade absolute inset-0 hidden h-full w-full cursor-default bg-[#020617]/85 md:block" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="prompt-sheet-title"
        className="prompt-sheet relative flex h-screen w-full supports-[height:1dvh]:h-[100dvh] flex-col overflow-hidden bg-[#070c1d] md:grid md:h-[88vh] md:max-h-[52rem] md:max-w-5xl md:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] md:grid-rows-[minmax(0,1fr)] md:rounded-[1.75rem] md:border md:border-white/10 md:shadow-2xl"
      >
        {/* Top bar (phones) */}
        <div className="flex shrink-0 items-center justify-between gap-2 border-b border-white/10 bg-[#070c1d]/95 px-3 py-2.5 md:hidden">
          <button ref={closeRef} type="button" onClick={onClose} className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold text-slate-200 hover:bg-white/10">
            <ChevronLeft width={16} height={16} /> Kembali
          </button>
          {many && (
            <span className="font-mono text-xs text-slate-400">
              {index + 1} / {list.length}
            </span>
          )}
          <button type="button" onClick={doShare} aria-label="Bagikan prompt" className="grid h-10 w-10 place-items-center rounded-full text-slate-200 hover:bg-white/10">
            <ShareIcon />
          </button>
        </div>

        {/* Image */}
        <div className="relative hidden bg-black md:block md:h-full md:min-h-0">
          <SheetImage p={p} anim={anim} onZoom={() => setZoom(true)} swipe={swipe} many={many} go={go} index={index} total={list.length} desktop />
          <button type="button" onClick={onClose} aria-label="Tutup detail" className="absolute right-3 top-3 grid h-10 w-10 place-items-center rounded-full bg-black/60 text-white hover:bg-black/80">
            <CloseSmall />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex min-h-0 flex-1 flex-col md:h-full">
          <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
            <div className="bg-black md:hidden">
              <SheetImage p={p} anim={anim} onZoom={() => setZoom(true)} swipe={swipe} many={many} go={go} index={index} total={list.length} />
            </div>
            <div key={p.slug} className={`${anim} px-5 pb-6 pt-5 sm:px-7 sm:pt-7`}>
              {tags.length > 0 && (
                <ul className="flex flex-wrap gap-1.5" aria-label="Topik">
                  {tags.map((t) => (
                    <li key={t} className="rounded-full border border-amber-300/25 bg-amber-300/10 px-2.5 py-1 text-[10.5px] font-semibold text-amber-100">
                      {t}
                    </li>
                  ))}
                </ul>
              )}
              <h2 id="prompt-sheet-title" className="mt-3 font-display text-[1.6rem] font-bold leading-tight text-white sm:text-[1.75rem]">
                {p.title}
              </h2>
              <dl className="mt-4 grid grid-cols-3 gap-2 text-[11px]">
                <div className="rounded-xl border border-white/[0.07] bg-white/[0.03] px-3 py-2.5">
                  <dt className="text-slate-500">Dipakai di</dt>
                  <dd className="mt-0.5 line-clamp-2 font-semibold text-slate-200">{tools.length ? tools.join(", ") : "AI apa saja"}</dd>
                </div>
                <div className="rounded-xl border border-white/[0.07] bg-white/[0.03] px-3 py-2.5">
                  <dt className="text-slate-500">Panjang</dt>
                  <dd className="mt-0.5 font-semibold text-slate-200">{words} kata</dd>
                </div>
                <div className="rounded-xl border border-emerald-300/20 bg-emerald-300/[0.06] px-3 py-2.5">
                  <dt className="text-emerald-300/80">Harga</dt>
                  <dd className="mt-0.5 font-semibold text-emerald-200">Gratis</dd>
                </div>
              </dl>
              {p.note && <p className="mt-4 text-sm leading-relaxed text-slate-400">{p.note}</p>}

              <div className="mt-5 overflow-hidden rounded-2xl border border-white/10 bg-[#030611]">
                <div className="flex items-center justify-between border-b border-white/5 px-4 py-2">
                  <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500">Prompt lengkap</span>
                  <button type="button" onClick={doCopy} className={`inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[11px] font-semibold ${copyState === "done" ? "text-emerald-300" : "text-slate-300 hover:bg-white/5 hover:text-white"}`}>
                    {copyState === "done" ? <CheckIcon width={14} height={14} /> : <CopyIcon width={14} height={14} />}
                    {copyState === "done" ? "Tersalin" : "Salin"}
                  </button>
                </div>
                <pre ref={preRef} className="whitespace-pre-wrap break-words px-4 py-3 font-mono text-[12.5px] leading-relaxed text-slate-200 selection:bg-amber-300/30">
                  {p.prompt}
                </pre>
              </div>

              <ol className="mt-5 grid gap-2 text-xs text-slate-400 sm:grid-cols-3">
                {["Ketuk Copy Prompt", "Buka ChatGPT / Gemini (unggah foto bila diminta)", "Tempel prompt, kirim, selesai"].map((t, k) => (
                  <li key={t} className="flex items-start gap-2 rounded-xl bg-white/[0.03] px-3 py-2.5">
                    <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-amber-300 text-[10px] font-bold text-slate-950">{k + 1}</span>
                    {t}
                  </li>
                ))}
              </ol>
            </div>
          </div>

          {/* Sticky actions */}
          <div className="grid shrink-0 grid-cols-[1fr_auto] gap-2.5 border-t border-white/10 bg-[#070c1d] px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-7">
            <button
              type="button"
              onClick={doCopy}
              className={`inline-flex items-center justify-center gap-2 rounded-full px-5 py-3.5 text-sm font-bold transition-[background,box-shadow] duration-300 ${copyState === "done" ? "bg-emerald-400 text-slate-950" : "cta-gold text-slate-950"}`}
            >
              <span className="relative z-10 inline-flex items-center gap-2">
                {copyState === "done" ? <CheckIcon /> : <CopyIcon />}
                {copyState === "done" ? "Tersalin!" : copyState === "manual" ? "Tekan lama teks untuk salin" : "Copy Prompt"}
              </span>
            </button>
            {many ? (
              <button type="button" onClick={() => go(1)} aria-label="Prompt berikutnya" className="inline-flex items-center gap-1 rounded-full border border-white/15 px-4 text-sm font-semibold text-slate-200 hover:border-white/40 hover:text-white">
                <span className="hidden sm:inline">Berikutnya</span>
                <ChevronIcon width={16} height={16} />
              </button>
            ) : (
              <button type="button" onClick={doShare} aria-label="Bagikan prompt" className="grid w-12 place-items-center rounded-full border border-white/15 text-slate-200 hover:border-white/40 hover:text-white">
                <ShareIcon />
              </button>
            )}
          </div>
        </div>
      </div>
      {zoom && p.image && <ZoomView prompt={p} onClose={() => setZoom(false)} />}
    </div>
  );
}

function SheetImage({ p, anim, onZoom, swipe, many, go, index, total, desktop = false }) {
  return (
    <div className={`relative overflow-hidden ${desktop ? "h-full" : ""}`} {...swipe}>
      {p.image ? (
        <button type="button" onClick={onZoom} aria-label="Lihat gambar penuh" className={`group block w-full ${desktop ? "absolute inset-0 flex items-center justify-center" : "relative"}`}>
          <img key={p.slug} src={p.image} alt="" aria-hidden className="pointer-events-none absolute inset-0 h-full w-full scale-125 object-cover opacity-40 blur-2xl" />
          <img
            key={`${p.slug}-main`}
            src={p.image}
            alt={`Contoh hasil: ${p.title}`}
            draggable="false"
            className={`${anim} relative mx-auto block w-auto max-w-full select-none object-contain ${desktop ? "max-h-full" : "max-h-[62vh] supports-[height:1svh]:max-h-[62svh]"}`}
          />
          <span className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-black/60 px-2.5 py-1.5 text-[11px] font-semibold text-white">
            <ExpandIcon /> Perbesar
          </span>
        </button>
      ) : (
        <div className="grid h-56 place-items-center text-amber-200">
          <SparkIcon width={40} height={40} />
        </div>
      )}
      {many && (
        <>
          <button type="button" onClick={() => go(-1)} aria-label="Prompt sebelumnya" className="absolute left-2 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-black/55 text-white hover:bg-black/75">
            <ChevronLeft width={18} height={18} />
          </button>
          <button type="button" onClick={() => go(1)} aria-label="Prompt berikutnya" className="absolute right-2 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-black/55 text-white hover:bg-black/75">
            <ChevronIcon width={18} height={18} />
          </button>
          {desktop && (
            <span className="absolute bottom-3 left-3 rounded-full bg-black/60 px-3 py-1 font-mono text-[11px] text-white">
              {index + 1} / {total}
            </span>
          )}
        </>
      )}
    </div>
  );
}

/* ───────── Hero collage of the latest results ───────── */
function HeroCollage({ items, onOpen }) {
  if (!items.length) return null;
  // centre card on top, side cards fanned out behind it
  const order = items.length === 1 ? [items[0]] : items.length === 2 ? [items[1], items[0]] : [items[1], items[0], items[2]];
  const look = (k) => {
    if (order.length === 1) return { x: 0, r: 0, z: 30 };
    if (order.length === 2) return k === 0 ? { x: -38, r: -6, z: 10 } : { x: 18, r: 3, z: 30 };
    return [{ x: -56, r: -7, z: 10 }, { x: 0, r: 0, z: 30 }, { x: 56, r: 7, z: 20 }][k];
  };
  return (
    <div className="relative mx-auto h-48 w-full max-w-sm shrink-0 overflow-x-clip sm:h-60 md:mx-0 md:h-64 md:w-[22rem] md:overflow-visible" aria-label="Contoh hasil terbaru">
      {order.map((p, k) => {
        const { x, r, z } = look(k);
        return (
          <span key={p.slug} className="absolute inset-y-[4%] left-1/2 aspect-[4/5]" style={{ zIndex: z, transform: `translateX(calc(-50% + ${x}%)) rotate(${r}deg)` }}>
            <button
              type="button"
              onClick={() => onOpen(p)}
              aria-label={`Lihat prompt: ${p.title}`}
              className="prompt-float block h-full w-full overflow-hidden rounded-2xl border border-white/15 bg-[#0b1224] shadow-[0_24px_50px_-18px_rgba(0,0,0,.9)] transition-[border-color] duration-500 hover:border-amber-200/60"
              style={{ animationDelay: `${k * 0.7}s` }}
            >
              <img src={p.image} alt="" loading="eager" decoding="async" className="h-full w-full object-cover object-[50%_20%]" />
            </button>
          </span>
        );
      })}
    </div>
  );
}

/* ───────── Upsell to a paid product (optional, set in admin) ───────── */
function PromptUpsell({ preview }) {
  const slug = lib.ctaProduct;
  const p = useMemo(() => (slug ? visibleProducts(store.products, preview).find((x) => x.slug === slug) : null), [slug, preview]);
  if (!p || (!preview && !isPublished(p))) return null;
  return (
    <motion.aside {...fade()} aria-label="Produk rekomendasi" className="card-navy mx-auto mt-16 grid max-w-5xl items-center gap-6 overflow-hidden rounded-[2rem] p-5 sm:p-7 md:grid-cols-[minmax(0,15rem)_1fr]">
      <a href={productPath(p)} aria-label={p.name} className="block aspect-[4/3] overflow-hidden rounded-2xl">
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
          <a href={productPath(p) + (preview ? "?preview=1" : "")} className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 px-6 py-3.5 text-sm font-semibold text-slate-200 hover:border-white/40 hover:text-white">
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
  const [view, setView] = useState("slide"); // slide | grid
  const [sheet, setSheet] = useState({ list: [], index: -1 });
  const [toast, showToast] = useToast();
  const filtering = !!(q.trim() || tag);
  const results = useMemo(() => all.filter((p) => hasTag(p, tag) && matchesPrompt(p, q)), [all, q, tag]);
  const focused = all.find((p) => p.slug === focusSlug);
  const fromIG = /manychat|instagram|^ig/.test(source);

  // Topic rows appear once the library is large enough to need them
  const rows = useMemo(() => {
    if (all.length < 9) return [];
    return tags
      .map((t) => ({ tag: t, items: all.filter((p) => hasTag(p, t)) }))
      .filter((r) => r.items.length >= 3)
      .slice(0, 4);
  }, [all, tags]);

  const openFrom = useCallback((list) => (p) => setSheet({ list, index: list.findIndex((x) => x.slug === p.slug) }), []);

  // Opened from a ManyChat / shared link → open that prompt immediately
  useEffect(() => {
    document.documentElement.lang = "id";
    if (focused) setSheet({ list: all, index: all.indexOf(focused) });
    else document.title = `${lib.title || "Prompt AI Siap Pakai"} · Hamdani Harfan`;
  }, [focused, all]);

  const viewToggle = all.length > 4 && !filtering && (
    <div className="flex rounded-full border border-white/10 bg-white/[0.03] p-0.5" role="group" aria-label="Tampilan">
      {[
        ["slide", SlidesIcon, "Geser"],
        ["grid", GridIcon, "Grid"],
      ].map(([v, Icon, label]) => (
        <button key={v} type="button" onClick={() => setView(v)} aria-pressed={view === v} aria-label={`Tampilan ${label}`} className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${view === v ? "bg-white text-slate-950" : "text-slate-400 hover:text-white"}`}>
          <Icon /> <span className="hidden sm:inline">{label}</span>
        </button>
      ))}
    </div>
  );

  const grid = (list) => (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 lg:gap-5">
      {list.map((p, i) => (
        <motion.li key={p.slug} {...fade(Math.min(i % 4, 3) * 0.05)}>
          <PromptMiniCard prompt={p} onOpen={openFrom(list)} onToast={showToast} focused={p.slug === focusSlug} eager={i < 4} />
        </motion.li>
      ))}
    </ul>
  );

  return (
    <>
      <section className="relative px-5 pb-6 pt-28 sm:px-8 md:pt-36">
        <div className="mx-auto max-w-6xl">
          <nav aria-label="Breadcrumb" className="text-xs text-slate-500">
            <a href="/products/" className="hover:text-white">
              Digital Store
            </a>
            <span className="mx-2">/</span>
            <span className="text-slate-300">Prompt AI</span>
          </nav>
          <div className="mt-6 grid gap-6 md:grid-cols-[1fr_auto] md:items-end">
            <div>
              <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: EASE_OUT }} className="inline-flex items-center gap-2 rounded-full border border-amber-300/30 bg-amber-300/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-200">
                <SparkIcon width={14} height={14} /> {lib.eyebrow || "Gratis · Free AI Prompts"}
              </motion.p>
              <motion.h1 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: EASE_OUT, delay: 0.06 }} className="mt-4 max-w-3xl font-display text-4xl font-bold leading-[1.05] tracking-tight text-white sm:text-5xl">
                {lib.title || "Prompt AI Siap Pakai"}
              </motion.h1>
              <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: EASE_OUT, delay: 0.12 }} className="mt-3 max-w-2xl text-[15px] leading-relaxed text-slate-400 sm:text-base">
                {lib.intro || "Lihat contoh hasilnya, salin prompt-nya dengan satu ketukan, lalu tempel di ChatGPT, Gemini, atau aplikasi AI favorit Anda."}
              </motion.p>
            </div>
            {all.length > 0 && <HeroCollage items={all.filter((x) => x.image).slice(0, 3)} onOpen={openFrom(all)} />}
          </div>

          {all.length > 0 && (
            <ul className="mt-6 flex flex-wrap gap-2 text-xs" aria-label="Ringkasan">
              <li className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-slate-300"><b className="text-white">{all.length}</b> prompt</li>
              {tags.length > 0 && <li className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-slate-300"><b className="text-white">{tags.length}</b> topik</li>}
              <li className="rounded-full border border-emerald-300/25 bg-emerald-300/[0.07] px-3 py-1.5 font-semibold text-emerald-200">100% gratis · tanpa daftar</li>
            </ul>
          )}

          {fromIG && (
            <p className="mt-6 rounded-2xl border border-cyan-300/20 bg-cyan-300/5 px-4 py-3 text-sm text-cyan-50">
              👋 Hai, dari Instagram! {focused ? <>Prompt yang Anda minta sudah terbuka — ketuk <b>Copy Prompt</b>. Geser untuk melihat prompt lainnya.</> : <>Geser untuk melihat prompt, lalu ketuk <b>Copy Prompt</b>.</>}
            </p>
          )}

          {all.length > 1 && (
            <div className="mt-7 grid gap-3">
              <label className="relative block max-w-xl">
                <span className="sr-only">Cari prompt</span>
                <SearchIcon className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" width={18} height={18} />
                <input
                  type="search"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Cari prompt… (mis. poster, figure, kopi)"
                  className="w-full rounded-full border border-white/10 bg-[#060a19]/90 py-3 pl-11 pr-4 text-[16px] text-white placeholder:text-slate-500 outline-none transition focus:border-amber-200/50 focus:ring-4 focus:ring-amber-200/10 sm:text-sm"
                />
              </label>
              {tags.length > 1 && (
                <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 sm:mx-0 sm:flex-wrap sm:px-0" role="group" aria-label="Filter topik">
                  {["", ...tags.slice(0, 14)].map((t) => (
                    <button
                      key={t || "all"}
                      type="button"
                      onClick={() => setTag(t)}
                      aria-pressed={tag === t}
                      className={`shrink-0 whitespace-nowrap rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors ${tag === t ? "border-amber-300 bg-amber-300 text-slate-950" : "border-white/10 bg-white/[0.04] text-slate-300 hover:text-white"}`}
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

      <section aria-label="Daftar prompt" className="px-5 pb-20 pt-4 sm:px-8">
        <div className="mx-auto max-w-6xl">
          {all.length === 0 ? (
            <div className="card-navy rounded-[2rem] px-6 py-16 text-center">
              <p className="font-display text-2xl font-bold text-white">Prompt segera hadir.</p>
              <p className="mx-auto mt-2 max-w-md text-sm text-slate-400">Koleksi prompt sedang disiapkan. Sambil menunggu, lihat produk di Digital Store.</p>
              <a href="/products/" className="cta-gold mt-6 inline-flex rounded-full px-6 py-3 text-sm font-bold text-slate-950">
                <span className="relative z-10">Ke Digital Store</span>
              </a>
            </div>
          ) : filtering ? (
            results.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-slate-300">Tidak ada prompt yang cocok{q ? <> dengan “{q}”</> : null}.</p>
                <button type="button" onClick={() => (setQ(""), setTag(""))} className="mt-4 rounded-full border border-white/15 px-5 py-2.5 text-sm font-semibold text-slate-200 hover:bg-white/5">
                  Tampilkan semua
                </button>
              </div>
            ) : (
              <>
                <p className="mb-4 text-sm text-slate-400">
                  {results.length} prompt ditemukan{tag ? <> · topik <b className="text-amber-200">{tag}</b></> : null}
                </p>
                {grid(results)}
              </>
            )
          ) : view === "grid" ? (
            <>
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="font-display text-xl font-bold text-white sm:text-2xl">Semua prompt</h2>
                {viewToggle}
              </div>
              {grid(all)}
            </>
          ) : (
            <div className="grid grid-cols-[minmax(0,1fr)] gap-12">
              <PromptCarousel kicker="Terbaru" title="Semua prompt" items={all} onOpen={openFrom(all)} onToast={showToast} focusSlug={focusSlug} action={viewToggle} />
              {rows.map((r) => (
                <PromptCarousel key={r.tag} kicker="Topik" title={r.tag} items={r.items} onOpen={openFrom(r.items)} onToast={showToast} />
              ))}
            </div>
          )}
          <PromptUpsell preview={preview} />
        </div>
      </section>

      <PromptSheet list={sheet.list} index={sheet.index} onIndex={(i) => setSheet((s) => ({ ...s, index: i }))} onClose={() => setSheet((s) => ({ ...s, index: -1 }))} onToast={showToast} syncUrl />
      {toast}
    </>
  );
}

/* ───────── Teaser on the store catalog (/products/) ───────── */
export function PromptTeaser({ preview = false }) {
  const all = useMemo(() => visiblePrompts(store.prompts, preview), [preview]);
  const [index, setIndex] = useState(-1);
  const [toast, showToast] = useToast();
  if (!all.length) return null;
  const items = all.slice(0, 12);
  return (
    <section id="prompts" aria-label="Prompt AI gratis" className="scroll-mt-24 px-5 py-16 sm:px-8 md:py-20">
      <div className="mx-auto max-w-6xl">
        <PromptCarousel
          kicker={lib.eyebrow || "Gratis · Free AI Prompts"}
          title={lib.title || "Prompt AI Siap Pakai"}
          items={items}
          onOpen={(p) => setIndex(items.findIndex((x) => x.slug === p.slug))}
          onToast={showToast}
          action={
            <a href={PROMPTS_BASE + (preview ? "?preview=1" : "")} className="hidden whitespace-nowrap rounded-full border border-white/15 px-4 py-2 text-xs font-semibold text-slate-200 transition-colors hover:border-amber-200/60 hover:text-white md:inline-flex">
              Lihat semua →
            </a>
          }
        />
        <a href={PROMPTS_BASE + (preview ? "?preview=1" : "")} className="mt-5 inline-flex rounded-full border border-white/15 px-5 py-2.5 text-sm font-semibold text-slate-200 hover:border-amber-200/60 hover:text-white md:hidden">
          Lihat semua prompt →
        </a>
      </div>
      <PromptSheet list={items} index={index} onIndex={setIndex} onClose={() => setIndex(-1)} onToast={showToast} />
      {toast}
    </section>
  );
}
