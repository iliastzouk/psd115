/**
 * Φίλτρο κατηγοριών για κουίζ / κάρτες (dataset categoryId).
 * Συμπαγές: κλειστό από προεπιλογή — αποφεύγει διπλότυπο με πλοήγηση ενοτήτων.
 */
export default function StudyCategoryFilter({ CATEGORIES, selectedIds, toggleCategory }) {
  const allSelected = selectedIds.length === 0
  const summaryText = allSelected
    ? 'Όλες οι κατηγορίες (χωρίς φίλτρο)'
    : `${selectedIds.length} κατηγορί${selectedIds.length === 1 ? 'α' : 'ες'}`

  return (
    <details className="rounded-xl border border-slate-200 dark:border-slate-600 bg-white/60 dark:bg-slate-900/40 overflow-hidden">
      <summary className="cursor-pointer list-none px-3 py-2.5 sm:px-4 flex items-center justify-between gap-2 text-sm font-medium text-slate-800 dark:text-slate-100 touch-manipulation hover:bg-slate-50 dark:hover:bg-slate-800/50 [&::-webkit-details-marker]:hidden">
        <span>
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 block mb-0.5">
            Φίλτρο ανά κατηγορία (κάρτες / κουίζ)
          </span>
          {summaryText}
        </span>
        <span className="text-slate-400 text-xs shrink-0" aria-hidden>
          ▼
        </span>
      </summary>
      <div className="px-3 pb-3 sm:px-4 sm:pb-4 pt-0 border-t border-slate-100 dark:border-slate-700/80">
        <p className="text-[11px] text-slate-500 dark:text-slate-400 py-2">
          Επίλεξε μία ή περισσότερες· διαφορετικό από το μενού «Θέμα ενότητας» πάνω (εκεί ανοίγεις σελίδα ενότητας).
        </p>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => toggleCategory('all')}
            className={[
              'touch-manipulation rounded-full px-3 py-2 text-xs border min-h-[40px]',
              allSelected
                ? 'border-teal-600 bg-teal-600 text-white'
                : 'border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200',
            ].join(' ')}
          >
            Όλες
          </button>
          {CATEGORIES.map((c) => {
            const on = selectedIds.includes(c.id)
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => toggleCategory(c.id)}
                className={[
                  'touch-manipulation rounded-full px-3 py-2 text-xs border max-w-[min(100%,20rem)] text-left min-h-[40px]',
                  on ? 'border-teal-600 bg-teal-50 dark:bg-teal-950/50' : 'border-slate-300 dark:border-slate-600',
                ].join(' ')}
              >
                {c.label}
              </button>
            )
          })}
        </div>
      </div>
    </details>
  )
}
