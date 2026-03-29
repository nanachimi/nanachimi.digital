import type { Metadata } from "next";
import { services } from "@/data/services";
import { ServicePageTemplate } from "@/components/sections/ServicePageTemplate";

export const metadata: Metadata = {
  title: "Individuelle App-Entwicklung",
  description:
    "Maßgeschneiderte Web- und Mobile-Apps mit modernem Tech-Stack. Iterativ, transparent und produktionsreif. Von Discovery bis Go-Live.",
};

export default function AppEntwicklungPage() {
  const service = services.find((s) => s.slug === "app-entwicklung")!;
  return <ServicePageTemplate service={service} />;
}
