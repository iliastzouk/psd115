/**
 * Εβδομάδα 1 — Υπόλοιποι κλάδοι Ψυχολογίας
 * Πολιτισμική · Βιολογική · Αναπτυξιακή + SOS πίνακας ανασκόπησης.
 */

export const branchesQuickReview = [
  { branch: 'Κοινωνική Ψυχολογία', focus: 'Κοινωνική συμπεριφορά' },
  { branch: 'Εκπαιδευτική Ψυχολογία', focus: 'Μάθηση και διδασκαλία' },
  { branch: 'Πολιτισμική Ψυχολογία', focus: 'Πολιτισμός και ψυχικές διεργασίες' },
  { branch: 'Βιολογική Ψυχολογία', focus: 'Βιολογικές βάσεις συμπεριφοράς' },
  { branch: 'Αναπτυξιακή Ψυχολογία', focus: 'Αλλαγές κατά την ανάπτυξη' },
]

export const otherBranchesLesson = {
  title: 'Υπόλοιποι Κλάδοι Ψυχολογίας',

  pptSlide: `Υπόλοιποι κλάδοι
Πολιτισμική · Βιολογική · Αναπτυξιακή`.trim(),

  culturalPsychologyTitle: 'Πολιτισμική Ψυχολογία',

  culturalPsychology: `Η Πολιτισμική Ψυχολογία μελετά τους τρόπους με τους οποίους οι πολιτισμοί αντανακλούν και επηρεάζουν τις ψυχικές διαδικασίες των ανθρώπων.`.trim(),

  biologicalPsychologyTitle: 'Βιολογική Ψυχολογία',

  biologicalPsychology: `Η Βιολογική Ψυχολογία εξετάζει τις βιολογικές βάσεις της συμπεριφοράς και των νοητικών λειτουργιών.`.trim(),

  developmentalPsychologyTitle: 'Αναπτυξιακή Ψυχολογία',

  developmentalPsychology: `Η Αναπτυξιακή Ψυχολογία διερευνά τις αλλαγές στη συμπεριφορά και στις νοητικές λειτουργίες κατά τη διάρκεια της ανάπτυξης του ατόμου.`.trim(),

  keyPoints: ['Πολιτισμική Ψυχολογία', 'Βιολογική Ψυχολογία', 'Αναπτυξιακή Ψυχολογία'],

  examTrapIntro: 'ΠΡΟΣΟΧΗ',

  examTrapBody: `Η Βιολογική Ψυχολογία συνδέεται με τις βιολογικές βάσεις της συμπεριφοράς.`.trim(),

  memoryHackLines: ['Culture / Biology / Development'],

  progressChecklist: [
    'Ξέρω τι μελετά η Πολιτισμική Ψυχολογία',
    'Ξέρω τι εξετάζει η Βιολογική Ψυχολογία',
    'Ξέρω τι διερευνά η Αναπτυξιακή Ψυχολογία',
    'Ξέρω τον SOS πίνακα (5 κλάδοι)',
    'Μπορώ να διακρίνω τους τρεις κλάδους του μαθήματος',
  ],
}

export const otherBranchesMeta = {
  slug: 'other-branches',
  title: otherBranchesLesson.title,
  short: 'Πολιτισμική, βιολογική, αναπτυξιακή + πίνακας SOS',
}

export const otherBranchesExamQuestions = [
  {
    id: 'exam-other-branches-1',
    question: 'Περιγράψε συνοπτικά τους τρεις κλάδους του PPT (πολιτισμική, βιολογική, αναπτυξιακή).',
    idealAnswer: `Η Πολιτισμική Ψυχολογία μελετά πώς οι πολιτισμοί αντανακλούν και επηρεάζουν τις ψυχικές διεργασίες. Η Βιολογική Ψυχολογία εξετάζει τις βιολογικές βάσεις της συμπεριφοράς και των νοητικών λειτουργιών. Η Αναπτυξιακή Ψυχολογία διερευνά αλλαγές στη συμπεριφορά και τις νοητικές λειτουργίες κατά την ανάπτυξη.`,
  },
  {
    id: 'exam-other-branches-2',
    question: 'Με τι συνδέεται η Βιολογική Ψυχολογία σύμφωνα με το υλικό;',
    idealAnswer: `Με τις βιολογικές βάσεις της συμπεριφοράς και των νοητικών λειτουργιών.`,
  },
]

export const otherBranchesFlashcards = [
  {
    id: 'fc-other-branches-1',
    categoryId: 'otherBranches',
    front: 'Τι μελετά η Πολιτισμική Ψυχολογία;',
    back: 'Πώς οι πολιτισμοί αντανακλούν και επηρεάζουν τις ψυχικές διεργασίες.',
  },
  {
    id: 'fc-other-branches-2',
    categoryId: 'otherBranches',
    front: 'Τι εξετάζει η Βιολογική Ψυχολογία;',
    back: 'Τις βιολογικές βάσεις της συμπεριφοράς και των νοητικών λειτουργιών.',
  },
  {
    id: 'fc-other-branches-3',
    categoryId: 'otherBranches',
    front: 'Τι διερευνά η Αναπτυξιακή Ψυχολογία;',
    back: 'Αλλαγές στη συμπεριφορά και τις νοητικές λειτουργίες κατά την ανάπτυξη.',
  },
  {
    id: 'fc-other-branches-4',
    categoryId: 'otherBranches',
    front: 'Στον SOS πίνακα: εστίαση Κοινωνικής Ψυχολογίας;',
    back: 'Κοινωνική συμπεριφορά.',
  },
]

const otherTfQuestions = [
  {
    id: 'q-other-branches-tf-1',
    categoryId: 'otherBranches',
    type: 'tf',
    question: 'Η Βιολογική Ψυχολογία σχετίζεται με βιολογικές βάσεις συμπεριφοράς.',
    options: ['Σωστό', 'Λάθος'],
    correctIndex: 0,
    explanation: 'Αυτό ορίζεται στο PPT.',
  },
  {
    id: 'q-other-branches-tf-2',
    categoryId: 'otherBranches',
    type: 'tf',
    question: 'Η Αναπτυξιακή Ψυχολογία αφορά αλλαγές κατά την ανάπτυξη του ατόμου.',
    options: ['Σωστό', 'Λάθος'],
    correctIndex: 0,
    explanation: 'Διερευνά αλλαγές στη συμπεριφορά και νόηση στην ανάπτυξη.',
  },
  {
    id: 'q-other-branches-tf-3',
    categoryId: 'otherBranches',
    type: 'tf',
    question: 'Η Πολιτισμική Ψυχολογία αγνοεί τον ρόλο του πολιτισμού.',
    options: ['Σωστό', 'Λάθος'],
    correctIndex: 1,
    explanation: 'Μελετά ακριβώς πολιτισμό και ψυχικές διεργασίες.',
  },
]

const rawOtherMcq = [
  {
    question: 'Η Πολιτισμική Ψυχολογία εστιάζει σε:',
    options: [
      'Πολιτισμό και ψυχικές διεργασίες',
      'Μόνο ύπνο',
      'Μόνο Milgram',
      'Μόνο αναλυτικά προγράμματα',
    ],
    answer: 'Πολιτισμό και ψυχικές διεργασίες',
    explanation: 'Σύμφωνα με τον ορισμό του PPT.',
  },
  {
    question: 'Η Αναπτυξιακή Ψυχολογία αφορά:',
    options: [
      'Αλλαγές κατά την ανάπτυξη',
      'Μόνο ενήλικες χωρίς εξέλιξη',
      'Μόνο συμμόρφωση Asch',
      'Μόνο φυσική επιλογή',
    ],
    answer: 'Αλλαγές κατά την ανάπτυξη',
    explanation: 'Αλλαγές συμπεριφοράς και νοητικών λειτουργιών στην ανάπτυξη.',
  },
  {
    question: 'Στον SOS πίνακα, η Εκπαιδευτική Ψυχολογία εστιάζει σε:',
    options: [
      'Μάθηση και διδασκαλία',
      'Μόνο ρατσισμό',
      'Μόνο υπακοή',
      'Μόνο νευρώνες χωρίς συμπεριφορά',
    ],
    answer: 'Μάθηση και διδασκαλία',
    explanation: 'Όπως στον πίνακα ανασκόπησης του PPT.',
  },
]

function normalizeMcq(raw, i, prefix) {
  const correctIndex = raw.options.indexOf(raw.answer)
  return {
    id: `q-${prefix}-mcq-${i + 1}`,
    categoryId: 'otherBranches',
    type: 'mcq',
    question: raw.question,
    options: raw.options,
    correctIndex: correctIndex >= 0 ? correctIndex : 0,
    explanation: raw.explanation,
  }
}

export const otherBranchesQuizQuestions = [
  ...otherTfQuestions,
  ...rawOtherMcq.map((r, i) => normalizeMcq(r, i, 'other-branches')),
]

export const otherBranchesLessonQuizIds = otherBranchesQuizQuestions.map((q) => q.id)
