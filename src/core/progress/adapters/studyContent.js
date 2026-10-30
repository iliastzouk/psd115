/**
 * Content adapters της προόδου από το κοινό συμβόλαιο περιεχομένου (Φάση 6a): ένας για κάθε μάθημα του STUDY_CONTENT,
 * με τα θέματα του routing catalog. Κανένας ειδικός κώδικας ανά μάθημα.
 *
 *   ομάδα στατιστικών = categoryId της ερώτησης · κάρτες / ερωτήσεις = flashcards / quizQuestions · θέματα = topics
 */
import { STUDY_CONTENT } from '../../study/content.js'
import { getContentCourse } from '../../routing/catalog.js'

/**
 * @param {string} courseId
 * @param {{ categories: { id: string }[], quizQuestions: { id: string, categoryId: string }[], flashcards: { id: string }[],
 *           topics: { id: string }[] }} content
 * @returns {import('../contentAdapter.js').ContentAdapter}
 */
export function createStudyContentAdapter(courseId, { categories, quizQuestions, flashcards, topics }) {
  const groups = new Set(categories.map((c) => c.id))
  const groupByQuestion = new Map(quizQuestions.map((q) => [q.id, q.categoryId]))
  const cards = new Set(flashcards.map((c) => c.id))
  const topicIds = new Set(topics.map((t) => t.id))
  return Object.freeze({
    courseId,
    hasGroup: (id) => groups.has(id),
    groupOf: (questionId) => groupByQuestion.get(questionId) ?? null,
    isQuestion: (id) => groupByQuestion.has(id),
    isCard: (id) => cards.has(id),
    hasTopic: (id) => topicIds.has(id),
  })
}

/** Ένας adapter για κάθε μάθημα με περιεχόμενο μελέτης (τα υπόλοιπα δεν εξυπηρετούνται → no-content / no-progress). */
export function studyContentAdapters(contentMap = STUDY_CONTENT, topicsOf = (courseId) => getContentCourse(courseId)?.topics ?? []) {
  return Object.freeze(
    Object.fromEntries(
      Object.entries(contentMap).map(([courseId, c]) => [courseId, createStudyContentAdapter(courseId, { ...c, topics: topicsOf(courseId) })]),
    ),
  )
}
