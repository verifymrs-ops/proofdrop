import { promises as fs } from "node:fs";
import path from "node:path";
import type { ProofRecord } from "./types";

const DATA_DIR = path.join(process.cwd(), ".data");
const PROOF_DIR = path.join(DATA_DIR, "proofs");
const HASH_ID_PATTERN = /^[a-f0-9]{32}$/;

function proofPath(hashId: string): string {
  return path.join(PROOF_DIR, `${hashId}.json`);
}

export function isValidHashId(hashId: string): boolean {
  return HASH_ID_PATTERN.test(hashId);
}

export async function ensureStore(): Promise<void> {
  await fs.mkdir(PROOF_DIR, { recursive: true });
}

export async function readProof(hashId: string): Promise<ProofRecord | null> {
  if (!isValidHashId(hashId)) return null;
  try {
    const raw = await fs.readFile(proofPath(hashId), "utf8");
    return JSON.parse(raw) as ProofRecord;
  } catch {
    return null;
  }
}

export async function writeProof(record: ProofRecord): Promise<void> {
  if (!isValidHashId(record.hashId)) {
    throw new Error("Invalid hash id.");
  }
  await ensureStore();
  const target = proofPath(record.hashId);
  const temp = `${target}.${process.pid}.${Date.now()}.tmp`;
  await fs.writeFile(temp, JSON.stringify(record, null, 2), { mode: 0o600 });
  await fs.rename(temp, target);
}

export async function listProofs(limit = 24): Promise<ProofRecord[]> {
  try {
    const files = await fs.readdir(PROOF_DIR);
    const records: ProofRecord[] = [];
    for (const file of files) {
      if (!file.endsWith(".json")) continue;
      const record = await readProof(file.replace(/\.json$/, ""));
      if (record) records.push(record);
    }
    return records
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
      .slice(0, limit);
  } catch {
    return [];
  }
}

export async function proofStats(): Promise<{
  total: number;
  verified: number;
  flagged: number;
}> {
  const records = await listProofs(500);
  return {
    total: records.length,
    verified: records.filter((record) => record.status === "verified").length,
    flagged: records.filter((record) => record.status === "flagged").length,
  };
}
