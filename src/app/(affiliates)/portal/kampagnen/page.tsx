"use client";

import { useEffect, useState, useCallback } from "react";
import { Megaphone, Copy, Check, Plus, Loader2 } from "lucide-react";

interface MyCode {
  id: string;
  code: string;
  usedCount: number;
  active: boolean;
}

interface Campaign {
  id: string;
  name: string;
  campaignCode: string;
  discountPercent: number;
  description: string | null;
  validFrom: string;
  validUntil: string | null;
  joined: boolean;
  myCode: MyCode | null;
}

export default function KampagnenPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchCampaigns = useCallback(async () => {
    const res = await fetch("/api/affiliates/me/campaigns");
    if (res.ok) setCampaigns(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  async function handleJoin(campaignId: string) {
    setJoining(campaignId);
    setError(null);
    try {
      const res = await fetch(`/api/affiliates/me/campaigns/${campaignId}/join`, {
        method: "POST",
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Fehler beim Beitreten");
        return;
      }
      await fetchCampaigns();
    } finally {
      setJoining(null);
    }
  }

  function handleCopy(code: string) {
    navigator.clipboard.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(null), 2000);
  }

  const joined = campaigns.filter((c) => c.joined);
  const available = campaigns.filter((c) => !c.joined);

  if (loading) {
    return (
      <div className="p-6 lg:p-8 flex items-center justify-center min-h-[40vh]">
        <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Megaphone className="h-6 w-6 text-[#FFC62C]" />
          Kampagnen
        </h1>
        <p className="mt-1 text-sm text-zinc-400">
          {joined.length} aktive Kampagnen &middot; {available.length} verfügbar
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/[0.06] px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Meine Kampagnen */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold text-white mb-4">Meine Kampagnen</h2>
        {joined.length === 0 ? (
          <p className="text-sm text-zinc-500">
            Sie nehmen noch an keiner Kampagne teil.
          </p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {joined.map((c) => (
              <div
                key={c.id}
                className="rounded-xl border border-[#FFC62C]/20 bg-[#FFC62C]/[0.04] p-5"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-semibold text-white">{c.name}</p>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      {Math.round(c.discountPercent * 100)}% Rabatt
                      {c.validUntil &&
                        ` · bis ${new Date(c.validUntil).toLocaleDateString("de-DE")}`}
                    </p>
                  </div>
                  {c.myCode && (
                    <span className="text-xs text-zinc-500">
                      {c.myCode.usedCount}x genutzt
                    </span>
                  )}
                </div>
                {c.myCode && (
                  <div className="flex items-center gap-2">
                    <code className="flex-1 rounded-lg bg-black/30 px-3 py-2 text-sm font-mono text-[#FFC62C]">
                      {c.myCode.code}
                    </code>
                    <button
                      onClick={() => handleCopy(c.myCode!.code)}
                      className="rounded-lg bg-white/[0.06] p-2 text-zinc-400 hover:text-white transition-colors"
                      title="Code kopieren"
                    >
                      {copied === c.myCode.code ? (
                        <Check className="h-4 w-4 text-emerald-400" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                )}
                {c.description && (
                  <p className="mt-3 text-xs text-zinc-500">{c.description}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Verfügbare Kampagnen */}
      <section>
        <h2 className="text-lg font-semibold text-white mb-4">
          Verfügbare Kampagnen
        </h2>
        {available.length === 0 ? (
          <p className="text-sm text-zinc-500">
            Keine weiteren Kampagnen verfügbar.
          </p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {available.map((c) => (
              <div
                key={c.id}
                className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-5"
              >
                <p className="font-semibold text-white">{c.name}</p>
                <p className="text-xs text-zinc-400 mt-0.5">
                  {Math.round(c.discountPercent * 100)}% Rabatt
                  {c.validUntil &&
                    ` · bis ${new Date(c.validUntil).toLocaleDateString("de-DE")}`}
                </p>
                {c.description && (
                  <p className="mt-2 text-xs text-zinc-500">{c.description}</p>
                )}
                <button
                  onClick={() => handleJoin(c.id)}
                  disabled={joining === c.id}
                  className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-[#FFC62C] px-4 py-2 text-sm font-semibold text-black hover:bg-[#FFD24D] transition-colors disabled:opacity-50"
                >
                  {joining === c.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  Teilnehmen
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
