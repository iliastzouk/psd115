import { useMemo, useState } from 'react'
import Flashcard from './Flashcard.jsx'
import SectionCard from './SectionCard.jsx'
import MemoryHack from './MemoryHack.jsx'
import { clinicalLesson, clinicalExamQuestions, clinicalLessonQuizIds } from '../data/week1/clinicalPsychology.js'
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

export default function ClinicalPsychologyLesson({ clinicalFlashcards, onMarkFlashSeen }) {
  const L = clinicalLesson
  const [fcIndex, setFcIndex] = useState(0)
  const [openExam, setOpenExam] = useState(false)

  const lessonQuizItems = useMemo(() => {
    const map = new Map(quizQuestions.map((q) => [q.id, q]))
    return clinicalLessonQuizIds.map((id) => map.get(id)).filter(Boolean)
  }, [])

  const orderedCards = useMemo(() => {
    const order = ['fc-clinical-1', 'fc-clinical-2', 'fc-clinical-3']
    const byId = Object.fromEntries(clinicalFlashcards.map((c) => [c.id, c]))
    return order.map((id) => byId[id]).filter(Boolean)
  }, [clinicalFlashcards])

  const currentFc = orderedCards[fcIndex] ?? orderedCards[0]
  const ex = clinicalExamQuestions[0]

  return (
    <div className="space-y-5 animate-[fadeIn_0.4s_ease-out]">
      <div className="text-center py-5 px-4 rounded-2xl bg-gradient-to-b from-teal-50 to-stone-50 dark:from-teal-950/35 dark:to-slate-900 border border-teal-100 dark:border-teal-900">
        <p className="text-xs font-semibold text-teal-700 dark:text-teal-300 uppercase tracking-widest">Γέφυρα · διάλεξη</p>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-50 mt-2 text-balance">{L.title}</h1>
        <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 max-w-md mx-auto">{L.bridgeNote}</p>
      </div>

      <SectionCard title="Διάλεξη & διαφάνειες — συμπεριφορά & αντιμετώπιση">
        <p className="text-sm text-slate-800 dark:text-slate-100 font-medium leading-relaxed">{L.pptBehavior}</p>
      </SectionCard>

      <SectionCard title="Διάλεξη & διαφάνειες — προσωπικότητα">
        <p className="text-sm text-slate-800 dark:text-slate-100 font-medium leading-relaxed">{L.pptPersonality}</p>
      </SectionCard>

      <SectionCard title="Συμπλήρωση (κλάδος)">
        <p className="text-sm text-slate-700 dark:text-slate-200 whitespace-pre-line leading-relaxed">{L.intro}</p>
      </SectionCard>

      <SectionCard title="Εστίαση">
        <p className="text-sm text-slate-700 dark:text-slate-200 whitespace-pre-line leading-relaxed">{L.focus}</p>
      </SectionCard>

      <SectionCard title="Στόχοι">
        <ul className="list-disc list-inside text-sm text-slate-800 dark:text-slate-100 space-y-1">
          {L.goals.map((g) => (
            <li key={g}>{g}</li>
          ))}
        </ul>
      </SectionCard>

      <SectionCard title="Σύνδεση με Freud">
        <p className="text-sm text-slate-700 dark:text-slate-200 whitespace-pre-line leading-relaxed">{L.connectionToFreud}</p>
      </SectionCard>

      <SectionCard title="Κύρια σημεία">
        <ul className="list-disc list-inside text-sm text-slate-800 dark:text-slate-100 space-y-1">
          {L.keyPoints.map((k) => (
            <li key={k}>{k}</li>
          ))}
        </ul>
      </SectionCard>

      <SectionCard title="Παγίδα εξέτασης">
        <p className="text-xs font-bold text-amber-800 dark:text-amber-200 mb-2">{L.examTrapIntro}</p>
        <p className="text-sm text-slate-800 dark:text-slate-100">{L.examTrapBody}</p>
      </SectionCard>

      <SectionCard title="Μνημονικό">
        <MemoryHack lines={L.memoryHackLines} title="Γρήγορη σύνδεση" />
      </SectionCard>

      <SectionCard title="Κάρτες μνήμης">
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">Active recall</p>
        {currentFc ? (
          <Flashcard
            card={currentFc}
            categoryLabel="Κλινική Ψυχολογία"
            hasNext={fcIndex < orderedCards.length - 1}
            onNext={() => (fcIndex < orderedCards.length - 1 ? setFcIndex((i) => i + 1) : setFcIndex(0))}
            onRestart={() => setFcIndex(0)}
            onMarkSeen={onMarkFlashSeen}
          />
        ) : (
          <p className="text-sm text-slate-600">Δεν βρέθηκαν κάρτες.</p>
        )}
      </SectionCard>

      <SectionCard title="Μίνι κουίζ (Σ/Λ)">
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
          Οι ίδιες ερωτήσεις μπαίνουν στο κεντρικό κουίζ με φίλτρο «Κλινική Ψυχολογία».
        </p>
        <div className="space-y-4">
          {lessonQuizItems.map((q) => (
            <LessonQuizItem key={q.id} q={q} />
          ))}
        </div>
      </SectionCard>

      {ex && (
        <SectionCard title="Ερώτηση ανάπτυξης">
          <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{ex.question}</p>
          <button
            type="button"
            onClick={() => setOpenExam((o) => !o)}
            className="touch-manipulation mt-3 rounded-lg bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 px-4 py-2 text-sm min-h-[44px]"
          >
            {openExam ? 'Απόκρυψη απάντησης' : 'Ιδανική απάντηση'}
          </button>
          {openExam && (
            <p className="text-sm text-slate-700 dark:text-slate-200 whitespace-pre-line leading-relaxed border-t border-slate-100 dark:border-slate-800 pt-3 mt-3">
              {ex.idealAnswer.trim()}
            </p>
          )}
        </SectionCard>
      )}
    </div>
  )
}
