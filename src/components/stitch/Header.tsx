export default function Header() {
  return (
    <header className="w-full bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-3 flex items-center justify-between z-10 sticky top-0">
      <div className="flex items-center gap-3">
        <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
          <span className="material-symbols-outlined">description</span>
        </div>
        <h1 className="text-slate-900 dark:text-white text-lg font-bold tracking-tight">
          Meeting Note Cleaner
        </h1>
      </div>
      <div className="flex items-center gap-3">
        <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-400 text-sm font-medium">
          <span className="material-symbols-outlined text-[20px]">settings</span>
          <span className="hidden sm:inline">Settings</span>
        </button>
        <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>
        <div className="flex items-center gap-2">
          <div className="size-8 rounded-full bg-gradient-to-tr from-primary to-blue-400 flex items-center justify-center text-white font-bold text-xs">
            JD
          </div>
        </div>
      </div>
    </header>
  );
}
