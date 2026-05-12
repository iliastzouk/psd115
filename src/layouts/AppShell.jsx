import { Link, NavLink, Outlet } from 'react-router-dom'
import ScrollToTop from '../components/ScrollToTop.jsx'
import { useStudySession } from '../hooks/useStudySession.js'
import { HEADER_WEEK_NAV } from './weekNavConfig.js'

const shell = 'w-full max-w-md sm:max-w-xl lg:max-w-2xl mx-auto'

function headerNavClass(isActive) {
  return [
    'shrink-0 snap-start touch-manipulation rounded-lg px-2.5 py-1.5 sm:px-3 sm:py-2 text-[11px] sm:text-xs font-medium border transition min-h-[36px] sm:min-h-[40px] inline-flex items-center justify-center whitespace-nowrap',
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
              <h1 className="text-base min-[400px]:text-lg sm:text-xl font-bold leading-snug text-balance">
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
          <nav
            className="mt-2 -mx-4 px-4 sm:mx-0 sm:px-0 flex flex-nowrap gap-1.5 sm:gap-2 overflow-x-auto overscroll-x-contain pb-1 sm:pb-0 scroll-smooth snap-x snap-mandatory [scrollbar-width:thin] [&::-webkit-scrollbar]:h-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-300 dark:[&::-webkit-scrollbar-thumb]:bg-slate-600"
            aria-label="Κύρια πλοήγηση"
          >
            {HEADER_WEEK_NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                title={item.long}
                className={({ isActive }) => headerNavClass(isActive)}
              >
                <span className="sm:hidden">{item.short}</span>
                <span className="hidden sm:inline">{item.long}</span>
              </NavLink>
            ))}
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
