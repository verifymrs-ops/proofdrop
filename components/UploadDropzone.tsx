"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  Check,
  FileCheck2,
  FileText,
  Image as ImageIcon,
  Loader2,
  ShieldCheck,
  UploadCloud,
} from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { cn, formatBytes, shortHash } from "@/lib/format";
import { ingestFile } from "@/lib/ingest";
import { MAX_FILE_BYTES } from "@/lib/hash-client";

type Stage = "idle" | "dragging" | "hashing" | "metadata" | "anchoring" | "done" | "error";

const STAGE_COPY: Record<
  "hashing" | "metadata" | "anchoring",
  { label: string; detail: string }
> = {
  hashing: {
    label: "Computing SHA-256 fingerprint",
    detail: "Your file never leaves the browser during hashing.",
  },
  metadata: {
    label: "Reading provenance metadata",
    detail: "EXIF, sensor signatures, and device telemetry.",
  },
  anchoring: {
    label: "Anchoring a signed timestamp",
    detail: "HMAC-SHA256 anchor record is being notarized.",
  },
};

export function UploadDropzone({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [stage, setStage] = useState<Stage>("idle");
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<{
    name: string;
    size: number;
    type: string;
    url?: string;
    hash: string;
    href: string;
  } | null>(null);
  const reduce = useReducedMotion();

  const pick = useCallback(() => inputRef.current?.click(), []);

  const process = useCallback(
    async (file: File) => {
      setError(null);
      setStage("hashing");
      if (file.type.startsWith("image/")) {
        setPreview((prev) => {
          if (prev?.url) URL.revokeObjectURL(prev.url);
          return null;
        });
      }
      try {
        const result = await ingestFile(file, {
          captureMode: "upload",
          onStage: (next) => setStage(next),
        });
        setPreview({
          name: file.name,
          size: file.size,
          type: file.type,
          url: file.type.startsWith("image/")
            ? URL.createObjectURL(file)
            : undefined,
          hash: result.record.sha256,
          href: `/verify/${result.record.hashId}`,
        });
        setStage("done");
      } catch (caught) {
        setError(
          caught instanceof Error ? caught.message : "Something went wrong. Try again.",
        );
        setStage("error");
      }
    },
    [],
  );

  const onDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      const file = event.dataTransfer.files?.[0];
      if (file) void process(file);
    },
    [process],
  );

  const busy = stage === "hashing" || stage === "metadata" || stage === "anchoring";
  const isImage = preview?.type.startsWith("image/") ?? false;

  return (
    <div className="w-full">
      <motion.div
        layout
        onDragOver={(event) => {
          event.preventDefault();
          if (!busy) setStage("dragging");
        }}
        onDragLeave={() => {
          if (stage === "dragging") setStage("idle");
        }}
        onDrop={onDrop}
        onClick={stage === "idle" || stage === "dragging" ? pick : undefined}
        role={stage === "idle" ? "button" : undefined}
        tabIndex={stage === "idle" ? 0 : -1}
        onKeyDown={(event) => {
          if (stage === "idle" && (event.key === "Enter" || event.key === " ")) {
            event.preventDefault();
            pick();
          }
        }}
        className={cn(
          "group relative cursor-pointer overflow-hidden rounded-[1.65rem] border text-left transition-all duration-300",
          compact ? "p-5" : "p-7 sm:p-9",
          stage === "dragging"
            ? "border-verify/60 bg-verify-soft shadow-glow-lilac"
            : "border-lilac-200 bg-gradient-to-br from-white to-lilac-50 hover:border-lilac-300 hover:shadow-soft",
          busy && "cursor-progress",
          stage === "done" && "cursor-default",
        )}
        animate={
          stage === "dragging" && !reduce ? { scale: 1.008 } : { scale: 1 }
        }
        transition={{ type: "spring", stiffness: 320, damping: 26 }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          style={{
            background:
              "radial-gradient(600px circle at 50% 0%, rgba(155,124,240,0.12), transparent 55%)",
          }}
        />

        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept="image/*,application/pdf,text/plain,.doc,.docx"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void process(file);
            event.target.value = "";
          }}
        />

        <AnimatePresence mode="wait" initial={false}>
          {stage === "idle" || stage === "dragging" ? (
            <motion.div
              key="idle"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22 }}
              className={cn(
                "flex flex-col items-center gap-4 text-center",
                !compact && "sm:flex-row sm:items-center sm:text-left",
                compact && "gap-3",
              )}
            >
              <div
                className={cn(
                  "relative grid shrink-0 place-items-center rounded-2xl border border-lilac-200 bg-gradient-to-br from-lilac-100 to-blush-100",
                  compact ? "h-12 w-12" : "h-16 w-16",
                )}
              >
                <UploadCloud
                  className={cn(
                    "text-lilac-600 transition-transform duration-300 group-hover:-translate-y-0.5",
                    compact ? "h-5 w-5" : "h-7 w-7",
                  )}
                />
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full border border-white bg-white shadow-soft">
                  <span className="h-1.5 w-1.5 rounded-full bg-verify" />
                </span>
              </div>

              <div className="min-w-0 flex-1">
                <p
                  className={cn(
                    "font-display font-semibold tracking-tight text-ink",
                    compact ? "text-[0.95rem]" : "text-lg",
                  )}
                >
                  {stage === "dragging" ? "Release to fingerprint" : "Drop a photo or document"}
                </p>
                <p
                  className={cn(
                    "mt-1 leading-relaxed text-ink-soft/65",
                    compact ? "text-[0.72rem]" : "text-sm",
                  )}
                >
                  Images, PDFs, or contracts up to {formatBytes(MAX_FILE_BYTES)}.
                  {!compact && " Hashing runs entirely in your browser."}
                </p>
                {!compact && (
                  <div className="mt-3 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                    <span className="chip !normal-case !tracking-normal !text-[0.68rem]">
                      <ImageIcon className="h-3 w-3 text-lilac-600" /> Images
                    </span>
                    <span className="chip !normal-case !tracking-normal !text-[0.68rem]">
                      <FileText className="h-3 w-3 text-lilac-600" /> PDF & docs
                    </span>
                    <span className="chip !normal-case !tracking-normal !text-[0.68rem]">
                      <ShieldCheck className="h-3 w-3 text-verify" /> Private
                    </span>
                  </div>
                )}
              </div>

              <div
                className={cn(
                  "hidden shrink-0 items-center gap-2 rounded-full border border-lilac-200 bg-white px-4 py-2 font-medium text-ink transition group-hover:border-lilac-300 group-hover:bg-lilac-50 sm:flex",
                  compact ? "!hidden text-xs" : "text-sm",
                )}
              >
                Browse
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </div>
            </motion.div>
          ) : busy ? (
            <motion.div
              key="busy"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22 }}
              className="flex flex-col items-center gap-5 py-2 text-center"
            >
              <div className="relative grid h-16 w-16 place-items-center">
                <span className="absolute inset-0 rounded-full border border-verify/30" />
                <span className="absolute inset-0 animate-[pulse-ring_2.4s_ease-out_infinite] rounded-full border border-verify/50" />
                <Loader2 className="h-7 w-7 animate-spin text-verify" />
              </div>

              <div>
                <p className="font-display text-base font-semibold text-ink">
                  {STAGE_COPY[stage as "hashing" | "metadata" | "anchoring"].label}
                </p>
                <p className="mt-1 text-sm text-ink-soft/65">
                  {STAGE_COPY[stage as "hashing" | "metadata" | "anchoring"].detail}
                </p>
              </div>

              <div className="grid w-full max-w-sm gap-2">
                {(["hashing", "metadata", "anchoring"] as const).map((item, index) => {
                  const order = { hashing: 0, metadata: 1, anchoring: 2 };
                  const current = order[stage as keyof typeof order] ?? 0;
                  const state =
                    order[item] < current
                      ? "done"
                      : order[item] === current
                        ? "active"
                        : "pending";
                  return (
                    <div
                      key={item}
                      className={cn(
                        "flex items-center gap-2.5 rounded-xl border px-3 py-2 text-left text-xs transition-colors",
                        state === "done" &&
                          "border-verify/25 bg-verify-soft text-verify",
                        state === "active" &&
                          "border-lilac-300 bg-lilac-100 text-lilac-700",
                        state === "pending" &&
                          "border-lilac-200/70 bg-white text-ink-soft/40",
                      )}
                    >
                      <span className="grid h-4 w-4 place-items-center rounded-full border border-current/30">
                        {state === "done" ? (
                          <Check className="h-3 w-3" />
                        ) : state === "active" ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <span className="h-1 w-1 rounded-full bg-current" />
                        )}
                      </span>
                      <span className="font-mono text-[0.65rem] uppercase tracking-[0.14em]">
                        {item}
                      </span>
                      <span className="ml-auto font-mono text-[0.65rem] opacity-60">
                        0{index + 1}
                      </span>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          ) : stage === "error" ? (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="flex flex-col items-center gap-3 py-3 text-center"
            >
              <div className="grid h-14 w-14 place-items-center rounded-2xl border border-danger/25 bg-danger-soft">
                <FileCheck2 className="h-6 w-6 text-danger" />
              </div>
              <p className="font-display text-base font-semibold text-ink">
                Could not create the proof
              </p>
              <p className="max-w-sm text-sm text-ink-soft/65">{error}</p>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  setStage("idle");
                  setError(null);
                  pick();
                }}
                className="btn-ghost mt-1 !py-2 !text-sm"
              >
                Try another file
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="done"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col gap-5"
            >
              <div className="flex items-start gap-4">
                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border border-lilac-200 bg-lilac-50">
                  {isImage && preview?.url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={preview.url}
                      alt={preview.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="grid h-full w-full place-items-center text-lilac-500">
                      <FileText className="h-7 w-7" />
                    </div>
                  )}
                  <span className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1 bg-verify/90 py-1 text-[0.6rem] font-semibold uppercase tracking-[0.14em] text-white">
                    <ShieldCheck className="h-2.5 w-2.5" /> Anchored
                  </span>
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate font-display text-base font-semibold text-ink">
                    {preview?.name}
                  </p>
                  <p className="mt-0.5 text-xs text-ink-soft/50">
                    {preview ? formatBytes(preview.size) : ""} ·{" "}
                    {preview?.type || "file"}
                  </p>
                  <div className="mt-2 flex items-center gap-2 rounded-lg border border-verify/20 bg-verify-soft px-2.5 py-1.5">
                    <Check className="h-3.5 w-3.5 shrink-0 text-verify" />
                    <span className="truncate font-mono text-[0.7rem] text-verify">
                      {preview ? shortHash(preview.hash) : ""}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    if (preview) router.push(preview.href);
                  }}
                  className="btn-primary flex-1 !py-2.5 !text-sm"
                >
                  Open trust report
                  <ArrowRight className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    setStage("idle");
                    setPreview(null);
                    setError(null);
                  }}
                  className="btn-ghost !py-2.5 !text-sm"
                >
                  Upload another
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <p className="mt-3 flex items-center justify-center gap-1.5 text-center font-mono text-[0.65rem] uppercase tracking-[0.16em] text-ink-soft/40">
        <ShieldCheck className="h-3 w-3 text-verify/70" />
        Client-side SHA-256 · no original file stored
      </p>
    </div>
  );
}
