import { Hero } from "@/components/sections/Hero";
import { UrgencySection } from "@/components/sections/UrgencySection";
import { AIOnboardingPreview } from "@/components/sections/AIOnboardingPreview";
import { PortfolioPreview } from "@/components/sections/PortfolioPreview";
import { Testimonials } from "@/components/sections/Testimonials";
import { TrustSignals } from "@/components/sections/TrustSignals";
import { FAQ } from "@/components/sections/FAQ";
import { ABCTASection } from "@/components/ab/ABCTASection";

export default function HomePage() {
  return (
    <>
      <Hero />
      <UrgencySection />
      <AIOnboardingPreview />
      <PortfolioPreview />
      <Testimonials />
      <TrustSignals />
      <FAQ />
      <ABCTASection />
    </>
  );
}
