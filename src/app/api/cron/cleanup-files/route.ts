import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

/**
 * GET /api/cron/cleanup-files
 * Removes orphaned SubmissionFile records (uploaded but never linked to a submission).
 * Called by background scheduler every 6 hours.
 * Protected by CRON_SECRET middleware.
 */
export async function GET() {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago

  const orphans = await prisma.submissionFile.findMany({
    where: {
      submissionId: null,
      createdAt: { lt: cutoff },
    },
    take: 50, // Process in batches to avoid timeouts
  });

  if (orphans.length === 0) {
    return NextResponse.json({ cleaned: 0, timestamp: new Date().toISOString() });
  }

  let cleaned = 0;
  let errors = 0;

  for (const file of orphans) {
    // Best-effort: delete from SeaweedFS, then remove DB record
    if (file.seaweedFid) {
      try {
        const { deleteFile } = await import("@/lib/seaweedfs");
        await deleteFile(file.seaweedFid);
      } catch (err) {
        logger.warn(
          { tag: "CleanupFiles", fileId: file.id, fid: file.seaweedFid, err },
          "SeaweedFS delete failed, removing DB record anyway",
        );
        errors++;
      }
    }

    await prisma.submissionFile.delete({ where: { id: file.id } });
    cleaned++;
  }

  logger.info({ tag: "CleanupFiles", cleaned, errors, total: orphans.length }, "Orphaned files cleaned");

  return NextResponse.json({
    cleaned,
    errors,
    timestamp: new Date().toISOString(),
  });
}
