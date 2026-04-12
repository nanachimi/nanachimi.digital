import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/require-admin";
import { redirect } from "next/navigation";
import { ApplicationReviewList } from "@/components/admin/ApplicationReviewList";

export const dynamic = "force-dynamic";

export default async function ApplicationsPage() {
  try {
    await requireAdmin();
  } catch {
    redirect("/backoffice/login");
  }

  const applications = await prisma.affiliateApplication.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Partner-Bewerbungen</h1>
        <p className="mt-1 text-sm text-zinc-400">
          {applications.filter((a) => a.status === "pending").length} offen ·{" "}
          {applications.length} gesamt
        </p>
      </div>

      <ApplicationReviewList
        applications={applications.map((a) => ({
          id: a.id,
          email: a.email,
          name: a.name,
          handle: a.handle,
          audience: a.audience,
          motivation: a.motivation,
          status: a.status,
          createdAt: a.createdAt.toISOString(),
          reviewedAt: a.reviewedAt?.toISOString() ?? null,
          notes: a.notes ?? null,
          affiliateId: a.affiliateId ?? null,
        }))}
      />
    </div>
  );
}
