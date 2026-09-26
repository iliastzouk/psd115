import { Link } from 'react-router-dom'
import { daysUntil, formatExamDate } from '../courses/registry.js'

/** Πλήρη ονόματα κλάσεων ώστε να τα βρίσκει το Tailwind. */
export const ACCENT = {
  teal: { hover: 'hover:border-teal-400 dark:hover:border-teal-600', code: 'text-teal-700 dark:text-teal-300', bar: 'bg-teal-500' },
  sky: { hover: 'hover:border-sky-400 dark:hover:border-sky-600', code: 'text-sky-700 dark:text-sky-300', bar: 'bg-sky-500' },
  emerald: {
    hover: 'hover:border-emerald-400 dark:hover:border-emerald-600',
    code: 'text-emerald-700 dark:text-emerald-300',
    bar: 'bg-emerald-500',
  },
  violet: {
    hover: 'hover:border-violet-400 dark:hover:border-violet-600',
    code: 'text-violet-700 dark:text-violet-300',
    bar: 'bg-violet-500',
  },
  amber: { hover: 'hover:border-amber-400 dark:hover:border-amber-600', code: 'text-amber-700 dark:text-amber-300', bar: 'bg-amber-500' },
  rose: { hover: 'hover:border-rose-400 dark:hover:border-rose-600', code: 'text-rose-700 dark:text-rose-300', bar: 'bg-rose-500' },
}

function ExamLine({ course }) {
  if (!course.examDate) {
    return <p className="text-xs text-slate-500 dark:text-slate-400">Εξέταση: ημερομηνία προς επιβεβαίωση</p>
  }
  const days = daysUntil(course.examDate)
  return (
    <p className="text-xs text-slate-600 dark:text-slate-300">
      Εξέταση: {formatExamDate(course.examDate)}
      {course.examTime ? ` · ${course.examTime}` : ''}
      {days !== null && days >= 0 ? (
        <span className="ml-1.5 inline-block rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.5 font-medium text-slate-700 dark:text-slate-200">
          {days === 0 ? 'σήμερα' : `σε ${days} ημ.`}
        </span>
      ) : null}
    </p>
  )
}

export default function CourseCard({ course }) {
  const accent = ACCENT[course.accent] ?? ACCENT.teal
  return (
    <Link
      to={`/${course.id}`}
      className={`relative block overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 pl-6 shadow-sm transition group ${accent.hover}`}
    >
      <span aria-hidden className={`absolute inset-y-0 left-0 w-1.5 ${accent.bar}`} />
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <p className={`text-xs font-bold tracking-wide ${accent.code}`}>{course.code}</p>
        {course.group === 'carryOver' ? (
          <span className="rounded-full border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 text-[10px] font-medium text-amber-800 dark:text-amber-200">
            Χρωστούμενο · {course.semester}
          </span>
        ) : null}
        <span
          className={`ml-auto text-[10px] font-medium ${course.ready ? 'text-teal-600 dark:text-teal-400' : 'text-slate-400 dark:text-slate-500'}`}
        >
          {course.ready ? 'Διαθέσιμο' : 'Σύντομα'}
        </span>
      </div>
      <p className="text-lg font-bold text-slate-900 dark:text-white mt-1">{course.title}</p>
      <div className="mt-2 space-y-1">
        {course.group === 'archive' ? (
          <p className="text-xs text-slate-600 dark:text-slate-300">
            {course.term} · {course.semester}
          </p>
        ) : (
          <ExamLine course={course} />
        )}
        {course.instructor ? <p className="text-xs text-slate-500 dark:text-slate-400">{course.instructor}</p> : null}
      </div>
    </Link>
  )
}
