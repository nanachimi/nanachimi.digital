import type { Metadata } from "next";
import Link from "next/link";
import { Check, X, Clock, FileText, Server, Code, Shield, CreditCard, Wrench } from "lucide-react";
import { ZAHLUNGSBEDINGUNGEN, BETRIEB_UND_WARTUNG } from "@/lib/constants";
import { getSubmissionById } from "@/lib/submissions";
import { getAngebotById } from "@/lib/angebote";
import { AngebotActions } from "@/components/onboarding/AngebotActions";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const metadata: Metadata = {
  title: "Ihr Angebot",
  description: "Prüfen und bestätigen Sie Ihr individuelles Angebot.",
};

const PROJEKTTYP_LABELS: Record<string, string> = {
  web: "Web-App",
  mobile: "Mobile App",
  desktop: "Desktop App",
  beides: "Mehrere Plattformen",
  unsicher: "Noch zu klären",
};

const DESIGN_LABELS: Record<string, string> = {
  standard: "Standard",
  individuell: "Individuell",
  premium: "Premium",
};

const ZEITRAHMEN_MVP_LABELS: Record<string, string> = {
  "48h": "48 Stunden",
  "1-2wochen": "1-2 Wochen",
  "1monat": "1 Monat",
  flexibel: "Flexibel",
};

const ZEITRAHMEN_FINAL_LABELS: Record<string, string> = {
  "1monat": "1 Monat",
  "2-3monate": "2-3 Monate",
  "6monate": "6 Monate",
  laufend: "Laufend",
};

const PRIORITAET_COLORS: Record<string, string> = {
  must: "bg-red-400/10 text-red-400 border-red-400/20",
  should: "bg-yellow-400/10 text-yellow-400 border-yellow-400/20",
  could: "bg-green-400/10 text-green-400 border-green-400/20",
};

export default async function AngebotPage({ params }: PageProps) {
  const { id } = await params;

  // Look up Angebot by ID
  const angebot = await getAngebotById(id);

  if (!angebot) {
    return (
      <section className="min-h-screen bg-[#111318] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">
            Angebot nicht gefunden
          </h1>
          <p className="text-[#8B8F97] mb-6">
            Dieses Angebot existiert nicht oder ist abgelaufen.
          </p>
          <Link href="/" className="text-[#FFC62C] hover:underline">
            Zur Startseite
          </Link>
        </div>
      </section>
    );
  }

  // Get the linked Anfrage for project details
  const submission = await getSubmissionById(angebot.submissionId);
  if (!submission) {
    return (
      <section className="min-h-screen bg-[#111318] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">
            Anfrage nicht gefunden
          </h1>
          <p className="text-[#8B8F97] mb-6">
            Die zugehörige Anfrage konnte nicht gefunden werden.
          </p>
          <Link href="/" className="text-[#FFC62C] hover:underline">
            Zur Startseite
          </Link>
        </div>
      </section>
    );
  }

  // Draft — not yet sent to customer
  if (angebot.status === "draft") {
    return (
      <section className="min-h-screen bg-[#111318]">
        <div className="container mx-auto px-4 py-20 md:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[#FFC62C]/10">
              <Clock className="h-8 w-8 text-[#FFC62C]" />
            </div>
            <h1 className="text-3xl font-bold text-white">
              Angebot wird erstellt
            </h1>
            <p className="mt-4 text-lg text-[#8B8F97]">
              Ihr Angebot wird gerade vorbereitet. Sie erhalten eine E-Mail,
              sobald es bereit ist.
            </p>
          </div>
        </div>
      </section>
    );
  }

  // Rejected by client — simple message
  if (angebot.status === "rejected_by_client") {
    return (
      <section className="min-h-screen bg-[#111318]">
        <div className="container mx-auto px-4 py-20 md:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-white/[0.06]">
              <X className="h-8 w-8 text-[#8B8F97]" />
            </div>
            <h1 className="text-3xl font-bold text-white">Angebot abgelehnt</h1>
            <p className="mt-4 text-lg text-[#8B8F97]">
              Dieses Angebot wurde abgelehnt.
            </p>
          </div>
        </div>
      </section>
    );
  }

  // Accepted — show full Angebot + payment + project download (falls through to the main render below)

  // Sent — show the full Angebot for accept/reject
  const formatter = new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  const { plan } = angebot;

  return (
    <section className="relative min-h-screen bg-[#111318]">
      <div className="absolute inset-0">
        <div className="absolute top-0 right-0 h-[400px] w-[400px] rounded-full bg-[#FFC62C]/[0.04] blur-[120px]" />
        <div className="absolute bottom-0 left-0 h-[300px] w-[300px] rounded-full bg-[#FFC62C]/[0.03] blur-[100px]" />
      </div>

      <div className="container relative mx-auto px-4 py-12 md:px-6 md:py-20">
        <div className="mx-auto max-w-2xl">
          {/* Header */}
          <div className="text-center mb-10">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[#FFC62C]/10 ring-1 ring-[#FFC62C]/20">
              <FileText className="h-8 w-8 text-[#FFC62C]" />
            </div>
            <p className="text-sm font-semibold uppercase tracking-widest text-[#FFC62C]">
              Angebot für {submission.name}
            </p>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-white md:text-4xl">
              Ihr individuelles Angebot
            </h1>
            {angebot.version > 1 && (
              <p className="mt-2 text-sm text-[#8B8F97]">
                Version {angebot.version}
              </p>
            )}
          </div>

          {/* Festpreis */}
          <div className="rounded-2xl border border-[#FFC62C]/20 bg-[#FFC62C]/[0.05] p-8 text-center mb-8">
            <p className="text-sm text-[#8B8F97] mb-2">Festpreis</p>
            <p className="text-4xl font-black text-white md:text-5xl">
              {formatter.format(angebot.festpreis)}
            </p>
            <p className="mt-2 text-sm text-[#8B8F97]">
              Aufwand: {angebot.aufwand} Personentage
            </p>
          </div>

          {/* Accept / Reject / Payment */}
          <AngebotActions
            id={id}
            initialStatus={angebot.status === "accepted" ? "accepted" : "idle"}
            festpreis={angebot.festpreis}
          />

          {/* Zahlungsbedingungen */}
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6 mb-6">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-[#FFC62C]" />
              Zahlungsbedingungen
            </h2>
            <p className="text-xs text-[#8B8F97] uppercase tracking-wider mb-3">
              Zahlungsmethode: {ZAHLUNGSBEDINGUNGEN.methode}
            </p>
            <div className="space-y-2">
              {ZAHLUNGSBEDINGUNGEN.tranchen.map((tranche, i) => {
                const t1 = Math.round(angebot.festpreis * 0.15);
                const t2 = Math.round(angebot.festpreis * 0.35);
                const amounts = [t1, t2, angebot.festpreis - t1 - t2];
                return (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-lg bg-white/[0.03] border border-white/[0.06] p-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-[#FFC62C] bg-[#FFC62C]/10 rounded-full px-2 py-0.5 min-w-[40px] text-center">
                        {tranche.prozent}%
                      </span>
                      <span className="text-sm text-[#c0c3c9]">
                        {tranche.label}
                      </span>
                    </div>
                    <span className="text-sm font-semibold text-white">
                      {formatter.format(amounts[i])}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Project summary */}
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6 mb-6">
            <h2 className="text-lg font-bold text-white mb-4">
              Projektübersicht
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <p className="text-xs text-[#8B8F97] uppercase tracking-wider">
                  Projekttyp
                </p>
                <p className="text-white font-medium mt-1">
                  {PROJEKTTYP_LABELS[submission.projekttyp] || submission.projekttyp}
                </p>
              </div>
              <div>
                <p className="text-xs text-[#8B8F97] uppercase tracking-wider">
                  Design
                </p>
                <p className="text-white font-medium mt-1">
                  {DESIGN_LABELS[submission.designLevel] || submission.designLevel}
                </p>
              </div>
              <div>
                <p className="text-xs text-[#8B8F97] uppercase tracking-wider">
                  MVP-Lieferung
                </p>
                <p className="text-white font-medium mt-1">
                  {ZEITRAHMEN_MVP_LABELS[submission.zeitrahmenMvp] || submission.zeitrahmenMvp}
                </p>
              </div>
              <div>
                <p className="text-xs text-[#8B8F97] uppercase tracking-wider">
                  Endlieferung
                </p>
                <p className="text-white font-medium mt-1">
                  {ZEITRAHMEN_FINAL_LABELS[submission.zeitrahmenFinal] || submission.zeitrahmenFinal}
                </p>
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6 mb-6">
            <h2 className="text-lg font-bold text-white mb-4">
              Enthaltene Features
            </h2>
            <div className="flex flex-wrap gap-2">
              {submission.funktionen.map((f) => (
                <span
                  key={f}
                  className="rounded-full border border-white/[0.1] bg-white/[0.04] px-3 py-1 text-sm text-[#c8cad0]"
                >
                  {f}
                </span>
              ))}
            </div>
          </div>

          {/* Project Plan */}
          {plan && (
            <>
              {/* Requirements */}
              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6 mb-6">
                <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Check className="h-5 w-5 text-[#FFC62C]" />
                  Anforderungen
                </h2>
                <div className="space-y-2">
                  {plan.anforderungen.userStories.map((story, i) => (
                    <div
                      key={i}
                      className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-3 flex items-start gap-3"
                    >
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase border ${PRIORITAET_COLORS[story.prioritaet] || ""}`}
                      >
                        {story.prioritaet}
                      </span>
                      <p className="text-sm text-[#c0c3c9]">
                        Als <span className="text-white font-medium">{story.rolle}</span>{" "}
                        möchte ich {story.aktion}, damit {story.nutzen}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Architecture */}
              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6 mb-6">
                <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Server className="h-5 w-5 text-[#FFC62C]" />
                  Architektur
                </h2>
                <p className="text-sm text-[#c0c3c9] mb-4">
                  {plan.architektur.beschreibung}
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-3">
                    <p className="text-xs text-[#8B8F97] uppercase tracking-wider mb-1">
                      Datenfluss
                    </p>
                    <p className="text-sm text-[#c0c3c9]">
                      {plan.architektur.datenfluss}
                    </p>
                  </div>
                  <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-3">
                    <p className="text-xs text-[#8B8F97] uppercase tracking-wider mb-1">
                      Datenmodell
                    </p>
                    <p className="text-sm text-[#c0c3c9]">
                      {plan.architektur.datenbankmodell}
                    </p>
                  </div>
                </div>
              </div>

              {/* Tech Stack */}
              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6 mb-6">
                <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Code className="h-5 w-5 text-[#FFC62C]" />
                  Technologie-Stack
                </h2>
                <div className="grid gap-2 sm:grid-cols-2">
                  {plan.technologieStack.map((tech, i) => (
                    <div
                      key={i}
                      className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-3"
                    >
                      <span className="text-[10px] uppercase tracking-wider text-[#8B8F97]">
                        {tech.kategorie}
                      </span>
                      <p className="text-sm font-medium text-white mt-0.5">
                        {tech.technologie}
                      </p>
                      <p className="text-xs text-[#8B8F97] mt-0.5">
                        {tech.begruendung}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Critical Considerations */}
              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6 mb-8">
                <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Shield className="h-5 w-5 text-[#FFC62C]" />
                  Wichtige Hinweise
                </h2>
                <div className="space-y-2">
                  {plan.kritischePunkte.map((point, i) => (
                    <div
                      key={i}
                      className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-3"
                    >
                      <span className="text-[10px] uppercase tracking-wider text-yellow-400 bg-yellow-400/10 rounded-full px-2 py-0.5">
                        {point.kategorie}
                      </span>
                      <p className="text-sm text-[#c0c3c9] mt-1.5">
                        {point.beschreibung}
                      </p>
                      <p className="text-xs text-green-400 mt-1">
                        → {point.empfehlung}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
              {/* Betrieb & Wartung */}
              {plan.betriebUndWartung && (
                <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6 mb-8">
                  <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Wrench className="h-5 w-5 text-[#FFC62C]" />
                    Betrieb &amp; Wartung
                  </h2>
                  <div className="rounded-lg bg-[#FFC62C]/[0.03] border border-[#FFC62C]/10 p-3 mb-4">
                    <p className="text-sm text-[#FFC62C] font-medium">
                      {BETRIEB_UND_WARTUNG.hinweis}
                    </p>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-[#8B8F97] uppercase tracking-wider mb-1">Leistungsumfang</p>
                      <p className="text-sm text-[#c0c3c9]">{plan.betriebUndWartung.umfang}</p>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-3">
                      <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-3">
                        <p className="text-xs text-[#8B8F97] uppercase tracking-wider mb-1">Vertragslaufzeit</p>
                        <p className="text-sm text-white font-medium">{plan.betriebUndWartung.vertragslaufzeit}</p>
                      </div>
                      <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-3">
                        <p className="text-xs text-[#8B8F97] uppercase tracking-wider mb-1">Abo-Optionen</p>
                        <p className="text-sm text-[#c0c3c9]">{plan.betriebUndWartung.aboOptionen || "3 Mo: 69€/Mo, 6 Mo: 49€/Mo, 12 Mo: 29€/Mo"}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-[#8B8F97] uppercase tracking-wider mb-1">SLA</p>
                      <p className="text-sm text-[#c0c3c9]">{plan.betriebUndWartung.sla}</p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Disclaimer */}
          <p className="mt-8 text-center text-xs text-[#5a5e66]">
            Dieses Angebot ist unverbindlich und basiert auf den angegebenen
            Anforderungen. Der finale Preis wird nach detaillierter Abstimmung
            festgelegt.
          </p>
        </div>
      </div>
    </section>
  );
}
