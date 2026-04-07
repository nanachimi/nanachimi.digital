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
      ],
    },
    sitemap: "https://nanachimi.digital/sitemap.xml",
  };
}
