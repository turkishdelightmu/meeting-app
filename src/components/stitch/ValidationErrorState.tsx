interface ValidationErrorStateProps {
  rawOutput?: string;
  onRetry: () => void;
}

export default function ValidationErrorState({
  rawOutput,
  onRetry,
}: ValidationErrorStateProps) {
  return (
    <section className="flex flex-col bg-white dark:bg-slate-900 rounded-xl border border-orange-200 dark:border-orange-900/50 shadow-sm relative overflow-hidden">
      <div className="px-6 py-4 border-b border-orange-100 dark:border-orange-900/30 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-orange-500 text-[20px]">
            error_outline
          </span>
          <h2 className="text-base font-semibold text-orange-600 dark:text-orange-400">
            Validation Error
          </h2>
        </div>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center min-h-[400px]">
        <div className="size-24 rounded-full bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center mb-6">
          <span className="material-symbols-outlined text-orange-400 dark:text-orange-500 text-[48px]">
            data_object
          </span>
        </div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
          Output validation failed
        </h3>
        <p className="text-slate-500 dark:text-slate-400 max-w-sm text-sm leading-relaxed mb-6">
          The AI response didn&apos;t match the expected format. A retry was
          attempted but the issue persisted.
        </p>

        <button
          onClick={onRetry}
          className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-5 py-2 rounded-lg font-medium text-sm transition-colors shadow-sm shadow-primary/20 mb-6"
        >
          <span className="material-symbols-outlined text-[18px]">refresh</span>
          Try Again
        </button>

        {rawOutput && (
          <details className="w-full max-w-lg text-left">
            <summary className="cursor-pointer text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-medium">
              Show raw AI output
            </summary>
            <pre className="mt-2 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-400 overflow-auto max-h-60 whitespace-pre-wrap break-words">
              {rawOutput}
            </pre>
          </details>
        )}
      </div>
    </section>
  );
}
