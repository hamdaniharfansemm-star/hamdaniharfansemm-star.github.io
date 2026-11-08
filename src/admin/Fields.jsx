import { createContext, useContext, useId, useRef, useState } from "react";

const GAP = 8; // px between list rows (gap-2)

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
const KEEP_ORIGINAL_UP_TO = 4 * 1024 * 1024; // files up to 4 MB are uploaded untouched (no canvas)

/** True when a canvas result is unusable (blank or one flat colour) — e.g. when the browser
 *  or a privacy/VPN extension blocks canvas reading. Real photos are never a single colour. */
function looksBlank(canvas) {
  try {
    const probe = document.createElement("canvas");
    probe.width = probe.height = 24;
    const c = probe.getContext("2d");
    c.drawImage(canvas, 0, 0, 24, 24);
    const d = c.getImageData(0, 0, 24, 24).data;
    let first = null;

    for (let i = 0; i < d.length; i += 4) {

      const px = `${d[i]},${d[i + 1]},${d[i + 2]},${d[i + 3]}`;
      if (first === null) first = px;
      else if (px !== first) return false; // real picture
    }
    return true; // every pixel identical (or all transparent)
  } catch {
    return true; // reading blocked
  }
}

/** Make big images lighter for the website. Never returns an empty image:
 *  if resizing fails or is blocked, the original file is used. Returns { blob, ext, note }. */
async function prepareImage(file) {
  const type = file.type;
  const extOf = (t) => ({ "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp", "image/gif": "gif", "image/svg+xml": "svg" })[t] || "jpg";
  if (type === "image/svg+xml" || type === "image/gif") return { blob: file, ext: extOf(type) };
  const original = { blob: file, ext: extOf(type) };
  if (file.size <= KEEP_ORIGINAL_UP_TO && ["image/png", "image/jpeg", "image/webp"].includes(type)) return original;

  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((res, rej) => {
      const i = new Image();
      i.onload = () => res(i);
      i.onerror = () => rej(new Error("Gambar tidak bisa dibaca. Coba format JPG atau PNG."));
      i.src = url;
    });
    if (img.decode) await img.decode().catch(() => {});
    const scale = Math.min(1, MAX_W / img.naturalWidth);
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
    canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
    if (looksBlank(canvas)) return { ...original, note: "Browser memblokir pengecilan gambar — file asli dipakai." };
    const toBlob = (t, q) => new Promise((r) => canvas.toBlob(r, t, q));
    let out = null;
    if (type === "image/png") {
      const png = await toBlob("image/png");
      if (png && png.size <= 1.5 * 1024 * 1024) out = { blob: png, ext: "png" };
    }
    if (!out) {
      const jpg = await toBlob("image/jpeg", 0.86);
      if (jpg) out = { blob: jpg, ext: "jpg" };
    }
    // a suspiciously tiny result means the canvas was empty → keep the original
    if (!out || out.blob.size < 15 * 1024) return { ...original, note: "File asli dipakai (pengecilan tidak berhasil)." };
    return out;
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
      const { blob, ext, note } = await prepareImage(file);
      if (note) setErr(`${note}${blob.size > 4 * 1024 * 1024 ? ` (${(blob.size / 1048576).toFixed(1)} MB — sebaiknya dikompres agar website cepat)` : ""}`);
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

  const [over, setOver] = useState(false);
  const dropProps = {
    onDragOver: (e) => {
      if ([...(e.dataTransfer?.types || [])].includes("Files")) {
        e.preventDefault();
        setOver(true);
      }
    },
    onDragLeave: () => setOver(false),
    onDrop: (e) => {
      e.preventDefault();
      setOver(false);
      onFile(e.dataTransfer?.files?.[0]);
    },
    onPaste: (e) => {
      const f = [...(e.clipboardData?.files || [])].find((x) => x.type.startsWith("image/"));
      if (f) (e.preventDefault(), onFile(f));
    },
  };

  return (
    <div {...dropProps}>
      <Label htmlFor={id} help={field.help}>{field.label}</Label>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className={`relative grid h-24 w-full shrink-0 place-items-center overflow-hidden rounded-xl border bg-[repeating-conic-gradient(#1e293b_0_25%,#0f172a_0_50%)] bg-[length:16px_16px] transition-colors sm:w-40 ${over ? "border-2 border-dashed border-cream" : "border-white/10"}`}
          aria-label="Pilih atau seret gambar ke sini"
        >
          {src ? <img src={src} alt="" className="h-full w-full object-contain" /> : <span className="px-2 text-center text-xs text-slate-500">Seret gambar ke sini atau klik</span>}
          {over && <span className="absolute inset-0 grid place-items-center bg-slate-950/80 text-xs font-bold text-cream">Lepaskan untuk unggah</span>}
        </button>
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
          <p className="text-[11px] text-slate-500">Bisa juga: seret file gambar ke kotak ini, atau tempel (Ctrl+V).</p>
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

/**
 * Visual "arrange" mode: every item as a numbered picture tile. Drag a tile (mouse or finger)
 * onto another position — the first tile is what visitors see first.
 */
function ArrangeGrid({ items, imageOf, titleOf, dimOf, previewFor, onMove: onMoveItem }) {
  const [drag, setDrag] = useState(null); // { from, over }
  const dragRef = useRef(null);
  const order = items.map((_, k) => k);
  if (drag && drag.over !== drag.from) {
    order.splice(drag.from, 1);
    order.splice(drag.over, 0, drag.from);
  }
  const tileAt = (x, y) => {
    const el = document.elementFromPoint(x, y)?.closest?.("[data-arrange-pos]");
    return el ? Number(el.dataset.arrangePos) : null;
  };
  // Listeners live on window: reordering moves DOM nodes, which would drop pointer capture.
  const down = (e, i) => {
    if (e.button !== undefined && e.button !== 0) return;
    e.preventDefault();
    const st = { x: e.clientX, y: e.clientY, from: i, over: i, moved: false };
    dragRef.current = st;
    const onMove = (ev) => {
      if (!st.moved && Math.hypot(ev.clientX - st.x, ev.clientY - st.y) < 6) return;
      st.moved = true;
      ev.preventDefault?.();
      if (ev.clientY < 90) window.scrollBy(0, -16);
      else if (ev.clientY > window.innerHeight - 110) window.scrollBy(0, 16);
      const pos = tileAt(ev.clientX, ev.clientY);
      if (pos !== null) st.over = pos;
      setDrag({ from: st.from, over: st.over });
    };
    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      dragRef.current = null;
      setDrag(null);
      if (st.moved && st.from !== st.over) onMoveItem(st.from, st.over);
    };
    window.addEventListener("pointermove", onMove, { passive: false });
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
  };
  return (
    <div className="mb-3 rounded-2xl border border-cream/25 bg-slate-950/60 p-3">
      <p className="mb-3 text-xs text-slate-400">
        Seret gambar ke posisi yang diinginkan (mouse atau jari). <b className="text-cream">No. 1 tampil paling awal</b> di website. Klik <b>Simpan perubahan</b> setelah selesai.
      </p>
      <ol className={`grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6 ${drag ? "select-none" : ""}`}>
        {order.map((k, pos) => {
          const it = items[k];
          const img = imageOf(it);
          const active = drag?.from === k;
          return (
            <li key={k} data-arrange-pos={pos}>
              <button
                type="button"
                onPointerDown={(e) => down(e, k)}
                onKeyDown={(e) => {
                  if (e.key === "ArrowLeft" || e.key === "ArrowUp") (e.preventDefault(), onMoveItem(k, Math.max(0, k - 1)));
                  if (e.key === "ArrowRight" || e.key === "ArrowDown") (e.preventDefault(), onMoveItem(k, Math.min(items.length - 1, k + 1)));
                }}
                aria-label={`${pos + 1}. ${titleOf(it, k)} — seret untuk memindahkan`}
                className={`group relative block w-full touch-none overflow-hidden rounded-xl border text-left transition-[transform,border-color,opacity] duration-150 ${
                  active ? "z-10 scale-[1.04] cursor-grabbing border-cream shadow-2xl shadow-black/70" : "cursor-grab border-white/10 hover:border-cream/50"
                } ${dimOf(it) ? "opacity-60" : ""}`}
              >
                <span className="block aspect-[4/5] bg-slate-900">
                  {img ? <img src={previewFor(img)} alt="" draggable="false" className="pointer-events-none h-full w-full object-cover object-[50%_20%]" /> : <span className="grid h-full place-items-center text-xs text-slate-500">Tanpa gambar</span>}
                </span>
                <span className={`absolute left-1.5 top-1.5 grid h-6 min-w-6 place-items-center rounded-full px-1.5 text-[11px] font-bold ${pos === 0 ? "bg-cream text-ink" : "bg-black/70 text-white"}`}>{pos + 1}</span>
                {dimOf(it) && <span className="absolute right-1.5 top-1.5 rounded-full bg-amber-400 px-1.5 py-0.5 text-[9px] font-bold uppercase text-slate-950">Draft</span>}
                <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent px-2 pb-1.5 pt-5 text-[10.5px] font-semibold leading-tight text-white line-clamp-2">{titleOf(it, k)}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function ListField({ field, path, value, set }) {
  const { content, previewFor } = useContext(EditorCtx);
  const items = Array.isArray(value) ? value : [];
  const [open, setOpen] = useState(() => new Set());
  const [arrange, setArrange] = useState(false);
  const canArrange = !!field.itemImage && items.length > 1;

  const toggle = (i) =>
    setOpen((s) => {
      const n = new Set(s);
      n.has(i) ? n.delete(i) : n.add(i);
      return n;
    });
  // Move item `from` to position `to` (keeps open/closed panels attached to their items)
  const moveTo = (from, to) => {
    if (from === to || to < 0 || to >= items.length) return;
    const order = items.map((_, k) => k);
    const [x] = order.splice(from, 1);
    order.splice(to, 0, x);
    set(order.map((k) => items[k]));
    setOpen((s) => new Set(order.flatMap((k, idx) => (s.has(k) ? [idx] : []))));
  };
  const move = (i, d) => moveTo(i, i + d);

  // ── Drag & drop with mouse or finger (grab the ⠿ handle) ──
  const listRef = useRef(null);
  const [drag, setDrag] = useState(null); // { from, over, dy, h }
  const dragData = useRef(null);
  const onGrab = (e, i) => {
    if (e.button !== undefined && e.button !== 0) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture?.(e.pointerId);
    const rows = [...listRef.current.children].map((el) => {
      const r = el.getBoundingClientRect();
      return { top: r.top + window.scrollY, h: r.height };
    });
    dragData.current = { from: i, startY: e.pageY, rows, scroll: 0 };
    setDrag({ from: i, over: i, dy: 0, h: rows[i].h });
  };
  const onDragMove = (e) => {
    const d = dragData.current;
    if (!d) return;
    // auto-scroll near the top/bottom of the screen
    if (e.clientY < 90) window.scrollBy(0, -14);
    else if (e.clientY > window.innerHeight - 110) window.scrollBy(0, 14);
    const dy = e.pageY - d.startY;
    const mid = d.rows[d.from].top + d.rows[d.from].h / 2 + dy;
    const over = d.rows.filter((r, k) => k !== d.from && r.top + r.h / 2 < mid).length;
    setDrag({ from: d.from, over, dy, h: d.rows[d.from].h });
  };
  const onDrop = () => {
    const cur = drag;
    dragData.current = null;
    setDrag(null);
    if (cur) moveTo(cur.from, cur.over);
  };
  const shiftFor = (k) => {
    if (!drag || k === drag.from) return 0;
    const h = drag.h + GAP;
    if (drag.from < drag.over && k > drag.from && k <= drag.over) return -h;
    if (drag.from > drag.over && k >= drag.over && k < drag.from) return h;
    return 0;
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
    if (field.addToTop) {
      set([item, ...items]);
      setOpen((s) => new Set([0, ...[...s].map((k) => k + 1)]));
    } else {
      set([...items, item]);
      setOpen((s) => new Set(s).add(items.length));
    }
  };

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="text-[13px] font-semibold text-slate-200">
          {field.label} <span className="font-mono text-xs text-slate-500">({items.length})</span>
        </p>
      </div>
      {items.length > 1 && (
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-slate-500">Tarik ⠿ untuk mengubah urutan (⤒ = pindah ke paling atas){field.orderHelp ? ` — ${field.orderHelp}` : ""}.</p>
          <div className="flex flex-wrap gap-2">
          {canArrange && (
            <button
              type="button"
              onClick={() => (setArrange((v) => !v), setOpen(new Set()))}
              aria-pressed={arrange}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${arrange ? "border-cream bg-cream text-ink" : "border-white/15 text-slate-200 hover:border-cream/60 hover:text-cream"}`}
            >
              {arrange ? "✓ Selesai atur urutan" : "▦ Atur urutan gambar"}
            </button>
          )}
          {field.sortByDate && (
            <button
              type="button"
              onClick={() => {
                const order = items.map((_, k) => k).sort((a, b) => String(items[b][field.sortByDate] || "").localeCompare(String(items[a][field.sortByDate] || "")) || a - b);
                set(order.map((k) => items[k]));
                setOpen(new Set());
              }}
              className="rounded-full border border-white/15 px-3 py-1.5 text-xs font-semibold text-slate-200 transition-colors hover:border-cream/60 hover:text-cream"
            >
              ↓ Urutkan: terbaru di atas
            </button>
          )}
          </div>
        </div>
      )}
      {arrange && canArrange && (
        <ArrangeGrid
          items={items}
          imageOf={field.itemImage}
          titleOf={(it, i) => field.itemTitle?.(it) || `Item ${i + 1}`}
          dimOf={(it) => it.status && it.status !== "published"}
          previewFor={previewFor}
          onMove={moveTo}
        />
      )}
      {field.addToTop && (
        <button
          type="button"
          onClick={add}
          className="mb-2 w-full rounded-2xl border border-dashed border-white/20 px-4 py-3 text-sm font-semibold text-slate-300 transition-colors hover:border-cream/60 hover:text-cream"
        >
          + Tambah {field.label.toLowerCase()} (di paling atas)
        </button>
      )}
      <ul ref={listRef} hidden={arrange && canArrange} className={`grid grid-cols-[minmax(0,1fr)] gap-2 ${drag ? "select-none" : ""}`}>
        {items.map((it, i) => {
          const isOpen = open.has(i);
          const img = field.itemImage?.(it);
          const dragging = drag?.from === i;
          return (
            <li
              key={i}
              style={{
                transform: drag ? `translate3d(0, ${dragging ? drag.dy : shiftFor(i)}px, 0)` : undefined,
                transition: drag && !dragging ? "transform .2s cubic-bezier(.22,1,.36,1)" : undefined,
                zIndex: dragging ? 30 : undefined,
                position: "relative",
              }}
              className={`rounded-2xl border ${dragging ? "border-cream/60 bg-slate-800 shadow-2xl shadow-black/60" : isOpen ? "border-cream/30 bg-slate-900/70" : "border-white/10 bg-slate-900/40"}`}
            >
              <div className="flex items-center gap-2 p-2 pl-1.5">
                <button
                  type="button"
                  aria-label={`Tarik untuk memindahkan ${field.itemTitle?.(it) || `item ${i + 1}`} (atau tekan panah atas/bawah)`}
                  title="Tarik untuk memindahkan"
                  onPointerDown={(e) => onGrab(e, i)}
                  onPointerMove={onDragMove}
                  onPointerUp={onDrop}
                  onPointerCancel={onDrop}
                  onKeyDown={(e) => {
                    if (e.key === "ArrowUp") (e.preventDefault(), move(i, -1));
                    if (e.key === "ArrowDown") (e.preventDefault(), move(i, 1));
                  }}
                  className={`grid h-9 w-7 shrink-0 touch-none place-items-center rounded-lg text-lg leading-none text-slate-500 hover:bg-white/5 hover:text-cream ${dragging ? "cursor-grabbing text-cream" : "cursor-grab"}`}
                >
                  ⠿
                </button>
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
                  <IconBtn label="Pindah ke paling atas" onClick={() => moveTo(i, 0)} disabled={i === 0}>⤒</IconBtn>
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
        hidden={!!field.addToTop}
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
