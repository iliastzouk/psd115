/**
 * Εβδομάδα 1 — Εκπαιδευτική Ψυχολογία
 * Μάθηση · διδασκαλία · Rosenthal (1966).
 */

export const educationalPsychologyLesson = {
  title: 'Εκπαιδευτική Ψυχολογία',

  pptSlide: `Εκπαιδευτική Ψυχολογία
Μάθηση · διδασκαλία · διδακτικές μέθοδοι
Rosenthal (1966)`.trim(),

  theory: `Η Εκπαιδευτική Ψυχολογία διερευνά και αναπτύσσει θεωρίες για τη μάθηση και τη διδασκαλία.`.trim(),

  applicationsTitle: 'Εφαρμογές',

  applications: `Τα αποτελέσματα των ερευνών εφαρμόζονται στην εκπαίδευση για τη διαμόρφωση αναλυτικών προγραμμάτων και διδακτικών μεθόδων.`.trim(),

  rosenthalTitle: 'Robert Rosenthal (1966)',

  rosenthal: `Ο Robert Rosenthal πραγματοποίησε πείραμα στον χώρο της εκπαίδευσης (στη διάλεξη αναφέρεται ως «Ρόμπερ» από τη μεταγραφή): σε εκπαιδευτικούς δόθηκαν παραπλανητικές πληροφορίες ότι ορισμένοι μαθητές ήταν ιδιαίτερα «έξυπνοι» — φάνηκε ότι οι εκπαιδευτικοί διαμόρφωσαν πιο θετικές εκτιμήσεις απόδοσης για αυτούς τους μαθητές (αναμενόμενο φαινόμενο προσδοκίας / Pygmalion).`.trim(),

  keyPoints: ['Μάθηση', 'Διδασκαλία', 'Διδακτικές μέθοδοι', 'Αναλυτικά προγράμματα', 'Rosenthal'],

  examTrapIntro: 'ΠΡΟΣΟΧΗ',

  examTrapBody: `Η Εκπαιδευτική Ψυχολογία συνδέεται με τη μάθηση και τη διδασκαλία.`.trim(),

  memoryHackLines: ['Educational Psychology = learning + teaching'],

  progressChecklist: [
    'Ξέρω τι διερευνά η Εκπαιδευτική Ψυχολογία',
    'Ξέρω πού εφαρμόζονται τα ευρήματα (αναλυτικά, μέθοδοι)',
    'Ξέρω τον Rosenthal και το πείραμα στην εκπαίδευση',
    'Ξέρω τη σχέση μάθηση–διδασκαλία',
    'Μπορώ να τη διακρίνω από άλλους κλάδους',
  ],
}

export const educationalPsychologyMeta = {
  slug: 'educational-psychology',
  title: educationalPsychologyLesson.title,
  short: 'Μάθηση, διδασκαλία, αναλυτικά, Rosenthal (1966)',
}

export const educationalPsychologyExamQuestions = [
  {
    id: 'exam-educational-psychology-1',
    question: 'Τι διερευνά η Εκπαιδευτική Ψυχολογία;',
    idealAnswer: `Η Εκπαιδευτική Ψυχολογία διερευνά και αναπτύσσει θεωρίες για τη μάθηση και τη διδασκαλία· τα ευρήματα εφαρμόζονται στην εκπαίδευση (αναλυτικά προγράμματα, διδακτικές μέθοδοι).`,
  },
  {
    id: 'exam-educational-psychology-2',
    question: 'Ποιος αναφέρεται στο PPT για πείραμα στην εκπαίδευση (1966);',
    idealAnswer: `Ο Robert Rosenthal πραγματοποίησε πείραμα στον χώρο της εκπαίδευσης (1966).`,
  },
]

export const educationalPsychologyFlashcards = [
  {
    id: 'fc-educational-psychology-1',
    categoryId: 'educationalPsychology',
    front: 'Τι διερευνά η Εκπαιδευτική Ψυχολογία;',
    back: 'Θεωρίες για τη μάθηση και τη διδασκαλία.',
  },
  {
    id: 'fc-educational-psychology-2',
    categoryId: 'educationalPsychology',
    front: 'Πού εφαρμόζονται τα ευρήματα;',
    back: 'Στην εκπαίδευση: αναλυτικά προγράμματα και διδακτικές μέθοδοι.',
  },
  {
    id: 'fc-educational-psychology-3',
    categoryId: 'educationalPsychology',
    front: 'Ποιος έκανε πείραμα στην εκπαίδευση (1966);',
    back: 'Ο Robert Rosenthal.',
  },
  {
    id: 'fc-educational-psychology-4',
    categoryId: 'educationalPsychology',
    front: 'Ποια δύο έννοιες είναι κεντρικές στον κλάδο;',
    back: 'Μάθηση και διδασκαλία.',
  },
]

const educationalTfQuestions = [
  {
    id: 'q-educational-psychology-tf-1',
    categoryId: 'educationalPsychology',
    type: 'tf',
    question: 'Η Εκπαιδευτική Ψυχολογία σχετίζεται με μάθηση και διδασκαλία.',
    options: ['Σωστό', 'Λάθος'],
    correctIndex: 0,
    explanation: 'Αυτό ορίζεται ρητά στο PPT.',
  },
  {
    id: 'q-educational-psychology-tf-2',
    categoryId: 'educationalPsychology',
    type: 'tf',
    question: 'Τα ευρήματα μπορεί να αφορούν αναλυτικά προγράμματα και διδακτικές μεθόδους.',
    options: ['Σωστό', 'Λάθος'],
    correctIndex: 0,
    explanation: 'Οι εφαρμογές στην εκπαίδευση περιλαμβάνουν αναλυτικά και μεθόδους.',
  },
  {
    id: 'q-educational-psychology-tf-3',
    categoryId: 'educationalPsychology',
    type: 'tf',
    question: 'Ο Rosenthal (1966) αναφέρεται για πείραμα εκτός εκπαίδευσης.',
    options: ['Σωστό', 'Λάθος'],
    correctIndex: 1,
    explanation: 'Στο PPT: πείραμα στον χώρο της εκπαίδευσης.',
  },
]

const rawEducationalMcq = [
  {
    question: 'Ποιος συνδέεται με πείραμα στην εκπαίδευση (1966);',
    options: ['Milgram', 'Rosenthal', 'Asch', 'Skinner'],
    answer: 'Rosenthal',
    explanation: 'Robert Rosenthal — εκπαιδευτικό πλαίσιο.',
  },
  {
    question: 'Τι περιλαμβάνουν οι εφαρμογές στην εκπαίδευση κατά το PPT;',
    options: [
      'Μόνο αθλητισμό',
      'Αναλυτικά προγράμματα και διδακτικές μεθόδους',
      'Μόνο στρατιωτική εκπαίδευση',
      'Μόνο διαφήμιση',
    ],
    answer: 'Αναλυτικά προγράμματα και διδακτικές μεθόδους',
    explanation: 'Τα ευρήματα εφαρμόζονται για αναλυτικά και μεθόδους διδασκαλίας.',
  },
  {
    question: 'Η Εκπαιδευτική Ψυχολογία αναπτύσσει θεωρίες για:',
    options: ['Μόνο ύπνο', 'Μάθηση και διδασκαλία', 'Μόνο γεύση', 'Μόνο οπτική αντίληψη χωρίς διδασκαλία'],
    answer: 'Μάθηση και διδασκαλία',
    explanation: 'Κεντρικός ορισμός στο υλικό.',
  },
]

function normalizeMcq(raw, i, prefix) {
  const correctIndex = raw.options.indexOf(raw.answer)
  return {
    id: `q-${prefix}-mcq-${i + 1}`,
    categoryId: 'educationalPsychology',
    type: 'mcq',
    question: raw.question,
    options: raw.options,
    correctIndex: correctIndex >= 0 ? correctIndex : 0,
    explanation: raw.explanation,
  }
}

export const educationalPsychologyQuizQuestions = [
  ...educationalTfQuestions,
  ...rawEducationalMcq.map((r, i) => normalizeMcq(r, i, 'educational-psychology')),
]

export const educationalPsychologyLessonQuizIds = educationalPsychologyQuizQuestions.map((q) => q.id)
