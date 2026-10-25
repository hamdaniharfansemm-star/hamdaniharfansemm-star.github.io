import { playUrl, releaseStatus } from "../data/portfolio.js";
import { ArrowRight } from "./Icons.jsx";

// Full class strings so Tailwind can see them at build time.
const tones = {
  emerald: { badge: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300", dot: "bg-emerald-400 animate-pulse" },
  amber: { badge: "border-amber-400/30 bg-amber-400/10 text-amber-300", dot: "bg-amber-400" },
  sky: { badge: "border-sky-400/30 bg-sky-400/10 text-sky-300", dot: "bg-sky-400" },
  slate: { badge: "border-slate-400/30 bg-slate-400/10 text-slate-300", dot: "bg-slate-400" },
};

export function StatusBadge({ status, className = "" }) {
  const s = releaseStatus[status];
  if (!s) return null;
  const t = tones[s.tone];
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${t.badge} ${className}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${t.dot}`} />
      {s.label}
    </span>
  );
}

export const GooglePlay = (p) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden {...p}>
    <path d="M3.6 1.8c-.3.3-.4.7-.4 1.2v18c0 .5.1.9.4 1.2l.1.1L13.8 12.2v-.3L3.7 1.7l-.1.1zM17.2 15.6l-3.4-3.4v-.3l3.4-3.4.1.1 4 2.3c1.1.6 1.1 1.7 0 2.4l-4 2.3h-.1zM17.3 15.5 13.8 12 3.6 22.2c.4.4 1 .4 1.7.1l12-6.8M17.3 8.5 5.3 1.7C4.6 1.3 4 1.4 3.6 1.8L13.8 12l3.5-3.5z" />
  </svg>
);

/** Live app → Google Play link. App in testing → ask for early access via the contact form. */
export function ReleaseAction({ project: p, size = "sm", onNavigate }) {
  const pad = size === "lg" ? "px-5 py-3 text-sm" : "px-3 py-1.5 text-xs";
  if (p.status === "live" && p.packageId) {
    return (
      <a
        href={playUrl(p.packageId)}
        target="_blank"
        rel="noopener noreferrer"
        className={`inline-flex items-center gap-2 rounded-xl bg-emerald-500 font-semibold text-slate-950 transition-colors hover:bg-emerald-400 ${pad}`}
      >
        <GooglePlay /> Get on Google Play
      </a>
    );
  }
  return (
    <a
      href="#contact"
      onClick={onNavigate}
      className={`inline-flex items-center gap-1.5 rounded-xl border border-white/15 font-semibold text-slate-200 transition-colors hover:border-cream hover:bg-cream hover:text-ink ${pad}`}
    >
      Request early access <ArrowRight width={13} height={13} />
    </a>
  );
}
