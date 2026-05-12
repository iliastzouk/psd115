import { useOutletContext } from 'react-router-dom'
import QuizCard from '../components/QuizCard.jsx'
import StudyCategoryFilter from '../components/StudyCategoryFilter.jsx'

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
      <StudyCategoryFilter CATEGORIES={CATEGORIES} selectedIds={selectedIds} toggleCategory={toggleCategory} />

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
