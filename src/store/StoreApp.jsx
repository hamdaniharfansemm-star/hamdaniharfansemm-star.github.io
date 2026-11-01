import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";
import { profile } from "../data/portfolio.js";
import content from "../data/content.json";
import { EASE_OUT, ease, fadeUp, softSpring, spring } from "../lib/motion.js";
import { CATEGORIES, SORTS, categoryById, checkoutUrlOf, discountPercent, isPublished, matchesQuery, relatedProducts, sortProducts, visibleProducts } from "./catalog.js";
import { DeviceMockup, Glyph, GuaranteeStrip, StickyBuyBar, Testimonials, ValueProps, tFor } from "./SalesParts.jsx";
import { AddToCartButton, AskLink, Badges, BuyButton, Cover, Price, ProductCard } from "./ProductParts.jsx";
import { CartProvider, canAddToCart } from "./cart.jsx";
import CartDrawer, { CartButton } from "./CartDrawer.jsx";
import { ripple } from "./effects.js";
import { PromptLibraryPage, PromptTeaser } from "./PromptLibrary.jsx";
import { PROMPTS_BASE, visiblePrompts } from "./prompts.js";
import { ChevronIcon, CloseSmall, SearchIcon, ShieldIcon, categoryIcon, trustIcons } from "./StoreIcons.jsx";

const store = content.store || { hero: {}, trust: [], products: [] };

function readRoute() {
  const params = new URLSearchParams(window.location.search);
  // Prompt Library: /products/prompts/ and /products/prompts/<slug>/ (or ?p=<slug>)
  const pm = window.location.pathname.match(/^\/products\/prompts(?:\/([^/]+))?\/?$/);
  const m = pm ? null : window.location.pathname.match(/^\/products\/([^/]+)\/?$/);
  const fromPath = m && m[1] !== "index.html" ? decodeURIComponent(m[1]) : "";
  return {
    prompts: !!pm || params.get("view") === "prompts",
    promptSlug: (pm && pm[1] && pm[1] !== "index.html" ? decodeURIComponent(pm[1]) : "") || params.get("p") || "",
    preview: params.has("preview"),
    slug: fromPath || params.get("item") || "",
    q: params.get("q") || "",
    category: params.get("category") || "all",
    sort: params.get("sort") || "featured",
    source: (params.get("utm_source") || params.get("ref") || params.get("from") || "").toLowerCase(),
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
      {/* cursor glow removed in v6 — it forced every glass panel to re-blur on mouse move */}
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-cream focus:px-4 focus:py-2 focus:text-ink">
        Skip to content
      </a>
      <Navbar page="store" actions={<CartButton />} />
      <main id="main" className="min-h-svh">
        {route.prompts ? (
          <PromptLibraryPage preview={route.preview} focusSlug={route.promptSlug} source={route.source} />
        ) : route.slug ? (
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
  const searchRef = useRef(null);
  const [sort, setSort] = useState(SORTS.some((x) => x.id === route.sort) ? route.sort : "featured");
  const switched = useRef(false); // after the first category switch, cards animate immediately (staggered)
  useEffect(() => {
    if (category !== (route.category || "all") || sort !== (route.sort || "featured")) switched.current = true;
  }, [category, route.category, sort, route.sort]);

  // Keep filters in the URL (shareable, no reload)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    q ? params.set("q", q) : params.delete("q");
    category !== "all" ? params.set("category", category) : params.delete("category");
    sort !== "featured" ? params.set("sort", sort) : params.delete("sort");
    const qs = params.toString();
    window.history.replaceState(null, "", `${window.location.pathname}${qs ? `?${qs}` : ""}${window.location.hash}`);
  }, [q, category, sort]);

  const counts = useMemo(() => Object.fromEntries(CATEGORIES.map((c) => [c.id, products.filter((p) => p.category === c.id).length])), [products]);
  const results = useMemo(
    () => sortProducts(products.filter((p) => (category === "all" || p.category === category) && matchesQuery(p, q.trim())), sort),
    [products, category, q, sort]
  );

  // "/" focuses the catalog search (power users & desktop visitors)
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== "/" || e.metaKey || e.ctrlKey || /input|textarea|select/i.test(document.activeElement?.tagName || "")) return;
      e.preventDefault();
      searchRef.current?.focus();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Grid adapts to how many products there are
  const gridCls =
    results.length === 1
      ? "mx-auto max-w-md grid-cols-[minmax(0,1fr)]"
      : results.length === 2
        ? "mx-auto max-w-4xl grid-cols-[minmax(0,1fr)] sm:grid-cols-2"
        : "grid-cols-[minmax(0,1fr)] sm:grid-cols-2 lg:grid-cols-3";
  const featured = products.filter((p) => p.featured).slice(0, 3);
  const latest = [...products]
    .filter((p) => Number.isFinite(Date.parse(p.releaseDate || "")))
    .sort((a, b) => Date.parse(b.releaseDate) - Date.parse(a.releaseDate))
    .slice(0, 3);
  const showShowcase = products.length > 3;
  const spotlight = products.find((p) => p.spotlight) || null;

  const pickCategory = (id) => {
    setCategory(id);
    const top = (catalogRef.current?.getBoundingClientRect().top ?? 0) + window.scrollY - 96;
    window.scrollTo({ top, behavior: "smooth" });
  };

  return (
    <>
      <StoreHero
        hasProducts={products.length > 0}
        counts={counts}
        onSearch={(term) => {
          setQ(term);
          setCategory("all");
          const top = (catalogRef.current?.getBoundingClientRect().top ?? 0) + window.scrollY - 96;
          window.scrollTo({ top, behavior: "smooth" });
        }}
        onPick={(id) => pickCategory(id)}
      />
      {spotlight && <Spotlight product={spotlight} preview={route.preview} />}



      {showShowcase && featured.length > 0 && <Showcase id="featured" kicker="Featured" title="Hand-picked products" items={featured} preview={route.preview} />}

      {/* Catalog */}
      <section id="catalog" ref={catalogRef} aria-labelledby="catalog-title" className="relative scroll-mt-24 px-5 py-16 sm:px-8 md:py-20">
        <div className="mx-auto max-w-6xl">
          <FunnelWelcome source={route.source} q={q} category={category} />
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
                    ref={searchRef}
                    type="search"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Search e-books, blueprints, apps, AI tools…"
                    className="glass glow-border w-full rounded-full py-3.5 pl-11 pr-11 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-cream/60 focus:ring-4 focus:ring-cream/10"
                  />
                  {!q && (
                    <kbd className="pointer-events-none absolute right-4 top-1/2 hidden -translate-y-1/2 rounded-md border border-white/15 bg-white/5 px-1.5 py-0.5 font-mono text-[11px] text-slate-400 lg:block">/</kbd>
                  )}
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
            <div role="group" aria-label="Filter by category" className="glass-strong no-scrollbar sticky top-[5.25rem] z-20 !bg-[#060a19]/95 mt-6 flex max-w-full gap-1 overflow-x-auto rounded-full p-1.5 shadow-2xl shadow-black/40 sm:w-fit">
              {[{ id: "all", label: "All products" }, ...CATEGORIES].map((c) => {
                const on = category === c.id;
                const n = c.id === "all" ? products.length : counts[c.id];
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCategory(c.id)}
                    aria-pressed={on}
                    className={`relative shrink-0 whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                      on ? "border-transparent text-slate-950" : "border-transparent text-slate-300 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    {on && <motion.span layoutId="store-filter" transition={softSpring} className="absolute inset-0 rounded-full bg-gradient-to-r from-amber-200 to-amber-400 shadow-[0_0_24px_-4px_rgba(245,196,81,0.6)]" />}
                    <span className="relative">
                      {c.label} <span className="font-mono text-xs opacity-60">{n}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {products.length > 0 && (
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-slate-400" aria-live="polite">
                Showing <b className="text-white">{results.length}</b> of {products.length} product{products.length === 1 ? "" : "s"}
                {q.trim() && (
                  <>
                    {" "}for “<span className="text-amber-200">{q.trim()}</span>”
                  </>
                )}
              </p>
              <label className="flex items-center gap-2 text-sm text-slate-400">
                <span className="hidden sm:inline">Sort by</span>
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  className="glass cursor-pointer rounded-full px-4 py-2 text-sm font-medium text-white outline-none focus:ring-2 focus:ring-amber-300/40"
                  aria-label="Sort products"
                >
                  {SORTS.map((o) => (
                    <option key={o.id} value={o.id} className="bg-slate-900">
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          )}

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
            <motion.ul key={`${category}-${sort}`} className={`mt-6 grid gap-6 ${gridCls}`}>
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

      <PromptTeaser preview={route.preview} />

      <Trust />
      <ClosingCta />
    </>
  );
}

// Deterministic star field (no Math.random → stable between renders)
const STARS = Array.from({ length: 34 }, (_, i) => ({
  left: (i * 37.7) % 100,
  top: (i * 53.3) % 100,
  size: 1 + ((i * 7) % 3),
  delay: (i * 0.37) % 5,
  dur: 3 + ((i * 11) % 5),
}));

/** Pause the hero's ambient animations while it is scrolled out of view (saves GPU, keeps scrolling smooth). */
function usePauseOffscreen(ref) {
  useEffect(() => {
    const el = ref.current;
    if (!el || !("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver(([e]) => el.classList.toggle("is-paused", !e.isIntersecting), { rootMargin: "80px" });
    io.observe(el);
    return () => io.disconnect();
  }, [ref]);
}

function StoreHero({ hasProducts, onSearch, onPick, counts }) {
  const h = store.hero || {};
  const [term, setTerm] = useState("");
  const heroRef = useRef(null);
  usePauseOffscreen(heroRef);
  const submit = (e) => {
    e.preventDefault();
    onSearch(term.trim());
  };
  return (
    <section ref={heroRef} aria-labelledby="store-title" className="relative overflow-clip px-5 pb-16 pt-32 sm:px-8 md:pb-24 md:pt-40">
      {/* Background: aurora ribbon + stars + grid (static under reduced motion) */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="aurora-ribbon absolute left-1/2 top-[-30%] h-[60rem] w-[60rem] -translate-x-1/2" />
        {STARS.map((st, i) => (
          <span
            key={i}
            className="star absolute rounded-full bg-white"
            style={{ left: `${st.left}%`, top: `${st.top}%`, width: st.size, height: st.size, animationDelay: `${st.delay}s`, animationDuration: `${st.dur}s` }}
          />
        ))}
        <div className="bg-code-grid absolute inset-0 opacity-70 [mask-image:radial-gradient(ellipse_at_top,black_10%,transparent_65%)]" />
      </div>

      <div className="relative mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)] items-center gap-14 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <div>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...ease, delay: 0.05 }}
            className="inline-flex items-center gap-2 rounded-full border border-violet-300/25 bg-violet-400/10 px-3.5 py-1.5 text-xs font-semibold text-violet-100 backdrop-blur"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-300 opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-300" />
            </span>
            {profile.name.replace(/,.*$/, "").replace(/\s+[A-Z]\.[A-Z]\.?$/, "")} · {h.eyebrow || "Digital Products & Innovation"}
          </motion.p>
          <motion.h1
            id="store-title"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...ease, delay: 0.12 }}
            className="text-gradient-store mt-6 max-w-3xl text-balance pb-1 font-display text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl md:text-6xl"
          >
            {h.title || "Build Your Ideas Into Digital Products."}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...ease, delay: 0.2 }}
            className="mt-6 max-w-xl text-base leading-relaxed text-slate-300 sm:text-lg"
          >
            {h.intro}
          </motion.p>

          {/* Quick search right in the hero */}
          {hasProducts && (
            <motion.form
              onSubmit={submit}
              role="search"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...ease, delay: 0.28 }}
              className="glow-border glass mt-8 flex max-w-xl items-center gap-2 rounded-full p-1.5 pl-5"
            >
              <SearchIcon className="shrink-0 text-slate-400" width={18} height={18} />
              <label htmlFor="hero-search" className="sr-only">
                Search products
              </label>
              <input
                id="hero-search"
                type="search"
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                placeholder="What do you want to build?"
                className="min-w-0 flex-1 bg-transparent py-2.5 text-sm text-white placeholder:text-slate-500 outline-none"
              />
              <button type="submit" onPointerDown={ripple} className="ripple cta-gold shrink-0 rounded-full px-5 py-2.5 text-sm font-bold text-slate-950">
                <span className="relative z-10">Search</span>
              </button>
            </motion.form>
          )}

          {/* Category quick picks */}
          <motion.ul
            initial="hidden"
            animate="show"
            variants={{ show: { transition: { staggerChildren: 0.05, delayChildren: 0.35 } } }}
            className="mt-5 flex flex-wrap gap-2"
            aria-label="Browse by category"
          >
            {CATEGORIES.map((c) => {
              const Icon = categoryIcon[c.id];
              return (
                <motion.li key={c.id} variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0, transition: spring } }}>
                  <button
                    type="button"
                    onClick={() => onPick(c.id)}
                    onPointerDown={ripple}
                    className="ripple group inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-2 text-xs font-semibold text-slate-200 backdrop-blur transition-colors hover:border-amber-200/50 hover:text-white"
                  >
                    <Icon className="icon-pop relative z-10 text-amber-300" width={15} height={15} />
                    <span className="relative z-10">{c.short}</span>
                    {counts[c.id] > 0 && <span className="relative z-10 font-mono text-[10px] text-slate-500">{counts[c.id]}</span>}
                  </button>
                </motion.li>
              );
            })}
          </motion.ul>

          {visiblePrompts(store.prompts).length > 0 && (
            <motion.a
              href={PROMPTS_BASE}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...ease, delay: 0.5 }}
              className="mt-4 inline-flex items-center gap-2 rounded-full border border-amber-300/40 bg-amber-300/10 px-4 py-2 text-xs font-bold text-amber-100 transition-colors hover:bg-amber-300/20"
            >
              ✨ Prompt AI gratis — lihat & salin →
            </motion.a>
          )}

          {!hasProducts && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ ...ease, delay: 0.3 }} className="mt-8 flex flex-wrap gap-3">
              <a href="#catalog" onPointerDown={ripple} className="ripple cta-gold inline-flex items-center gap-2 rounded-full px-6 py-3.5 text-sm font-bold text-slate-950">
                <span className="relative z-10">See what’s coming</span>
              </a>
              <a href="/#contact" className="inline-flex items-center rounded-full border border-white/15 px-6 py-3.5 text-sm font-semibold text-slate-200 transition-colors hover:border-white/40 hover:text-white">
                Request a custom build
              </a>
            </motion.div>
          )}
        </div>

        <ProductOrbit />
      </div>
    </section>
  );
}

/** Imaginative hero visual: a glowing core with category icons orbiting on glass rings. */
function ProductOrbit() {
  const inner = CATEGORIES.slice(0, 2);
  const outer = CATEGORIES.slice(2);
  return (
    <motion.div
      aria-hidden
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
      className="relative mx-auto hidden aspect-square w-full max-w-[26rem] sm:block"
    >
      {/* rings */}
      <div className="absolute inset-0 rounded-full border border-white/10" />
      <div className="absolute inset-[18%] rounded-full border border-violet-300/15" />
      <div className="absolute inset-[36%] rounded-full bg-[radial-gradient(circle_at_35%_30%,#fde68a_0%,#f5c451_22%,#7c3aed_58%,#1e1b4b_100%)] shadow-[0_0_80px_10px_rgba(124,58,237,0.45),0_0_140px_30px_rgba(245,196,81,0.18)]">
        <div className="core-pulse absolute inset-0 rounded-full" />
        <div className="absolute inset-0 grid place-items-center">
          <span className="font-display text-3xl font-black tracking-tight text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)]">HH</span>
        </div>
      </div>

      {/* outer orbit */}
      <div className="orbit absolute inset-0" style={{ animationDuration: "48s" }}>
        {outer.map((c, i) => {
          const Icon = categoryIcon[c.id];
          const angle = (360 / outer.length) * i;
          return (
            <div key={c.id} className="absolute left-1/2 top-1/2 h-0 w-0" style={{ transform: `rotate(${angle}deg) translateY(-13rem) rotate(-${angle}deg)` }}>
              <div className="orbit-counter" style={{ animationDuration: "48s" }}>
                <span className="glass -ml-7 -mt-7 grid h-14 w-14 place-items-center rounded-2xl text-cyan-200 shadow-xl shadow-black/40">
                  <Icon width={24} height={24} />
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* inner orbit (reverse) */}
      <div className="orbit orbit--reverse absolute inset-[18%]" style={{ animationDuration: "32s" }}>
        {inner.map((c, i) => {
          const Icon = categoryIcon[c.id];
          const angle = 180 * i + 40;
          return (
            <div key={c.id} className="absolute left-1/2 top-1/2 h-0 w-0" style={{ transform: `rotate(${angle}deg) translateY(-8.5rem) rotate(-${angle}deg)` }}>
              <div className="orbit-counter orbit-counter--reverse" style={{ animationDuration: "32s" }}>
                <span className="-ml-6 -mt-6 grid h-12 w-12 place-items-center rounded-2xl border border-amber-200/30 bg-gradient-to-br from-amber-300/25 to-violet-500/20 text-amber-100 shadow-xl shadow-black/40 backdrop-blur">
                  <Icon width={20} height={20} />
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* sparkle dots on rings */}
      <span className="orbit absolute inset-0" style={{ animationDuration: "20s" }}>
        <span className="absolute left-1/2 top-0 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-300 shadow-[0_0_14px_4px_rgba(245,196,81,0.7)]" />
      </span>
      <span className="orbit orbit--reverse absolute inset-[18%]" style={{ animationDuration: "14s" }}>
        <span className="absolute bottom-0 left-1/2 h-1.5 w-1.5 -translate-x-1/2 translate-y-1/2 rounded-full bg-cyan-300 shadow-[0_0_12px_4px_rgba(103,232,249,0.7)]" />
      </span>
    </motion.div>
  );
}

/** Soft light that follows the cursor across the store (desktop only, rAF, no re-renders). */
function Spotlight({ product: p, preview }) {
  const t = tFor(p);
  const off = discountPercent(p);
  const href = `/products/${p.slug}/${preview ? "?preview=1" : ""}`;
  const highlights = list(p.highlights).filter((h) => h.title).slice(0, 3);
  const guarantees = list(p.guarantees).filter((g) => g.title).slice(0, 4);
  return (
    <section aria-labelledby="spotlight-title" lang={p.lang === "id" ? "id" : undefined} className="px-5 pb-14 sm:px-8">
      <motion.div
        {...fadeUp()}
        className="relative mx-auto max-w-6xl overflow-hidden rounded-[2.25rem] border border-amber-300/20 bg-[linear-gradient(140deg,rgba(11,18,36,0.92)_0%,rgba(21,32,67,0.85)_55%,rgba(11,18,36,0.92)_100%)] p-6 shadow-[0_40px_120px_-40px_rgba(245,196,81,0.25)] sm:p-10 lg:p-14"
      >
        <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-amber-300/15 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-cyan-400/10 blur-3xl" />

        <div className="relative grid grid-cols-[minmax(0,1fr)] items-center gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-14">
          <div className="lg:order-2">
            <DeviceMockup product={p} className="mx-auto max-w-lg" />
          </div>

          <div className="lg:order-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="badge-shimmer rounded-full border border-amber-200/50 bg-gradient-to-r from-amber-400/30 to-orange-400/20 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-amber-100">
                {p.lang === "id" ? "Produk Unggulan" : "Featured product"}
              </span>
              <Badges product={{ ...p, featured: false, bestseller: p.bestseller }} />
            </div>
            <h2 id="spotlight-title" className="text-gradient-store mt-5 text-balance pb-1 font-display text-3xl font-bold leading-[1.1] tracking-tight sm:text-4xl lg:text-[2.6rem]">
              {p.name}
            </h2>
            {p.shortDescription && <p className="mt-4 max-w-xl text-base leading-relaxed text-slate-300">{p.shortDescription}</p>}

            {highlights.length > 0 && (
              <ul className="mt-6 grid gap-2.5 sm:grid-cols-3">
                {highlights.map((h) => (
                  <li key={h.title} className="flex items-center gap-2.5 rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm font-semibold text-white">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-amber-300 to-amber-500 text-slate-950">
                      <Glyph name={h.icon || "check"} size={16} />
                    </span>
                    <span className="leading-tight">{h.title}</span>
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-7 flex flex-wrap items-end gap-x-4 gap-y-2">
              <Price product={p} size="lg" className="text-4xl" />
            </div>

            <div className="mt-6 grid gap-3 sm:flex sm:flex-wrap">
              <BuyButton product={p} size="lg" />
              <a
                href={href}
                onPointerDown={ripple}
                className="ripple inline-flex items-center justify-center gap-2 rounded-full border border-white/15 px-6 py-4 text-sm font-semibold text-slate-100 transition-colors hover:border-amber-200/60 hover:text-amber-100"
              >
                <span className="relative z-10 inline-flex items-center gap-1.5">
                  {p.lang === "id" ? "Lihat detail produk" : "View product details"} <ChevronIcon width={14} height={14} />
                </span>
              </a>
            </div>

            {guarantees.length > 0 && (
              <div className="mt-6 max-w-xl">
                <GuaranteeStrip items={guarantees} title={t.guarantee} compact />
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </section>
  );
}

/** Friendly greeting for visitors arriving from Instagram / ManyChat links (?utm_source=instagram|manychat). */
function FunnelWelcome({ source, q, category }) {
  const [hidden, setHidden] = useState(false);
  const from = /manychat/.test(source) ? "ManyChat" : /instagram|ig\b|^ig/.test(source) ? "Instagram" : /tiktok/.test(source) ? "TikTok" : /whatsapp|wa\b/.test(source) ? "WhatsApp" : "";
  if (!from || hidden) return null;
  const cat = categoryById(category);
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass glow-border mb-8 flex items-start justify-between gap-4 rounded-2xl px-5 py-4"
      role="status"
    >
      <p className="text-sm text-slate-200">
        <span className="mr-1.5" aria-hidden>👋</span>
        Welcome from <b className="text-amber-200">{from}</b>!{" "}
        {q ? (
          <>Here are the products matching “{q}”.</>
        ) : cat ? (
          <>Here’s everything in {cat.label}.</>
        ) : (
          <>Browse the products below — tap <b className="text-white">Details</b> to learn more or <b className="text-white">Buy</b> to get instant access.</>
        )}
      </p>
      <button type="button" onClick={() => setHidden(true)} aria-label="Dismiss" className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-slate-400 hover:bg-white/10 hover:text-white">
        <CloseSmall width={14} height={14} />
      </button>
    </motion.div>
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
  const t = tFor(p);
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
  const highlights = list(p.highlights).filter((h) => h.title);
  const guarantees = list(p.guarantees).filter((g) => g.title);
  const off = discountPercent(p);
  const buyRef = useRef(null);
  const q = preview ? "?preview=1" : "";

  useEffect(() => {
    document.title = `${p.name} · Digital Store · Hamdani Harfan`;
    document.documentElement.lang = p.lang === "id" ? "id" : "en";
  }, [p.name, p.lang]);

  return (
    <>
      <section className="relative overflow-clip px-5 pb-10 pt-28 sm:px-8 md:pt-36">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -left-40 -top-40 h-[34rem] w-[34rem] rounded-full bg-[radial-gradient(circle,rgba(34,211,238,0.14),transparent_62%)]" />
          <div className="absolute -right-40 top-20 h-[34rem] w-[34rem] rounded-full bg-[radial-gradient(circle,rgba(245,196,81,0.12),transparent_62%)]" />
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

          <div className="mt-8 grid grid-cols-[minmax(0,1fr)] items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-14">
            {/* Mockup (first on mobile) */}
            <div className="lg:order-2">
              <div className="relative mx-auto max-w-xl">
                <DeviceMockup product={p} src={images[active] || ""} />
                <Badges product={p} className="absolute -top-3 left-4 z-10" />
              </div>
              {images.length > 1 && (
                <ul className="mx-auto mt-6 flex max-w-xl justify-center gap-3 overflow-x-auto pb-1" aria-label="Product images">
                  {images.map((src, i) => (
                    <li key={src + i}>
                      <button
                        type="button"
                        onClick={() => setActive(i)}
                        aria-label={`Show image ${i + 1}`}
                        aria-current={i === active}
                        className={`block h-14 w-[4.5rem] overflow-hidden rounded-xl border-2 transition-all ${i === active ? "border-amber-300" : "border-transparent opacity-60 hover:opacity-100"}`}
                      >
                        <img src={src} alt="" loading="lazy" className="h-full w-full object-cover" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Copy + purchase */}
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ ...ease, delay: 0.05 }} className="lg:order-1">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-300">{cat?.label || "Product"}</p>
              <h1 className="text-gradient-store mt-3 text-balance pb-1 font-display text-3xl font-bold leading-[1.1] tracking-tight sm:text-4xl lg:text-[2.75rem]">{p.name}</h1>
              {p.shortDescription && <p className="mt-4 text-base leading-relaxed text-slate-300 sm:text-lg">{p.shortDescription}</p>}

              <div ref={buyRef} className="glass mt-8 rounded-3xl p-5 sm:p-6">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">{t.price}</p>
                    <Price product={p} size="lg" className="mt-1 text-3xl sm:text-4xl" />
                  </div>
                  {off > 0 && (
                    <span className="badge-shimmer rounded-full border border-amber-200/50 bg-gradient-to-r from-amber-400/30 to-orange-400/25 px-3 py-1.5 text-xs font-bold text-amber-100">
                      {t.save} {off}%
                    </span>
                  )}
                </div>
                <div className="mt-5 grid gap-2.5">
                  <BuyButton product={p} size="lg" full />
                  {canAddToCart(p) && <AddToCartButton product={p} size="lg" full />}
                </div>
                {isPublished(p) && checkoutUrlOf(p) ? (
                  <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-xs text-slate-500">
                    <ShieldIcon width={14} height={14} /> {t.secure}
                  </p>
                ) : null}
                {guarantees.length > 0 && (
                  <div className="mt-5">
                    <GuaranteeStrip items={guarantees.slice(0, 4)} title={t.guarantee} compact />
                  </div>
                )}
                <div className="mt-4 flex justify-center">
                  <AskLink product={p} />
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <ValueProps items={highlights} title={t.why} />
      {guarantees.length > 0 && <GuaranteeStrip items={guarantees} title={t.guarantee} />}

      {/* Body */}
      <section className="px-5 py-12 sm:px-8">
        <div className="mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:gap-10">
          <div className="grid content-start gap-6">
            {p.description && (
              <Block title={t.about}>
                <p className="whitespace-pre-line text-base leading-relaxed text-slate-300">{p.description}</p>
              </Block>
            )}
            {problems.length > 0 && (
              <Block title={t.solves}>
                <Bullets items={problems} tone="cream" />
              </Block>
            )}
            {features.length > 0 && (
              <Block title={p.category === "apps" || p.category === "templates" ? t.features : t.inside}>
                <Bullets items={features} check />
              </Block>
            )}
            {curriculum.length > 0 && (
              <Block title={t.curriculum}>
                <ol className="grid gap-2">
                  {curriculum.map((c, i) => (
                    <li key={c} className="flex gap-4 rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm text-slate-200">
                      <span className="font-mono text-xs text-amber-300">{String(i + 1).padStart(2, "0")}</span>
                      {c}
                    </li>
                  ))}
                </ol>
              </Block>
            )}
          </div>

          <div className="grid content-start gap-6">
            {audience.length > 0 && (
              <Block title={t.audience}>
                <Bullets items={audience} />
              </Block>
            )}
            {specs.length > 0 && (
              <Block title={t.specs}>
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

      <Testimonials items={p.testimonials} title={t.reviews} />

      {faq.length > 0 && (
        <section aria-labelledby="faq-title" className="px-5 py-12 sm:px-8 md:py-16">
          <div className="mx-auto max-w-3xl">
            <motion.h2 {...fadeUp()} id="faq-title" className="text-center font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
              {t.faq}
            </motion.h2>
            <motion.div {...fadeUp(0.08)} className="mt-8">
              <Faq items={faq} />
            </motion.div>
          </div>
        </section>
      )}

      {/* Final product CTA */}
      {isPublished(p) && checkoutUrlOf(p) && (
        <section className="px-5 pb-6 pt-8 sm:px-8">
          <motion.div {...fadeUp()} className="relative mx-auto max-w-4xl overflow-hidden rounded-[2rem] border border-amber-300/25 bg-[linear-gradient(135deg,#0b1224_0%,#152043_55%,#0b1224_100%)] px-6 py-10 text-center sm:px-12 sm:py-14">
            <div aria-hidden className="pointer-events-none absolute -top-24 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-amber-300/15 blur-3xl" />
            <h2 className="relative text-balance font-display text-2xl font-bold text-white sm:text-3xl">{p.name}</h2>
            <div className="relative mt-4 flex justify-center">
              <Price product={p} size="lg" className="text-3xl" />
            </div>
            <div className="relative mx-auto mt-6 max-w-sm">
              <BuyButton product={p} size="lg" full />
            </div>
          </motion.div>
        </section>
      )}

      {related.length > 0 && (
        <section aria-labelledby="related-title" className="px-5 py-16 sm:px-8 md:py-20">
          <div className="mx-auto max-w-6xl">
            <h2 id="related-title" className="font-display text-3xl font-bold tracking-tight text-white">
              {t.related}
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
      <StickyBuyBar product={p} watchRef={buyRef} />
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
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.45, ease: EASE_OUT }} className="overflow-hidden">
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

