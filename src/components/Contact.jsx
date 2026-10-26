import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { contact, profile } from "../data/portfolio.js";
import { fadeUp, spring } from "../lib/motion.js";
import { ArrowUpRight, Check, Mail, WhatsApp, socialIcon } from "./Icons.jsx";
import SectionHeading from "./SectionHeading.jsx";

// Form submissions are delivered by FormSubmit (https://formsubmit.co) straight to the owner's inbox.
// FormSubmit needs a one-time activation PER WEBSITE ADDRESS: the first submission from a new domain
// sends an "Activate Form" email to the inbox below. Until that link is clicked, requests are rejected.
// `formEmail` may be the email itself or the private alias code FormSubmit gives after activation.
const FORM_TARGET = (contact.formEmail || profile.email).trim();
const ENDPOINT = `https://formsubmit.co/ajax/${encodeURIComponent(FORM_TARGET)}`;
const TIMEOUT_MS = 15000;
const SLOW_MS = 5000;

class SendError extends Error {
  constructor(kind, message) {
    super(message);
    this.kind = kind; // "activation" | "timeout" | "network" | "rejected"
  }
}

async function postOnce(payload) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    // URL-encoded body = a "simple" CORS request: no extra preflight round-trip before sending.
    // keepalive lets the request finish even if the visitor closes or leaves the page.
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { Accept: "application/json" },
      body: new URLSearchParams(payload),
      signal: ctrl.signal,
      keepalive: true,
    });
    const data = await res.json().catch(() => ({}));
    const msg = String(data.message || "");
    if (/activat/i.test(msg)) throw new SendError("activation", msg);
    if (!res.ok || String(data.success) === "false") throw new SendError("rejected", msg || `HTTP ${res.status}`);
    return data;
  } catch (err) {
    if (err instanceof SendError) throw err;
    if (err?.name === "AbortError") throw new SendError("timeout", "Request timed out");
    throw new SendError("network", err?.message || "Network error");
  } finally {
    clearTimeout(timer);
  }
}

/** Sends the request; retries once on a dropped connection (not on timeouts or rejections). */
async function sendRequest(payload) {
  try {
    return await postOnce(payload);
  } catch (err) {
    if (err.kind !== "network") throw err;
    await new Promise((r) => setTimeout(r, 800));
    return postOnce(payload);
  }
}

const CURRENCIES = {
  IDR: { label: "IDR (Rp)", placeholder: "e.g. 15.000.000" },
  USD: { label: "USD ($)", placeholder: "e.g. 1,000 – 2,500" },
};

const EMPTY = { name: "", reply: "", type: contact.projectTypes?.[0] || "", details: "", currency: "IDR", budget: "", website: "" };

const isEmail = (s) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s.trim());
const isPhone = (s) => s.replace(/\D/g, "").length >= 8 && /^[+\d\s().-]+$/.test(s.trim());

function validate(v) {
  const e = {};
  if (v.name.trim().length < 2) e.name = "Please enter your name or company.";
  if (!isEmail(v.reply) && !isPhone(v.reply)) e.reply = "Enter a valid email address or WhatsApp number.";
  if (v.details.trim().length < 20) e.details = "Please describe your project (at least 20 characters).";
  return e;
}

export default function Contact() {
  const [values, setValues] = useState(EMPTY);
  const [touched, setTouched] = useState({});
  // idle → sent (shown instantly) → delivered in the background; error = fall back to WhatsApp/email
  const [status, setStatus] = useState("idle"); // idle | sent | error
  const [delivery, setDelivery] = useState("pending"); // pending | done
  const [slow, setSlow] = useState(false);
  const fallbackRef = useRef(null);
  const requestId = useRef(0);
  const errors = validate(values);

  useEffect(() => {
    if (status !== "sent" || delivery !== "pending") return setSlow(false);
    const t = setTimeout(() => setSlow(true), SLOW_MS);
    return () => clearTimeout(t);
  }, [status, delivery]);

  // Bring the alternative send options into view when the online form fails
  useEffect(() => {
    if (status !== "error" || !fallbackRef.current) return;
    // Vertical-only scroll (scrollIntoView can also shift overflow-hidden sections sideways)
    const r = fallbackRef.current.getBoundingClientRect();
    if (r.top < 90 || r.bottom > window.innerHeight) {
      window.scrollTo({ top: window.scrollY + r.top - window.innerHeight / 2 + r.height / 2, behavior: "smooth" });
    }
  }, [status]);

  const set = (k) => (e) => setValues((v) => ({ ...v, [k]: e.target.value }));
  const blur = (k) => () => setTouched((t) => ({ ...t, [k]: true }));
  const show = (k) => touched[k] && errors[k];

  const budgetText = () => (values.budget.trim() ? `${values.currency} ${values.budget.trim()}` : "Not specified");

  const plainText = () =>
    [
      `Name / Company: ${values.name.trim()}`,
      `Contact: ${values.reply.trim()}`,
      values.type && `Project type: ${values.type}`,
      `Estimated budget: ${budgetText()}`,
      "",
      "Project details & specifications:",
      values.details.trim(),
    ]
      .filter((l) => l !== false && l !== undefined)
      .join("\n");

  const subject = () => `New project request — ${values.name.trim()}${values.type ? ` (${values.type})` : ""}`;

  const onSubmit = async (e) => {
    e.preventDefault();
    setTouched({ name: true, reply: true, details: true });
    if (Object.keys(errors).length) return;
    if (values.website) {
      // honeypot: bots fill hidden fields — pretend success, send nothing
      setDelivery("done");
      return setStatus("sent");
    }

    // Show the confirmation immediately; delivery finishes in the background.
    const id = ++requestId.current;
    setDelivery("pending");
    setStatus("sent");
    try {
      await sendRequest({
        "Full Name / Company": values.name.trim(),
        "Email or WhatsApp": values.reply.trim(),
        "Project Type": values.type,
        "Estimated Budget": budgetText(),
        "Project Details & Specifications": values.details.trim(),
        _subject: subject(),
        _template: "table",
        _captcha: "false",
        ...(isEmail(values.reply) ? { _replyto: values.reply.trim() } : {}),
      });
      if (id === requestId.current) setDelivery("done");
    } catch (err) {
      if (id !== requestId.current) return;
      if (err.kind === "activation") {
        // For the site owner (visible in the browser console only)
        console.warn(
          `[Hire Me form] FormSubmit is not activated for ${window.location.host}. ` +
            `Open the "Activate FormSubmit" email sent to the form inbox and click "Activate Form".`
        );
      }
      setStatus("error");
    }
  };

  const mailtoHref = () => `mailto:${profile.email}?subject=${encodeURIComponent(subject())}&body=${encodeURIComponent(plainText())}`;
  const whatsappHref = () => `https://wa.me/${profile.whatsapp}?text=${encodeURIComponent(`${subject()}\n\n${plainText()}`)}`;

  const reset = () => {
    requestId.current++;
    setValues(EMPTY);
    setTouched({});
    setStatus("idle");
  };

  const field =
    "w-full rounded-2xl border bg-slate-950/60 px-4 py-3.5 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-cream focus:ring-4 focus:ring-cream/10";

  return (
    <section id="contact" className="relative overflow-clip bg-night py-24 md:py-32">
      <div className="pointer-events-none absolute -left-40 top-20 h-96 w-96 rounded-full bg-cyan-500/10 blur-[120px]" aria-hidden />
      <div className="pointer-events-none absolute -right-40 bottom-0 h-96 w-96 rounded-full bg-amber-200/10 blur-[120px]" aria-hidden />

      <div className="relative mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)] gap-12 px-5 sm:px-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-16">
        {/* Left: intro + direct channels */}
        <div>
          <SectionHeading index="05" kicker="Hire me" title={contact.title || "Hire Me"}>
            {contact.intro}
          </SectionHeading>

          <p className="mt-10 font-mono text-[11px] uppercase tracking-[0.2em] text-slate-500">
            Or reach out directly via
          </p>
          <div className="mt-3 grid grid-cols-[minmax(0,1fr)] gap-3">
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
              const Icon = socialIcon[s.id] || socialIcon.website;
              return (
                <motion.a
                  key={`${s.id}-${i}`}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={`${s.label} — ${s.handle}`}
                  aria-label={`${s.label}: ${s.handle}`}
                  {...fadeUp(0.15 + i * 0.05)}
                  whileHover={{ y: -4 }}
                  className="group flex min-w-0 flex-col items-start gap-2.5 rounded-2xl border border-white/10 bg-slate-900/50 p-4 transition-colors hover:border-cream/40 hover:bg-slate-900"
                >
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/5 text-white transition-colors group-hover:bg-cream group-hover:text-ink">
                    <Icon />
                  </span>
                  <span className="block w-full truncate text-sm font-semibold text-white">{s.label}</span>
                </motion.a>
              );
            })}
          </div>
        </div>

        {/* Right: project request form */}
        <motion.div {...fadeUp(0.1)} className="relative rounded-[2rem] border border-white/10 bg-slate-900/60 p-6 backdrop-blur sm:p-8">
          <AnimatePresence mode="wait">
            {status === "sent" ? (
              <motion.div
                key="sent"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={spring}
                className="flex min-h-[460px] flex-col items-center justify-center text-center"
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
                <h3 className="mt-6 font-display text-2xl font-bold text-white">Project request sent!</h3>
                <p className="mt-2 max-w-sm text-sm text-slate-400">
                  Thank you{values.name.trim() ? `, ${values.name.trim().split(" ")[0]}` : ""}. I’ll review your project and get back to you within 1–2 business days.
                </p>
                <p className="mt-5 flex min-h-5 items-center gap-2 text-xs font-medium" aria-live="polite">
                  {delivery === "done" ? (
                    <span className="flex items-center gap-1.5 text-emerald-300">
                      <Check width={14} height={14} /> Delivered to my inbox
                    </span>
                  ) : (
                    <span className="flex items-center gap-2 text-slate-400">
                      <span className="h-3 w-3 animate-spin rounded-full border-2 border-slate-400 border-t-transparent" />
                      {slow ? "Finishing delivery — you can keep browsing" : "Delivering to my inbox…"}
                    </span>
                  )}
                </p>
                <button
                  onClick={reset}
                  disabled={delivery !== "done"}
                  className="mt-5 rounded-full border border-white/15 px-5 py-2.5 text-sm font-semibold text-slate-200 transition-opacity hover:bg-white/5 disabled:opacity-40"
                >
                  Submit another request
                </button>
              </motion.div>
            ) : (
              <motion.form
                key="form"
                onSubmit={onSubmit}
                noValidate
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, transition: { duration: 0.12 } }}
                className="grid gap-5"
                aria-label="Project request form"
              >
                <div>
                  <h3 className="font-display text-xl font-bold text-white">Project request</h3>
                  <p className="mt-1 text-sm text-slate-400">Fields marked * are required. Requests go straight to my inbox.</p>
                </div>

                {/* Honeypot (hidden from people, catches spam bots) */}
                <input type="text" name="website" value={values.website} onChange={set("website")} tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />

                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Full Name / Company *" error={show("name")} id="name">
                    <input
                      id="name"
                      autoComplete="name"
                      value={values.name}
                      onChange={set("name")}
                      onBlur={blur("name")}
                      placeholder="Enter your name"
                      aria-invalid={!!show("name")}
                      aria-describedby={show("name") ? "name-err" : undefined}
                      className={`${field} ${show("name") ? "border-rose-400/70" : "border-white/10"}`}
                    />
                  </Field>
                  <Field label="Email or WhatsApp Number *" error={show("reply")} id="reply">
                    <input
                      id="reply"
                      autoComplete="email"
                      value={values.reply}
                      onChange={set("reply")}
                      onBlur={blur("reply")}
                      placeholder="email@domain.com or +62…"
                      aria-invalid={!!show("reply")}
                      aria-describedby={show("reply") ? "reply-err" : undefined}
                      className={`${field} ${show("reply") ? "border-rose-400/70" : "border-white/10"}`}
                    />
                  </Field>
                </div>

                {contact.projectTypes?.length > 0 && (
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
                )}

                <Field label="Project Details & Specifications *" error={show("details")} id="details">
                  <textarea
                    id="details"
                    rows={5}
                    value={values.details}
                    onChange={set("details")}
                    onBlur={blur("details")}
                    placeholder="Explain the core features, target users, or application idea you want to build..."
                    aria-invalid={!!show("details")}
                    aria-describedby={show("details") ? "details-err" : undefined}
                    className={`${field} resize-y ${show("details") ? "border-rose-400/70" : "border-white/10"}`}
                  />
                  <span className="mt-1 block text-right font-mono text-[11px] text-slate-500">{values.details.trim().length} chars</span>
                </Field>

                <div>
                  <label htmlFor="budget" className="mb-2 block text-sm font-medium text-slate-300">
                    Estimated Budget <span className="font-normal text-slate-500">(optional)</span>
                  </label>
                  <div className="flex gap-2">
                    <select
                      aria-label="Currency"
                      value={values.currency}
                      onChange={set("currency")}
                      className="w-[7.5rem] shrink-0 rounded-2xl border border-white/10 bg-slate-950/60 px-3 py-3.5 text-sm font-semibold text-white outline-none transition focus:border-cream focus:ring-4 focus:ring-cream/10 sm:w-32"
                    >
                      {Object.entries(CURRENCIES).map(([code, c]) => (
                        <option key={code} value={code}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                    <input
                      id="budget"
                      inputMode="text"
                      value={values.budget}
                      onChange={set("budget")}
                      placeholder={CURRENCIES[values.currency].placeholder}
                      className={`${field} w-auto min-w-0 flex-1 border-white/10`}
                    />
                  </div>
                </div>

                <AnimatePresence>
                  {status === "error" && (
                    <motion.div
                      ref={fallbackRef}
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      role="alert"
                      className="rounded-2xl border border-amber-300/30 bg-amber-300/10 p-5 text-sm text-amber-50"
                    >
                      <p className="font-semibold text-white">Almost there — please send it with one tap.</p>
                      <p className="mt-1 text-amber-100/80">
                        The online form is temporarily unavailable. Your request is already written below — choose WhatsApp or email and just press send.
                      </p>
                      <div className="mt-4 grid gap-2 sm:grid-cols-2">
                        <a
                          href={whatsappHref()}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-500 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-emerald-400"
                        >
                          <WhatsApp width={16} height={16} /> Send via WhatsApp
                        </a>
                        <a
                          href={mailtoHref()}
                          className="inline-flex items-center justify-center gap-2 rounded-full bg-cream px-4 py-3 text-sm font-bold text-ink transition-opacity hover:opacity-90"
                        >
                          <Mail width={16} height={16} /> Send by email
                        </a>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-cream px-6 py-4 text-sm font-bold text-ink disabled:opacity-60"
                >
                  {status === "error" ? (
                    <>Try the online form again</>
                  ) : (
                    <>
                      Submit Project Request <ArrowUpRight width={16} height={16} />
                    </>
                  )}
                </motion.button>
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
          <motion.p id={`${id}-err`} initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-1.5 text-xs text-rose-300">
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
      className="group flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-900/50 p-3.5 sm:gap-4 sm:p-4 transition-colors hover:border-cream/40 hover:bg-slate-900"
    >
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-cream text-ink sm:h-12 sm:w-12">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block font-mono text-[11px] uppercase tracking-[0.2em] text-slate-500">{label}</span>
        <span className="block truncate text-sm font-semibold text-white sm:text-base">{value}</span>
      </span>
      <ArrowUpRight className="text-slate-500 transition-colors group-hover:text-cream" />
    </motion.a>
  );
}
