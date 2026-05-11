import { useState } from 'react'

export default function Flashcard({
  card,
  categoryLabel,
  onNext,
  onMarkSeen,
  onRestart,
  hasNext,
}) {
  const [flipped, setFlipped] = useState(false)

  function handleFlip() {
    setFlipped((f) => !f)
  }

  function handleNext() {
    onMarkSeen?.(card.id)
    setFlipped(false)
    if (hasNext) {
      onNext?.()
    } else {
      onRestart?.()
    }
  }

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={handleFlip}
        className={[
          'touch-manipulation relative w-full min-h-[200px] sm:min-h-[220px] rounded-2xl border p-4 sm:p-6 text-left shadow-sm transition-all duration-300',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/60',
          flipped
            ? 'bg-teal-50 dark:bg-teal-950/40 border-teal-200 dark:border-teal-800'
            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 active:scale-[0.99]',
        ].join(' ')}
        aria-label={flipped ? 'Απόκρυψη απάντησης' : 'Εμφάνιση απάντησης'}
      >
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-2">
          {categoryLabel}
        </p>
        <p className="text-base sm:text-lg leading-relaxed text-slate-900 dark:text-slate-100 text-pretty break-words">
          {flipped ? card.back : card.front}
        </p>
        <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
          {flipped ? 'Πάτησε την κάρτα για ερώτηση' : 'Πάτησε την κάρτα για απάντηση'}
        </p>
      </button>

      <div className="mt-4 flex gap-3 justify-center">
        <button
          type="button"
          onClick={handleNext}
          className="touch-manipulation w-full sm:w-auto rounded-xl bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white px-5 py-3 text-sm font-medium transition-colors min-h-[48px]"
        >
          {hasNext ? 'Επόμενη κάρτα' : 'Από την αρχή'}
        </button>
      </div>
    </div>
  )
}
