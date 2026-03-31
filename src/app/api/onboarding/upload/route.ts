import { NextResponse } from "next/server";
import { uploadFile } from "@/lib/seaweedfs";
import { prisma } from "@/lib/db";
import { formLimiter } from "@/lib/auth/rate-limit";
export const dynamic = "force-dynamic";

/** Sanitize filename: remove path traversal, special chars, limit length */
function sanitizeFilename(name: string): string {
  // Extract basename (remove any directory components)
  const basename = name.replace(/^.*[\\/]/, "");
  // Remove null bytes and control characters
  const clean = basename.replace(/[\x00-\x1f\x7f]/g, "");
  // Replace unsafe characters but keep dots, hyphens, underscores
  const safe = clean.replace(/[^a-zA-Z0-9._\-äöüÄÖÜß ]/g, "_");
  // Collapse multiple underscores/spaces
  const collapsed = safe.replace(/[_ ]{2,}/g, "_").trim();
  // Limit length (keep extension intact)
  const ext = collapsed.includes(".") ? "." + collapsed.split(".").pop()! : "";
  const stem = collapsed.slice(0, collapsed.length - ext.length);
  const maxStem = 200 - ext.length;
  return (stem.length > maxStem ? stem.slice(0, maxStem) : stem) + ext || "upload";
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const MAX_FILES = 5;
const ALLOWED_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/svg+xml",
  "application/pdf",
  "application/zip",
  "application/x-zip-compressed",
]);

/**
 * POST /api/onboarding/upload
 * Uploads a file to SeaweedFS and creates a SubmissionFile record.
 * Uses a tempToken (UUID) to link files to a submission that doesn't exist yet.
 */
export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const tempToken = formData.get("tempToken") as string | null;
    const category = (formData.get("category") as string) || "other";

    if (!file) {
      return NextResponse.json(
        { error: "Keine Datei hochgeladen" },
        { status: 400 }
      );
    }

    if (!tempToken) {
      return NextResponse.json(
        { error: "tempToken erforderlich" },
        { status: 400 }
      );
    }

    // Validate file type
    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: "Dateityp nicht erlaubt. Erlaubt: Bilder, PDF, ZIP" },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "Datei zu groß. Maximum: 10 MB" },
        { status: 400 }
      );
    }

    // Check total files for this tempToken
    const existingCount = await prisma.submissionFile.count({
      where: { tempToken },
    });

    if (existingCount >= MAX_FILES) {
      return NextResponse.json(
        { error: `Maximum ${MAX_FILES} Dateien erlaubt` },
        { status: 400 }
      );
    }

    // Rate limit
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    if (!formLimiter.check(ip)) {
      return NextResponse.json(
        { error: "Zu viele Anfragen. Bitte versuchen Sie es später erneut." },
        { status: 429 }
      );
    }

    // Upload to SeaweedFS
    const safeName = sanitizeFilename(file.name);
    const buffer = Buffer.from(await file.arrayBuffer());
    const seaweedFid = await uploadFile(buffer, safeName, file.type);

    // Create SubmissionFile record
    const record = await prisma.submissionFile.create({
      data: {
        tempToken,
        filename: safeName,
        fileSize: file.size,
        contentType: file.type,
        seaweedFid,
        category,
      },
    });

    return NextResponse.json({
      id: record.id,
      filename: record.filename,
      fileSize: record.fileSize,
      contentType: record.contentType,
      category: record.category,
    });
  } catch (err) {
    console.error("[Upload] Error:", err);
    const message = err instanceof Error ? err.message : "Unbekannter Fehler";
    const isSeaweedDown = message.includes("fetch failed") || message.includes("ECONNREFUSED") || message.includes("SeaweedFS");
    return NextResponse.json(
      {
        error: isSeaweedDown
          ? "Datei-Storage nicht erreichbar. Bitte versuchen Sie es später erneut."
          : "Upload fehlgeschlagen",
      },
      { status: isSeaweedDown ? 503 : 500 }
    );
  }
}

/**
 * DELETE /api/onboarding/upload?id=xxx&tempToken=yyy
 * Removes a file from the SubmissionFile table (not from SeaweedFS — cleanup is separate).
 */
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const tempToken = searchParams.get("tempToken");

    if (!id || !tempToken) {
      return NextResponse.json(
        { error: "id und tempToken erforderlich" },
        { status: 400 }
      );
    }

    // Only allow deletion of own files (matched by tempToken)
    const deleted = await prisma.submissionFile.deleteMany({
      where: { id, tempToken },
    });

    if (deleted.count === 0) {
      return NextResponse.json(
        { error: "Datei nicht gefunden" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[Upload] Delete error:", err);
    return NextResponse.json(
      { error: "Löschen fehlgeschlagen" },
      { status: 500 }
    );
  }
}
