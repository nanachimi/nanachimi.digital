import type { Metadata } from "next";
import { services } from "@/data/services";
import { ServicePageTemplate } from "@/components/sections/ServicePageTemplate";

export const metadata: Metadata = {
  title: "Laufende Betreuung — Wir kümmern uns um den Betrieb",
  description:
    "Ihre Lösung läuft — wir sorgen dafür, dass das so bleibt. Überwachung, Updates und schnelle Hilfe. Ab 29 €/Monat für Kleingewerbe und Gründer.",
};

export default function BetriebUndWartungPage() {
  const service = services.find((s) => s.slug === "betrieb-und-wartung")!;
  return <ServicePageTemplate service={service} />;
}
