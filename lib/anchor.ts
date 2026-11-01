import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { stableStringify, type CanonicalValue } from "./canonical";
import type { ProofAnchor, ProofRecord } from "./types";

const ANCHOR_VERSION = "pd-anchor/1.2";
const ANCHOR_NODE = "proofdrop-anchor-eu-01";
const DATA_DIR = path.join(process.cwd(), ".data");
const SECRET_FILE = path.join(DATA_DIR, "anchor-secret");

let cachedSecret: string | null = null;

async function loadSecret(): Promise<string> {
  if (cachedSecret) return cachedSecret;
  const fromEnv = process.env.PROOFDROP_ANCHOR_SECRET;
  if (fromEnv && fromEnv.length >= 16) {
    cachedSecret = fromEnv;
    return cachedSecret;
  }
  try {
    const stored = (await fs.readFile(SECRET_FILE, "utf8")).trim();
    if (stored.length >= 16) {
      cachedSecret = stored;
      return cachedSecret;
    }
  } catch {
    // fall through to generate
  }
  const generated = randomBytes(32).toString("hex");
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(SECRET_FILE, generated, { mode: 0o600 });
  } catch {
    // Read-only filesystem (e.g. Vercel). Fall back to a process-scoped secret
    // so anchoring still works within this instance's lifetime.
  }
  cachedSecret = generated;
  return cachedSecret;
}

export function sha256Hex(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

export function metaDigestOf(metadata: unknown): string {
  return sha256Hex(stableStringify(metadata as CanonicalValue));
}

function digestOf(record: Omit<ProofRecord, "anchor">, metaDigest: string): string {
  return sha256Hex(
    stableStringify({
      hashId: record.hashId,
      sha256: record.sha256,
      status: record.status,
      statusLabel: record.statusLabel,
      reasons: record.reasons,
      createdAt: record.createdAt,
      clientCapturedAt: record.clientCapturedAt,
      captureMode: record.captureMode,
      metaDigest,
    }),
  );
}

async function sign(digest: string): Promise<string> {
  const secret = await loadSecret();
  return createHmac("sha256", secret).update(digest, "utf8").digest("hex");
}

export async function createAnchor(
  record: Omit<ProofRecord, "anchor">,
  anchoredAt: string,
): Promise<ProofAnchor> {
  const metaDigest = metaDigestOf(record.metadata);
  const digest = digestOf(record, metaDigest);
  const signature = await sign(digest);
  return {
    algorithm: "HMAC-SHA256",
    version: ANCHOR_VERSION,
    node: ANCHOR_NODE,
    anchoredAt,
    metaDigest,
    digest,
    signature,
  };
}

export interface AnchorVerification {
  signatureValid: boolean;
  digestValid: boolean;
  metaDigestValid: boolean;
}

export async function verifyAnchor(
  record: ProofRecord,
): Promise<AnchorVerification> {
  const metaDigest = metaDigestOf(record.metadata);
  const expectedDigest = digestOf(record, metaDigest);
  const expectedSignature = await sign(expectedDigest);

  const safeEqual = (a: string, b: string): boolean => {
    const bufferA = Buffer.from(a, "utf8");
    const bufferB = Buffer.from(b, "utf8");
    if (bufferA.length !== bufferB.length) return false;
    return timingSafeEqual(bufferA, bufferB);
  };

  return {
    signatureValid: safeEqual(expectedSignature, record.anchor.signature),
    digestValid: safeEqual(expectedDigest, record.anchor.digest),
    metaDigestValid: safeEqual(metaDigest, record.anchor.metaDigest),
  };
}

export const anchorMeta = {
  version: ANCHOR_VERSION,
  node: ANCHOR_NODE,
};
