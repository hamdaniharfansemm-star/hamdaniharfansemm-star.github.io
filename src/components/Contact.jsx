import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { contact, profile } from "../data/portfolio.js";
import { fadeUp, spring } from "../lib/motion.js";
import { ArrowUpRight, Check, Mail, WhatsApp, socialIcon } from "./Icons.jsx";
import SectionHeading from "./SectionHeading.jsx";

const EMPTY = { name: "", email: "", type: contact.projectTypes[0], message: "" };

function validate(v) {
  const e = {};
  if (v.name.trim().length < 2) e.name = "Please enter your name.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.email.trim())) e.email = "Please enter a valid email address.";
  if (v.message.trim().length < 20) e.message = "Tell me a bit more (at least 20 characters).";
  return e;
}

export default function Contact() {
  const [values, setValues] = useState(EMPTY);
  const [touched, setTouched] = useState({});
  const [status, setStatus] = useState("idle"); // idle | sending | sent
  const errors = validate(values);

  const set = (k) => (e) => setValues((v) => ({ ...v, [k]: e.target.value }));
  const blur = (k) => () => setTouched((t) => ({ ...t, [k]: true }));
  const show = (k) => touched[k] && errors[k];

  const composed = () => {
    const subject = `[Portfolio] ${values.type} — ${values.name}`;
    const body = `${values.message}\n\n— ${values.name}\n${values.email}`;
    return { subject, body };
  };

  const onSubmit = (e) => {
    e.preventDefault();
    setTouched({ name: true, email: true, message: true });
    if (Object.keys(errors).length) return;
    setStatus("sending");
    const { subject, body } = composed();
    // No backend needed: hand the message to the visitor's email app.
    window.location.href = `mailto:${profile.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setTimeout(() => setStatus("sent"), 700);
  };

  const sendWhatsApp = () => {
    const { subject, body } = composed();
    const text = `${subject}\n\n${body}`;
    window.open(`https://wa.me/${profile.whatsapp}?text=${encodeURIComponent(text)}`, "_blank", "noopener");
  };

  const field =
    "w-full rounded-2xl border bg-slate-950/60 px-4 py-3.5 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-cream focus:ring-4 focus:ring-cream/10";

  return (
    <section id="contact" className="relative overflow-hidden bg-night py-24 md:py-32">
      <div className="pointer-events-none absolute -left-40 top-20 h-96 w-96 rounded-full bg-cyan-500/10 blur-[120px]" aria-hidden />
      <div className="pointer-events-none absolute -right-40 bottom-0 h-96 w-96 rounded-full bg-amber-200/10 blur-[120px]" aria-hidden />

      <div className="relative mx-auto grid max-w-6xl gap-12 px-5 sm:px-8 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
        {/* Left: intro + direct channels */}
        <div>
          <SectionHeading index="05" kicker="Contact" title="Let’s work together">
            {contact.intro}
          </SectionHeading>

          <div className="mt-10 grid gap-3">
            <ChannelCard href={`mailto:${profile.email}`} icon={<Mail />} label="Email" value={profile.email} delay={0.05} />
            <ChannelCard
              href={`https://wa.me/${profile.whatsapp}`}
              icon={<WhatsApp />}
              label="Phone / WhatsApp"
              value={profile.phoneDisplay}
              external
              delay={0.1}
            />
          </div>

          <div className="mt-6 grid grid-cols-3 gap-3">
            {contact.socials.map((s, i) => {
              const Icon = socialIcon[s.id];
              return (
                <motion.a
                  key={s.id}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  {...fadeUp(0.15 + i * 0.05)}
                  whileHover={{ y: -4 }}
                  className="group flex flex-col items-start gap-3 rounded-2xl border border-white/10 bg-slate-900/50 p-4 transition-colors hover:border-cream/40 hover:bg-slate-900"
                >
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/5 text-white transition-colors group-hover:bg-cream group-hover:text-ink">
                    <Icon />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-white">{s.label}</span>
                    <span className="block truncate text-xs text-slate-500">{s.handle}</span>
                  </span>
                </motion.a>
              );
            })}
          </div>
        </div>

        {/* Right: form */}
        <motion.div {...fadeUp(0.1)} className="relative rounded-[2rem] border border-white/10 bg-slate-900/60 p-6 backdrop-blur sm:p-8">
          <AnimatePresence mode="wait">
            {status === "sent" ? (
              <motion.div
                key="sent"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={spring}
                className="flex min-h-[420px] flex-col items-center justify-center text-center"
                role="status"
              >
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ ...spring, delay: 0.1 }}
                  className="grid h-16 w-16 place-items-center rounded-full bg-emerald-400 text-slate-950"
                >
                  <Check width={30} height={30} />
                </motion.span>
                <h3 className="mt-6 font-display text-2xl font-bold text-white">Your message is ready!</h3>
                <p className="mt-2 max-w-sm text-sm text-slate-400">
                  Your email app should have opened with everything filled in — just press send. Prefer chat? Send it via WhatsApp instead.
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-3">
                  <button onClick={sendWhatsApp} className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-400">
                    <WhatsApp width={16} height={16} /> Send via WhatsApp
                  </button>
                  <button
                    onClick={() => {
                      setValues(EMPTY);
                      setTouched({});
                      setStatus("idle");
                    }}
                    className="rounded-full border border-white/15 px-5 py-2.5 text-sm font-semibold text-slate-200 hover:bg-white/5"
                  >
                    New message
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.form key="form" onSubmit={onSubmit} noValidate initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid gap-5">
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Your name" error={show("name")} id="name">
                    <input id="name" autoComplete="name" value={values.name} onChange={set("name")} onBlur={blur("name")} placeholder="Jane Doe"
                      aria-invalid={!!show("name")} aria-describedby={show("name") ? "name-err" : undefined}
                      className={`${field} ${show("name") ? "border-rose-400/70" : "border-white/10"}`} />
                  </Field>
                  <Field label="Email" error={show("email")} id="email">
                    <input id="email" type="email" autoComplete="email" value={values.email} onChange={set("email")} onBlur={blur("email")} placeholder="jane@company.com"
                      aria-invalid={!!show("email")} aria-describedby={show("email") ? "email-err" : undefined}
                      className={`${field} ${show("email") ? "border-rose-400/70" : "border-white/10"}`} />
                  </Field>
                </div>

                <fieldset>
                  <legend className="mb-2 text-sm font-medium text-slate-300">Project type</legend>
                  <div className="flex flex-wrap gap-2">
                    {contact.projectTypes.map((t) => (
                      <label
                        key={t}
                        className={`cursor-pointer rounded-full border px-3.5 py-2 text-xs font-medium transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-cream ${
                          values.type === t ? "border-cream bg-cream text-ink" : "border-white/10 text-slate-300 hover:border-white/30"
                        }`}
                      >
                        <input type="radio" name="type" value={t} checked={values.type === t} onChange={set("type")} className="sr-only" />
                        {t}
                      </label>
                    ))}
                  </div>
                </fieldset>

                <Field label="Message" error={show("message")} id="message">
                  <textarea id="message" rows={5} value={values.message} onChange={set("message")} onBlur={blur("message")}
                    placeholder="Tell me about your project, timeline and goals…"
                    aria-invalid={!!show("message")} aria-describedby={show("message") ? "message-err" : undefined}
                    className={`${field} resize-none ${show("message") ? "border-rose-400/70" : "border-white/10"}`} />
                  <span className="mt-1 block text-right font-mono text-[11px] text-slate-500">{values.message.trim().length} chars</span>
                </Field>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={status === "sending"}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-cream px-6 py-3.5 text-sm font-bold text-ink disabled:opacity-60"
                  >
                    {status === "sending" ? "Opening your email app…" : "Send message"}
                    <ArrowUpRight width={16} height={16} />
                  </motion.button>
                  <button
                    type="button"
                    onClick={() => {
                      setTouched({ name: true, email: true, message: true });
                      if (!Object.keys(errors).length) sendWhatsApp();
                    }}
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-emerald-400/40 px-6 py-3.5 text-sm font-semibold text-emerald-300 hover:bg-emerald-400/10"
                  >
                    <WhatsApp width={16} height={16} /> WhatsApp
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
}

function Field({ label, id, error, children }) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm font-medium text-slate-300">
        {label}
      </label>
      {children}
      <AnimatePresence>
        {error && (
          <motion.p
            id={`${id}-err`}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-1.5 text-xs text-rose-300"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

function ChannelCard({ href, icon, label, value, external, delay }) {
  return (
    <motion.a
      href={href}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      {...fadeUp(delay)}
      whileHover={{ x: 6 }}
      className="group flex items-center gap-4 rounded-2xl border border-white/10 bg-slate-900/50 p-4 transition-colors hover:border-cream/40 hover:bg-slate-900"
    >
      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-cream text-ink">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block font-mono text-[11px] uppercase tracking-[0.2em] text-slate-500">{label}</span>
        <span className="block truncate text-base font-semibold text-white">{value}</span>
      </span>
      <ArrowUpRight className="text-slate-500 transition-colors group-hover:text-cream" />
    </motion.a>
  );
}
