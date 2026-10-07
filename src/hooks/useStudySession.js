import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react'
import { useRouteIdentity } from '../core/routing/hooks.js'
import { selectStudyMaterial, studyScope } from '../core/study/scope.js'
import { recordFlashcardSeen, recordQuizAnswer } from '../utils/progressShadow.js'
import { flashcards, quizQuestions, getCategoryLabel } from '../../content/courses/psd115/questions.js'
import { shuffle, shuffleQuestionOptions } from '../utils/shuffle.js'
import { getProgressService, useProgress } from './useProgress.js'
import { getTheme, setTheme, useTheme } from '../utils/settings.js'

/** Το μάθημα του οποίου την πρόοδο κρατά αυτή η συνεδρία (legacy UI του PSD115). */
const COURSE_ID = 'psd115'

function filterByCategories(items, selectedIds) {
  if (!selectedIds.length) return items
  return items.filter((item) => selectedIds.includes(item.categoryId))
}

export function useStudySession() {
  // Υλικό μελέτης από το canonical scope της διαδρομής (Phase 1D). Χωρίς scope → κενό υλικό.
  const material = selectStudyMaterial(studyScope(useRouteIdentity()))
  const scopedFlashcards = material.flashcards
  const scopedQuizQuestions = material.quizQuestions
  const scopeCategories = material.categories

  // Πρόοδος: ΜΟΝΟ από το ProgressService (ένα snapshot, φορτωμένο πριν από το πρώτο render). Καμία εγγραφή εδώ.
  const progressState = useProgress('study-session')
  const progress = progressState.courses[COURSE_ID]
  const progressStatus = progressState.status
  // Ρυθμίσεις: από το settings module (διαβάστηκαν πριν από το render· εγγραφή μόνο σε αλλαγή του χρήστη).
  const dark = useTheme() === 'dark'
  const setDark = useCallback((next) => {
    const value = typeof next === 'function' ? next(getTheme() === 'dark') : next
    setTheme(value ? 'dark' : 'light')
  }, [])
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
    // Shadow (1E-3): στον handler, όχι στον updater (το StrictMode τρέχει τους updaters δύο φορές).
    recordFlashcardSeen({ cardId: id })
    getProgressService().markCardSeen(id)
  }, [])

  const goNextCard = useCallback(() => {
    setCardIndex((i) => Math.min(i + 1, Math.max(filteredCards.length - 1, 0)))
  }, [filteredCards.length])

  const restartCards = useCallback(() => {
    setCardOrder(shuffle(filteredCards.map((c) => c.id)))
    setCardIndex(0)
  }, [filteredCards])

  const startQuiz = useCallback(() => {
    const deck = shuffle(filteredQuiz).map(shuffleQuestionOptions)
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
    const deck = shuffle(filteredQuiz).map(shuffleQuestionOptions)
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
      // Shadow (1E-3): ένα event ανά απάντηση, στον handler (όχι στον updater). Δεν επηρεάζει το legacy.
      recordQuizAnswer({ questionId: currentQuestion.id, ok: correct })

      // Μετά το event (shadow), η πρόοδος: ΜΙΑ σύγχρονη αλλαγή στο ProgressService (όχι σε updater/effect).
      getProgressService().answerQuestion({
        questionId: currentQuestion.id,
        ok: correct,
        wrong: correct
          ? undefined
          : {
              question: currentQuestion.question,
              explanation: currentQuestion.explanation,
              userLabel: currentQuestion.options[idx],
              correctLabel: currentQuestion.options[currentQuestion.correctIndex],
            },
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

  /** Μετά το resetProgressSafely (υποδομή): η μνήμη ξαναδιαβάζει το storage — μία πηγή, κανένα δεύτερο «default». */
  const resetAllStudyProgress = useCallback(() => {
    getProgressService().resync()
    setQuizActive(false)
    setLessonResetKey((k) => k + 1)
  }, [])

  const clearWrongBook = useCallback(() => {
    getProgressService().clearWrongBook()
  }, [])

  const removeWrongOne = useCallback((uid) => {
    getProgressService().removeWrong(uid)
  }, [])

  const resultPct =
    quizResult && quizResult.total ? Math.round((quizResult.correct / quizResult.total) * 100) : 0

  return {
    CATEGORIES: scopeCategories,
    dark,
    setDark,
    progress,
    progressStatus,
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
    resetAllStudyProgress,
    clearWrongBook,
    removeWrongOne,
    lessonResetKey,
    flashcards,
    quizQuestions,
    getCategoryLabel,
  }
}
