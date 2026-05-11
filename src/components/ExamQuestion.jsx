export default function ExamQuestion({ question, idealAnswer, revealed, onToggle }) {
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 sm:p-5 space-y-3">
      <p className="text-sm sm:text-base font-semibold text-slate-900 dark:text-slate-100 text-pretty">{question}</p>
      <button
        type="button"
        onClick={onToggle}
        className="touch-manipulation w-full sm:w-auto rounded-xl bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 px-4 py-3 text-sm font-medium min-h-[48px]"
      >
        {revealed ? 'Απόκρυψη πρότυπης απάντησης' : 'Εμφάνιση πρότυπης απάντησης'}
      </button>
      {revealed && (
        <div className="rounded-xl border border-teal-200 dark:border-teal-800 bg-teal-50/80 dark:bg-teal-950/30 p-4 text-sm text-slate-800 dark:text-slate-100 whitespace-pre-line leading-relaxed animate-[fadeIn_0.3s_ease-out]">
          {idealAnswer}
        </div>
      )}
    </div>
  )
}
