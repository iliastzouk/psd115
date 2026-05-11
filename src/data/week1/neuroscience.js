/**
 * Εβδομάδα 1 — Γνωστική νευροεπιστήμη, Paul Broca, Karl Lashley
 * Ενιαίο μάθημα · κοινό checklist (όπως στο PDF block).
 */

export const neuroscienceIntro = {
  title: 'Γνωστική Νευροεπιστήμη — Broca & Lashley',

  pptSlide: `Γνωστική νευροεπιστήμη · εγκέφαλος & γνώση
Paul Broca — παραγωγή λόγου (αριστερό ημισφαίριο)
Karl Lashley — μάθηση & μνήμη (λαβύρινθος)`.trim(),
}

export const cognitiveNeuroscienceBlock = {
  title: 'Γνωστική Νευροεπιστήμη',

  theory: `Η γνωστική νευροεπιστήμη συνδέει τις ψυχολογικές διεργασίες με τις λειτουργίες του νευρικού συστήματος και του εγκεφάλου.`.trim(),

  behavioralNeuroscienceTitle: 'Συμπεριφορική Νευροεπιστήμη',

  behavioralNeuroscience: `Η συμπεριφορική νευροεπιστήμη αποτελεί προσέγγιση που ενώνει τις ψυχολογικές διεργασίες με τις δράσεις στο νευρικό σύστημα και άλλες σωματικές διεργασίες.`.trim(),

  brainDamageTitle: 'Μελέτη Εγκεφαλικών Βλαβών',

  brainDamage: `Η μελέτη ατόμων με εγκεφαλικές βλάβες βοήθησε στην κατανόηση των γνωστικών λειτουργιών και της σχέσης τους με συγκεκριμένες περιοχές του εγκεφάλου.`.trim(),

  brainScanningTitle: 'Ηλεκτρονική Σάρωση Εγκεφάλου',

  brainScanning: `Από τα τέλη της δεκαετίας του 1980 αναπτύχθηκαν τεχνικές ηλεκτρονικής σάρωσης εγκεφάλου που βοήθησαν σημαντικά τη γνωστική νευροεπιστήμη.`.trim(),

  keyPoints: ['Γνωστική νευροεπιστήμη', 'Νευρικό σύστημα', 'Γνωστικές λειτουργίες', 'Εγκεφαλικές βλάβες', 'Ηλεκτρονική σάρωση εγκεφάλου'],

  examTrapIntro: 'ΠΡΟΣΟΧΗ',

  examTrapBody: `Η γνωστική νευροεπιστήμη συνδέει τον εγκέφαλο με τις γνωστικές λειτουργίες.`.trim(),
}

export const brocaBlock = {
  title: 'Paul Broca (1825-1880)',

  theory: `Ο Paul Broca μελέτησε ασθενή με βλάβη σε μικρό κομμάτι του αριστερού ημισφαιρίου του εγκεφάλου.`.trim(),

  languageFunctions: `Η περιοχή Broca σχετίζεται με:
• παραγωγή λόγου
• δημιουργία δομής πρότασης
• εφαρμογή γραμματικών κανόνων
• σιωπηρή ανάγνωση`.trim(),

  keyPoints: ['Paul Broca', 'Αριστερό ημισφαίριο', 'Παραγωγή λόγου', 'Γραμματικοί κανόνες', 'Δομή πρότασης'],

  examTrapIntro: 'ΠΡΟΣΟΧΗ',

  examTrapBody: `Ο Broca συνδέεται με την παραγωγή λόγου.`.trim(),
}

export const lashleyBlock = {
  title: 'Karl Lashley',

  theory: `Ο Karl Lashley μελέτησε τη μάθηση και τη μνήμη χρησιμοποιώντας πειράματα με λαβύρινθους.`.trim(),

  keyPoints: ['Karl Lashley', 'Λαβύρινθος', 'Μάθηση', 'Μνήμη'],

  examTrapIntro: 'ΠΡΟΣΟΧΗ',

  examTrapBody: `Ο Lashley συνδέεται με πειράματα λαβυρίνθου.`.trim(),
}

export const neuroscienceMeta = {
  slug: 'neuroscience',
  title: neuroscienceIntro.title,
  short: 'Εγκέφαλος & γνώση, Broca, Lashley — λαβύρινθος',
}

export const neuroscienceChecklist = [
  'Ξέρω τι είναι η γνωστική νευροεπιστήμη',
  'Ξέρω τη σχέση εγκεφάλου και γνωστικών λειτουργιών',
  'Ξέρω ποιος ήταν ο Paul Broca',
  'Ξέρω ότι ο Broca συνδέεται με την παραγωγή λόγου',
  'Ξέρω ποιος ήταν ο Karl Lashley',
  'Ξέρω ότι ο Lashley χρησιμοποίησε λαβύρινθους',
]

export const neuroscienceMemoryHackLines = [
  'Brain + cognition = cognitive neuroscience',
  'Broca = speech production',
  'Lashley = maze',
]

export const neuroscienceExamQuestions = [
  {
    id: 'exam-neuro-1',
    question: 'Τι μελετά η γνωστική νευροεπιστήμη και πώς σχετίζεται με τις εγκεφαλικές βλάβες και τη σάρωση εγκεφάλου;',
    idealAnswer: `Η γνωστική νευροεπιστήμη συνδέει τις ψυχολογικές/γνωστικές διεργασίες με το νευρικό σύστημα και τον εγκέφαλο. Η μελέτη ατόμων με εγκεφαλικές βλάβες βοήθησε να κατανοήσουμε ποιες λειτουργίες σχετίζονται με ποιες περιοχές. Από τα τέλη της δεκαετίας του 1980 οι τεχνικές ηλεκτρονικής σάρωσης εγκεφάλου ενίσχυσαν σημαντικά το πεδίο.`,
  },
  {
    id: 'exam-neuro-2',
    question: 'Περιέγραψε τη συνεισφορά του Paul Broca.',
    idealAnswer: `Ο Broca μελέτησε ασθενή με βλάβη σε μικρή περιοχή του αριστερού ημισφαιρίου. Η περιοχή Broca συνδέεται με την παραγωγή λόγου, τη δομή πρότασης, την εφαρμογή γραμματικών κανόνων και τη σιωπηρή ανάγνωση.`,
  },
  {
    id: 'exam-neuro-3',
    question: 'Τι μελέτησε ο Karl Lashley και ποια μεθοδολογία χρησιμοποίησε;',
    idealAnswer: `Ο Lashley μελέτησε τη μάθηση και τη μνήμη χρησιμοποιώντας πειράματα με λαβύρινθους.`,
  },
]

export const neuroscienceFlashcards = [
  {
    id: 'fc-neuro-cn-1',
    categoryId: 'neuroscience',
    front: 'Τι μελετά η γνωστική νευροεπιστήμη;',
    back: 'Τη σχέση των γνωστικών λειτουργιών με το νευρικό σύστημα και τον εγκέφαλο.',
  },
  {
    id: 'fc-neuro-cn-2',
    categoryId: 'neuroscience',
    front: 'Τι είναι η συμπεριφορική νευροεπιστήμη;',
    back: 'Προσέγγιση που συνδέει ψυχολογικές διεργασίες με το νευρικό σύστημα.',
  },
  {
    id: 'fc-neuro-cn-3',
    categoryId: 'neuroscience',
    front: 'Πώς βοήθησαν οι εγκεφαλικές βλάβες την έρευνα;',
    back: 'Στην κατανόηση των λειτουργιών διαφορετικών περιοχών του εγκεφάλου.',
  },
  {
    id: 'fc-neuro-cn-4',
    categoryId: 'neuroscience',
    front: 'Τι συνέβη στα τέλη της δεκαετίας του 1980;',
    back: 'Αναπτύχθηκαν τεχνικές ηλεκτρονικής σάρωσης εγκεφάλου.',
  },
  {
    id: 'fc-neuro-broca-1',
    categoryId: 'neuroscience',
    front: 'Με τι συνδέεται ο Broca;',
    back: 'Με την παραγωγή λόγου.',
  },
  {
    id: 'fc-neuro-broca-2',
    categoryId: 'neuroscience',
    front: 'Σε ποιο ημισφαίριο εντόπισε βλάβη ο Broca;',
    back: 'Στο αριστερό ημισφαίριο.',
  },
  {
    id: 'fc-neuro-broca-3',
    categoryId: 'neuroscience',
    front: 'Ποιες λειτουργίες σχετίζονται με την περιοχή Broca;',
    back: 'Παραγωγή λόγου και εφαρμογή γραμματικών κανόνων.',
  },
  {
    id: 'fc-neuro-lashley-1',
    categoryId: 'neuroscience',
    front: 'Τι μελέτησε ο Karl Lashley;',
    back: 'Τη μάθηση και τη μνήμη.',
  },
  {
    id: 'fc-neuro-lashley-2',
    categoryId: 'neuroscience',
    front: 'Τι χρησιμοποιούσε ο Lashley στα πειράματά του;',
    back: 'Λαβύρινθους.',
  },
]

const neuroTfQuestions = [
  {
    id: 'q-neuro-tf-1',
    categoryId: 'neuroscience',
    type: 'tf',
    question: 'Η γνωστική νευροεπιστήμη συνδέει γνωστικές λειτουργίες με τον εγκέφαλο και το νευρικό σύστημα.',
    options: ['Σωστό', 'Λάθος'],
    correctIndex: 0,
    explanation: 'Συνδέει ψυχολογικές/γνωστικές διεργασίες με νευρικές λειτουργίες.',
  },
  {
    id: 'q-neuro-tf-2',
    categoryId: 'neuroscience',
    type: 'tf',
    question: 'Η περιοχή Broca συνδέεται κυρίως με την παραγωγή λόγου.',
    options: ['Σωστό', 'Λάθος'],
    correctIndex: 0,
    explanation: 'Ο Broca συνδέεται με παραγωγή λόγου (αριστερό ημισφαίριο).',
  },
  {
    id: 'q-neuro-tf-3',
    categoryId: 'neuroscience',
    type: 'tf',
    question: 'Ο Karl Lashley χρησιμοποίησε κυρίως λαβύρινθους στα πειράματά του.',
    options: ['Σωστό', 'Λάθος'],
    correctIndex: 0,
    explanation: 'Τα πειράματα λαβυρίνθου είναι το βασικό του εργαλείο στο υλικό.',
  },
  {
    id: 'q-neuro-tf-4',
    categoryId: 'neuroscience',
    type: 'tf',
    question: 'Η συμπεριφορική νευροεπιστήμη αποσυνδέει εντελώς τις ψυχολογικές διεργασίες από το σώμα.',
    options: ['Σωστό', 'Λάθος'],
    correctIndex: 1,
    explanation: 'Συνδέει ψυχολογικές διεργασίες με νευρικό σύστημα και σωματικές διεργασίες.',
  },
]

const rawNeuroMcq = [
  {
    question: 'Σε ποιο ημισφαίριο εντόπισε ο Broca βλάβη στον ασθενή του;',
    options: ['Δεξί', 'Αριστερό', 'Και τα δύο εξίσου', 'Τον εγκέφαλο του μικρού εντέρου'],
    answer: 'Αριστερό',
    explanation: 'Το υλικό αναφέρει βλάβη στο αριστερό ημισφαίριο.',
  },
  {
    question: 'Πότε αναπτύχθηκαν σημαντικές τεχνικές ηλεκτρονικής σάρωσης εγκεφάλου κατά το υλικό;',
    options: ['Τέλη 1970', 'Τέλη 1980', 'Τέλη 1990', 'Αρχές 2000'],
    answer: 'Τέλη 1980',
    explanation: 'Από τα τέλη της δεκαετίας του 1980.',
  },
  {
    question: 'Ο Lashley μελέτησε κυρίως:',
    options: ['Όνειρα', 'Μάθηση και μνήμη με λαβύρινθο', 'Μόνο αντίληψη χρώματος', 'Ψυχανάλυση'],
    answer: 'Μάθηση και μνήμη με λαβύρινθο',
    explanation: 'Μάθηση, μνήμη, λαβύρινθος.',
  },
]

function normalizeMcq(raw, i) {
  const correctIndex = raw.options.indexOf(raw.answer)
  return {
    id: `q-neuro-mcq-${i + 1}`,
    categoryId: 'neuroscience',
    type: 'mcq',
    question: raw.question,
    options: raw.options,
    correctIndex: correctIndex >= 0 ? correctIndex : 0,
    explanation: raw.explanation,
  }
}

export const neuroscienceQuizQuestions = [...neuroTfQuestions, ...rawNeuroMcq.map(normalizeMcq)]

export const neuroscienceLessonQuizIds = neuroscienceQuizQuestions.map((q) => q.id)
