import { useCallback, useEffect, useMemo, useState } from 'react'
import Flashcard from './Flashcard.jsx'
import SectionCard from './SectionCard.jsx'
import MemoryHack from './MemoryHack.jsx'
import {
  psychoanalysisLesson,
  psychoanalysisTraps,
  psychoanalysisExamQuestions,
  psychoanalysisLessonQuizIds,
} from '../data/week1/psychoanalysis.js'
import { quizQuestions } from '../data/questions.js'
import { loadPsychoanalysisChecklist, savePsychoanalysisChecklist } from '../utils/storage.js'

function LessonQuizItem({ q }) {
  const [selected, setSelected] = useState(null)
  const revealed = selected !== null
  const correct = selected === q.correctIndex

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-600 p-4 space-y-2">
      <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{q.question}</p>
      <div className="flex flex-col gap-2">
        {q.options.map((opt, idx) => {
          let cls =
            'touch-manipulation w-full text-left rounded-lg border px-3 py-2.5 text-sm min-h-[48px] transition '
          if (!revealed) {
            cls += selected === idx ? 'border-teal-500 bg-teal-50 dark:bg-teal-950/40' : 'border-slate-200 dark:border-slate-600'
          } else {
            if (idx === q.correctIndex) cls += 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30'
            else if (idx === selected) cls += 'border-rose-400 bg-rose-50 dark:bg-rose-950/30'
            else cls += 'border-slate-200 dark:border-slate-700 opacity-50'
          }
          return (
            <button key={idx} type="button" disabled={revealed} className={cls} onClick={() => setSelected(idx)}>
              {opt}
            </button>
          )
        })}
      </div>
      {revealed && (
        <p
          className={`text-sm mt-2 p-3 rounded-lg ${correct ? 'bg-emerald-50 dark:bg-emerald-950/25 text-emerald-900 dark:text-emerald-100' : 'bg-amber-50 dark:bg-amber-950/25 text-amber-950 dark:text-amber-100'}`}
        >
          {q.explanation}
        </p>
      )}
    </div>
  )
}

export default function PsychoanalysisLesson({ psychoanalysisFlashcards, onMarkFlashSeen }) {
  const L = psychoanalysisLesson
  const [checklist, setChecklist] = useState(() => loadPsychoanalysisChecklist(L.progressChecklist.length))
  const [fcIndex, setFcIndex] = useState(0)
  const [openExamIdx, setOpenExamIdx] = useState({})

  useEffect(() => {
    savePsychoanalysisChecklist(checklist)
  }, [checklist])

  const lessonQuizItems = useMemo(() => {
    const map = new Map(quizQuestions.map((q) => [q.id, q]))
    return psychoanalysisLessonQuizIds.map((id) => map.get(id)).filter(Boolean)
  }, [])

  const orderedCards = useMemo(() => {
    const order = ['fc-freud-1', 'fc-freud-2', 'fc-freud-3', 'fc-freud-4', 'fc-freud-5', 'fc-freud-6', 'fc-freud-7']
    const byId = Object.fromEntries(psychoanalysisFlashcards.map((c) => [c.id, c]))
    return order.map((id) => byId[id]).filter(Boolean)
  }, [psychoanalysisFlashcards])

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

  const restartFlash = useCallback(() => setFcIndex(0), [])

  return (
    <div className="space-y-5 animate-[fadeIn_0.4s_ease-out]">
      <div className="text-center py-6 px-4 rounded-2xl bg-gradient-to-b from-indigo-50 to-stone-50 dark:from-indigo-950/40 dark:to-slate-900 border border-indigo-100 dark:border-indigo-900">
        <p className="text-xs font-semibold text-indigo-700 dark:text-indigo-300 uppercase tracking-widest">Ενότητα · SOS</p>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-50 mt-2 text-balance">{L.title}</h1>
      </div>

      <SectionCard title="Εισαγωγή">
        <p className="text-sm text-slate-700 dark:text-slate-200 whitespace-pre-line leading-relaxed">{L.intro}</p>
      </SectionCard>

      <SectionCard title="Τραυματικές εμπειρίες & απώθηση">
        <p className="text-sm text-slate-700 dark:text-slate-200 whitespace-pre-line leading-relaxed">{L.traumaticExperiences}</p>
      </SectionCard>

      <SectionCard title="Ασυνείδητες συγκρούσεις">
        <p className="text-sm text-slate-700 dark:text-slate-200 whitespace-pre-line leading-relaxed">{L.unconsciousConflicts}</p>
      </SectionCard>

      <SectionCard title={L.psychoanalyticTheoryTitle}>
        <p className="text-sm text-slate-800 dark:text-slate-100 whitespace-pre-line leading-relaxed">{L.psychoanalyticTheory}</p>
      </SectionCard>

      <SectionCard title={L.psychoanalysisTitle}>
        <p className="text-sm text-slate-800 dark:text-slate-100 whitespace-pre-line leading-relaxed">{L.psychoanalysis}</p>
      </SectionCard>

      <SectionCard title="Θεραπεία">
        <p className="text-sm text-slate-700 dark:text-slate-200 whitespace-pre-line leading-relaxed">{L.therapy}</p>
      </SectionCard>

      <SectionCard title="Κύρια σημεία">
        <ul className="list-disc list-inside text-sm text-slate-800 dark:text-slate-100 space-y-1">
          {L.keyPoints.map((k) => (
            <li key={k}>{k}</li>
          ))}
        </ul>
      </SectionCard>

      <SectionCard title="Βασικοί όροι">
        <ul className="list-disc list-inside text-sm text-slate-800 dark:text-slate-100 space-y-1">
          {L.keyTerms.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      </SectionCard>

      <SectionCard title="Παγίδα εξέτασης">
        <p className="text-xs font-bold text-amber-800 dark:text-amber-200 mb-2">{L.examTrapIntro}</p>
        <p className="text-sm text-slate-800 dark:text-slate-100 mb-4">{L.examTrapBody}</p>
        <div className="space-y-3">
          {psychoanalysisTraps.map((t, i) => (
            <div key={i} className="space-y-2">
              <div className="rounded-lg border border-rose-200 dark:border-rose-900 bg-rose-50/70 dark:bg-rose-950/25 p-3">
                <p className="text-[11px] font-bold text-rose-700 dark:text-rose-300">❌ Λάθος</p>
                <p className="text-sm text-slate-800 dark:text-slate-100">{t.wrong}</p>
              </div>
              <div className="rounded-lg border border-emerald-200 dark:border-emerald-900 bg-emerald-50/70 dark:bg-emerald-950/25 p-3">
                <p className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300">✅ Σωστό</p>
                <p className="text-sm text-slate-800 dark:text-slate-100">{t.correct}</p>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Μνημονικό">
        <MemoryHack lines={L.memoryHackLines} title="Γρήγορη σύνδεση" />
      </SectionCard>

      <SectionCard title="Κάρτες μνήμης">
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">Active recall</p>
        {currentFc ? (
          <Flashcard
            card={currentFc}
            categoryLabel="Ψυχανάλυση (Freud)"
            hasNext={fcIndex < orderedCards.length - 1}
            onNext={nextFlash}
            onRestart={restartFlash}
            onMarkSeen={onMarkFlashSeen}
          />
        ) : (
          <p className="text-sm text-slate-600">Δεν βρέθηκαν κάρτες.</p>
        )}
      </SectionCard>

      <SectionCard title="Μίνι κουίζ (Σ/Λ & πολλαπλής)">
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
          Οι ίδιες ερωτήσεις μπαίνουν στο κεντρικό κουίζ με φίλτρο «Ψυχανάλυση».
        </p>
        <div className="space-y-4">
          {lessonQuizItems.map((q) => (
            <LessonQuizItem key={q.id} q={q} />
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Ερωτήσεις ανάπτυξης (εξετάσεις)">
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
          Δοκίμασε πρώτα μόνος σου· μετά δες την ιδανική απάντηση.
        </p>
        <div className="space-y-4">
          {psychoanalysisExamQuestions.map((ex, i) => {
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
                {open && (
                  <p className="text-sm text-slate-700 dark:text-slate-200 whitespace-pre-line leading-relaxed border-t border-slate-100 dark:border-slate-800 pt-3">
                    {ex.idealAnswer.trim()}
                  </p>
                )}
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
                  className="mt-1 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className={`text-sm ${checklist[i] ? 'text-slate-500 line-through' : 'text-slate-800 dark:text-slate-100'}`}>
                  {label}
                </span>
              </label>
            </li>
          ))}
        </ul>
      </SectionCard>
    </div>
  )
}
