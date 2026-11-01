"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, MessageSquarePlus, PenLine, Star } from "lucide-react";
import { useEffect, useState } from "react";
import { cn, formatRelative, initialsFromName } from "@/lib/format";
import type { ReviewPublic } from "@/lib/reviews-types";

function StarRow({ rating, size = 3.5 }: { rating: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((value) => (
        <Star
          key={value}
          style={{ width: `${size * 4}px`, height: `${size * 4}px` }}
          className={cn(
            value <= rating
              ? "fill-blush-400 text-blush-400"
              : "fill-lilac-100 text-lilac-100",
          )}
        />
      ))}
    </div>
  );
}

export function ReviewsPreview() {
  const [reviews, setReviews] = useState<ReviewPublic[] | null>(null);
  const [average, setAverage] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/reviews")
      .then((response) => response.json())
      .then((data: { reviews?: ReviewPublic[]; stats?: { averageRating?: number } }) => {
        if (cancelled) return;
        setReviews(Array.isArray(data.reviews) ? data.reviews : []);
        setAverage(data.stats?.averageRating ?? 0);
      })
      .catch(() => {
        if (!cancelled) setReviews([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const preview = (reviews ?? []).slice(0, 3);

  return (
    <section
      id="community"
      className="relative mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 sm:py-24 lg:px-8"
    >
      <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
        <div className="max-w-xl">
          <span className="chip">
            <MessageSquarePlus className="h-3 w-3 text-lilac-600" />
            Community voice
          </span>
          <h2 className="mt-5 font-display text-3xl font-semibold tracking-[-0.03em] text-ink sm:text-[2.5rem]">
            Real reviews from{" "}
            <span className="text-gradient-lavender">real proof droppers</span>
          </h2>
          <p className="mt-4 text-[0.96rem] leading-relaxed text-ink-soft/70">
            Every note below is submitted by a visitor — no curated quotes, no paid
            placements. Add yours and help shape what gets built next.
          </p>
        </div>

        <div className="flex flex-col items-start gap-2 sm:items-end">
          {average > 0 ? (
            <div className="flex items-center gap-2">
              <span className="font-display text-3xl font-semibold text-ink">
                {average.toFixed(1)}
              </span>
              <div>
                <StarRow rating={Math.round(average)} />
                <p className="mt-1 text-[0.7rem] text-ink-soft/55">
                  from {reviews?.length ?? 0} review{(reviews?.length ?? 0) === 1 ? "" : "s"}
                </p>
              </div>
            </div>
          ) : null}
          <Link href="/reviews#write" className="btn-primary !py-2.5 !text-sm">
            <PenLine className="h-4 w-4" />
            Write a review
          </Link>
        </div>
      </div>

      <div className="mt-10 grid gap-4 md:grid-cols-3">
        {reviews === null
          ? [0, 1, 2].map((index) => (
              <div
                key={index}
                className="h-48 animate-pulse rounded-2xl border border-lilac-200 bg-white/70"
              />
            ))
          : preview.length > 0
            ? preview.map((review, index) => (
                <motion.figure
                  key={review.id}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.5, delay: index * 0.07 }}
                  className="flex h-full flex-col rounded-2xl border border-lilac-200/80 bg-white p-5 shadow-soft"
                >
                  <div className="flex items-center justify-between">
                    <StarRow rating={review.rating} />
                    <span className="font-mono text-[0.6rem] uppercase tracking-[0.12em] text-ink-soft/35">
                      {formatRelative(review.createdAt)}
                    </span>
                  </div>
                  <p className="mt-3 text-[0.9rem] font-semibold leading-snug text-ink">
                    {review.title}
                  </p>
                  <blockquote className="mt-2 line-clamp-4 flex-1 text-[0.8rem] leading-relaxed text-ink-soft/70">
                    {review.body}
                  </blockquote>
                  <figcaption className="mt-4 flex items-center gap-2.5 border-t border-lilac-100 pt-3">
                    <span className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-lilac-200 to-blush-200 font-display text-[0.68rem] font-semibold text-lilac-700">
                      {initialsFromName(review.name)}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-[0.78rem] font-medium text-ink">
                        {review.name}
                      </p>
                      <p className="truncate text-[0.66rem] text-ink-soft/50">
                        {review.useCase ?? review.role ?? "ProofDrop user"}
                      </p>
                    </div>
                  </figcaption>
                </motion.figure>
              ))
            : (
              <div className="md:col-span-3">
                <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-lilac-300 bg-white/70 px-6 py-12 text-center">
                  <span className="grid h-12 w-12 place-items-center rounded-2xl bg-lilac-100">
                    <MessageSquarePlus className="h-5 w-5 text-lilac-600" />
                  </span>
                  <div>
                    <p className="font-display text-base font-semibold text-ink">
                      No reviews yet — be the first
                    </p>
                    <p className="mt-1 max-w-sm text-[0.8rem] leading-relaxed text-ink-soft/60">
                      Your honest experience helps the next person trust the tool.
                      It takes less than a minute.
                    </p>
                  </div>
                  <Link href="/reviews#write" className="btn-primary !py-2.5 !text-sm">
                    <PenLine className="h-4 w-4" />
                    Leave the first review
                  </Link>
                </div>
              </div>
            )}
      </div>

      <div className="mt-8 flex justify-center">
        <Link
          href="/reviews"
          className="inline-flex items-center gap-1.5 text-[0.85rem] font-medium text-lilac-700 transition hover:text-lilac-600"
        >
          Read all reviews
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}
