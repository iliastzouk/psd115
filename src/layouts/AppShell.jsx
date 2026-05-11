import { Link, Outlet } from 'react-router-dom'
import { useStudySession } from '../hooks/useStudySession.js'

const shell = 'w-full max-w-md sm:max-w-xl lg:max-w-2xl mx-auto'

export default function AppShell() {
  const study = useStudySession()

  return (
    <div className="min-h-dvh bg-stone-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-[max(2.5rem,env(safe-area-inset-bottom))] transition-colors duration-300">
      <header className="sticky top-0 z-10 border-b border-slate-200/80 dark:border-slate-800 bg-stone-50/95 dark:bg-slate-950/95 backdrop-blur-md">
        <div className={`${shell} px-4 sm:px-5 pt-[max(1rem,env(safe-area-inset-top))] pb-3`}>
          <div className="flex flex-col gap-3 min-[400px]:flex-row min-[400px]:items-start min-[400px]:justify-between">
            <div className="min-w-0 pr-2">
              <Link to="/" className="text-xs text-teal-700 dark:text-teal-300 font-medium hover:underline">
                PSD115 Exam Prep
              </Link>
              <h1 className="text-lg min-[400px]:text-xl font-bold leading-snug text-balance">
                Ψυχολογία: Η εξέλιξη μιας επιστήμης
              </h1>
            </div>
            <div className="flex flex-row min-[400px]:flex-col items-stretch min-[400px]:items-end gap-2 shrink-0">
              <button
                type="button"
                onClick={() => study.setDark((d) => !d)}
                className="touch-manipulation rounded-full border border-slate-300 dark:border-slate-600 px-3 py-2 min-h-[44px] text-xs font-medium hover:bg-slate-100 dark:hover:bg-slate-900 transition sm:min-h-0"
              >
                {study.dark ? 'Φωτεινό' : 'Σκοτεινό'}
              </button>
              <button
                type="button"
                onClick={study.handleResetAll}
                className="touch-manipulation text-left min-[400px]:text-right text-[11px] text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 underline-offset-2 hover:underline py-2 min-h-[44px] min-[400px]:min-h-0 min-[400px]:py-0"
              >
                Επαναφορά προόδου
              </button>
            </div>
          </div>
          <nav className="mt-3 flex gap-2 text-xs">
            <Link
              to="/"
              className="rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-2 hover:bg-white dark:hover:bg-slate-900 transition"
            >
              Αρχική
            </Link>
            <Link
              to="/week/1"
              className="rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-2 hover:bg-white dark:hover:bg-slate-900 transition"
            >
              Εβδομάδα 1
            </Link>
          </nav>
        </div>
      </header>

      <main className={`${shell} px-4 sm:px-5 pt-5 space-y-5`}>
        <Outlet context={study} />
      </main>
    </div>
  )
}
