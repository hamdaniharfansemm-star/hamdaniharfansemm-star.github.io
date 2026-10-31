import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { EditorCtx, FieldList } from "./Fields.jsx";
import { tabs } from "./schema.js";
import {
  CONTENT_PATH,
  REPO,
  UPLOAD_DIR,
  commitFiles,
  currentContentSha,
  deployRunFor,
  links,
  loadContent,
  utf8ToBase64,
  verifyToken,
} from "./github.js";

const TOKEN_KEY = "hh-admin-token";

const store = {
  get() {
    try {
      return sessionStorage.getItem(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY) || "";
    } catch {
      return "";
    }
  },
  set(token, remember) {
    try {
      (remember ? localStorage : sessionStorage).setItem(TOKEN_KEY, token);
    } catch {
      /* storage blocked — token stays in memory for this tab */
    }
  },
  clear() {
    try {
      sessionStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      /* ignore */
    }
  },
};

export default function AdminApp() {
  const [token, setToken] = useState(store.get);
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(!!token);

  // Re-verify a remembered token on load
  useEffect(() => {
    if (!token || user) return;
    let alive = true;
    verifyToken(token)
      .then((u) => alive && setUser(u))
      .catch(() => {
        if (!alive) return;
        store.clear();
        setToken("");
      })
      .finally(() => alive && setChecking(false));
    return () => {
      alive = false;
    };
  }, [token, user]);

  const logout = () => {
    store.clear();
    setToken("");
    setUser(null);
  };

  if (checking) return <Splash text="Memeriksa akses…" />;
  if (!token || !user)
    return (
      <Login
        onLogin={(t, u, remember) => {
          store.set(t, remember);
          setToken(t);
          setUser(u);
        }}
      />
    );
  return <Editor token={token} user={user} onLogout={logout} />;
}

/* ───────────────────────── Login ───────────────────────── */

function Login({ onLogin }) {
  const [value, setValue] = useState("");
  const [remember, setRemember] = useState(false);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    const t = value.trim();
    if (!t) return setErr("Tempel token GitHub Anda terlebih dahulu.");
    setBusy(true);
    setErr("");
    try {
      const u = await verifyToken(t);
      onLogin(t, u, remember);
    } catch (e2) {
      setErr(e2.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-svh items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 flex items-center gap-3">
          <span className="relative flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-400" />
          </span>
          <p className="font-display text-xl font-bold text-white">Hamdani Harfan · Admin</p>
        </div>

        <form onSubmit={submit} className="rounded-3xl border border-white/10 bg-slate-900/70 p-6 shadow-2xl sm:p-8">
          <h1 className="font-display text-2xl font-bold text-white">Masuk untuk mengedit website</h1>
          <p className="mt-2 text-sm text-slate-400">Gunakan token GitHub khusus untuk repo website. Token hanya disimpan di browser ini.</p>

          <label htmlFor="token" className="mt-6 block text-[13px] font-semibold text-slate-200">
            Token GitHub
          </label>
          <input
            id="token"
            type="password"
            autoComplete="off"
            spellCheck="false"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="github_pat_…"
            className="mt-1.5 w-full rounded-xl border border-white/10 bg-slate-950/70 px-3.5 py-3 font-mono text-sm text-white outline-none focus:border-cream/70 focus:ring-4 focus:ring-cream/10"
          />

          <label className="mt-4 flex cursor-pointer items-start gap-3 text-sm text-slate-300">
            <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="mt-0.5 h-4 w-4 accent-[#f4e8d1]" />
            <span>
              Ingat di perangkat ini
              <span className="block text-xs text-slate-500">Hanya untuk laptop/HP pribadi. Tanpa centang, Anda perlu login lagi setelah browser ditutup.</span>
            </span>
          </label>

          {err && <p className="mt-4 rounded-xl border border-rose-400/30 bg-rose-500/10 px-3.5 py-2.5 text-sm text-rose-200">{err}</p>}

          <button
            type="submit"
            disabled={busy}
            className="mt-6 w-full rounded-full bg-cream px-6 py-3.5 text-sm font-bold text-ink transition-transform active:scale-[0.98] disabled:opacity-60"
          >
            {busy ? "Memeriksa token…" : "Masuk"}
          </button>
        </form>

        <div className="mt-4 rounded-3xl border border-white/10 bg-slate-900/40 p-5">
          <button type="button" onClick={() => setShowHelp((v) => !v)} className="flex w-full items-center justify-between text-left text-sm font-semibold text-slate-200" aria-expanded={showHelp}>
            Belum punya token? Cara membuatnya
            <span className={`transition-transform ${showHelp ? "rotate-180" : ""}`}>▾</span>
          </button>
          {showHelp && (
            <ol className="mt-4 list-decimal space-y-2.5 pl-5 text-sm leading-relaxed text-slate-400 marker:text-cream">
              <li>
                Buka{" "}
                <a href={links.newToken} target="_blank" rel="noopener noreferrer" className="font-semibold text-cream underline underline-offset-2">
                  halaman pembuatan token GitHub
                </a>{" "}
                (login GitHub dulu).
              </li>
              <li>
                <b className="text-slate-200">Token name:</b> <code className="text-cream">Admin Website</code>. <b className="text-slate-200">Expiration:</b> pilih 90 hari atau 1 tahun.
              </li>
              <li>
                <b className="text-slate-200">Repository access:</b> pilih <i>Only select repositories</i> → <code className="text-cream">{REPO.repo}</code>.
              </li>
              <li>
                <b className="text-slate-200">Permissions → Repository permissions:</b> <i>Contents</i> = <b className="text-slate-200">Read and write</b>, dan <i>Actions</i> ={" "}
                <b className="text-slate-200">Read-only</b> (untuk melihat status update).
              </li>
              <li>
                Klik <b className="text-slate-200">Generate token</b>, salin token <code className="text-cream">github_pat_…</code>, lalu tempel di atas.
              </li>
            </ol>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-slate-600">
          <a href="../" className="hover:text-slate-400">← Kembali ke website</a>
        </p>
      </div>
    </div>
  );
}

/* ───────────────────────── Editor ───────────────────────── */

function setAt(obj, path, value) {
  const next = structuredClone(obj);
  let o = next;
  for (let i = 0; i < path.length - 1; i++) {
    if (o[path[i]] == null) o[path[i]] = typeof path[i + 1] === "number" ? [] : {};
    o = o[path[i]];
  }
  o[path[path.length - 1]] = value;
  return next;
}

const slugify = (s) =>
  (s || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "app";

/** Small clean-ups before saving (project ids, trimming). Returns { data, warnings }. */
function prepareForSave(data) {
  const d = structuredClone(data);
  const warnings = [];
  const seen = new Set();
  (d.projects || []).forEach((p) => {
    if (!p.id) p.id = slugify(p.title);
    let id = p.id;
    let n = 2;
    while (seen.has(id)) id = `${p.id}-${n++}`;
    p.id = id;
    seen.add(id);
    if (p.packageId === "") delete p.packageId;
    if (p.status === "live" && !p.packageId) warnings.push(`"${p.title}" berstatus Live tapi belum ada Package ID — tombol Google Play tidak akan muncul.`);
  });
  // Digital Store products
  const slugs = new Set();
  (d.store?.products || []).forEach((p) => {
    p.slug = slugify(p.slug || p.name);
    let slug = p.slug;
    let n = 2;
    while (slugs.has(slug)) slug = `${p.slug}-${n++}`;
    p.slug = slug;
    slugs.add(slug);
    if (!p.id) p.id = slug;
    p.checkoutUrl = String(p.checkoutUrl || "").trim();
    if (p.status !== "published") return;
    const name = p.name || p.slug;
    if (!p.checkoutUrl) warnings.push(`Produk "${name}" dipublikasi tanpa link Mayar — tombol beli akan tampil "Not available yet".`);
    else if (!/^https:\/\//i.test(p.checkoutUrl)) warnings.push(`Link checkout "${name}" harus diawali https:// — tombol beli tidak akan aktif.`);
    else if (!/mayar|myr\.id/i.test(p.checkoutUrl)) warnings.push(`Link checkout "${name}" sepertinya bukan link Mayar. Pastikan sudah benar.`);
    if (p.price === "" || p.price === undefined) warnings.push(`Produk "${name}" belum punya harga.`);
    if (!p.category) warnings.push(`Produk "${name}" belum punya kategori.`);
  });
  if (!d.profile?.name?.trim()) warnings.push("Nama di Profil kosong.");
  return { data: d, warnings };
}

function Editor({ token, user, onLogout }) {
  const [original, setOriginal] = useState(null); // { text, sha }
  const [content, setContent] = useState(null);
  const [loadErr, setLoadErr] = useState("");
  const [tab, setTab] = useState(() => {
    try {
      return sessionStorage.getItem("hh-admin-tab") || tabs[0].id;
    } catch {
      return tabs[0].id;
    }
  });
  const [uploads, setUploads] = useState({}); // sitePath → { base64, preview }
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState(null); // { kind, text }
  const [deploy, setDeploy] = useState(null); // { sha, status, conclusion, url } | { sha, unknown: true }
  const pollRef = useRef(0);

  const load = useCallback(async () => {
    setLoadErr("");
    try {
      const { data, text, sha } = await loadContent(token);
      setOriginal({ text, sha });
      setContent(data);
      setUploads({});
    } catch (e) {
      setLoadErr(e.status === 404 ? `File ${CONTENT_PATH} belum ada di repo. Upload versi website terbaru dulu.` : e.message);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    try {
      sessionStorage.setItem("hh-admin-tab", tab);
    } catch {
      /* ignore */
    }
  }, [tab]);

  const serialized = useMemo(() => (content ? JSON.stringify(content, null, 2) + "\n" : ""), [content]);
  const usedUploads = useMemo(
    () => Object.keys(uploads).filter((p) => !uploads[p].committed && serialized.includes(`"${p}"`)),
    [uploads, serialized]
  );
  const dirty = !!original && (serialized !== original.text || usedUploads.length > 0);

  // Warn before leaving with unsaved changes
  useEffect(() => {
    if (!dirty) return;
    const h = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [dirty]);

  const ctx = useMemo(
    () => ({
      content,
      update: (path, value) => setContent((c) => setAt(c, path, value)),
      addUpload: (sitePath, base64, preview) => setUploads((u) => ({ ...u, [sitePath]: { base64, preview } })),
      previewFor: (path) => {
        if (!path) return "";
        if (uploads[path]) return uploads[path].preview;
        if (/^https?:\/\//.test(path)) return path;
        return `..${path.startsWith("/") ? "" : "/"}${path}`;
      },
    }),
    [content, uploads]
  );

  // Poll the deploy run after a save
  useEffect(() => {
    if (!deploy || deploy.unknown || deploy.status === "completed") return;
    const id = ++pollRef.current;
    const t = setTimeout(async () => {
      const run = await deployRunFor(token, deploy.sha);
      if (id !== pollRef.current) return;
      if (!run) return setDeploy((d) => ({ ...d, unknown: true }));
      setDeploy((d) => ({ ...d, status: run.status, conclusion: run.conclusion, url: run.html_url }));
    }, 5000);
    return () => clearTimeout(t);
  }, [deploy, token]);

  const save = async () => {
    if (!dirty || saving) return;
    const { data, warnings } = prepareForSave(content);
    if (warnings.length && !window.confirm(`Perhatian:\n\n• ${warnings.join("\n• ")}\n\nTetap simpan?`)) return;

    setSaving(true);
    setNotice(null);
    try {
      const remoteSha = await currentContentSha(token);
      if (remoteSha !== original.sha) {
        const ok = window.confirm(
          "Konten di GitHub sudah berubah sejak halaman ini dibuka (mungkin diedit dari perangkat lain).\n\nOK = timpa dengan versi di layar ini\nBatal = jangan simpan"
        );
        if (!ok) {
          setSaving(false);
          return;
        }
      }
      const text = JSON.stringify(data, null, 2) + "\n";
      const files = [
        { path: CONTENT_PATH, content: text, encoding: "utf-8" },
        ...usedUploads.map((p) => ({ path: `${UPLOAD_DIR}/${p.split("/").pop()}`, content: uploads[p].base64, encoding: "base64" })),
      ];
      const n = usedUploads.length;
      const sha = await commitFiles(token, files, `Update website content via admin${n ? ` (+${n} image${n > 1 ? "s" : ""})` : ""}`);

      // Keep image previews working until the new deploy is live
      setContent(data);
      setOriginal({ text, sha: await currentContentSha(token).catch(() => original.sha) });
      setUploads((u) =>
        Object.fromEntries(
          Object.entries(u)
            .filter(([p, v]) => v.committed || usedUploads.includes(p))
            .map(([p, v]) => [p, { ...v, committed: true, base64: "" }])
        )
      );
      setDeploy({ sha, status: "queued" });
      setNotice({ kind: "ok", text: "Tersimpan. Website sedang diperbarui." });
    } catch (e) {
      setNotice({
        kind: "err",
        text:
          e.status === 401
            ? "Token kedaluwarsa. Keluar lalu masuk lagi dengan token baru."
            : e.status === 403 || e.status === 404
              ? "Token tidak punya izin menulis. Pastikan izin Contents = Read and write."
              : `Gagal menyimpan: ${e.message}`,
      });
    } finally {
      setSaving(false);
    }
  };

  const discard = () => {
    if (!window.confirm("Buang semua perubahan yang belum disimpan?")) return;
    setContent(JSON.parse(original.text));
    setUploads({});
    setNotice(null);
  };

  if (loadErr)
    return (
      <Splash text={loadErr}>
        <div className="mt-6 flex justify-center gap-3">
          <button onClick={load} className="rounded-full bg-cream px-5 py-2.5 text-sm font-bold text-ink">Coba lagi</button>
          <button onClick={onLogout} className="rounded-full border border-white/15 px-5 py-2.5 text-sm text-slate-200">Keluar</button>
        </div>
      </Splash>
    );
  if (!content) return <Splash text="Memuat konten website…" />;

  const active = tabs.find((t) => t.id === tab) || tabs[0];

  return (
    <EditorCtx.Provider value={ctx}>
      <div className="min-h-svh pb-40">
        {/* Top bar */}
        <header className="sticky top-0 z-30 border-b border-white/10 bg-night/90 backdrop-blur-xl">
          <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3 sm:px-6">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-400" />
            <p className="min-w-0 flex-1 truncate font-display text-lg font-bold text-white">
              Admin <span className="hidden font-sans text-sm font-normal text-slate-500 sm:inline">· {user.login}</span>
            </p>
            <a href={links.site} target="_blank" rel="noopener noreferrer" className="rounded-full border border-white/15 px-3.5 py-1.5 text-xs font-semibold text-slate-200 hover:bg-white/5">
              Lihat website ↗
            </a>
            <button onClick={onLogout} className="rounded-full px-3 py-1.5 text-xs text-slate-400 hover:bg-white/5 hover:text-white">
              Keluar
            </button>
          </div>
          <nav aria-label="Bagian" className="no-scrollbar mx-auto flex max-w-5xl gap-1 overflow-x-auto px-4 pb-3 sm:px-6">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                aria-current={t.id === active.id ? "page" : undefined}
                className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  t.id === active.id ? "bg-cream text-ink" : "text-slate-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                {t.label}
              </button>
            ))}
          </nav>
        </header>

        <main className="mx-auto max-w-5xl px-4 pt-8 sm:px-6">
          <h1 className="mb-6 font-display text-3xl font-bold text-white">{active.label}</h1>
          <FieldList key={active.id} fields={active.fields} base={[]} />

          <p className="mt-12 text-center text-xs text-slate-600">
            Setiap simpan tercatat di{" "}
            <a href={links.history} target="_blank" rel="noopener noreferrer" className="underline hover:text-slate-400">
              riwayat GitHub
            </a>{" "}
            — versi lama selalu bisa dikembalikan.
          </p>
        </main>

        {/* Save bar */}
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-slate-950/95 backdrop-blur-xl">
          <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:px-6">
            <div className="min-w-0 flex-1 text-sm">
              <StatusLine dirty={dirty} uploads={usedUploads.length} notice={notice} deploy={deploy} />
            </div>
            <div className="flex gap-2">
              {dirty && (
                <button onClick={discard} disabled={saving} className="flex-1 rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-slate-200 hover:bg-white/5 sm:flex-none">
                  Batalkan
                </button>
              )}
              <button
                onClick={save}
                disabled={!dirty || saving}
                className="flex-1 rounded-full bg-cream px-7 py-3 text-sm font-bold text-ink transition-opacity disabled:opacity-40 sm:flex-none"
              >
                {saving ? "Menyimpan…" : "Simpan perubahan"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </EditorCtx.Provider>
  );
}

function StatusLine({ dirty, uploads, notice, deploy }) {
  if (notice?.kind === "err") return <p className="text-rose-300">{notice.text}</p>;
  if (dirty)
    return (
      <p className="text-amber-200">
        ● Ada perubahan yang belum disimpan{uploads ? ` (+${uploads} gambar baru)` : ""}
      </p>
    );
  if (deploy) {
    if (deploy.unknown)
      return (
        <p className="text-emerald-300">
          ✓ Tersimpan. Website ter-update dalam ±2 menit —{" "}
          <a href={links.actions} target="_blank" rel="noopener noreferrer" className="underline">cek progres</a>.
        </p>
      );
    if (deploy.status !== "completed")
      return (
        <p className="flex items-center gap-2 text-sky-300">
          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-sky-300 border-t-transparent" />
          Tersimpan. Website sedang diperbarui… (±1–2 menit)
        </p>
      );
    if (deploy.conclusion === "success")
      return (
        <p className="text-emerald-300">
          ✓ Website sudah ter-update.{" "}
          <a href={links.site} target="_blank" rel="noopener noreferrer" className="underline">Buka</a> lalu tekan Ctrl+F5.
        </p>
      );
    return (
      <p className="text-rose-300">
        Update website gagal.{" "}
        <a href={deploy.url || links.actions} target="_blank" rel="noopener noreferrer" className="underline">Lihat detail</a>.
      </p>
    );
  }
  return <p className="text-slate-500">Semua perubahan sudah tersimpan.</p>;
}

function Splash({ text, children }) {
  return (
    <div className="flex min-h-svh items-center justify-center px-6 text-center">
      <div className="max-w-sm">
        <p className="text-sm text-slate-300">{text}</p>
        {children}
      </div>
    </div>
  );
}
