/**
 * Canonical routes → υπάρχοντα layouts/σελίδες. Η ταυτότητα έρχεται από το resolver (useRouteIdentity),
 * ποτέ από ανάλυση pathname. Τα layouts αποδίδουν το εσωτερικό περιεχόμενο μέσω <Outlet />.
 */
import { Link } from 'react-router-dom'
import { useRouteIdentity } from '../../core/routing/hooks.js'
import { getContentCourse, getUnit } from '../../core/routing/catalog.js'
import { LEGACY_TOOLS } from '../../core/routing/legacy.js'
import { coursePath, studyPath, unitPath } from '../../core/routing/paths.js'
import { unitScope } from '../../core/routing/scope.js'
import FlashcardsPage from '../FlashcardsPage.jsx'
import QuizPage from '../QuizPage.jsx'
import ExamMode from '../ExamMode.jsx'
import ReviewPage from '../ReviewPage.jsx'
import NotFound from './NotFound.jsx'
import { UI_BY_COURSE } from './psd115Ui.jsx'

const TOOL_LABELS = { quiz: 'Κουίζ', flashcards: 'Κάρτες', exam: 'Εξέταση', review: 'Λάθη', today: 'Σήμερα' }
const TOOL_PAGES = { quiz: QuizPage, flashcards: FlashcardsPage, exam: ExamMode, review: ReviewPage }

function notFoundFor(id) {
  const course = id.courseId ? getContentCourse(id.courseId) : null
  return <NotFound links={course ? [{ to: coursePath(id.courseId), label: id.courseId.toUpperCase() }] : []} />
}

// ---- Unit: /:courseId/units/:unitId ----
export function UnitFrame() {
  const id = useRouteIdentity()
  const Layout = id.kind === 'unit' ? UI_BY_COURSE[id.courseId]?.layouts[id.unitId] : null
  return Layout ? <Layout /> : notFoundFor(id)
}
export function UnitHome() {
  const id = useRouteIdentity()
  const Home = UI_BY_COURSE[id.courseId]?.homes[id.unitId]
  return Home ? <Home /> : null
}

// ---- Topic: /:courseId/topics/:topicId ----
export function TopicFrame() {
  const id = useRouteIdentity()
  const ui = id.kind === 'topic' ? UI_BY_COURSE[id.courseId] : null
  const Layout = ui?.layouts[id.unitId]
  return Layout && ui.topicElement(id.unitId, id.legacySlug) ? <Layout /> : notFoundFor(id)
}
export function TopicContent() {
  const id = useRouteIdentity()
  return UI_BY_COURSE[id.courseId]?.topicElement(id.unitId, id.legacySlug) ?? null
}

// ---- Study: /study/:tool?scope=... ----
function ScopeChooser({ tool, courseId }) {
  const course = getContentCourse(courseId)
  if (!course) return <NotFound message="Δεν υπάρχει ακόμα περιεχόμενο μελέτης για αυτό το μάθημα." />
  return (
    <div className="space-y-3">
      <h1 className="text-lg font-bold text-slate-900 dark:text-white">
        {TOOL_LABELS[tool]} · {courseId.toUpperCase()}
      </h1>
      <p className="text-sm text-slate-600 dark:text-slate-300">Διάλεξε εβδομάδα:</p>
      <ul className="grid gap-2 sm:grid-cols-2">
        {course.course.units.map((u) => (
          <li key={u.id}>
            <Link
              to={studyPath(tool, unitScope(courseId, u.id))}
              className="block rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 text-sm hover:border-teal-400"
            >
              {u.label} — {u.title}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function StudyFrame() {
  const id = useRouteIdentity()
  if (id.kind !== 'study') return <NotFound message="Άγνωστο εργαλείο ή μη έγκυρο scope." />
  if (id.tool === 'today') {
    return (
      <div data-testid="study-today" className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-600 p-6 space-y-2">
        <h1 className="text-lg font-bold text-slate-900 dark:text-white">Σήμερα</h1>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Η πρόταση «τι να διαβάσω σήμερα» δεν είναι ακόμα διαθέσιμη.
        </p>
      </div>
    )
  }
  if (id.scope.kind === 'unit' && LEGACY_TOOLS.includes(id.tool)) {
    const Layout = UI_BY_COURSE[id.courseId]?.layouts[id.unitId]
    if (Layout) return <Layout />
  }
  if (id.scope.kind === 'course') return <ScopeChooser tool={id.tool} courseId={id.courseId} />
  return <NotFound message="Αυτό το εργαλείο δεν υποστηρίζει ακόμα αυτό το scope." />
}
export function StudyContent() {
  const id = useRouteIdentity()
  const Page = TOOL_PAGES[id.tool]
  return Page ? <Page /> : null
}

// ---- Document: /:courseId/docs/:docId ----
export function DocPage() {
  const id = useRouteIdentity()
  if (id.kind !== 'doc') return notFoundFor(id)
  const doc = getContentCourse(id.courseId).docs.find((d) => d.id === id.docId)
  const unit = getUnit(id.courseId, doc.unit)
  return (
    <div className="space-y-3">
      <h1 className="text-lg font-bold text-slate-900 dark:text-white">Διαφάνειες · {unit.label}</h1>
      <p className="text-sm text-slate-600 dark:text-slate-300">{unit.title}</p>
      <div className="flex flex-wrap gap-2">
        <a
          href={`/${doc.path}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-1.5 text-sm text-teal-700 dark:text-teal-300"
        >
          Άνοιγμα PDF
        </a>
        <Link
          to={unitPath(id.courseId, unit.id)}
          className="inline-flex rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-1.5 text-sm text-teal-700 dark:text-teal-300"
        >
          {unit.label}
        </Link>
      </div>
    </div>
  )
}
