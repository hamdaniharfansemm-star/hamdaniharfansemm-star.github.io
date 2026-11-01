import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { profile } from "../data/portfolio.js";
import { categoryById, checkoutUrlOf, discountPercent, formatPrice, isNew, isPublished, productPath } from "./catalog.js";
import { canAddToCart, useCart } from "./cart.jsx";
import { ripple, useTilt } from "./effects.js";
import { tFor } from "./i18n.js";
import { BagIcon, BagPlusIcon, ChevronIcon, ExternalIcon, EyeIcon, LockIcon, categoryIcon } from "./StoreIcons.jsx";

// Per-category cover tint (stays inside the site's night / cyan / indigo / cream palette)
const tints = {
  ebooks: ["#0e7490", "#22d3ee"],
  blueprints: ["#1e3a8a", "#60a5fa"],
  apps: ["#0f766e", "#5eead4"],
  courses: ["#3730a3", "#a5b4fc"],
  templates: ["#334155", "#f4e8d1"],
  "ai-tools": ["#7c3aed", "#f0abfc"],
};

// Rich backdrop behind each card's device mockup (navy base + category glow)
const stage = {
  ebooks: "radial-gradient(90% 80% at 20% 0%, rgba(34,211,238,.35), transparent 60%), radial-gradient(70% 70% at 100% 100%, rgba(245,196,81,.22), transparent 60%)",
  blueprints: "radial-gradient(90% 80% at 15% 0%, rgba(59,130,246,.40), transparent 60%), radial-gradient(70% 70% at 100% 100%, rgba(124,58,237,.30), transparent 60%)",
  apps: "radial-gradient(90% 80% at 20% 0%, rgba(20,184,166,.35), transparent 60%), radial-gradient(70% 70% at 100% 100%, rgba(59,130,246,.28), transparent 60%)",
  "ai-tools": "radial-gradient(90% 80% at 20% 0%, rgba(168,85,247,.45), transparent 60%), radial-gradient(70% 70% at 100% 100%, rgba(236,72,153,.25), transparent 60%)",
  templates: "radial-gradient(90% 80% at 20% 0%, rgba(148,163,184,.30), transparent 60%), radial-gradient(70% 70% at 100% 100%, rgba(245,196,81,.25), transparent 60%)",
  courses: "radial-gradient(90% 80% at 20% 0%, rgba(99,102,241,.40), transparent 60%), radial-gradient(70% 70% at 100% 100%, rgba(34,211,238,.22), transparent 60%)",
};

/** Real cover image when provided; otherwise a clean designed placeholder (never a fake product shot). */
export function Cover({ product: p, className = "", eager = false, compact = false }) {
  if (p.coverImage) {
    return (
      <img
        src={p.coverImage}
        alt={`${p.name} cover`}
        loading={eager ? "eager" : "lazy"}
        decoding="async"
        className={`h-full w-full object-cover ${className}`}
      />
    );
  }
  const [a, b] = tints[p.category] || tints.templates;
  const Icon = categoryIcon[p.category] || categoryIcon.templates;
  return (
    <div
      role="img"
      aria-label={`${p.name} — cover image coming soon`}
      className={`relative grid h-full w-full place-items-center overflow-hidden ${className}`}
      style={{
        background: `radial-gradient(120% 90% at 15% 10%, ${a}cc 0%, transparent 55%), radial-gradient(90% 80% at 100% 100%, ${b}33 0%, transparent 60%), #0b1224`,
      }}
    >
      {!compact && <div className="bg-code-grid absolute inset-0 opacity-60 [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_75%)]" />}
      <div className="relative flex flex-col items-center gap-3 px-6 text-center">
        <span
          className={`icon-pop grid place-items-center rounded-2xl border border-white/15 bg-white/5 backdrop-blur ${compact ? "h-9 w-9" : "h-14 w-14"}`}
          style={{ color: b }}
        >
          <Icon width={compact ? 18 : 28} height={compact ? 18 : 28} />
        </span>
        {!compact && <span className="line-clamp-3 max-w-[20rem] font-display text-base font-bold leading-tight text-white/90 sm:text-lg">{p.name}</span>}
      </div>
    </div>
  );
}

/**
 * Status badges — only shown when the product data says so (no invented claims):
 *  Bestseller (owner sets `bestseller`) · Sale −x% (originalPrice > price) · New (releaseDate ≤ 45 days) · Featured · Demo/Draft
 */
export function Badges({ product: p, className = "" }) {
  const items = [];
  if (!isPublished(p)) items.push({ t: p.status === "demo" ? "Demo" : "Draft", c: "border-amber-300/40 bg-amber-300/15 text-amber-200" });
  if (p.bestseller) items.push({ t: "Bestseller", c: "badge-shimmer border-amber-200/50 bg-gradient-to-r from-amber-400/30 to-orange-400/25 text-amber-100" });
  const off = discountPercent(p);
  if (off) items.push({ t: `Sale −${off}%`, c: "badge-shimmer border-rose-300/50 bg-gradient-to-r from-rose-500/35 to-fuchsia-500/25 text-rose-50" });
  if (isNew(p)) items.push({ t: "New", c: "badge-pulse border-cyan-300/50 bg-cyan-300/15 text-cyan-100" });
  if (p.featured) items.push({ t: "Featured", c: "badge-shimmer border-cream/40 bg-cream/15 text-cream" });
  if (!items.length) return null;
  return (
    <div className={`flex flex-wrap gap-1.5 ${className}`}>
      {items.map((i) => (
        <span key={i.t} className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider backdrop-blur-md ${i.c}`}>
          {i.t}
        </span>
      ))}
    </div>
  );
}

export function Price({ product: p, className = "", size = "md" }) {
  const text = formatPrice(p.price, p.currency);
  if (!text) return <span className={`text-sm text-slate-400 ${className}`}>Price to be announced</span>;
  const was = discountPercent(p) ? formatPrice(p.originalPrice, p.currency) : "";
  return (
    <span className={`inline-flex flex-wrap items-baseline gap-x-2 ${className}`}>
      <span className="font-display font-bold text-white">{text}</span>
      {was && (
        <s className={`text-slate-500 ${size === "lg" ? "text-base" : "text-xs"}`} aria-label={`Original price ${was}`}>
          {was}
        </s>
      )}
    </span>
  );
}

const askHref = (p) => `https://wa.me/${profile.whatsapp}?text=${encodeURIComponent(`Hi Hamdani, I'm interested in "${p.name}" from your Digital Store.`)}`;

/**
 * Buy button rules (Mayar):
 *  - published + valid https checkoutUrl → opens the product's own Mayar checkout
 *  - demo / draft → never purchasable
 *  - published without checkoutUrl → "Not available yet"
 */
export function BuyButton({ product: p, size = "md", full = false }) {
  const url = checkoutUrlOf(p);
  const t = tFor(p);
  const lg = size === "lg";
  const pad = lg ? "px-6 py-4 text-sm" : "px-4 py-2.5 text-xs";
  const w = full ? "w-full" : "";

  if (!isPublished(p)) {
    return (
      <span className={`inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full border border-amber-300/30 bg-amber-300/10 font-semibold text-amber-100 ${pad} ${w}`}>
        {lg ? "Demo — not for sale" : "Demo"}
      </span>
    );
  }
  if (!url) {
    return (
      <span className={`inline-flex cursor-not-allowed items-center justify-center gap-2 whitespace-nowrap rounded-full border border-white/10 bg-white/5 font-semibold text-slate-400 ${pad} ${w}`} aria-disabled="true">
        {p.lang === "id" ? "Segera hadir" : "Coming soon"}
      </span>
    );
  }
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      onPointerDown={ripple}
      aria-label={`${t.buy}: ${p.name} — secure checkout opens in a new tab`}
      className={`ripple cta-gold group/buy inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-full font-bold text-slate-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300 ${pad} ${w}`}
    >
      <BagIcon className="relative z-10 transition-transform group-hover/buy:-rotate-12 group-hover/buy:scale-110" width={lg ? 17 : 15} height={lg ? 17 : 15} />
      <span className="relative z-10">{t.buy}</span>
      {lg && <ExternalIcon width={14} height={14} className="relative z-10 opacity-60" />}
    </a>
  );
}

/** Add-to-cart with "Added ✓" feedback. Hidden for products that can't be bought. */
export function AddToCartButton({ product: p, size = "md", full = false, className = "" }) {
  const cart = useCart();
  const [flash, setFlash] = useState(false);
  if (!cart || !canAddToCart(p)) return null;
  const inCart = cart.has(p.slug);
  const pad = size === "lg" ? "px-6 py-4 text-sm" : "px-4 py-2.5 text-xs";

  const onClick = () => {
    if (inCart) return cart.setOpen(true);
    cart.add(p);
    setFlash(true);
    setTimeout(() => setFlash(false), 1400);
  };

  return (
    <button
      type="button"
      onClick={onClick}
      onPointerDown={ripple}
      aria-label={inCart ? `${p.name} is in your cart — open cart` : `Add ${p.name} to cart`}
      className={`ripple inline-flex items-center justify-center gap-2 rounded-full border font-semibold transition-colors ${pad} ${full ? "w-full" : ""} ${
        flash ? "border-emerald-300/60 bg-emerald-400/15 text-emerald-200" : inCart ? "border-cyan-300/40 bg-cyan-300/10 text-cyan-100 hover:bg-cyan-300/20" : "border-white/15 text-slate-100 hover:border-cream/60 hover:bg-white/5 hover:text-cream"
      } ${className}`}
    >
      <span className="relative z-10 inline-flex items-center gap-1.5">
        {flash ? (
          <>
            <motion.svg initial={{ scale: 0 }} animate={{ scale: 1 }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="m5 12 5 5L20 7" />
            </motion.svg>
            Added
          </>
        ) : inCart ? (
          "In cart"
        ) : (
          <>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden>
              <path d="M12 5v14M5 12h14" />
            </svg>
            {size === "lg" ? tFor(p).addToCart : tFor(p).addShort}
          </>
        )}
      </span>
    </button>
  );
}

export function AskLink({ product: p, className = "" }) {
  return (
    <a href={askHref(p)} target="_blank" rel="noopener noreferrer" className={`inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-300 underline-offset-4 hover:underline ${className}`}>
      {tFor(p).ask}
    </a>
  );
}

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  show: (i) => ({ opacity: 1, y: 0, transition: { duration: 0.75, ease: [0.22, 1, 0.36, 1], delay: Math.min(i, 8) * 0.07 } }),
};

/** 3D device mockup for a card, chosen by category: book · phone · laptop · tablet. */
export function DeviceArt({ product: p }) {
  const device = categoryById(p.category)?.device || "tablet";
  const screen = <Cover product={p} compact />;
  if (device === "book") {
    return (
      <div className="device-3d device-book relative h-[74%] aspect-[3/4]">
        <div className="absolute inset-y-[3%] -right-[5%] w-[8%] rounded-r-md bg-[repeating-linear-gradient(180deg,#e2e8f0_0_2px,#cbd5e1_2px_3px)] shadow-inner" />
        <div className="relative h-full w-full overflow-hidden rounded-r-lg rounded-l-sm shadow-[12px_18px_40px_-12px_rgba(0,0,0,0.8)] ring-1 ring-white/10">
          {screen}
          <div className="pointer-events-none absolute inset-y-0 left-0 w-[9%] bg-gradient-to-r from-black/45 via-white/10 to-transparent" />
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,rgba(255,255,255,0.18),transparent_35%)]" />
        </div>
      </div>
    );
  }
  if (device === "phone") {
    return (
      <div className="device-3d relative h-[84%] aspect-[9/19] rounded-[1.6rem] border border-white/15 bg-gradient-to-b from-slate-700 to-slate-950 p-[5px] shadow-[14px_22px_44px_-14px_rgba(0,0,0,0.85)]">
        <div className="relative h-full w-full overflow-hidden rounded-[1.25rem] bg-slate-950">
          {screen}
          <span className="absolute left-1/2 top-1.5 h-1.5 w-10 -translate-x-1/2 rounded-full bg-black/80" />
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,rgba(255,255,255,0.16),transparent_38%)]" />
        </div>
      </div>
    );
  }
  if (device === "laptop") {
    return (
      <div className="device-3d relative w-[78%]">
        <div className="rounded-t-xl border border-white/15 bg-gradient-to-b from-slate-700 to-slate-900 p-[5px] pb-[6px] shadow-[0_18px_40px_-14px_rgba(0,0,0,0.85)]">
          <div className="relative aspect-[16/10] overflow-hidden rounded-md bg-slate-950">
            {screen}
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,rgba(255,255,255,0.14),transparent_38%)]" />
          </div>
        </div>
        <div className="mx-[-7%] h-2.5 rounded-b-xl bg-gradient-to-b from-slate-500 to-slate-800 shadow-[0_12px_24px_-8px_rgba(0,0,0,0.8)]" />
      </div>
    );
  }
  return (
    <div className="device-3d relative w-[74%] rounded-[1.1rem] border border-white/15 bg-gradient-to-br from-slate-700 to-slate-950 p-[6px] shadow-[14px_22px_44px_-14px_rgba(0,0,0,0.85)]">
      <div className="relative aspect-[4/3] overflow-hidden rounded-[0.8rem] bg-slate-950">
        {screen}
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,rgba(255,255,255,0.14),transparent_38%)]" />
      </div>
    </div>
  );
}

function CategoryChip({ product: p, className = "" }) {
  const cat = categoryById(p.category);
  if (!cat) return null;
  const Icon = categoryIcon[cat.id];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-slate-950/55 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-100 backdrop-blur-md ${className}`}>
      <Icon width={12} height={12} className="text-amber-300" />
      {cat.short}
    </span>
  );
}

/** Gold price with strikethrough + discount chip. */
export function GoldPrice({ product: p, className = "" }) {
  const text = formatPrice(p.price, p.currency);
  if (!text) return <span className={`text-sm text-slate-400 ${className}`}>{p.lang === "id" ? "Harga segera diumumkan" : "Price coming soon"}</span>;
  const off = discountPercent(p);
  const was = off ? formatPrice(p.originalPrice, p.currency) : "";
  return (
    <div className={`flex flex-wrap items-baseline gap-x-2 gap-y-1 ${className}`}>
      <span className="price-gold font-display text-2xl font-bold">{text}</span>
      {was && <s className="text-xs text-slate-500">{was}</s>}
      {off > 0 && <span className="rounded-full bg-rose-500/20 px-2 py-0.5 text-[10px] font-bold text-rose-100">−{off}%</span>}
    </div>
  );
}

export function ProductCard({ product: p, index = 0, preview = false, inView = true }) {
  const href = productPath(p) + (preview ? "?preview=1" : "");
  const tiltRef = useRef(null);
  useTilt(tiltRef, 0, 5);
  const cart = useCart();
  const t = tFor(p);
  const canCart = cart && canAddToCart(p);
  const inCart = canCart && cart.has(p.slug);

  const anim = inView ? { initial: "hidden", whileInView: "show", viewport: { once: true, amount: 0.12 } } : { initial: "hidden", animate: "show" };

  return (
    <motion.li layout="position" transition={{ layout: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } }} custom={index} variants={cardVariants} {...anim} exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }} className="group h-full">
      <article ref={tiltRef} lang={p.lang === "id" ? "id" : undefined} className="tilt card-navy glow-border glow-on-hover relative flex h-full flex-col rounded-[1.75rem]">
        <span className="tilt-glare" aria-hidden />

        {/* Stage with 3D mockup */}
        <div className="relative">
          <a href={href} tabIndex={-1} aria-hidden className="relative block aspect-[5/4] overflow-hidden rounded-t-[1.75rem]" style={{ background: `${stage[p.category] || stage.blueprints}, #0b1224` }}>
            <div className="bg-code-grid absolute inset-0 opacity-40 [mask-image:radial-gradient(ellipse_at_center,black_10%,transparent_70%)]" />
            <div className="absolute inset-x-[18%] bottom-[8%] h-[10%] rounded-[50%] bg-black/50 blur-xl" />
            <div className="absolute inset-0 grid place-items-center">
              <DeviceArt product={p} />
            </div>
            <Badges product={p} className="absolute left-4 top-4 max-w-[60%]" />
            <CategoryChip product={p} className="absolute right-4 top-4" />
          </a>
          {canCart && (
            <button
              type="button"
              onClick={() => (inCart ? cart.setOpen(true) : cart.add(p))}
              onPointerDown={ripple}
              aria-label={inCart ? `${p.name} — ${t.inCart}` : `${t.addToCart}: ${p.name}`}
              title={inCart ? t.inCart : t.addToCart}
              className={`ripple absolute bottom-3 right-3 z-20 grid h-11 w-11 place-items-center rounded-full border shadow-xl shadow-black/40 backdrop-blur-md transition-[color,background-color,border-color,transform] hover:scale-110 [@media(pointer:fine)]:active:scale-95 ${
                inCart ? "border-emerald-300/50 bg-emerald-400/25 text-emerald-100" : "border-white/20 bg-slate-950/70 text-white hover:border-amber-200/70 hover:text-amber-100"
              }`}
            >
              <BagPlusIcon className="relative z-10" />
            </button>
          )}
        </div>

        <div className="flex flex-1 flex-col p-5 sm:p-6">
          <h3 className="font-display text-xl font-bold leading-snug text-white">
            <a href={href} className="after:absolute after:inset-0 after:rounded-[1.75rem] focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-amber-300">
              {p.name}
            </a>
          </h3>
          <p className="mt-2 line-clamp-2 flex-1 text-sm leading-relaxed text-slate-400">{p.shortDescription}</p>

          <div className="relative z-10 mt-5 border-t border-white/10 pt-4">
            <GoldPrice product={p} />
            <div className="mt-4 grid grid-cols-[auto_1fr] gap-2">
              <a
                href={href}
                onPointerDown={ripple}
                className="ripple inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-full border border-white/15 bg-white/[0.03] px-4 py-2.5 text-xs font-semibold text-slate-100 transition-colors hover:border-amber-200/60 hover:text-amber-100"
              >
                <EyeIcon className="relative z-10" width={15} height={15} />
                <span className="relative z-10">{t.detail}</span>
              </a>
              <BuyButton product={p} full />
            </div>
          </div>
        </div>
      </article>
    </motion.li>
  );
}
