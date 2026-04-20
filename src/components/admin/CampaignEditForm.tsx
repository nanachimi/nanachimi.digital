"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Check, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

function toDateInput(value: Date | string | null | undefined): string {
  if (!value) return "";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

export function CampaignEditForm({
  id,
  initialName,
  initialDescription,
  initialValidUntil,
  initialMaxUsesPerCode,
}: {
  id: string;
  initialName: string;
  initialDescription: string | null;
  initialValidUntil: string | null;
  initialMaxUsesPerCode: number | null;
}) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription ?? "");
  const [validUntil, setValidUntil] = useState(toDateInput(initialValidUntil));
  const [maxUsesPerCode, setMaxUsesPerCode] = useState(
    initialMaxUsesPerCode === null ? "" : String(initialMaxUsesPerCode),
  );
  const [busy, setBusy] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const initialValidUntilInput = toDateInput(initialValidUntil);
  const initialMaxUsesInput =
    initialMaxUsesPerCode === null ? "" : String(initialMaxUsesPerCode);
  const dirty =
    name !== initialName ||
    description !== (initialDescription ?? "") ||
    validUntil !== initialValidUntilInput ||
    maxUsesPerCode !== initialMaxUsesInput;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const body: Record<string, unknown> = {
        name,
        description: description.trim() === "" ? null : description,
        validUntil:
          validUntil === ""
            ? null
            : new Date(`${validUntil}T23:59:59.999Z`).toISOString(),
      };
      if (maxUsesPerCode === "") {
        body.maxUsesPerCode = null;
      } else {
        const parsed = Number(maxUsesPerCode);
        if (!Number.isInteger(parsed) || parsed < 1) {
          setError("Max. Einlösungen muss eine ganze Zahl ≥ 1 sein");
          return;
        }
        body.maxUsesPerCode = parsed;
      }

      const res = await fetch(`/api/admin/campaigns/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
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

  async function handleDelete() {
    if (
      !window.confirm(
        `Kampagne "${initialName}" endgültig löschen? Diese Aktion kann nicht rückgängig gemacht werden.`,
      )
    ) {
      return;
    }
    setError(null);
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/campaigns/${id}`, {
        method: "DELETE",
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(
          (json as { error?: string })?.error ?? "Löschen fehlgeschlagen",
        );
        return;
      }
      router.push("/backoffice/campaigns");
      router.refresh();
    } catch {
      setError("Netzwerkfehler");
    } finally {
      setDeleting(false);
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
          <label className="text-xs text-zinc-400">Beschreibung</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="mt-1 w-full rounded-md border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white"
          />
          <p className="mt-1 text-[11px] text-zinc-500">
            Sichtbar für Affiliates im Dashboard.
          </p>
        </div>

        <div>
          <label className="text-xs text-zinc-400">Gültig bis</label>
          <input
            type="date"
            value={validUntil}
            onChange={(e) => setValidUntil(e.target.value)}
            className="mt-1 w-full rounded-md border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white"
          />
          <p className="mt-1 text-[11px] text-zinc-500">
            Leer lassen für unbegrenzte Gültigkeit.
          </p>
        </div>

        <div>
          <label className="text-xs text-zinc-400">
            Max. Einlösungen pro Code
          </label>
          <input
            type="number"
            min="1"
            step="1"
            value={maxUsesPerCode}
            onChange={(e) => setMaxUsesPerCode(e.target.value)}
            className="mt-1 w-full rounded-md border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white"
          />
          <p className="mt-1 text-[11px] text-zinc-500">
            Leer lassen = unbegrenzt. Gilt nur für künftig erstellte Codes.
          </p>
        </div>

        {error && (
          <div className="rounded-lg border border-red-400/20 bg-red-400/[0.06] p-3 text-sm text-red-300">
            {error}
          </div>
        )}

        <Button
          type="submit"
          disabled={busy || deleting || !dirty}
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

        <div className="border-t border-white/[0.06] pt-4">
          <button
            type="button"
            onClick={handleDelete}
            disabled={busy || deleting}
            className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-red-400/30 bg-red-400/[0.06] px-3 py-2 text-sm text-red-300 hover:bg-red-400/10 disabled:opacity-50"
          >
            {deleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            Kampagne löschen
          </button>
          <p className="mt-2 text-[11px] text-zinc-500">
            Nur möglich, wenn kein Code eingelöst wurde und keine Submission
            zugeordnet ist.
          </p>
        </div>
      </div>
    </form>
  );
}
