import Anthropic from "@anthropic-ai/sdk";
import { logger } from "@/lib/logger";
import type { OnboardingData } from "@/lib/onboarding-schema";
import {
  FEATURE_OPTIONS,
  MONETARISIERUNG_OPTIONS,
} from "@/lib/onboarding-schema";

// ─── Types ───────────────────────────────────────────────────────────

export interface PdfAnalysisResult {
  extracted: Partial<OnboardingData>;
  confidence: Record<string, "high" | "medium" | "low">;
  missing: string[];
  summary: string;
}

// ─── Required fields that must be filled for a valid submission ─────
// Contact fields (name, email, naechsterSchritt) are ALWAYS collected
// separately and never pre-filled from PDF.

export const REQUIRED_ONBOARDING_FIELDS = [
  "projekttyp",
  "beschreibung",
  "funktionen",
  "rollenAnzahl",
  "designLevel",
  "zeitrahmenMvp",
  "zeitrahmenFinal",
  "budget",
  "betriebUndWartung",
  "monetarisierung",
] as const;

// ─── AI Prompt (German) ─────────────────────────────────────────────

const PDF_ANALYSIS_SYSTEM_PROMPT = `Du bist ein erfahrener Business Analyst bei NanaChimi Digital.
Deine Aufgabe: Analysiere ein PDF-Dokument, das eine Projektidee beschreibt, und extrahiere daraus strukturierte Daten für unser Onboarding-System.

Du erhältst das PDF als Dokument. Analysiere sowohl den Text als auch alle Abbildungen, Wireframes, Skizzen oder Illustrationen.

Antworte AUSSCHLIESSLICH mit validem JSON in der vorgegebenen Struktur. Kein Markdown, keine Erklärungen drumherum.

## Zu extrahierende Felder

1. **projekttyp** (enum: "web" | "mobile" | "desktop" | "beides" | "unsicher")
   - Aus Kontext ableiten: erwähnt das PDF eine App, Website, beides?

2. **beschreibung** (string, min 10 Zeichen)
   - Kernbeschreibung des Projekts in 2-4 Sätzen zusammenfassen.

3. **funktionen** (string[], mindestens 1)
   Vordefinierte Optionen (exakte Labels verwenden, wenn passend):
   ${FEATURE_OPTIONS.map((f) => `- "${f}"`).join("\n   ")}

   Wenn das PDF Features beschreibt, die keiner vordefinierten Option entsprechen,
   erstelle Custom-Features mit dem Prefix "custom:" (max 35 Zeichen pro Feature).
   Beispiel: "custom:Kartenansicht" oder "custom:QR-Code Scanner"

4. **rollenAnzahl** (enum: "1" | "2" | "3+")
   - Wie viele unterschiedliche Benutzergruppen gibt es?

5. **rollenName** (string, optional)
   - Name der Hauptrolle, wenn nur eine Benutzergruppe.

6. **rollenBeschreibung** (string, optional)
   - Kurze Beschreibung der Rollen.

7. **appStruktur** (enum: "shared" | "separate", optional)
   - Nutzen verschiedene Rollen dieselbe App oder getrennte Apps?

8. **designLevel** (enum: "standard" | "individuell" | "premium")
   - Standard: einfach, funktional
   - Individuell: eigenes Design, CI-konform
   - Premium: animiert, hochwertig, starke Markenidentität

9. **zeitrahmenMvp** (enum: "48h" | "1-2wochen" | "1monat" | "flexibel")
   - Wann soll die erste Version live sein?

10. **zeitrahmenFinal** (enum: "1monat" | "2-3monate" | "6monate" | "laufend")
    - Wann soll die finale Version fertig sein?

11. **budget** (enum: "unter-399" | "399-1000" | "1000-5000" | "5000-10000" | "10000-plus" | "unsicher")
    - Welches Budget ist vorgesehen?

12. **betriebUndWartung** (enum: "ja" | "teilweise" | "nein" | "unsicher" | "ohne")
    - Soll nach Go-Live Betrieb & Wartung inklusive sein?

13. **monetarisierung** (string[], mindestens 1 aus: ${MONETARISIERUNG_OPTIONS.map((m) => `"${m}"`).join(" | ")})
    - Wie soll das Projekt Geld verdienen?

14. **zielgruppe** (string, optional)
    - Wer ist die Zielgruppe?

15. **markenname** (string, optional)
16. **domain** (string, optional)
17. **brandingInfo** (string, optional)

## Antwortformat

{
  "extracted": {
    // Nur die Felder, die du aus dem PDF ableiten konntest.
    // Felder, die du NICHT finden kannst, WEGLASSEN (nicht null setzen).
  },
  "confidence": {
    // Für jedes extrahierte Feld: wie sicher bist du?
    // "high" = klar im Dokument beschrieben
    // "medium" = aus Kontext abgeleitet
    // "low" = eher geraten, Nutzer sollte bestätigen
  },
  "missing": [
    // Feldnamen, die du NICHT extrahieren konntest
  ],
  "summary": "Kurze, freundliche Zusammenfassung auf Deutsch, was du aus dem PDF verstanden hast (2-3 Sätze)."
}

## Wichtige Regeln
- Sei konservativ: Wenn du dir nicht sicher bist, lass das Feld weg (lieber nachfragen als raten).
- Bei "low" confidence: Feld trotzdem extrahieren, damit der Nutzer es bestätigen/korrigieren kann.
- Illustrationen/Wireframes: Beschreibe erkannte UI-Elemente und leite daraus Features ab.
- Antworte NUR mit JSON. Keine Markdown-Blöcke (\`\`\`) drumherum.`;

// ─── Analysis function ──────────────────────────────────────────────

export async function analyzePdf(
  pdfBuffer: Buffer,
  filename: string
): Promise<PdfAnalysisResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY not configured");
  }

  const client = new Anthropic({ apiKey });
  const pdfBase64 = pdfBuffer.toString("base64");

  logger.info({ tag: "PdfAnalysis", filename }, "Starting PDF analysis");

  const response = await client.messages.create({
    model: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-20250514",
    max_tokens: 4000,
    system: PDF_ANALYSIS_SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "document",
            source: {
              type: "base64",
              media_type: "application/pdf",
              data: pdfBase64,
            },
          },
          {
            type: "text",
            text: `Analysiere dieses PDF-Dokument ("${filename}") und extrahiere die Projektanforderungen im vorgegebenen JSON-Format.`,
          },
        ],
      },
    ],
  });

  // Extract text from response
  const text = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");

  // Strip potential markdown code fences
  const jsonStr = text
    .replace(/^```(?:json)?\s*/, "")
    .replace(/\s*```$/, "")
    .trim();

  let result: PdfAnalysisResult;
  try {
    result = JSON.parse(jsonStr) as PdfAnalysisResult;
  } catch (parseErr) {
    logger.error(
      { tag: "PdfAnalysis", filename, rawResponse: text.slice(0, 500) },
      "Failed to parse AI response as JSON"
    );
    throw new Error("AI response was not valid JSON");
  }

  // Ensure result has the right shape
  if (!result.extracted) result.extracted = {};
  if (!result.confidence) result.confidence = {};
  if (!result.missing) result.missing = [];
  if (!result.summary) result.summary = "";

  // Validate: ensure missing includes all REQUIRED fields not in extracted
  const actualMissing = REQUIRED_ONBOARDING_FIELDS.filter(
    (field) =>
      !(field in result.extracted) ||
      result.extracted[field as keyof typeof result.extracted] === undefined
  );

  result.missing = Array.from(new Set([...result.missing, ...actualMissing]));

  logger.info(
    {
      tag: "PdfAnalysis",
      filename,
      extractedCount: Object.keys(result.extracted).length,
      missingCount: result.missing.length,
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
    },
    "PDF analysis complete"
  );

  return result;
}

// ─── Utilities ──────────────────────────────────────────────────────

/**
 * Groups related missing fields that share a Step component.
 * e.g., zeitrahmenMvp + zeitrahmenFinal → one "zeitrahmen" group.
 */
export function groupMissingFields(missing: string[]): string[] {
  const grouped = new Set<string>();
  const hasZeitrahmenMvp = missing.includes("zeitrahmenMvp");
  const hasZeitrahmenFinal = missing.includes("zeitrahmenFinal");

  for (const field of missing) {
    if (field === "zeitrahmenMvp" || field === "zeitrahmenFinal") {
      // Group both into a single "zeitrahmen" entry
      if (hasZeitrahmenMvp || hasZeitrahmenFinal) {
        grouped.add("zeitrahmen");
      }
    } else {
      grouped.add(field);
    }
  }

  return Array.from(grouped);
}
