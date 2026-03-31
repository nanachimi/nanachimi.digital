import { enqueueJob } from "@/lib/job-queue";
import { getSubmissionById } from "@/lib/submissions";
import {
  normalizePhoneNumber,
  isWhatsAppAvailable,
  isInternalNotificationEnabled,
} from "@/lib/whatsapp";

export async function enqueueWhatsAppJobs(submissionId: string) {
  const submission = await getSubmissionById(submissionId);
  if (!submission) return;

  // Customer WhatsApp: consent + valid phone + WhatsApp available
  if (
    submission.whatsappConsent &&
    submission.telefon &&
    normalizePhoneNumber(submission.telefon) &&
    isWhatsAppAvailable()
  ) {
    await enqueueJob(
      "whatsapp_customer_confirmation",
      { submissionId },
      5,
      `whatsapp_customer:${submissionId}`
    );
  }

  // Internal notification: separate check
  if (isInternalNotificationEnabled()) {
    await enqueueJob(
      "whatsapp_internal_notification",
      { submissionId },
      5,
      `whatsapp_internal:${submissionId}`
    );
  }
}
