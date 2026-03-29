import type { Metadata } from "next";
import { services } from "@/data/services";
import { ServicePageTemplate } from "@/components/sections/ServicePageTemplate";

export const metadata: Metadata = {
  title: "Betrieb, Monitoring & Wartung",
  description:
    "Laufender Betrieb, Monitoring, Updates und Support für bestehende oder neu entwickelte Apps. 24/7 Uptime-Monitoring und proaktive Wartung.",
};

export default function BetriebUndWartungPage() {
  const service = services.find((s) => s.slug === "betrieb-und-wartung")!;
  return <ServicePageTemplate service={service} />;
}
