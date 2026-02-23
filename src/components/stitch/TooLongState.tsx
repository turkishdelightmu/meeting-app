import { MAX_CHARS } from "@/types/ui-states";

interface TooLongStateProps {
  charCount: number;
}

export default function TooLongState({ charCount }: TooLongStateProps) {
  const overBy = charCount - MAX_CHARS;

  return (
    <section className="flex flex-col bg-white dark:bg-slate-900 rounded-xl border border-red-200 dark:border-red-900/50 shadow-sm relative overflow-hidden">
      <div className="px-6 py-4 border-b border-red-100 dark:border-red-900/30 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-red-500 text-[20px]">
            assignment
          </span>
          <h2 className="text-base font-semibold text-red-600 dark:text-red-400">
            Meeting Notes
          </h2>
        </div>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center h-full min-h-[400px]">
        <div className="size-24 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center mb-6">
          <span className="material-symbols-outlined text-red-400 dark:text-red-500 text-[48px]">
            text_snippet
          </span>
        </div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
          Transcript too long
        </h3>
        <p className="text-slate-500 dark:text-slate-400 max-w-sm text-sm leading-relaxed mb-4">
          Your transcript exceeds the maximum limit of{" "}
          <strong className="text-red-600 dark:text-red-400">
            {MAX_CHARS.toLocaleString()}
          </strong>{" "}
          characters. Please shorten it by{" "}
          <strong className="text-red-600 dark:text-red-400">
            {overBy.toLocaleString()}
          </strong>{" "}
          characters to continue.
        </p>
        <div className="flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/20 rounded-lg text-xs text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/30">
          <span className="material-symbols-outlined text-[16px]">info</span>
          <span>
            Tip: Remove filler words, side conversations, or split into multiple
            sessions.
          </span>
        </div>
      </div>
    </section>
  );
}
