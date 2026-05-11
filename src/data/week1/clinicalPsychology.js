/**
 * Εβδομάδα 1 — Κλινική Ψυχολογία (γέφυρα πριν την ψυχανάλυση / PSD115 · PPT-first)
 */

export const clinicalLesson = {
  title: 'Κλινική Ψυχολογία',

  bridgeNote:
    'Σύντομη ενότητα-γέφυρα: από τις πρώτες σχολές προς εφαρμογή, θεραπεία και Freud.'.trim(),

  intro: `Η Κλινική Ψυχολογία ασχολείται με τη μελέτη, διάγνωση και θεραπεία ψυχικών διαταραχών και ψυχολογικών δυσκολιών.`.trim(),

  focus: `Οι κλινικοί ψυχολόγοι βοηθούν άτομα που αντιμετωπίζουν:
• άγχος
• κατάθλιψη
• φοβίες
• τραύματα
• συναισθηματικές δυσκολίες`.trim(),

  goals: [
    'Κατανόηση ψυχολογικών προβλημάτων',
    'Διάγνωση',
    'Θεραπεία',
    'Βελτίωση ψυχικής υγείας',
  ],

  connectionToFreud: `Η ψυχανάλυση του Freud επηρέασε σημαντικά την ανάπτυξη της Κλινικής Ψυχολογίας.`.trim(),

  keyPoints: [
    'Μελέτη ψυχικών διαταραχών',
    'Θεραπευτικές παρεμβάσεις',
    'Ψυχική υγεία',
    'Σύνδεση με ψυχοθεραπεία',
  ],

  examTrapIntro: 'ΠΡΟΣΟΧΗ',

  examTrapBody: `Η Κλινική Ψυχολογία δεν περιορίζεται μόνο στις σοβαρές ψυχικές διαταραχές αλλά ασχολείται και με καθημερινές ψυχολογικές δυσκολίες.`.trim(),

  memoryHackLines: ['Κλινική Ψυχολογία = διάγνωση + θεραπεία'],
}

export const clinicalMeta = {
  slug: 'clinical',
  title: clinicalLesson.title,
  short: 'Διαταραχές, θεραπεία, εφαρμογή — γέφυρα προς Freud',
  comingSoon: false,
}

export const clinicalExamQuestions = [
  {
    id: 'exam-clinical-1',
    question: 'Τι είναι η Κλινική Ψυχολογία;',
    idealAnswer: `Η Κλινική Ψυχολογία είναι κλάδος της ψυχολογίας που ασχολείται με τη μελέτη, διάγνωση και θεραπεία ψυχικών διαταραχών και ψυχολογικών δυσκολιών.`,
  },
]

export const clinicalFlashcards = [
  {
    id: 'fc-clinical-1',
    categoryId: 'clinical',
    front: 'Με τι ασχολείται η Κλινική Ψυχολογία;',
    back: 'Με τη διάγνωση και θεραπεία ψυχικών διαταραχών και ψυχολογικών δυσκολιών.',
  },
  {
    id: 'fc-clinical-2',
    categoryId: 'clinical',
    front: 'Τι βοηθούν οι κλινικοί ψυχολόγοι;',
    back: 'Άτομα με άγχος, κατάθλιψη, φοβίες και άλλες δυσκολίες.',
  },
  {
    id: 'fc-clinical-3',
    categoryId: 'clinical',
    front: 'Ποιος επηρέασε σημαντικά την Κλινική Ψυχολογία;',
    back: 'Ο Sigmund Freud.',
  },
]

const clinicalTfQuestions = [
  {
    id: 'q-clinical-tf-1',
    categoryId: 'clinical',
    type: 'tf',
    question: 'Η Κλινική Ψυχολογία ασχολείται με τη θεραπεία ψυχολογικών δυσκολιών.',
    options: ['Σωστό', 'Λάθος'],
    correctIndex: 0,
    explanation: 'Η θεραπεία είναι βασικός στόχος.',
  },
  {
    id: 'q-clinical-tf-2',
    categoryId: 'clinical',
    type: 'tf',
    question: 'Η Κλινική Ψυχολογία αφορά μόνο σοβαρές ψυχικές ασθένειες.',
    options: ['Σωστό', 'Λάθος'],
    correctIndex: 1,
    explanation: 'Ασχολείται και με καθημερινές ψυχολογικές δυσκολίες.',
  },
]

export const clinicalQuizQuestions = [...clinicalTfQuestions]

export const clinicalLessonQuizIds = clinicalQuizQuestions.map((q) => q.id)
