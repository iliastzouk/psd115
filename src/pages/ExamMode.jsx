import { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { shuffle } from '../utils/shuffle.js'
import { getWeek1ExamQuestions } from '../data/week1/index.js'
import { getWeek2ExamQuestions } from '../data/week2/index.js'
import { getWeek3ExamQuestions } from '../data/week3/index.js'
import { getWeek4ExamQuestions } from '../data/week4/index.js'
import ExamQuestion from '../components/ExamQuestion.jsx'
import ProgressBar from '../components/ProgressBar.jsx'

export default function ExamMode() {
  const { pathname } = useLocation()
  const deck = useMemo(() => {
    const pool = pathname.startsWith('/week/4')
      ? getWeek4ExamQuestions()
      : pathname.startsWith('/week/3')
        ? getWeek3ExamQuestions()
        : pathname.startsWith('/week/2')
          ? getWeek2ExamQuestions()
          : getWeek1ExamQuestions()
    return shuffle(pool)
  }, [pathname])
  const [index, setIndex] = useState(0)
  const [revealed, setRevealed] = useState(false)

  useEffect(() => {
    setIndex(0)
    setRevealed(false)
  }, [pathname])

  const total = deck.length
  const current = deck[index]

  function next() {
    setRevealed(false)
    setIndex((i) => (i + 1 >= total ? 0 : i + 1))
  }

  function prev() {
    setRevealed(false)
    setIndex((i) => (i - 1 < 0 ? total - 1 : i - 1))
  }

  if (!current) {
    return <p className="text-sm text-slate-600">Δεν υπάρχουν ερωτήσεις εξέτασης ακόμη.</p>
  }

  return (
    <div className="space-y-5">
      <p className="text-sm text-slate-600 dark:text-slate-300">
        Λειτουργία εξέτασης: ερώτηση ανάπτυξης — δοκίμασε να απαντήσεις προφορικά ή γραπτά πριν δεις το πρότυπο.
      </p>
      <ProgressBar label={`Θέμα ${index + 1} / ${total}`} value={index + 1} max={total} colorClass="bg-indigo-500" />
      <p className="text-[11px] uppercase text-slate-500">{current.topic}</p>
      <ExamQuestion
        question={current.question}
        idealAnswer={current.idealAnswer}
        revealed={revealed}
        onToggle={() => setRevealed((r) => !r)}
      />
      <div className="flex gap-3 justify-between">
        <button
          type="button"
          onClick={prev}
          className="touch-manipulation rounded-xl border border-slate-300 dark:border-slate-600 px-4 py-3 text-sm min-h-[48px]"
        >
          Προηγούμενο
        </button>
        <button
          type="button"
          onClick={next}
          className="touch-manipulation rounded-xl bg-indigo-600 text-white px-4 py-3 text-sm font-medium min-h-[48px]"
        >
          Επόμενο
        </button>
      </div>
    </div>
  )
}
