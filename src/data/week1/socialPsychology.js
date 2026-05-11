/**
 * Εβδομάδα 1 — Κοινωνική Ψυχολογία
 * Asch · Milgram · ρατσισμός · κοινωνική συμπεριφορά.
 */

export const socialPsychologyLesson = {
  title: 'Κοινωνική Ψυχολογία',

  pptSlide: `Κοινωνική Ψυχολογία
Κοινωνική συμπεριφορά · κοινωνική γνώση
Asch (1958) · Milgram (1963) · ρατσισμός`.trim(),

  theory: `Η Κοινωνική Ψυχολογία ασχολείται με την κοινωνική συμπεριφορά και την κοινωνική γνώση.`.trim(),

  racismTitle: 'Ρατσισμός',

  racism: `Η κοινωνική ψυχολογία μελετά ζητήματα όπως ο ρατσισμός και ο τρόπος ανάπτυξής του.`.trim(),

  aschTitle: 'Πείραμα Asch (1958)',

  asch: `Το πείραμα του Asch μελέτησε την κοινωνική επιρροή και τη συμμόρφωση.`.trim(),

  milgramTitle: 'Πείραμα Milgram (1963)',

  milgram: `Το πείραμα του Milgram μελέτησε την υπακοή στην εξουσία.`.trim(),

  keyPoints: [
    'Κοινωνική συμπεριφορά',
    'Κοινωνική γνώση',
    'Asch',
    'Milgram',
    'Ρατσισμός',
    'Υπακοή στην εξουσία',
  ],

  examTrapIntro: 'ΠΡΟΣΟΧΗ',

  examTrapBody: `Ο Milgram συνδέεται με την υπακοή στην εξουσία.`.trim(),

  memoryHackLines: ['Asch = συμμόρφωση', 'Milgram = υπακοή'],

  progressChecklist: [
    'Ξέρω τι μελετά η Κοινωνική Ψυχολογία',
    'Ξέρω τι μελέτησε το πείραμα Asch',
    'Ξέρω τι μελέτησε το πείραμα Milgram',
    'Ξέρω τη σχέση Milgram–υπακοή στην εξουσία',
    'Μπορώ να συνδέσω τον ρατσισμό με το πεδίο',
  ],
}

export const socialPsychologyMeta = {
  slug: 'social-psychology',
  title: socialPsychologyLesson.title,
  short: 'Κοινωνική συμπεριφορά, Asch, Milgram, ρατσισμός',
}

export const socialPsychologyExamQuestions = [
  {
    id: 'exam-social-psychology-1',
    question: 'Με τι ασχολείται η Κοινωνική Ψυχολογία;',
    idealAnswer: `Η Κοινωνική Ψυχολογία ασχολείται με την κοινωνική συμπεριφορά και την κοινωνική γνώση· μελετά επίσης ζητήματα όπως ο ρατσισμός και πειράματα όπως του Asch (συμμόρφωση) και του Milgram (υπακοή στην εξουσία).`,
  },
  {
    id: 'exam-social-psychology-2',
    question: 'Τι μελέτησαν τα πειράματα Asch και Milgram;',
    idealAnswer: `Το πείραμα του Asch (1958) μελέτησε την κοινωνική επιρροή και τη συμμόρφωση. Το πείραμα του Milgram (1963) μελέτησε την υπακοή στην εξουσία.`,
  },
]

export const socialPsychologyFlashcards = [
  {
    id: 'fc-social-psychology-1',
    categoryId: 'socialPsychology',
    front: 'Με τι ασχολείται η Κοινωνική Ψυχολογία;',
    back: 'Με την κοινωνική συμπεριφορά και την κοινωνική γνώση.',
  },
  {
    id: 'fc-social-psychology-2',
    categoryId: 'socialPsychology',
    front: 'Τι μελέτησε το πείραμα Asch (1958);',
    back: 'Την κοινωνική επιρροή και τη συμμόρφωση.',
  },
  {
    id: 'fc-social-psychology-3',
    categoryId: 'socialPsychology',
    front: 'Τι μελέτησε το πείραμα Milgram (1963);',
    back: 'Την υπακοή στην εξουσία.',
  },
  {
    id: 'fc-social-psychology-4',
    categoryId: 'socialPsychology',
    front: 'Ποιο ζήτημα αναφέρεται ως παράδειγμα στο PPT;',
    back: 'Ο ρατσισμός και ο τρόπος ανάπτυξής του.',
  },
]

const socialTfQuestions = [
  {
    id: 'q-social-psychology-tf-1',
    categoryId: 'socialPsychology',
    type: 'tf',
    question: 'Το πείραμα Milgram σχετίζεται με την υπακοή στην εξουσία.',
    options: ['Σωστό', 'Λάθος'],
    correctIndex: 0,
    explanation: 'Το Milgram (1963) μελέτησε την υπακοή στην εξουσία.',
  },
  {
    id: 'q-social-psychology-tf-2',
    categoryId: 'socialPsychology',
    type: 'tf',
    question: 'Το πείραμα Asch μελέτησε κυρίως την υπακοή στην εξουσία.',
    options: ['Σωστό', 'Λάθος'],
    correctIndex: 1,
    explanation: 'Το Asch μελέτησε συμμόρφωση και κοινωνική επιρροή.',
  },
  {
    id: 'q-social-psychology-tf-3',
    categoryId: 'socialPsychology',
    type: 'tf',
    question: 'Η κοινωνική ψυχολογία μπορεί να μελετά ζητήματα όπως ο ρατσισμός.',
    options: ['Σωστό', 'Λάθος'],
    correctIndex: 0,
    explanation: 'Στο υλικό αναφέρεται ρατσισμός και ανάπτυξή του.',
  },
]

const rawSocialMcq = [
  {
    question: 'Ποιο πείραμα συνδέεται με τη συμμόρφωση;',
    options: ['Milgram', 'Asch', 'Rosenthal', 'Pavlov'],
    answer: 'Asch',
    explanation: 'Το Asch (1958) αφορά κοινωνική επιρροή και συμμόρφωση.',
  },
  {
    question: 'Τι μελέτησε το πείραμα Milgram;',
    options: ['Μνήμη', 'Υπακοή στην εξουσία', 'Όραση', 'Γλώσσα'],
    answer: 'Υπακοή στην εξουσία',
    explanation: 'Το Milgram (1963) μελέτησε την υπακοή στην εξουσία.',
  },
  {
    question: 'Η Κοινωνική Ψυχολογία ασχολείται κυρίως με:',
    options: [
      'Κοινωνική συμπεριφορά και κοινωνική γνώση',
      'Μόνο νευρώνες',
      'Μόνο όνειρα',
      'Μόνο IQ χωρίς κοινωνικό πλαίσιο',
    ],
    answer: 'Κοινωνική συμπεριφορά και κοινωνική γνώση',
    explanation: 'Αυτό ορίζεται στο θεωρητικό κομμάτι του PPT.',
  },
]

function normalizeMcq(raw, i, prefix) {
  const correctIndex = raw.options.indexOf(raw.answer)
  return {
    id: `q-${prefix}-mcq-${i + 1}`,
    categoryId: 'socialPsychology',
    type: 'mcq',
    question: raw.question,
    options: raw.options,
    correctIndex: correctIndex >= 0 ? correctIndex : 0,
    explanation: raw.explanation,
  }
}

export const socialPsychologyQuizQuestions = [
  ...socialTfQuestions,
  ...rawSocialMcq.map((r, i) => normalizeMcq(r, i, 'social-psychology')),
]

export const socialPsychologyLessonQuizIds = socialPsychologyQuizQuestions.map((q) => q.id)
