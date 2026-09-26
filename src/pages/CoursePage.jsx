import { Link, Navigate, useParams } from 'react-router-dom'
import { daysUntil, formatExamDate, getCourse } from '../courses/registry.js'

/** Αρχική σελίδα μαθήματος χωρίς ακόμη περιεχόμενο (σκελετός). */
export default function CoursePage() {
  const { courseId } = useParams()
  const course = getCourse(courseId?.toLowerCase() ?? '')
  if (!course) return <Navigate to="/" replace />

  const days = daysUntil(course.examDate)

  return (
    <div className="space-y-6 animate-[fadeIn_0.4s_ease-out]">
      <div className="text-center py-10 px-4 rounded-2xl bg-gradient-to-b from-teal-50 to-stone-50 dark:from-teal-950/30 dark:to-slate-900 border border-teal-100 dark:border-teal-900">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-teal-700 dark:text-teal-300">
          {course.code} · {course.term}
          {course.group === 'carryOver' ? ` · χρωστούμενο ${course.semester}` : ` · ${course.semester}`}
        </p>
        <h1 className="text-2xl sm:text-4xl font-bold text-slate-900 dark:text-white mt-2 text-balance">{course.title}</h1>
        {course.examDate ? (
          <p className="text-slate-600 dark:text-slate-300 mt-3 text-sm">
            Εξέταση: {formatExamDate(course.examDate)}
            {course.examTime ? ` · ${course.examTime}` : ''}
            {days !== null && days >= 0 ? ` · σε ${days} ημέρες` : ''}
          </p>
        ) : (
          <p className="text-slate-500 dark:text-slate-400 mt-3 text-sm">Εξέταση: ημερομηνία προς επιβεβαίωση</p>
        )}
        {course.instructor ? <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{course.instructor}</p> : null}
      </div>

      <section className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 p-5 text-sm text-slate-600 dark:text-slate-300">
        <p className="font-semibold text-slate-800 dark:text-slate-100">Το υλικό έρχεται σύντομα</p>
        <p className="mt-1.5">
          Οι εβδομάδες (θεωρία, κάρτες, κουίζ, εξέταση) θα προστεθούν μόλις ανέβουν διαφάνειες και σημειώσεις του μαθήματος.
        </p>
      </section>

      <Link to="/" className="inline-block text-sm text-teal-700 dark:text-teal-300 hover:underline">
        ← Όλα τα μαθήματα
      </Link>
    </div>
  )
}
