import Link from "next/link";
import { Fingerprint, ScanLine } from "lucide-react";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[65vh] w-full max-w-2xl flex-col items-center justify-center px-4 text-center">
      <span className="grid h-14 w-14 place-items-center rounded-2xl border border-lilac-200 bg-lilac-100">
        <Fingerprint className="h-6 w-6 text-lilac-600" />
      </span>
      <p className="mt-6 mono-label">Error 404</p>
      <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
        This proof trail goes cold
      </h1>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-ink-soft/60">
        The page or proof id you requested does not exist. Proof links look like
        <span className="font-mono text-ink-soft/80"> /verify/&lt;32-hex-id&gt;</span>.
      </p>
      <div className="mt-7 flex flex-col gap-3 sm:flex-row">
        <Link href="/verify" className="btn-primary !py-2.5 !text-sm">
          <ScanLine className="h-4 w-4" />
          Create a proof
        </Link>
        <Link href="/" className="btn-ghost !py-2.5 !text-sm">
          Back to home
        </Link>
      </div>
    </div>
  );
}
