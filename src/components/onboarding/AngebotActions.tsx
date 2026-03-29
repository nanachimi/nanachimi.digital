"use client";

import { useState } from "react";
import {
  Check,
  X,
  ArrowRight,
  MessageSquare,
  CreditCard,
  Building2,
  Copy,
  CheckCheck,
  Sparkles,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface PaymentOption {
  type: "full" | "half" | "tranche_1";
  amount: number;
  discount: number;
  discountPercent: number;
  label: string;
  badgeLabel: string;
  festpreisOriginal: number;
  festpreisDiscounted: number;
}

interface BankDetails {
  kontoinhaber: string;
  iban: string;
  bic: string;
  bank: string;
  verwendungszweck: string;
}

interface PaymentData {
  festpreis: number;
  options: PaymentOption[];
  bank: BankDetails;
}

interface Props {
  id: string;
}

function formatEuro(amount: number): string {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
  }).format(amount);
}

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback — select text
    }
  }

  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-1 text-xs text-[#8B8F97] hover:text-[#FFC62C] transition-colors"
      title={`${label} kopieren`}
    >
      {copied ? (
        <CheckCheck className="h-3 w-3 text-emerald-400" />
      ) : (
        <Copy className="h-3 w-3" />
      )}
    </button>
  );
}

export function AngebotActions({ id }: Props) {
  const [status, setStatus] = useState<
    "idle" | "rejecting" | "accepted" | "rejected" | "loading"
  >("idle");
  const [feedback, setFeedback] = useState("");
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [payingType, setPayingType] = useState<string | null>(null);
  const isLoading = status === "loading";

  async function handleAction(action: "accept" | "reject") {
    setStatus("loading");
    try {
      const res = await fetch(`/api/angebot/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify({
          action,
          ...(action === "reject" && feedback ? { feedback } : {}),
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (action === "accept" && data.payment) {
          setPaymentData(data.payment);
        }
        setStatus(action === "accept" ? "accepted" : "rejected");
      }
    } catch {
      setStatus("idle");
    }
  }

  async function handleStripePayment(type: string) {
    setPayingType(type);
    try {
      const res = await fetch(`/api/angebot/${id}/payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.url) {
          window.location.href = data.url;
          return;
        }
      }

      // Stripe not available — show info
      setPayingType(null);
    } catch {
      setPayingType(null);
    }
  }

  // ─── Accepted State: Show Payment Options ──────────────────────

  if (status === "accepted") {
    return (
      <div className="space-y-6">
        {/* Success Banner */}
        <div className="rounded-2xl border border-emerald-400/30 bg-emerald-400/[0.08] p-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-400/20">
            <Check className="h-7 w-7 text-emerald-400" />
          </div>
          <h3 className="text-xl font-bold text-white">
            Angebot angenommen!
          </h3>
          <p className="mt-2 text-sm text-[#8B8F97]">
            Wählen Sie Ihre bevorzugte Zahlungsart, um das Projekt zu starten.
          </p>
        </div>

        {/* Payment Options */}
        {paymentData && (
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-[#c8cad0] uppercase tracking-wider">
              Zahlungsoptionen
            </h4>

            {paymentData.options.map((option, idx) => {
              const isRecommended = idx === 0;
              const isPaying = payingType === option.type;

              return (
                <div
                  key={option.type}
                  className={`rounded-xl border p-5 transition-all ${
                    isRecommended
                      ? "border-[#FFC62C]/40 bg-[#FFC62C]/[0.06]"
                      : "border-white/[0.08] bg-white/[0.02]"
                  }`}
                >
                  {isRecommended && (
                    <div className="flex items-center gap-1.5 mb-3">
                      <Sparkles className="h-3.5 w-3.5 text-[#FFC62C]" />
                      <span className="text-xs font-bold text-[#FFC62C] uppercase tracking-wider">
                        Empfohlen
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-semibold text-white">
                        {option.label}
                      </p>
                      {option.discountPercent > 0 ? (
                        <p className="text-sm text-[#8B8F97] mt-0.5">
                          <span className="text-emerald-400 font-medium">
                            {option.badgeLabel}
                          </span>
                          {" · "}
                          <span className="line-through text-[#6a6e76]">
                            {formatEuro(option.festpreisOriginal)}
                          </span>
                          {" → "}
                          {formatEuro(option.festpreisDiscounted)}
                        </p>
                      ) : (
                        <p className="text-sm text-[#8B8F97] mt-0.5">
                          Vor Projektstart
                        </p>
                      )}
                    </div>
                    <p
                      className={`text-xl font-bold ${
                        isRecommended ? "text-[#FFC62C]" : "text-white"
                      }`}
                    >
                      {formatEuro(option.amount)}
                    </p>
                  </div>

                  <Button
                    onClick={() => handleStripePayment(option.type)}
                    disabled={!!payingType}
                    className={`w-full rounded-xl font-semibold ${
                      isRecommended
                        ? "bg-[#FFC62C] text-[#111318] hover:bg-[#e6b228] shadow-[0_0_20px_rgba(255,198,44,0.2)]"
                        : "bg-white/[0.06] text-white hover:bg-white/[0.1] border border-white/[0.1]"
                    }`}
                  >
                    {isPaying ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Weiterleitung...
                      </>
                    ) : (
                      <>
                        <CreditCard className="h-4 w-4 mr-2" />
                        {isRecommended
                          ? "Jetzt mit Stripe bezahlen"
                          : "Mit Stripe bezahlen"}
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </>
                    )}
                  </Button>
                </div>
              );
            })}

            {/* Bank Transfer Alternative */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/[0.06]" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-[#111318] px-4 text-[#6a6e76]">
                  oder per Überweisung
                </span>
              </div>
            </div>

            <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-5">
              <div className="flex items-center gap-2 mb-4">
                <Building2 className="h-4 w-4 text-[#8B8F97]" />
                <h4 className="text-sm font-semibold text-white">
                  Bankverbindung
                </h4>
              </div>

              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-[#6a6e76]">Kontoinhaber</span>
                  <span className="text-white font-medium">
                    {paymentData.bank.kontoinhaber}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#6a6e76]">IBAN</span>
                  <span className="text-white font-mono text-xs flex items-center gap-2">
                    {paymentData.bank.iban}
                    <CopyButton
                      text={paymentData.bank.iban.replace(/\s/g, "")}
                      label="IBAN"
                    />
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#6a6e76]">BIC</span>
                  <span className="text-white font-mono text-xs flex items-center gap-2">
                    {paymentData.bank.bic}
                    <CopyButton text={paymentData.bank.bic} label="BIC" />
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#6a6e76]">Bank</span>
                  <span className="text-white">{paymentData.bank.bank}</span>
                </div>
                <div className="border-t border-white/[0.06] pt-2.5 flex justify-between items-center">
                  <span className="text-[#6a6e76]">Verwendungszweck</span>
                  <span className="text-[#FFC62C] font-mono text-xs flex items-center gap-2">
                    {paymentData.bank.verwendungszweck}
                    <CopyButton
                      text={paymentData.bank.verwendungszweck}
                      label="Verwendungszweck"
                    />
                  </span>
                </div>
              </div>

              <p className="text-xs text-[#6a6e76] mt-4">
                Bitte überweisen Sie den gewünschten Betrag mit dem angegebenen
                Verwendungszweck. Die oben genannten Rabatte gelten auch bei
                Überweisung.
              </p>
            </div>
          </div>
        )}

        {/* Fallback if no payment data */}
        {!paymentData && (
          <p className="text-sm text-[#8B8F97] text-center">
            Vielen Dank! Wir melden uns in Kürze bei Ihnen, um die nächsten
            Schritte zu besprechen.
          </p>
        )}
      </div>
    );
  }

  // ─── Rejected State ────────────────────────────────────────────

  if (status === "rejected") {
    return (
      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-8 text-center">
        <p className="text-lg font-semibold text-white">Angebot abgelehnt</p>
        <p className="mt-2 text-[#8B8F97]">
          Schade! Falls Sie Ihre Meinung ändern oder ein angepasstes Angebot
          wünschen, kontaktieren Sie uns jederzeit.
        </p>
      </div>
    );
  }

  // ─── Rejecting State: Feedback Form ────────────────────────────

  if (status === "rejecting") {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6">
          <div className="flex items-center gap-2 mb-3">
            <MessageSquare className="h-5 w-5 text-[#8B8F97]" />
            <p className="font-semibold text-white">
              Möchten Sie uns sagen, warum?
            </p>
          </div>
          <p className="text-sm text-[#8B8F97] mb-4">
            Ihr Feedback hilft uns, bessere Angebote zu erstellen. (Optional)
          </p>
          <Textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="z.B. Budget zu hoch, anderer Anbieter gewählt, Projekt verschoben..."
            rows={3}
            className="bg-white/[0.04] border-white/10 text-white placeholder:text-[#5a5e66] focus:border-[#FFC62C]/50 resize-none"
          />
        </div>
        <div className="flex gap-3">
          <Button
            onClick={() => setStatus("idle")}
            variant="ghost"
            className="flex-1 text-[#8B8F97] hover:text-white hover:bg-white/5 rounded-xl"
          >
            Zurück
          </Button>
          <Button
            onClick={() => handleAction("reject")}
            disabled={isLoading}
            className="flex-1 bg-white/[0.06] text-white hover:bg-white/[0.1] rounded-xl border border-white/[0.1]"
          >
            Angebot ablehnen
          </Button>
        </div>
      </div>
    );
  }

  // ─── Idle State: Accept / Reject Buttons ───────────────────────

  return (
    <div className="space-y-3">
      <Button
        onClick={() => handleAction("accept")}
        disabled={isLoading}
        className="w-full h-14 bg-[#FFC62C] text-[#111318] hover:bg-[#e6b228] rounded-xl font-bold text-lg shadow-[0_0_30px_rgba(255,198,44,0.25)]"
      >
        {isLoading ? "Wird verarbeitet..." : "Angebot annehmen"}
        <ArrowRight className="ml-2 h-5 w-5" />
      </Button>
      <Button
        onClick={() => setStatus("rejecting")}
        variant="ghost"
        className="w-full text-[#8B8F97] hover:text-white hover:bg-white/5 rounded-xl"
      >
        <X className="mr-2 h-4 w-4" />
        Angebot ablehnen
      </Button>
    </div>
  );
}
