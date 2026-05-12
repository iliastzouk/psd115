import { useCallback, useEffect, useMemo, useState } from 'react'
import Flashcard from './Flashcard.jsx'
import SectionCard from './SectionCard.jsx'
import MemoryHack from './MemoryHack.jsx'
import { littleAlbertLesson, littleAlbertExamQuestions, littleAlbertLessonQuizIds } from '../data/week1/littleAlbert.js'
import { quizQuestions, getCategoryLabel } from '../data/questions.js'
import { loadLittleAlbertChecklist, saveLittleAlbertChecklist } from '../utils/storage.js'

const FC_ORDER = ['fc-albert-1', 'fc-albert-2', 'fc-albert-3']

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
                  ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/40'
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

export default function LittleAlbertLesson({ littleAlbertFlashcards, onMarkFlashSeen }) {
  const L = littleAlbertLesson
  const catLabel = getCategoryLabel('littleAlbert')
  const [checklist, setChecklist] = useState(() => loadLittleAlbertChecklist(L.progressChecklist.length))
  const [fcIndex, setFcIndex] = useState(0)
  const [openExamIdx, setOpenExamIdx] = useState({})

  useEffect(() => {
    saveLittleAlbertChecklist(checklist)
  }, [checklist])

  const lessonQuizItems = useMemo(() => {
    const map = new Map(quizQuestions.map((q) => [q.id, q]))
    return littleAlbertLessonQuizIds.map((id) => map.get(id)).filter(Boolean)
  }, [])

  const orderedCards = useMemo(() => {
    const byId = Object.fromEntries(littleAlbertFlashcards.map((c) => [c.id, c]))
    return FC_ORDER.map((id) => byId[id]).filter(Boolean)
  }, [littleAlbertFlashcards])

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
      <div className="text-center py-6 px-4 rounded-2xl bg-gradient-to-b from-rose-50 to-stone-50 dark:from-rose-950/30 dark:to-slate-900 border border-rose-100 dark:border-rose-900">
        <p className="text-xs font-semibold text-rose-800 dark:text-rose-300 uppercase tracking-widest">Ενότητα · SOS</p>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-50 mt-2 text-balance">{L.title}</h1>
      </div>

      <SectionCard title="Διάλεξη (PPT)">
        <p className="text-sm text-slate-800 dark:text-slate-100 whitespace-pre-line leading-relaxed font-medium">{L.pptSlide}</p>
        <figure className="mt-4 space-y-2">
          <img
            src={L.pptDiagramSrc}
            alt="Little Albert 1920: τέσσερα καρέ — αρουραίος πριν τη μάθηση, γενίκευση, αντίδραση φόβου"
            className="w-full rounded-xl border border-rose-200 dark:border-rose-800 bg-white dark:bg-slate-900/50"
            loading="lazy"
          />
          <figcaption className="text-xs text-slate-500 dark:text-slate-400">{L.pptDiagramCaption}</figcaption>
        </figure>
      </SectionCard>

      <SectionCard title="Θεωρία">
        <p className="text-sm text-slate-800 dark:text-slate-100 whitespace-pre-line leading-relaxed">{L.theory}</p>
      </SectionCard>

      <SectionCard title={L.experimentFlowTitle}>
        <ol className="list-decimal list-inside text-sm text-slate-800 dark:text-slate-100 space-y-2">
          {L.experimentFlow.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </SectionCard>

      <SectionCard title="Κύρια σημεία">
        <ul className="list-disc list-inside text-sm text-slate-800 dark:text-slate-100 space-y-1">
          {L.keyPoints.map((k) => (
            <li key={k}>{k}</li>
          ))}
        </ul>
      </SectionCard>

      <SectionCard title="Παγίδα εξέτασης">
        <p className="text-xs font-bold text-rose-800 dark:text-rose-200 mb-2">{L.examTrapIntro}</p>
        <p className="text-sm text-slate-800 dark:text-slate-100 whitespace-pre-line">{L.examTrapBody}</p>
      </SectionCard>

      <SectionCard title="Μνημονικό">
        <MemoryHack lines={L.memoryHackLines} title="Γρήγορη σύνδεση" />
      </SectionCard>

      <SectionCard title="Κάρτες μνήμης">
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

      <SectionCard title="Μίνι κουίζ">
        <div className="space-y-4">
          {lessonQuizItems.map((q) => (
            <LessonQuizItem key={q.id} q={q} />
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Ερώτηση ανάπτυξης">
        {littleAlbertExamQuestions.map((ex, i) => {
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
                  className="mt-1 rounded border-slate-300 text-rose-600 focus:ring-rose-500"
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
