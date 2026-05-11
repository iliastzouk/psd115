import { useState } from 'react'
import { CATEGORIES } from '../data/questions.js'

function pct(part, total) {
  if (!total) return 0
  return Math.round((part / total) * 100)
}

export default function Progress({ progress, totalFlashcards, totalQuiz }) {
  const [catOpen, setCatOpen] = useState(false)
  const quizAccuracy = pct(progress.quizCorrect, progress.quizAnswered)
  const seenFlash = progress.flashcardSeenIds.length
  const flashPct = pct(seenFlash, totalFlashcards)

  return (
    <section className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/50 p-4 sm:p-5">
      <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-3">Πρόοδος</h3>

      <div className="space-y-3">
        <div>
          <div className="flex justify-between text-xs text-slate-600 dark:text-slate-300 mb-1">
            <span>Κουίζ — ακρίβεια</span>
            <span>
              {progress.quizAnswered ? `${quizAccuracy}%` : '—'} ({progress.quizCorrect}/
              {progress.quizAnswered})
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
            <span>Ανά κατηγορία (κουίζ)</span>
            <span className="text-slate-400 shrink-0" aria-hidden>
              {catOpen ? '▲' : '▼'}
            </span>
          </button>
          {catOpen && (
            <ul className="space-y-2 max-h-[min(40vh,16rem)] overflow-y-auto pr-1 overscroll-contain mt-2 animate-[fadeIn_0.2s_ease-out]">
              {CATEGORIES.map((c) => {
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

        <p className="text-[11px] text-slate-500 dark:text-slate-400">
          Σύνολο ερωτήσεων κουίζ στο dataset: {totalQuiz}
        </p>
      </div>
    </section>
  )
}
