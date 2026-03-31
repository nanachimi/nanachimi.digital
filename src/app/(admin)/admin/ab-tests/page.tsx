"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus, FlaskConical, Play, Pause, CheckCircle2, FileEdit } from "lucide-react";

interface ABTestVariant {
  id: string;
  label: string;
  config: Record<string, string>;
  weight: number;
}

interface ABTestStats {
  variantId: string;
  variantLabel: string;
  impressions: number;
  uniqueVisitors: number;
  conversions: number;
  conversionRate: number;
}

interface ABTestWithStats {
  id: string;
  name: string;
  targetElement: string;
  status: "draft" | "running" | "paused" | "completed";
  variants: ABTestVariant[];
  stats: ABTestStats[];
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
}

const STATUS_CONFIG = {
  draft: { label: "Entwurf", icon: FileEdit, color: "bg-zinc-700 text-zinc-300" },
  running: { label: "Aktiv", icon: Play, color: "bg-emerald-500/20 text-emerald-400" },
  paused: { label: "Pausiert", icon: Pause, color: "bg-amber-500/20 text-amber-400" },
  completed: { label: "Abgeschlossen", icon: CheckCircle2, color: "bg-blue-500/20 text-blue-400" },
};

export default function ABTestsListPage() {
  const [tests, setTests] = useState<ABTestWithStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/ab-tests")
      .then((res) => res.json())
      .then(setTests)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const getTotalImpressions = (stats: ABTestStats[]) =>
    stats.reduce((sum, s) => sum + s.impressions, 0);

  const getBestConversionRate = (stats: ABTestStats[]) => {
    if (stats.length === 0) return 0;
    return Math.max(...stats.map((s) => s.conversionRate));
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <FlaskConical className="h-7 w-7 text-[#FFC62C]" />
            A/B Tests
          </h1>
          <p className="text-zinc-400 mt-1">
            Testen Sie verschiedene UI-Varianten und messen Sie die Conversion
          </p>
        </div>
        <Button asChild className="bg-[#FFC62C] text-zinc-900 hover:bg-[#FFD54F] font-semibold">
          <Link href="/admin/ab-tests/new">
            <Plus className="mr-2 h-4 w-4" />
            Neuer Test
          </Link>
        </Button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="text-zinc-500 text-center py-12">Laden...</div>
      )}

      {/* Empty state */}
      {!loading && tests.length === 0 && (
        <div className="text-center py-16 border border-zinc-800 rounded-xl">
          <FlaskConical className="h-12 w-12 text-zinc-700 mx-auto mb-4" />
          <h2 className="text-lg font-medium text-zinc-300 mb-2">
            Keine A/B Tests vorhanden
          </h2>
          <p className="text-zinc-500 mb-6">
            Erstellen Sie Ihren ersten Test, um UI-Varianten zu vergleichen.
          </p>
          <Button asChild className="bg-[#FFC62C] text-zinc-900 hover:bg-[#FFD54F]">
            <Link href="/admin/ab-tests/new">
              <Plus className="mr-2 h-4 w-4" />
              Ersten Test erstellen
            </Link>
          </Button>
        </div>
      )}

      {/* Tests table */}
      {!loading && tests.length > 0 && (
        <div className="border border-zinc-800 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-900/50">
                <th className="text-left px-5 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="text-left px-5 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  Element
                </th>
                <th className="text-left px-5 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="text-right px-5 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  Varianten
                </th>
                <th className="text-right px-5 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  Impressions
                </th>
                <th className="text-right px-5 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  Beste CR
                </th>
              </tr>
            </thead>
            <tbody>
              {tests.map((test) => {
                const statusCfg = STATUS_CONFIG[test.status];
                const StatusIcon = statusCfg.icon;
                const totalImpressions = getTotalImpressions(test.stats);
                const bestCR = getBestConversionRate(test.stats);

                return (
                  <tr
                    key={test.id}
                    className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors cursor-pointer"
                  >
                    <td className="px-5 py-4">
                      <Link
                        href={`/admin/ab-tests/${test.id}`}
                        className="text-white font-medium hover:text-[#FFC62C] transition-colors"
                      >
                        {test.name}
                      </Link>
                      <div className="text-xs text-zinc-500 mt-0.5">
                        {new Date(test.createdAt).toLocaleDateString("de-DE")}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-zinc-400">
                      {test.targetElement}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusCfg.color}`}
                      >
                        <StatusIcon className="h-3.5 w-3.5" />
                        {statusCfg.label}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right text-sm text-zinc-400">
                      {test.variants.length}
                    </td>
                    <td className="px-5 py-4 text-right text-sm text-zinc-300 font-mono">
                      {totalImpressions.toLocaleString("de-DE")}
                    </td>
                    <td className="px-5 py-4 text-right text-sm font-mono">
                      <span
                        className={
                          bestCR > 0 ? "text-emerald-400" : "text-zinc-500"
                        }
                      >
                        {(bestCR * 100).toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
