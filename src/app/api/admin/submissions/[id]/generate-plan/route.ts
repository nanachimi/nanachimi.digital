import { NextResponse } from "next/server";
import { getSubmissionById } from "@/lib/submissions";
import { requireAdmin } from "@/lib/auth/require-admin";
import {
  PLAN_SYSTEM_PROMPT,
  buildPlanPrompt,
  type ProjectPlan,
  type PlanPromptInput,
} from "@/lib/plan-template";

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
  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "LLM-Integration nicht konfiguriert. Bitte ANTHROPIC_API_KEY in .env setzen.",
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
    rollenAnzahl: submission.rollenAnzahl,
    rollenBeschreibung: submission.rollenBeschreibung,
    appStruktur: submission.appStruktur,
    rollenApps: submission.rollenApps,
    designLevel: submission.designLevel,
    zeitrahmenMvp: submission.zeitrahmenMvp,
    zeitrahmenFinal: submission.zeitrahmenFinal,
    betriebUndWartung: submission.betriebUndWartung,
    zusatzinfo: submission.zusatzinfo,
  };

  const userPrompt = buildPlanPrompt(input);

  try {
    // Dynamic import to avoid bundling issues if SDK is not installed
    const { default: Anthropic } = await import("@anthropic-ai/sdk");
    const client = new Anthropic({ apiKey });

    const message = await client.messages.create({
      model: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-20250514",
      max_tokens: 4096,
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
