"use client";

import Link from "next/link";
import { useEffect } from "react";
import { RefreshCw, TriangleAlert } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[65vh] w-full max-w-2xl flex-col items-center justify-center px-4 text-center">
      <span className="grid h-14 w-14 place-items-center rounded-2xl border border-danger/25 bg-danger-soft">
        <TriangleAlert className="h-6 w-6 text-danger" />
      </span>
      <p className="mt-6 mono-label">Unexpected failure</p>
      <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-ink">
        The anchor node hit an error
      </h1>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-ink-soft/60">
        Your file was never uploaded, so nothing sensitive was transmitted. Retry
        the operation, or start a fresh proof.
      </p>
      <div className="mt-7 flex flex-col gap-3 sm:flex-row">
        <button type="button" onClick={reset} className="btn-primary !py-2.5 !text-sm">
          <RefreshCw className="h-4 w-4" />
          Retry
        </button>
        <Link href="/" className="btn-ghost !py-2.5 !text-sm">
          Back to home
        </Link>
      </div>
    </div>
  );
}
