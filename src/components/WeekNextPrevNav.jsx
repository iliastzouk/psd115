import { Link } from 'react-router-dom'
import { courseHomePath, unitNeighbors } from '../core/routing/navigation.js'

const btn =
  'touch-manipulation inline-flex items-center justify-center rounded-xl border px-4 py-3 text-sm font-medium min-h-[48px] transition border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 hover:border-teal-500 hover:bg-teal-50/60 dark:hover:bg-teal-950/25 text-teal-800 dark:text-teal-200'

/**
 * Footer navigation between units of a course (after lesson prev/next within the same unit).
 * Γείτονες από τη σειρά των units του μαθήματος· στα άκρα, η αρχική του μαθήματος.
 * @param {{ courseId: string, unitId: string }} props
 */
export default function WeekNextPrevNav({ courseId, unitId }) {
  const { prev: prevUnit, next: nextUnit } = unitNeighbors(courseId, unitId)
  const home = courseHomePath(courseId)
  const prev = prevUnit ? (
    <Link to={prevUnit.path} className={btn}>
      ← Προηγούμενη εβδομάδα
    </Link>
  ) : (
    <Link to={home} className={btn}>
      ← Αρχική
    </Link>
  )

  const next = nextUnit ? (
    <Link to={nextUnit.path} className={`${btn} sm:text-right sm:ml-auto`}>
      Επόμενη εβδομάδα →
    </Link>
  ) : (
    <Link to={home} className={`${btn} sm:text-right sm:ml-auto`}>
      Αρχική →
    </Link>
  )

  return (
    <nav className="pt-6 mt-2 border-t border-slate-200/90 dark:border-slate-700/90" aria-label="Πλοήγηση μεταξύ εβδομάδων">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-3">Εβδομάδες</p>
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center">
        <div className="flex-1 min-w-0">{prev}</div>
        <div className="flex-1 min-w-0 sm:flex sm:justify-end">{next}</div>
      </div>
    </nav>
  )
}
