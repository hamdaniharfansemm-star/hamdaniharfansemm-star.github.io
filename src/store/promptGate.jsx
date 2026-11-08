// Prompt "gate": visitors like a photo before they can copy its prompt or download the image,
// and leave their email once before downloading. Emails go to the owner's inbox via FormSubmit
// (the same service as the Hire Me form). Likes are remembered on the visitor's device.
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import content from "../data/content.json";
import { copyText, promptPath, selectElementText } from "./prompts.js";
import { fetchLikeCounts, formatLikes, likesEnabled, sendLike, visitorId } from "./likesApi.js";

const LIKES_KEY = "hh-prompt-likes-v1";
const EMAIL_KEY = "hh-prompt-email-v1";
const SENT_KEY = "hh-prompt-leads-v1";
const SYNC_KEY = "hh-prompt-likes-synced-v1";
const FORM_TARGET = String(content.contact?.formEmail || content.profile?.email || "").trim();
const ENDPOINT = FORM_TARGET ? `https://formsubmit.co/ajax/${encodeURIComponent(FORM_TARGET)}` : "";

/* ── tiny storage helpers (never throw: private mode / blocked storage) ── */
const read = (k, fallback) => {
  try {
    const v = localStorage.getItem(k);
    return v ? JSON.parse(v) : fallback;
  } catch {
    return fallback;
  }
};
const write = (k, v) => {
  try {
    localStorage.setItem(k, JSON.stringify(v));
  } catch {
    /* ignore */
  }
};
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;

function sendLead(email, p, action) {
  if (!ENDPOINT) return;
  const sent = read(SENT_KEY, {});
  const key = `${email}|${p.slug}|${action}`;
  if (sent[key]) return; // one notification per person, prompt and action
  sent[key] = Date.now();
  write(SENT_KEY, sent);
  const params = new URLSearchParams(window.location.search);
  const payload = {
    _subject: `Lead Prompt AI — ${p.title}`.slice(0, 120),
    _template: "table",
    _captcha: "false",
    email,
    aksi: action === "download" ? "Unduh gambar prompt" : action,
    prompt: p.title,
    link: `${window.location.origin}${promptPath(p)}`,
    sumber: params.get("utm_source") || params.get("ref") || document.referrer || "langsung",
    waktu: new Date().toLocaleString("id-ID"),
  };
  try {
    fetch(ENDPOINT, { method: "POST", headers: { Accept: "application/json" }, body: new URLSearchParams(payload), keepalive: true }).catch(() => {});
  } catch {
    /* ignore */
  }
}

function downloadImage(p) {
  if (!p.image) return false;
  const ext = (p.image.split("?")[0].match(/\.(png|jpe?g|webp|gif)$/i)?.[1] || "png").toLowerCase();
  const a = document.createElement("a");
  a.href = p.image;
  a.download = `${p.slug || "prompt"}.${ext}`;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  return true;
}

const Ctx = createContext(null);
export const usePromptGate = () => useContext(Ctx);

/* ── icons ── */
const ico = { fill: "none", stroke: "currentColor", strokeWidth: 1.9, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true, viewBox: "0 0 24 24" };
export const HeartIcon = ({ filled = false, ...p }) => (
  <svg width="16" height="16" {...ico} fill={filled ? "currentColor" : "none"} {...p}>
    <path d="M12 20.5s-7.5-4.6-9.3-9.2C1.5 8 3.6 4.5 7.1 4.5c2 0 3.6 1.1 4.9 2.8 1.3-1.7 2.9-2.8 4.9-2.8 3.5 0 5.6 3.5 4.4 6.8-1.8 4.6-9.3 9.2-9.3 9.2z" />
  </svg>
);
export const DownloadIcon = (p) => (
  <svg width="16" height="16" {...ico} {...p}>
    <path d="M12 4v11M7.5 10.5 12 15l4.5-4.5" />
    <path d="M5 19h14" />
  </svg>
);
const LockIcon = (p) => (
  <svg width="16" height="16" {...ico} {...p}>
    <rect x="5" y="10.5" width="14" height="10" rx="2.5" />
    <path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" />
  </svg>
);

/* ── provider ── */
export function PromptGateProvider({ children, onToast }) {
  const [likes, setLikes] = useState(() => read(LIKES_KEY, {}));
  const likesRef = useRef(likes);
  likesRef.current = likes;
  const [email, setEmail] = useState(() => read(EMAIL_KEY, ""));
  const [gate, setGate] = useState(null); // { p, action: "copy" | "download", selectEl }
  const [counts, setCounts] = useState(null); // { slug: total } from Supabase, or null

  // Public totals (Supabase). Likes made before Supabase was connected are synced once.
  useEffect(() => {
    if (!likesEnabled) return;
    let live = true;
    (async () => {
      try {
        const map = await fetchLikeCounts();
        if (!live || !map) return;
        setCounts(map);
        const vid = visitorId();
        const synced = read(SYNC_KEY, {});
        const pending = Object.keys(read(LIKES_KEY, {})).filter((slug) => !synced[slug]).slice(0, 40);
        for (const slug of pending) {
          const n = await sendLike(slug, vid, true).catch(() => null);
          if (n === null) break;
          synced[slug] = 1;
          write(SYNC_KEY, synced);
          if (live) setCounts((c) => ({ ...(c || {}), [slug]: n }));
        }
      } catch {
        /* offline / not set up yet → device-only likes */
      }
    })();
    return () => {
      live = false;
    };
  }, []);

  // keep tabs/components in sync
  useEffect(() => {
    const on = (e) => {
      if (e.key === LIKES_KEY) setLikes(read(LIKES_KEY, {}));
      if (e.key === EMAIL_KEY) setEmail(read(EMAIL_KEY, ""));
    };
    window.addEventListener("storage", on);
    return () => window.removeEventListener("storage", on);
  }, []);

  const isLiked = useCallback((slug) => !!likes[slug], [likes]);
  const setLike = useCallback((slug, on) => {
    if (!!likesRef.current[slug] === on) return;
    const next = { ...likesRef.current };
    if (on) next[slug] = Date.now();
    else delete next[slug];
    likesRef.current = next;
    write(LIKES_KEY, next);
    setLikes(next);
    if (!likesEnabled) return;
    // optimistic total, then the exact number from the database
    setCounts((c) => (c ? { ...c, [slug]: Math.max(0, (c[slug] || 0) + (on ? 1 : -1)) } : c));
    sendLike(slug, visitorId(), on)
      .then((n) => {
        const synced = read(SYNC_KEY, {});
        if (on) synced[slug] = 1;
        else delete synced[slug];
        write(SYNC_KEY, synced);
        setCounts((c) => ({ ...(c || {}), [slug]: n }));
      })
      .catch(() => {});
  }, []);

  const doCopy = useCallback(
    async (p, selectEl) => {
      const ok = await copyText(p.prompt);
      if (!ok) selectElementText(selectEl);
      onToast?.(ok ? "Prompt tersalin — tinggal tempel (paste) di aplikasi AI Anda." : "Tekan lama teks prompt yang sudah ditandai, lalu pilih Salin.");
      return ok ? "done" : "manual";
    },
    [onToast]
  );
  const doDownload = useCallback(
    (p, mail) => {
      sendLead(mail, p, "download");
      if (downloadImage(p)) onToast?.("Gambar sedang diunduh. Terima kasih! 🙌");
      return "done";
    },
    [onToast]
  );

  const total = useMemo(() => (counts ? Object.values(counts).reduce((a, b) => a + b, 0) : null), [counts]);
  const api = useMemo(
    () => ({
      isLiked,
      /** Public total for a prompt, or null when Supabase is not connected / not loaded. */
      countOf: (slug) => (counts ? counts[slug] || 0 : null),
      counts,
      totalLikes: total,
      toggleLike: (p) => {
        const on = !likes[p.slug];
        setLike(p.slug, on);
        if (on) onToast?.("❤ Disukai — prompt & unduhan terbuka.");
      },
      /** Copy the prompt — only after the photo is liked. Returns "done" | "manual" | "gated". */
      copy: async (p, selectEl) => {
        if (!likes[p.slug]) {
          setGate({ p, action: "copy", selectEl });
          return "gated";
        }
        return doCopy(p, selectEl);
      },
      /** Download the image — needs a like and (once) an email address. */
      download: (p) => {
        if (!p.image) return "none";
        if (!likes[p.slug] || !email) {
          setGate({ p, action: "download" });
          return "gated";
        }
        return doDownload(p, email);
      },
    }),
    [isLiked, likes, email, setLike, doCopy, doDownload, onToast, counts, total]
  );

  return (
    <Ctx.Provider value={api}>
      {children}
      {gate && (
        <GateModal
          gate={gate}
          liked={!!likes[gate.p.slug]}
          knownEmail={email}
          onClose={() => setGate(null)}
          onLike={() => setLike(gate.p.slug, true)}
          onCopy={() => doCopy(gate.p, gate.selectEl)}
          onEmail={(m) => {
            write(EMAIL_KEY, m);
            setEmail(m);
          }}
          onDownload={(m) => doDownload(gate.p, m)}
        />
      )}
    </Ctx.Provider>
  );
}

/* ── the modal ── */
function GateModal({ gate, liked, knownEmail, onClose, onLike, onCopy, onEmail, onDownload }) {
  const { p, action } = gate;
  const [mail, setMail] = useState(knownEmail || "");
  const [err, setErr] = useState("");
  const [agree, setAgree] = useState(true);
  const inputRef = useRef(null);
  const step = !liked ? "like" : action === "download" && !knownEmail ? "email" : "done";

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && (e.stopPropagation(), onClose());
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [onClose]);
  useEffect(() => {
    if (step === "email") setTimeout(() => inputRef.current?.focus(), 80);
  }, [step]);

  // Like button: the same tap also performs the action (keeps clipboard/download "user gesture")
  const likeAndGo = async () => {
    onLike();
    if (action === "copy") {
      await onCopy();
      onClose();
    } else if (knownEmail) {
      onDownload(knownEmail);
      onClose();
    }
  };
  const submitEmail = (e) => {
    e.preventDefault();
    const m = mail.trim();
    if (!EMAIL_RE.test(m)) return setErr("Masukkan alamat email yang valid, mis. nama@gmail.com");
    if (!agree) return setErr("Centang persetujuan terlebih dahulu.");
    onEmail(m);
    onDownload(m);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-end justify-center sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-labelledby="gate-title">
      <button type="button" tabIndex={-1} aria-label="Tutup" onClick={onClose} className="prompt-fade absolute inset-0 h-full w-full cursor-default bg-[#020617]/80" />
      <div className="prompt-sheet relative w-full max-w-md overflow-hidden rounded-t-[1.75rem] border border-white/10 bg-[#070c1d] shadow-2xl sm:rounded-[1.75rem]">
        <div className="relative h-36 overflow-hidden bg-black sm:h-40">
          {p.image && <img src={p.image} alt="" className="h-full w-full object-cover object-[50%_25%] opacity-80" />}
          <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-[#070c1d] via-[#070c1d]/40 to-transparent" />
          <button type="button" onClick={onClose} aria-label="Tutup" className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-black/60 text-white hover:bg-black/80">
            ✕
          </button>
          <p className="absolute inset-x-5 bottom-3 line-clamp-2 font-display text-lg font-bold leading-snug text-white">{p.title}</p>
        </div>

        <div className="px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4 sm:px-6">
          {/* progress */}
          <ol className="mb-4 flex items-center gap-2 text-[11px] font-semibold">
            <li className={`flex items-center gap-1.5 ${liked ? "text-emerald-300" : "text-amber-200"}`}>
              <span className={`grid h-5 w-5 place-items-center rounded-full text-[10px] ${liked ? "bg-emerald-400 text-slate-950" : "bg-amber-300 text-slate-950"}`}>{liked ? "✓" : 1}</span>
              Suka foto
            </li>
            {action === "download" && (
              <>
                <span className="h-px flex-1 bg-white/10" />
                <li className={`flex items-center gap-1.5 ${knownEmail ? "text-emerald-300" : step === "email" ? "text-amber-200" : "text-slate-500"}`}>
                  <span className={`grid h-5 w-5 place-items-center rounded-full text-[10px] ${knownEmail ? "bg-emerald-400 text-slate-950" : step === "email" ? "bg-amber-300 text-slate-950" : "bg-white/10"}`}>{knownEmail ? "✓" : 2}</span>
                  Email
                </li>
              </>
            )}
            <span className="h-px flex-1 bg-white/10" />
            <li className="flex items-center gap-1.5 text-slate-500">
              <span className="grid h-5 w-5 place-items-center rounded-full bg-white/10 text-[10px]">{action === "download" ? 3 : 2}</span>
              {action === "download" ? "Unduh" : "Copy"}
            </li>
          </ol>

          {step === "like" && (
            <>
              <h2 id="gate-title" className="flex items-center gap-2 font-display text-xl font-bold text-white">
                <LockIcon className="text-amber-300" /> Suka foto ini dulu
              </h2>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-400">
                {action === "copy" ? "Ketuk ❤ untuk membuka prompt ini — prompt langsung tersalin." : "Ketuk ❤ untuk membuka unduhan gambar ini."}
              </p>
              <button type="button" onClick={likeAndGo} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 px-5 py-3.5 text-sm font-bold text-white shadow-[0_12px_30px_-12px_rgba(244,63,94,.8)] transition-transform active:scale-[0.98]">
                <HeartIcon filled width={18} height={18} />
                {action === "copy" ? "Suka & Copy Prompt" : knownEmail ? "Suka & Unduh Gambar" : "Suka foto ini"}
              </button>
            </>
          )}

          {step === "email" && (
            <form onSubmit={submitEmail} noValidate>
              <h2 id="gate-title" className="font-display text-xl font-bold text-white">Unduh gambar gratis</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-400">Masukkan email Anda sekali saja — unduhan berikutnya langsung tanpa isi ulang.</p>
              <label className="mt-4 block">
                <span className="sr-only">Email</span>
                <input
                  ref={inputRef}
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  value={mail}
                  onChange={(e) => (setMail(e.target.value), setErr(""))}
                  placeholder="nama@gmail.com"
                  className="w-full rounded-2xl border border-white/15 bg-[#040816] px-4 py-3.5 text-[16px] text-white placeholder:text-slate-500 outline-none focus:border-amber-200/60 focus:ring-4 focus:ring-amber-200/10"
                />
              </label>
              <label className="mt-3 flex items-start gap-2.5 text-xs leading-relaxed text-slate-400">
                <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-0.5 h-4 w-4 shrink-0 accent-amber-300" />
                Saya bersedia menerima info prompt & produk terbaru dari Hamdani Harfan. Bisa berhenti kapan saja.
              </label>
              {err && <p className="mt-2 text-xs text-rose-300">{err}</p>}
              <button type="submit" className="cta-gold mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-3.5 text-sm font-bold text-slate-950">
                <span className="relative z-10 inline-flex items-center gap-2">
                  <DownloadIcon /> Kirim & Unduh Gambar
                </span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

/** Total likes across all prompts (hero summary). Hidden until Supabase answers. */
export function TotalLikes({ className = "" }) {
  const g = usePromptGate();
  if (!g || g.totalLikes === null) return null;
  return (
    <li className={`inline-flex items-center gap-1.5 rounded-full border border-rose-400/30 bg-rose-500/10 px-3 py-1.5 text-rose-200 ${className}`}>
      <HeartIcon filled width={13} height={13} /> <b className="tabular-nums text-white">{formatLikes(g.totalLikes)}</b> suka
    </li>
  );
}

/** Like button used under each photo and in the detail panel. */
export function LikeButton({ prompt: p, compact = false, size = "", className = "" }) {
  const mini = size === "mini";
  const g = usePromptGate();
  const liked = g?.isLiked(p.slug);
  const [pop, setPop] = useState(0);
  if (!g) return null;
  const n = g.countOf(p.slug);
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        g.toggleLike(p);
        setPop((n) => n + 1);
      }}
      aria-pressed={liked}
      aria-label={liked ? `Batal suka: ${p.title}` : `Suka foto: ${p.title}`}
      className={`inline-flex items-center justify-center gap-1.5 rounded-full border font-semibold transition-colors ${
        liked ? "border-rose-400/50 bg-rose-500/15 text-rose-300" : "border-white/15 text-slate-200 hover:border-rose-300/60 hover:text-rose-200"
      } ${mini ? "h-7 px-2.5 text-[11px]" : compact ? "h-9 px-3 text-xs" : "h-full px-4 text-sm"} ${className}`}
    >
      <HeartIcon key={pop} filled={liked} width={mini ? 13 : compact ? 15 : 17} height={mini ? 13 : compact ? 15 : 17} className={pop ? "like-pop" : ""} />
      {n !== null ? (
        <span className="tabular-nums" aria-label={`${n} suka`}>{formatLikes(n)}</span>
      ) : mini ? (
        <span>{liked ? "Disukai" : "Suka"}</span>
      ) : compact ? (
        <span className="hidden @[230px]:inline">{liked ? "Disukai" : "Suka"}</span>
      ) : (
        <span className="hidden sm:inline">{liked ? "Disukai" : "Suka"}</span>
      )}
    </button>
  );
}
