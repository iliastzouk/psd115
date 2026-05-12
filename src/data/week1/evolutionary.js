/**
 * Εβδομάδα 1 — Εξελικτική Ψυχολογία
 * Darwin · φυσική επιλογή · προσαρμογή · επιβίωση.
 */

export const evolutionaryLesson = {
  title: 'Εξελικτική Ψυχολογία',

  pptSlide: `Εξελικτική Ψυχολογία
Βιολογία · Δαρβίνος · φυσική επιλογή
Συμπεριφορά & νοητικές διεργασίες · εξέλιξη του είδους`.trim(),

  theory: `Η Εξελικτική Ψυχολογία μελετά τη συμπεριφορά και τις νοητικές διεργασίες με βάση τις αρχές της εξέλιξης. Μελετά επίσης την αλλαγή της συμπεριφοράς στα έμβια όντα κατά τη διάρκεια της εξέλιξης του είδους.`.trim(),

  darwinTitle: 'Charles Darwin',

  darwin: `Οι ιδέες του Charles Darwin επηρέασαν σημαντικά την ανάπτυξη της εξελικτικής ψυχολογίας. Έμφαση στη βιολογία και στη θεωρία εξέλιξης του Δαρβίνου.`.trim(),

  naturalSelectionTitle: 'Φυσική Επιλογή',

  naturalSelection: `Η συμπεριφορά των έμβιων όντων θεωρείται αποτέλεσμα μακράς περιόδου εξέλιξης μέσω της φυσικής επιλογής.

Η φυσική επιλογή αναφέρεται στη διαδικασία μέσω της οποίας χαρακτηριστικά που βοηθούν στην επιβίωση και αναπαραγωγή διατηρούνται με την πάροδο του χρόνου.`.trim(),

  speciesLevelTitle: 'Εξέλιξη του είδους',

  speciesLevel: `Μελετά την αλλαγή της συμπεριφοράς στα έμβια όντα κατά τη διάρκεια της εξέλιξης του είδους.`.trim(),

  adaptationTitle: 'Προσαρμογή',

  adaptation: `Οι συμπεριφορές και οι νοητικές διεργασίες θεωρούνται αποτέλεσμα προσαρμογής στις απαιτήσεις του περιβάλλοντος.`.trim(),

  survivalTitle: 'Επιβίωση',

  survival: `Η εξελικτική προσέγγιση υποστηρίζει ότι πολλές ανθρώπινες συμπεριφορές σχετίζονται με την επιβίωση και την αναπαραγωγή.`.trim(),

  keyPoints: [
    'Εξελικτική Ψυχολογία',
    'Charles Darwin · βιολογία',
    'Φυσική επιλογή',
    'Αλλαγή συμπεριφοράς σε επίπεδο είδους',
    'Προσαρμογή',
    'Επιβίωση',
    'Αναπαραγωγή',
  ],

  examTrapIntro: 'ΠΡΟΣΟΧΗ',

  examTrapBody: `Η εξελικτική ψυχολογία συνδέει τη συμπεριφορά με την προσαρμογή και την επιβίωση.`.trim(),

  memoryHackLines: ['Darwin = evolution', 'Είδος = συμπεριφορά στην εξέλιξη', 'Επιβίωση', 'Προσαρμογή', 'Natural selection'],

  progressChecklist: [
    'Ξέρω τι είναι η Εξελικτική Ψυχολογία',
    'Ξέρω ποιος ήταν ο Darwin και τη σχέση με βιολογία/εξέλιξη',
    'Ξέρω τι είναι η φυσική επιλογή',
    'Ξέρω τη μελέτη συμπεριφοράς σε επίπεδο είδους (PPT)',
    'Ξέρω τη σχέση προσαρμογής και επιβίωσης',
    'Μπορώ να εξηγήσω την εξελικτική προσέγγιση',
  ],
}

export const evolutionaryMemoryHacks = evolutionaryLesson.memoryHackLines

export const evolutionaryChecklist = evolutionaryLesson.progressChecklist

export const evolutionaryMeta = {
  slug: 'evolutionary',
  title: evolutionaryLesson.title,
  short: 'Darwin, βιολογία, φυσική επιλογή, εξέλιξη του είδους, προσαρμογή, επιβίωση',
}

export const evolutionaryExamQuestions = [
  {
    id: 'exam-evolutionary-1',
    question: 'Τι μελετά η Εξελικτική Ψυχολογία;',
    idealAnswer: `Η Εξελικτική Ψυχολογία μελετά τη συμπεριφορά και τις νοητικές διεργασίες με βάση τις αρχές της εξέλιξης, της φυσικής επιλογής και της προσαρμογής· μελετά επίσης την αλλαγή της συμπεριφοράς στα έμβια όντα κατά την εξέλιξη του είδους (όπως στο PPT).`,
  },
  {
    id: 'exam-evolutionary-2',
    question: 'Τι είναι η φυσική επιλογή;',
    idealAnswer: `Η φυσική επιλογή είναι η διαδικασία μέσω της οποίας χαρακτηριστικά που βοηθούν στην επιβίωση και αναπαραγωγή διατηρούνται με την πάροδο του χρόνου.`,
  },
]

export const evolutionaryFlashcards = [
  {
    id: 'fc-evolutionary-1',
    categoryId: 'evolutionary',
    front: 'Τι μελετά η Εξελικτική Ψυχολογία;',
    back: 'Τη συμπεριφορά και τις νοητικές διεργασίες με βάση την εξέλιξη· και την αλλαγή συμπεριφοράς σε επίπεδο είδους.',
  },
  {
    id: 'fc-evolutionary-2',
    categoryId: 'evolutionary',
    front: 'Ποιος επηρέασε την Εξελικτική Ψυχολογία;',
    back: 'Ο Charles Darwin.',
  },
  {
    id: 'fc-evolutionary-3',
    categoryId: 'evolutionary',
    front: 'Τι είναι η φυσική επιλογή;',
    back: 'Η διατήρηση χαρακτηριστικών που βοηθούν στην επιβίωση και αναπαραγωγή.',
  },
  {
    id: 'fc-evolutionary-4',
    categoryId: 'evolutionary',
    front: 'Με τι συνδέεται η εξελικτική προσέγγιση (επιβίωση/προσαρμογή);',
    back: 'Με την προσαρμογή και την επιβίωση.',
  },
  {
    id: 'fc-evolutionary-5',
    categoryId: 'evolutionary',
    front: 'Τι μελετά η εξελικτική προσέγγιση σε επίπεδο είδους;',
    back: 'Την αλλαγή της συμπεριφοράς στα έμβια όντα κατά την εξέλιξη του είδους.',
  },
]

const evolutionaryTfQuestions = [
  {
    id: 'q-evolutionary-tf-1',
    categoryId: 'evolutionary',
    type: 'tf',
    question: 'Η Εξελικτική Ψυχολογία επηρεάστηκε από τον Darwin.',
    options: ['Σωστό', 'Λάθος'],
    correctIndex: 0,
    explanation: 'Οι ιδέες του Darwin αποτέλεσαν βασική επιρροή.',
  },
  {
    id: 'q-evolutionary-tf-2',
    categoryId: 'evolutionary',
    type: 'tf',
    question: 'Η φυσική επιλογή σχετίζεται με την επιβίωση.',
    options: ['Σωστό', 'Λάθος'],
    correctIndex: 0,
    explanation: 'Τα προσαρμοστικά χαρακτηριστικά διατηρούνται.',
  },
  {
    id: 'q-evolutionary-tf-3',
    categoryId: 'evolutionary',
    type: 'tf',
    question: 'Η εξελικτική προσέγγιση αγνοεί το περιβάλλον.',
    options: ['Σωστό', 'Λάθος'],
    correctIndex: 1,
    explanation: 'Η προσαρμογή στο περιβάλλον είναι βασική έννοια.',
  },
]

const rawEvolutionaryMcq = [
  {
    question: 'Ποιος συνδέεται με την Εξελικτική Ψυχολογία;',
    options: ['Freud', 'Darwin', 'Skinner', 'Broca'],
    answer: 'Darwin',
    explanation: 'Οι ιδέες του Darwin επηρέασαν την εξελικτική προσέγγιση.',
  },
  {
    question: 'Με τι σχετίζεται η φυσική επιλογή;',
    options: ['Με τα όνειρα', 'Με την επιβίωση', 'Με την τιμωρία', 'Με τη γλώσσα'],
    answer: 'Με την επιβίωση',
    explanation: 'Η φυσική επιλογή ευνοεί χαρακτηριστικά που βοηθούν στην επιβίωση.',
  },
  {
    question: 'Σύμφωνα με το PPT, η εξελικτική ψυχολογία μελετά επίσης:',
    options: [
      'Την αλλαγή της συμπεριφοράς στα έμβια όντα κατά την εξέλιξη του είδους',
      'Μόνο τη διάταξη των εργαστηρίων του Wundt',
      'Μόνο όνειρα χωρίς συμπεριφορά',
      'Μόνο τη γλώσσα χωρίς εξέλιξη',
    ],
    answer: 'Την αλλαγή της συμπεριφοράς στα έμβια όντα κατά την εξέλιξη του είδους',
    explanation: 'Αυτό αναφέρεται ρητά στη διαφάνεια της εξελικτικής ψυχολογίας (K1).',
  },
]

function normalizeMcq(raw, i) {
  const correctIndex = raw.options.indexOf(raw.answer)
  return {
    id: `q-evolutionary-mcq-${i + 1}`,
    categoryId: 'evolutionary',
    type: 'mcq',
    question: raw.question,
    options: raw.options,
    correctIndex: correctIndex >= 0 ? correctIndex : 0,
    explanation: raw.explanation,
  }
}

export const evolutionaryQuizQuestions = [...evolutionaryTfQuestions, ...rawEvolutionaryMcq.map(normalizeMcq)]

export const evolutionaryLessonQuizIds = evolutionaryQuizQuestions.map((q) => q.id)
