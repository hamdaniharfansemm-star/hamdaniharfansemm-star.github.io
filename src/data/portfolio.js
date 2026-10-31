// ─────────────────────────────────────────────────────────────
//  All editable website content lives in content.json.
//  Edit it from the admin page (/admin/) or directly in the file.
//  This module only re-exports it plus a few fixed settings.
// ─────────────────────────────────────────────────────────────
import content from "./content.json";

export const {
  profile,
  hero,
  banner,
  stats,
  about,
  works,
  projects,
  techStack,
  services,
  skills,
  experience,
  contact,
} = content;

export const workCategories = ["All", ...content.workCategories];

export const navLinks = [
  { id: "about", label: "About" },
  { id: "works", label: "Works" },
  { id: "skills", label: "Skills" },
  { id: "experience", label: "Experience" },
  { id: "store", label: "Digital Store", href: "/products/" },
  { id: "contact", label: "Hire Me" },
];

// Google Play release stage of each app (see `status` on each project).
export const releaseStatus = {
  live: { label: "Live on Google Play", short: "Live", tone: "emerald" },
  closed: { label: "Closed Testing", short: "Closed Testing", tone: "amber" },
  internal: { label: "Internal Testing", short: "Internal Testing", tone: "sky" },
  development: { label: "In Development", short: "In Development", tone: "slate" },
};

// Play Store link is built from packageId for live apps.
export const playUrl = (packageId) => `https://play.google.com/store/apps/details?id=${packageId}`;

// Social networks the site has icons for (used by the admin page dropdown too).
export const socialNetworks = ["github", "linkedin", "instagram", "youtube", "tiktok", "facebook", "academia", "website"];
