import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { WEEK1_LESSON_NAV } from '../data/week1/lessonNav.js'

/** Πάντα ορατά — χωρίς οριζόντιο scroll για Κάρτες/Κουίζ */
const toolLinks = [
  /** Όχι «Αρχική» — αυτό είναι το app home στο header (`/`). Εδώ: λίστα ενοτήτων εβδομάδας. */
  { to: '/week/1', label: 'Ενότητες', end: true },
  { to: '/week/1/flashcards', label: 'Κάρτες' },
  { to: '/week/1/quiz', label: 'Κουίζ' },
  { to: '/week/1/exam', label: 'Εξέταση' },
  { to: '/week/1/review', label: 'Λάθη' },
]

const lessonPaths = new Set(WEEK1_LESSON_NAV.map((l) => l.to))

const pillBase =
  'touch-manipulation rounded-full px-3 py-2 text-xs font-medium border transition min-h-[40px] inline-flex items-center'

function linkClass(isActive) {
  return [
    pillBase,
    isActive
      ? 'border-teal-600 bg-teal-600 text-white'
      : 'border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:border-teal-400',
  ].join(' ')
}

function normalizePath(pathname) {
  const p = pathname.replace(/\/$/, '')
  return p || '/week/1'
}

const selectClass =
  'w-full min-h-[44px] rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 px-3 py-2 text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500'

const TOOL_PREFIXES = ['/week/1/flashcards', '/week/1/quiz', '/week/1/exam', '/week/1/review']

function isStudyToolPath(pathname) {
  const p = normalizePath(pathname)
  return TOOL_PREFIXES.some((prefix) => p === prefix || p.startsWith(`${prefix}/`))
}

export default function Week1SubNav() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const path = normalizePath(pathname)
  const lessonSelectValue = lessonPaths.has(path) ? path : ''
  const onToolPage = isStudyToolPath(pathname)

  const selectAriaLabel = 'Επίλεξε θέμα για να ανοίξεις τη σελίδα ενότητας'

  return (
    <nav className="space-y-2.5" aria-label="Εβδομάδα 1 — πλοήγηση">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1.5">
          Εργαλεία μελέτης
        </p>
        <div className="flex flex-wrap gap-1.5">
          {toolLinks.map(({ to, label, end }) => (
            <NavLink key={to} to={to} end={end} className={({ isActive }) => linkClass(isActive)}>
              {label}
            </NavLink>
          ))}
        </div>
      </div>

      {!onToolPage && (
        <div>
          <label htmlFor="week1-lesson-select" className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1.5 block">
            Θέμα ενότητας
          </label>
          <select
            id="week1-lesson-select"
            className={selectClass}
            value={lessonSelectValue}
            onChange={(e) => {
              const next = e.target.value
              if (next) navigate(next)
            }}
            aria-label={selectAriaLabel}
          >
            <option value="">— Επίλεξε ενότητα —</option>
            {WEEK1_LESSON_NAV.map(({ to, title }) => (
              <option key={to} value={to}>
                {title}
              </option>
            ))}
          </select>
        </div>
      )}
    </nav>
  )
}
