export default function QuizCard({
  question,
  categoryLabel,
  selectedIndex,
  revealed,
  onSelect,
  onContinue,
  isLast,
}) {
  const isCorrect = revealed && selectedIndex === question.correctIndex

  return (
    <div className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 sm:p-5 shadow-sm transition-all duration-300 animate-[fadeIn_0.35s_ease-out]">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1">
        {categoryLabel}
        {question.type === 'tf' ? ' · Σ/Λ' : ' · Πολλαπλής'}
      </p>
      <h2 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-slate-100 leading-snug mb-4 text-pretty break-words">
        {question.question}
      </h2>

      <ul className="space-y-2">
        {question.options.map((opt, idx) => {
          let btn =
            'touch-manipulation w-full text-left rounded-xl border px-4 py-3 text-sm transition-all duration-200 min-h-[52px] sm:min-h-[48px] break-words text-pretty '
          if (!revealed) {
            btn +=
              selectedIndex === idx
                ? 'border-teal-500 bg-teal-50 dark:bg-teal-950/50 text-slate-900 dark:text-slate-100'
                : 'border-slate-200 dark:border-slate-600 hover:border-teal-300 dark:hover:border-teal-700 text-slate-800 dark:text-slate-100'
          } else {
            if (idx === question.correctIndex) {
              btn += 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-slate-900 dark:text-slate-100'
            } else if (idx === selectedIndex) {
              btn += 'border-rose-500 bg-rose-50 dark:bg-rose-950/40 text-slate-900 dark:text-slate-100'
            } else {
              btn += 'border-slate-200 dark:border-slate-700 opacity-60'
            }
          }

          return (
            <li key={idx}>
              <button
                type="button"
                className={btn}
                disabled={revealed}
                onClick={() => onSelect(idx)}
              >
                {opt}
              </button>
            </li>
          )
        })}
      </ul>

      {revealed && (
        <div
          className={[
            'mt-4 rounded-xl p-4 text-sm leading-relaxed border transition-all duration-300',
            isCorrect
              ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-100'
              : 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-950 dark:text-amber-100',
          ].join(' ')}
        >
          <p className="font-semibold mb-1">{isCorrect ? 'Σωστά!' : 'Λάθος απάντηση'}</p>
          <p className="text-slate-800 dark:text-slate-200">{question.explanation}</p>
        </div>
      )}

      {revealed && (
        <button
          type="button"
          onClick={onContinue}
          className="touch-manipulation mt-4 w-full rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 py-3 text-sm font-medium hover:opacity-90 active:opacity-80 transition min-h-[48px]"
        >
          {isLast ? 'Τέλος κουίζ' : 'Συνέχεια'}
        </button>
      )}
    </div>
  )
}
