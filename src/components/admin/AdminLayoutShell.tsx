"use client";

import { usePathname } from "next/navigation";
import { AdminSidebar } from "./AdminSidebar";

const AUTH_PATHS = ["/backoffice/login", "/backoffice/setup-2fa"];

export function AdminLayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = AUTH_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );

  if (isAuthPage) {
    return <main className="min-h-screen bg-zinc-950">{children}</main>;
  }

  return (
    <div className="flex min-h-screen bg-zinc-950">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto lg:p-0 pt-14 lg:pt-0">
        {children}
      </main>
    </div>
  );
}
