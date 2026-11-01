import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { cookies } from "next/headers";

const DATA_DIR = path.join(process.cwd(), ".data");
const PASSWORD_FILE = path.join(DATA_DIR, "admin-password");
const SECRET_FILE = path.join(DATA_DIR, "admin-secret");

export const ADMIN_COOKIE = "proofdrop_admin";
const SESSION_TTL_MS = 12 * 60 * 60 * 1000;

let cachedSecret: string | null = null;
let cachedPassword: string | null = null;

async function ensureDir(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

function envPassword(): string | undefined {
  const value = process.env.PROOFDROP_ADMIN_PASSWORD;
  return value && value.length >= 8 ? value : undefined;
}

export async function getAdminPassword(): Promise<string> {
  if (cachedPassword) return cachedPassword;
  const fromEnv = envPassword();
  if (fromEnv) {
    cachedPassword = fromEnv;
    return cachedPassword;
  }
  try {
    const stored = (await fs.readFile(PASSWORD_FILE, "utf8")).trim();
    if (stored.length >= 8) {
      cachedPassword = stored;
      return cachedPassword;
    }
  } catch {
    // generate below
  }
  const generated = `pd_${randomBytes(9).toString("base64url")}`;
  try {
    await ensureDir();
    await fs.writeFile(PASSWORD_FILE, generated, { mode: 0o600 });
  } catch {
    // Read-only filesystem (e.g. Vercel). Keep a process-scoped password; for
    // durable admin access set PROOFDROP_ADMIN_PASSWORD.
  }
  cachedPassword = generated;
  return cachedPassword;
}

async function getSecret(): Promise<string> {
  if (cachedSecret) return cachedSecret;
  const fromEnv = process.env.PROOFDROP_ADMIN_SECRET;
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
    // generate below
  }
  const generated = randomBytes(32).toString("hex");
  try {
    await ensureDir();
    await fs.writeFile(SECRET_FILE, generated, { mode: 0o600 });
  } catch {
    // Read-only filesystem (e.g. Vercel). Process-scoped secret; set
    // PROOFDROP_ADMIN_SECRET for stable sessions across instances.
  }
  cachedSecret = generated;
  return cachedSecret;
}

function sign(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload, "utf8").digest("hex");
}

function safeEqual(a: string, b: string): boolean {
  const bufferA = Buffer.from(a, "utf8");
  const bufferB = Buffer.from(b, "utf8");
  if (bufferA.length !== bufferB.length) return false;
  return timingSafeEqual(bufferA, bufferB);
}

export async function verifyPassword(candidate: string): Promise<boolean> {
  const expected = await getAdminPassword();
  return safeEqual(candidate, expected);
}

export async function createSessionToken(): Promise<string> {
  const secret = await getSecret();
  const expires = Date.now() + SESSION_TTL_MS;
  const payload = `owner.${expires}`;
  const signature = sign(payload, secret);
  return `${payload}.${signature}`;
}

export async function isValidSessionToken(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [scope, expiresRaw, signature] = parts;
  if (scope !== "owner") return false;
  const expires = Number(expiresRaw);
  if (!Number.isFinite(expires) || expires < Date.now()) return false;
  const secret = await getSecret();
  const expected = sign(`${scope}.${expiresRaw}`, secret);
  return safeEqual(expected, signature);
}

export async function isOwner(): Promise<boolean> {
  const store = await cookies();
  const token = store.get(ADMIN_COOKIE)?.value;
  return isValidSessionToken(token);
}

export const ADMIN_SESSION_TTL_SECONDS = SESSION_TTL_MS / 1000;
