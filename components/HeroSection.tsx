"use client";

import Link from "next/link";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import {
  ArrowRight,
  BadgeCheck,
  Camera,
  Clock,
  Fingerprint,
  Lock,
  ScanLine,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";
import { useRef } from "react";
import { UploadDropzone } from "./UploadDropzone";

const HERO_STATS = [
  { label: "Hash latency", value: "0.4s", icon: Zap },
  { label: "Proof size", value: "768-bit", icon: Fingerprint },
  { label: "Files stored", value: "0", icon: Lock },
];

const TRUST_CHIPS = ["OLX handoff", "Rental condition", "Delivery proof", "Contract signing"];

export function HeroSection() {
  const reduce = useReducedMotion();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });
  const cardY = useTransform(scrollYProgress, [0, 1], [0, -40]);
  const cardRotate = useTransform(scrollYProgress, [0, 1], [0, -2.5]);

  return (
    <section ref={containerRef} className="relative overflow-hidden">
      <div className="mx-auto w-full max-w-7xl px-4 pt-12 sm:px-6 sm:pt-16 lg:px-8 lg:pt-20">
        <div className="grid items-start gap-12 lg:grid-cols-[1.02fr_0.98fr] lg:gap-14">
          <div className="relative">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
              className="inline-flex items-center gap-2 rounded-full border border-lilac-200 bg-white/80 py-1.5 pl-1.5 pr-4 shadow-soft backdrop-blur"
            >
              <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-lilac-500 to-blush-500 px-2.5 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-white">
                <Sparkles className="h-3 w-3" />
                Free for people
              </span>
              <span className="text-xs text-ink-soft/75">
                Proof of authenticity, without the paperwork
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.75, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
              className="mt-6 font-display text-[2.6rem] font-semibold leading-[1.04] tracking-[-0.035em] text-ink sm:text-6xl lg:text-[4.15rem]"
            >
              Prove it happened.
              <br />
              <span className="text-gradient-lavender">Notarized in seconds.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="mt-5 max-w-xl text-[1.02rem] leading-relaxed text-ink-soft/75 sm:text-lg"
            >
              Snap a photo or drop a document. ProofDrop fingerprints it with
              SHA-256 on your device, anchors a signed timestamp, and hands you a
              trust report anyone can verify — no account, no upload of the
              original file.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center"
            >
              <Link href="/verify" className="btn-primary group">
                <ScanLine className="h-4 w-4" />
                Verify a file instantly
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
              <Link href="#drop" className="btn-ghost group">
                <Camera className="h-4 w-4 text-lilac-600" />
                Create a secure proof drop
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2"
            >
              {["No signup", "Runs in-browser", "Shareable link"].map((item) => (
                <span
                  key={item}
                  className="inline-flex items-center gap-1.5 text-xs text-ink-soft/60"
                >
                  <BadgeCheck className="h-3.5 w-3.5 text-lilac-500" />
                  {item}
                </span>
              ))}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.46 }}
              className="mt-8 grid max-w-md grid-cols-3 gap-3"
            >
              {HERO_STATS.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-xl border border-lilac-200/70 bg-white/80 px-3 py-2.5 shadow-soft"
                >
                  <stat.icon className="h-3.5 w-3.5 text-lilac-500" />
                  <p className="mt-1.5 font-display text-base font-semibold text-ink">
                    {stat.value}
                  </p>
                  <p className="text-[0.62rem] uppercase tracking-[0.1em] text-ink-soft/45">
                    {stat.label}
                  </p>
                </div>
              ))}
            </motion.div>
          </div>

          <div className="relative" id="drop">
            <motion.div
              aria-hidden
              className="pointer-events-none absolute -inset-x-10 -top-10 h-[26rem] rounded-full bg-[radial-gradient(circle_at_50%_40%,rgba(155,124,240,0.3),transparent_62%)] blur-2xl"
              animate={reduce ? undefined : { opacity: [0.5, 0.9, 0.5] }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            />

            <motion.div
              initial={{ opacity: 0, y: 26, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.24, ease: [0.22, 1, 0.36, 1] }}
              className="relative"
            >
              <div className="glass-panel relative overflow-hidden p-1.5">
                <div className="rounded-[1.6rem] border border-lilac-200/60 bg-white/75 p-4 sm:p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-blush-300" />
                      <span className="h-2.5 w-2.5 rounded-full bg-amber-300/80" />
                      <span className="h-2.5 w-2.5 rounded-full bg-verify/50" />
                    </div>
                    <span className="mono-label !text-[0.58rem]">proofdrop://capture</span>
                    <span className="flex items-center gap-1 rounded-full border border-verify/20 bg-verify-soft px-2 py-0.5 text-[0.55rem] font-semibold uppercase tracking-[0.12em] text-verify">
                      <span className="h-1 w-1 rounded-full bg-verify" />
                      live
                    </span>
                  </div>

                  <UploadDropzone compact />

                  <div className="mt-4 flex items-center justify-between rounded-xl border border-lilac-200/60 bg-lilac-50/70 px-3 py-2">
                    <span className="flex items-center gap-1.5 font-mono text-[0.6rem] uppercase tracking-[0.14em] text-ink-soft/50">
                      <Lock className="h-3 w-3 text-lilac-500" />
                      zero-knowledge ingest
                    </span>
                    <span className="font-mono text-[0.6rem] text-ink-soft/35">
                      sha256 / hmac
                    </span>
                  </div>
                </div>
              </div>

              <motion.div
                style={reduce ? undefined : { y: cardY, rotate: cardRotate }}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.85, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="relative z-10 -mt-6 ml-auto w-[min(100%,21rem)] sm:-mt-8 sm:mr-[-0.5rem]"
              >
                <div className="glass-panel-soft relative overflow-hidden p-4 shadow-glow-lilac">
                  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-lilac-400 to-transparent" />
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <span className="grid h-7 w-7 place-items-center rounded-lg bg-verify-soft">
                        <ShieldCheck className="h-3.5 w-3.5 text-verify" />
                      </span>
                      <div>
                        <p className="text-[0.7rem] font-semibold text-ink">
                          Trust card verified
                        </p>
                        <p className="font-mono text-[0.55rem] uppercase tracking-[0.12em] text-ink-soft/45">
                          olx-handoff.jpg
                        </p>
                      </div>
                    </div>
                    <span className="rounded-full border border-verify/20 bg-verify-soft px-2 py-0.5 text-[0.55rem] font-semibold uppercase tracking-[0.12em] text-verify">
                      pass
                    </span>
                  </div>

                  <div className="mt-3 space-y-1.5">
                    {[
                      { label: "SHA-256 match", value: "0x8f3a…c21e", icon: Fingerprint },
                      { label: "Anchored", value: "2026-10-28 16:04 UTC", icon: Clock },
                      { label: "Device", value: "iPhone 15 Pro", icon: Camera },
                    ].map((row) => (
                      <div
                        key={row.label}
                        className="flex items-center justify-between gap-2 rounded-md bg-lilac-50 px-2 py-1.5"
                      >
                        <span className="flex items-center gap-1.5 text-[0.6rem] text-ink-soft/60">
                          <row.icon className="h-2.5 w-2.5" />
                          {row.label}
                        </span>
                        <span className="font-mono text-[0.58rem] text-ink-soft/80">
                          {row.value}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <span className="font-mono text-[0.52rem] uppercase tracking-[0.14em] text-ink-soft/35">
                      hmac · eu-01
                    </span>
                    <span className="flex items-center gap-1 text-[0.55rem] text-verify">
                      <span className="relative flex h-1 w-1">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-verify opacity-75" />
                        <span className="relative inline-flex h-1 w-1 rounded-full bg-verify" />
                      </span>
                      immutable
                    </span>
                  </div>
                </div>
              </motion.div>
            </motion.div>

            <div className="mt-7 flex flex-wrap justify-center gap-2 lg:justify-start">
              {TRUST_CHIPS.map((chip, index) => (
                <motion.span
                  key={chip}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 + index * 0.07, duration: 0.4 }}
                  className="rounded-full border border-lilac-200/80 bg-white/70 px-3 py-1.5 text-[0.68rem] text-ink-soft/65"
                >
                  {chip}
                </motion.span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
