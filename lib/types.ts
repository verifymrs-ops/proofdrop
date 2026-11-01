export type ProofStatus = "verified" | "flagged";

export type CaptureMode = "camera" | "upload";

export type CheckStatus = "pass" | "warn" | "fail";

export interface ProofCheck {
  id: string;
  label: string;
  status: CheckStatus;
  detail: string;
}

export interface ProofExif {
  present: boolean;
  make?: string;
  model?: string;
  lens?: string;
  software?: string;
  takenAt?: string;
  gps?: boolean;
  iso?: number;
  fNumber?: number;
  exposureTime?: string;
  orientation?: number;
}

export interface ProofDevice {
  platform?: string;
  browser?: string;
  timezone?: string;
  locale?: string;
  screen?: string;
  cameraFacing?: string;
}

export interface ProofMetadata {
  fileName: string;
  fileType: string;
  fileSize: number;
  width?: number;
  height?: number;
  lastModified?: number;
  captureMode: CaptureMode;
  exif: ProofExif;
  device: ProofDevice;
  checks: ProofCheck[];
}

export interface ProofAnchor {
  algorithm: "HMAC-SHA256";
  version: string;
  node: string;
  anchoredAt: string;
  metaDigest: string;
  digest: string;
  signature: string;
}

export interface ProofRecord {
  hashId: string;
  sha256: string;
  status: ProofStatus;
  statusLabel: string;
  reasons: string[];
  createdAt: string;
  clientCapturedAt: string;
  captureMode: CaptureMode;
  metadata: ProofMetadata;
  anchor: ProofAnchor;
}

export interface ProofEvaluation {
  status: ProofStatus;
  statusLabel: string;
  reasons: string[];
  checks: ProofCheck[];
}

export interface CreateProofInput {
  sha256: string;
  clientCapturedAt: string;
  captureMode: CaptureMode;
  metadata: ProofMetadata;
}

export interface CreateProofResponse {
  record: ProofRecord;
  existing: boolean;
}

export interface AnchorVerifyResponse {
  valid: boolean;
  signatureValid: boolean;
  digestValid: boolean;
  hashMatch?: boolean;
  algorithm: string;
  node: string;
  anchoredAt: string;
  status: ProofStatus;
  message: string;
}
