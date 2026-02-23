export default function EmptyState() {
  return (
    <section className="flex flex-col bg-white dark:bg-slate-900 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 shadow-sm relative overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center opacity-50 pointer-events-none select-none">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-slate-500 text-[20px]">
            assignment
          </span>
          <h2 className="text-base font-semibold text-slate-500 dark:text-slate-400">
            Meeting Notes
          </h2>
        </div>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center h-full min-h-[400px]">
        <div className="size-24 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center mb-6">
          <span className="material-symbols-outlined text-slate-300 dark:text-slate-600 text-[48px]">
            topic
          </span>
        </div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
          Ready to process
        </h3>
        <p className="text-slate-500 dark:text-slate-400 max-w-sm text-sm leading-relaxed">
          Paste a transcript on the left to generate structured notes, summaries,
          and action items instantly.
        </p>
        {/* Decorative subtle list to hint at what's coming */}
        <div className="mt-10 w-full max-w-xs space-y-3 opacity-30 select-none pointer-events-none blur-[1px]">
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mx-auto"></div>
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2 mx-auto"></div>
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-5/6 mx-auto"></div>
        </div>
      </div>
    </section>
  );
}
