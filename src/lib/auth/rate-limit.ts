/**
 * In-memory rate limiter — configurable per use case.
 */

interface AttemptRecord {
  count: number;
  firstAttempt: number;
}

interface RateLimiterConfig {
  maxAttempts: number;
  windowMs: number;
}

class RateLimiter {
  private attempts = new Map<string, AttemptRecord>();
  private readonly maxAttempts: number;
  private readonly windowMs: number;

  constructor(config: RateLimiterConfig) {
    this.maxAttempts = config.maxAttempts;
    this.windowMs = config.windowMs;
  }

  check(key: string): boolean {
    const now = Date.now();
    const record = this.attempts.get(key);

    if (!record || now - record.firstAttempt > this.windowMs) {
      this.attempts.set(key, { count: 1, firstAttempt: now });
      return true;
    }

    if (record.count >= this.maxAttempts) {
      return false;
    }

    record.count++;
    return true;
  }

  getResetSeconds(key: string): number {
    const record = this.attempts.get(key);
    if (!record) return 0;
    const remaining = Math.max(0, this.windowMs - (Date.now() - record.firstAttempt));
    return Math.ceil(remaining / 1000);
  }

  cleanup() {
    const now = Date.now();
    this.attempts.forEach((record, key) => {
      if (now - record.firstAttempt > this.windowMs) {
        this.attempts.delete(key);
      }
    });
  }
}

// ─── Pre-configured limiters ─────────────────────────────────────

/** Login: 5 attempts per IP per 15 minutes */
const loginLimiter = new RateLimiter({ maxAttempts: 5, windowMs: 15 * 60 * 1000 });

/** Public API: 20 requests per IP per minute */
const publicApiLimiter = new RateLimiter({ maxAttempts: 20, windowMs: 60 * 1000 });

/** Form submissions (onboarding, contact): 5 per IP per 10 minutes */
const formLimiter = new RateLimiter({ maxAttempts: 5, windowMs: 10 * 60 * 1000 });

/** TOTP verification: 5 attempts per IP per 15 minutes */
const totpLimiter = new RateLimiter({ maxAttempts: 5, windowMs: 15 * 60 * 1000 });

// Legacy API — used by login route
export function checkRateLimit(ip: string): boolean {
  return loginLimiter.check(ip);
}

export function getRateLimitResetSeconds(ip: string): number {
  return loginLimiter.getResetSeconds(ip);
}

// New API — use directly
export { loginLimiter, publicApiLimiter, formLimiter, totpLimiter };

// Cleanup all limiters every 30 minutes
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    loginLimiter.cleanup();
    publicApiLimiter.cleanup();
    formLimiter.cleanup();
    totpLimiter.cleanup();
  }, 30 * 60 * 1000);
}
