import { useMemo } from 'react'
import { Outlet, useLocation, useOutletContext } from 'react-router-dom'
import Week4SubNav from '../components/Week4SubNav.jsx'
import Progress from '../components/Progress.jsx'
import PptSlideDeck from '../components/PptSlideDeck.jsx'
import LessonPrevNextNav from '../components/LessonPrevNextNav.jsx'
import WeekNextPrevNav from '../components/WeekNextPrevNav.jsx'
import { WEEK4_CATEGORIES, flashcards, quizQuestions } from '../data/questions.js'
import { K4_PPT_SLIDES_BY_ROUTE } from '../data/week4/k4PptRefsByRoute.js'

const TOOL_PATHS = new Set(['/week/4/flashcards', '/week/4/quiz', '/week/4/exam', '/week/4/review'])
const HIDE_PROGRESS_PATHS = new Set(['/week/4/exam', '/week/4/review'])

const week4CategoryIds = new Set(WEEK4_CATEGORIES.map((c) => c.id))

export default function Week4Layout() {
  const ctx = useOutletContext()
  const { pathname } = useLocation()
  const p = pathname.replace(/\/$/, '') || '/week/4'
  const progressExpandedByDefault = p === '/week/4' || TOOL_PATHS.has(p)
  const k4Slides = p === '/week/4' || TOOL_PATHS.has(p) ? null : K4_PPT_SLIDES_BY_ROUTE[p] ?? null
  const showProgress = !HIDE_PROGRESS_PATHS.has(p)

  const week4FlashTotal = useMemo(
    () => flashcards.filter((c) => week4CategoryIds.has(c.categoryId)).length,
    [],
  )
  const week4QuizTotal = useMemo(
    () => quizQuestions.filter((q) => week4CategoryIds.has(q.categoryId)).length,
    [],
  )

  return (
    <div className="space-y-5">
      <Week4SubNav />
      {showProgress && (
        <Progress
          progress={ctx.progress}
          totalFlashcards={week4FlashTotal}
          totalQuiz={week4QuizTotal}
          defaultExpanded={progressExpandedByDefault}
          categories={WEEK4_CATEGORIES}
        />
      )}
      {k4Slides && <PptSlideDeck slideNumbers={k4Slides} routeKey={pathname} deckId="week4" />}
      <Outlet context={ctx} />
      <LessonPrevNextNav />
      <WeekNextPrevNav weekNum={4} />
    </div>
  )
}
