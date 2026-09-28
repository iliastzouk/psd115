import { UNKNOWN } from '../schema.js'

/**
 * Κατάλογος μαθημάτων (τι είναι το μάθημα — ΟΧΙ η σχέση του χρήστη με αυτό· αυτή είναι στις enrollments).
 * Πηγές: τίτλοι/κωδικοί από το campus (screenshots χρήστη). curriculumSemester από δηλώσεις του χρήστη:
 * PSD200/210/215 = 3ο εξάμηνο, PSD110/PSD125 = 1ο εξάμηνο («χρωστούμενα»), PSD115 = 2ο εξάμηνο.
 * kind (υποχρεωτικό/επιλογής): ΔΕΝ έχει επιβεβαιωθεί για κανένα.
 * status = κατάσταση στον κατάλογο· όλα προσφέρθηκαν το 2026, άρα active.
 *
 * PSD125/PSD124: εμφανίζονται στο campus ως ΕΝΑ μάθημα με δύο κωδικούς → ένα course, PSD124 ως εναλλακτικός.
 * Δεν υπάρχει δεύτερο course psd124.
 */
export const courses = [
  { id: 'psd110', code: 'PSD110', title: 'Εισαγωγή στην Ηθική', curriculumSemester: 1, kind: UNKNOWN, status: 'active' },
  {
    id: 'psd125',
    code: 'PSD125',
    alternateCodes: ['PSD124'],
    title: 'Κοινωνική Ψυχολογία',
    curriculumSemester: 1,
    kind: UNKNOWN,
    status: 'active',
  },
  { id: 'psd115', code: 'PSD115', title: 'Ψυχολογία ΙΙ', curriculumSemester: 2, kind: UNKNOWN, status: 'active' },
  { id: 'psd200', code: 'PSD200', title: 'Αναπτυξιακή Ψυχολογία Ι', curriculumSemester: 3, kind: UNKNOWN, status: 'active' },
  { id: 'psd210', code: 'PSD210', title: 'Θεωρίες Προσωπικότητας', curriculumSemester: 3, kind: UNKNOWN, status: 'active' },
  { id: 'psd215', code: 'PSD215', title: 'Εκπαιδευτική Ψυχολογία', curriculumSemester: 3, kind: UNKNOWN, status: 'active' },
]
