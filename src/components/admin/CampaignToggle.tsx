"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export function CampaignToggle({
  id,
  initialActive,
}: {
  id: string;
  initialActive: boolean;
}) {
  const router = useRouter();
  const [active, setActive] = useState(initialActive);
  const [isPending, startTransition] = useTransition();
  const [loading, setLoading] = useState(false);

  async function toggle() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/campaigns/${id}/toggle`, {
        method: "POST",
      });
      const json = await res.json();
      if (res.ok) {
        setActive(json.active);
        startTransition(() => router.refresh());
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={loading || isPending}
      className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
        active
          ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300 hover:bg-emerald-400/20"
          : "border-zinc-500/30 bg-zinc-500/10 text-zinc-300 hover:bg-zinc-500/20"
      } disabled:opacity-50`}
    >
      {(loading || isPending) && <Loader2 className="h-3 w-3 animate-spin" />}
      {active ? "Aktiv" : "Inaktiv"} — klicken zum Umschalten
    </button>
  );
}
