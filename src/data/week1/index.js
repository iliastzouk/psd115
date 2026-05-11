/**
 * PSD115 — Εβδομάδα 1: registry θεμάτων + exam pool
 */
import { definitionLesson } from './definitionPsychology.js'
import { philosopherExamQuestions } from './philosophers.js'
import { wundtMeta } from './wundt.js'
import { functionalismMeta } from './functionalism.js'
import { psychoanalysisMeta } from './psychoanalysis.js'
import { behaviorismMeta } from './behaviorism.js'
import { cognitiveMeta } from './cognitive.js'
import { gestaltMeta } from './gestalt.js'
import { evolutionaryMeta } from './evolutionary.js'

export * from './definitionPsychology.js'
export * from './philosophers.js'

/** Θέματα για το hub Εβδομάδας 1 (επεκτείνεται εύκολα) */
export const WEEK1_TOPIC_CARDS = [
  {
    slug: 'definition',
    title: 'Ορισμός της Ψυχολογίας',
    description: 'Θεωρία, κάρτες, κουίζ, active recall',
    ready: true,
  },
  {
    slug: 'philosophers',
    title: 'Φιλόσοφοι & Ιστορία',
    description: 'Πλάτωνας, Αριστοτέλης, Descartes, Hobbes',
    ready: true,
  },
  { ...wundtMeta, ready: false },
  { ...functionalismMeta, ready: false },
  { ...psychoanalysisMeta, ready: false },
  { ...behaviorismMeta, ready: false },
  { ...cognitiveMeta, ready: false },
  { ...gestaltMeta, ready: false },
  { ...evolutionaryMeta, ready: false },
]

export function getWeek1ExamQuestions() {
  return [
    {
      id: 'exam-def-dev',
      topic: 'Ορισμός',
      question: definitionLesson.miniExam.question,
      idealAnswer: definitionLesson.miniExam.idealAnswer.trim(),
    },
    {
      id: 'exam-def-full',
      topic: 'Ορισμός',
      question:
        'Ανάπτυξε τον επιστημονικό ορισμό της Ψυχολογίας και εξήγησε τη διαφορά μεταξύ συμπεριφοράς και νοητικών διεργασιών.',
      idealAnswer: definitionLesson.examLevelAnswer.text.trim(),
    },
    ...philosopherExamQuestions.map((q) => ({
      id: q.id,
      topic: 'Φιλόσοφοι',
      question: q.question,
      idealAnswer: q.idealAnswer.trim().replace(/\n\n+/g, '\n\n'),
    })),
  ]
}
