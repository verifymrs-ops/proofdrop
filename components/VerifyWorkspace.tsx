"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Camera,
  CircleDot,
  RefreshCw,
  ScanLine,
  ShieldCheck,
  Sparkles,
  SwitchCamera,
  TriangleAlert,
  UploadCloud,
  X,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useCamera } from "@/lib/use-camera";
import { ingestFile } from "@/lib/ingest";
import { cn, shortHash } from "@/lib/format";
import { UploadDropzone } from "./UploadDropzone";

type Mode = "capture" | "upload";

export function VerifyWorkspace() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("capture");
  const reduce = useReducedMotion();

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-10 pt-8 sm:px-6 sm:pt-12 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="mx-auto max-w-2xl text-center"
      >
        <span className="chip mx-auto">
          <Sparkles className="h-3 w-3 text-lilac-600" />
          Instant proof drop
        </span>
        <h1 className="mt-5 font-display text-[2.1rem] font-semibold leading-[1.08] tracking-[-0.035em] text-ink sm:text-[2.9rem]">
          Fingerprint your evidence{" "}
          <span className="text-gradient-lavender">before it leaves the room</span>
        </h1>
        <p className="mt-4 text-[0.95rem] leading-relaxed text-ink-soft/70">
          Capture live from your camera or upload an existing file. The SHA-256
          digest is computed in this browser tab — ProofDrop only ever receives the
          fingerprint and derived metadata.
        </p>
      </motion.div>

      <div className="mt-8 flex justify-center">
        <div
          role="tablist"
          aria-label="Proof input method"
          className="inline-flex items-center gap-1 rounded-full border border-lilac-200 bg-white p-1 shadow-soft"
        >
          {[
            { id: "capture" as const, label: "Live capture", icon: Camera },
            { id: "upload" as const, label: "Upload file", icon: UploadCloud },
          ].map((tab) => {
            const active = mode === tab.id;
            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={active}
                onClick={() => setMode(tab.id)}
                className={cn(
                  "relative flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors",
                  active ? "text-white" : "text-ink-soft/60 hover:text-ink",
                )}
              >
                {active && (
                  <motion.span
                    layoutId="verify-tab"
                    className="absolute inset-0 rounded-full bg-gradient-to-r from-lilac-500 to-blush-500 shadow-glow-lilac"
                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-2">
                  <tab.icon className="h-4 w-4" />
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[1.35fr_1fr] lg:items-start">
        <AnimatePresence mode="wait" initial={false}>
          {mode === "capture" ? (
            <motion.div
              key="capture"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.28 }}
            >
              <CameraCapture onComplete={(hashId) => router.push(`/verify/${hashId}`)} />
            </motion.div>
          ) : (
            <motion.div
              key="upload"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.28 }}
            >
              <div className="glass-panel p-5 sm:p-6">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="mono-label">Upload channel</p>
                    <p className="mt-1 font-display text-lg font-semibold text-ink">
                      Drop any evidence file
                    </p>
                  </div>
                  <span className="flex items-center gap-1.5 rounded-full border border-verify/20 bg-verify-soft px-2.5 py-1 text-[0.6rem] font-medium uppercase tracking-[0.12em] text-verify">
                    <ShieldCheck className="h-3 w-3" />
                    Private
                  </span>
                </div>
                <UploadDropzone />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="min-w-0 space-y-4">
          <div className="glass-panel p-5">
            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-lg border border-lilac-200 bg-lilac-100">
                <Zap className="h-3.5 w-3.5 text-lilac-600" />
              </span>
              <p className="font-display text-sm font-semibold text-ink">
                What gets anchored
              </p>
            </div>
            <ul className="mt-4 space-y-2.5">
              {[
                {
                  title: "SHA-256 digest",
                  detail: "256-bit fingerprint of the exact bytes.",
                },
                {
                  title: "Signed timestamp",
                  detail: "HMAC-SHA256 over digest + metadata.",
                },
                {
                  title: "Provenance signals",
                  detail: "EXIF, editing tags, time drift, device.",
                },
                {
                  title: "Public trust link",
                  detail: "/verify/<hash-id> · share anywhere.",
                },
              ].map((item) => (
                <li key={item.title} className="flex items-start gap-2.5">
                  <span className="mt-1 grid h-4 w-4 shrink-0 place-items-center rounded-full border border-verify/30 bg-verify-soft">
                    <span className="h-1 w-1 rounded-full bg-verify" />
                  </span>
                  <div>
                    <p className="text-[0.8rem] font-medium text-ink">
                      {item.title}
                    </p>
                    <p className="text-[0.72rem] leading-relaxed text-ink-soft/55">
                      {item.detail}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-lilac-200/80 bg-white p-5 shadow-soft">
            <p className="mono-label">Privacy model</p>
            <p className="mt-2 text-[0.78rem] leading-relaxed text-ink-soft/65">
              Original files are never transmitted. Hashing and metadata extraction
              happen locally through Web Crypto and an in-memory EXIF parser.
            </p>
            <Link
              href="/trust#privacy"
              className="mt-3 inline-flex items-center gap-1 text-[0.75rem] font-medium text-lilac-600 transition hover:text-lilac-700"
            >
              Read the privacy model
              <span aria-hidden>→</span>
            </Link>
          </div>

          {!reduce && (
            <motion.div
              aria-hidden
              className="relative h-16 overflow-hidden rounded-2xl border border-lilac-200 bg-lilac-50"
            >
              <div className="absolute inset-x-3 top-1/2 -translate-y-1/2 font-mono text-[0.6rem] leading-relaxed text-ink-soft/25">
                9f2c41b8e7a0c3d5f6a1b2c3d4e5f607 · anchor_wait · hmac_ready
              </div>
              <span className="absolute inset-x-0 h-12 animate-scan bg-gradient-to-b from-transparent via-lilac-400/20 to-transparent" />
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}

function CameraCapture({ onComplete }: { onComplete: (hashId: string) => void }) {
  const [active, setActive] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [flash, setFlash] = useState(false);
  const [previewHash, setPreviewHash] = useState<string | null>(null);
  const [resultHashId, setResultHashId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const camera = useCamera({ enabled: active });

  const start = useCallback(async () => {
    setError(null);
    setActive(true);
  }, []);

  const stop = useCallback(() => {
    camera.stop();
    setActive(false);
  }, [camera]);

  const shoot = useCallback(async () => {
    setError(null);
    setBusy(true);
    setFlash(true);
    window.setTimeout(() => setFlash(false), 180);
    try {
      const blob = await camera.capture();
      if (!blob) throw new Error("Camera is not ready yet. Wait a moment and retry.");
      const stamp = Date.now();
      const file = new File([blob], `proofdrop-capture-${stamp}.jpg`, {
        type: "image/jpeg",
        lastModified: stamp,
      });
      const result = await ingestFile(file, {
        captureMode: "camera",
        cameraFacing: camera.facingMode,
        clientCapturedAt: new Date().toISOString(),
      });
      setPreviewHash(result.record.sha256);
      setResultHashId(result.record.hashId);
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate?.(18);
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Capture failed.");
    } finally {
      setBusy(false);
    }
  }, [camera]);

  return (
    <div className="glass-panel overflow-hidden">
      <div className="flex items-center justify-between border-b border-lilac-200/70 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 animate-pulse rounded-full bg-danger" />
          <span className="mono-label !text-[0.58rem]">Live capture session</span>
        </div>
        <span className="font-mono text-[0.58rem] uppercase tracking-[0.14em] text-ink-soft/40">
          on-device encode
        </span>
      </div>

      <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#120f1c] sm:aspect-[16/11]">
        <video
          ref={camera.videoRef}
          playsInline
          muted
          autoPlay
          className={cn(
            "h-full w-full object-cover transition-opacity duration-500",
            active && camera.ready ? "opacity-100" : "opacity-0",
          )}
        />

        {(!active || !camera.ready) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-6 text-center">
            <div className="relative grid h-16 w-16 place-items-center rounded-2xl border border-white/20 bg-white/10">
              <Camera className="h-7 w-7 text-white" />
              {!active && (
                <span className="absolute inset-0 animate-[pulse-ring_2.6s_ease-out_infinite] rounded-2xl border border-white/30" />
              )}
            </div>
            {camera.starting ? (
              <p className="text-sm text-white/80">Requesting camera access…</p>
            ) : (
              <>
                <div>
                  <p className="font-display text-base font-semibold text-white">
                    {active ? "Camera ready on your signal" : "Open the live camera"}
                  </p>
                  <p className="mt-1 max-w-xs text-[0.78rem] leading-relaxed text-white/60">
                    Frames are re-encoded in memory with a ProofDrop capture stamp,
                    so prior editing metadata cannot survive.
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={active ? camera.start : start}
                    className="btn-primary !py-2.5 !text-sm"
                  >
                    <Camera className="h-4 w-4" />
                    {camera.error ? "Retry camera" : "Enable camera"}
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/20"
                  >
                    <UploadCloud className="h-4 w-4" />
                    Use a file
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {active && camera.ready && (
          <>
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute inset-6 rounded-xl border border-white/20">
                {[
                  "left-0 top-0 border-l-2 border-t-2 rounded-tl-xl",
                  "right-0 top-0 border-r-2 border-t-2 rounded-tr-xl",
                  "left-0 bottom-0 border-l-2 border-b-2 rounded-bl-xl",
                  "right-0 bottom-0 border-r-2 border-b-2 rounded-br-xl",
                ].map((position) => (
                  <span
                    key={position}
                    className={cn("absolute h-7 w-7 border-lilac-300", position)}
                  />
                ))}
              </div>
              <span className="absolute inset-x-0 h-14 animate-scan bg-gradient-to-b from-transparent via-lilac-300/20 to-transparent" />
              <span className="absolute left-1/2 top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/30" />
            </div>

            <div className="absolute inset-x-0 top-0 flex items-center justify-between px-4 py-3">
              <span className="flex items-center gap-1.5 rounded-full bg-black/55 px-2.5 py-1 font-mono text-[0.55rem] uppercase tracking-[0.14em] text-lilac-200 backdrop-blur">
                <CircleDot className="h-2.5 w-2.5" />
                rec
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={camera.flip}
                  aria-label="Switch camera"
                  className="grid h-8 w-8 place-items-center rounded-full bg-black/55 text-white backdrop-blur transition hover:bg-black/75"
                >
                  <SwitchCamera className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={stop}
                  aria-label="Close camera"
                  className="grid h-8 w-8 place-items-center rounded-full bg-black/55 text-white backdrop-blur transition hover:bg-black/75"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <div className="absolute inset-x-0 bottom-0 flex items-center justify-between px-4 pb-4">
              <span className="font-mono text-[0.55rem] uppercase tracking-[0.12em] text-white/45">
                {camera.facingMode === "environment" ? "rear" : "front"} · re-encode on
                shutter
              </span>
              <button
                type="button"
                onClick={shoot}
                disabled={busy}
                aria-label="Capture and fingerprint"
                className="group relative grid h-16 w-16 place-items-center rounded-full border-2 border-white/80 bg-white/10 backdrop-blur transition disabled:opacity-60"
              >
                <span className="absolute inset-1.5 rounded-full bg-gradient-to-br from-lilac-400 to-blush-500 transition group-hover:scale-105" />
                {busy ? (
                  <RefreshCw className="relative h-5 w-5 animate-spin text-white" />
                ) : (
                  <ScanLine className="relative h-5 w-5 text-white" />
                )}
              </button>
              <span className="w-16 font-mono text-[0.55rem] uppercase tracking-[0.12em] text-white/45">
                sha-256
              </span>
            </div>
          </>
        )}

        <AnimatePresence>
          {flash && (
            <motion.div
              initial={{ opacity: 0.85 }}
              animate={{ opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.32 }}
              className="pointer-events-none absolute inset-0 bg-white"
            />
          )}
        </AnimatePresence>
      </div>

      <div className="border-t border-lilac-200/70 px-4 py-4">
        <AnimatePresence mode="wait">
          {camera.error ? (
            <motion.div
              key="err"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-start gap-2 rounded-xl border border-warn/25 bg-warn-soft px-3 py-2.5"
            >
              <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-warn" />
              <p className="text-[0.78rem] leading-relaxed text-warn">
                {camera.error}
              </p>
            </motion.div>
          ) : error ? (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-start gap-2 rounded-xl border border-danger/25 bg-danger-soft px-3 py-2.5"
            >
              <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-danger" />
              <p className="text-[0.78rem] leading-relaxed text-danger">{error}</p>
            </motion.div>
          ) : previewHash ? (
            <motion.div
              key="done"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="flex items-center gap-1.5 text-[0.75rem] font-semibold text-verify">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Capture fingerprinted and anchored
                </p>
                <p className="mt-1 truncate font-mono text-[0.68rem] text-ink-soft/60">
                  {shortHash(previewHash, 16, 10)}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setPreviewHash(null);
                    setResultHashId(null);
                  }}
                  className="btn-ghost !py-2 !text-xs"
                >
                  Recapture
                </button>
                <button
                  type="button"
                  onClick={() => resultHashId && onComplete(resultHashId)}
                  className="btn-primary !py-2 !text-xs"
                >
                  Open report
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.p
              key="hint"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2 font-mono text-[0.62rem] uppercase tracking-[0.14em] text-ink-soft/40"
            >
              <ShieldCheck className="h-3 w-3 text-verify/70" />
              {active
                ? "Shutter re-encodes the frame before hashing"
                : "Camera access is requested only when you enable it"}
            </motion.p>
          )}
        </AnimatePresence>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,application/pdf,text/plain,.doc,.docx"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (!file) return;
            setBusy(true);
            setError(null);
            void ingestFile(file, {
              captureMode: "upload",
              onStage: () => undefined,
            })
              .then((result) => onComplete(result.record.hashId))
              .catch((caught: unknown) => {
                setError(
                  caught instanceof Error ? caught.message : "Upload failed.",
                );
              })
              .finally(() => setBusy(false));
          }}
        />
        <p className="mt-3 flex items-center justify-between font-mono text-[0.58rem] uppercase tracking-[0.12em] text-ink-soft/30">
          <span>max 25 MB</span>
          <span>hash · meta · anchor</span>
        </p>
      </div>
    </div>
  );
}
