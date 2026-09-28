/**
 * PSD115 — Εβδομάδα 4: αίσθηση & αντίληψη (K4)
 */
import { WEEK4_TOPICS } from './topicsData.js'

export { WEEK4_TOPICS }
export { K4_PPT_SLIDES_BY_ROUTE } from './k4PptRefsByRoute.js'

/** @type {{ to: string, title: string }[]} */
export const WEEK4_LESSON_NAV = WEEK4_TOPICS.map((t) => ({
  to: `/week/4/${t.slug}`,
  title: t.title,
}))

export const WEEK4_TOPIC_CARDS = WEEK4_TOPICS.map((t) => ({
  slug: t.slug,
  title: t.title,
  description: t.short,
  ready: true,
}))

export const week4Flashcards = WEEK4_TOPICS.flatMap((t) => t.flashcards)

export const week4QuizQuestions = WEEK4_TOPICS.flatMap((t) => t.quizQuestions)

export function getWeek4TopicBySlug(slug) {
  return WEEK4_TOPICS.find((t) => t.slug === slug) ?? null
}

export function getWeek4ExamQuestions() {
  return WEEK4_TOPICS.flatMap((t) =>
    t.examQuestions.map((q) => ({
      id: q.id,
      topic: t.title,
      question: q.question,
      idealAnswer: q.idealAnswer.trim().replace(/\n\n+/g, '\n\n'),
    })),
  )
}
