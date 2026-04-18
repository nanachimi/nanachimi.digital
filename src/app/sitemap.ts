import { MetadataRoute } from "next";
import { portfolioProjects } from "@/data/portfolio";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://nanachimi.digital";

  const staticPages = [
    "",
    "/leistungen",
    "/leistungen/48h-mvp",
    "/leistungen/individuelle-loesung",
    "/leistungen/betrieb-und-wartung",
    "/leistungen/app-entwicklung",
    "/portfolio",
    "/ueber-mich",
    "/kontakt",
    "/onboarding",
    "/onboarding/pdf-upload",
    "/affiliates",
    "/impressum",
    "/datenschutz",
    "/agb",
    "/partner-agb",
  ];

  const portfolioPages = portfolioProjects.map((p) => `/portfolio/${p.slug}`);

  return [...staticPages, ...portfolioPages].map((path) => ({
    url: `${baseUrl}${path}`,
    lastModified: new Date(),
    changeFrequency: path === "" ? "weekly" : "monthly",
    priority: path === "" ? 1 : path.includes("portfolio/") ? 0.7 : 0.8,
  }));
}
