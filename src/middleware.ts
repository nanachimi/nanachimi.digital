import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import {
  SessionData,
  sessionOptions,
  SESSION_MAX_AGE_MS,
  SESSION_IDLE_TIMEOUT_MS,
} from "@/lib/auth/session";

function addSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), interest-cohort=()"
  );
  response.headers.set(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains"
  );
  return response;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only protect admin routes (excluding login & auth endpoints)
  const isAdminPage =
    pathname.startsWith("/backoffice") &&
    !pathname.startsWith("/backoffice/login") &&
    !pathname.startsWith("/backoffice/setup-2fa");
  const isAdminApi =
    pathname.startsWith("/api/admin") &&
    !pathname.startsWith("/api/admin/auth");

  // Internal cron routes — only accessible from localhost (background scheduler)
  if (pathname.startsWith("/api/cron")) {
    const host = request.headers.get("host") ?? "";
    if (host.startsWith("localhost") || host.startsWith("127.0.0.1")) {
      return addSecurityHeaders(NextResponse.next());
    }
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 403 });
  }

  if (!isAdminPage && !isAdminApi) {
    return addSecurityHeaders(NextResponse.next());
  }

  const response = NextResponse.next();
  const session = await getIronSession<SessionData>(request, response, sessionOptions);

  // No session — redirect to login
  if (!session.isLoggedIn) {
    if (isAdminApi) {
      return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/backoffice/login", request.url));
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
    return NextResponse.redirect(new URL("/backoffice/login", request.url));
  }

  // Password OK but 2FA not verified yet — redirect to TOTP
  if (!session.is2FAVerified) {
    if (isAdminApi) {
      return NextResponse.json({ error: "2FA erforderlich" }, { status: 403 });
    }
    // Check if TOTP is configured (env var or DB flag in session)
    const hasSecret = !!process.env.ADMIN_TOTP_SECRET || session.totpConfigured;
    const redirect = hasSecret ? "/backoffice/login/totp" : "/backoffice/setup-2fa";
    return NextResponse.redirect(new URL(redirect, request.url));
  }

  // Update activity timestamp (sliding window) — let requireAdmin() handle this
  // Middleware only does read-only auth checks to avoid cookie conflicts with route handlers
  return addSecurityHeaders(response);
}

export const config = {
  matcher: [
    // Apply security headers to all routes except static assets
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)).*)",
  ],
};
