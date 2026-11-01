import {
  MAX_FILE_BYTES,
  detectDevice,
  extractExif,
  readImageDimensions,
  sha256Hex,
} from "./hash-client";
import { stashProofRecord } from "./proof-cache";
import type { CaptureMode, CreateProofResponse, ProofRecord } from "./types";

export interface IngestResult {
  record: ProofRecord;
  existing: boolean;
  sha256: string;
}

export interface IngestOptions {
  captureMode: CaptureMode;
  cameraFacing?: string;
  clientCapturedAt?: string;
  onStage?: (stage: "hashing" | "metadata" | "anchoring") => void;
}

export async function ingestFile(
  file: File,
  options: IngestOptions,
): Promise<IngestResult> {
  if (file.size === 0) throw new Error("That file appears to be empty.");
  if (file.size > MAX_FILE_BYTES) {
    throw new Error("Files must be 25 MB or smaller.");
  }

  options.onStage?.("hashing");
  const buffer = await file.arrayBuffer();
  const sha256 = await sha256Hex(buffer);

  options.onStage?.("metadata");
  const [exif, dimensions] = await Promise.all([
    extractExif(file, file.type),
    readImageDimensions(file),
  ]);

  const device = detectDevice();
  options.onStage?.("anchoring");

  const response = await fetch("/api/proof", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      sha256,
      clientCapturedAt: options.clientCapturedAt ?? new Date().toISOString(),
      captureMode: options.captureMode,
      metadata: {
        fileName: file.name || "capture.jpg",
        fileType: file.type || "image/jpeg",
        fileSize: file.size,
        width: dimensions.width,
        height: dimensions.height,
        lastModified: file.lastModified || undefined,
        captureMode: options.captureMode,
        exif,
        device: { ...device, cameraFacing: options.cameraFacing },
      },
    }),
  });

  if (!response.ok) {
    let message = "The anchoring service is temporarily unavailable. Please retry.";
    try {
      const body = (await response.json()) as { error?: string };
      if (body?.error) message = body.error;
    } catch {
      // keep default
    }
    if (response.status >= 500) {
      message = `${message} If this keeps happening, download the file and retry.`;
    }
    throw new Error(message);
  }

  const body = (await response.json()) as CreateProofResponse;
  stashProofRecord(body.record);
  return { record: body.record, existing: body.existing, sha256 };
}

export async function hashFileLocally(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  return sha256Hex(buffer);
}
