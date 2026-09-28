/**
 * PSD115 — δομή περιεχομένου (Phase 1B): Course → Units → Topics.
 * `id` = το courseId του academic registry (src/core/academic/data/courses.js).
 * Τα topics κάθε unit ζουν στο units/<unitId>/ (Εβδ. 1: ένα αρχείο ανά θέμα· Εβδ. 2–4: topicsData.js).
 *
 * `route` και `deck` περιγράφουν ό,τι υπάρχει ΣΗΜΕΡΑ (διαδρομές /week/N, κλειδιά του pptDeckRegistry).
 * Δεν αλλάζουν στο 1B· το routing είναι θέμα του Phase 1C.
 */
export const course = {
  id: 'psd115',
  units: [
    { id: 'k1', order: 1, kind: 'lecture', label: 'Εβδομάδα 1', title: 'Η εξέλιξη μιας επιστήμης', route: '/week/1', deck: 'week1' },
    { id: 'k2', order: 2, kind: 'lecture', label: 'Εβδομάδα 2', title: 'Ερευνητικές μέθοδοι', route: '/week/2', deck: 'week2' },
    { id: 'k3', order: 3, kind: 'lecture', label: 'Εβδομάδα 3', title: 'Βιολογικές βάσεις της συμπεριφοράς', route: '/week/3', deck: 'week3' },
    { id: 'k4', order: 4, kind: 'lecture', label: 'Εβδομάδα 4', title: 'Αίσθηση & αντίληψη', route: '/week/4', deck: 'week4' },
  ],
  // Το υπάρχον περιεχόμενο γράφτηκε πριν από το σύστημα provenance: δεν ισχυριζόμαστε πηγή ή έλεγχο.
  provenance: { origin: 'legacy', reviewed: false },
}
