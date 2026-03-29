"use client";

import { useEffect, useState, useCallback } from "react";
import {
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  Send,
  ExternalLink,
} from "lucide-react";
import type { Angebot } from "@/lib/angebote";

interface AngebotHistoryProps {
  submissionId: string;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatEur(n: number) {
  return n.toLocaleString("de-DE") + " EUR";
}

const STATUS_CONFIG: Record<
  string,
  { icon: React.ReactNode; label: string; cls: string }
> = {
  draft: {
    icon: <Clock className="h-3 w-3" />,
    label: "Entwurf",
    cls: "bg-gray-400/10 text-gray-400",
  },
  sent: {
    icon: <Send className="h-3 w-3" />,
    label: "Gesendet",
    cls: "bg-blue-400/10 text-blue-400",
  },
  accepted: {
    icon: <CheckCircle2 className="h-3 w-3" />,
    label: "Angenommen",
    cls: "bg-green-400/10 text-green-400",
  },
  rejected_by_client: {
    icon: <XCircle className="h-3 w-3" />,
    label: "Abgelehnt",
    cls: "bg-orange-400/10 text-orange-400",
  },
};

export function AngebotHistory({ submissionId }: AngebotHistoryProps) {
  const [angebote, setAngebote] = useState<Angebot[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAngebote = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/admin/submissions/${submissionId}/angebote`
      );
      const data = await res.json();
      setAngebote(data.angebote || []);
    } catch {
      // Handle silently
    } finally {
      setLoading(false);
    }
  }, [submissionId]);

  useEffect(() => {
    fetchAngebote();
  }, [fetchAngebote]);

  if (loading) {
    return (
      <div className="text-center py-4">
        <p className="text-sm text-[#8B8F97]">Lade Angebote...</p>
      </div>
    );
  }

  if (angebote.length === 0) return null;

  return (
    <div className="border-t border-white/[0.06] pt-4">
      <h4 className="text-sm font-semibold text-white flex items-center gap-2 mb-3">
        <FileText className="h-4 w-4 text-[#FFC62C]" />
        Angebote ({angebote.length})
      </h4>

      <div className="space-y-2">
        {angebote.map((angebot) => {
          const config = STATUS_CONFIG[angebot.status] || STATUS_CONFIG.draft;
          const isActive =
            angebot.status === "sent" || angebot.status === "draft";

          return (
            <div
              key={angebot.id}
              className={`flex items-center justify-between rounded-lg p-3 border ${
                isActive
                  ? "border-[#FFC62C]/20 bg-[#FFC62C]/[0.03]"
                  : "border-white/[0.06] bg-white/[0.02]"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-white">
                  V{angebot.version}
                </span>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${config.cls}`}
                >
                  {config.icon} {config.label}
                </span>
                <span className="text-xs text-[#6a6e76]">
                  {formatDate(angebot.createdAt)}
                </span>
              </div>

              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-[#FFC62C]">
                  {formatEur(angebot.festpreis)}
                </span>
                {(angebot.status === "sent" ||
                  angebot.status === "accepted") && (
                  <a
                    href={`/angebot/${angebot.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-[#8B8F97] hover:text-[#FFC62C] transition-colors flex items-center gap-1"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Ansehen
                  </a>
                )}
              </div>

              {angebot.status === "rejected_by_client" &&
                angebot.clientFeedback && (
                  <p className="text-xs text-orange-300 mt-1 w-full pl-10">
                    Feedback: {angebot.clientFeedback}
                  </p>
                )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
