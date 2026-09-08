export default function Loading() {
  return (
    <main className="app-shell" aria-busy="true" aria-label="Đang tải trang">
      <p role="status" className="mb-5 text-sm text-emerald-200">Đang mở trang…</p>
      <div aria-hidden="true" className="space-y-7 animate-pulse motion-reduce:animate-none">
        <div className="h-16 rounded-3xl border border-white/10 bg-slate-900/80" />
        <div className="space-y-3"><div className="h-8 w-44 rounded-lg bg-white/10" /><div className="h-4 w-2/3 rounded bg-white/5" /></div>
        <div className="h-40 rounded-2xl border border-white/10 bg-white/5" />
        <div className="grid gap-7 md:grid-cols-[1.6fr_1fr]">
          {[0, 1].map((column) => (
            <div key={column} className="space-y-5">
              <div className="h-5 w-32 rounded bg-white/10" />
              {[0, 1, 2].map((row) => <div key={row} className="flex items-center gap-4 border-b border-white/10 py-4"><div className="h-9 w-9 shrink-0 rounded-full bg-white/10" /><div className="flex-1 space-y-3"><div className="h-4 w-2/3 rounded bg-white/10" /><div className="h-3 w-1/2 rounded bg-white/5" /></div></div>)}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
