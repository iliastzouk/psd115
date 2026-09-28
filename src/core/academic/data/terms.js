import { UNKNOWN } from '../schema.js'

/**
 * Ακαδημαϊκή σειρά = σειρά αυτού του πίνακα (από το παλιότερο στο νεότερο), ΟΧΙ αλφαβητική σειρά των IDs.
 * Το τρέχον term δηλώνεται ρητά με `current: true` (το πολύ ένα)· δεν υπολογίζεται από την ημερομηνία.
 * Πηγές: ενότητες «SPRING 2026» / «FALL 2026» στο campus (screenshots χρήστη). Ημερομηνίες μη επιβεβαιωμένες.
 */
export const terms = [
  { id: '2026S', label: 'Spring 2026', start: UNKNOWN, end: UNKNOWN, current: false },
  { id: '2026F', label: 'Fall 2026', start: UNKNOWN, end: UNKNOWN, current: true },
]
