/**
 * Ηχογραφήσεις διαλέξεων ανά εγγραφή (enrollment). ΜΟΝΟ links προς την πλατφόρμα του πανεπιστημίου
 * (Class Collaborate), που ζητούν σύνδεση με λογαριασμό EUC — τα ίδια τα βίντεο δεν φιλοξενούνται εδώ.
 * Η σειρά του πίνακα είναι η σειρά εμφάνισης. Τίτλοι όπως εμφανίζονται στο Collaborate.
 */
const collab = (id) => `https://eu-lti.bbcollab.com/collab/ui/session/playback/load/${id}`

export const recordings = [
  {
    id: 'psd215-s01-r1',
    enrollmentId: 'psd215@2026F',
    session: 'Επανάληψη 1ης Συνάντησης',
    part: 1,
    url: collab('9d6245ae38484bfca22f4a6134faa10d'),
  },
  {
    id: 'psd215-s01-r2',
    enrollmentId: 'psd215@2026F',
    session: 'Επανάληψη 1ης Συνάντησης',
    part: 2,
    url: collab('f9808d01afac4738a1eb640537189389'),
  },
  {
    id: 'psd215-s02-r1',
    enrollmentId: 'psd215@2026F',
    session: '2η Συνάντηση',
    part: 1,
    url: collab('839836cd5ca74527ba40cd803a9ae6cf'),
  },
  {
    id: 'psd215-s02-r2',
    enrollmentId: 'psd215@2026F',
    session: '2η Συνάντηση',
    part: 2,
    url: collab('d00f430a205040b6b5366eb4b43e8cd1'),
  },
]
