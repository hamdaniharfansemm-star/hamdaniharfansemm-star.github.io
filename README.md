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
