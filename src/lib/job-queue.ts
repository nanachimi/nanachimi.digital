import { prisma } from "@/lib/db";

// Exponential backoff: 1m, 5m, 15m, 60m, 240m
const BACKOFF_MINUTES = [1, 5, 15, 60, 240];

const JOB_TITLES: Record<string, string> = {
  angebot_accepted_email: "Angebot-Bestätigung mit PDF per E-Mail",
};

/**
 * Create an incident visible in the admin backoffice.
 */
export async function createIncident(data: {
  severity: "critical" | "warning" | "info";
  title: string;
  message: string;
  source: string;
  referenceId?: string;
}) {
  const incident = await prisma.incident.create({
    data: {
      severity: data.severity,
      title: data.title,
      message: data.message,
      source: data.source,
      referenceId: data.referenceId,
    },
  });
  console.log(`[Incident] Created ${data.severity} incident: ${incident.id} — ${data.title}`);
  return incident;
}

/**
 * Enqueue a job for reliable processing with automatic retries.
 */
export async function enqueueJob(
  type: string,
  payload: Record<string, unknown>,
  maxAttempts = 5
) {
  const job = await prisma.job.create({
    data: {
      type,
      payload: JSON.parse(JSON.stringify(payload)),
      maxAttempts,
      status: "pending",
      nextRunAt: new Date(),
    },
  });
  console.log(`[JobQueue] Enqueued job ${job.id} (type=${type})`);
  return job;
}

/**
 * Process all pending jobs that are due.
 * Called by the cron endpoint or after enqueue for immediate execution.
 */
export async function processJobs(): Promise<{
  processed: number;
  succeeded: number;
  failed: number;
}> {
  const now = new Date();
  let processed = 0;
  let succeeded = 0;
  let failed = 0;

  // Fetch jobs that are pending and due
  const jobs = await prisma.job.findMany({
    where: {
      status: { in: ["pending", "failed"] },
      nextRunAt: { lte: now },
      attempts: { lt: prisma.job.fields.maxAttempts ? undefined : 100 },
    },
    orderBy: { nextRunAt: "asc" },
    take: 10, // Process max 10 jobs per run
  });

  // Filter out jobs that have exhausted retries
  const eligibleJobs = jobs.filter((j) => j.attempts < j.maxAttempts);

  for (const job of eligibleJobs) {
    processed++;

    // Mark as processing
    await prisma.job.update({
      where: { id: job.id },
      data: { status: "processing", attempts: job.attempts + 1 },
    });

    try {
      const handler = JOB_HANDLERS[job.type];
      if (!handler) {
        throw new Error(`Unknown job type: ${job.type}`);
      }

      await handler(job.payload as Record<string, unknown>);

      // Success — mark completed
      await prisma.job.update({
        where: { id: job.id },
        data: {
          status: "completed",
          completedAt: new Date(),
          lastError: null,
        },
      });
      succeeded++;
      console.log(`[JobQueue] Job ${job.id} (${job.type}) completed on attempt ${job.attempts + 1}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      const attempt = job.attempts + 1;

      if (attempt >= job.maxAttempts) {
        // Exhausted retries — mark permanently failed + create incident
        await prisma.job.update({
          where: { id: job.id },
          data: {
            status: "failed",
            lastError: `[Attempt ${attempt}/${job.maxAttempts}] ${errorMessage}`,
          },
        });

        // Create a critical incident in admin backoffice
        await createIncident({
          severity: "critical",
          title: `Job fehlgeschlagen: ${JOB_TITLES[job.type] || job.type}`,
          message: `${errorMessage}\n\nJob ID: ${job.id}\nTyp: ${job.type}\nVersuche: ${attempt}/${job.maxAttempts}`,
          source: "job_queue",
          referenceId: job.id,
        });

        console.error(
          `[JobQueue] Job ${job.id} (${job.type}) permanently failed after ${attempt} attempts: ${errorMessage}`
        );
      } else {
        // Schedule retry with exponential backoff
        const backoffMinutes = BACKOFF_MINUTES[Math.min(attempt - 1, BACKOFF_MINUTES.length - 1)];
        const nextRunAt = new Date(Date.now() + backoffMinutes * 60 * 1000);
        await prisma.job.update({
          where: { id: job.id },
          data: {
            status: "pending",
            lastError: `[Attempt ${attempt}/${job.maxAttempts}] ${errorMessage}`,
            nextRunAt,
          },
        });
        console.warn(
          `[JobQueue] Job ${job.id} (${job.type}) failed (attempt ${attempt}/${job.maxAttempts}), retry at ${nextRunAt.toISOString()}: ${errorMessage}`
        );
      }
      failed++;
    }
  }

  return { processed, succeeded, failed };
}

// ─── Job Handlers ────────────────────────────────────────────────

type JobHandler = (payload: Record<string, unknown>) => Promise<void>;

/**
 * angebot_accepted_email: Generate PDF + send confirmation email atomically.
 * Both must succeed or the job retries.
 */
async function handleAngebotAcceptedEmail(
  payload: Record<string, unknown>
): Promise<void> {
  const { generateAngebotPdf } = await import("@/lib/pdf/generate");
  const { sendAngebotConfirmationEmail } = await import("@/lib/email");
  const { uploadFile } = await import("@/lib/seaweedfs");
  const { getAngebotById } = await import("@/lib/angebote");

  const angebotId = payload.angebotId as string;
  const to = payload.to as string;
  const kundenName = payload.kundenName as string;
  const firma = payload.firma as string | undefined;
  const email = payload.email as string;
  const festpreis = payload.festpreis as number;
  const aufwand = payload.aufwand as number;
  const projektBeschreibung = payload.projektBeschreibung as string;
  const plan = payload.plan as Record<string, unknown>;
  const createdAt = payload.createdAt as string;

  // Step 1: Generate PDF — MUST succeed
  const pdfBuffer = await generateAngebotPdf({
    angebotId,
    kundenName,
    firma,
    email,
    festpreis,
    aufwand,
    projektBeschreibung,
    plan: plan as never, // ProjectPlan type from JSON
    createdAt,
  });
  console.log(`[Job:angebot_accepted_email] PDF generated: ${pdfBuffer.length} bytes`);

  // Step 2: Store in SeaweedFS (best-effort, doesn't fail the job)
  try {
    const fid = await uploadFile(pdfBuffer, `Angebot-${angebotId}.pdf`);
    // Update the Angebot record with the PDF file ID
    const angebot = await getAngebotById(angebotId);
    if (angebot) {
      await prisma.angebot.update({
        where: { id: angebotId },
        data: { pdfFileId: fid },
      });
    }
    console.log(`[Job:angebot_accepted_email] PDF stored in SeaweedFS: fid=${fid}`);
  } catch (storageErr) {
    console.warn(`[Job:angebot_accepted_email] SeaweedFS upload failed (non-blocking):`, storageErr);
  }

  // Step 3: Send email with PDF — MUST succeed
  await sendAngebotConfirmationEmail({
    to,
    kundenName,
    festpreis,
    pdfBuffer,
    angebotId,
  });
  console.log(`[Job:angebot_accepted_email] Email with PDF sent to ${to}`);
}

/**
 * Registry of all job handlers.
 */
const JOB_HANDLERS: Record<string, JobHandler> = {
  angebot_accepted_email: handleAngebotAcceptedEmail,
};
