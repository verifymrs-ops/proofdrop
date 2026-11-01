"use client";

import { motion } from "framer-motion";
import { BadgeCheck, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/format";
import type { ProofStatus } from "@/lib/types";

export function StatusBadge({
  status,
  label,
  size = "md",
  pulse = true,
}: {
  status: ProofStatus;
  label?: string;
  size?: "sm" | "md" | "lg";
  pulse?: boolean;
}) {
  const verified = status === "verified";
  const sizes = {
    sm: "gap-1.5 px-2.5 py-1 text-[0.65rem]",
    md: "gap-2 px-3.5 py-1.5 text-[0.72rem]",
    lg: "gap-2.5 px-5 py-2.5 text-sm",
  } as const;

  return (
    <span
      className={cn(
        "relative inline-flex items-center rounded-full border font-semibold uppercase tracking-[0.13em]",
        sizes[size],
        verified
          ? "border-verify/25 bg-verify-soft text-verify"
          : "border-danger/25 bg-danger-soft text-danger",
      )}
    >
      <span className="relative flex items-center">
        {pulse && (
          <motion.span
            aria-hidden
            className={cn(
              "absolute inset-0 rounded-full",
              verified ? "bg-verify/50" : "bg-danger/50",
            )}
            animate={{ scale: [1, 2.6], opacity: [0.7, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
          />
        )}
        {verified ? (
          <BadgeCheck className={cn(size === "lg" ? "h-4 w-4" : "h-3.5 w-3.5")} />
        ) : (
          <ShieldAlert className={cn(size === "lg" ? "h-4 w-4" : "h-3.5 w-3.5")} />
        )}
      </span>
      {label ?? (verified ? "Verified authentic" : "Tampered / edited")}
    </span>
  );
}
