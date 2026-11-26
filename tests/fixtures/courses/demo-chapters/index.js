/**
 * Δοκιμαστικό μάθημα — μόνο για tests (Φάση 6d, Δ1). Συνθετικό περιεχόμενο, γραμμένο για τους ελέγχους· καμία σχέση με
 * πραγματικό μάθημα. Δεν φτάνει ποτέ στην εφαρμογή: μόνο στα tests (ως παράμετρος σε pure συναρτήσεις) και, από τη Φάση
 * 6d-β, στο smoke build.
 *
 * Σκόπιμα διαφορετικό από το PSD115: «Κεφάλαια» αντί για εβδομάδες, 1 / 3 / 2 θέματα, χωρίς legacy διαδρομές, slides ή
 * PDF, δικές του κατηγορίες (μία κοινή σε δύο κεφάλαια), ερωτήσεις με 3 και 5 επιλογές. Σκόπιμα ΙΔΙΑ τοπικά ids με το
 * PSD115 (θέμα «overview», κάρτα «fc-def-1»): τα ids είναι ανά μάθημα.
 */
const categories = [
  { id: 'demo-basics', label: 'Βασικές έννοιες (δοκιμαστικό)' },
  { id: 'demo-kinds', label: 'Είδη και παραδείγματα (δοκιμαστικό)' },
  { id: 'demo-review', label: 'Ανακεφαλαίωση (δοκιμαστικό)' },
]
const cat = (id) => categories.find((c) => c.id === id)

const flashcards = [
  { id: 'fc-def-1', categoryId: 'demo-basics', front: 'Δοκιμαστική κάρτα 1: τι είναι το «άλφα»;', back: 'Συνθετικός ορισμός του «άλφα» για tests.' },
  { id: 'fc-demo-2', categoryId: 'demo-basics', front: 'Δοκιμαστική κάρτα 2: τι είναι το «βήτα»;', back: 'Συνθετικός ορισμός του «βήτα» για tests.' },
  { id: 'fc-demo-3', categoryId: 'demo-kinds', front: 'Δοκιμαστική κάρτα 3: ένα είδος;', back: 'Το «γάμμα» (συνθετικό).' },
  { id: 'fc-demo-4', categoryId: 'demo-kinds', front: 'Δοκιμαστική κάρτα 4: άλλο είδος;', back: 'Το «δέλτα» (συνθετικό).' },
  { id: 'fc-demo-5', categoryId: 'demo-review', front: 'Δοκιμαστική κάρτα 5: σύνοψη;', back: 'Άλφα, βήτα, γάμμα, δέλτα (συνθετικό).' },
]

const quizQuestions = [
  {
    id: 'q-demo-1',
    categoryId: 'demo-basics',
    type: 'mcq',
    question: 'Δοκιμαστική ερώτηση 1 (3 επιλογές): ποιο είναι το «άλφα»;',
    options: ['Η πρώτη έννοια', 'Η δεύτερη έννοια', 'Καμία'],
    correctIndex: 0,
    explanation: 'Συνθετική εξήγηση: το «άλφα» είναι η πρώτη έννοια.',
  },
  {
    id: 'q-demo-2',
    categoryId: 'demo-kinds',
    type: 'mcq',
    question: 'Δοκιμαστική ερώτηση 2 (5 επιλογές): ποιο είναι είδος;',
    options: ['Άλφα', 'Βήτα', 'Γάμμα', 'Έψιλον', 'Ζήτα'],
    correctIndex: 2,
    explanation: 'Συνθετική εξήγηση: το «γάμμα» είναι είδος.',
  },
  {
    id: 'q-demo-3',
    categoryId: 'demo-kinds',
    type: 'tf',
    question: 'Δοκιμαστική ερώτηση 3: το «δέλτα» είναι είδος.',
    options: ['Σωστό', 'Λάθος'],
    correctIndex: 0,
    explanation: 'Συνθετική εξήγηση: ναι.',
  },
  {
    id: 'q-demo-4',
    categoryId: 'demo-review',
    type: 'mcq',
    question: 'Δοκιμαστική ερώτηση 4 (3 επιλογές): τι περιέχει η σύνοψη;',
    options: ['Μόνο το άλφα', 'Όλες τις έννοιες', 'Τίποτα'],
    correctIndex: 1,
    explanation: 'Συνθετική εξήγηση: όλες τις έννοιες.',
  },
]

const exam = {
  ch1: [{ id: 'exam-demo-1', topic: 'Επισκόπηση', question: 'Δοκιμαστική ερώτηση ανάπτυξης 1: περιέγραψε το «άλφα».', idealAnswer: 'Συνθετική ιδανική απάντηση 1.' }],
  ch2: [
    { id: 'exam-demo-2', topic: 'Είδη', question: 'Δοκιμαστική ερώτηση ανάπτυξης 2: σύγκρινε γάμμα και δέλτα.', idealAnswer: 'Συνθετική ιδανική απάντηση 2.' },
    { id: 'exam-demo-3', topic: 'Παραδείγματα', question: 'Δοκιμαστική ερώτηση ανάπτυξης 3: δώσε παράδειγμα.', idealAnswer: 'Συνθετική ιδανική απάντηση 3.' },
  ],
  ch3: [],
}

export const demoChapters = {
  id: 'demo-chapters',
  terms: { unit: 'Κεφάλαιο', units: 'Κεφάλαια', unitShort: 'Κεφ.' },
  units: [
    { id: 'ch1', order: 1, kind: 'chapter', label: 'Κεφάλαιο 1', title: 'Δοκιμαστικό κεφάλαιο: εισαγωγή' },
    { id: 'ch2', order: 2, kind: 'chapter', label: 'Κεφάλαιο 2', title: 'Δοκιμαστικό κεφάλαιο: είδη' },
    { id: 'ch3', order: 3, kind: 'chapter', label: 'Κεφάλαιο 3', title: 'Δοκιμαστικό κεφάλαιο: ανακεφαλαίωση' },
  ],
  topics: [
    { id: 'overview', unit: 'ch1' },
    { id: 'kinds', unit: 'ch2' },
    { id: 'examples', unit: 'ch2' },
    { id: 'comparison', unit: 'ch2' },
    { id: 'summary', unit: 'ch3' },
    { id: 'self-check', unit: 'ch3' },
  ],
  study: {
    categories,
    unitCategories: {
      ch1: [cat('demo-basics')],
      ch2: [cat('demo-kinds')],
      ch3: [cat('demo-kinds'), cat('demo-review')],
    },
    flashcards,
    quizQuestions,
    getCategoryLabel: (id) => cat(id)?.label ?? id,
    examQuestions: { ch1: () => exam.ch1, ch2: () => exam.ch2, ch3: () => exam.ch3 },
  },
  docs: [],
  provenance: { origin: 'original', license: 'own', author: 'Exam Prep — συνθετικό περιεχόμενο tests' },
}
