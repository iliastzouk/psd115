/**
 * Σελίδες του routing που διαβάζουν το academic registry (πρώτο ελεγχόμενο σημείο χρήσης του, Phase 1C-B).
 * Κανένα υπάρχον component μελέτης/περιεχομένου/προόδου δεν διαβάζει το registry.
 */
import { Link, useOutletContext } from 'react-router-dom'
import { registry } from '../../core/academic/data/index.js'
import { getCourseById, getEnrollments } from '../../core/academic/selectors.js'
import { UNKNOWN } from '../../core/academic/schema.js'
import { useRouteIdentity } from '../../core/routing/hooks.js'
import { coursePath, termPath } from '../../core/routing/paths.js'
import Progress from '../../components/Progress.jsx'
import { progressPageView } from '../../components/progressDisplay.js'
import Home from '../Home.jsx'
import NotFound from './NotFound.jsx'

const card = 'block rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 hover:border-teal-400'
const shown = (v) => (v === UNKNOWN ? '—' : v)

// ---- Course: /:courseId ----
export function CoursePage() {
  const id = useRouteIdentity()
  if (id.kind !== 'course') return <NotFound />
  if (id.hasContent) return <Home courseId={id.courseId} />
  const course = getCourseById(registry, id.courseId)
  const enrollments = getEnrollments(registry, { courseId: id.courseId })
  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-bold tracking-wide text-teal-700 dark:text-teal-300">{course.code}</p>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{course.title}</h1>
      </div>
      <p className="text-sm text-slate-600 dark:text-slate-300">Το περιεχόμενο μελέτης δεν έχει προστεθεί ακόμα.</p>
      <ul className="space-y-2">
        {enrollments.map((e) => (
          <li key={e.id}>
            <Link to={termPath(e.termId)} className={card}>
              <span className="text-sm text-slate-800 dark:text-slate-100">
                {registry.terms.find((t) => t.id === e.termId)?.label ?? e.termId}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

// ---- Term: /terms/:termId ----
export function TermPage() {
  const id = useRouteIdentity()
  if (id.kind !== 'term') return <NotFound />
  const term = registry.terms.find((t) => t.id === id.termId)
  const enrollments = getEnrollments(registry, { termId: id.termId })
  return (
    <div className="space-y-4" data-testid="term-page">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{term.label}</h1>
      <ul className="grid gap-2 sm:grid-cols-2">
        {enrollments.map((e) => {
          const course = getCourseById(registry, e.courseId)
          const exam = Array.isArray(e.exams) ? e.exams.find((x) => x.kind === 'final') : null
          return (
            <li key={e.id}>
              <Link to={coursePath(course.id)} className={card}>
                <p className="text-xs font-bold text-teal-700 dark:text-teal-300">{course.code}</p>
                <p className="font-semibold text-slate-900 dark:text-white">{course.title}</p>
                {exam ? <p className="text-xs text-slate-500 dark:text-slate-400">Εξέταση: {shown(exam.date)}</p> : null}
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

// ---- Progress: /progress?scope=... ----
export function ProgressPage() {
  const id = useRouteIdentity()
  const ctx = useOutletContext()
  if (id.kind !== 'progress') return <NotFound message="Άγνωστο ή μη έγκυρο scope προόδου." />
  // Φάση 5 (I2): όλα από το STUDY_CONTENT του μαθήματος της διαδρομής, μόνο αν η συνεδρία κρατά την πρόοδό του.
  const view = progressPageView(id, ctx.studyCourse)
  if (view.kind !== 'ok') return <NotFound message="Η πρόοδος δεν υποστηρίζει ακόμα αυτό το scope." />
  return (
    <Progress progress={ctx.progress} scope={view.scope} totalQuiz={view.totalQuiz} defaultExpanded categories={view.categories} />
  )
}
