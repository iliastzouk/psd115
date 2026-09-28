import { UNKNOWN } from '../schema.js'

/**
 * Η σχέση του χρήστη με ένα μάθημα σε ένα term. Μόνο εγγραφές που ΞΕΡΟΥΜΕ ότι υπάρχουν.
 * - Δεν υπάρχουν εγγραφές για προηγούμενες προσπάθειες των PSD110/PSD125: δεν έχει επιβεβαιωθεί
 *   ούτε το term ούτε το αν έγινε προσπάθεια. Προστίθενται όταν επιβεβαιωθούν.
 * - Fall 2026: μαθήματα σε εξέλιξη («Open» στο campus) → grade null (δεν έχει εκδοθεί).
 * - PSD115 (Spring 2026): αποτέλεσμα μη επιβεβαιωμένο → status και grade "unknown".
 * Πηγές εξετάσεων/διδασκόντων: campus (screenshots χρήστη). «TBA» = unknown.
 */
const final = (date) => ({ kind: 'final', date, time: '18:00-20:30', scope: UNKNOWN })

export const enrollments = [
  {
    id: 'psd115@2026S',
    courseId: 'psd115',
    termId: '2026S',
    enrolledCode: 'PSD115',
    instructor: UNKNOWN,
    exams: UNKNOWN,
    status: UNKNOWN,
    grade: UNKNOWN,
  },
  {
    id: 'psd200@2026F',
    courseId: 'psd200',
    termId: '2026F',
    enrolledCode: 'PSD200',
    instructor: UNKNOWN,
    exams: [final('2027-01-20')],
    status: 'in-progress',
    grade: null,
  },
  {
    id: 'psd110@2026F',
    courseId: 'psd110',
    termId: '2026F',
    enrolledCode: 'PSD110',
    instructor: 'Evangelos Protopapadakis',
    exams: [final('2027-01-21')],
    status: 'in-progress',
    grade: null,
  },
  {
    id: 'psd215@2026F',
    courseId: 'psd215',
    termId: '2026F',
    enrolledCode: 'PSD215',
    instructor: UNKNOWN,
    exams: [final('2027-01-25')],
    status: 'in-progress',
    grade: null,
  },
  {
    id: 'psd210@2026F',
    courseId: 'psd210',
    termId: '2026F',
    enrolledCode: 'PSD210',
    instructor: UNKNOWN,
    exams: [final('2027-01-29')],
    status: 'in-progress',
    grade: null,
  },
  {
    id: 'psd125@2026F',
    courseId: 'psd125',
    termId: '2026F',
    // Εμφανίζεται ως PSD125/PSD124· ο κωδικός της εγγραφής του χρήστη δεν έχει επιβεβαιωθεί.
    enrolledCode: UNKNOWN,
    instructor: 'Antonis Katsouros',
    // Ο τίτλος στο campus κόβεται πριν από την ημερομηνία εξέτασης.
    exams: UNKNOWN,
    status: 'in-progress',
    grade: null,
  },
]
