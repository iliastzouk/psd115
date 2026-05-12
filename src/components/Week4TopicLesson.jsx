import { useCallback, useEffect, useMemo, useState } from 'react'
import Flashcard from './Flashcard.jsx'
import SectionCard from './SectionCard.jsx'
import MemoryHack from './MemoryHack.jsx'
import { getCategoryLabel, quizQuestions } from '../data/questions.js'
import { loadWeek4TopicChecklist, saveWeek4TopicChecklist } from '../utils/storage.js'

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

export default function Week4TopicLesson({ topic, topicFlashcards, onMarkFlashSeen }) {
  const [checklist, setChecklist] = useState(() => loadWeek4TopicChecklist(topic.slug, topic.progressChecklist.length))
  const [fcIndex, setFcIndex] = useState(0)
  const [openExamIdx, setOpenExamIdx] = useState({})

  useEffect(() => {
    saveWeek4TopicChecklist(topic.slug, checklist)
  }, [topic.slug, checklist])

  const lessonQuizItems = useMemo(() => {
    const map = new Map(quizQuestions.map((q) => [q.id, q]))
    return topic.lessonQuizIds.map((id) => map.get(id)).filter(Boolean)
  }, [topic.lessonQuizIds])

  const orderedCards = useMemo(() => {
    const order = topic.flashcards.map((c) => c.id)
    const byId = Object.fromEntries(topicFlashcards.map((c) => [c.id, c]))
    return order.map((id) => byId[id]).filter(Boolean)
  }, [topic.flashcards, topicFlashcards])

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
      <div className="text-center py-6 px-4 rounded-2xl bg-gradient-to-b from-violet-50 to-stone-50 dark:from-violet-950/35 dark:to-slate-900 border border-violet-100 dark:border-violet-900">
        <p className="text-xs font-semibold text-violet-700 dark:text-violet-300 uppercase tracking-widest">Εβδομάδα 4 · Αίσθηση & αντίληψη</p>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-50 mt-2 text-balance">{topic.title}</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">{topic.pptRange}</p>
      </div>

      <SectionCard title="Εισαγωγή">
        <p className="text-sm text-slate-700 dark:text-slate-200 whitespace-pre-line leading-relaxed">{topic.intro}</p>
      </SectionCard>

      <SectionCard title="Διάλεξη (K4 · PPT)">
        <p className="text-sm text-slate-800 dark:text-slate-100 whitespace-pre-line leading-relaxed font-medium">
          Οι διαφάνειες της ενότητας εμφανίζονται πάνω από αυτή τη σελίδα. {topic.pptRange}.
        </p>
      </SectionCard>

      {topic.sections.map((s) => (
        <SectionCard key={s.title} title={s.title}>
          <p className="text-sm text-slate-800 dark:text-slate-100 whitespace-pre-line leading-relaxed">{s.body}</p>
        </SectionCard>
      ))}

      {topic.traps?.length ? (
        <SectionCard title="Παγίδες εξέτασης">
          <ul className="space-y-3">
            {topic.traps.map((tr, i) => (
              <li key={i} className="text-sm rounded-xl border border-amber-200/80 dark:border-amber-900/50 bg-amber-50/60 dark:bg-amber-950/20 p-4">
                <p className="font-medium text-rose-800 dark:text-rose-300">ΛΑΘΟΣ: {tr.wrong}</p>
                <p className="mt-2 text-emerald-900 dark:text-emerald-200">ΣΩΣΤΟ: {tr.correct}</p>
              </li>
            ))}
          </ul>
        </SectionCard>
      ) : null}

      {topic.memoryHackLines?.length ? (
        <MemoryHack title="Μνημονικό trick" lines={topic.memoryHackLines} />
      ) : null}

      <SectionCard title="Κάρτες ενότητας">
        {currentFc ? (
          <Flashcard
            card={currentFc}
            categoryLabel={getCategoryLabel(topic.categoryId)}
            hasNext={fcIndex < orderedCards.length - 1}
            onNext={nextFlash}
            onRestart={restartFlash}
            onMarkSeen={onMarkFlashSeen}
          />
        ) : (
          <p className="text-sm text-slate-600 dark:text-slate-300">Δεν βρέθηκαν κάρτες για αυτή την ενότητα.</p>
        )}
      </SectionCard>

      {lessonQuizItems.length ? (
        <SectionCard title="Μίνι κουίζ ενότητας">
          <div className="space-y-4">
            {lessonQuizItems.map((q) => (
              <LessonQuizItem key={q.id} q={q} />
            ))}
          </div>
        </SectionCard>
      ) : null}

      <SectionCard title="Έλεγχος μελέτης">
        <ul className="space-y-2">
          {topic.progressChecklist.map((line, i) => (
            <li key={i} className="flex gap-3 items-start">
              <input
                id={`w4-${topic.slug}-chk-${i}`}
                type="checkbox"
                checked={!!checklist[i]}
                onChange={() => toggleCheck(i)}
                className="mt-1 size-4 rounded border-slate-300 dark:border-slate-600"
              />
              <label htmlFor={`w4-${topic.slug}-chk-${i}`} className="text-sm text-slate-800 dark:text-slate-100 cursor-pointer">
                {line}
              </label>
            </li>
          ))}
        </ul>
      </SectionCard>

      {topic.examQuestions?.length ? (
        <SectionCard title="Ερωτήσεις ανάπτυξης (εξέταση)">
          <ul className="space-y-3">
            {topic.examQuestions.map((ex, i) => {
              const open = !!openExamIdx[i]
              return (
                <li key={ex.id} className="rounded-xl border border-slate-200 dark:border-slate-600 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setOpenExamIdx((prev) => ({ ...prev, [i]: !prev[i] }))}
                    className="w-full text-left px-4 py-3 text-sm font-medium bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                  >
                    {open ? '▼' : '▶'} {ex.question}
                  </button>
                  {open && (
                    <p className="text-sm text-slate-700 dark:text-slate-200 px-4 py-3 border-t border-slate-200 dark:border-slate-600 whitespace-pre-line leading-relaxed">
                      {ex.idealAnswer}
                    </p>
                  )}
                </li>
              )
            })}
          </ul>
        </SectionCard>
      ) : null}
    </div>
  )
}
