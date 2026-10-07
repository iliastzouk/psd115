/**
 * Legacy backend του ProgressService (Phase 1E-4b): τα υπάρχοντα κλειδιά `psd115-*`, ίδια μορφή.
 *
 * - read(): όλα τα κλειδιά προόδου (χωρίς backups), raw — η αποκωδικοποίηση γίνεται από τον codec του 1E-4a.
 * - write(changes): γράφει ΜΟΝΟ τα κλειδιά που άλλαξαν. Ένα κλειδί → μία εγγραφή· περισσότερα → συναλλαγή
 *   (progressTransaction: marker → write → verify → rollback), ώστε να μη μείνει μισή αλλαγή.
 * Άγνωστα `psd115-*` κλειδιά δεν γράφονται ποτέ από εδώ. Δεν χρησιμοποιεί το storage.js.
 */
import { readProgressEntries } from './progressBackup.js'
import { runTransaction } from './progressTransaction.js'

/** @param {Storage | undefined} storage */
export function createLegacyProgressBackend(storage) {
  return Object.freeze({
    read() {
      if (!storage) throw new Error('δεν υπάρχει διαθέσιμο localStorage')
      return readProgressEntries(storage)
    },
    /** @param {Record<string, string>} changes */
    write(changes) {
      const keys = Object.keys(changes)
      if (keys.length === 1) storage.setItem(keys[0], changes[keys[0]])
      else if (keys.length > 1) runTransaction(storage, { op: 'progress', targets: changes })
    },
  })
}
