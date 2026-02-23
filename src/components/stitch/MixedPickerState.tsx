"use client";

interface MixedPickerStateProps {
  onSelectLanguage: (lang: "force_en" | "force_fr") => void;
}

export default function MixedPickerState({
  onSelectLanguage,
}: MixedPickerStateProps) {
  return (
    <section className="flex flex-col bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
      {/* Background Content (Blurred/Dimmed) */}
      <div className="absolute inset-0 p-8 opacity-30 pointer-events-none filter blur-[2px]">
        <div className="h-8 w-1/3 bg-slate-200 dark:bg-slate-800 rounded mb-6"></div>
        <div className="space-y-4">
          <div className="h-4 w-full bg-slate-200 dark:bg-slate-800 rounded"></div>
          <div className="h-4 w-5/6 bg-slate-200 dark:bg-slate-800 rounded"></div>
          <div className="h-4 w-4/6 bg-slate-200 dark:bg-slate-800 rounded"></div>
          <div className="h-32 w-full bg-slate-200 dark:bg-slate-800 rounded mt-8"></div>
        </div>
      </div>

      {/* Modal / Card Overlay */}
      <div className="absolute inset-0 flex items-center justify-center p-6 z-20 backdrop-blur-sm bg-slate-900/5 dark:bg-black/20">
        <div className="bg-white dark:bg-slate-800 w-full max-w-[480px] rounded-xl shadow-2xl border border-slate-100 dark:border-slate-700 overflow-hidden">
          {/* Decorative Top Bar */}
          <div className="h-2 w-full bg-gradient-to-r from-blue-500 via-primary to-indigo-600"></div>

          <div className="p-8 flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-blue-50 dark:bg-primary/20 flex items-center justify-center mb-6 text-primary">
              <span className="material-symbols-outlined text-[32px]">
                translate
              </span>
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
              Mixed-language transcript detected
            </h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-8 max-w-sm">
              We noticed this meeting contains both{" "}
              <strong className="text-slate-900 dark:text-slate-200">
                English
              </strong>{" "}
              and{" "}
              <strong className="text-slate-900 dark:text-slate-200">
                French
              </strong>
              . Which language should be used for the structured summary?
            </p>

            <div className="grid grid-cols-2 gap-4 w-full mb-6">
              <button
                onClick={() => onSelectLanguage("force_en")}
                className="group relative flex flex-col items-center justify-center p-4 rounded-lg border-2 border-slate-200 dark:border-slate-700 hover:border-primary dark:hover:border-primary bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-primary/10 transition-all duration-200"
              >
                <span className="text-2xl mb-2">🇺🇸</span>
                <span className="font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors">
                  English
                </span>
                <span className="text-xs text-slate-500 mt-1">
                  Structured Notes
                </span>
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-primary transition-opacity">
                  <span className="material-symbols-outlined text-[18px]">
                    check_circle
                  </span>
                </div>
              </button>

              <button
                onClick={() => onSelectLanguage("force_fr")}
                className="group relative flex flex-col items-center justify-center p-4 rounded-lg border-2 border-slate-200 dark:border-slate-700 hover:border-primary dark:hover:border-primary bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-primary/10 transition-all duration-200"
              >
                <span className="text-2xl mb-2">🇫🇷</span>
                <span className="font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors">
                  Français
                </span>
                <span className="text-xs text-slate-500 mt-1">
                  Notes structurées
                </span>
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-primary transition-opacity">
                  <span className="material-symbols-outlined text-[18px]">
                    check_circle
                  </span>
                </div>
              </button>
            </div>

            <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-slate-800/50 rounded-md text-xs text-slate-500 border border-slate-100 dark:border-slate-700">
              <span className="material-symbols-outlined text-[16px] text-slate-400">
                format_quote
              </span>
              <span>
                Direct quotes will remain verbatim from the transcript.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Spacer so the section has height */}
      <div className="min-h-[500px]"></div>
    </section>
  );
}
