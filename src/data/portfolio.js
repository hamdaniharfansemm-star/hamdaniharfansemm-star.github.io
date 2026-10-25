// ─────────────────────────────────────────────────────────────
//  Single source of truth for all copy & content.
//  Edit text, links and images here — components update automatically.
// ─────────────────────────────────────────────────────────────

export const profile = {
  name: "Hamdani Harfan",
  role: "Designer · Software Engineer · Banking Professional",
  company: "PT Bank Mandiri (Persero) Tbk.",
  email: "hamdaniharfansemm@gmail.com",
  phoneDisplay: "+62 852-6556-2860",
  whatsapp: "6285265562860",
  photo: "/assets/profile-photo.jpg",
  bannerBg: "/assets/banner-bg.png",
};

export const navLinks = [
  { id: "about", label: "About" },
  { id: "works", label: "Works" },
  { id: "skills", label: "Skills" },
  { id: "experience", label: "Experience" },
  { id: "contact", label: "Contact" },
];

export const hero = {
  designer: {
    eyebrow: "01 — Product & Visual",
    title: "designer",
    body: "UI/UX designer crafting design systems, product strategy and visual brands that feel effortless to use.",
    tags: ["Design Systems", "Product Strategy", "Branding"],
  },
  developer: {
    eyebrow: "02 — Systems & Code",
    title: "<developer>",
    body: "Software engineer building scalable architectures, mobile apps and reliable release workflows.",
    tags: ["Architecture", "Mobile Apps", "Play Console"],
  },
};

export const banner = {
  title: "Available for Project Collaboration & Large-Scale Product Development",
  status: "Ready for Projects & Institutional Consulting",
  cta: "Let's Talk",
};

export const about = {
  headline: "Bridging Vision, Design, and Engineering",
  body: "Hi, I’m Hamdani Harfan—a multidisciplinary Designer, Software Engineer, and banking professional currently contributing at PT Bank Mandiri. I operate at the intersection of enterprise-grade reliability, creative problem-solving, and technical execution, transforming complex requirements into seamless, user-centric applications. My expertise spans end-to-end product development: from conceptualizing intuitive UI/UX designs and feature specifications to engineering reliable architectures and managing Google Play Console deployment lifecycles. Whether managing financial systems at PT Bank Mandiri or building tools like D-Fin, Dagangku AI, DSCAN, DStudio, DicteDoc, DTS, and DNotes, my goal is delivering polished digital experiences that solve real-world problems efficiently.",
  philosophy: [
    {
      title: "User-Centric First",
      text: "Every screen starts from a real person’s task, not from a feature list.",
    },
    {
      title: "Scalable Architecture",
      text: "Foundations built to grow — clean structure, secure data, predictable releases.",
    },
    {
      title: "End-to-End Ownership",
      text: "From the first wireframe to the Play Console rollout, I own the whole journey.",
    },
  ],
  facts: [
    { value: "7", label: "Products designed & built" },
    { value: "2", label: "Disciplines, one workflow" },
  ],
};

export const workCategories = ["All", "UI/UX & Products", "Mobile & Web Dev"];

export const projects = [
  {
    id: "dagangku",
    title: "Dagangku AI",
    category: "UI/UX & Products",
    tech: ["Flutter", "AI Prompt", "Play Console"],
    desc: "Inventory management, smart cashier, and automated sales reporting application.",
    image: "/assets/projects/dagangku.png",
    logo: null,
    accent: "#10b981",
    highlights: [
      "Smart cashier (POS) flow designed for fast daily transactions",
      "Real-time stock & inventory tracking for small businesses",
      "Automated sales reports generated with AI assistance",
    ],
  },
  {
    id: "dfin",
    title: "D-Fin",
    category: "UI/UX & Products",
    tech: ["Figma", "Visual Branding", "Fintech Architecture"],
    desc: "Financial platform featuring modern visual branding and advanced security architecture.",
    image: "/assets/projects/dfin.png",
    logo: "/assets/logos/dfin.png",
    accent: "#38bdf8",
    highlights: [
      "Voice-based transaction logging & digital envelope budgeting",
      "Automated savings goals and family account sync",
      "MoneyMind insights, challenges and story-style reports",
    ],
  },
  {
    id: "dscan-dstudio",
    title: "DSCAN & DStudio",
    category: "Mobile & Web Dev",
    tech: ["React", "Mobile Utilities", "Release Management"],
    desc: "Versatile digital productivity and utility solutions for daily workflows.",
    image: "/assets/projects/dscan-dstudio.png",
    logo: "/assets/logos/dscan.png",
    accent: "#3b82f6",
    highlights: [
      "Document scanning to PDF & transparent-background PNG",
      "Fully offline — no ads, no account required",
      "Shared release pipeline with the DStudio creative suite",
    ],
  },
  {
    id: "dictedoc",
    title: "DicteDoc",
    category: "UI/UX & Products",
    tech: ["Speech-to-Text", "Text-to-Speech", "AI Engine"],
    desc: "High-accuracy speech-to-text and text-to-speech conversion solution.",
    image: "/assets/projects/dictedoc.png",
    logo: "/assets/logos/dictedoc.png",
    accent: "#facc15",
    highlights: [
      "Turns documents into natural speech with auto summaries",
      "Records meetings into transcripts and structured minutes",
      "AI engine tuned for Bahasa Indonesia & English",
    ],
  },
  {
    id: "dts",
    title: "DTS (Digital Timestamp Solution)",
    category: "Mobile & Web Dev",
    tech: ["Timestamp API", "Security", "Proof Verification"],
    desc: "Work timestamp validation and authentic digital proof verification solution.",
    image: "/assets/projects/dts.png",
    logo: "/assets/logos/dts.png",
    accent: "#d4a648",
    highlights: [
      "Time, location, map & weather stamped on photos and video",
      "Tamper-evident hashing for authentic proof of work",
      "Audit-ready templates for field reports",
    ],
  },
  {
    id: "dnotes",
    title: "DNotes",
    category: "Mobile & Web Dev",
    tech: ["Voice Command", "NLP", "Reminder System"],
    desc: "Smart reminder application driven by interactive voice commands.",
    image: "/assets/projects/dnotes.png",
    logo: "/assets/logos/dnotes.png",
    accent: "#94a3b8",
    highlights: [
      "Capture notes by voice in five languages",
      "Automatic agenda extraction from spoken notes",
      "Task alarms that never get missed",
    ],
  },
  {
    id: "dstudio",
    title: "DStudio (Video Edition Suite)",
    category: "UI/UX & Products",
    tech: ["Video Processing UI", "Media Architecture"],
    desc: "Integrated creative solution for digital video editing and production.",
    image: "/assets/projects/dstudio.png",
    logo: "/assets/logos/dstudio.png",
    accent: "#eab308",
    highlights: [
      "Trim, merge and speed control on a mobile timeline",
      "AI auto-subtitles, text animation and background music",
      "HD 60fps screen recording with internal audio",
    ],
  },
];

export const skills = {
  design: {
    title: "Design & Strategy",
    kicker: "The designer",
    items: [
      { name: "UI/UX Design & Wireframing", detail: "Low-to-high fidelity flows that validate ideas before a single line of code.", tools: ["Wireframes", "Prototypes", "Usability"] },
      { name: "Figma & Advanced Design Systems", detail: "Tokens, components and variants that keep seven products visually consistent.", tools: ["Figma", "Auto Layout", "Tokens"] },
      { name: "Product Strategy & Feature Specs", detail: "Turning business goals into clear, buildable feature specifications.", tools: ["PRD", "Roadmaps", "Prioritisation"] },
      { name: "User Journey & Information Architecture", detail: "Mapping how people move through an app so nothing feels lost.", tools: ["Journey Maps", "Sitemaps", "Card Sorting"] },
      { name: "Visual Branding & UI Layouts", detail: "Logos, store graphics and layouts that give each product a distinct identity.", tools: ["Branding", "Store Assets", "Layout"] },
    ],
  },
  engineering: {
    title: "Engineering & Platforms",
    kicker: "The developer",
    items: [
      { name: "Frontend/Backend Architecture (React, Node)", detail: "Component-driven frontends on top of clean, well-structured APIs.", tools: ["React", "Node.js", "REST"] },
      { name: "Mobile App Development (Flutter, React Native)", detail: "Cross-platform apps shipped as native Android builds.", tools: ["Flutter", "React Native", "Android"] },
      { name: "Enterprise Banking Standards & Compliance (PT Bank Mandiri)", detail: "Security, governance and reliability habits carried from banking into every product.", tools: ["Governance", "Data Security", "Risk"] },
      { name: "Google Play Console Release Management", detail: "Testing tracks, staged rollouts and store listings handled end to end.", tools: ["Play Console", "AAB", "Staged Rollout"] },
      { name: "Scalable Systems & In-App Purchases", detail: "Architectures ready for growth, with monetisation built in.", tools: ["Billing", "Scalability", "Analytics"] },
    ],
  },
};

export const experience = [
  {
    role: "Branch Operations Manager",
    org: "PT Bank Mandiri (Persero) Tbk.",
    period: "Present",
    current: true,
    summary:
      "Handling core operational, technical, and governance workflows, maintaining high standards of data security, institutional governance, and financial system reliability.",
    tags: ["Operations", "Governance", "Risk & Compliance", "Data Security"],
  },
  {
    role: "Lead Product Designer & Software Engineer",
    org: "Independent Ecosystem — Dagangku, D-Fin, DSCAN, DStudio",
    period: "2024 — Present",
    current: true,
    summary:
      "Designing product architecture, formulating feature specifications, and managing regular application releases on the Google Play Console.",
    tags: ["Product Architecture", "Feature Specs", "Play Console"],
  },
  {
    role: "UI/UX & Full-Stack Developer",
    org: "Freelance & Product Projects",
    period: "2022 — 2024",
    current: false,
    summary:
      "Developing large-scale mobile and web applications, optimizing user journeys, and integrating digital payment systems.",
    tags: ["Mobile & Web", "User Journeys", "Digital Payments"],
  },
];

export const contact = {
  intro:
    "Let's build something extraordinary together. Have a project in mind or want to discuss enterprise solutions?",
  socials: [
    { id: "linkedin", label: "LinkedIn", handle: "Hamdani Harfan", href: "https://www.linkedin.com/in/hamdani-harfan-19479a362/?isSelfProfile=true" },
    { id: "instagram", label: "Instagram", handle: "@hamdaniharfan", href: "https://www.instagram.com/hamdaniharfan/" },
    { id: "youtube", label: "YouTube", handle: "@hamdaniharfan", href: "https://youtube.com/@hamdaniharfan?si=ee6Mf7BQPF6gbaYH" },
  ],
  projectTypes: ["Mobile App", "Web Platform", "UI/UX & Design System", "Enterprise / Institutional Consulting", "Other"],
};
