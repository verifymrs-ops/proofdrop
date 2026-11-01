export function cn(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(" ");
}

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const exponent = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );
  const value = bytes / Math.pow(1024, exponent);
  const precision = value >= 100 || exponent === 0 ? 0 : value >= 10 ? 1 : 2;
  return `${value.toFixed(precision)} ${units[exponent]}`;
}

export function formatDateTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Unknown";
  const formatted = new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone: "UTC",
  }).format(date);
  return `${formatted} UTC`;
}

export function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Unknown";
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    timeZone: "UTC",
  }).format(date);
}

export function formatRelative(iso: string): string {
  const date = new Date(iso).getTime();
  if (Number.isNaN(date)) return "Unknown";
  const diff = Date.now() - date;
  const minutes = Math.round(diff / 60000);
  if (Math.abs(minutes) < 1) return "just now";
  if (Math.abs(minutes) < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (Math.abs(days) < 30) return `${days}d ago`;
  return formatDate(iso);
}

export function shortHash(hash: string, head = 10, tail = 6): string {
  if (hash.length <= head + tail + 1) return hash;
  return `${hash.slice(0, head)}…${hash.slice(-tail)}`;
}

export function chunkHash(hash: string, size = 8): string[] {
  const chunks: string[] = [];
  for (let index = 0; index < hash.length; index += size) {
    chunks.push(hash.slice(index, index + size));
  }
  return chunks;
}

export function fileKindLabel(fileType: string): string {
  if (!fileType) return "Binary";
  const [, subtype = ""] = fileType.split("/");
  const map: Record<string, string> = {
    jpeg: "JPEG image",
    jpg: "JPEG image",
    png: "PNG image",
    webp: "WebP image",
    heic: "HEIC image",
    heif: "HEIF image",
    gif: "GIF image",
    pdf: "PDF document",
    plain: "Text document",
    "vnd.openxmlformats-officedocument.wordprocessingml.document": "Word document",
  };
  return map[subtype] ?? `${subtype.toUpperCase() || "Binary"} file`;
}

export function initialsFromName(name: string): string {
  const clean = name.replace(/\.[^.]+$/, "").trim();
  if (!clean) return "PD";
  return clean
    .split(/[\s._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}
