import type { Metadata } from "next";
import { VerifyWorkspace } from "@/components/VerifyWorkspace";

export const metadata: Metadata = {
  title: "Create a proof",
  description:
    "Capture a photo or upload a document, fingerprint it with SHA-256 on your device, and anchor a signed timestamp.",
};

export default function VerifyPage() {
  return <VerifyWorkspace />;
}
