import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

interface HealthCheck {
  service: string;
  status: "healthy" | "unhealthy" | "degraded";
  latencyMs?: number;
  message?: string;
}

/**
 * GET /api/health
 *
 * Health check endpoint — protected by admin session OR a shared secret
 * (for CI/CD pipeline pre-deploy checks).
 *
 * Auth: admin session cookie OR `Authorization: Bearer <HEALTH_CHECK_SECRET>`
 */
export async function GET(request: NextRequest) {
  // Auth: check admin session cookie or bearer token
  const authHeader = request.headers.get("authorization");
  const bearerToken = authHeader?.replace("Bearer ", "");
  const healthSecret = process.env.HEALTH_CHECK_SECRET;

  // Allow access if valid bearer token matches HEALTH_CHECK_SECRET
  const isAuthorizedByToken = healthSecret && bearerToken === healthSecret;

  // Allow access if admin session cookie is valid
  let isAuthorizedBySession = false;
  if (!isAuthorizedByToken) {
    try {
      const { requireAdmin } = await import("@/lib/auth/require-admin");
      await requireAdmin();
      isAuthorizedBySession = true;
    } catch {
      // Not an admin session
    }
  }

  if (!isAuthorizedByToken && !isAuthorizedBySession) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const checks: HealthCheck[] = [];

  // 1. Database (PostgreSQL via Prisma)
  checks.push(await checkDatabase());

  // 2. SeaweedFS (file storage)
  checks.push(await checkSeaweedFS());

  // 3. SMTP (email)
  checks.push(await checkSMTP());

  // 4. Anthropic API
  checks.push(checkAnthropicAPI());

  // 5. Job Queue
  checks.push(await checkJobQueue());

  // 6. Disk / Environment
  checks.push(checkEnvironment());

  const allHealthy = checks.every((c) => c.status === "healthy");
  const hasDegraded = checks.some((c) => c.status === "degraded");
  const overallStatus = allHealthy
    ? "healthy"
    : hasDegraded && !checks.some((c) => c.status === "unhealthy")
      ? "degraded"
      : "unhealthy";

  return NextResponse.json(
    {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || "0.1.0",
      checks,
    },
    { status: allHealthy ? 200 : hasDegraded ? 200 : 503 }
  );
}

// ─── Individual Checks ─────────────────────────────────────────────

async function checkDatabase(): Promise<HealthCheck> {
  const start = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return {
      service: "database",
      status: "healthy",
      latencyMs: Date.now() - start,
      message: "PostgreSQL erreichbar",
    };
  } catch (err) {
    return {
      service: "database",
      status: "unhealthy",
      latencyMs: Date.now() - start,
      message: err instanceof Error ? err.message : "Verbindung fehlgeschlagen",
    };
  }
}

async function checkSeaweedFS(): Promise<HealthCheck> {
  const masterUrl = process.env.SEAWEEDFS_MASTER_URL;

  if (!masterUrl) {
    return {
      service: "seaweedfs",
      status: "degraded",
      message: "SEAWEEDFS_MASTER_URL nicht konfiguriert — Datei-Upload deaktiviert",
    };
  }

  const start = Date.now();
  try {
    const res = await fetch(`${masterUrl}/dir/status`, {
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) {
      return {
        service: "seaweedfs",
        status: "unhealthy",
        latencyMs: Date.now() - start,
        message: `Master antwortet mit Status ${res.status}`,
      };
    }
    return {
      service: "seaweedfs",
      status: "healthy",
      latencyMs: Date.now() - start,
      message: "SeaweedFS Master erreichbar",
    };
  } catch (err) {
    return {
      service: "seaweedfs",
      status: "unhealthy",
      latencyMs: Date.now() - start,
      message: err instanceof Error ? err.message : "Nicht erreichbar",
    };
  }
}

async function checkSMTP(): Promise<HealthCheck> {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT;

  if (!host) {
    return {
      service: "smtp",
      status: "degraded",
      message: "SMTP_HOST nicht konfiguriert",
    };
  }

  const start = Date.now();
  try {
    // Try a TCP connection to SMTP host
    const net = await import("net");
    await new Promise<void>((resolve, reject) => {
      const socket = net.createConnection(
        { host, port: parseInt(port || "587"), timeout: 5000 },
        () => {
          socket.end();
          resolve();
        }
      );
      socket.on("error", reject);
      socket.on("timeout", () => {
        socket.destroy();
        reject(new Error("Verbindungs-Timeout"));
      });
    });
    return {
      service: "smtp",
      status: "healthy",
      latencyMs: Date.now() - start,
      message: `SMTP ${host}:${port} erreichbar`,
    };
  } catch (err) {
    // In dev/staging, SMTP not running is degraded, not a hard failure
    const isDev = process.env.NODE_ENV !== "production" ||
      process.env.NEXT_PUBLIC_SITE_URL?.includes("dev.") ||
      process.env.NEXT_PUBLIC_SITE_URL?.includes("staging.");
    return {
      service: "smtp",
      status: isDev ? "degraded" : "unhealthy",
      latencyMs: Date.now() - start,
      message: err instanceof Error ? err.message : "Nicht erreichbar",
    };
  }
}

function checkAnthropicAPI(): HealthCheck {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return {
      service: "anthropic",
      status: "degraded",
      message: "ANTHROPIC_API_KEY nicht konfiguriert",
    };
  }

  if (!apiKey.startsWith("sk-ant-")) {
    return {
      service: "anthropic",
      status: "unhealthy",
      message: "ANTHROPIC_API_KEY Format ungültig",
    };
  }

  return {
    service: "anthropic",
    status: "healthy",
    message: `API-Key konfiguriert (…${apiKey.slice(-6)})`,
  };
}

async function checkJobQueue(): Promise<HealthCheck> {
  try {
    const failedJobs = await prisma.job.count({
      where: { status: "failed" },
    });
    const pendingJobs = await prisma.job.count({
      where: { status: { in: ["pending", "processing"] } },
    });
    const openIncidents = await prisma.incident.count({
      where: { status: "open", severity: "critical" },
    });

    if (failedJobs > 10) {
      return {
        service: "job_queue",
        status: "unhealthy",
        message: `${failedJobs} fehlgeschlagene Jobs, ${openIncidents} kritische Vorfälle, ${pendingJobs} ausstehend`,
      };
    }

    if (failedJobs > 0 || openIncidents > 0) {
      return {
        service: "job_queue",
        status: "degraded",
        message: `${failedJobs} fehlgeschlagene Jobs, ${openIncidents} kritische Vorfälle, ${pendingJobs} ausstehend`,
      };
    }

    return {
      service: "job_queue",
      status: "healthy",
      message: `${pendingJobs} ausstehende Jobs, keine Fehler`,
    };
  } catch {
    return {
      service: "job_queue",
      status: "degraded",
      message: "Job-Queue-Status konnte nicht abgefragt werden",
    };
  }
}

function checkEnvironment(): HealthCheck {
  const required = [
    "DATABASE_URL",
    "SESSION_SECRET",
    "AFFILIATE_SESSION_SECRET",
    "ADMIN_USERNAME",
    "ADMIN_PASSWORD",
    "NEXT_PUBLIC_SITE_URL",
    "SEAWEEDFS_MASTER_URL",
    "SEAWEEDFS_FILER_URL",
    "SMTP_HOST",
    "SMTP_PORT",
    "EMAIL_FROM",
  ];
  const missing = required.filter((k) => !process.env[k]);

  if (missing.length > 0) {
    return {
      service: "environment",
      status: "unhealthy",
      message: `Fehlend: ${missing.join(", ")}`,
    };
  }

  // Validate minimum-length secrets
  const secretChecks = [
    { name: "SESSION_SECRET", value: process.env.SESSION_SECRET || "", min: 32 },
    { name: "AFFILIATE_SESSION_SECRET", value: process.env.AFFILIATE_SESSION_SECRET || "", min: 32 },
  ];
  const tooShort = secretChecks.filter((s) => s.value.length < s.min);
  if (tooShort.length > 0) {
    return {
      service: "environment",
      status: "unhealthy",
      message: `Zu kurz (min ${tooShort[0].min} Zeichen): ${tooShort.map((s) => s.name).join(", ")}`,
    };
  }

  return {
    service: "environment",
    status: "healthy",
    message: `Alle ${required.length} erforderlichen Umgebungsvariablen gesetzt`,
  };
}
