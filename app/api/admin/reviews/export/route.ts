import { NextResponse } from "next/server";
import { isOwner } from "@/lib/admin-auth";
import { listReviews, reviewStats } from "@/lib/reviews-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function csvCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  const text = String(value);
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

export async function GET(request: Request) {
  if (!(await isOwner())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const format = new URL(request.url).searchParams.get("format") === "json" ? "json" : "csv";
  const [reviews, stats] = await Promise.all([
    listReviews({ includeUnpublished: true }),
    reviewStats(),
  ]);
  const stamp = new Date().toISOString().slice(0, 10);

  if (format === "json") {
    const payload = JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        stats,
        reviews,
      },
      null,
      2,
    );
    return new NextResponse(payload, {
      headers: {
        "content-type": "application/json; charset=utf-8",
        "content-disposition": `attachment; filename="proofdrop-reviews-${stamp}.json"`,
        "cache-control": "no-store",
      },
    });
  }

  const header = [
    "id",
    "created_at",
    "published",
    "rating",
    "name",
    "role",
    "use_case",
    "email",
    "title",
    "body",
    "helpful",
    "user_agent",
  ];

  const rows = reviews.map((review) =>
    [
      review.id,
      review.createdAt,
      review.published === false ? "no" : "yes",
      review.rating,
      review.name,
      review.role ?? "",
      review.useCase ?? "",
      review.email ?? "",
      review.title,
      review.body,
      review.helpful ?? 0,
      review.userAgent ?? "",
    ]
      .map(csvCell)
      .join(","),
  );

  const summary = [
    "",
    "# ProofDrop review report",
    `# exported_at,${csvCell(new Date().toISOString())}`,
    `# total_reviews,${stats.total}`,
    `# published_reviews,${stats.published}`,
    `# average_rating,${stats.averageRating.toFixed(2)}`,
    `# feature_requests,${csvCell(stats.requestedFeatures.map((f) => `${f.feature} (${f.count})`).join("; "))}`,
    `# use_cases,${csvCell(stats.useCases.map((u) => `${u.name} (${u.count})`).join("; "))}`,
  ];

  const csv = [`\uFEFF${header.join(",")}`, ...rows, ...summary].join("\r\n");

  return new NextResponse(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="proofdrop-reviews-${stamp}.csv"`,
      "cache-control": "no-store",
    },
  });
}
