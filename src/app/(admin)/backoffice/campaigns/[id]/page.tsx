import Link from "next/link";
import { ArrowLeft, Tag, User } from "lucide-react";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/require-admin";
import { redirect, notFound } from "next/navigation";
import { CampaignToggle } from "@/components/admin/CampaignToggle";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CampaignDetailPage({ params }: PageProps) {
  try {
    await requireAdmin();
  } catch {
    redirect("/backoffice/login");
  }

  const { id } = await params;

  const campaign = await prisma.campaign.findUnique({
    where: { id },
    include: {
      promoCodes: {
        orderBy: { createdAt: "desc" },
        include: {
          affiliate: {
            select: { id: true, name: true, handle: true, email: true },
          },
          _count: { select: { submissions: true } },
        },
      },
    },
  });

  if (!campaign) {
    notFound();
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <Link
          href="/backoffice/campaigns"
          className="inline-flex items-center gap-1 text-sm text-zinc-400 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Alle Kampagnen
        </Link>
      </div>

      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{campaign.name}</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Erstellt am{" "}
            {campaign.createdAt.toLocaleDateString("de-DE", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
          </p>
        </div>
        <CampaignToggle id={campaign.id} initialActive={campaign.active} />
      </div>

      {/* Metrics */}
      <div className="grid gap-4 md:grid-cols-4 mb-8">
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-5">
          <p className="text-xs text-zinc-500 uppercase tracking-wider">
            Rabatt
          </p>
          <p className="mt-1 text-2xl font-black text-[#FFC62C]">
            {Math.round(Number(campaign.discountPercent) * 100)}%
          </p>
        </div>
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-5">
          <p className="text-xs text-zinc-500 uppercase tracking-wider">
            Campaign Code
          </p>
          <p className="mt-1 text-lg font-mono text-white">
            {campaign.campaignCode}
          </p>
        </div>
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-5">
          <p className="text-xs text-zinc-500 uppercase tracking-wider">
            Admin Code
          </p>
          <p className="mt-1 text-lg font-mono text-[#FFC62C]">
            {campaign.campaignCode.toLowerCase()}
          </p>
        </div>
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-5">
          <p className="text-xs text-zinc-500 uppercase tracking-wider">
            Generierte Codes
          </p>
          <p className="mt-1 text-2xl font-black text-white">
            {campaign.promoCodes.length}
          </p>
        </div>
      </div>

      {campaign.description && (
        <div className="mb-8 rounded-xl border border-white/[0.08] bg-white/[0.02] p-5">
          <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">
            Beschreibung
          </p>
          <p className="text-sm text-zinc-300 whitespace-pre-wrap">
            {campaign.description}
          </p>
        </div>
      )}

      {/* Promo codes table */}
      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] overflow-hidden">
        <div className="p-5 border-b border-white/[0.06]">
          <h2 className="font-semibold text-white flex items-center gap-2">
            <Tag className="h-4 w-4 text-[#FFC62C]" />
            Promo Codes ({campaign.promoCodes.length})
          </h2>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-white/[0.03] text-xs uppercase tracking-wider text-zinc-400">
            <tr>
              <th className="px-4 py-3 text-left">Code</th>
              <th className="px-4 py-3 text-left">Partner</th>
              <th className="px-4 py-3 text-center">Verwendungen</th>
              <th className="px-4 py-3 text-center">Max</th>
              <th className="px-4 py-3 text-left">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {campaign.promoCodes.map((p) => (
              <tr key={p.id} className="hover:bg-white/[0.02]">
                <td className="px-4 py-3 font-mono text-[#FFC62C]">{p.code}</td>
                <td className="px-4 py-3">
                  {p.affiliate ? (
                    <Link
                      href={`/backoffice/affiliates/${p.affiliate.id}`}
                      className="inline-flex items-center gap-1 text-white hover:text-[#FFC62C]"
                    >
                      <User className="h-3 w-3" />
                      {p.affiliate.name}
                      <span className="text-xs text-zinc-500">
                        @{p.affiliate.handle}
                      </span>
                    </Link>
                  ) : (
                    <span className="text-zinc-500">Admin</span>
                  )}
                </td>
                <td className="px-4 py-3 text-center text-zinc-300">
                  {p.usedCount}
                </td>
                <td className="px-4 py-3 text-center text-zinc-500">
                  {p.maxUses ?? "∞"}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs ${
                      p.active
                        ? "bg-emerald-400/10 text-emerald-400"
                        : "bg-zinc-500/10 text-zinc-500"
                    }`}
                  >
                    {p.active ? "Aktiv" : "Inaktiv"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
