import { motion } from "framer-motion";
import { banner, profile } from "../data/portfolio.js";
import { fadeUp, spring } from "../lib/motion.js";
import { ArrowRight } from "./Icons.jsx";

export default function ProfessionalBanner({ bgSrc = profile.bannerBg }) {
  return (
    <section aria-label="Availability" className="relative bg-night px-4 py-14 sm:px-6 md:py-20">
      <motion.div
        {...fadeUp()}
        className="relative mx-auto max-w-6xl overflow-hidden rounded-[2rem] border border-white/10 bg-slate-900"
      >
        {/* Background graphic */}
        <img
          src={bgSrc}
          alt=""
          loading="lazy"
          decoding="async"
          width="1440"
          height="810"
          className="absolute inset-0 h-full w-full object-cover object-right opacity-70"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/90 to-slate-950/20" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent md:hidden" />

        <div className="relative grid gap-8 p-7 sm:p-10 md:grid-cols-[1.4fr_1fr] md:p-14">
          <div>
            <motion.p
              {...fadeUp(0.1)}
              className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3.5 py-1.5 text-xs font-semibold text-emerald-300"
            >
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
              {banner.status}
            </motion.p>

            <motion.h2
              {...fadeUp(0.15)}
              className="mt-5 max-w-3xl text-balance font-display text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl md:text-5xl"
            >
              {banner.title}
            </motion.h2>

            <motion.p {...fadeUp(0.2)} className="mt-5 max-w-2xl text-sm leading-relaxed text-slate-300 sm:text-base md:text-lg">
              {banner.tagline}
            </motion.p>

            <motion.a
              {...fadeUp(0.25)}
              href="#contact"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="group mt-8 inline-flex items-center gap-3 rounded-full bg-cream px-6 py-3.5 text-sm font-bold text-ink shadow-lg shadow-black/30"
            >
              {banner.cta}
              <span className="grid h-7 w-7 place-items-center rounded-full bg-ink text-cream transition-transform duration-300 group-hover:translate-x-1">
                <ArrowRight width={14} height={14} />
              </span>
            </motion.a>
          </div>

          <motion.ul
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.4 }}
            variants={{ show: { transition: { staggerChildren: 0.08 } } }}
            className="hidden self-end md:grid md:gap-3"
          >
            {["Enterprise-grade reliability", "End-to-end product delivery", "Banking governance mindset"].map((t) => (
              <motion.li
                key={t}
                variants={{ hidden: { opacity: 0, x: 20 }, show: { opacity: 1, x: 0, transition: spring } }}
                className="ml-auto flex w-fit items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-slate-200 backdrop-blur"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-300" />
                {t}
              </motion.li>
            ))}
          </motion.ul>
        </div>
      </motion.div>
    </section>
  );
}
