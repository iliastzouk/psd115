/**
 * PSD115 — Εβδομάδα 3: νευρικό σύστημα / εγκέφαλος (K3)
 */
import { WEEK3_TOPICS } from './topicsData.js'

export { WEEK3_TOPICS }
export { K3_PPT_SLIDES_BY_ROUTE } from './k3PptRefsByRoute.js'

/** @type {{ to: string, title: string }[]} */
export const WEEK3_LESSON_NAV = WEEK3_TOPICS.map((t) => ({
  to: `/week/3/${t.slug}`,
  title: t.title,
}))

export const WEEK3_TOPIC_CARDS = WEEK3_TOPICS.map((t) => ({
  slug: t.slug,
  title: t.title,
  description: t.short,
  ready: true,
}))

export const week3Flashcards = WEEK3_TOPICS.flatMap((t) => t.flashcards)

export const week3QuizQuestions = WEEK3_TOPICS.flatMap((t) => t.quizQuestions)

export function getWeek3TopicBySlug(slug) {
  return WEEK3_TOPICS.find((t) => t.slug === slug) ?? null
}

export function getWeek3ExamQuestions() {
  return WEEK3_TOPICS.flatMap((t) =>
    t.examQuestions.map((q) => ({
      id: q.id,
      topic: t.title,
      question: q.question,
      idealAnswer: q.idealAnswer.trim().replace(/\n\n+/g, '\n\n'),
    })),
  )
}
