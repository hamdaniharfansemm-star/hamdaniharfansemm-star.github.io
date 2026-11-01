# Hamdani Harfan — Portfolio

Dual-persona portfolio (Designer ✕ Developer) built with **React 19 + Vite + Tailwind CSS v4 + Framer Motion**.

## Run it (extract → run)

Requires **Node.js 20.19+ or 22+** (`node -v` to check).

```bash
cd hamdani-portfolio
npm install
npm run dev        # opens http://localhost:5173
```

Production build:

```bash
npm run build      # outputs to /dist
npm run preview    # test the production build locally
```

Deploy: upload the `dist` folder to Vercel, Netlify, Cloudflare Pages or GitHub Pages
(on Vercel/Netlify just import the repo — build command `npm run build`, output `dist`).

### Bahasa Indonesia (singkat)
1. Ekstrak zip (boleh di drive D:), buka folder di terminal/VS Code.
2. Jalankan `npm install` lalu `npm run dev`.
3. Ganti teks di `src/data/portfolio.js`, ganti gambar di `public/assets/` (nama file sama).

## Recreating from scratch (for reference)

```bash
npm create vite@latest hamdani-portfolio -- --template react
cd hamdani-portfolio
npm install
npm install framer-motion
npm install -D tailwindcss @tailwindcss/vite
```
Then add `tailwindcss()` to `vite.config.js` plugins and `@import "tailwindcss";` at the top of `src/index.css`.

## Structure

```
public/assets/
  profile-photo.jpg          ← About + Hero portrait
  banner-bg.png              ← Professional banner background
  projects/*.png             ← 7 project mockups (1024×500)
  logos/*.png                ← small app icons on project cards
src/
  components/
    Navbar.jsx               sticky nav, mobile menu, active-section pill, availability badge
    Hero.jsx                 cursor-tracking clip-path split hero + touch toggle
    ProfessionalBanner.jsx   availability / collaboration banner
    About.jsx                bio, philosophy, photo container
    Works.jsx                filterable grid + project detail modal
    Skills.jsx               two-column interactive expertise matrix
    Experience.jsx           scroll-linked vertical timeline
    Contact.jsx              validated form (opens email / WhatsApp) + social cards
    Footer.jsx
    SectionHeading.jsx, Icons.jsx
  data/portfolio.js          ← ALL copy, links, projects, skills, experience
  hooks/                     useFinePointer, useActiveSection
  lib/motion.js              shared spring (stiffness 120, damping 20)
  App.jsx, main.jsx, index.css
```

## Editing content

- **Text / links / projects:** `src/data/portfolio.js` only.
- **Images:** replace files in `public/assets/` keeping the same names.
  `projects/dagangku.png` is a generated placeholder — swap in your real Dagangku graphic.
- **Contact form:** no backend needed — "Send message" opens the visitor's email app pre-filled to
  hamdaniharfansemm@gmail.com; "WhatsApp" opens a pre-filled chat. To receive messages silently
  instead, wire `onSubmit` in `Contact.jsx` to Formspree/EmailJS.

## How the hero stays at 60fps

Pointer coordinates are stored in plain variables (no React state), eased inside a
`requestAnimationFrame` loop that stops itself when idle, and written straight to CSS custom
properties (`--mx`, `--my`, `--r`) consumed by `clip-path: circle(var(--r) at var(--mx) var(--my))`.
Zero React re-renders on mouse move. Touch devices (no fine pointer) get a
"🎨 Designer View / 💻 Developer View" pill with a spring-animated reveal instead.

---

## Digital Store (`/products/`)

Katalog produk digital di **hamdaniharfan.com/products/**. Website hanya etalase; pembayaran terjadi di **Mayar**.

### Menambah produk (cara mudah: admin)
1. Buka `hamdaniharfan.com/admin/` → tab **Digital Store** → **+ Tambah produk**.
2. Isi nama, kategori, deskripsi, harga, mata uang, gambar sampul (rasio 4:3, mis. 1600×1200).
3. Tempel **Link checkout Mayar** (dashboard Mayar → produk → Bagikan / salin link).
4. Ubah **Status** ke **Dipublikasi**, lalu **Simpan perubahan**. Halaman produk otomatis tersedia di
   `hamdaniharfan.com/products/<slug>/` dalam 1–2 menit (termasuk SEO & sitemap).

### Status produk
| Status | Tampil di toko publik | Bisa dibeli |
| --- | --- | --- |
| `published` | Ya | Ya, jika `checkoutUrl` berisi link https Mayar |
| `draft` | Tidak (hanya `?preview=1`) | Tidak |
| `demo` | Tidak (hanya `?preview=1`) | Tidak — label "Demo — not for sale" |

Pratinjau semua produk (termasuk demo/draft): `hamdaniharfan.com/products/?preview=1`.
5 produk contoh bawaan berstatus **demo** — hapus atau ganti dengan produk asli.

### Field data (`src/data/content.json` → `store.products[]`)
`id, slug, name, status, category (ebooks|blueprints|apps|courses|templates), shortDescription, description,
price, currency (IDR|USD), coverImage, gallery[{image}], features[], problems[], audience[], curriculum[],
specifications[{label,value}], faq[{q,a}], checkoutUrl, featured, releaseDate (YYYY-MM-DD)`

- Label **New** otomatis 45 hari sejak `releaseDate`. Label **Featured** hanya jika `featured: true`.
- Bagian "Featured" & "Recently released" baru muncul jika produk lebih dari 3.
- Tanpa `coverImage` → sampul placeholder rapi per kategori (bukan gambar palsu).

### Keamanan
- Tidak ada API key / secret Mayar di website. Tombol hanya membuka link checkout Mayar di tab baru.
- Website tidak pernah menandai pembayaran "berhasil"; konfirmasi transaksi ada di Mayar.

### File terkait
- `products/index.html` — halaman toko · `src/store/StoreApp.jsx` — katalog & detail
- `src/store/ProductParts.jsx` — kartu, sampul, tombol beli · `src/store/catalog.js` — kategori, harga, aturan
- `vite.config.js` — membuat halaman statis per produk + `sitemap.xml` saat build
- `public/404.html` — halaman tidak ditemukan

### Keranjang & efek (Digital Store v2)
- **Keranjang** (ikon tas di navbar): pengunjung bisa mengumpulkan beberapa produk. Tersimpan di browser pengunjung.
- **Sejalan dengan Mayar:** setiap produk dibayar lewat link checkout Mayar-nya sendiri (tombol *Pay for this item*).
  Satu item → tombol besar *Checkout securely on Mayar*. Pembayaran gabungan butuh API key Mayar di server,
  jadi sengaja tidak dibuat di website statis. Alternatif resmi: buat produk **Bundling** di Mayar lalu jual sebagai satu produk.
- Hanya produk **Dipublikasi + punya link Mayar** yang bisa masuk keranjang.
- **Badge berdasarkan data** (tidak ada klaim palsu): *Bestseller* (centang di admin), *Sale −x%* (isi Harga coret),
  *New* (45 hari sejak tanggal rilis), *Featured*.
- Efek: latar mesh gradient bergerak, kartu kaca (glassmorphism), 3D tilt (hanya mouse), ripple pada tombol,
  shimmer badge, animasi masuk bertahap saat ganti kategori. Semua mati otomatis bila pengunjung memilih "reduce motion".
- File baru: `src/store/cart.jsx`, `src/store/CartDrawer.jsx`, `src/store/effects.js`; gaya di `src/index.css` (bagian "Digital Store — premium motion system").

### Digital Store v4 (tampilan imajinatif)
- Hero: orbit kategori berputar di sekitar inti bercahaya, bintang berkedip, pita aurora, cahaya mengikuti kursor (desktop).
- Pencarian langsung di hero + tombol kategori cepat. Bar filter kategori menempel saat scroll.
- Kartu: border gradien berputar saat hover, 3D tilt, tombol **Beli/Buy** emas dengan kilau.
- Teks untuk pembeli tidak menyebut nama penyedia pembayaran ("Beli", "Pembayaran aman"); tombol tetap membuka link checkout Mayar.

### Digital Store v5 (katalog skala besar + funnel Instagram/ManyChat)
- **6 kategori:** Modules & E-books · Blueprints · Mobile Apps · AI Tools · Source Code & Templates · Online Courses.
  Pilih kategori di admin; mockup 3D otomatis menyesuaikan (buku, tablet, ponsel, laptop).
- **Filter tab tanpa reload** (sticky saat scroll, angka jumlah produk per kategori) + **Sort**: Recommended, Terbaru, Harga termurah/termahal.
- **Pencarian instan** di atas katalog — tekan `/` untuk fokus. Cari nama, deskripsi, fitur, kategori.
- **Kartu produk:** kaca navy, glow border saat hover, badge kategori di pojok kanan atas, mockup 3D,
  harga emas + harga coret + persentase hemat, tombol **Detail** dan **Beli Sekarang** (ikon tas → link Mayar),
  tombol kecil tambah ke keranjang di pojok mockup.
- **Grid adaptif:** 1 produk → kartu tunggal di tengah, 2 produk → 2 kolom, 3+ → 3 kolom (mobile 1 kolom).
- **Sapaan funnel:** pengunjung dengan `utm_source` / `ref` / `from` = instagram, manychat, tiktok, whatsapp mendapat bar sambutan.

#### Link siap pakai untuk ManyChat / bio Instagram
| Tujuan | Link |
| --- | --- |
| Langsung ke 1 produk | `https://hamdaniharfan.com/products/<slug>/?utm_source=manychat` |
| Hasil pencarian | `https://hamdaniharfan.com/products/?q=prompt&utm_source=manychat` |
| Satu kategori | `https://hamdaniharfan.com/products/?category=ai-tools&utm_source=instagram` |
| Urut termurah | `https://hamdaniharfan.com/products/?sort=price-asc` |

ID kategori: `ebooks`, `blueprints`, `apps`, `ai-tools`, `templates`, `courses`.

### Prompt AI Library (`/products/prompts/`) — untuk kampanye Instagram / ManyChat
Daftar prompt gratis: gambar contoh hasil, kotak teks prompt, tombol **Copy Prompt**, dan tombol bagikan.

**Menambah prompt (admin):** `hamdaniharfan.com/admin/` → tab **Prompt AI** → **+ Tambah**:
judul, gambar contoh (PNG/JPG, ideal 1080×1080 atau 1080×1350), isi prompt lengkap, topik (untuk filter),
"Dipakai di" (ChatGPT/Gemini/…), lalu Status **Dipublikasi** → **Simpan perubahan**.

**Link untuk ManyChat** (kirim di DM otomatis saat orang komentar kata kunci):
| Tujuan | Link |
| --- | --- |
| Langsung ke 1 prompt (disorot emas & di-scroll otomatis) | `https://hamdaniharfan.com/products/prompts/<slug>/?utm_source=manychat` |
| Semua prompt | `https://hamdaniharfan.com/products/prompts/?utm_source=instagram` |
| Pratinjau draft | `https://hamdaniharfan.com/products/prompts/?preview=1` |

- Tiap prompt yang dipublikasi otomatis mendapat halaman sendiri dengan judul & gambar sebagai pratinjau link (Open Graph) — tampil rapi saat dikirim di DM/WhatsApp.
- Tombol Copy bekerja juga di browser bawaan Instagram/Facebook/TikTok (ada cadangan otomatis; jika tetap diblokir, teks prompt ditandai agar bisa ditekan lama → Salin).
- Di bawah daftar prompt bisa ditampilkan 1 produk berbayar (atur "Produk yang ditawarkan" di tab Prompt AI).
- 3 prompt terbaru juga tampil di halaman `/products/`.
- File: `src/store/PromptLibrary.jsx`, `src/store/prompts.js`; halaman statis dibuat di `vite.config.js`.
