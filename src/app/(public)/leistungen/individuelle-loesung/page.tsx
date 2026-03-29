import type { Metadata } from "next";
import { services } from "@/data/services";
import { ServicePageTemplate } from "@/components/sections/ServicePageTemplate";

export const metadata: Metadata = {
  title: "Ihre individuelle Lösung — Von der Idee bis zum Go-Live",
  description:
    "Maßgeschneiderte digitale Lösungen für Gründer und Kleingewerbe. Planung, Umsetzung, Start und Betreuung — alles aus einer Hand. Ab 999 €.",
};

export default function IndividuelleLosungPage() {
  const service = services.find((s) => s.slug === "individuelle-loesung")!;
  return <ServicePageTemplate service={service} />;
}
