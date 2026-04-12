"use client";

import { useState } from "react";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

type Status =
  | { state: "idle" }
  | { state: "submitting" }
  | { state: "success" }
  | { state: "error"; message: string };

export function AffiliateApplyForm() {
  const [status, setStatus] = useState<Status>({ state: "idle" });
  const [form, setForm] = useState({
    name: "",
    email: "",
    handle: "",
    audience: "",
    motivation: "",
    website: "", // honeypot
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus({ state: "submitting" });
    try {
      const res = await fetch("/api/affiliates/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) {
        setStatus({
          state: "error",
          message:
            json?.error ??
            "Bewerbung konnte nicht gesendet werden. Bitte versuchen Sie es später erneut.",
        });
        return;
      }
      setStatus({ state: "success" });
    } catch {
      setStatus({
        state: "error",
        message:
          "Netzwerkfehler. Bitte prüfen Sie Ihre Verbindung und versuchen Sie es erneut.",
      });
    }
  }

  if (status.state === "success") {
    return (
      <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.04] p-8 text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-400" />
        <h3 className="mt-4 text-xl font-bold text-white">
          Bewerbung eingegangen
        </h3>
        <p className="mt-2 text-sm text-[#c0c3c9]">
          Vielen Dank — wir melden uns innerhalb weniger Werktage bei Ihnen.
          Eine Bestätigung ist auf dem Weg in Ihr Postfach.
        </p>
      </div>
    );
  }

  const disabled = status.state === "submitting";

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6 md:p-8"
    >
      <div>
        <Label htmlFor="name" className="text-[#c8cad0]">
          Name
        </Label>
        <Input
          id="name"
          required
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="Vor- und Nachname"
          className="mt-1.5 bg-white/[0.04] border-white/10 text-white placeholder:text-[#5a5e66] focus:border-[#FFC62C]/50"
          disabled={disabled}
        />
      </div>

      <div>
        <Label htmlFor="email" className="text-[#c8cad0]">
          E-Mail
        </Label>
        <Input
          id="email"
          type="email"
          required
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          placeholder="ihre@email.de"
          className="mt-1.5 bg-white/[0.04] border-white/10 text-white placeholder:text-[#5a5e66] focus:border-[#FFC62C]/50"
          disabled={disabled}
        />
      </div>

      <div>
        <Label htmlFor="handle" className="text-[#c8cad0]">
          Gewünschter Handle
        </Label>
        <p className="mt-1 text-xs text-[#8B8F97]">
          Wird Teil Ihres Empfehlungslinks: nanachimi.digital/@
          <span className="text-[#FFC62C]">{form.handle || "handle"}</span>
        </p>
        <Input
          id="handle"
          required
          minLength={3}
          maxLength={32}
          pattern="[a-zA-Z0-9_-]+"
          value={form.handle}
          onChange={(e) =>
            setForm({ ...form, handle: e.target.value.replace(/\s/g, "") })
          }
          placeholder="z. B. syssys35"
          className="mt-1.5 bg-white/[0.04] border-white/10 text-white placeholder:text-[#5a5e66] focus:border-[#FFC62C]/50 font-mono"
          disabled={disabled}
        />
      </div>

      <div>
        <Label htmlFor="audience" className="text-[#c8cad0]">
          Ihre Zielgruppe
        </Label>
        <p className="mt-1 text-xs text-[#8B8F97]">
          Wer sind Ihre Follower, Kunden, Kontakte? Welche Branchen?
        </p>
        <Textarea
          id="audience"
          required
          minLength={20}
          maxLength={3000}
          value={form.audience}
          onChange={(e) => setForm({ ...form, audience: e.target.value })}
          rows={4}
          placeholder="Ich arbeite mit Gründern aus dem SaaS-Bereich..."
          className="mt-1.5 bg-white/[0.04] border-white/10 text-white placeholder:text-[#5a5e66] focus:border-[#FFC62C]/50 resize-none"
          disabled={disabled}
        />
      </div>

      <div>
        <Label htmlFor="motivation" className="text-[#c8cad0]">
          Warum möchten Sie Partner werden?
        </Label>
        <Textarea
          id="motivation"
          required
          minLength={20}
          maxLength={3000}
          value={form.motivation}
          onChange={(e) => setForm({ ...form, motivation: e.target.value })}
          rows={4}
          placeholder="Ich empfehle gerne Lösungen, die ich selbst gut finde..."
          className="mt-1.5 bg-white/[0.04] border-white/10 text-white placeholder:text-[#5a5e66] focus:border-[#FFC62C]/50 resize-none"
          disabled={disabled}
        />
      </div>

      {/* Honeypot — hidden from humans */}
      <div className="hidden" aria-hidden="true">
        <label>
          Website (nicht ausfüllen)
          <input
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={form.website}
            onChange={(e) => setForm({ ...form, website: e.target.value })}
          />
        </label>
      </div>

      {status.state === "error" && (
        <div className="flex items-start gap-2 rounded-lg border border-red-400/20 bg-red-400/[0.06] p-3">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0 text-red-400" />
          <p className="text-sm text-red-300">{status.message}</p>
        </div>
      )}

      <Button
        type="submit"
        disabled={disabled}
        className="w-full bg-[#FFC62C] text-[#111318] hover:bg-[#FFD257] font-semibold"
      >
        {status.state === "submitting" ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Bewerbung wird gesendet...
          </>
        ) : (
          "Bewerbung absenden"
        )}
      </Button>

      <p className="text-center text-xs text-[#5a5e66]">
        Mit dem Absenden stimmen Sie unserer{" "}
        <a href="/datenschutz" className="text-[#FFC62C] hover:underline">
          Datenschutzerklärung
        </a>{" "}
        zu.
      </p>
    </form>
  );
}
