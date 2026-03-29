"use client";

import { useState } from "react";
import { Check, X, ArrowRight, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface Props {
  id: string;
}

export function AngebotActions({ id }: Props) {
  const [status, setStatus] = useState<
    "idle" | "rejecting" | "accepted" | "rejected" | "loading"
  >("idle");
  const [feedback, setFeedback] = useState("");
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
        setStatus(action === "accept" ? "accepted" : "rejected");
      }
    } catch {
      setStatus("idle");
    }
  }

  if (status === "accepted") {
    return (
      <div className="rounded-2xl border border-green-400/30 bg-green-400/[0.08] p-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-400/20">
          <Check className="h-8 w-8 text-green-400" />
        </div>
        <h3 className="text-2xl font-bold text-white">
          Angebot angenommen!
        </h3>
        <p className="mt-3 text-[#8B8F97]">
          Vielen Dank! Wir melden uns in Kürze bei Ihnen, um die nächsten
          Schritte zu besprechen.
        </p>
      </div>
    );
  }

  if (status === "rejected") {
    return (
      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-8 text-center">
        <p className="text-lg font-semibold text-white">
          Angebot abgelehnt
        </p>
        <p className="mt-2 text-[#8B8F97]">
          Schade! Falls Sie Ihre Meinung ändern oder ein angepasstes Angebot
          wünschen, kontaktieren Sie uns jederzeit.
        </p>
      </div>
    );
  }

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
