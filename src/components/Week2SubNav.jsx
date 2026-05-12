import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { WEEK2_LESSON_NAV } from '../data/week2/lessonNav.js'

const toolLinks = [
  { to: '/week/2', label: 'Ενότητες', end: true },
  { to: '/week/2/flashcards', label: 'Κάρτες' },
  { to: '/week/2/quiz', label: 'Κουίζ' },
  { to: '/week/2/exam', label: 'Εξέταση' },
  { to: '/week/2/review', label: 'Λάθη' },
]

const lessonPaths = new Set(WEEK2_LESSON_NAV.map((l) => l.to))

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
  return p || '/week/2'
}

const selectClass =
  'w-full min-h-[44px] rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 px-3 py-2 text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500'

const TOOL_PREFIXES = ['/week/2/flashcards', '/week/2/quiz', '/week/2/exam', '/week/2/review']

function isStudyToolPath(pathname) {
  const p = normalizePath(pathname)
  return TOOL_PREFIXES.some((prefix) => p === prefix || p.startsWith(`${prefix}/`))
}

export default function Week2SubNav() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const path = normalizePath(pathname)
  const lessonSelectValue = lessonPaths.has(path) ? path : ''
  const onToolPage = isStudyToolPath(pathname)

  return (
    <nav className="space-y-2.5" aria-label="Εβδομάδα 2 — πλοήγηση">
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
          <label
            htmlFor="week2-lesson-select"
            className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1.5 block"
          >
            Θέμα ενότητας
          </label>
          <select
            id="week2-lesson-select"
            className={selectClass}
            value={lessonSelectValue}
            onChange={(e) => {
              const next = e.target.value
              if (next) navigate(next)
            }}
            aria-label="Επίλεξε θέμα για να ανοίξεις τη σελίδα ενότητας"
          >
            <option value="">— Επίλεξε ενότητα —</option>
            {WEEK2_LESSON_NAV.map(({ to, title }) => (
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
