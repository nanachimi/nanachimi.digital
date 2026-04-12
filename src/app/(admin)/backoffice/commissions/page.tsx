import Link from "next/link";
import { Coins } from "lucide-react";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/require-admin";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: "Warten (Rücktritt)", color: "text-yellow-400 bg-yellow-400/10" },
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

export default async function CommissionsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  try {
    await requireAdmin();
  } catch {
    redirect("/backoffice/login");
  }

  const sp = await searchParams;
  const status = sp.status;

  const [commissions, totals] = await Promise.all([
    prisma.commission.findMany({
      where: status ? { status } : {},
      orderBy: { earnedAt: "desc" },
      take: 200,
      include: {
        affiliate: {
          select: { id: true, name: true, handle: true },
        },
        payment: {
          select: { id: true, angebotId: true, amount: true, paidAt: true },
        },
      },
    }),
    prisma.commission.groupBy({
      by: ["status"],
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
          return (
            <Link
              key={s}
              href={`/backoffice/commissions?status=${s}`}
              className={`rounded-xl border p-5 transition-colors ${
                status === s
                  ? "border-[#FFC62C]/40 bg-[#FFC62C]/[0.06]"
                  : "border-white/[0.08] bg-white/[0.02] hover:border-white/[0.15]"
              }`}
            >
              <p className="text-xs text-zinc-500 uppercase tracking-wider">
                {STATUS_LABELS[s].label}
              </p>
              <p className="mt-1 text-2xl font-black text-white">
                {formatEur(data.sum)}
              </p>
              <p className="text-xs text-zinc-500">{data.count} Einträge</p>
            </Link>
          );
        })}
      </div>

      {status && (
        <div className="mb-4">
          <Link
            href="/backoffice/commissions"
            className="text-xs text-zinc-400 hover:text-white"
          >
            ← Alle anzeigen
          </Link>
        </div>
      )}

      {/* Commissions table */}
      <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.02]">
        <table className="w-full text-sm">
          <thead className="bg-white/[0.03] text-xs uppercase tracking-wider text-zinc-400">
            <tr>
              <th className="px-4 py-3 text-left">Partner</th>
              <th className="px-4 py-3 text-right">Betrag</th>
              <th className="px-4 py-3 text-right">Zahlung</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Verdient am</th>
              <th className="px-4 py-3 text-left">Läuft ab</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {commissions.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-zinc-500">
                  Keine Kommissionen
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
                    <td className="px-4 py-3">
                      <Link
                        href={`/backoffice/affiliates/${c.affiliate.id}`}
                        className="text-white hover:text-[#FFC62C]"
                      >
                        {c.affiliate.name}
                      </Link>
                      <p className="text-xs text-zinc-500">
                        @{c.affiliate.handle}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-semibold text-[#FFC62C]">
                      {formatEur(c.amount)}
                    </td>
                    <td className="px-4 py-3 text-right text-zinc-400 font-mono text-xs">
                      {formatEur(c.payment.amount)}
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
