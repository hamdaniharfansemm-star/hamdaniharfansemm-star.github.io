import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { fadeUp, spring } from "../lib/motion.js";
import { checkoutUrlOf, isPublished } from "./catalog.js";
import { smooth, useTilt } from "./effects.js";
import { BuyButton, Cover, FitImage, Price } from "./ProductParts.jsx";

export { tFor } from "./i18n.js";

/* ───────── Icons ───────── */
const I = {
  bolt: <path d="M13 2 4 14h7l-1 8 9-12h-7z" />,
  target: (
    <>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="12" cy="12" r=".6" fill="currentColor" />
    </>
  ),
  file: (
    <>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <path d="M14 3v5h5M9 13h6M9 17h4" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3 4 6v6c0 5 3.4 8.3 8 9 4.6-.7 8-4 8-9V6l-8-3z" />
      <path d="m9 12 2 2 4-4" />
    </>
  ),
  qr: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <path d="M14 14h3v3h-3zM20 14v.01M14 20h.01M17 20h4v-3" />
    </>
  ),
  infinity: <path d="M18.2 8.5c-1.9 0-3.3 1.6-6.2 4.5s-4.3 4.5-6.2 4.5a3.5 3.5 0 0 1 0-7c1.9 0 3.3 1.6 6.2 4.5s4.3 4.5 6.2 4.5a3.5 3.5 0 0 0 0-7z" />,
  lock: (
    <>
      <rect x="4" y="10" width="16" height="11" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </>
  ),
  mail: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </>
  ),
  star: <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3 6.5 20.2l1-6.2L3 9.6l6.2-.9z" />,
  check: <path d="m5 12 5 5L20 7" />,
};
export const ICON_NAMES = Object.keys(I);

export function Glyph({ name, size = 22, className = "", filled = false }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={className}
    >
      {I[name] || I.check}
    </svg>
  );
}

/* ───────── 3D tablet mockup for the product cover ───────── */
/** Screen shape follows the image (portrait / square / landscape) so nothing gets cropped. */
function useImageRatio(url) {
  const [ratio, setRatio] = useState(4 / 3);
  useEffect(() => {
    if (!url) return setRatio(4 / 3);
    let live = true;
    const img = new Image();
    img.onload = () => live && img.naturalWidth && setRatio(Math.min(16 / 9, Math.max(3 / 4, img.naturalWidth / img.naturalHeight)));
    img.src = url;
    return () => {
      live = false;
    };
  }, [url]);
  return ratio;
}

export function DeviceMockup({ product: p, src = "", className = "" }) {
  const ref = useRef(null);
  useTilt(ref, 3, 0);
  const ratio = useImageRatio(src || p.coverImage);
  const portrait = ratio < 0.95;
  return (
    <div className={`relative mx-auto w-full ${className}`} style={{ perspective: "1400px", maxWidth: portrait ? `${Math.round(ratio * 36)}rem` : undefined }}>
      {/* glow */}
      <div aria-hidden className="absolute inset-x-[8%] bottom-[-6%] top-[12%] rounded-[3rem] bg-[radial-gradient(closest-side,rgba(245,196,81,0.28),rgba(59,130,246,0.18),transparent)] blur-2xl" />
      <motion.div
        initial={{ opacity: 0, y: 32, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={smooth(0.15, 1.1)}
        className="float-soft"
      >
        <div ref={ref} className="tilt relative rounded-[2.2rem] border border-white/15 bg-gradient-to-br from-slate-700 via-slate-900 to-black p-3 shadow-[0_50px_100px_-30px_rgba(0,0,0,0.85)] sm:p-3.5">
          <span className="tilt-glare" aria-hidden />
          {/* camera */}
          <span aria-hidden className="absolute left-1/2 top-1.5 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-slate-600 sm:top-[7px]" />
          {/* screen */}
          <div className="relative overflow-hidden rounded-[1.5rem] bg-slate-950 ring-1 ring-black/60 transition-[aspect-ratio] duration-500" style={{ aspectRatio: ratio }}>
            <AnimatePresence mode="wait">
              <motion.div key={src || "cover"} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }} className="h-full w-full">
                {src ? <FitImage src={src} alt={`${p.name} preview`} eager /> : <Cover product={p} eager />}
              </motion.div>
            </AnimatePresence>
            <div aria-hidden className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,rgba(255,255,255,0.14)_0%,transparent_32%,transparent_70%,rgba(255,255,255,0.05)_100%)]" />
          </div>
        </div>
      </motion.div>
    </div>
  );
}

/* ───────── Value proposition (3 key points) ───────── */
export function ValueProps({ items, title }) {
  if (!items?.length) return null;
  return (
    <section aria-label={title} className="px-5 py-14 sm:px-8 md:py-16">
      <ul className="mx-auto grid max-w-6xl gap-4 md:grid-cols-3">
        {items.map((v, i) => (
          <motion.li key={v.title} {...fadeUp(i * 0.08)} className="glass group relative overflow-hidden rounded-3xl p-6 sm:p-7">
            <div aria-hidden className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-amber-300/10 blur-2xl transition-opacity group-hover:opacity-100" />
            <span className="icon-pop relative grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-amber-300 to-amber-500 text-slate-950 shadow-lg shadow-amber-500/20">
              <Glyph name={v.icon || "check"} size={22} />
            </span>
            <h3 className="relative mt-5 font-display text-xl font-bold text-white">{v.title}</h3>
            {v.text && <p className="relative mt-2 text-sm leading-relaxed text-slate-400">{v.text}</p>}
          </motion.li>
        ))}
      </ul>
    </section>
  );
}

/* ───────── Testimonials — renders ONLY real entries added by the owner ───────── */
const initials = (name = "") =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("") || "•";

export function Testimonials({ items, title }) {
  const list = (items || []).filter((t) => t?.name?.trim() && t?.text?.trim());
  if (!list.length) return null;
  return (
    <section aria-labelledby="reviews-title" className="px-5 py-16 sm:px-8 md:py-20">
      <div className="mx-auto max-w-6xl">
        <motion.h2 {...fadeUp()} id="reviews-title" className="font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
          {title}
        </motion.h2>
        <ul className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {list.map((t, i) => {
            const rating = Math.max(0, Math.min(5, Math.round(Number(t.rating) || 0)));
            return (
              <motion.li key={t.name + i} {...fadeUp(i * 0.06)} className="glass flex flex-col rounded-3xl p-6">
                {rating > 0 && (
                  <div className="flex gap-0.5 text-amber-300" role="img" aria-label={`${rating} out of 5 stars`}>
                    {Array.from({ length: 5 }, (_, k) => (
                      <Glyph key={k} name="star" size={16} filled={k < rating} className={k < rating ? "" : "text-slate-600"} />
                    ))}
                  </div>
                )}
                <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-slate-200">“{t.text}”</blockquote>
                <figcaption className="mt-5 flex items-center gap-3">
                  {t.photo ? (
                    <img src={t.photo} alt="" loading="lazy" className="h-10 w-10 rounded-full object-cover" />
                  ) : (
                    <span className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-amber-300/30 to-cyan-400/20 text-sm font-bold text-amber-100">{initials(t.name)}</span>
                  )}
                  <span>
                    <span className="block text-sm font-semibold text-white">{t.name}</span>
                    {t.role && <span className="block text-xs text-slate-400">{t.role}</span>}
                  </span>
                </figcaption>
              </motion.li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

/* ───────── Payment, security & access strip ───────── */
export function GuaranteeStrip({ items, title, compact = false }) {
  const list = (items || []).filter((g) => g?.title);
  if (!list.length) return null;
  if (compact) {
    return (
      <ul className="grid grid-cols-2 gap-2" aria-label={title}>
        {list.map((g) => (
          <li key={g.title} className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-[11px] font-medium leading-tight text-slate-300">
            <Glyph name={g.icon || "shield"} size={15} className="shrink-0 text-amber-300" />
            {g.title}
          </li>
        ))}
      </ul>
    );
  }
  return (
    <section aria-label={title} className="px-5 pb-6 sm:px-8">
      <motion.ul {...fadeUp()} className="glass mx-auto grid max-w-6xl gap-px overflow-hidden rounded-3xl sm:grid-cols-2 lg:grid-cols-4">
        {list.map((g) => (
          <li key={g.title} className="flex items-start gap-3 bg-slate-950/30 p-5">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-amber-300/30 bg-amber-300/10 text-amber-300">
              <Glyph name={g.icon || "shield"} size={19} />
            </span>
            <span>
              <span className="block text-sm font-semibold text-white">{g.title}</span>
              {g.text && <span className="mt-0.5 block text-xs leading-relaxed text-slate-400">{g.text}</span>}
            </span>
          </li>
        ))}
      </motion.ul>
    </section>
  );
}

/* ───────── Sticky buy bar on mobile (appears after the main CTA scrolls away) ───────── */
export function StickyBuyBar({ product: p, watchRef }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const el = watchRef?.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setShow(!e.isIntersecting && e.boundingClientRect.top < 0), { threshold: 0 });
    io.observe(el);
    return () => io.disconnect();
  }, [watchRef]);
  if (!isPublished(p) || !checkoutUrlOf(p)) return null;
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: "120%" }}
          animate={{ y: 0 }}
          exit={{ y: "120%" }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="glass-strong fixed inset-x-3 bottom-3 z-40 flex items-center justify-between gap-3 rounded-2xl px-4 py-3 shadow-2xl shadow-black/60 lg:hidden"
        >
          <span className="min-w-0">
            <span className="block truncate text-xs text-slate-400">{p.name}</span>
            <Price product={p} className="text-lg" />
          </span>
          <BuyButton product={p} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
