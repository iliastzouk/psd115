import { useCallback, useEffect, useMemo, useState } from 'react'
import Flashcard from './components/Flashcard.jsx'
import QuizCard from './components/QuizCard.jsx'
import Progress from './components/Progress.jsx'
import WrongAnswersReview from './components/WrongAnswersReview.jsx'
import DefinitionLesson from './components/DefinitionLesson.jsx'
import { CATEGORIES, flashcards, quizQuestions, getCategoryLabel } from './data/questions.js'
import { shuffle } from './utils/shuffle.js'
import {
  defaultProgress,
  loadProgress,
  loadTheme,
  resetProgress,
  saveProgress,
  saveTheme,
} from './utils/storage.js'

function filterByCategories(items, selectedIds) {
  if (!selectedIds.length) return items
  return items.filter((item) => selectedIds.includes(item.categoryId))
}

function newUid() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export default function App() {
  const [dark, setDark] = useState(false)
  const [progress, setProgress] = useState(defaultProgress)
  const [mode, setMode] = useState('cards')
  const [selectedIds, setSelectedIds] = useState([])

  const [cardOrder, setCardOrder] = useState([])
  const [cardIndex, setCardIndex] = useState(0)

  const [quizActive, setQuizActive] = useState(false)
  const [quizDeck, setQuizDeck] = useState([])
  const [quizIndex, setQuizIndex] = useState(0)
  const [quizSelected, setQuizSelected] = useState(null)
  const [quizRevealed, setQuizRevealed] = useState(false)
  const [sessionCorrect, setSessionCorrect] = useState(0)
  const [quizResult, setQuizResult] = useState(null)
  const [lessonResetKey, setLessonResetKey] = useState(0)

  useEffect(() => {
    setProgress(loadProgress())
    const t = loadTheme()
    setDark(t === 'dark')
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    saveTheme(dark ? 'dark' : 'light')
  }, [dark])

  useEffect(() => {
    saveProgress(progress)
  }, [progress])

  const filteredCards = useMemo(
    () => filterByCategories(flashcards, selectedIds),
    [selectedIds],
  )

  const filteredQuiz = useMemo(
    () => filterByCategories(quizQuestions, selectedIds),
    [selectedIds],
  )

  const definitionFlashcardsOnly = useMemo(
    () => flashcards.filter((c) => c.categoryId === 'definition'),
    [],
  )

  useEffect(() => {
    setCardOrder(shuffle(filteredCards.map((c) => c.id)))
    setCardIndex(0)
  }, [filteredCards])

  const currentCard = useMemo(() => {
    const id = cardOrder[cardIndex]
    return filteredCards.find((c) => c.id === id) ?? filteredCards[0]
  }, [cardOrder, cardIndex, filteredCards])

  const toggleCategory = useCallback((id) => {
    setSelectedIds((prev) => {
      if (id === 'all') return []
      const has = prev.includes(id)
      if (has) return prev.filter((x) => x !== id)
      return [...prev, id]
    })
  }, [])

  const markFlashSeen = useCallback((id) => {
    setProgress((p) => {
      if (p.flashcardSeenIds.includes(id)) return p
      return { ...p, flashcardSeenIds: [...p.flashcardSeenIds, id] }
    })
  }, [])

  const goNextCard = useCallback(() => {
    setCardIndex((i) => Math.min(i + 1, Math.max(filteredCards.length - 1, 0)))
  }, [filteredCards.length])

  const restartCards = useCallback(() => {
    setCardOrder(shuffle(filteredCards.map((c) => c.id)))
    setCardIndex(0)
  }, [filteredCards])

  const startQuiz = useCallback(() => {
    const deck = shuffle(filteredQuiz)
    if (!deck.length) return
    setQuizDeck(deck)
    setQuizIndex(0)
    setQuizSelected(null)
    setQuizRevealed(false)
    setSessionCorrect(0)
    setQuizResult(null)
    setQuizActive(true)
  }, [filteredQuiz])

  const currentQuestion = quizDeck[quizIndex]

  const handleSelectOption = useCallback(
    (idx) => {
      if (quizRevealed || !currentQuestion) return
      setQuizSelected(idx)
      setQuizRevealed(true)
      const correct = idx === currentQuestion.correctIndex
      setSessionCorrect((s) => (correct ? s + 1 : s))

      setProgress((p) => {
        const cat = currentQuestion.categoryId
        const prev = p.byCategory[cat] || { correct: 0, wrong: 0 }
        const nextCat = {
          ...prev,
          correct: prev.correct + (correct ? 1 : 0),
          wrong: prev.wrong + (correct ? 0 : 1),
        }
        const wrongBook = [...p.wrongBook]
        if (!correct) {
          wrongBook.push({
            uid: newUid(),
            id: currentQuestion.id,
            categoryId: cat,
            question: currentQuestion.question,
            explanation: currentQuestion.explanation,
            userLabel: currentQuestion.options[idx],
            correctLabel: currentQuestion.options[currentQuestion.correctIndex],
          })
          while (wrongBook.length > 60) wrongBook.shift()
        }
        return {
          ...p,
          quizAnswered: p.quizAnswered + 1,
          quizCorrect: p.quizCorrect + (correct ? 1 : 0),
          byCategory: { ...p.byCategory, [cat]: nextCat },
          wrongBook,
        }
      })
    },
    [currentQuestion, quizRevealed],
  )

  const handleQuizContinue = useCallback(() => {
    if (quizIndex >= quizDeck.length - 1) {
      setQuizResult({ correct: sessionCorrect, total: quizDeck.length })
      setQuizActive(false)
      return
    }
    setQuizIndex((i) => i + 1)
    setQuizSelected(null)
    setQuizRevealed(false)
  }, [quizDeck.length, quizIndex, sessionCorrect])

  const handleResetAll = useCallback(() => {
    if (!window.confirm('Να διαγραφεί όλη η αποθηκευμένη πρόοδος;')) return
    resetProgress()
    setProgress(defaultProgress())
    setQuizActive(false)
    setLessonResetKey((k) => k + 1)
  }, [])

  const clearWrongBook = useCallback(() => {
    setProgress((p) => ({ ...p, wrongBook: [] }))
  }, [])

  const removeWrongOne = useCallback((uid) => {
    setProgress((p) => ({
      ...p,
      wrongBook: p.wrongBook.filter((w) => w.uid !== uid),
    }))
  }, [])

  const resultPct =
    quizResult && quizResult.total ? Math.round((quizResult.correct / quizResult.total) * 100) : 0

  const shell = 'w-full max-w-md sm:max-w-xl lg:max-w-2xl mx-auto'

  return (
    <div className="min-h-dvh bg-stone-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-[max(2.5rem,env(safe-area-inset-bottom))] transition-colors duration-300">
      <header className="sticky top-0 z-10 border-b border-slate-200/80 dark:border-slate-800 bg-stone-50/95 dark:bg-slate-950/95 backdrop-blur-md">
        <div
          className={`${shell} px-4 sm:px-5 pt-[max(1rem,env(safe-area-inset-top))] pb-3`}
        >
          <div className="flex flex-col gap-3 min-[400px]:flex-row min-[400px]:items-start min-[400px]:justify-between">
            <div className="min-w-0 pr-2">
              <p className="text-xs text-teal-700 dark:text-teal-300 font-medium">PSD115 · Εβδομάδα 1</p>
              <h1 className="text-lg min-[400px]:text-xl font-bold leading-snug text-balance">
                Ψυχολογία: Η εξέλιξη μιας επιστήμης
              </h1>
            </div>
            <div className="flex flex-row min-[400px]:flex-col items-stretch min-[400px]:items-end gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setDark((d) => !d)}
                className="touch-manipulation rounded-full border border-slate-300 dark:border-slate-600 px-3 py-2 min-h-[44px] text-xs font-medium hover:bg-slate-100 dark:hover:bg-slate-900 transition sm:min-h-0"
              >
                {dark ? 'Φωτεινό' : 'Σκοτεινό'}
              </button>
              <button
                type="button"
                onClick={handleResetAll}
                className="touch-manipulation text-left min-[400px]:text-right text-[11px] text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 underline-offset-2 hover:underline py-2 min-h-[44px] min-[400px]:min-h-0 min-[400px]:py-0"
              >
                Επαναφορά προόδου
              </button>
            </div>
          </div>

          <nav className="mt-4 grid grid-cols-2 min-[480px]:flex rounded-xl bg-slate-200/70 dark:bg-slate-800/80 p-1 text-xs min-[480px]:text-sm font-medium gap-1 min-[480px]:gap-0">
            {[
              { id: 'lesson', label: 'Μάθημα' },
              { id: 'cards', label: 'Κάρτες' },
              { id: 'quiz', label: 'Κουίζ' },
              { id: 'review', label: 'Λάθη' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setMode(tab.id)
                  if (tab.id !== 'quiz') setQuizActive(false)
                }}
                className={[
                  'min-[480px]:flex-1 touch-manipulation rounded-lg py-3 min-[400px]:py-2.5 transition-all duration-200 min-h-[44px] min-[400px]:min-h-0',
                  mode === tab.id
                    ? 'bg-white dark:bg-slate-900 shadow text-slate-900 dark:text-slate-100'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white',
                ].join(' ')}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className={`${shell} px-4 sm:px-5 pt-5 space-y-5`}>
        <section>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">Κατηγορίες</p>
          <div className="-mx-4 px-4 sm:mx-0 sm:px-0">
            <div className="flex gap-2 overflow-x-auto pb-1 snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] sm:flex-wrap sm:overflow-visible sm:snap-none [&::-webkit-scrollbar]:hidden">
              <button
                type="button"
                onClick={() => toggleCategory('all')}
                className={[
                  'touch-manipulation shrink-0 snap-start rounded-full px-3 py-2 text-xs border transition min-h-[40px]',
                  selectedIds.length === 0
                    ? 'border-teal-600 bg-teal-600 text-white'
                    : 'border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200',
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
                      'touch-manipulation shrink-0 snap-start rounded-full px-3 py-2 text-xs border transition max-w-[min(85vw,18rem)] sm:max-w-none text-left leading-tight min-h-[40px]',
                      on
                        ? 'border-teal-600 bg-teal-50 dark:bg-teal-950/50 text-teal-900 dark:text-teal-100'
                        : 'border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200',
                    ].join(' ')}
                    title={c.label}
                  >
                    {c.label}
                  </button>
                )
              })}
            </div>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
            Άδεια επιλογή = όλες οι κατηγορίες. Διάλεξε μία ή περισσότερες για στοχευμένη μελέτη.
          </p>
        </section>

        {mode === 'lesson' && (
          <p className="text-xs text-slate-600 dark:text-slate-400 rounded-xl bg-teal-50/80 dark:bg-teal-950/30 border border-teal-100 dark:border-teal-900 px-3 py-2">
            Στο <strong>Μάθημα</strong> βρίσκεται το πλήρες κεφάλαιο «Ορισμός της Ψυχολογίας». Οι <strong>Κατηγορίες</strong>{' '}
            από κάτω επηρεάζουν μόνο τις καρτέλες <strong>Κάρτες</strong> και <strong>Κουίζ</strong>.
          </p>
        )}

        <Progress
          progress={progress}
          totalFlashcards={flashcards.length}
          totalQuiz={quizQuestions.length}
        />

        {mode === 'lesson' && (
          <DefinitionLesson
            key={lessonResetKey}
            definitionFlashcards={definitionFlashcardsOnly}
            onMarkFlashSeen={markFlashSeen}
          />
        )}

        {mode === 'cards' && (
          <section className="space-y-3">
            <div className="flex justify-between text-sm text-slate-600 dark:text-slate-300">
              <span>
                Κάρτα {filteredCards.length ? cardIndex + 1 : 0}/{filteredCards.length}
              </span>
              <button
                type="button"
                onClick={restartCards}
                className="text-teal-700 dark:text-teal-300 hover:underline text-xs"
              >
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
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Δεν υπάρχουν κάρτες για τις επιλεγμένες κατηγορίες.
              </p>
            )}
          </section>
        )}

        {mode === 'quiz' && (
          <section className="space-y-4">
            {!quizActive && (
              <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 space-y-3">
                <p className="text-sm text-slate-700 dark:text-slate-200">
                  Το κουίζ χρησιμοποιεί τυχαία σειρά. Μετά από κάθε απάντηση εμφανίζεται σύντομη εξήγηση. Η πρόοδος
                  αποθηκεύεται τοπικά στον browser.
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Διαθέσιμες ερωτήσεις με φίλτρο: {filteredQuiz.length}
                </p>
                {quizResult && quizResult.total > 0 && (
                  <div className="rounded-xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 p-4 text-center transition-all duration-300 animate-[fadeIn_0.35s_ease-out]">
                    <p className="text-xs font-medium text-teal-800 dark:text-teal-200 uppercase tracking-wide">
                      Αποτέλεσμα τελευταίας σειράς
                    </p>
                    <p className="text-3xl font-bold text-teal-900 dark:text-teal-100 mt-1">{resultPct}%</p>
                    <p className="text-sm text-teal-800/90 dark:text-teal-200/90">
                      {quizResult.correct} σωστές από {quizResult.total} ερωτήσεις
                    </p>
                  </div>
                )}
                <button
                  type="button"
                  onClick={startQuiz}
                  disabled={!filteredQuiz.length}
                  className="w-full rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-40 text-white py-3 text-sm font-semibold transition min-h-[48px]"
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

            {quizActive && !currentQuestion && (
              <p className="text-sm text-slate-600 dark:text-slate-300">Φόρτωση...</p>
            )}
          </section>
        )}

        {mode === 'review' && (
          <WrongAnswersReview
            items={progress.wrongBook}
            onClear={clearWrongBook}
            onClearOne={removeWrongOne}
          />
        )}
      </main>
    </div>
  )
}
