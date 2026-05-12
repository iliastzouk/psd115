import { useOutletContext } from 'react-router-dom'
import Flashcard from '../components/Flashcard.jsx'
import StudyCategoryFilter from '../components/StudyCategoryFilter.jsx'

export default function FlashcardsPage() {
  const {
    CATEGORIES,
    selectedIds,
    toggleCategory,
    filteredCards,
    cardIndex,
    currentCard,
    restartCards,
    goNextCard,
    markFlashSeen,
    getCategoryLabel,
  } = useOutletContext()

  return (
    <div className="space-y-5">
      <StudyCategoryFilter CATEGORIES={CATEGORIES} selectedIds={selectedIds} toggleCategory={toggleCategory} />

      <section className="space-y-3">
        <div className="flex justify-between text-sm text-slate-600 dark:text-slate-300">
          <span>
            Κάρτα {filteredCards.length ? cardIndex + 1 : 0}/{filteredCards.length}
          </span>
          <button type="button" onClick={restartCards} className="text-teal-700 dark:text-teal-300 text-xs hover:underline">
            Ανακάτεμα
          </button>
        </div>
        {currentCard ? (
          <Flashcard
            card={currentCard}
            categoryLabel={getCategoryLabel(currentCard.categoryId)}
            hasNext={cardIndex < filteredCards.length - 1}
            onNext={goNextCard}
            onRestart={restartCards}
            onMarkSeen={markFlashSeen}
          />
        ) : (
          <p className="text-sm text-slate-600 dark:text-slate-300">Δεν υπάρχουν κάρτες για το φίλτρο.</p>
        )}
      </section>
    </div>
  )
}
