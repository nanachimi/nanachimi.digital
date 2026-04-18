import { NextResponse } from "next/server";
import { getSubmissionById } from "@/lib/submissions";
import { requireAdmin } from "@/lib/auth/require-admin";
import {
  PLAN_SYSTEM_PROMPT,
  buildPlanPrompt,
  type ProjectPlan,
  type PlanPromptInput,
} from "@/lib/plan-template";

export const dynamic = "force-dynamic";

/**
 * Attempt to repair truncated JSON by closing open strings, arrays, and objects.
 */
function repairTruncatedJson(json: string): string {
  // Close any open string (find last unescaped quote)
  let inString = false;
  for (let i = 0; i < json.length; i++) {
    if (json[i] === '"' && (i === 0 || json[i - 1] !== '\\')) {
      inString = !inString;
    }
  }
  if (inString) json += '"';

  // Count open brackets/braces and close them
  let openBraces = 0;
  let openBrackets = 0;
  inString = false;
  for (let i = 0; i < json.length; i++) {
    if (json[i] === '"' && (i === 0 || json[i - 1] !== '\\')) {
      inString = !inString;
      continue;
    }
    if (inString) continue;
    if (json[i] === '{') openBraces++;
    else if (json[i] === '}') openBraces--;
    else if (json[i] === '[') openBrackets++;
    else if (json[i] === ']') openBrackets--;
  }

  // Remove trailing comma if present
  json = json.replace(/,\s*$/, '');

  // Close arrays then objects
  for (let i = 0; i < openBrackets; i++) json += ']';
  for (let i = 0; i < openBraces; i++) json += '}';

  return json;
}

// POST /api/admin/submissions/[id]/generate-plan
// Calls Anthropic Claude API to generate a structured project plan
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try { await requireAdmin(); } catch {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }
  const { id } = await params;

  // System env (e.g. from Claude Code CLI) may set ANTHROPIC_API_KEY to empty,
  // overriding .env — fall back to reading .env/.env.local directly
  let apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    try {
      const fs = await import("fs");
      const path = await import("path");
      for (const envFile of [".env.local", ".env"]) {
        const filePath = path.default.join(process.cwd(), envFile);
        if (fs.existsSync(filePath)) {
          const match = fs.readFileSync(filePath, "utf-8").match(/^ANTHROPIC_API_KEY=["']?(.+?)["']?\s*$/m);
          if (match?.[1]) { apiKey = match[1]; break; }
        }
      }
    } catch { /* ignore */ }
  }
  if (!apiKey || apiKey === "sk-ant-..." || apiKey.length < 20) {
    return NextResponse.json(
      {
        error:
          "LLM-Integration nicht konfiguriert. Bitte einen gültigen ANTHROPIC_API_KEY in .env setzen.",
      },
      { status: 503 }
    );
  }

  const submission = await getSubmissionById(id);
  if (!submission) {
    return NextResponse.json(
      { error: "Anfrage nicht gefunden" },
      { status: 404 }
    );
  }

  // Build the prompt from submission data
  const input: PlanPromptInput = {
    projekttyp: submission.projekttyp,
    beschreibung: submission.beschreibung,
    zielgruppe: submission.zielgruppe,
    funktionen: submission.funktionen,
    funktionenGruppen: submission.funktionenGruppen,
    rollenAnzahl: submission.rollenAnzahl,
    rollenName: submission.rollenName,
    rollenBeschreibung: submission.rollenBeschreibung,
    appStruktur: submission.appStruktur,
    rollenApps: submission.rollenApps,
    designLevel: submission.designLevel,
    budget: submission.budget,
    zeitrahmenMvp: submission.zeitrahmenMvp,
    zeitrahmenFinal: submission.zeitrahmenFinal,
    betriebUndWartung: submission.betriebUndWartung,
    betriebLaufzeit: submission.betriebLaufzeit,
    markenname: submission.markenname,
    domain: submission.domain,
    brandingInfo: submission.brandingInfo,
    inspirationUrls: submission.inspirationUrls,
    monetarisierung: submission.monetarisierung,
    monetarisierungDetails: submission.monetarisierungDetails,
    werZahlt: submission.werZahlt,
    zahlendeGruppen: submission.zahlendeGruppen,
    zusatzinfo: submission.zusatzinfo,
  };

  const userPrompt = buildPlanPrompt(input);

  try {
    // Dynamic import to avoid bundling issues if SDK is not installed
    const { default: Anthropic } = await import("@anthropic-ai/sdk");
    const client = new Anthropic({ apiKey });

    const message = await client.messages.create({
      model: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-20250514",
      max_tokens: 16384,
      system: PLAN_SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
    });

    // Extract text from response
    const textBlock = message.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return NextResponse.json(
        { error: "Keine Textantwort vom LLM erhalten" },
        { status: 500 }
      );
    }

    // Parse JSON from response (strip any markdown code fences if present)
    let jsonStr = textBlock.text.trim();
    if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }

    // If the response was truncated (stop_reason = "max_tokens"), try to repair the JSON
    if (message.stop_reason === "max_tokens") {
      console.warn("LLM response truncated — attempting JSON repair");
      jsonStr = repairTruncatedJson(jsonStr);
    }

    const plan: ProjectPlan = {
      ...JSON.parse(jsonStr),
      generatedAt: new Date().toISOString(),
    };

    return NextResponse.json({ plan });
  } catch (error) {
    console.error("LLM plan generation failed:", error);
    return NextResponse.json(
      {
        error: "Projektplan-Generierung fehlgeschlagen",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
