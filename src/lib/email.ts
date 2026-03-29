import nodemailer from "nodemailer";
import type { RiskLevel } from "@/lib/pricing-config";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "localhost",
  port: parseInt(process.env.SMTP_PORT || "1025", 10),
  secure: process.env.SMTP_SECURE === "true",
  ...(process.env.SMTP_USER && process.env.SMTP_PASS
    ? {
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      }
    : {}),
});

const FROM = process.env.EMAIL_FROM || "nanachimi.digital <info@nanachimi.digital>";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://nanachimi.digital";

function formatEur(n: number): string {
  return n.toLocaleString("de-DE") + " €";
}

/** Truncate a string safely without splitting multi-byte characters */
function truncate(str: string, max: number): string {
  if (str.length <= max) return str;
  return Array.from(str).slice(0, max).join("") + "…";
}

function getSlaLabel(minutes: number): string {
  if (minutes < 60) return `${minutes} Minuten`;
  const hours = Math.floor(minutes / 60);
  return hours === 1 ? "1 Stunde" : `${hours} Stunden`;
}

// ─── Email 1: Onboarding Confirmation with Range ──────────────────

interface OnboardingConfirmationData {
  to: string;
  kundenName: string;
  projektBeschreibung: string;
  range: { untergrenze: number; obergrenze: number };
  aufwand: number;
  riskLevel: RiskLevel;
  slaMinutes: number;
  naechsterSchritt: "call" | "angebot";
  betriebUndWartung: string;
  bwInfo: {
    includedMonths: number;
    packages: { months: number; pricePerMonth: number }[];
    customerWants: boolean;
  };
}

export async function sendOnboardingConfirmationEmail(data: OnboardingConfirmationData) {
  const anrede = data.kundenName.split(" ")[0];
  const isCall = data.naechsterSchritt === "call";
  const slaLabel = getSlaLabel(data.slaMinutes);
  const minBwPrice = Math.min(...data.bwInfo.packages.map((p) => p.pricePerMonth));

  const bwHtml = `
    <p style="color: #FFC62C; font-size: 12px; font-weight: 600; margin: 0 0 4px 0;">Inkl. ${data.bwInfo.includedMonths} Monat Betrieb &amp; Wartung nach Go-Live</p>
    <p style="color: #8B8F97; font-size: 12px; margin: 0; line-height: 1.5;">
      ${data.bwInfo.customerWants
        ? `Anschließend: Betrieb &amp; Wartung ab ${minBwPrice} €/Monat (separat buchbar).`
        : `Nach dem 1. Monat: Betrieb eigenverantwortlich.`}
    </p>`;

  const nextStepsHtml = isCall
    ? `<tr>
        <td style="padding: 4px 12px 4px 0;"><span style="color: #FFC62C; font-weight: 700;">1.</span></td>
        <td style="padding: 4px 0; color: #8B8F97; font-size: 13px;">Wir melden uns, um einen Termin zu vereinbaren</td>
      </tr>
      <tr>
        <td style="padding: 4px 12px 4px 0;"><span style="color: #FFC62C; font-weight: 700;">2.</span></td>
        <td style="padding: 4px 0; color: #8B8F97; font-size: 13px;">Gemeinsames Gespräch: Anforderungen klären</td>
      </tr>
      <tr>
        <td style="padding: 4px 12px 4px 0;"><span style="color: #FFC62C; font-weight: 700;">3.</span></td>
        <td style="padding: 4px 0; color: #8B8F97; font-size: 13px;">Individuelles Angebot nach dem Gespräch</td>
      </tr>`
    : `<tr>
        <td style="padding: 4px 12px 4px 0;"><span style="color: #FFC62C; font-weight: 700;">1.</span></td>
        <td style="padding: 4px 0; color: #8B8F97; font-size: 13px;">Wir prüfen Ihre Anforderungen</td>
      </tr>
      <tr>
        <td style="padding: 4px 12px 4px 0;"><span style="color: #FFC62C; font-weight: 700;">2.</span></td>
        <td style="padding: 4px 0; color: #8B8F97; font-size: 13px;">Sie erhalten Ihr verbindliches Angebot innerhalb von ${slaLabel}</td>
      </tr>
      <tr>
        <td style="padding: 4px 12px 4px 0;"><span style="color: #FFC62C; font-weight: 700;">3.</span></td>
        <td style="padding: 4px 0; color: #8B8F97; font-size: 13px;">Angebot annehmen — Projektstart in 48h</td>
      </tr>`;

  const html = `
<!DOCTYPE html>
<html lang="de">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Ihre Projektanfrage</title></head>
<body style="margin: 0; padding: 0; background-color: #111318; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #111318; padding: 40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%;">
        <tr><td style="padding: 30px 40px; text-align: center;">
          <span style="font-size: 20px; font-weight: 700; color: #ffffff;">nanachimi<span style="color: #FFC62C; font-weight: 800;">.digital</span></span>
        </td></tr>
        <tr><td style="background-color: #1a1d24; border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 40px;">
          <p style="color: #ffffff; font-size: 22px; font-weight: 700; margin: 0 0 8px 0;">Hallo ${anrede},</p>
          <p style="color: #8B8F97; font-size: 15px; line-height: 1.6; margin: 0 0 30px 0;">
            vielen Dank für Ihre Projektanfrage! Hier ist Ihre vorläufige Schätzung:
          </p>

          <!-- Project summary -->
          <div style="background-color: rgba(255,198,44,0.06); border: 1px solid rgba(255,198,44,0.15); border-radius: 12px; padding: 20px; margin-bottom: 24px;">
            <p style="color: #FFC62C; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; margin: 0 0 8px 0;">Ihr Projekt</p>
            <p style="color: #ffffff; font-size: 14px; line-height: 1.5; margin: 0;">${truncate(data.projektBeschreibung, 200)}</p>
          </div>

          <!-- Estimate range -->
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
            <tr>
              <td width="50%" style="padding-right: 8px;">
                <div style="background-color: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 16px; text-align: center;">
                  <p style="color: #6a6e76; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 6px 0;">Preisrahmen</p>
                  <p style="color: #FFC62C; font-size: 18px; font-weight: 700; margin: 0;">ab ${formatEur(data.range.untergrenze)} — ca. ${formatEur(data.range.obergrenze)}</p>
                </div>
              </td>
              <td width="50%" style="padding-left: 8px;">
                <div style="background-color: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 16px; text-align: center;">
                  <p style="color: #6a6e76; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 6px 0;">Geschätzter Aufwand</p>
                  <p style="color: #ffffff; font-size: 18px; font-weight: 700; margin: 0;">ca. ${data.aufwand} PT</p>
                </div>
              </td>
            </tr>
          </table>

          <!-- B&W hint -->
          <div style="background-color: rgba(255,198,44,0.04); border: 1px solid rgba(255,198,44,0.1); border-radius: 12px; padding: 14px; margin-bottom: 24px;">
            ${bwHtml}
          </div>

          <!-- Disclaimer -->
          <p style="color: #6a6e76; font-size: 12px; line-height: 1.5; margin: 0 0 24px 0; font-style: italic;">
            Diese Schätzung basiert auf Ihren Angaben und gibt Ihnen eine erste Orientierung. Der endgültige Festpreis wird nach Prüfung individuell erstellt.
          </p>

          <div style="border-top: 1px solid rgba(255,255,255,0.06); margin: 24px 0;"></div>

          <p style="color: #ffffff; font-size: 14px; font-weight: 600; margin: 0 0 12px 0;">Nächste Schritte:</p>
          <table cellpadding="0" cellspacing="0">${nextStepsHtml}</table>
        </td></tr>
        <tr><td style="padding: 30px 40px; text-align: center;">
          <p style="color: #6a6e76; font-size: 12px; margin: 0 0 4px 0;">nanachimi.digital · Mannheim, Deutschland</p>
          <p style="color: #6a6e76; font-size: 12px; margin: 0;">
            <a href="${SITE_URL}" style="color: #FFC62C; text-decoration: none;">nanachimi.digital</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const text = `Hallo ${anrede},

vielen Dank für Ihre Projektanfrage!

Ihr Projekt: ${truncate(data.projektBeschreibung, 200)}

Vorläufige Schätzung:
Preisrahmen: ab ${formatEur(data.range.untergrenze)} — ca. ${formatEur(data.range.obergrenze)}
Geschätzter Aufwand: ca. ${data.aufwand} Personentage

Inkl. ${data.bwInfo.includedMonths} Monat Betrieb & Wartung nach Go-Live.
${data.bwInfo.customerWants ? `Danach: ab ${minBwPrice} €/Monat (separat buchbar).` : "Nach dem 1. Monat: Betrieb eigenverantwortlich."}

Diese Schätzung basiert auf Ihren Angaben und gibt Ihnen eine erste Orientierung.

${isCall
  ? `Nächste Schritte:
1. Wir melden uns, um einen Termin zu vereinbaren
2. Gemeinsames Gespräch: Anforderungen klären
3. Individuelles Angebot nach dem Gespräch`
  : `Nächste Schritte:
1. Wir prüfen Ihre Anforderungen
2. Sie erhalten Ihr verbindliches Angebot innerhalb von ${slaLabel}
3. Angebot annehmen — Projektstart in 48h`}

---
nanachimi.digital · Mannheim, Deutschland`;

  const info = await transporter.sendMail({
    from: FROM,
    to: data.to,
    subject: `Ihre Projektanfrage bei nanachimi.digital — Schätzung: ab ${formatEur(data.range.untergrenze)}`,
    encoding: "utf-8",
    textEncoding: "quoted-printable",
    text,
    html,
  });

  console.log(`[Email] Onboarding confirmation sent to ${data.to}, messageId: ${info.messageId}`);
  return info;
}

// ─── Email 2: Final Angebot ───────────────────────────────────────

interface AngebotEmailData {
  to: string;
  kundenName: string;
  firma?: string;
  angebotId: string;
  festpreis: number;
  aufwand: number; // Personentage
  projektBeschreibung: string;
  betriebUndWartung?: string;
}

export async function sendAngebotEmail(data: AngebotEmailData) {
  const angebotUrl = `${SITE_URL}/angebot/${data.angebotId}`;
  const anrede = data.kundenName.split(" ")[0];

  // Zahlungsbedingungen berechnen
  const t1 = Math.round(data.festpreis * 0.15);
  const t2 = Math.round(data.festpreis * 0.35);
  const t3 = data.festpreis - t1 - t2;

  const customerWantsBW =
    data.betriebUndWartung === "ja" || data.betriebUndWartung === "teilweise";

  const bwHtml = `
    <p style="color: #FFC62C; font-size: 12px; font-weight: 600; margin: 0 0 4px 0;">Inkl. 1 Monat Betrieb &amp; Wartung nach Go-Live</p>
    <p style="color: #8B8F97; font-size: 12px; margin: 0; line-height: 1.5;">
      ${customerWantsBW
        ? "Anschließend: Betrieb &amp; Wartung ab 29 €/Monat (separat buchbar)."
        : "Nach dem 1. Monat: Betrieb eigenverantwortlich."}
    </p>`;

  const html = `
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Ihr Angebot von nanachimi.digital</title>
</head>
<body style="margin: 0; padding: 0; background-color: #111318; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #111318; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%;">

          <!-- Header -->
          <tr>
            <td style="padding: 30px 40px; text-align: center;">
              <span style="font-size: 20px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px;">
                nanachimi<span style="color: #FFC62C; font-weight: 800;">.digital</span>
              </span>
            </td>
          </tr>

          <!-- Main Card -->
          <tr>
            <td style="background-color: #1a1d24; border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 40px;">

              <!-- Greeting -->
              <p style="color: #ffffff; font-size: 22px; font-weight: 700; margin: 0 0 8px 0;">
                Hallo ${anrede},
              </p>
              <p style="color: #8B8F97; font-size: 15px; line-height: 1.6; margin: 0 0 30px 0;">
                vielen Dank für Ihr Interesse an einer Zusammenarbeit! Wir haben Ihre Projektanfrage sorgfältig geprüft und ein individuelles Angebot für Sie erstellt.
              </p>

              <!-- Project Summary -->
              <div style="background-color: rgba(255,198,44,0.06); border: 1px solid rgba(255,198,44,0.15); border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                <p style="color: #FFC62C; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; margin: 0 0 8px 0;">
                  Ihr Projekt
                </p>
                <p style="color: #ffffff; font-size: 14px; line-height: 1.5; margin: 0;">
                  ${truncate(data.projektBeschreibung, 200)}
                </p>
              </div>

              <!-- Pricing -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
                <tr>
                  <td width="50%" style="padding-right: 8px;">
                    <div style="background-color: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 16px; text-align: center;">
                      <p style="color: #6a6e76; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 6px 0;">Festpreis</p>
                      <p style="color: #FFC62C; font-size: 22px; font-weight: 700; margin: 0;">
                        ${formatEur(data.festpreis)}
                      </p>
                    </div>
                  </td>
                  <td width="50%" style="padding-left: 8px;">
                    <div style="background-color: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 16px; text-align: center;">
                      <p style="color: #6a6e76; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 6px 0;">Aufwand</p>
                      <p style="color: #ffffff; font-size: 22px; font-weight: 700; margin: 0;">
                        ${data.aufwand} PT
                      </p>
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Zahlungsbedingungen -->
              <div style="background-color: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; padding: 16px; margin-bottom: 24px;">
                <p style="color: #6a6e76; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 12px 0;">
                  Zahlungsbedingungen (Überweisung)
                </p>
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding: 6px 0; color: #8B8F97; font-size: 13px;">15% — Vor Projektstart</td>
                    <td style="padding: 6px 0; color: #ffffff; font-size: 13px; font-weight: 600; text-align: right;">${formatEur(t1)}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; color: #8B8F97; font-size: 13px; border-top: 1px solid rgba(255,255,255,0.04);">35% — Nach MVP-Lieferung</td>
                    <td style="padding: 6px 0; color: #ffffff; font-size: 13px; font-weight: 600; text-align: right; border-top: 1px solid rgba(255,255,255,0.04);">${formatEur(t2)}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; color: #8B8F97; font-size: 13px; border-top: 1px solid rgba(255,255,255,0.04);">50% — Vor Go-Live / Übergabe</td>
                    <td style="padding: 6px 0; color: #ffffff; font-size: 13px; font-weight: 600; text-align: right; border-top: 1px solid rgba(255,255,255,0.04);">${formatEur(t3)}</td>
                  </tr>
                </table>
              </div>

              <!-- Betrieb & Wartung Hinweis -->
              <div style="background-color: rgba(255,198,44,0.04); border: 1px solid rgba(255,198,44,0.1); border-radius: 12px; padding: 14px; margin-bottom: 24px;">
                ${bwHtml}
              </div>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 30px;">
                <tr>
                  <td align="center">
                    <a href="${angebotUrl}" style="display: inline-block; background-color: #FFC62C; color: #111318; font-size: 15px; font-weight: 700; text-decoration: none; padding: 14px 40px; border-radius: 12px; letter-spacing: 0.3px;">
                      Angebot ansehen →
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Info text -->
              <p style="color: #6a6e76; font-size: 13px; line-height: 1.6; margin: 0 0 16px 0; text-align: center;">
                Im Angebot finden Sie den vollständigen Projektplan inkl. User Stories, technischer Architektur und Meilensteine.
              </p>

              <!-- Divider -->
              <div style="border-top: 1px solid rgba(255,255,255,0.06); margin: 24px 0;"></div>

              <!-- What's next -->
              <p style="color: #ffffff; font-size: 14px; font-weight: 600; margin: 0 0 12px 0;">
                So geht es weiter:
              </p>
              <table cellpadding="0" cellspacing="0" style="margin-bottom: 0;">
                <tr>
                  <td style="padding: 4px 12px 4px 0; vertical-align: top;">
                    <span style="color: #FFC62C; font-size: 13px; font-weight: 700;">1.</span>
                  </td>
                  <td style="padding: 4px 0; color: #8B8F97; font-size: 13px; line-height: 1.5;">
                    Angebot prüfen und bei Fragen direkt antworten
                  </td>
                </tr>
                <tr>
                  <td style="padding: 4px 12px 4px 0; vertical-align: top;">
                    <span style="color: #FFC62C; font-size: 13px; font-weight: 700;">2.</span>
                  </td>
                  <td style="padding: 4px 0; color: #8B8F97; font-size: 13px; line-height: 1.5;">
                    Angebot annehmen oder ablehnen (mit Feedback)
                  </td>
                </tr>
                <tr>
                  <td style="padding: 4px 12px 4px 0; vertical-align: top;">
                    <span style="color: #FFC62C; font-size: 13px; font-weight: 700;">3.</span>
                  </td>
                  <td style="padding: 4px 0; color: #8B8F97; font-size: 13px; line-height: 1.5;">
                    Kickoff-Termin vereinbaren — Ihre App ist in 48h live
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; text-align: center;">
              <p style="color: #6a6e76; font-size: 12px; margin: 0 0 4px 0;">
                nanachimi.digital · Mannheim, Deutschland
              </p>
              <p style="color: #6a6e76; font-size: 12px; margin: 0;">
                <a href="${SITE_URL}" style="color: #FFC62C; text-decoration: none;">nanachimi.digital</a>
                &nbsp;·&nbsp;
                <a href="mailto:info@nanachimi.digital" style="color: #FFC62C; text-decoration: none;">info@nanachimi.digital</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = `Hallo ${anrede},

vielen Dank für Ihr Interesse an einer Zusammenarbeit! Wir haben Ihre Projektanfrage sorgfältig geprüft und ein individuelles Angebot für Sie erstellt.

Ihr Projekt: ${truncate(data.projektBeschreibung, 200)}

Festpreis: ${formatEur(data.festpreis)}
Aufwand: ${data.aufwand} Personentage

Zahlungsbedingungen (Überweisung):
• 15% Vor Projektstart — ${formatEur(t1)}
• 35% Nach MVP-Lieferung — ${formatEur(t2)}
• 50% Vor Go-Live / Übergabe — ${formatEur(t3)}

Inkl. 1 Monat Betrieb & Wartung nach Go-Live.
${customerWantsBW ? "Danach: ab 29 €/Monat (separat buchbar)." : "Nach dem 1. Monat: Betrieb eigenverantwortlich."}

Angebot ansehen: ${angebotUrl}

So geht es weiter:
1. Angebot prüfen und bei Fragen direkt antworten
2. Angebot annehmen oder ablehnen (mit Feedback)
3. Kickoff-Termin vereinbaren — Ihre App ist in 48h live

---
nanachimi.digital · Mannheim, Deutschland
info@nanachimi.digital`;

  const info = await transporter.sendMail({
    from: FROM,
    to: data.to,
    subject: `Ihr Angebot von nanachimi.digital — ${formatEur(data.festpreis)}`,
    encoding: "utf-8",
    textEncoding: "quoted-printable",
    text,
    html,
  });

  console.log(`[Email] Angebot sent to ${data.to}, messageId: ${info.messageId}`);
  return info;
}

// ─── Email 3: Angebot Confirmation (Accept) ───────────────────────

/** Send confirmation email when client accepts (with optional PDF attachment) */
export async function sendAngebotConfirmationEmail(data: {
  to: string;
  kundenName: string;
  festpreis: number;
  pdfBuffer?: Buffer;
  angebotId: string;
}) {
  const anrede = data.kundenName.split(" ")[0];

  const html = `
<!DOCTYPE html>
<html lang="de">
<head><meta charset="utf-8"><title>Angebot angenommen</title></head>
<body style="margin: 0; padding: 0; background-color: #111318; font-family: 'Segoe UI', Tahoma, Geneva, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #111318; padding: 40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%;">
        <tr><td style="padding: 30px 40px; text-align: center;">
          <span style="font-size: 20px; font-weight: 700; color: #fff;">nanachimi<span style="color: #FFC62C; font-weight: 800;">.digital</span></span>
        </td></tr>
        <tr><td style="background-color: #1a1d24; border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 40px;">
          <div style="text-align: center; margin-bottom: 24px;">
            <div style="display: inline-block; background-color: rgba(74,222,128,0.1); border-radius: 50%; padding: 16px;">
              <span style="font-size: 32px;">✓</span>
            </div>
          </div>
          <p style="color: #fff; font-size: 22px; font-weight: 700; margin: 0 0 8px 0; text-align: center;">
            Vielen Dank, ${anrede}!
          </p>
          <p style="color: #8B8F97; font-size: 15px; line-height: 1.6; margin: 0 0 24px 0; text-align: center;">
            Ihr Angebot über <strong style="color: #FFC62C;">${formatEur(data.festpreis)}</strong> wurde erfolgreich angenommen.
          </p>
          <div style="border-top: 1px solid rgba(255,255,255,0.06); margin: 24px 0;"></div>
          <p style="color: #fff; font-size: 14px; font-weight: 600; margin: 0 0 12px 0;">Nächste Schritte:</p>
          <table cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding: 4px 12px 4px 0;"><span style="color: #FFC62C; font-weight: 700;">1.</span></td>
              <td style="padding: 4px 0; color: #8B8F97; font-size: 13px;">Sie erhalten in Kürze die erste Rechnung (15% vor Projektstart)</td>
            </tr>
            <tr>
              <td style="padding: 4px 12px 4px 0;"><span style="color: #FFC62C; font-weight: 700;">2.</span></td>
              <td style="padding: 4px 0; color: #8B8F97; font-size: 13px;">Wir vereinbaren einen Kickoff-Termin</td>
            </tr>
            <tr>
              <td style="padding: 4px 12px 4px 0;"><span style="color: #FFC62C; font-weight: 700;">3.</span></td>
              <td style="padding: 4px 0; color: #8B8F97; font-size: 13px;">Projektstart — Ihre App ist bald live!</td>
            </tr>
          </table>
          ${data.pdfBuffer ? '<p style="color: #8B8F97; font-size: 12px; margin: 20px 0 0 0; text-align: center;">Das bestätigte Angebot finden Sie als PDF im Anhang.</p>' : ""}
        </td></tr>
        <tr><td style="padding: 30px 40px; text-align: center;">
          <p style="color: #6a6e76; font-size: 12px; margin: 0;">nanachimi.digital · Mannheim, Deutschland</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const text = `Hallo ${anrede},

Vielen Dank! Ihr Angebot über ${formatEur(data.festpreis)} wurde erfolgreich angenommen.

Nächste Schritte:
1. Sie erhalten in Kürze die erste Rechnung (15% vor Projektstart)
2. Wir vereinbaren einen Kickoff-Termin
3. Projektstart — Ihre App ist bald live!

${data.pdfBuffer ? "Das bestätigte Angebot finden Sie als PDF im Anhang." : ""}

---
nanachimi.digital · Mannheim, Deutschland`;

  const attachments = data.pdfBuffer
    ? [
        {
          filename: `Angebot-${data.angebotId}.pdf`,
          content: data.pdfBuffer,
          contentType: "application/pdf",
        },
      ]
    : [];

  const info = await transporter.sendMail({
    from: FROM,
    to: data.to,
    subject: `Angebot angenommen — Ihr Projekt startet!`,
    encoding: "utf-8",
    textEncoding: "quoted-printable",
    text,
    html,
    attachments,
  });

  console.log(`[Email] Confirmation sent to ${data.to}, messageId: ${info.messageId}`);
  return info;
}
