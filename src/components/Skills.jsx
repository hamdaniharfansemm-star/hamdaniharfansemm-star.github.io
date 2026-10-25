import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { services, skills, techStack } from "../data/portfolio.js";
import { fadeUp, spring } from "../lib/motion.js";
import { Check, Code, Palette, Plus } from "./Icons.jsx";
import SectionHeading from "./SectionHeading.jsx";

const pill = {
  sky: "border-sky-400/30 bg-sky-400/5 text-sky-300",
  amber: "border-amber-400/30 bg-amber-400/5 text-amber-300",
  violet: "border-violet-400/30 bg-violet-400/5 text-violet-300",
  emerald: "border-emerald-400/30 bg-emerald-400/5 text-emerald-300",
  orange: "border-orange-400/30 bg-orange-400/5 text-orange-300",
};

export default function Skills() {
  return (
    <section id="skills" className="relative overflow-hidden bg-night py-24 md:py-32">
      <div className="pointer-events-none absolute left-1/2 top-0 h-px w-2/3 -translate-x-1/2 bg-gradient-to-r from-transparent via-white/15 to-transparent" aria-hidden />
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <SectionHeading index="03" kicker="Skills & expertise" title="Two disciplines. One workflow." align="center">
          The same split you saw in the hero — tap any skill to see what it means in practice.
        </SectionHeading>

        <motion.div
          {...fadeUp(0.1)}
          className="mt-14 grid gap-6 rounded-[2rem] border border-white/10 bg-slate-900/40 p-6 sm:p-8 lg:grid-cols-[1.1fr_1fr]"
        >
          <div>
            <h3 className="font-mono text-[11px] uppercase tracking-[0.2em] text-slate-500">Tech stack</h3>
            <ul className="mt-4 flex flex-wrap gap-2">
              {techStack.map((t) => (
                <li key={t.name} className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold ${pill[t.tone]}`}>
                  {t.name}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="font-mono text-[11px] uppercase tracking-[0.2em] text-slate-500">Services & solutions</h3>
            <ul className="mt-4 grid gap-2 sm:grid-cols-2">
              {services.map((t) => (
                <li key={t} className="flex items-start gap-2.5 rounded-2xl border border-white/5 bg-slate-950/50 p-3 text-sm text-slate-300">
                  <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-cyan-400/15 text-cyan-300">
                    <Check width={12} height={12} />
                  </span>
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </motion.div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <SkillColumn data={skills.design} theme="design" />
          <SkillColumn data={skills.engineering} theme="dev" />
        </div>
      </div>
    </section>
  );
}

function SkillColumn({ data, theme }) {
  const design = theme === "design";
  const [open, setOpen] = useState(0);
  const Icon = design ? Palette : Code;

  return (
    <motion.div
      {...fadeUp(design ? 0 : 0.1)}
      className={`relative overflow-hidden rounded-[2rem] p-6 sm:p-8 ${
        design ? "bg-cream text-ink" : "border border-cyan-400/20 bg-slate-900/60 text-slate-200"
      }`}
    >
      {design ? (
        <div className="bg-paper-dots pointer-events-none absolute inset-0 opacity-50" aria-hidden />
      ) : (
        <div className="bg-code-grid pointer-events-none absolute inset-0 opacity-60" aria-hidden />
      )}

      <div className="relative">
        <div className="flex items-center gap-4">
          <span className={`grid h-12 w-12 place-items-center rounded-2xl ${design ? "bg-ink text-cream" : "bg-cyan-400/15 text-cyan-300"}`}>
            <Icon width={22} height={22} />
          </span>
          <div>
            <p className={`font-mono text-[11px] uppercase tracking-[0.2em] ${design ? "text-amberline" : "text-cyan-400"}`}>{data.kicker}</p>
            <h3 className={`text-2xl font-bold ${design ? "font-display" : "font-mono tracking-tight text-white"}`}>{data.title}</h3>
          </div>
        </div>

        <ul className="mt-7 space-y-2">
          {data.items.map((s, i) => {
            const isOpen = open === i;
            return (
              <motion.li
                key={s.name}
                initial={{ opacity: 0, x: design ? -16 : 16 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ ...spring, delay: 0.05 * i }}
                className={`rounded-2xl border transition-colors ${
                  design
                    ? isOpen ? "border-ink/25 bg-white" : "border-ink/10 bg-white/50 hover:bg-white/80"
                    : isOpen ? "border-cyan-400/40 bg-slate-950/80" : "border-white/5 bg-slate-950/40 hover:border-white/15"
                }`}
              >
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => setOpen(isOpen ? -1 : i)}
                  className="flex w-full items-center gap-4 px-4 py-4 text-left sm:px-5"
                >
                  <span className={`font-mono text-xs ${design ? "text-ink/40" : "text-cyan-400/60"}`}>0{i + 1}</span>
                  <span className="flex-1 text-sm font-semibold sm:text-base">{s.name}</span>
                  <motion.span animate={{ rotate: isOpen ? 45 : 0 }} transition={spring} className={design ? "text-ink/60" : "text-cyan-300"}>
                    <Plus width={18} height={18} />
                  </motion.span>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={spring}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-5 pl-12 sm:px-5 sm:pl-[3.25rem]">
                        <p className={`text-sm leading-relaxed ${design ? "text-ink/70" : "text-slate-400"}`}>{s.detail}</p>
                        <ul className="mt-3 flex flex-wrap gap-1.5">
                          {s.tools.map((t) => (
                            <li
                              key={t}
                              className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
                                design ? "bg-ink text-cream" : "border border-cyan-400/30 font-mono text-cyan-200"
                              }`}
                            >
                              {t}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.li>
            );
          })}
        </ul>
      </div>
    </motion.div>
  );
}
