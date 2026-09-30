import { useMemo } from 'react'
import { Outlet, useOutletContext } from 'react-router-dom'
import { useLegacyRouteKey, useRouteIdentity } from '../core/routing/hooks.js'
import UnitSubNav from '../components/UnitSubNav.jsx'
import Progress from '../components/Progress.jsx'
import PptSlideDeck from '../components/PptSlideDeck.jsx'
import LessonPrevNextNav from '../components/LessonPrevNextNav.jsx'
import WeekNextPrevNav from '../components/WeekNextPrevNav.jsx'
import { WEEK1_CATEGORIES, flashcards, quizQuestions } from '../../content/courses/psd115/questions.js'
import { K1_PPT_SLIDES_BY_ROUTE } from '../../content/courses/psd115/units/k1/k1PptRefsByRoute.js'

/** Σε Εξέταση / Λάθη το μπλοκ «Πρόοδος» αποσπά· η ροή είναι μόνο το εργαλείο. */
const HIDE_PROGRESS_TOOLS = new Set(['exam', 'review'])

const week1CategoryIds = new Set(WEEK1_CATEGORIES.map((c) => c.id))

export default function Week1Layout() {
  const ctx = useOutletContext()
  const id = useRouteIdentity()
  // Legacy κλειδί μόνο για τις διαφάνειες ανά θέμα (κλειδιά του περιεχομένου, adapter 1C-B).
  const p = useLegacyRouteKey() || '/week/1'
  const onUnitHome = id.kind === 'unit'
  const onToolPage = id.kind === 'study'
  const progressExpandedByDefault = onUnitHome || onToolPage
  const k1Slides = onUnitHome || onToolPage ? null : K1_PPT_SLIDES_BY_ROUTE[p] ?? null
  const showProgress = !(onToolPage && HIDE_PROGRESS_TOOLS.has(id.tool))

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
      <UnitSubNav courseId="psd115" unitId="k1" />
      {showProgress && (
        <Progress
          progress={ctx.progress}
          totalFlashcards={week1FlashTotal}
          totalQuiz={week1QuizTotal}
          defaultExpanded={progressExpandedByDefault}
          categories={WEEK1_CATEGORIES}
        />
      )}
      {k1Slides && <PptSlideDeck slideNumbers={k1Slides} routeKey={p} deckId="week1" />}
      <Outlet context={ctx} />
      <LessonPrevNextNav />
      <WeekNextPrevNav courseId="psd115" unitId="k1" />
    </div>
  )
}
