import type { MetadataRoute } from "next";
import { ROLES } from "@/lib/roles";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://ai-frontdesk-interviewer.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/leads`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    ...ROLES.map((role) => ({
      url: `${SITE_URL}/apply/${role.slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];
}
