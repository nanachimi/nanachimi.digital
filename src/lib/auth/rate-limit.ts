/**
 * Simple in-memory rate limiter for login attempts.
 * 5 attempts per IP per 15 minutes.
 */

interface AttemptRecord {
  count: number;
  firstAttempt: number;
}

const attempts = new Map<string, AttemptRecord>();

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

/**
 * Check if a login attempt is allowed for the given IP.
 * Returns true if allowed, false if rate-limited.
 */
export function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = attempts.get(ip);

  if (!record) {
    attempts.set(ip, { count: 1, firstAttempt: now });
    return true;
  }

  // Window expired — reset
  if (now - record.firstAttempt > WINDOW_MS) {
    attempts.set(ip, { count: 1, firstAttempt: now });
    return true;
  }

  // Within window — check count
  if (record.count >= MAX_ATTEMPTS) {
    return false;
  }

  record.count++;
  return true;
}

/**
 * Get remaining seconds until rate limit resets for the given IP.
 */
export function getRateLimitResetSeconds(ip: string): number {
  const record = attempts.get(ip);
  if (!record) return 0;

  const elapsed = Date.now() - record.firstAttempt;
  const remaining = Math.max(0, WINDOW_MS - elapsed);
  return Math.ceil(remaining / 1000);
}

// Cleanup old entries every 30 minutes
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    attempts.forEach((record, ip) => {
      if (now - record.firstAttempt > WINDOW_MS) {
        attempts.delete(ip);
      }
    });
  }, 30 * 60 * 1000);
}
