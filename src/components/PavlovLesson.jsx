import { useCallback, useEffect, useMemo, useState } from 'react'
import Flashcard from './Flashcard.jsx'
import SectionCard from './SectionCard.jsx'
import { pavlovLesson, pavlovExamQuestions, pavlovLessonQuizIds } from '../data/week1/pavlov.js'
import { quizQuestions, getCategoryLabel } from '../data/questions.js'
import { loadPavlovChecklist, savePavlovChecklist } from '../utils/storage.js'

const FC_ORDER = ['fc-pavlov-1', 'fc-pavlov-2', 'fc-pavlov-3', 'fc-pavlov-4', 'fc-pavlov-5', 'fc-pavlov-8', 'fc-pavlov-6', 'fc-pavlov-7']

function LessonQuizItem({ q }) {
  const [selected, setSelected] = useState(null)
  const revealed = selected !== null
  const correct = selected === q.correctIndex
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-600 p-4 space-y-2">
      <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{q.question}</p>
      <div className="flex flex-col gap-2">
        {q.options.map((opt, idx) => (
          <button
            key={idx}
            type="button"
            disabled={revealed}
            onClick={() => setSelected(idx)}
            className={`touch-manipulation w-full text-left rounded-lg border px-3 py-2.5 text-sm min-h-[48px] transition ${
              !revealed
                ? selected === idx
                  ? 'border-violet-500 bg-violet-50 dark:bg-violet-950/40'
                  : 'border-slate-200 dark:border-slate-600'
                : idx === q.correctIndex
                  ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30'
                  : idx === selected
                    ? 'border-rose-400 bg-rose-50 dark:bg-rose-950/30'
                    : 'border-slate-200 dark:border-slate-700 opacity-50'
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
      {revealed && (
        <p className={`text-sm mt-2 p-3 rounded-lg ${correct ? 'bg-emerald-50 dark:bg-emerald-950/25 text-emerald-900 dark:text-emerald-100' : 'bg-amber-50 dark:bg-amber-950/25 text-amber-950 dark:text-amber-100'}`}>
          {q.explanation}
        </p>
      )}
    </div>
  )
}

export default function PavlovLesson({ pavlovFlashcards, onMarkFlashSeen }) {
  const L = pavlovLesson
  const pavlovCategoryLabel = getCategoryLabel('pavlov')
  const [checklist, setChecklist] = useState(() => loadPavlovChecklist(L.progressChecklist.length))
  const [fcIndex, setFcIndex] = useState(0)
  const [openExamIdx, setOpenExamIdx] = useState({})
  const [activeTermId, setActiveTermId] = useState(() => L.visualTerms?.[0]?.id ?? null)

  useEffect(() => {
    savePavlovChecklist(checklist)
  }, [checklist])

  const lessonQuizItems = useMemo(() => {
    const map = new Map(quizQuestions.map((q) => [q.id, q]))
    return pavlovLessonQuizIds.map((id) => map.get(id)).filter(Boolean)
  }, [])

  const orderedCards = useMemo(() => {
    const byId = Object.fromEntries(pavlovFlashcards.map((c) => [c.id, c]))
    return FC_ORDER.map((id) => byId[id]).filter(Boolean)
  }, [pavlovFlashcards])

  const activeTerm = useMemo(() => L.visualTerms?.find((t) => t.id === activeTermId) ?? L.visualTerms?.[0], [L.visualTerms, activeTermId])
  const currentFc = orderedCards[fcIndex] ?? orderedCards[0]

  const toggleCheck = useCallback((i) => {
    setChecklist((prev) => {
      const next = [...prev]
      next[i] = !next[i]
      return next
    })
  }, [])

  const nextFlash = useCallback(() => {
    if (fcIndex < orderedCards.length - 1) setFcIndex((i) => i + 1)
    else setFcIndex(0)
  }, [fcIndex, orderedCards.length])

  return (
    <div className="space-y-5 animate-[fadeIn_0.4s_ease-out]">
      <div className="text-center py-6 px-4 rounded-2xl bg-gradient-to-b from-violet-50 to-stone-50 dark:from-violet-950/35 dark:to-slate-900 border border-violet-100 dark:border-violet-900">
        <p className="text-xs font-semibold text-violet-800 dark:text-violet-300 uppercase tracking-widest">Ενότητα · SOS</p>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-50 mt-2 text-balance">{L.title}</h1>
      </div>

      <SectionCard title="Διάλεξη & διαφάνειες">
        <p className="text-sm text-slate-800 dark:text-slate-100 whitespace-pre-line leading-relaxed font-medium">{L.pptSlide}</p>
        <figure className="mt-4 space-y-2">
          <img src={L.pptDiagramSrc} alt="Σχηματικό Pavlov — κλασική εξάρτηση (πριν, κατά, μετά τη μάθηση)" className="w-full rounded-xl border border-violet-200 dark:border-violet-800 bg-white dark:bg-slate-900/50" loading="lazy" />
          <figcaption className="text-xs text-slate-500 dark:text-slate-400">{L.pptDiagramCaption}</figcaption>
        </figure>
      </SectionCard>

      <SectionCard title="4 στάδια με μια ματιά">
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse min-w-[260px]">
            <thead>
              <tr>
                <th className="border border-slate-200 dark:border-slate-600 bg-slate-100 dark:bg-slate-800 px-3 py-2 text-left">Στάδιο</th>
                <th className="border border-slate-200 dark:border-slate-600 bg-slate-100 dark:bg-slate-800 px-3 py-2 text-left">Τι συμβαίνει</th>
              </tr>
            </thead>
            <tbody>
              {L.quickSummaryRows.map((row) => (
                <tr key={row.stage}>
                  <td className="border border-slate-200 dark:border-slate-600 px-3 py-2 font-medium">{row.stage}</td>
                  <td className="border border-slate-200 dark:border-slate-600 px-3 py-2">{row.happens}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      <SectionCard title="SOS όροι">
        <div className="overflow-x-auto mb-4">
          <table className="w-full text-sm border-collapse min-w-[260px]">
            <thead>
              <tr>
                <th className="border border-slate-200 dark:border-slate-600 bg-slate-100 dark:bg-slate-800 px-3 py-2 text-left">Όρος</th>
                <th className="border border-slate-200 dark:border-slate-600 bg-slate-100 dark:bg-slate-800 px-3 py-2 text-left">Παράδειγμα</th>
              </tr>
            </thead>
            <tbody>
              {L.sosTermsTable.map((row) => (
                <tr key={row.term}>
                  <td className="border border-slate-200 dark:border-slate-600 px-3 py-2 font-medium">{row.term}</td>
                  <td className="border border-slate-200 dark:border-slate-600 px-3 py-2">{row.example}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">{L.visualLearningIntro}</p>
        <div className="flex flex-wrap gap-2 mb-3">
          {L.visualTerms.map((term) => (
            <button
              key={term.id}
              type="button"
              title={`${term.definition} — ${term.example}`}
              onMouseEnter={() => setActiveTermId(term.id)}
              onFocus={() => setActiveTermId(term.id)}
              onClick={() => setActiveTermId(term.id)}
              className={`rounded-full border px-3 py-1.5 text-xs transition ${
                activeTerm?.id === term.id ? 'border-violet-600 bg-violet-100 dark:bg-violet-900/40 text-violet-900 dark:text-violet-100' : 'border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200'
              }`}
            >
              {term.label}
            </button>
          ))}
        </div>
        {activeTerm ? (
          <div className="rounded-xl border border-violet-200 dark:border-violet-800 bg-violet-50/70 dark:bg-violet-950/20 p-3 space-y-1">
            <p className="text-xs font-semibold text-violet-800 dark:text-violet-300">{activeTerm.stage}</p>
            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{activeTerm.label}</p>
            <p className="text-sm text-slate-700 dark:text-slate-200">{activeTerm.definition}</p>
            <p className="text-xs text-slate-600 dark:text-slate-300">Παράδειγμα: {activeTerm.example}</p>
          </div>
        ) : null}
      </SectionCard>

      <SectionCard title={L.examKeywordTitle}>
        <p className="text-sm text-slate-800 dark:text-slate-100 whitespace-pre-line leading-relaxed">{L.examKeywordBody}</p>
      </SectionCard>

      <SectionCard title="Συχνό MCQ">
        <p className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-3">{L.frequentMcq.question}</p>
        <ul className="space-y-2">
          {L.frequentMcq.options.map((opt) => (
            <li key={opt} className={`rounded-lg border px-3 py-2 text-sm ${opt === L.frequentMcq.correctAnswer ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-50/80 dark:bg-emerald-950/25' : 'border-slate-200 dark:border-slate-700'}`}>
              {opt} {opt === L.frequentMcq.correctAnswer ? '✅' : ''}
            </li>
          ))}
        </ul>
      </SectionCard>

      <SectionCard title="Κάρτες μνήμης">
        {currentFc ? (
          <Flashcard
            card={currentFc}
            categoryLabel={pavlovCategoryLabel}
            hasNext={fcIndex < orderedCards.length - 1}
            onNext={nextFlash}
            onRestart={() => setFcIndex(0)}
            onMarkSeen={onMarkFlashSeen}
          />
        ) : (
          <p className="text-sm text-slate-600">Δεν βρέθηκαν κάρτες.</p>
        )}
      </SectionCard>

      <SectionCard title="Μίνι κουίζ">
        <div className="space-y-4">
          {lessonQuizItems.map((q) => (
            <LessonQuizItem key={q.id} q={q} />
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Ερωτήσεις ανάπτυξης">
        <div className="space-y-4">
          {pavlovExamQuestions.map((ex, i) => {
            const open = !!openExamIdx[i]
            return (
              <div key={ex.id} className="rounded-xl border border-slate-200 dark:border-slate-600 p-4 space-y-2">
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{ex.question}</p>
                <button
                  type="button"
                  onClick={() => setOpenExamIdx((prev) => ({ ...prev, [i]: !prev[i] }))}
                  className="touch-manipulation rounded-lg bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 px-4 py-2 text-sm min-h-[44px]"
                >
                  {open ? 'Απόκρυψη απάντησης' : 'Ιδανική απάντηση'}
                </button>
                {open && <p className="text-sm text-slate-700 dark:text-slate-200 whitespace-pre-line leading-relaxed border-t border-slate-100 dark:border-slate-800 pt-3">{ex.idealAnswer.trim()}</p>}
              </div>
            )
          })}
        </div>
      </SectionCard>

      <SectionCard title="Έλεγχος προόδου">
        <ul className="space-y-3">
          {L.progressChecklist.map((label, i) => (
            <li key={label}>
              <label className="flex items-start gap-3 cursor-pointer touch-manipulation">
                <input
                  type="checkbox"
                  checked={!!checklist[i]}
                  onChange={() => toggleCheck(i)}
                  className="mt-1 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                />
                <span className={`text-sm ${checklist[i] ? 'text-slate-500 line-through' : 'text-slate-800 dark:text-slate-100'}`}>{label}</span>
              </label>
            </li>
          ))}
        </ul>
      </SectionCard>
    </div>
  )
}
