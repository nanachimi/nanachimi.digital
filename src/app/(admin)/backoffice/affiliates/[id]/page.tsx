import Link from "next/link";
import { ArrowLeft, Mail, AtSign, Calendar } from "lucide-react";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/require-admin";
import { redirect, notFound } from "next/navigation";
import { AffiliateEditForm } from "@/components/admin/AffiliateEditForm";

export const dynamic = "force-dynamic";

function formatEur(cents: number): string {
  return (cents / 100).toLocaleString("de-DE", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  });
}

export default async function AffiliateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  try {
    await requireAdmin();
  } catch {
    redirect("/backoffice/login");
  }

  const { id } = await params;

  const affiliate = await prisma.affiliate.findUnique({
    where: { id },
    include: {
      promoCodes: {
        orderBy: { createdAt: "desc" },
        include: { campaign: { select: { name: true, campaignCode: true } } },
      },
      commissions: {
        orderBy: { earnedAt: "desc" },
        take: 50,
        include: {
          payment: { select: { amount: true, paidAt: true } },
        },
      },
      referrals: {
        orderBy: { firstTouchAt: "desc" },
        take: 20,
        include: {
          submission: {
            select: { id: true, name: true, email: true, status: true },
          },
        },
      },
      _count: {
        select: {
          submissionsWon: true,
          referrals: true,
        },
      },
    },
  });

  if (!affiliate) notFound();

  const totalEarned = affiliate.commissions.reduce(
    (sum, c) => (c.status === "void" ? sum : sum + c.amount),
    0,
  );
  const totalPaid = affiliate.commissions.reduce(
    (sum, c) => (c.status === "paid" ? sum + c.amount : sum),
    0,
  );

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <Link
          href="/backoffice/affiliates"
          className="inline-flex items-center gap-1 text-sm text-zinc-400 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Alle Partner
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">{affiliate.name}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-zinc-400">
          <span className="inline-flex items-center gap-1.5">
            <Mail className="h-3.5 w-3.5" />
            {affiliate.email}
          </span>
          <span className="inline-flex items-center gap-1.5 text-[#FFC62C] font-mono">
            <AtSign className="h-3.5 w-3.5" />
            {affiliate.handle}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            Seit {affiliate.createdAt.toLocaleDateString("de-DE")}
          </span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <AffiliateEditForm
            id={affiliate.id}
            initialName={affiliate.name}
            initialEmail={affiliate.email}
            initialCommissionRate={Number(affiliate.commissionRate)}
            initialStatus={affiliate.status}
          />
        </div>

        <div className="lg:col-span-2 space-y-6">
          {/* Metrics */}
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-5">
              <p className="text-xs text-zinc-500 uppercase tracking-wider">
                Verdient (gesamt)
              </p>
              <p className="mt-1 text-xl font-black text-[#FFC62C]">
                {formatEur(totalEarned)}
              </p>
            </div>
            <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-5">
              <p className="text-xs text-zinc-500 uppercase tracking-wider">
                Ausgezahlt
              </p>
              <p className="mt-1 text-xl font-black text-emerald-400">
                {formatEur(totalPaid)}
              </p>
            </div>
            <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-5">
              <p className="text-xs text-zinc-500 uppercase tracking-wider">
                Referrals
              </p>
              <p className="mt-1 text-xl font-black text-white">
                {affiliate._count.referrals}
              </p>
            </div>
          </div>

          {/* Promo codes */}
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] overflow-hidden">
            <div className="p-5 border-b border-white/[0.06]">
              <h2 className="font-semibold text-white">Promo Codes</h2>
            </div>
            {affiliate.promoCodes.length === 0 ? (
              <p className="p-5 text-sm text-zinc-500">Noch keine Codes</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="text-xs uppercase tracking-wider text-zinc-400">
                  <tr>
                    <th className="px-4 py-2 text-left">Code</th>
                    <th className="px-4 py-2 text-left">Kampagne</th>
                    <th className="px-4 py-2 text-right">Rabatt</th>
                    <th className="px-4 py-2 text-right">Einlösungen</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {affiliate.promoCodes.map((p) => (
                    <tr key={p.id}>
                      <td className="px-4 py-2 font-mono text-[#FFC62C]">
                        {p.code}
                      </td>
                      <td className="px-4 py-2 text-zinc-300">
                        {p.campaign.name}
                      </td>
                      <td className="px-4 py-2 text-right text-zinc-300">
                        {Math.round(Number(p.discountPercent) * 100)}%
                      </td>
                      <td className="px-4 py-2 text-right text-zinc-300">
                        {p.usedCount}
                        {p.maxUses ? ` / ${p.maxUses}` : ""}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Recent commissions */}
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] overflow-hidden">
            <div className="p-5 border-b border-white/[0.06]">
              <h2 className="font-semibold text-white">Letzte Kommissionen</h2>
            </div>
            {affiliate.commissions.length === 0 ? (
              <p className="p-5 text-sm text-zinc-500">Noch keine</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="text-xs uppercase tracking-wider text-zinc-400">
                  <tr>
                    <th className="px-4 py-2 text-left">Datum</th>
                    <th className="px-4 py-2 text-right">Betrag</th>
                    <th className="px-4 py-2 text-right">Zahlung</th>
                    <th className="px-4 py-2 text-left">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {affiliate.commissions.map((c) => (
                    <tr key={c.id}>
                      <td className="px-4 py-2 text-zinc-400">
                        {c.earnedAt.toLocaleDateString("de-DE")}
                      </td>
                      <td className="px-4 py-2 text-right font-mono text-[#FFC62C]">
                        {formatEur(c.amount)}
                      </td>
                      <td className="px-4 py-2 text-right font-mono text-xs text-zinc-500">
                        {formatEur(c.payment.amount)}
                      </td>
                      <td className="px-4 py-2 text-xs text-zinc-400">
                        {c.status}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
