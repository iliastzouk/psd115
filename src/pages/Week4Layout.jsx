import { useMemo } from 'react'
import { Outlet, useOutletContext } from 'react-router-dom'
import { useLegacyRouteKey, useRouteIdentity } from '../core/routing/hooks.js'
import UnitSubNav from '../components/UnitSubNav.jsx'
import Progress from '../components/Progress.jsx'
import PptSlideDeck from '../components/PptSlideDeck.jsx'
import LessonPrevNextNav from '../components/LessonPrevNextNav.jsx'
import WeekNextPrevNav from '../components/WeekNextPrevNav.jsx'
import { WEEK4_CATEGORIES, flashcards, quizQuestions } from '../../content/courses/psd115/questions.js'
import { K4_PPT_SLIDES_BY_ROUTE } from '../../content/courses/psd115/units/k4/k4PptRefsByRoute.js'

/** Σε Εξέταση / Λάθη το μπλοκ «Πρόοδος» αποσπά· η ροή είναι μόνο το εργαλείο. */
const HIDE_PROGRESS_TOOLS = new Set(['exam', 'review'])

const week4CategoryIds = new Set(WEEK4_CATEGORIES.map((c) => c.id))

export default function Week4Layout() {
  const ctx = useOutletContext()
  const id = useRouteIdentity()
  // Legacy κλειδί μόνο για τις διαφάνειες ανά θέμα (κλειδιά του περιεχομένου, adapter 1C-B).
  const p = useLegacyRouteKey() || '/week/4'
  const onUnitHome = id.kind === 'unit'
  const onToolPage = id.kind === 'study'
  const progressExpandedByDefault = onUnitHome || onToolPage
  const k4Slides = onUnitHome || onToolPage ? null : K4_PPT_SLIDES_BY_ROUTE[p] ?? null
  const showProgress = !(onToolPage && HIDE_PROGRESS_TOOLS.has(id.tool))

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
      <UnitSubNav courseId="psd115" unitId="k4" />
      {showProgress && (
        <Progress
          progress={ctx.progress}
          totalFlashcards={week4FlashTotal}
          totalQuiz={week4QuizTotal}
          defaultExpanded={progressExpandedByDefault}
          categories={WEEK4_CATEGORIES}
        />
      )}
      {k4Slides && <PptSlideDeck slideNumbers={k4Slides} routeKey={p} deckId="week4" />}
      <Outlet context={ctx} />
      <LessonPrevNextNav />
      <WeekNextPrevNav courseId="psd115" unitId="k4" />
    </div>
  )
}
