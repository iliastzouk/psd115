import { useOutletContext } from 'react-router-dom'
import Flashcard from '../components/Flashcard.jsx'

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
