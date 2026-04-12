import { prisma } from "@/lib/db";
import { requireAffiliate } from "@/lib/auth/require-affiliate";
import { redirect } from "next/navigation";
import { Users } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ReferralsPage() {
  let session;
  try {
    session = await requireAffiliate();
  } catch {
    redirect("/login");
  }

  const referrals = await prisma.referral.findMany({
    where: { affiliateId: session.affiliateId },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      source: true,
      firstTouchAt: true,
      convertedAt: true,
      submissionId: true,
      createdAt: true,
    },
  });

  const conversions = referrals.filter((r) => r.convertedAt).length;

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Users className="h-6 w-6 text-[#FFC62C]" />
          Referrals
        </h1>
        <p className="mt-1 text-sm text-zinc-400">
          {referrals.length} Referrals &middot; {conversions} Conversions
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.02]">
        <table className="w-full text-sm">
          <thead className="bg-white/[0.03] text-xs uppercase tracking-wider text-zinc-400">
            <tr>
              <th className="px-4 py-3 text-left">Datum</th>
              <th className="px-4 py-3 text-left">Quelle</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Conversion</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {referrals.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-12 text-center text-zinc-500">
                  Noch keine Referrals
                </td>
              </tr>
            ) : (
              referrals.map((r) => (
                <tr key={r.id} className="hover:bg-white/[0.02]">
                  <td className="px-4 py-3 text-zinc-400 text-xs">
                    {new Date(r.createdAt).toLocaleDateString("de-DE")}
                  </td>
                  <td className="px-4 py-3 text-white text-xs font-mono">
                    {r.source}
                  </td>
                  <td className="px-4 py-3">
                    {r.submissionId ? (
                      <span className="inline-flex rounded-full px-2 py-0.5 text-xs text-emerald-400 bg-emerald-400/10">
                        Anfrage erstellt
                      </span>
                    ) : (
                      <span className="inline-flex rounded-full px-2 py-0.5 text-xs text-zinc-500 bg-zinc-500/10">
                        Besucher
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {r.convertedAt ? (
                      <span className="text-[#FFC62C]">
                        {new Date(r.convertedAt).toLocaleDateString("de-DE")}
                      </span>
                    ) : (
                      <span className="text-zinc-600">&mdash;</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
