export default function SuccessState() {
  return (
    <section className="flex flex-col bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
        <div className="flex gap-2 items-center">
          <span className="material-symbols-outlined text-green-500 text-xl">
            check_circle
          </span>
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">
            Processed Notes
          </h2>
        </div>
        <span className="text-xs font-medium text-slate-500 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1 rounded-full shadow-sm flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
          AI Confidence: High
        </span>
      </div>

      {/* Placeholder content - will be replaced in Step 2 */}
      <div className="flex-1 p-8 min-h-[400px]">
        <div className="space-y-6">
          {/* Summary */}
          <div className="bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
            <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4">
              <span className="material-symbols-outlined text-primary text-lg">
                summarize
              </span>
              Executive Summary
            </h3>
            <ul className="space-y-3">
              <li className="flex gap-3 items-start">
                <span className="material-symbols-outlined text-slate-400 text-lg mt-0.5 shrink-0">
                  fiber_manual_record
                </span>
                <span className="text-slate-700 dark:text-slate-300 leading-relaxed">
                  Product launch delayed by 2 weeks due to API latency issues.
                </span>
              </li>
              <li className="flex gap-3 items-start">
                <span className="material-symbols-outlined text-slate-400 text-lg mt-0.5 shrink-0">
                  fiber_manual_record
                </span>
                <span className="text-slate-700 dark:text-slate-300 leading-relaxed">
                  New target launch date confirmed for{" "}
                  <strong>November 15th</strong>.
                </span>
              </li>
            </ul>
          </div>

          {/* Decisions */}
          <div className="space-y-4">
            <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider px-1">
              <span className="material-symbols-outlined text-primary text-lg">
                gavel
              </span>
              Key Decisions
            </h3>
            <div className="bg-slate-50 dark:bg-slate-800 rounded-xl shadow-sm border-l-4 border-primary p-5">
              <div className="flex justify-between items-start mb-3">
                <h4 className="text-lg font-semibold text-slate-900 dark:text-white leading-tight">
                  Delay launch to November 15th
                </h4>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                  <span className="material-symbols-outlined text-[14px]">
                    verified
                  </span>
                  Confirmed
                </span>
              </div>
              <div className="bg-white dark:bg-slate-900/50 rounded border border-slate-100 dark:border-slate-700 p-3">
                <p className="text-xs font-mono text-slate-500 dark:text-slate-400 flex gap-2">
                  <span className="material-symbols-outlined text-[14px] mt-0.5 opacity-50">
                    format_quote
                  </span>
                  &quot;Let&apos;s move the target to November 15th then.&quot;
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Action Bar */}
      <div className="p-3 border-t border-slate-100 dark:border-slate-800 flex justify-center">
        <div className="bg-slate-50 dark:bg-slate-800 rounded-full shadow-sm border border-slate-200 dark:border-slate-700 py-1.5 px-3 inline-flex items-center gap-2">
          <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 font-medium">
            <span>Was this useful?</span>
            <div className="flex gap-1">
              <button className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-400 hover:text-green-500 transition-colors">
                <span className="material-symbols-outlined text-[20px]">
                  thumb_up
                </span>
              </button>
              <button className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-400 hover:text-red-500 transition-colors">
                <span className="material-symbols-outlined text-[20px]">
                  thumb_down
                </span>
              </button>
            </div>
          </div>
          <div className="h-4 w-px bg-slate-200 dark:bg-slate-700"></div>
          <div className="flex gap-1">
            <button
              className="size-8 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 rounded-full transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-600"
              title="Copy as text"
              aria-label="Copy as text"
            >
              <span className="material-symbols-outlined text-[16px]">
                content_copy
              </span>
            </button>
            <button
              className="size-8 flex items-center justify-center bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-full hover:opacity-90 transition-opacity shadow-md"
              title="Copy as markdown"
              aria-label="Copy as markdown"
            >
              <span className="material-symbols-outlined text-[16px]">
                markdown
              </span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
