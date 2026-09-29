import { Link } from 'react-router-dom'

/**
 * Σελίδα «δεν βρέθηκε». Ποτέ σιωπηλή ανακατεύθυνση σε άλλο περιεχόμενο — μόνο προτεινόμενα links.
 * @param {{ message?: string, links?: { to: string, label: string }[] }} props
 */
export default function NotFound({ message = 'Η διεύθυνση δεν αντιστοιχεί σε κάποια σελίδα.', links = [] }) {
  return (
    <div data-testid="not-found" className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 space-y-3">
      <h1 className="text-xl font-bold text-slate-900 dark:text-white">Η σελίδα δεν βρέθηκε</h1>
      <p className="text-sm text-slate-600 dark:text-slate-300">{message}</p>
      <ul className="flex flex-wrap gap-2">
        {[...links, { to: '/', label: 'Αρχική' }].map((l) => (
          <li key={l.to}>
            <Link
              to={l.to}
              className="inline-flex rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-1.5 text-sm text-teal-700 dark:text-teal-300 hover:border-teal-400"
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
