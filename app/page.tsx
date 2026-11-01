import type { Metadata } from "next";
import { HeroSection } from "@/components/HeroSection";
import { FeatureGrid, HowItWorks } from "@/components/HowItWorks";
import { ApiSection, FinalCta, PricingSection } from "@/components/MarketingSections";
import { ReviewsPreview } from "@/components/ReviewsPreview";

export const metadata: Metadata = {
  title: "ProofDrop — Prove it happened. Notarized in seconds.",
  description:
    "Free client-side SHA-256 proof of authenticity for photos and documents. Live capture, signed timestamps, and shareable trust reports.",
};

export default function HomePage() {
  return (
    <div className="pb-10">
      <HeroSection />
      <div className="mx-auto mt-14 w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="hairline" />
      </div>
      <FeatureGrid />
      <HowItWorks />
      <ReviewsPreview />
      <PricingSection />
      <ApiSection />
      <FinalCta />
    </div>
  );
}
