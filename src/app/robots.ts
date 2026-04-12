import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/backoffice",
        "/onboarding/ergebnis",
        "/onboarding/bestaetigung",
        "/angebot/",
        "/portal",
      ],
    },
    sitemap: "https://nanachimi.digital/sitemap.xml",
  };
}
