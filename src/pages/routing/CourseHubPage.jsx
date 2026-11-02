import { Link } from 'react-router-dom'
import { COURSE_STATUS_LABEL, COURSE_STATUS_NOTE } from '../../core/routing/courseHub.js'
import { appCourseHub } from '../../core/routing/navigation.js'
import { APP_NAME } from '../../layouts/courseNav.js'

/**
 * Αρχική μαθημάτων (`/`, Φάση 6c): εξάμηνα και μαθήματα από το registry, κατάσταση υλικού από τον κατάλογο περιεχομένου.
 * Δεν διαβάζει πρόοδο ή storage· κανένα μάθημα στον κώδικα.
 */
const hub = appCourseHub()

const SECTION_SUFFIX = { current: 'τρέχον εξάμηνο', upcoming: 'επόμενο εξάμηνο', past: 'προηγούμενο εξάμηνο' }
const sectionTitle = (s) => (s.role === 'unassigned' ? 'Χωρίς εξάμηνο' : SECTION_SUFFIX[s.role] ? `${s.label} · ${SECTION_SUFFIX[s.role]}` : s.label)

const STATUS_CLASS = {
  'has-content': 'text-teal-700 dark:text-teal-300',
  'no-content': 'text-slate-500 dark:text-slate-400',
}

export default function CourseHubPage() {
  return (
    <div data-testid="course-hub" className="space-y-8 animate-[fadeIn_0.4s_ease-out]">
      <div className="text-center py-10 px-4 rounded-2xl bg-gradient-to-b from-teal-50 to-stone-50 dark:from-teal-950/30 dark:to-slate-900 border border-teal-100/80 dark:border-teal-900/40">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-teal-700 dark:text-teal-300">{APP_NAME}</p>
        <h1 className="text-2xl sm:text-4xl font-bold text-slate-900 dark:text-white mt-2 text-balance">Μαθήματα</h1>
        <p className="text-slate-600 dark:text-slate-300 mt-3 max-w-lg mx-auto text-sm sm:text-base">
          Θεωρία, κάρτες, κουίζ, λειτουργία εξέτασης και πρόοδος — χωριστά για κάθε μάθημα.
        </p>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-4 max-w-lg mx-auto">Όχι επίσημο υλικό ιδρύματος, προσωπική μελέτη.</p>
      </div>

      {hub.sections.map((s) => (
        <section key={s.termId ?? 'unassigned'} aria-label={sectionTitle(s)}>
          <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-3">{sectionTitle(s)}</h2>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {s.courses.map((c) => (
              <li key={c.courseId}>
                <Link
                  to={c.path}
                  data-testid="course-card"
                  className="block h-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 shadow-sm hover:border-teal-400 transition"
                >
                  <p className="text-xs font-bold tracking-wide text-teal-700 dark:text-teal-300">{c.code}</p>
                  <p className="text-lg font-bold text-slate-900 dark:text-white mt-1">{c.title}</p>
                  <p className={`text-sm mt-2 ${STATUS_CLASS[c.status]}`}>{COURSE_STATUS_LABEL[c.status]}</p>
                  {c.examDate ? <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Εξέταση: {c.examDate}</p> : null}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}

      <p className="text-xs text-slate-500 dark:text-slate-400">{COURSE_STATUS_NOTE}</p>
    </div>
  )
}
