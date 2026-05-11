/**
 * PSD115 — Εβδομάδα 1: registry θεμάτων + exam pool
 */
import { definitionLesson } from './definitionPsychology.js'
import { philosopherExamQuestions } from './philosophers.js'
import { wundtLesson, wundtExamQuestions } from './wundt.js'
import { functionalismLesson, functionalismExamQuestions } from './functionalism.js'
import { clinicalLesson, clinicalExamQuestions } from './clinicalPsychology.js'
import { psychoanalysisMeta } from './psychoanalysis.js'
import { behaviorismMeta } from './behaviorism.js'
import { cognitiveMeta } from './cognitive.js'
import { gestaltMeta } from './gestalt.js'
import { evolutionaryMeta } from './evolutionary.js'

export * from './definitionPsychology.js'
export * from './philosophers.js'
export * from './wundt.js'
export * from './functionalism.js'
export * from './clinicalPsychology.js'

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
    description: 'Εμφυτισμός, Tabula Rasa, δυϊσμός, νους–εγκέφαλος (Hobbes)',
    ready: true,
  },
  {
    slug: 'wundt',
    title: wundtLesson.title,
    description: 'Λειψία 1879, συνειδητότητα, υποκειμενική εμπειρία, ενδοσκόπηση',
    ready: true,
  },
  {
    slug: 'functionalism',
    title: functionalismLesson.title,
    description: 'Harvard, Darwin, λειτουργία νου, προσαρμογή · vs Wundt',
    ready: true,
  },
  {
    slug: 'clinical',
    title: clinicalLesson.title,
    description: 'Γέφυρα: διαταραχές, θεραπεία, εφαρμογή — πριν τον Freud',
    ready: true,
  },
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
    ...wundtExamQuestions.map((q) => ({
      id: q.id,
      topic: 'Δομισμός (Wundt)',
      question: q.question,
      idealAnswer: q.idealAnswer.trim().replace(/\n\n+/g, '\n\n'),
    })),
    ...functionalismExamQuestions.map((q) => ({
      id: q.id,
      topic: 'Λειτουργισμός (James)',
      question: q.question,
      idealAnswer: q.idealAnswer.trim().replace(/\n\n+/g, '\n\n'),
    })),
    ...clinicalExamQuestions.map((q) => ({
      id: q.id,
      topic: 'Κλινική Ψυχολογία',
      question: q.question,
      idealAnswer: q.idealAnswer.trim().replace(/\n\n+/g, '\n\n'),
    })),
  ]
}
