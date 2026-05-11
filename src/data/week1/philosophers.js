/**
 * Εβδομάδα 1 — Φιλόσοφοι / Ιστορία (Πλάτωνας, Αριστοτέλης, Descartes, Hobbes)
 */

export const philosophers = {
  title: 'Η αρχή της Ψυχολογίας',

  intro: `Η ψυχολογία ξεκίνησε μέσα από τη φιλοσοφία.
Οι πρώτοι φιλόσοφοι προσπάθησαν να εξηγήσουν:
• τι είναι ο νους
• πώς λειτουργεί ο άνθρωπος
• ποια είναι η σχέση νου και σώματος`,

  sections: [
    {
      name: 'Πλάτωνας',
      years: '427–347 π.Χ.',
      theory: 'Δυϊσμός',
      content: `Ο Πλάτωνας πίστευε ότι ο νους και το σώμα είναι δύο ξεχωριστές οντότητες.

Η ψυχή υπάρχει ανεξάρτητα από το σώμα.`,
      keyPoints: ['Νους ≠ σώμα', 'Η ψυχή είναι ξεχωριστή', 'Υποστήριξε τον δυϊσμό'],
      memoryHack: 'Πλάτωνας = δύο κόσμοι → νους και σώμα χωριστά',
    },
    {
      name: 'Αριστοτέλης',
      years: '384–322 π.Χ.',
      theory: 'Ενότητα νου και σώματος',
      content: `Ο Αριστοτέλης πίστευε ότι ο νους και το σώμα συνδέονται μεταξύ τους.

Δεν θεωρούσε ότι είναι δύο τελείως ανεξάρτητα πράγματα.`,
      keyPoints: ['Νους + σώμα συνδέονται', 'Διαφωνούσε με τον Πλάτωνα'],
      memoryHack: 'Αριστοτέλης = σύνδεση',
    },
    {
      name: 'Descartes',
      years: '1596–1650',
      theory: 'Δυϊσμός',
      content: `Ο Descartes πίστευε ότι το σώμα λειτουργεί μηχανικά ενώ ο νους είναι ξεχωριστός.

Διάσημη φράση:
«Σκέφτομαι άρα υπάρχω».`,
      keyPoints: ['Νους ξεχωριστός από σώμα', 'Cogito ergo sum', 'Το σώμα λειτουργεί σαν μηχανή'],
      memoryHack: 'Descartes = σκέφτομαι άρα υπάρχω',
    },
    {
      name: 'Hobbes',
      years: '1588–1679',
      theory: 'Υλισμός',
      content: `Ο Hobbes πίστευε ότι όλες οι σκέψεις και τα συναισθήματα εξηγούνται από φυσικές λειτουργίες του σώματος.

Δεν πίστευε σε ξεχωριστό νου.`,
      keyPoints: ['Όλα είναι ύλη', 'Οι σκέψεις προέρχονται από το σώμα', 'Αντίθετος στον δυϊσμό'],
      memoryHack: 'Hobbes = όλα είναι σώμα',
    },
  ],

  comparisonTable: [
    { philosopher: 'Πλάτωνας', belief: 'Νους και σώμα χωριστά' },
    { philosopher: 'Αριστοτέλης', belief: 'Νους και σώμα συνδέονται' },
    { philosopher: 'Descartes', belief: 'Δυϊσμός' },
    { philosopher: 'Hobbes', belief: 'Υλισμός' },
  ],
}

const rawPhilosopherQuiz = [
  {
    question: 'Ποιος υποστήριξε τον δυϊσμό;',
    options: ['Hobbes', 'Πλάτωνας', 'Skinner', 'Watson'],
    answer: 'Πλάτωνας',
    explanation: 'Ο Πλάτωνας πίστευε ότι νους και σώμα είναι ξεχωριστά.',
  },
  {
    question: 'Ποιος είπε «Σκέφτομαι άρα υπάρχω»;',
    options: ['Freud', 'James', 'Descartes', 'Αριστοτέλης'],
    answer: 'Descartes',
    explanation: 'Η διάσημη φράση ανήκει στον René Descartes.',
  },
  {
    question: 'Ποιος πίστευε ότι όλα εξηγούνται μέσω της ύλης;',
    options: ['Hobbes', 'Πλάτωνας', 'Freud', 'Wundt'],
    answer: 'Hobbes',
    explanation: 'Ο Hobbes υποστήριζε τον υλισμό.',
  },
]

function toQuizItem(raw, i) {
  const correctIndex = raw.options.indexOf(raw.answer)
  return {
    id: `q-philo-${i + 1}`,
    categoryId: 'history',
    type: 'mcq',
    question: raw.question,
    options: raw.options,
    correctIndex: correctIndex >= 0 ? correctIndex : 0,
    explanation: raw.explanation,
  }
}

export const philosophersQuizQuestions = rawPhilosopherQuiz.map(toQuizItem)

export const philosopherLessonQuizIds = philosophersQuizQuestions.map((q) => q.id)

export const philosopherFlashcards = [
  {
    id: 'fc-philo-1',
    categoryId: 'history',
    front: 'Τι είναι ο δυϊσμός;',
    back: 'Η άποψη ότι νους και σώμα είναι ξεχωριστές οντότητες.',
  },
  {
    id: 'fc-philo-2',
    categoryId: 'history',
    front: 'Τι πίστευε ο Πλάτωνας;',
    back: 'Ότι ο νους και το σώμα είναι ξεχωριστά.',
  },
  {
    id: 'fc-philo-3',
    categoryId: 'history',
    front: 'Τι πίστευε ο Αριστοτέλης;',
    back: 'Ότι νους και σώμα συνδέονται.',
  },
  {
    id: 'fc-philo-4',
    categoryId: 'history',
    front: 'Ποιος είπε «Σκέφτομαι άρα υπάρχω»;',
    back: 'Ο René Descartes.',
  },
  {
    id: 'fc-philo-5',
    categoryId: 'history',
    front: 'Τι πίστευε ο Hobbes;',
    back: 'Ότι όλα εξηγούνται από φυσικές λειτουργίες του σώματος.',
  },
]

export const philosopherExamQuestions = [
  {
    id: 'exam-philo-1',
    question:
      'Σύγκρινε τον Πλάτωνα και τον Αριστοτέλη σχετικά με τη σχέση νου και σώματος.',
    idealAnswer: `Ο Πλάτωνας υποστήριζε τον δυϊσμό και πίστευε ότι ο νους και το σώμα είναι ξεχωριστές οντότητες.

Αντίθετα, ο Αριστοτέλης θεωρούσε ότι ο νους και το σώμα συνδέονται μεταξύ τους και δεν αποτελούν πλήρως ανεξάρτητα στοιχεία.`,
  },
  {
    id: 'exam-philo-2',
    question: 'Τι υποστήριζε ο Descartes;',
    idealAnswer: `Ο Descartes πίστευε στον δυϊσμό, δηλαδή ότι ο νους και το σώμα είναι ξεχωριστά. Υποστήριζε επίσης ότι το σώμα λειτουργεί μηχανικά ενώ ο νους αποτελεί διαφορετική οντότητα.`,
  },
]
