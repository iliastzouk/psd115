import { useCallback, useEffect, useMemo, useState } from 'react'
import Flashcard from './Flashcard.jsx'
import SectionCard from './SectionCard.jsx'
import MemoryHack from './MemoryHack.jsx'
import { skinnerLesson, skinnerExamQuestions, skinnerLessonQuizIds } from '../data/week1/skinner.js'
import { quizQuestions, getCategoryLabel } from '../data/questions.js'
import { loadSkinnerChecklist, saveSkinnerChecklist } from '../utils/storage.js'

const FC_ORDER = ['fc-skinner-1', 'fc-skinner-2', 'fc-skinner-3', 'fc-skinner-4', 'fc-skinner-5']

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
                  ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40'
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

export default function SkinnerLesson({ skinnerFlashcards, onMarkFlashSeen }) {
  const L = skinnerLesson
  const catLabel = getCategoryLabel('skinner')
  const [checklist, setChecklist] = useState(() => loadSkinnerChecklist(L.progressChecklist.length))
  const [fcIndex, setFcIndex] = useState(0)
  const [openExamIdx, setOpenExamIdx] = useState({})

  useEffect(() => {
    saveSkinnerChecklist(checklist)
  }, [checklist])

  const lessonQuizItems = useMemo(() => {
    const map = new Map(quizQuestions.map((q) => [q.id, q]))
    return skinnerLessonQuizIds.map((id) => map.get(id)).filter(Boolean)
  }, [])

  const orderedCards = useMemo(() => {
    const byId = Object.fromEntries(skinnerFlashcards.map((c) => [c.id, c]))
    return FC_ORDER.map((id) => byId[id]).filter(Boolean)
  }, [skinnerFlashcards])

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
      <div className="text-center py-4 px-3 rounded-xl bg-gradient-to-b from-emerald-50 to-stone-50 dark:from-emerald-950/25 dark:to-slate-900 border border-emerald-100 dark:border-emerald-900/80">
        <p className="text-[10px] font-semibold text-emerald-900 dark:text-emerald-300 uppercase tracking-widest">Μάθημα · συμπαγές</p>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-50 mt-1.5 text-balance leading-snug">{L.title}</h1>
      </div>

      <SectionCard title="Διάλεξη (PPT)" className={cardCompact}>
        <p className="text-sm text-slate-800 dark:text-slate-100 whitespace-pre-line leading-relaxed font-medium">{L.pptSlide}</p>
      </SectionCard>

      <SectionCard title="Θεωρία" className={cardCompact}>
        <p className="text-sm text-slate-800 dark:text-slate-100 leading-relaxed">{L.theory}</p>
      </SectionCard>

      <SectionCard title={L.operantConditioningTitle} className={cardCompact}>
        <p className="text-sm text-slate-800 dark:text-slate-100 leading-relaxed">{L.operantConditioning}</p>
      </SectionCard>

      <SectionCard title={L.reinforcerTitle} className={cardCompact}>
        <p className="text-sm text-slate-800 dark:text-slate-100 leading-relaxed">{L.reinforcer}</p>
      </SectionCard>

      <SectionCard title={L.punisherTitle} className={cardCompact}>
        <p className="text-sm text-slate-800 dark:text-slate-100 leading-relaxed">{L.punisher}</p>
      </SectionCard>

      <SectionCard title={L.freeWillTitle} className={cardCompact}>
        <p className="text-sm text-slate-800 dark:text-slate-100 leading-relaxed">{L.freeWill}</p>
        <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed mt-2 border-t border-slate-100 dark:border-slate-800 pt-2">{L.additionalPoint}</p>
      </SectionCard>

      <SectionCard title="Κύρια σημεία" className={cardCompact}>
        <ul className="list-disc list-inside text-sm text-slate-800 dark:text-slate-100 space-y-1">
          {L.keyPoints.map((k) => (
            <li key={k}>{k}</li>
          ))}
        </ul>
      </SectionCard>

      <SectionCard title="Παγίδα εξέτασης" className={cardCompact}>
        <p className="text-xs font-bold text-emerald-900 dark:text-emerald-200 mb-1.5">{L.examTrapIntro}</p>
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
        {skinnerExamQuestions.map((ex, i) => {
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
                  className="mt-1 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
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
