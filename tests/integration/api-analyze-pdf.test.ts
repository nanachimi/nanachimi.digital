import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock dependencies
vi.mock("@/lib/db", () => ({
  prisma: {
    submissionFile: {
      findFirst: vi.fn(),
    },
  },
}));

vi.mock("@/lib/seaweedfs", () => ({
  downloadFile: vi.fn(),
}));

vi.mock("@/lib/pdf-analysis", () => ({
  analyzePdf: vi.fn(),
}));

vi.mock("@/lib/auth/rate-limit", () => ({
  formLimiter: {
    check: vi.fn().mockReturnValue(true),
  },
}));

vi.mock("@/lib/logger", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

import { prisma } from "@/lib/db";
import { downloadFile } from "@/lib/seaweedfs";
import { analyzePdf } from "@/lib/pdf-analysis";
import { formLimiter } from "@/lib/auth/rate-limit";

// We'll import the route handler dynamically to avoid env var issues
async function callRoute(body: Record<string, unknown>) {
  const { POST } = await import(
    "@/app/api/onboarding/analyze-pdf/route"
  );
  const request = new Request("http://localhost:3000/api/onboarding/analyze-pdf", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-forwarded-for": "127.0.0.1",
    },
    body: JSON.stringify(body),
  });
  return POST(request);
}

beforeEach(() => {
  vi.clearAllMocks();
  // Restore defaults after clearAllMocks
  vi.mocked(formLimiter.check).mockReturnValue(true);
  // Ensure ANTHROPIC_API_KEY is set for most tests
  vi.stubEnv("ANTHROPIC_API_KEY", "test-key");
});

describe("POST /api/onboarding/analyze-pdf", () => {
  it("returns 400 when fileId is missing", async () => {
    const res = await callRoute({ tempToken: "abc" });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBeDefined();
  });

  it("returns 400 when tempToken is missing", async () => {
    const res = await callRoute({ fileId: "abc" });
    expect(res.status).toBe(400);
  });

  it("returns 404 when file not found", async () => {
    vi.mocked(prisma.submissionFile.findFirst).mockResolvedValue(null);

    const res = await callRoute({
      fileId: "file-1",
      tempToken: "token-1",
    });
    expect(res.status).toBe(404);
  });

  it("returns 400 for non-PDF files", async () => {
    vi.mocked(prisma.submissionFile.findFirst).mockResolvedValue({
      id: "file-1",
      submissionId: null,
      tempToken: "token-1",
      filename: "image.png",
      fileSize: 1024,
      contentType: "image/png",
      seaweedFid: "fid-1",
      category: "branding",
      createdAt: new Date(),
    });

    const res = await callRoute({
      fileId: "file-1",
      tempToken: "token-1",
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("PDF");
  });

  it("returns 429 when rate limited", async () => {
    vi.mocked(formLimiter.check).mockReturnValue(false);

    const res = await callRoute({
      fileId: "file-1",
      tempToken: "token-1",
    });
    expect(res.status).toBe(429);
  });

  it("returns 503 when ANTHROPIC_API_KEY is missing", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "");

    const res = await callRoute({
      fileId: "file-1",
      tempToken: "token-1",
    });
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.fallback).toBe(true);
  });

  it("returns extracted data for valid PDF", async () => {
    vi.mocked(prisma.submissionFile.findFirst).mockResolvedValue({
      id: "file-1",
      submissionId: null,
      tempToken: "token-1",
      filename: "konzept.pdf",
      fileSize: 50000,
      contentType: "application/pdf",
      seaweedFid: "fid-1",
      category: "pdf_konzept",
      createdAt: new Date(),
    });

    vi.mocked(downloadFile).mockResolvedValue(Buffer.from("fake-pdf"));

    vi.mocked(analyzePdf).mockResolvedValue({
      extracted: {
        projekttyp: "web",
        beschreibung: "Eine Webanwendung für Projektmanagement",
        funktionen: ["Anmeldung & Benutzerkonten", "Verwaltungsbereich"],
      },
      confidence: {
        projekttyp: "high",
        beschreibung: "high",
        funktionen: "medium",
      },
      missing: [
        "rollenAnzahl",
        "designLevel",
        "zeitrahmenMvp",
        "zeitrahmenFinal",
        "budget",
        "betriebUndWartung",
        "monetarisierung",
      ],
      summary:
        "Ihr PDF beschreibt eine Webanwendung für Projektmanagement mit Benutzerverwaltung.",
    });

    const res = await callRoute({
      fileId: "file-1",
      tempToken: "token-1",
    });
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.extracted.projekttyp).toBe("web");
    expect(body.extracted.funktionen).toHaveLength(2);
    expect(body.missing).toContain("rollenAnzahl");
    expect(body.summary).toBeDefined();
    expect(body.confidence.projekttyp).toBe("high");
  });

  it("returns fallback: true when analysis fails", async () => {
    vi.mocked(prisma.submissionFile.findFirst).mockResolvedValue({
      id: "file-1",
      submissionId: null,
      tempToken: "token-1",
      filename: "konzept.pdf",
      fileSize: 50000,
      contentType: "application/pdf",
      seaweedFid: "fid-1",
      category: "pdf_konzept",
      createdAt: new Date(),
    });

    vi.mocked(downloadFile).mockResolvedValue(Buffer.from("fake-pdf"));
    vi.mocked(analyzePdf).mockRejectedValue(new Error("AI failed"));

    const res = await callRoute({
      fileId: "file-1",
      tempToken: "token-1",
    });
    expect(res.status).toBe(500);

    const body = await res.json();
    expect(body.fallback).toBe(true);
    expect(body.error).toBeDefined();
  });
});
