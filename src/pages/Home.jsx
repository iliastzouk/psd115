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
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Link
            to="/week/1"
            className="block rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 shadow-sm hover:border-teal-400 dark:hover:border-teal-600 transition group"
          >
            <p className="text-xs font-medium text-teal-600 dark:text-teal-400">Διαθέσιμο</p>
            <p className="text-lg font-bold text-slate-900 dark:text-white mt-1 group-hover:text-teal-700 dark:group-hover:text-teal-300">
              Εβδομάδα 1 — Η εξέλιξη μιας επιστήμης
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-2">
              Ορισμός, φιλόσοφοι, σχολές, κλάδοι.
            </p>
          </Link>
          <Link
            to="/week/2"
            className="block rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 shadow-sm hover:border-sky-400 dark:hover:border-sky-600 transition group"
          >
            <p className="text-xs font-medium text-sky-600 dark:text-sky-400">Διαθέσιμο</p>
            <p className="text-lg font-bold text-slate-900 dark:text-white mt-1 group-hover:text-sky-700 dark:group-hover:text-sky-300">
              Εβδομάδα 2 — Ερευνητικές μέθοδοι
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-2">
              Εμπειρισμός, παρατήρηση, πείραμα, δειγματοληψία, δεοντολογία.
            </p>
          </Link>
          <Link
            to="/week/3"
            className="block rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 shadow-sm hover:border-emerald-400 dark:hover:border-emerald-600 transition group"
          >
            <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Διαθέσιμο</p>
            <p className="text-lg font-bold text-slate-900 dark:text-white mt-1 group-hover:text-emerald-700 dark:group-hover:text-emerald-300">
              Εβδομάδα 3 — Βιολογικές βάσεις της συμπεριφοράς
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-2">
              Νευρώνες, σύναψη, εγκέφαλος, ΗΕΓ, απεικόνιση (K3).
            </p>
          </Link>
          <Link
            to="/week/4"
            className="block rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 shadow-sm hover:border-violet-400 dark:hover:border-violet-600 transition group"
          >
            <p className="text-xs font-medium text-violet-600 dark:text-violet-400">Διαθέσιμο</p>
            <p className="text-lg font-bold text-slate-900 dark:text-white mt-1 group-hover:text-violet-700 dark:group-hover:text-violet-300">
              Εβδομάδα 4 — Αίσθηση & αντίληψη
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-2">
              Ουδοί, όραση, ακοή, αφή, όσφρηση, γεύση (K4).
            </p>
          </Link>
        </div>
      </section>
    </div>
  )
}
