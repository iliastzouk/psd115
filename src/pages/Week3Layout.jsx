import { useMemo } from 'react'
import { Outlet, useOutletContext } from 'react-router-dom'
import { useLegacyRouteKey, useRouteIdentity } from '../core/routing/hooks.js'
import UnitSubNav from '../components/UnitSubNav.jsx'
import Progress from '../components/Progress.jsx'
import PptSlideDeck from '../components/PptSlideDeck.jsx'
import LessonPrevNextNav from '../components/LessonPrevNextNav.jsx'
import WeekNextPrevNav from '../components/WeekNextPrevNav.jsx'
import { WEEK3_CATEGORIES, flashcards, quizQuestions } from '../../content/courses/psd115/questions.js'
import { K3_PPT_SLIDES_BY_ROUTE } from '../../content/courses/psd115/units/k3/k3PptRefsByRoute.js'

/** Σε Εξέταση / Λάθη το μπλοκ «Πρόοδος» αποσπά· η ροή είναι μόνο το εργαλείο. */
const HIDE_PROGRESS_TOOLS = new Set(['exam', 'review'])

const week3CategoryIds = new Set(WEEK3_CATEGORIES.map((c) => c.id))

export default function Week3Layout() {
  const ctx = useOutletContext()
  const id = useRouteIdentity()
  // Legacy κλειδί μόνο για τις διαφάνειες ανά θέμα (κλειδιά του περιεχομένου, adapter 1C-B).
  const p = useLegacyRouteKey() || '/week/3'
  const onUnitHome = id.kind === 'unit'
  const onToolPage = id.kind === 'study'
  const progressExpandedByDefault = onUnitHome || onToolPage
  const k3Slides = onUnitHome || onToolPage ? null : K3_PPT_SLIDES_BY_ROUTE[p] ?? null
  const showProgress = !(onToolPage && HIDE_PROGRESS_TOOLS.has(id.tool))

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
      <UnitSubNav courseId="psd115" unitId="k3" />
      {showProgress && (
        <Progress
          progress={ctx.progress}
          totalFlashcards={week3FlashTotal}
          totalQuiz={week3QuizTotal}
          defaultExpanded={progressExpandedByDefault}
          categories={WEEK3_CATEGORIES}
        />
      )}
      {k3Slides && <PptSlideDeck slideNumbers={k3Slides} routeKey={p} deckId="week3" />}
      <Outlet context={ctx} />
      <LessonPrevNextNav />
      <WeekNextPrevNav courseId="psd115" unitId="k3" />
    </div>
  )
}
