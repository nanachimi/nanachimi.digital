import Link from "next/link";
import { Users, CheckCircle2, Clock, Ban } from "lucide-react";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/require-admin";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  active: { label: "Aktiv", color: "text-emerald-400 bg-emerald-400/10" },
  pending: { label: "Wartend", color: "text-yellow-400 bg-yellow-400/10" },
  suspended: { label: "Gesperrt", color: "text-red-400 bg-red-400/10" },
};

export default async function AffiliatesListPage() {
  try {
    await requireAdmin();
  } catch {
    redirect("/backoffice/login");
  }

  const [affiliates, pendingApplications] = await Promise.all([
    prisma.affiliate.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: {
            promoCodes: true,
            referrals: true,
            commissions: true,
          },
        },
      },
    }),
    prisma.affiliateApplication.count({ where: { status: "pending" } }),
  ]);

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Users className="h-6 w-6 text-[#FFC62C]" />
            Partner
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            {affiliates.length} Partner · {pendingApplications} offene Bewerbungen
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/backoffice/affiliates/applications"
            className="rounded-lg border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-white hover:bg-white/[0.06]"
          >
            Bewerbungen
            {pendingApplications > 0 && (
              <span className="ml-2 inline-flex items-center rounded-full bg-yellow-400/10 px-2 py-0.5 text-xs text-yellow-400">
                {pendingApplications}
              </span>
            )}
          </Link>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.02]">
        <table className="w-full text-sm">
          <thead className="bg-white/[0.03] text-xs uppercase tracking-wider text-zinc-400">
            <tr>
              <th className="px-4 py-3 text-left">Name</th>
              <th className="px-4 py-3 text-left">Handle</th>
              <th className="px-4 py-3 text-left">Kommission</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-center">Codes</th>
              <th className="px-4 py-3 text-center">Referrals</th>
              <th className="px-4 py-3 text-center">Kommissionen</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {affiliates.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-zinc-500">
                  Noch keine Partner
                </td>
              </tr>
            ) : (
              affiliates.map((a) => {
                const statusCfg =
                  STATUS_LABELS[a.status] ?? {
                    label: a.status,
                    color: "text-zinc-400 bg-zinc-400/10",
                  };
                return (
                  <tr key={a.id} className="hover:bg-white/[0.02]">
                    <td className="px-4 py-3">
                      <Link
                        href={`/backoffice/affiliates/${a.id}`}
                        className="text-white hover:text-[#FFC62C]"
                      >
                        {a.name}
                      </Link>
                      <p className="text-xs text-zinc-500">{a.email}</p>
                    </td>
                    <td className="px-4 py-3 font-mono text-[#FFC62C]">
                      @{a.handle}
                    </td>
                    <td className="px-4 py-3 text-white">
                      {(Number(a.commissionRate) * 100).toFixed(1)}%
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${statusCfg.color}`}
                      >
                        {a.status === "active" && <CheckCircle2 className="h-3 w-3" />}
                        {a.status === "pending" && <Clock className="h-3 w-3" />}
                        {a.status === "suspended" && <Ban className="h-3 w-3" />}
                        {statusCfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-zinc-300">
                      {a._count.promoCodes}
                    </td>
                    <td className="px-4 py-3 text-center text-zinc-300">
                      {a._count.referrals}
                    </td>
                    <td className="px-4 py-3 text-center text-zinc-300">
                      {a._count.commissions}
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
