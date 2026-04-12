import { prisma } from "@/lib/db";
import { requireAffiliate } from "@/lib/auth/require-affiliate";
import { redirect } from "next/navigation";
import { Link2, Users, Coins, TrendingUp } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AffiliateDashboardPage() {
  let session;
  try {
    session = await requireAffiliate();
  } catch {
    redirect("/login");
  }

  const [affiliate, referralCount, commissionStats] = await Promise.all([
    prisma.affiliate.findUnique({
      where: { id: session.affiliateId },
      select: { name: true, handle: true, commissionRate: true },
    }),
    prisma.referral.count({ where: { affiliateId: session.affiliateId } }),
    prisma.commission.groupBy({
      by: ["status"],
      where: { affiliateId: session.affiliateId },
      _sum: { amount: true },
      _count: true,
    }),
  ]);

  const conversions = await prisma.referral.count({
    where: { affiliateId: session.affiliateId, convertedAt: { not: null } },
  });

  const pending = commissionStats.find((s) => s.status === "pending");
  const approved = commissionStats.find((s) => s.status === "approved");
  const paid = commissionStats.find((s) => s.status === "paid");
  const totalEarned =
    (pending?._sum.amount ?? 0) +
    (approved?._sum.amount ?? 0) +
    (paid?._sum.amount ?? 0);

  const formatEur = (cents: number) =>
    new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency: "EUR",
    }).format(cents / 100);

  const referralLink = `nanachimi.digital/@${affiliate?.handle ?? session.handle}`;

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">
          Willkommen, {affiliate?.name?.split(" ")[0] ?? "Partner"}
        </h1>
        <p className="mt-1 text-sm text-zinc-400">
          Ihr Partner-Dashboard
        </p>
      </div>

      {/* Referral link card */}
      <div className="mb-8 rounded-2xl border border-[#FFC62C]/20 bg-[#FFC62C]/[0.04] p-5">
        <div className="flex items-center gap-2 mb-2">
          <Link2 className="h-4 w-4 text-[#FFC62C]" />
          <p className="text-xs text-zinc-400 uppercase tracking-wider">
            Ihr Empfehlungslink
          </p>
        </div>
        <p className="text-lg font-mono text-[#FFC62C] break-all">
          {referralLink}
        </p>
        <p className="mt-2 text-xs text-zinc-500">
          Kommission: {Math.round(Number(affiliate?.commissionRate ?? 0) * 100)}%
          &middot; Zuordnung: 2 Jahre
        </p>
      </div>

      {/* KPI cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-5">
          <div className="flex items-center gap-2 mb-1">
            <Users className="h-4 w-4 text-zinc-500" />
            <p className="text-xs text-zinc-500 uppercase tracking-wider">Referrals</p>
          </div>
          <p className="text-2xl font-black text-white">{referralCount}</p>
          <p className="text-xs text-zinc-500 mt-1">{conversions} Conversions</p>
        </div>

        <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-5">
          <div className="flex items-center gap-2 mb-1">
            <Coins className="h-4 w-4 text-zinc-500" />
            <p className="text-xs text-zinc-500 uppercase tracking-wider">Ausstehend</p>
          </div>
          <p className="text-2xl font-black text-[#FFC62C]">
            {formatEur(pending?._sum.amount ?? 0)}
          </p>
          <p className="text-xs text-zinc-500 mt-1">
            {pending?._count ?? 0} Kommissionen
          </p>
        </div>

        <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-5">
          <div className="flex items-center gap-2 mb-1">
            <Coins className="h-4 w-4 text-zinc-500" />
            <p className="text-xs text-zinc-500 uppercase tracking-wider">Freigegeben</p>
          </div>
          <p className="text-2xl font-black text-emerald-400">
            {formatEur(approved?._sum.amount ?? 0)}
          </p>
          <p className="text-xs text-zinc-500 mt-1">
            {approved?._count ?? 0} Kommissionen
          </p>
        </div>

        <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-5">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="h-4 w-4 text-zinc-500" />
            <p className="text-xs text-zinc-500 uppercase tracking-wider">Gesamt verdient</p>
          </div>
          <p className="text-2xl font-black text-white">
            {formatEur(totalEarned)}
          </p>
          <p className="text-xs text-zinc-500 mt-1">
            {formatEur(paid?._sum.amount ?? 0)} ausgezahlt
          </p>
        </div>
      </div>
    </div>
  );
}
