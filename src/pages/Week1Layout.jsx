import { useMemo } from 'react'
import { Outlet, useLocation, useOutletContext } from 'react-router-dom'
import Week1SubNav from '../components/Week1SubNav.jsx'
import Progress from '../components/Progress.jsx'
import PptSlideDeck from '../components/PptSlideDeck.jsx'
import LessonPrevNextNav from '../components/LessonPrevNextNav.jsx'
import WeekNextPrevNav from '../components/WeekNextPrevNav.jsx'
import { WEEK1_CATEGORIES, flashcards, quizQuestions } from '../data/questions.js'
import { K1_PPT_SLIDES_BY_ROUTE } from '../data/week1/k1PptRefsByRoute.js'

const TOOL_PATHS = new Set(['/week/1/flashcards', '/week/1/quiz', '/week/1/exam', '/week/1/review'])
/** Σε Εξέταση / Λάθη το μπλοκ «Πρόοδος» αποσπά· η ροή είναι μόνο το εργαλείο. */
const HIDE_PROGRESS_PATHS = new Set(['/week/1/exam', '/week/1/review'])

const week1CategoryIds = new Set(WEEK1_CATEGORIES.map((c) => c.id))

export default function Week1Layout() {
  const ctx = useOutletContext()
  const { pathname } = useLocation()
  const p = pathname.replace(/\/$/, '') || '/week/1'
  const progressExpandedByDefault = p === '/week/1' || TOOL_PATHS.has(p)
  const k1Slides = p === '/week/1' || TOOL_PATHS.has(p) ? null : K1_PPT_SLIDES_BY_ROUTE[p] ?? null
  const showProgress = !HIDE_PROGRESS_PATHS.has(p)

  const week1FlashTotal = useMemo(
    () => flashcards.filter((c) => week1CategoryIds.has(c.categoryId)).length,
    [],
  )
  const week1QuizTotal = useMemo(
    () => quizQuestions.filter((q) => week1CategoryIds.has(q.categoryId)).length,
    [],
  )

  return (
    <div className="space-y-5">
      <Week1SubNav />
      {showProgress && (
        <Progress
          progress={ctx.progress}
          totalFlashcards={week1FlashTotal}
          totalQuiz={week1QuizTotal}
          defaultExpanded={progressExpandedByDefault}
          categories={WEEK1_CATEGORIES}
        />
      )}
      {k1Slides && <PptSlideDeck slideNumbers={k1Slides} routeKey={pathname} deckId="week1" />}
      <Outlet context={ctx} />
      <LessonPrevNextNav />
      <WeekNextPrevNav weekNum={1} />
    </div>
  )
}
