"use client";

import type { ProofExif } from "./types";

export const MAX_FILE_BYTES = 25 * 1024 * 1024;

export interface HashProgress {
  stage: "reading" | "hashing" | "metadata" | "done";
  percent: number;
}

export async function sha256Hex(buffer: ArrayBuffer): Promise<string> {
  if (typeof crypto === "undefined" || !crypto.subtle) {
    throw new Error(
      "Web Crypto is unavailable. Open ProofDrop over HTTPS or localhost to enable client-side hashing.",
    );
  }
  const digest = await crypto.subtle.digest("SHA-256", buffer);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function sha256OfText(text: string): Promise<string> {
  return sha256Hex(new TextEncoder().encode(text).buffer as ArrayBuffer);
}

let exifrModule: typeof import("exifr") | null = null;

async function getExifr() {
  if (exifrModule) return exifrModule;
  exifrModule = await import("exifr");
  return exifrModule;
}

export async function extractExif(
  file: File | Blob,
  fileType: string,
): Promise<ProofExif> {
  if (!fileType.startsWith("image/")) return { present: false };

  try {
    const exifr = await getExifr();
    const raw = (await exifr.parse(file, {
      tiff: true,
      exif: true,
      gps: true,
      mergeOutput: true,
      reviveValues: true,
      translateValues: true,
      translateKeys: true,
      sanitize: true,
    })) as Record<string, unknown> | undefined;

    if (!raw) return { present: false };

    const meaningfulKeys = [
      "Make",
      "Model",
      "LensModel",
      "Lens",
      "Software",
      "ProcessingSoftware",
      "DateTimeOriginal",
      "CreateDate",
      "ModifyDate",
      "DateTime",
      "ExposureTime",
      "FNumber",
      "ApertureValue",
      "ISO",
      "ISOSpeedRatings",
      "Orientation",
      "latitude",
      "GPSLatitude",
      "GPSLatitudeRef",
      "ColorSpace",
    ];
    if (!meaningfulKeys.some((key) => key in raw)) {
      return { present: false };
    }

    const asString = (value: unknown): string | undefined =>
      typeof value === "string" && value.trim() ? value.trim() : undefined;
    const asNumber = (value: unknown): number | undefined =>
      typeof value === "number" && Number.isFinite(value) ? value : undefined;

    const taken =
      raw.DateTimeOriginal ?? raw.CreateDate ?? raw.ModifyDate ?? raw.DateTime;
    let takenAt: string | undefined;
    if (taken instanceof Date && !Number.isNaN(taken.getTime())) {
      takenAt = taken.toISOString();
    }

    const exposure = asNumber(raw.ExposureTime);

    return {
      present: true,
      make: asString(raw.Make),
      model: asString(raw.Model),
      lens: asString(raw.LensModel) ?? asString(raw.Lens),
      software: asString(raw.Software) ?? asString(raw.ProcessingSoftware),
      takenAt,
      gps:
        typeof raw.latitude === "number" ||
        typeof raw.GPSLatitude === "number" ||
        Boolean(raw.GPSLatitudeRef),
      iso: asNumber(raw.ISO) ?? asNumber(raw.ISOSpeedRatings),
      fNumber: asNumber(raw.FNumber) ?? asNumber(raw.ApertureValue),
      exposureTime:
        exposure !== undefined
          ? exposure >= 1
            ? `${exposure}s`
            : `1/${Math.round(1 / exposure)}s`
          : undefined,
      orientation: asNumber(raw.Orientation),
    };
  } catch {
    return { present: false };
  }
}

export function readImageDimensions(
  file: File,
): Promise<{ width?: number; height?: number }> {
  if (!file.type.startsWith("image/")) return Promise.resolve({});
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      resolve({ width: image.naturalWidth, height: image.naturalHeight });
      URL.revokeObjectURL(url);
    };
    image.onerror = () => {
      resolve({});
      URL.revokeObjectURL(url);
    };
    image.src = url;
  });
}

export function detectDevice(): {
  platform?: string;
  browser?: string;
  timezone?: string;
  locale?: string;
  screen?: string;
} {
  if (typeof navigator === "undefined") return {};
  const ua = navigator.userAgent;
  const platform = /Android/i.test(ua)
    ? "Android"
    : /iPhone|iPad|iPod/i.test(ua)
      ? "iOS"
      : /Macintosh/i.test(ua)
        ? "macOS"
        : /Windows/i.test(ua)
          ? "Windows"
          : /Linux/i.test(ua)
            ? "Linux"
            : "Unknown";

  const browser = /Edg\//.test(ua)
    ? "Edge"
    : /OPR\//.test(ua)
      ? "Opera"
      : /Chrome\//.test(ua)
        ? "Chrome"
        : /Firefox\//.test(ua)
          ? "Firefox"
          : /Safari\//.test(ua)
            ? "Safari"
            : "Unknown";

  const timezone =
    typeof Intl !== "undefined"
      ? Intl.DateTimeFormat().resolvedOptions().timeZone
      : undefined;

  return {
    platform,
    browser,
    timezone,
    locale: navigator.language,
    screen:
      typeof window !== "undefined"
        ? `${window.screen.width}×${window.screen.height}`
        : undefined,
  };
}

export async function canvasToBlob(
  canvas: HTMLCanvasElement,
  type = "image/jpeg",
  quality = 0.92,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Unable to encode capture frame."));
      },
      type,
      quality,
    );
  });
}
