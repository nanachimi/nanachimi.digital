import type { Metadata } from "next";
import { Users, Euro, Clock, Share2 } from "lucide-react";
import { AffiliateApplyForm } from "@/components/affiliates/AffiliateApplyForm";

export const metadata: Metadata = {
  title: "Partnerprogramm — nanachimi.digital",
  description:
    "Werden Sie Partner und verdienen Sie an jedem Kunden, den Sie für 2 Jahre empfehlen. Konfigurierbarer Kommissionssatz, transparente Auszahlungen.",
};

const BENEFITS = [
  {
    icon: Euro,
    title: "Konfigurierbare Kommission",
    text: "Individueller Satz pro Partner. Sie wissen immer genau, was Sie verdienen.",
  },
  {
    icon: Clock,
    title: "2 Jahre Laufzeit",
    text: "Sie werden an jeder Zahlung Ihres Kunden während 2 Jahren beteiligt — auch an Folgeprojekten.",
  },
  {
    icon: Share2,
    title: "Eigener Empfehlungslink",
    text: "Persönlicher Link und Gutscheincode — einmal teilen, automatische Zuordnung.",
  },
  {
    icon: Users,
    title: "Transparentes Dashboard",
    text: "Alle Empfehlungen, Kommissionen und Auszahlungen auf einen Blick.",
  },
];

export default function AffiliatesPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-[#111318] py-20 md:py-28">
        <div className="absolute inset-0">
          <div className="absolute -top-[200px] -right-[200px] h-[600px] w-[600px] rounded-full bg-[#FFC62C]/[0.06] blur-[120px]" />
          <div className="absolute -bottom-[200px] -left-[200px] h-[500px] w-[500px] rounded-full bg-[#FFC62C]/[0.04] blur-[100px]" />
        </div>

        <div className="container relative mx-auto px-4 md:px-6">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-[#FFC62C]">
              Partnerprogramm
            </p>
            <h1 className="mt-4 text-4xl font-black tracking-tight text-white md:text-5xl lg:text-6xl">
              Empfehlen. Verdienen. Wiederholen.
            </h1>
            <p className="mt-6 text-lg text-[#c0c3c9] md:text-xl">
              Kennen Sie Gründer, Kleingewerbe oder Unternehmen, die eine
              digitale Lösung brauchen? Werden Sie Partner und verdienen Sie an
              jedem Kunden, den Sie für <strong className="text-white">2 Jahre</strong>{" "}
              empfehlen.
            </p>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="bg-[#111318] py-12 md:py-16">
        <div className="container mx-auto px-4 md:px-6">
          <div className="mx-auto grid max-w-5xl gap-4 md:grid-cols-2 lg:grid-cols-4">
            {BENEFITS.map(({ icon: Icon, title, text }) => (
              <div
                key={title}
                className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6"
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-[#FFC62C]/10 text-[#FFC62C]">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mb-2 text-base font-semibold text-white">
                  {title}
                </h3>
                <p className="text-sm text-[#8B8F97] leading-relaxed">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-[#111318] py-12 md:py-16">
        <div className="container mx-auto px-4 md:px-6">
          <div className="mx-auto max-w-3xl">
            <h2 className="mb-8 text-center text-2xl font-bold text-white md:text-3xl">
              So funktioniert es
            </h2>
            <ol className="space-y-4">
              {[
                {
                  n: 1,
                  title: "Bewerben",
                  text: "Kurzes Formular ausfüllen. Wir prüfen jede Bewerbung persönlich.",
                },
                {
                  n: 2,
                  title: "Zugang erhalten",
                  text: "Nach Freigabe erhalten Sie Ihren Login, Ihren Empfehlungslink und Zugriff auf alle laufenden Kampagnen.",
                },
                {
                  n: 3,
                  title: "Gutscheincode generieren",
                  text: "Wählen Sie einen Kampagne, vergeben Sie Ihr persönliches Suffix — fertig ist Ihr eigener Gutscheincode.",
                },
                {
                  n: 4,
                  title: "Teilen & verdienen",
                  text: "Sobald ein Kunde über Ihren Link oder Code zahlt, wird die Kommission automatisch gutgeschrieben.",
                },
              ].map((s) => (
                <li
                  key={s.n}
                  className="flex items-start gap-4 rounded-xl border border-white/[0.06] bg-white/[0.02] p-5"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#FFC62C] text-sm font-bold text-[#111318]">
                    {s.n}
                  </div>
                  <div>
                    <p className="font-semibold text-white">{s.title}</p>
                    <p className="mt-1 text-sm text-[#8B8F97]">{s.text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* Application form */}
      <section className="bg-[#111318] py-12 md:py-20">
        <div className="container mx-auto px-4 md:px-6">
          <div className="mx-auto max-w-2xl">
            <div className="mb-8 text-center">
              <h2 className="text-2xl font-bold text-white md:text-3xl">
                Jetzt bewerben
              </h2>
              <p className="mt-3 text-sm text-[#8B8F97]">
                Wir prüfen Ihre Bewerbung persönlich und melden uns innerhalb
                weniger Werktage.
              </p>
            </div>
            <AffiliateApplyForm />
          </div>
        </div>
      </section>
    </>
  );
}
