"use client";

import Link from "next/link";
import QRCode from "qrcode";
import { useEffect, useState } from "react";
import { ReportView } from "./ReportView";
import { loadStashedRecord } from "@/lib/proof-cache";
import type { ProofRecord } from "@/lib/types";

export function LocalReportFallback({ hashId }: { hashId: string }) {
  const [state, setState] = useState<{
    checked: boolean;
    record: ProofRecord | null;
    qr?: string;
    origin: string;
  }>({ checked: false, record: null, origin: "" });

  useEffect(() => {
    const origin = window.location.origin;
    const record = loadStashedRecord(hashId);
    if (!record) {
      setState({ checked: true, record: null, origin });
      return;
    }
    setState({ checked: true, record, origin });
    QRCode.toDataURL(`${origin}/verify/${hashId}`, { margin: 1, width: 220 })
      .then((qr) => setState((prev) => ({ ...prev, qr })))
      .catch(() => undefined);
  }, [hashId]);

  if (!state.checked) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-20 text-center">
        <p className="font-mono text-xs uppercase tracking-[0.16em] text-ink-soft/50">
          loading local report…
        </p>
      </div>
    );
  }

  if (!state.record) {
    return (
      <div className="mx-auto w-full max-w-2xl px-4 py-20 text-center">
        <h1 className="font-display text-2xl font-semibold text-ink">
          This proof could not be located
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-ink-soft/65">
          The anchored record is not available on this server instance. Proofs are
          kept on the device that created them unless server-side storage is
          configured.
        </p>
        <Link href="/" className="btn-primary mt-6 inline-flex">
          Create a new proof
        </Link>
      </div>
    );
  }

  return (
    <ReportView
      record={state.record}
      shareUrl={`${state.origin}/verify/${state.record.hashId}`}
      qrDataUrl={state.qr}
      anchorValid
    />
  );
}
