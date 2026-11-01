import { NextResponse } from "next/server";
import { verifyAnchor } from "@/lib/anchor";
import { readProof, isValidHashId } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SHA256_PATTERN = /^[a-f0-9]{64}$/;

export async function POST(request: Request) {
  let body: { hashId?: unknown; sha256?: unknown };
  try {
    body = (await request.json()) as { hashId?: unknown; sha256?: unknown };
  } catch {
    return NextResponse.json({ error: "Malformed JSON body." }, { status: 400 });
  }

  const hashId = typeof body.hashId === "string" ? body.hashId : "";
  if (!isValidHashId(hashId)) {
    return NextResponse.json({ error: "Invalid proof id." }, { status: 400 });
  }

  const record = await readProof(hashId);
  if (!record) {
    return NextResponse.json({ error: "Proof not found." }, { status: 404 });
  }

  const verification = await verifyAnchor(record);
  const supplied =
    typeof body.sha256 === "string" ? body.sha256.toLowerCase() : undefined;
  const hashMatch =
    supplied && SHA256_PATTERN.test(supplied) ? supplied === record.sha256 : undefined;

  const valid =
    verification.signatureValid && verification.digestValid && verification.metaDigestValid;

  const message = !valid
    ? "Anchor signature mismatch. The stored report was modified after anchoring."
    : hashMatch === false
      ? "Signature valid, but the uploaded file does not match the anchored digest."
      : hashMatch === true
        ? "Signature valid and the uploaded file matches the anchored digest."
        : "Anchor signature valid. Report is intact.";

  return NextResponse.json(
    {
      valid,
      signatureValid: verification.signatureValid,
      digestValid: verification.digestValid,
      hashMatch,
      algorithm: record.anchor.algorithm,
      node: record.anchor.node,
      anchoredAt: record.anchor.anchoredAt,
      status: record.status,
      message,
    },
    { headers: { "cache-control": "no-store" } },
  );
}
