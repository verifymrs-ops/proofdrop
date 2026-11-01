import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { readProof, isValidHashId } from "@/lib/store";
import { verifyAnchor } from "@/lib/anchor";
import { ReportView } from "@/components/ReportView";
import { LocalReportFallback } from "@/components/LocalReportFallback";

interface PageProps {
  params: Promise<{ hashId: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { hashId } = await params;
  const record = isValidHashId(hashId) ? await readProof(hashId) : null;
  if (!record) {
    return {
      title: "Proof not found",
      description: "This ProofDrop trust report could not be located.",
    };
  }
  return {
    title: `${record.status === "verified" ? "Verified" : "Flagged"} · ${record.metadata.fileName}`,
    description: `${record.statusLabel}. SHA-256 ${record.sha256.slice(0, 24)}… anchored ${record.anchor.anchoredAt}.`,
    openGraph: {
      title: `ProofDrop trust report · ${record.status === "verified" ? "Verified" : "Flagged"}`,
      description: record.statusLabel,
      type: "article",
    },
  };
}

export default async function VerifyReportPage({ params }: PageProps) {
  const { hashId } = await params;

  if (!isValidHashId(hashId)) notFound();

  const record = await readProof(hashId);
  if (!record) return <LocalReportFallback hashId={hashId} />;

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
