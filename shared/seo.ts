export type SeoMetadata = {
  title: string;
  description: string;
  robots: "index, follow" | "noindex, follow";
  type: "website";
};

const homeMetadata: SeoMetadata = {
  title: "Focus Flow | A calmer way to work with your attention",
  description:
    "Plan focused work, run a session timer, capture distractions, and review your progress with Focus Flow.",
  robots: "index, follow",
  type: "website",
};

const privateMetadata: Record<string, Omit<SeoMetadata, "robots" | "type">> = {
  "/dashboard": {
    title: "Dashboard | Focus Flow",
    description: "Start and plan focused work sessions in Focus Flow.",
  },
  "/templates": {
    title: "Session templates | Focus Flow",
    description: "Create and reuse simple templates for focused work sessions.",
  },
  "/history": {
    title: "Session history | Focus Flow",
    description: "Review completed focus sessions and the patterns they reveal.",
  },
  "/daily-review": {
    title: "Daily review | Focus Flow",
    description: "Reflect on today's focus sessions and plan what comes next.",
  },
  "/weekly-review": {
    title: "Weekly review | Focus Flow",
    description: "Review your week of focused work and choose a useful next step.",
  },
  "/settings": {
    title: "Settings | Focus Flow",
    description: "Manage your Focus Flow preferences and local data.",
  },
  "/create-group-session": {
    title: "Create a group session | Focus Flow",
    description: "Plan a shared focus session and invite people to start together.",
  },
  "/group-session": {
    title: "Join a group session | Focus Flow",
    description: "Join a shared Focus Flow session with your invitation link.",
  },
  "/group-sessions": {
    title: "Group sessions | Focus Flow",
    description: "Create, join, and manage shared focus sessions.",
  },
  "/session": {
    title: "Focus session | Focus Flow",
    description: "Run a focused timer, capture distractions, and finish with a review.",
  },
  "/active-group": {
    title: "Active group session | Focus Flow",
    description: "Stay in sync with your shared Focus Flow session.",
  },
  "/404": {
    title: "Page not found | Focus Flow",
    description: "The Focus Flow page you requested could not be found.",
  },
};

export function getSeoMetadata(pathname: string): SeoMetadata {
  const path = pathname.replace(/\/+/g, "/").replace(/\/$/, "") || "/";
  if (path === "/") return homeMetadata;

  const entry = Object.entries(privateMetadata).find(([prefix]) =>
    path === prefix || path.startsWith(`${prefix}/`),
  )?.[1];

  return {
    ...(entry ?? {
      title: "Page not found | Focus Flow",
      description: "The Focus Flow page you requested could not be found.",
    }),
    robots: "noindex, follow",
    type: "website",
  };
}

export function normalizeSiteUrl(siteUrl: string): string {
  return siteUrl.trim().replace(/\/+$/, "");
}

export function absoluteSiteUrl(siteUrl: string, pathname: string): string {
  return new URL(pathname, `${normalizeSiteUrl(siteUrl)}/`).toString();
}
