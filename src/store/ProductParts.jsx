import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { profile } from "../data/portfolio.js";
import { categoryById, checkoutUrlOf, discountPercent, formatPrice, isNew, isPublished, productPath } from "./catalog.js";
import { canAddToCart, useCart } from "./cart.jsx";
import { ripple, useTilt } from "./effects.js";
import { ChevronIcon, ExternalIcon, LockIcon, categoryIcon } from "./StoreIcons.jsx";

// Per-category cover tint (stays inside the site's night / cyan / indigo / cream palette)
const tints = {
  ebooks: ["#0e7490", "#22d3ee"],
  blueprints: ["#1e3a8a", "#60a5fa"],
  apps: ["#0f766e", "#5eead4"],
  courses: ["#3730a3", "#a5b4fc"],
  templates: ["#334155", "#f4e8d1"],
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
        {!compact && <span className="line-clamp-2 max-w-[18rem] font-display text-lg font-bold leading-tight text-white/90">{p.name}</span>}
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
  const pad = size === "lg" ? "px-6 py-4 text-sm" : "px-4 py-2.5 text-xs";
  const w = full ? "w-full" : "";

  if (!isPublished(p)) {
    return (
      <span className={`inline-flex items-center justify-center gap-2 rounded-full border border-amber-300/30 bg-amber-300/10 font-semibold text-amber-100 ${pad} ${w}`}>
        Demo — not for sale
      </span>
    );
  }
  if (!url) {
    return (
      <span className={`inline-flex cursor-not-allowed items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 font-semibold text-slate-400 ${pad} ${w}`} aria-disabled="true">
        Not available yet
      </span>
    );
  }
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      onPointerDown={ripple}
      aria-label={`Buy ${p.name} — opens secure Mayar checkout in a new tab`}
      className={`ripple cta-glow group/buy inline-flex items-center justify-center gap-2 rounded-full bg-cream font-bold text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300 ${pad} ${w}`}
    >
      <LockIcon className="relative z-10" width={15} height={15} />
      <span className="relative z-10">Buy now</span>
      <ExternalIcon width={14} height={14} className="relative z-10 opacity-60 transition-transform group-hover/buy:-translate-y-0.5 group-hover/buy:translate-x-0.5" />
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
            Add to cart
          </>
        )}
      </span>
    </button>
  );
}

export function AskLink({ product: p, className = "" }) {
  return (
    <a href={askHref(p)} target="_blank" rel="noopener noreferrer" className={`inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-300 underline-offset-4 hover:underline ${className}`}>
      Ask about this product
    </a>
  );
}

const cardVariants = {
  hidden: { opacity: 0, y: 28, scale: 0.97 },
  show: (i) => ({ opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 140, damping: 20, delay: Math.min(i, 8) * 0.06 } }),
};

export function ProductCard({ product: p, index = 0, preview = false, inView = true }) {
  const cat = categoryById(p.category);
  const href = productPath(p) + (preview ? "?preview=1" : "");
  const tiltRef = useRef(null);
  useTilt(tiltRef);
  const purchasable = isPublished(p) && checkoutUrlOf(p);

  const anim = inView
    ? { initial: "hidden", whileInView: "show", viewport: { once: true, amount: 0.12 } }
    : { initial: "hidden", animate: "show" };

  return (
    <motion.li layout custom={index} variants={cardVariants} {...anim} exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }} className="group h-full">
      <article ref={tiltRef} className="tilt glass relative flex h-full flex-col overflow-hidden rounded-3xl">
        <span className="tilt-glare" aria-hidden />
        <a href={href} className="relative block aspect-[4/3] overflow-hidden focus-visible:outline-none" tabIndex={-1} aria-hidden>
          <div className="h-full w-full transition-transform duration-700 ease-out group-hover:scale-[1.06] motion-reduce:transition-none motion-reduce:group-hover:scale-100">
            <Cover product={p} />
          </div>
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-slate-950/70 to-transparent" />
          <Badges product={p} className="absolute left-4 top-4" />
        </a>

        <div className="flex flex-1 flex-col p-5 sm:p-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-300/90">{cat?.label || "Product"}</p>
          <h3 className="mt-2 font-display text-xl font-bold leading-snug text-white">
            <a href={href} className="after:absolute after:inset-0 focus-visible:outline-none focus-visible:after:rounded-3xl focus-visible:after:ring-2 focus-visible:after:ring-cyan-300">
              {p.name}
            </a>
          </h3>
          <p className="mt-2 line-clamp-2 flex-1 text-sm leading-relaxed text-slate-400">{p.shortDescription}</p>

          <div className="relative z-10 mt-5 border-t border-white/10 pt-4">
            <Price product={p} className="text-lg" />
            <div className="mt-4 grid grid-cols-2 gap-2">
              {purchasable ? (
                <>
                  <AddToCartButton product={p} />
                  <BuyButton product={p} />
                </>
              ) : (
                <a
                  href={href}
                  onPointerDown={ripple}
                  className="ripple col-span-2 inline-flex items-center justify-center gap-1 rounded-full border border-white/15 px-4 py-2.5 text-xs font-semibold text-slate-200 transition-colors hover:border-cream/60 hover:text-cream"
                >
                  <span className="relative z-10 inline-flex items-center gap-1">
                    View details <ChevronIcon width={14} height={14} className="transition-transform group-hover:translate-x-0.5" />
                  </span>
                </a>
              )}
            </div>
          </div>
        </div>
      </article>
    </motion.li>
  );
}
