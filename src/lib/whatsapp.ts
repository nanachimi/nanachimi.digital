import { parsePhoneNumberFromString } from "libphonenumber-js";

// ─── Consent Constants ──────────────────────────────────────────

export const WHATSAPP_CONSENT_VERSION = "v1";
export const WHATSAPP_CONSENT_LABEL =
  "Ich möchte Rückmeldungen zu meiner Anfrage auch per WhatsApp erhalten.";
export const WHATSAPP_CONSENT_HINT =
  "Wir verwenden Ihre Nummer nur für Nachrichten zu Ihrer Anfrage.";

// ─── Phone Normalization ────────────────────────────────────────

export function normalizePhoneNumber(
  raw: string,
  defaultRegion: "DE" | "AT" | "CH" = "DE"
): string | null {
  if (!raw || raw.trim().length < 6) return null;
  const phone = parsePhoneNumberFromString(raw, defaultRegion);
  if (!phone || !phone.isValid()) return null;
  return phone.format("E.164");
}

// ─── Provider Interface ─────────────────────────────────────────

export interface TemplateConfig {
  templateName: string;
  language: string;
  variables: string[];
}

export type WhatsAppResult =
  | { success: true; messageId: string }
  | { success: false; retryable: boolean; error: string; code?: string };

interface WhatsAppProvider {
  sendTemplate(
    to: string,
    config: TemplateConfig
  ): Promise<WhatsAppResult>;
}

// ─── State Logic ────────────────────────────────────────────────

export function isWhatsAppMockMode(): boolean {
  return process.env.WHATSAPP_MOCK === "true";
}

export function isWhatsAppLiveConfigured(): boolean {
  return !!(
    process.env.WHATSAPP_PHONE_NUMBER_ID && process.env.WHATSAPP_ACCESS_TOKEN
  );
}

export function isWhatsAppAvailable(): boolean {
  return isWhatsAppMockMode() || isWhatsAppLiveConfigured();
}

export function isInternalNotificationEnabled(): boolean {
  return (
    process.env.WHATSAPP_INTERNAL_ENABLED === "true" &&
    !!process.env.WHATSAPP_ADMIN_PHONE &&
    isWhatsAppAvailable()
  );
}

// ─── Meta Cloud API Provider ────────────────────────────────────

const META_API_VERSION = "v21.0";

class MetaCloudProvider implements WhatsAppProvider {
  private phoneNumberId: string;
  private accessToken: string;

  constructor() {
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID!;
    this.accessToken = process.env.WHATSAPP_ACCESS_TOKEN!;
  }

  async sendTemplate(
    to: string,
    config: TemplateConfig
  ): Promise<WhatsAppResult> {
    const url = `https://graph.facebook.com/${META_API_VERSION}/${this.phoneNumberId}/messages`;

    const body = {
      messaging_product: "whatsapp",
      to,
      type: "template",
      template: {
        name: config.templateName,
        language: { code: config.language },
        components:
          config.variables.length > 0
            ? [
                {
                  type: "body",
                  parameters: config.variables.map((v) => ({
                    type: "text",
                    text: v,
                  })),
                },
              ]
            : undefined,
      },
    };

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        const data = await res.json();
        return { success: true, messageId: data.messages?.[0]?.id ?? "unknown" };
      }

      const errorData = await res.json().catch(() => ({}));
      const metaCode = String(
        errorData?.error?.code ?? errorData?.error?.error_data?.details ?? ""
      );

      // Permanent errors
      if (metaCode === "131021" || metaCode === "131026") {
        return { success: false, retryable: false, error: errorData?.error?.message ?? res.statusText, code: metaCode };
      }

      // Retryable
      if (res.status === 429 || res.status >= 500) {
        return { success: false, retryable: true, error: `HTTP ${res.status}: ${res.statusText}` };
      }

      return { success: false, retryable: false, error: errorData?.error?.message ?? res.statusText, code: metaCode || undefined };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("ECONNREFUSED") || msg.includes("ETIMEDOUT") || msg.includes("fetch failed")) {
        return { success: false, retryable: true, error: msg };
      }
      return { success: false, retryable: false, error: msg };
    }
  }
}

// ─── Mock Provider ──────────────────────────────────────────────

class MockProvider implements WhatsAppProvider {
  async sendTemplate(
    to: string,
    config: TemplateConfig
  ): Promise<WhatsAppResult> {
    const messageId = `mock-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    console.log("[WhatsApp:Mock] sendTemplate", {
      to,
      template: config.templateName,
      language: config.language,
      variables: config.variables,
      messageId,
    });
    return { success: true, messageId };
  }
}

// ─── Provider Factory ───────────────────────────────────────────

export function getProvider(): WhatsAppProvider | null {
  if (isWhatsAppMockMode()) return new MockProvider();
  if (isWhatsAppLiveConfigured()) return new MetaCloudProvider();
  return null;
}
