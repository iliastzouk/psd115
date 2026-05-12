import { Link } from 'react-router-dom'

const btn =
  'touch-manipulation inline-flex items-center justify-center rounded-xl border px-4 py-3 text-sm font-medium min-h-[48px] transition border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 hover:border-teal-500 hover:bg-teal-50/60 dark:hover:bg-teal-950/25 text-teal-800 dark:text-teal-200'

/**
 * Footer navigation between weeks (after lesson prev/next within the same week).
 * @param {{ weekNum: 1 | 2 | 3 | 4 }} props
 */
export default function WeekNextPrevNav({ weekNum }) {
  const prev =
    weekNum <= 1 ? (
      <Link to="/" className={btn}>
        ← Αρχική
      </Link>
    ) : (
      <Link to={`/week/${weekNum - 1}`} className={btn}>
        ← Προηγούμενη εβδομάδα
      </Link>
    )

  const next =
    weekNum >= 4 ? (
      <Link to="/" className={`${btn} sm:text-right sm:ml-auto`}>
        Αρχική →
      </Link>
    ) : (
      <Link to={`/week/${weekNum + 1}`} className={`${btn} sm:text-right sm:ml-auto`}>
        Επόμενη εβδομάδα →
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
