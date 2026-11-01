export default function Loading() {
  return (
    <div className="mx-auto flex min-h-[65vh] w-full max-w-3xl flex-col items-center justify-center px-4">
      <div className="relative grid h-16 w-16 place-items-center">
        <span className="absolute inset-0 rounded-full border border-lilac-200" />
        <span className="absolute inset-0 animate-[pulse-ring_2.2s_ease-out_infinite] rounded-full border border-lilac-400/60" />
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-lilac-200 border-t-lilac-500" />
      </div>
      <p className="mt-5 font-mono text-[0.65rem] uppercase tracking-[0.2em] text-ink-soft/45">
        Recomputing anchor signature
      </p>
    </div>
  );
}
