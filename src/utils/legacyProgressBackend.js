/**
 * Legacy backend του ProgressService (Phase 1E-4b): τα υπάρχοντα κλειδιά `psd115-*`, ίδια μορφή.
 *
 * - read(): όλα τα κλειδιά προόδου (χωρίς backups), raw — η αποκωδικοποίηση γίνεται από τον codec του 1E-4a.
 * - write(changes): γράφει ΜΟΝΟ τα κλειδιά που άλλαξαν. Ένα κλειδί → μία εγγραφή· περισσότερα → συναλλαγή
 *   (progressTransaction: marker → write → verify → rollback), ώστε να μη μείνει μισή αλλαγή.
 * - Όσο εκκρεμεί σημάδι συναλλαγής (`progress-txn-v1`, μετά από αποτυχημένο rollback), ΚΑΜΙΑ εγγραφή — ούτε ενός
 *   κλειδιού: η ανάκτηση της επόμενης εκκίνησης θα επανέφερε το «before» και θα έσβηνε την εγγραφή (1E-4c-2, review PR #11).
 *   `pending()` επιτρέπει στο service να περάσει σε degraded.
 * Άγνωστα `psd115-*` κλειδιά δεν γράφονται ποτέ από εδώ. Δεν χρησιμοποιεί το storage.js.
 */
import { readProgressEntries } from './progressBackup.js'
import { ProgressTransactionError, runTransaction, TXN_KEY } from './progressTransaction.js'

/** @param {Storage | undefined} storage */
export function createLegacyProgressBackend(storage) {
  return Object.freeze({
    read() {
      if (!storage) throw new Error('δεν υπάρχει διαθέσιμο localStorage')
      return readProgressEntries(storage)
    },
    /** Υπάρχει σημάδι μη ολοκληρωμένης συναλλαγής (η ανάκτηση γίνεται μόνο στην εκκίνηση). */
    pending() {
      return Boolean(storage) && storage.getItem(TXN_KEY) !== null
    },
    /** @param {Record<string, string>} changes */
    write(changes) {
      const keys = Object.keys(changes)
      if (keys.length && storage.getItem(TXN_KEY) !== null) {
        throw new ProgressTransactionError('Υπάρχει μη ολοκληρωμένη προηγούμενη αλλαγή (ανάκτηση στην επόμενη εκκίνηση)· δεν άλλαξε τίποτα', 'not-started')
      }
      if (keys.length === 1) storage.setItem(keys[0], changes[keys[0]])
      else if (keys.length > 1) runTransaction(storage, { op: 'progress', targets: changes })
    },
  })
}
