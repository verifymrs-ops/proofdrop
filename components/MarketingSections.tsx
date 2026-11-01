"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  ArrowUpRight,
  Code2,
  Layers,
  ScanLine,
  Server,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Reveal } from "./Reveal";

const PLANS = [
  {
    name: "Personal",
    price: "Free",
    suffix: "forever",
    description: "For everyday proof — marketplace sales, rentals, deliveries.",
    features: [
      "Unlimited SHA-256 proofs",
      "Live camera capture",
      "Signed timestamp anchors",
      "Shareable trust links",
      "Public verification",
    ],
    cta: "Start proving",
    href: "/verify",
    highlight: false,
  },
  {
    name: "Business",
    price: "$49",
    suffix: "/ month",
    description: "For teams that verify at volume and need an audit trail.",
    features: [
      "Everything in Personal",
      "REST anchor API + webhooks",
      "Batch verification jobs",
      "Custom anchor node region",
      "Forensic PDF exports",
      "SLA & priority support",
    ],
    cta: "Talk to us",
    href: "/trust#api",
    highlight: true,
  },
];

const API_SNIPPET = `curl -X POST https://api.proofdrop.app/v1/anchor \\
  -H "Authorization: Bearer $PROOFDROP_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "sha256": "9f2c…7a11",
    "captured_at": "2026-10-28T16:04:22Z",
    "subject": "order_8f21"
  }'`;

export function PricingSection() {
  return (
    <section id="pricing" className="relative mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
      <Reveal className="mx-auto max-w-2xl text-center">
        <span className="chip mx-auto">
          <Layers className="h-3 w-3 text-lilac-600" />
          Pricing
        </span>
        <h2 className="mt-5 font-display text-3xl font-semibold tracking-[-0.03em] text-ink sm:text-[2.5rem]">
          Free for humans.{" "}
          <span className="text-gradient-lavender">Serious for teams.</span>
        </h2>
        <p className="mt-4 text-[0.96rem] leading-relaxed text-ink-soft/70">
          Trust shouldn’t be a paywall. Individual proofs are free forever — the
          business layer pays for the infrastructure.
        </p>
      </Reveal>

      <div className="mt-12 grid gap-4 lg:grid-cols-2">
        {PLANS.map((plan, index) => (
          <Reveal key={plan.name} delay={index * 0.08}>
            <div
              className={
                plan.highlight
                  ? "relative h-full overflow-hidden rounded-3xl border border-lilac-300 bg-gradient-to-b from-lilac-100 via-white to-white p-7 shadow-glow-lilac"
                  : "relative h-full overflow-hidden rounded-3xl border border-lilac-200/80 bg-white p-7 shadow-soft"
              }
            >
              {plan.highlight && (
                <span className="absolute right-6 top-6 rounded-full border border-blush-300 bg-blush-100 px-2.5 py-1 text-[0.58rem] font-semibold uppercase tracking-[0.14em] text-blush-600">
                  B2B layer
                </span>
              )}
              <p className="mono-label">{plan.name}</p>
              <div className="mt-3 flex items-end gap-2">
                <span className="font-display text-4xl font-semibold tracking-tight text-ink">
                  {plan.price}
                </span>
                <span className="pb-1.5 text-sm text-ink-soft/50">{plan.suffix}</span>
              </div>
              <p className="mt-2.5 max-w-sm text-[0.85rem] leading-relaxed text-ink-soft/65">
                {plan.description}
              </p>

              <ul className="mt-5 grid gap-2 sm:grid-cols-2">
                {plan.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start gap-2 text-[0.8rem] text-ink-soft/80"
                  >
                    <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-lilac-600" />
                    {feature}
                  </li>
                ))}
              </ul>

              <Link
                href={plan.href}
                className={
                  plan.highlight
                    ? "btn-primary mt-6 w-full !py-2.5 !text-sm"
                    : "btn-ghost mt-6 w-full !py-2.5 !text-sm"
                }
              >
                {plan.cta}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

export function ApiSection() {
  return (
    <section id="api" className="relative mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <Reveal>
        <div className="relative overflow-hidden rounded-3xl border border-lilac-200/80 bg-white p-6 shadow-card sm:p-10">
          <div
            aria-hidden
            className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-lilac-200/60 blur-3xl"
          />
          <div
            aria-hidden
            className="absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-blush-200/50 blur-3xl"
          />
          <div className="relative grid gap-8 lg:grid-cols-[1fr_1.05fr] lg:items-center">
            <div>
              <span className="chip">
                <Code2 className="h-3 w-3 text-lilac-600" />
                Verification layer
              </span>
              <h2 className="mt-4 font-display text-2xl font-semibold tracking-[-0.025em] text-ink sm:text-[2.1rem]">
                Drop cryptographic trust into any workflow
              </h2>
              <p className="mt-3 max-w-md text-[0.9rem] leading-relaxed text-ink-soft/70">
                Anchor a digest from your own backend, receive a signed receipt,
                and verify it later with a single call. Same protocol as the trust
                cards, built for automation.
              </p>
              <div className="mt-5 grid gap-2.5 sm:grid-cols-2">
                {[
                  { icon: Server, label: "Region-pinned anchor nodes" },
                  { icon: ShieldCheck, label: "HMAC-SHA256 signed receipts" },
                  { icon: Layers, label: "Idempotent by digest" },
                  { icon: Code2, label: "REST + webhooks" },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center gap-2 rounded-lg border border-lilac-200/80 bg-lilac-50 px-3 py-2 text-[0.75rem] text-ink-soft/80"
                  >
                    <item.icon className="h-3.5 w-3.5 text-lilac-600" />
                    {item.label}
                  </div>
                ))}
              </div>
            </div>

            <div className="relative overflow-hidden rounded-2xl border border-lilac-200 bg-[#faf8ff] shadow-soft">
              <div className="flex items-center justify-between border-b border-lilac-200/70 px-4 py-2.5">
                <span className="flex items-center gap-1.5 font-mono text-[0.6rem] uppercase tracking-[0.14em] text-ink-soft/50">
                  <span className="h-1.5 w-1.5 rounded-full bg-verify" />
                  anchor.sh
                </span>
                <span className="font-mono text-[0.55rem] uppercase tracking-[0.12em] text-ink-soft/40">
                  POST /v1/anchor
                </span>
              </div>
              <pre className="overflow-x-auto px-4 py-4 font-mono text-[0.68rem] leading-relaxed text-ink-soft/80">
                <code>{API_SNIPPET}</code>
              </pre>
              <div className="flex items-center justify-between border-t border-lilac-200/70 px-4 py-2.5">
                <span className="font-mono text-[0.6rem] text-verify">
                  201 · signed_receipt
                </span>
                <span className="font-mono text-[0.55rem] text-ink-soft/40">~180ms</span>
              </div>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

export function FinalCta() {
  const reduce = useReducedMotion();

  return (
    <section className="relative mx-auto w-full max-w-7xl px-4 pb-4 sm:px-6 lg:px-8">
      <Reveal>
        <div className="relative overflow-hidden rounded-[2rem] border border-lilac-200 bg-white px-6 py-14 text-center shadow-card sm:px-10 sm:py-20">
          <motion.div
            aria-hidden
            className="absolute left-1/2 top-0 h-[30rem] w-[46rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_50%_0%,rgba(155,124,240,0.34),rgba(238,111,174,0.16)_42%,transparent_70%)] blur-2xl"
            animate={reduce ? undefined : { opacity: [0.65, 1, 0.65] }}
            transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
          />
          <div className="relative">
            <span className="chip mx-auto">
              <Sparkles className="h-3 w-3 text-lilac-600" />
              No account required
            </span>
            <h2 className="mx-auto mt-5 max-w-2xl font-display text-3xl font-semibold leading-tight tracking-[-0.03em] text-ink sm:text-[2.9rem]">
              Your next dispute ends with{" "}
              <span className="text-gradient-lavender">one link</span>
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-[0.96rem] leading-relaxed text-ink-soft/70">
              Fingerprint a file now and watch the trust card build itself in under
              a second. Your evidence stays yours.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href="/verify" className="btn-primary group">
                <ScanLine className="h-4 w-4" />
                Create a secure proof drop
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link href="/trust" className="btn-ghost">
                See how verification works
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
