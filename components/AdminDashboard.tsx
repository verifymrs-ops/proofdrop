"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  Check,
  Download,
  Eye,
  EyeOff,
  FileJson,
  FileSpreadsheet,
  KeyRound,
  Loader2,
  Lock,
  LogOut,
  Mail,
  ShieldCheck,
  Sparkles,
  Star,
  Trash2,
  TriangleAlert,
  TrendingUp,
  Users,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { cn, formatDateTime, formatRelative, initialsFromName } from "@/lib/format";
import type { Review, ReviewStats } from "@/lib/reviews-types";

type Gate = "checking" | "locked" | "open";

export function AdminDashboard() {
  const [gate, setGate] = useState<Gate>("checking");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authBusy, setAuthBusy] = useState(false);

  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "published" | "hidden">("all");
  const [busyId, setBusyId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const response = await fetch("/api/admin/reviews", { cache: "no-store" });
      if (response.status === 401) {
        setGate("locked");
        return;
      }
      if (!response.ok) throw new Error("Failed to load dashboard data.");
      const data = (await response.json()) as { reviews: Review[]; stats: ReviewStats };
      setReviews(Array.isArray(data.reviews) ? data.reviews : []);
      setStats(data.stats ?? null);
      setGate("open");
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Something went wrong.");
      setGate("open");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const session = await fetch("/api/admin/session", { cache: "no-store" });
        const data = (await session.json()) as { authenticated?: boolean };
        if (cancelled) return;
        if (data.authenticated) {
          await loadData();
        } else {
          setGate("locked");
        }
      } catch {
        if (!cancelled) setGate("locked");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadData]);

  const login = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setAuthError(null);
      setAuthBusy(true);
      try {
        const response = await fetch("/api/admin/session", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ password }),
        });
        const data = (await response.json()) as { ok?: boolean; error?: string };
        if (!response.ok || !data.ok) {
          throw new Error(data.error ?? "Login failed.");
        }
        setPassword("");
        setGate("open");
        await loadData();
      } catch (error) {
        setAuthError(error instanceof Error ? error.message : "Login failed.");
      } finally {
        setAuthBusy(false);
      }
    },
    [password, loadData],
  );

  const logout = useCallback(async () => {
    await fetch("/api/admin/session", { method: "DELETE" });
    setGate("locked");
    setReviews([]);
    setStats(null);
  }, []);

  const togglePublished = useCallback(
    async (review: Review) => {
      setBusyId(review.id);
      try {
        const response = await fetch("/api/admin/reviews", {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ id: review.id, published: !review.published }),
        });
        if (!response.ok) throw new Error("Update failed.");
        setReviews((prev) =>
          prev.map((item) =>
            item.id === review.id ? { ...item, published: !item.published } : item,
          ),
        );
        void loadData();
      } catch (error) {
        setLoadError(error instanceof Error ? error.message : "Update failed.");
      } finally {
        setBusyId(null);
      }
    },
    [loadData],
  );

  const remove = useCallback(
    async (review: Review) => {
      setBusyId(review.id);
      try {
        const response = await fetch(`/api/admin/reviews?id=${encodeURIComponent(review.id)}`, {
          method: "DELETE",
        });
        if (!response.ok) throw new Error("Delete failed.");
        setReviews((prev) => prev.filter((item) => item.id !== review.id));
        void loadData();
      } catch (error) {
        setLoadError(error instanceof Error ? error.message : "Delete failed.");
      } finally {
        setBusyId(null);
      }
    },
    [loadData],
  );

  const visible = useMemo(() => {
    if (filter === "published") return reviews.filter((review) => review.published !== false);
    if (filter === "hidden") return reviews.filter((review) => review.published === false);
    return reviews;
  }, [reviews, filter]);

  if (gate === "checking") {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4 text-center">
        <Loader2 className="h-6 w-6 animate-spin text-lilac-500" />
        <p className="mt-4 font-mono text-[0.65rem] uppercase tracking-[0.18em] text-ink-soft/45">
          Checking owner session
        </p>
      </div>
    );
  }

  if (gate === "locked") {
    return (
      <div className="mx-auto flex min-h-[70vh] w-full max-w-md flex-col justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="glass-panel p-7"
        >
          <span className="grid h-12 w-12 place-items-center rounded-2xl border border-lilac-200 bg-lilac-100">
            <Lock className="h-5 w-5 text-lilac-600" />
          </span>
          <h1 className="mt-5 font-display text-2xl font-semibold tracking-tight text-ink">
            Owner report access
          </h1>
          <p className="mt-2 text-[0.84rem] leading-relaxed text-ink-soft/65">
            This dashboard is restricted to the site owner. Enter the admin password
            to view reviews, feature requests, and exports.
          </p>

          <form onSubmit={login} className="mt-6 space-y-3">
            <label htmlFor="admin-password" className="mono-label !text-[0.58rem]">
              Admin password
            </label>
            <div className="relative">
              <input
                id="admin-password"
                type={showPassword ? "text" : "password"}
                required
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-xl border border-lilac-200 bg-lilac-50 px-3 py-2.5 pr-10 text-[0.86rem] text-ink placeholder:text-ink-soft/35 focus:border-lilac-400 focus:bg-white focus:outline-none"
                placeholder="Enter owner password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-lg text-ink-soft/45 transition hover:text-ink"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            {authError && (
              <p className="flex items-start gap-2 rounded-xl border border-danger/25 bg-danger-soft px-3 py-2.5 text-[0.78rem] text-danger">
                <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                {authError}
              </p>
            )}

            <button
              type="submit"
              disabled={authBusy}
              className="btn-primary w-full !py-2.5 !text-sm disabled:opacity-60"
            >
              {authBusy ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Verifying…
                </>
              ) : (
                <>
                  <KeyRound className="h-4 w-4" />
                  Unlock dashboard
                </>
              )}
            </button>
          </form>

          <div className="mt-5 rounded-xl border border-lilac-200/70 bg-lilac-50 p-3">
            <p className="text-[0.7rem] leading-relaxed text-ink-soft/55">
              Password is set via{" "}
              <code className="font-mono text-[0.66rem] text-ink-soft/80">
                PROOFDROP_ADMIN_PASSWORD
              </code>{" "}
              or auto-generated into{" "}
              <code className="font-mono text-[0.66rem] text-ink-soft/80">
                .data/admin-password
              </code>
              . Login attempts are rate limited.
            </p>
          </div>

          <Link
            href="/"
            className="mt-5 inline-flex items-center gap-1.5 text-[0.75rem] font-medium text-ink-soft/55 transition hover:text-ink"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to site
          </Link>
        </motion.div>
      </div>
    );
  }

  const average = stats?.averageRating ?? 0;
  const publishedCount = stats?.published ?? 0;
  const hiddenCount = (stats?.total ?? 0) - publishedCount;
  const featureRequests = stats?.requestedFeatures ?? [];
  const maxFeature = featureRequests.reduce((max, item) => Math.max(max, item.count), 0);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-16 pt-8 sm:px-6 sm:pt-10 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <span className="chip">
            <ShieldCheck className="h-3 w-3 text-lilac-600" />
            Owner dashboard
          </span>
          <h1 className="mt-4 font-display text-[1.9rem] font-semibold leading-tight tracking-[-0.03em] text-ink sm:text-[2.4rem]">
            Reviews & feature requests
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <a
            href="/api/admin/reviews/export?format=csv"
            className="inline-flex items-center gap-1.5 rounded-full border border-lilac-200 bg-white px-3.5 py-2 text-[0.75rem] font-medium text-ink transition hover:border-lilac-300 hover:bg-lilac-50"
          >
            <FileSpreadsheet className="h-3.5 w-3.5" />
            CSV
          </a>
          <a
            href="/api/admin/reviews/export?format=json"
            className="inline-flex items-center gap-1.5 rounded-full border border-lilac-200 bg-white px-3.5 py-2 text-[0.75rem] font-medium text-ink transition hover:border-lilac-300 hover:bg-lilac-50"
          >
            <FileJson className="h-3.5 w-3.5" />
            JSON
          </a>
          <button
            type="button"
            onClick={logout}
            className="inline-flex items-center gap-1.5 rounded-full border border-lilac-200 bg-white px-3.5 py-2 text-[0.75rem] font-medium text-ink-soft/70 transition hover:border-danger/30 hover:text-danger"
          >
            <LogOut className="h-3.5 w-3.5" />
            Lock
          </button>
        </div>
      </div>

      {loadError && (
        <p className="mt-4 flex items-start gap-2 rounded-xl border border-warn/25 bg-warn-soft px-3.5 py-2.5 text-[0.78rem] text-warn">
          <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {loadError}
        </p>
      )}

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total reviews"
          value={String(stats?.total ?? reviews.length)}
          icon={Users}
          tone="lilac"
        />
        <StatCard
          label="Average rating"
          value={average > 0 ? average.toFixed(2) : "—"}
          icon={Star}
          tone="blush"
        />
        <StatCard
          label="Published"
          value={String(publishedCount)}
          icon={Check}
          tone="verify"
        />
        <StatCard
          label="Hidden"
          value={String(Math.max(hiddenCount, 0))}
          icon={EyeOff}
          tone="warn"
        />
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1.55fr_1fr] lg:items-start">
        <div className="min-w-0 rounded-2xl border border-lilac-200/80 bg-white shadow-soft">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-lilac-200/70 px-5 py-3.5">
            <h2 className="font-display text-base font-semibold text-ink">
              Review inbox
            </h2>
            <div className="inline-flex rounded-full border border-lilac-200 bg-white p-0.5">
              {(
                [
                  { id: "all" as const, label: "All" },
                  { id: "published" as const, label: "Live" },
                  { id: "hidden" as const, label: "Hidden" },
                ] as const
              ).map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setFilter(option.id)}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-[0.72rem] font-medium transition",
                    filter === option.id
                      ? "bg-lilac-100 text-lilac-700"
                      : "text-ink-soft/55 hover:text-ink",
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {loading && reviews.length === 0 ? (
            <div className="flex items-center justify-center gap-2 px-5 py-16 text-ink-soft/50">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-[0.8rem]">Loading reviews…</span>
            </div>
          ) : visible.length === 0 ? (
            <div className="px-5 py-14 text-center">
              <p className="font-display text-sm font-semibold text-ink">
                No reviews in this view
              </p>
              <p className="mt-1 text-[0.78rem] text-ink-soft/55">
                Submissions from the public reviews page will appear here.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-lilac-100">
              <AnimatePresence initial={false}>
                {visible.map((review) => (
                  <motion.li
                    key={review.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, height: 0 }}
                    className="px-5 py-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex min-w-0 items-start gap-3">
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-lilac-200 to-blush-200 font-display text-[0.7rem] font-semibold text-lilac-700">
                          {initialsFromName(review.name)}
                        </span>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-[0.85rem] font-semibold text-ink">
                              {review.name}
                            </p>
                            <span className="flex items-center gap-0.5">
                              {[1, 2, 3, 4, 5].map((value) => (
                                <Star
                                  key={value}
                                  className={cn(
                                    "h-2.5 w-2.5",
                                    value <= review.rating
                                      ? "fill-blush-400 text-blush-400"
                                      : "fill-lilac-100 text-lilac-100",
                                  )}
                                />
                              ))}
                            </span>
                            {review.published === false ? (
                              <span className="rounded-full border border-warn/25 bg-warn-soft px-2 py-0.5 font-mono text-[0.52rem] uppercase tracking-[0.1em] text-warn">
                                hidden
                              </span>
                            ) : (
                              <span className="rounded-full border border-verify/20 bg-verify-soft px-2 py-0.5 font-mono text-[0.52rem] uppercase tracking-[0.1em] text-verify">
                                live
                              </span>
                            )}
                          </div>
                          <p className="mt-0.5 text-[0.66rem] text-ink-soft/45">
                            {review.useCase ?? "No use case"} ·{" "}
                            {formatRelative(review.createdAt)} ·{" "}
                            {formatDateTime(review.createdAt)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => togglePublished(review)}
                          disabled={busyId === review.id}
                          className="inline-flex items-center gap-1 rounded-full border border-lilac-200 bg-white px-2.5 py-1 text-[0.65rem] font-medium text-ink-soft/70 transition hover:border-lilac-300 hover:text-ink disabled:opacity-50"
                        >
                          {review.published === false ? (
                            <>
                              <Eye className="h-3 w-3" /> Publish
                            </>
                          ) : (
                            <>
                              <EyeOff className="h-3 w-3" /> Hide
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => remove(review)}
                          disabled={busyId === review.id}
                          aria-label="Delete review"
                          className="inline-flex items-center gap-1 rounded-full border border-lilac-200 bg-white px-2.5 py-1 text-[0.65rem] font-medium text-ink-soft/70 transition hover:border-danger/30 hover:text-danger disabled:opacity-50"
                        >
                          <Trash2 className="h-3 w-3" /> Delete
                        </button>
                      </div>
                    </div>
                    <p className="mt-2.5 text-[0.85rem] font-semibold leading-snug text-ink">
                      {review.title}
                    </p>
                    <p className="mt-1 text-[0.8rem] leading-relaxed text-ink-soft/65">
                      {review.body}
                    </p>
                    {review.email && (
                      <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-lilac-50 px-2.5 py-1 font-mono text-[0.62rem] text-ink-soft/55">
                        <Mail className="h-3 w-3" />
                        {review.email}
                      </p>
                    )}
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          )}
        </div>

        <div className="min-w-0 space-y-5">
          <div className="rounded-2xl border border-lilac-200/80 bg-white p-5 shadow-soft">
            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-lg border border-lilac-200 bg-lilac-100">
                <TrendingUp className="h-3.5 w-3.5 text-lilac-600" />
              </span>
              <h2 className="font-display text-sm font-semibold text-ink">
                Requested features
              </h2>
            </div>
            {featureRequests.length === 0 ? (
              <p className="mt-3 text-[0.78rem] leading-relaxed text-ink-soft/55">
                No feature signals detected yet. Mentions of batch, PDF export, API,
                mobile, and similar keywords are grouped here automatically.
              </p>
            ) : (
              <ul className="mt-4 space-y-2.5">
                {featureRequests.map((item) => (
                  <li key={item.feature}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[0.76rem] font-medium text-ink">
                        {item.feature}
                      </span>
                      <span className="font-mono text-[0.62rem] text-ink-soft/50">
                        {item.count}
                      </span>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-lilac-100">
                      <span
                        className="block h-full rounded-full bg-gradient-to-r from-lilac-400 to-blush-400"
                        style={{
                          width: `${maxFeature > 0 ? Math.round((item.count / maxFeature) * 100) : 0}%`,
                        }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-2xl border border-lilac-200/80 bg-white p-5 shadow-soft">
            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-lg border border-blush-200 bg-blush-100">
                <Sparkles className="h-3.5 w-3.5 text-blush-600" />
              </span>
              <h2 className="font-display text-sm font-semibold text-ink">
                Use cases
              </h2>
            </div>
            {stats?.useCases && stats.useCases.length > 0 ? (
              <ul className="mt-3 space-y-1.5">
                {stats.useCases.map((item) => (
                  <li
                    key={item.name}
                    className="flex items-center justify-between gap-2 text-[0.76rem]"
                  >
                    <span className="text-ink-soft/70">{item.name}</span>
                    <span className="font-mono text-[0.62rem] text-ink-soft/50">
                      {item.count}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-[0.78rem] leading-relaxed text-ink-soft/55">
                Use case usage appears once reviews include a category.
              </p>
            )}
          </div>

          <div className="rounded-2xl border border-lilac-200/80 bg-white p-5 shadow-soft">
            <p className="mono-label">Export</p>
            <p className="mt-2 text-[0.78rem] leading-relaxed text-ink-soft/65">
              Download every review plus the derived feature-request summary for
              reporting. Files are generated server-side and require an active owner
              session.
            </p>
            <div className="mt-3 flex flex-col gap-2">
              <a
                href="/api/admin/reviews/export?format=csv"
                className="btn-ghost w-full !py-2.5 !text-sm"
              >
                <Download className="h-4 w-4" />
                Download CSV report
              </a>
              <a
                href="/api/admin/reviews/export?format=json"
                className="btn-ghost w-full !py-2.5 !text-sm"
              >
                <Download className="h-4 w-4" />
                Download JSON report
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: "lilac" | "blush" | "verify" | "warn";
}) {
  const tones = {
    lilac: "border-lilac-200 bg-lilac-100 text-lilac-600",
    blush: "border-blush-200 bg-blush-100 text-blush-600",
    verify: "border-verify/20 bg-verify-soft text-verify",
    warn: "border-warn/20 bg-warn-soft text-warn",
  } as const;

  return (
    <div className="rounded-2xl border border-lilac-200/80 bg-white p-4 shadow-soft">
      <span className={cn("grid h-8 w-8 place-items-center rounded-lg border", tones[tone])}>
        <Icon className="h-3.5 w-3.5" />
      </span>
      <p className="mt-2.5 font-display text-2xl font-semibold text-ink">{value}</p>
      <p className="text-[0.62rem] uppercase tracking-[0.1em] text-ink-soft/45">
        {label}
      </p>
    </div>
  );
}
