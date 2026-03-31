"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Eye,
  Users,
  Clock,
  MousePointerClick,
  TrendingUp,
  Phone,
  Mail,
  RefreshCw,
  X,
  ShieldBan,
  Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface Stats {
  pageViews: {
    total: number;
    uniqueVisitors: number;
    avgTimeOnPage: number;
    topPages: { path: string; views: number; avgTime: number }[];
  };
  trafficSources: { source: string; count: number }[];
  visitorLocations: { country: string; count: number; uniqueVisitors: number }[];
  onboardingFunnel: {
    step: number;
    stepName: string;
    entries: number;
    completions: number;
    avgDuration: number;
    dropOff: number;
  }[];
  conversions: {
    totalCtaClicks: number;
    conversionRate: number;
    callVsAngebot: { call: number; angebot: number };
  };
}

interface DetailView {
  id: string;
  visitorId: string;
  ip: string | null;
  path: string;
  referrer: string;
  utmSource: string | null;
  timeOnPage: number | null;
  timestamp: string;
  isExcluded: boolean;
}

function formatTime(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}m ${s}s`;
}

function formatPercent(n: number): string {
  return `${(n * 100).toFixed(1)}%`;
}

export default function AnalyticsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [detailPath, setDetailPath] = useState<string | null>(null);
  const [detailViews, setDetailViews] = useState<DetailView[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch("/api/admin/analytics");
      if (!r.ok) {
        const data = await r.json().catch(() => ({}));
        setError(data.error || `Fehler ${r.status}`);
        return;
      }
      const d = await r.json();
      setStats(d);
      setLastRefresh(new Date());
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Verbindung fehlgeschlagen"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30_000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  async function openDetail(path: string) {
    setDetailPath(path);
    setDetailLoading(true);
    try {
      const r = await fetch(
        `/api/admin/analytics?detail=${encodeURIComponent(path)}`
      );
      if (r.ok) {
        const data = await r.json();
        setDetailViews(data.views || []);
      }
    } catch {
      // ignore
    } finally {
      setDetailLoading(false);
    }
  }

  if (loading && !stats) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-white mb-8">Analytics</h1>
        <div className="text-zinc-500">Laden...</div>
      </div>
    );
  }

  if (!stats && !loading) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-white mb-8">Analytics</h1>
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-red-400 text-sm">
          {error || "Fehler beim Laden der Daten."}
        </div>
        <Button
          onClick={fetchStats}
          className="mt-4"
          variant="outline"
          size="sm"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Erneut versuchen
        </Button>
      </div>
    );
  }

  if (!stats) return null;

  const callTotal = stats.conversions.callVsAngebot.call;
  const angebotTotal = stats.conversions.callVsAngebot.angebot;
  const pathTotal = callTotal + angebotTotal;

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Analytics</h1>
        <div className="flex items-center gap-3">
          {lastRefresh && (
            <span className="text-xs text-zinc-500">
              Aktualisiert: {lastRefresh.toLocaleTimeString("de-DE")}
            </span>
          )}
          <Button
            onClick={fetchStats}
            disabled={loading}
            variant="ghost"
            size="sm"
            className="border border-white/20 text-white/80 hover:text-white hover:bg-white/10"
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
            />
            Aktualisieren
          </Button>
        </div>
      </div>

      {/* ── Overview Cards ──────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<Eye className="h-5 w-5" />}
          label="Seitenaufrufe"
          value={stats.pageViews.total.toLocaleString("de-DE")}
        />
        <StatCard
          icon={<Users className="h-5 w-5" />}
          label="Eindeutige Besucher"
          value={stats.pageViews.uniqueVisitors.toLocaleString("de-DE")}
        />
        <StatCard
          icon={<Clock className="h-5 w-5" />}
          label="Ø Verweildauer"
          value={formatTime(stats.pageViews.avgTimeOnPage)}
        />
        <StatCard
          icon={<MousePointerClick className="h-5 w-5" />}
          label="CTA-Klicks"
          value={stats.conversions.totalCtaClicks.toLocaleString("de-DE")}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* ── Top Pages ────────────────────────────────────── */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">
              Top Seiten
            </h2>
            <button
              onClick={() => openDetail("all")}
              className="text-[10px] text-[#FFC62C] hover:underline"
            >
              Alle Aufrufe anzeigen →
            </button>
          </div>
          {stats.pageViews.topPages.length === 0 ? (
            <p className="text-zinc-600 text-sm">Noch keine Daten.</p>
          ) : (
            <div className="space-y-1">
              {stats.pageViews.topPages.slice(0, 10).map((page) => (
                <button
                  key={page.path}
                  onClick={() => openDetail(page.path)}
                  className="flex items-center justify-between text-sm w-full text-left rounded-lg px-2 py-1.5 hover:bg-white/[0.04] transition-colors"
                >
                  <span className="text-zinc-300 truncate max-w-[55%]">
                    {page.path}
                  </span>
                  <div className="flex items-center gap-4 text-zinc-500">
                    <span>{page.views} Aufrufe</span>
                    <span className="text-zinc-600">
                      Ø {formatTime(page.avgTime)}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Traffic Sources ─────────────────────────────── */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">
            Traffic-Quellen
          </h2>
          {stats.trafficSources.length === 0 ? (
            <p className="text-zinc-600 text-sm">Noch keine Daten.</p>
          ) : (
            <div className="space-y-2">
              {stats.trafficSources.slice(0, 10).map((src) => (
                <div
                  key={src.source}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-zinc-300 truncate max-w-[70%]">
                    {src.source}
                  </span>
                  <span className="text-zinc-500">
                    {src.count.toLocaleString("de-DE")}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Visitor Locations ────────────────────────────── */}
      {stats.visitorLocations && stats.visitorLocations.length > 0 && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Globe className="h-4 w-4 text-[#FFC62C]" />
            Besucher nach Land
          </h2>
          <div className="space-y-2">
            {stats.visitorLocations.map((loc) => {
              const maxCount = stats.visitorLocations[0]?.count ?? 1;
              const pct = Math.round((loc.count / maxCount) * 100);
              return (
                <div key={loc.country} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-zinc-300">{loc.country}</span>
                    <span className="text-zinc-500">
                      {loc.count.toLocaleString("de-DE")} Aufrufe · {loc.uniqueVisitors.toLocaleString("de-DE")} Besucher
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-zinc-800">
                    <div
                      className="h-full rounded-full bg-[#FFC62C]/60"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Detail Panel (IP-Ansicht) ──────────────────── */}
      {detailPath && (
        <div className="rounded-xl border border-[#FFC62C]/20 bg-[#FFC62C]/[0.03] p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <Globe className="h-4 w-4 text-[#FFC62C]" />
              Aufrufe:{" "}
              <span className="text-[#FFC62C] font-mono">
                {detailPath === "all" ? "Alle Seiten" : detailPath}
              </span>
            </h2>
            <button
              onClick={() => setDetailPath(null)}
              className="text-zinc-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {detailLoading ? (
            <p className="text-zinc-500 text-sm">Laden...</p>
          ) : detailViews.length === 0 ? (
            <p className="text-zinc-500 text-sm">Keine Aufrufe gefunden.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    <th className="text-left py-2 px-2 text-zinc-500 font-medium">
                      Zeitpunkt
                    </th>
                    <th className="text-left py-2 px-2 text-zinc-500 font-medium">
                      IP-Adresse
                    </th>
                    <th className="text-left py-2 px-2 text-zinc-500 font-medium">
                      Seite
                    </th>
                    <th className="text-left py-2 px-2 text-zinc-500 font-medium">
                      Quelle
                    </th>
                    <th className="text-left py-2 px-2 text-zinc-500 font-medium">
                      Verweildauer
                    </th>
                    <th className="text-left py-2 px-2 text-zinc-500 font-medium">
                      Besucher
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {detailViews.map((view) => (
                    <tr
                      key={view.id}
                      className={`border-b border-white/[0.03] ${
                        view.isExcluded
                          ? "opacity-40 line-through"
                          : ""
                      }`}
                    >
                      <td className="py-2 px-2 text-zinc-400">
                        {new Date(view.timestamp).toLocaleString("de-DE", {
                          day: "2-digit",
                          month: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="py-2 px-2">
                        <span className="flex items-center gap-1.5">
                          {view.ip ? (
                            <>
                              <span className="font-mono text-white">
                                {view.ip}
                              </span>
                              {view.isExcluded && (
                                <ShieldBan className="h-3 w-3 text-red-400" />
                              )}
                            </>
                          ) : (
                            <span className="text-zinc-600 italic">
                              nicht erfasst
                            </span>
                          )}
                        </span>
                      </td>
                      <td className="py-2 px-2 text-zinc-300 font-mono">
                        {view.path}
                      </td>
                      <td className="py-2 px-2 text-zinc-400">
                        {view.utmSource || view.referrer || "direkt"}
                      </td>
                      <td className="py-2 px-2 text-zinc-400">
                        {view.timeOnPage
                          ? formatTime(view.timeOnPage)
                          : "—"}
                      </td>
                      <td className="py-2 px-2 text-zinc-600 font-mono">
                        {view.visitorId.slice(0, 8)}…
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* IP summary */}
              <div className="mt-4 pt-3 border-t border-white/[0.06]">
                <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-2">
                  IP-Übersicht
                </p>
                <div className="flex flex-wrap gap-2">
                  {(() => {
                    const ipCounts = new Map<string, { count: number; excluded: boolean }>();
                    for (const v of detailViews) {
                      const ip = v.ip || "unbekannt";
                      const entry = ipCounts.get(ip) || { count: 0, excluded: v.isExcluded };
                      entry.count++;
                      ipCounts.set(ip, entry);
                    }
                    return Array.from(ipCounts.entries())
                      .sort((a, b) => b[1].count - a[1].count)
                      .map(([ip, data]) => (
                        <span
                          key={ip}
                          className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-mono ${
                            data.excluded
                              ? "bg-red-500/10 text-red-400 border border-red-500/20 line-through"
                              : ip === "unbekannt"
                                ? "bg-zinc-800 text-zinc-500 border border-zinc-700"
                                : "bg-white/[0.04] text-zinc-300 border border-white/[0.08]"
                          }`}
                        >
                          {data.excluded && <ShieldBan className="h-2.5 w-2.5" />}
                          {ip}
                          <span className="text-zinc-500 ml-1">
                            ×{data.count}
                          </span>
                        </span>
                      ));
                  })()}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Onboarding Funnel ─────────────────────────────── */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
        <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">
          Onboarding-Funnel
        </h2>
        {stats.onboardingFunnel.length === 0 ? (
          <p className="text-zinc-600 text-sm">
            Noch keine Onboarding-Daten. Besucher müssen den Cookie-Banner
            akzeptieren und das Onboarding starten.
          </p>
        ) : (
          <div className="space-y-3">
            {stats.onboardingFunnel.map((step) => {
              const maxEntries = Math.max(
                ...stats.onboardingFunnel.map((s) => s.entries),
                1
              );
              const barWidth = (step.entries / maxEntries) * 100;

              return (
                <div key={step.step} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-zinc-300">
                      <span className="text-zinc-600 mr-2">
                        Frage {step.step}
                      </span>
                      {step.stepName}
                    </span>
                    <div className="flex items-center gap-4 text-xs text-zinc-500">
                      <span>{step.entries} Eintritte</span>
                      <span className="text-zinc-600">
                        Ø {formatTime(step.avgDuration)}
                      </span>
                      <span
                        className={
                          step.dropOff > 0.3
                            ? "text-red-400"
                            : step.dropOff > 0.15
                              ? "text-amber-400"
                              : "text-emerald-400"
                        }
                      >
                        -{formatPercent(step.dropOff)}
                      </span>
                    </div>
                  </div>
                  <div className="h-2 rounded-full bg-zinc-800">
                    <div
                      className="h-2 rounded-full bg-[#FFC62C]/60 transition-all"
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Conversion Rates ──────────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">
            Konversionsrate
          </h2>
          <div className="flex items-center gap-3">
            <TrendingUp className="h-8 w-8 text-[#FFC62C]" />
            <div>
              <p className="text-3xl font-bold text-white">
                {formatPercent(stats.conversions.conversionRate)}
              </p>
              <p className="text-xs text-zinc-500">Besucher → Abschluss</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">
            Call vs. Angebot
          </h2>
          {pathTotal === 0 ? (
            <p className="text-zinc-600 text-sm">Noch keine Daten.</p>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-blue-400" />
                <div className="flex-1">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-zinc-300">
                      Persönlich besprechen
                    </span>
                    <span className="text-zinc-500">
                      {callTotal} ({formatPercent(callTotal / pathTotal)})
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-zinc-800">
                    <div
                      className="h-2 rounded-full bg-blue-400/60"
                      style={{
                        width: `${(callTotal / pathTotal) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-[#FFC62C]" />
                <div className="flex-1">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-zinc-300">Direkt loslegen</span>
                    <span className="text-zinc-500">
                      {angebotTotal} (
                      {formatPercent(angebotTotal / pathTotal)})
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-zinc-800">
                    <div
                      className="h-2 rounded-full bg-[#FFC62C]/60"
                      style={{
                        width: `${(angebotTotal / pathTotal) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Info hint about IP tracking */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-3 text-[10px] text-zinc-600 text-center">
        IP-Adressen werden erst seit dem letzten Update erfasst. Ältere
        Einträge zeigen &quot;nicht erfasst&quot;. Ausgeschlossene IPs werden
        in den Statistiken oben <strong>nicht</strong> mitgezählt.
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Stat Card Component
// ---------------------------------------------------------------------------

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#FFC62C]/10 text-[#FFC62C]">
          {icon}
        </div>
        <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
          {label}
        </span>
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
    </div>
  );
}
