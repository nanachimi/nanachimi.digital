import type { Metadata } from "next";
import Link from "next/link";
import { MapPin, Clock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import KontaktBooking from "@/components/kontakt/KontaktBooking";
import RevealContact from "@/components/kontakt/RevealContact";

export const metadata: Metadata = {
  title: "Kontakt — Termin buchen oder direkt starten",
  description:
    "Nehmen Sie Kontakt auf — buchen Sie einen kostenlosen Beratungstermin oder starten Sie direkt mit dem KI-Onboarding.",
};

export default function KontaktPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-[#111318] py-20 md:py-28">
        <div className="absolute inset-0">
          <div className="absolute -top-[200px] -right-[200px] h-[600px] w-[600px] rounded-full bg-[#FFC62C]/[0.06] blur-[120px]" />
        </div>
        <div className="container relative mx-auto px-4 md:px-6">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-widest text-[#FFC62C]">
              Kontakt
            </p>
            <h1 className="mt-4 text-4xl font-black tracking-tight text-white sm:text-5xl md:text-6xl !leading-[1.05]">
              Lassen Sie uns
              <br />
              <span className="text-[#FFC62C]">sprechen.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-[#8B8F97] md:text-xl">
              Buchen Sie ein kostenloses Beratungsgespräch oder starten Sie
              direkt mit unserem KI-Onboarding.
            </p>
          </div>
        </div>
      </section>

      {/* Main Content — two-column layout */}
      <section className="py-20 md:py-28">
        <div className="container mx-auto px-4 md:px-6">
          <div className="mx-auto max-w-5xl">
            <div className="grid gap-12 lg:grid-cols-[1fr_340px]">
              {/* Left: Booking */}
              <div>
                <KontaktBooking />
              </div>

              {/* Right: Sidebar */}
              <div className="space-y-8">
                {/* Kontaktdaten */}
                <div>
                  <h2 className="text-xl font-bold">Kontaktdaten</h2>
                  <div className="mt-6 space-y-5">
                    {/* Email — hidden until click (anti-spam) */}
                    <RevealContact
                      type="email"
                      encoded={Buffer.from("info@nanachimi.digital").toString("base64")}
                      label="E-Mail"
                    />

                    {/* Standort */}
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#FFC62C]/10">
                        <MapPin className="h-4 w-4 text-[#FFC62C]" />
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wider text-muted-foreground">
                          Standort
                        </p>
                        <p className="text-sm font-medium">Mannheim, Deutschland</p>
                      </div>
                    </div>

                    {/* Antwortzeit */}
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#FFC62C]/10">
                        <Clock className="h-4 w-4 text-[#FFC62C]" />
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wider text-muted-foreground">
                          Antwortzeit
                        </p>
                        <p className="text-sm font-medium">Innerhalb von 24 Stunden</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Schneller starten */}
                <div className="rounded-xl border bg-[#f8f8f6] p-6">
                  <h3 className="font-bold">Lieber direkt loslegen?</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Nutzen Sie unser KI-Onboarding und erhalten Sie in wenigen
                    Minuten eine grobe Aufwandsschätzung — ohne Termin, ohne
                    Wartezeit.
                  </p>
                  <Button
                    asChild
                    size="sm"
                    className="mt-4 bg-[#FFC62C] text-[#111318] hover:bg-[#e6b228]"
                  >
                    <Link href="/onboarding">
                      Projekt starten
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
