import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import {
  SessionData,
  sessionOptions,
  SESSION_MAX_AGE_MS,
  SESSION_IDLE_TIMEOUT_MS,
} from "@/lib/auth/session";
import {
  AffiliateSessionData,
  affiliateSessionOptions,
  AFFILIATE_SESSION_MAX_AGE_MS,
  AFFILIATE_SESSION_IDLE_TIMEOUT_MS,
} from "@/lib/auth/affiliate-session";

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
  response.headers.set(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' https: data:; font-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'"
  );
  return response;
}

// Matches /@handle — Next.js can't have an app-router segment starting with "@"
// (reserved for parallel routes), so we set the referral cookie here and redirect.
const AFFILIATE_HANDLE_REGEX = /^\/@([a-zA-Z0-9_-]{3,32})$/;

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const host = request.headers.get("host") ?? "";

  // ─── Affiliate subdomain (affiliates.nanachimi.digital) ────────────
  const isAffiliateHost = host.startsWith("affiliates.");

  if (isAffiliateHost) {
    // Let static assets and Next.js internals pass through
    if (pathname.startsWith("/_next/") || pathname.startsWith("/favicon")) {
      return addSecurityHeaders(NextResponse.next());
    }

    // API routes for affiliate auth — pass through (no session check needed for login)
    if (pathname.startsWith("/api/affiliates/auth/")) {
      return addSecurityHeaders(NextResponse.next());
    }

    // API routes for affiliate data — check session
    if (pathname.startsWith("/api/affiliates/me/")) {
      const response = NextResponse.next();
      const session = await getIronSession<AffiliateSessionData>(request, response, affiliateSessionOptions);

      if (!session.isLoggedIn) {
        return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
      }

      const now = Date.now();
      if (
        now - session.loginAt > AFFILIATE_SESSION_MAX_AGE_MS ||
        now - session.lastActivity > AFFILIATE_SESSION_IDLE_TIMEOUT_MS
      ) {
        session.destroy();
        return NextResponse.json({ error: "Sitzung abgelaufen" }, { status: 401 });
      }

      return addSecurityHeaders(response);
    }

    // Page routes — rewrite to /portal/* route group
    const isLoginPage = pathname === "/login" || pathname.startsWith("/login/");
    const isAlreadyRewritten = pathname.startsWith("/portal");

    if (!isAlreadyRewritten) {
      // Check session for non-login pages
      if (!isLoginPage) {
        const response = NextResponse.next();
        const session = await getIronSession<AffiliateSessionData>(request, response, affiliateSessionOptions);

        if (!session.isLoggedIn) {
          const url = request.nextUrl.clone();
          url.pathname = "/portal/login";
          return addSecurityHeaders(NextResponse.rewrite(url));
        }

        const now = Date.now();
        if (
          now - session.loginAt > AFFILIATE_SESSION_MAX_AGE_MS ||
          now - session.lastActivity > AFFILIATE_SESSION_IDLE_TIMEOUT_MS
        ) {
          session.destroy();
          const url = request.nextUrl.clone();
          url.pathname = "/portal/login";
          return addSecurityHeaders(NextResponse.rewrite(url));
        }
      }

      // Rewrite to /portal/*
      const url = request.nextUrl.clone();
      url.pathname = `/portal${pathname === "/" ? "" : pathname}`;
      return addSecurityHeaders(NextResponse.rewrite(url));
    }

    return addSecurityHeaders(NextResponse.next());
  }

  // ─── Block direct access to /portal from non-affiliate hosts ───────
  if (pathname.startsWith("/portal") && process.env.NODE_ENV === "production") {
    return new NextResponse(null, { status: 404 });
  }

  // ─── /@handle — set ncd_ref cookie (2 years) and redirect to home ──
  const handleMatch = pathname.match(AFFILIATE_HANDLE_REGEX);
  if (handleMatch) {
    const handle = handleMatch[1];
    const redirectUrl = new URL("/", request.url);
    const response = NextResponse.redirect(redirectUrl);
    response.cookies.set("ncd_ref", handle, {
      maxAge: 60 * 60 * 24 * 365 * 2, // 2 years
      path: "/",
      sameSite: "lax",
      httpOnly: false, // readable client-side for analytics tracking
      secure: process.env.NODE_ENV === "production",
    });
    return addSecurityHeaders(response);
  }

  // ─── Admin route protection ────────────────────────────────────────
  const isAdminPage =
    pathname.startsWith("/backoffice") &&
    !pathname.startsWith("/backoffice/login") &&
    !pathname.startsWith("/backoffice/setup-2fa");
  const isAdminApi =
    pathname.startsWith("/api/admin") &&
    !pathname.startsWith("/api/admin/auth");

  // Internal cron routes — protected by CRON_SECRET bearer token
  if (pathname.startsWith("/api/cron")) {
    const authHeader = request.headers.get("authorization") ?? "";
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && authHeader === `Bearer ${cronSecret}`) {
      return addSecurityHeaders(NextResponse.next());
    }
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
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
