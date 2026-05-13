import { Link, NavLink, Outlet } from 'react-router-dom'
import ScrollToTop from '../components/ScrollToTop.jsx'
import { useStudySession } from '../hooks/useStudySession.js'
import { HEADER_WEEK_NAV } from './weekNavConfig.js'

const shell = 'w-full max-w-md sm:max-w-xl lg:max-w-2xl mx-auto'

function headerNavClass(isActive) {
  return [
    'shrink-0 snap-start touch-manipulation rounded-md px-2 py-1 sm:rounded-lg sm:px-2.5 sm:py-1.5 md:px-3 md:py-2 text-[10px] sm:text-[11px] md:text-xs font-medium border transition min-h-[30px] sm:min-h-[34px] md:min-h-[40px] inline-flex items-center justify-center whitespace-nowrap',
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
      <header className="sticky top-0 z-10 border-b border-slate-200/80 dark:border-slate-800 bg-stone-50/95 dark:bg-slate-950/95 backdrop-blur-md landscape:max-lg:shadow-sm">
        <div
          className={`${shell} px-3 sm:px-5 pt-[max(0.35rem,env(safe-area-inset-top))] pb-2 sm:pt-[max(0.65rem,env(safe-area-inset-top))] sm:pb-3 landscape:max-lg:pt-[max(0.25rem,env(safe-area-inset-top))] landscape:max-lg:pb-1.5`}
        >
          <div className="flex flex-row items-start justify-between gap-2 min-[400px]:gap-3">
            <div className="min-w-0 flex-1 pr-1">
              <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0">
                <Link
                  to="/"
                  title="PSD115 Exam Prep"
                  className="text-[11px] sm:text-xs text-teal-700 dark:text-teal-300 font-semibold hover:underline leading-none"
                >
                  <span className="sm:hidden">PSD115</span>
                  <span className="hidden sm:inline">PSD115 Exam Prep</span>
                </Link>
                <span className="text-[10px] text-slate-500 dark:text-slate-500 hidden sm:inline" aria-hidden>
                  ·
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 hidden sm:inline">Ilias Tzoukas</span>
              </div>
              <h1 className="text-sm sm:text-base md:text-lg font-bold leading-tight text-balance mt-0.5 sm:mt-1 landscape:max-lg:text-[13px] landscape:max-lg:leading-snug">
                Ψυχολογία: Η εξέλιξη μιας επιστήμης
              </h1>
            </div>
            <div className="flex flex-col items-end gap-1 shrink-0 pt-0.5">
              <button
                type="button"
                onClick={() => study.setDark((d) => !d)}
                title={study.dark ? 'Φωτεινό θέμα' : 'Σκοτεινό θέμα'}
                className="touch-manipulation rounded-full border border-slate-300 dark:border-slate-600 px-2.5 py-1 min-h-[36px] sm:min-h-[38px] text-[11px] font-medium hover:bg-slate-100 dark:hover:bg-slate-900 transition"
              >
                {study.dark ? 'Φωτεινό' : 'Σκοτεινό'}
              </button>
              <button
                type="button"
                onClick={study.handleResetAll}
                title="Επαναφορά προόδου μελέτης"
                className="touch-manipulation text-right text-[10px] sm:text-[11px] text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 underline-offset-2 hover:underline py-0.5 px-1 -mr-1 min-h-[32px] sm:min-h-0 flex items-center max-w-[5.5rem] sm:max-w-none leading-tight"
              >
                <span className="sm:hidden">Επαναφορά</span>
                <span className="hidden sm:inline">Επαναφορά προόδου</span>
              </button>
            </div>
          </div>
          <nav
            className="mt-1.5 sm:mt-2 -mx-3 px-3 sm:mx-0 sm:px-0 flex flex-nowrap gap-1 sm:gap-1.5 md:gap-2 overflow-x-auto overscroll-x-contain pb-0.5 sm:pb-0 scroll-smooth snap-x snap-mandatory [scrollbar-width:thin] [&::-webkit-scrollbar]:h-0.5 sm:[&::-webkit-scrollbar]:h-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-300 dark:[&::-webkit-scrollbar-thumb]:bg-slate-600"
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
        className={`${shell} px-3 sm:px-5 pt-3 sm:pt-5 space-y-5 outline-none focus:outline-none`}
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
