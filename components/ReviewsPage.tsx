"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  CheckCircle2,
  MessageSquarePlus,
  PenLine,
  Send,
  ShieldCheck,
  Star,
  ThumbsUp,
  TriangleAlert,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { cn, formatRelative, initialsFromName } from "@/lib/format";
import type { ReviewPublic, ReviewStats } from "@/lib/reviews-types";

type SortKey = "recent" | "rating" | "helpful";

interface StatsResponse {
  total: number;
  averageRating: number;
  ratingBreakdown: Record<string, number>;
  useCases: { name: string; count: number }[];
}

const USE_CASE_FALLBACK = [
  "Marketplace sale",
  "Rental condition",
  "Delivery proof",
  "Freelance handover",
  "Insurance claim",
  "Other",
];

function StarRow({
  rating,
  size = 3.5,
  interactive = false,
  onSelect,
}: {
  rating: number;
  size?: number;
  interactive?: boolean;
  onSelect?: (value: number) => void;
}) {
  const [hover, setHover] = useState(0);
  const shown = interactive && hover > 0 ? hover : rating;

  return (
    <div
      className="flex items-center gap-0.5"
      aria-label={`${rating} out of 5 stars`}
      onMouseLeave={() => interactive && setHover(0)}
    >
      {[1, 2, 3, 4, 5].map((value) => {
        const filled = value <= shown;
        const star = (
          <Star
            style={{ width: `${size * 4}px`, height: `${size * 4}px` }}
            className={cn(
              "transition-colors",
              filled ? "fill-blush-400 text-blush-400" : "fill-lilac-100 text-lilac-200",
              interactive && "cursor-pointer transition-transform hover:scale-110",
            )}
          />
        );
        return interactive ? (
          <button
            key={value}
            type="button"
            onMouseEnter={() => setHover(value)}
            onClick={() => onSelect?.(value)}
            aria-label={`Rate ${value} out of 5`}
            className="p-0.5"
          >
            {star}
          </button>
        ) : (
          <span key={value}>{star}</span>
        );
      })}
    </div>
  );
}

export function ReviewsPage() {
  const [reviews, setReviews] = useState<ReviewPublic[] | null>(null);
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [sort, setSort] = useState<SortKey>("recent");
  const [useCaseFilter, setUseCaseFilter] = useState<string>("all");
  const [ratingFilter, setRatingFilter] = useState<number>(0);
  const [helpfulIds, setHelpfulIds] = useState<Record<string, boolean>>({});
  const [helpfulCounts, setHelpfulCounts] = useState<Record<string, number>>({});

  const [form, setForm] = useState({
    name: "",
    role: "",
    rating: 5,
    title: "",
    body: "",
    useCase: "Marketplace sale",
    email: "",
  });
  const [formState, setFormState] = useState<"idle" | "submitting" | "success" | "error">(
    "idle",
  );
  const [formError, setFormError] = useState<string | null>(null);
  const successRef = useRef<HTMLDivElement | null>(null);

  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/reviews", { cache: "no-store" });
      if (!response.ok) throw new Error("Failed to load reviews.");
      const data = (await response.json()) as {
        reviews?: ReviewPublic[];
        stats?: StatsResponse;
      };
      const list = Array.isArray(data.reviews) ? data.reviews : [];
      setReviews(list);
      setStats(data.stats ?? null);
      setHelpfulCounts(
        Object.fromEntries(list.map((review) => [review.id, review.helpful ?? 0])),
      );
    } catch {
      setReviews([]);
      setLoadError(true);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const submit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setFormError(null);
      setFormState("submitting");
      try {
        const response = await fetch("/api/reviews", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(form),
        });
        const data = (await response.json()) as {
          ok?: boolean;
          error?: string;
          review?: ReviewPublic;
        };
        if (!response.ok || !data.ok) {
          throw new Error(data.error ?? "Could not submit your review.");
        }
        setFormState("success");
        setForm({
          name: "",
          role: "",
          rating: 5,
          title: "",
          body: "",
          useCase: "Marketplace sale",
          email: "",
        });
        await load();
        window.setTimeout(() => {
          successRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 80);
      } catch (error) {
        setFormState("error");
        setFormError(error instanceof Error ? error.message : "Something went wrong.");
      }
    },
    [form, load],
  );

  const markHelpful = useCallback(
    async (id: string) => {
      if (helpfulIds[id]) return;
      setHelpfulIds((prev) => ({ ...prev, [id]: true }));
      setHelpfulCounts((prev) => ({ ...prev, [id]: (prev[id] ?? 0) + 1 }));
      try {
        await fetch("/api/reviews", {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ id, action: "helpful" }),
        });
      } catch {
        // optimistic update stands; server sync failure is non-critical
      }
    },
    [helpfulIds],
  );

  const filtered = useMemo(() => {
    if (!reviews) return [];
    let list = reviews.filter((review) => {
      if (useCaseFilter !== "all" && review.useCase !== useCaseFilter) return false;
      if (ratingFilter > 0 && Math.round(review.rating) !== ratingFilter) return false;
      return true;
    });
    if (sort === "rating") {
      list = [...list].sort((a, b) => b.rating - a.rating);
    } else if (sort === "helpful") {
      list = [...list].sort((a, b) => (b.helpful ?? 0) - (a.helpful ?? 0));
    }
    return list;
  }, [reviews, useCaseFilter, ratingFilter, sort]);

  const useCases = useMemo(() => {
    const fromStats = stats?.useCases?.map((item) => item.name) ?? [];
    return fromStats.length > 0 ? fromStats : USE_CASE_FALLBACK;
  }, [stats]);

  const average = stats?.averageRating ?? 0;
  const total = stats?.total ?? reviews?.length ?? 0;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-16 pt-10 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="max-w-2xl"
      >
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-[0.78rem] font-medium text-ink-soft/55 transition hover:text-ink"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back home
        </Link>
        <span className="chip mt-5">
          <MessageSquarePlus className="h-3 w-3 text-lilac-600" />
          Community reviews
        </span>
        <h1 className="mt-5 font-display text-[2.1rem] font-semibold leading-[1.08] tracking-[-0.035em] text-ink sm:text-[2.9rem]">
          What real people say about{" "}
          <span className="text-gradient-lavender">ProofDrop</span>
        </h1>
        <p className="mt-4 text-[0.96rem] leading-relaxed text-ink-soft/70">
          Every review is submitted by a visitor — no seeded quotes, no paid
          placements. Tell us what worked, what broke, and what you want next.
        </p>
      </motion.div>

      <div className="mt-8 grid gap-5 lg:grid-cols-[1.05fr_1.6fr] lg:items-start">
        <div className="space-y-5">
          <div className="glass-panel p-5 sm:p-6">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="mono-label">Overall rating</p>
                <div className="mt-2 flex items-end gap-2">
                  <span className="font-display text-4xl font-semibold text-ink">
                    {average > 0 ? average.toFixed(1) : "—"}
                  </span>
                  <span className="pb-1 text-sm text-ink-soft/50">/ 5</span>
                </div>
                <div className="mt-1.5">
                  <StarRow rating={Math.round(average)} />
                </div>
                <p className="mt-1.5 text-[0.72rem] text-ink-soft/55">
                  {total} verified submission{total === 1 ? "" : "s"}
                </p>
              </div>
              <span className="grid h-11 w-11 place-items-center rounded-2xl border border-lilac-200 bg-lilac-100">
                <ShieldCheck className="h-5 w-5 text-lilac-600" />
              </span>
            </div>

            <div className="mt-5 space-y-1.5">
              {[5, 4, 3, 2, 1].map((value) => {
                const count = stats?.ratingBreakdown?.[String(value)] ?? 0;
                const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                const active = ratingFilter === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setRatingFilter(active ? 0 : value)}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-lg px-1.5 py-1 text-left transition",
                      active ? "bg-lilac-100" : "hover:bg-lilac-50",
                    )}
                    aria-pressed={active}
                  >
                    <span className="w-8 shrink-0 text-[0.7rem] font-medium text-ink-soft/70">
                      {value}★
                    </span>
                    <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-lilac-100">
                      <span
                        className="block h-full rounded-full bg-gradient-to-r from-lilac-400 to-blush-400"
                        style={{ width: `${pct}%` }}
                      />
                    </span>
                    <span className="w-7 shrink-0 text-right font-mono text-[0.62rem] text-ink-soft/45">
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
            {ratingFilter > 0 && (
              <button
                type="button"
                onClick={() => setRatingFilter(0)}
                className="mt-3 text-[0.7rem] font-medium text-lilac-600 hover:text-lilac-700"
              >
                Clear rating filter
              </button>
            )}
          </div>

          <div className="rounded-2xl border border-lilac-200/80 bg-white p-5 shadow-soft">
            <p className="mono-label">Why it matters</p>
            <p className="mt-2 text-[0.8rem] leading-relaxed text-ink-soft/65">
              Reviews drive the roadmap. Feature requests mentioned in your note are
              grouped into an owner-only report so the most-asked-for work gets built
              first.
            </p>
          </div>
        </div>

        <div id="write" className="scroll-mt-24 space-y-5">
          <div className="glass-panel p-5 sm:p-7">
            <div className="flex items-center gap-2">
              <span className="grid h-9 w-9 place-items-center rounded-xl border border-lilac-200 bg-lilac-100">
                <PenLine className="h-4 w-4 text-lilac-600" />
              </span>
              <div>
                <p className="mono-label !text-[0.55rem]">Add your voice</p>
                <h2 className="font-display text-lg font-semibold text-ink">
                  Write a review
                </h2>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {formState === "success" ? (
                <motion.div
                  ref={successRef}
                  key="success"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-5 flex flex-col items-start gap-3 rounded-2xl border border-verify/25 bg-verify-soft p-5"
                >
                  <span className="flex items-center gap-2 text-sm font-semibold text-verify">
                    <CheckCircle2 className="h-4 w-4" />
                    Review published — thank you
                  </span>
                  <p className="text-[0.82rem] leading-relaxed text-ink-soft/70">
                    Your note is live below and already counted toward the feature
                    request report.
                  </p>
                  <button
                    type="button"
                    onClick={() => setFormState("idle")}
                    className="btn-ghost !py-2 !text-xs"
                  >
                    Write another
                  </button>
                </motion.div>
              ) : (
                <motion.form
                  key="form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  onSubmit={submit}
                  className="mt-5 space-y-4"
                >
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Your name" htmlFor="review-name">
                      <input
                        id="review-name"
                        required
                        minLength={2}
                        maxLength={60}
                        value={form.name}
                        onChange={(event) =>
                          setForm((prev) => ({ ...prev, name: event.target.value }))
                        }
                        placeholder="Alex Moreau"
                        className={inputClass}
                      />
                    </Field>
                    <Field label="Role (optional)" htmlFor="review-role">
                      <input
                        id="review-role"
                        maxLength={80}
                        value={form.role}
                        onChange={(event) =>
                          setForm((prev) => ({ ...prev, role: event.target.value }))
                        }
                        placeholder="Reseller, landlord, courier…"
                        className={inputClass}
                      />
                    </Field>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="What did you use it for?" htmlFor="review-use-case">
                      <select
                        id="review-use-case"
                        value={form.useCase}
                        onChange={(event) =>
                          setForm((prev) => ({ ...prev, useCase: event.target.value }))
                        }
                        className={inputClass}
                      >
                        {USE_CASE_FALLBACK.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <div>
                      <label className="mono-label !text-[0.58rem]">Rating</label>
                      <div className="mt-2 flex items-center gap-2 rounded-xl border border-lilac-200 bg-lilac-50 px-3 py-2.5">
                        <StarRow
                          rating={form.rating}
                          interactive
                          onSelect={(value) =>
                            setForm((prev) => ({ ...prev, rating: value }))
                          }
                        />
                        <span className="ml-auto font-mono text-[0.62rem] text-ink-soft/50">
                          {form.rating}.0 / 5
                        </span>
                      </div>
                    </div>
                  </div>

                  <Field label="Headline" htmlFor="review-title">
                    <input
                      id="review-title"
                      required
                      minLength={4}
                      maxLength={120}
                      value={form.title}
                      onChange={(event) =>
                        setForm((prev) => ({ ...prev, title: event.target.value }))
                      }
                      placeholder="Saved a refund dispute in one link"
                      className={inputClass}
                    />
                  </Field>

                  <Field label="Your experience" htmlFor="review-body">
                    <textarea
                      id="review-body"
                      required
                      minLength={20}
                      maxLength={1200}
                      rows={4}
                      value={form.body}
                      onChange={(event) =>
                        setForm((prev) => ({ ...prev, body: event.target.value }))
                      }
                      placeholder="What did you prove, what worked well, and what would you add?"
                      className={`${inputClass} resize-y`}
                    />
                  </Field>

                  <Field label="Email (optional, never published)" htmlFor="review-email">
                    <input
                      id="review-email"
                      type="email"
                      value={form.email}
                      onChange={(event) =>
                        setForm((prev) => ({ ...prev, email: event.target.value }))
                      }
                      placeholder="you@example.com"
                      className={inputClass}
                    />
                  </Field>

                  {formError && (
                    <p className="flex items-start gap-2 rounded-xl border border-danger/25 bg-danger-soft px-3 py-2.5 text-[0.78rem] text-danger">
                      <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      {formError}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="max-w-sm text-[0.68rem] leading-relaxed text-ink-soft/45">
                      No account needed. Be honest — negative feedback is welcome.
                    </p>
                    <button
                      type="submit"
                      disabled={formState === "submitting"}
                      className="btn-primary !py-2.5 !text-sm disabled:opacity-60"
                    >
                      {formState === "submitting" ? (
                        <>Publishing…</>
                      ) : (
                        <>
                          Publish review
                          <Send className="h-4 w-4" />
                        </>
                      )}
                    </button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <section className="mt-14">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="font-display text-xl font-semibold tracking-tight text-ink sm:text-2xl">
            All reviews
            {reviews && reviews.length > 0 && (
              <span className="ml-2 font-mono text-[0.7rem] font-normal text-ink-soft/40">
                {filtered.length} shown
              </span>
            )}
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={useCaseFilter}
              onChange={(event) => setUseCaseFilter(event.target.value)}
              className="rounded-full border border-lilac-200 bg-white px-3 py-1.5 text-[0.72rem] font-medium text-ink-soft"
              aria-label="Filter by use case"
            >
              <option value="all">All use cases</option>
              {useCases.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
            <div className="inline-flex rounded-full border border-lilac-200 bg-white p-0.5">
              {(
                [
                  { id: "recent" as const, label: "Recent" },
                  { id: "rating" as const, label: "Top rated" },
                  { id: "helpful" as const, label: "Helpful" },
                ] as const
              ).map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setSort(option.id)}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-[0.72rem] font-medium transition",
                    sort === option.id
                      ? "bg-lilac-100 text-lilac-700"
                      : "text-ink-soft/55 hover:text-ink",
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6">
          {reviews === null ? (
            <div className="grid gap-4 md:grid-cols-2">
              {[0, 1, 2, 3].map((index) => (
                <div
                  key={index}
                  className="h-40 animate-pulse rounded-2xl border border-lilac-200 bg-white/70"
                />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-lilac-300 bg-white/70 px-6 py-14 text-center">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-lilac-100">
                <MessageSquarePlus className="h-5 w-5 text-lilac-600" />
              </span>
              <p className="font-display text-base font-semibold text-ink">
                {loadError
                  ? "Could not load reviews"
                  : reviews.length === 0
                    ? "No reviews yet — be the first"
                    : "No reviews match these filters"}
              </p>
              <p className="max-w-sm text-[0.8rem] leading-relaxed text-ink-soft/60">
                {reviews.length === 0
                  ? "Your honest experience helps the next person trust the tool."
                  : "Try clearing the rating or use-case filter."}
              </p>
              {reviews.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setRatingFilter(0);
                    setUseCaseFilter("all");
                  }}
                  className="btn-ghost !py-2 !text-xs"
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              <AnimatePresence initial={false}>
                {filtered.map((review, index) => (
                  <motion.figure
                    key={review.id}
                    layout
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.35, delay: Math.min(index * 0.03, 0.2) }}
                    className="flex h-full flex-col rounded-2xl border border-lilac-200/80 bg-white p-5 shadow-soft"
                  >
                    <div className="flex items-center justify-between">
                      <StarRow rating={review.rating} />
                      <span className="font-mono text-[0.6rem] uppercase tracking-[0.12em] text-ink-soft/35">
                        {formatRelative(review.createdAt)}
                      </span>
                    </div>
                    <p className="mt-3 text-[0.95rem] font-semibold leading-snug text-ink">
                      {review.title}
                    </p>
                    <blockquote className="mt-2 flex-1 text-[0.82rem] leading-relaxed text-ink-soft/70">
                      {review.body}
                    </blockquote>
                    <figcaption className="mt-4 flex items-center justify-between gap-2 border-t border-lilac-100 pt-3">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-lilac-200 to-blush-200 font-display text-[0.68rem] font-semibold text-lilac-700">
                          {initialsFromName(review.name)}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-[0.78rem] font-medium text-ink">
                            {review.name}
                          </p>
                          <p className="truncate text-[0.66rem] text-ink-soft/50">
                            {review.role ?? review.useCase ?? "ProofDrop user"}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => markHelpful(review.id)}
                        disabled={Boolean(helpfulIds[review.id])}
                        className={cn(
                          "inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-[0.65rem] font-medium transition",
                          helpfulIds[review.id]
                            ? "border-verify/25 bg-verify-soft text-verify"
                            : "border-lilac-200 bg-white text-ink-soft/60 hover:border-lilac-300 hover:text-ink",
                        )}
                        aria-label="Mark this review as helpful"
                      >
                        <ThumbsUp className="h-3 w-3" />
                        {helpfulCounts[review.id] ?? review.helpful ?? 0}
                      </button>
                    </figcaption>
                  </motion.figure>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

const inputClass =
  "w-full rounded-xl border border-lilac-200 bg-lilac-50 px-3 py-2.5 text-[0.84rem] text-ink placeholder:text-ink-soft/35 focus:border-lilac-400 focus:bg-white focus:outline-none";

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mono-label !text-[0.58rem]">
        {label}
      </label>
      <div className="mt-2">{children}</div>
    </div>
  );
}
