"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BadgeCheck,
  Binary,
  Camera,
  Code2,
  Database,
  EyeOff,
  FileCheck2,
  Fingerprint,
  KeyRound,
  Lock,
  ScanLine,
  ShieldAlert,
  ShieldCheck,
  Timer,
  UploadCloud,
} from "lucide-react";
import { Reveal, Stagger, StaggerItem } from "./Reveal";

const PROTOCOL = [
  {
    icon: UploadCloud,
    title: "Ingest",
    body: "You choose a file or capture a frame. It is read into memory as an ArrayBuffer inside the browser tab.",
  },
  {
    icon: Binary,
    title: "Digest",
    body: "Web Crypto’s SHA-256 returns a 64-character hex digest. Any single-bit change produces a different digest.",
  },
  {
    icon: Database,
    title: "Metadata",
    body: "EXIF is parsed locally. The server receives only derived fields — never the pixels themselves.",
  },
  {
    icon: KeyRound,
    title: "Anchor",
    body: "The node computes an HMAC-SHA256 signature over the digest, status, and metadata hash.",
  },
  {
    icon: ScanLine,
    title: "Publish",
    body: "A 32-hex proof id resolves to a public trust card. Re-hash any copy to detect divergence.",
  },
];

const PRIVACY = [
  {
    icon: EyeOff,
    title: "Raw evidence never transmitted",
    body: "Camera frames and uploads are hashed and discarded in the tab. There is no multipart upload of your original file.",
  },
  {
    icon: Lock,
    title: "Minimal metadata surface",
    body: "We keep file type, size, dimensions, EXIF presence, and a boolean for GPS — never the coordinates themselves.",
  },
  {
    icon: Database,
    title: "Digest-only persistence",
    body: "The anchor node stores the digest, derived metadata, and the signed anchor record. That is the verifiable minimum.",
  },
  {
    icon: KeyRound,
    title: "Tamper-evident by design",
    body: "Every report carries an HMAC. Alter a field and the signature check fails when the verifier recomputes it.",
  },
];

const SCORING = [
  {
    title: "Hash integrity",
    weight: "Mandatory",
    body: "The digest is recomputed by the anchor node and must match the submitted value exactly.",
    tone: "verify" as const,
  },
  {
    title: "Editing-suite signature",
    weight: "Critical",
    body: "Software tags from known editors, retouchers, and AI generators trigger a flagged status.",
    tone: "danger" as const,
  },
  {
    title: "Metadata presence",
    weight: "High",
    body: "Uploaded images with no EXIF block are marked as re-encoded or stripped.",
    tone: "danger" as const,
  },
  {
    title: "Time consistency",
    weight: "Medium",
    body: "EXIF capture time is compared with device modification time. Large drift raises a warning.",
    tone: "warn" as const,
  },
  {
    title: "Device signal",
    weight: "Medium",
    body: "Hardware identifiers strengthen a report. Missing identifiers produce a warning, not a failure.",
    tone: "warn" as const,
  },
  {
    title: "Capture source",
    weight: "Context",
    body: "Live capture asserts control of the pipeline; uploads assert integrity only.",
    tone: "verify" as const,
  },
];

const TONE_CLASS = {
  verify: "border-verify/25 bg-verify-soft text-verify",
  warn: "border-warn/25 bg-warn-soft text-warn",
  danger: "border-danger/25 bg-danger-soft text-danger",
};

export function TrustExplainer() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-10 pt-8 sm:px-6 sm:pt-12 lg:px-8">
      <Reveal className="max-w-3xl">
        <span className="chip">
          <ShieldCheck className="h-3 w-3 text-lilac-600" />
          Trust architecture
        </span>
        <h1 className="mt-5 font-display text-[2.2rem] font-semibold leading-[1.06] tracking-[-0.035em] text-ink sm:text-[3.1rem]">
          What “verified” actually means{" "}
          <span className="text-gradient-lavender">on ProofDrop</span>
        </h1>
        <p className="mt-4 text-[1rem] leading-relaxed text-ink-soft/70">
          A ProofDrop report never asks you to trust a screenshot. It gives you a
          digest you can recompute, a signature you can check, and a provenance
          score that states exactly what was and was not proven.
        </p>
      </Reveal>

      <section id="cards" className="mt-12 grid gap-4 md:grid-cols-2">
        <Reveal>
          <div className="h-full rounded-2xl border border-verify/20 bg-gradient-to-br from-verify-soft to-white p-6 shadow-soft">
            <span className="inline-flex items-center gap-2 rounded-full border border-verify/25 bg-verify-soft px-3 py-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.13em] text-verify">
              <BadgeCheck className="h-3.5 w-3.5" />
              Green · Verified
            </span>
            <p className="mt-4 font-display text-lg font-semibold leading-snug text-ink">
              “Authentic Live Capture — Unaltered &amp; Time-stamped”
            </p>
            <ul className="mt-4 space-y-2">
              {[
                "Live camera session or clean device-origin image",
                "EXIF or live-session telemetry present",
                "No editing suite, retoucher, or AI generator tag",
                "Timestamp drift within tolerance",
                "HMAC anchor recomputes correctly",
              ].map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-2 text-[0.8rem] leading-relaxed text-ink-soft/75"
                >
                  <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-verify" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </Reveal>

        <Reveal delay={0.08}>
          <div className="h-full rounded-2xl border border-danger/25 bg-gradient-to-br from-danger-soft to-white p-6 shadow-soft">
            <span className="inline-flex items-center gap-2 rounded-full border border-danger/30 bg-danger-soft px-3 py-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.13em] text-danger">
              <ShieldAlert className="h-3.5 w-3.5" />
              Red · Flagged
            </span>
            <p className="mt-4 font-display text-lg font-semibold leading-snug text-ink">
              “Tampered, Metadata Stripped, or Edited”
            </p>
            <ul className="mt-4 space-y-2">
              {[
                "Editing or AI software signature detected in metadata",
                "Uploaded image with no EXIF block at all",
                "Capture timestamp significantly diverges from file history",
                "Anchor signature does not recompute",
                "Re-hashed copy does not match the anchored digest",
              ].map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-2 text-[0.8rem] leading-relaxed text-ink-soft/75"
                >
                  <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-danger" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      </section>

      <section id="hash" className="mt-16">
        <Reveal>
          <h2 className="font-display text-2xl font-semibold tracking-[-0.025em] text-ink sm:text-3xl">
            The five-stage pipeline
          </h2>
          <p className="mt-2 max-w-2xl text-[0.9rem] leading-relaxed text-ink-soft/65">
            Every report is derived from these stages. If any stage is missing, the
            trust card states which claim is unavailable.
          </p>
        </Reveal>

        <Stagger className="mt-6 grid gap-3 md:grid-cols-2 lg:grid-cols-5">
          {PROTOCOL.map((step, index) => (
            <StaggerItem key={step.title}>
              <div className="group h-full rounded-2xl border border-lilac-200/80 bg-white p-4 shadow-soft transition hover:border-lilac-300 hover:shadow-glow-lilac">
                <div className="flex items-center justify-between">
                  <span className="grid h-9 w-9 place-items-center rounded-lg border border-lilac-200 bg-lilac-100 text-lilac-600">
                    <step.icon className="h-4 w-4" />
                  </span>
                  <span className="font-mono text-[0.6rem] tracking-[0.18em] text-ink-soft/25">
                    0{index + 1}
                  </span>
                </div>
                <h3 className="mt-3 text-[0.88rem] font-semibold text-ink">
                  {step.title}
                </h3>
                <p className="mt-1.5 text-[0.75rem] leading-relaxed text-ink-soft/60">
                  {step.body}
                </p>
              </div>
            </StaggerItem>
          ))}
        </Stagger>

        <Reveal delay={0.1}>
          <div className="mt-4 overflow-hidden rounded-2xl border border-lilac-200 bg-white shadow-soft">
            <div className="flex items-center justify-between border-b border-lilac-200/70 px-4 py-2.5">
              <span className="mono-label !text-[0.58rem]">Example digest</span>
              <span className="font-mono text-[0.55rem] uppercase tracking-[0.12em] text-ink-soft/30">
                sha-256 · 64 hex chars
              </span>
            </div>
            <p className="break-all px-4 py-4 font-mono text-[0.72rem] leading-relaxed text-verify">
              9f2c41b8e7a0c3d5f6a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f607
            </p>
            <div className="flex flex-wrap items-center gap-3 border-t border-lilac-200/70 px-4 py-2.5">
              <span className="font-mono text-[0.58rem] text-ink-soft/40">
                change one bit →
              </span>
              <span className="break-all font-mono text-[0.58rem] text-danger/70">
                41d8cd98f00b204e9800998ecf8427e…3d4e5f607
              </span>
            </div>
          </div>
        </Reveal>
      </section>

      <section className="mt-16">
        <Reveal>
          <h2 className="font-display text-2xl font-semibold tracking-[-0.025em] text-ink sm:text-3xl">
            Provenance scoring
          </h2>
          <p className="mt-2 max-w-2xl text-[0.9rem] leading-relaxed text-ink-soft/65">
            The status is not a guess. Checks are grouped by severity, and any
            critical failure forces a flagged report.
          </p>
        </Reveal>

        <Stagger className="mt-6 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {SCORING.map((item) => (
            <StaggerItem key={item.title}>
              <div className="h-full rounded-2xl border border-lilac-200/80 bg-white p-4 shadow-soft">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[0.86rem] font-semibold text-ink">{item.title}</p>
                  <span
                    className={`rounded-full border px-2 py-0.5 font-mono text-[0.54rem] uppercase tracking-[0.12em] ${TONE_CLASS[item.tone]}`}
                  >
                    {item.weight}
                  </span>
                </div>
                <p className="mt-2 text-[0.76rem] leading-relaxed text-ink-soft/60">
                  {item.body}
                </p>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      <section id="privacy" className="mt-16">
        <Reveal>
          <h2 className="font-display text-2xl font-semibold tracking-[-0.025em] text-ink sm:text-3xl">
            Privacy model
          </h2>
          <p className="mt-2 max-w-2xl text-[0.9rem] leading-relaxed text-ink-soft/65">
            Trust infrastructure should not become a surveillance layer. The
            architecture enforces that with omission, not policy.
          </p>
        </Reveal>

        <Stagger className="mt-6 grid gap-3 md:grid-cols-2">
          {PRIVACY.map((item) => (
            <StaggerItem key={item.title}>
              <div className="flex h-full items-start gap-3 rounded-2xl border border-lilac-200/80 bg-white p-4 shadow-soft">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-verify/20 bg-verify-soft text-verify">
                  <item.icon className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-[0.86rem] font-semibold text-ink">{item.title}</p>
                  <p className="mt-1 text-[0.76rem] leading-relaxed text-ink-soft/60">
                    {item.body}
                  </p>
                </div>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      <section id="api" className="mt-16">
        <Reveal>
          <div className="overflow-hidden rounded-3xl border border-lilac-200 bg-white p-6 shadow-card sm:p-9">
            <div className="grid gap-6 lg:grid-cols-[1fr_1fr] lg:items-center">
              <div>
                <span className="chip">
                  <Code2 className="h-3 w-3 text-lilac-600" />
                  B2B verification layer
                </span>
                <h2 className="mt-4 font-display text-2xl font-semibold tracking-[-0.025em] text-ink">
                  Anchor from your own stack
                </h2>
                <p className="mt-2.5 text-[0.86rem] leading-relaxed text-ink-soft/65">
                  Send a digest and receive a signed receipt. Verify later with the
                  same HMAC routine used by public trust cards. Idempotent by digest,
                  so retries are safe.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {["POST /v1/anchor", "GET /v1/proof/:id", "POST /v1/verify"].map(
                    (endpoint) => (
                      <span
                        key={endpoint}
                        className="rounded-lg border border-lilac-200 bg-lilac-50 px-2.5 py-1 font-mono text-[0.6rem] text-ink-soft/70"
                      >
                        {endpoint}
                      </span>
                    ),
                  )}
                </div>
              </div>
              <pre className="overflow-x-auto rounded-2xl border border-lilac-200 bg-[#faf8ff] p-4 font-mono text-[0.66rem] leading-relaxed text-ink-soft/75">
                <code>{`{
  "hash_id": "9f2c41b8e7a0c3d5f6a1b2c3d4e5f607",
  "status": "verified",
  "anchor": {
    "algorithm": "HMAC-SHA256",
    "node": "proofdrop-anchor-eu-01",
    "anchored_at": "2026-10-28T16:04:22.918Z",
    "signature": "3f9a…c4e1"
  }
}`}</code>
              </pre>
            </div>
          </div>
        </Reveal>
      </section>

      <section id="security" className="mt-12">
        <Reveal>
          <div className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-lilac-200/80 bg-white p-5 shadow-soft sm:flex-row sm:items-center">
            <div className="flex items-start gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-lilac-200 bg-lilac-100 text-lilac-600">
                <FileCheck2 className="h-4 w-4" />
              </span>
              <div>
                <p className="text-[0.86rem] font-semibold text-ink">
                  Security disclosure
                </p>
                <p className="mt-1 max-w-xl text-[0.76rem] leading-relaxed text-ink-soft/60">
                  Report vulnerabilities to security@proofdrop.app. Anchor secrets
                  are per-environment; production nodes rotate HMAC keys on a
                  90-day schedule.
                </p>
              </div>
            </div>
            <Link href="/verify" className="btn-primary shrink-0 !py-2.5 !text-sm">
              <Camera className="h-4 w-4" />
              Try a live proof
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </Reveal>
      </section>

      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[0.68rem] text-ink-soft/40"
      >
        <span className="inline-flex items-center gap-1.5">
          <Fingerprint className="h-3 w-3" /> SHA-256 via Web Crypto
        </span>
        <span className="inline-flex items-center gap-1.5">
          <KeyRound className="h-3 w-3" /> HMAC-SHA256 anchors
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Timer className="h-3 w-3" /> ISO-8601 timestamps
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Lock className="h-3 w-3" /> Zero-retention ingest
        </span>
      </motion.div>
    </div>
  );
}
