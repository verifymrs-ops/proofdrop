import { NextResponse } from "next/server";
import { readProof, isValidHashId } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ hashId: string }> },
) {
  const { hashId } = await context.params;
  if (!isValidHashId(hashId)) {
    return NextResponse.json({ error: "Invalid proof id." }, { status: 400 });
  }
  const record = await readProof(hashId);
  if (!record) {
    return NextResponse.json({ error: "Proof not found." }, { status: 404 });
  }
  return NextResponse.json(
    { record },
    { headers: { "cache-control": "no-store" } },
  );
}
