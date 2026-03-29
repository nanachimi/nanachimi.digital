"use client";

import { useEffect, useRef, useCallback } from "react";
import { usePathname } from "next/navigation";
import { hasAnalyticsConsent, CONSENT_CHANGE_EVENT } from "@/lib/consent";

/**
 * Client-side analytics tracker.
 * Only fires events when analytics consent is given.
 * Placed in public layout, runs passively.
 */
export function AnalyticsTracker() {
  const pathname = usePathname();
  const pageViewIdRef = useRef<string>("");
  const enteredAtRef = useRef<number>(0);
  const maxScrollRef = useRef<number>(0);
  const consentRef = useRef(false);

  // Check consent on mount and on consent changes
  useEffect(() => {
    consentRef.current = hasAnalyticsConsent();

    const onConsentChange = () => {
      consentRef.current = hasAnalyticsConsent();
    };

    window.addEventListener(CONSENT_CHANGE_EVENT, onConsentChange);
    return () =>
      window.removeEventListener(CONSENT_CHANGE_EVENT, onConsentChange);
  }, []);

  // Get visitor ID from ncd-ab cookie (shared with AB system)
  const getVisitorId = useCallback((): string => {
    const match = document.cookie.match(
      /(?:^|; )ncd-ab=([^;]*)/
    );
    return match ? decodeURIComponent(match[1]) : "anonymous";
  }, []);

  // Get UTM params from URL
  const getUtmParams = useCallback(() => {
    const params = new URLSearchParams(window.location.search);
    return {
      utmSource: params.get("utm_source") || undefined,
      utmMedium: params.get("utm_medium") || undefined,
      utmCampaign: params.get("utm_campaign") || undefined,
    };
  }, []);

  // Send beacon on unload
  const sendBeacon = useCallback(() => {
    if (!consentRef.current || !pageViewIdRef.current) return;

    const timeOnPage = Math.round((Date.now() - enteredAtRef.current) / 1000);
    const data = JSON.stringify({
      type: "pageview_update",
      id: pageViewIdRef.current,
      timeOnPage,
      scrollDepth: maxScrollRef.current,
    });

    navigator.sendBeacon("/api/analytics/track", data);
  }, []);

  // Scroll tracking
  useEffect(() => {
    const handleScroll = () => {
      if (!consentRef.current) return;

      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollHeight <= 0) {
        maxScrollRef.current = 100;
        return;
      }
      const scrollPercent = Math.round((window.scrollY / scrollHeight) * 100);
      // Snap to 25% increments
      const snapped = Math.floor(scrollPercent / 25) * 25;
      if (snapped > maxScrollRef.current) {
        maxScrollRef.current = snapped;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Track page views on route change
  useEffect(() => {
    if (!consentRef.current) return;

    // Reset scroll tracking
    maxScrollRef.current = 0;
    enteredAtRef.current = Date.now();

    const id = crypto.randomUUID();
    pageViewIdRef.current = id;

    fetch("/api/analytics/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "pageview",
        id,
        visitorId: getVisitorId(),
        path: pathname,
        referrer: document.referrer || "",
        ...getUtmParams(),
      }),
    }).catch(() => {});
  }, [pathname, getVisitorId, getUtmParams]);

  // Send time-on-page on unload
  useEffect(() => {
    window.addEventListener("beforeunload", sendBeacon);
    return () => window.removeEventListener("beforeunload", sendBeacon);
  }, [sendBeacon]);

  return null; // This component renders nothing
}
