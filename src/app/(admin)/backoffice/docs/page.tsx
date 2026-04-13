"use client";

import { useState, useMemo } from "react";
import {
  Search,
  BookOpen,
  Code2,
  Euro,
  FileText,
  Users,
  Shield,
  Server,
  Webhook,
  Database,
  Layers,
  ChevronDown,
  ChevronRight,
  Tag,
  Clock,
  AlertTriangle,
  CreditCard,
  Wrench,
  BarChart3,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DocSection {
  id: string;
  title: string;
  icon: React.ElementType;
  category: "business" | "developer";
  tags: string[];
  /** Plain-text summary of the section content for full-text keyword search. */
  searchText: string;
  content: React.ReactNode;
}

// ---------------------------------------------------------------------------
// Documentation content
// ---------------------------------------------------------------------------

const DOC_SECTIONS: DocSection[] = [
  // ── Business Documentation ──────────────────────────────────────────────

  {
    id: "pricing-overview",
    title: "Preismodell & Kalkulation",
    icon: Euro,
    category: "business",
    tags: [
      "preis", "pricing", "kalkulation", "festpreis", "wochensatz", "tagessatz",
      "aufwand", "personentage", "kosten", "rate", "weekly", "daily",
    ],
    searchText: "Festpreis Personentage Tagessatz Wochensatz 48 Stunden 1000 700 600 495 Multiplikatoren Plattform Web Mobile Desktop Nutzerrollen Design-Level Standard Individuell Premium Demand-Faktor Aufschlag aktive Projekte Kapazitat Einstellungen editierbar",
    content: (
      <div className="space-y-4">
        <p>
          Der Festpreis ergibt sich aus der Anzahl der Personentage multipliziert
          mit dem Tagessatz. Der Tagessatz leitet sich vom Wochensatz ab
          (5 Arbeitstage pro Woche).
        </p>
        <h4 className="text-sm font-bold text-white">Wochensatze (Standard)</h4>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-left text-zinc-400">
              <th className="pb-2">Zeitrahmen</th>
              <th className="pb-2">Wochensatz</th>
              <th className="pb-2">Tagessatz</th>
            </tr>
          </thead>
          <tbody className="text-zinc-300">
            <tr className="border-b border-white/5">
              <td className="py-2">48 Stunden</td>
              <td>1.000 EUR</td>
              <td>200 EUR</td>
            </tr>
            <tr className="border-b border-white/5">
              <td className="py-2">1-2 Wochen</td>
              <td>700 EUR</td>
              <td>140 EUR</td>
            </tr>
            <tr className="border-b border-white/5">
              <td className="py-2">1 Monat</td>
              <td>600 EUR</td>
              <td>120 EUR</td>
            </tr>
            <tr>
              <td className="py-2">Flexibel</td>
              <td>495 EUR</td>
              <td>99 EUR</td>
            </tr>
          </tbody>
        </table>
        <h4 className="text-sm font-bold text-white mt-4">Multiplikatoren</h4>
        <ul className="list-disc list-inside text-zinc-300 space-y-1 text-sm">
          <li><strong>Plattform:</strong> Web 1.0x, Mobile 1.3x, Desktop 1.4x, Beides 1.8x</li>
          <li><strong>Nutzerrollen:</strong> 1 Rolle 1.0x, 2 Rollen 1.15x, 3+ Rollen 1.35x</li>
          <li><strong>Design-Level:</strong> Standard 1.0x, Individuell 1.2x, Premium 1.4x</li>
        </ul>
        <h4 className="text-sm font-bold text-white mt-4">Demand-Faktor</h4>
        <p className="text-sm text-zinc-300">
          Bei hoher Auslastung wird ein Aufschlag berechnet:
          <code className="mx-1 px-1.5 py-0.5 bg-white/5 rounded text-xs">
            1.0 + (aktiveProjekte / maxKapazitat) x maxAufschlag
          </code>.
          Aktuell: max. 3 Projekte, max. 20% Aufschlag. Admin-Override ist in den
          Einstellungen konfigurierbar.
        </p>
        <div className="mt-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs">
          Alle Wochensatze, Feature-Kosten und Multiplikatoren sind in den{" "}
          <strong>Einstellungen</strong> editierbar.
        </div>
      </div>
    ),
  },
  {
    id: "payment-options",
    title: "Zahlungsoptionen & Rabatte",
    icon: CreditCard,
    category: "business",
    tags: [
      "zahlung", "payment", "rabatt", "discount", "vollzahlung", "anzahlung",
      "tranche", "raten", "promo", "gutschein", "stripe", "checkout",
    ],
    searchText: "Sofort komplett zahlen 100% 12% 50% Anzahlung 5% 15% Tranchen Projektstart MVP-Lieferung Go-Live Ubergabe Rabatt-Stacking additiv kombiniert Maximaler Gesamtrabatt 50% gekappt Betreuungskosten nie rabattiert",
    content: (
      <div className="space-y-4">
        <h4 className="text-sm font-bold text-white">Zahlungsarten</h4>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-left text-zinc-400">
              <th className="pb-2">Option</th>
              <th className="pb-2">Anteil</th>
              <th className="pb-2">Rabatt</th>
            </tr>
          </thead>
          <tbody className="text-zinc-300">
            <tr className="border-b border-white/5">
              <td className="py-2">Sofort komplett zahlen</td>
              <td>100%</td>
              <td className="text-emerald-400">12%</td>
            </tr>
            <tr className="border-b border-white/5">
              <td className="py-2">50% Anzahlung</td>
              <td>50%</td>
              <td className="text-emerald-400">5%</td>
            </tr>
            <tr>
              <td className="py-2">15% Anzahlung (Tranchen)</td>
              <td>15%</td>
              <td className="text-zinc-500">0%</td>
            </tr>
          </tbody>
        </table>

        <h4 className="text-sm font-bold text-white mt-4">Tranchen-Modell (15%)</h4>
        <ol className="list-decimal list-inside text-zinc-300 space-y-1 text-sm">
          <li>15% vor Projektstart</li>
          <li>35% nach MVP-Lieferung</li>
          <li>50% vor Go-Live / vor Ubergabe</li>
        </ol>

        <h4 className="text-sm font-bold text-white mt-4">Rabatt-Stacking</h4>
        <p className="text-sm text-zinc-300">
          Promo-Rabatt und Zahlungsrabatt werden <strong>additiv</strong> kombiniert.
          Beispiel: 25% Promo + 12% Vollzahlung = 37% Gesamtrabatt.
        </p>
        <div className="mt-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-xs">
          <strong>Maximaler Gesamtrabatt: 50%.</strong> Alles daruber wird gekappt.
          Betreuungskosten werden nie rabattiert.
        </div>
      </div>
    ),
  },
  {
    id: "betreuung",
    title: "Betrieb & Wartung (Betreuung)",
    icon: Wrench,
    category: "business",
    tags: [
      "betreuung", "betrieb", "wartung", "monitoring", "updates", "bugfix",
      "abo", "paket", "maintenance", "hosting",
    ],
    searchText: "1 Monat inklusive Festpreis Pakete 3 Monate 69 EUR 207 6 Monate 49 EUR 294 12 Monate 29 EUR 348 separate Position Rechnung Stripe Line Item nicht rabattiert Annahme Angebot",
    content: (
      <div className="space-y-4">
        <p className="text-sm text-zinc-300">
          1 Monat Betrieb & Wartung (Monitoring, Updates, Bugfixes) ist im
          Festpreis enthalten. Danach optional als Abo buchbar.
        </p>
        <h4 className="text-sm font-bold text-white">Pakete</h4>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-left text-zinc-400">
              <th className="pb-2">Paket</th>
              <th className="pb-2">EUR/Monat</th>
              <th className="pb-2">Gesamt</th>
            </tr>
          </thead>
          <tbody className="text-zinc-300">
            <tr className="border-b border-white/5">
              <td className="py-2">3 Monate</td>
              <td>69 EUR</td>
              <td>207 EUR</td>
            </tr>
            <tr className="border-b border-white/5">
              <td className="py-2">6 Monate</td>
              <td>49 EUR</td>
              <td>294 EUR</td>
            </tr>
            <tr>
              <td className="py-2">12 Monate</td>
              <td>29 EUR</td>
              <td>348 EUR</td>
            </tr>
          </tbody>
        </table>

        <h4 className="text-sm font-bold text-white mt-4">Abrechnung</h4>
        <ul className="list-disc list-inside text-zinc-300 space-y-1 text-sm">
          <li>Betreuung wird als separate Position auf der Rechnung / bei Stripe abgerechnet</li>
          <li>Betreuungskosten werden <strong>nicht</strong> rabattiert (weder durch Promo noch durch Zahlungsrabatt)</li>
          <li>Kunde wahlt das Paket bei der Annahme des Angebots</li>
          <li>Im Stripe Checkout erscheint ein zweiter Line Item: &ldquo;Betrieb & Wartung — X Monate&rdquo;</li>
        </ul>
      </div>
    ),
  },
  {
    id: "promo-codes",
    title: "Promo-Codes & Kampagnen",
    icon: Tag,
    category: "business",
    tags: [
      "promo", "code", "gutschein", "kampagne", "rabatt", "discount",
      "affiliate", "partner", "coupon", "aktion",
    ],
    searchText: "Admin-Codes Kampagnencode Kleinbuchstaben startup2026 Affiliate-Codes Handle Rabattprozent sysys3525 Validierung Gross-Kleinschreibung Temporale Eindeutigkeit Fehlermeldungen inaktiv abgelaufen Stacking-Regeln additiv 50% gekappt",
    content: (
      <div className="space-y-4">
        <h4 className="text-sm font-bold text-white">Code-Formate</h4>
        <ul className="list-disc list-inside text-zinc-300 space-y-1 text-sm">
          <li><strong>Admin-Codes:</strong> Kampagnencode in Kleinbuchstaben, z.B. &ldquo;startup2026&rdquo;</li>
          <li><strong>Affiliate-Codes:</strong> Handle + Rabattprozent, z.B. &ldquo;sysys3525&rdquo; (Handle: sysys35, 25% Rabatt)</li>
        </ul>

        <h4 className="text-sm font-bold text-white mt-4">Validierung</h4>
        <ul className="list-disc list-inside text-zinc-300 space-y-1 text-sm">
          <li>Gross-/Kleinschreibung wird ignoriert</li>
          <li>Temporale Eindeutigkeit: Keine aktive Kampagne mit gleichem Code im gleichen Zeitraum</li>
          <li>Fehlermeldungen: nicht gefunden, inaktiv, abgelaufen, max. Nutzungen erreicht, Kampagne inaktiv</li>
        </ul>

        <h4 className="text-sm font-bold text-white mt-4">Stacking-Regeln</h4>
        <p className="text-sm text-zinc-300">
          Promo- und Zahlungsrabatte werden additiv kombiniert und bei 50% gekappt.
          Betreuungskosten sind nicht rabattfahig.
        </p>
      </div>
    ),
  },
  {
    id: "angebot-workflow",
    title: "Angebot-Workflow",
    icon: FileText,
    category: "business",
    tags: [
      "angebot", "workflow", "status", "draft", "sent", "accepted", "rejected",
      "ablauf", "prozess", "pdf", "email", "versand",
    ],
    searchText: "Status-Flow draft sent accepted rejected_by_client Anfrage Onboarding Submission Admin pruft bearbeitet erstellt versendet Betreuungspaket Zahlungsoption Stripe Feedback Auto-Angebot SLA uberschritten 299 4999 Termin Risiko",
    content: (
      <div className="space-y-4">
        <h4 className="text-sm font-bold text-white">Status-Flow</h4>
        <div className="flex items-center gap-2 text-sm text-zinc-300 flex-wrap">
          <span className="px-2 py-1 rounded bg-zinc-800 text-zinc-400">draft</span>
          <span className="text-zinc-600">&rarr;</span>
          <span className="px-2 py-1 rounded bg-blue-500/20 text-blue-300">sent</span>
          <span className="text-zinc-600">&rarr;</span>
          <span className="px-2 py-1 rounded bg-emerald-500/20 text-emerald-300">accepted</span>
          <span className="text-zinc-500 mx-1">oder</span>
          <span className="px-2 py-1 rounded bg-red-500/20 text-red-300">rejected_by_client</span>
        </div>

        <h4 className="text-sm font-bold text-white mt-4">Ablauf</h4>
        <ol className="list-decimal list-inside text-zinc-300 space-y-1 text-sm">
          <li>Anfrage kommt uber Onboarding rein (Submission)</li>
          <li>Admin pruft, bearbeitet und erstellt ein Angebot (draft)</li>
          <li>Admin versendet das Angebot an den Kunden (sent)</li>
          <li>Kunde wahlt optional ein Betreuungspaket und nimmt an (accepted)</li>
          <li>Kunde wahlt Zahlungsoption und bezahlt uber Stripe</li>
          <li>Bei Ablehnung: Kunde gibt Feedback, Status wird rejected_by_client</li>
        </ol>

        <h4 className="text-sm font-bold text-white mt-4">Auto-Angebot</h4>
        <p className="text-sm text-zinc-300">
          Wird das SLA uberschritten und der Preis liegt zwischen 299 EUR und 4.999 EUR,
          wird automatisch ein Angebot generiert. Voraussetzung: Kunde hat
          &ldquo;Angebot&rdquo; statt &ldquo;Termin&rdquo; gewahlt und Risiko ist nicht hoch.
        </p>
      </div>
    ),
  },
  {
    id: "affiliates",
    title: "Affiliate-Programm & Kommissionen",
    icon: Users,
    category: "business",
    tags: [
      "affiliate", "partner", "kommission", "commission", "provision",
      "referral", "empfehlung", "auszahlung", "payout",
    ],
    searchText: "Referral-Fenster 2 Jahre First-Touch Hold-Periode 14 Tage Zahlung Freigabe Berechnungsbasis Zahlungsbetrag Rabatten Multi-Tranche separate Kommission Bewerbung Partner Dashboard Login freigegeben abgelehnt",
    content: (
      <div className="space-y-4">
        <h4 className="text-sm font-bold text-white">Grundregeln</h4>
        <ul className="list-disc list-inside text-zinc-300 space-y-1 text-sm">
          <li><strong>Referral-Fenster:</strong> 2 Jahre ab First-Touch</li>
          <li><strong>Hold-Periode:</strong> 14 Tage nach Zahlung, dann automatische Freigabe</li>
          <li><strong>Berechnungsbasis:</strong> Tatsachlicher Zahlungsbetrag (nach allen Rabatten)</li>
          <li><strong>Multi-Tranche:</strong> Separate Kommission pro Zahlung</li>
        </ul>

        <h4 className="text-sm font-bold text-white mt-4">Bewerbung & Freigabe</h4>
        <p className="text-sm text-zinc-300">
          Partner bewerben sich uber <code className="px-1 py-0.5 bg-white/5 rounded text-xs">/affiliates</code>.
          Bewerbungen werden im Backoffice unter &ldquo;Partner&rdquo; gepruft
          und entweder freigegeben (mit eigenem Login + Dashboard) oder abgelehnt.
        </p>
      </div>
    ),
  },
  {
    id: "estimation",
    title: "Schatzung & Risikobewertung",
    icon: BarChart3,
    category: "business",
    tags: [
      "schatzung", "estimation", "risiko", "risk", "sla", "aufwand",
      "personentage", "range", "feature", "funktionen",
    ],
    searchText: "Zwei-Stufen-Kalkulation Vorlaufige Schatzung Preisspanne Festpreis Admin automatisch E-Mail Risikostufen Niedrig Mittel Hoch 30 60 120 Minuten Feature-Kosten Personentage Anmeldung Benutzerkonten Verwaltungsbereich Online bezahlen Chat Suche Filter Dateien Systemintegration Sprachen Auswertungen Statistiken Zugriffsrechte",
    content: (
      <div className="space-y-4">
        <h4 className="text-sm font-bold text-white">Zwei-Stufen-Kalkulation</h4>
        <ol className="list-decimal list-inside text-zinc-300 space-y-1 text-sm">
          <li><strong>Vorlaufige Schatzung:</strong> Preisspanne wird dem Kunden nach dem Onboarding angezeigt</li>
          <li><strong>Festpreis:</strong> Vom Admin festgelegt oder automatisch generiert, per E-Mail versendet</li>
        </ol>

        <h4 className="text-sm font-bold text-white mt-4">Risikostufen</h4>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-left text-zinc-400">
              <th className="pb-2">Stufe</th>
              <th className="pb-2">Features</th>
              <th className="pb-2">SLA</th>
            </tr>
          </thead>
          <tbody className="text-zinc-300">
            <tr className="border-b border-white/5">
              <td className="py-2 text-emerald-400">Niedrig</td>
              <td>&le; 5</td>
              <td>30 Min.</td>
            </tr>
            <tr className="border-b border-white/5">
              <td className="py-2 text-amber-400">Mittel</td>
              <td>&le; 8</td>
              <td>60 Min.</td>
            </tr>
            <tr>
              <td className="py-2 text-red-400">Hoch</td>
              <td>&gt; 8</td>
              <td>120 Min.</td>
            </tr>
          </tbody>
        </table>

        <h4 className="text-sm font-bold text-white mt-4">Feature-Kosten (Personentage)</h4>
        <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm text-zinc-300">
          <span>Anmeldung & Benutzerkonten: <strong>1</strong></span>
          <span>Verwaltungsbereich: <strong>2</strong></span>
          <span>Online bezahlen: <strong>2.5</strong></span>
          <span>E-Mail-Benachrichtigungen: <strong>0.5</strong></span>
          <span>Push-Nachrichten: <strong>1</strong></span>
          <span>Chat-Funktion: <strong>2.5</strong></span>
          <span>Suche & Filter: <strong>1</strong></span>
          <span>Dateien hochladen: <strong>0.5</strong></span>
          <span>Systemintegration: <strong>1.5</strong></span>
          <span>Mehrere Sprachen: <strong>1</strong></span>
          <span>Auswertungen & Statistiken: <strong>2</strong></span>
          <span>Zugriffsrechte: <strong>1.5</strong></span>
        </div>
        <p className="text-xs text-zinc-500 mt-2">
          Eigene Features werden mit 1 PT gerechnet. Alle Werte in den Einstellungen editierbar.
        </p>
      </div>
    ),
  },
  {
    id: "onboarding-flow",
    title: "Onboarding-Flow (13 Schritte)",
    icon: Layers,
    category: "business",
    tags: [
      "onboarding", "schritt", "step", "wizard", "formular", "anfrage",
      "submission", "projekttyp", "beschreibung", "funktionen", "design",
    ],
    searchText: "Projekttyp Web Mobile Desktop Projektbeschreibung Nutzerrollen Gruppenname Funktionen vordefiniert eigene Design-Level Standard Individuell Premium Branding Logo Farben Inspiration Links Referenzen Monetarisierung Kostenlos Abo Einmalkauf Zeitrahmen MVP Endversion Budget-Rahmen Betrieb Wartung Kontaktdaten Name E-Mail Abschluss Angebot anfordern Termin buchen Promo-Code Datenbank Dashboard",
    content: (
      <div className="space-y-4">
        <ol className="list-decimal list-inside text-zinc-300 space-y-1 text-sm">
          <li>Projekttyp (Web / Mobile / Desktop / Beides / Unsicher)</li>
          <li>Projektbeschreibung (min. 10 Zeichen)</li>
          <li>Nutzerrollen (Anzahl + Gruppenname)</li>
          <li>Funktionen (vordefiniert + eigene)</li>
          <li>Design-Level (Standard / Individuell / Premium)</li>
          <li>Branding (optional — Logo, Farben)</li>
          <li>Inspiration (optional — Links, Referenzen)</li>
          <li>Monetarisierung (Kostenlos / Abo / Einmalkauf / etc.)</li>
          <li>Zeitrahmen (MVP + Endversion)</li>
          <li>Budget-Rahmen</li>
          <li>Betrieb & Wartung (Ja / Nein)</li>
          <li>Kontaktdaten (Name, E-Mail)</li>
          <li>Abschluss: Angebot anfordern oder Termin buchen</li>
        </ol>
        <p className="text-sm text-zinc-300 mt-3">
          Nach Absenden wird die Anfrage als Submission in der Datenbank gespeichert
          und erscheint im Dashboard. Optional: Promo-Code kann im letzten Schritt eingegeben werden.
        </p>
      </div>
    ),
  },

  // ── Developer Documentation ─────────────────────────────────────────────

  {
    id: "tech-stack",
    title: "Tech Stack & Architektur",
    icon: Code2,
    category: "developer",
    tags: [
      "tech", "stack", "architektur", "nextjs", "typescript", "tailwind",
      "prisma", "postgresql", "shadcn", "framework", "stripe", "hetzner",
    ],
    searchText: "Frontend Next.js App Router TypeScript strict Tailwind CSS shadcn/ui Komponenten Lucide Icons Backend API Routes PostgreSQL Source of Truth Prisma ORM Stripe Payments SeaweedFS File Storage Infra Hetzner Hosting GitHub Actions CI/CD SMTP E-Mails Externe APIs Anthropic Claude LLM Apollo.io CRM Stripe Checkout",
    content: (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm text-zinc-300">
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-2">Frontend</h4>
            <ul className="space-y-1">
              <li>Next.js (App Router)</li>
              <li>TypeScript (strict)</li>
              <li>Tailwind CSS</li>
              <li>shadcn/ui Komponenten</li>
              <li>Lucide Icons</li>
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-2">Backend</h4>
            <ul className="space-y-1">
              <li>Next.js API Routes</li>
              <li>PostgreSQL (Source of Truth)</li>
              <li>Prisma ORM</li>
              <li>Stripe (Payments)</li>
              <li>SeaweedFS (File Storage)</li>
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-2">Infra</h4>
            <ul className="space-y-1">
              <li>Hetzner (Hosting)</li>
              <li>GitHub Actions (CI/CD)</li>
              <li>SMTP (E-Mails)</li>
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-2">Externe APIs</h4>
            <ul className="space-y-1">
              <li>Anthropic Claude (LLM)</li>
              <li>Apollo.io (CRM)</li>
              <li>Stripe (Checkout)</li>
            </ul>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "api-routes",
    title: "API-Routen",
    icon: Webhook,
    category: "developer",
    tags: [
      "api", "route", "endpoint", "rest", "http", "get", "post", "patch",
      "delete", "admin", "angebot", "submission", "webhook", "stripe", "cron",
      "onboarding", "booking", "payment", "promo", "health",
    ],
    searchText: "Offentliche Endpunkte POST /api/onboarding Submission erstellen upload Dateien hochladen GET /api/estimate Schatzung berechnen /api/contact Kontaktformular /api/bookings Termin buchen PATCH /api/angebot annehmen ablehnen /api/angebot/payment Zahlung starten /api/angebot/pdf PDF herunterladen /api/promo/validate Promo-Code prufen /api/stripe/webhook Stripe-Events /api/health System-Health-Check Admin-Endpunkte Auth erforderlich /api/admin/submissions Anfragen /api/admin/angebote Angebote erstellen bearbeiten versenden Badge-Counts Analytics-Daten Cron-Jobs /api/cron/process-jobs Job-Queue /api/cron/sla-check SLA uberprufen /api/cron/commissions-approve Kommissionen freigeben",
    content: (
      <div className="space-y-4">
        <h4 className="text-sm font-bold text-white">Offentliche Endpunkte</h4>
        <div className="space-y-1 text-sm font-mono text-zinc-300">
          <div><span className="text-emerald-400 mr-2">POST</span>/api/onboarding — Submission erstellen</div>
          <div><span className="text-emerald-400 mr-2">POST</span>/api/onboarding/upload — Dateien hochladen</div>
          <div><span className="text-blue-400 mr-2">GET </span>/api/estimate — Schatzung berechnen</div>
          <div><span className="text-emerald-400 mr-2">POST</span>/api/contact — Kontaktformular</div>
          <div><span className="text-emerald-400 mr-2">POST</span>/api/bookings — Termin buchen</div>
          <div><span className="text-amber-400 mr-2">PTCH</span>/api/angebot/[id] — Angebot annehmen/ablehnen</div>
          <div><span className="text-emerald-400 mr-2">POST</span>/api/angebot/[id]/payment — Zahlung starten</div>
          <div><span className="text-blue-400 mr-2">GET </span>/api/angebot/[id]/pdf — PDF herunterladen</div>
          <div><span className="text-emerald-400 mr-2">POST</span>/api/promo/validate — Promo-Code prufen</div>
          <div><span className="text-emerald-400 mr-2">POST</span>/api/stripe/webhook — Stripe-Events</div>
          <div><span className="text-blue-400 mr-2">GET </span>/api/health — System-Health-Check</div>
        </div>

        <h4 className="text-sm font-bold text-white mt-4">Admin-Endpunkte (Auth erforderlich)</h4>
        <div className="space-y-1 text-sm font-mono text-zinc-300">
          <div><span className="text-blue-400 mr-2">GET </span>/api/admin/submissions — Alle Anfragen</div>
          <div><span className="text-amber-400 mr-2">PTCH</span>/api/admin/submissions/[id] — Anfrage bearbeiten</div>
          <div><span className="text-emerald-400 mr-2">POST</span>/api/admin/submissions/[id]/amend — Amendment</div>
          <div><span className="text-emerald-400 mr-2">POST</span>/api/admin/submissions/[id]/generate-plan — Plan generieren</div>
          <div><span className="text-blue-400 mr-2">GET </span>/api/admin/angebote — Alle Angebote</div>
          <div><span className="text-emerald-400 mr-2">POST</span>/api/admin/angebote — Angebot erstellen</div>
          <div><span className="text-amber-400 mr-2">PTCH</span>/api/admin/angebote/[id] — Angebot bearbeiten/versenden</div>
          <div><span className="text-blue-400 mr-2">GET </span>/api/admin/notifications — Badge-Counts</div>
          <div><span className="text-blue-400 mr-2">GET </span>/api/admin/analytics — Analytics-Daten</div>
        </div>

        <h4 className="text-sm font-bold text-white mt-4">Cron-Jobs</h4>
        <div className="space-y-1 text-sm font-mono text-zinc-300">
          <div><span className="text-emerald-400 mr-2">POST</span>/api/cron/process-jobs — Job-Queue abarbeiten</div>
          <div><span className="text-emerald-400 mr-2">POST</span>/api/cron/sla-check — SLA uberprufen</div>
          <div><span className="text-emerald-400 mr-2">POST</span>/api/cron/commissions-approve — Kommissionen freigeben</div>
        </div>
      </div>
    ),
  },
  {
    id: "database-schema",
    title: "Datenbank-Schema",
    icon: Database,
    category: "developer",
    tags: [
      "datenbank", "database", "schema", "prisma", "model", "tabelle",
      "postgresql", "migration", "relation", "submission", "angebot",
      "payment", "booking", "onboarding",
    ],
    searchText: "Kern-Modelle Submission Onboarding-Anfrage Projektdetails Status pending angebot_sent accepted rejected Angebot Festpreis Aufwand Plan Betreuungswahl Referenziert versioniert Payment Stripe-Zahlungen Betrag Rabatt Session-ID pending completed failed Booking Termin-Buchungen confirmed cancelled PromoCode Kampagnen-Codes Rabattwert Gultigkeitszeitraum Nutzungen Affiliate Partner-Accounts Handle Provision Login Commission Partner-Provisionen Hold-Periode auto-approved Job Incident Async Job-Queue E-Mail PDF Fehler-Tracking prisma/schema.prisma",
    content: (
      <div className="space-y-4">
        <h4 className="text-sm font-bold text-white">Kern-Modelle</h4>
        <div className="grid grid-cols-2 gap-4 text-sm text-zinc-300">
          <div>
            <h5 className="text-xs font-bold text-zinc-400 mb-1">Submission</h5>
            <p className="text-xs">Onboarding-Anfrage mit allen Projektdetails. Status: pending &rarr; angebot_sent &rarr; accepted / rejected.</p>
          </div>
          <div>
            <h5 className="text-xs font-bold text-zinc-400 mb-1">Angebot</h5>
            <p className="text-xs">Angebot mit Festpreis, Aufwand, Plan, Betreuungswahl. Referenziert Submission. Versioniert.</p>
          </div>
          <div>
            <h5 className="text-xs font-bold text-zinc-400 mb-1">Payment</h5>
            <p className="text-xs">Stripe-Zahlungen. Enthalt Betrag, Rabatt, Stripe-Session-ID, Status (pending/completed/failed).</p>
          </div>
          <div>
            <h5 className="text-xs font-bold text-zinc-400 mb-1">Booking</h5>
            <p className="text-xs">Termin-Buchungen mit Datum, Uhrzeit, Kundendaten. Status: confirmed / cancelled.</p>
          </div>
          <div>
            <h5 className="text-xs font-bold text-zinc-400 mb-1">PromoCode</h5>
            <p className="text-xs">Kampagnen-Codes mit Rabattwert, Gultigkeitszeitraum, max. Nutzungen.</p>
          </div>
          <div>
            <h5 className="text-xs font-bold text-zinc-400 mb-1">Affiliate</h5>
            <p className="text-xs">Partner-Accounts mit Handle, Provision, Login-Daten. Referenziert Kampagnen.</p>
          </div>
          <div>
            <h5 className="text-xs font-bold text-zinc-400 mb-1">Commission</h5>
            <p className="text-xs">Partner-Provisionen pro Zahlung. Hold-Periode 14 Tage, dann auto-approved.</p>
          </div>
          <div>
            <h5 className="text-xs font-bold text-zinc-400 mb-1">Job / Incident</h5>
            <p className="text-xs">Async Job-Queue (E-Mail, PDF, etc.) und System-Vorfalle / Fehler-Tracking.</p>
          </div>
        </div>
        <p className="text-xs text-zinc-500 mt-2">
          Schema-Datei:{" "}
          <code className="px-1 py-0.5 bg-white/5 rounded">prisma/schema.prisma</code>
        </p>
      </div>
    ),
  },
  {
    id: "auth-security",
    title: "Authentifizierung & Sicherheit",
    icon: Shield,
    category: "developer",
    tags: [
      "auth", "login", "sicherheit", "security", "totp", "2fa", "session",
      "cookie", "admin", "jwt", "token", "passwort",
    ],
    searchText: "Admin-Auth Session-basiert HTTP-only Cookie TOTP-basierte 2FA QR-Code Setup /api/admin requireAdmin Middleware geschutzt Affiliate-Auth separater Login Partner-Dashboard Passwort-Anderung Kundenbereich Angebots-Seiten UUID Share-Link keine Registrierung E-Mail-Verifizierung OTP-Code sensitive Aktionen",
    content: (
      <div className="space-y-4">
        <h4 className="text-sm font-bold text-white">Admin-Auth</h4>
        <ul className="list-disc list-inside text-zinc-300 space-y-1 text-sm">
          <li>Session-basiert (HTTP-only Cookie)</li>
          <li>TOTP-basierte 2FA (QR-Code Setup)</li>
          <li>Alle <code className="px-1 py-0.5 bg-white/5 rounded text-xs">/api/admin/*</code> Routen durch <code className="px-1 py-0.5 bg-white/5 rounded text-xs">requireAdmin()</code> Middleware geschutzt</li>
        </ul>

        <h4 className="text-sm font-bold text-white mt-4">Affiliate-Auth</h4>
        <ul className="list-disc list-inside text-zinc-300 space-y-1 text-sm">
          <li>Separater Login fur Partner-Dashboard</li>
          <li>Session-basiert mit <code className="px-1 py-0.5 bg-white/5 rounded text-xs">/api/affiliates/auth/*</code></li>
          <li>Passwort-Anderung moglich</li>
        </ul>

        <h4 className="text-sm font-bold text-white mt-4">Kundenbereich</h4>
        <p className="text-sm text-zinc-300">
          Angebots-Seiten sind per UUID zuganglich (Share-Link). Keine Registrierung erforderlich.
          E-Mail-Verifizierung uber OTP-Code fur sensitive Aktionen.
        </p>
      </div>
    ),
  },
  {
    id: "deployment",
    title: "Deployment & CI/CD",
    icon: Server,
    category: "developer",
    tags: [
      "deployment", "deploy", "ci", "cd", "github", "actions", "hetzner",
      "build", "pipeline", "docker", "release",
    ],
    searchText: "Pipeline Push main GitHub Actions Lint Typecheck Unit Tests Integration Tests Build next build Deployment Hetzner Testsuites npm run test:unit Vitest npm run lint ESLint npx playwright test E2E Playwright Environment sensible Werte DB URL Stripe Keys SMTP Anthropic Key Umgebungsvariablen .env.example",
    content: (
      <div className="space-y-4">
        <h4 className="text-sm font-bold text-white">Pipeline</h4>
        <ol className="list-decimal list-inside text-zinc-300 space-y-1 text-sm">
          <li>Push auf <code className="px-1 py-0.5 bg-white/5 rounded text-xs">main</code> triggert GitHub Actions</li>
          <li>Lint + Typecheck + Unit Tests + Integration Tests</li>
          <li>Build (<code className="px-1 py-0.5 bg-white/5 rounded text-xs">next build</code>)</li>
          <li>Deployment auf Hetzner</li>
        </ol>

        <h4 className="text-sm font-bold text-white mt-4">Testsuites</h4>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-left text-zinc-400">
              <th className="pb-2">Kommando</th>
              <th className="pb-2">Beschreibung</th>
            </tr>
          </thead>
          <tbody className="text-zinc-300">
            <tr className="border-b border-white/5">
              <td className="py-2 font-mono text-xs">npm run test:unit</td>
              <td>Unit + Integration Tests (Vitest)</td>
            </tr>
            <tr className="border-b border-white/5">
              <td className="py-2 font-mono text-xs">npm run lint</td>
              <td>ESLint</td>
            </tr>
            <tr>
              <td className="py-2 font-mono text-xs">npx playwright test</td>
              <td>E2E Tests (Playwright)</td>
            </tr>
          </tbody>
        </table>

        <h4 className="text-sm font-bold text-white mt-4">Environment</h4>
        <p className="text-sm text-zinc-300">
          Alle sensiblen Werte (DB URL, Stripe Keys, SMTP, Anthropic Key, etc.) werden als
          Umgebungsvariablen verwaltet. Siehe <code className="px-1 py-0.5 bg-white/5 rounded text-xs">.env.example</code> im Repository.
        </p>
      </div>
    ),
  },
  {
    id: "email-system",
    title: "E-Mail-System & Job Queue",
    icon: Clock,
    category: "developer",
    tags: [
      "email", "mail", "smtp", "job", "queue", "benachrichtigung",
      "notification", "template", "cron", "async", "onboarding", "angebot",
    ],
    searchText: "Job Queue Asynchrone Jobs Job Tabelle Cron /api/cron/process-jobs Fehler max 3 Retries Incident E-Mail-Typen angebot_sent Kunden senden angebot_accepted_email Bestatigung Annahme Betreuungspaket payment_confirmation Zahlungsbestatigung booking_confirmation Termin-Bestatigung contact_form Kontaktanfrage verification_code E-Mail OTP-Verifizierung SLA-Check Cron-Job Submissions bearbeitet Uberschreitung Admin-Benachrichtigung Auto-Angebot-Generierung",
    content: (
      <div className="space-y-4">
        <h4 className="text-sm font-bold text-white">Job Queue</h4>
        <p className="text-sm text-zinc-300">
          Asynchrone Jobs werden in der <code className="px-1 py-0.5 bg-white/5 rounded text-xs">Job</code> Tabelle
          gespeichert und per Cron (<code className="px-1 py-0.5 bg-white/5 rounded text-xs">/api/cron/process-jobs</code>) abgearbeitet.
          Bei Fehler: max. 3 Retries, dann Incident erstellen.
        </p>

        <h4 className="text-sm font-bold text-white mt-4">E-Mail-Typen</h4>
        <ul className="list-disc list-inside text-zinc-300 space-y-1 text-sm">
          <li><strong>angebot_sent:</strong> Angebot an Kunden senden</li>
          <li><strong>angebot_accepted_email:</strong> Bestatigung bei Annahme (inkl. Betreuungspaket-Info)</li>
          <li><strong>payment_confirmation:</strong> Zahlungsbestatigung</li>
          <li><strong>booking_confirmation:</strong> Termin-Bestatigung</li>
          <li><strong>contact_form:</strong> Kontaktanfrage weiterleiten</li>
          <li><strong>verification_code:</strong> E-Mail OTP-Verifizierung</li>
        </ul>

        <h4 className="text-sm font-bold text-white mt-4">SLA-Check</h4>
        <p className="text-sm text-zinc-300">
          Cron-Job pruft regelmasig ob Submissions innerhalb der SLA bearbeitet wurden.
          Bei Uberschreitung: Admin-Benachrichtigung oder Auto-Angebot-Generierung.
        </p>
      </div>
    ),
  },
  {
    id: "monitoring",
    title: "Monitoring & Incident-Management",
    icon: AlertTriangle,
    category: "developer",
    tags: [
      "monitoring", "incident", "vorfall", "fehler", "error", "health",
      "status", "alert", "system", "uptime",
    ],
    searchText: "Health Checks PostgreSQL Verbindung Query-Latenz SeaweedFS Dateispeicher-Erreichbarkeit SMTP E-Mail-Server Anthropic API LLM-Erreichbarkeit Environment kritische Env-Vars Incidents Status-Flow open acknowledged resolved automatisch erstellt fehlgeschlagene Jobs SLA-Uberschreitungen Health-Check-Fehler Badge-Count Sidebar",
    content: (
      <div className="space-y-4">
        <h4 className="text-sm font-bold text-white">Health Checks</h4>
        <ul className="list-disc list-inside text-zinc-300 space-y-1 text-sm">
          <li><strong>PostgreSQL:</strong> Verbindung + Query-Latenz</li>
          <li><strong>SeaweedFS:</strong> Dateispeicher-Erreichbarkeit</li>
          <li><strong>SMTP:</strong> E-Mail-Server-Verbindung</li>
          <li><strong>Anthropic API:</strong> LLM-Erreichbarkeit</li>
          <li><strong>Environment:</strong> Kritische Env-Vars vorhanden</li>
        </ul>

        <h4 className="text-sm font-bold text-white mt-4">Incidents</h4>
        <p className="text-sm text-zinc-300">
          Status-Flow: <strong>open</strong> &rarr; <strong>acknowledged</strong> &rarr; <strong>resolved</strong>.
          Incidents werden automatisch erstellt bei: fehlgeschlagenen Jobs,
          SLA-Uberschreitungen, Health-Check-Fehlern.
          Badge-Count erscheint im Sidebar.
        </p>
      </div>
    ),
  },
  {
    id: "file-structure",
    title: "Projekt-Struktur",
    icon: Layers,
    category: "developer",
    tags: [
      "struktur", "ordner", "verzeichnis", "directory", "file", "datei",
      "komponente", "component", "lib", "app", "onboarding", "admin",
      "api", "tests",
    ],
    searchText: "src/app (admin)/backoffice Dashboard Settings (public) Offentliche Seiten api admin Geschutzte Admin-Endpunkte angebot Angebots-Aktionen annehmen zahlen affiliates Partner-API cron Geplante Jobs stripe Webhook onboarding Onboarding-Wizard components admin Backoffice-Komponenten layout Header Footer Logo onboarding Onboarding-Steps ui shadcn/ui Basis-Komponenten lib constants.ts Zahlungsoptionen Betreuungs-Pakete pricing-config.ts Preiskonfiguration estimation.ts Kostenberechnung angebote.ts Angebots-CRUD promo.ts Promo-Code-Logik stripe.ts Stripe-Integration db.ts Prisma-Client prisma schema.prisma Datenbank-Schema tests unit Integration Vitest e2e Playwright",
    content: (
      <div className="space-y-4">
        <pre className="text-xs text-zinc-300 bg-white/[0.03] rounded-lg p-4 overflow-x-auto">
{`src/
├── app/
│   ├── (admin)/backoffice/   # Admin-Bereich (Dashboard, Settings, etc.)
│   ├── (public)/             # Offentliche Seiten
│   ├── api/                  # API Routes
│   │   ├── admin/            # Geschutzte Admin-Endpunkte
│   │   ├── angebot/          # Angebots-Aktionen (annehmen, zahlen)
│   │   ├── affiliates/       # Partner-API
│   │   ├── cron/             # Geplante Jobs
│   │   └── stripe/           # Stripe Webhook
│   └── onboarding/           # Onboarding-Wizard
├── components/
│   ├── admin/                # Backoffice-Komponenten
│   ├── layout/               # Header, Footer, Logo
│   ├── onboarding/           # Onboarding-Steps
│   └── ui/                   # shadcn/ui Basis-Komponenten
├── lib/
│   ├── constants.ts          # Zahlungsoptionen, Betreuungs-Pakete
│   ├── pricing-config.ts     # Admin-editierbare Preiskonfiguration
│   ├── estimation.ts         # Kostenberechnung
│   ├── angebote.ts           # Angebots-CRUD
│   ├── promo.ts              # Promo-Code-Logik
│   ├── stripe.ts             # Stripe-Integration
│   └── db.ts                 # Prisma-Client
├── prisma/
│   └── schema.prisma         # Datenbank-Schema
├── tests/
│   ├── unit/                 # Unit Tests (Vitest)
│   └── integration/          # Integration Tests (Vitest)
└── e2e/                      # E2E Tests (Playwright)`}
        </pre>
      </div>
    ),
  },
];

// ---------------------------------------------------------------------------
// Helper: Build flat searchable index
// ---------------------------------------------------------------------------

function matchesSearch(section: DocSection, query: string): boolean {
  if (!query) return true;
  const q = query.toLowerCase();
  const terms = q.split(/\s+/).filter(Boolean);

  const haystack = [
    section.title,
    section.id,
    ...section.tags,
    section.category,
    section.searchText,
  ]
    .join(" ")
    .toLowerCase();

  return terms.every((term) => haystack.includes(term));
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function DocsPage() {
  const [search, setSearch] = useState("");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<"all" | "business" | "developer">("all");

  // Sections matching the search query (ignoring tab)
  const searchMatched = useMemo(() => {
    return DOC_SECTIONS.filter((s) => matchesSearch(s, search));
  }, [search]);

  // Then apply tab filter for display
  const filtered = useMemo(() => {
    if (activeTab === "all") return searchMatched;
    return searchMatched.filter((s) => s.category === activeTab);
  }, [searchMatched, activeTab]);

  // Counts based on search only, not tab
  const totalCount = searchMatched.length;
  const businessCount = searchMatched.filter((s) => s.category === "business").length;
  const devCount = searchMatched.filter((s) => s.category === "developer").length;

  // Auto-expand all sections when searching
  const effectiveExpanded = search
    ? new Set(filtered.map((s) => s.id))
    : expandedIds;

  const toggleSection = (id: string) => {
    if (search) return; // Don't toggle while searching — all are expanded
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const expandAll = () =>
    setExpandedIds(new Set(DOC_SECTIONS.map((s) => s.id)));
  const collapseAll = () => setExpandedIds(new Set());

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6 lg:p-10">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <BookOpen className="h-7 w-7 text-[#FFC62C]" />
          <h1 className="text-2xl font-bold">Dokumentation</h1>
        </div>
        <p className="text-sm text-zinc-400">
          Business-Logik & technische Referenz — durchsuchbar per Stichwort.
        </p>
      </div>

      {/* Search bar */}
      <div className="relative mb-6 max-w-xl">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Stichwort eingeben, z.B. &bdquo;rabatt&ldquo;, &bdquo;stripe&ldquo;, &bdquo;betreuung&ldquo; ..."
          className="w-full rounded-lg border border-white/10 bg-white/[0.04] py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-zinc-500 focus:border-[#FFC62C]/50 focus:outline-none focus:ring-1 focus:ring-[#FFC62C]/30 transition-colors"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white text-xs"
          >
            Leeren
          </button>
        )}
      </div>

      {/* Tabs + expand/collapse */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex gap-1 rounded-lg bg-white/[0.04] p-1">
          {(
            [
              { key: "all", label: "Alle", count: totalCount },
              { key: "business", label: "Business", count: businessCount },
              { key: "developer", label: "Developer", count: devCount },
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                activeTab === tab.key
                  ? "bg-[#FFC62C]/15 text-[#FFC62C]"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              {tab.label}{" "}
              <span className="text-zinc-500 ml-0.5">({tab.count})</span>
            </button>
          ))}
        </div>

        {!search && (
          <div className="flex gap-2">
            <button
              onClick={expandAll}
              className="text-xs text-zinc-500 hover:text-white transition-colors"
            >
              Alle aufklappen
            </button>
            <span className="text-zinc-700">|</span>
            <button
              onClick={collapseAll}
              className="text-xs text-zinc-500 hover:text-white transition-colors"
            >
              Alle zuklappen
            </button>
          </div>
        )}
      </div>

      {/* No results */}
      {filtered.length === 0 && (
        <div className="text-center py-16">
          <Search className="h-10 w-10 text-zinc-700 mx-auto mb-3" />
          <p className="text-zinc-500 text-sm">
            Kein Eintrag fur <span className="text-white">&bdquo;{search}&rdquo;</span> gefunden.
          </p>
          <button
            onClick={() => {
              setSearch("");
              setActiveTab("all");
            }}
            className="mt-3 text-xs text-[#FFC62C] hover:underline"
          >
            Suche zurucksetzen
          </button>
        </div>
      )}

      {/* Sections */}
      <div className="space-y-3 max-w-4xl">
        {filtered.map((section) => {
          const expanded = effectiveExpanded.has(section.id);
          const Icon = section.icon;

          return (
            <div
              key={section.id}
              className="rounded-xl border border-white/[0.08] bg-white/[0.02] overflow-hidden"
            >
              <button
                onClick={() => toggleSection(section.id)}
                className="flex items-center gap-3 w-full px-5 py-4 text-left hover:bg-white/[0.03] transition-colors"
              >
                {expanded ? (
                  <ChevronDown className="h-4 w-4 text-zinc-500 shrink-0" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-zinc-500 shrink-0" />
                )}
                <Icon className="h-5 w-5 text-[#FFC62C] shrink-0" />
                <span className="text-sm font-semibold text-white flex-1">
                  {section.title}
                </span>
                <span
                  className={`text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    section.category === "business"
                      ? "bg-blue-500/15 text-blue-400"
                      : "bg-purple-500/15 text-purple-400"
                  }`}
                >
                  {section.category}
                </span>
              </button>

              {expanded && (
                <div className="px-5 pb-5 pt-1 pl-[52px] text-zinc-300">
                  {section.content}
                  {/* Tags */}
                  <div className="flex flex-wrap gap-1.5 mt-4 pt-3 border-t border-white/5">
                    {section.tags.slice(0, 8).map((tag) => (
                      <button
                        key={tag}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSearch(tag);
                        }}
                        className="px-2 py-0.5 rounded-full bg-white/[0.05] text-[10px] text-zinc-500 hover:text-[#FFC62C] hover:bg-[#FFC62C]/10 transition-colors"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
