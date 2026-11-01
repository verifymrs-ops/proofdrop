"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import {
  ArrowLeft,
  BadgeCheck,
  Camera,
  Check,
  ChevronDown,
  Clock,
  Copy,
  Download,
  ExternalLink,
  Fingerprint,
  Globe,
  Hash,
  Image as ImageIcon,
  Link2,
  Loader2,
  Monitor,
  RefreshCw,
  ScanLine,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Sparkles,
  TriangleAlert,
  UploadCloud,
} from "lucide-react";
import { useCallback, useRef, useState } from "react";
import QRCode from "qrcode";
import { cn, formatBytes, formatDateTime, formatRelative, shortHash } from "@/lib/format";
import { hashFileLocally } from "@/lib/ingest";
import { TrustCard } from "./TrustCard";
import type { ProofCheck, ProofRecord } from "@/lib/types";
import type { AnchorVerifyResponse } from "@/lib/types";

const CHECK_TONE: Record<ProofCheck["status"], { ring: string; text: string; bg: string }> = {
  pass: {
    ring: "border-verify/25",
    text: "text-verify",
    bg: "bg-verify-soft",
  },
  warn: {
    ring: "border-warn/25",
    text: "text-warn",
    bg: "bg-warn-soft",
  },
  fail: {
    ring: "border-danger/25",
    text: "text-danger",
    bg: "bg-danger-soft",
  },
};

function CopyField({
  label,
  value,
  mono = true,
  breakAll = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
  breakAll?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="rounded-xl border border-lilac-200/70 bg-lilac-50 p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="mono-label !text-[0.58rem]">{label}</p>
        <button
          type="button"
          onClick={copy}
          className="flex items-center gap-1 text-[0.6rem] font-medium text-ink-soft/50 transition hover:text-lilac-600"
        >
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <p
        className={cn(
          "mt-1.5 text-[0.78rem] text-ink",
          mono && "font-mono text-[0.68rem]",
          breakAll && "break-all",
        )}
      >
        {value}
      </p>
    </div>
  );
}

export function ReportView({
  record,
  shareUrl,
  qrDataUrl,
  anchorValid,
}: {
  record: ProofRecord;
  shareUrl: string;
  qrDataUrl?: string;
  anchorValid: boolean;
}) {
  const verified = record.status === "verified";
  const reduce = useReducedMotion();
  const [showAllChecks, setShowAllChecks] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [qr, setQr] = useState(qrDataUrl);
  const [recheck, setRecheck] = useState<{
    state: "idle" | "hashing" | "done" | "error";
    match?: boolean;
    supplied?: string;
    message?: string;
  }>({ state: "idle" });
  const [anchorState, setAnchorState] = useState<{
    state: "idle" | "loading" | "done" | "error";
    data?: AnchorVerifyResponse;
  }>({ state: "idle" });
  const recheckInputRef = useRef<HTMLInputElement | null>(null);
  const exif = record.metadata.exif;
  const device = record.metadata.device;

  const share = useCallback(async () => {
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({
          title: "ProofDrop trust report",
          text: record.statusLabel,
          url: shareUrl,
        });
        return;
      }
    } catch {
      // fall through to clipboard
    }
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      window.setTimeout(() => setCopiedLink(false), 1800);
    } catch {
      setCopiedLink(false);
    }
  }, [record.statusLabel, shareUrl]);

  const ensureQr = useCallback(async () => {
    if (qr) return;
    try {
      const data = await QRCode.toDataURL(shareUrl, { margin: 1, width: 220 });
      setQr(data);
    } catch {
      // ignore
    }
  }, [qr, shareUrl]);

  const runRecheck = useCallback(
    async (file: File) => {
      setRecheck({ state: "hashing" });
      try {
        const digest = await hashFileLocally(file);
        setRecheck({
          state: "done",
          match: digest === record.sha256,
          supplied: digest,
          message:
            digest === record.sha256
              ? "This file is byte-for-byte identical to the anchored original."
              : "This file differs from the anchored original. Do not rely on this copy.",
        });
      } catch (error) {
        setRecheck({
          state: "error",
          message: error instanceof Error ? error.message : "Hashing failed.",
        });
      }
    },
    [record.sha256],
  );

  const verifyAnchorOnline = useCallback(async () => {
    setAnchorState({ state: "loading" });
    try {
      const response = await fetch("/api/anchor/verify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ hashId: record.hashId }),
      });
      const data = (await response.json()) as AnchorVerifyResponse;
      if (!response.ok) throw new Error("Verification endpoint rejected the request.");
      setAnchorState({ state: "done", data });
    } catch {
      setAnchorState({ state: "error" });
    }
  }, [record.hashId]);

  const downloadJson = useCallback(() => {
    const blob = new Blob([JSON.stringify(record, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `proofdrop-${record.hashId}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }, [record]);

  const visibleChecks = showAllChecks
    ? record.metadata.checks
    : record.metadata.checks.slice(0, 4);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-10 pt-6 sm:px-6 sm:pt-10 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/verify"
          className="inline-flex items-center gap-1.5 text-[0.78rem] font-medium text-ink-soft/60 transition hover:text-ink"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          New proof
        </Link>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={share}
            className="inline-flex items-center gap-1.5 rounded-full border border-lilac-200 bg-white px-3.5 py-2 text-[0.75rem] font-medium text-ink transition hover:border-lilac-300 hover:bg-lilac-50"
          >
            {copiedLink ? (
              <Check className="h-3.5 w-3.5 text-verify" />
            ) : (
              <Link2 className="h-3.5 w-3.5" />
            )}
            {copiedLink ? "Link copied" : "Share proof"}
          </button>
          <button
            type="button"
            onClick={downloadJson}
            className="inline-flex items-center gap-1.5 rounded-full border border-lilac-200 bg-white px-3.5 py-2 text-[0.75rem] font-medium text-ink transition hover:border-lilac-300 hover:bg-lilac-50"
          >
            <Download className="h-3.5 w-3.5" />
            JSON
          </button>
        </div>
      </div>

      <motion.div
        initial={reduce ? undefined : { opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="mt-6"
      >
        <div
          className={cn(
            "relative overflow-hidden rounded-[2rem] border p-6 shadow-card sm:p-8",
            verified
              ? "border-verify/20 bg-gradient-to-br from-verify-soft via-white to-white"
              : "border-danger/20 bg-gradient-to-br from-danger-soft via-white to-white",
          )}
        >
          <div
            aria-hidden
            className={cn(
              "absolute -right-24 -top-28 h-72 w-72 rounded-full blur-3xl",
              verified ? "bg-verify/15" : "bg-danger/15",
            )}
          />
          <div className="relative flex flex-wrap items-start justify-between gap-6">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <span
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[0.7rem] font-semibold uppercase tracking-[0.13em]",
                    verified
                      ? "border-verify/25 bg-verify-soft text-verify"
                      : "border-danger/25 bg-danger-soft text-danger",
                  )}
                >
                  {verified ? (
                    <BadgeCheck className="h-3.5 w-3.5" />
                  ) : (
                    <ShieldAlert className="h-3.5 w-3.5" />
                  )}
                  {verified ? "Verified authentic" : "Tampered / edited"}
                </span>
                <span className="font-mono text-[0.62rem] uppercase tracking-[0.14em] text-ink-soft/45">
                  {formatRelative(record.anchor.anchoredAt)}
                </span>
              </div>

              <h1 className="mt-4 max-w-2xl font-display text-[1.7rem] font-semibold leading-tight tracking-[-0.03em] text-ink sm:text-[2.15rem]">
                {record.statusLabel}
              </h1>
              <p className="mt-2 max-w-xl text-[0.86rem] leading-relaxed text-ink-soft/65">
                {record.reasons[0]}
              </p>

              <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-[0.72rem] text-ink-soft/55">
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-lilac-500" />
                  {formatDateTime(record.anchor.anchoredAt)}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  {record.captureMode === "camera" ? (
                    <Camera className="h-3.5 w-3.5 text-verify/70" />
                  ) : (
                    <UploadCloud className="h-3.5 w-3.5 text-lilac-500" />
                  )}
                  {record.captureMode === "camera" ? "Live capture" : "Uploaded file"}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Globe className="h-3.5 w-3.5 text-lilac-500" />
                  {record.anchor.node}
                </span>
              </div>
            </div>

            <div className="flex w-full max-w-[13rem] flex-col items-start gap-3 sm:items-end">
              <div
                className={cn(
                  "w-full rounded-xl border px-3 py-2.5 text-left sm:text-right",
                  anchorValid
                    ? "border-verify/20 bg-verify-soft"
                    : "border-danger/25 bg-danger-soft",
                )}
              >
                <p className="mono-label !text-[0.55rem]">Anchor signature</p>
                <p
                  className={cn(
                    "mt-1 flex items-center gap-1.5 text-[0.78rem] font-semibold sm:justify-end",
                    anchorValid ? "text-verify" : "text-danger",
                  )}
                >
                  {anchorValid ? (
                    <ShieldCheck className="h-3.5 w-3.5" />
                  ) : (
                    <TriangleAlert className="h-3.5 w-3.5" />
                  )}
                  {anchorValid ? "HMAC valid" : "Signature invalid"}
                </p>
              </div>
              {qr ? (
                <div className="flex items-center gap-2.5 rounded-xl border border-lilac-200 bg-white p-2.5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={qr}
                    alt="QR code for this proof report"
                    className="h-12 w-12 rounded bg-white"
                  />
                  <div className="min-w-0">
                    <p className="text-[0.62rem] font-medium text-ink">Scan & verify</p>
                    <p className="truncate font-mono text-[0.55rem] text-ink-soft/45">
                      /verify/{record.hashId.slice(0, 8)}
                    </p>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={ensureQr}
                  className="w-full rounded-xl border border-lilac-200 bg-white px-3 py-2 text-[0.65rem] font-medium text-ink-soft/60 transition hover:text-ink"
                >
                  Generate QR
                </button>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1.3fr_1fr] lg:items-start">
        <div className="min-w-0 space-y-5">
          <section className="glass-panel p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="grid h-8 w-8 place-items-center rounded-lg border border-lilac-200 bg-lilac-100">
                  <Fingerprint className="h-3.5 w-3.5 text-lilac-600" />
                </span>
                <div>
                  <p className="mono-label !text-[0.55rem]">Integrity</p>
                  <p className="text-[0.86rem] font-semibold text-ink">
                    Cryptographic fingerprint
                  </p>
                </div>
              </div>
              <span className="rounded-full border border-lilac-200 bg-lilac-50 px-2.5 py-1 font-mono text-[0.58rem] uppercase tracking-[0.12em] text-ink-soft/55">
                sha-256
              </span>
            </div>

            <div className="mt-4 rounded-xl border border-verify/20 bg-verify-soft p-3.5">
              <p className="break-all font-mono text-[0.72rem] leading-relaxed text-verify">
                {record.sha256}
              </p>
            </div>

            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <CopyField label="Hash id" value={record.hashId} breakAll />
              <CopyField
                label="Meta digest"
                value={shortHash(record.anchor.metaDigest, 14, 10)}
              />
            </div>

            <div className="mt-4 rounded-xl border border-lilac-200/70 bg-white p-3.5">
              <p className="mono-label !text-[0.58rem]">Anchor digest</p>
              <p className="mt-1 break-all font-mono text-[0.64rem] text-ink-soft/60">
                {record.anchor.digest}
              </p>
              <div className="mt-2.5 flex items-center gap-1.5 border-t border-lilac-200/60 pt-2.5">
                <ShieldCheck className="h-3 w-3 shrink-0 text-verify/70" />
                <p className="break-all font-mono text-[0.6rem] text-ink-soft/45">
                  sig {record.anchor.signature}
                </p>
              </div>
            </div>
          </section>

          <section className="glass-panel p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="grid h-8 w-8 place-items-center rounded-lg border border-verify/20 bg-verify-soft">
                  <ScanLine className="h-3.5 w-3.5 text-verify" />
                </span>
                <div>
                  <p className="mono-label !text-[0.55rem]">Do not trust, verify</p>
                  <p className="text-[0.86rem] font-semibold text-ink">
                    Re-hash your copy
                  </p>
                </div>
              </div>
            </div>
            <p className="mt-3 text-[0.78rem] leading-relaxed text-ink-soft/60">
              Select the file you were given. ProofDrop fingerprints it locally and
              compares against the anchored digest — no upload, instant answer.
            </p>

            <div className="mt-4">
              <input
                ref={recheckInputRef}
                type="file"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  event.target.value = "";
                  if (file) void runRecheck(file);
                }}
              />
              <button
                type="button"
                onClick={() => recheckInputRef.current?.click()}
                disabled={recheck.state === "hashing"}
                className="btn-ghost w-full !py-2.5 !text-sm disabled:opacity-60"
              >
                {recheck.state === "hashing" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                {recheck.state === "hashing" ? "Fingerprinting…" : "Select file to compare"}
              </button>

              <AnimatePresence>
                {recheck.state === "done" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div
                      className={cn(
                        "mt-3 rounded-xl border px-3.5 py-3",
                        recheck.match
                          ? "border-verify/25 bg-verify-soft"
                          : "border-danger/30 bg-danger-soft",
                      )}
                    >
                      <p
                        className={cn(
                          "flex items-center gap-1.5 text-[0.78rem] font-semibold",
                          recheck.match ? "text-verify" : "text-danger",
                        )}
                      >
                        {recheck.match ? (
                          <ShieldCheck className="h-3.5 w-3.5" />
                        ) : (
                          <ShieldAlert className="h-3.5 w-3.5" />
                        )}
                        {recheck.match ? "Exact match" : "Digest mismatch"}
                      </p>
                      <p className="mt-1 text-[0.72rem] leading-relaxed text-ink-soft/65">
                        {recheck.message}
                      </p>
                      <p className="mt-2 break-all font-mono text-[0.6rem] text-ink-soft/45">
                        {recheck.supplied}
                      </p>
                    </div>
                  </motion.div>
                )}
                {recheck.state === "error" && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-3 rounded-xl border border-danger/25 bg-danger-soft px-3.5 py-2.5 text-[0.75rem] text-danger"
                  >
                    {recheck.message}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            <div className="mt-4 rounded-xl border border-lilac-200/70 bg-lilac-50 p-3.5">
              <div className="flex items-center justify-between gap-2">
                <p className="mono-label !text-[0.58rem]">Independent anchor check</p>
                <button
                  type="button"
                  onClick={verifyAnchorOnline}
                  disabled={anchorState.state === "loading"}
                  className="inline-flex items-center gap-1 rounded-full border border-verify/25 bg-verify-soft px-2.5 py-1 text-[0.6rem] font-medium text-verify transition hover:bg-verify-soft/70 disabled:opacity-60"
                >
                  {anchorState.state === "loading" ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <ShieldCheck className="h-3 w-3" />
                  )}
                  Verify live
                </button>
              </div>
              <p className="mt-2 text-[0.7rem] leading-relaxed text-ink-soft/50">
                {anchorState.state === "done" && anchorState.data
                  ? anchorState.data.message
                  : anchorState.state === "error"
                    ? "Live anchor verification is unavailable right now."
                    : "Ask the anchor node to recompute the HMAC over this stored report."}
              </p>
              {anchorState.state === "done" && anchorState.data && (
                <div className="mt-2 flex gap-1.5">
                  {[
                    { label: "signature", ok: anchorState.data.signatureValid },
                    { label: "digest", ok: anchorState.data.digestValid },
                    { label: "meta", ok: anchorState.data.valid },
                  ].map((item) => (
                    <span
                      key={item.label}
                      className={cn(
                        "rounded-full border px-2 py-0.5 font-mono text-[0.55rem] uppercase tracking-[0.1em]",
                        item.ok
                          ? "border-verify/25 bg-verify-soft text-verify"
                          : "border-danger/25 bg-danger-soft text-danger",
                      )}
                    >
                      {item.label}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>

        <div className="min-w-0 space-y-5">
          <div className="lg:sticky lg:top-24">
            <TrustCard record={record} qrDataUrl={qr} shareUrl={shareUrl} compact />
          </div>
        </div>
      </div>

      <section className="mt-5 grid gap-5 lg:grid-cols-2">
        <div className="glass-panel min-w-0 p-5 sm:p-6">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg border border-lilac-200 bg-lilac-100">
              <Sparkles className="h-3.5 w-3.5 text-lilac-600" />
            </span>
            <div>
              <p className="mono-label !text-[0.55rem]">Forensic breakdown</p>
              <p className="text-[0.86rem] font-semibold text-ink">
                {record.metadata.checks.length} provenance checks
              </p>
            </div>
          </div>

          <ul className="mt-4 space-y-2">
            {visibleChecks.map((check) => {
              const tone = CHECK_TONE[check.status];
              return (
                <li
                  key={check.id}
                  className={cn("rounded-xl border p-3", tone.ring, tone.bg)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className={cn("text-[0.78rem] font-semibold", tone.text)}>
                      {check.label}
                    </p>
                    <span
                      className={cn(
                        "shrink-0 rounded-full border px-2 py-0.5 font-mono text-[0.52rem] uppercase tracking-[0.12em]",
                        tone.ring,
                        tone.text,
                      )}
                    >
                      {check.status}
                    </span>
                  </div>
                  <p className="mt-1 text-[0.72rem] leading-relaxed text-ink-soft/60">
                    {check.detail}
                  </p>
                </li>
              );
            })}
          </ul>

          {record.metadata.checks.length > 4 && (
            <button
              type="button"
              onClick={() => setShowAllChecks((prev) => !prev)}
              className="mt-3 inline-flex items-center gap-1 text-[0.72rem] font-medium text-ink-soft/60 transition hover:text-ink"
            >
              {showAllChecks ? "Show fewer" : `Show all ${record.metadata.checks.length}`}
              <ChevronDown
                className={cn("h-3.5 w-3.5 transition-transform", showAllChecks && "rotate-180")}
              />
            </button>
          )}
        </div>

        <div className="glass-panel min-w-0 p-5 sm:p-6">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg border border-verify/20 bg-verify-soft">
              <Hash className="h-3.5 w-3.5 text-verify" />
            </span>
            <div>
              <p className="mono-label !text-[0.55rem]">Metadata</p>
              <p className="text-[0.86rem] font-semibold text-ink">
                Evidence attributes
              </p>
            </div>
          </div>

          <dl className="mt-4 grid gap-2 sm:grid-cols-2">
            {[
              { label: "File name", value: record.metadata.fileName, icon: ImageIcon },
              { label: "Type", value: record.metadata.fileType || "unknown", icon: Hash },
              { label: "Size", value: formatBytes(record.metadata.fileSize), icon: HardDriveIcon },
              {
                label: "Dimensions",
                value:
                  record.metadata.width && record.metadata.height
                    ? `${record.metadata.width} × ${record.metadata.height}`
                    : "n/a",
                icon: ImageIcon,
              },
              { label: "Captured at", value: formatDateTime(record.clientCapturedAt), icon: Clock },
              {
                label: "Device modified",
                value: record.metadata.lastModified
                  ? formatDateTime(new Date(record.metadata.lastModified).toISOString())
                  : "n/a",
                icon: Clock,
              },
            ].map((row) => (
              <div
                key={row.label}
                className="rounded-xl border border-lilac-200/70 bg-white px-3 py-2.5"
              >
                <dt className="mono-label !text-[0.55rem]">{row.label}</dt>
                <dd className="mt-0.5 truncate text-[0.75rem] text-ink">
                  {row.value}
                </dd>
              </div>
            ))}
          </dl>

          <div className="mt-4 rounded-xl border border-lilac-200/70 bg-lilac-50 p-3.5">
            <p className="mono-label !text-[0.55rem]">Device & sensor</p>
            <div className="mt-2 grid gap-1.5 text-[0.72rem] text-ink-soft/65">
              <p className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5">
                  <Camera className="h-3 w-3 text-lilac-500" /> Camera
                </span>
                <span className="truncate font-mono text-[0.65rem] text-ink">
                  {exif.make || exif.model
                    ? `${exif.make ?? ""} ${exif.model ?? ""}`.trim()
                    : "not present"}
                </span>
              </p>
              <p className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5">
                  <Smartphone className="h-3 w-3 text-lilac-500" /> Platform
                </span>
                <span className="font-mono text-[0.65rem] text-ink">
                  {device.platform ?? "unknown"} · {device.browser ?? "unknown"}
                </span>
              </p>
              <p className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5">
                  <Monitor className="h-3 w-3 text-lilac-500" /> Viewport
                </span>
                <span className="font-mono text-[0.65rem] text-ink">
                  {device.screen ?? "unknown"}
                </span>
              </p>
              <p className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5">
                  <Globe className="h-3 w-3 text-lilac-500" /> Timezone
                </span>
                <span className="truncate font-mono text-[0.65rem] text-ink">
                  {device.timezone ?? "unknown"}
                </span>
              </p>
              <p className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5">
                  <Sparkles className="h-3 w-3 text-lilac-500" /> Software tag
                </span>
                <span className="truncate font-mono text-[0.65rem] text-ink">
                  {exif.software ?? "none detected"}
                </span>
              </p>
              {exif.gps && (
                <p className="mt-1 rounded-lg border border-warn/20 bg-warn-soft px-2 py-1.5 text-[0.65rem] text-warn">
                  GPS metadata present. Coordinates are not republished in this report.
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-lilac-200/70 bg-white px-4 py-3 shadow-soft">
        <p className="font-mono text-[0.62rem] uppercase tracking-[0.14em] text-ink-soft/40">
          anchored {formatDateTime(record.anchor.anchoredAt)} · {record.anchor.version}
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/trust"
            className="inline-flex items-center gap-1 text-[0.72rem] text-ink-soft/60 transition hover:text-ink"
          >
            Read the protocol
            <ExternalLink className="h-3 w-3" />
          </Link>
          <Link href="/verify" className="inline-flex items-center gap-1 text-[0.72rem] font-medium text-lilac-600 transition hover:text-lilac-700">
            Create your own proof
            <ScanLine className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}

function HardDriveIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="2" y="7" width="20" height="10" rx="2" />
      <path d="M6 12h.01M10 12h.01" />
    </svg>
  );
}
