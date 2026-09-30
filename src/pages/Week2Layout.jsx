import { useMemo } from 'react'
import { Outlet, useOutletContext } from 'react-router-dom'
import { useLegacyRouteKey, useRouteIdentity } from '../core/routing/hooks.js'
import UnitSubNav from '../components/UnitSubNav.jsx'
import Progress from '../components/Progress.jsx'
import PptSlideDeck from '../components/PptSlideDeck.jsx'
import LessonPrevNextNav from '../components/LessonPrevNextNav.jsx'
import WeekNextPrevNav from '../components/WeekNextPrevNav.jsx'
import { WEEK2_CATEGORIES, flashcards, quizQuestions } from '../../content/courses/psd115/questions.js'
import { K2_PPT_SLIDES_BY_ROUTE } from '../../content/courses/psd115/units/k2/k2PptRefsByRoute.js'

/** Σε Εξέταση / Λάθη το μπλοκ «Πρόοδος» αποσπά· η ροή είναι μόνο το εργαλείο. */
const HIDE_PROGRESS_TOOLS = new Set(['exam', 'review'])

const week2CategoryIds = new Set(WEEK2_CATEGORIES.map((c) => c.id))

export default function Week2Layout() {
  const ctx = useOutletContext()
  const id = useRouteIdentity()
  // Legacy κλειδί μόνο για τις διαφάνειες ανά θέμα (κλειδιά του περιεχομένου, adapter 1C-B).
  const p = useLegacyRouteKey() || '/week/2'
  const onUnitHome = id.kind === 'unit'
  const onToolPage = id.kind === 'study'
  const progressExpandedByDefault = onUnitHome || onToolPage
  const k2Slides = onUnitHome || onToolPage ? null : K2_PPT_SLIDES_BY_ROUTE[p] ?? null
  const showProgress = !(onToolPage && HIDE_PROGRESS_TOOLS.has(id.tool))

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
      <UnitSubNav courseId="psd115" unitId="k2" />
      {showProgress && (
        <Progress
          progress={ctx.progress}
          totalFlashcards={week2FlashTotal}
          totalQuiz={week2QuizTotal}
          defaultExpanded={progressExpandedByDefault}
          categories={WEEK2_CATEGORIES}
        />
      )}
      {k2Slides && <PptSlideDeck slideNumbers={k2Slides} routeKey={p} deckId="week2" />}
      <Outlet context={ctx} />
      <LessonPrevNextNav />
      <WeekNextPrevNav courseId="psd115" unitId="k2" />
    </div>
  )
}
