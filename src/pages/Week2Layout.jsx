import { useMemo } from 'react'
import { Outlet, useLocation, useOutletContext } from 'react-router-dom'
import Week2SubNav from '../components/Week2SubNav.jsx'
import Progress from '../components/Progress.jsx'
import PptSlideDeck from '../components/PptSlideDeck.jsx'
import LessonPrevNextNav from '../components/LessonPrevNextNav.jsx'
import { WEEK2_CATEGORIES, flashcards, quizQuestions } from '../data/questions.js'
import { K2_PPT_SLIDES_BY_ROUTE } from '../data/week2/k2PptRefsByRoute.js'

const TOOL_PATHS = new Set(['/week/2/flashcards', '/week/2/quiz', '/week/2/exam', '/week/2/review'])
const HIDE_PROGRESS_PATHS = new Set(['/week/2/exam', '/week/2/review'])

const week2CategoryIds = new Set(WEEK2_CATEGORIES.map((c) => c.id))

export default function Week2Layout() {
  const ctx = useOutletContext()
  const { pathname } = useLocation()
  const p = pathname.replace(/\/$/, '') || '/week/2'
  const progressExpandedByDefault = p === '/week/2' || TOOL_PATHS.has(p)
  const k2Slides = p === '/week/2' || TOOL_PATHS.has(p) ? null : K2_PPT_SLIDES_BY_ROUTE[p] ?? null
  const showProgress = !HIDE_PROGRESS_PATHS.has(p)

  const week2FlashTotal = useMemo(
    () => flashcards.filter((c) => week2CategoryIds.has(c.categoryId)).length,
    [],
  )
  const week2QuizTotal = useMemo(
    () => quizQuestions.filter((q) => week2CategoryIds.has(q.categoryId)).length,
    [],
  )

  return (
    <div className="space-y-5">
      <Week2SubNav />
      {showProgress && (
        <Progress
          progress={ctx.progress}
          totalFlashcards={week2FlashTotal}
          totalQuiz={week2QuizTotal}
          defaultExpanded={progressExpandedByDefault}
          categories={WEEK2_CATEGORIES}
        />
      )}
      {k2Slides && <PptSlideDeck slideNumbers={k2Slides} routeKey={pathname} deckId="week2" />}
      <Outlet context={ctx} />
      <LessonPrevNextNav />
    </div>
  )
}
