/**
 * Excluded IP cache — loads from DB, caches for 5 minutes.
 * Used by the analytics tracking route to skip requests from excluded IPs.
 */

import { prisma } from "@/lib/db";

let cachedIps: Set<string> | null = null;
let cacheExpiry = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Get the set of excluded IPs (cached).
 * Falls back to env var ANALYTICS_EXCLUDED_IPS if DB read fails.
 */
export async function getExcludedIps(): Promise<Set<string>> {
  const now = Date.now();

  if (cachedIps && now < cacheExpiry) {
    return cachedIps;
  }

  try {
    const rows = await prisma.excludedIp.findMany({
      select: { ip: true },
    });
    cachedIps = new Set(rows.map((r) => r.ip));
  } catch (err) {
    console.error("[ExcludedIPs] DB read failed, using env fallback:", err);
    // Fallback to env var
    cachedIps = new Set(
      (process.env.ANALYTICS_EXCLUDED_IPS || "")
        .split(",")
        .map((ip) => ip.trim())
        .filter(Boolean)
    );
  }

  cacheExpiry = now + CACHE_TTL;
  return cachedIps;
}

/**
 * Force-reload the cache on next access (called after admin adds/removes an IP).
 */
export function invalidateCache(): void {
  cachedIps = null;
  cacheExpiry = 0;
}
