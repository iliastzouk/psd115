/**
 * Εβδομάδα 1 — Edward Thorndike · Λειτουργική / συντελεστική εξαρτημένη μάθηση
 * Συμπαγές · ευθυγραμμισμένο με την ενότητα.
 */

export const thorndikeLesson = {
  title: 'Edward Thorndike — Λειτουργική / Συντελεστική Μάθηση',

  pptSlide: `Edward Thorndike
Λειτουργικές συμπεριφορές
Νόμος του αποτελέσματος`.trim(),

  theory: `Ο Edward Thorndike μελέτησε τις λειτουργικές συμπεριφορές και διατύπωσε τον Νόμο του Αποτελέσματος.`.trim(),

  lawOfEffectTitle: 'Νόμος του Αποτελέσματος',

  lawOfEffect: `Σύμφωνα με τον Νόμο του Αποτελέσματος, οι συμπεριφορές που οδηγούν σε θετικά αποτελέσματα έχουν περισσότερες πιθανότητες να επαναληφθούν.`.trim(),

  keyPoints: [
    'Edward Thorndike',
    'Λειτουργικές συμπεριφορές',
    'Νόμος του αποτελέσματος',
    'Οι επιτυχημένες συμπεριφορές επαναλαμβάνονται',
  ],

  experiment: `Ο Thorndike χρησιμοποίησε ζώα σε ειδικά κουτιά («puzzle box») και παρατήρησε ότι μάθαιναν σταδιακά να εκτελούν συμπεριφορές που οδηγούσαν σε επιτυχία (δοκιμή–λάθος).`.trim(),

  examTrapIntro: 'ΠΡΟΣΟΧΗ',

  examTrapBody: `Ο Thorndike συνδέεται με τον Νόμο του Αποτελέσματος — όχι με ασυνείδητες συγκρούσεις (Freud).`.trim(),

  memoryHackLines: ['Thorndike = Law of Effect', 'Θετικό αποτέλεσμα → επανάληψη', 'Λειτουργικές συμπεριφορές'],

  progressChecklist: [
    'Ξέρω ποιος ήταν ο Thorndike',
    'Ξέρω τι είναι ο Νόμος του Αποτελέσματος',
    'Ξέρω τι συμβαίνει στις επιτυχημένες συμπεριφορές',
    'Μπορώ να το εξηγήσω σε ανάπτυξη',
  ],
}

export const thorndikeMemoryHacks = thorndikeLesson.memoryHackLines

export const thorndikeChecklist = thorndikeLesson.progressChecklist

export const thorndikeMeta = {
  slug: 'thorndike',
  title: thorndikeLesson.title,
  short: 'Νόμος του αποτελέσματος, λειτουργικές συμπεριφορές, puzzle box',
}

export const thorndikeExamQuestions = [
  {
    id: 'exam-thorndike-1',
    question: 'Τι είναι ο Νόμος του Αποτελέσματος;',
    idealAnswer: `Ο Νόμος του Αποτελέσματος του Edward Thorndike υποστηρίζει ότι οι συμπεριφορές που οδηγούν σε θετικά αποτελέσματα έχουν περισσότερες πιθανότητες να επαναληφθούν.`,
  },
]

export const thorndikeFlashcards = [
  {
    id: 'fc-thorndike-1',
    categoryId: 'thorndike',
    front: 'Ποιος διατύπωσε τον Νόμο του Αποτελέσματος;',
    back: 'Ο Edward Thorndike.',
  },
  {
    id: 'fc-thorndike-2',
    categoryId: 'thorndike',
    front: 'Τι υποστηρίζει ο Νόμος του Αποτελέσματος;',
    back: 'Ότι οι συμπεριφορές με θετικά αποτελέσματα επαναλαμβάνονται.',
  },
  {
    id: 'fc-thorndike-3',
    categoryId: 'thorndike',
    front: 'Τι μελέτησε ο Thorndike;',
    back: 'Τις λειτουργικές συμπεριφορές.',
  },
]

const thorndikeTfQuestions = [
  {
    id: 'q-thorndike-tf-1',
    categoryId: 'thorndike',
    type: 'tf',
    question: 'Ο Thorndike διατύπωσε τον Νόμο του Αποτελέσματος.',
    options: ['Σωστό', 'Λάθος'],
    correctIndex: 0,
    explanation: 'Αποτελεί βασική συνεισφορά του.',
  },
  {
    id: 'q-thorndike-tf-2',
    categoryId: 'thorndike',
    type: 'tf',
    question: 'Οι συμπεριφορές με θετικά αποτελέσματα επαναλαμβάνονται.',
    options: ['Σωστό', 'Λάθος'],
    correctIndex: 0,
    explanation: 'Αυτό υποστηρίζει ο Νόμος του Αποτελέσματος.',
  },
  {
    id: 'q-thorndike-tf-3',
    categoryId: 'thorndike',
    type: 'tf',
    question: 'Ο Thorndike εστίασε στις ασυνείδητες συγκρούσεις.',
    options: ['Σωστό', 'Λάθος'],
    correctIndex: 1,
    explanation: 'Αυτό σχετίζεται με τον Freud.',
  },
]

const rawThorndikeMcq = [
  {
    question: 'Με ποια έννοια συνδέεται ο Thorndike;',
    options: ['Ασυνείδητο', 'Νόμος του Αποτελέσματος', 'Αυτοπραγμάτωση', 'Ψυχανάλυση'],
    answer: 'Νόμος του Αποτελέσματος',
    explanation: 'Ο Thorndike διατύπωσε τον Νόμο του Αποτελέσματος.',
  },
  {
    question: 'Τι συμβαίνει στις συμπεριφορές που έχουν θετικό αποτέλεσμα;',
    options: ['Εξαφανίζονται', 'Επαναλαμβάνονται', 'Αγνοούνται', 'Καταστέλλονται'],
    answer: 'Επαναλαμβάνονται',
    explanation: 'Οι επιτυχημένες συμπεριφορές ενισχύονται.',
  },
]

function normalizeMcq(raw, i) {
  const correctIndex = raw.options.indexOf(raw.answer)
  return {
    id: `q-thorndike-mcq-${i + 1}`,
    categoryId: 'thorndike',
    type: 'mcq',
    question: raw.question,
    options: raw.options,
    correctIndex: correctIndex >= 0 ? correctIndex : 0,
    explanation: raw.explanation,
  }
}

export const thorndikeQuizQuestions = [...thorndikeTfQuestions, ...rawThorndikeMcq.map(normalizeMcq)]

export const thorndikeLessonQuizIds = thorndikeQuizQuestions.map((q) => q.id)
