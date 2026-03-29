"use client";

import { useEffect } from "react";
import { CTASection } from "@/components/sections/CTASection";
import { useABTest } from "@/components/ab/ABProvider";

interface ABCTASectionProps {
  headline?: string;
  subtext?: string;
}

/**
 * A/B-testable wrapper for CTASection.
 * Keeps CTASection as a pure presentational component.
 */
export function ABCTASection({ headline, subtext }: ABCTASectionProps) {
  const { config, trackImpression } = useABTest("cta-section");

  useEffect(() => {
    trackImpression();
  }, [trackImpression]);

  return (
    <CTASection
      headline={config.headline || headline}
      subtext={config.subtext || subtext}
    />
  );
}
