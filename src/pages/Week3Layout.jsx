import { useMemo } from 'react'
import { Outlet, useLocation, useOutletContext } from 'react-router-dom'
import Week3SubNav from '../components/Week3SubNav.jsx'
import Progress from '../components/Progress.jsx'
import PptSlideDeck from '../components/PptSlideDeck.jsx'
import LessonPrevNextNav from '../components/LessonPrevNextNav.jsx'
import WeekNextPrevNav from '../components/WeekNextPrevNav.jsx'
import { WEEK3_CATEGORIES, flashcards, quizQuestions } from '../data/questions.js'
import { K3_PPT_SLIDES_BY_ROUTE } from '../data/week3/k3PptRefsByRoute.js'

const TOOL_PATHS = new Set(['/week/3/flashcards', '/week/3/quiz', '/week/3/exam', '/week/3/review'])
const HIDE_PROGRESS_PATHS = new Set(['/week/3/exam', '/week/3/review'])

const week3CategoryIds = new Set(WEEK3_CATEGORIES.map((c) => c.id))

export default function Week3Layout() {
  const ctx = useOutletContext()
  const { pathname } = useLocation()
  const p = pathname.replace(/\/$/, '') || '/week/3'
  const progressExpandedByDefault = p === '/week/3' || TOOL_PATHS.has(p)
  const k3Slides = p === '/week/3' || TOOL_PATHS.has(p) ? null : K3_PPT_SLIDES_BY_ROUTE[p] ?? null
  const showProgress = !HIDE_PROGRESS_PATHS.has(p)

  const week3FlashTotal = useMemo(
    () => flashcards.filter((c) => week3CategoryIds.has(c.categoryId)).length,
    [],
  )
  const week3QuizTotal = useMemo(
    () => quizQuestions.filter((q) => week3CategoryIds.has(q.categoryId)).length,
    [],
  )

  return (
    <div className="space-y-5">
      <Week3SubNav />
      {showProgress && (
        <Progress
          progress={ctx.progress}
          totalFlashcards={week3FlashTotal}
          totalQuiz={week3QuizTotal}
          defaultExpanded={progressExpandedByDefault}
          categories={WEEK3_CATEGORIES}
        />
      )}
      {k3Slides && <PptSlideDeck slideNumbers={k3Slides} routeKey={pathname} deckId="week3" />}
      <Outlet context={ctx} />
      <LessonPrevNextNav />
      <WeekNextPrevNav weekNum={3} />
    </div>
  )
}
