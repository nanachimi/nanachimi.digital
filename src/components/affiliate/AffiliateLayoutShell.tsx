"use client";

import { usePathname } from "next/navigation";
import { AffiliateSidebar } from "./AffiliateSidebar";

const AUTH_PATHS = ["/portal/login"];

export function AffiliateLayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = AUTH_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + "/"),
  );

  if (isAuthPage) {
    return <main className="min-h-screen bg-zinc-950">{children}</main>;
  }

  return (
    <div className="flex min-h-screen bg-zinc-950">
      <AffiliateSidebar />
      <main className="flex-1 overflow-y-auto lg:p-0 pt-14 lg:pt-0">
        {children}
      </main>
    </div>
  );
}
