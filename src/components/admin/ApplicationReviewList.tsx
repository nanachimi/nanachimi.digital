"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  XCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface Application {
  id: string;
  email: string;
  name: string;
  handle: string;
  audience: string;
  motivation: string;
  status: string;
  createdAt: string;
  reviewedAt: string | null;
  notes: string | null;
  affiliateId: string | null;
}

export function ApplicationReviewList({
  applications,
}: {
  applications: Application[];
}) {
  const router = useRouter();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [commissionRate, setCommissionRate] = useState<Record<string, string>>(
    {},
  );
  const [handleOverride, setHandleOverride] = useState<Record<string, string>>(
    {},
  );
  const [rejectNotes, setRejectNotes] = useState<Record<string, string>>({});
  const [tempPasswords, setTempPasswords] = useState<Record<string, string>>(
    {},
  );

  async function approve(id: string) {
    const rateRaw = commissionRate[id] ?? "10";
    const rate = Number(rateRaw) / 100;
    if (Number.isNaN(rate) || rate < 0 || rate > 1) {
      alert("Kommissionssatz muss zwischen 0 und 100 liegen.");
      return;
    }
    setBusyId(id);
    try {
      const res = await fetch(
        `/api/admin/affiliates/applications/${id}/approve`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            commissionRate: rate,
            handle: handleOverride[id]?.trim() || undefined,
          }),
        },
      );
      const json = await res.json();
      if (!res.ok) {
        alert(json?.error ?? "Freigabe fehlgeschlagen");
        return;
      }
      setTempPasswords((prev) => ({ ...prev, [id]: json.tempPassword }));
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  async function reject(id: string) {
    if (!confirm("Bewerbung wirklich ablehnen?")) return;
    setBusyId(id);
    try {
      const res = await fetch(
        `/api/admin/affiliates/applications/${id}/reject`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ notes: rejectNotes[id] ?? undefined }),
        },
      );
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        alert(json?.error ?? "Ablehnung fehlgeschlagen");
        return;
      }
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  if (applications.length === 0) {
    return (
      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-12 text-center">
        <p className="text-zinc-500">Keine Bewerbungen</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {applications.map((app) => {
        const isExpanded = expanded === app.id;
        const isPending = app.status === "pending";
        const tempPassword = tempPasswords[app.id];

        return (
          <div
            key={app.id}
            className="rounded-2xl border border-white/[0.08] bg-white/[0.02] overflow-hidden"
          >
            <button
              type="button"
              onClick={() => setExpanded(isExpanded ? null : app.id)}
              className="w-full flex items-center justify-between p-5 text-left hover:bg-white/[0.02]"
            >
              <div className="flex items-center gap-4">
                {app.status === "approved" && (
                  <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                )}
                {app.status === "rejected" && (
                  <XCircle className="h-5 w-5 text-red-400" />
                )}
                {app.status === "pending" && (
                  <Clock className="h-5 w-5 text-yellow-400" />
                )}
                <div>
                  <p className="font-medium text-white">{app.name}</p>
                  <p className="text-xs text-zinc-500">
                    {app.email} · @{app.handle} ·{" "}
                    {new Date(app.createdAt).toLocaleDateString("de-DE")}
                  </p>
                </div>
              </div>
              {isExpanded ? (
                <ChevronUp className="h-4 w-4 text-zinc-500" />
              ) : (
                <ChevronDown className="h-4 w-4 text-zinc-500" />
              )}
            </button>

            {isExpanded && (
              <div className="border-t border-white/[0.06] p-5 space-y-4">
                <div>
                  <p className="text-xs uppercase tracking-wider text-zinc-500 mb-1">
                    Zielgruppe
                  </p>
                  <p className="text-sm text-zinc-300 whitespace-pre-wrap">
                    {app.audience}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-zinc-500 mb-1">
                    Motivation
                  </p>
                  <p className="text-sm text-zinc-300 whitespace-pre-wrap">
                    {app.motivation}
                  </p>
                </div>

                {app.notes && (
                  <div>
                    <p className="text-xs uppercase tracking-wider text-zinc-500 mb-1">
                      Notizen
                    </p>
                    <p className="text-sm text-zinc-400 whitespace-pre-wrap">
                      {app.notes}
                    </p>
                  </div>
                )}

                {tempPassword && (
                  <div className="rounded-lg border border-emerald-400/20 bg-emerald-400/[0.05] p-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-emerald-300">
                      Temporäres Passwort — einmalig anzeigen
                    </p>
                    <code className="mt-2 block rounded bg-[#0a0c10] px-3 py-2 font-mono text-sm text-[#FFC62C]">
                      {tempPassword}
                    </code>
                    <p className="mt-2 text-xs text-zinc-400">
                      Eine Kopie wurde auch per E-Mail verschickt. Der Partner
                      muss es beim ersten Login ändern.
                    </p>
                  </div>
                )}

                {isPending && (
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4 space-y-3">
                      <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                        Genehmigen
                      </p>
                      <div>
                        <label className="text-xs text-zinc-400">
                          Kommissionssatz (%)
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.5"
                          value={commissionRate[app.id] ?? "10"}
                          onChange={(e) =>
                            setCommissionRate({
                              ...commissionRate,
                              [app.id]: e.target.value,
                            })
                          }
                          className="mt-1 w-full rounded-md border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-zinc-400">
                          Handle (Override, optional)
                        </label>
                        <input
                          type="text"
                          placeholder={app.handle}
                          value={handleOverride[app.id] ?? ""}
                          onChange={(e) =>
                            setHandleOverride({
                              ...handleOverride,
                              [app.id]: e.target.value,
                            })
                          }
                          className="mt-1 w-full rounded-md border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white font-mono"
                        />
                      </div>
                      <Button
                        onClick={() => approve(app.id)}
                        disabled={busyId === app.id}
                        className="w-full bg-emerald-500 hover:bg-emerald-600 text-white"
                      >
                        {busyId === app.id ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Wird verarbeitet...
                          </>
                        ) : (
                          "Genehmigen"
                        )}
                      </Button>
                    </div>

                    <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4 space-y-3">
                      <p className="text-xs font-semibold uppercase tracking-wider text-red-400">
                        Ablehnen
                      </p>
                      <div>
                        <label className="text-xs text-zinc-400">
                          Interne Notiz (optional)
                        </label>
                        <textarea
                          rows={4}
                          value={rejectNotes[app.id] ?? ""}
                          onChange={(e) =>
                            setRejectNotes({
                              ...rejectNotes,
                              [app.id]: e.target.value,
                            })
                          }
                          className="mt-1 w-full rounded-md border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white resize-none"
                        />
                      </div>
                      <Button
                        onClick={() => reject(app.id)}
                        disabled={busyId === app.id}
                        variant="outline"
                        className="w-full border-red-400/30 text-red-400 hover:bg-red-400/10"
                      >
                        Ablehnen
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
