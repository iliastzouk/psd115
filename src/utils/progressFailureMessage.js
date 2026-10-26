/**
 * Μήνυμα αποτυχίας reset/import ανά ΠΡΑΓΜΑΤΙΚΟ αποτέλεσμα (Φάση 1, D2). «Η πρόοδος δεν άλλαξε» λέγεται ΜΟΝΟ όταν
 * είναι επιβεβαιωμένο: αποτυχία backup, άρνηση πριν από κάθε εγγραφή (`not-started`, εκκρεμές σημάδι), επαληθευμένη
 * αναίρεση (`rolled-back`). Για `rollback-incomplete` και άγνωστα σφάλματα δεν υπόσχεται ούτε διατήρηση ούτε ανάκτηση.
 */
const NOUN = { reset: 'η επαναφορά', import: 'η εισαγωγή' }
const TITLE = { reset: 'Η επαναφορά', import: 'Η εισαγωγή' }

/**
 * @param {'reset' | 'import'} action
 * @param {unknown} error ό,τι πέταξε το resetProgressSafely / importWithBackup
 * @returns {string}
 */
export function describeProgressFailure(action, error) {
  const e = /** @type {{ name?: string, outcome?: string, reason?: string }} */ (error ?? {})
  if (e.name === 'BackupError') {
    return `Δεν δημιουργήθηκε επιβεβαιωμένο αντίγραφο ασφαλείας· ${NOUN[action]} ακυρώθηκε και η πρόοδος δεν άλλαξε.`
  }
  if (e.name === 'PendingTransactionError') {
    return e.reason === 'pending'
      ? 'Εκκρεμεί ανάκτηση· επαναφόρτωσε τη σελίδα πριν δοκιμάσεις ξανά.'
      : `Η κατάσταση αποθήκευσης δεν μπόρεσε να ελεγχθεί· ${NOUN[action]} ακυρώθηκε.`
  }
  if (e.outcome === 'rollback-incomplete') {
    return 'Η αλλαγή δεν ολοκληρώθηκε με ασφάλεια. Επαναφόρτωσε τη σελίδα για να επιχειρηθεί ανάκτηση.'
  }
  if (e.outcome === 'not-started' || e.outcome === 'rolled-back') {
    return action === 'import' ? 'Η εισαγωγή απέτυχε· η πρόοδος δεν άλλαξε.' : 'Η επαναφορά δεν ολοκληρώθηκε· η πρόοδος δεν άλλαξε.'
  }
  return `${TITLE[action]} απέτυχε. Επαναφόρτωσε τη σελίδα και έλεγξε την πρόοδό σου πριν δοκιμάσεις ξανά.`
}

/**
 * Ειδοποίηση αποτυχίας αποθήκευσης προόδου ΧΩΡΙΣ εκκρεμές σημάδι (Φάση 2). Η αλλαγή δεν εφαρμόστηκε και δεν θα
 * επαναληφθεί αυτόματα· ο χρήστης πρέπει να την επαναλάβει.
 * @param {'quota' | 'other'} kind
 */
export function describeWriteFailure(kind) {
  return kind === 'quota'
    ? 'Η τελευταία αλλαγή δεν αποθηκεύτηκε: ο χώρος αποθήκευσης του browser φαίνεται γεμάτος. Ελευθέρωσε χώρο και επανάλαβε την ενέργεια.'
    : 'Η τελευταία αλλαγή δεν αποθηκεύτηκε. Η μελέτη συνεχίζεται, αλλά η αλλαγή αυτή δεν θα επαναληφθεί αυτόματα. Επανέλαβέ την όταν η αποθήκευση λειτουργεί κανονικά.'
}
