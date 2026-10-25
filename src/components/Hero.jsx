import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { hero, profile } from "../data/portfolio.js";
import useFinePointer from "../hooks/useFinePointer.js";
import { softSpring, spring } from "../lib/motion.js";
import { Code, Palette } from "./Icons.jsx";

/**
 * Dual-persona hero.
 *  - Base layer  = Developer persona (slate-950 + cyan).
 *  - Top layer   = Designer persona (cream + ink), revealed through a circular
 *                  clip-path that follows the cursor.
 * Pointer tracking never touches React state: coordinates are eased inside a
 * requestAnimationFrame loop and written straight to CSS custom properties,
 * so the browser only repaints the clip-path (steady 60fps, zero re-renders).
 */
export default function Hero() {
  const fine = useFinePointer();
  const sectionRef = useRef(null);
  const maskRef = useRef(null);
  const [mode, setMode] = useState("designer"); // touch fallback only

  useEffect(() => {
    if (!fine) return;
    const section = sectionRef.current;
    const mask = maskRef.current;
    if (!section || !mask) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ease = reduce ? 1 : 0.18;
    let w = section.clientWidth;
    let h = section.clientHeight;
    const radius = () => Math.round(Math.min(380, Math.max(190, w * 0.26)));
    const idle = () => [w * 0.25, h * 0.52];

    let [tx, ty] = idle();
    let cx = tx;
    let cy = ty;
    let tr = radius();
    let cr = reduce ? tr : 0; // grows in on first paint
    let raf = 0;
    let inside = false;
    let last = null; // last pointer position in client coords
    let needsRect = false;

    const write = () => {
      mask.style.setProperty("--mx", `${cx.toFixed(1)}px`);
      mask.style.setProperty("--my", `${cy.toFixed(1)}px`);
      mask.style.setProperty("--r", `${cr.toFixed(1)}px`);
    };

    const tick = () => {
      if (needsRect && last) {
        const rect = section.getBoundingClientRect();
        tx = last.x - rect.left;
        ty = last.y - rect.top;
        needsRect = false;
      }
      cx += (tx - cx) * ease;
      cy += (ty - cy) * ease;
      cr += (tr - cr) * (reduce ? 1 : 0.12);
      const moving = Math.abs(tx - cx) > 0.3 || Math.abs(ty - cy) > 0.3 || Math.abs(tr - cr) > 0.3;
      if (!moving) {
        cx = tx;
        cy = ty;
        cr = tr;
      }
      write();
      raf = moving ? requestAnimationFrame(tick) : 0;
    };
    const kick = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };

    const onMove = (e) => {
      if (e.pointerType === "touch") return;
      inside = true;
      last = { x: e.clientX, y: e.clientY };
      needsRect = true;
      kick();
    };
    const onLeave = () => {
      inside = false;
      [tx, ty] = idle();
      kick();
    };
    const onScroll = () => {
      if (inside && last) {
        needsRect = true;
        kick();
      }
    };
    const onResize = () => {
      w = section.clientWidth;
      h = section.clientHeight;
      tr = radius();
      if (!inside) [tx, ty] = idle();
      kick();
    };

    section.addEventListener("pointermove", onMove, { passive: true });
    section.addEventListener("pointerleave", onLeave);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    write();
    kick();

    return () => {
      cancelAnimationFrame(raf);
      section.removeEventListener("pointermove", onMove);
      section.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, [fine]);

  return (
    <section
      id="home"
      ref={sectionRef}
      aria-label="Introduction"
      className="relative h-[100svh] min-h-[620px] w-full overflow-hidden bg-night"
    >
      {/* Base layer — Developer persona */}
      <PersonaScene theme="dev" />

      {/* Top layer — Designer persona (masked) */}
      {fine ? (
        <div ref={maskRef} aria-hidden className="hero-mask pointer-events-none absolute inset-0">
          <PersonaScene theme="design" />
        </div>
      ) : (
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          initial={false}
          animate={{
            clipPath: mode === "designer" ? "circle(150% at 50% 85%)" : "circle(0% at 50% 85%)",
          }}
          transition={{ type: "spring", stiffness: 120, damping: 20 }}
        >
          <PersonaScene theme="design" />
        </motion.div>
      )}

      {/* Hint (desktop) / Toggle (touch) */}
      {fine ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring, delay: 0.9 }}
          className="pointer-events-none absolute bottom-6 left-6 z-20 hidden items-center gap-3 rounded-full border border-white/10 bg-slate-950/70 px-4 py-2 font-mono text-xs text-slate-300 backdrop-blur md:flex"
        >
          <span className="relative h-6 w-4 rounded-full border border-slate-400/60">
            <motion.span
              className="absolute left-1/2 top-1 h-1.5 w-0.5 -translate-x-1/2 rounded-full bg-cyan-300"
              animate={{ y: [0, 6, 0] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
            />
          </span>
          Move your cursor to switch persona
        </motion.div>
      ) : (
        <PersonaToggle mode={mode} setMode={setMode} />
      )}

      <a
        href="#about"
        className="absolute bottom-6 right-6 z-20 hidden items-center gap-2 font-mono text-xs uppercase tracking-[0.2em] text-slate-400 transition-colors hover:text-white md:flex"
      >
        Scroll
        <motion.span
          className="block h-8 w-px origin-top bg-gradient-to-b from-cyan-300 to-transparent"
          animate={{ scaleY: [0.3, 1, 0.3] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
      </a>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────── */

function PersonaToggle({ mode, setMode }) {
  const options = [
    { id: "designer", label: "Designer View", icon: "🎨" },
    { id: "developer", label: "Developer View", icon: "💻" },
  ];
  return (
    <div className="absolute inset-x-0 bottom-5 z-20 flex justify-center px-4">
      <div role="radiogroup" aria-label="Choose persona" className="flex rounded-full border border-white/15 bg-slate-950/80 p-1 shadow-2xl shadow-black/50 backdrop-blur-xl">
        {options.map((o) => {
          const on = mode === o.id;
          return (
            <button
              key={o.id}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => setMode(o.id)}
              className={`relative rounded-full px-4 py-2.5 text-sm font-semibold transition-colors ${
                on ? (o.id === "designer" ? "text-ink" : "text-slate-950") : "text-slate-300"
              }`}
            >
              {on && (
                <motion.span
                  layoutId="persona-pill"
                  transition={softSpring}
                  className={`absolute inset-0 -z-0 rounded-full ${o.id === "designer" ? "bg-cream" : "bg-cyan-300"}`}
                />
              )}
              <span className="relative">
                {o.icon} {o.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────── */

function PersonaScene({ theme }) {
  const dev = theme === "dev";
  const { designer, developer } = hero;

  return (
    <div className={`absolute inset-0 ${dev ? "bg-night text-slate-300" : "bg-cream text-ink"}`}>
      {/* Background decoration */}
      {dev ? <DevDecor /> : <DesignDecor />}

      {/* Persona copy */}
      <div className="relative mx-auto h-full max-w-[1400px] px-5 sm:px-8 lg:px-12">
        <div className="grid h-full grid-cols-2 items-start gap-4 pt-24 md:items-center md:pt-0">
          {/* Left — Designer */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ ...spring, delay: 0.15 }}
            className="max-w-[30rem] md:pr-[12vw] lg:pr-[10vw]"
          >
            <p className={`mb-2 font-mono text-[10px] uppercase tracking-[0.25em] sm:text-xs ${dev ? "text-slate-500" : "text-amberline"}`}>
              {designer.eyebrow}
            </p>
            <h1
              className={`font-display text-[clamp(2.4rem,7vw,6.5rem)] font-black leading-[0.9] tracking-tight ${
                dev ? "text-outline-cyan" : "text-ink"
              }`}
            >
              {designer.title}
            </h1>
            <p className={`mt-3 text-xs leading-relaxed sm:text-sm md:mt-5 md:text-base ${dev ? "text-slate-600" : "text-ink/80"}`}>
              {designer.body}
            </p>
            <ul className="mt-5 hidden flex-wrap gap-2 md:flex">
              {designer.tags.map((t) => (
                <li
                  key={t}
                  className={`rounded-full border px-3 py-1 text-xs font-medium ${
                    dev ? "border-slate-800 text-slate-600" : "border-ink/20 bg-white/40 text-ink"
                  }`}
                >
                  {t}
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Right — Developer */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ ...spring, delay: 0.25 }}
            className="ml-auto max-w-[30rem] text-right md:pl-[12vw] lg:pl-[10vw]"
          >
            <p className={`mb-2 font-mono text-[10px] uppercase tracking-[0.25em] sm:text-xs ${dev ? "text-cyan-400" : "text-ink/40"}`}>
              {developer.eyebrow}
            </p>
            <h2
              className={`font-mono text-[clamp(1.2rem,3.9vw,3.6rem)] font-bold leading-[1] tracking-tighter ${
                dev ? "text-white [text-shadow:0_0_40px_rgb(34_211_238/0.45)]" : "text-outline-ink"
              }`}
            >
              {developer.title}
            </h2>
            <p className={`mt-3 text-xs leading-relaxed sm:text-sm md:mt-5 md:text-base ${dev ? "text-slate-400" : "text-ink/35"}`}>
              {developer.body}
            </p>
            <ul className="mt-5 hidden flex-wrap justify-end gap-2 md:flex">
              {developer.tags.map((t) => (
                <li
                  key={t}
                  className={`rounded-full border px-3 py-1 font-mono text-xs ${
                    dev ? "border-cyan-400/30 bg-cyan-400/5 text-cyan-200" : "border-ink/10 text-ink/30"
                  }`}
                >
                  {t}
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </div>

      {/* Center portrait */}
      <motion.figure
        initial={{ opacity: 0, y: 60 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...spring, delay: 0.05 }}
        className="absolute bottom-0 left-1/2 w-[min(80vw,360px)] -translate-x-1/2 md:w-[clamp(260px,27vw,400px)]"
      >
        <div
          className={`relative aspect-[3/4] overflow-hidden rounded-t-full border-x border-t ${
            dev ? "border-cyan-400/40 shadow-[0_0_80px_-10px_rgb(34_211_238/0.45)]" : "border-ink/80 shadow-[12px_-12px_0_0_rgb(15_23_42/0.12)]"
          }`}
        >
          <img
            src={profile.photo}
            alt={dev ? `Portrait of ${profile.name}` : ""}
            width="900"
            height="1205"
            fetchPriority="high"
            decoding="async"
            draggable="false"
            className={`h-full w-full object-cover object-top ${dev ? "grayscale contrast-125 brightness-90" : "sepia-[.25] saturate-[1.1]"}`}
          />
          <div
            className={`absolute inset-0 ${
              dev
                ? "bg-gradient-to-t from-night via-cyan-500/10 to-cyan-400/25 mix-blend-color"
                : "bg-gradient-to-t from-cream/70 via-transparent to-amber-200/10"
            }`}
          />
          <div className={`absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t ${dev ? "from-night" : "from-cream"} to-transparent`} />
        </div>
        <figcaption
          className={`absolute bottom-4 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full px-4 py-1.5 text-xs font-semibold md:bottom-6 ${
            dev ? "border border-cyan-400/30 bg-slate-950/80 font-mono text-cyan-200" : "bg-ink text-cream"
          } ${dev ? "" : "font-display tracking-wide"} max-md:bottom-20`}
        >
          {dev ? "hamdani.harfan()" : profile.name}
        </figcaption>
      </motion.figure>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────── */

function DevDecor() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="bg-code-grid absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]" />
      <div className="absolute -right-32 top-1/4 h-[28rem] w-[28rem] rounded-full bg-cyan-500/20 blur-[120px]" />
      <div className="absolute -bottom-40 left-1/3 h-[24rem] w-[24rem] rounded-full bg-blue-600/20 blur-[120px]" />
      <pre className="absolute right-10 top-28 hidden font-mono text-[11px] leading-6 text-cyan-300/25 xl:block">
{`const engineer = {
  stack: ["React", "Node", "Flutter"],
  ships: "Play Console",
  scale: () => "enterprise",
};`}
      </pre>
      <pre className="absolute bottom-24 right-[8%] hidden font-mono text-[11px] leading-6 text-cyan-300/20 lg:block">
{`$ npm run build
✓ 7 products compiled
✓ release → production`}
      </pre>
      <div className="absolute left-6 top-1/2 hidden -translate-y-1/2 flex-col gap-3 text-cyan-400/25 lg:flex">
        <Code width={18} height={18} />
      </div>
    </div>
  );
}

function DesignDecor() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="bg-paper-dots absolute inset-0" />
      <div className="absolute -left-24 top-24 h-[30rem] w-[30rem] rounded-full border-2 border-ink/10" />
      <svg className="absolute left-[8%] top-[18%] hidden h-40 w-72 text-ink/40 lg:block" viewBox="0 0 280 160" fill="none">
        <path d="M10 140 C 80 10, 180 10, 270 120" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 6" />
        <rect x="4" y="134" width="12" height="12" fill="#f4e8d1" stroke="currentColor" strokeWidth="1.5" />
        <rect x="264" y="114" width="12" height="12" fill="#f4e8d1" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="80" cy="28" r="4" fill="currentColor" />
        <line x1="10" y1="140" x2="80" y2="28" stroke="currentColor" strokeWidth="0.8" />
      </svg>
      <div className="absolute bottom-24 left-[6%] hidden gap-2 lg:flex">
        {["#0f172a", "#c2410c", "#e9d6b0", "#ffffff"].map((c) => (
          <span key={c} className="h-7 w-7 rounded-full border border-ink/20 shadow-sm" style={{ background: c }} />
        ))}
      </div>
      <div className="absolute right-6 top-1/2 hidden -translate-y-1/2 text-ink/25 lg:block">
        <Palette width={18} height={18} />
      </div>
    </div>
  );
}
