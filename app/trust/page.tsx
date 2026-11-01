import type { Metadata } from "next";
import { TrustExplainer } from "@/components/TrustExplainer";

export const metadata: Metadata = {
  title: "How verification works",
  description:
    "How ProofDrop fingerprints evidence client-side, anchors signed timestamps, and scores forensic provenance signals.",
};

export default function TrustPage() {
  return <TrustExplainer />;
}
