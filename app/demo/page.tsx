import type { Metadata } from "next";
import { headers } from "next/headers";
import QRCode from "qrcode";
import { getDemoRecord } from "@/lib/demo";
import { verifyAnchor } from "@/lib/anchor";
import { ReportView } from "@/components/ReportView";

export const metadata: Metadata = {
  title: "Sample trust report",
  description:
    "A sample ProofDrop trust card showing integrity, provenance checks, and an anchored timestamp.",
};

export default async function DemoPage() {
  const record = await getDemoRecord();
  const headerList = await headers();
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host") ?? "localhost:3000";
  const proto =
    headerList.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const shareUrl = `${proto}://${host}/verify/${record.hashId}`;

  const qrDataUrl = await QRCode.toDataURL(shareUrl, {
    margin: 1,
    width: 220,
    color: { dark: "#0b0a12", light: "#ffffff" },
    errorCorrectionLevel: "M",
  }).catch(() => undefined);

  const anchorVerification = await verifyAnchor(record);

  return (
    <ReportView
      record={record}
      shareUrl={shareUrl}
      qrDataUrl={qrDataUrl}
      anchorValid={
        anchorVerification.signatureValid &&
        anchorVerification.digestValid &&
        anchorVerification.metaDigestValid
      }
    />
  );
}
