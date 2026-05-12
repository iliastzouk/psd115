import { Link, NavLink, Outlet } from 'react-router-dom'
import ScrollToTop from '../components/ScrollToTop.jsx'
import { useStudySession } from '../hooks/useStudySession.js'

const shell = 'w-full max-w-md sm:max-w-xl lg:max-w-2xl mx-auto'

function headerNavClass(isActive) {
  return [
    'touch-manipulation rounded-lg px-3 py-2 text-xs font-medium border transition min-h-[40px] inline-flex items-center justify-center',
    isActive
      ? 'border-teal-600 bg-teal-600 text-white shadow-sm'
      : 'border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:border-teal-400 hover:bg-white dark:hover:bg-slate-900',
  ].join(' ')
}

export default function AppShell() {
  const study = useStudySession()

  return (
    <div className="min-h-dvh bg-stone-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-[max(2.5rem,env(safe-area-inset-bottom))] transition-colors duration-300">
      <ScrollToTop />
      <header className="sticky top-0 z-10 border-b border-slate-200/80 dark:border-slate-800 bg-stone-50/95 dark:bg-slate-950/95 backdrop-blur-md">
        <div className={`${shell} px-4 sm:px-5 pt-[max(1rem,env(safe-area-inset-top))] pb-3`}>
          <div className="flex flex-col gap-3 min-[400px]:flex-row min-[400px]:items-start min-[400px]:justify-between">
            <div className="min-w-0 pr-2">
              <Link to="/" className="text-xs text-teal-700 dark:text-teal-300 font-medium hover:underline">
                PSD115 Exam Prep
              </Link>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">by Ilias Tzoukas</p>
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
          <nav className="mt-3 flex flex-wrap gap-2 text-xs" aria-label="Κύρια πλοήγηση">
            <NavLink to="/" end className={({ isActive }) => headerNavClass(isActive)}>
              Αρχική
            </NavLink>
            <NavLink to="/week/1" className={({ isActive }) => headerNavClass(isActive)}>
              Εβδομάδα 1
            </NavLink>
            <NavLink to="/week/2" className={({ isActive }) => headerNavClass(isActive)}>
              Εβδομάδα 2
            </NavLink>
            <NavLink to="/week/3" className={({ isActive }) => headerNavClass(isActive)}>
              Εβδομάδα 3
            </NavLink>
          </nav>
        </div>
      </header>

      <main
        id="main-content"
        tabIndex={-1}
        className={`${shell} px-4 sm:px-5 pt-5 space-y-5 outline-none focus:outline-none`}
      >
        <Outlet context={study} />
      </main>

      <footer className={`${shell} px-4 sm:px-5 mt-10 pb-8 border-t border-slate-200/80 dark:border-slate-800 pt-6`}>
        <p className="text-[11px] font-medium text-slate-600 dark:text-slate-300">PSD115 Exam Prep by Ilias Tzoukas</p>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 leading-relaxed max-w-prose">
          Αποποίηση: Το υλικό δεν είναι επίσημο από το πανεπιστήμιο ή το μάθημα· πρόκειται για προσωπική προσπάθεια μελέτης και οργάνωσης σημειώσεων, χωρίς εγγύηση πληρότητας ή συμβατότητας με τις εξετάσεις.
        </p>
      </footer>
    </div>
  )
}
