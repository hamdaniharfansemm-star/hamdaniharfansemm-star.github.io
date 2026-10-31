import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";
import { profile } from "../data/portfolio.js";
import content from "../data/content.json";
import { fadeUp, softSpring, spring } from "../lib/motion.js";
import { CATEGORIES, categoryById, checkoutUrlOf, isPublished, matchesQuery, relatedProducts, visibleProducts } from "./catalog.js";
import { AddToCartButton, AskLink, Badges, BuyButton, Cover, Price, ProductCard } from "./ProductParts.jsx";
import { CartProvider, canAddToCart } from "./cart.jsx";
import CartDrawer, { CartButton } from "./CartDrawer.jsx";
import { ripple } from "./effects.js";
import { ChevronIcon, CloseSmall, SearchIcon, ShieldIcon, categoryIcon, trustIcons } from "./StoreIcons.jsx";

const store = content.store || { hero: {}, trust: [], products: [] };

function readRoute() {
  const params = new URLSearchParams(window.location.search);
  const m = window.location.pathname.match(/^\/products\/([^/]+)\/?$/);
  const fromPath = m && m[1] !== "index.html" ? decodeURIComponent(m[1]) : "";
  return {
    preview: params.has("preview"),
    slug: fromPath || params.get("item") || "",
    q: params.get("q") || "",
    category: params.get("category") || "all",
  };
}

export default function StoreApp() {
  const route = useMemo(readRoute, []);
  const products = useMemo(() => visibleProducts(store.products, route.preview), [route.preview]);
  const product = route.slug ? products.find((p) => p.slug === route.slug) : null;

  return (
    <MotionConfig reducedMotion="user">
      <CartProvider products={products}>
      <div className="store-mesh" aria-hidden>
        <i /><i /><i /><i />
      </div>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-cream focus:px-4 focus:py-2 focus:text-ink">
        Skip to content
      </a>
      <Navbar page="store" actions={<CartButton />} />
      <main id="main" className="min-h-svh">
        {route.slug ? (
          product ? (
            <ProductDetail product={product} all={products} preview={route.preview} />
          ) : (
            <NotFound />
          )
        ) : (
          <Catalog products={products} route={route} />
        )}
      </main>
      <Footer page="store" />
      <CartDrawer />
      {route.preview && <PreviewBar />}
      </CartProvider>
    </MotionConfig>
  );
}

/* ═════════════════════════════ CATALOG ═════════════════════════════ */

function Catalog({ products, route }) {
  const [q, setQ] = useState(route.q);
  const [category, setCategory] = useState(CATEGORIES.some((c) => c.id === route.category) ? route.category : "all");
  const catalogRef = useRef(null);
  const switched = useRef(false); // after the first category switch, cards animate immediately (staggered)
  useEffect(() => {
    if (category !== (route.category || "all")) switched.current = true;
  }, [category, route.category]);

  // Keep filters in the URL (shareable, no reload)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    q ? params.set("q", q) : params.delete("q");
    category !== "all" ? params.set("category", category) : params.delete("category");
    const qs = params.toString();
    window.history.replaceState(null, "", `${window.location.pathname}${qs ? `?${qs}` : ""}${window.location.hash}`);
  }, [q, category]);

  const counts = useMemo(() => Object.fromEntries(CATEGORIES.map((c) => [c.id, products.filter((p) => p.category === c.id).length])), [products]);
  const results = useMemo(
    () => products.filter((p) => (category === "all" || p.category === category) && matchesQuery(p, q.trim())),
    [products, category, q]
  );
  const featured = products.filter((p) => p.featured).slice(0, 3);
  const latest = [...products]
    .filter((p) => Number.isFinite(Date.parse(p.releaseDate || "")))
    .sort((a, b) => Date.parse(b.releaseDate) - Date.parse(a.releaseDate))
    .slice(0, 3);
  const showShowcase = products.length > 3;

  const pickCategory = (id) => {
    setCategory(id);
    const top = (catalogRef.current?.getBoundingClientRect().top ?? 0) + window.scrollY - 96;
    window.scrollTo({ top, behavior: "smooth" });
  };

  return (
    <>
      <StoreHero hasProducts={products.length > 0} />

      {/* Categories */}
      <section aria-labelledby="cat-title" className="relative px-5 pb-6 pt-4 sm:px-8">
        <div className="mx-auto max-w-6xl">
          <h2 id="cat-title" className="sr-only">
            Product categories
          </h2>
          <ul className="grid grid-cols-2 gap-3 md:grid-cols-5">
            {CATEGORIES.map((c, i) => {
              const Icon = categoryIcon[c.id];
              const on = category === c.id;
              return (
                <motion.li key={c.id} {...fadeUp(i * 0.05)} className={i === 4 ? "col-span-2 md:col-span-1" : ""}>
                  <button
                    type="button"
                    onClick={() => pickCategory(on ? "all" : c.id)}
                    onPointerDown={ripple}
                    aria-pressed={on}
                    className={`ripple group flex h-full w-full flex-col items-start gap-3 rounded-3xl border p-4 text-left transition-[border-color,background-color,transform] duration-300 hover:-translate-y-1 motion-reduce:hover:translate-y-0 sm:p-5 ${
                      on ? "border-cream/60 bg-cream/10 shadow-[0_0_40px_-12px_rgba(244,232,209,0.45)]" : "glass hover:border-cyan-300/30 hover:shadow-[0_20px_50px_-25px_rgba(34,211,238,0.5)]"
                    }`}
                  >
                    <span className={`icon-pop relative z-10 grid h-11 w-11 place-items-center rounded-2xl transition-colors ${on ? "bg-cream text-ink" : "bg-cyan-400/10 text-cyan-300 group-hover:bg-cyan-400/15"}`}>
                      <Icon />
                    </span>
                    <span className="relative z-10">
                      <span className="block text-sm font-semibold leading-snug text-white"><span className="sm:hidden">{c.short}</span><span className="hidden sm:inline">{c.label}</span></span>
                      <span className="mt-1 block font-mono text-[11px] text-slate-500">
                        {counts[c.id] ? `${counts[c.id]} product${counts[c.id] > 1 ? "s" : ""}` : "Coming soon"}
                      </span>
                    </span>
                  </button>
                </motion.li>
              );
            })}
          </ul>
        </div>
      </section>

      {showShowcase && featured.length > 0 && <Showcase id="featured" kicker="Featured" title="Hand-picked products" items={featured} preview={route.preview} />}

      {/* Catalog */}
      <section id="catalog" ref={catalogRef} aria-labelledby="catalog-title" className="relative scroll-mt-24 px-5 py-16 sm:px-8 md:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <motion.p {...fadeUp()} className="flex items-center gap-3 font-mono text-xs uppercase tracking-[0.25em] text-cyan-300">
                <span>Catalog</span>
                <span className="h-px w-10 bg-cyan-300/50" />
              </motion.p>
              <motion.h2 {...fadeUp(0.05)} id="catalog-title" className="mt-3 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
                All products
              </motion.h2>
            </div>

            {products.length > 0 && (
              <motion.div {...fadeUp(0.1)} className="w-full lg:max-w-sm">
                <label htmlFor="store-search" className="sr-only">
                  Search products
                </label>
                <div className="relative">
                  <SearchIcon className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" width={18} height={18} />
                  <input
                    id="store-search"
                    type="search"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Search guides, blueprints, apps…"
                    className="glass w-full rounded-full py-3 pl-11 pr-11 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-cream/60 focus:ring-4 focus:ring-cream/10"
                  />
                  {q && (
                    <button type="button" onClick={() => setQ("")} aria-label="Clear search" className="absolute right-3 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full text-slate-400 hover:bg-white/10 hover:text-white">
                      <CloseSmall />
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </div>

          {products.length > 0 && (
            <div role="group" aria-label="Filter by category" className="no-scrollbar -mx-5 mt-6 flex gap-2 overflow-x-auto px-5 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
              {[{ id: "all", label: "All" }, ...CATEGORIES].map((c) => {
                const on = category === c.id;
                const n = c.id === "all" ? products.length : counts[c.id];
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCategory(c.id)}
                    aria-pressed={on}
                    className={`relative shrink-0 whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                      on ? "border-cream text-ink" : "border-white/10 text-slate-300 hover:border-white/30 hover:text-white"
                    }`}
                  >
                    {on && <motion.span layoutId="store-filter" transition={softSpring} className="absolute inset-0 rounded-full bg-cream" />}
                    <span className="relative">
                      {c.label} <span className="font-mono text-xs opacity-60">{n}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          <p className="sr-only" aria-live="polite">
            {products.length ? `${results.length} product${results.length === 1 ? "" : "s"} found` : ""}
          </p>

          {products.length === 0 ? (
            <LaunchingSoon />
          ) : results.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-10 rounded-3xl border border-dashed border-white/15 px-6 py-14 text-center">
              <p className="font-display text-xl font-bold text-white">No products match your search.</p>
              <p className="mt-2 text-sm text-slate-400">Try another keyword or category.</p>
              <button
                type="button"
                onClick={() => {
                  setQ("");
                  setCategory("all");
                }}
                className="mt-6 rounded-full border border-white/15 px-5 py-2.5 text-sm font-semibold text-slate-200 hover:bg-white/5"
              >
                Reset filters
              </button>
            </motion.div>
          ) : (
            <motion.ul key={category} layout className="mt-8 grid grid-cols-[minmax(0,1fr)] gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <AnimatePresence mode="popLayout">
                {results.map((p, i) => (
                  <ProductCard key={p.slug} product={p} index={i} preview={route.preview} inView={!switched.current} />
                ))}
              </AnimatePresence>
            </motion.ul>
          )}
        </div>
      </section>

      {showShowcase && latest.length > 0 && <Showcase id="latest" kicker="Latest" title="Recently released" items={latest} preview={route.preview} />}

      <Trust />
      <ClosingCta />
    </>
  );
}

function StoreHero({ hasProducts }) {
  const h = store.hero || {};
  return (
    <section aria-labelledby="store-title" className="relative overflow-clip px-5 pb-14 pt-32 sm:px-8 md:pb-20 md:pt-40">
      {/* Background: soft drifting aurora + grid (static under reduced motion) */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="store-aurora absolute -left-1/4 -top-1/3 h-[42rem] w-[42rem] rounded-full bg-[radial-gradient(circle,rgba(34,211,238,0.22),transparent_62%)]" />
        <div className="store-aurora store-aurora--slow absolute -right-1/4 top-0 h-[38rem] w-[38rem] rounded-full bg-[radial-gradient(circle,rgba(59,130,246,0.22),transparent_62%)]" />
        <div className="bg-code-grid absolute inset-0 [mask-image:radial-gradient(ellipse_at_top,black_15%,transparent_70%)]" />
      </div>

      <div className="relative mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1.15fr_0.85fr]">
        <div>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...spring, delay: 0.05 }}
            className="inline-flex items-center gap-2 rounded-full border border-cyan-300/25 bg-cyan-300/10 px-3.5 py-1.5 text-xs font-semibold text-cyan-200"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-300" />
            {profile.name.replace(/,.*$/, "").replace(/\s+[A-Z]\.[A-Z]\.?$/, "")} · {h.eyebrow || "Digital Products & Innovation"}
          </motion.p>
          <motion.h1
            id="store-title"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...spring, delay: 0.12 }}
            className="text-gradient-store mt-6 max-w-3xl text-balance pb-1 font-display text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl md:text-6xl"
          >
            {h.title || "Build Your Ideas Into Digital Products."}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...spring, delay: 0.2 }}
            className="mt-6 max-w-xl text-base leading-relaxed text-slate-300 sm:text-lg"
          >
            {h.intro}
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ ...spring, delay: 0.28 }} className="mt-8 flex flex-wrap gap-3">
            <motion.a
              href="#catalog"
              onPointerDown={ripple}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.97 }}
              className="ripple cta-glow group relative inline-flex items-center gap-3 rounded-full bg-cream px-6 py-3.5 text-sm font-bold text-ink shadow-lg shadow-black/30"
            >
              {hasProducts ? "Browse the catalog" : "See what's coming"}
              <span className="grid h-7 w-7 place-items-center rounded-full bg-ink text-cream transition-transform duration-300 group-hover:translate-y-0.5">
                <ChevronIcon className="rotate-90" width={14} height={14} />
              </span>
            </motion.a>
            <a href="/#contact" className="inline-flex items-center rounded-full border border-white/15 px-6 py-3.5 text-sm font-semibold text-slate-200 transition-colors hover:border-white/40 hover:text-white">
              Request a custom build
            </a>
          </motion.div>
        </div>

        {/* Visual: stacked category tiles (desktop) */}
        <div aria-hidden className="relative hidden h-[22rem] lg:block">
          {CATEGORIES.slice(0, 3).map((c, i) => {
            const Icon = categoryIcon[c.id];
            const pos = [
              "left-6 top-2 -rotate-6",
              "right-2 top-16 rotate-3",
              "left-16 bottom-0 -rotate-2",
            ][i];
            return (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 40, scale: 0.94 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ ...spring, delay: 0.25 + i * 0.1 }}
                className={`glass absolute w-64 rounded-3xl p-5 shadow-2xl shadow-black/50 ${pos}`}
              >
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-cyan-400/10 text-cyan-300">
                  <Icon />
                </span>
                <p className="mt-4 font-display text-lg font-bold text-white">{c.label}</p>
                <p className="mt-1 text-xs leading-relaxed text-slate-400">{c.blurb}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function Showcase({ id, kicker, title, items, preview }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="px-5 pt-16 sm:px-8 md:pt-20">
      <div className="mx-auto max-w-6xl">
        <motion.p {...fadeUp()} className="flex items-center gap-3 font-mono text-xs uppercase tracking-[0.25em] text-cyan-300">
          <span>{kicker}</span>
          <span className="h-px w-10 bg-cyan-300/50" />
        </motion.p>
        <motion.h2 {...fadeUp(0.05)} id={`${id}-title`} className="mt-3 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
          {title}
        </motion.h2>
        <ul className="mt-8 grid grid-cols-[minmax(0,1fr)] gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((p, i) => (
            <ProductCard key={p.slug} product={p} index={i} preview={preview} />
          ))}
        </ul>
      </div>
    </section>
  );
}

function LaunchingSoon() {
  const wa = `https://wa.me/${profile.whatsapp}?text=${encodeURIComponent("Hi Hamdani, please let me know when your Digital Store products launch.")}`;
  return (
    <motion.div {...fadeUp(0.1)} className="glass relative mt-8 overflow-hidden rounded-[2rem] px-6 py-12 text-center sm:px-12 sm:py-16">
      <div aria-hidden className="pointer-events-none absolute -top-24 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-cyan-400/15 blur-3xl" />
      <span className="relative inline-flex items-center gap-2 rounded-full border border-cyan-300/25 bg-cyan-300/10 px-3 py-1 text-xs font-semibold text-cyan-200">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-300" /> Launching soon
      </span>
      <h3 className="relative mx-auto mt-5 max-w-xl text-balance font-display text-2xl font-bold text-white sm:text-3xl">{store.emptyTitle}</h3>
      <p className="relative mx-auto mt-3 max-w-xl text-sm leading-relaxed text-slate-400 sm:text-base">{store.emptyText}</p>
      <div className="relative mt-8 flex flex-wrap justify-center gap-3">
        <a href={wa} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-emerald-400">
          Notify me on WhatsApp
        </a>
        <a href="/#contact" className="inline-flex items-center gap-2 rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-slate-200 transition-colors hover:bg-white/5">
          Request a custom build
        </a>
      </div>
    </motion.div>
  );
}

function Trust() {
  const items = store.trust || [];
  if (!items.length) return null;
  return (
    <section aria-labelledby="trust-title" className="relative bg-cream px-5 py-20 text-ink sm:px-8 md:py-24">
      <div className="bg-paper-dots pointer-events-none absolute inset-0 opacity-60" aria-hidden />
      <div className="relative mx-auto max-w-6xl">
        <motion.p {...fadeUp()} className="flex items-center gap-3 font-mono text-xs uppercase tracking-[0.25em] text-amberline">
          <span>How I build products</span>
          <span className="h-px w-10 bg-amberline/50" />
        </motion.p>
        <motion.h2 {...fadeUp(0.05)} id="trust-title" className="mt-4 max-w-2xl font-display text-3xl font-bold leading-tight tracking-tight sm:text-4xl md:text-5xl">
          Practical. Transparent. Built from real work.
        </motion.h2>
        <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((t, i) => {
            const Icon = trustIcons[i % trustIcons.length];
            return (
              <motion.li key={t.title} {...fadeUp(0.08 + i * 0.06)} className="rounded-3xl border border-ink/10 bg-white/60 p-6 backdrop-blur">
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-ink text-cream">
                  <Icon width={20} height={20} />
                </span>
                <h3 className="mt-5 font-display text-lg font-bold leading-snug">{t.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink/70">{t.text}</p>
              </motion.li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

function ClosingCta() {
  return (
    <section className="px-5 py-20 sm:px-8 md:py-24">
      <motion.div
        {...fadeUp()}
        className="relative mx-auto max-w-6xl overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(135deg,#0b1224_0%,#0f1d3d_55%,#0b1224_100%)] px-6 py-12 sm:px-12 sm:py-16"
      >
        <div aria-hidden className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-cyan-400/15 blur-3xl" />
        <div className="relative flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
          <div className="max-w-xl">
            <h2 className="text-balance font-display text-3xl font-bold leading-tight text-white sm:text-4xl">Need something built specifically for you?</h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-400 sm:text-base">
              From app blueprints to complete mobile products — let’s talk about a custom build for your business.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <a href="/#contact" className="inline-flex items-center rounded-full bg-cream px-6 py-3.5 text-sm font-bold text-ink transition-transform hover:-translate-y-0.5">
              Hire me
            </a>
            <a href="/#works" className="inline-flex items-center rounded-full border border-white/15 px-6 py-3.5 text-sm font-semibold text-slate-200 transition-colors hover:border-white/40">
              See my apps
            </a>
          </div>
        </div>
      </motion.div>
    </section>
  );
}

/* ═════════════════════════════ DETAIL ═════════════════════════════ */

const list = (v) => (Array.isArray(v) ? v.map((x) => (typeof x === "string" ? x.trim() : x)).filter(Boolean) : []);

function ProductDetail({ product: p, all, preview }) {
  const cat = categoryById(p.category);
  const gallery = list(p.gallery).map((g) => (typeof g === "string" ? g : g?.image)).filter(Boolean);
  const images = [p.coverImage, ...gallery].filter(Boolean);
  const [active, setActive] = useState(0);
  const related = relatedProducts(all, p);
  const specs = list(p.specifications).filter((s) => s.label && s.value);
  const faq = list(p.faq).filter((f) => f.q && f.a);
  const curriculum = list(p.curriculum);
  const problems = list(p.problems);
  const features = list(p.features);
  const audience = list(p.audience);
  const q = preview ? "?preview=1" : "";

  useEffect(() => {
    document.title = `${p.name} · Digital Store · Hamdani Harfan`;
  }, [p.name]);

  return (
    <>
      <section className="relative overflow-clip px-5 pb-12 pt-28 sm:px-8 md:pt-36">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -left-40 -top-40 h-[34rem] w-[34rem] rounded-full bg-[radial-gradient(circle,rgba(34,211,238,0.16),transparent_62%)]" />
          <div className="absolute -right-40 top-20 h-[30rem] w-[30rem] rounded-full bg-[radial-gradient(circle,rgba(59,130,246,0.14),transparent_62%)]" />
        </div>

        <div className="relative mx-auto max-w-6xl">
          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb">
            <ol className="flex flex-wrap items-center gap-1.5 text-xs text-slate-400">
              <li>
                <a href="/" className="hover:text-white">Home</a>
              </li>
              <li aria-hidden><ChevronIcon width={12} height={12} /></li>
              <li>
                <a href={`/products/${q}`} className="hover:text-white">Digital Store</a>
              </li>
              {cat && (
                <>
                  <li aria-hidden><ChevronIcon width={12} height={12} /></li>
                  <li>
                    <a href={`/products/?category=${cat.id}${preview ? "&preview=1" : ""}`} className="hover:text-white">{cat.label}</a>
                  </li>
                </>
              )}
              <li aria-hidden><ChevronIcon width={12} height={12} /></li>
              <li aria-current="page" className="max-w-[16rem] truncate text-slate-200">{p.name}</li>
            </ol>
          </nav>

          <div className="mt-8 grid grid-cols-[minmax(0,1fr)] gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:gap-14">
            {/* Media */}
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={spring}>
              <div className="relative aspect-[4/3] overflow-hidden rounded-[2rem] border border-white/10 bg-slate-900 shadow-2xl shadow-black/40">
                <AnimatePresence mode="wait">
                  <motion.div key={active} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }} className="h-full w-full">
                    {images.length ? (
                      <img src={images[active]} alt={active === 0 && p.coverImage ? `${p.name} cover` : `${p.name} preview ${active + 1}`} className="h-full w-full object-cover" decoding="async" />
                    ) : (
                      <Cover product={p} />
                    )}
                  </motion.div>
                </AnimatePresence>
                <Badges product={p} className="absolute left-5 top-5" />
              </div>
              {images.length > 1 && (
                <ul className="mt-3 flex gap-3 overflow-x-auto pb-1" aria-label="Product images">
                  {images.map((src, i) => (
                    <li key={src + i}>
                      <button
                        type="button"
                        onClick={() => setActive(i)}
                        aria-label={`Show image ${i + 1}`}
                        aria-current={i === active}
                        className={`block h-16 w-20 overflow-hidden rounded-xl border-2 transition-colors ${i === active ? "border-cream" : "border-transparent opacity-70 hover:opacity-100"}`}
                      >
                        <img src={src} alt="" loading="lazy" className="h-full w-full object-cover" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </motion.div>

            {/* Purchase panel */}
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ ...spring, delay: 0.08 }} className="lg:sticky lg:top-28 lg:self-start">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">{cat?.label || "Product"}</p>
              <h1 className="mt-3 text-balance font-display text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl">{p.name}</h1>
              {p.shortDescription && <p className="mt-4 text-base leading-relaxed text-slate-300">{p.shortDescription}</p>}

              <div className="glass mt-8 rounded-3xl p-6">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">Price</p>
                <Price product={p} size="lg" className="mt-1 text-3xl" />
                <div className="mt-5 grid gap-2.5">
                  <BuyButton product={p} size="lg" full />
                  {canAddToCart(p) && <AddToCartButton product={p} size="lg" full />}
                </div>
                {isPublished(p) && checkoutUrlOf(p) ? (
                  <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-xs text-slate-500">
                    <ShieldIcon width={14} height={14} /> Secure checkout on Mayar · opens in a new tab
                  </p>
                ) : null}
                <div className="mt-4 flex justify-center">
                  <AskLink product={p} />
                </div>
              </div>

              {specs.length > 0 && (
                <dl className="mt-6 grid grid-cols-2 gap-3">
                  {specs.slice(0, 4).map((s) => (
                    <div key={s.label} className="rounded-2xl border border-white/10 bg-slate-900/40 px-4 py-3">
                      <dt className="text-[11px] uppercase tracking-wider text-slate-500">{s.label}</dt>
                      <dd className="mt-0.5 text-sm font-semibold text-white">{s.value}</dd>
                    </div>
                  ))}
                </dl>
              )}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Body */}
      <section className="px-5 pb-20 sm:px-8">
        <div className="mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:gap-14">
          <div className="grid gap-6">
            {p.description && (
              <Block title="About this product">
                <p className="whitespace-pre-line text-base leading-relaxed text-slate-300">{p.description}</p>
              </Block>
            )}
            {problems.length > 0 && (
              <Block title="What it solves">
                <Bullets items={problems} tone="cream" />
              </Block>
            )}
            {features.length > 0 && (
              <Block title={p.category === "apps" || p.category === "templates" ? "Features" : "What’s inside"}>
                <Bullets items={features} check />
              </Block>
            )}
            {curriculum.length > 0 && (
              <Block title="Curriculum">
                <ol className="grid gap-2">
                  {curriculum.map((c, i) => (
                    <li key={c} className="flex gap-4 rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm text-slate-200">
                      <span className="font-mono text-xs text-cyan-300">{String(i + 1).padStart(2, "0")}</span>
                      {c}
                    </li>
                  ))}
                </ol>
              </Block>
            )}
            {faq.length > 0 && (
              <Block title="FAQ">
                <Faq items={faq} />
              </Block>
            )}
          </div>

          <div className="grid content-start gap-6">
            {audience.length > 0 && (
              <Block title="Who it’s for">
                <Bullets items={audience} />
              </Block>
            )}
            {specs.length > 0 && (
              <Block title="Specifications">
                <dl className="divide-y divide-white/10">
                  {specs.map((s) => (
                    <div key={s.label} className="flex items-baseline justify-between gap-4 py-3 text-sm">
                      <dt className="text-slate-400">{s.label}</dt>
                      <dd className="text-right font-medium text-white">{s.value}</dd>
                    </div>
                  ))}
                </dl>
              </Block>
            )}
          </div>
        </div>
      </section>

      {related.length > 0 && (
        <section aria-labelledby="related-title" className="border-t border-white/10 px-5 py-16 sm:px-8 md:py-20">
          <div className="mx-auto max-w-6xl">
            <h2 id="related-title" className="font-display text-3xl font-bold tracking-tight text-white">
              You may also like
            </h2>
            <ul className="mt-8 grid grid-cols-[minmax(0,1fr)] gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((r, i) => (
                <ProductCard key={r.slug} product={r} index={i} preview={preview} />
              ))}
            </ul>
          </div>
        </section>
      )}

      <ClosingCta />
    </>
  );
}

function Block({ title, children }) {
  return (
    <motion.div {...fadeUp()} className="glass rounded-3xl p-6 sm:p-8">
      <h2 className="font-display text-xl font-bold text-white sm:text-2xl">{title}</h2>
      <div className="mt-4">{children}</div>
    </motion.div>
  );
}

function Bullets({ items, check = false, tone = "cyan" }) {
  return (
    <ul className="grid gap-2.5">
      {items.map((t) => (
        <li key={t} className="flex gap-3 text-sm leading-relaxed text-slate-300 sm:text-base">
          {check ? (
            <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-cyan-400/15 text-cyan-300">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="m5 12 5 5L20 7" />
              </svg>
            </span>
          ) : (
            <span className={`mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full ${tone === "cream" ? "bg-cream" : "bg-cyan-300"}`} />
          )}
          {t}
        </li>
      ))}
    </ul>
  );
}

function Faq({ items }) {
  const [open, setOpen] = useState(0);
  return (
    <ul className="grid gap-2">
      {items.map((f, i) => {
        const on = open === i;
        return (
          <li key={f.q} className={`rounded-2xl border transition-colors ${on ? "border-cyan-300/30 bg-slate-950/60" : "border-white/10 bg-slate-950/30"}`}>
            <button type="button" aria-expanded={on} onClick={() => setOpen(on ? -1 : i)} className="flex w-full items-center justify-between gap-4 px-4 py-3.5 text-left text-sm font-semibold text-white">
              {f.q}
              <ChevronIcon width={16} height={16} className={`shrink-0 transition-transform ${on ? "-rotate-90" : "rotate-90"}`} />
            </button>
            <AnimatePresence initial={false}>
              {on && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={spring} className="overflow-hidden">
                  <p className="px-4 pb-4 text-sm leading-relaxed text-slate-400">{f.a}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </li>
        );
      })}
    </ul>
  );
}

function NotFound() {
  useEffect(() => {
    document.title = "Product not found · Digital Store · Hamdani Harfan";
  }, []);
  return (
    <section className="px-5 pb-24 pt-40 text-center sm:px-8">
      <p className="font-mono text-xs uppercase tracking-[0.25em] text-cyan-300">404</p>
      <h1 className="mt-4 font-display text-4xl font-bold text-white">This product isn’t available.</h1>
      <p className="mx-auto mt-3 max-w-md text-slate-400">It may have been renamed or is not published yet.</p>
      <a href="/products/" className="mt-8 inline-flex rounded-full bg-cream px-6 py-3.5 text-sm font-bold text-ink">
        Back to the Digital Store
      </a>
    </section>
  );
}

function PreviewBar() {
  return (
    <div role="status" className="fixed inset-x-3 bottom-3 z-50 mx-auto flex max-w-xl items-center justify-between gap-3 rounded-2xl border border-amber-300/40 bg-amber-950/90 px-4 py-3 text-xs text-amber-100 shadow-2xl backdrop-blur sm:text-sm">
      <span>
        <b className="text-amber-200">Preview mode</b> — demo & draft products are shown. They are not for sale.
      </span>
      <a href={window.location.pathname} className="shrink-0 rounded-full border border-amber-200/40 px-3 py-1.5 font-semibold hover:bg-amber-200/10">
        Exit
      </a>
    </div>
  );
}

