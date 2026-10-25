import { motion } from "framer-motion";
import { fadeUp } from "../lib/motion.js";

/** Consistent numbered section title. `tone` = "light" (on dark bg) | "dark" (on cream bg). */
export default function SectionHeading({ index, kicker, title, tone = "light", align = "left", children }) {
  const light = tone === "light";
  return (
    <div className={align === "center" ? "mx-auto max-w-3xl text-center" : "max-w-3xl"}>
      <motion.p
        {...fadeUp()}
        className={`flex items-center gap-3 font-mono text-xs uppercase tracking-[0.25em] ${
          align === "center" ? "justify-center" : ""
        } ${light ? "text-cyan-300" : "text-amberline"}`}
      >
        <span>{index}</span>
        <span className={`h-px w-10 ${light ? "bg-cyan-300/50" : "bg-amberline/50"}`} />
        <span>{kicker}</span>
      </motion.p>
      <motion.h2
        {...fadeUp(0.08)}
        className={`mt-4 font-display text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl md:text-6xl ${
          light ? "text-white" : "text-ink"
        }`}
      >
        {title}
      </motion.h2>
      {children && (
        <motion.div {...fadeUp(0.14)} className={`mt-5 text-base sm:text-lg ${light ? "text-slate-400" : "text-ink/70"}`}>
          {children}
        </motion.div>
      )}
    </div>
  );
}
