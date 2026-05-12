import { Link } from 'react-router-dom'
import { WEEK4_TOPIC_CARDS } from '../data/week4/index.js'

export default function Week4Home() {
  return (
    <div className="space-y-4 animate-[fadeIn_0.35s_ease-out]">
      <p className="text-sm text-slate-600 dark:text-slate-300">
        <strong>Εβδομάδα 4:</strong> αίσθηση και αντίληψη — ουδοί, όραση και οπτικός εγκέφαλος, αναγνώριση αντικειμένου, βάθος και κίνηση,
        ακοή, αφή και πόνος, όσφρηση και γεύση (K4). Χρησιμοποίησε <strong>Κάρτες</strong>, <strong>Κουίζ</strong> και{' '}
        <strong>Εξέταση</strong> από το μενού πάνω.
      </p>
      <ul className="grid gap-3 sm:grid-cols-2">
        {WEEK4_TOPIC_CARDS.map((t) => (
          <li key={t.slug}>
            {t.ready ? (
              <Link
                to={`/week/4/${t.slug}`}
                className="block h-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 shadow-sm hover:border-violet-400 transition"
              >
                <p className="text-xs font-medium text-violet-600 dark:text-violet-400">Ενότητα</p>
                <p className="font-semibold text-slate-900 dark:text-white mt-1">{t.title}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{t.description || ''}</p>
              </Link>
            ) : (
              <div className="h-full rounded-2xl border border-dashed border-slate-300 dark:border-slate-600 bg-slate-50/50 dark:bg-slate-900/50 p-4 opacity-70">
                <p className="text-xs font-medium text-slate-500">Σύντομα</p>
                <p className="font-semibold text-slate-700 dark:text-slate-200 mt-1">{t.title}</p>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
