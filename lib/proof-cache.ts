import type { ProofRecord } from "./types";

const STORAGE_PREFIX = "proofdrop:record:";

export function stashProofRecord(record: ProofRecord): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      `${STORAGE_PREFIX}${record.hashId}`,
      JSON.stringify(record),
    );
  } catch {
    // storage unavailable (private mode / quota) — non-fatal
  }
}

export function loadStashedRecord(hashId: string): ProofRecord | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(`${STORAGE_PREFIX}${hashId}`);
    if (!raw) return null;
    return JSON.parse(raw) as ProofRecord;
  } catch {
    return null;
  }
}
