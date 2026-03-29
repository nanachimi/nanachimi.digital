"use client";

import { useEffect, useState } from "react";
import {
  Eye,
  Users,
  Clock,
  MousePointerClick,
  TrendingUp,
  Phone,
  Mail,
} from "lucide-react";

interface Stats {
  pageViews: {
    total: number;
    uniqueVisitors: number;
    avgTimeOnPage: number;
    topPages: { path: string; views: number; avgTime: number }[];
  };
  trafficSources: { source: string; count: number }[];
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

  useEffect(() => {
    fetch("/api/admin/analytics")
      .then((r) => r.json())
      .then((d) => {
        setStats(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-white mb-8">Analytics</h1>
        <div className="text-zinc-500">Laden...</div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-white mb-8">Analytics</h1>
        <div className="text-zinc-500">Fehler beim Laden der Daten.</div>
      </div>
    );
  }

  const callTotal = stats.conversions.callVsAngebot.call;
  const angebotTotal = stats.conversions.callVsAngebot.angebot;
  const pathTotal = callTotal + angebotTotal;

  return (
    <div className="p-8 space-y-8">
      <h1 className="text-2xl font-bold text-white">Analytics</h1>

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
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">
            Top Seiten
          </h2>
          {stats.pageViews.topPages.length === 0 ? (
            <p className="text-zinc-600 text-sm">Noch keine Daten.</p>
          ) : (
            <div className="space-y-2">
              {stats.pageViews.topPages.slice(0, 10).map((page) => (
                <div
                  key={page.path}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-zinc-300 truncate max-w-[60%]">
                    {page.path}
                  </span>
                  <div className="flex items-center gap-4 text-zinc-500">
                    <span>{page.views} Aufrufe</span>
                    <span className="text-zinc-600">
                      Ø {formatTime(page.avgTime)}
                    </span>
                  </div>
                </div>
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
              <p className="text-xs text-zinc-500">
                Besucher → Abschluss
              </p>
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
                    <span className="text-zinc-300">Persönlich besprechen</span>
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
                      {angebotTotal} ({formatPercent(angebotTotal / pathTotal)})
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
