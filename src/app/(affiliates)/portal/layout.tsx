import { AffiliateLayoutShell } from "@/components/affiliate/AffiliateLayoutShell";

export default function AffiliateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AffiliateLayoutShell>{children}</AffiliateLayoutShell>;
}
