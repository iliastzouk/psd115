import { useState } from 'react'
import { getCategoryLabel } from '../data/questions.js'

export default function WrongAnswersReview({ items, onClear, onClearOne }) {
  const [openId, setOpenId] = useState(null)

  if (!items.length) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-600 p-6 text-center text-sm text-slate-600 dark:text-slate-300">
        Δεν έχεις ακόμη λάθη στο αρχείο επανάληψης. Ολοκλήρωσε κουίζ για να εμφανιστούν εδώ.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center gap-2">
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Επανάληψη λαθών</h3>
        <button
          type="button"
          onClick={onClear}
          className="touch-manipulation shrink-0 text-xs rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-2 min-h-[40px] text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        >
          Καθαρισμός λίστας
        </button>
      </div>

      <ul className="space-y-2">
        {items.map((w) => {
          const open = openId === w.uid
          return (
            <li
              key={w.uid}
              className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden transition-shadow hover:shadow-md"
            >
              <button
                type="button"
                className="touch-manipulation w-full text-left px-4 py-3 min-h-[48px] flex justify-between gap-2 items-start"
                onClick={() => setOpenId(open ? null : w.uid)}
              >
                <div>
                  <p className="text-[11px] uppercase text-slate-500 dark:text-slate-400">
                    {getCategoryLabel(w.categoryId)}
                  </p>
                  <p className="text-sm text-slate-900 dark:text-slate-100 line-clamp-2">{w.question}</p>
                </div>
                <span className="text-xs text-teal-600 dark:text-teal-400 shrink-0">{open ? '▲' : '▼'}</span>
              </button>
              {open && (
                <div className="px-4 pb-4 text-sm text-slate-700 dark:text-slate-200 border-t border-slate-100 dark:border-slate-800 animate-[fadeIn_0.25s_ease-out]">
                  <p className="mt-3">
                    <span className="font-medium">Η δική σου επιλογή:</span> {w.userLabel}
                  </p>
                  <p className="mt-1">
                    <span className="font-medium">Σωστή:</span> {w.correctLabel}
                  </p>
                  <p className="mt-2 text-slate-600 dark:text-slate-300 break-words text-pretty">{w.explanation}</p>
                  <button
                    type="button"
                    className="touch-manipulation mt-3 text-xs text-rose-600 dark:text-rose-400 hover:underline min-h-[40px]"
                    onClick={() => onClearOne(w.uid)}
                  >
                    Αφαίρεση από τη λίστα
                  </button>
                </div>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
