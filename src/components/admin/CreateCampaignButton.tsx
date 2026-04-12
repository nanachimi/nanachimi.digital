"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CreateCampaignButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    campaignCode: "",
    discountPercent: "25",
    description: "",
    validUntil: "",
    maxUsesPerCode: "",
  });

  const previewCode = form.campaignCode
    ? form.campaignCode.toLowerCase()
    : "";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const body = {
        name: form.name,
        campaignCode: form.campaignCode,
        discountPercent: Number(form.discountPercent) / 100,
        description: form.description || undefined,
        validUntil: form.validUntil
          ? new Date(form.validUntil).toISOString()
          : undefined,
        maxUsesPerCode: form.maxUsesPerCode
          ? Number(form.maxUsesPerCode)
          : undefined,
      };
      const res = await fetch("/api/admin/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json?.error ?? "Kampagne konnte nicht erstellt werden");
        return;
      }
      setOpen(false);
      router.refresh();
    } catch {
      setError("Netzwerkfehler");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="bg-[#FFC62C] text-[#111318] hover:bg-[#FFD257]"
      >
        <Plus className="mr-2 h-4 w-4" />
        Neue Kampagne
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-white/10 bg-[#1a1d24] p-6 max-h-[90vh] overflow-y-auto">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">Neue Kampagne</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded p-1 text-zinc-400 hover:bg-white/10 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="text-xs text-zinc-400">Name</label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="z. B. Lancement Q2 2026"
                  className="mt-1 w-full rounded-md border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-xs text-zinc-400">
                    Campaign Code
                  </label>
                  <input
                    required
                    value={form.campaignCode}
                    onChange={(e) =>
                      setForm({ ...form, campaignCode: e.target.value })
                    }
                    placeholder="z. B. Startup2026"
                    pattern="[A-Za-z][A-Za-z0-9]*"
                    className="mt-1 w-full rounded-md border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white font-mono"
                  />
                  {previewCode && (
                    <p className="mt-1 text-xs text-emerald-400">
                      Ihr Admin-Code: <strong>{previewCode}</strong>
                    </p>
                  )}
                </div>
                <div>
                  <label className="text-xs text-zinc-400">Rabatt (%)</label>
                  <input
                    required
                    type="number"
                    min="1"
                    max="99"
                    step="1"
                    value={form.discountPercent}
                    onChange={(e) =>
                      setForm({ ...form, discountPercent: e.target.value })
                    }
                    className="mt-1 w-full rounded-md border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-zinc-400">
                  Beschreibung (optional)
                </label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  placeholder="Wird den Partnern im Dashboard angezeigt"
                  className="mt-1 w-full rounded-md border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white resize-none"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-xs text-zinc-400">
                    Gültig bis (optional)
                  </label>
                  <input
                    type="datetime-local"
                    value={form.validUntil}
                    onChange={(e) =>
                      setForm({ ...form, validUntil: e.target.value })
                    }
                    className="mt-1 w-full rounded-md border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-400">
                    Max. Einlösungen / Code (optional)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={form.maxUsesPerCode}
                    onChange={(e) =>
                      setForm({ ...form, maxUsesPerCode: e.target.value })
                    }
                    placeholder="Unbegrenzt"
                    className="mt-1 w-full rounded-md border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white"
                  />
                </div>
              </div>

              {error && (
                <div className="rounded-lg border border-red-400/20 bg-red-400/[0.06] p-3 text-sm text-red-300">
                  {error}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                  disabled={busy}
                  className="flex-1"
                >
                  Abbrechen
                </Button>
                <Button
                  type="submit"
                  disabled={busy}
                  className="flex-1 bg-[#FFC62C] text-[#111318] hover:bg-[#FFD257]"
                >
                  {busy ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Wird erstellt...
                    </>
                  ) : (
                    "Kampagne erstellen"
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
