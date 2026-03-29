/**
 * Project Bootstrap Logic
 *
 * After a client accepts an Angebot, this module generates the initial
 * project structure with Claude Code skills, README, and config files.
 *
 * In V1: Generates markdown files describing the project.
 * In V2: Will create actual Git repos with scaffolded code.
 */

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

function generateProjektMd(submission: Submission, angebot: Angebot): string {
  return `# Projekt: ${submission.firma || submission.name}

## Kunde
- **Name:** ${submission.name}
- **E-Mail:** ${submission.email}
${submission.firma ? `- **Firma:** ${submission.firma}` : ""}
${submission.telefon ? `- **Telefon:** ${submission.telefon}` : ""}

## Projektübersicht
${submission.beschreibung}

## Zielgruppe
${submission.zielgruppe}

## Typ
${submission.projekttyp}

## Features
${submission.funktionen.map((f) => `- ${f}`).join("\n")}

## Zeitrahmen
- MVP: ${submission.zeitrahmenMvp}
- Final: ${submission.zeitrahmenFinal}

## Budget
- Festpreis: ${angebot.festpreis.toLocaleString("de-DE")} €
- Aufwand: ${angebot.aufwand} Personentage

## Design
${submission.designLevel}

## Betrieb & Wartung
${submission.betriebUndWartung}
`;
}

function generateArchitekturMd(plan: ProjectPlan): string {
  let md = `# Architektur\n\n`;

  if (plan.architektur) {
    md += `## Systemübersicht\n${plan.architektur.beschreibung}\n\n`;
    md += `## Datenfluss\n${plan.architektur.datenfluss}\n\n`;
    md += `## Datenbankmodell\n${plan.architektur.datenbankmodell}\n\n`;
  }

  if (plan.technologieStack?.length) {
    md += `## Tech Stack\n`;
    md += `| Kategorie | Technologie | Begründung |\n|---|---|---|\n`;
    for (const t of plan.technologieStack) {
      md += `| ${t.kategorie} | ${t.technologie} | ${t.begruendung} |\n`;
    }
    md += "\n";
  }

  if (plan.apiEndpunkte?.length) {
    md += `## API-Endpunkte\n`;
    md += `| Methode | Pfad | Beschreibung |\n|---|---|---|\n`;
    for (const e of plan.apiEndpunkte) {
      md += `| ${e.methode} | ${e.pfad} | ${e.beschreibung} |\n`;
    }
    md += "\n";
  }

  return md;
}

function generateFeaturesMd(plan: ProjectPlan): string {
  let md = `# Features\n\n`;

  if (plan.anforderungen?.userStories?.length) {
    md += `## User Stories\n\n`;
    for (const story of plan.anforderungen.userStories) {
      const badge = story.prioritaet.toUpperCase();
      md += `- [ ] **[${badge}]** Als ${story.rolle} möchte ich ${story.aktion}, damit ${story.nutzen}\n`;
    }
    md += "\n";
  }

  if (plan.uiKomponenten?.length) {
    md += `## UI-Komponenten\n\n`;
    for (const rolle of plan.uiKomponenten) {
      md += `### ${rolle.rolle}\n`;
      for (const screen of rolle.screens) {
        md += `- **${screen.name}:** ${screen.beschreibung}\n`;
        md += `  Komponenten: ${screen.komponenten.join(", ")}\n`;
      }
      md += "\n";
    }
  }

  return md;
}

function generateDeploymentMd(): string {
  return `# Deployment

## Voraussetzungen
- Node.js 20+
- Docker & Docker Compose
- PostgreSQL 16

## Lokale Entwicklung
\`\`\`bash
npm install
cp .env.example .env
npm run dev
\`\`\`

## Deployment (Hetzner)
\`\`\`bash
docker-compose up -d
\`\`\`

## CI/CD
GitHub Actions Pipeline:
1. Build & Test
2. Docker Image erstellen
3. Deploy auf Hetzner

## Monitoring
- Health Check: GET /api/health
- Logs: Docker Logs
`;
}

function generateReadme(submission: Submission, angebot: Angebot): string {
  return `# ${submission.firma || submission.name}

> ${submission.beschreibung.slice(0, 100)}

## Tech Stack
- Next.js 15
- TypeScript
- Tailwind CSS
- PostgreSQL + Prisma
- Docker

## Schnellstart
\`\`\`bash
npm install
cp .env.example .env
npm run dev
\`\`\`

## Projekt-Details
- **Festpreis:** ${angebot.festpreis.toLocaleString("de-DE")} €
- **Aufwand:** ${angebot.aufwand} Personentage
- **Zeitrahmen:** ${submission.zeitrahmenMvp}

## Betrieb & Wartung
1 Monat inkl. im Festpreis. Danach optional als Abo buchbar.

---
Erstellt von [nanachimi.digital](https://nanachimi.digital)
`;
}

/**
 * Generate project bootstrap files.
 *
 * In V1, this creates in-memory file representations.
 * In V2, this will create actual Git repositories.
 */
export function bootstrapProject(
  submission: Submission,
  angebot: Angebot
): BootstrapResult {
  try {
    const firma = submission.firma || submission.name;
    const projectName = `projekt-${slugify(firma)}-${angebot.id.slice(4, 12)}`;

    const plan = angebot.plan;

    const files: { path: string; content: string }[] = [
      {
        path: `${projectName}/.claude/skills/PROJEKT.md`,
        content: generateProjektMd(submission, angebot),
      },
      {
        path: `${projectName}/.claude/skills/ARCHITEKTUR.md`,
        content: generateArchitekturMd(plan),
      },
      {
        path: `${projectName}/.claude/skills/FEATURES.md`,
        content: generateFeaturesMd(plan),
      },
      {
        path: `${projectName}/.claude/skills/DEPLOYMENT.md`,
        content: generateDeploymentMd(),
      },
      {
        path: `${projectName}/README.md`,
        content: generateReadme(submission, angebot),
      },
      {
        path: `${projectName}/.env.example`,
        content: `DATABASE_URL=postgresql://user:password@localhost:5432/${slugify(firma)}
NEXT_PUBLIC_SITE_URL=http://localhost:3000
SMTP_HOST=localhost
SMTP_PORT=1025
`,
      },
      {
        path: `${projectName}/.gitignore`,
        content: `node_modules/
.next/
.env
.env.local
dist/
`,
      },
    ];

    console.log(
      `[Bootstrap] Generated ${files.length} files for project ${projectName}`
    );

    return {
      success: true,
      projectName,
      files,
    };
  } catch (err) {
    console.error("[Bootstrap] Failed:", err);
    return {
      success: false,
      projectName: "",
      files: [],
      error: String(err),
    };
  }
}
