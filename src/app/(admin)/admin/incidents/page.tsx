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
  Play,
  XCircle,
  Loader2,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// ─── Types ───────────────────────────────────────────────────────

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

interface Job {
  id: string;
  type: string;
  payload: Record<string, unknown>;
  status: "pending" | "processing" | "completed" | "failed";
  attempts: number;
  maxAttempts: number;
  lastError?: string;
  nextRunAt: string;
  completedAt?: string;
  createdAt: string;
}

// ─── Config ──────────────────────────────────────────────────────

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

const JOB_STATUS_CONFIG = {
  pending: {
    icon: Clock,
    color: "text-amber-400",
    badge: "bg-amber-500/20 text-amber-400",
    label: "Ausstehend",
  },
  processing: {
    icon: Loader2,
    color: "text-blue-400",
    badge: "bg-blue-500/20 text-blue-400",
    label: "In Bearbeitung",
  },
  completed: {
    icon: CheckCircle2,
    color: "text-emerald-400",
    badge: "bg-emerald-500/20 text-emerald-400",
    label: "Abgeschlossen",
  },
  failed: {
    icon: XCircle,
    color: "text-red-400",
    badge: "bg-red-500/20 text-red-400",
    label: "Fehlgeschlagen",
  },
};

const JOB_TYPE_LABELS: Record<string, string> = {
  angebot_accepted_email: "Angebot-Bestätigung mit PDF",
};

const STATUS_LABELS: Record<string, string> = {
  open: "Offen",
  acknowledged: "Bestätigt",
  resolved: "Gelöst",
};

// ─── Page Component ──────────────────────────────────────────────

export default function IncidentsPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [incidentFilter, setIncidentFilter] = useState<"all" | "open" | "resolved">("open");
  const [jobFilter, setJobFilter] = useState<"all" | "active" | "completed" | "failed">("active");
  const [tab, setTab] = useState<"incidents" | "jobs">("jobs");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/incidents");
      if (res.ok) {
        const data = await res.json();
        setIncidents(data.incidents || []);
        setJobs(data.jobs || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15_000);
    return () => clearInterval(interval);
  }, [fetchData]);

  async function updateIncidentStatus(id: string, status: "acknowledged" | "resolved") {
    const res = await fetch("/api/admin/incidents", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    if (res.ok) fetchData();
  }

  async function retryJob() {
    // Trigger the process-jobs cron to pick up pending/failed jobs
    await fetch("/api/cron/process-jobs");
    fetchData();
  }

  // ─── Computed ────────────────────────────────────────────────

  const openIncidents = incidents.filter((i) => i.status !== "resolved").length;
  const openCritical = incidents.filter(
    (i) => i.severity === "critical" && i.status === "open"
  ).length;

  const activeJobs = jobs.filter((j) => j.status === "pending" || j.status === "processing").length;
  const failedJobs = jobs.filter((j) => j.status === "failed").length;
  const openJobs = activeJobs + failedJobs;

  const filteredIncidents = incidents.filter((i) => {
    if (incidentFilter === "open") return i.status !== "resolved";
    if (incidentFilter === "resolved") return i.status === "resolved";
    return true;
  });

  const filteredJobs = jobs.filter((j) => {
    if (jobFilter === "active") return j.status === "pending" || j.status === "processing";
    if (jobFilter === "completed") return j.status === "completed";
    if (jobFilter === "failed") return j.status === "failed";
    return true;
  });

  // ─── Render ──────────────────────────────────────────────────

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-[#FFC62C]" />
            Vorfälle & Jobs
          </h1>
          <p className="text-zinc-400 mt-1">
            Systemfehler, Aufgaben-Warteschlange und Alarme
          </p>
        </div>
        <Button
          onClick={fetchData}
          disabled={loading}
          variant="ghost"
          size="sm"
          className="border border-white/20 text-white/80 hover:text-white hover:bg-white/10"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Aktualisieren
        </Button>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-4 gap-3">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 text-center">
          <p className="text-2xl font-bold text-white">{jobs.length}</p>
          <p className="text-xs text-zinc-500 mt-1">Jobs gesamt</p>
        </div>
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-center">
          <p className="text-2xl font-bold text-amber-400">{activeJobs}</p>
          <p className="text-xs text-zinc-500 mt-1">Ausstehend</p>
        </div>
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-center">
          <p className="text-2xl font-bold text-red-400">{failedJobs}</p>
          <p className="text-xs text-zinc-500 mt-1">Fehlgeschlagen</p>
        </div>
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-center">
          <p className="text-2xl font-bold text-red-400">{openCritical}</p>
          <p className="text-xs text-zinc-500 mt-1">Kritische Vorfälle</p>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-1 rounded-lg bg-zinc-900/50 p-1 border border-zinc-800">
        <button
          onClick={() => setTab("jobs")}
          className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-all ${
            tab === "jobs"
              ? "bg-zinc-800 text-white"
              : "text-zinc-400 hover:text-zinc-300"
          }`}
        >
          Jobs ({openJobs})
        </button>
        <button
          onClick={() => setTab("incidents")}
          className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-all ${
            tab === "incidents"
              ? "bg-zinc-800 text-white"
              : "text-zinc-400 hover:text-zinc-300"
          }`}
        >
          Vorfälle ({openIncidents})
        </button>
      </div>

      {/* ─── Jobs Tab ─────────────────────────────────────────── */}
      {tab === "jobs" && (
        <div className="space-y-4">
          {/* Job Filters */}
          <div className="flex gap-2">
            {(["active", "all", "completed", "failed"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setJobFilter(f)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                  jobFilter === f
                    ? "bg-[#FFC62C]/10 text-[#FFC62C] border border-[#FFC62C]/30"
                    : "bg-zinc-800/50 text-zinc-400 border border-zinc-700/50 hover:text-zinc-300"
                }`}
              >
                {f === "active" ? "Aktiv" : f === "all" ? "Alle" : f === "completed" ? "Erledigt" : "Fehlgeschlagen"}
              </button>
            ))}
          </div>

          {filteredJobs.length === 0 ? (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-12 text-center">
              <CheckCircle2 className="h-10 w-10 text-emerald-400 mx-auto mb-3" />
              <p className="text-zinc-400">Keine Jobs in dieser Kategorie</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredJobs.map((job) => {
                const config = JOB_STATUS_CONFIG[job.status];
                const StatusIcon = config.icon;
                const typeLabel = JOB_TYPE_LABELS[job.type] || job.type;
                const isOverdue = job.status === "pending" && new Date(job.nextRunAt) < new Date();

                return (
                  <div
                    key={job.id}
                    className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 min-w-0">
                        <StatusIcon
                          className={`h-5 w-5 mt-0.5 shrink-0 ${config.color} ${
                            job.status === "processing" ? "animate-spin" : ""
                          }`}
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-white">
                              {typeLabel}
                            </h3>
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${config.badge}`}>
                              {config.label}
                            </span>
                            {isOverdue && (
                              <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-[10px] text-red-400 font-bold">
                                Überfällig
                              </span>
                            )}
                          </div>

                          {/* Progress bar for attempts */}
                          <div className="flex items-center gap-2 mt-2">
                            <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden max-w-[120px]">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  job.status === "completed"
                                    ? "bg-emerald-400"
                                    : job.status === "failed"
                                      ? "bg-red-400"
                                      : "bg-amber-400"
                                }`}
                                style={{
                                  width: `${(job.attempts / job.maxAttempts) * 100}%`,
                                }}
                              />
                            </div>
                            <span className="text-xs text-zinc-500">
                              {job.attempts}/{job.maxAttempts} Versuche
                            </span>
                          </div>

                          {/* Error message */}
                          {job.lastError && (
                            <p className="text-xs text-red-400/80 mt-2 font-mono bg-red-500/5 rounded px-2 py-1 break-all">
                              {job.lastError}
                            </p>
                          )}

                          {/* Metadata */}
                          <div className="flex items-center gap-4 mt-2 text-xs text-zinc-500 flex-wrap">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Erstellt: {new Date(job.createdAt).toLocaleString("de-DE")}
                            </span>
                            {job.status === "pending" && (
                              <span className="flex items-center gap-1">
                                <Play className="h-3 w-3" />
                                Nächster Versuch: {new Date(job.nextRunAt).toLocaleString("de-DE")}
                              </span>
                            )}
                            {job.completedAt && (
                              <span className="flex items-center gap-1">
                                <CheckCircle2 className="h-3 w-3" />
                                Erledigt: {new Date(job.completedAt).toLocaleString("de-DE")}
                              </span>
                            )}
                            <span className="font-mono text-zinc-600">
                              {job.id.slice(0, 12)}…
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      {(job.status === "pending" || job.status === "failed") && (
                        <Button
                          onClick={() => retryJob()}
                          size="sm"
                          variant="outline"
                          className="border-zinc-600 text-zinc-300 hover:bg-zinc-800 text-xs shrink-0"
                        >
                          <RotateCcw className="h-3 w-3 mr-1" />
                          Jetzt ausführen
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ─── Incidents Tab ────────────────────────────────────── */}
      {tab === "incidents" && (
        <div className="space-y-4">
          {/* Incident Filters */}
          <div className="flex gap-2">
            {(["open", "all", "resolved"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setIncidentFilter(f)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                  incidentFilter === f
                    ? "bg-[#FFC62C]/10 text-[#FFC62C] border border-[#FFC62C]/30"
                    : "bg-zinc-800/50 text-zinc-400 border border-zinc-700/50 hover:text-zinc-300"
                }`}
              >
                {f === "open" ? "Offen" : f === "all" ? "Alle" : "Gelöst"}
              </button>
            ))}
          </div>

          {filteredIncidents.length === 0 ? (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-12 text-center">
              <CheckCircle2 className="h-10 w-10 text-emerald-400 mx-auto mb-3" />
              <p className="text-zinc-400">
                {incidentFilter === "open"
                  ? "Keine offenen Vorfälle"
                  : "Keine Vorfälle gefunden"}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredIncidents.map((incident) => {
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

                      {incident.status !== "resolved" && (
                        <div className="flex gap-2 shrink-0">
                          {incident.status === "open" && (
                            <Button
                              onClick={() => updateIncidentStatus(incident.id, "acknowledged")}
                              size="sm"
                              variant="outline"
                              className="border-zinc-600 text-zinc-300 hover:bg-zinc-800 text-xs"
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              Bestätigen
                            </Button>
                          )}
                          <Button
                            onClick={() => updateIncidentStatus(incident.id, "resolved")}
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
      )}
    </div>
  );
}
