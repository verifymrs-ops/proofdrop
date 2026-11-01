import { promises as fs } from "node:fs";
import path from "node:path";
import type { ProofRecord } from "./types";

const DATA_DIR = path.join(process.cwd(), ".data");
const PROOF_DIR = path.join(DATA_DIR, "proofs");
const HASH_ID_PATTERN = /^[a-f0-9]{32}$/;
const MEMORY_LIMIT = 500;
const REDIS_KEY = "proofdrop:proofs";

interface MemoryStore {
  proofs: Map<string, ProofRecord>;
  fsWritable: boolean | null;
}

const globalRef = globalThis as typeof globalThis & {
  __proofdropMemory?: MemoryStore;
};

const memory: MemoryStore = (globalRef.__proofdropMemory ??= {
  proofs: new Map<string, ProofRecord>(),
  fsWritable: null,
});

interface RedisConfig {
  url: string;
  token: string;
}

function redisConfig(): RedisConfig | null {
  const url =
    process.env.KV_REST_API_URL ??
    process.env.UPSTASH_REDIS_REST_URL ??
    process.env.PROOFDROP_REDIS_URL;
  const token =
    process.env.KV_REST_API_TOKEN ??
    process.env.UPSTASH_REDIS_REST_TOKEN ??
    process.env.PROOFDROP_REDIS_TOKEN;
  if (!url || !token) return null;
  return { url: url.replace(/\/$/, ""), token };
}

async function redisCommand<T = unknown>(command: string[]): Promise<T | null> {
  const config = redisConfig();
  if (!config) return null;
  try {
    const response = await fetch(config.url, {
      method: "POST",
      headers: {
        authorization: `Bearer ${config.token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify(command),
      cache: "no-store",
    });
    if (!response.ok) return null;
    const payload = (await response.json()) as { result?: T; error?: string };
    if (payload.error) return null;
    return payload.result ?? null;
  } catch {
    return null;
  }
}

function proofPath(hashId: string): string {
  return path.join(PROOF_DIR, `${hashId}.json`);
}

function remember(record: ProofRecord): void {
  memory.proofs.set(record.hashId, record);
  if (memory.proofs.size > MEMORY_LIMIT) {
    const oldest = memory.proofs.keys().next().value;
    if (oldest) memory.proofs.delete(oldest);
  }
}

export function isValidHashId(hashId: string): boolean {
  return HASH_ID_PATTERN.test(hashId);
}

async function canUseFilesystem(): Promise<boolean> {
  if (memory.fsWritable !== null) return memory.fsWritable;
  try {
    await fs.mkdir(PROOF_DIR, { recursive: true });
    memory.fsWritable = true;
  } catch {
    memory.fsWritable = false;
  }
  return memory.fsWritable;
}

export async function ensureStore(): Promise<boolean> {
  return canUseFilesystem();
}

export async function readProof(hashId: string): Promise<ProofRecord | null> {
  if (!isValidHashId(hashId)) return null;

  const cached = memory.proofs.get(hashId);
  if (cached) return cached;

  const fromRedis = await redisCommand<string>(["HGET", REDIS_KEY, hashId]);
  if (fromRedis) {
    try {
      const record = JSON.parse(fromRedis) as ProofRecord;
      remember(record);
      return record;
    } catch {
      // fall through
    }
  }

  if (await canUseFilesystem()) {
    try {
      const raw = await fs.readFile(proofPath(hashId), "utf8");
      const record = JSON.parse(raw) as ProofRecord;
      remember(record);
      return record;
    } catch {
      // fall through to null
    }
  }

  return null;
}

/**
 * Persist a proof without ever failing the request on read-only serverless
 * filesystems (e.g. Vercel). Order of durability: Redis REST (when configured)
 * > local filesystem > per-instance memory. The record is always cached in
 * memory so the current instance can serve it immediately.
 */
export async function writeProof(record: ProofRecord): Promise<boolean> {
  if (!isValidHashId(record.hashId)) {
    throw new Error("Invalid hash id.");
  }

  remember(record);

  const serialized = JSON.stringify(record);
  const redisResult = await redisCommand<number>([
    "HSET",
    REDIS_KEY,
    record.hashId,
    serialized,
  ]);
  if (typeof redisResult === "number") return true;

  if (!(await canUseFilesystem())) return false;

  try {
    const target = proofPath(record.hashId);
    const temp = `${target}.${process.pid}.${Date.now()}.tmp`;
    await fs.writeFile(temp, JSON.stringify(record, null, 2), { mode: 0o600 });
    await fs.rename(temp, target);
    return true;
  } catch {
    memory.fsWritable = false;
    return false;
  }
}

export async function listProofs(limit = 24): Promise<ProofRecord[]> {
  const collected = new Map<string, ProofRecord>(memory.proofs);

  const fromRedis = await redisCommand<Record<string, string>>([
    "HGETALL",
    REDIS_KEY,
  ]);
  if (fromRedis && typeof fromRedis === "object") {
    for (const raw of Object.values(fromRedis)) {
      try {
        const record = JSON.parse(raw) as ProofRecord;
        if (!collected.has(record.hashId)) collected.set(record.hashId, record);
      } catch {
        // skip malformed entries
      }
    }
  }

  if (await canUseFilesystem()) {
    try {
      const files = await fs.readdir(PROOF_DIR);
      for (const file of files) {
        if (!file.endsWith(".json")) continue;
        const hashId = file.replace(/\.json$/, "");
        if (collected.has(hashId)) continue;
        const record = await readProof(hashId);
        if (record) collected.set(record.hashId, record);
      }
    } catch {
      // ignore, memory/redis records still returned
    }
  }

  return [...collected.values()]
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
    .slice(0, limit);
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

export function isPersistentStore(): boolean {
  return memory.fsWritable === true || redisConfig() !== null;
}
