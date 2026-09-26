import CourseCard from '../components/CourseCard.jsx'
import { COURSES, CURRENT_TERM, byExamDate } from '../courses/registry.js'

function Section({ title, hint, courses }) {
  if (courses.length === 0) return null
  return (
    <section>
      <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400">{title}</h2>
      {hint ? <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{hint}</p> : null}
      <div className="grid gap-3 sm:grid-cols-2 mt-3">
        {courses.map((c) => (
          <CourseCard key={c.id} course={c} />
        ))}
      </div>
    </section>
  )
}

export default function Home() {
  const current = COURSES.filter((c) => c.group === 'current').sort(byExamDate)
  const carryOver = COURSES.filter((c) => c.group === 'carryOver').sort(byExamDate)
  const archive = COURSES.filter((c) => c.group === 'archive')

  return (
    <div className="space-y-8 animate-[fadeIn_0.4s_ease-out]">
      <div className="text-center py-10 px-4 rounded-2xl bg-gradient-to-b from-teal-50 to-stone-50 dark:from-teal-950/30 dark:to-slate-900 border border-teal-100 dark:border-teal-900">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-teal-700 dark:text-teal-300">
          {CURRENT_TERM.label} · {CURRENT_TERM.semester}
        </p>
        <h1 className="text-2xl sm:text-4xl font-bold text-slate-900 dark:text-white mt-2 text-balance">
          Exam Prep System
        </h1>
        <p className="text-slate-600 dark:text-slate-300 mt-3 max-w-lg mx-auto text-sm sm:text-base">
          Θεωρία, κάρτες, κουίζ, λειτουργία εξέτασης και πρόοδος — ανά μάθημα και εβδομάδα.
        </p>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-4 max-w-lg mx-auto">
          Exam Prep by Ilias Tzoukas · όχι επίσημο υλικό ιδρύματος, προσωπική μελέτη.
        </p>
      </div>

      <Section title={`Μαθήματα ${CURRENT_TERM.semester}`} hint="Ταξινόμηση κατά ημερομηνία εξέτασης." courses={current} />
      <Section title="Χρωστούμενα" hint="Μαθήματα προηγούμενων εξαμήνων που δίνονται αυτή την περίοδο." courses={carryOver} />
      <Section title="Προηγούμενα εξάμηνα" hint="Το υλικό μένει διαθέσιμο για επανάληψη." courses={archive} />
    </div>
  )
}
