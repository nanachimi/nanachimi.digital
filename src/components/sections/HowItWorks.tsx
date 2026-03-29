import { ClipboardList, Calculator, Rocket } from "lucide-react";

const steps = [
  {
    step: 1,
    title: "Anforderungen teilen",
    description:
      "Beschreiben Sie Ihr Projekt in wenigen Minuten über unser Online-Tool. Kein Verkaufsgespräch nötig.",
    icon: ClipboardList,
    accent: "from-[#FFC62C] to-[#FF9500]",
  },
  {
    step: 2,
    title: "Sofort Schätzung erhalten",
    description:
      "Sie erhalten direkt eine grobe Aufwandsschätzung — transparent und nachvollziehbar.",
    icon: Calculator,
    accent: "from-[#FFC62C] to-[#E3AA2C]",
  },
  {
    step: 3,
    title: "In 48h live",
    description:
      "Nach dem Onboarding-Call starten wir direkt. Ausgewählte MVPs gehen in 48 Stunden live.",
    icon: Rocket,
    accent: "from-[#FFC62C] to-[#FFD700]",
  },
];

export function HowItWorks() {
  return (
    <section className="relative py-24 md:py-32 bg-[#111318] overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-[#FFC62C]/[0.03] blur-[150px]" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,198,44,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,198,44,0.5) 1px, transparent 1px)`,
            backgroundSize: "80px 80px",
          }}
        />
      </div>

      <div className="container relative mx-auto px-4 md:px-6">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-[#FFC62C]">
            Der Prozess
          </p>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-white md:text-4xl lg:text-5xl">
            So funktioniert&apos;s
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-[#8B8F97]">
            Vom ersten Kontakt bis zur fertigen App — in drei einfachen
            Schritten.
          </p>
        </div>

        <div className="mt-16 grid gap-8 md:grid-cols-3">
          {steps.map((item, index) => (
            <div key={item.step} className="group relative">
              {/* Connecting line */}
              {index < steps.length - 1 && (
                <div className="absolute right-0 top-12 hidden h-px w-full translate-x-1/2 bg-gradient-to-r from-[#FFC62C]/30 via-[#FFC62C]/10 to-transparent md:block" />
              )}

              <div className="relative rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-sm p-8 transition-all hover:border-[#FFC62C]/20 hover:bg-white/[0.05]">
                {/* Step number */}
                <div className="absolute -top-4 left-8">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br ${item.accent} text-sm font-black text-[#111318] shadow-lg shadow-[#FFC62C]/20`}>
                    {item.step}
                  </div>
                </div>

                {/* Icon */}
                <div className="mt-4 mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-[#FFC62C]/10">
                  <item.icon className="h-7 w-7 text-[#FFC62C]" />
                </div>

                <h3 className="text-xl font-bold text-white">{item.title}</h3>
                <p className="mt-3 text-[#8B8F97] leading-relaxed">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
