import { contact, navLinks, profile } from "../data/portfolio.js";
import { ArrowUp, socialIcon } from "./Icons.jsx";

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-night">
      <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8">
        <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
          <div className="max-w-sm">
            <a href="#home" className="flex items-center gap-2.5">
              <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-emerald-400" />
              <span className="font-display text-xl font-bold text-white">{profile.name}</span>
            </a>
            <p className="mt-3 text-sm leading-relaxed text-slate-500">{profile.role}.</p>
          </div>

          <nav aria-label="Footer" className="grid grid-cols-2 gap-x-12 gap-y-2 text-sm sm:grid-cols-3">
            {navLinks.map((l) => (
              <a key={l.id} href={`#${l.id}`} className="text-slate-400 transition-colors hover:text-white">
                {l.label}
              </a>
            ))}
          </nav>

          <div className="flex gap-2">
            {contact.socials.map((s) => {
              const Icon = socialIcon[s.id];
              return (
                <a
                  key={s.id}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  className="grid h-10 w-10 place-items-center rounded-full border border-white/10 text-slate-300 transition-colors hover:border-cream hover:bg-cream hover:text-ink"
                >
                  <Icon width={18} height={18} />
                </a>
              );
            })}
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-white/10 pt-6 text-xs text-slate-500 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <p>© 2026 Hamdani Harfan. All rights reserved.</p>
            <p className="text-slate-600">
              Personal portfolio. Professional affiliation: {profile.company}. Views and independent projects shown here are my own.
            </p>
          </div>
          <a href="#home" className="inline-flex items-center gap-2 self-start rounded-full border border-white/10 px-4 py-2 text-slate-300 hover:border-white/30 hover:text-white md:self-auto">
            Back to top <ArrowUp width={14} height={14} />
          </a>
        </div>
      </div>
    </footer>
  );
}
