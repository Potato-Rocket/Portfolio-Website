// Single source of truth for the navbar's tabs. Add a tab here (and pass its `id`
// as the `tab` prop from the page) and Navbar.astro picks it up with no markup edits —
// each tab gets its `nav-<id>` view-transition name and collapse handling for free.
// The brand/Home link is deliberately NOT a tab; it's hardcoded in Navbar.astro.
export const NAV_TABS = [
  { id: "projects", label: "Projects", href: "/projects" },
  { id: "gallery", label: "Gallery", href: "/gallery" },
] as const;

export type NavTabId = (typeof NAV_TABS)[number]["id"];