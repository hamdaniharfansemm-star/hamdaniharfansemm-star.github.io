import { createContext, useContext, useId, useRef, useState } from "react";

/* Shared editor context: root content, update(path, value), image helpers */
export const EditorCtx = createContext(null);

export const getAt = (obj, path) => path.reduce((o, k) => (o == null ? undefined : o[k]), obj);
export const splitKey = (key) => (key ? key.split(".") : []);

const inputCls =
  "w-full rounded-xl border border-white/10 bg-slate-950/70 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-600 outline-none transition focus:border-cream/70 focus:ring-4 focus:ring-cream/10";

function Label({ htmlFor, children, help }) {
  return (
    <div className="mb-1.5">
      <label htmlFor={htmlFor} className="block text-[13px] font-semibold text-slate-200">
        {children}
      </label>
      {help && <p className="mt-0.5 text-xs text-slate-500">{help}</p>}
    </div>
  );
}

export function FieldList({ fields, base }) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-5">
      {fields.map((f) => (
        <Field key={f.key} field={f} path={[...base, ...splitKey(f.key)]} />
      ))}
    </div>
  );
}

function Field({ field, path }) {
  const { content, update } = useContext(EditorCtx);
  const id = useId();
  const value = getAt(content, path);
  const set = (v) => update(path, v);

  switch (field.type) {
    case "text":
      return (
        <div>
          <Label htmlFor={id} help={field.help}>{field.label}</Label>
          <input
            id={id}
            type={field.inputType || "text"}
            value={value ?? ""}
            placeholder={field.placeholder}
            onChange={(e) => set(e.target.value)}
            className={inputCls}
          />
        </div>
      );
    case "textarea":
      return (
        <div>
          <Label htmlFor={id} help={field.help}>{field.label}</Label>
          <textarea
            id={id}
            rows={field.rows || 3}
            value={value ?? ""}
            placeholder={field.placeholder}
            onChange={(e) => set(e.target.value)}
            className={`${inputCls} resize-y leading-relaxed`}
          />
        </div>
      );
    case "lines":
      return <LinesField id={id} field={field} value={value} set={set} />;
    case "select": {
      const options = typeof field.options === "function" ? field.options(content) : field.options;
      const known = options.some((o) => o.value === value);
      return (
        <div>
          <Label htmlFor={id} help={field.help}>{field.label}</Label>
          <select id={id} value={value ?? ""} onChange={(e) => set(e.target.value)} className={inputCls}>
            {!known && <option value={value ?? ""}>{value ? `${value} (tidak ada di daftar)` : "— Pilih —"}</option>}
            {options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      );
    }
    case "checkbox":
      return (
        <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/10 bg-slate-950/40 px-3.5 py-3 text-sm text-slate-200">
          <input type="checkbox" checked={!!value} onChange={(e) => set(e.target.checked)} className="h-4 w-4 accent-[#f4e8d1]" />
          {field.label}
        </label>
      );
    case "color":
      return (
        <div>
          <Label htmlFor={id} help={field.help}>{field.label}</Label>
          <div className="flex items-center gap-3">
            <input
              id={id}
              type="color"
              value={/^#[0-9a-f]{6}$/i.test(value || "") ? value : "#38bdf8"}
              onChange={(e) => set(e.target.value)}
              className="h-11 w-14 cursor-pointer rounded-xl border border-white/10 bg-slate-950"
            />
            <input value={value ?? ""} onChange={(e) => set(e.target.value)} className={`${inputCls} max-w-[10rem] font-mono`} />
          </div>
        </div>
      );
    case "image":
      return <ImageField id={id} field={field} value={value} set={set} />;
    case "group":
      return (
        <fieldset className="rounded-2xl border border-white/10 bg-slate-900/40 p-4 sm:p-5">
          {field.title && <legend className="px-2 font-display text-base font-bold text-cream">{field.title}</legend>}
          {field.help && <p className="mb-4 text-xs text-slate-500">{field.help}</p>}
          <FieldList fields={field.fields} base={path} />
        </fieldset>
      );
    case "list":
      return <ListField field={field} path={path} value={value} set={set} />;
    default:
      return null;
  }
}

/* One item per line — keeps arrays of strings easy to edit, also on phones. */
function LinesField({ id, field, value, set }) {
  const arr = Array.isArray(value) ? value : [];
  const [text, setText] = useState(arr.join("\n"));
  const last = useRef(arr.join("\n"));
  // Re-sync when the value changes from outside (e.g. discard / reload)
  if (arr.join("\n") !== last.current && arr.join("\n") !== text.split("\n").map((s) => s.trim()).filter(Boolean).join("\n")) {
    last.current = arr.join("\n");
    setText(last.current);
  }
  return (
    <div>
      <Label htmlFor={id} help={field.help}>{field.label}</Label>
      <textarea
        id={id}
        rows={Math.max(2, Math.min(8, text.split("\n").length + 1))}
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          const next = e.target.value.split("\n").map((s) => s.trim()).filter(Boolean);
          last.current = next.join("\n");
          set(next);
        }}
        className={`${inputCls} resize-y leading-relaxed`}
      />
    </div>
  );
}

/* ---------- Image ---------- */

const MAX_W = 1600;

/** Downscale big images so the website stays fast. Returns { blob, ext }. */
async function prepareImage(file) {
  const type = file.type;
  if (type === "image/svg+xml" || type === "image/gif") {
    return { blob: file, ext: type === "image/gif" ? "gif" : "svg" };
  }
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((res, rej) => {
      const i = new Image();
      i.onload = () => res(i);
      i.onerror = () => rej(new Error("Gambar tidak bisa dibaca. Coba format JPG atau PNG."));
      i.src = url;
    });
    const isPng = type === "image/png";
    const small = img.naturalWidth <= MAX_W && file.size <= 900 * 1024;
    if (small && (isPng || type === "image/jpeg")) return { blob: file, ext: isPng ? "png" : "jpg" };

    const scale = Math.min(1, MAX_W / img.naturalWidth);
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.naturalWidth * scale);
    canvas.height = Math.round(img.naturalHeight * scale);
    canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
    const toBlob = (t, q) => new Promise((r) => canvas.toBlob(r, t, q));
    if (isPng) {
      const png = await toBlob("image/png");
      if (png && png.size <= 1.2 * 1024 * 1024) return { blob: png, ext: "png" };
    }
    return { blob: await toBlob("image/jpeg", 0.85), ext: "jpg" };
  } finally {
    URL.revokeObjectURL(url);
  }
}

const blobToBase64 = (blob) =>
  new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(String(r.result).split(",")[1]);
    r.onerror = rej;
    r.readAsDataURL(blob);
  });

const slug = (s) =>
  s
    .toLowerCase()
    .replace(/\.[^.]+$/, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40) || "image";

function ImageField({ id, field, value, set }) {
  const { addUpload, previewFor } = useContext(EditorCtx);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const inputRef = useRef(null);
  const src = previewFor(value);

  const onFile = async (file) => {
    if (!file) return;
    setErr("");
    if (!file.type.startsWith("image/")) return setErr("File harus berupa gambar.");
    if (file.size > 15 * 1024 * 1024) return setErr("Gambar terlalu besar (maks 15 MB).");
    setBusy(true);
    try {
      const { blob, ext } = await prepareImage(file);
      const name = `${Date.now().toString(36)}-${slug(file.name)}.${ext}`;
      const sitePath = `/assets/uploads/${name}`;
      addUpload(sitePath, await blobToBase64(blob), URL.createObjectURL(blob));
      set(sitePath);
    } catch (e) {
      setErr(e.message || "Gagal memproses gambar.");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div>
      <Label htmlFor={id} help={field.help}>{field.label}</Label>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <div className="grid h-24 w-full shrink-0 place-items-center overflow-hidden rounded-xl border border-white/10 bg-[repeating-conic-gradient(#1e293b_0_25%,#0f172a_0_50%)] bg-[length:16px_16px] sm:w-40">
          {src ? <img src={src} alt="" className="h-full w-full object-contain" /> : <span className="text-xs text-slate-500">Belum ada gambar</span>}
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <input id={id} value={value ?? ""} onChange={(e) => set(e.target.value)} className={`${inputCls} font-mono text-xs`} placeholder="/assets/…" />
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => inputRef.current?.click()}
              className="rounded-xl bg-cream px-3.5 py-2 text-xs font-bold text-ink disabled:opacity-60"
            >
              {busy ? "Memproses…" : "Ganti / unggah gambar"}
            </button>
            {value && (
              <button type="button" onClick={() => set("")} className="rounded-xl border border-white/10 px-3 py-2 text-xs text-slate-300 hover:bg-white/5">
                Kosongkan
              </button>
            )}
            <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
          </div>
          {err && <p className="text-xs text-rose-300">{err}</p>}
        </div>
      </div>
    </div>
  );
}

/* ---------- List of objects ---------- */

function blankFrom(fields, preset = {}) {
  const o = {};
  for (const f of fields) {
    if (f.type === "lines") o[f.key] = [];
    else if (f.type === "checkbox") o[f.key] = false;
    else if (f.type === "list") o[f.key] = [];
    else if (f.type === "select") {
      const opts = Array.isArray(f.options) ? f.options : [];
      o[f.key] = opts[0]?.value ?? "";
    } else o[f.key] = "";
  }
  return { ...o, ...structuredClone(preset) };
}

function ListField({ field, path, value, set }) {
  const { content, previewFor } = useContext(EditorCtx);
  const items = Array.isArray(value) ? value : [];
  const [open, setOpen] = useState(() => new Set());

  const toggle = (i) =>
    setOpen((s) => {
      const n = new Set(s);
      n.has(i) ? n.delete(i) : n.add(i);
      return n;
    });
  const move = (i, d) => {
    const j = i + d;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    [next[i], next[j]] = [next[j], next[i]];
    set(next);
    setOpen((s) => {
      const n = new Set();
      s.forEach((k) => n.add(k === i ? j : k === j ? i : k));
      return n;
    });
  };
  const remove = (i) => {
    const label = field.itemTitle?.(items[i]) || `item ${i + 1}`;
    if (!window.confirm(`Hapus "${label}"?`)) return;
    set(items.filter((_, k) => k !== i));
    setOpen(new Set());
  };
  const add = () => {
    const item = blankFrom(field.fields, field.newItem);
    // Selects with dynamic options (e.g. category) get their first option
    for (const f of field.fields) {
      if (f.type === "select" && typeof f.options === "function" && !item[f.key]) item[f.key] = f.options(content)[0]?.value ?? "";
    }
    set([...items, item]);
    setOpen((s) => new Set(s).add(items.length));
  };

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="text-[13px] font-semibold text-slate-200">
          {field.label} <span className="font-mono text-xs text-slate-500">({items.length})</span>
        </p>
      </div>
      <ul className="grid grid-cols-[minmax(0,1fr)] gap-2">
        {items.map((it, i) => {
          const isOpen = open.has(i);
          const img = field.itemImage?.(it);
          return (
            <li key={i} className={`rounded-2xl border ${isOpen ? "border-cream/30 bg-slate-900/70" : "border-white/10 bg-slate-900/40"}`}>
              <div className="flex items-center gap-2 p-2 pl-3">
                <button type="button" onClick={() => toggle(i)} className="flex min-w-0 flex-1 items-center gap-3 py-1 text-left" aria-expanded={isOpen}>
                  {img && <img src={previewFor(img)} alt="" className="h-9 w-9 shrink-0 rounded-lg bg-white object-contain p-0.5" />}
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-white">{field.itemTitle?.(it) || `Item ${i + 1}`}</span>
                    {field.itemSubtitle?.(it) && <span className="block truncate text-xs text-slate-500">{field.itemSubtitle(it)}</span>}
                  </span>
                  <span className={`ml-auto shrink-0 text-slate-500 transition-transform ${isOpen ? "rotate-180" : ""}`} aria-hidden>
                    ▾
                  </span>
                </button>
                <div className="flex shrink-0 items-center">
                  <IconBtn label="Naik" onClick={() => move(i, -1)} disabled={i === 0}>↑</IconBtn>
                  <IconBtn label="Turun" onClick={() => move(i, 1)} disabled={i === items.length - 1}>↓</IconBtn>
                  <IconBtn label="Hapus" onClick={() => remove(i)} danger>✕</IconBtn>
                </div>
              </div>
              {isOpen && (
                <div className="border-t border-white/10 p-4 sm:p-5">
                  <FieldList fields={field.fields} base={[...path, i]} />
                </div>
              )}
            </li>
          );
        })}
      </ul>
      <button
        type="button"
        onClick={add}
        className="mt-2 w-full rounded-2xl border border-dashed border-white/20 px-4 py-3 text-sm font-semibold text-slate-300 transition-colors hover:border-cream/60 hover:text-cream"
      >
        + Tambah {field.label.toLowerCase()}
      </button>
    </div>
  );
}

function IconBtn({ children, label, onClick, disabled, danger }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className={`grid h-9 w-9 place-items-center rounded-lg text-sm transition-colors disabled:opacity-25 ${
        danger ? "text-rose-300 hover:bg-rose-500/15" : "text-slate-300 hover:bg-white/10"
      }`}
    >
      {children}
    </button>
  );
}
