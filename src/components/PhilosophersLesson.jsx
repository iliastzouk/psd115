import { useCallback, useMemo, useState } from 'react'
import Flashcard from './Flashcard.jsx'
import SectionCard from './SectionCard.jsx'
import MemoryHack from './MemoryHack.jsx'
import {
  philosophers,
  philosopherLessonQuizIds,
} from '../data/week1/philosophers.js'
import { quizQuestions } from '../data/questions.js'

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

export default function PhilosophersLesson({ philosopherFlashcards, onMarkFlashSeen }) {
  const P = philosophers
  const [fcIndex, setFcIndex] = useState(0)

  const lessonQuizItems = useMemo(() => {
    const map = new Map(quizQuestions.map((q) => [q.id, q]))
    return philosopherLessonQuizIds.map((id) => map.get(id)).filter(Boolean)
  }, [])

  const orderedCards = useMemo(() => {
    const order = ['fc-philo-1', 'fc-philo-2', 'fc-philo-3', 'fc-philo-4', 'fc-philo-5']
    const byId = Object.fromEntries(philosopherFlashcards.map((c) => [c.id, c]))
    return order.map((id) => byId[id]).filter(Boolean)
  }, [philosopherFlashcards])

  const currentFc = orderedCards[fcIndex] ?? orderedCards[0]

  const nextFlash = useCallback(() => {
    if (fcIndex < orderedCards.length - 1) setFcIndex((i) => i + 1)
    else setFcIndex(0)
  }, [fcIndex, orderedCards.length])

  const restartFlash = useCallback(() => setFcIndex(0), [])

  return (
    <div className="space-y-5 animate-[fadeIn_0.4s_ease-out]">
      <div className="text-center py-6 px-4 rounded-2xl bg-gradient-to-b from-indigo-50 to-stone-50 dark:from-indigo-950/40 dark:to-slate-900 border border-indigo-100 dark:border-indigo-900">
        <p className="text-xs font-semibold text-indigo-700 dark:text-indigo-300 uppercase tracking-widest">Μάθημα</p>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-50 mt-2 text-balance">{P.title}</h1>
      </div>

      <SectionCard title="Εισαγωγή">
        <p className="text-sm text-slate-700 dark:text-slate-200 whitespace-pre-line leading-relaxed">{P.intro.trim()}</p>
      </SectionCard>

      {P.sections.map((sec) => (
        <SectionCard key={sec.name} title={`${sec.name} (${sec.years})`}>
          <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-300 mb-2">{sec.theory}</p>
          <p className="text-sm text-slate-800 dark:text-slate-100 whitespace-pre-line leading-relaxed">{sec.content.trim()}</p>
          <ul className="mt-3 list-disc list-inside text-sm text-slate-700 dark:text-slate-200 space-y-1">
            {sec.keyPoints.map((k) => (
              <li key={k}>{k}</li>
            ))}
          </ul>
          <div className="mt-4">
            <MemoryHack lines={sec.memoryHack} title="Μνημονικό" />
          </div>
        </SectionCard>
      ))}

      <SectionCard title="Σύγκριση (γρήγορη επισκόπηση)">
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse min-w-[260px]">
            <thead>
              <tr>
                <th className="border border-slate-200 dark:border-slate-600 bg-slate-100 dark:bg-slate-800 px-3 py-2 text-left">
                  Φιλόσοφος
                </th>
                <th className="border border-slate-200 dark:border-slate-600 bg-slate-100 dark:bg-slate-800 px-3 py-2 text-left">
                  Θέση
                </th>
              </tr>
            </thead>
            <tbody>
              {P.comparisonTable.map((row) => (
                <tr key={row.philosopher}>
                  <td className="border border-slate-200 dark:border-slate-600 px-3 py-2 font-medium">{row.philosopher}</td>
                  <td className="border border-slate-200 dark:border-slate-600 px-3 py-2">{row.belief}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      <SectionCard title="Κάρτες μνήμης">
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">Active recall — πάτα την κάρτα για την απάντηση.</p>
        {currentFc ? (
          <Flashcard
            card={currentFc}
            categoryLabel="Ιστορία / Φιλόσοφοι"
            hasNext={fcIndex < orderedCards.length - 1}
            onNext={nextFlash}
            onRestart={restartFlash}
            onMarkSeen={onMarkFlashSeen}
          />
        ) : (
          <p className="text-sm text-slate-600">Δεν βρέθηκαν κάρτες.</p>
        )}
      </SectionCard>

      <SectionCard title="Γρήγορο κουίζ">
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
          Οι ίδιες ερωτήσεις ενσωματώνονται στο κεντρικό κουίζ με φίλτρο «Ιστορία».
        </p>
        <div className="space-y-4">
          {lessonQuizItems.map((q) => (
            <LessonQuizItem key={q.id} q={q} />
          ))}
        </div>
      </SectionCard>
    </div>
  )
}
