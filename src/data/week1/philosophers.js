/**
 * Εβδομάδα 1 — Φιλόσοφοι / Ιστορία (PSD115 — ευθυγράμμιση με PPT)
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
      theory: 'Εμφυτισμός / Νατιβισμός',
      content: `Ο Πλάτωνας υποστήριζε ότι κάποιες γνώσεις και ικανότητες είναι έμφυτες.

Πίστευε ότι ο άνθρωπος γεννιέται με ορισμένες ιδέες και δυνατότητες.`,
      keyPoints: ['Εμφυτισμός', 'Νατιβισμός', 'Οι γνώσεις μπορεί να είναι έμφυτες'],
      memoryHack: 'Πλάτωνας = γεννιέσαι με γνώσεις',
    },
    {
      name: 'Αριστοτέλης',
      years: '384–322 π.Χ.',
      theory: 'Tabula Rasa',
      content: `Ο Αριστοτέλης πίστευε ότι ο νους κατά τη γέννηση είναι σαν άγραφος πίνακας.

Η γνώση αποκτάται μέσω της εμπειρίας και της μάθησης.`,
      keyPoints: ['Tabula Rasa', 'Άγραφος πίνακας', 'Η εμπειρία δημιουργεί τη γνώση'],
      memoryHack: 'Αριστοτέλης = γεννιέσαι κενός',
    },
    {
      name: 'René Descartes',
      years: '1596–1650',
      theory: 'Δυϊσμός',
      content: `Ο Descartes πίστευε ότι το σώμα και ο νους είναι διαφορετικά πράγματα.`,
      keyPoints: ['Θεωρία δυϊσμού', 'Σώμα και νους ξεχωριστά'],
      memoryHack: 'Descartes = δυϊσμός (νους ≠ σώμα)',
    },
    {
      name: 'Thomas Hobbes',
      years: '1588–1679',
      theory: 'Υλισμός',
      content: `Ο Hobbes πίστευε ότι ο νους είναι αποτέλεσμα της λειτουργίας του εγκεφάλου.

Οι σκέψεις και οι νοητικές λειτουργίες προέρχονται από φυσικές διεργασίες του σώματος.`,
      keyPoints: ['Ο εγκέφαλος παράγει τον νου', 'Υλισμός', 'Οι σκέψεις εξηγούνται βιολογικά'],
      memoryHack: 'Hobbes = εγκέφαλος → νους',
    },
  ],

  comparisonTable: [
    { philosopher: 'Πλάτωνας', belief: 'Εμφυτισμός / Νατιβισμός' },
    { philosopher: 'Αριστοτέλης', belief: 'Tabula Rasa (άγραφος πίνακας)' },
    { philosopher: 'Descartes', belief: 'Δυϊσμός' },
    {
      philosopher: 'Hobbes',
      belief: '«Ο νους είναι αυτό που κάνει ο εγκέφαλος» · Υλισμός',
    },
  ],
}

const rawPhilosopherQuiz = [
  {
    question: 'Ποιος φιλόσοφος συνδέεται με τον εμφυτισμό / νατιβισμό;',
    options: ['Αριστοτέλης', 'Hobbes', 'Πλάτωνας', 'Descartes'],
    answer: 'Πλάτωνας',
    explanation:
      'Σύμφωνα με το μάθημα: ο Πλάτωνας — έμφυτες γνώσεις / ικανότητες.',
  },
  {
    question: 'Ποιος υποστήριζε το Tabula Rasa (άγραφος πίνακας);',
    options: ['Πλάτωνας', 'Descartes', 'Αριστοτέλης', 'Skinner'],
    answer: 'Αριστοτέλης',
    explanation: 'Ο Αριστοτέλης: κατά τη γέννηση ο νους σαν άγραφος πίνακας· η γνώση από εμπειρία.',
  },
  {
    question: 'Ποιος υποστήριξε τη θεωρία του δυϊσμού (σώμα και νους διαφορετικά);',
    options: ['Hobbes', 'Αριστοτέλης', 'Descartes', 'Watson'],
    answer: 'Descartes',
    explanation: 'Στη διδασκαλία του μαθήματος ο δυϊσμός συνδέεται με τον Descartes.',
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
    front: 'Τι είναι ο δυϊσμός (Descartes);',
    back: 'Ότι το σώμα και ο νους είναι διαφορετικά πράγματα.',
  },
  {
    id: 'fc-philo-2',
    categoryId: 'history',
    front: 'Τι πίστευε ο Πλάτωνας για τις γνώσεις κατά τη γέννηση;',
    back: 'Εμφυτισμός / Νατιβισμός — κάποιες γνώσεις και ικανότητες είναι έμφυτες.',
  },
  {
    id: 'fc-philo-3',
    categoryId: 'history',
    front: 'Τι σημαίνει Tabula Rasa για τον Αριστοτέλη;',
    back: 'Άγραφος πίνακας· η γνώση αποκτάται με εμπειρία και μάθηση.',
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
    front: 'Πώς σχετίζονται νους και εγκέφαλος για τον Hobbes;',
    back: '«Ο νους είναι αυτό που κάνει ο εγκέφαλος» — υλισμός, σκέψεις από φυσικές διεργασίες.',
  },
]

export const philosopherExamQuestions = [
  {
    id: 'exam-philo-1',
    question:
      'Σύγκρινε τον Πλάτωνα και τον Αριστοτέλη όπως παρουσιάζονται στη διάλεξη (εμφυτισμός vs Tabula Rasa).',
    idealAnswer: `Ο Πλάτωνας συνδέεται με τον εμφυτισμό / νατιβισμό: κάποιες γνώσεις και ικανότητες είναι έμφυτες, ο άνθρωπος γεννιέται με ορισμένες ιδέες.

Ο Αριστοτέλης συνδέεται με το Tabula Rasa: ο νους κατά τη γέννηση είναι σαν άγραφος πίνακας και η γνώση αποκτάται μέσω εμπειρίας και μάθησης.`,
  },
  {
    id: 'exam-philo-2',
    question: 'Τι υποστήριζε ο Descartes; Τι ο Hobbes σύμφωνα με τη διαφάνεια;',
    idealAnswer: `Ο Descartes υποστήριζε τη θεωρία του δυϊσμού: το σώμα και ο νους είναι διαφορετικά πράγματα.

Ο Hobbes υποστήριζε τον υλισμό: ο νους είναι αποτέλεσμα της λειτουργίας του εγκεφάλου — «ο νους είναι αυτό που κάνει ο εγκέφαλος».`,
  },
]
