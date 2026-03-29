"use client";

import { useState, useEffect, useCallback } from "react";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Database,
  HardDrive,
  Mail,
  Brain,
  Settings,
  Activity,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface HealthCheck {
  service: string;
  status: "healthy" | "unhealthy" | "degraded";
  latencyMs?: number;
  message?: string;
}

interface HealthResponse {
  status: "healthy" | "unhealthy" | "degraded";
  timestamp: string;
  version: string;
  checks: HealthCheck[];
}

const SERVICE_ICONS: Record<string, React.ElementType> = {
  database: Database,
  seaweedfs: HardDrive,
  smtp: Mail,
  anthropic: Brain,
  environment: Settings,
};

const SERVICE_LABELS: Record<string, string> = {
  database: "PostgreSQL Datenbank",
  seaweedfs: "SeaweedFS Dateispeicher",
  smtp: "E-Mail (SMTP)",
  anthropic: "Anthropic AI API",
  environment: "Umgebungsvariablen",
};

const STATUS_COLORS = {
  healthy: "text-emerald-400",
  unhealthy: "text-red-400",
  degraded: "text-amber-400",
};

const STATUS_BG = {
  healthy: "bg-emerald-500/10 border-emerald-500/20",
  unhealthy: "bg-red-500/10 border-red-500/20",
  degraded: "bg-amber-500/10 border-amber-500/20",
};

const STATUS_ICONS = {
  healthy: CheckCircle2,
  unhealthy: XCircle,
  degraded: AlertTriangle,
};

const STATUS_LABELS = {
  healthy: "Alle Systeme operativ",
  unhealthy: "Systemstörung erkannt",
  degraded: "Eingeschränkter Betrieb",
};

export default function StatusPage() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const fetchHealth = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/health");
      if (res.status === 401) {
        setError("Nicht autorisiert");
        return;
      }
      const data = await res.json();
      setHealth(data);
      setLastRefresh(new Date());
    } catch {
      setError("Verbindung zum Server fehlgeschlagen");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHealth();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchHealth, 30_000);
    return () => clearInterval(interval);
  }, [fetchHealth]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Activity className="h-6 w-6 text-[#FFC62C]" />
            Systemstatus
          </h1>
          <p className="text-zinc-400 mt-1">
            Übersicht aller Integrationen und Dienste
          </p>
        </div>
        <div className="flex items-center gap-3">
          {lastRefresh && (
            <span className="text-xs text-zinc-500">
              Aktualisiert: {lastRefresh.toLocaleTimeString("de-DE")}
            </span>
          )}
          <Button
            onClick={fetchHealth}
            disabled={loading}
            variant="outline"
            size="sm"
            className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
            />
            Aktualisieren
          </Button>
        </div>
      </div>

      {/* Overall Status Banner */}
      {health && (
        <div
          className={`rounded-xl border p-6 ${STATUS_BG[health.status]}`}
        >
          <div className="flex items-center gap-3">
            {(() => {
              const Icon = STATUS_ICONS[health.status];
              return (
                <Icon className={`h-8 w-8 ${STATUS_COLORS[health.status]}`} />
              );
            })()}
            <div>
              <h2
                className={`text-lg font-bold ${STATUS_COLORS[health.status]}`}
              >
                {STATUS_LABELS[health.status]}
              </h2>
              <p className="text-zinc-400 text-sm">
                Version {health.version} &middot;{" "}
                {new Date(health.timestamp).toLocaleString("de-DE")}
              </p>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-red-400">
          {error}
        </div>
      )}

      {/* Individual Service Checks */}
      {health && (
        <div className="grid gap-4">
          {health.checks.map((check) => {
            const Icon = SERVICE_ICONS[check.service] || Settings;
            const StatusIcon = STATUS_ICONS[check.status];
            const label = SERVICE_LABELS[check.service] || check.service;

            return (
              <div
                key={check.service}
                className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-zinc-800">
                    <Icon className="h-5 w-5 text-zinc-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{label}</h3>
                    <p className="text-sm text-zinc-500">{check.message}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {check.latencyMs !== undefined && (
                    <span className="text-xs text-zinc-500 font-mono">
                      {check.latencyMs}ms
                    </span>
                  )}
                  <StatusIcon
                    className={`h-5 w-5 ${STATUS_COLORS[check.status]}`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && !health && (
        <div className="grid gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 animate-pulse"
            >
              <div className="flex items-center gap-4">
                <div className="h-11 w-11 rounded-lg bg-zinc-800" />
                <div className="space-y-2">
                  <div className="h-4 w-40 bg-zinc-800 rounded" />
                  <div className="h-3 w-60 bg-zinc-800 rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* API Info */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-4 text-xs text-zinc-600">
        <p className="font-mono">
          API: GET /api/health &middot; Auth: Admin-Session oder Bearer-Token
          (HEALTH_CHECK_SECRET)
        </p>
      </div>
    </div>
  );
}
