/**
 * STUDY_CONTENT — περιεχόμενο μελέτης ανά `courseId + unitId` (Phase 1D· Φάση 6d-α: από τα manifests των μαθημάτων,
 * src/core/content/index.js — καμία ρητή καταχώριση εδώ).
 *
 * Δεν είναι ταυτότητα: οι units ορίζονται στο manifest του μαθήματος (ένα test ελέγχει ότι τα κλειδιά ταυτίζονται).
 * Συμβόλαιο ανά μάθημα (Φάση 5): flashcards, quizQuestions, categories, getCategoryLabel, units.
 * Κανένα θέμα, καμία διεύθυνση. Μάθημα χωρίς manifest = χωρίς υλικό μελέτης.
 */
export { STUDY_CONTENT } from '../content/index.js'
