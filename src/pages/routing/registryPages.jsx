/**
 * Σελίδες του routing που διαβάζουν το academic registry (πρώτο ελεγχόμενο σημείο χρήσης του, Phase 1C-B).
 * Κανένα υπάρχον component μελέτης/περιεχομένου/προόδου δεν διαβάζει το registry.
 */
import { Link, useOutletContext } from 'react-router-dom'
import { marked } from 'marked'
import { registry } from '../../core/academic/data/index.js'
import { getCourseById, getEnrollments, getRecordings } from '../../core/academic/selectors.js'
import { UNKNOWN } from '../../core/academic/schema.js'
import { useRouteIdentity } from '../../core/routing/hooks.js'
import { coursePath, termPath } from '../../core/routing/paths.js'
import Progress from '../../components/Progress.jsx'
import { progressPageView } from '../../components/progressDisplay.js'
import Home from '../Home.jsx'
import NotFound from './NotFound.jsx'
import { getCourseNotes } from './courseNotesData.js'

const card = 'block rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 hover:border-teal-400'
const shown = (v) => (v === UNKNOWN ? '—' : v)

/** Ηχογραφήσεις ομαδοποιημένες ανά συνάντηση· κάθε μέρος ανοίγει στο Class Collaborate (σύνδεση EUC). */
function Recordings({ courseId }) {
  const list = getRecordings(registry, { courseId })
  if (list.length === 0) return null
  const sessions = []
  for (const r of list) {
    const last = sessions.at(-1)
    if (last?.session === r.session && last.enrollmentId === r.enrollmentId) last.parts.push(r)
    else sessions.push({ session: r.session, enrollmentId: r.enrollmentId, parts: [r] })
  }
  return (
    <section className="space-y-2" data-testid="course-recordings">
      <div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Ηχογραφήσεις</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">Ανοίγουν στο Class Collaborate · απαιτείται σύνδεση με λογαριασμό EUC.</p>
      </div>
      <ul className="space-y-2">
        {sessions.map((s) => (
          <li key={`${s.enrollmentId}:${s.session}`} className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3">
            <p className="font-semibold text-slate-900 dark:text-white">{s.session}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {s.parts.map((r) => (
                <a
                  key={r.id}
                  href={r.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-sm text-teal-700 dark:text-teal-300 hover:border-teal-400"
                >
                  ▶ Μέρος {r.part}
                </a>
              ))}
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}

/** Στυλ για το HTML που παράγει το Markdown των σημειώσεων (χωρίς plugin typography). */
const prose = [
  'text-sm leading-relaxed text-slate-700 dark:text-slate-200',
  '[&_h2]:mt-6 [&_h2]:mb-2 [&_h2]:text-base [&_h2]:font-bold [&_h2]:text-slate-900 dark:[&_h2]:text-white',
  '[&_h3]:mt-5 [&_h3]:mb-2 [&_h3]:font-semibold [&_h3]:text-teal-800 dark:[&_h3]:text-teal-300',
  '[&_h4]:mt-4 [&_h4]:mb-1 [&_h4]:font-semibold [&_h4]:text-slate-900 dark:[&_h4]:text-white',
  '[&_p]:my-2 [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:my-1',
  '[&_strong]:font-semibold [&_strong]:text-slate-900 dark:[&_strong]:text-white',
  '[&_code]:rounded [&_code]:bg-slate-100 dark:[&_code]:bg-slate-800 [&_code]:px-1 [&_code]:text-xs [&_code]:text-slate-500 dark:[&_code]:text-slate-400',
  '[&_blockquote]:my-3 [&_blockquote]:border-l-4 [&_blockquote]:border-teal-300 [&_blockquote]:pl-3 [&_blockquote]:text-xs [&_blockquote]:text-slate-500 dark:[&_blockquote]:text-slate-400',
  '[&_hr]:my-5 [&_hr]:border-slate-200 dark:[&_hr]:border-slate-700',
  '[&_table]:my-3 [&_table]:block [&_table]:max-w-full [&_table]:overflow-x-auto [&_table]:border-collapse [&_table]:text-xs',
  '[&_th]:border [&_th]:border-slate-200 dark:[&_th]:border-slate-700 [&_th]:bg-slate-50 dark:[&_th]:bg-slate-800 [&_th]:px-2 [&_th]:py-1 [&_th]:text-left',
  '[&_td]:border [&_td]:border-slate-200 dark:[&_td]:border-slate-700 [&_td]:px-2 [&_td]:py-1 [&_td]:align-top',
].join(' ')

/** Σημειώσεις ανά συνάντηση (Markdown από content/courses/<id>/notes), σε πτυσσόμενες ενότητες. */
function Notes({ courseId }) {
  const notes = getCourseNotes(courseId)
  if (notes.length === 0) return null
  return (
    <section className="space-y-2" data-testid="course-notes">
      <div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Σημειώσεις</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Τα σημαντικότερα σημεία κάθε συνάντησης · οι χρόνοι <code>[mm:ss]</code> δείχνουν το σημείο στην ηχογράφηση.
        </p>
      </div>
      <div className="space-y-2">
        {notes.map((n) => (
          <details key={n.id} className="group rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-2 p-3 font-semibold text-slate-900 dark:text-white">
              <span>{n.title}</span>
              <span aria-hidden="true" className="text-slate-400 transition-transform group-open:rotate-90">›</span>
            </summary>
            <div className={`border-t border-slate-200 dark:border-slate-700 px-3 pb-4 ${prose}`} dangerouslySetInnerHTML={{ __html: marked.parse(n.body) }} />
          </details>
        ))}
      </div>
    </section>
  )
}

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
      <Recordings courseId={id.courseId} />
      <Notes courseId={id.courseId} />
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
