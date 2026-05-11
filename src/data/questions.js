/**
 * PSD115 Exam Prep — καθολικό dataset
 * Εβδομάδα 1: data/week1/* · Λοιπά θέματα: legacy παρακάτω (μέχρι να μεταφερθούν σε week1)
 */
import { definitionFlashcards, definitionQuizQuestions } from './week1/definitionPsychology.js'
import { philosopherFlashcards, philosophersQuizQuestions } from './week1/philosophers.js'
import { wundtFlashcards, wundtQuizQuestions } from './week1/wundt.js'
import { functionalismFlashcards, functionalismQuizQuestions } from './week1/functionalism.js'
import { clinicalFlashcards, clinicalQuizQuestions } from './week1/clinicalPsychology.js'

export const CATEGORIES = [
  { id: 'definition', label: 'Ορισμός της Ψυχολογίας' },
  { id: 'history', label: 'Ιστορία της Ψυχολογίας' },
  { id: 'structuralism', label: 'Δομισμός (Structuralism)' },
  { id: 'functionalism', label: 'Λειτουργισμός (Functionalism)' },
  { id: 'clinical', label: 'Κλινική Ψυχολογία' },
  { id: 'psychoanalysis', label: 'Ψυχανάλυση' },
  { id: 'behaviorism', label: 'Συμπεριφορισμός' },
  { id: 'humanistic', label: 'Ανθρωπιστική Ψυχολογία' },
  { id: 'cognitive', label: 'Γνωστική Ψυχολογία' },
  { id: 'gestalt', label: 'Ψυχολογία Gestalt' },
  { id: 'evolutionary', label: 'Εξελικτική Ψυχολογία' },
]

/** Υπόλοιπες κάρτες Εβδ. 1 (μέχρι migration σε week1/*.js) */
const LEGACY_FLASHCARDS = [
  {
    id: 'fc-psy-1',
    categoryId: 'psychoanalysis',
    front: 'Ποιος συνδέεται με την ψυχαναλυτική προσέγγιση;',
    back: 'Sigmund Freud.',
  },
  {
    id: 'fc-psy-2',
    categoryId: 'psychoanalysis',
    front: 'Πώς εξηγεί η ψυχανάλυση τη συμπεριφορά;',
    back: 'Από ασυνείδητες συγκρούσεις και εμπειρίες (π.χ. τραύματα παιδικής ηλικίας) που μπορεί να έχουν απωθηθεί.',
  },
  {
    id: 'fc-psy-3',
    categoryId: 'psychoanalysis',
    front: 'Τι δίνει έμφαση η ψυχαναλυτική θεωρία;',
    back: 'Στις ασυνείδητες ψυχικές διεργασίες στη διαμόρφωση συναισθημάτων, σκέψεων και συμπεριφορών.',
  },
  {
    id: 'fc-beh-1',
    categoryId: 'behaviorism',
    front: 'Τι τονίζει ο Συμπεριφορισμός;',
    back: 'Τη συστηματική μελέτη της παρατηρήσιμης συμπεριφοράς — η άμεση παρατήρηση του «νου» θεωρείται δύσκολη.',
  },
  {
    id: 'fc-beh-2',
    categoryId: 'behaviorism',
    front: 'Δύο γνωστοί εκπρόσωποι του συμπεριφορισμού / σχετικών πειραμάτων;',
    back: 'John Watson (π.χ. Little Albert) και Ivan Pavlov (κλασική εξαρτημένη μάθηση με σκύλους).',
  },
  {
    id: 'fc-beh-3',
    categoryId: 'behaviorism',
    front: 'Ποιο ζεύγος εννοιών χρησιμοποιείται συχνά στη συμπεριφορική ανάλυση μάθησης;',
    back: 'Ερέθισμα — αντίδραση (Ε–Α).',
  },
  {
    id: 'fc-hum-1',
    categoryId: 'humanistic',
    front: 'Ποιοι εκπρόσωποι συνδέονται με την Ανθρωπιστική Ψυχολογία;',
    back: 'Abraham Maslow και Carl Rogers.',
  },
  {
    id: 'fc-hum-2',
    categoryId: 'humanistic',
    front: 'Πώς αντιμετωπίζει το άτομο στην ανθρωπιστική προσέγγιση;',
    back: 'Δίνεται έμφαση στο θετικό δυναμικό, στην ανάπτυξη και στην αξιοποίηση δυνατοτήτων — «πελάτες» αντί «ασθενείς».',
  },
  {
    id: 'fc-cog-1',
    categoryId: 'cognitive',
    front: 'Τι μελετά η Γνωστική Ψυχολογία;',
    back: 'Νοητικές διεργασίες όπως αντίληψη, προσοχή, μνήμη, σκέψη, γλώσσα και μάθηση — συχνά με πειραματικές μεθόδους.',
  },
  {
    id: 'fc-cog-2',
    categoryId: 'cognitive',
    front: 'Ποιος γλωσσολόγος αναφέρεται ως παράδειγμα γνωστικής προσέγγισης στη γλώσσα;',
    back: 'Noam Chomsky — η γλώσσα βασίζεται σε νοητικούς κανόνες (παραλληλισμός με κανόνες βήμα-βήμα).',
  },
  {
    id: 'fc-ges-1',
    categoryId: 'gestalt',
    front: 'Τρεις βασικοί εκπρόσωποι της σχολής Gestalt;',
    back: 'Max Wertheimer, Kurt Koffka και Wolfgang Köhler.',
  },
  {
    id: 'fc-ges-2',
    categoryId: 'gestalt',
    front: 'Ποια είναι η κεντρική ιδέα της Gestalt για τη συνειδητή εμπειρία;',
    back: 'Κατανοείται καλύτερα ως σύνολο και όχι ως απλό άθροισμα επιμέρους στοιχείων.',
  },
  {
    id: 'fc-evo-1',
    categoryId: 'evolutionary',
    front: 'Τι τονίζει η Εξελικτική Ψυχολογία;',
    back: 'Τη βιολογία και τη θεωρία εξέλιξης του Δαρβίνου — η συμπεριφορά ως αποτέλεσμα μακράς φυσικής επιλογής.',
  },
  {
    id: 'fc-evo-2',
    categoryId: 'evolutionary',
    front: 'Τι μελετά σε επίπεδο είδους;',
    back: 'Την αλλαγή της συμπεριφοράς στα έμβια όντα κατά τη διάρκεια της εξέλιξης του είδους.',
  },
]

const LEGACY_QUIZ_QUESTIONS = [
  {
    id: 'q-psy-1',
    categoryId: 'psychoanalysis',
    type: 'mcq',
    question: 'Η ψυχαναλυτική θεωρία δίνει ιδιαίτερη έμφαση:',
    options: [
      'Μόνο στην παρατηρήσιμη συμπεριφορά',
      'Στις ασυνείδητες ψυχικές διεργασίες',
      'Μόνο στη μνήμη ως αποθήκευση bit πληροφορίας',
      'Μόνο στη γραμματική της γλώσσας',
    ],
    correctIndex: 1,
    explanation: 'Η ψυχανάλυση τονίζει ασυνείδητες διεργασίες και πρώιμες εμπειρίες που μπορεί να απωθηθούν.',
  },
  {
    id: 'q-psy-2',
    categoryId: 'psychoanalysis',
    type: 'tf',
    question:
      'Η ψυχανάλυση ως θεραπεία μπορεί να συνδέεται με ανάκληση πρώιμων εμπειριών και σύνδεσή τους με όνειρα/φαντασιώσεις.',
    options: ['Σωστό', 'Λάθος'],
    correctIndex: 0,
    explanation:
      'Στο υλικό περιγράφεται θεραπεία μέσω ανάκλησης πρώιμων εμπειριών και σύνδεσης με όνειρα και φαντασιώσεις.',
  },
  {
    id: 'q-beh-1',
    categoryId: 'behaviorism',
    type: 'mcq',
    question: 'Ο συμπεριφορισμός δίνει έμφαση:',
    options: [
      'Στην ενδοσκόπηση της συνείδησης',
      'Στη συστηματική μελέτη της παρατηρήσιμης συμπεριφοράς',
      'Μόνο στο ασυνείδητο',
      'Μόνο στην αυτοπραγμάτωση',
    ],
    correctIndex: 1,
    explanation: 'Ο συμπεριφορισμός εστιάζει στην παρατηρήσιμη συμπεριφορά και θεωρεί δύσκολη την άμεση παρατήρηση του νου.',
  },
  {
    id: 'q-beh-2',
    categoryId: 'behaviorism',
    type: 'tf',
    question: 'Το πείραμα «Little Albert» συνδέεται με τον Watson.',
    options: ['Σωστό', 'Λάθος'],
    correctIndex: 0,
    explanation: 'Στο υλικό αναφέρεται το Little Albert (Watson & Rayner, 1920).',
  },
  {
    id: 'q-beh-3',
    categoryId: 'behaviorism',
    type: 'mcq',
    question: 'Ποιος είναι γνωστός για την κλασική εξαρτημένη μάθηση με πειράματα σε σκύλους;',
    options: ['Skinner', 'Pavlov', 'Maslow', 'Wundt'],
    correctIndex: 1,
    explanation: 'Ο Ivan Pavlov συνδέεται με το πείραμα πέψης σκύλων και την κλασική εξαρτημένη μάθηση.',
  },
  {
    id: 'q-hum-1',
    categoryId: 'humanistic',
    type: 'mcq',
    question: 'Η ανθρωπιστική προσέγγιση δίνει έμφαση:',
    options: [
      'Στην τιμωρία ως κύριο εργαλείο',
      'Στο θετικό δυναμικό, την ανάπτυξη και την αξιοποίηση δυνατοτήτων',
      'Μόνο στο ασυνείδητο',
      'Μόνο στα αντανακλαστικά',
    ],
    correctIndex: 1,
    explanation: 'Η ανθρωπιστική ψυχολογία τονίζει υψηλότερες φιλοδοξίες, ανάπτυξη και θετικό δυναμικό.',
  },
  {
    id: 'q-hum-2',
    categoryId: 'humanistic',
    type: 'tf',
    question: 'Στην ανθρωπιστική παράδοση συχνά προτιμάται ο όρος «πελάτης» αντί «ασθενής».',
    options: ['Σωστό', 'Λάθος'],
    correctIndex: 0,
    explanation: 'Στο υλικό αναφέρεται ρητά «πελάτες αντί ασθενείς».',
  },
  {
    id: 'q-cog-1',
    categoryId: 'cognitive',
    type: 'mcq',
    question: 'Η γνωστική ψυχολογία περιλαμβάνει πειραματική διερεύνηση:',
    options: [
      'Μόνο κοινωνικών κανόνων',
      'Νοητικών διεργασιών όπως αντίληψη, προσοχή, μνήμη, σκέψη, γλώσσα, μάθηση',
      'Μόνο ορμονών',
      'Μόνο κληρονομικότητας χωρίς συμπεριφορά',
    ],
    correctIndex: 1,
    explanation: 'Η γνωστική ψυχολογία διερευνά νοητικές διεργασίες με πειραματικές μεθόδους.',
  },
  {
    id: 'q-cog-2',
    categoryId: 'cognitive',
    type: 'tf',
    question: 'Ο Chomsky χρησιμοποιείται ως παράδειγμα σύνδεσης γλώσσας με νοητικούς κανόνες.',
    options: ['Σωστό', 'Λάθος'],
    correctIndex: 0,
    explanation: 'Στο υλικό ο Chomsky συνδέεται με νοητικούς κανόνες γλώσσας (παραλληλισμός με υπολογιστικούς κανόνες).',
  },
  {
    id: 'q-ges-1',
    categoryId: 'gestalt',
    type: 'mcq',
    question: 'Η σχολή Gestalt υποστηρίζει ότι η συνειδητή εμπειρία:',
    options: [
      'Είναι απλώς άθροισμα ανεξάρτητων αισθήσεων χωρίς οργάνωση',
      'Κατανοείται καλύτερα ως σύνολο, όχι μόνο ως επιμέρους στοιχεία',
      'Δεν σχετίζεται με αντίληψη',
      'Βασίζεται μόνο στο ασυνείδητο',
    ],
    correctIndex: 1,
    explanation: 'Wertheimer, Koffka, Köhler: η εμπειρία ως σύνολο, όχι μόνο άθροισμα μερών.',
  },
  {
    id: 'q-ges-2',
    categoryId: 'gestalt',
    type: 'tf',
    question: 'Η Gestalt αποκαλείται και «μορφολογική σχολή» στο υλικό.',
    options: ['Σωστό', 'Λάθος'],
    correctIndex: 0,
    explanation: 'Στο υλικό εμφανίζεται ως «Μορφολογική σχολή / Σχολή Gestalt».',
  },
  {
    id: 'q-evo-1',
    categoryId: 'evolutionary',
    type: 'mcq',
    question: 'Η εξελικτική ψυχολογία συνδέει τη συμπεριφορά με:',
    options: [
      'Μόνο με τη μόδα της δεκαετίας',
      'Μακρά εξέλιξη μέσω φυσικής επιλογής και βιολογικές βάσεις',
      'Μόνο με τυχαία όνειρα',
      'Μόνο με το IQ ως μοναδικό κριτήριο',
    ],
    correctIndex: 1,
    explanation: 'Τονίζεται η βιολογία και η δαρβινική εξέλιξη μέσω φυσικής επιλογής.',
  },
  {
    id: 'q-evo-2',
    categoryId: 'evolutionary',
    type: 'tf',
    question: 'Η εξελικτική ψυχολογία μελετά αλλαγές συμπεριφοράς σε επίπεδο είδους κατά την εξέλιξη.',
    options: ['Σωστό', 'Λάθος'],
    correctIndex: 0,
    explanation: 'Στο υλικό αναφέρεται μελέτη αλλαγής συμπεριφοράς κατά την εξέλιξη του είδους.',
  },
  {
    id: 'q-mix-1',
    categoryId: 'history',
    type: 'mcq',
    question: 'Ποιο έτος αναφέρεται για την ίδρυση της American Psychological Association (APA);',
    options: ['1799', '1892', '1926', '2001'],
    correctIndex: 1,
    explanation: 'Στο υλικό: το 1892 επτά ψυχολόγοι ίδρυσαν την APA.',
  },
  {
    id: 'q-mix-2',
    categoryId: 'history',
    type: 'tf',
    question:
      'Στην Ελλάδα, η ψυχολογία διδάχθηκε για πρώτη φορά ως μάθημα το 1926 στο Πανεπιστήμιο Αθηνών.',
    options: ['Σωστό', 'Λάθος'],
    correctIndex: 0,
    explanation: 'Στο υλικό αναφέρεται το 1926 (Αθήνα) και ίδρυση πρώτου ψυχολογικού εργαστηρίου την ίδια χρονιά.',
  },
]

export const flashcards = [
  ...definitionFlashcards,
  ...philosopherFlashcards,
  ...wundtFlashcards,
  ...functionalismFlashcards,
  ...clinicalFlashcards,
  ...LEGACY_FLASHCARDS,
]

export const quizQuestions = [
  ...definitionQuizQuestions,
  ...philosophersQuizQuestions,
  ...wundtQuizQuestions,
  ...functionalismQuizQuestions,
  ...clinicalQuizQuestions,
  ...LEGACY_QUIZ_QUESTIONS,
]

export function getCategoryLabel(categoryId) {
  return CATEGORIES.find((c) => c.id === categoryId)?.label ?? categoryId
}
