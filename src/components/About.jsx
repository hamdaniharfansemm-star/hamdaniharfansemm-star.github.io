import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { about, profile } from "../data/portfolio.js";
import { fadeUp, spring } from "../lib/motion.js";
import SectionHeading from "./SectionHeading.jsx";
import { GradCap } from "./Icons.jsx";

export default function About({ photoSrc = profile.photo }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const photoY = useTransform(scrollYProgress, [0, 1], [40, -40]);

  return (
    <section id="about" ref={ref} className="relative overflow-clip bg-cream py-24 text-ink md:py-32">
      <div className="bg-paper-dots pointer-events-none absolute inset-0 opacity-60" aria-hidden />

      <div className="relative mx-auto grid max-w-6xl gap-14 px-5 sm:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
        {/* Photo container */}
        <motion.div {...fadeUp()} className="relative mx-auto w-full max-w-sm self-start lg:sticky lg:top-28 lg:max-w-none">
          <div className="absolute -inset-3 translate-x-4 translate-y-4 rounded-[2.5rem] border-2 border-ink/80" aria-hidden />
          <div className="relative aspect-[4/5] overflow-hidden rounded-[2.5rem] bg-cream-deep shadow-2xl shadow-ink/20">
            <motion.img
              style={{ y: photoY, scale: 1.12 }}
              src={photoSrc}
              alt={`${profile.name}, Designer and Software Engineer`}
              loading="lazy"
              decoding="async"
              width="900"
              height="1205"
              className="h-full w-full object-cover object-top"
            />
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.8, rotate: -6 }}
            whileInView={{ opacity: 1, scale: 1, rotate: -4 }}
            viewport={{ once: true }}
            transition={{ ...spring, delay: 0.3 }}
            className="absolute -bottom-6 -left-2 rounded-2xl bg-ink px-5 py-4 text-cream shadow-xl sm:-left-6"
          >
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-cream/60">Currently at</p>
            <p className="font-display text-lg font-bold">PT Bank Mandiri</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.8, rotate: 8 }}
            whileInView={{ opacity: 1, scale: 1, rotate: 4 }}
            viewport={{ once: true }}
            transition={{ ...spring, delay: 0.4 }}
            className="absolute -right-2 top-8 rounded-2xl border border-ink/10 bg-white px-4 py-3 shadow-xl sm:-right-6"
          >
            <p className="font-mono text-xs text-ink/60">design + code</p>
            <p className="text-sm font-bold">Multidisciplinary ✦</p>
          </motion.div>
        </motion.div>

        {/* Copy */}
        <div>
          <SectionHeading index="01" kicker="About me" title={about.headline} tone="dark" />

          <motion.p {...fadeUp(0.15)} className="mt-7 text-base leading-relaxed text-ink/75 sm:text-lg">
            {about.body}
          </motion.p>

          <ol className="mt-10 grid gap-4 sm:grid-cols-3">
            {about.philosophy.map((p, i) => (
              <motion.li
                key={p.title}
                {...fadeUp(0.1 + i * 0.08)}
                whileHover={{ y: -6 }}
                className="group rounded-3xl border border-ink/10 bg-white/60 p-5 backdrop-blur transition-colors hover:border-ink/30 hover:bg-white"
              >
                <span className="font-mono text-xs text-amberline">0{i + 1}</span>
                <h3 className="mt-3 font-display text-lg font-bold leading-snug">{p.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink/65">{p.text}</p>
              </motion.li>
            ))}
          </ol>

          <motion.div {...fadeUp(0.25)} className="mt-10">
            <h3 className="font-mono text-xs uppercase tracking-[0.2em] text-amberline">Education</h3>
            <ul className="mt-3 grid gap-3">
              {about.education.map((e) => (
                <li key={e.degree} className="flex items-start gap-4 rounded-3xl border border-ink/10 bg-white/60 p-5 backdrop-blur">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-ink text-cream">
                    <GradCap width={20} height={20} />
                  </span>
                  <div>
                    <p className="font-display text-lg font-bold leading-snug">{e.degree}</p>
                    <p className="text-sm text-ink/70">
                      {e.field} · {e.school}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.dl {...fadeUp(0.3)} className="mt-10 flex flex-wrap gap-10 border-t border-ink/15 pt-8">
            {about.facts.map((f) => (
              <div key={f.label}>
                <dt className="sr-only">{f.label}</dt>
                <dd className="font-display text-5xl font-black">{f.value}</dd>
                <dd className="mt-1 text-sm text-ink/60">{f.label}</dd>
              </div>
            ))}
          </motion.dl>
        </div>
      </div>
    </section>
  );
}
