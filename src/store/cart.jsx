import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { checkoutUrlOf, isPublished } from "./catalog.js";

/*
 * Shopping cart for the Digital Store.
 *
 * Mayar note: every product has its OWN Mayar checkout link. A combined
 * multi-product payment would require Mayar's API with a secret key on a
 * server — which a static GitHub Pages site must never expose. So the cart
 * is a "shortlist": each item is paid through its own secure Mayar checkout.
 *
 * The cart lives only in the visitor's browser (localStorage). Only published
 * products with a valid checkout link can be added. Nothing here marks an
 * order as paid — payment status lives in Mayar.
 */

const KEY = "hh-store-cart-v1";
const CartCtx = createContext(null);

const read = () => {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || "[]");
    return Array.isArray(v) ? v.filter((s) => typeof s === "string") : [];
  } catch {
    return [];
  }
};

export const canAddToCart = (p) => isPublished(p) && !!checkoutUrlOf(p);

export function CartProvider({ products, children }) {
  const [slugs, setSlugs] = useState(read);
  const [open, setOpen] = useState(false);
  const [bump, setBump] = useState(0); // increments to re-trigger the badge animation

  // Persist (best-effort — private mode may block storage)
  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(slugs));
    } catch {
      /* ignore */
    }
  }, [slugs]);

  // Sync across tabs
  useEffect(() => {
    const onStorage = (e) => e.key === KEY && setSlugs(read());
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // Only items that still exist and are still purchasable
  const items = useMemo(() => slugs.map((s) => products.find((p) => p.slug === s)).filter((p) => p && canAddToCart(p)), [slugs, products]);

  const has = useCallback((slug) => slugs.includes(slug), [slugs]);
  const add = useCallback((p) => {
    if (!canAddToCart(p)) return;
    setSlugs((s) => (s.includes(p.slug) ? s : [...s, p.slug]));
    setBump((b) => b + 1);
  }, []);
  const remove = useCallback((slug) => setSlugs((s) => s.filter((x) => x !== slug)), []);
  const clear = useCallback(() => setSlugs([]), []);

  const value = useMemo(() => ({ items, count: items.length, has, add, remove, clear, open, setOpen, bump }), [items, has, add, remove, clear, open, bump]);
  return <CartCtx.Provider value={value}>{children}</CartCtx.Provider>;
}

export const useCart = () => useContext(CartCtx);
