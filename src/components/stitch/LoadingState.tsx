export default function LoadingState() {
  return (
    <section className="flex flex-col bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
      <div className="max-w-2xl mx-auto w-full flex flex-col h-full relative z-10 p-8">
        {/* Loading Header */}
        <div className="flex flex-col items-center justify-center py-10 mb-8">
          <div className="relative mb-6">
            {/* Outer spinner ring */}
            <div className="size-16 rounded-full border-[3px] border-primary/20"></div>
            {/* Inner spinning arc */}
            <div className="absolute inset-0 size-16 rounded-full border-[3px] border-t-primary border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
            {/* Icon in center */}
            <div className="absolute inset-0 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-2xl animate-pulse">
                auto_awesome
              </span>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
            Generating notes...
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm animate-pulse">
            Analyzing speakers &amp; extracting key decisions
          </p>
        </div>

        {/* Skeleton Cards Container */}
        <div className="flex-1 space-y-6 overflow-hidden">
          {/* Skeleton Card 1: Summary */}
          <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="size-8 rounded-lg bg-slate-100 dark:bg-slate-700 animate-pulse"></div>
              <div className="h-6 w-32 bg-slate-100 dark:bg-slate-700 rounded animate-pulse"></div>
            </div>
            <div className="space-y-3">
              <div className="h-4 bg-slate-100 dark:bg-slate-700 rounded w-full animate-pulse-slow"></div>
              <div className="h-4 bg-slate-100 dark:bg-slate-700 rounded w-[92%] animate-pulse-slow"></div>
              <div className="h-4 bg-slate-100 dark:bg-slate-700 rounded w-[96%] animate-pulse-slow"></div>
              <div className="h-4 bg-slate-100 dark:bg-slate-700 rounded w-[80%] animate-pulse-slow"></div>
            </div>
          </div>

          {/* Skeleton Card 2: Key Decisions */}
          <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 shadow-sm opacity-90">
            <div className="flex items-center gap-3 mb-5">
              <div className="size-8 rounded-lg bg-slate-100 dark:bg-slate-700 animate-pulse"></div>
              <div className="h-6 w-40 bg-slate-100 dark:bg-slate-700 rounded animate-pulse"></div>
            </div>
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="size-4 shrink-0 rounded-full bg-slate-100 dark:bg-slate-700 animate-pulse mt-1"></div>
                <div className="h-4 bg-slate-100 dark:bg-slate-700 rounded w-[85%] animate-pulse-slow"></div>
              </div>
              <div className="flex gap-3">
                <div className="size-4 shrink-0 rounded-full bg-slate-100 dark:bg-slate-700 animate-pulse mt-1"></div>
                <div className="h-4 bg-slate-100 dark:bg-slate-700 rounded w-[70%] animate-pulse-slow"></div>
              </div>
            </div>
          </div>

          {/* Skeleton Card 3: Next Steps */}
          <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 shadow-sm opacity-75">
            <div className="flex items-center gap-3 mb-5">
              <div className="size-8 rounded-lg bg-slate-100 dark:bg-slate-700 animate-pulse"></div>
              <div className="h-6 w-28 bg-slate-100 dark:bg-slate-700 rounded animate-pulse"></div>
            </div>
            <div className="space-y-3">
              <div className="flex gap-3 items-center">
                <div className="size-5 shrink-0 rounded bg-slate-100 dark:bg-slate-700 animate-pulse"></div>
                <div className="h-4 bg-slate-100 dark:bg-slate-700 rounded w-[60%] animate-pulse-slow"></div>
                <div className="ml-auto h-6 w-16 bg-slate-100 dark:bg-slate-700 rounded-full animate-pulse"></div>
              </div>
              <div className="flex gap-3 items-center">
                <div className="size-5 shrink-0 rounded bg-slate-100 dark:bg-slate-700 animate-pulse"></div>
                <div className="h-4 bg-slate-100 dark:bg-slate-700 rounded w-[75%] animate-pulse-slow"></div>
                <div className="ml-auto h-6 w-16 bg-slate-100 dark:bg-slate-700 rounded-full animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Background Decoration */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.05]"
        style={{
          backgroundImage: "radial-gradient(#136dec 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      ></div>
    </section>
  );
}
