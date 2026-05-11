import { useCallback, useEffect, useMemo, useState } from 'react'
import Flashcard from './Flashcard.jsx'
import { definitionLesson, definitionLessonQuizIds } from '../data/definitionModule.js'
import { quizQuestions } from '../data/questions.js'
import { loadDefinitionChecklist, saveDefinitionChecklist } from '../utils/storage.js'

function SectionCard({ title, children, className = '' }) {
  return (
    <section
      className={`rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 sm:p-5 shadow-sm ${className}`}
    >
      {title && (
        <h2 className="text-sm font-bold text-teal-800 dark:text-teal-200 uppercase tracking-wide mb-3">{title}</h2>
      )}
      {children}
    </section>
  )
}

function ExampleGrid({ items }) {
  return (
    <ul className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-3">
      {items.map((t) => (
        <li
          key={t}
          className="rounded-lg bg-slate-100 dark:bg-slate-800/80 px-3 py-2 text-sm text-center text-slate-800 dark:text-slate-100"
        >
          {t}
        </li>
      ))}
    </ul>
  )
}

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
            <button
              key={idx}
              type="button"
              disabled={revealed}
              className={cls}
              onClick={() => setSelected(idx)}
            >
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

export default function DefinitionLesson({ definitionFlashcards, onMarkFlashSeen }) {
  const L = definitionLesson
  const [checklist, setChecklist] = useState(() => loadDefinitionChecklist(L.progressChecklist.length))
  const [showIdealAnswer, setShowIdealAnswer] = useState(false)
  const [showExamAnswer, setShowExamAnswer] = useState(false)
  const [fcIndex, setFcIndex] = useState(0)

  useEffect(() => {
    saveDefinitionChecklist(checklist)
  }, [checklist])

  const lessonQuizItems = useMemo(() => {
    const map = new Map(quizQuestions.map((q) => [q.id, q]))
    return definitionLessonQuizIds.map((id) => map.get(id)).filter(Boolean)
  }, [])

  const orderedCards = useMemo(() => {
    const order = ['fc-def-1', 'fc-def-2', 'fc-def-3']
    const byId = Object.fromEntries(definitionFlashcards.map((c) => [c.id, c]))
    return order.map((id) => byId[id]).filter(Boolean)
  }, [definitionFlashcards])

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
      {/* Title screen */}
      <div className="text-center py-6 px-4 rounded-2xl bg-gradient-to-b from-teal-50 to-stone-50 dark:from-teal-950/40 dark:to-slate-900 border border-teal-100 dark:border-teal-900">
        <p className="text-xs font-semibold text-teal-700 dark:text-teal-300 uppercase tracking-widest">Μάθημα</p>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-50 mt-2 text-balance">{L.title}</h1>
        <p className="text-slate-600 dark:text-slate-300 mt-2 text-sm sm:text-base">{L.subtitle}</p>
      </div>

      {/* Official definition */}
      <SectionCard title="Επίσημος ορισμός">
        <p className="text-base sm:text-lg leading-relaxed text-slate-800 dark:text-slate-100 text-pretty">
          {L.officialDefinition}
        </p>
      </SectionCard>

      {/* Science */}
      <SectionCard title={L.science.title}>
        <p className="text-sm text-slate-700 dark:text-slate-200">{L.science.intro}</p>
        <ul className="mt-3 list-disc list-inside space-y-1 text-sm text-slate-700 dark:text-slate-200">
          {L.science.bullets.map((b) => (
            <li key={b}>{b}</li>
          ))}
        </ul>
        <p className="mt-4 text-sm font-medium text-slate-800 dark:text-slate-100 border-t border-slate-200 dark:border-slate-600 pt-3">
          {L.science.goal}
        </p>
      </SectionCard>

      {/* Behavior */}
      <SectionCard title={L.behavior.title}>
        <p className="text-sm sm:text-base text-slate-800 dark:text-slate-100 font-medium">{L.behavior.definition}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">Παραδείγματα</p>
        <ExampleGrid items={L.behavior.examples} />
      </SectionCard>

      {/* Mental */}
      <SectionCard title={L.mental.title}>
        <p className="text-sm sm:text-base text-slate-800 dark:text-slate-100 font-medium">{L.mental.definition}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">Παραδείγματα</p>
        <ExampleGrid items={L.mental.examples} />
      </SectionCard>

      {/* Comparison table */}
      <SectionCard title="Σύγκριση">
        <div className="overflow-x-auto -mx-1">
          <table className="w-full text-sm text-left border-collapse min-w-[280px]">
            <thead>
              <tr>
                {L.comparison.headers.map((h) => (
                  <th
                    key={h}
                    className="border border-slate-200 dark:border-slate-600 bg-slate-100 dark:bg-slate-800 px-3 py-2 font-semibold"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {L.comparison.rows.map((row, i) => (
                <tr key={i}>
                  {row.map((cell) => (
                    <td
                      key={cell}
                      className="border border-slate-200 dark:border-slate-600 px-3 py-2 text-slate-800 dark:text-slate-100"
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      {/* Scenario */}
      <SectionCard title={L.scenario.title}>
        <p className="text-sm text-slate-800 dark:text-slate-100 mb-4">{L.scenario.intro}</p>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-bold uppercase text-teal-700 dark:text-teal-300 mb-2">{L.scenario.behaviorTitle}</p>
            <ul className="list-disc list-inside text-sm text-slate-700 dark:text-slate-200 space-y-1">
              {L.scenario.behaviorBullets.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs font-bold uppercase text-indigo-700 dark:text-indigo-300 mb-2">{L.scenario.mentalTitle}</p>
            <ul className="list-disc list-inside text-sm text-slate-700 dark:text-slate-200 space-y-1">
              {L.scenario.mentalBullets.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
          </div>
        </div>
      </SectionCard>

      {/* Exam trap */}
      <SectionCard title={L.examTrap.title}>
        <div className="space-y-3">
          <div className="rounded-xl border-2 border-rose-200 dark:border-rose-900 bg-rose-50/80 dark:bg-rose-950/30 p-4">
            <p className="text-xs font-bold text-rose-700 dark:text-rose-300 mb-1">❌ {L.examTrap.wrongLabel}</p>
            <p className="text-sm text-slate-800 dark:text-slate-100">{L.examTrap.wrong}</p>
          </div>
          <div className="rounded-xl border-2 border-emerald-200 dark:border-emerald-900 bg-emerald-50/80 dark:bg-emerald-950/30 p-4">
            <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300 mb-1">✅ {L.examTrap.rightLabel}</p>
            <p className="text-sm text-slate-800 dark:text-slate-100">{L.examTrap.right}</p>
          </div>
        </div>
      </SectionCard>

      {/* Flashcards */}
      <SectionCard title="Κάρτες μνήμης (active recall)">
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
          Πάτα την κάρτα για να δεις την απάντηση — ενεργή ανάκληση.
        </p>
        {currentFc ? (
          <Flashcard
            card={currentFc}
            categoryLabel="Ορισμός της Ψυχολογίας"
            hasNext={fcIndex < orderedCards.length - 1}
            onNext={nextFlash}
            onRestart={restartFlash}
            onMarkSeen={onMarkFlashSeen}
          />
        ) : (
          <p className="text-sm text-slate-600">Δεν βρέθηκαν κάρτες ορισμού.</p>
        )}
      </SectionCard>

      {/* Inline quiz */}
      <SectionCard title="Γρήγορο κουίζ (Σ/Λ & πολλαπλής)">
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
          Οι ίδιες ερωτήσεις συμπεριλαμβάνονται και στο γενικό κουίζ όταν επιλέγεις την κατηγορία «Ορισμός».
        </p>
        <div className="space-y-4">
          {lessonQuizItems.map((q) => (
            <LessonQuizItem key={q.id} q={q} />
          ))}
        </div>
      </SectionCard>

      {/* Mini exam */}
      <SectionCard title={L.miniExam.title}>
        <p className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-3">{L.miniExam.question}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
          Γράψε την απάντησή σου νοερά ή στο σημειωματάριο· μετά δες την ιδανική διατύπωση.
        </p>
        <button
          type="button"
          onClick={() => setShowIdealAnswer((v) => !v)}
          className="touch-manipulation w-full sm:w-auto rounded-xl bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 px-4 py-3 text-sm font-medium min-h-[48px]"
        >
          {showIdealAnswer ? 'Απόκρυψη ιδανικής απάντησης' : 'Εμφάνιση ιδανικής απάντησης'}
        </button>
        {showIdealAnswer && (
          <div className="mt-4 p-4 rounded-xl bg-teal-50 dark:bg-teal-950/35 border border-teal-200 dark:border-teal-800 text-sm text-slate-800 dark:text-slate-100 leading-relaxed animate-[fadeIn_0.3s_ease-out]">
            {L.miniExam.idealAnswer}
          </div>
        )}
      </SectionCard>

      {/* Memory hack */}
      <SectionCard title={L.memoryHack.title}>
        <div className="text-center py-6 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-dashed border-slate-300 dark:border-slate-600">
          {L.memoryHack.lines.map((line, i) => (
            <p key={i} className={`font-bold text-slate-900 dark:text-white ${i === 0 ? 'text-lg' : 'text-xl'}`}>
              {line}
            </p>
          ))}
        </div>
      </SectionCard>

      {/* Checklist */}
      <SectionCard title="Έλεγχος προόδου">
        <ul className="space-y-3">
          {L.progressChecklist.map((label, i) => (
            <li key={label}>
              <label className="flex items-start gap-3 cursor-pointer touch-manipulation">
                <input
                  type="checkbox"
                  checked={!!checklist[i]}
                  onChange={() => toggleCheck(i)}
                  className="mt-1 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                />
                <span className={`text-sm ${checklist[i] ? 'text-slate-500 line-through' : 'text-slate-800 dark:text-slate-100'}`}>
                  {label}
                </span>
              </label>
            </li>
          ))}
        </ul>
      </SectionCard>

      {/* Exam-level answer */}
      <SectionCard title={L.examLevelAnswer.title}>
        <button
          type="button"
          onClick={() => setShowExamAnswer((v) => !v)}
          className="touch-manipulation w-full rounded-xl border border-teal-300 dark:border-teal-700 text-teal-800 dark:text-teal-200 py-3 text-sm font-medium min-h-[48px] mb-3"
        >
          {showExamAnswer ? 'Απόκρυψη κειμένου' : 'Εμφάνιση έτοιμης απάντησης (ανάπτυξη)'}
        </button>
        {showExamAnswer && (
          <p className="text-sm sm:text-base leading-relaxed text-slate-800 dark:text-slate-100 text-pretty animate-[fadeIn_0.3s_ease-out]">
            {L.examLevelAnswer.text}
          </p>
        )}
      </SectionCard>
    </div>
  )
}
