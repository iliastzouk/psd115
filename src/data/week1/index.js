/**
 * PSD115 — Εβδομάδα 1: registry θεμάτων + exam pool
 */
import { definitionLesson } from './definitionPsychology.js'
import { philosophers, philosopherExamQuestions } from './philosophers.js'
import { wundtLesson, wundtExamQuestions } from './wundt.js'
import { functionalismLesson, functionalismExamQuestions } from './functionalism.js'
import { clinicalLesson, clinicalExamQuestions } from './clinicalPsychology.js'
import { psychoanalysisLesson, psychoanalysisExamQuestions } from './psychoanalysis.js'
import { humanisticLesson, humanisticExamQuestions } from './humanisticPsychology.js'
import { behaviorismLesson, behaviorismExamQuestions, behaviorismMeta } from './behaviorism.js'
import { pavlovLesson, pavlovExamQuestions, pavlovMeta } from './pavlov.js'
import { littleAlbertLesson, littleAlbertExamQuestions, littleAlbertMeta } from './littleAlbert.js'
import { thorndikeLesson, thorndikeExamQuestions, thorndikeMeta } from './thorndike.js'
import { skinnerLesson, skinnerExamQuestions, skinnerMeta } from './skinner.js'
import { cognitiveLesson, cognitiveExamQuestions, cognitiveMeta } from './cognitive.js'
import { chomskyLesson, chomskyExamQuestions, chomskyMeta } from './chomsky.js'
import { neuroscienceExamQuestions, neuroscienceMeta } from './neuroscience.js'
import { gestaltLesson, gestaltExamQuestions, gestaltMeta } from './gestalt.js'
import { evolutionaryLesson, evolutionaryExamQuestions, evolutionaryMeta } from './evolutionary.js'
import {
  socialPsychologyLesson,
  socialPsychologyExamQuestions,
  socialPsychologyMeta,
} from './socialPsychology.js'
import {
  educationalPsychologyLesson,
  educationalPsychologyExamQuestions,
  educationalPsychologyMeta,
} from './educationalPsychology.js'
import { otherBranchesLesson, otherBranchesExamQuestions, otherBranchesMeta } from './otherBranches.js'

export * from './definitionPsychology.js'
export * from './philosophers.js'
export * from './wundt.js'
export * from './functionalism.js'
export * from './clinicalPsychology.js'
export * from './psychoanalysis.js'
export * from './humanisticPsychology.js'
export * from './behaviorism.js'
export * from './pavlov.js'
export * from './littleAlbert.js'
export * from './thorndike.js'
export * from './skinner.js'
export * from './cognitive.js'
export * from './chomsky.js'
export * from './neuroscience.js'
export * from './gestalt.js'
export * from './evolutionary.js'
export * from './socialPsychology.js'
export * from './educationalPsychology.js'
export * from './otherBranches.js'
export { WEEK1_LESSON_NAV } from './lessonNav.js'

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
    title: philosophers.title,
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
    description: 'Αποκλίσεις/διαταραχές συμπεριφοράς, προσωπικότητα — πριν τον Freud',
    ready: true,
  },
  {
    slug: 'psychoanalysis',
    title: psychoanalysisLesson.title,
    description: 'Ασυνείδητο, παιδική ηλικία, όνειρα, ψυχαναλυτική θεωρία & θεραπεία',
    ready: true,
  },
  {
    slug: 'humanistic',
    title: humanisticLesson.title,
    description: 'Maslow, Rogers, αυτοπραγμάτωση, clients — vs Freud & συμπεριφορισμός',
    ready: true,
  },
  {
    slug: 'behaviorism',
    title: behaviorismLesson.title,
    description: behaviorismMeta.short,
    ready: true,
  },
  {
    slug: 'pavlov',
    title: pavlovLesson.title,
    description: pavlovMeta.short,
    ready: true,
  },
  {
    slug: 'little-albert',
    title: littleAlbertLesson.title,
    description: littleAlbertMeta.short,
    ready: true,
  },
  {
    slug: 'thorndike',
    title: thorndikeLesson.title,
    description: thorndikeMeta.short,
    ready: true,
  },
  {
    slug: 'skinner',
    title: skinnerLesson.title,
    description: skinnerMeta.short,
    ready: true,
  },
  {
    slug: 'cognitive',
    title: cognitiveLesson.title,
    description: cognitiveMeta.short,
    ready: true,
  },
  {
    slug: 'chomsky',
    title: chomskyLesson.title,
    description: chomskyMeta.short,
    ready: true,
  },
  {
    slug: 'neuroscience',
    title: neuroscienceMeta.title,
    description: neuroscienceMeta.short,
    ready: true,
  },
  {
    slug: 'gestalt',
    title: gestaltLesson.title,
    description: gestaltMeta.short,
    ready: true,
  },
  {
    slug: 'evolutionary',
    title: evolutionaryLesson.title,
    description: evolutionaryMeta.short,
    ready: true,
  },
  {
    slug: 'social-psychology',
    title: socialPsychologyLesson.title,
    description: socialPsychologyMeta.short,
    ready: true,
  },
  {
    slug: 'educational-psychology',
    title: educationalPsychologyLesson.title,
    description: educationalPsychologyMeta.short,
    ready: true,
  },
  {
    slug: 'other-branches',
    title: otherBranchesLesson.title,
    description: otherBranchesMeta.short,
    ready: true,
  },
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
      question: definitionLesson.examLevelAnswer.prompt.trim(),
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
    ...psychoanalysisExamQuestions.map((q) => ({
      id: q.id,
      topic: 'Ψυχανάλυση (Freud)',
      question: q.question,
      idealAnswer: q.idealAnswer.trim().replace(/\n\n+/g, '\n\n'),
    })),
    ...humanisticExamQuestions.map((q) => ({
      id: q.id,
      topic: 'Ανθρωπιστική Ψυχολογία',
      question: q.question,
      idealAnswer: q.idealAnswer.trim().replace(/\n\n+/g, '\n\n'),
    })),
    ...behaviorismExamQuestions.map((q) => ({
      id: q.id,
      topic: 'Συμπεριφορισμός',
      question: q.question,
      idealAnswer: q.idealAnswer.trim().replace(/\n\n+/g, '\n\n'),
    })),
    ...pavlovExamQuestions.map((q) => ({
      id: q.id,
      topic: 'Pavlov — Κλασική μάθηση',
      question: q.question,
      idealAnswer: q.idealAnswer.trim().replace(/\n\n+/g, '\n\n'),
    })),
    ...littleAlbertExamQuestions.map((q) => ({
      id: q.id,
      topic: 'Little Albert (1920)',
      question: q.question,
      idealAnswer: q.idealAnswer.trim().replace(/\n\n+/g, '\n\n'),
    })),
    ...thorndikeExamQuestions.map((q) => ({
      id: q.id,
      topic: 'Thorndike — Νόμος αποτελέσματος',
      question: q.question,
      idealAnswer: q.idealAnswer.trim().replace(/\n\n+/g, '\n\n'),
    })),
    ...skinnerExamQuestions.map((q) => ({
      id: q.id,
      topic: 'Skinner — Συντελεστική μάθηση',
      question: q.question,
      idealAnswer: q.idealAnswer.trim().replace(/\n\n+/g, '\n\n'),
    })),
    ...cognitiveExamQuestions.map((q) => ({
      id: q.id,
      topic: 'Γνωστική Ψυχολογία',
      question: q.question,
      idealAnswer: q.idealAnswer.trim().replace(/\n\n+/g, '\n\n'),
    })),
    ...chomskyExamQuestions.map((q) => ({
      id: q.id,
      topic: 'Chomsky — Γλώσσα & γνωστική επανάσταση',
      question: q.question,
      idealAnswer: q.idealAnswer.trim().replace(/\n\n+/g, '\n\n'),
    })),
    ...neuroscienceExamQuestions.map((q) => ({
      id: q.id,
      topic: 'Γνωστική νευροεπιστήμη',
      question: q.question,
      idealAnswer: q.idealAnswer.trim().replace(/\n\n+/g, '\n\n'),
    })),
    ...gestaltExamQuestions.map((q) => ({
      id: q.id,
      topic: 'Ψυχολογία Gestalt',
      question: q.question,
      idealAnswer: q.idealAnswer.trim().replace(/\n\n+/g, '\n\n'),
    })),
    ...evolutionaryExamQuestions.map((q) => ({
      id: q.id,
      topic: 'Εξελικτική Ψυχολογία',
      question: q.question,
      idealAnswer: q.idealAnswer.trim().replace(/\n\n+/g, '\n\n'),
    })),
    ...socialPsychologyExamQuestions.map((q) => ({
      id: q.id,
      topic: 'Κοινωνική Ψυχολογία',
      question: q.question,
      idealAnswer: q.idealAnswer.trim().replace(/\n\n+/g, '\n\n'),
    })),
    ...educationalPsychologyExamQuestions.map((q) => ({
      id: q.id,
      topic: 'Εκπαιδευτική Ψυχολογία',
      question: q.question,
      idealAnswer: q.idealAnswer.trim().replace(/\n\n+/g, '\n\n'),
    })),
    ...otherBranchesExamQuestions.map((q) => ({
      id: q.id,
      topic: 'Υπόλοιποι κλάδοι Ψυχολογίας',
      question: q.question,
      idealAnswer: q.idealAnswer.trim().replace(/\n\n+/g, '\n\n'),
    })),
  ]
}
