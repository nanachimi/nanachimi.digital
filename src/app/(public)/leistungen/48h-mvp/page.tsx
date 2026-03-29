import type { Metadata } from "next";
import { services } from "@/data/services";
import { ServicePageTemplate } from "@/components/sections/ServicePageTemplate";

export const metadata: Metadata = {
  title: "In 48 Stunden online — Ihre Idee wird Realität",
  description:
    "Sie beschreiben Ihre Idee — wir bringen sie in 48 Stunden live. Für Gründer und Kleingewerbe. Ab 299 €, keine technischen Vorkenntnisse nötig.",
};

export default function MVP48hPage() {
  const service = services.find((s) => s.slug === "48h-mvp")!;
  return <ServicePageTemplate service={service} />;
}
