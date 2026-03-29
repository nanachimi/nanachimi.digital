import Link from "next/link";
import { Zap, Code, Shield, ArrowRight, Check } from "lucide-react";
import { services } from "@/data/services";

const iconMap: Record<string, React.ElementType> = {
  Zap,
  Code,
  Shield,
};

const gradients = [
  "from-[#FFC62C] to-[#FF9500]",
  "from-[#3B82F6] to-[#6366F1]",
  "from-[#10B981] to-[#14B8A6]",
];

export function OffersGrid() {
  return (
    <section className="py-24 md:py-32">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-[#FFC62C]">
            Leistungen
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
            Was wir bieten
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            Von der schnellen MVP-Umsetzung bis zum langfristigen Betrieb —
            alles aus einer Hand.
          </p>
        </div>

        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {services.map((service, index) => {
            const Icon = iconMap[service.icon] || Code;
            return (
              <Link
                key={service.slug}
                href={`/leistungen/${service.slug}`}
                className="group relative overflow-hidden rounded-2xl border bg-white shadow-sm transition-all duration-300 hover:shadow-2xl hover:-translate-y-2"
              >
                {/* Top gradient bar */}
                <div className={`h-1.5 bg-gradient-to-r ${gradients[index]}`} />

                <div className="p-8">
                  {/* Icon with gradient background */}
                  <div className={`inline-flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br ${gradients[index]} shadow-lg`}>
                    <Icon className="h-7 w-7 text-white" />
                  </div>

                  <h3 className="mt-6 text-xl font-bold">{service.title}</h3>
                  <p className="mt-3 text-muted-foreground leading-relaxed">
                    {service.shortDescription}
                  </p>

                  {/* Features preview */}
                  <ul className="mt-6 space-y-2.5">
                    {service.features.slice(0, 3).map((f, j) => (
                      <li key={j} className="flex items-start gap-2.5 text-sm">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#FFC62C]" />
                        <span className="text-muted-foreground">{f}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-8 inline-flex items-center text-sm font-bold text-[#393E46] transition-colors group-hover:text-[#FFC62C]">
                    Mehr erfahren
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
