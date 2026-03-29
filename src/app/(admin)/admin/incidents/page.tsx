"use client";

import { useState, useEffect, useCallback } from "react";
import {
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle2,
  Eye,
  RefreshCw,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface Incident {
  id: string;
  severity: "critical" | "warning" | "info";
  title: string;
  message: string;
  source: string;
  referenceId?: string;
  status: "open" | "acknowledged" | "resolved";
  resolvedAt?: string;
  createdAt: string;
}

const SEVERITY_CONFIG = {
  critical: {
    icon: AlertCircle,
    color: "text-red-400",
    bg: "bg-red-500/10 border-red-500/20",
    badge: "bg-red-500/20 text-red-400",
    label: "Kritisch",
  },
  warning: {
    icon: AlertTriangle,
    color: "text-amber-400",
    bg: "bg-amber-500/10 border-amber-500/20",
    badge: "bg-amber-500/20 text-amber-400",
    label: "Warnung",
  },
  info: {
    icon: Info,
    color: "text-blue-400",
    bg: "bg-blue-500/10 border-blue-500/20",
    badge: "bg-blue-500/20 text-blue-400",
    label: "Info",
  },
};

const STATUS_LABELS: Record<string, string> = {
  open: "Offen",
  acknowledged: "Bestätigt",
  resolved: "Gelöst",
};

export default function IncidentsPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "open" | "resolved">("open");

  const fetchIncidents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/incidents");
      if (res.ok) {
        const data = await res.json();
        setIncidents(data.incidents);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchIncidents();
  }, [fetchIncidents]);

  async function updateStatus(id: string, status: "acknowledged" | "resolved") {
    const res = await fetch("/api/admin/incidents", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    if (res.ok) {
      fetchIncidents();
    }
  }

  const filtered = incidents.filter((i) => {
    if (filter === "open") return i.status !== "resolved";
    if (filter === "resolved") return i.status === "resolved";
    return true;
  });

  const openCritical = incidents.filter(
    (i) => i.severity === "critical" && i.status === "open"
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-[#FFC62C]" />
            Vorfälle
            {openCritical > 0 && (
              <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-red-500/20 px-2.5 py-0.5 text-xs font-bold text-red-400">
                {openCritical} kritisch
              </span>
            )}
          </h1>
          <p className="text-zinc-400 mt-1">
            Systemfehler, fehlgeschlagene Jobs und Alarme
          </p>
        </div>
        <Button
          onClick={fetchIncidents}
          disabled={loading}
          variant="outline"
          size="sm"
          className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Aktualisieren
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {(["open", "all", "resolved"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
              filter === f
                ? "bg-[#FFC62C]/10 text-[#FFC62C] border border-[#FFC62C]/30"
                : "bg-zinc-800/50 text-zinc-400 border border-zinc-700/50 hover:text-zinc-300"
            }`}
          >
            {f === "open" ? "Offen" : f === "all" ? "Alle" : "Gelöst"}
          </button>
        ))}
      </div>

      {/* Incidents List */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-12 text-center">
          <CheckCircle2 className="h-10 w-10 text-emerald-400 mx-auto mb-3" />
          <p className="text-zinc-400">
            {filter === "open"
              ? "Keine offenen Vorfälle"
              : "Keine Vorfälle gefunden"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((incident) => {
            const config = SEVERITY_CONFIG[incident.severity];
            const Icon = config.icon;

            return (
              <div
                key={incident.id}
                className={`rounded-xl border p-5 ${config.bg}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <Icon className={`h-5 w-5 mt-0.5 shrink-0 ${config.color}`} />
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-white">
                          {incident.title}
                        </h3>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${config.badge}`}>
                          {config.label}
                        </span>
                        <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-400">
                          {STATUS_LABELS[incident.status]}
                        </span>
                      </div>
                      <pre className="text-sm text-zinc-400 mt-2 whitespace-pre-wrap font-sans leading-relaxed">
                        {incident.message}
                      </pre>
                      <div className="flex items-center gap-4 mt-3 text-xs text-zinc-500">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(incident.createdAt).toLocaleString("de-DE")}
                        </span>
                        <span>Quelle: {incident.source}</span>
                        {incident.referenceId && (
                          <span className="font-mono">
                            Ref: {incident.referenceId.slice(0, 12)}…
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  {incident.status !== "resolved" && (
                    <div className="flex gap-2 shrink-0">
                      {incident.status === "open" && (
                        <Button
                          onClick={() =>
                            updateStatus(incident.id, "acknowledged")
                          }
                          size="sm"
                          variant="outline"
                          className="border-zinc-600 text-zinc-300 hover:bg-zinc-800 text-xs"
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          Bestätigen
                        </Button>
                      )}
                      <Button
                        onClick={() => updateStatus(incident.id, "resolved")}
                        size="sm"
                        className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs"
                      >
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Lösen
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
