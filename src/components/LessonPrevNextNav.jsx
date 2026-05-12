import { Link, useLocation } from 'react-router-dom'
import { WEEK1_LESSON_NAV } from '../data/week1/lessonNav.js'
import { WEEK2_LESSON_NAV } from '../data/week2/lessonNav.js'
import { WEEK3_LESSON_NAV } from '../data/week3/lessonNav.js'

const linkClass =
  'touch-manipulation block rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900/80 px-4 py-3 min-h-[52px] hover:border-teal-400 dark:hover:border-teal-600 hover:bg-teal-50/50 dark:hover:bg-teal-950/20 transition text-left sm:max-w-md'

export default function LessonPrevNextNav() {
  const { pathname } = useLocation()
  const p = pathname.replace(/\/$/, '') || '/week/1'
  const nav = p.startsWith('/week/3')
    ? WEEK3_LESSON_NAV
    : p.startsWith('/week/2')
      ? WEEK2_LESSON_NAV
      : WEEK1_LESSON_NAV
  const i = nav.findIndex((x) => x.to === p)
  if (i < 0) return null

  const prev = i > 0 ? nav[i - 1] : null
  const next = i < nav.length - 1 ? nav[i + 1] : null
  if (!prev && !next) return null

  return (
    <nav className="pt-2" aria-label="Πλοήγηση μεταξύ ενοτήτων">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-2">Συνέχεια</p>
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-start">
        <div className="flex-1 min-w-0">
          {prev ? (
            <Link to={prev.to} className={linkClass}>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block mb-0.5">Προηγούμενη ενότητα</span>
              <span className="text-sm font-semibold text-teal-700 dark:text-teal-300 leading-snug">← {prev.title}</span>
            </Link>
          ) : (
            <span className="hidden sm:block sm:invisible" aria-hidden>
              —
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0 sm:flex sm:justify-end">
          {next ? (
            <Link to={next.to} className={`${linkClass} sm:text-right`}>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block mb-0.5">Επόμενη ενότητα</span>
              <span className="text-sm font-semibold text-teal-700 dark:text-teal-300 leading-snug">{next.title} →</span>
            </Link>
          ) : null}
        </div>
      </div>
    </nav>
  )
}
