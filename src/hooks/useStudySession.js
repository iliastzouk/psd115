import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react'
import { useRouteIdentity } from '../core/routing/hooks.js'
import { activeCourseId } from '../core/routing/navigation.js'
import { selectStudyMaterial, studyScope } from '../core/study/scope.js'
import { createStudyActions, sessionProgress, studyCourse, studyCourseNotice } from '../core/study/session.js'
import { newEventId } from '../core/progress/events.js'
import { shuffle, shuffleQuestionOptions } from '../utils/shuffle.js'
import { getProgressService, useProgress } from './useProgress.js'
import { getTheme, setTheme, useTheme } from '../utils/settings.js'

function filterByCategories(items, selectedIds) {
  if (!selectedIds.length) return items
  return items.filter((item) => selectedIds.includes(item.categoryId))
}

export function useStudySession() {
  // Υλικό μελέτης από το canonical scope της διαδρομής (Phase 1D). Χωρίς scope → κενό υλικό.
  const routeIdentity = useRouteIdentity()
  const material = selectStudyMaterial(studyScope(routeIdentity))
  const scopedFlashcards = material.flashcards
  const scopedQuizQuestions = material.quizQuestions
  const scopeCategories = material.categories

  // Πρόοδος: ΜΟΝΟ από το ProgressService (ένα snapshot, φορτωμένο πριν από το πρώτο render). Καμία εγγραφή εδώ.
  const progressState = useProgress('study-session')
  // Φάση 5 (I1): το μάθημα της διαδρομής (όπως η κεφαλίδα)· περιεχόμενο από το STUDY_CONTENT. Εκτός ready: κενή πρόοδος
  // μόνο για ανάγνωση και καμία ενέργεια — ποτέ πρόοδος ή περιεχόμενο άλλου μαθήματος.
  const courseId = activeCourseId(routeIdentity)
  const course = useMemo(() => studyCourse(courseId, getProgressService().supports), [courseId])
  const actions = useMemo(() => createStudyActions({ course, service: getProgressService() }), [course])
  const { flashcards, quizQuestions, getCategoryLabel } = course.content
  const progress = sessionProgress(progressState, course)
  const progressStatus = progressState.status
  // Φάση 6a: η αιτία του degraded (corrupt / pending / unrecoverable / no-storage), για μήνυμα και διαθέσιμες ενέργειες.
  const progressReason = progressState.reason ?? null
  // Φάση 2: η τελευταία αλλαγή δεν αποθηκεύτηκε (ready· ≠ degraded). Η απόρριψη απλώς κρύβει την ειδοποίηση.
  const progressWriteFailure = progressState.writeFailure ?? null
  const dismissWriteFailure = useCallback(() => getProgressService().dismissWriteFailure(), [])
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
    [flashcards],
  )

  const philosopherFlashcardsOnly = useMemo(
    () => flashcards.filter((c) => c.categoryId === 'history'),
    [flashcards],
  )

  const wundtFlashcardsOnly = useMemo(
    () => flashcards.filter((c) => c.categoryId === 'structuralism'),
    [flashcards],
  )

  const functionalismFlashcardsOnly = useMemo(
    () => flashcards.filter((c) => c.categoryId === 'functionalism'),
    [flashcards],
  )

  const clinicalFlashcardsOnly = useMemo(
    () => flashcards.filter((c) => c.categoryId === 'clinical'),
    [flashcards],
  )

  const psychoanalysisFlashcardsOnly = useMemo(
    () => flashcards.filter((c) => c.categoryId === 'psychoanalysis'),
    [flashcards],
  )

  const humanisticFlashcardsOnly = useMemo(
    () => flashcards.filter((c) => c.categoryId === 'humanistic'),
    [flashcards],
  )

  const behaviorismFlashcardsOnly = useMemo(
    () => flashcards.filter((c) => c.categoryId === 'behaviorism'),
    [flashcards],
  )

  const pavlovFlashcardsOnly = useMemo(
    () => flashcards.filter((c) => c.categoryId === 'pavlov'),
    [flashcards],
  )

  const littleAlbertFlashcardsOnly = useMemo(
    () => flashcards.filter((c) => c.categoryId === 'littleAlbert'),
    [flashcards],
  )

  const thorndikeFlashcardsOnly = useMemo(
    () => flashcards.filter((c) => c.categoryId === 'thorndike'),
    [flashcards],
  )

  const skinnerFlashcardsOnly = useMemo(
    () => flashcards.filter((c) => c.categoryId === 'skinner'),
    [flashcards],
  )

  const cognitiveFlashcardsOnly = useMemo(
    () => flashcards.filter((c) => c.categoryId === 'cognitive'),
    [flashcards],
  )

  const chomskyFlashcardsOnly = useMemo(
    () => flashcards.filter((c) => c.categoryId === 'chomsky'),
    [flashcards],
  )

  const neuroscienceFlashcardsOnly = useMemo(
    () => flashcards.filter((c) => c.categoryId === 'neuroscience'),
    [flashcards],
  )

  const gestaltFlashcardsOnly = useMemo(
    () => flashcards.filter((c) => c.categoryId === 'gestalt'),
    [flashcards],
  )

  const evolutionaryFlashcardsOnly = useMemo(
    () => flashcards.filter((c) => c.categoryId === 'evolutionary'),
    [flashcards],
  )

  const socialPsychologyFlashcardsOnly = useMemo(
    () => flashcards.filter((c) => c.categoryId === 'socialPsychology'),
    [flashcards],
  )

  const educationalPsychologyFlashcardsOnly = useMemo(
    () => flashcards.filter((c) => c.categoryId === 'educationalPsychology'),
    [flashcards],
  )

  const otherBranchesFlashcardsOnly = useMemo(
    () => flashcards.filter((c) => c.categoryId === 'otherBranches'),
    [flashcards],
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

  const markFlashSeen = useCallback(
    // Στον handler, όχι σε updater (το StrictMode τρέχει τους updaters δύο φορές). Το service διαβάζει πρώτα το storage.
    (id) => void actions.markCardSeen(id),
    [actions],
  )

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
      // Λάθος: ΕΝΑ uid στον handler (η εγγραφή του wrongBook).
      const wrong = correct
        ? undefined
        : {
            uid: newEventId(),
            question: currentQuestion.question,
            explanation: currentQuestion.explanation,
            userLabel: currentQuestion.options[idx],
            correctLabel: currentQuestion.options[currentQuestion.correctIndex],
          }
      // ΜΙΑ σύγχρονη αλλαγή στο ProgressService (event + wrongBook σε ένα commit), στον handler (όχι σε updater/effect).
      actions.answer({ questionId: currentQuestion.id, ok: correct, wrong })
    },
    [actions, currentQuestion, quizRevealed],
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

  const clearWrongBook = useCallback(() => void actions.clearWrongBook(), [actions])

  const removeWrongOne = useCallback((uid) => void actions.removeWrong(uid), [actions])

  const resultPct =
    quizResult && quizResult.total ? Math.round((quizResult.correct / quizResult.total) * 100) : 0

  return {
    CATEGORIES: scopeCategories,
    dark,
    setDark,
    progress,
    progressStatus,
    // Φάση 5: ready | no-content | no-progress, και μήνυμα όταν η πρόοδος του μαθήματος δεν αποθηκεύεται.
    studyCourse: course,
    studyCourseNotice: studyCourseNotice(course, progressState),
    progressWriteFailure,
    dismissWriteFailure,
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
