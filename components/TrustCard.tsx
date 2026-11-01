"use client";

import { motion } from "framer-motion";
import {
  Check,
  Clock,
  Copy,
  Fingerprint,
  QrCode,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";
import { useState } from "react";
import { cn, formatDateTime } from "@/lib/format";
import { StatusBadge } from "./StatusBadge";
import type { ProofRecord } from "@/lib/types";

function TruncatedHash({ hash }: { hash: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(hash);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <button
      type="button"
      onClick={copy}
      className="group flex w-full items-start gap-2 rounded-xl border border-lilac-200 bg-lilac-50 px-3 py-2.5 text-left transition hover:border-lilac-300 hover:bg-lilac-100"
    >
      <span className="min-w-0 flex-1 break-all font-mono text-[0.7rem] leading-relaxed text-ink-soft/80">
        {hash}
      </span>
      <span className="mt-0.5 shrink-0 text-lilac-500 transition group-hover:text-lilac-700">
        {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      </span>
    </button>
  );
}

export function TrustCard({
  record,
  qrDataUrl,
  shareUrl,
  compact = false,
}: {
  record: ProofRecord;
  qrDataUrl?: string;
  shareUrl?: string;
  compact?: boolean;
}) {
  const verified = record.status === "verified";
  const exif = record.metadata.exif;

  return (
    <motion.div
      initial={{ opacity: 0, y: 22, rotateX: 4 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
      className="relative w-full"
    >
      <div
        aria-hidden
        className={cn(
          "absolute -inset-[1px] rounded-[2rem] opacity-60 blur-xl",
          verified
            ? "bg-[linear-gradient(135deg,rgba(13,143,107,0.3),rgba(155,124,240,0.25),transparent_70%)]"
            : "bg-[linear-gradient(135deg,rgba(212,58,92,0.3),rgba(155,124,240,0.2),transparent_70%)]",
        )}
      />

      <div className="glass-panel noise-overlay relative overflow-hidden">
        <div
          aria-hidden
          className={cn(
            "absolute inset-x-0 top-0 h-px",
            verified
              ? "bg-gradient-to-r from-transparent via-verify/70 to-transparent"
              : "bg-gradient-to-r from-transparent via-danger/70 to-transparent",
          )}
        />

        <div className={cn("relative", compact ? "p-5 sm:p-6" : "p-6 sm:p-8")}>
          <header className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "relative grid h-11 w-11 place-items-center rounded-2xl border",
                  verified
                    ? "border-verify/25 bg-verify-soft"
                    : "border-danger/25 bg-danger-soft",
                )}
              >
                <Fingerprint
                  className={cn("h-5 w-5", verified ? "text-verify" : "text-danger")}
                />
              </div>
              <div>
                <p className="mono-label">ProofDrop trust report</p>
                <p className="mt-0.5 font-display text-[1.05rem] font-semibold tracking-tight text-ink">
                  {verified ? "Cryptographic integrity" : "Provenance warning"}
                </p>
              </div>
            </div>
            <StatusBadge
              status={record.status}
              label={verified ? "Verified" : "Flagged"}
              size={compact ? "sm" : "md"}
            />
          </header>

          <div
            className={cn(
              "mt-5 rounded-2xl border px-4 py-3.5",
              verified
                ? "border-verify/20 bg-verify-soft"
                : "border-danger/25 bg-danger-soft",
            )}
          >
            <div className="flex items-start gap-2.5">
              {verified ? (
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-verify" />
              ) : (
                <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-danger" />
              )}
              <div>
                <p
                  className={cn(
                    "text-sm font-semibold leading-snug",
                    verified ? "text-verify" : "text-danger",
                  )}
                >
                  {record.statusLabel}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-ink-soft/65">
                  {record.reasons[0]}
                </p>
              </div>
            </div>
          </div>

          <div className={cn("mt-5 grid gap-4", !compact && "sm:grid-cols-[1.55fr_1fr]")}>
            <div className="space-y-3">
              <div>
                <p className="mono-label mb-1.5">SHA-256 fingerprint</p>
                <TruncatedHash hash={record.sha256} />
              </div>

              <dl className="grid grid-cols-2 gap-2.5">
                <div className="rounded-xl border border-lilac-200/70 bg-white px-3 py-2.5">
                  <dt className="mono-label !text-[0.6rem]">Anchored at</dt>
                  <dd className="mt-1 flex items-center gap-1.5 text-[0.72rem] font-medium text-ink">
                    <Clock className="h-3 w-3 shrink-0 text-lilac-500" />
                    <span className="truncate">{formatDateTime(record.anchor.anchoredAt)}</span>
                  </dd>
                </div>
                <div className="rounded-xl border border-lilac-200/70 bg-white px-3 py-2.5">
                  <dt className="mono-label !text-[0.6rem]">Source</dt>
                  <dd className="mt-1 text-[0.72rem] font-medium capitalize text-ink">
                    {record.captureMode === "camera" ? "Live capture" : "Upload"}
                  </dd>
                </div>
              </dl>

              <div className="flex flex-wrap gap-1.5">
                {record.metadata.checks.slice(0, compact ? 3 : 4).map((check) => (
                  <span
                    key={check.id}
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[0.62rem] font-medium",
                      check.status === "pass" &&
                        "border-verify/20 bg-verify-soft text-verify",
                      check.status === "warn" &&
                        "border-warn/25 bg-warn-soft text-warn",
                      check.status === "fail" &&
                        "border-danger/25 bg-danger-soft text-danger",
                    )}
                  >
                    <span
                      className={cn(
                        "h-1 w-1 rounded-full",
                        check.status === "pass" && "bg-verify",
                        check.status === "warn" && "bg-warn",
                        check.status === "fail" && "bg-danger",
                      )}
                    />
                    {check.label}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <div className="rounded-xl border border-lilac-200/70 bg-white p-3">
                <p className="mono-label mb-2 !text-[0.6rem]">File</p>
                <p className="truncate text-[0.78rem] font-medium text-ink">
                  {record.metadata.fileName}
                </p>
                <p className="mt-0.5 font-mono text-[0.62rem] text-ink-soft/45">
                  {record.metadata.width && record.metadata.height
                    ? `${record.metadata.width}×${record.metadata.height} · `
                    : ""}
                  {record.metadata.fileType}
                </p>
              </div>

              {qrDataUrl && (
                <div className="flex items-center gap-3 rounded-xl border border-lilac-200/70 bg-white p-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={qrDataUrl}
                    alt="QR code linking to this proof report"
                    className="h-14 w-14 rounded-md bg-white p-0.5"
                  />
                  <div className="min-w-0">
                    <p className="flex items-center gap-1.5 text-[0.7rem] font-medium text-ink">
                      <QrCode className="h-3 w-3 text-lilac-500" /> Scan to verify
                    </p>
                    <p className="mt-0.5 truncate font-mono text-[0.6rem] text-ink-soft/45">
                      {shareUrl?.replace(/^https?:\/\//, "") ?? `/verify/${record.hashId}`}
                    </p>
                  </div>
                </div>
              )}

              <div className="rounded-xl border border-lilac-200/70 bg-lilac-50 px-3 py-2.5">
                <p className="mono-label !text-[0.58rem]">Anchor node</p>
                <p className="mt-0.5 truncate font-mono text-[0.62rem] text-ink-soft/60">
                  {record.anchor.node} · {record.anchor.algorithm}
                </p>
              </div>
            </div>
          </div>

          <footer className="mt-4 flex items-center justify-between gap-3 border-t border-lilac-200/60 pt-3">
            <p className="truncate font-mono text-[0.6rem] uppercase tracking-[0.16em] text-ink-soft/35">
              ID {record.hashId.slice(0, 16)}
            </p>
            <p className="flex items-center gap-1 text-[0.6rem] uppercase tracking-[0.14em] text-ink-soft/35">
              <ShieldCheck className="h-3 w-3 text-verify/60" />
              {exif.make ? `${exif.make}${exif.model ? ` ${exif.model}` : ""}` : "Device attested"}
            </p>
          </footer>
        </div>
      </div>
    </motion.div>
  );
}
