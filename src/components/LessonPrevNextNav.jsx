import { Link } from 'react-router-dom'
import { useRouteIdentity } from '../core/routing/hooks.js'
import { topicNeighbors } from '../core/routing/navigation.js'
import { topicTitle } from '../pages/routing/coursePresentation.js'

const linkClass =
  'touch-manipulation block rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900/80 px-4 py-3 min-h-[52px] hover:border-teal-400 dark:hover:border-teal-600 hover:bg-teal-50/50 dark:hover:bg-teal-950/20 transition text-left sm:max-w-md'

/** Προηγούμενο/επόμενο θέμα της ίδιας unit, από τη σειρά του topics.js (όχι από pathname). */
export default function LessonPrevNextNav() {
  const id = useRouteIdentity()
  if (id.kind !== 'topic') return null
  const { prev, next } = topicNeighbors(id.courseId, id.topicId)
  if (!prev && !next) return null

  return (
    <nav className="pt-2" aria-label="Πλοήγηση μεταξύ ενοτήτων">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-2">Συνέχεια</p>
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-start">
        <div className="flex-1 min-w-0">
          {prev ? (
            <Link to={prev.path} className={linkClass}>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block mb-0.5">Προηγούμενη ενότητα</span>
              <span className="text-sm font-semibold text-teal-700 dark:text-teal-300 leading-snug">← {topicTitle(prev)}</span>
            </Link>
          ) : (
            <span className="hidden sm:block sm:invisible" aria-hidden>
              —
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0 sm:flex sm:justify-end">
          {next ? (
            <Link to={next.path} className={`${linkClass} sm:text-right`}>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block mb-0.5">Επόμενη ενότητα</span>
              <span className="text-sm font-semibold text-teal-700 dark:text-teal-300 leading-snug">{topicTitle(next)} →</span>
            </Link>
          ) : null}
        </div>
      </div>
    </nav>
  )
}
