import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import ConfirmDialog from '../components/ConfirmDialog.jsx'
import DisclaimerModal from '../components/DisclaimerModal.jsx'
import ScrollToTop from '../components/ScrollToTop.jsx'
import WarningTriangleIcon from '../components/WarningTriangleIcon.jsx'
import { useStudySession } from '../hooks/useStudySession.js'
import { HEADER_WEEK_NAV } from './weekNavConfig.js'
import { acceptDisclaimer, hasAcceptedDisclaimer } from '../utils/storage.js'

const shell = 'w-full max-w-md sm:max-w-xl lg:max-w-2xl mx-auto'

function headerNavClass(isActive) {
  return [
    'shrink-0 snap-start touch-manipulation rounded-md px-1.5 py-0.5 sm:rounded-md sm:px-2 sm:py-1 md:px-2.5 md:py-1 text-[9px] sm:text-[10px] md:text-[11px] font-medium border transition min-h-[22px] sm:min-h-[24px] md:min-h-[26px] inline-flex items-center justify-center whitespace-nowrap leading-tight',
    isActive
      ? 'border-teal-600 bg-teal-600 text-white shadow-sm'
      : 'border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:border-teal-400 hover:bg-white dark:hover:bg-slate-900',
  ].join(' ')
}

function drawerNavClass(isActive) {
  return [
    'block w-full rounded-lg px-3 py-2 text-xs font-medium border transition text-left touch-manipulation leading-snug',
    isActive
      ? 'border-teal-600 bg-teal-600 text-white shadow-sm'
      : 'border-slate-300 dark:border-slate-600 text-slate-800 dark:text-slate-100 hover:border-teal-400 hover:bg-white dark:hover:bg-slate-900',
  ].join(' ')
}

function MenuIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden className="shrink-0">
      <path
        d="M4 6h16M4 12h16M4 18h16"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}

export default function AppShell() {
  const study = useStudySession()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false)
  const [disclaimerOpen, setDisclaimerOpen] = useState(() =>
    typeof window !== 'undefined' ? !hasAcceptedDisclaimer() : false,
  )

  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (!menuOpen) return
    const onKey = (e) => {
      if (e.key === 'Escape') setMenuOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [menuOpen])

  useEffect(() => {
    if (!menuOpen) return
    const prev = document.documentElement.style.overflow
    document.documentElement.style.overflow = 'hidden'
    return () => {
      document.documentElement.style.overflow = prev
    }
  }, [menuOpen])

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)')
    const onChange = () => {
      if (mq.matches) setMenuOpen(false)
    }
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  return (
    <div
      className="min-h-dvh bg-stone-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-[max(2.5rem,env(safe-area-inset-bottom))] transition-colors duration-300"
      inert={disclaimerOpen ? true : undefined}
    >
      <DisclaimerModal
        open={disclaimerOpen}
        onAccept={() => {
          acceptDisclaimer()
          setDisclaimerOpen(false)
        }}
      />
      <ScrollToTop />
      <header className="sticky top-0 z-10 border-b border-slate-200/80 dark:border-slate-800 bg-stone-50/95 dark:bg-slate-950/95 backdrop-blur-md landscape:max-lg:shadow-sm">
        <div
          className={`${shell} px-3 sm:px-5 pt-[max(0.35rem,env(safe-area-inset-top))] pb-1 sm:pb-1.5 sm:pt-[max(0.65rem,env(safe-area-inset-top))] md:pb-2 landscape:max-lg:pt-[max(0.25rem,env(safe-area-inset-top))] landscape:max-lg:pb-1`}
        >
          <div className="flex flex-row items-center justify-between gap-2 min-[400px]:gap-3">
            <div className="flex min-w-0 flex-1 items-center gap-2 min-[400px]:gap-2.5">
              <button
                type="button"
                className="lg:hidden touch-manipulation flex size-10 shrink-0 items-center justify-center rounded-lg border border-slate-300 dark:border-slate-600 text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-900 transition landscape:max-lg:size-9"
                aria-expanded={menuOpen}
                aria-controls="week-drawer-nav"
                onClick={() => setMenuOpen(true)}
              >
                <span className="sr-only">Άνοιγμα μενού πλοήγησης</span>
                <MenuIcon />
              </button>
              <div className="min-w-0 flex-1 pr-1">
                <h1 className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5 text-balance leading-snug">
                  <Link
                    to="/"
                    title="PSD115 Exam Prep by Ilias Tzoukas — Ψυχολογία 2"
                    className="text-[10px] sm:text-xs text-teal-700 dark:text-teal-300 font-semibold hover:underline shrink min-w-0"
                  >
                    PSD115 Exam Prep by Ilias Tzoukas
                  </Link>
                  <span aria-hidden className="shrink-0 text-slate-400 dark:text-slate-500 select-none text-[10px] sm:text-xs">
                    ·
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-50 shrink-0">
                    Ψυχολογία 2
                  </span>
                </h1>
                <p
                  className="mt-1 flex items-center gap-1 rounded-md border border-rose-100/80 bg-rose-50/25 px-1.5 py-0.5 text-[9px] sm:text-[10px] font-normal leading-tight text-slate-600 text-balance dark:border-rose-900/20 dark:bg-rose-950/15 dark:text-slate-400"
                  title="Το υλικό δεν είναι επίσημο από το πανεπιστήμιο ή το μάθημα· προσωπική μελέτη χωρίς εγγύηση πληρότητας ή συμβατότητας με τις εξετάσεις."
                >
                  <span className="shrink-0 text-amber-600/55 dark:text-amber-500/45" aria-hidden>
                    <WarningTriangleIcon className="size-3 sm:size-3" />
                  </span>
                  <span>
                    <span className="font-normal text-rose-600/90 dark:text-rose-300/85">ΠΡΟΣΟΧΗ:</span>{' '}
                    Μη επίσημο υλικό · προσωπική μελέτη
                  </span>
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => study.setDark((d) => !d)}
              className="touch-manipulation flex size-8 shrink-0 items-center justify-center rounded-full border border-slate-300 dark:border-slate-600 text-base leading-none hover:bg-slate-100 dark:hover:bg-slate-900 transition landscape:max-lg:size-7 landscape:max-lg:text-[15px]"
              aria-label={study.dark ? 'Αλλαγή σε φωτεινό θέμα' : 'Αλλαγή σε σκοτεινό θέμα'}
              title={study.dark ? 'Φωτεινό θέμα' : 'Σκοτεινό θέμα'}
            >
              <span aria-hidden>{study.dark ? '☀' : '☽'}</span>
            </button>
          </div>
          <nav
            className="mt-0.5 -mx-3 px-3 sm:mx-0 sm:px-0 hidden lg:flex flex-nowrap gap-0.5 sm:gap-1 md:gap-1 overflow-x-auto overscroll-x-contain pb-0.5 scroll-smooth snap-x snap-mandatory [scrollbar-width:thin] [&::-webkit-scrollbar]:h-0.5 sm:[&::-webkit-scrollbar]:h-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-300 dark:[&::-webkit-scrollbar-thumb]:bg-slate-600"
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

      {menuOpen ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-[2px] lg:hidden"
            aria-label="Κλείσιμο μενού"
            onClick={() => setMenuOpen(false)}
          />
          <div
            id="week-drawer-nav"
            role="dialog"
            aria-modal="true"
            aria-label="Πλοήγηση εβδομάδων"
            className="fixed inset-y-0 left-0 z-50 flex w-[min(20rem,88vw)] max-w-full flex-col border-r border-slate-200/90 bg-stone-50 pt-[max(0.5rem,env(safe-area-inset-top))] shadow-xl dark:border-slate-700 dark:bg-slate-950 lg:hidden"
          >
            <div className="flex items-center justify-between gap-2 border-b border-slate-200/80 px-3 py-2 dark:border-slate-800">
              <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">Πλοήγηση</span>
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                className="touch-manipulation rounded-lg border border-transparent px-2 py-1 text-sm text-teal-700 hover:bg-slate-100 dark:text-teal-300 dark:hover:bg-slate-900"
              >
                Κλείσιμο
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto overscroll-y-contain px-3 py-3" aria-label="Κύρια πλοήγηση">
              <ul className="space-y-1">
                {HEADER_WEEK_NAV.map((item) => (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      end={item.end}
                      className={({ isActive }) => drawerNavClass(isActive)}
                      onClick={() => setMenuOpen(false)}
                    >
                      {item.long}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </nav>
            <p className="shrink-0 flex items-center gap-1.5 border-t border-rose-100/90 bg-rose-50/20 px-3 py-2 text-[9px] font-normal leading-tight text-slate-600 dark:border-rose-900/20 dark:bg-rose-950/15 dark:text-slate-400">
              <span className="shrink-0 text-amber-600/55 dark:text-amber-500/45" aria-hidden>
                <WarningTriangleIcon className="size-3" />
              </span>
              <span>
                <span className="font-normal text-rose-600/90 dark:text-rose-300/85">ΠΡΟΣΟΧΗ:</span> Μη επίσημο υλικό · προσωπική μελέτη
              </span>
            </p>
          </div>
        </>
      ) : null}

      <main
        id="main-content"
        tabIndex={-1}
        className={`${shell} px-3 sm:px-5 pt-3 sm:pt-5 space-y-5 outline-none focus:outline-none`}
      >
        <Outlet context={study} />
      </main>

      <footer className={`${shell} px-3 sm:px-5 mt-10 pb-8 border-t border-slate-200/80 dark:border-slate-800 pt-6`}>
        <p className="text-sm font-medium text-slate-700 dark:text-slate-200">PSD115 Exam Prep by Ilias Tzoukas</p>
        <aside
          className="mt-4 rounded-xl border border-rose-100/90 bg-rose-50/35 px-3.5 py-3 sm:px-4 sm:py-3.5 shadow-sm dark:border-rose-900/30 dark:bg-rose-950/20 dark:shadow-none"
          aria-label="Προσοχή — αποποίηση ευθύνης"
        >
          <div className="flex items-start gap-2.5">
            <span className="mt-0.5 shrink-0 text-amber-600/50 dark:text-amber-500/40" aria-hidden>
              <WarningTriangleIcon className="size-5 sm:size-6" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-normal uppercase tracking-wide text-rose-700/90 dark:text-rose-300/80">
                ΠΡΟΣΟΧΗ · Αποποίηση
              </p>
              <p className="mt-1.5 text-xs sm:text-sm font-normal leading-relaxed text-slate-700 dark:text-slate-300">
                Το υλικό δεν είναι επίσημο από το πανεπιστήμιο ή το μάθημα· πρόκειται για προσωπική προσπάθεια μελέτης
                και οργάνωσης σημειώσεων, χωρίς εγγύηση πληρότητας ή συμβατότητας με τις εξετάσεις.
              </p>
            </div>
          </div>
        </aside>
        <button
          type="button"
          onClick={() => setResetConfirmOpen(true)}
          className="mt-4 touch-manipulation text-left text-xs text-rose-600/90 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300 underline-offset-2 hover:underline"
        >
          Επαναφορά προόδου μελέτης
        </button>
      </footer>

      <ConfirmDialog
        open={resetConfirmOpen}
        onClose={() => setResetConfirmOpen(false)}
        onConfirm={() => {
          study.resetAllStudyProgress()
          setResetConfirmOpen(false)
        }}
        title="Επαναφορά προόδου"
        description="Να διαγραφεί όλη η αποθηκευμένη πρόοδος; Η ενέργεια δεν μπορεί να αναιρεθεί."
        cancelLabel="Άκυρο"
        confirmLabel="Ναι, διαγραφή"
        variant="danger"
      />
    </div>
  )
}
