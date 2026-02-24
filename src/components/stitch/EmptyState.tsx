export default function EmptyState() {
  return (
    <section className="flex flex-col bg-white dark:bg-card-dark rounded-xl border border-dashed border-slate-300 dark:border-zinc-700 shadow-sm relative overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 dark:border-border-dark flex justify-between items-center opacity-50 dark:opacity-70 pointer-events-none select-none">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-slate-500 dark:text-zinc-500 text-[20px]">
            assignment
          </span>
          <h2 className="text-base font-semibold text-slate-500 dark:text-zinc-400">
            Meeting Notes
          </h2>
        </div>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center h-full min-h-[400px] dark:bg-gradient-to-b dark:from-card-dark dark:to-[#202023]">
        <div className="size-24 rounded-full bg-slate-50 dark:bg-black/20 dark:border dark:border-white/5 flex items-center justify-center mb-6 dark:shadow-inner dark:shadow-black/40">
          <span className="material-symbols-outlined text-slate-300 dark:text-zinc-600 text-[48px]">
            topic
          </span>
        </div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
          Ready to process
        </h3>
        <p className="text-slate-500 dark:text-zinc-400 max-w-sm text-sm leading-relaxed">
          Paste a transcript on the left to generate structured notes, summaries,
          and action items instantly.
        </p>
        {/* Decorative subtle list to hint at what's coming */}
        <div className="mt-10 w-full max-w-xs space-y-3 opacity-30 dark:opacity-20 select-none pointer-events-none blur-[1px]">
          <div className="h-4 dark:h-3 bg-slate-200 dark:bg-zinc-400 rounded w-3/4 mx-auto"></div>
          <div className="h-4 dark:h-3 bg-slate-200 dark:bg-zinc-400 rounded w-1/2 mx-auto"></div>
          <div className="h-4 dark:h-3 bg-slate-200 dark:bg-zinc-400 rounded w-5/6 mx-auto"></div>
        </div>
      </div>
    </section>
  );
}
