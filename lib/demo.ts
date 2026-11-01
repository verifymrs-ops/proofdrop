import { createAnchor, sha256Hex } from "./anchor";
import { buildMetadata, deriveHashId, evaluateProvenance } from "./forensics";
import { readProof, writeProof } from "./store";
import type { ProofRecord } from "./types";

const DEMO_SEED =
  "proofdrop-demo-olx-handoff-iphone-15-pro-2026-10-28T16:04:22.918Z";

export async function getDemoRecord(): Promise<ProofRecord> {
  const sha256 = sha256Hex(DEMO_SEED);
  const hashId = deriveHashId(sha256);
  const existing = await readProof(hashId);
  if (existing) return existing;

  const capturedAt = "2026-10-28T16:04:22.918Z";
  const exif = {
    present: true,
    make: "Apple",
    model: "iPhone 15 Pro",
    lens: "Main Camera 24mm f/1.78",
    software: "17.5.1",
    takenAt: capturedAt,
    gps: false,
    iso: 64,
    fNumber: 1.78,
    exposureTime: "1/120s",
    orientation: 1,
  };

  const metadata = buildMetadata({
    fileName: "olx-handoff-iphone15pro.jpg",
    fileType: "image/jpeg",
    fileSize: 3_284_112,
    width: 4032,
    height: 3024,
    lastModified: Date.parse(capturedAt),
    captureMode: "camera",
    exif,
    device: {
      platform: "iOS",
      browser: "Safari",
      timezone: "Europe/Berlin",
      locale: "en-GB",
      screen: "430×932",
      cameraFacing: "environment",
    },
    clientCapturedAt: capturedAt,
  });

  const evaluation = evaluateProvenance({
    captureMode: "camera",
    fileType: "image/jpeg",
    exif,
    clientCapturedAt: capturedAt,
    lastModified: Date.parse(capturedAt),
  });

  const draft: Omit<ProofRecord, "anchor"> = {
    hashId,
    sha256,
    status: evaluation.status,
    statusLabel: evaluation.statusLabel,
    reasons: evaluation.reasons,
    createdAt: capturedAt,
    clientCapturedAt: capturedAt,
    captureMode: "camera",
    metadata: { ...metadata, checks: evaluation.checks },
  };

  const anchor = await createAnchor(draft, capturedAt);
  const record: ProofRecord = { ...draft, anchor };
  await writeProof(record);
  return record;
}
