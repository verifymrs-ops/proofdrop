import { NextResponse } from "next/server";
import { buildMetadata, deriveHashId, evaluateProvenance } from "@/lib/forensics";
import {
  clampNumber,
  clampString,
  normalizeCaptureMode,
} from "@/lib/canonical";
import { createAnchor } from "@/lib/anchor";
import { readProof, writeProof, ensureStore } from "@/lib/store";
import type {
  CreateProofResponse,
  ProofDevice,
  ProofExif,
  ProofRecord,
  ProofStatus,
} from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SHA256_PATTERN = /^[a-f0-9]{64}$/;
const MAX_FILE_BYTES = 25 * 1024 * 1024;

interface IncomingPayload {
  sha256?: unknown;
  clientCapturedAt?: unknown;
  captureMode?: unknown;
  metadata?: Record<string, unknown>;
}

function sanitizeExif(input: unknown): ProofExif {
  const raw = (input ?? {}) as Record<string, unknown>;
  return {
    present: Boolean(raw.present),
    make: clampString(raw.make, 80),
    model: clampString(raw.model, 80),
    lens: clampString(raw.lens, 80),
    software: clampString(raw.software, 120),
    takenAt: clampString(raw.takenAt, 40),
    gps: Boolean(raw.gps),
    iso: clampNumber(raw.iso, 0, 2_000_000),
    fNumber: clampNumber(raw.fNumber, 0, 200),
    exposureTime: clampString(raw.exposureTime, 24),
    orientation: clampNumber(raw.orientation, 1, 8),
  };
}

function sanitizeDevice(input: unknown): ProofDevice {
  const raw = (input ?? {}) as Record<string, unknown>;
  return {
    platform: clampString(raw.platform, 40),
    browser: clampString(raw.browser, 40),
    timezone: clampString(raw.timezone, 60),
    locale: clampString(raw.locale, 24),
    screen: clampString(raw.screen, 24),
    cameraFacing: clampString(raw.cameraFacing, 24),
  };
}

export async function POST(request: Request) {
  try {
    return await createProof(request);
  } catch (error) {
    console.error("[api/proof] failed to anchor proof", error);
    return NextResponse.json(
      {
        error:
          "The anchoring service hit an unexpected error. Please retry in a moment.",
        detail: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}

async function createProof(request: Request) {
  let payload: IncomingPayload;
  try {
    payload = (await request.json()) as IncomingPayload;
  } catch {
    return NextResponse.json({ error: "Malformed JSON body." }, { status: 400 });
  }

  const sha256 = typeof payload.sha256 === "string" ? payload.sha256.toLowerCase() : "";
  if (!SHA256_PATTERN.test(sha256)) {
    return NextResponse.json(
      { error: "A valid lowercase 64-character SHA-256 digest is required." },
      { status: 400 },
    );
  }

  const capturedAtRaw = clampString(payload.clientCapturedAt, 40);
  const capturedAt = capturedAtRaw ? new Date(capturedAtRaw) : new Date();
  if (Number.isNaN(capturedAt.getTime())) {
    return NextResponse.json({ error: "Invalid capture timestamp." }, { status: 400 });
  }

  const metadataRaw = payload.metadata ?? {};
  const captureMode = normalizeCaptureMode(metadataRaw.captureMode ?? payload.captureMode);

  const fileName = clampString(metadataRaw.fileName, 160) ?? "unnamed-file";
  const fileType = clampString(metadataRaw.fileType, 120) ?? "application/octet-stream";
  const fileSize = clampNumber(metadataRaw.fileSize, 0, MAX_FILE_BYTES) ?? 0;
  const width = clampNumber(metadataRaw.width, 0, 40_000);
  const height = clampNumber(metadataRaw.height, 0, 40_000);
  const lastModified = clampNumber(metadataRaw.lastModified, 0, 4_102_444_800_000);

  const exif = sanitizeExif(metadataRaw.exif);
  const device = sanitizeDevice(metadataRaw.device);

  const metadata = buildMetadata({
    fileName,
    fileType,
    fileSize,
    width,
    height,
    lastModified,
    captureMode,
    exif,
    device,
    clientCapturedAt: capturedAt.toISOString(),
  });

  const hashId = deriveHashId(sha256);

  const existing = await readProof(hashId);
  if (existing && existing.sha256 === sha256) {
    const body: CreateProofResponse = { record: existing, existing: true };
    return NextResponse.json(body, { status: 200 });
  }

  const evaluation = evaluateProvenance({
    captureMode,
    fileType,
    exif,
    clientCapturedAt: capturedAt.toISOString(),
    lastModified,
  });

  const createdAt = new Date().toISOString();
  const status: ProofStatus = evaluation.status;

  const draft: Omit<ProofRecord, "anchor"> = {
    hashId,
    sha256,
    status,
    statusLabel: evaluation.statusLabel,
    reasons: evaluation.reasons,
    createdAt,
    clientCapturedAt: capturedAt.toISOString(),
    captureMode,
    metadata: { ...metadata, checks: evaluation.checks },
  };

  const anchor = await createAnchor(draft, new Date().toISOString());
  const record: ProofRecord = { ...draft, anchor };

  await ensureStore();
  await writeProof(record);

  const body: CreateProofResponse = { record, existing: false };
  return NextResponse.json(body, { status: 201 });
}
