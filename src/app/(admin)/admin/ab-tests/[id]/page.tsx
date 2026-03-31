"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Play,
  Pause,
  CheckCircle2,
  FlaskConical,
  TrendingUp,
  Users,
  MousePointerClick,
  FileEdit,
  Trash2,
  AlertTriangle,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ABTestStats {
  variantId: string;
  variantLabel: string;
  impressions: number;
  uniqueVisitors: number;
  conversions: number;
  conversionRate: number;
}

interface ABTestVariant {
  id: string;
  label: string;
  config: Record<string, string>;
  weight: number;
}

interface ABTestDetail {
  id: string;
  name: string;
  targetElement: string;
  status: "draft" | "running" | "paused" | "completed";
  variants: ABTestVariant[];
  stats: ABTestStats[];
  totalImpressions: number;
  totalConversions: number;
  createdAt: string;
  startedAt?: string;
  pausedAt?: string;
  completedAt?: string;
}

// ---------------------------------------------------------------------------
// Statistical significance (z-test for two proportions)
// ---------------------------------------------------------------------------

function calculateSignificance(
  controlVisitors: number,
  controlConversions: number,
  variantVisitors: number,
  variantConversions: number
): { zScore: number; pValue: number; significant: boolean } {
  if (controlVisitors === 0 || variantVisitors === 0) {
    return { zScore: 0, pValue: 1, significant: false };
  }

  const p1 = controlConversions / controlVisitors;
  const p2 = variantConversions / variantVisitors;
  const pPool =
    (controlConversions + variantConversions) /
    (controlVisitors + variantVisitors);

  if (pPool === 0 || pPool === 1) {
    return { zScore: 0, pValue: 1, significant: false };
  }

  const se = Math.sqrt(
    pPool * (1 - pPool) * (1 / controlVisitors + 1 / variantVisitors)
  );

  if (se === 0) return { zScore: 0, pValue: 1, significant: false };

  const zScore = (p2 - p1) / se;

  // Approximate two-tailed p-value using error function approximation
  const absZ = Math.abs(zScore);
  const t = 1 / (1 + 0.2316419 * absZ);
  const d = 0.3989423 * Math.exp((-absZ * absZ) / 2);
  const pValue =
    d *
    t *
    (0.3193815 +
      t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274)))) *
    2;

  return { zScore, pValue, significant: pValue < 0.05 };
}

// ---------------------------------------------------------------------------
// Status config
// ---------------------------------------------------------------------------

const STATUS_CONFIG = {
  draft: { label: "Entwurf", icon: FileEdit, color: "bg-zinc-700 text-zinc-300" },
  running: { label: "Aktiv", icon: Play, color: "bg-emerald-500/20 text-emerald-400" },
  paused: { label: "Pausiert", icon: Pause, color: "bg-amber-500/20 text-amber-400" },
  completed: { label: "Abgeschlossen", icon: CheckCircle2, color: "bg-blue-500/20 text-blue-400" },
};

const VARIANT_COLORS = ["bg-zinc-400", "bg-[#FFC62C]", "bg-emerald-400", "bg-blue-400", "bg-purple-400"];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ABTestDetailPage() {
  const params = useParams();
  const router = useRouter();
  const testId = params.id as string;

  const [test, setTest] = useState<ABTestDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const fetchTest = useCallback(() => {
    fetch(`/api/admin/ab-tests/${testId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Not found");
        return res.json();
      })
      .then(setTest)
      .catch(() => router.push("/admin/ab-tests"))
      .finally(() => setLoading(false));
  }, [testId, router]);

  useEffect(() => {
    fetchTest();
    // Auto-refresh every 10s for running tests
    const interval = setInterval(fetchTest, 10000);
    return () => clearInterval(interval);
  }, [fetchTest]);

  const updateStatus = async (status: string) => {
    setActionLoading(true);
    try {
      await fetch(`/api/admin/ab-tests/${testId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      fetchTest();
    } catch {
      // Ignore
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    setActionLoading(true);
    try {
      await fetch(`/api/admin/ab-tests/${testId}`, { method: "DELETE" });
      router.push("/admin/ab-tests");
    } catch {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 lg:p-8 text-zinc-500 text-center py-12">
        Laden...
      </div>
    );
  }

  if (!test) return null;

  const statusCfg = STATUS_CONFIG[test.status];
  const StatusIcon = statusCfg.icon;
  const maxConversionRate = Math.max(
    ...test.stats.map((s) => s.conversionRate),
    0.001
  );

  // Find control (first variant) for significance calculation
  const controlStats = test.stats[0];

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Back link */}
      <Link
        href="/admin/ab-tests"
        className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-300 transition-colors mb-4"
      >
        <ArrowLeft className="h-4 w-4" />
        Zurück zu A/B Tests
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <FlaskConical className="h-7 w-7 text-[#FFC62C]" />
            {test.name}
          </h1>
          <div className="flex items-center gap-3 mt-2">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusCfg.color}`}
            >
              <StatusIcon className="h-3.5 w-3.5" />
              {statusCfg.label}
            </span>
            <span className="text-sm text-zinc-500">
              Element: <span className="text-zinc-400">{test.targetElement}</span>
            </span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          {test.status === "draft" && (
            <Button
              onClick={() => updateStatus("running")}
              disabled={actionLoading}
              className="bg-emerald-600 hover:bg-emerald-500 text-white"
            >
              <Play className="mr-2 h-4 w-4" />
              Starten
            </Button>
          )}
          {test.status === "running" && (
            <>
              <Button
                onClick={() => updateStatus("paused")}
                disabled={actionLoading}
                variant="outline"
                className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
              >
                <Pause className="mr-2 h-4 w-4" />
                Pausieren
              </Button>
              <Button
                onClick={() => updateStatus("completed")}
                disabled={actionLoading}
                className="bg-blue-600 hover:bg-blue-500 text-white"
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Abschließen
              </Button>
            </>
          )}
          {test.status === "paused" && (
            <>
              <Button
                onClick={() => updateStatus("running")}
                disabled={actionLoading}
                className="bg-emerald-600 hover:bg-emerald-500 text-white"
              >
                <Play className="mr-2 h-4 w-4" />
                Fortsetzen
              </Button>
              <Button
                onClick={() => updateStatus("completed")}
                disabled={actionLoading}
                className="bg-blue-600 hover:bg-blue-500 text-white"
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Abschließen
              </Button>
            </>
          )}
          {!confirmDelete ? (
            <Button
              onClick={() => setConfirmDelete(true)}
              variant="outline"
              className="border-red-800/50 text-red-400 hover:bg-red-500/10"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={handleDelete}
              disabled={actionLoading}
              className="bg-red-600 hover:bg-red-500 text-white"
            >
              Endgültig löschen
            </Button>
          )}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="border border-zinc-800 rounded-xl p-5 bg-zinc-900/50">
          <div className="flex items-center gap-2 text-zinc-500 text-sm mb-2">
            <Users className="h-4 w-4" />
            Impressions
          </div>
          <div className="text-2xl font-bold text-white font-mono">
            {test.totalImpressions.toLocaleString("de-DE")}
          </div>
        </div>
        <div className="border border-zinc-800 rounded-xl p-5 bg-zinc-900/50">
          <div className="flex items-center gap-2 text-zinc-500 text-sm mb-2">
            <MousePointerClick className="h-4 w-4" />
            Conversions
          </div>
          <div className="text-2xl font-bold text-white font-mono">
            {test.totalConversions.toLocaleString("de-DE")}
          </div>
        </div>
        <div className="border border-zinc-800 rounded-xl p-5 bg-zinc-900/50">
          <div className="flex items-center gap-2 text-zinc-500 text-sm mb-2">
            <TrendingUp className="h-4 w-4" />
            Ø Conversion Rate
          </div>
          <div className="text-2xl font-bold text-white font-mono">
            {test.totalImpressions > 0
              ? ((test.totalConversions / test.totalImpressions) * 100).toFixed(
                  1
                )
              : "0.0"}
            %
          </div>
        </div>
      </div>

      {/* Dates */}
      <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-zinc-500 mb-8">
        <span>
          Erstellt:{" "}
          {new Date(test.createdAt).toLocaleDateString("de-DE", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
        {test.startedAt && (
          <span>
            Gestartet:{" "}
            {new Date(test.startedAt).toLocaleDateString("de-DE", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        )}
        {test.completedAt && (
          <span>
            Abgeschlossen:{" "}
            {new Date(test.completedAt).toLocaleDateString("de-DE", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        )}
      </div>

      {/* Results table */}
      <div className="border border-zinc-800 rounded-xl overflow-hidden mb-8">
        <div className="px-5 py-3 bg-zinc-900/50 border-b border-zinc-800">
          <h2 className="text-sm font-semibold text-white">
            Ergebnisse pro Variante
          </h2>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-zinc-800/50">
              <th className="text-left px-5 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">
                Variante
              </th>
              <th className="text-right px-5 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">
                Weight
              </th>
              <th className="text-right px-5 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">
                Besucher
              </th>
              <th className="text-right px-5 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">
                Conversions
              </th>
              <th className="text-right px-5 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">
                CR
              </th>
              <th className="px-5 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider w-48">
                {/* Bar */}
              </th>
              <th className="text-right px-5 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">
                vs Control
              </th>
            </tr>
          </thead>
          <tbody>
            {test.stats.map((stat, idx) => {
              const variant = test.variants[idx];
              const barWidth =
                maxConversionRate > 0
                  ? (stat.conversionRate / maxConversionRate) * 100
                  : 0;

              // Significance vs control (skip for control itself)
              let significance = null;
              if (idx > 0 && controlStats) {
                significance = calculateSignificance(
                  controlStats.uniqueVisitors,
                  controlStats.conversions,
                  stat.uniqueVisitors,
                  stat.conversions
                );
              }

              const improvement =
                idx > 0 && controlStats && controlStats.conversionRate > 0
                  ? ((stat.conversionRate - controlStats.conversionRate) /
                      controlStats.conversionRate) *
                    100
                  : null;

              return (
                <tr
                  key={stat.variantId}
                  className="border-b border-zinc-800/30"
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-3 h-3 rounded-full shrink-0 ${
                          VARIANT_COLORS[idx] || "bg-zinc-500"
                        }`}
                      />
                      <span className="text-sm text-white font-medium">
                        {stat.variantLabel}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-right text-sm text-zinc-400 font-mono">
                    {variant?.weight}%
                  </td>
                  <td className="px-5 py-4 text-right text-sm text-zinc-300 font-mono">
                    {stat.uniqueVisitors.toLocaleString("de-DE")}
                  </td>
                  <td className="px-5 py-4 text-right text-sm text-zinc-300 font-mono">
                    {stat.conversions.toLocaleString("de-DE")}
                  </td>
                  <td className="px-5 py-4 text-right text-sm font-mono font-semibold">
                    <span
                      className={
                        stat.conversionRate ===
                        Math.max(...test.stats.map((s) => s.conversionRate))
                          ? "text-emerald-400"
                          : "text-zinc-300"
                      }
                    >
                      {(stat.conversionRate * 100).toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="w-full bg-zinc-800 rounded-full h-2.5">
                      <div
                        className={`h-2.5 rounded-full transition-all duration-500 ${
                          VARIANT_COLORS[idx] || "bg-zinc-500"
                        }`}
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                  </td>
                  <td className="px-5 py-4 text-right text-sm font-mono">
                    {idx === 0 ? (
                      <span className="text-zinc-600">—</span>
                    ) : improvement !== null ? (
                      <div>
                        <span
                          className={
                            improvement > 0
                              ? "text-emerald-400"
                              : improvement < 0
                              ? "text-red-400"
                              : "text-zinc-400"
                          }
                        >
                          {improvement > 0 ? "+" : ""}
                          {improvement.toFixed(1)}%
                        </span>
                        {significance && (
                          <div
                            className={`text-[10px] mt-0.5 ${
                              significance.significant
                                ? "text-emerald-500"
                                : "text-zinc-600"
                            }`}
                          >
                            {significance.significant
                              ? "Signifikant"
                              : "Nicht signifikant"}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-zinc-600">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Significance hint */}
      {test.totalImpressions > 0 && test.totalImpressions < 200 && (
        <div className="flex items-start gap-3 text-sm text-amber-400/80 bg-amber-500/10 border border-amber-500/20 rounded-lg px-4 py-3 mb-8">
          <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>
            Für statistisch belastbare Ergebnisse werden mindestens ~100
            Besucher pro Variante empfohlen. Aktuell:{" "}
            {test.totalImpressions} Impressions gesamt.
          </span>
        </div>
      )}

      {/* Variant configs */}
      <div className="border border-zinc-800 rounded-xl overflow-hidden">
        <div className="px-5 py-3 bg-zinc-900/50 border-b border-zinc-800">
          <h2 className="text-sm font-semibold text-white">
            Varianten-Konfiguration
          </h2>
        </div>
        <div className="divide-y divide-zinc-800/50">
          {test.variants.map((variant, idx) => (
            <div key={variant.id} className="px-5 py-4">
              <div className="flex items-center gap-2.5 mb-2">
                <div
                  className={`w-3 h-3 rounded-full ${
                    VARIANT_COLORS[idx] || "bg-zinc-500"
                  }`}
                />
                <span className="text-sm text-white font-medium">
                  {variant.label}
                </span>
                <span className="text-xs text-zinc-600">({variant.id})</span>
              </div>
              <div className="pl-[22px] space-y-1">
                {Object.entries(variant.config).length === 0 ? (
                  <span className="text-xs text-zinc-600 italic">
                    Keine Konfiguration (Original)
                  </span>
                ) : (
                  Object.entries(variant.config).map(([key, value]) => (
                    <div key={key} className="text-sm">
                      <span className="text-zinc-500">{key}:</span>{" "}
                      <span className="text-zinc-300">
                        {value || "(leer)"}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
