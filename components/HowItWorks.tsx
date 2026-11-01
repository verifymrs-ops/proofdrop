"use client";

import Link from "next/link";
import {
  ArrowRight,
  Banknote,
  Camera,
  FileCheck2,
  Fingerprint,
  KeyRound,
  PackageCheck,
  ScanLine,
  ShieldCheck,
  Smartphone,
  Timer,
  UploadCloud,
} from "lucide-react";
import { Reveal, Stagger, StaggerItem } from "./Reveal";

const STEPS = [
  {
    step: "01",
    title: "Capture or drop",
    body: "Use the live camera or drag a photo, PDF, or contract into the dropzone. Nothing is uploaded for hashing.",
    icon: Camera,
  },
  {
    step: "02",
    title: "Fingerprint on-device",
    body: "Web Crypto derives a 256-bit SHA-256 digest locally. The digest leaves your browser; the file does not.",
    icon: Fingerprint,
  },
  {
    step: "03",
    title: "Anchor the timestamp",
    body: "Our node signs the digest plus metadata with HMAC-SHA256, producing a tamper-evident anchor record.",
    icon: KeyRound,
  },
  {
    step: "04",
    title: "Share the trust card",
    body: "Get a permanent /verify link. Anyone can re-check integrity, provenance, and device signals in one view.",
    icon: ScanLine,
  },
];

const FEATURES = [
  {
    title: "Client-side SHA-256",
    body: "Hashing runs through the Web Crypto API, so raw evidence never needs to leave the device.",
    icon: Fingerprint,
    accent: "verify" as const,
  },
  {
    title: "Signed anchor layer",
    body: "Every report carries an HMAC-SHA256 anchor with node identity, version, and anchored timestamp.",
    icon: ShieldCheck,
    accent: "lilac" as const,
  },
  {
    title: "Forensic provenance checks",
    body: "EXIF presence, editing-suite signatures, timestamp drift, and device identifiers are scored together.",
    icon: FileCheck2,
    accent: "verify" as const,
  },
  {
    title: "Zero-retention ingest",
    body: "Only the digest and derived metadata are stored. Original evidence stays under your control.",
    icon: UploadCloud,
    accent: "lilac" as const,
  },
];

const USE_CASES = [
  {
    title: "Marketplace sellers",
    body: "Prove the exact condition of an item before shipping. Kill the “that’s not what I sent” dispute.",
    icon: Banknote,
    tag: "OLX · eBay · Vinted",
  },
  {
    title: "Rentals & deposits",
    body: "Document every wall, appliance, and meter reading at move-in and move-out with a timestamp.",
    icon: Smartphone,
    tag: "Landlords · Tenants",
  },
  {
    title: "Delivery handoff",
    body: "Scan the parcel at the doorstep. The recipient verifies the same digest at pickup.",
    icon: PackageCheck,
    tag: "Couriers · Logistics",
  },
  {
    title: "Freelance & contracts",
    body: "Anchor the signed PDF the moment it’s final. No more version ambiguity in disputes.",
    icon: Timer,
    tag: "Agencies · Legal",
  },
];

export function HowItWorks() {
  return (
    <section id="how" className="relative mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
      <Reveal className="mx-auto max-w-2xl text-center">
        <span className="chip mx-auto">
          <ShieldCheck className="h-3 w-3 text-lilac-600" />
          The pipeline
        </span>
        <h2 className="mt-5 font-display text-3xl font-semibold tracking-[-0.03em] text-ink sm:text-[2.6rem]">
          Four steps from photo to{" "}
          <span className="text-gradient-lavender">undeniable proof</span>
        </h2>
        <p className="mt-4 text-[0.98rem] leading-relaxed text-ink-soft/70">
          No wallets, no seed phrases, no blockchain gas. Just modern cryptography
          applied at the moment evidence is created.
        </p>
      </Reveal>

      <div className="relative mt-14">
        <div
          aria-hidden
          className="absolute left-0 right-0 top-[3.4rem] hidden h-px bg-gradient-to-r from-transparent via-lilac-300/60 to-transparent lg:block"
        />
        <Stagger className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step) => (
            <StaggerItem key={step.step}>
              <div className="group relative h-full overflow-hidden rounded-2xl border border-lilac-200/80 bg-white p-5 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:border-lilac-300 hover:shadow-glow-lilac">
                <div className="flex items-center justify-between">
                  <span className="grid h-10 w-10 place-items-center rounded-xl border border-lilac-200 bg-lilac-100 text-lilac-600">
                    <step.icon className="h-4 w-4" />
                  </span>
                  <span className="font-mono text-[0.65rem] tracking-[0.2em] text-ink-soft/25">
                    {step.step}
                  </span>
                </div>
                <h3 className="mt-4 font-display text-[1.02rem] font-semibold text-ink">
                  {step.title}
                </h3>
                <p className="mt-2 text-[0.82rem] leading-relaxed text-ink-soft/65">
                  {step.body}
                </p>
                <span className="absolute inset-x-5 bottom-0 h-px bg-gradient-to-r from-transparent via-lilac-400 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </div>

      <div id="use-cases" className="mt-24 grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
        <Reveal>
          <span className="chip">
            <PackageCheck className="h-3 w-3 text-lilac-600" />
            Real-world use
          </span>
          <h3 className="mt-4 font-display text-2xl font-semibold tracking-[-0.025em] text-ink sm:text-3xl">
            Built for the moments where words stop working
          </h3>
          <p className="mt-3 text-[0.94rem] leading-relaxed text-ink-soft/70">
            Disputes rarely hinge on arguments — they hinge on evidence. ProofDrop
            gives everyday people the same forensic primitive that enterprises pay
            for.
          </p>
          <Link href="/verify" className="btn-primary mt-6 !py-2.5 !text-sm">
            Create your first proof
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Reveal>

        <Stagger className="grid gap-3 sm:grid-cols-2">
          {USE_CASES.map((useCase) => (
            <StaggerItem key={useCase.title}>
              <div className="group h-full rounded-2xl border border-lilac-200/80 bg-gradient-to-br from-white to-lilac-50 p-5 shadow-soft transition-all duration-300 hover:border-verify/30 hover:from-verify-soft">
                <div className="flex items-center justify-between">
                  <span className="grid h-9 w-9 place-items-center rounded-lg border border-lilac-200 bg-white text-verify">
                    <useCase.icon className="h-4 w-4" />
                  </span>
                  <span className="font-mono text-[0.55rem] uppercase tracking-[0.12em] text-ink-soft/40">
                    {useCase.tag}
                  </span>
                </div>
                <h4 className="mt-3.5 text-[0.95rem] font-semibold text-ink">
                  {useCase.title}
                </h4>
                <p className="mt-1.5 text-[0.8rem] leading-relaxed text-ink-soft/65">
                  {useCase.body}
                </p>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}

export function FeatureGrid() {
  return (
    <section className="relative mx-auto w-full max-w-7xl px-4 pb-4 sm:px-6 lg:px-8">
      <Stagger className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        {FEATURES.map((feature) => (
          <StaggerItem key={feature.title}>
            <div className="relative h-full overflow-hidden rounded-2xl border border-lilac-200/80 bg-white p-5 shadow-soft">
              <span
                aria-hidden
                className="absolute -right-8 -top-8 h-24 w-24 rounded-full blur-2xl"
                style={{
                  background:
                    feature.accent === "verify" ? "rgba(13,143,107,0.14)" : "rgba(155,124,240,0.18)",
                }}
              />
              <span
                className={
                  feature.accent === "verify"
                    ? "grid h-9 w-9 place-items-center rounded-lg border border-verify/25 bg-verify-soft text-verify"
                    : "grid h-9 w-9 place-items-center rounded-lg border border-lilac-300 bg-lilac-100 text-lilac-600"
                }
              >
                <feature.icon className="h-4 w-4" />
              </span>
              <h3 className="mt-4 text-[0.92rem] font-semibold text-ink">
                {feature.title}
              </h3>
              <p className="mt-1.5 text-[0.78rem] leading-relaxed text-ink-soft/65">
                {feature.body}
              </p>
            </div>
          </StaggerItem>
        ))}
      </Stagger>
    </section>
  );
}
