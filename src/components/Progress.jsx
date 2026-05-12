import { useEffect, useState } from 'react'
import { CATEGORIES as ALL_CATEGORIES } from '../data/questions.js'

function pct(part, total) {
  if (!total) return 0
  return Math.round((part / total) * 100)
}

/**
 * @param {object} props
 * @param {object} props.progress — αποθηκευμένη πρόοδος (quiz, κάρτες, byCategory)
 * @param {number} props.totalFlashcards
 * @param {number} props.totalQuiz
 * @param {boolean} [props.defaultExpanded] — false σελίδες ενότητας: συμπαγής μπάρα, ανοιχτό σε hub & εργαλεία
 * @param {{ id: string, label: string }[]} [props.categories] — ανά εβδομάδα (προεπιλογή: όλες)
 */
export default function Progress({ progress, totalFlashcards, totalQuiz, defaultExpanded = true, categories }) {
  const categoryList = categories?.length ? categories : ALL_CATEGORIES
  const [expanded, setExpanded] = useState(defaultExpanded)
  const [catOpen, setCatOpen] = useState(false)

  useEffect(() => {
    setExpanded(defaultExpanded)
  }, [defaultExpanded])

  const quizAccuracy = pct(progress.quizCorrect, progress.quizAnswered)
  const seenFlash = progress.flashcardSeenIds.length
  const flashPct = pct(seenFlash, totalFlashcards)

  const quizLabel = progress.quizAnswered ? `${quizAccuracy}%` : '—'
  const summary = `Κουίζ ${quizLabel} · Κάρτες ${seenFlash}/${totalFlashcards} (${flashPct}%)`

  return (
    <section className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/50 overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="flex w-full items-center justify-between gap-2 px-4 py-3 sm:px-5 text-left touch-manipulation hover:bg-slate-100/80 dark:hover:bg-slate-700/40 transition"
        aria-expanded={expanded}
      >
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Πρόοδος</h3>
          {!expanded && (
            <p className="text-[11px] text-slate-600 dark:text-slate-400 truncate mt-0.5">{summary}</p>
          )}
        </div>
        <span className="shrink-0 text-slate-400 text-xs" aria-hidden>
          {expanded ? '▲' : '▼'}
        </span>
      </button>

      {expanded && (
        <div className="px-4 pb-4 sm:px-5 sm:pb-5 space-y-3 border-t border-slate-200/80 dark:border-slate-600/80 pt-3 animate-[fadeIn_0.2s_ease-out]">
          <div>
            <div className="flex justify-between text-xs text-slate-600 dark:text-slate-300 mb-1">
              <span>Κουίζ — ακρίβεια</span>
              <span>
                {progress.quizAnswered ? `${quizAccuracy}%` : '—'} ({progress.quizCorrect}/{progress.quizAnswered})
              </span>
            </div>
            <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
              <div
                className="h-full rounded-full bg-teal-500 transition-all duration-500"
                style={{ width: `${progress.quizAnswered ? quizAccuracy : 0}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs text-slate-600 dark:text-slate-300 mb-1">
              <span>Κάρτες — μελετήθηκαν</span>
              <span>
                {seenFlash}/{totalFlashcards} ({flashPct}%)
              </span>
            </div>
            <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
              <div
                className="h-full rounded-full bg-indigo-500 transition-all duration-500"
                style={{ width: `${flashPct}%` }}
              />
            </div>
          </div>

          <div className="pt-2 border-t border-slate-200 dark:border-slate-600">
            <button
              type="button"
              onClick={() => setCatOpen((o) => !o)}
              className="flex w-full items-center justify-between gap-2 text-left text-xs font-medium text-slate-600 dark:text-slate-300 py-1 touch-manipulation"
              aria-expanded={catOpen}
            >
              <span>Στατιστικά ανά κατηγορία (κουίζ)</span>
              <span className="text-slate-400 shrink-0" aria-hidden>
                {catOpen ? '▲' : '▼'}
              </span>
            </button>
            {catOpen && (
              <ul className="space-y-2 max-h-[min(40vh,16rem)] overflow-y-auto pr-1 overscroll-contain mt-2 animate-[fadeIn_0.2s_ease-out]">
                {categoryList.map((c) => {
                  const s = progress.byCategory[c.id] || { correct: 0, wrong: 0 }
                  const att = s.correct + s.wrong
                  const p = pct(s.correct, att)
                  return (
                    <li key={c.id}>
                      <div className="flex justify-between text-[11px] text-slate-600 dark:text-slate-300 mb-0.5">
                        <span className="truncate pr-2">{c.label}</span>
                        <span>{att ? `${p}%` : '—'}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-slate-700 dark:bg-slate-200 transition-all duration-400"
                          style={{ width: `${att ? p : 0}%` }}
                        />
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>

          <p className="text-[11px] text-slate-500 dark:text-slate-400">Σύνολο ερωτήσεων κουίζ στο dataset: {totalQuiz}</p>
        </div>
      )}
    </section>
  )
}
