interface ModelRefusalStateProps {
  onClear: () => void;
}

export default function ModelRefusalState({ onClear }: ModelRefusalStateProps) {
  return (
    <section className="flex flex-col bg-white dark:bg-card-dark rounded-xl border border-slate-200 dark:border-border-dark shadow-sm relative overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 dark:border-border-dark flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-slate-500 dark:text-zinc-500 text-[20px]">
            block
          </span>
          <h2 className="text-base font-semibold text-slate-600 dark:text-zinc-400">
            Content Refused
          </h2>
        </div>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center min-h-[400px]">
        <div className="size-24 rounded-full bg-slate-50 dark:bg-zinc-800 flex items-center justify-center mb-6">
          <span className="material-symbols-outlined text-slate-400 dark:text-zinc-500 text-[48px]">
            shield
          </span>
        </div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
          Content could not be processed
        </h3>
        <p className="text-slate-500 dark:text-zinc-400 max-w-sm text-sm leading-relaxed mb-6">
          The AI model declined to process this content. This typically happens
          when the input contains content that falls outside acceptable use
          guidelines.
        </p>
        <button
          onClick={onClear}
          className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 px-5 py-2 rounded-lg font-medium text-sm transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">
            arrow_back
          </span>
          Start Over
        </button>
      </div>
    </section>
  );
}
