import { motion } from "framer-motion";
import { projects, stats } from "../data/portfolio.js";
import { spring } from "../lib/motion.js";
import { GooglePlay } from "./ReleaseStatus.jsx";

const PhoneIcon = (p) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden {...p}>
    <rect x="6" y="2" width="12" height="20" rx="3" />
    <path d="M11 18h2" />
  </svg>
);
const FlaskIcon = (p) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden {...p}>
    <path d="M9 3h6M10 3v6L4.5 19a1.5 1.5 0 0 0 1.3 2h12.4a1.5 1.5 0 0 0 1.3-2L14 9V3" />
    <path d="M7 15h10" />
  </svg>
);
const ShieldIcon = (p) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden {...p}>
    <path d="M12 3 4 6v6c0 5 3.4 8.3 8 9 4.6-.7 8-4 8-9V6l-8-3z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

export default function Stats() {
  const live = projects.filter((p) => p.status === "live").length;
  const testing = projects.filter((p) => p.status === "closed" || p.status === "internal").length;

  const items = [
    { value: `${projects.length}`, label: "Apps developed", Icon: PhoneIcon, color: "text-cyan-300", ring: "hover:border-cyan-300/40" },
    { value: `${live}`, label: "Live on Google Play", Icon: GooglePlay, color: "text-amber-300", ring: "hover:border-amber-300/40" },
    { value: `${testing}`, label: "In Play Console testing", Icon: FlaskIcon, color: "text-sky-300", ring: "hover:border-sky-300/40" },
    { value: stats.secure.value, label: stats.secure.label, Icon: ShieldIcon, color: "text-emerald-300", ring: "hover:border-emerald-300/40" },
  ];

  return (
    <section aria-label="Key numbers" className="bg-night px-4 pb-6 sm:px-6">
      <ul className="mx-auto grid max-w-6xl grid-cols-2 gap-3 md:grid-cols-4">
        {items.map(({ value, label, Icon, color, ring }, i) => (
          <motion.li
            key={label}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ ...spring, delay: i * 0.06 }}
            className={`rounded-3xl border border-white/10 bg-slate-900/60 p-5 transition-colors ${ring}`}
          >
            <span className={`flex items-center gap-2 ${color}`}>
              <Icon width={18} height={18} />
              <span className="font-display text-3xl font-bold leading-none sm:text-4xl">{value}</span>
            </span>
            <span className="mt-2 block text-xs font-medium text-slate-400 sm:text-sm">{label}</span>
          </motion.li>
        ))}
      </ul>
    </section>
  );
}
