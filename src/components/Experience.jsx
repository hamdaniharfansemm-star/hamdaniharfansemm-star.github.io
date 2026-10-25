import { useRef } from "react";
import { motion, useScroll, useSpring } from "framer-motion";
import { experience } from "../data/portfolio.js";
import { spring } from "../lib/motion.js";
import SectionHeading from "./SectionHeading.jsx";

export default function Experience() {
  const listRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: listRef, offset: ["start 75%", "end 55%"] });
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 20 });

  return (
    <section id="experience" className="relative overflow-hidden bg-cream py-24 text-ink md:py-32">
      <div className="bg-paper-dots pointer-events-none absolute inset-0 opacity-60" aria-hidden />
      <div className="relative mx-auto max-w-5xl px-5 sm:px-8">
        <SectionHeading index="04" kicker="Experience" title="Where reliability meets creativity" tone="dark">
          A career shaped by banking discipline and a builder’s curiosity.
        </SectionHeading>

        <ol ref={listRef} className="relative mt-16">
          {/* Track + animated progress line */}
          <span className="absolute left-[11px] top-2 bottom-2 w-0.5 rounded-full bg-ink/10 md:left-1/2 md:-translate-x-1/2" aria-hidden />
          <motion.span
            style={{ scaleY: progress }}
            className="absolute left-[11px] top-2 bottom-2 w-0.5 origin-top rounded-full bg-ink md:left-1/2 md:-translate-x-1/2"
            aria-hidden
          />

          {experience.map((job, i) => {
            const right = i % 2 === 1;
            return (
              <li key={job.role} className="relative pb-12 pl-12 last:pb-0 md:grid md:grid-cols-2 md:gap-16 md:pl-0">
                {/* Node */}
                <motion.span
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  viewport={{ once: true, amount: 0.8 }}
                  transition={{ ...spring, delay: 0.1 }}
                  className="absolute left-0 top-1.5 grid h-6 w-6 place-items-center rounded-full border-2 border-ink bg-cream md:left-1/2 md:-translate-x-1/2"
                  aria-hidden
                >
                  <span className={`h-2 w-2 rounded-full ${job.current ? "animate-pulse bg-emerald-500" : "bg-ink"}`} />
                </motion.span>

                {/* Period (desktop: opposite side) */}
                <motion.div
                  initial={{ opacity: 0, x: right ? 30 : -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, amount: 0.5 }}
                  transition={spring}
                  className={`hidden pt-1 md:block ${right ? "md:order-2 md:text-left" : "md:text-right"}`}
                >
                  <span className="font-mono text-sm font-semibold text-amberline">{job.period}</span>
                </motion.div>

                {/* Card */}
                <motion.article
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ ...spring, delay: 0.05 }}
                  whileHover={{ y: -4 }}
                  className={`rounded-3xl border border-ink/10 bg-white/70 p-6 shadow-lg shadow-ink/5 backdrop-blur ${right ? "md:order-1" : ""}`}
                >
                  <p className="font-mono text-xs font-semibold text-amberline md:hidden">{job.period}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-2 md:mt-0">
                    <h3 className="font-display text-xl font-bold leading-snug sm:text-2xl">{job.role}</h3>
                    {job.current && (
                      <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">Current</span>
                    )}
                  </div>
                  <p className="mt-1 text-sm font-medium text-ink/60">{job.org}</p>
                  <p className="mt-4 text-sm leading-relaxed text-ink/75">{job.summary}</p>
                  <ul className="mt-4 flex flex-wrap gap-1.5">
                    {job.tags.map((t) => (
                      <li key={t} className="rounded-full border border-ink/15 px-2.5 py-1 text-[11px] font-medium text-ink/70">
                        {t}
                      </li>
                    ))}
                  </ul>
                </motion.article>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
