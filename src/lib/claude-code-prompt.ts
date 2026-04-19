/**
 * Generates a comprehensive development prompt from a ProjectPlan
 * that can be used with Claude Code to implement the project.
 */

import type { ProjectPlan, PlanPromptInput } from "./plan-template";

export interface ClaudeCodePromptInput {
  plan: ProjectPlan;
  submission: PlanPromptInput;
  projektName?: string;
  adminNotes?: string;
}

/**
 * Build an exhaustive, structured Claude Code prompt from the project plan.
 * This is a deterministic template — no LLM call needed.
 */
export function generateClaudeCodePrompt(input: ClaudeCodePromptInput): string {
  const { plan, submission, projektName, adminNotes } = input;

  const name = projektName || submission.markenname || "Projekt";
  const sections: string[] = [];

  // ─── Header ─────────────────────────────────────────────────────
  sections.push(`# ${name} — Entwicklungsanweisung für Claude Code`);
  sections.push("");
  sections.push(`> Dieses Dokument wurde automatisch aus dem Projektplan generiert.`);
  sections.push(`> Plan erstellt am: ${plan.generatedAt}`);
  sections.push("");

  // ─── 1. Projektübersicht ────────────────────────────────────────
  sections.push("## 1. Projektübersicht");
  sections.push("");
  sections.push(`**Beschreibung:** ${submission.beschreibung}`);
  sections.push("");
  if (submission.zielgruppe) {
    sections.push(`**Zielgruppe:** ${submission.zielgruppe}`);
    sections.push("");
  }
  if (submission.markenname) {
    sections.push(`**Markenname:** ${submission.markenname}`);
  }
  if (submission.domain) {
    sections.push(`**Domain:** ${submission.domain}`);
  }
  if (submission.brandingInfo) {
    sections.push(`**Branding:** ${submission.brandingInfo}`);
  }
  sections.push("");

  // ─── 2. Architektur ─────────────────────────────────────────────
  sections.push("## 2. Architektur");
  sections.push("");
  sections.push("### Systemarchitektur");
  sections.push(plan.architektur.beschreibung);
  sections.push("");
  sections.push("### Datenfluss & Integrationen");
  sections.push(plan.architektur.datenfluss);
  sections.push("");
  sections.push("### Datenbankmodell");
  sections.push(plan.architektur.datenbankmodell);
  sections.push("");

  // ─── 3. Technologie-Stack ───────────────────────────────────────
  sections.push("## 3. Technologie-Stack");
  sections.push("");

  const stackByKategorie = new Map<string, typeof plan.technologieStack>();
  for (const tech of plan.technologieStack) {
    const arr = stackByKategorie.get(tech.kategorie) || [];
    arr.push(tech);
    stackByKategorie.set(tech.kategorie, arr);
  }
  for (const [kategorie, techs] of Array.from(stackByKategorie.entries())) {
    sections.push(`### ${kategorie}`);
    for (const t of techs) {
      sections.push(`- **${t.technologie}** — ${t.begruendung}`);
    }
    sections.push("");
  }

  // ─── 4. Projektstruktur ─────────────────────────────────────────
  sections.push("## 4. Projektstruktur");
  sections.push("");

  // Determine structure based on tech stack
  const hasSpringBoot = plan.technologieStack.some(
    (t) => t.technologie.toLowerCase().includes("spring")
  );
  const hasAngular = plan.technologieStack.some(
    (t) => t.technologie.toLowerCase().includes("angular")
  );
  const hasNextJs = plan.technologieStack.some(
    (t) => t.technologie.toLowerCase().includes("next")
  );

  if (hasSpringBoot && hasAngular) {
    sections.push("```");
    sections.push(`/${name.toLowerCase().replace(/\s+/g, "-")}/`);
    sections.push("  /backend/              # Spring Boot Anwendung");
    sections.push("    /src/main/java/");
    sections.push("      /config/           # Konfiguration (Security, CORS, etc.)");
    sections.push("      /controller/       # REST Controller");
    sections.push("      /service/          # Business-Logik");
    sections.push("      /repository/       # JPA Repositories");
    sections.push("      /model/            # Entitäten / DTOs");
    sections.push("      /exception/        # Custom Exceptions + Handler");
    sections.push("      /security/         # JWT Filter, AuthProvider");
    sections.push("    /src/main/resources/");
    sections.push("      application.yml");
    sections.push("    /src/test/           # JUnit 5 Tests");
    sections.push("  /frontend/             # Angular Anwendung");
    sections.push("    /src/app/");
    sections.push("      /core/             # Guards, Interceptors, Services");
    sections.push("      /shared/           # Shared Components, Pipes, Directives");
    sections.push("      /features/         # Feature-Module (Lazy Loaded)");
    sections.push("      /models/           # TypeScript Interfaces");
    sections.push("  /ci/                   # CI/CD");
    sections.push("    Dockerfile.backend");
    sections.push("    Dockerfile.frontend");
    sections.push("    .github/workflows/");
    sections.push("  docker-compose.yml");
    sections.push("  README.md");
    sections.push("```");
  } else if (hasNextJs) {
    sections.push("```");
    sections.push(`/${name.toLowerCase().replace(/\s+/g, "-")}/`);
    sections.push("  /src/");
    sections.push("    /app/                # Next.js App Router");
    sections.push("      /api/             # API Routes");
    sections.push("      /(public)/        # Öffentliche Seiten");
    sections.push("      /(auth)/          # Authentifizierte Bereiche");
    sections.push("    /components/         # React Komponenten");
    sections.push("      /ui/              # Basis-UI (shadcn/ui)");
    sections.push("      /features/        # Feature-Komponenten");
    sections.push("    /lib/               # Utilities, Helpers");
    sections.push("    /hooks/             # Custom React Hooks");
    sections.push("    /types/             # TypeScript Typen");
    sections.push("  /prisma/              # Prisma Schema + Migrationen");
    sections.push("  /public/              # Statische Assets");
    sections.push("  /ci/                  # CI/CD");
    sections.push("  docker-compose.yml");
    sections.push("  README.md");
    sections.push("```");
  } else {
    sections.push("```");
    sections.push(`/${name.toLowerCase().replace(/\s+/g, "-")}/`);
    sections.push("  /backend/");
    sections.push("  /frontend/");
    sections.push("  /ci/");
    sections.push("  docker-compose.yml");
    sections.push("  README.md");
    sections.push("```");
  }
  sections.push("");

  // ─── 5. Anforderungen (User Stories) ────────────────────────────
  sections.push("## 5. Anforderungen");
  sections.push("");

  const mustStories = plan.anforderungen.userStories.filter((s) => s.prioritaet === "must");
  const shouldStories = plan.anforderungen.userStories.filter((s) => s.prioritaet === "should");
  const couldStories = plan.anforderungen.userStories.filter((s) => s.prioritaet === "could");

  if (mustStories.length > 0) {
    sections.push("### MUST (Pflicht für MVP)");
    sections.push("");
    for (const s of mustStories) {
      sections.push(`- [ ] **${s.rolle}:** ${s.aktion} → *${s.nutzen}*`);
    }
    sections.push("");
  }

  if (shouldStories.length > 0) {
    sections.push("### SHOULD (Wichtig, nach MVP)");
    sections.push("");
    for (const s of shouldStories) {
      sections.push(`- [ ] **${s.rolle}:** ${s.aktion} → *${s.nutzen}*`);
    }
    sections.push("");
  }

  if (couldStories.length > 0) {
    sections.push("### COULD (Nice-to-have)");
    sections.push("");
    for (const s of couldStories) {
      sections.push(`- [ ] **${s.rolle}:** ${s.aktion} → *${s.nutzen}*`);
    }
    sections.push("");
  }

  // ─── 6. API-Spezifikation ──────────────────────────────────────
  sections.push("## 6. API-Endpunkte");
  sections.push("");
  sections.push("Implementiere folgende REST-Endpunkte:");
  sections.push("");
  sections.push("| Methode | Pfad | Beschreibung |");
  sections.push("|---------|------|-------------|");
  for (const ep of plan.apiEndpunkte) {
    sections.push(`| \`${ep.methode}\` | \`${ep.pfad}\` | ${ep.beschreibung} |`);
  }
  sections.push("");

  // Grouped by resource for implementation guidance
  const apiByResource = new Map<string, typeof plan.apiEndpunkte>();
  for (const ep of plan.apiEndpunkte) {
    const parts = ep.pfad.split("/").filter(Boolean);
    // Use the first meaningful segment after "api"
    const resource = parts.find((p, i) => i > 0 && !p.startsWith(":") && !p.startsWith("[")) || parts[1] || "general";
    const arr = apiByResource.get(resource) || [];
    arr.push(ep);
    apiByResource.set(resource, arr);
  }

  sections.push("### Implementierungshinweise pro Ressource");
  sections.push("");
  for (const [resource, endpoints] of Array.from(apiByResource.entries())) {
    sections.push(`**${resource}** — ${endpoints.length} Endpunkt(e):`);
    for (const ep of endpoints) {
      sections.push(`  - \`${ep.methode} ${ep.pfad}\` — ${ep.beschreibung}`);
    }
    sections.push("");
  }

  // ─── 7. UI-Komponenten ──────────────────────────────────────────
  sections.push("## 7. UI-Komponenten & Screens");
  sections.push("");

  for (const roleUI of plan.uiKomponenten) {
    sections.push(`### Rolle: ${roleUI.rolle}`);
    sections.push("");
    for (const screen of roleUI.screens) {
      sections.push(`#### ${screen.name}`);
      sections.push(`${screen.beschreibung}`);
      sections.push("");
      sections.push("Komponenten:");
      for (const k of screen.komponenten) {
        sections.push(`- [ ] ${k}`);
      }
      sections.push("");
    }
  }

  // ─── 8. Sicherheit & Kritische Punkte ──────────────────────────
  sections.push("## 8. Sicherheit & Kritische Punkte");
  sections.push("");
  sections.push("Beachte folgende Punkte bei der Implementierung:");
  sections.push("");
  for (const cp of plan.kritischePunkte) {
    sections.push(`### ${cp.kategorie}`);
    sections.push(`**Problem:** ${cp.beschreibung}`);
    sections.push(`**Maßnahme:** ${cp.empfehlung}`);
    sections.push("");
  }

  // ─── 9. Offene Punkte / Annahmen ───────────────────────────────
  if (plan.offenePunkte && plan.offenePunkte.length > 0) {
    sections.push("## 9. Offene Punkte & Annahmen");
    sections.push("");
    sections.push("Folgende Punkte wurden identifiziert. Verwende die angegebenen Vorschläge als Arbeitsannahmen:");
    sections.push("");
    for (const op of plan.offenePunkte) {
      const typLabel: Record<string, string> = {
        luecke: "Lücke",
        inkonsistenz: "Inkonsistenz",
        risiko: "Risiko",
        unklarheit: "Unklarheit",
      };
      sections.push(`- **[${typLabel[op.typ] || op.typ} / ${op.prioritaet}] ${op.titel}:** ${op.beschreibung}`);
      sections.push(`  → Annahme: ${op.vorschlag}`);
    }
    sections.push("");
  }

  // ─── 10. Betrieb & Deployment ──────────────────────────────────
  sections.push("## 10. Deployment & Betrieb");
  sections.push("");
  sections.push("### Docker");
  sections.push("- Erstelle `Dockerfile` für jede Komponente (Backend, Frontend)");
  sections.push("- `docker-compose.yml` für lokale Entwicklung + Produktion");
  sections.push("- Health-Check Endpunkte einrichten");
  sections.push("");
  sections.push("### CI/CD (GitHub Actions)");
  sections.push("- Lint + Typecheck");
  sections.push("- Unit Tests");
  sections.push("- Build");
  sections.push("- Docker Image erstellen + pushen");
  sections.push("- Deployment auf Hetzner Cloud");
  sections.push("");
  if (plan.betriebUndWartung) {
    sections.push("### Betrieb & Wartung");
    sections.push(`- **Umfang:** ${plan.betriebUndWartung.umfang}`);
    sections.push(`- **SLA:** ${plan.betriebUndWartung.sla}`);
    sections.push("");
  }

  // ─── 11. Qualitätsanforderungen ────────────────────────────────
  sections.push("## 11. Qualitätsanforderungen");
  sections.push("");
  sections.push("- [ ] Jeder API-Endpunkt hat mindestens einen Happy-Path- und einen Error-Test");
  sections.push("- [ ] Validierung aller Benutzereingaben (Backend + Frontend)");
  sections.push("- [ ] Fehlerbehandlung mit aussagekräftigen Fehlermeldungen");
  sections.push("- [ ] Keine Secrets im Code (Environment Variables verwenden)");
  sections.push("- [ ] Responsive Design (Mobile-first)");
  sections.push("- [ ] Barrierefreiheit (semantisches HTML, ARIA-Labels)");
  sections.push("- [ ] Logging für alle kritischen Operationen");
  sections.push("- [ ] README.md mit Setup-Anleitung");
  sections.push("");

  // ─── 12. Implementierungsreihenfolge ───────────────────────────
  sections.push("## 12. Empfohlene Implementierungsreihenfolge");
  sections.push("");
  sections.push("1. **Projekt-Setup:** Repository, Projektstruktur, Dependencies, Docker Compose");
  sections.push("2. **Datenbankmodell:** Schema definieren, Migrationen erstellen");
  sections.push("3. **Authentifizierung:** JWT/Session Setup, Login/Register Endpunkte");
  sections.push("4. **Backend API (MUST):** Alle Pflicht-Endpunkte implementieren + testen");
  sections.push("5. **Frontend Grundgerüst:** Routing, Layout, Auth-Guards");
  sections.push("6. **Frontend Screens (MUST):** Alle Pflicht-Screens implementieren");
  sections.push("7. **Integration:** Frontend ↔ Backend verbinden, E2E testen");
  sections.push("8. **Backend API (SHOULD):** Weitere Endpunkte");
  sections.push("9. **Frontend Screens (SHOULD):** Weitere Screens");
  sections.push("10. **CI/CD:** GitHub Actions Pipeline aufsetzen");
  sections.push("11. **Deployment:** Docker Images, Hetzner Setup");
  sections.push("12. **QA & Go-Live:** Finale Tests, Performance-Check, Go-Live");
  sections.push("");

  // ─── 13. Admin-Notizen ─────────────────────────────────────────
  if (adminNotes?.trim()) {
    sections.push("## 13. Zusätzliche Hinweise vom Admin");
    sections.push("");
    sections.push(adminNotes.trim());
    sections.push("");
  }

  // ─── Footer ─────────────────────────────────────────────────────
  sections.push("---");
  sections.push("");
  sections.push("Beginne mit Schritt 1 und arbeite die Liste sequenziell ab. Frage bei Unklarheiten nach, bevor du Annahmen triffst.");

  return sections.join("\n");
}
