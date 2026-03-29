"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  FlaskConical,
  BarChart3,
  Calendar,
  Settings,
  Activity,
  AlertTriangle,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { LogoIcon } from "@/components/layout/LogoIcon";

// ---------------------------------------------------------------------------
// Navigation items
// ---------------------------------------------------------------------------

const NAV_ITEMS = [
  {
    label: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    label: "A/B Tests",
    href: "/admin/ab-tests",
    icon: FlaskConical,
    exact: false,
  },
  {
    label: "Analytics",
    href: "/admin/analytics",
    icon: BarChart3,
    exact: false,
  },
  {
    label: "Termine",
    href: "/admin/bookings",
    icon: Calendar,
    exact: false,
  },
  {
    label: "Vorfälle",
    href: "/admin/incidents",
    icon: AlertTriangle,
    exact: false,
  },
  {
    label: "Einstellungen",
    href: "/admin/settings",
    icon: Settings,
    exact: false,
  },
  {
    label: "Systemstatus",
    href: "/admin/status",
    icon: Activity,
    exact: false,
  },
];

const LS_KEY = "ncd-admin-sidebar-collapsed";

// ---------------------------------------------------------------------------
// Sidebar Component
// ---------------------------------------------------------------------------

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Restore collapsed state from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LS_KEY);
      if (saved === "true") setCollapsed(true);
    } catch {}
  }, []);

  const toggleCollapsed = () => {
    const next = !collapsed;
    setCollapsed(next);
    try {
      localStorage.setItem(LS_KEY, String(next));
    } catch {}
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/admin/auth/logout", { method: "POST" });
      router.push("/admin/login");
    } catch {
      router.push("/admin/login");
    }
  };

  const isActive = (href: string, exact: boolean) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  // ---------------------------------------------------------------------------
  // Shared nav content
  // ---------------------------------------------------------------------------

  const navContent = (isMobile: boolean) => (
    <div className="flex flex-col h-full">
      {/* Logo / Header */}
      <div
        className={cn(
          "flex items-center border-b border-zinc-800 px-4",
          collapsed && !isMobile ? "justify-center py-4" : "gap-3 py-5"
        )}
      >
        <LogoIcon className="h-8 w-8 text-[#FFC62C] shrink-0" />
        {(!collapsed || isMobile) && (
          <span className="text-sm font-semibold text-white tracking-wide truncate">
            Admin
          </span>
        )}
      </div>

      {/* Nav Items */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.href, item.exact);
          const Icon = item.icon;

          if (item.disabled) {
            return (
              <div
                key={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-zinc-600 cursor-not-allowed",
                  collapsed && !isMobile && "justify-center px-2"
                )}
                title={collapsed && !isMobile ? item.label : undefined}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {(!collapsed || isMobile) && (
                  <span className="truncate">{item.label}</span>
                )}
                {(!collapsed || isMobile) && (
                  <span className="ml-auto text-[10px] uppercase tracking-wider text-zinc-700 bg-zinc-800/50 px-1.5 py-0.5 rounded">
                    Bald
                  </span>
                )}
              </div>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => isMobile && setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                active
                  ? "bg-[#FFC62C]/10 text-[#FFC62C] font-medium"
                  : "text-zinc-400 hover:bg-zinc-800/50 hover:text-white",
                collapsed && !isMobile && "justify-center px-2"
              )}
              title={collapsed && !isMobile ? item.label : undefined}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {(!collapsed || isMobile) && (
                <span className="truncate">{item.label}</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer: Collapse toggle + Logout */}
      <div className="border-t border-zinc-800 px-3 py-3 space-y-1">
        {!isMobile && (
          <button
            onClick={toggleCollapsed}
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-zinc-500 hover:bg-zinc-800/50 hover:text-white transition-colors w-full"
          >
            {collapsed ? (
              <ChevronRight className="h-5 w-5 shrink-0" />
            ) : (
              <>
                <ChevronLeft className="h-5 w-5 shrink-0" />
                <span className="truncate">Einklappen</span>
              </>
            )}
          </button>
        )}
        <button
          onClick={handleLogout}
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors w-full",
            collapsed && !isMobile && "justify-center px-2"
          )}
          title={collapsed && !isMobile ? "Abmelden" : undefined}
        >
          <LogOut className="h-5 w-5 shrink-0" />
          {(!collapsed || isMobile) && (
            <span className="truncate">Abmelden</span>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden lg:flex flex-col bg-zinc-950 border-r border-zinc-800 transition-all duration-200 shrink-0",
          collapsed ? "w-16" : "w-64"
        )}
      >
        {navContent(false)}
      </aside>

      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 flex items-center gap-3 bg-zinc-950 border-b border-zinc-800 px-4 py-3">
        <button
          onClick={() => setMobileOpen(true)}
          className="text-zinc-400 hover:text-white transition-colors"
        >
          <Menu className="h-6 w-6" />
        </button>
        <LogoIcon className="h-6 w-6 text-[#FFC62C]" />
        <span className="text-sm font-semibold text-white">Admin</span>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setMobileOpen(false)}
          />
          {/* Drawer */}
          <aside className="relative w-72 h-full bg-zinc-950 border-r border-zinc-800 shadow-2xl">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
            {navContent(true)}
          </aside>
        </div>
      )}
    </>
  );
}
