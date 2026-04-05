"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { PhoneInput } from "@/components/ui/phone-input";
import { isValidPhoneNumber } from "libphonenumber-js";
import type { OnboardingData } from "@/lib/onboarding-schema";
import { WHATSAPP_CONSENT_LABEL, WHATSAPP_CONSENT_HINT } from "@/lib/whatsapp";

interface Props {
  data: Partial<OnboardingData>;
  onChange: (d: Partial<OnboardingData>) => void;
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function StepKontaktdaten({ data, onChange }: Props) {
  const emailFilled = data.email && isValidEmail(data.email);
  const nameFilled = data.name && data.name.trim().length >= 2;

  // Phone verification state
  const [verificationStep, setVerificationStep] = useState<
    "idle" | "sending" | "code_sent" | "verifying" | "verified"
  >("idle");
  const [verificationCode, setVerificationCode] = useState("");
  const [verificationError, setVerificationError] = useState("");

  const phoneValid =
    !!data.telefon && data.telefon.length >= 6 && isValidPhoneNumber(data.telefon);

  async function handleSendCode() {
    if (!data.telefon) return;
    setVerificationError("");
    setVerificationStep("sending");

    try {
      const res = await fetch("/api/verify/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: data.telefon }),
      });
      const json = await res.json();

      if (!res.ok) {
        setVerificationError(json.error || "Fehler beim Senden.");
        setVerificationStep("idle");
        return;
      }

      setVerificationStep("code_sent");
    } catch {
      setVerificationError("Netzwerkfehler. Bitte versuchen Sie es erneut.");
      setVerificationStep("idle");
    }
  }

  async function handleCheckCode() {
    if (!data.telefon || !verificationCode) return;
    setVerificationError("");
    setVerificationStep("verifying");

    try {
      const res = await fetch("/api/verify/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: data.telefon, code: verificationCode }),
      });
      const json = await res.json();

      if (!res.ok) {
        setVerificationError(json.error || "Verifizierung fehlgeschlagen.");
        setVerificationStep("code_sent");
        return;
      }

      if (json.verified) {
        setVerificationStep("verified");
        onChange({ phoneVerified: true });
      }
    } catch {
      setVerificationError("Netzwerkfehler. Bitte versuchen Sie es erneut.");
      setVerificationStep("code_sent");
    }
  }

  function handlePhoneChange(val: string) {
    // Reset verification when phone changes
    if (val !== data.telefon) {
      setVerificationStep("idle");
      setVerificationCode("");
      setVerificationError("");
      onChange({
        telefon: val,
        whatsappConsent: false,
        phoneVerified: false,
      });
    }
  }

  return (
    <div className="space-y-5">
      <p className="text-sm text-[#8B8F97] mb-2">
        Fast geschafft — nur noch Ihre Kontaktdaten. Damit wir Ihnen Ihre persönliche Einschätzung schicken können.
      </p>

      {/* Email — always visible */}
      <div className="space-y-2">
        <Label className="text-[#c8cad0]">E-Mail *</Label>
        <Input
          type="email"
          value={data.email || ""}
          onChange={(e) => onChange({ email: e.target.value })}
          placeholder="max@beispiel.de"
          autoFocus
          className="bg-white/[0.04] border-white/10 text-white placeholder:text-[#5a5e66] focus:border-[#FFC62C]/50"
        />
        <p className="text-xs text-[#6a6e76] mt-1">
          Wir schicken Ihnen nur projektbezogene Infos. Kein Spam.
        </p>
      </div>

      {/* Name — appears after email is valid */}
      {emailFilled && (
        <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <Label className="text-[#c8cad0]">Name *</Label>
          <Input
            value={data.name || ""}
            onChange={(e) => onChange({ name: e.target.value })}
            placeholder="Max Mustermann"
            className="bg-white/[0.04] border-white/10 text-white placeholder:text-[#5a5e66] focus:border-[#FFC62C]/50"
          />
        </div>
      )}

      {/* Optional fields — appear after name is filled */}
      {emailFilled && nameFilled && (
        <div className="grid gap-5 sm:grid-cols-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="space-y-2">
            <Label className="text-[#c8cad0]">Firma (optional)</Label>
            <Input
              value={data.firma || ""}
              onChange={(e) => onChange({ firma: e.target.value })}
              placeholder="Ihre Firma"
              className="bg-white/[0.04] border-white/10 text-white placeholder:text-[#5a5e66] focus:border-[#FFC62C]/50"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-[#c8cad0]">Telefon (optional)</Label>
            <PhoneInput
              value={data.telefon || ""}
              onChange={handlePhoneChange}
              placeholder="+49 ..."
            />

            {/* Verification flow */}
            {phoneValid && verificationStep === "idle" && (
              <button
                type="button"
                onClick={handleSendCode}
                className="mt-2 w-full rounded-md bg-[#FFC62C] px-4 py-2 text-sm font-medium text-[#111318] transition-colors hover:bg-[#FFD44D] focus:outline-none focus:ring-2 focus:ring-[#FFC62C]/50"
              >
                Nummer verifizieren
              </button>
            )}

            {verificationStep === "sending" && (
              <p className="mt-2 text-sm text-[#8B8F97] animate-pulse">
                Code wird gesendet...
              </p>
            )}

            {(verificationStep === "code_sent" ||
              verificationStep === "verifying") && (
              <div className="mt-2 space-y-2 animate-in fade-in duration-200">
                <Label className="text-[#c8cad0] text-xs">
                  6-stelliger Code
                </Label>
                <div className="flex gap-2">
                  <Input
                    value={verificationCode}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "").slice(0, 6);
                      setVerificationCode(val);
                    }}
                    placeholder="123456"
                    maxLength={6}
                    inputMode="numeric"
                    className="bg-white/[0.04] border-white/10 text-white placeholder:text-[#5a5e66] focus:border-[#FFC62C]/50 tracking-widest text-center font-mono"
                  />
                  <button
                    type="button"
                    onClick={handleCheckCode}
                    disabled={
                      verificationCode.length !== 6 ||
                      verificationStep === "verifying"
                    }
                    className="shrink-0 rounded-md bg-[#FFC62C] px-4 py-2 text-sm font-medium text-[#111318] transition-colors hover:bg-[#FFD44D] disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[#FFC62C]/50"
                  >
                    {verificationStep === "verifying"
                      ? "..."
                      : "Prüfen"}
                  </button>
                </div>
                <button
                  type="button"
                  onClick={handleSendCode}
                  className="text-xs text-[#8B8F97] hover:text-[#FFC62C] transition-colors"
                >
                  Code erneut senden
                </button>
              </div>
            )}

            {verificationStep === "verified" && (
              <div className="mt-2 flex items-center gap-2 text-green-400 animate-in fade-in duration-200">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="h-5 w-5"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-sm font-medium">Verifiziert</span>
              </div>
            )}

            {verificationError && (
              <p className="mt-1 text-xs text-red-400">{verificationError}</p>
            )}

            {/* WhatsApp consent — only after verified */}
            {verificationStep === "verified" && (
              <div className="flex items-start gap-2 mt-2 animate-in fade-in duration-200">
                <Checkbox
                  id="whatsapp-consent"
                  checked={data.whatsappConsent ?? false}
                  onCheckedChange={(checked) =>
                    onChange({ whatsappConsent: checked === true })
                  }
                  className="mt-0.5 border-white/20 data-[state=checked]:bg-[#FFC62C] data-[state=checked]:border-[#FFC62C]"
                />
                <div>
                  <label
                    htmlFor="whatsapp-consent"
                    className="text-sm text-[#c8cad0] cursor-pointer leading-tight"
                  >
                    {WHATSAPP_CONSENT_LABEL}
                  </label>
                  <p className="text-xs text-[#6a6e76] mt-0.5">
                    {WHATSAPP_CONSENT_HINT}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
