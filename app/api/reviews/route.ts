import { NextResponse } from "next/server";
import {
  createReview,
  hasReviews,
  incrementHelpful,
  listReviews,
  reviewStats,
  REVIEW_USE_CASES,
} from "@/lib/reviews-store";
import { toPublicReview, type ReviewInput } from "@/lib/reviews-types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;

function clean(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

export async function GET() {
  const [reviews, stats] = await Promise.all([
    listReviews({ limit: 100 }),
    reviewStats(),
  ]);
  return NextResponse.json(
    {
      reviews: reviews.map(toPublicReview),
      stats: {
        total: stats.published,
        averageRating: Number(stats.averageRating.toFixed(2)),
        ratingBreakdown: stats.ratingBreakdown,
        useCases: stats.useCases,
      },
      useCases: [...REVIEW_USE_CASES],
    },
    { headers: { "cache-control": "no-store" } },
  );
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Malformed request." }, { status: 400 });
  }

  const name = clean(body.name)?.trim() ?? "";
  const title = clean(body.title)?.trim() ?? "";
  const bodyText = clean(body.body)?.trim() ?? "";
  const ratingRaw = Number(body.rating);
  const email = clean(body.email)?.trim();

  const errors: string[] = [];
  if (name.length < 2) errors.push("Please provide your name (2+ characters).");
  if (name.length > 60) errors.push("Name must be 60 characters or fewer.");
  if (title.length < 4) errors.push("Add a short headline (4+ characters).");
  if (title.length > 120) errors.push("Headline must be 120 characters or fewer.");
  if (bodyText.length < 20) errors.push("Please write at least 20 characters.");
  if (bodyText.length > 1200) errors.push("Review must be 1200 characters or fewer.");
  if (!Number.isFinite(ratingRaw) || ratingRaw < 1 || ratingRaw > 5) {
    errors.push("Choose a rating between 1 and 5.");
  }
  if (email && !EMAIL_PATTERN.test(email)) {
    errors.push("That email address looks invalid.");
  }

  if (errors.length > 0) {
    return NextResponse.json({ error: errors[0], errors }, { status: 400 });
  }

  const useCaseRaw = clean(body.useCase);
  const useCase =
    useCaseRaw && (REVIEW_USE_CASES as readonly string[]).includes(useCaseRaw)
      ? useCaseRaw
      : undefined;

  const role = clean(body.role)?.trim();

  const input: ReviewInput = {
    name,
    role: role && role.length <= 80 ? role : undefined,
    rating: Math.round(ratingRaw),
    title,
    body: bodyText,
    useCase,
    email,
  };

  const firstReview = !(await hasReviews().catch(() => true));
  const review = await createReview(input, request.headers.get("user-agent") ?? undefined);

  return NextResponse.json(
    { ok: true, review: toPublicReview(review), firstReview },
    { status: 201 },
  );
}

export async function PATCH(request: Request) {
  let body: { id?: unknown; action?: unknown };
  try {
    body = (await request.json()) as { id?: unknown; action?: unknown };
  } catch {
    return NextResponse.json({ error: "Malformed request." }, { status: 400 });
  }
  const id = typeof body.id === "string" ? body.id : "";
  if (!id || body.action !== "helpful") {
    return NextResponse.json({ error: "Unsupported action." }, { status: 400 });
  }
  const found = await incrementHelpful(id);
  return NextResponse.json({ ok: found }, { status: found ? 200 : 404 });
}
