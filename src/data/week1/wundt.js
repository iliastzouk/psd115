/**
 * Εβδομάδα 1 — Δομισμός / Wilhelm Wundt (PSD115)
 */

export const wundtLesson = {
  title: 'Δομισμός — Wilhelm Wundt',

  intro: `Ο Wilhelm Wundt θεωρείται ένας από τους ιδρυτές της επιστημονικής ψυχολογίας.`.trim(),

  theoryTitle: 'Δομισμός',

  theory: `Ο Δομισμός προσπαθούσε να αναλύσει τα βασικά στοιχεία που αποτελούν τον νου και τη συνείδηση.`.trim(),

  laboratory: `Ο Wilhelm Wundt ίδρυσε το πρώτο Ψυχολογικό Εργαστήριο στο Πανεπιστήμιο της Λειψίας στη Γερμανία το 1879.`.trim(),

  consciousness: `Εστίασε στην ανάλυση της συνειδητότητας και της υποκειμενικής εμπειρίας του ανθρώπου.`.trim(),

  introspectionTitle: 'Ενδοσκόπηση',

  introspection: `Η ενδοσκόπηση ήταν πειραματική μέθοδος: μετά από ερεθίσματα (π.χ. λέξεις ή ήχους) οι συμμετέχοντες κατέγραφαν την υποκειμενική τους εμπειρία — συχνά την πρώτη λέξη ή ιδέα που προέκυπτε, και στη συνέχεια ανέλυαν αισθήσεις, συναισθήματα και εσωτερικές εικόνες.`.trim(),

  keyPoints: [
    'Πρώτο εργαστήριο ψυχολογίας',
    'Λειψία Γερμανίας',
    '1879',
    'Μελέτη της συνείδησης',
    'Ανάλυση του νου',
    'Ενδοσκόπηση',
  ],

  weakness: `Η ενδοσκόπηση θεωρήθηκε υποκειμενική μέθοδος επειδή διαφορετικοί άνθρωποι περιέγραφαν διαφορετικά τις εμπειρίες τους.`.trim(),

  examTrapIntro: 'ΠΡΟΣΟΧΗ',

  examTrapBody: `Ο Wundt ενδιαφερόταν για τη δομή της συνείδησης και όχι για τη λειτουργία της.`.trim(),

  memoryHackLines: [
    'Wundt = Δομή',
    'Δομισμός = δομή της συνείδησης',
    'James = λειτουργία',
    'Wundt πριν από James',
  ],

  comparison: [
    { category: 'Wundt', focus: 'Δομή της συνείδησης' },
    { category: 'James', focus: 'Λειτουργία του νου' },
  ],

  progressChecklist: [
    'Ξέρω ποιος ήταν ο Wundt',
    'Ξέρω τι είναι ο Δομισμός',
    'Ξέρω τι είναι η ενδοσκόπηση',
    'Ξέρω γιατί η ενδοσκόπηση θεωρήθηκε υποκειμενική',
    'Ξέρω τη διαφορά Δομισμού και Λειτουργισμού',
  ],
}

/** Συμβατότητα με snippet · ίδιο περιεχόμενο με memoryHackLines */
export const wundtMemoryHacks = wundtLesson.memoryHackLines

export const wundtChecklist = wundtLesson.progressChecklist

export const wundtTraps = [
  {
    wrong: 'Ο Wundt μελετούσε τη λειτουργία του νου.',
    correct: 'Ο Wundt μελετούσε τη δομή της συνείδησης.',
  },
  {
    wrong: 'Η ενδοσκόπηση ήταν αντικειμενική μέθοδος.',
    correct: 'Η ενδοσκόπηση θεωρήθηκε υποκειμενική.',
  },
]

export const wundtExamQuestions = [
  {
    id: 'exam-wundt-1',
    question: 'Τι ήταν ο Δομισμός και ποια μέθοδο χρησιμοποιούσε ο Wundt;',
    idealAnswer: `Ο Δομισμός ήταν ψυχολογική προσέγγιση που προσπαθούσε να αναλύσει τα βασικά στοιχεία του νου και της συνείδησης.

Ο Wilhelm Wundt χρησιμοποιούσε τη μέθοδο της ενδοσκόπησης, κατά την οποία τα άτομα περιέγραφαν τις εσωτερικές εμπειρίες και τα συναισθήματά τους.`,
  },
  {
    id: 'exam-wundt-2',
    question: 'Ποιο ήταν το βασικό μειονέκτημα της ενδοσκόπησης;',
    idealAnswer: `Το βασικό μειονέκτημα της ενδοσκόπησης ήταν ότι θεωρήθηκε υποκειμενική μέθοδος, επειδή διαφορετικοί άνθρωποι περιέγραφαν διαφορετικά τις εμπειρίες τους.`,
  },
]

export const wundtFlashcards = [
  {
    id: 'fc-wundt-1',
    categoryId: 'structuralism',
    front: 'Ποιος ίδρυσε το πρώτο εργαστήριο ψυχολογίας;',
    back: 'Ο Wilhelm Wundt.',
  },
  {
    id: 'fc-wundt-2',
    categoryId: 'structuralism',
    front: 'Τι μελετούσε ο Δομισμός;',
    back: 'Τα βασικά στοιχεία της συνείδησης και του νου.',
  },
  {
    id: 'fc-wundt-3',
    categoryId: 'structuralism',
    front: 'Πού ιδρύθηκε το πρώτο εργαστήριο ψυχολογίας;',
    back: 'Στη Λειψία της Γερμανίας.',
  },
  {
    id: 'fc-wundt-4',
    categoryId: 'structuralism',
    front: 'Τι είναι η ενδοσκόπηση;',
    back: 'Μέθοδος περιγραφής εσωτερικών εμπειριών.',
  },
  {
    id: 'fc-wundt-5',
    categoryId: 'structuralism',
    front: 'Ποιο ήταν το βασικό πρόβλημα της ενδοσκόπησης;',
    back: 'Ήταν υποκειμενική.',
  },
]

const wundtTfQuestions = [
  {
    id: 'q-wundt-tf-1',
    categoryId: 'structuralism',
    type: 'tf',
    question: 'Ο Wundt ίδρυσε το πρώτο εργαστήριο ψυχολογίας.',
    options: ['Σωστό', 'Λάθος'],
    correctIndex: 0,
    explanation: 'Το ίδρυσε στη Λειψία της Γερμανίας.',
  },
  {
    id: 'q-wundt-tf-2',
    categoryId: 'structuralism',
    type: 'tf',
    question: 'Ο Δομισμός μελετούσε τη λειτουργία του νου.',
    options: ['Σωστό', 'Λάθος'],
    correctIndex: 1,
    explanation: 'Μελετούσε τη δομή της συνείδησης.',
  },
  {
    id: 'q-wundt-tf-3',
    categoryId: 'structuralism',
    type: 'tf',
    question: 'Η ενδοσκόπηση θεωρήθηκε υποκειμενική.',
    options: ['Σωστό', 'Λάθος'],
    correctIndex: 0,
    explanation: 'Οι εμπειρίες διαφέρουν από άτομο σε άτομο.',
  },
]

const rawWundtMcq = [
  {
    question: 'Τι προσπαθούσε να αναλύσει ο Δομισμός;',
    options: ['Τη συμπεριφορά', 'Το ασυνείδητο', 'Τη δομή της συνείδησης', 'Τη γλώσσα'],
    answer: 'Τη δομή της συνείδησης',
    explanation: 'Ο Δομισμός αναζητούσε τα βασικά στοιχεία του νου.',
  },
  {
    question: 'Ποια μέθοδο χρησιμοποιούσε ο Wundt;',
    options: ['Ψυχανάλυση', 'Ενδοσκόπηση', 'Κλασική μάθηση', 'Ενίσχυση'],
    answer: 'Ενδοσκόπηση',
    explanation: 'Τα άτομα περιέγραφαν τις εσωτερικές εμπειρίες τους.',
  },
]

function normalizeMcq(raw, i) {
  const correctIndex = raw.options.indexOf(raw.answer)
  return {
    id: `q-wundt-mcq-${i + 1}`,
    categoryId: 'structuralism',
    type: 'mcq',
    question: raw.question,
    options: raw.options,
    correctIndex: correctIndex >= 0 ? correctIndex : 0,
    explanation: raw.explanation,
  }
}

export const wundtQuizQuestions = [...wundtTfQuestions, ...rawWundtMcq.map(normalizeMcq)]

export const wundtLessonQuizIds = wundtQuizQuestions.map((q) => q.id)

export const wundtMeta = {
  slug: 'wundt',
  title: wundtLesson.title,
  short: 'Λειψία 1879, συνειδητότητα, ενδοσκόπηση, δομή vs λειτουργία',
  comingSoon: false,
}
