import { promises as fs } from "node:fs";
import path from "node:path";
import { randomBytes } from "node:crypto";
import type { Review, ReviewInput, ReviewStats } from "./reviews-types";

const DATA_DIR = path.join(process.cwd(), ".data");
const REVIEW_FILE = path.join(DATA_DIR, "reviews.json");
const MAX_REVIEWS = 5000;
const REDIS_KEY = "proofdrop:reviews";

export const REVIEW_USE_CASES = [
  "Marketplace sale",
  "Rental condition",
  "Delivery proof",
  "Freelance handover",
  "Insurance claim",
  "Other",
] as const;

interface MemoryReviews {
  reviews: Review[] | null;
  fsWritable: boolean | null;
}

const globalRef = globalThis as typeof globalThis & {
  __proofdropReviews?: MemoryReviews;
};

const memory: MemoryReviews = (globalRef.__proofdropReviews ??= {
  reviews: null,
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

let writeQueue: Promise<void> = Promise.resolve();

async function ensureDir(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

function parseReviews(raw: unknown): Review[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (item): item is Review =>
      Boolean(item) &&
      typeof item === "object" &&
      typeof (item as Review).id === "string" &&
      typeof (item as Review).rating === "number",
  );
}

async function canUseFilesystem(): Promise<boolean> {
  if (memory.fsWritable !== null) return memory.fsWritable;
  try {
    await ensureDir();
    memory.fsWritable = true;
  } catch {
    memory.fsWritable = false;
  }
  return memory.fsWritable;
}

async function readAll(): Promise<Review[]> {
  const fromRedis = await redisCommand<string>(["GET", REDIS_KEY]);
  if (fromRedis) {
    try {
      const parsed = parseReviews(JSON.parse(fromRedis));
      memory.reviews = parsed;
      return parsed;
    } catch {
      // fall through
    }
  }

  if (await canUseFilesystem()) {
    try {
      const raw = await fs.readFile(REVIEW_FILE, "utf8");
      const parsed = parseReviews(JSON.parse(raw) as unknown);
      memory.reviews = parsed;
      return parsed;
    } catch {
      // fall through to memory
    }
  }

  return memory.reviews ?? [];
}

async function writeAll(reviews: Review[]): Promise<void> {
  const trimmed = reviews.slice(-MAX_REVIEWS);
  memory.reviews = trimmed;

  const stored = await redisCommand<string>([
    "SET",
    REDIS_KEY,
    JSON.stringify(trimmed),
  ]);
  if (stored === "OK") return;

  if (!(await canUseFilesystem())) return;

  try {
    const temp = `${REVIEW_FILE}.${process.pid}.${Date.now()}.tmp`;
    await fs.writeFile(temp, JSON.stringify(trimmed, null, 2), { mode: 0o600 });
    await fs.rename(temp, REVIEW_FILE);
  } catch {
    memory.fsWritable = false;
  }
}

function sanitize(value: string | undefined, max: number): string | undefined {
  if (typeof value !== "string") return undefined;
  const clean = value.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim();
  if (!clean) return undefined;
  return clean.slice(0, max);
}

const FEATURE_HINTS: { key: string; patterns: RegExp[] }[] = [
  { key: "Bulk / batch proofs", patterns: [/bulk/i, /batch/i, /mass upload/i, /many files/i] },
  { key: "Team accounts", patterns: [/team/i, /multi-?user/i, /organization/i, /seats?/i] },
  { key: "PDF forensic export", patterns: [/\bpdf\b/i, /export/i, /printable/i, /report file/i] },
  { key: "Mobile app", patterns: [/\bios\b/i, /\bandroid\b/i, /mobile app/i, /app store/i] },
  { key: "API / webhooks", patterns: [/\bapi\b/i, /webhook/i, /integration/i, /zapier/i] },
  { key: "Offline mode", patterns: [/offline/i, /no internet/i, /airplane/i] },
  { key: "Blockchain anchor", patterns: [/blockchain/i, /on-?chain/i, /nft/i, /ledger/i] },
  { key: "Multi-language", patterns: [/translat/i, /language/i, /\bi18n\b/i, /spanish|french|german|hindi/i] },
  { key: "Faster hashing", patterns: [/slow/i, /speed/i, /faster/i, /performance/i] },
  { key: "Video proofs", patterns: [/video/i, /clip/i, /recording/i] },
  { key: "Folder / album proofs", patterns: [/folder/i, /album/i, /multiple photos/i, /gallery/i] },
  { key: "Watermark / branding", patterns: [/watermark/i, /branding/i, /logo/i, /white ?label/i] },
];

export function extractFeatureRequests(reviews: Review[]): { feature: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const review of reviews) {
    const text = `${review.title} ${review.body}`;
    for (const hint of FEATURE_HINTS) {
      if (hint.patterns.some((pattern) => pattern.test(text))) {
        counts.set(hint.key, (counts.get(hint.key) ?? 0) + 1);
      }
    }
  }
  return [...counts.entries()]
    .map(([feature, count]) => ({ feature, count }))
    .sort((a, b) => b.count - a.count);
}

export async function listReviews(options?: {
  includeUnpublished?: boolean;
  limit?: number;
}): Promise<Review[]> {
  const all = await readAll();
  const filtered = options?.includeUnpublished
    ? all
    : all.filter((review) => review.published !== false);
  const sorted = filtered.sort(
    (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt),
  );
  return options?.limit ? sorted.slice(0, options.limit) : sorted;
}

export async function createReview(
  input: ReviewInput,
  userAgent?: string,
): Promise<Review> {
  const review: Review = {
    id: randomBytes(8).toString("hex"),
    name: sanitize(input.name, 60) ?? "Anonymous",
    role: sanitize(input.role, 80),
    rating: Math.min(5, Math.max(1, Math.round(input.rating))),
    title: sanitize(input.title, 120) ?? "Untitled review",
    body: sanitize(input.body, 1200) ?? "",
    useCase: sanitize(input.useCase, 60),
    email: sanitize(input.email, 160),
    createdAt: new Date().toISOString(),
    published: true,
    helpful: 0,
    userAgent: sanitize(userAgent, 200),
  };

  writeQueue = writeQueue.then(async () => {
    const all = await readAll();
    all.push(review);
    await writeAll(all);
  });
  await writeQueue;

  return review;
}

export async function incrementHelpful(id: string): Promise<boolean> {
  let found = false;
  writeQueue = writeQueue.then(async () => {
    const all = await readAll();
    const target = all.find((review) => review.id === id);
    if (target) {
      target.helpful = (target.helpful ?? 0) + 1;
      found = true;
      await writeAll(all);
    }
  });
  await writeQueue;
  return found;
}

export async function setPublished(id: string, published: boolean): Promise<boolean> {
  let found = false;
  writeQueue = writeQueue.then(async () => {
    const all = await readAll();
    const target = all.find((review) => review.id === id);
    if (target) {
      target.published = published;
      found = true;
      await writeAll(all);
    }
  });
  await writeQueue;
  return found;
}

export async function deleteReview(id: string): Promise<boolean> {
  let found = false;
  writeQueue = writeQueue.then(async () => {
    const all = await readAll();
    const next = all.filter((review) => review.id !== id);
    found = next.length !== all.length;
    if (found) await writeAll(next);
  });
  await writeQueue;
  return found;
}

export async function reviewStats(): Promise<ReviewStats> {
  const all = await readAll();
  const published = all.filter((review) => review.published !== false);
  const ratingBreakdown: Record<1 | 2 | 3 | 4 | 5, number> = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
  };
  let sum = 0;
  for (const review of published) {
    const key = Math.min(5, Math.max(1, Math.round(review.rating))) as 1 | 2 | 3 | 4 | 5;
    ratingBreakdown[key] += 1;
    sum += key;
  }

  const useCaseCounts = new Map<string, number>();
  for (const review of published) {
    if (!review.useCase) continue;
    useCaseCounts.set(review.useCase, (useCaseCounts.get(review.useCase) ?? 0) + 1);
  }

  return {
    total: all.length,
    published: published.length,
    averageRating: published.length ? sum / published.length : 0,
    requestedFeatures: extractFeatureRequests(all),
    useCases: [...useCaseCounts.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count),
    ratingBreakdown,
  };
}

export async function hasReviews(): Promise<boolean> {
  const all = await readAll();
  return all.length > 0;
}
