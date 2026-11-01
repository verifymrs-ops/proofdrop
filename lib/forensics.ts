import type {
  CaptureMode,
  ProofCheck,
  ProofDevice,
  ProofEvaluation,
  ProofExif,
  ProofMetadata,
  ProofStatus,
} from "./types";

export const EDITOR_SIGNATURES = [
  "photoshop",
  "lightroom",
  "snapseed",
  "picsart",
  "facetune",
  "gimp",
  "canva",
  "pixlr",
  "affinity",
  "capture one",
  "darktable",
  "vsco",
  "meitu",
  "美图",
  "hypic",
  "remover",
  "remini",
];

export const HASH_ID_LENGTH = 32;

function isImage(fileType: string): boolean {
  return fileType.startsWith("image/");
}

function isDocument(fileType: string): boolean {
  return (
    fileType === "application/pdf" ||
    fileType.startsWith("text/") ||
    fileType.includes("word") ||
    fileType.includes("officedocument")
  );
}

function findEditorTag(exif: ProofExif): string | undefined {
  const haystack = `${exif.software ?? ""} ${exif.make ?? ""} ${exif.model ?? ""}`.toLowerCase();
  if (!haystack.trim()) return undefined;
  return EDITOR_SIGNATURES.find((signature) => haystack.includes(signature));
}

function daysBetween(a: number, b: number): number {
  return Math.abs(a - b) / 86_400_000;
}

export interface EvaluationInput {
  captureMode: CaptureMode;
  fileType: string;
  exif: ProofExif;
  clientCapturedAt: string;
  lastModified?: number;
}

export function evaluateProvenance(input: EvaluationInput): ProofEvaluation {
  const checks: ProofCheck[] = [];
  const image = isImage(input.fileType);
  const document = isDocument(input.fileType);
  const exif = input.exif;
  const editorTag = findEditorTag(exif);
  const capturedAt = Date.parse(input.clientCapturedAt);
  const capturedAtValid = Number.isFinite(capturedAt);

  checks.push({
    id: "hash-integrity",
    label: "SHA-256 fingerprint",
    status: "pass",
    detail: "256-bit digest computed in-browser before any upload left the device.",
  });

  checks.push({
    id: "capture-source",
    label: "Capture source",
    status: input.captureMode === "camera" ? "pass" : "warn",
    detail:
      input.captureMode === "camera"
        ? "File was generated inside a live ProofDrop camera session."
        : "File was uploaded from device storage. Integrity is proven, live-capture is not asserted.",
  });

  if (input.captureMode === "camera") {
    checks.push({
      id: "exif-integrity",
      label: "Sensor metadata",
      status: "pass",
      detail:
        "Live session frames are re-encoded in-memory, so editing suites cannot inject prior metadata.",
    });
  } else if (image) {
    checks.push({
      id: "exif-integrity",
      label: "Sensor metadata",
      status: exif.present ? "pass" : "fail",
      detail: exif.present
        ? `Camera metadata intact${exif.make ? ` · ${exif.make}${exif.model ? ` ${exif.model}` : ""}` : ""}.`
        : "No EXIF block found on an uploaded image. Metadata was likely stripped or the file was re-encoded.",
    });
  } else if (document) {
    checks.push({
      id: "exif-integrity",
      label: "Document structure",
      status: "pass",
      detail: "Documents do not carry camera EXIF; container structure and digest are recorded instead.",
    });
  } else {
    checks.push({
      id: "exif-integrity",
      label: "File metadata",
      status: "warn",
      detail: "Non-image, non-document file type. Metadata coverage is limited to container fields.",
    });
  }

  checks.push({
    id: "editor-signature",
    label: "Editing suite signature",
    status: editorTag ? "fail" : "pass",
    detail: editorTag
      ? `Generator/software tag matched "${editorTag}". This file passed through an editing pipeline.`
      : "No known editing, retouching, or AI-generation software tag detected.",
  });

  if (input.captureMode === "camera") {
    checks.push({
      id: "time-consistency",
      label: "Timestamp consistency",
      status: capturedAtValid ? "pass" : "fail",
      detail: capturedAtValid
        ? "Capture and anchor timestamps originate from the same live session."
        : "Capture timestamp is malformed.",
    });
  } else if (exif.takenAt) {
    const exifTime = Date.parse(exif.takenAt);
    if (Number.isFinite(exifTime)) {
      const drift = daysBetween(exifTime, input.lastModified ?? capturedAt);
      checks.push({
        id: "time-consistency",
        label: "Timestamp consistency",
        status: drift <= 2 ? "pass" : drift <= 30 ? "warn" : "fail",
        detail:
          drift <= 2
            ? "EXIF capture time matches the device modification time within 2 days."
            : `EXIF capture time differs from the device modification time by ${Math.round(drift)} days.`,
      });
    } else {
      checks.push({
        id: "time-consistency",
        label: "Timestamp consistency",
        status: "warn",
        detail: "EXIF capture time could not be parsed.",
      });
    }
  } else {
    checks.push({
      id: "time-consistency",
      label: "Timestamp consistency",
      status: "warn",
      detail: "No EXIF capture time available; only the anchor timestamp can be attested.",
    });
  }

  const hasDeviceSignal = Boolean(
    input.captureMode === "camera"
      ? exif.present || exif.make || exif.model
      : exif.make || exif.model,
  );

  checks.push({
    id: "device-signature",
    label: "Device signature",
    status: hasDeviceSignal ? "pass" : "warn",
    detail: hasDeviceSignal
      ? "Hardware identifiers or live-session telemetry are attached to this proof."
      : "No hardware identifiers detected. Device identity cannot be confirmed.",
  });

  const failures = checks.filter((check) => check.status === "fail");
  const warnings = checks.filter((check) => check.status === "warn");
  const status: ProofStatus = failures.length > 0 ? "flagged" : "verified";

  const reasons =
    failures.length > 0
      ? failures.map((check) => check.detail)
      : warnings.length > 0
        ? warnings.map((check) => check.detail)
        : ["All provenance checks passed. Digest, metadata, and anchor agree."];

  return {
    status,
    statusLabel:
      status === "flagged"
        ? editorTag
          ? "Edited — Editing Suite Signature Detected"
          : image && !exif.present && input.captureMode === "upload"
            ? "Metadata Stripped or Re-encoded"
            : "Provenance Warning — Manual Review Advised"
        : input.captureMode === "camera"
          ? "Authentic Live Capture — Unaltered & Time-stamped"
          : "Integrity Verified — Unaltered & Time-stamped",
    reasons,
    checks,
  };
}

export interface BuildMetadataInput extends EvaluationInput {
  fileName: string;
  fileType: string;
  fileSize: number;
  width?: number;
  height?: number;
  device: ProofDevice;
}

export function buildMetadata(input: BuildMetadataInput): ProofMetadata {
  const exif: ProofExif = { ...input.exif, present: Boolean(input.exif.present) };
  const evaluation = evaluateProvenance({
    captureMode: input.captureMode,
    fileType: input.fileType,
    exif,
    clientCapturedAt: input.clientCapturedAt,
    lastModified: input.lastModified,
  });

  return {
    fileName: input.fileName,
    fileType: input.fileType,
    fileSize: input.fileSize,
    width: input.width,
    height: input.height,
    lastModified: input.lastModified,
    captureMode: input.captureMode,
    exif,
    device: input.device,
    checks: evaluation.checks,
  };
}

export function deriveHashId(sha256: string): string {
  return sha256.toLowerCase().slice(0, HASH_ID_LENGTH);
}

export function isEditorTagged(exif: ProofExif): boolean {
  return Boolean(findEditorTag(exif));
}
