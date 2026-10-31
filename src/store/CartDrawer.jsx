import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { categoryById, checkoutUrlOf, formatPrice, parsePrice, productPath } from "./catalog.js";
import { useCart } from "./cart.jsx";
import { Cover } from "./ProductParts.jsx";
import { ripple } from "./effects.js";
import { CloseSmall, ExternalIcon, LockIcon, ShieldIcon } from "./StoreIcons.jsx";

export const BagIcon = (p) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden {...p}>
    <path d="M5 8h14l-1.2 11.2a2 2 0 0 1-2 1.8H8.2a2 2 0 0 1-2-1.8z" />
    <path d="M9 8V6a3 3 0 0 1 6 0v2" />
  </svg>
);

/** Cart button with live count — used in the navbar and as a floating button on mobile. */
export function CartButton({ className = "", floating = false }) {
  const { count, setOpen, bump } = useCart();
  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      onPointerDown={ripple}
      aria-label={`Open cart, ${count} item${count === 1 ? "" : "s"}`}
      className={`ripple relative grid place-items-center rounded-full text-white transition-transform active:scale-95 ${
        floating ? "glass-strong h-14 w-14 shadow-2xl shadow-black/50" : "h-9 w-9 hover:bg-white/10"
      } ${className}`}
    >
      <BagIcon className="relative z-10" width={floating ? 22 : 19} height={floating ? 22 : 19} />
      {count > 0 && (
        <span
          key={bump}
          className="cart-bump absolute -right-0.5 -top-0.5 z-10 grid h-5 min-w-5 place-items-center rounded-full bg-cream px-1 text-[10px] font-bold text-ink ring-2 ring-night"
        >
          {count}
        </span>
      )}
    </button>
  );
}

function totals(items) {
  const by = {};
  for (const p of items) {
    const n = parsePrice(p.price, p.currency);
    if (n === null) continue;
    const c = p.currency === "USD" ? "USD" : "IDR";
    by[c] = (by[c] || 0) + n;
  }
  return Object.entries(by);
}

export default function CartDrawer() {
  const { items, open, setOpen, remove, clear } = useCart();
  const closeRef = useRef(null);
  const panelRef = useRef(null);
  const lastFocus = useRef(null);

  // Scroll lock, Esc to close, focus management
  useEffect(() => {
    if (!open) return;
    lastFocus.current = document.activeElement;
    document.body.style.overflow = "hidden";
    const t = setTimeout(() => closeRef.current?.focus(), 60);
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
      if (e.key === "Tab" && panelRef.current) {
        const f = panelRef.current.querySelectorAll('a[href],button:not([disabled])');
        if (!f.length) return;
        const first = f[0];
        const last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(t);
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
      lastFocus.current?.focus?.();
    };
  }, [open, setOpen]);

  const sums = totals(items);
  const single = items.length === 1 ? items[0] : null;

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[70]">
          <motion.button
            type="button"
            aria-label="Close cart"
            tabIndex={-1}
            onClick={() => setOpen(false)}
            className="absolute inset-0 h-full w-full cursor-default bg-slate-950/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          />
          <motion.aside
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="cart-title"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 260, damping: 32 }}
            className="glass-strong absolute right-0 top-0 flex h-full w-full max-w-md flex-col shadow-[-30px_0_80px_-20px_rgba(0,0,0,0.7)] sm:rounded-l-[2rem]"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
              <div>
                <h2 id="cart-title" className="font-display text-2xl font-bold text-white">
                  Your cart
                </h2>
                <p className="mt-0.5 text-xs text-slate-400">
                  {items.length ? `${items.length} product${items.length > 1 ? "s" : ""}` : "No products yet"}
                </p>
              </div>
              <button
                ref={closeRef}
                type="button"
                onClick={() => setOpen(false)}
                onPointerDown={ripple}
                aria-label="Close cart"
                className="ripple grid h-10 w-10 place-items-center rounded-full border border-white/10 text-slate-200 transition-colors hover:bg-white/10"
              >
                <CloseSmall className="relative z-10" />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6">
              {items.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center px-4 text-center">
                  <span className="grid h-16 w-16 place-items-center rounded-2xl bg-cyan-400/10 text-cyan-300">
                    <BagIcon width={28} height={28} />
                  </span>
                  <p className="mt-5 font-display text-xl font-bold text-white">Your cart is empty</p>
                  <p className="mt-2 max-w-xs text-sm text-slate-400">Add products you’re interested in and pay for them securely on Mayar.</p>
                  <button
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      document.getElementById("catalog")?.scrollIntoView({ behavior: "smooth" });
                    }}
                    className="cta-glow mt-6 rounded-full bg-cream px-6 py-3 text-sm font-bold text-ink"
                  >
                    Browse products
                  </button>
                </div>
              ) : (
                <ul className="grid gap-3">
                  <AnimatePresence initial={false}>
                    {items.map((p, i) => (
                      <motion.li
                        key={p.slug}
                        layout
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0, transition: { delay: i * 0.05, type: "spring", stiffness: 260, damping: 26 } }}
                        exit={{ opacity: 0, x: 60, transition: { duration: 0.2 } }}
                        className="glass rounded-2xl p-3"
                      >
                        <div className="flex gap-3">
                          <a href={productPath(p)} className="block h-20 w-24 shrink-0 overflow-hidden rounded-xl" onClick={() => setOpen(false)}>
                            <Cover product={p} compact />
                          </a>
                          <div className="min-w-0 flex-1">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-cyan-300/90">{categoryById(p.category)?.short}</p>
                            <a href={productPath(p)} className="mt-0.5 line-clamp-2 text-sm font-semibold leading-snug text-white hover:text-cream">
                              {p.name}
                            </a>
                            <p className="mt-1 font-display text-base font-bold text-white">{formatPrice(p.price, p.currency) || "—"}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => remove(p.slug)}
                            aria-label={`Remove ${p.name} from cart`}
                            className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-slate-500 transition-colors hover:bg-rose-500/15 hover:text-rose-300"
                          >
                            <CloseSmall width={14} height={14} />
                          </button>
                        </div>
                        {!single && (
                          <a
                            href={checkoutUrlOf(p)}
                            target="_blank"
                            rel="noopener noreferrer"
                            onPointerDown={ripple}
                            className="ripple mt-3 flex items-center justify-center gap-2 rounded-xl border border-cream/30 bg-cream/10 px-4 py-2.5 text-xs font-bold text-cream transition-colors hover:bg-cream hover:text-ink"
                          >
                            <LockIcon className="relative z-10" width={14} height={14} />
                            <span className="relative z-10">Pay for this item on Mayar</span>
                            <ExternalIcon className="relative z-10 opacity-70" width={13} height={13} />
                          </a>
                        )}
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="border-t border-white/10 px-6 pb-6 pt-5">
                <dl className="space-y-1.5">
                  {sums.map(([cur, n]) => (
                    <div key={cur} className="flex items-baseline justify-between">
                      <dt className="text-sm text-slate-400">Subtotal{sums.length > 1 ? ` (${cur})` : ""}</dt>
                      <dd className="font-display text-2xl font-bold text-white">{formatPrice(n, cur)}</dd>
                    </div>
                  ))}
                </dl>

                {single ? (
                  <a
                    href={checkoutUrlOf(single)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onPointerDown={ripple}
                    className="ripple cta-glow mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-cream px-6 py-4 text-sm font-bold text-ink"
                  >
                    <LockIcon className="relative z-10" width={16} height={16} />
                    <span className="relative z-10">Checkout securely on Mayar</span>
                    <ExternalIcon className="relative z-10 opacity-60" width={14} height={14} />
                  </a>
                ) : (
                  <p className="mt-4 rounded-2xl border border-cyan-300/20 bg-cyan-300/5 px-4 py-3 text-xs leading-relaxed text-cyan-100/90">
                    Each digital product has its own secure Mayar checkout, so you pay for items one by one using the
                    <b className="text-cream"> Pay for this item</b> buttons above. Your cart stays saved on this device.
                  </p>
                )}

                <p className="mt-4 flex items-center justify-center gap-1.5 text-center text-[11px] text-slate-500">
                  <ShieldIcon width={13} height={13} /> Payments are processed by Mayar. This site never sees your payment details.
                </p>
                <button type="button" onClick={clear} className="mx-auto mt-3 block text-xs text-slate-500 underline-offset-4 hover:text-slate-300 hover:underline">
                  Clear cart
                </button>
              </div>
            )}
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}
