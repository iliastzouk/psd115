/**
 * PSD115 — Εβδομάδα 2: ερευνητικές μέθοδοι (K2)
 */
import { WEEK2_TOPICS } from './topicsData.js'

export { WEEK2_TOPICS } from './topicsData.js'
export { K2_PPT_SLIDES_BY_ROUTE } from './k2PptRefsByRoute.js'

/** @type {{ to: string, title: string }[]} */
export const WEEK2_LESSON_NAV = WEEK2_TOPICS.map((t) => ({
  to: `/week/2/${t.slug}`,
  title: t.title,
}))

export const WEEK2_TOPIC_CARDS = WEEK2_TOPICS.map((t) => ({
  slug: t.slug,
  title: t.title,
  description: t.short,
  ready: true,
}))

export const week2Flashcards = WEEK2_TOPICS.flatMap((t) => t.flashcards)

export const week2QuizQuestions = WEEK2_TOPICS.flatMap((t) => t.quizQuestions)

export function getWeek2TopicBySlug(slug) {
  return WEEK2_TOPICS.find((t) => t.slug === slug) ?? null
}

export function getWeek2ExamQuestions() {
  return WEEK2_TOPICS.flatMap((t) =>
    t.examQuestions.map((q) => ({
      id: q.id,
      topic: t.title,
      question: q.question,
      idealAnswer: q.idealAnswer.trim().replace(/\n\n+/g, '\n\n'),
    })),
  )
}
