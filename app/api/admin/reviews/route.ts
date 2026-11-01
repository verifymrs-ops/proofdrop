import { NextResponse } from "next/server";
import { isOwner } from "@/lib/admin-auth";
import {
  deleteReview,
  listReviews,
  reviewStats,
  setPublished,
} from "@/lib/reviews-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isOwner())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const [reviews, stats] = await Promise.all([
    listReviews({ includeUnpublished: true }),
    reviewStats(),
  ]);

  return NextResponse.json(
    { reviews, stats },
    { headers: { "cache-control": "no-store" } },
  );
}

export async function PATCH(request: Request) {
  if (!(await isOwner())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let body: { id?: unknown; published?: unknown };
  try {
    body = (await request.json()) as { id?: unknown; published?: unknown };
  } catch {
    return NextResponse.json({ error: "Malformed request." }, { status: 400 });
  }

  const id = typeof body.id === "string" ? body.id : "";
  const published = Boolean(body.published);
  if (!id) {
    return NextResponse.json({ error: "Review id required." }, { status: 400 });
  }

  const found = await setPublished(id, published);
  return NextResponse.json({ ok: found }, { status: found ? 200 : 404 });
}

export async function DELETE(request: Request) {
  if (!(await isOwner())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const id = new URL(request.url).searchParams.get("id") ?? "";
  if (!id) {
    return NextResponse.json({ error: "Review id required." }, { status: 400 });
  }

  const found = await deleteReview(id);
  return NextResponse.json({ ok: found }, { status: found ? 200 : 404 });
}
