import { useCallback, useEffect, useMemo, useState } from 'react'
import Flashcard from './Flashcard.jsx'
import SectionCard from './SectionCard.jsx'
import MemoryHack from './MemoryHack.jsx'
import {
  otherBranchesLesson,
  otherBranchesExamQuestions,
  otherBranchesLessonQuizIds,
  branchesQuickReview,
} from '../data/week1/otherBranches.js'
import { quizQuestions, getCategoryLabel } from '../data/questions.js'
import { loadOtherBranchesChecklist, saveOtherBranchesChecklist } from '../utils/storage.js'

const FC_ORDER = ['fc-other-branches-1', 'fc-other-branches-2', 'fc-other-branches-3', 'fc-other-branches-4']

const cardCompact = '!p-3 sm:!p-4'

function LessonQuizItem({ q }) {
  const [selected, setSelected] = useState(null)
  const revealed = selected !== null
  const correct = selected === q.correctIndex
  return (
    <div className="rounded-lg border border-slate-200 dark:border-slate-600 p-3 space-y-2">
      <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{q.question}</p>
      <div className="flex flex-col gap-1.5">
        {q.options.map((opt, idx) => (
          <button
            key={idx}
            type="button"
            disabled={revealed}
            onClick={() => setSelected(idx)}
            className={`touch-manipulation w-full text-left rounded-lg border px-3 py-2 text-sm min-h-[44px] transition ${
              !revealed
                ? selected === idx
                  ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/40'
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
        <p className={`text-sm mt-1 p-2 rounded-lg ${correct ? 'bg-emerald-50 dark:bg-emerald-950/25 text-emerald-900 dark:text-emerald-100' : 'bg-amber-50 dark:bg-amber-950/25 text-amber-950 dark:text-amber-100'}`}>
          {q.explanation}
        </p>
      )}
    </div>
  )
}

export default function OtherBranchesLesson({ otherBranchesFlashcards, onMarkFlashSeen }) {
  const L = otherBranchesLesson
  const catLabel = getCategoryLabel('otherBranches')
  const [checklist, setChecklist] = useState(() => loadOtherBranchesChecklist(L.progressChecklist.length))
  const [fcIndex, setFcIndex] = useState(0)
  const [openExamIdx, setOpenExamIdx] = useState({})

  useEffect(() => {
    saveOtherBranchesChecklist(checklist)
  }, [checklist])

  const lessonQuizItems = useMemo(() => {
    const map = new Map(quizQuestions.map((q) => [q.id, q]))
    return otherBranchesLessonQuizIds.map((id) => map.get(id)).filter(Boolean)
  }, [])

  const orderedCards = useMemo(() => {
    const byId = Object.fromEntries(otherBranchesFlashcards.map((c) => [c.id, c]))
    return FC_ORDER.map((id) => byId[id]).filter(Boolean)
  }, [otherBranchesFlashcards])

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
    <div className="space-y-3 animate-[fadeIn_0.35s_ease-out]">
      <div className="text-center py-4 px-3 rounded-xl bg-gradient-to-b from-sky-50 to-stone-50 dark:from-sky-950/25 dark:to-slate-900 border border-sky-100 dark:border-sky-900/80">
        <p className="text-[10px] font-semibold text-sky-900 dark:text-sky-300 uppercase tracking-widest">Μάθημα · συμπαγές</p>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-50 mt-1.5 text-balance leading-snug">{L.title}</h1>
      </div>

      <SectionCard title="Διάλεξη (PPT)" className={cardCompact}>
        <p className="text-sm text-slate-800 dark:text-slate-100 whitespace-pre-line leading-relaxed font-medium">{L.pptSlide}</p>
      </SectionCard>

      <SectionCard title={L.culturalPsychologyTitle} className={cardCompact}>
        <p className="text-sm text-slate-800 dark:text-slate-100 leading-relaxed">{L.culturalPsychology}</p>
      </SectionCard>

      <SectionCard title={L.biologicalPsychologyTitle} className={cardCompact}>
        <p className="text-sm text-slate-800 dark:text-slate-100 leading-relaxed">{L.biologicalPsychology}</p>
      </SectionCard>

      <SectionCard title={L.developmentalPsychologyTitle} className={cardCompact}>
        <p className="text-sm text-slate-800 dark:text-slate-100 leading-relaxed">{L.developmentalPsychology}</p>
      </SectionCard>

      <SectionCard title="SOS — γρήγορος πίνακας (PPT)" className={cardCompact}>
        <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">Κλάδος και εστίαση όπως στη διαφάνεια.</p>
        <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-600">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/80">
                <th className="px-3 py-2 font-semibold text-slate-800 dark:text-slate-100">Κλάδος</th>
                <th className="px-3 py-2 font-semibold text-slate-800 dark:text-slate-100">Εστίαση</th>
              </tr>
            </thead>
            <tbody>
              {branchesQuickReview.map((row) => (
                <tr key={row.branch} className="border-b border-slate-100 dark:border-slate-700/80 last:border-0">
                  <td className="px-3 py-2 text-slate-800 dark:text-slate-100 align-top">{row.branch}</td>
                  <td className="px-3 py-2 text-slate-600 dark:text-slate-300 align-top">{row.focus}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      <SectionCard title="Κύρια σημεία" className={cardCompact}>
        <ul className="list-disc list-inside text-sm text-slate-800 dark:text-slate-100 space-y-1">
          {L.keyPoints.map((k) => (
            <li key={k}>{k}</li>
          ))}
        </ul>
      </SectionCard>

      <SectionCard title="Παγίδα εξέτασης" className={cardCompact}>
        <p className="text-xs font-bold text-sky-900 dark:text-sky-200 mb-1.5">{L.examTrapIntro}</p>
        <p className="text-sm text-slate-800 dark:text-slate-100 leading-relaxed">{L.examTrapBody}</p>
      </SectionCard>

      <SectionCard title="Μνημονικό" className={cardCompact}>
        <MemoryHack lines={L.memoryHackLines} title="Γρήγορη σύνδεση" />
      </SectionCard>

      <SectionCard title="Κάρτες μνήμης" className={cardCompact}>
        {currentFc ? (
          <Flashcard
            card={currentFc}
            categoryLabel={catLabel}
            hasNext={fcIndex < orderedCards.length - 1}
            onNext={nextFlash}
            onRestart={() => setFcIndex(0)}
            onMarkSeen={onMarkFlashSeen}
          />
        ) : (
          <p className="text-sm text-slate-600">Δεν βρέθηκαν κάρτες.</p>
        )}
      </SectionCard>

      <SectionCard title="Μίνι κουίζ" className={cardCompact}>
        <div className="space-y-3">
          {lessonQuizItems.map((q) => (
            <LessonQuizItem key={q.id} q={q} />
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Ερωτήσεις ανάπτυξης" className={cardCompact}>
        {otherBranchesExamQuestions.map((ex, i) => {
          const open = !!openExamIdx[i]
          return (
            <div key={ex.id} className="rounded-lg border border-slate-200 dark:border-slate-600 p-3 space-y-2">
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{ex.question}</p>
              <button
                type="button"
                onClick={() => setOpenExamIdx((prev) => ({ ...prev, [i]: !prev[i] }))}
                className="touch-manipulation rounded-lg bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 px-3 py-2 text-sm min-h-[44px]"
              >
                {open ? 'Απόκρυψη απάντησης' : 'Ιδανική απάντηση'}
              </button>
              {open && <p className="text-sm text-slate-700 dark:text-slate-200 whitespace-pre-line leading-relaxed border-t border-slate-100 dark:border-slate-800 pt-2">{ex.idealAnswer.trim()}</p>}
            </div>
          )
        })}
      </SectionCard>

      <SectionCard title="Έλεγχος προόδου" className={cardCompact}>
        <ul className="space-y-2">
          {L.progressChecklist.map((label, i) => (
            <li key={label}>
              <label className="flex items-start gap-2 cursor-pointer touch-manipulation">
                <input
                  type="checkbox"
                  checked={!!checklist[i]}
                  onChange={() => toggleCheck(i)}
                  className="mt-1 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
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
