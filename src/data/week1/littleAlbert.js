/**
 * Εβδομάδα 1 — Little Albert · Watson & Rayner (1920)
 * Συμπαγές · PPT-first · οπτική ροή (όπως Pavlov).
 */

export const littleAlbertLesson = {
  title: 'Little Albert — Watson & Rayner (1920)',

  pptSlide: `Μάθηση φόβου.

Κλασική εξάρτηση.

Watson behaviorism.

Σύνδεση ουδέτερου ερεθίσματος με φόβο.`.trim(),

  pptDiagramSrc: '/little-albert-original.png',
  pptDiagramCaption:
    'Καρέ από το αυθεντικό υλικό (1920): ο Albert ήρεμος με τον λευκό αρουραίο (ουδέτερο πριν τη σύζευξη), επαφή/ενδιαφέρον, γενίκευση σε άλλα γούνινα (σκύλος), έντονος φόβος/κλάμα σε παρόμοιο ερέθισμα (π.χ. κουνέλι) — εξαρτημένη αντίδραση & γενίκευση ερεθίσματος.',

  theory: `Οι Watson και Rayner μελέτησαν πώς μπορεί να δημιουργηθεί φόβος μέσω κλασικής εξαρτημένης μάθησης.

Στο πείραμα, ο μικρός Albert άρχισε να φοβάται έναν λευκό αρουραίο αφού ο αρουραίος συνδυάστηκε με δυνατό θόρυβο. Ο φόβος μπορεί να γενικευτεί και σε άλλα παρόμοια ερεθίσματα (π.χ. άλλα γούνινα ζώα).`.trim(),

  experimentFlowTitle: 'Ροή πειράματος',

  experimentFlow: [
    'Αρχικά ο Albert δεν φοβόταν τον αρουραίο',
    'Ο αρουραίος συνδυάστηκε με δυνατό θόρυβο',
    'Ο Albert άρχισε να φοβάται τον αρουραίο',
  ],

  keyPoints: [
    'Κλασική εξαρτημένη μάθηση',
    'Μάθηση φόβου',
    'Watson και Rayner',
    'Συσχετισμός αρουραίου με θόρυβο',
    'Γενίκευση: φόβος και σε άλλα γούνινα ερεθίσματα',
  ],

  examTrapIntro: 'ΠΡΟΣΟΧΗ',

  examTrapBody: `Ο φόβος δημιουργήθηκε μέσω μάθησης και συσχετισμού — δεν ήταν «έμφυτος» στον αρουραίο πριν το πείραμα.`.trim(),

  memoryHackLines: ['Albert + αρουραίος + θόρυβος → φόβος', 'Μάθηση φόβου', 'Behaviorism εφαρμογή'],

  progressChecklist: [
    'Ξέρω τι είναι το πείραμα του Little Albert',
    'Ξέρω πώς δημιουργήθηκε ο φόβος',
    'Ξέρω ότι σχετίζεται με κλασική μάθηση',
    'Μπορώ να το εξηγήσω σε ανάπτυξη',
  ],
}

export const littleAlbertMemoryHacks = littleAlbertLesson.memoryHackLines

export const littleAlbertChecklist = littleAlbertLesson.progressChecklist

export const littleAlbertMeta = {
  slug: 'little-albert',
  title: littleAlbertLesson.title,
  short: 'Φόβος, κλασική εξάρτηση, Watson — αρουραίος + θόρυβος',
}

export const littleAlbertExamQuestions = [
  {
    id: 'exam-albert-1',
    question: 'Περιέγραψε το πείραμα του Little Albert.',
    idealAnswer: `Οι Watson και Rayner συνέδεσαν έναν λευκό αρουραίο με δυνατό θόρυβο. Μέσω αυτού του συσχετισμού ο μικρός Albert άρχισε να φοβάται τον αρουραίο, παρόλο που αρχικά δεν τον φοβόταν.`,
  },
]

export const littleAlbertFlashcards = [
  {
    id: 'fc-albert-1',
    categoryId: 'littleAlbert',
    front: 'Τι μελέτησαν οι Watson και Rayner;',
    back: 'Πώς δημιουργείται φόβος μέσω μάθησης.',
  },
  {
    id: 'fc-albert-2',
    categoryId: 'littleAlbert',
    front: 'Τι φοβόταν ο Little Albert;',
    back: 'Τον λευκό αρουραίο.',
  },
  {
    id: 'fc-albert-3',
    categoryId: 'littleAlbert',
    front: 'Πώς δημιουργήθηκε ο φόβος;',
    back: 'Με σύνδεση του αρουραίου με δυνατό θόρυβο.',
  },
]

const albertTfQuestions = [
  {
    id: 'q-albert-tf-1',
    categoryId: 'littleAlbert',
    type: 'tf',
    question: 'Ο Little Albert αρχικά φοβόταν τον αρουραίο.',
    options: ['Σωστό', 'Λάθος'],
    correctIndex: 1,
    explanation: 'Ο φόβος δημιουργήθηκε μέσω συσχετισμού.',
  },
  {
    id: 'q-albert-tf-2',
    categoryId: 'littleAlbert',
    type: 'tf',
    question: 'Το πείραμα σχετίζεται με την κλασική εξαρτημένη μάθηση.',
    options: ['Σωστό', 'Λάθος'],
    correctIndex: 0,
    explanation: 'Ο φόβος αποκτήθηκε μέσω μάθησης.',
  },
]

const rawAlbertMcq = [
  {
    question: 'Τι απέδειξε το πείραμα του Little Albert;',
    options: ['Ότι ο φόβος είναι πάντα έμφυτος', 'Ότι ο φόβος μπορεί να μαθευτεί', 'Ότι η μνήμη είναι κληρονομική', 'Ότι η γλώσσα είναι έμφυτη'],
    answer: 'Ότι ο φόβος μπορεί να μαθευτεί',
    explanation: 'Ο φόβος δημιουργήθηκε μέσω συσχετισμού.',
  },
  {
    question: 'Με τι συνδυάστηκε ο αρουραίος;',
    options: ['Με φως', 'Με τροφή', 'Με δυνατό θόρυβο', 'Με τιμωρία'],
    answer: 'Με δυνατό θόρυβο',
    explanation: 'Ο θόρυβος προκάλεσε φόβο.',
  },
]

function normalizeMcq(raw, i) {
  const correctIndex = raw.options.indexOf(raw.answer)
  return {
    id: `q-albert-mcq-${i + 1}`,
    categoryId: 'littleAlbert',
    type: 'mcq',
    question: raw.question,
    options: raw.options,
    correctIndex: correctIndex >= 0 ? correctIndex : 0,
    explanation: raw.explanation,
  }
}

export const littleAlbertQuizQuestions = [...albertTfQuestions, ...rawAlbertMcq.map(normalizeMcq)]

export const littleAlbertLessonQuizIds = littleAlbertQuizQuestions.map((q) => q.id)
