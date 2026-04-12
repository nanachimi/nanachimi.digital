"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

type Status = "pending" | "active" | "suspended";

const STATUS_OPTIONS: { value: Status; label: string }[] = [
  { value: "pending", label: "Wartend" },
  { value: "active", label: "Aktiv" },
  { value: "suspended", label: "Gesperrt" },
];

export function AffiliateEditForm({
  id,
  initialName,
  initialEmail,
  initialCommissionRate,
  initialStatus,
}: {
  id: string;
  initialName: string;
  initialEmail: string;
  initialCommissionRate: number;
  initialStatus: string;
}) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [email, setEmail] = useState(initialEmail);
  const [commissionPercent, setCommissionPercent] = useState(
    String(Math.round(initialCommissionRate * 10000) / 100),
  );
  const [status, setStatus] = useState<Status>(
    (STATUS_OPTIONS.find((s) => s.value === initialStatus)?.value ??
      "pending") as Status,
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const dirty =
    name !== initialName ||
    email !== initialEmail ||
    Number(commissionPercent) / 100 !== initialCommissionRate ||
    status !== initialStatus;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const rate = Number(commissionPercent) / 100;
      if (!Number.isFinite(rate) || rate < 0 || rate > 1) {
        setError("Provision muss zwischen 0 und 100 % liegen");
        return;
      }
      const res = await fetch(`/api/admin/affiliates/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          commissionRate: rate,
          status,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(
          (json as { error?: string })?.error ??
            "Aktualisierung fehlgeschlagen",
        );
        return;
      }
      setSavedAt(Date.now());
      router.refresh();
    } catch {
      setError("Netzwerkfehler");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5"
    >
      <h2 className="mb-4 font-semibold text-white">Bearbeiten</h2>

      <div className="space-y-4">
        <div>
          <label className="text-xs text-zinc-400">Name</label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full rounded-md border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white"
          />
        </div>

        <div>
          <label className="text-xs text-zinc-400">E-Mail</label>
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-md border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white"
          />
        </div>

        <div>
          <label className="text-xs text-zinc-400">Provision (%)</label>
          <input
            required
            type="number"
            min="0"
            max="100"
            step="0.01"
            value={commissionPercent}
            onChange={(e) => setCommissionPercent(e.target.value)}
            className="mt-1 w-full rounded-md border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white"
          />
          <p className="mt-1 text-[11px] text-zinc-500">
            Wird auf jeden eingenommenen Betrag angewendet.
          </p>
        </div>

        <div>
          <label className="text-xs text-zinc-400">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as Status)}
            className="mt-1 w-full rounded-md border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s.value} value={s.value} className="bg-[#1a1d24]">
                {s.label}
              </option>
            ))}
          </select>
        </div>

        {error && (
          <div className="rounded-lg border border-red-400/20 bg-red-400/[0.06] p-3 text-sm text-red-300">
            {error}
          </div>
        )}

        <Button
          type="submit"
          disabled={busy || !dirty}
          className="w-full bg-[#FFC62C] text-[#111318] hover:bg-[#FFD257] disabled:opacity-50"
        >
          {busy ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Speichern...
            </>
          ) : savedAt && !dirty ? (
            <>
              <Check className="mr-2 h-4 w-4" />
              Gespeichert
            </>
          ) : (
            "Speichern"
          )}
        </Button>
      </div>
    </form>
  );
}
