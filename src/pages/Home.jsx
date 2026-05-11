import { Link } from 'react-router-dom'

export default function Home() {
  return (
    <div className="space-y-8 animate-[fadeIn_0.4s_ease-out]">
      <div className="text-center py-10 px-4 rounded-2xl bg-gradient-to-b from-teal-50 to-stone-50 dark:from-teal-950/30 dark:to-slate-900 border border-teal-100 dark:border-teal-900">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-teal-700 dark:text-teal-300">PSD115</p>
        <h1 className="text-2xl sm:text-4xl font-bold text-slate-900 dark:text-white mt-2 text-balance">
          Exam Prep System
        </h1>
        <p className="text-slate-600 dark:text-slate-300 mt-3 max-w-lg mx-auto text-sm sm:text-base">
          Θεωρία, κάρτες, κουίζ, λειτουργία εξέτασης και πρόοδος — δομημένο ανά εβδομάδα για εύκολη επέκταση.
        </p>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-4 max-w-lg mx-auto">
          PSD115 Exam Prep by Ilias Tzoukas · όχι επίσημο υλικό ιδρύματος, προσωπική μελέτη.
        </p>
      </div>

      <section>
        <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-3">Εβδομάδες</h2>
        <Link
          to="/week/1"
          className="block rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 shadow-sm hover:border-teal-400 dark:hover:border-teal-600 transition group"
        >
          <p className="text-xs font-medium text-teal-600 dark:text-teal-400">Διαθέσιμο</p>
          <p className="text-lg font-bold text-slate-900 dark:text-white mt-1 group-hover:text-teal-700 dark:group-hover:text-teal-300">
            Εβδομάδα 1 — Η εξέλιξη μιας επιστήμης
          </p>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-2">
            Ορισμός, φιλόσοφοι, σχολές, κλάδοι (υπό ανάπτυξη ανά θέμα).
          </p>
        </Link>
      </section>
    </div>
  )
}
