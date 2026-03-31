import type { TemplateConfig } from "@/lib/whatsapp";
import type { Submission } from "@/lib/submissions";

export const TEMPLATES = {
  CUSTOMER_ANGEBOT: "onboarding_bestaetigung_angebot",
  CUSTOMER_CALL: "onboarding_bestaetigung_call",
  INTERNAL: "interne_neue_anfrage",
} as const;

export function buildCustomerAngebotTemplate(
  name: string,
  range: string
): TemplateConfig {
  return {
    templateName: TEMPLATES.CUSTOMER_ANGEBOT,
    language: "de",
    variables: [name, range],
  };
}

export function buildCustomerCallTemplate(name: string): TemplateConfig {
  return {
    templateName: TEMPLATES.CUSTOMER_CALL,
    language: "de",
    variables: [name],
  };
}

export function buildInternalTemplate(submission: Submission): TemplateConfig {
  return {
    templateName: TEMPLATES.INTERNAL,
    language: "de",
    variables: [
      submission.name,
      submission.projekttyp,
      submission.naechsterSchritt,
    ],
  };
}
