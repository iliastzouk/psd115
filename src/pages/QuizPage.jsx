import { useOutletContext } from 'react-router-dom'
import QuizCard from '../components/QuizCard.jsx'

export default function QuizPage() {
  const {
    CATEGORIES,
    selectedIds,
    toggleCategory,
    filteredQuiz,
    quizActive,
    startQuiz,
    quizDeck,
    quizIndex,
    currentQuestion,
    quizSelected,
    quizRevealed,
    handleSelectOption,
    handleQuizContinue,
    quizResult,
    resultPct,
    getCategoryLabel,
  } = useOutletContext()

  return (
    <div className="space-y-5">
      <section>
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">Κατηγορίες</p>
        <div className="-mx-4 px-4 sm:mx-0 sm:px-0">
          <div className="flex gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible [&::-webkit-scrollbar]:hidden">
            <button
              type="button"
              onClick={() => toggleCategory('all')}
              className={[
                'touch-manipulation shrink-0 rounded-full px-3 py-2 text-xs border min-h-[40px]',
                selectedIds.length === 0
                  ? 'border-teal-600 bg-teal-600 text-white'
                  : 'border-slate-300 dark:border-slate-600',
              ].join(' ')}
            >
              Όλες
            </button>
            {CATEGORIES.map((c) => {
              const on = selectedIds.includes(c.id)
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => toggleCategory(c.id)}
                  className={[
                    'touch-manipulation shrink-0 rounded-full px-3 py-2 text-xs border max-w-[min(85vw,18rem)] text-left min-h-[40px]',
                    on ? 'border-teal-600 bg-teal-50 dark:bg-teal-950/50' : 'border-slate-300 dark:border-slate-600',
                  ].join(' ')}
                >
                  {c.label}
                </button>
              )
            })}
          </div>
        </div>
      </section>

      <section className="space-y-4">
        {!quizActive && (
          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 space-y-3">
            <p className="text-sm text-slate-700 dark:text-slate-200">
              Τυχαία σειρά ερωτήσεων. Μετά την απάντηση εμφανίζεται εξήγηση. Η πρόοδος αποθηκεύεται τοπικά.
            </p>
            <p className="text-xs text-slate-500">Διαθέσιμες με φίλτρο: {filteredQuiz.length}</p>
            {quizResult && quizResult.total > 0 && (
              <div className="rounded-xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 p-4 text-center">
                <p className="text-xs font-medium text-teal-800 dark:text-teal-200 uppercase">Τελευταία σειρά</p>
                <p className="text-3xl font-bold text-teal-900 dark:text-teal-100 mt-1">{resultPct}%</p>
                <p className="text-sm text-teal-800/90">
                  {quizResult.correct}/{quizResult.total}
                </p>
              </div>
            )}
            <button
              type="button"
              onClick={startQuiz}
              disabled={!filteredQuiz.length}
              className="w-full rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-40 text-white py-3 text-sm font-semibold min-h-[48px]"
            >
              Έναρξη κουίζ
            </button>
          </div>
        )}

        {quizActive && currentQuestion && (
          <QuizCard
            question={currentQuestion}
            categoryLabel={getCategoryLabel(currentQuestion.categoryId)}
            selectedIndex={quizSelected}
            revealed={quizRevealed}
            onSelect={handleSelectOption}
            onContinue={handleQuizContinue}
            isLast={quizIndex >= quizDeck.length - 1}
          />
        )}
      </section>
    </div>
  )
}
