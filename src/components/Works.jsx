import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { projects, workCategories } from "../data/portfolio.js";
import { softSpring, spring } from "../lib/motion.js";
import { ArrowUpRight, Close } from "./Icons.jsx";
import SectionHeading from "./SectionHeading.jsx";

export default function Works() {
  const [filter, setFilter] = useState("All");
  const [selected, setSelected] = useState(null);

  const visible = filter === "All" ? projects : projects.filter((p) => p.category === filter);

  return (
    <section id="works" className="relative bg-night py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="flex flex-col gap-8">
          <SectionHeading index="02" kicker="Featured works" title="Products I’ve designed & built">
            Seven products, one standard: thoughtful design backed by solid engineering.
          </SectionHeading>

          {/* Filter tabs */}
          <div role="tablist" aria-label="Filter projects" className="no-scrollbar -mx-5 flex gap-1 overflow-x-auto px-5 md:mx-0 md:px-0">
            <div className="flex shrink-0 rounded-full border border-white/10 bg-slate-900/60 p-1">
              {workCategories.map((c) => {
                const on = filter === c;
                const count = c === "All" ? projects.length : projects.filter((p) => p.category === c).length;
                return (
                  <button
                    key={c}
                    role="tab"
                    aria-selected={on}
                    onClick={() => setFilter(c)}
                    className={`relative whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                      on ? "text-ink" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    {on && <motion.span layoutId="works-tab" transition={softSpring} className="absolute inset-0 rounded-full bg-cream" />}
                    <span className="relative">
                      {c} <span className="font-mono text-xs opacity-60">{count}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <motion.ul layout className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {visible.map((p) => (
              <ProjectCard key={p.id} project={p} index={projects.indexOf(p)} onOpen={() => setSelected(p)} />
            ))}
          </AnimatePresence>
        </motion.ul>
      </div>

      <AnimatePresence>{selected && <ProjectModal project={selected} onClose={() => setSelected(null)} />}</AnimatePresence>
    </section>
  );
}

function ProjectCard({ project: p, index, onOpen }) {
  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 30, scale: 0.96 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.15 }}
      exit={{ opacity: 0, scale: 0.92, transition: { duration: 0.18 } }}
      transition={spring}
      className="group"
    >
      <button
        type="button"
        onClick={onOpen}
        className="flex h-full w-full flex-col overflow-hidden rounded-3xl border border-white/10 bg-slate-900/50 text-left transition-colors duration-300 hover:border-white/25 hover:bg-slate-900 focus-visible:outline-2 focus-visible:outline-cream"
        aria-label={`Open details for ${p.title}`}
      >
        <div className="relative aspect-[1024/500] overflow-hidden bg-slate-800">
          <img
            src={p.image}
            alt={`${p.title} preview`}
            loading="lazy"
            decoding="async"
            width="1024"
            height="500"
            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent" />
          <span className="absolute left-4 top-4 rounded-full bg-slate-950/70 px-2.5 py-1 font-mono text-[11px] text-white backdrop-blur">
            {String(index + 1).padStart(2, "0")}
          </span>
          <span className="absolute right-4 top-4 grid h-9 w-9 translate-y-1 place-items-center rounded-full bg-cream text-ink opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
            <ArrowUpRight width={16} height={16} />
          </span>
        </div>

        <div className="flex flex-1 flex-col p-6">
          <div className="flex items-center gap-3">
            <Logo project={p} />
            <div className="min-w-0">
              <h3 className="font-display text-xl font-bold leading-tight text-white">{p.title}</h3>
              <p className="text-xs font-medium" style={{ color: p.accent }}>
                {p.category}
              </p>
            </div>
          </div>
          <p className="mt-4 flex-1 text-sm leading-relaxed text-slate-400">{p.desc}</p>
          <ul className="mt-5 flex flex-wrap gap-1.5">
            {p.tech.map((t) => (
              <li key={t} className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 font-mono text-[11px] text-slate-300">
                {t}
              </li>
            ))}
          </ul>
        </div>
      </button>
    </motion.li>
  );
}

function Logo({ project: p, size = "h-11 w-11" }) {
  return p.logo ? (
    <img src={p.logo} alt="" loading="lazy" width="96" height="96" className={`${size} shrink-0 rounded-xl bg-white object-contain p-1`} />
  ) : (
    <span className={`${size} grid shrink-0 place-items-center rounded-xl font-display text-lg font-black text-white`} style={{ background: p.accent }}>
      {p.title[0]}
    </span>
  );
}

function ProjectModal({ project: p, onClose }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <motion.div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-slate-950/80 p-0 backdrop-blur-sm sm:items-center sm:p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="project-title"
        initial={{ y: 60, opacity: 0, scale: 0.97 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 40, opacity: 0, scale: 0.98 }}
        transition={spring}
        onClick={(e) => e.stopPropagation()}
        className="relative max-h-[92svh] w-full max-w-3xl overflow-y-auto rounded-t-3xl border border-white/10 bg-slate-900 sm:rounded-3xl"
      >
        <button
          type="button"
          onClick={onClose}
          autoFocus
          aria-label="Close"
          className="absolute right-4 top-4 z-10 grid h-10 w-10 place-items-center rounded-full bg-slate-950/70 text-white backdrop-blur hover:bg-slate-950"
        >
          <Close />
        </button>
        <img src={p.image} alt={`${p.title} preview`} width="1024" height="500" className="aspect-[1024/500] w-full object-cover" />
        <div className="p-6 sm:p-8">
          <div className="flex items-center gap-4">
            <Logo project={p} size="h-14 w-14" />
            <div>
              <h3 id="project-title" className="font-display text-2xl font-bold text-white sm:text-3xl">
                {p.title}
              </h3>
              <p className="text-sm font-medium" style={{ color: p.accent }}>
                {p.category}
              </p>
            </div>
          </div>
          <p className="mt-5 text-base leading-relaxed text-slate-300">{p.desc}</p>

          <h4 className="mt-7 font-mono text-xs uppercase tracking-[0.2em] text-slate-500">Highlights</h4>
          <ul className="mt-3 grid gap-2.5">
            {p.highlights.map((h) => (
              <li key={h} className="flex gap-3 text-sm text-slate-300">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: p.accent }} />
                {h}
              </li>
            ))}
          </ul>

          <h4 className="mt-7 font-mono text-xs uppercase tracking-[0.2em] text-slate-500">Tech & disciplines</h4>
          <ul className="mt-3 flex flex-wrap gap-2">
            {p.tech.map((t) => (
              <li key={t} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 font-mono text-xs text-slate-200">
                {t}
              </li>
            ))}
          </ul>
        </div>
      </motion.div>
    </motion.div>
  );
}
