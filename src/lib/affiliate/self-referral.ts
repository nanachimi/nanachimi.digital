/**
 * Self-referral detection — checks whether a submission IP belongs to
 * the winning affiliate. Uses an in-memory cache (5 min TTL) of all
 * known affiliate IPs, indexed by IP → Set<affiliateId>.
 *
 * Also detects active affiliate sessions on the submission request.
 *
 * Design: fail-open — if the DB read fails the cache is empty and no
 * legitimate submissions are blocked.
 */

import { prisma } from "@/lib/db";

// ─── Cache (mirrors src/lib/excluded-ips.ts pattern) ─────────────

/** Map from IP string → Set of affiliateIds that own that IP. */
let cachedIpMap: Map<string, Set<string>> | null = null;
let cacheExpiry = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Load all affiliate IPs into a Map<ip, Set<affiliateId>>.
 * Falls back to empty map on DB error (fail-open: no false positives).
 */
async function getAffiliateIpMap(): Promise<Map<string, Set<string>>> {
  const now = Date.now();
  if (cachedIpMap && now < cacheExpiry) return cachedIpMap;

  try {
    const rows = await prisma.affiliateIp.findMany({
      select: { ip: true, affiliateId: true },
    });
    const map = new Map<string, Set<string>>();
    for (const row of rows) {
      const existing = map.get(row.ip);
      if (existing) {
        existing.add(row.affiliateId);
      } else {
        map.set(row.ip, new Set([row.affiliateId]));
      }
    }
    cachedIpMap = map;
  } catch (err) {
    console.error("[SelfReferral] DB read failed, using empty map:", err);
    cachedIpMap = new Map();
  }

  cacheExpiry = now + CACHE_TTL;
  return cachedIpMap;
}

/** Force-reload the cache (called after login upsert or admin approval). */
export function invalidateAffiliateIpCache(): void {
  cachedIpMap = null;
  cacheExpiry = 0;
}

// ─── Detection ──────────────────────────────────────────────────

export interface SelfReferralCheck {
  blocked: boolean;
  reason: string | null;
}

/**
 * Check whether a submission should have its affiliate attribution stripped.
 *
 * @param submissionIp         IP of the person submitting the onboarding form.
 * @param winnerAffiliateId    Affiliate ID resolved by resolveAttribution().
 * @param affiliateSessionId   affiliateId from ncd-affiliate-session cookie
 *                             (null if not logged in as affiliate).
 */
export async function checkSelfReferral(params: {
  submissionIp: string;
  winnerAffiliateId: string;
  affiliateSessionId: string | null;
}): Promise<SelfReferralCheck> {
  const { submissionIp, winnerAffiliateId, affiliateSessionId } = params;

  // Check 1: Is the submitter logged in as the winning affiliate?
  if (affiliateSessionId && affiliateSessionId === winnerAffiliateId) {
    return {
      blocked: true,
      reason: `Affiliate-Session aktiv (affiliateId=${winnerAffiliateId})`,
    };
  }

  // Check 2: Does the submission IP match a known IP of the winning affiliate?
  if (submissionIp && submissionIp !== "unknown") {
    const ipMap = await getAffiliateIpMap();
    const ownersOfIp = ipMap.get(submissionIp);
    if (ownersOfIp?.has(winnerAffiliateId)) {
      return {
        blocked: true,
        reason: `IP-Match: ${submissionIp} gehoert zu affiliateId=${winnerAffiliateId}`,
      };
    }
  }

  return { blocked: false, reason: null };
}

// ─── IP upsert helper ───────────────────────────────────────────

/**
 * Record an affiliate IP (idempotent upsert).
 * On conflict (same affiliate+ip), just bumps lastSeenAt.
 */
export async function upsertAffiliateIp(params: {
  affiliateId: string;
  ip: string;
  source: "application" | "login" | "manual";
}): Promise<void> {
  if (!params.ip || params.ip === "unknown") return;

  await prisma.affiliateIp.upsert({
    where: {
      affiliateId_ip: {
        affiliateId: params.affiliateId,
        ip: params.ip,
      },
    },
    update: { lastSeenAt: new Date(), source: params.source },
    create: {
      affiliateId: params.affiliateId,
      ip: params.ip,
      source: params.source,
    },
  });

  invalidateAffiliateIpCache();
}
