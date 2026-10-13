import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://ai-frontdesk-interviewer.vercel.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/api/", "/interview", "/documents", "/done"] }],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
