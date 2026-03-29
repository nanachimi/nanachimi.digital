import type { Metadata } from "next";
import Link from "next/link";
import { Check, X, Clock, FileText, CalendarDays, Package, Headphones } from "lucide-react";
import { BETRIEB_UND_WARTUNG } from "@/lib/constants";
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

          {/* Was Sie bekommen */}
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6 mb-6">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Package className="h-5 w-5 text-[#FFC62C]" />
              Was Sie bekommen
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 mb-4">
              <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-3">
                <p className="text-xs text-[#8B8F97] uppercase tracking-wider">Plattform</p>
                <p className="text-white font-medium mt-1">
                  {PROJEKTTYP_LABELS[submission.projekttyp] || submission.projekttyp}
                </p>
              </div>
              <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-3">
                <p className="text-xs text-[#8B8F97] uppercase tracking-wider">Design</p>
                <p className="text-white font-medium mt-1">
                  {DESIGN_LABELS[submission.designLevel] || submission.designLevel}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {submission.funktionen.map((f) => (
                <span
                  key={f}
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.1] bg-white/[0.04] px-3 py-1 text-sm text-[#c8cad0]"
                >
                  <Check className="h-3 w-3 text-[#FFC62C]" />
                  {f}
                </span>
              ))}
            </div>
          </div>

          {/* Zeitplan */}
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6 mb-6">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-[#FFC62C]" />
              Zeitplan
            </h2>
            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#FFC62C] text-sm font-bold text-[#111318]">1</div>
                <div>
                  <p className="text-sm font-medium text-white">Erste Version live</p>
                  <p className="text-xs text-[#8B8F97]">{ZEITRAHMEN_MVP_LABELS[submission.zeitrahmenMvp] || submission.zeitrahmenMvp}</p>
                </div>
              </div>
              <div className="w-px h-4 bg-[#FFC62C]/20 ml-4" />
              <div className="flex items-center gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#FFC62C]/20 text-sm font-bold text-[#FFC62C]">2</div>
                <div>
                  <p className="text-sm font-medium text-white">Fertige Lösung</p>
                  <p className="text-xs text-[#8B8F97]">{ZEITRAHMEN_FINAL_LABELS[submission.zeitrahmenFinal] || submission.zeitrahmenFinal}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Was wir für Sie erledigen — user stories in Klartext */}
          {plan && plan.anforderungen?.userStories?.length > 0 && (
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6 mb-6">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Check className="h-5 w-5 text-[#FFC62C]" />
                Was wir für Sie umsetzen
              </h2>
              <div className="space-y-2">
                {plan.anforderungen.userStories.map((story, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 rounded-lg bg-white/[0.03] border border-white/[0.06] p-3"
                  >
                    <Check className="h-4 w-4 mt-0.5 shrink-0 text-[#FFC62C]" />
                    <p className="text-sm text-[#c0c3c9]">
                      {story.aktion} — <span className="text-[#8B8F97]">{story.nutzen}</span>
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Betreuung nach dem Start */}
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6 mb-6">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Headphones className="h-5 w-5 text-[#FFC62C]" />
              Betreuung nach dem Start
            </h2>
            <div className="rounded-lg bg-[#FFC62C]/[0.03] border border-[#FFC62C]/10 p-3 mb-4">
              <p className="text-sm text-[#FFC62C] font-medium">
                {BETRIEB_UND_WARTUNG.hinweis}
              </p>
            </div>
            {plan?.betriebUndWartung && (
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-3">
                  <p className="text-xs text-[#8B8F97] mb-1">Im Festpreis enthalten</p>
                  <p className="text-sm text-white font-medium">{plan.betriebUndWartung.vertragslaufzeit}</p>
                </div>
                <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-3">
                  <p className="text-xs text-[#8B8F97] mb-1">Danach optional</p>
                  <p className="text-sm text-[#c0c3c9]">Ab 29 €/Monat</p>
                </div>
              </div>
            )}
          </div>

          {/* Nächste Schritte — nur bei "sent" (nicht angenommen) */}
          {angebot.status === "sent" && (
            <div className="rounded-2xl border border-[#FFC62C]/10 bg-[#FFC62C]/[0.03] p-6 mb-6">
              <h2 className="text-lg font-bold text-white mb-3">So geht es weiter</h2>
              <div className="space-y-2 text-sm text-[#c0c3c9]">
                <p>1. Angebot prüfen und annehmen</p>
                <p>2. Zahlungsart wählen (12% Rabatt bei Sofortzahlung)</p>
                <p>3. Kickoff-Termin — wir starten mit der Umsetzung</p>
              </div>
            </div>
          )}

          {/* Disclaimer */}
          <p className="mt-8 text-center text-xs text-[#5a5e66]">
            {angebot.status === "accepted"
              ? "Dieses Angebot ist verbindlich. Bei Fragen erreichen Sie uns jederzeit unter info@nanachimi.digital."
              : "Dieses Angebot ist verbindlich und basiert auf den angegebenen Anforderungen. Bei Fragen antworten Sie einfach auf die E-Mail."}
          </p>
        </div>
      </div>
    </section>
  );
}
