// Describes the admin form. Each tab edits part of content.json.
// Field types: text, textarea, select, checkbox, color, image, lines (array of strings),
//              group (nested object), list (array of objects).

const statusOptions = [
  { value: "live", label: "Live di Google Play" },
  { value: "closed", label: "Closed Testing" },
  { value: "internal", label: "Internal Testing" },
  { value: "development", label: "Masih dikembangkan" },
];

const toneOptions = [
  { value: "sky", label: "Biru" },
  { value: "amber", label: "Emas" },
  { value: "violet", label: "Ungu" },
  { value: "emerald", label: "Hijau" },
  { value: "orange", label: "Oranye" },
];

const networkOptions = [
  { value: "github", label: "GitHub" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "instagram", label: "Instagram" },
  { value: "youtube", label: "YouTube" },
  { value: "tiktok", label: "TikTok" },
  { value: "facebook", label: "Facebook" },
  { value: "academia", label: "Penelitian / Academia" },
  { value: "website", label: "Website lain" },
];

const skillItem = [
  { key: "name", type: "text", label: "Nama keahlian" },
  { key: "detail", type: "textarea", label: "Penjelasan singkat", rows: 2 },
  { key: "tools", type: "lines", label: "Tools / label kecil", help: "Satu per baris" },
];

const productStatus = [
  { value: "published", label: "Dipublikasi (tampil di toko)" },
  { value: "draft", label: "Draft (tersembunyi)" },
  { value: "demo", label: "Demo (hanya mode pratinjau)" },
];

const storeCategories = [
  { value: "ebooks", label: "Modules & E-books" },
  { value: "blueprints", label: "Blueprints" },
  { value: "apps", label: "Apps" },
  { value: "courses", label: "Online Courses" },
  { value: "templates", label: "Templates & Source Code" },
];

export const tabs = [
  {
    id: "profile",
    label: "Profil",
    fields: [
      {
        key: "profile",
        type: "group",
        fields: [
          { key: "name", type: "text", label: "Nama" },
          { key: "role", type: "text", label: "Peran (footer)" },
          { key: "company", type: "text", label: "Instansi saat ini" },
          { key: "email", type: "text", label: "Email", inputType: "email" },
          { key: "phoneDisplay", type: "text", label: "Nomor telepon (tampilan)", placeholder: "+62 852-…" },
          { key: "whatsapp", type: "text", label: "Nomor WhatsApp", help: "Format internasional tanpa + dan spasi, mis. 6285265562860" },
          { key: "photo", type: "image", label: "Foto profil", help: "Foto portrait (tegak) paling bagus" },
          { key: "bannerBg", type: "image", label: "Gambar latar banner" },
        ],
      },
    ],
  },
  {
    id: "hero",
    label: "Hero",
    fields: [
      {
        key: "hero.designer",
        type: "group",
        title: "Sisi Designer (krem)",
        fields: [
          { key: "eyebrow", type: "text", label: "Label kecil" },
          { key: "title", type: "text", label: "Judul besar" },
          { key: "body", type: "textarea", label: "Deskripsi", rows: 2 },
          { key: "tags", type: "lines", label: "Label", help: "Satu per baris" },
        ],
      },
      {
        key: "hero.developer",
        type: "group",
        title: "Sisi Developer (gelap)",
        fields: [
          { key: "eyebrow", type: "text", label: "Label kecil" },
          { key: "title", type: "text", label: "Judul besar" },
          { key: "body", type: "textarea", label: "Deskripsi", rows: 2 },
          { key: "tags", type: "lines", label: "Label", help: "Satu per baris" },
        ],
      },
    ],
  },
  {
    id: "banner",
    label: "Banner & Angka",
    fields: [
      {
        key: "banner",
        type: "group",
        title: "Banner ketersediaan",
        fields: [
          { key: "status", type: "text", label: "Status (badge hijau)" },
          { key: "title", type: "textarea", label: "Judul", rows: 2 },
          { key: "tagline", type: "textarea", label: "Kalimat di bawah judul", rows: 2 },
          { key: "cta", type: "text", label: "Teks tombol" },
        ],
      },
      {
        key: "stats.secure",
        type: "group",
        title: "Kotak angka ke-4",
        help: "Tiga kotak lainnya (jumlah aplikasi, live, testing) dihitung otomatis dari daftar Proyek.",
        fields: [
          { key: "value", type: "text", label: "Angka" },
          { key: "label", type: "text", label: "Keterangan" },
        ],
      },
    ],
  },
  {
    id: "about",
    label: "Tentang",
    fields: [
      { key: "about.headline", type: "text", label: "Judul" },
      { key: "about.body", type: "textarea", label: "Biografi", rows: 9 },
      {
        key: "about.education",
        type: "list",
        label: "Pendidikan",
        itemTitle: (it) => it.degree || "Pendidikan baru",
        fields: [
          { key: "degree", type: "text", label: "Gelar", placeholder: "Master of Management (M.M.)" },
          { key: "field", type: "text", label: "Jurusan / konsentrasi" },
          { key: "school", type: "text", label: "Kampus" },
        ],
      },
      {
        key: "about.philosophy",
        type: "list",
        label: "Prinsip kerja",
        itemTitle: (it) => it.title || "Prinsip baru",
        fields: [
          { key: "title", type: "text", label: "Judul" },
          { key: "text", type: "textarea", label: "Penjelasan", rows: 2 },
        ],
      },
      {
        key: "about.facts",
        type: "list",
        label: "Angka di bawah biografi",
        itemTitle: (it) => `${it.value || "?"} — ${it.label || ""}`,
        fields: [
          { key: "value", type: "text", label: "Angka" },
          { key: "label", type: "text", label: "Keterangan" },
        ],
      },
    ],
  },
  {
    id: "projects",
    label: "Proyek",
    fields: [
      { key: "works.title", type: "text", label: "Judul bagian" },
      { key: "works.intro", type: "text", label: "Kalimat pembuka", help: "Jumlah proyek ditambahkan otomatis di depannya." },
      { key: "workCategories", type: "lines", label: "Kategori filter", help: "Satu per baris. 'All' ditambahkan otomatis." },
      {
        key: "projects",
        type: "list",
        label: "Daftar aplikasi",
        itemTitle: (it) => it.title || "Aplikasi baru",
        itemSubtitle: (it) => statusOptions.find((s) => s.value === it.status)?.label || "",
        itemImage: (it) => it.logo || it.image,
        newItem: { status: "development", accent: "#38bdf8", tech: [], highlights: [] },
        fields: [
          { key: "title", type: "text", label: "Nama aplikasi" },
          {
            key: "category",
            type: "select",
            label: "Kategori",
            options: (content) => (content.workCategories || []).map((c) => ({ value: c, label: c })),
          },
          { key: "status", type: "select", label: "Status rilis", options: statusOptions },
          {
            key: "packageId",
            type: "text",
            label: "Package ID",
            placeholder: "com.hamdaniharfan.namaapp",
            help: "Wajib untuk status Live — dipakai untuk tombol Google Play.",
          },
          { key: "desc", type: "textarea", label: "Deskripsi singkat", rows: 2 },
          { key: "image", type: "image", label: "Gambar banner (1024×500)" },
          { key: "logo", type: "image", label: "Logo / ikon aplikasi" },
          { key: "accent", type: "color", label: "Warna aksen" },
          { key: "tech", type: "lines", label: "Teknologi", help: "Satu per baris" },
          { key: "highlights", type: "lines", label: "Fitur unggulan", help: "Satu per baris (tampil saat kartu diklik)" },
        ],
      },
    ],
  },
  {
    id: "skills",
    label: "Keahlian",
    fields: [
      {
        key: "techStack",
        type: "list",
        label: "Tech stack",
        compact: true,
        itemTitle: (it) => it.name || "Baru",
        newItem: { tone: "sky" },
        fields: [
          { key: "name", type: "text", label: "Nama" },
          { key: "tone", type: "select", label: "Warna", options: toneOptions },
        ],
      },
      { key: "services", type: "lines", label: "Layanan", help: "Satu per baris" },
      {
        key: "skills.design",
        type: "group",
        title: "Kolom Designer",
        fields: [
          { key: "kicker", type: "text", label: "Label kecil" },
          { key: "title", type: "text", label: "Judul" },
          { key: "items", type: "list", label: "Keahlian", itemTitle: (it) => it.name || "Keahlian baru", fields: skillItem },
        ],
      },
      {
        key: "skills.engineering",
        type: "group",
        title: "Kolom Developer",
        fields: [
          { key: "kicker", type: "text", label: "Label kecil" },
          { key: "title", type: "text", label: "Judul" },
          { key: "items", type: "list", label: "Keahlian", itemTitle: (it) => it.name || "Keahlian baru", fields: skillItem },
        ],
      },
    ],
  },
  {
    id: "experience",
    label: "Pengalaman",
    fields: [
      {
        key: "experience",
        type: "list",
        label: "Riwayat (paling baru di atas)",
        itemTitle: (it) => it.role || "Posisi baru",
        itemSubtitle: (it) => [it.org, it.period].filter(Boolean).join(" · "),
        newItem: { current: false, tags: [] },
        fields: [
          { key: "role", type: "text", label: "Jabatan" },
          { key: "org", type: "text", label: "Instansi / proyek" },
          { key: "period", type: "text", label: "Periode", placeholder: "2024 — Present" },
          { key: "current", type: "checkbox", label: "Masih menjabat (titik hijau berkedip)" },
          { key: "summary", type: "textarea", label: "Ringkasan", rows: 3 },
          { key: "tags", type: "lines", label: "Label", help: "Satu per baris" },
        ],
      },
    ],
  },
  {
    id: "contact",
    label: "Hire Me & Sosmed",
    fields: [
      { key: "contact.title", type: "text", label: "Judul bagian", placeholder: "Hire Me" },
      { key: "contact.intro", type: "textarea", label: "Kalimat pembuka", rows: 2 },
      {
        key: "contact.formEmail",
        type: "text",
        label: "Email penerima form proyek",
        help: "Permintaan proyek dikirim ke email ini lewat FormSubmit. Wajib aktivasi sekali per alamat website (cek email 'Activate FormSubmit'). Setelah aktif, boleh diganti dengan kode alias dari FormSubmit agar email tidak terlihat.",
      },
      {
        key: "contact.socials",
        type: "list",
        label: "Media sosial & tautan",
        itemTitle: (it) => it.label || "Tautan baru",
        itemSubtitle: (it) => it.handle || "",
        newItem: { id: "website" },
        fields: [
          { key: "id", type: "select", label: "Jenis (menentukan ikon)", options: networkOptions },
          { key: "label", type: "text", label: "Nama tampilan" },
          { key: "handle", type: "text", label: "Username / keterangan" },
          { key: "href", type: "text", label: "Link lengkap", inputType: "url", placeholder: "https://…" },
        ],
      },
      { key: "contact.projectTypes", type: "lines", label: "Pilihan jenis proyek di form", help: "Satu per baris. Kosongkan untuk menyembunyikan." },
    ],
  },
  {
    id: "store",
    label: "Digital Store",
    fields: [
      {
        key: "store.hero",
        type: "group",
        title: "Hero toko (/products/)",
        help: "Pratinjau produk Demo/Draft: buka hamdaniharfan.com/products/?preview=1",
        fields: [
          { key: "eyebrow", type: "text", label: "Label kecil", placeholder: "Digital Products & Innovation" },
          { key: "title", type: "text", label: "Judul besar" },
          { key: "intro", type: "textarea", label: "Deskripsi", rows: 2 },
        ],
      },
      {
        key: "store.products",
        type: "list",
        label: "Produk",
        itemTitle: (it) => it.name || "Produk baru",
        itemSubtitle: (it) => [productStatus.find((s) => s.value === it.status)?.label, it.checkoutUrl ? "Mayar ✓" : "belum ada link Mayar"].filter(Boolean).join(" · "),
        itemImage: (it) => it.coverImage,
        newItem: { status: "draft", currency: "IDR", featured: false, problems: [], features: [], audience: [], curriculum: [], specifications: [], faq: [], gallery: [] },
        fields: [
          { key: "name", type: "text", label: "Nama produk" },
          { key: "status", type: "select", label: "Status", options: () => productStatus },
          { key: "category", type: "select", label: "Kategori", options: () => storeCategories },
          {
            key: "slug",
            type: "text",
            label: "Slug (alamat halaman)",
            placeholder: "otomatis dari nama jika kosong",
            help: "Alamat produk: hamdaniharfan.com/products/<slug>/ — huruf kecil & tanda minus. Jangan diubah setelah dipublikasi.",
          },
          { key: "shortDescription", type: "textarea", label: "Deskripsi singkat (kartu & Google)", rows: 2 },
          { key: "description", type: "textarea", label: "Deskripsi lengkap & manfaat", rows: 5 },
          { key: "price", type: "text", label: "Harga jual", placeholder: "149000 — isi 0 untuk gratis", help: "Angka saja. Harus sama dengan harga di Mayar." },
          {
            key: "originalPrice",
            type: "text",
            label: "Harga coret (opsional)",
            placeholder: "199000",
            help: "Isi jika sedang diskon — badge 'Sale −x%' muncul otomatis. Samakan dengan 'harga coret' di Mayar.",
          },
          { key: "currency", type: "select", label: "Mata uang", options: () => [{ value: "IDR", label: "IDR (Rp)" }, { value: "USD", label: "USD ($)" }] },
          {
            key: "checkoutUrl",
            type: "text",
            inputType: "url",
            label: "Link checkout Mayar",
            placeholder: "https://…mayar.link/…",
            help: "Salin dari dashboard Mayar (halaman produk → Bagikan/Link). Kosong = tombol beli tampil 'Not available yet'.",
          },
          { key: "coverImage", type: "image", label: "Gambar sampul (rasio 4:3, mis. 1600×1200)" },
          { key: "gallery", type: "list", label: "Galeri tambahan", compact: true, itemTitle: (it) => it.image?.split("/").pop() || "Gambar", fields: [{ key: "image", type: "image", label: "Gambar" }] },
          { key: "featured", type: "checkbox", label: "Tampilkan sebagai produk unggulan (Featured)" },
          { key: "bestseller", type: "checkbox", label: "Tandai 'Bestseller' (hanya jika memang terlaris menurut data penjualan Mayar)" },
          { key: "releaseDate", type: "text", inputType: "date", label: "Tanggal rilis", help: "Label 'New' otomatis tampil 45 hari sejak tanggal ini." },
          { key: "problems", type: "lines", label: "Masalah yang diselesaikan", help: "Satu per baris" },
          { key: "features", type: "lines", label: "Isi / fitur produk", help: "Satu per baris" },
          { key: "audience", type: "lines", label: "Target pengguna", help: "Satu per baris" },
          { key: "curriculum", type: "lines", label: "Kurikulum (untuk kursus)", help: "Satu modul per baris" },
          {
            key: "specifications",
            type: "list",
            label: "Spesifikasi",
            compact: true,
            itemTitle: (it) => (it.label ? `${it.label}: ${it.value || ""}` : "Spesifikasi baru"),
            fields: [
              { key: "label", type: "text", label: "Nama", placeholder: "Format / Versi / Kompatibilitas / Lisensi / Akses" },
              { key: "value", type: "text", label: "Nilai", placeholder: "PDF, 120 halaman" },
            ],
          },
          {
            key: "faq",
            type: "list",
            label: "FAQ",
            itemTitle: (it) => it.q || "Pertanyaan baru",
            fields: [
              { key: "q", type: "text", label: "Pertanyaan" },
              { key: "a", type: "textarea", label: "Jawaban", rows: 3 },
            ],
          },
        ],
      },
      {
        key: "store.trust",
        type: "list",
        label: "Nilai & pendekatan (bagian krem)",
        itemTitle: (it) => it.title || "Poin baru",
        fields: [
          { key: "title", type: "text", label: "Judul" },
          { key: "text", type: "textarea", label: "Penjelasan", rows: 2 },
        ],
      },
      { key: "store.emptyTitle", type: "text", label: "Judul saat belum ada produk" },
      { key: "store.emptyText", type: "textarea", label: "Teks saat belum ada produk", rows: 2 },
    ],
  },
];
