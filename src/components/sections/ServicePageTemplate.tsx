import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Check, Zap, Code, Shield } from "lucide-react";
import { Service } from "@/lib/types";

const iconMap: Record<string, React.ElementType> = {
  Zap,
  Code,
  Shield,
};

interface ServicePageTemplateProps {
  service: Service;
}

export function ServicePageTemplate({ service }: ServicePageTemplateProps) {
  const Icon = iconMap[service.icon] || Zap;

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-[#111318] py-20 md:py-28">
        <div className="absolute inset-0">
          <div className="absolute -top-[200px] -right-[200px] h-[600px] w-[600px] rounded-full bg-[#FFC62C]/[0.06] blur-[120px]" />
          <div className="absolute -bottom-[100px] -left-[100px] h-[400px] w-[400px] rounded-full bg-[#FFC62C]/[0.03] blur-[100px]" />
        </div>
        <div className="container relative mx-auto px-4 md:px-6">
          <Link
            href="/leistungen"
            className="inline-flex items-center text-sm text-[#8B8F97] hover:text-[#FFC62C] transition-colors mb-8"
          >
            ← Alle Leistungen
          </Link>
          <div className="max-w-3xl">
            <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-[#FFC62C]/10 text-[#FFC62C]">
              <Icon className="h-8 w-8" />
            </div>
            <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl md:text-6xl !leading-[1.05]">
              {service.title}
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-[#8B8F97] md:text-xl">
              {service.shortDescription}
            </p>
            <div className="mt-10">
              <Button
                asChild
                size="lg"
                className="h-14 px-8 text-base font-bold bg-[#FFC62C] text-[#111318] hover:bg-[#e6b228] rounded-xl shadow-[0_0_30px_rgba(255,198,44,0.3)]"
              >
                <Link href="/onboarding">
                  Projekt starten
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Ideal For */}
      <section className="py-16 md:py-20 bg-[#f8f8f6]">
        <div className="container mx-auto px-4 md:px-6">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-[#FFC62C]">
              Ideal für
            </p>
            <p className="mt-4 text-xl leading-relaxed text-muted-foreground md:text-2xl">
              {service.idealFor}
            </p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 md:py-28">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-[#FFC62C]">
              Leistungsumfang
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">
              Was enthalten ist
            </h2>
          </div>
          <div className="mx-auto mt-12 grid max-w-4xl gap-4 md:grid-cols-2">
            {service.features.map((feature, i) => (
              <div
                key={i}
                className="flex items-start gap-4 rounded-xl border bg-white p-5 shadow-sm"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#FFC62C]/10">
                  <Check className="h-4 w-4 text-[#FFC62C]" />
                </div>
                <span className="text-base font-medium">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="py-20 md:py-28 bg-[#f8f8f6]">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-[#FFC62C]">
              Der Ablauf
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">
              So läuft&apos;s ab
            </h2>
          </div>
          <div className="mx-auto mt-12 max-w-4xl">
            <div className="relative">
              {/* Vertical line */}
              <div className="absolute left-6 top-0 bottom-0 w-px bg-[#FFC62C]/20 hidden md:block" />
              <div className="space-y-8">
                {service.process.map((step) => (
                  <div key={step.step} className="flex gap-6">
                    <div className="relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#FFC62C] text-[#111318] font-black text-lg shadow-lg shadow-[#FFC62C]/20">
                      {step.step}
                    </div>
                    <div className="pt-1">
                      <h3 className="text-xl font-bold">{step.title}</h3>
                      <p className="mt-2 text-muted-foreground leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-20 md:py-28 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#393E46] via-[#2D3239] to-[#1a1d22]" />
        <div className="absolute -top-20 -right-20 h-[400px] w-[400px] rounded-full bg-[#FFC62C]/[0.08] blur-[100px]" />
        <div className="container relative mx-auto px-4 text-center md:px-6">
          <h2 className="text-3xl font-bold tracking-tight text-white md:text-4xl lg:text-5xl">
            Bereit für {service.title}?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-white/60">
            Teilen Sie uns Ihre Anforderungen mit und erhalten Sie in wenigen
            Minuten eine grobe Aufwandsschätzung.
          </p>
          <Button
            asChild
            size="lg"
            className="mt-10 h-14 px-10 text-base font-semibold bg-[#FFC62C] text-[#232830] hover:bg-[#E3AA2C] shadow-lg shadow-[#FFC62C]/20"
          >
            <Link href="/onboarding">
              Jetzt Projekt starten
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>
    </>
  );
}
