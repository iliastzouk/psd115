import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import {
  WEEK1_CATEGORIES,
  WEEK2_CATEGORIES,
  flashcards,
  quizQuestions,
  getCategoryLabel,
} from '../data/questions.js'
import { shuffle } from '../utils/shuffle.js'
import {
  defaultProgress,
  loadProgress,
  loadTheme,
  resetProgress,
  saveProgress,
  saveTheme,
} from '../utils/storage.js'

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

export function useStudySession() {
  const { pathname } = useLocation()
  const onWeek2 = pathname.startsWith('/week/2')

  const week1CategoryIds = useMemo(() => new Set(WEEK1_CATEGORIES.map((c) => c.id)), [])
  const week2CategoryIds = useMemo(() => new Set(WEEK2_CATEGORIES.map((c) => c.id)), [])

  const scopedFlashcards = useMemo(
    () => flashcards.filter((c) => (onWeek2 ? week2CategoryIds : week1CategoryIds).has(c.categoryId)),
    [onWeek2, week1CategoryIds, week2CategoryIds],
  )

  const scopedQuizQuestions = useMemo(
    () => quizQuestions.filter((q) => (onWeek2 ? week2CategoryIds : week1CategoryIds).has(q.categoryId)),
    [onWeek2, week1CategoryIds, week2CategoryIds],
  )

  const scopeCategories = onWeek2 ? WEEK2_CATEGORIES : WEEK1_CATEGORIES

  const [dark, setDark] = useState(false)
  const [progress, setProgress] = useState(defaultProgress)
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
    setDark(loadTheme() === 'dark')
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    saveTheme(dark ? 'dark' : 'light')
  }, [dark])

  useEffect(() => {
    saveProgress(progress)
  }, [progress])

  const filteredCards = useMemo(
    () => filterByCategories(scopedFlashcards, selectedIds),
    [selectedIds, scopedFlashcards],
  )

  const filteredQuiz = useMemo(
    () => filterByCategories(scopedQuizQuestions, selectedIds),
    [selectedIds, scopedQuizQuestions],
  )

  const filteredQuizSig = useMemo(() => filteredQuiz.map((q) => q.id).join('|'), [filteredQuiz])

  const definitionFlashcardsOnly = useMemo(
    () => flashcards.filter((c) => c.categoryId === 'definition'),
    [],
  )

  const philosopherFlashcardsOnly = useMemo(
    () => flashcards.filter((c) => c.categoryId === 'history'),
    [],
  )

  const wundtFlashcardsOnly = useMemo(
    () => flashcards.filter((c) => c.categoryId === 'structuralism'),
    [],
  )

  const functionalismFlashcardsOnly = useMemo(
    () => flashcards.filter((c) => c.categoryId === 'functionalism'),
    [],
  )

  const clinicalFlashcardsOnly = useMemo(
    () => flashcards.filter((c) => c.categoryId === 'clinical'),
    [],
  )

  const psychoanalysisFlashcardsOnly = useMemo(
    () => flashcards.filter((c) => c.categoryId === 'psychoanalysis'),
    [],
  )

  const humanisticFlashcardsOnly = useMemo(
    () => flashcards.filter((c) => c.categoryId === 'humanistic'),
    [],
  )

  const behaviorismFlashcardsOnly = useMemo(
    () => flashcards.filter((c) => c.categoryId === 'behaviorism'),
    [],
  )

  const pavlovFlashcardsOnly = useMemo(
    () => flashcards.filter((c) => c.categoryId === 'pavlov'),
    [],
  )

  const littleAlbertFlashcardsOnly = useMemo(
    () => flashcards.filter((c) => c.categoryId === 'littleAlbert'),
    [],
  )

  const thorndikeFlashcardsOnly = useMemo(
    () => flashcards.filter((c) => c.categoryId === 'thorndike'),
    [],
  )

  const skinnerFlashcardsOnly = useMemo(
    () => flashcards.filter((c) => c.categoryId === 'skinner'),
    [],
  )

  const cognitiveFlashcardsOnly = useMemo(
    () => flashcards.filter((c) => c.categoryId === 'cognitive'),
    [],
  )

  const chomskyFlashcardsOnly = useMemo(
    () => flashcards.filter((c) => c.categoryId === 'chomsky'),
    [],
  )

  const neuroscienceFlashcardsOnly = useMemo(
    () => flashcards.filter((c) => c.categoryId === 'neuroscience'),
    [],
  )

  const gestaltFlashcardsOnly = useMemo(
    () => flashcards.filter((c) => c.categoryId === 'gestalt'),
    [],
  )

  const evolutionaryFlashcardsOnly = useMemo(
    () => flashcards.filter((c) => c.categoryId === 'evolutionary'),
    [],
  )

  const socialPsychologyFlashcardsOnly = useMemo(
    () => flashcards.filter((c) => c.categoryId === 'socialPsychology'),
    [],
  )

  const educationalPsychologyFlashcardsOnly = useMemo(
    () => flashcards.filter((c) => c.categoryId === 'educationalPsychology'),
    [],
  )

  const otherBranchesFlashcardsOnly = useMemo(
    () => flashcards.filter((c) => c.categoryId === 'otherBranches'),
    [],
  )

  useEffect(() => {
    setCardOrder(shuffle(filteredCards.map((c) => c.id)))
    setCardIndex(0)
  }, [selectedIds, filteredCards])

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

  /** Ενεργό κουίζ + αλλαγή φίλτρου (filteredQuiz): νέο deck ώστε η κάρτα να ταιριάζει με την επιλογή. */
  useLayoutEffect(() => {
    if (!quizActive) return
    const deck = shuffle(filteredQuiz)
    if (!deck.length) {
      setQuizActive(false)
      setQuizDeck([])
      setQuizIndex(0)
      setQuizSelected(null)
      setQuizRevealed(false)
      setQuizResult(null)
      return
    }
    setQuizDeck(deck)
    setQuizIndex(0)
    setQuizSelected(null)
    setQuizRevealed(false)
    setSessionCorrect(0)
  }, [filteredQuizSig, quizActive, filteredQuiz])

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

  return {
    CATEGORIES: scopeCategories,
    dark,
    setDark,
    progress,
    setProgress,
    selectedIds,
    toggleCategory,
    filteredCards,
    filteredQuiz,
    definitionFlashcardsOnly,
    philosopherFlashcardsOnly,
    wundtFlashcardsOnly,
    functionalismFlashcardsOnly,
    clinicalFlashcardsOnly,
    psychoanalysisFlashcardsOnly,
    humanisticFlashcardsOnly,
    behaviorismFlashcardsOnly,
    pavlovFlashcardsOnly,
    littleAlbertFlashcardsOnly,
    thorndikeFlashcardsOnly,
    skinnerFlashcardsOnly,
    cognitiveFlashcardsOnly,
    chomskyFlashcardsOnly,
    neuroscienceFlashcardsOnly,
    gestaltFlashcardsOnly,
    evolutionaryFlashcardsOnly,
    socialPsychologyFlashcardsOnly,
    educationalPsychologyFlashcardsOnly,
    otherBranchesFlashcardsOnly,
    cardOrder,
    cardIndex,
    currentCard,
    restartCards,
    goNextCard,
    markFlashSeen,
    quizActive,
    setQuizActive,
    quizDeck,
    quizIndex,
    currentQuestion,
    quizSelected,
    quizRevealed,
    sessionCorrect,
    quizResult,
    resultPct,
    startQuiz,
    handleSelectOption,
    handleQuizContinue,
    handleResetAll,
    clearWrongBook,
    removeWrongOne,
    lessonResetKey,
    flashcards,
    quizQuestions,
    getCategoryLabel,
  }
}
