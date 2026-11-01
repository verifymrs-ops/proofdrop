import Link from "next/link";
import { CodeXml, Fingerprint } from "lucide-react";

const COLUMNS = [
  {
    title: "Product",
    links: [
      { label: "Create a proof", href: "/verify" },
      { label: "Verify a file", href: "/verify" },
      { label: "How it works", href: "/trust" },
      { label: "Trust cards", href: "/trust#cards" },
    ],
  },
  {
    title: "For business",
    links: [
      { label: "Marketplace sellers", href: "/trust#use-cases" },
      { label: "Rentals & deposits", href: "/trust#use-cases" },
      { label: "Delivery handoff", href: "/trust#use-cases" },
      { label: "API anchor layer", href: "/trust#api" },
    ],
  },
  {
    title: "Community",
    links: [
      { label: "User reviews", href: "/reviews" },
      { label: "Leave a review", href: "/reviews#write" },
      { label: "Privacy model", href: "/trust#privacy" },
      { label: "Security contact", href: "/trust#security" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="relative z-10 mt-24 border-t border-lilac-200/70 bg-white/60">
      <div className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_2fr]">
          <div className="max-w-sm">
            <Link href="/" className="flex items-center gap-2.5">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-lilac-500 to-blush-500 shadow-glow-lilac">
                <Fingerprint className="h-[1.15rem] w-[1.15rem] text-white" />
              </span>
              <span className="font-display text-[1.0625rem] font-semibold tracking-tight text-ink">
                Proof<span className="text-gradient-lavender">Drop</span>
              </span>
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-ink-soft/70">
              Cryptographic proof of authenticity for everyday people. Your file is
              hashed on-device, then anchored with a signed timestamp you can share
              with anyone.
            </p>
            <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-verify/20 bg-verify-soft px-3 py-1.5">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-verify opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-verify" />
              </span>
              <span className="font-mono text-[0.625rem] uppercase tracking-[0.18em] text-verify">
                Anchor node online
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            {COLUMNS.map((column) => (
              <div key={column.title}>
                <p className="mono-label">{column.title}</p>
                <ul className="mt-4 space-y-2.5">
                  {column.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="text-sm text-ink-soft/70 transition-colors hover:text-ink"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 hairline" />

        <div className="mt-6 flex flex-col items-start justify-between gap-4 text-xs text-ink-soft/50 sm:flex-row sm:items-center">
          <p>© {new Date().getFullYear()} ProofDrop Labs. All proofs remain verifiable.</p>
          <div className="flex items-center gap-5">
            <span className="font-mono text-[0.625rem] uppercase tracking-[0.18em]">
              SHA-256 · HMAC anchored
            </span>
            <Link href="/reviews" className="inline-flex items-center gap-1.5 transition hover:text-ink">
              <CodeXml className="h-3.5 w-3.5" />
              Community built
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
