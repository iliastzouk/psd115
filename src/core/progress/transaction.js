/**
 * Application-level «συναλλαγή» πάνω σε πολλά κλειδιά του localStorage (Phase 1E-1).
 *
 * ΔΕΝ είναι πραγματική ατομική συναλλαγή: το localStorage γράφει κάθε κλειδί χωριστά και ένα
 * κλείσιμο του tab ανάμεσα σε δύο εγγραφές μπορεί να αφήσει μισή αλλαγή. Αυτό που εγγυάται:
 *
 *   1. capture   — διαβάζει τις αρχικές raw τιμές όλων των κλειδιών που θα αλλάξουν
 *   2. marker    — γράφει ΠΡΩΤΑ ένα σημάδι (TXN_KEY) με before/after· αν αυτό αποτύχει, δεν αλλάζει τίποτα
 *   3. write     — γράφει/σβήνει κάθε κλειδί
 *   4. verify    — ξαναδιαβάζει κάθε κλειδί και το συγκρίνει με τον στόχο
 *   5. rollback  — σε οποιοδήποτε σφάλμα, επαναφέρει ΟΛΑ τα κλειδιά στις αρχικές τιμές και επαληθεύει
 *   6. clear     — σβήνει το σημάδι μόνο όταν η κατάσταση είναι επαληθευμένα «όλα after» ή «όλα before»
 *
 * Αν η σελίδα κλείσει στη μέση, το σημάδι μένει· στην επόμενη εκκίνηση το recoverInterrupted()
 * ολοκληρώνει (αν όλα είναι ήδη «after») ή επαναφέρει τα «before». Ποτέ δεν μένει αμφίβολη κατάσταση
 * χωρίς σημάδι.
 *
 * Όλες οι συναρτήσεις παίρνουν `storage` (getItem/setItem/removeItem) ώστε να ελέγχονται σε Node.
 */

/** Εκτός `psd115-*` (δεν μπαίνει σε export) και εκτός `study-progress-*` (δεν είναι πρόοδος). */
export const TXN_KEY = 'progress-txn-v1'
const TXN_VERSION = 1

export class ProgressTransactionError extends Error {
  /** @param {string} message @param {'not-started' | 'rolled-back' | 'rollback-incomplete'} outcome */
  constructor(message, outcome) {
    super(message)
    this.name = 'ProgressTransactionError'
    this.outcome = outcome
  }
}

function applyValue(storage, key, value) {
  if (value === null) storage.removeItem(key)
  else storage.setItem(key, value)
}

/** Επαναφέρει τις τιμές και επαληθεύει· επιστρέφει true αν όλα ταιριάζουν. */
function restore(storage, values) {
  for (const [key, value] of Object.entries(values)) {
    try {
      applyValue(storage, key, value)
    } catch {
      /* συνεχίζει με τα υπόλοιπα· η επαλήθευση θα το πιάσει */
    }
  }
  return Object.entries(values).every(([key, value]) => storage.getItem(key) === value)
}

/**
 * Γράφει τους στόχους με τα βήματα 1–6. `null` = διαγραφή κλειδιού.
 * @param {Storage} storage
 * @param {{ op: string, targets: Record<string, string | null>, now?: () => number }} txn
 * @returns {{ changed: string[] }}
 */
export function runTransaction(storage, { op, targets, now = () => Date.now() }) {
  const keys = Object.keys(targets)
  const before = Object.fromEntries(keys.map((key) => [key, storage.getItem(key)]))
  const changed = keys.filter((key) => before[key] !== targets[key])
  if (!changed.length) return { changed }

  const beforeChanged = Object.fromEntries(changed.map((key) => [key, before[key]]))
  const afterChanged = Object.fromEntries(changed.map((key) => [key, targets[key]]))
  const marker = { v: TXN_VERSION, op, startedAt: new Date(now()).toISOString(), before: beforeChanged, after: afterChanged }

  if (storage.getItem(TXN_KEY) !== null) {
    throw new ProgressTransactionError('Υπάρχει μη ολοκληρωμένη προηγούμενη αλλαγή· δεν άλλαξε τίποτα', 'not-started')
  }
  try {
    storage.setItem(TXN_KEY, JSON.stringify(marker))
  } catch {
    throw new ProgressTransactionError('Δεν ήταν δυνατή η έναρξη (χώρος αποθήκευσης)· δεν άλλαξε τίποτα', 'not-started')
  }

  try {
    for (const key of changed) applyValue(storage, key, afterChanged[key])
    const mismatch = changed.filter((key) => storage.getItem(key) !== afterChanged[key])
    if (mismatch.length) throw new Error(`επαλήθευση: ${mismatch.join(', ')}`)
  } catch {
    if (restore(storage, beforeChanged)) {
      clearMarker(storage)
      throw new ProgressTransactionError('Η αλλαγή απέτυχε και αναιρέθηκε· δεν άλλαξε τίποτα', 'rolled-back')
    }
    throw new ProgressTransactionError(
      'Η αλλαγή απέτυχε και η αναίρεση δεν ολοκληρώθηκε· θα επαναληφθεί στην επόμενη εκκίνηση',
      'rollback-incomplete',
    )
  }
  clearMarker(storage)
  return { changed }
}

function clearMarker(storage) {
  try {
    storage.removeItem(TXN_KEY)
  } catch {
    /* αν μείνει, το recoverInterrupted βλέπει «όλα after» και απλώς το σβήνει */
  }
}

/**
 * Στην εκκίνηση: αν έμεινε σημάδι από διακοπή, ολοκληρώνει ή επαναφέρει. Χωρίς σημάδι: μόνο ένα getItem.
 * @param {Storage} storage
 * @returns {{ status: 'none' | 'completed' | 'rolled-back' | 'failed' | 'corrupt-marker', op?: string }}
 */
export function recoverInterrupted(storage) {
  let raw
  try {
    raw = storage.getItem(TXN_KEY)
  } catch {
    return { status: 'none' }
  }
  if (raw === null) return { status: 'none' }

  let marker
  try {
    marker = JSON.parse(raw)
  } catch {
    return { status: 'corrupt-marker' }
  }
  const isMap = (v) => v && typeof v === 'object' && !Array.isArray(v)
  if (!isMap(marker) || marker.v !== TXN_VERSION || !isMap(marker.before) || !isMap(marker.after)) {
    // Δεν αγγίζουμε δεδομένα με βάση σημάδι που δεν καταλαβαίνουμε.
    return { status: 'corrupt-marker' }
  }

  const allAfter = Object.entries(marker.after).every(([key, value]) => storage.getItem(key) === value)
  if (allAfter) {
    clearMarker(storage)
    return { status: 'completed', op: marker.op }
  }
  if (restore(storage, marker.before)) {
    clearMarker(storage)
    return { status: 'rolled-back', op: marker.op }
  }
  return { status: 'failed', op: marker.op }
}
