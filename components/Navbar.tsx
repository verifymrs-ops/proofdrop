"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion, useScroll, useMotionValueEvent } from "framer-motion";
import { Fingerprint, Menu, X } from "lucide-react";
import { cn } from "@/lib/format";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/verify", label: "Verify" },
  { href: "/trust", label: "How it works" },
  { href: "/reviews", label: "Reviews" },
];

export function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (value) => {
    setScrolled(value > 20);
  });

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="sticky top-0 z-50 w-full"
    >
      <div
        className={cn(
          "mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-4 transition-all duration-500 sm:h-[4.5rem] sm:px-6 lg:px-8",
          scrolled && "backdrop-blur-xl",
        )}
      >
        <div
          className={cn(
            "pointer-events-none absolute inset-x-0 top-0 -z-10 h-full border-b transition-all duration-500",
            scrolled
              ? "border-lilac-200/70 bg-white/80 shadow-[0_16px_40px_-32px_rgba(64,40,120,0.4)]"
              : "border-transparent bg-transparent",
          )}
        />

        <Link href="/" className="group flex items-center gap-2.5" aria-label="ProofDrop home">
          <span className="relative grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-lilac-500 via-lilac-500 to-blush-500 shadow-glow-lilac">
            <Fingerprint className="h-[1.15rem] w-[1.15rem] text-white transition-transform duration-500 group-hover:rotate-12" />
            <span className="absolute inset-0 rounded-xl ring-1 ring-inset ring-white/30" />
          </span>
          <span className="font-display text-[1.0625rem] font-semibold tracking-[-0.02em] text-ink">
            Proof<span className="text-gradient-lavender">Drop</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
          {LINKS.map((link) => {
            const active = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "relative rounded-full px-4 py-2 text-sm font-medium transition-colors duration-200",
                  active ? "text-ink" : "text-ink-soft/65 hover:text-ink",
                )}
              >
                {active && (
                  <motion.span
                    layoutId="nav-pill"
                    className="absolute inset-0 -z-10 rounded-full border border-lilac-200 bg-lilac-50"
                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  />
                )}
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <Link href="/verify" className="btn-primary !px-5 !py-2.5 !text-sm">
            Create proof
          </Link>
          <button
            type="button"
            onClick={() => setOpen((prev) => !prev)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            className="grid h-10 w-10 place-items-center rounded-xl border border-lilac-200 bg-white text-ink transition hover:bg-lilac-50 md:hidden"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22 }}
            className="absolute inset-x-0 top-full border-b border-lilac-200 bg-white/97 px-4 pb-6 pt-3 backdrop-blur-2xl md:hidden"
          >
            <nav className="flex flex-col gap-1" aria-label="Mobile">
              {LINKS.map((link) => (
                <Link
                  key={`m-${link.href}`}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="rounded-xl px-4 py-3 text-[0.95rem] font-medium text-ink-soft transition hover:bg-lilac-50 hover:text-ink"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
