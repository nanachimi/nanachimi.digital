/**
 * Cookie consent types and helpers for DSGVO compliance.
 *
 * Usable both in React (via ConsentProvider) and in plain JS/TS
 * (via readConsentCookie / hasAnalyticsConsent).
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const CONSENT_COOKIE = "ncd-consent";
export const CONSENT_VERSION = 1;
export const CONSENT_MAX_AGE = 365 * 24 * 60 * 60; // 365 days in seconds

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ConsentPreferences {
  necessary: true; // always true — cannot be toggled off
  analytics: boolean;
  consentedAt: string; // ISO timestamp
  version: number;
}

// ---------------------------------------------------------------------------
// Cookie helpers (work without React)
// ---------------------------------------------------------------------------

/** Read the consent cookie and parse it. Returns null if missing or outdated. */
export function readConsentCookie(): ConsentPreferences | null {
  if (typeof document === "undefined") return null;

  const match = document.cookie.match(
    new RegExp(`(?:^|; )${CONSENT_COOKIE}=([^;]*)`)
  );
  if (!match) return null;

  try {
    const prefs: ConsentPreferences = JSON.parse(
      decodeURIComponent(match[1])
    );
    // Reject if version is outdated
    if (prefs.version !== CONSENT_VERSION) return null;
    return prefs;
  } catch {
    return null;
  }
}

/** Write the consent cookie. */
export function writeConsentCookie(prefs: ConsentPreferences): void {
  if (typeof document === "undefined") return;

  const value = encodeURIComponent(JSON.stringify(prefs));
  document.cookie = `${CONSENT_COOKIE}=${value}; path=/; max-age=${CONSENT_MAX_AGE}; SameSite=Lax`;
}

/** Quick check: does the visitor have analytics consent? */
export function hasAnalyticsConsent(): boolean {
  const prefs = readConsentCookie();
  return prefs?.analytics === true;
}

// ---------------------------------------------------------------------------
// Custom event for cross-component communication
// ---------------------------------------------------------------------------

export const CONSENT_CHANGE_EVENT = "ncd-consent-change";

export function dispatchConsentChange(prefs: ConsentPreferences): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(CONSENT_CHANGE_EVENT, { detail: prefs })
  );
}
