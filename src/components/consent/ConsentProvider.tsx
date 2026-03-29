"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import {
  type ConsentPreferences,
  CONSENT_VERSION,
  readConsentCookie,
  writeConsentCookie,
  dispatchConsentChange,
} from "@/lib/consent";
import { CookieBanner } from "./CookieBanner";

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

interface ConsentContextValue {
  /** Check if a specific consent category is granted */
  hasConsent: (category: "analytics") => boolean;
  /** Accept all cookies */
  acceptAll: () => void;
  /** Accept only necessary cookies */
  acceptNecessaryOnly: () => void;
  /** Update specific preferences */
  updatePreferences: (analytics: boolean) => void;
  /** Re-open the cookie banner */
  openBanner: () => void;
  /** Whether consent has been given (any choice made) */
  consentGiven: boolean;
}

const ConsentContext = createContext<ConsentContextValue>({
  hasConsent: () => false,
  acceptAll: () => {},
  acceptNecessaryOnly: () => {},
  updatePreferences: () => {},
  openBanner: () => {},
  consentGiven: false,
});

export function useConsent() {
  return useContext(ConsentContext);
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function ConsentProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefs] = useState<ConsentPreferences | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Read cookie on mount
  useEffect(() => {
    setMounted(true);
    const existing = readConsentCookie();
    if (existing) {
      setPrefs(existing);
      setShowBanner(false);
    } else {
      setShowBanner(true);
    }
  }, []);

  const savePrefs = useCallback((newPrefs: ConsentPreferences) => {
    setPrefs(newPrefs);
    writeConsentCookie(newPrefs);
    dispatchConsentChange(newPrefs);
    setShowBanner(false);
  }, []);

  const acceptAll = useCallback(() => {
    savePrefs({
      necessary: true,
      analytics: true,
      consentedAt: new Date().toISOString(),
      version: CONSENT_VERSION,
    });
  }, [savePrefs]);

  const acceptNecessaryOnly = useCallback(() => {
    savePrefs({
      necessary: true,
      analytics: false,
      consentedAt: new Date().toISOString(),
      version: CONSENT_VERSION,
    });
  }, [savePrefs]);

  const updatePreferences = useCallback(
    (analytics: boolean) => {
      savePrefs({
        necessary: true,
        analytics,
        consentedAt: new Date().toISOString(),
        version: CONSENT_VERSION,
      });
    },
    [savePrefs]
  );

  const openBanner = useCallback(() => {
    setShowBanner(true);
  }, []);

  const hasConsent = useCallback(
    (category: "analytics") => {
      if (!prefs) return false;
      return prefs[category] === true;
    },
    [prefs]
  );

  const value: ConsentContextValue = {
    hasConsent,
    acceptAll,
    acceptNecessaryOnly,
    updatePreferences,
    openBanner,
    consentGiven: prefs !== null,
  };

  return (
    <ConsentContext.Provider value={value}>
      {children}
      {mounted && showBanner && (
        <CookieBanner
          currentPrefs={prefs}
          onAcceptAll={acceptAll}
          onAcceptNecessary={acceptNecessaryOnly}
          onSavePreferences={updatePreferences}
        />
      )}
    </ConsentContext.Provider>
  );
}
