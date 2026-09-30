import { Link } from 'react-router-dom'
import { courseIdentity, courseUnits, DEFAULT_COURSE_ID } from '../core/routing/navigation.js'
import { unitPresentation } from './routing/coursePresentation.js'

/** Αρχική μαθήματος με περιεχόμενο: οι units προέρχονται από την ακαδημαϊκή δομή (course.js). */
export default function Home({ courseId = DEFAULT_COURSE_ID }) {
  const course = courseIdentity(courseId)
  return (
    <div className="space-y-8 animate-[fadeIn_0.4s_ease-out]">
      <div className="text-center py-10 px-4 rounded-2xl bg-gradient-to-b from-teal-50 to-stone-50 dark:from-teal-950/30 dark:to-slate-900 border border-teal-100 dark:border-teal-900">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-teal-700 dark:text-teal-300">{course.code}</p>
        <h1 className="text-2xl sm:text-4xl font-bold text-slate-900 dark:text-white mt-2 text-balance">
          Exam Prep System
        </h1>
        <p className="text-slate-600 dark:text-slate-300 mt-3 max-w-lg mx-auto text-sm sm:text-base">
          Θεωρία, κάρτες, κουίζ, λειτουργία εξέτασης και πρόοδος — δομημένο ανά εβδομάδα για εύκολη επέκταση.
        </p>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-4 max-w-lg mx-auto">
          {course.code} Exam Prep by Ilias Tzoukas · όχι επίσημο υλικό ιδρύματος, προσωπική μελέτη.
        </p>
      </div>

      <section>
        <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-3">Εβδομάδες</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {courseUnits(courseId).map((u) => {
            const look = unitPresentation(courseId, u.unitId)
            return (
              <Link
                key={u.unitId}
                to={u.path}
                className={`block rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 shadow-sm ${look?.card ?? 'hover:border-teal-400'} transition group`}
              >
                <p className={`text-xs font-medium ${look?.badge ?? 'text-teal-600 dark:text-teal-400'}`}>Διαθέσιμο</p>
                <p className={`text-lg font-bold text-slate-900 dark:text-white mt-1 ${look?.heading ?? ''}`}>
                  {u.label} — {u.title}
                </p>
                {look?.blurb ? <p className="text-sm text-slate-600 dark:text-slate-300 mt-2">{look.blurb}</p> : null}
              </Link>
            )
          })}
        </div>
      </section>
    </div>
  )
}
