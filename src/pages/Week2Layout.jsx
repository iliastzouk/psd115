import { useMemo } from 'react'
import { Outlet, useOutletContext } from 'react-router-dom'
import { useRouteIdentity } from '../core/routing/hooks.js'
import { getTopicSlides } from '../core/routing/catalog.js'
import UnitSubNav from '../components/UnitSubNav.jsx'
import Progress from '../components/Progress.jsx'
import { progressScopeFor } from '../components/progressDisplay.js'
import PptSlideDeck from '../components/PptSlideDeck.jsx'
import LessonPrevNextNav from '../components/LessonPrevNextNav.jsx'
import WeekNextPrevNav from '../components/WeekNextPrevNav.jsx'
import { WEEK2_CATEGORIES, quizQuestions } from '../../content/courses/psd115/questions.js'

/** Σε Εξέταση / Λάθη το μπλοκ «Πρόοδος» αποσπά· η ροή είναι μόνο το εργαλείο. */
const HIDE_PROGRESS_TOOLS = new Set(['exam', 'review'])

const week2CategoryIds = new Set(WEEK2_CATEGORIES.map((c) => c.id))

export default function Week2Layout() {
  const ctx = useOutletContext()
  const id = useRouteIdentity()
  const onUnitHome = id.kind === 'unit'
  const onToolPage = id.kind === 'study'
  const progressExpandedByDefault = onUnitHome || onToolPage
  // Διαφάνειες ανά θέμα (Φάση 6d-α: με το topicId, από το manifest του μαθήματος).
  const k2Slides = id.kind === 'topic' ? getTopicSlides('psd115', id.topicId) : null
  const showProgress = !(onToolPage && HIDE_PROGRESS_TOOLS.has(id.tool))

  // Φάση 4: η μπάρα «Πρόοδος» αφορά ΜΟΝΟ αυτή την ενότητα — το scope το ορίζει το περιεχόμενο (progressScopeFor).
  const progressScope = useMemo(() => progressScopeFor('psd115', 'k2'), [])
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
          scope={progressScope}
          totalQuiz={week2QuizTotal}
          defaultExpanded={progressExpandedByDefault}
          categories={WEEK2_CATEGORIES}
        />
      )}
      {k2Slides && <PptSlideDeck slideNumbers={k2Slides} routeKey={id.topicId} deckId="week2" />}
      <Outlet context={ctx} />
      <LessonPrevNextNav />
      <WeekNextPrevNav courseId="psd115" unitId="k2" />
    </div>
  )
}
