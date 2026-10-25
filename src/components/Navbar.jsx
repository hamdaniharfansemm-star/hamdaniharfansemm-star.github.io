import { useEffect, useState } from "react";
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "framer-motion";
import { navLinks, profile } from "../data/portfolio.js";
import useActiveSection from "../hooks/useActiveSection.js";
import { softSpring, spring } from "../lib/motion.js";
import { Close, Menu } from "./Icons.jsx";

const ids = navLinks.map((l) => l.id);

export default function Navbar() {
  const active = useActiveSection(ids);
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (y) => {
    setScrolled(y > 24); // React bails out when the value is unchanged
  });

  // Lock body scroll + close on Escape while the mobile menu is open
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-6 sm:pt-4">
      <motion.nav
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={spring}
        aria-label="Primary"
        className={`mx-auto flex max-w-6xl items-center justify-between rounded-full border px-4 py-2.5 backdrop-blur-xl transition-colors duration-300 sm:px-5 ${
          scrolled || open
            ? "border-white/10 bg-slate-950/80 shadow-2xl shadow-black/40"
            : "border-white/10 bg-slate-950/60"
        }`}
      >
        <a href="#home" className="group flex items-center gap-2.5" onClick={() => setOpen(false)}>
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
            <span className="relative inline-flex h-2.5 w-2.5 animate-pulse rounded-full bg-emerald-400" />
          </span>
          <span className="font-display text-lg font-bold tracking-tight text-white">{profile.name}</span>
        </a>

        {/* Desktop links */}
        <ul className="hidden items-center gap-1 md:flex">
          {navLinks.map((l) => (
            <li key={l.id}>
              <a
                href={`#${l.id}`}
                aria-current={active === l.id ? "true" : undefined}
                className={`relative rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                  active === l.id ? "text-ink" : "text-slate-300 hover:text-white"
                }`}
              >
                {active === l.id && (
                  <motion.span layoutId="nav-pill" transition={softSpring} className="absolute inset-0 -z-10 rounded-full bg-cream" />
                )}
                {l.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2">
          <a
            href="#contact"
            className="hidden items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1.5 text-xs font-semibold text-emerald-300 sm:inline-flex"
          >
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
            Available for work
          </a>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? "Close menu" : "Open menu"}
            className="grid h-9 w-9 place-items-center rounded-full text-white hover:bg-white/10 md:hidden"
          >
            {open ? <Close /> : <Menu />}
          </button>
        </div>
      </motion.nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-menu"
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.98 }}
            transition={softSpring}
            className="mx-auto mt-2 max-w-6xl overflow-hidden rounded-3xl border border-white/10 bg-slate-950/95 p-3 backdrop-blur-xl md:hidden"
          >
            <ul>
              {navLinks.map((l, i) => (
                <motion.li key={l.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ ...spring, delay: i * 0.04 }}>
                  <a
                    href={`#${l.id}`}
                    onClick={() => setOpen(false)}
                    className={`flex items-center justify-between rounded-2xl px-4 py-3 text-base font-medium ${
                      active === l.id ? "bg-cream text-ink" : "text-slate-200 hover:bg-white/5"
                    }`}
                  >
                    {l.label}
                    <span className="font-mono text-xs opacity-50">0{i + 1}</span>
                  </a>
                </motion.li>
              ))}
            </ul>
            <div className="mt-2 flex items-center gap-2 rounded-2xl border border-emerald-400/20 bg-emerald-400/5 px-4 py-3 text-sm text-emerald-300">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
              Available for work & consulting
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
