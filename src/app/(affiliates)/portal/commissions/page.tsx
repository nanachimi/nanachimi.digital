import { prisma } from "@/lib/db";
import { requireAffiliate } from "@/lib/auth/require-affiliate";
import { redirect } from "next/navigation";
import { Coins } from "lucide-react";

export const dynamic = "force-dynamic";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: "Ausstehend", color: "text-yellow-400 bg-yellow-400/10" },
  approved: { label: "Freigegeben", color: "text-emerald-400 bg-emerald-400/10" },
  paid: { label: "Ausgezahlt", color: "text-sky-400 bg-sky-400/10" },
  void: { label: "Storniert", color: "text-zinc-500 bg-zinc-500/10" },
};

function formatEur(cents: number): string {
  return (cents / 100).toLocaleString("de-DE", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  });
}

export default async function CommissionsPage() {
  let session;
  try {
    session = await requireAffiliate();
  } catch {
    redirect("/login");
  }

  const [commissions, totals] = await Promise.all([
    prisma.commission.findMany({
      where: { affiliateId: session.affiliateId },
      orderBy: { earnedAt: "desc" },
      take: 100,
      select: {
        id: true,
        amount: true,
        rateSnapshot: true,
        status: true,
        earnedAt: true,
        approvedAt: true,
        commissionExpiresAt: true,
      },
    }),
    prisma.commission.groupBy({
      by: ["status"],
      where: { affiliateId: session.affiliateId },
      _sum: { amount: true },
      _count: true,
    }),
  ]);

  const totalsByStatus = Object.fromEntries(
    totals.map((t) => [t.status, { count: t._count, sum: t._sum.amount ?? 0 }]),
  );

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Coins className="h-6 w-6 text-[#FFC62C]" />
          Kommissionen
        </h1>
      </div>

      {/* Summary tiles */}
      <div className="grid gap-4 md:grid-cols-4 mb-8">
        {(["pending", "approved", "paid", "void"] as const).map((s) => {
          const data = totalsByStatus[s] ?? { count: 0, sum: 0 };
          const cfg = STATUS_LABELS[s];
          return (
            <div
              key={s}
              className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-5"
            >
              <p className="text-xs text-zinc-500 uppercase tracking-wider">
                {cfg.label}
              </p>
              <p className="mt-1 text-2xl font-black text-white">
                {formatEur(data.sum)}
              </p>
              <p className="text-xs text-zinc-500">{data.count} Einträge</p>
            </div>
          );
        })}
      </div>

      {/* Commissions table */}
      <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.02]">
        <table className="w-full text-sm">
          <thead className="bg-white/[0.03] text-xs uppercase tracking-wider text-zinc-400">
            <tr>
              <th className="px-4 py-3 text-right">Betrag</th>
              <th className="px-4 py-3 text-right">Rate</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Verdient am</th>
              <th className="px-4 py-3 text-left">Freigegeben</th>
              <th className="px-4 py-3 text-left">Läuft ab</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {commissions.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-zinc-500">
                  Noch keine Kommissionen
                </td>
              </tr>
            ) : (
              commissions.map((c) => {
                const statusCfg =
                  STATUS_LABELS[c.status] ?? {
                    label: c.status,
                    color: "text-zinc-400 bg-zinc-400/10",
                  };
                return (
                  <tr key={c.id} className="hover:bg-white/[0.02]">
                    <td className="px-4 py-3 text-right font-mono font-semibold text-[#FFC62C]">
                      {formatEur(c.amount)}
                    </td>
                    <td className="px-4 py-3 text-right text-zinc-400 text-xs">
                      {Math.round(Number(c.rateSnapshot) * 100)}%
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs ${statusCfg.color}`}
                      >
                        {statusCfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-zinc-400 text-xs">
                      {c.earnedAt.toLocaleDateString("de-DE")}
                    </td>
                    <td className="px-4 py-3 text-zinc-400 text-xs">
                      {c.approvedAt
                        ? new Date(c.approvedAt).toLocaleDateString("de-DE")
                        : "\u2014"}
                    </td>
                    <td className="px-4 py-3 text-zinc-500 text-xs">
                      {c.commissionExpiresAt.toLocaleDateString("de-DE")}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
