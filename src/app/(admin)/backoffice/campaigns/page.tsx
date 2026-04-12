import Link from "next/link";
import { Megaphone, Plus } from "lucide-react";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/require-admin";
import { redirect } from "next/navigation";
import { CreateCampaignButton } from "@/components/admin/CreateCampaignButton";

export const dynamic = "force-dynamic";

export default async function CampaignsListPage() {
  try {
    await requireAdmin();
  } catch {
    redirect("/backoffice/login");
  }

  const campaigns = await prisma.campaign.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { promoCodes: true } } },
  });

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Megaphone className="h-6 w-6 text-[#FFC62C]" />
            Kampagnen
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            {campaigns.length} Kampagnen · {campaigns.filter((c) => c.active).length}{" "}
            aktiv
          </p>
        </div>
        <CreateCampaignButton />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {campaigns.length === 0 ? (
          <div className="col-span-full rounded-2xl border border-white/[0.08] bg-white/[0.02] p-12 text-center text-zinc-500">
            Noch keine Kampagnen. Erstellen Sie Ihre erste Kampagne oben.
          </div>
        ) : (
          campaigns.map((c) => (
            <Link
              key={c.id}
              href={`/backoffice/campaigns/${c.id}`}
              className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 hover:border-[#FFC62C]/30 hover:bg-white/[0.04] transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-white">{c.name}</h3>
                  <p className="text-xs font-mono text-[#FFC62C] mt-0.5">
                    {c.campaignCode}
                  </p>
                </div>
                <span
                  className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                    c.active
                      ? "bg-emerald-400/10 text-emerald-400"
                      : "bg-zinc-500/10 text-zinc-500"
                  }`}
                >
                  {c.active ? "Aktiv" : "Inaktiv"}
                </span>
              </div>

              <div className="flex items-baseline gap-2 mb-3">
                <span className="text-3xl font-black text-[#FFC62C]">
                  {Math.round(Number(c.discountPercent) * 100)}%
                </span>
                <span className="text-xs text-zinc-500">Rabatt</span>
              </div>

              {c.description && (
                <p className="text-xs text-zinc-400 mb-3 line-clamp-2">
                  {c.description}
                </p>
              )}

              <div className="flex items-center justify-between text-xs text-zinc-500 pt-3 border-t border-white/[0.06]">
                <span>{c._count.promoCodes} Codes</span>
                {c.validUntil && (
                  <span>
                    Bis {new Date(c.validUntil).toLocaleDateString("de-DE")}
                  </span>
                )}
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
