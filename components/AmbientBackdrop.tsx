"use client";

import { motion, useReducedMotion } from "framer-motion";

const ORBS = [
  {
    className: "absolute -top-[18%] left-[6%] h-[34rem] w-[34rem]",
    background:
      "radial-gradient(circle at 50% 50%, rgba(155,124,240,0.55) 0%, rgba(155,124,240,0.18) 42%, rgba(252,251,255,0) 70%)",
    animation: "bob 16s ease-in-out infinite",
  },
  {
    className: "absolute -top-[6%] right-[2%] h-[28rem] w-[28rem]",
    background:
      "radial-gradient(circle at 50% 50%, rgba(238,111,174,0.45) 0%, rgba(238,111,174,0.14) 44%, rgba(252,251,255,0) 72%)",
    animation: "bob 21s ease-in-out infinite reverse",
  },
  {
    className: "absolute bottom-[-14%] left-[26%] h-[30rem] w-[30rem]",
    background:
      "radial-gradient(circle at 50% 50%, rgba(79,156,247,0.34) 0%, rgba(79,156,247,0.1) 46%, rgba(252,251,255,0) 72%)",
    animation: "bob 26s ease-in-out infinite",
  },
  {
    className: "absolute bottom-[6%] right-[18%] h-[22rem] w-[22rem]",
    background:
      "radial-gradient(circle at 50% 50%, rgba(210,196,255,0.6) 0%, rgba(210,196,255,0.18) 44%, rgba(252,251,255,0) 72%)",
    animation: "glow 9s ease-in-out infinite",
  },
];

const SPARKS = [
  { top: "14%", left: "22%", size: 8, delay: "0s", duration: "9s" },
  { top: "26%", left: "72%", size: 6, delay: "1.4s", duration: "11s" },
  { top: "48%", left: "12%", size: 5, delay: "2.6s", duration: "13s" },
  { top: "62%", left: "84%", size: 9, delay: "0.8s", duration: "10s" },
  { top: "78%", left: "38%", size: 6, delay: "2s", duration: "12s" },
  { top: "38%", left: "56%", size: 4, delay: "3.2s", duration: "14s" },
  { top: "6%", left: "48%", size: 5, delay: "1.8s", duration: "10.5s" },
];

export function AmbientBackdrop() {
  const reduce = useReducedMotion();

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(180deg,#fdfbff_0%,#faf6ff_38%,#f7f2ff_68%,#fdf9ff_100%)]" />

      {ORBS.map((orb, index) => (
        <div
          key={index}
          className={orb.className}
          style={{
            background: orb.background,
            filter: "blur(60px)",
            opacity: 0.75,
            animation: reduce ? undefined : orb.animation,
          }}
        />
      ))}

      <div className="absolute inset-0 grid-backdrop opacity-70" />

      {SPARKS.map((spark, index) => (
        <motion.span
          key={index}
          className="absolute rounded-full"
          style={{
            top: spark.top,
            left: spark.left,
            width: spark.size,
            height: spark.size,
            background:
              "radial-gradient(circle, rgba(155,124,240,0.95) 0%, rgba(238,111,174,0.5) 55%, transparent 70%)",
            boxShadow: "0 0 14px rgba(155,124,240,0.6)",
          }}
          animate={
            reduce
              ? undefined
              : { y: [0, -18, 0], opacity: [0.35, 0.95, 0.35] }
          }
          transition={{
            duration: Number.parseFloat(spark.duration),
            delay: Number.parseFloat(spark.delay),
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}

      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-lilac-400/50 to-transparent" />

      <div className="absolute inset-0 bg-[radial-gradient(ellipse_130%_90%_at_50%_-20%,transparent_45%,rgba(252,251,255,0.55)_82%,rgba(252,251,255,0.9)_100%)]" />
    </div>
  );
}
