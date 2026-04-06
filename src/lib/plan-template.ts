/**
 * ProjectPlan template — defines the structure that the LLM must fill
 * when generating a project plan from an Anfrage (client submission).
 */

// ─── ProjectPlan interface ──────────────────────────────────────────

export interface UserStory {
  rolle: string;
  aktion: string;
  nutzen: string;
  prioritaet: "must" | "should" | "could";
}

export interface ApiEndpoint {
  methode: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  pfad: string;
  beschreibung: string;
}

export interface ScreenSpec {
  name: string;
  beschreibung: string;
  komponenten: string[];
}

export interface RolleUI {
  rolle: string;
  screens: ScreenSpec[];
}

export interface TechChoice {
  kategorie: string; // e.g. "Frontend", "Backend", "Datenbank", "Infrastruktur"
  technologie: string;
  begruendung: string;
}

export interface CriticalPoint {
  kategorie: string; // e.g. "Security", "Performance", "Compliance", "Go-Live"
  beschreibung: string;
  empfehlung: string;
}

export interface OffenerPunkt {
  typ: "luecke" | "inkonsistenz" | "risiko" | "unklarheit";
  titel: string;
  beschreibung: string;
  vorschlag: string;
  prioritaet: "hoch" | "mittel" | "niedrig";
}

export interface BetriebUndWartung {
  umfang: string; // z.B. "Monitoring, Updates, Bugfixes"
  vertragslaufzeit: string; // "1 Monat (im Festpreis inkludiert)"
  aboOptionen: string; // "3 Monate: 69€/Monat, 6 Monate: 49€/Monat, 12 Monate: 29€/Monat"
  sla: string; // Reaktionszeiten, Verfügbarkeit
}

export interface ProjectPlan {
  anforderungen: {
    userStories: UserStory[];
  };
  apiEndpunkte: ApiEndpoint[];
  uiKomponenten: RolleUI[];
  architektur: {
    beschreibung: string;
    datenfluss: string;
    datenbankmodell: string;
  };
  technologieStack: TechChoice[];
  kritischePunkte: CriticalPoint[];
  offenePunkte: OffenerPunkt[];
  betriebUndWartung: BetriebUndWartung;
  generatedAt: string;
}

// ─── LLM prompt construction ───────────────────────────────────────

export const PLAN_SYSTEM_PROMPT = `Du bist ein erfahrener Senior Software Architekt bei NanaChimi Digital, einem Premium-Software-Unternehmen.

Deine Aufgabe: Erstelle einen strukturierten Projektplan basierend auf einer Kundenanfrage. Der Plan muss die folgenden Abschnitte enthalten — exakt in der vorgegebenen JSON-Struktur.

Antworte AUSSCHLIESSLICH mit validem JSON. Kein Markdown, keine Erklärungen außerhalb des JSON.

## Wichtig für User Stories
Die User Stories werden im UI so angezeigt: "Als {rolle} möchte ich {aktion}, damit {nutzen}".
Deshalb:
- **aktion**: NUR die Handlung, OHNE "möchte" am Anfang. Beispiel: "ein Profil erstellen" (NICHT "möchte ein Profil erstellen")
- **nutzen**: NUR der Mehrwert, OHNE "um" oder "damit" am Anfang. Beispiel: "potenzielle Kunden zu erreichen" (NICHT "um potenzielle Kunden zu erreichen")

## Unser bevorzugter Technologie-Stack

Wir verwenden standardmäßig folgende Technologien — weiche NUR davon ab, wenn die Kundenanforderungen es explizit erfordern:

- **Backend:** Spring Boot, Java, REST API, JWT-Authentifizierung
- **Frontend:** Angular
- **Testing:** JUnit 5
- **Datenbank:** PostgreSQL
- **Infrastruktur:** Docker, GitHub Actions
- **Hosting:** Hetzner Cloud (bevorzugt für Kunden in Deutschland/Europa)

## Architektur-Prinzipien

- **Modularer Monolith statt Microservices:** Wir bevorzugen eine modulare Backend-Architektur (ein Deployment, klar getrennte Module). Microservices nur, wenn der Kunde es ausdrücklich verlangt.
- **Mono-Repo Struktur:** Frontend und Backend liegen im selben Repository-Ordner, zusammen mit allen CI/CD-Konfigurationen.
- **Projektstruktur:**
  \`\`\`
  /projekt-name
    /backend       (Spring Boot)
    /frontend      (Angular)
    /ci            (GitHub Actions Workflows, Dockerfiles)
    docker-compose.yml
  \`\`\`

## Wann eine andere Technologie gewählt wird

Wähle eine alternative Technologie NUR wenn die Anforderungen es klar erfordern. Beispiele:
- **Next.js** statt Angular → wenn SEO entscheidend ist (z.B. öffentlicher Marktplatz, Blog, Landing Pages)
- **Neo4J** statt PostgreSQL → wenn Beziehungen zwischen Objekten eine zentrale Rolle spielen (z.B. soziale Netzwerke, Empfehlungssysteme)
- **MongoDB** → wenn dokumentenbasierte Datenstrukturen dominieren
- **Kubernetes** → nur bei explizitem Bedarf an Auto-Scaling oder Multi-Region-Deployments

Begründe in jedem Fall, warum der Standard-Stack gewählt oder davon abgewichen wurde.

## Betrieb & Wartung

Jedes Projekt enthält standardmäßig 1 Monat Betrieb & Wartung nach Go-Live (im Festpreis inkludiert). Danach kann der Kunde ein optionales B&W-Abo buchen. Der Abschnitt "betriebUndWartung" muss immer befüllt werden mit:
- **umfang**: Konkrete Leistungen (Monitoring, Updates, Bugfixes, Sicherheits-Patches, Backup)
- **vertragslaufzeit**: Immer "1 Monat (im Festpreis inkludiert)"
- **aboOptionen**: Immer "3 Monate: 69€/Monat, 6 Monate: 49€/Monat, 12 Monate: 29€/Monat"
- **sla**: Reaktionszeiten und Verfügbarkeit passend zum Projekt (z.B. "Reaktionszeit: 24h an Werktagen, Verfügbarkeit: 99.5%")

## Offene Punkte & Inkonsistenzen

Analysiere die Kundenanfrage kritisch und identifiziere:
- **Lücken (luecke)**: Fehlende Angaben, die für die Umsetzung geklärt werden müssen (z.B. keine Angabe zur Datenmigration, fehlende Rollenrechte-Definition)
- **Inkonsistenzen (inkonsistenz)**: Widersprüche zwischen den Anforderungen (z.B. "kostenlose App" + "Online bezahlen", Budget passt nicht zum Funktionsumfang)
- **Risiken (risiko)**: Potenzielle Probleme, die im Projektverlauf auftreten könnten (z.B. unrealistische Timeline, Abhängigkeit von Drittanbietern)
- **Unklarheiten (unklarheit)**: Mehrdeutige Angaben, die unterschiedlich interpretiert werden könnten

Für jeden Punkt: formuliere einen konkreten, umsetzbaren Vorschlag, wie das Problem gelöst werden kann. Das hilft dem Admin im Kickoff-Gespräch, gezielt nachzufragen.

Das Array "offenePunkte" darf NICHT leer sein — es gibt immer mindestens einen Punkt zu klären. Finde mindestens 2–3 relevante Punkte.`;

export interface PlanPromptInput {
  projekttyp: string;
  beschreibung: string;
  zielgruppe?: string;
  funktionen: string[];
  funktionenGruppen?: Record<string, string[]>;
  rollenAnzahl: string;
  rollenName?: string;
  rollenBeschreibung?: string;
  appStruktur?: "shared" | "separate";
  rollenApps?: { rolle: string; appTyp: string[]; beschreibung?: string }[];
  designLevel: string;
  budget: string;
  zeitrahmenMvp: string;
  zeitrahmenFinal: string;
  betriebUndWartung: string;
  betriebLaufzeit?: string;
  markenname?: string;
  domain?: string;
  brandingInfo?: string;
  inspirationUrls?: { url: string; beschreibung: string }[];
  monetarisierung?: string[];
  monetarisierungDetails?: string;
  werZahlt?: string;
  zahlendeGruppen?: string[];
  zusatzinfo?: string;
}

const PROJEKTTYP_MAP: Record<string, string> = {
  web: "Web-App",
  mobile: "Mobile App (iOS/Android)",
  beides: "Mehrere Plattformen (Web + Mobile)",
  unsicher: "Noch zu klären",
};

const DESIGN_MAP: Record<string, string> = {
  standard: "Standard (bewährte UI-Patterns)",
  individuell: "Individuelles Design",
  premium: "Premium (Custom Design System)",
};

const ZEITRAHMEN_MVP_MAP: Record<string, string> = {
  "48h": "48 Stunden (Rush)",
  "1-2wochen": "1–2 Wochen",
  "1monat": "1 Monat",
  flexibel: "Flexibel",
};

const ZEITRAHMEN_FINAL_MAP: Record<string, string> = {
  "1monat": "1 Monat",
  "2-3monate": "2–3 Monate",
  "6monate": "6 Monate",
  laufend: "Laufende Entwicklung",
};

const BUDGET_MAP: Record<string, string> = {
  "unter-399": "Unter 399 €",
  "399-1000": "399–1.000 €",
  "1000-5000": "1.000–5.000 €",
  "5000-10000": "5.000–10.000 €",
  "10000-plus": "Über 10.000 €",
  unsicher: "Noch unsicher",
};

const BETRIEB_MAP: Record<string, string> = {
  ja: "Ja, gewünscht",
  teilweise: "Teilweise",
  nein: "Nein",
  unsicher: "Noch unsicher",
  ohne: "Ohne Betrieb & Wartung",
};

const BETRIEB_LAUFZEIT_MAP: Record<string, string> = {
  "3": "3 Monate",
  "6": "6 Monate",
  "12": "12 Monate",
};

const MONETARISIERUNG_MAP: Record<string, string> = {
  werbung: "Werbung",
  abonnement: "Abonnement / Mitgliedschaft",
  "einmalige-zahlung": "Einmalige Zahlung",
  freemium: "Freemium (kostenlose Basis + bezahlte Premium-Features)",
  provisionen: "Provisionen / Marktplatz",
  kostenlos: "Kostenloses Angebot",
  sonstiges: "Sonstiges",
};

const WER_ZAHLT_MAP: Record<string, string> = {
  alle: "Alle Nutzer",
  "bestimmte-gruppen": "Bestimmte Nutzergruppen",
  unternehmen: "Das Unternehmen selbst",
  unsicher: "Noch unsicher",
};

export function buildPlanPrompt(input: PlanPromptInput): string {
  const lines: string[] = [
    "Erstelle einen Projektplan für folgende Kundenanfrage:",
    "",
    `## Projekttyp: ${PROJEKTTYP_MAP[input.projekttyp] || input.projekttyp}`,
    "",
    `## Projektbeschreibung`,
    input.beschreibung,
    "",
    `## Zielgruppe`,
    input.zielgruppe || "Nicht angegeben",
    "",
  ];

  // ── Funktionen + Gruppen-Zuordnung ──────────────────────────────
  lines.push(`## Gewünschte Funktionen`);
  const gruppen = input.funktionenGruppen || {};
  for (const f of input.funktionen) {
    const assignedGroups = gruppen[f];
    if (assignedGroups && assignedGroups.length > 0) {
      lines.push(`- ${f} → genutzt von: ${assignedGroups.join(", ")}`);
    } else {
      lines.push(`- ${f}`);
    }
  }
  lines.push("");

  // ── Nutzerrollen ────────────────────────────────────────────────
  lines.push(`## Nutzerrollen: ${input.rollenAnzahl}`);

  if (input.rollenName) {
    lines.push(`Gruppenname: ${input.rollenName}`);
  }
  if (input.rollenBeschreibung) {
    lines.push(`Beschreibung: ${input.rollenBeschreibung}`);
  }

  if (input.appStruktur === "separate" && input.rollenApps) {
    lines.push("Separate Apps pro Rolle:");
    for (const app of input.rollenApps) {
      const plattform = Array.isArray(app.appTyp) ? app.appTyp.join(", ") : app.appTyp;
      const desc = app.beschreibung ? ` — ${app.beschreibung}` : "";
      lines.push(`- ${app.rolle} (${plattform})${desc}`);
    }
  } else if (input.rollenApps && input.rollenApps.length > 0) {
    lines.push("Alle Rollen nutzen eine gemeinsame Anwendung:");
    for (const app of input.rollenApps) {
      const desc = app.beschreibung ? ` — ${app.beschreibung}` : "";
      lines.push(`- ${app.rolle}${desc}`);
    }
  } else if (input.appStruktur === "shared") {
    lines.push("Alle Rollen nutzen eine gemeinsame Anwendung.");
  }

  // ── Branding ────────────────────────────────────────────────────
  if (input.markenname || input.domain || input.brandingInfo) {
    lines.push("", `## Branding`);
    if (input.markenname) lines.push(`Markenname: ${input.markenname}`);
    if (input.domain) lines.push(`Domain: ${input.domain}`);
    if (input.brandingInfo) lines.push(`Branding-Details: ${input.brandingInfo}`);
  }

  // ── Inspiration ─────────────────────────────────────────────────
  if (input.inspirationUrls && input.inspirationUrls.length > 0) {
    lines.push("", `## Inspirations-Referenzen`);
    for (const ref of input.inspirationUrls) {
      lines.push(`- ${ref.url} — ${ref.beschreibung}`);
    }
  }

  // ── Monetarisierung ─────────────────────────────────────────────
  if (input.monetarisierung && input.monetarisierung.length > 0) {
    lines.push(
      "",
      `## Monetarisierung`,
      ...input.monetarisierung.map((m) => `- ${MONETARISIERUNG_MAP[m] || m}`)
    );
    if (input.monetarisierungDetails) {
      lines.push(`Details: ${input.monetarisierungDetails}`);
    }
    if (input.werZahlt) {
      lines.push(`Wer zahlt: ${WER_ZAHLT_MAP[input.werZahlt] || input.werZahlt}`);
    }
    if (input.zahlendeGruppen && input.zahlendeGruppen.length > 0) {
      lines.push(`Zahlende Gruppen: ${input.zahlendeGruppen.join(", ")}`);
    }
  }

  // ── Design, Timeline, Budget, Betrieb ───────────────────────────
  lines.push(
    "",
    `## Design-Level: ${DESIGN_MAP[input.designLevel] || input.designLevel}`,
    `## Budget: ${BUDGET_MAP[input.budget] || input.budget}`,
    `## MVP-Lieferung: ${ZEITRAHMEN_MVP_MAP[input.zeitrahmenMvp] || input.zeitrahmenMvp}`,
    `## Endlieferung: ${ZEITRAHMEN_FINAL_MAP[input.zeitrahmenFinal] || input.zeitrahmenFinal}`,
    `## Betrieb & Wartung: ${BETRIEB_MAP[input.betriebUndWartung] || input.betriebUndWartung}`,
  );

  if (input.betriebLaufzeit) {
    lines.push(`Gewünschte Laufzeit: ${BETRIEB_LAUFZEIT_MAP[input.betriebLaufzeit] || input.betriebLaufzeit}`);
  }

  if (input.zusatzinfo) {
    lines.push("", `## Zusätzliche Informationen`, input.zusatzinfo);
  }

  lines.push(
    "",
    "---",
    "",
    "Antworte mit einem JSON-Objekt, das exakt diese Struktur hat:",
    "",
    JSON.stringify(PLAN_JSON_SCHEMA, null, 2),
  );

  return lines.join("\n");
}

/**
 * JSON schema description passed to the LLM so it knows the exact shape to return.
 */
const PLAN_JSON_SCHEMA = {
  anforderungen: {
    userStories: [
      {
        rolle: "Rolle des Nutzers (z.B. 'Admin', 'Endkunde')",
        aktion: "Was der Nutzer tun will — OHNE 'möchte' am Anfang (z.B. 'ein Profil erstellen' statt 'möchte ein Profil erstellen')",
        nutzen: "Warum / welchen Mehrwert — OHNE 'um' oder 'damit' am Anfang (z.B. 'potenzielle Kunden zu erreichen' statt 'um potenzielle Kunden zu erreichen')",
        prioritaet: "must | should | could",
      },
    ],
  },
  apiEndpunkte: [
    {
      methode: "GET | POST | PATCH | PUT | DELETE",
      pfad: "/api/...",
      beschreibung: "Was dieser Endpunkt tut",
    },
  ],
  uiKomponenten: [
    {
      rolle: "Nutzerrolle",
      screens: [
        {
          name: "Screen-Name",
          beschreibung: "Was dieser Screen zeigt",
          komponenten: ["Komponente 1", "Komponente 2"],
        },
      ],
    },
  ],
  architektur: {
    beschreibung: "Systemarchitektur-Überblick",
    datenfluss: "Datenfluss und Integrationen",
    datenbankmodell: "Datenbankmodell-Überblick (Entitäten, Relationen)",
  },
  technologieStack: [
    {
      kategorie: "Frontend | Backend | Datenbank | Infrastruktur",
      technologie: "Name der Technologie",
      begruendung: "Warum diese Technologie gewählt wurde",
    },
  ],
  kritischePunkte: [
    {
      kategorie: "Security | Performance | Compliance | Go-Live",
      beschreibung: "Beschreibung des kritischen Punktes",
      empfehlung: "Empfohlene Maßnahme",
    },
  ],
  offenePunkte: [
    {
      typ: "luecke | inkonsistenz | risiko | unklarheit",
      titel: "Kurzer Titel des offenen Punktes",
      beschreibung: "Was genau fehlt, widersprüchlich oder unklar ist",
      vorschlag: "Konkreter, umsetzbarer Vorschlag zur Klärung oder Lösung",
      prioritaet: "hoch | mittel | niedrig",
    },
  ],
  betriebUndWartung: {
    umfang: "Monitoring, Updates, Bugfixes, Sicherheits-Patches, Backup — projektspezifisch anpassen",
    vertragslaufzeit: "1 Monat (im Festpreis inkludiert)",
    aboOptionen: "3 Monate: 69€/Monat, 6 Monate: 49€/Monat, 12 Monate: 29€/Monat",
    sla: "Reaktionszeit und Verfügbarkeit passend zum Projekt",
  },
};
