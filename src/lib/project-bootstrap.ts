/**
 * AI-Powered Project Bootstrap
 *
 * After a client accepts an Angebot, Claude AI generates a complete
 * project scaffold: CLAUDE.md, Prisma schema, API stubs, component
 * stubs, README, Docker setup — all ready to start coding.
 *
 * Falls back to template-based generation if AI is unavailable.
 */

import Anthropic from "@anthropic-ai/sdk";
import type { Submission } from "@/lib/submissions";
import type { Angebot } from "@/lib/angebote";
import type { ProjectPlan } from "@/lib/plan-template";

export interface BootstrapResult {
  success: boolean;
  projectName: string;
  files: { path: string; content: string }[];
  error?: string;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[äöü]/g, (c) => ({ ä: "ae", ö: "oe", ü: "ue" }[c] || c))
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 30);
}

// ─── AI Bootstrap System Prompt ──────────────────────────────────

const BOOTSTRAP_SYSTEM_PROMPT = `Du bist ein Senior Software Architekt bei NanaChimi Digital.

Deine Aufgabe: Generiere ein vollständiges, sofort verwendbares Projekt-Scaffold basierend auf dem Projektplan und den Kundenanforderungen.

WICHTIG: Antworte NUR mit einem JSON-Array von Dateien. Kein Markdown, keine Erklärung. Nur das JSON.

Format:
[
  { "path": "relativer/pfad/datei.ts", "content": "Dateiinhalt hier..." },
  ...
]

Generiere diese Dateien:

1. **CLAUDE.md** — Claude Code Projektinstruktionen mit:
   - Projektbeschreibung und Zielgruppe
   - Tech Stack und Architektur-Regeln
   - Coding-Konventionen (TypeScript, Next.js App Router)
   - Datenbankstruktur (Prisma-Modelle)
   - API-Endpunkte Übersicht
   - Deployment-Infos

2. **prisma/schema.prisma** — Vollständiges Prisma-Schema basierend auf dem Datenbankmodell. Verwende PostgreSQL. Definiere alle Modelle mit Feldern, Relationen, und Indizes.

3. **src/app/api/*/route.ts** — Für JEDEN API-Endpunkt im Plan erstelle eine Route-Datei mit:
   - Korrekte Next.js App Router Syntax (export async function GET/POST/PATCH/DELETE)
   - Import-Stubs und TODO-Kommentare
   - Request/Response Typen
   - Grundlegende Validierung

4. **src/components/*.tsx** — Für jede UI-Komponente im Plan:
   - React "use client" Komponente
   - Props-Interface
   - Grundstruktur mit Tailwind CSS
   - TODO-Kommentare für die Implementierung

5. **README.md** — Ausführliche Projektdokumentation mit:
   - Projektname und Beschreibung
   - Tech Stack
   - Setup-Anleitung (npm install, env, prisma, dev server)
   - Projektstruktur
   - API-Übersicht
   - Deployment

6. **KICKOFF.md** — Projekt-Kickoff-Dokument mit:
   - Projektübersicht und Ziele
   - Zeitplan und Meilensteine
   - Festpreis und Zahlungsbedingungen
   - Kontaktdaten
   - Nächste Schritte

7. **package.json** — Mit allen nötigen Dependencies basierend auf dem Tech Stack

8. **docker-compose.yml** — Lokale Entwicklungsumgebung (PostgreSQL, MailHog, ggf. Redis)

9. **Dockerfile** — Multi-stage Production Build

10. **.env.example** — Alle benötigten Umgebungsvariablen mit Kommentaren

11. **.gitignore** — Standard für Next.js + Prisma

12. **tsconfig.json** — TypeScript-Konfiguration für Next.js

13. **tailwind.config.ts** — Tailwind-Konfiguration

14. **next.config.mjs** — Next.js-Konfiguration mit standalone output

Regeln:
- Verwende Next.js 14+ App Router (NICHT Pages Router)
- Verwende TypeScript überall
- Verwende Tailwind CSS für Styling
- Verwende Prisma als ORM
- Alle API-Routes müssen "export const dynamic = 'force-dynamic'" haben
- Generiere echten, funktionsfähigen Code — nicht nur Platzhalter
- Das Prisma-Schema muss vollständig und korrekt sein
- Package.json muss alle benötigten Dependencies enthalten`;

// ─── AI Bootstrap ────────────────────────────────────────────────

export async function generateProjectWithAI(
  submission: Submission,
  angebot: Angebot
): Promise<BootstrapResult> {
  const firma = submission.firma || submission.name;
  const projectName = `projekt-${slugify(firma)}`;
  const plan = angebot.plan;

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.warn("[Bootstrap] No ANTHROPIC_API_KEY — falling back to templates");
    return bootstrapProject(submission, angebot);
  }

  try {
    const client = new Anthropic({ apiKey });

    const userPrompt = `Generiere das Projekt-Scaffold für folgendes Projekt:

## Kunde
- Name: ${submission.name}
- Firma: ${submission.firma || "—"}
- E-Mail: ${submission.email}

## Projekt
- Beschreibung: ${submission.beschreibung}
- Zielgruppe: ${submission.zielgruppe}
- Typ: ${submission.projekttyp}
- Design: ${submission.designLevel}
- MVP-Zeitrahmen: ${submission.zeitrahmenMvp}
- Finaler Zeitrahmen: ${submission.zeitrahmenFinal}
- Betrieb & Wartung: ${submission.betriebUndWartung}

## Festpreis & Aufwand
- Festpreis: ${angebot.festpreis.toLocaleString("de-DE")} €
- Aufwand: ${angebot.aufwand} Personentage

## Features
${submission.funktionen.map((f) => `- ${f}`).join("\n")}

## Projektplan (vollständig)
${JSON.stringify(plan, null, 2)}

Generiere das vollständige Projekt-Scaffold als JSON-Array. Der Projektordner heißt "${projectName}". Alle Pfade müssen mit "${projectName}/" beginnen.`;

    const response = await client.messages.create({
      model: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-20250514",
      max_tokens: 16000,
      system: BOOTSTRAP_SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
    });

    const text = response.content
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("");

    // Parse JSON from response (handle potential markdown wrapping)
    const jsonStr = text.replace(/^```json?\s*/, "").replace(/\s*```$/, "").trim();
    const files: { path: string; content: string }[] = JSON.parse(jsonStr);

    if (!Array.isArray(files) || files.length === 0) {
      throw new Error("AI returned empty or invalid file array");
    }

    // Ensure all paths start with projectName
    const normalized = files.map((f) => ({
      path: f.path.startsWith(projectName) ? f.path : `${projectName}/${f.path}`,
      content: f.content,
    }));

    console.log(`[Bootstrap] AI generated ${normalized.length} files for ${projectName}`);

    return {
      success: true,
      projectName,
      files: normalized,
    };
  } catch (err) {
    console.error("[Bootstrap] AI generation failed, falling back to templates:", err);
    return bootstrapProject(submission, angebot);
  }
}

// ─── Template-based Fallback ─────────────────────────────────────

export function bootstrapProject(
  submission: Submission,
  angebot: Angebot
): BootstrapResult {
  try {
    const firma = submission.firma || submission.name;
    const projectName = `projekt-${slugify(firma)}`;
    const plan = angebot.plan;

    const files: { path: string; content: string }[] = [
      {
        path: `${projectName}/CLAUDE.md`,
        content: generateClaudeMd(submission, angebot, plan),
      },
      {
        path: `${projectName}/KICKOFF.md`,
        content: generateKickoffMd(submission, angebot),
      },
      {
        path: `${projectName}/README.md`,
        content: generateReadme(submission, angebot, plan),
      },
      {
        path: `${projectName}/prisma/schema.prisma`,
        content: generatePrismaSchema(plan),
      },
      {
        path: `${projectName}/.env.example`,
        content: `# Database\nDATABASE_URL=postgresql://user:password@localhost:5432/${slugify(firma)}\n\n# Site\nNEXT_PUBLIC_SITE_URL=http://localhost:3000\n\n# Email (dev: MailHog)\nSMTP_HOST=localhost\nSMTP_PORT=1025\nSMTP_SECURE=false\nEMAIL_FROM="${firma} <info@${slugify(firma)}.de>"\n`,
      },
      {
        path: `${projectName}/.gitignore`,
        content: "node_modules/\n.next/\n.env\n.env.local\ndist/\n/src/generated/prisma\n",
      },
      {
        path: `${projectName}/docker-compose.yml`,
        content: `services:\n  db:\n    image: postgres:16-alpine\n    environment:\n      POSTGRES_USER: ${slugify(firma)}\n      POSTGRES_PASSWORD: ${slugify(firma)}\n      POSTGRES_DB: ${slugify(firma)}\n    ports:\n      - "5432:5432"\n    volumes:\n      - pgdata:/var/lib/postgresql/data\nvolumes:\n  pgdata:\n`,
      },
    ];

    // Generate API route stubs
    if (plan.apiEndpunkte?.length) {
      for (const ep of plan.apiEndpunkte) {
        const routePath = ep.pfad.replace(/^\/api\//, "").replace(/\//g, "/");
        files.push({
          path: `${projectName}/src/app/api/${routePath}/route.ts`,
          content: `import { NextResponse } from "next/server";\n\nexport const dynamic = "force-dynamic";\n\n// ${ep.beschreibung}\nexport async function ${ep.methode}() {\n  // TODO: Implement ${ep.beschreibung}\n  return NextResponse.json({ message: "Not implemented" }, { status: 501 });\n}\n`,
        });
      }
    }

    // Generate component stubs
    if (plan.uiKomponenten?.length) {
      for (const rolle of plan.uiKomponenten) {
        for (const screen of rolle.screens) {
          const componentName = screen.name.replace(/[^a-zA-Z0-9]/g, "");
          files.push({
            path: `${projectName}/src/components/${componentName}.tsx`,
            content: `"use client";\n\n// ${screen.beschreibung}\n// Komponenten: ${screen.komponenten.join(", ")}\n\ninterface ${componentName}Props {\n  // TODO: Define props\n}\n\nexport function ${componentName}({}: ${componentName}Props) {\n  return (\n    <div>\n      <h2>${screen.name}</h2>\n      {/* TODO: Implement ${screen.beschreibung} */}\n    </div>\n  );\n}\n`,
          });
        }
      }
    }

    console.log(`[Bootstrap] Template generated ${files.length} files for ${projectName}`);
    return { success: true, projectName, files };
  } catch (err) {
    console.error("[Bootstrap] Failed:", err);
    return { success: false, projectName: "", files: [], error: String(err) };
  }
}

// ─── Template Generators ─────────────────────────────────────────

function generateClaudeMd(submission: Submission, angebot: Angebot, plan: ProjectPlan): string {
  const techStack = plan.technologieStack?.map((t) => `- ${t.kategorie}: ${t.technologie}`).join("\n") || "- Next.js, TypeScript, Tailwind, PostgreSQL, Prisma";

  return `# ${submission.firma || submission.name}

## Projektbeschreibung
${submission.beschreibung}

## Zielgruppe
${submission.zielgruppe}

## Tech Stack
${techStack}

## Architektur
${plan.architektur?.beschreibung || "Next.js App Router mit PostgreSQL"}

## Datenbank
${plan.architektur?.datenbankmodell || "Siehe prisma/schema.prisma"}

## API-Endpunkte
${plan.apiEndpunkte?.map((e) => `- ${e.methode} ${e.pfad} — ${e.beschreibung}`).join("\n") || "Noch zu definieren"}

## Coding-Konventionen
- TypeScript strict mode
- Next.js App Router (NICHT Pages Router)
- Tailwind CSS für Styling
- Prisma als ORM
- Alle API-Routes: export const dynamic = "force-dynamic"
- Deutsche Benutzeroberfläche

## Deployment
- Hetzner VPS
- Docker + docker-compose
- GitHub Actions CI/CD
- PostgreSQL 16

## Festpreis
${angebot.festpreis.toLocaleString("de-DE")} € · ${angebot.aufwand} Personentage
`;
}

function generateKickoffMd(submission: Submission, angebot: Angebot): string {
  return `# Projekt-Kickoff: ${submission.firma || submission.name}

## Projektübersicht
${submission.beschreibung}

## Meilensteine
| Phase | Beschreibung | Zeitrahmen |
|-------|-------------|------------|
| 1. Setup | Infrastruktur, DB, CI/CD | Tag 1 |
| 2. MVP | Kernfunktionen | ${submission.zeitrahmenMvp} |
| 3. Feinschliff | UI, Tests, Optimierung | nach MVP |
| 4. Go-Live | Deployment + Monitoring | ${submission.zeitrahmenFinal} |

## Festpreis & Zahlung
- **Festpreis:** ${angebot.festpreis.toLocaleString("de-DE")} €
- **Aufwand:** ${angebot.aufwand} Personentage
- **Zahlungsbedingungen:**
  - 15% vor Projektstart
  - 35% nach MVP-Lieferung
  - 50% vor Go-Live / Übergabe

## Kontakt
- **Entwickler:** Achille Nana Chimi
- **E-Mail:** info@nanachimi.digital
- **Web:** https://nanachimi.digital

## Nächste Schritte
1. ✅ Angebot angenommen
2. ⬜ Erste Zahlung (15%)
3. ⬜ Kickoff-Termin
4. ⬜ Projektstart

---
Erstellt von [nanachimi.digital](https://nanachimi.digital) am ${new Date().toLocaleDateString("de-DE")}
`;
}

function generateReadme(submission: Submission, angebot: Angebot, plan: ProjectPlan): string {
  const techList = plan.technologieStack?.map((t) => `- **${t.kategorie}:** ${t.technologie}`).join("\n") || "- Next.js, TypeScript, Tailwind, PostgreSQL";

  return `# ${submission.firma || submission.name}

> ${submission.beschreibung.slice(0, 150)}

## Tech Stack
${techList}

## Schnellstart
\`\`\`bash
npm install
cp .env.example .env
npx prisma generate
npx prisma db push
npm run dev
\`\`\`

## Projektstruktur
\`\`\`
src/
├── app/          # Next.js App Router Pages + API
├── components/   # React UI-Komponenten
├── lib/          # Business Logic, DB, Utils
prisma/
└── schema.prisma # Datenbankschema
\`\`\`

## Festpreis
${angebot.festpreis.toLocaleString("de-DE")} € · ${angebot.aufwand} Personentage

---
Entwickelt von [nanachimi.digital](https://nanachimi.digital)
`;
}

function generatePrismaSchema(plan: ProjectPlan): string {
  let schema = `generator client {\n  provider = "prisma-client-js"\n}\n\ndatasource db {\n  provider = "postgresql"\n}\n\n`;

  if (plan.architektur?.datenbankmodell) {
    schema += `// Datenbankmodell (basierend auf Projektplan)\n// ${plan.architektur.datenbankmodell.replace(/\n/g, "\n// ")}\n\n`;
  }

  schema += `// TODO: Prisma-Modelle aus dem Datenbankmodell ableiten\n// Siehe CLAUDE.md für Details\n`;
  return schema;
}

// ─── ZIP Helper ──────────────────────────────────────────────────

export async function createProjectZip(files: { path: string; content: string }[]): Promise<Buffer> {
  const archiver = (await import("archiver")).default;

  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    const archive = archiver("zip", { zlib: { level: 9 } });

    archive.on("data", (chunk: Buffer) => chunks.push(chunk));
    archive.on("end", () => resolve(Buffer.concat(chunks)));
    archive.on("error", reject);

    for (const file of files) {
      archive.append(file.content, { name: file.path });
    }

    archive.finalize();
  });
}
