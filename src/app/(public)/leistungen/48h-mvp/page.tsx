import type { Metadata } from "next";
import { services } from "@/data/services";
import { ServicePageTemplate } from "@/components/sections/ServicePageTemplate";

export const metadata: Metadata = {
  title: "48h Go-Live — MVP in 48 Stunden",
  description:
    "Für ausgewählte MVP-Projekte mit klarem Scope: Von der finalen Abstimmung bis zum Deployment in 48 Stunden. Produktionsreifer Code, Hetzner-Deployment inklusive.",
};

export default function MVP48hPage() {
  const service = services.find((s) => s.slug === "48h-mvp")!;
  return <ServicePageTemplate service={service} />;
}
