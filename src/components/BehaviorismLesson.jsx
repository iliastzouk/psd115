import { useCallback, useEffect, useMemo, useState } from 'react'
import Flashcard from './Flashcard.jsx'
import SectionCard from './SectionCard.jsx'
import MemoryHack from './MemoryHack.jsx'
import {
  behaviorismLesson,
  behaviorismTraps,
  behaviorismExamQuestions,
  behaviorismLessonQuizIds,
} from '../data/week1/behaviorism.js'
import { quizQuestions } from '../data/questions.js'
import { loadBehaviorismChecklist, saveBehaviorismChecklist } from '../utils/storage.js'

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
            cls += selected === idx ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/40' : 'border-slate-200 dark:border-slate-600'
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

export default function BehaviorismLesson({ behaviorismFlashcards, onMarkFlashSeen }) {
  const L = behaviorismLesson
  const [checklist, setChecklist] = useState(() => loadBehaviorismChecklist(L.progressChecklist.length))
  const [fcIndex, setFcIndex] = useState(0)
  const [openExamIdx, setOpenExamIdx] = useState({})

  useEffect(() => {
    saveBehaviorismChecklist(checklist)
  }, [checklist])

  const lessonQuizItems = useMemo(() => {
    const map = new Map(quizQuestions.map((q) => [q.id, q]))
    return behaviorismLessonQuizIds.map((id) => map.get(id)).filter(Boolean)
  }, [])

  const orderedCards = useMemo(() => {
    const order = ['fc-behave-1', 'fc-behave-2', 'fc-behave-3', 'fc-behave-4', 'fc-behave-5']
    const byId = Object.fromEntries(behaviorismFlashcards.map((c) => [c.id, c]))
    return order.map((id) => byId[id]).filter(Boolean)
  }, [behaviorismFlashcards])

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
      <div className="text-center py-6 px-4 rounded-2xl bg-gradient-to-b from-amber-50 to-stone-50 dark:from-amber-950/35 dark:to-slate-900 border border-amber-100 dark:border-amber-900">
        <p className="text-xs font-semibold text-amber-800 dark:text-amber-300 uppercase tracking-widest">Μάθημα · SOS</p>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-50 mt-2 text-balance">{L.title}</h1>
      </div>

      <SectionCard title="Εισαγωγή">
        <p className="text-sm text-slate-700 dark:text-slate-200 whitespace-pre-line leading-relaxed">{L.intro}</p>
      </SectionCard>

      <SectionCard title="Διάλεξη (K1 · PPT)">
        <p className="text-sm text-slate-800 dark:text-slate-100 whitespace-pre-line leading-relaxed font-medium">{L.pptSlide}</p>
      </SectionCard>

      <SectionCard title="Θεωρία">
        <p className="text-sm text-slate-800 dark:text-slate-100 whitespace-pre-line leading-relaxed">{L.theory}</p>
      </SectionCard>

      <SectionCard title="Παρατηρήσιμη συμπεριφορά vs εσωτερικές διεργασίες">
        <p className="text-sm text-slate-700 dark:text-slate-200 whitespace-pre-line leading-relaxed">{L.observableBehavior}</p>
      </SectionCard>

      <SectionCard title={L.stimulusResponseTitle}>
        <p className="text-sm text-slate-800 dark:text-slate-100 whitespace-pre-line leading-relaxed">{L.stimulusResponse}</p>
      </SectionCard>

      <SectionCard title={L.representativesTitle}>
        <ul className="list-disc list-inside text-sm text-slate-800 dark:text-slate-100 space-y-1">
          {L.representatives.map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ul>
      </SectionCard>

      <SectionCard title="Κύρια σημεία">
        <ul className="list-disc list-inside text-sm text-slate-800 dark:text-slate-100 space-y-1">
          {L.keyPoints.map((k) => (
            <li key={k}>{k}</li>
          ))}
        </ul>
      </SectionCard>

      <SectionCard title="Σύγκριση (εξετάσεις)">
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse min-w-[260px]">
            <thead>
              <tr>
                <th className="border border-slate-200 dark:border-slate-600 bg-slate-100 dark:bg-slate-800 px-3 py-2 text-left">
                  Προσέγγιση
                </th>
                <th className="border border-slate-200 dark:border-slate-600 bg-slate-100 dark:bg-slate-800 px-3 py-2 text-left">
                  Εστίαση
                </th>
              </tr>
            </thead>
            <tbody>
              {L.comparison.map((row) => (
                <tr key={row.approach}>
                  <td className="border border-slate-200 dark:border-slate-600 px-3 py-2 font-medium">{row.approach}</td>
                  <td className="border border-slate-200 dark:border-slate-600 px-3 py-2">{row.focus}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      <SectionCard title="Παγίδα εξέτασης">
        <p className="text-xs font-bold text-amber-800 dark:text-amber-200 mb-2">{L.examTrapIntro}</p>
        <p className="text-sm text-slate-800 dark:text-slate-100 mb-4">{L.examTrapBody}</p>
        <div className="space-y-3">
          {behaviorismTraps.map((t, i) => (
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
            categoryLabel="Συμπεριφορισμός"
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
          Οι ίδιες ερωτήσεις μπαίνουν στο κεντρικό κουίζ με φίλτρο «Συμπεριφορισμός».
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
          {behaviorismExamQuestions.map((ex, i) => {
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
                  className="mt-1 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
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
