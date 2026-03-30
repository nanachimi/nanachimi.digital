import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import {
  SessionData,
  sessionOptions,
  SESSION_MAX_AGE_MS,
  SESSION_IDLE_TIMEOUT_MS,
} from "@/lib/auth/session";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only protect admin routes (excluding login & auth endpoints)
  const isAdminPage =
    pathname.startsWith("/admin") &&
    !pathname.startsWith("/admin/login") &&
    !pathname.startsWith("/admin/setup-2fa");
  const isAdminApi =
    pathname.startsWith("/api/admin") &&
    !pathname.startsWith("/api/admin/auth");

  if (!isAdminPage && !isAdminApi) {
    return NextResponse.next();
  }

  const response = NextResponse.next();
  const session = await getIronSession<SessionData>(request, response, sessionOptions);

  // No session — redirect to login
  if (!session.isLoggedIn) {
    if (isAdminApi) {
      return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  // Check expiry (absolute + inactivity)
  const now = Date.now();
  if (
    now - session.loginAt > SESSION_MAX_AGE_MS ||
    now - session.lastActivity > SESSION_IDLE_TIMEOUT_MS
  ) {
    session.destroy();
    if (isAdminApi) {
      return NextResponse.json({ error: "Sitzung abgelaufen" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  // Password OK but 2FA not verified yet — redirect to TOTP
  if (!session.is2FAVerified) {
    if (isAdminApi) {
      return NextResponse.json({ error: "2FA erforderlich" }, { status: 403 });
    }
    // Check if TOTP is configured (env var or DB flag in session)
    const hasSecret = !!process.env.ADMIN_TOTP_SECRET || session.totpConfigured;
    const redirect = hasSecret ? "/admin/login/totp" : "/admin/setup-2fa";
    return NextResponse.redirect(new URL(redirect, request.url));
  }

  // Update activity timestamp (sliding window) — let requireAdmin() handle this
  // Middleware only does read-only auth checks to avoid cookie conflicts with route handlers
  return response;
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
