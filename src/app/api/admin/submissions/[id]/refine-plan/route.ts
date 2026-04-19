import { NextResponse } from "next/server";
import { getSubmissionById } from "@/lib/submissions";
import { requireAdmin } from "@/lib/auth/require-admin";
import {
  REFINE_SYSTEM_PROMPT,
  buildRefinementPrompt,
  type ProjectPlan,
  type PlanPromptInput,
} from "@/lib/plan-template";

export const dynamic = "force-dynamic";

/**
 * Attempt to repair truncated JSON by closing open strings, arrays, and objects.
 */
function repairTruncatedJson(json: string): string {
  let inString = false;
  for (let i = 0; i < json.length; i++) {
    if (json[i] === '"' && (i === 0 || json[i - 1] !== '\\')) {
      inString = !inString;
    }
  }
  if (inString) json += '"';

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

  json = json.replace(/,\s*$/, '');
  for (let i = 0; i < openBrackets; i++) json += ']';
  for (let i = 0; i < openBraces; i++) json += '}';

  return json;
}

// POST /api/admin/submissions/[id]/refine-plan
// Refines an existing project plan based on admin instructions
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try { await requireAdmin(); } catch {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }
  const { id } = await params;

  // Parse request body
  let currentPlan: ProjectPlan;
  let adminPrompt: string;
  try {
    const body = await request.json();
    currentPlan = body.currentPlan;
    adminPrompt = body.adminPrompt;
    if (!currentPlan || !adminPrompt?.trim()) {
      return NextResponse.json(
        { error: "currentPlan und adminPrompt sind erforderlich" },
        { status: 400 }
      );
    }
  } catch {
    return NextResponse.json(
      { error: "Ungültiger Request-Body" },
      { status: 400 }
    );
  }

  // Resolve API key
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
      { error: "LLM-Integration nicht konfiguriert. Bitte einen gültigen ANTHROPIC_API_KEY in .env setzen." },
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

  // Build submission context for the refinement prompt
  const submissionContext: PlanPromptInput = {
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

  const userPrompt = buildRefinementPrompt(currentPlan, adminPrompt, submissionContext);

  try {
    const { default: Anthropic } = await import("@anthropic-ai/sdk");
    const client = new Anthropic({ apiKey });

    const message = await client.messages.create({
      model: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-20250514",
      max_tokens: 16384,
      system: REFINE_SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
    });

    const textBlock = message.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return NextResponse.json(
        { error: "Keine Textantwort vom LLM erhalten" },
        { status: 500 }
      );
    }

    let jsonStr = textBlock.text.trim();
    if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }

    if (message.stop_reason === "max_tokens") {
      console.warn("LLM refinement response truncated — attempting JSON repair");
      jsonStr = repairTruncatedJson(jsonStr);
    }

    const plan: ProjectPlan = {
      ...JSON.parse(jsonStr),
      generatedAt: new Date().toISOString(),
    };

    return NextResponse.json({ plan });
  } catch (error) {
    console.error("LLM plan refinement failed:", error);
    return NextResponse.json(
      {
        error: "Projektplan-Verfeinerung fehlgeschlagen",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
