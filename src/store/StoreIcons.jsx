// Line icons for the Digital Store (inline SVG — no icon library).
const base = {
  width: 22,
  height: 22,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
};

export const BookIcon = (p) => (
  <svg {...base} {...p}>
    <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z" />
    <path d="M4 20.5A2.5 2.5 0 0 0 6.5 23H20v-5" />
    <path d="M8 7h8M8 11h6" />
  </svg>
);
export const BlueprintIcon = (p) => (
  <svg {...base} {...p}>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M3 9h18M9 21V9M13 13h4M13 17h2" />
  </svg>
);
export const AppIcon = (p) => (
  <svg {...base} {...p}>
    <rect x="6" y="2" width="12" height="20" rx="3" />
    <path d="M10 6h4M11 18h2" />
    <path d="m9.5 12 1.8 1.8 3.2-3.3" />
  </svg>
);
export const CourseIcon = (p) => (
  <svg {...base} {...p}>
    <rect x="2" y="4" width="20" height="13" rx="2" />
    <path d="m10 8.5 4 2-4 2z" />
    <path d="M8 21h8M12 17v4" />
  </svg>
);
export const CodeIcon = (p) => (
  <svg {...base} {...p}>
    <path d="m8 7-5 5 5 5M16 7l5 5-5 5M14 4l-4 16" />
  </svg>
);
export const SearchIcon = (p) => (
  <svg {...base} {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </svg>
);
export const ShieldIcon = (p) => (
  <svg {...base} {...p}>
    <path d="M12 3 4 6v6c0 5 3.4 8.3 8 9 4.6-.7 8-4 8-9V6l-8-3z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);
export const LayersIcon = (p) => (
  <svg {...base} {...p}>
    <path d="m12 3 9 5-9 5-9-5 9-5z" />
    <path d="m3 13 9 5 9-5" />
  </svg>
);
export const ListIcon = (p) => (
  <svg {...base} {...p}>
    <path d="M9 6h11M9 12h11M9 18h11" />
    <path d="M4 6h.01M4 12h.01M4 18h.01" strokeWidth="2.6" />
  </svg>
);
export const ChatIcon = (p) => (
  <svg {...base} {...p}>
    <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.4A8 8 0 1 1 21 12z" />
  </svg>
);
export const LockIcon = (p) => (
  <svg {...base} {...p}>
    <rect x="4" y="10" width="16" height="11" rx="2" />
    <path d="M8 10V7a4 4 0 0 1 8 0v3" />
  </svg>
);
export const ExternalIcon = (p) => (
  <svg {...base} width={16} height={16} {...p}>
    <path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />
  </svg>
);
export const ChevronIcon = (p) => (
  <svg {...base} width={16} height={16} {...p}>
    <path d="m9 6 6 6-6 6" />
  </svg>
);
export const CloseSmall = (p) => (
  <svg {...base} width={16} height={16} {...p}>
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
);

export const categoryIcon = {
  ebooks: BookIcon,
  blueprints: BlueprintIcon,
  apps: AppIcon,
  courses: CourseIcon,
  templates: CodeIcon,
};

export const trustIcons = [LayersIcon, LockIcon, ListIcon, ChatIcon];
