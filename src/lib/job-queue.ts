import { prisma } from "@/lib/db";

// Backoff schedule: 1m → 3m → 10m → 30m → 60m (max ~1h total)
const BACKOFF_MINUTES = [1, 3, 10, 30, 60];

const JOB_TITLES: Record<string, string> = {
  angebot_accepted_email: "Angebot-Bestätigung mit PDF per E-Mail",
  payment_confirmation_email: "Zahlungsbestätigung mit Rechnung per E-Mail",
  whatsapp_customer_confirmation: "WhatsApp-Bestätigung an Kunden",
  whatsapp_internal_notification: "Interne WhatsApp-Benachrichtigung",
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
  maxAttempts = 5,
  idempotencyKey?: string
) {
  try {
    const job = await prisma.job.create({
      data: {
        type,
        payload: JSON.parse(JSON.stringify(payload)),
        maxAttempts,
        status: "pending",
        nextRunAt: new Date(),
        idempotencyKey: idempotencyKey ?? null,
      },
    });
    console.log(`[JobQueue] Enqueued job ${job.id} (type=${type})`);
    return job;
  } catch (err: unknown) {
    // Unique violation on idempotencyKey — job already exists, not an error
    if (
      idempotencyKey &&
      err instanceof Error &&
      err.message.includes("Unique constraint failed")
    ) {
      console.log(`[JobQueue] Job already exists (idempotencyKey=${idempotencyKey}), skipping`);
      return null;
    }
    throw err;
  }
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
    },
    orderBy: { nextRunAt: "asc" },
    take: 10,
  });

  // Filter out jobs that have exhausted retries
  const eligibleJobs = jobs.filter((j) => j.attempts < j.maxAttempts);

  for (const job of eligibleJobs) {
    processed++;

    // Atomic claim: only proceed if status hasn't changed (prevents double-processing)
    const claimed = await prisma.job.updateMany({
      where: { id: job.id, status: { in: ["pending", "failed"] } },
      data: { status: "processing", attempts: job.attempts + 1 },
    });
    if (claimed.count === 0) continue; // Already claimed by another worker

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
  const { getCompanySettings } = await import("@/lib/company-settings");

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

  const company = await getCompanySettings();

  // Resolve human-readable Angebotsnummer
  const angebotRecord = await getAngebotById(angebotId);
  const angebotNummer = angebotRecord?.angebotNummer || angebotId;

  // Step 1: Generate PDF — MUST succeed
  const pdfBuffer = await generateAngebotPdf({
    angebotId: angebotNummer,
    kundenName,
    firma,
    email,
    festpreis,
    aufwand,
    projektBeschreibung,
    plan: plan as never, // ProjectPlan type from JSON
    createdAt,
    company,
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
 * payment_confirmation_email: Generate Rechnung PDF + send payment confirmation email.
 * Steps: generate Rechnungsnummer, generate Rechnung PDF, retrieve/generate Angebot PDF,
 * upload Rechnung to SeaweedFS, update Payment record, send email with both PDFs.
 */
async function handlePaymentConfirmationEmail(
  payload: Record<string, unknown>
): Promise<void> {
  const { generateRechnungPdf, generateAngebotPdf } = await import("@/lib/pdf/generate");
  const { sendPaymentConfirmationEmail } = await import("@/lib/email");
  const { uploadFile, downloadFile } = await import("@/lib/seaweedfs");
  const { getAngebotById, generateRechnungNummer } = await import("@/lib/angebote");
  const { getSubmissionById } = await import("@/lib/submissions");
  const { getCompanySettings } = await import("@/lib/company-settings");

  const paymentId = payload.paymentId as string;
  const angebotId = payload.angebotId as string;

  // Load payment, angebot, submission, company settings
  const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
  if (!payment) throw new Error(`Payment ${paymentId} not found`);
  if (payment.status !== "paid") throw new Error(`Payment ${paymentId} is not paid`);

  const angebot = await getAngebotById(angebotId);
  if (!angebot) throw new Error(`Angebot ${angebotId} not found`);

  const submission = await getSubmissionById(angebot.submissionId);
  if (!submission) throw new Error(`Submission ${angebot.submissionId} not found`);

  const company = await getCompanySettings();
  const angebotNummer = angebot.angebotNummer || angebotId;

  // Step 1: Generate Rechnungsnummer (if not already set)
  let rechnungNummer = payment.rechnungNummer;
  if (!rechnungNummer) {
    rechnungNummer = await generateRechnungNummer();
  }

  // Determine discount label
  let discountLabel: string | undefined;
  if (payment.discount > 0) {
    if (payment.type === "full") discountLabel = "Gesamtzahlung (12%)";
    else if (payment.type === "half") discountLabel = "50% Anzahlung (5%)";
  }

  // Step 2: Generate Rechnung PDF
  const rechnungPdfBuffer = await generateRechnungPdf({
    rechnungNummer,
    angebotId: angebotNummer,
    kundenName: submission.name,
    firma: submission.firma,
    email: submission.email,
    projektBeschreibung: submission.beschreibung,
    amount: payment.amount / 100, // cents to euros
    discount: payment.discount / 100,
    discountLabel,
    paymentType: payment.type,
    paidAt: payment.paidAt?.toISOString() || new Date().toISOString(),
    createdAt: payment.createdAt.toISOString(),
    company,
  });
  console.log(`[Job:payment_confirmation_email] Rechnung PDF generated: ${rechnungPdfBuffer.length} bytes`);

  // Step 3: Retrieve existing Angebot PDF (or generate on-the-fly)
  let angebotPdfBuffer: Buffer;
  if (angebot.pdfFileId) {
    try {
      angebotPdfBuffer = await downloadFile(angebot.pdfFileId);
    } catch {
      console.warn("[Job:payment_confirmation_email] SeaweedFS Angebot PDF download failed, generating on-the-fly");
      angebotPdfBuffer = await generateAngebotPdf({
        angebotId: angebotNummer,
        kundenName: submission.name,
        firma: submission.firma,
        email: submission.email,
        festpreis: angebot.festpreis,
        aufwand: angebot.aufwand,
        projektBeschreibung: submission.beschreibung,
        plan: angebot.plan,
        createdAt: angebot.createdAt,
        company,
      });
    }
  } else {
    angebotPdfBuffer = await generateAngebotPdf({
      angebotId,
      kundenName: submission.name,
      firma: submission.firma,
      email: submission.email,
      festpreis: angebot.festpreis,
      aufwand: angebot.aufwand,
      projektBeschreibung: submission.beschreibung,
      plan: angebot.plan,
      createdAt: angebot.createdAt,
      company,
    });
  }

  // Step 4: Upload Rechnung PDF to SeaweedFS (best-effort)
  let rechnungFileId: string | null = null;
  try {
    rechnungFileId = await uploadFile(rechnungPdfBuffer, `Rechnung-${rechnungNummer}.pdf`);
    console.log(`[Job:payment_confirmation_email] Rechnung PDF stored in SeaweedFS: fid=${rechnungFileId}`);
  } catch (storageErr) {
    console.warn("[Job:payment_confirmation_email] SeaweedFS upload failed (non-blocking):", storageErr);
  }

  // Step 5: Update Payment with rechnungNummer and rechnungFileId
  await prisma.payment.update({
    where: { id: paymentId },
    data: {
      rechnungNummer,
      ...(rechnungFileId ? { rechnungFileId } : {}),
    },
  });
  console.log(`[Job:payment_confirmation_email] Payment ${paymentId} updated: rechnungNummer=${rechnungNummer}`);

  // Step 6: Send email with both PDFs
  await sendPaymentConfirmationEmail({
    to: submission.email,
    kundenName: submission.name,
    rechnungNummer,
    amount: payment.amount / 100,
    discount: payment.discount / 100,
    discountLabel,
    paymentType: payment.type,
    angebotId,
    rechnungPdfBuffer,
    angebotPdfBuffer,
  });
  console.log(`[Job:payment_confirmation_email] Email sent to ${submission.email}`);
}

/**
 * whatsapp_customer_confirmation: Send WhatsApp confirmation to the customer.
 */
async function handleWhatsAppCustomerConfirmation(
  payload: Record<string, unknown>
): Promise<void> {
  const { getSubmissionById } = await import("@/lib/submissions");
  const { normalizePhoneNumber, getProvider, isWhatsAppMockMode } = await import("@/lib/whatsapp");
  const { buildCustomerAngebotTemplate, buildCustomerCallTemplate } = await import("@/lib/whatsapp-templates");

  const submissionId = payload.submissionId as string;
  const submission = await getSubmissionById(submissionId);
  if (!submission) throw new Error(`Submission ${submissionId} not found`);

  const phone = normalizePhoneNumber(submission.telefon ?? "");
  if (!phone) {
    console.warn("[WhatsApp] Invalid phone number, skipping", { submissionId });
    return; // Permanent — no retry
  }

  const provider = getProvider();
  if (!provider) throw new Error("No WhatsApp provider available");

  const template =
    submission.naechsterSchritt === "angebot"
      ? buildCustomerAngebotTemplate(
          submission.name,
          submission.range
            ? `${submission.range.untergrenze}–${submission.range.obergrenze} €`
            : "wird berechnet"
        )
      : buildCustomerCallTemplate(submission.name);

  const result = await provider.sendTemplate(phone, template);

  if (result.success) {
    console.log("[WhatsApp] Customer message sent", {
      submissionId,
      messageId: result.messageId,
      provider: isWhatsAppMockMode() ? "mock" : "meta_cloud_api",
    });
    return;
  }

  // Permanent errors — no retry
  if (!result.retryable) {
    if (result.code === "131021" || result.code === "INVALID_PHONE") {
      console.warn("[WhatsApp] Permanent error (expected)", {
        submissionId,
        code: result.code,
        error: result.error,
      });
      return;
    }
    if (result.code === "131026") {
      await createIncident({
        severity: "warning",
        title: "WhatsApp-Template nicht gefunden",
        message: `Template fehlt: ${result.error}\nSubmission: ${submissionId}`,
        source: "whatsapp",
        referenceId: submissionId,
      });
      return;
    }
    // Unknown permanent error
    console.error("[WhatsApp] Unknown permanent error", {
      submissionId,
      code: result.code,
      error: result.error,
      provider: isWhatsAppMockMode() ? "mock" : "meta_cloud_api",
      retryable: false,
    });
    await createIncident({
      severity: "warning",
      title: "WhatsApp-Fehler (permanent)",
      message: `${result.error}\nCode: ${result.code ?? "none"}\nSubmission: ${submissionId}`,
      source: "whatsapp",
      referenceId: submissionId,
    });
    return;
  }

  // Retryable — throw to trigger job-queue retry
  throw new Error(`[WhatsApp] Retryable error: ${result.error}`);
}

/**
 * whatsapp_internal_notification: Notify the team about a new submission.
 */
async function handleWhatsAppInternalNotification(
  payload: Record<string, unknown>
): Promise<void> {
  const { getSubmissionById } = await import("@/lib/submissions");
  const { getProvider, isWhatsAppMockMode } = await import("@/lib/whatsapp");
  const { buildInternalTemplate } = await import("@/lib/whatsapp-templates");

  const submissionId = payload.submissionId as string;
  const submission = await getSubmissionById(submissionId);
  if (!submission) throw new Error(`Submission ${submissionId} not found`);

  const adminPhone = process.env.WHATSAPP_ADMIN_PHONE;
  if (!adminPhone) throw new Error("WHATSAPP_ADMIN_PHONE not set");

  const provider = getProvider();
  if (!provider) throw new Error("No WhatsApp provider available");

  const template = buildInternalTemplate(submission);
  const result = await provider.sendTemplate(adminPhone, template);

  if (result.success) {
    console.log("[WhatsApp] Internal notification sent", {
      submissionId,
      messageId: result.messageId,
      provider: isWhatsAppMockMode() ? "mock" : "meta_cloud_api",
    });
    return;
  }

  if (!result.retryable) {
    console.error("[WhatsApp] Internal notification permanent error", {
      submissionId,
      code: result.code,
      error: result.error,
    });
    await createIncident({
      severity: "warning",
      title: "Interne WhatsApp-Benachrichtigung fehlgeschlagen",
      message: `${result.error}\nCode: ${result.code ?? "none"}\nSubmission: ${submissionId}`,
      source: "whatsapp",
      referenceId: submissionId,
    });
    return;
  }

  throw new Error(`[WhatsApp] Retryable error: ${result.error}`);
}

/**
 * Registry of all job handlers.
 */
const JOB_HANDLERS: Record<string, JobHandler> = {
  angebot_accepted_email: handleAngebotAcceptedEmail,
  payment_confirmation_email: handlePaymentConfirmationEmail,
  whatsapp_customer_confirmation: handleWhatsAppCustomerConfirmation,
  whatsapp_internal_notification: handleWhatsAppInternalNotification,
};
