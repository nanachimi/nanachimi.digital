"use client";

import { useEffect, useState, useCallback } from "react";
import {
  RefreshCw,
  Inbox,
  Coins,
  CreditCard,
  FileText,
  Users,
  PercentCircle,
  ShieldCheck,
  BarChart3,
  Calendar,
  AlertTriangle,
  Cpu,
  Globe,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { KpiCard } from "@/components/admin/dashboard/KpiCard";
import { SparklineChart } from "@/components/admin/dashboard/SparklineChart";
import { MiniBarChart } from "@/components/admin/dashboard/MiniBarChart";
import { SlaDonut } from "@/components/admin/dashboard/SlaDonut";
import { FunnelChart } from "@/components/admin/dashboard/FunnelChart";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DashboardData {
  pipeline: { totalValue: number; count: number };
  revenue: {
    last30Days: number;
    previous30Days: number;
    dailyBreakdown: { date: string; value: number }[];
  };
  pendingPayments: { totalValue: number; count: number };
  openOffers: { totalValue: number; count: number };
  newLeads: {
    last7Days: number;
    previous7Days: number;
    dailyBreakdown: { date: string; value: number }[];
  };
  conversion: { rate: number };
  slaHealth: { active: number; breached: number };
  avgProjectValue: { last90Days: number; previous90Days: number };
  bookings: {
    next7Days: number;
    upcoming: { date: string; startTime: string; name: string }[];
  };
  incidents: {
    open: number;
    critical: number;
    warning: number;
    info: number;
  };
  jobQueue: { failed: number; pending: number };
  traffic: {
    uniqueVisitors7d: number;
    previousUniqueVisitors7d: number;
    dailyVisitors: { date: string; value: number }[];
  };
  funnel: {
    steps: {
      stepName: string;
      entries: number;
      completions: number;
      dropOff: number;
    }[];
    overallCompletionRate: number;
  };
  topSources: { source: string; count: number }[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatEur(n: number) {
  return n.toLocaleString("de-DE") + " €";
}

function trendInfo(current: number, previous: number) {
  if (previous === 0 && current === 0) return { direction: "neutral" as const, label: "—" };
  if (previous === 0) return { direction: "up" as const, label: "Neu" };
  const pct = Math.round(((current - previous) / previous) * 100);
  if (pct > 0) return { direction: "up" as const, label: `+${pct}%` };
  if (pct < 0) return { direction: "down" as const, label: `${pct}%` };
  return { direction: "neutral" as const, label: "0%" };
}

function formatBookingDate(dateStr: string) {
  const d = new Date(dateStr + "T12:00:00");
  const dayNames = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];
  return `${dayNames[d.getDay()]} ${d.getDate().toString().padStart(2, "0")}.${(d.getMonth() + 1).toString().padStart(2, "0")}.`;
}

// ---------------------------------------------------------------------------
// Dashboard Page
// ---------------------------------------------------------------------------

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setError(false);
      const res = await fetch("/api/admin/dashboard");
      if (!res.ok) throw new Error("fetch failed");
      setData(await res.json());
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30_000);
    return () => clearInterval(interval);
  }, [fetchData]);

  if (loading) {
    return (
      <section className="min-h-screen bg-[#111318]">
        <div className="flex items-center justify-center h-[60vh]">
          <RefreshCw className="h-8 w-8 text-[#8B8F97] animate-spin" />
        </div>
      </section>
    );
  }

  if (error || !data) {
    return (
      <section className="min-h-screen bg-[#111318]">
        <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
          <AlertTriangle className="h-10 w-10 text-red-400" />
          <p className="text-[#8B8F97]">Dashboard konnte nicht geladen werden.</p>
          <Button
            onClick={fetchData}
            variant="ghost"
            className="border border-white/20 text-white/80 hover:text-white hover:bg-white/10 rounded-xl"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Erneut versuchen
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-screen bg-[#111318]">
      <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white md:text-3xl">
              Dashboard
            </h1>
            <p className="mt-1 text-sm text-[#8B8F97]">
              Geschäftsübersicht auf einen Blick
            </p>
          </div>
          <Button
            onClick={() => { setLoading(true); fetchData(); }}
            variant="ghost"
            className="border border-white/20 text-white/80 hover:text-white hover:bg-white/10 rounded-xl"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Aktualisieren
          </Button>
        </div>

        {/* ── Group A: Pipeline & Umsatz ──────────────────────────── */}
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-3">
            Pipeline & Umsatz
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard
              icon={Inbox}
              label="Offene Pipeline"
              value={formatEur(data.pipeline.totalValue)}
              subtitle={`${data.pipeline.count} Anfragen`}
              href="/backoffice/anfragen?filter=pipeline"
            />
            <KpiCard
              icon={Coins}
              label="Umsatz (30 Tage)"
              value={formatEur(data.revenue.last30Days)}
              trend={trendInfo(data.revenue.last30Days, data.revenue.previous30Days)}
            >
              <SparklineChart data={data.revenue.dailyBreakdown} />
            </KpiCard>
            <KpiCard
              icon={CreditCard}
              label="Ausstehende Zahlungen"
              value={formatEur(data.pendingPayments.totalValue)}
              subtitle={`${data.pendingPayments.count} offen`}
            />
            <KpiCard
              icon={FileText}
              label="Offene Angebote"
              value={formatEur(data.openOffers.totalValue)}
              subtitle={`${data.openOffers.count} gesendet`}
              href="/backoffice/anfragen?filter=angebot_sent"
            />
          </div>
        </div>

        {/* ── Group B: Anfragen & Konversion ──────────────────────── */}
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-3">
            Anfragen & Konversion
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard
              icon={Users}
              label="Neue Anfragen"
              value={data.newLeads.last7Days}
              subtitle="letzte 7 Tage"
              trend={trendInfo(data.newLeads.last7Days, data.newLeads.previous7Days)}
              href="/backoffice/anfragen?filter=pending"
            >
              <MiniBarChart data={data.newLeads.dailyBreakdown} />
            </KpiCard>
            <KpiCard
              icon={PercentCircle}
              label="Konversionsrate"
              value={`${data.conversion.rate}%`}
              subtitle="Angenommen / Gesamt"
              href="/backoffice/anfragen?filter=accepted"
            />
            <KpiCard
              icon={ShieldCheck}
              label="SLA-Gesundheit"
              value={`${data.slaHealth.active + data.slaHealth.breached} aktiv`}
              href="/backoffice/anfragen?filter=sla_breached"
            >
              <SlaDonut
                active={data.slaHealth.active}
                breached={data.slaHealth.breached}
              />
            </KpiCard>
            <KpiCard
              icon={BarChart3}
              label="Ø Projektwert"
              value={formatEur(data.avgProjectValue.last90Days)}
              subtitle="letzte 90 Tage"
              trend={trendInfo(
                data.avgProjectValue.last90Days,
                data.avgProjectValue.previous90Days
              )}
              href="/backoffice/anfragen?filter=accepted"
            />
          </div>
        </div>

        {/* ── Group C: Betrieb ────────────────────────────────────── */}
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-3">
            Betrieb
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <KpiCard
              icon={Calendar}
              label="Termine"
              value={data.bookings.next7Days}
              subtitle="nächste 7 Tage"
              href="/backoffice/bookings"
            >
              {data.bookings.upcoming.length > 0 && (
                <div className="space-y-1.5">
                  {data.bookings.upcoming.map((b, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 text-xs text-zinc-400"
                    >
                      <span className="text-[#FFC62C] font-medium w-12 shrink-0">
                        {formatBookingDate(b.date)}
                      </span>
                      <span className="text-zinc-600">·</span>
                      <span className="text-zinc-300 font-medium">{b.startTime}</span>
                      <span className="truncate">{b.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </KpiCard>
            <KpiCard
              icon={AlertTriangle}
              label="Offene Vorfälle"
              value={data.incidents.open}
              href="/backoffice/incidents?tab=incidents&filter=open"
            >
              <div className="flex items-center gap-4 text-xs">
                {data.incidents.critical > 0 && (
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-red-400" />
                    <span className="text-zinc-400">
                      Kritisch: <span className="text-white font-medium">{data.incidents.critical}</span>
                    </span>
                  </span>
                )}
                {data.incidents.warning > 0 && (
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-yellow-400" />
                    <span className="text-zinc-400">
                      Warnung: <span className="text-white font-medium">{data.incidents.warning}</span>
                    </span>
                  </span>
                )}
                {data.incidents.info > 0 && (
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-blue-400" />
                    <span className="text-zinc-400">
                      Info: <span className="text-white font-medium">{data.incidents.info}</span>
                    </span>
                  </span>
                )}
                {data.incidents.open === 0 && (
                  <span className="text-emerald-400">Alles in Ordnung</span>
                )}
              </div>
            </KpiCard>
            <KpiCard
              icon={Cpu}
              label="Job Queue"
              value={data.jobQueue.failed + data.jobQueue.pending}
              subtitle="ausstehend"
              href="/backoffice/incidents?tab=jobs&filter=failed"
            >
              <div className="flex items-center gap-4 text-xs">
                {data.jobQueue.failed > 0 && (
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-red-400" />
                    <span className="text-zinc-400">
                      Fehlgeschlagen: <span className="text-red-400 font-medium">{data.jobQueue.failed}</span>
                    </span>
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-yellow-400" />
                  <span className="text-zinc-400">
                    Wartend: <span className="text-white font-medium">{data.jobQueue.pending}</span>
                  </span>
                </span>
              </div>
            </KpiCard>
          </div>
        </div>

        {/* ── Group D: Traffic & Funnel ───────────────────────────── */}
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-3">
            Traffic & Funnel
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <KpiCard
              icon={Globe}
              label="Besucher (7 Tage)"
              value={data.traffic.uniqueVisitors7d}
              subtitle="eindeutige Besucher"
              trend={trendInfo(
                data.traffic.uniqueVisitors7d,
                data.traffic.previousUniqueVisitors7d
              )}
              className="lg:col-span-1"
              href="/backoffice/analytics"
            >
              <SparklineChart
                data={data.traffic.dailyVisitors}
                height={60}
                color="#FFC62C"
              />
              {data.topSources.length > 0 && (
                <div className="mt-3 pt-3 border-t border-white/[0.06]">
                  <p className="text-[10px] uppercase tracking-wider text-zinc-600 mb-2">
                    Top-Quellen
                  </p>
                  <div className="space-y-1">
                    {data.topSources.map((s, i) => (
                      <div key={i} className="flex items-center justify-between text-xs">
                        <span className="text-zinc-400 truncate">{s.source}</span>
                        <span className="text-white font-medium ml-2">{s.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </KpiCard>
            <KpiCard
              icon={Filter}
              label="Onboarding-Funnel"
              value={`${data.funnel.overallCompletionRate}%`}
              subtitle="Abschlussrate"
              className="lg:col-span-1"
              href="/backoffice/analytics"
            >
              <FunnelChart steps={data.funnel.steps} />
            </KpiCard>
          </div>
        </div>
      </div>
    </section>
  );
}
