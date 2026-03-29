"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import { hasAnalyticsConsent, CONSENT_CHANGE_EVENT } from "@/lib/consent";

// ---------------------------------------------------------------------------
// Types (client-side subset of server types)
// ---------------------------------------------------------------------------

interface ActiveVariant {
  id: string;
  config: Record<string, string>;
  weight: number;
}

interface ActiveTest {
  id: string;
  targetElement: string;
  variants: ActiveVariant[];
}

interface ABAssignment {
  testId: string;
  variantId: string;
  config: Record<string, string>;
}

interface ABContextValue {
  /** Map of targetElement → assignment */
  assignments: Map<string, ABAssignment>;
  visitorId: string;
  isLoading: boolean;
}

const ABContext = createContext<ABContextValue>({
  assignments: new Map(),
  visitorId: "",
  isLoading: true,
});

// ---------------------------------------------------------------------------
// Cookie helpers
// ---------------------------------------------------------------------------

const COOKIE_NAME = "ncd-ab";
const COOKIE_MAX_AGE = 90 * 24 * 60 * 60; // 90 days in seconds

function getVisitorId(): string {
  if (typeof document === "undefined") return "";

  // Read existing cookie
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${COOKIE_NAME}=([^;]*)`)
  );
  if (match) return decodeURIComponent(match[1]);

  // Only create new cookie if analytics consent is given
  if (!hasAnalyticsConsent()) return "";

  // Create new visitor ID
  const id = crypto.randomUUID();
  document.cookie = `${COOKIE_NAME}=${id}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
  return id;
}

// ---------------------------------------------------------------------------
// Deterministic variant assignment (same as server-side)
// ---------------------------------------------------------------------------

function assignVariant(
  visitorId: string,
  testId: string,
  variants: ActiveVariant[]
): string {
  const str = visitorId + ":" + testId;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  const bucket = Math.abs(hash) % 100;

  let cumulative = 0;
  for (const variant of variants) {
    cumulative += variant.weight;
    if (bucket < cumulative) return variant.id;
  }
  return variants[variants.length - 1].id;
}

// ---------------------------------------------------------------------------
// LocalStorage cache for faster repeat visits
// ---------------------------------------------------------------------------

const LS_KEY = "ncd-ab-tests";
const LS_TTL = 5 * 60 * 1000; // 5 minutes

interface CachedTests {
  tests: ActiveTest[];
  timestamp: number;
}

function getCachedTests(): ActiveTest[] | null {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    const cached: CachedTests = JSON.parse(raw);
    if (Date.now() - cached.timestamp > LS_TTL) {
      localStorage.removeItem(LS_KEY);
      return null;
    }
    return cached.tests;
  } catch {
    return null;
  }
}

function setCachedTests(tests: ActiveTest[]): void {
  try {
    localStorage.setItem(
      LS_KEY,
      JSON.stringify({ tests, timestamp: Date.now() })
    );
  } catch {
    // localStorage may be unavailable
  }
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function ABProvider({ children }: { children: ReactNode }) {
  const [assignments, setAssignments] = useState<Map<string, ABAssignment>>(
    new Map()
  );
  const [visitorId, setVisitorId] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const initialized = useRef(false);

  const initializeAB = useCallback(() => {
    const vid = getVisitorId();
    setVisitorId(vid);

    // If no visitor ID (no consent), skip AB initialization
    if (!vid) {
      setIsLoading(false);
      return;
    }

    const processTests = (tests: ActiveTest[]) => {
      const map = new Map<string, ABAssignment>();
      for (const test of tests) {
        const variantId = assignVariant(vid, test.id, test.variants);
        const variant = test.variants.find((v) => v.id === variantId);
        if (variant) {
          map.set(test.targetElement, {
            testId: test.id,
            variantId,
            config: variant.config,
          });
        }
      }
      setAssignments(map);
      setIsLoading(false);
    };

    // Try cache first for instant render
    const cached = getCachedTests();
    if (cached) {
      processTests(cached);
    }

    // Always fetch fresh data
    fetch("/api/ab-tests/active")
      .then((res) => res.json())
      .then((tests: ActiveTest[]) => {
        setCachedTests(tests);
        processTests(tests);
      })
      .catch(() => {
        setIsLoading(false);
      });
  }, []);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    initializeAB();

    // Listen for consent changes to re-initialize when consent granted mid-session
    const onConsentChange = () => {
      if (hasAnalyticsConsent() && !visitorId) {
        initializeAB();
      }
    };
    window.addEventListener(CONSENT_CHANGE_EVENT, onConsentChange);
    return () =>
      window.removeEventListener(CONSENT_CHANGE_EVENT, onConsentChange);
  }, [initializeAB, visitorId]);

  return (
    <ABContext.Provider value={{ assignments, visitorId, isLoading }}>
      {children}
    </ABContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export interface UseABTestResult {
  /** The assigned variant ID, or null if no test is running for this element */
  variantId: string | null;
  /** Config values from the assigned variant */
  config: Record<string, string>;
  /** Track that this variant was shown to the visitor */
  trackImpression: () => void;
  /** Track a conversion event */
  trackConversion: (conversionType: string) => void;
  /** Whether tests are still loading */
  isLoading: boolean;
}

export function useABTest(targetElement: string): UseABTestResult {
  const { assignments, visitorId, isLoading } = useContext(ABContext);
  const assignment = assignments.get(targetElement);
  const trackedRef = useRef(false);

  const trackImpression = useCallback(() => {
    if (!assignment || !visitorId || trackedRef.current) return;
    trackedRef.current = true;

    fetch("/api/ab-tests/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        testId: assignment.testId,
        variantId: assignment.variantId,
        visitorId,
        type: "impression",
        page: window.location.pathname,
      }),
    }).catch(() => {}); // Fire and forget
  }, [assignment, visitorId]);

  const trackConversion = useCallback(
    (conversionType: string) => {
      if (!assignment || !visitorId) return;

      fetch("/api/ab-tests/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          testId: assignment.testId,
          variantId: assignment.variantId,
          visitorId,
          type: "conversion",
          conversionType,
          page: window.location.pathname,
        }),
      }).catch(() => {}); // Fire and forget
    },
    [assignment, visitorId]
  );

  return {
    variantId: assignment?.variantId ?? null,
    config: assignment?.config ?? {},
    trackImpression,
    trackConversion,
    isLoading,
  };
}
